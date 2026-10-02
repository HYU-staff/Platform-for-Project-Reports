/* =====================================================================
   7-b. 내용(안) 제시 : 빈 항목에 아이디어·가이드와 초안을 만들어 보여주고, 확인 후 적용
   - 뼈대(안): 규칙 기반, 오프라인 가능 — 작성방법·평가 주안점·과제/지표 데이터로 개조식 틀
   - 내용(안): Claude 작성 — 같은 재료 + 전년도 원문 발췌로 문장 초안 (수치는 입력값만 사용)
   ===================================================================== */
let SHOWDRAFT=true, BATCH=null;
const isEmptyField=v=>!(v&&String(v).trim());
function draftKeys(s){ return s.kind==="pp"?prof().ppFields.map(f=>f.k):["text"]; }
function emptyKeys(doc,s){ const d=secData(doc.id,s.id); return draftKeys(s).filter(k=>isEmptyField(d[k])&&!(k==="text"&&s.from.length&&draftFrom(s))); }
function draftTargets(){ const out=[]; prof().docs.forEach(doc=>visibleSecs(doc).forEach(s=>{ if((s.kind==="text"||s.kind==="pp")&&emptyKeys(doc,s).length)out.push({doc,s}); })); return out; }
const shortG=g=>String(g).replace(/^\s*[\d)·ㆍ\-※*◦○▪•]+\s*/,"").replace(/\s*\(.*?\)\s*$/,"").replace(/(을|를)?\s*(기술|작성|제시)(하되.*|함|할 것)?\.?$/,"").trim().slice(0,46);
function relTasks(s){ return s.group?tasksBy(s.group):[]; }
function relKpis(s){ const nos=new Set(relTasks(s).map(t=>String(t.no))); return dat().kpi.filter(k=>String(k.links||"").split(/[,\s]+/).some(x=>nos.has(x))); }
function ideasFor(doc,s){ const pr=prof(), area=pr.evalAreas.find(a=>a.id===s.evalArea); const I=[];
  (s.guide||[]).filter(g=>!/^증빙/.test(g)).slice(0,4).forEach(g=>I.push("작성방법 반영: "+shortG(g)));
  if(area)(area.focus||[]).slice(0,3).forEach(f=>I.push(`평가 주안점(${area.name}): ${f}`));
  if(s.kind==="pp"){ I.push(`${pr.years.prev} 성과는 ‘무엇을 바꿨나(제도) → 얼마나(수혜 인원·비율) → 무엇이 달라졌나(결과)’ 순서로`); I.push(`${pr.years.cur} 계획은 일정·방법·예산·근거 규정을 함께 적어 실현 가능성을 보이기`); }
  if(relTasks(s).length)I.push(`연결된 ${pr.modules.tasks.label} ${relTasks(s).length}개의 목표·실적을 소제목으로 사용`);
  if(relKpis(s).length)I.push(`연계 지표: ${relKpis(s).map(k=>k.name).join(", ")} — 달성도 수치를 성과 근거로 인용`);
  if(doc.type==="plan"&&s.from.length)I.push("보고서의 해당 항목과 평가의견을 반영했다는 점을 첫 문단에 명시");
  return I.slice(0,8); }
function ruleDraft(doc,s){ const pr=prof(), y=pr.years, ts=relTasks(s), ks=relKpis(s); const g=(s.guide||[]).filter(x=>!/^증빙/.test(x)).map(shortG).filter(Boolean);
  const F={}; const need=[];
  if(s.kind==="text"){ const src=s.from.length?draftFrom(s):""; F.text=(src?src+"\n\n":"")+(g.length?g:[s.title]).map(x=>`□ ${x}\n ㅇ [핵심 내용 1줄 요약]\n  - [세부 내용 · 수치 · 근거]`).join("\n")+(ts.length?`\n□ 관련 ${pr.modules.tasks.label}\n`+ts.map(t=>` ㅇ ${t.name}: ${t.goal||"[목표]"}`).join("\n"):""); need.push("현황 수치(기준연도 대비 변화)","관련 계획서·규정 명칭"); }
  else {
    F.f1=(ts.length?ts.map(t=>`□ ${t.name}\n ㅇ (추진 내용) ${t.goal||"[무엇을 도입·개편했는지]"}\n ㅇ (성과) ${t.result||"[정량 성과: 수혜 인원 OO명, 운영 OO개, 비율 OO%]"}`).join("\n"):g.filter(x=>!/계획/.test(x)).slice(0,3).map(x=>`□ ${x}\n ㅇ [${y.prev} 추진 내용]\n ㅇ [정량 성과: OO명 / OO% / OO건]`).join("\n")||`□ ${s.title}\n ㅇ [${y.prev} 추진 내용과 정량 성과]`)+(ks.length?"\n ※ 연계 지표: "+ks.map(k=>`${k.name} ${k.act!==""&&k.act!=null?f1(n(k.act))+k.unit+" (목표 "+f1(n(k.t1))+k.unit+")":"[실적 입력]"}`).join(", "):"");
    F.f2=(ts.length?ts.map(t=>`□ ${t.name}\n ㅇ ${t.next||"[추진 내용]"}\n  - (일정) [분기·월] / (방법) [운영 방식] / (예산) [OO백만원]`).join("\n"):`□ ${s.title} ${y.cur} 추진계획\n ㅇ [추진 내용]\n  - (일정) [분기·월] / (방법) [운영 방식] / (예산) [OO백만원]`);
    F.f3=(ts.length?ts.map(t=>` ㅇ ${t.name}: ${t.next2||"[확산·고도화 계획]"}`).join("\n"):` ㅇ [${y.next} 확산·고도화 계획]`);
    F.basis="[관련 학칙·규정 조항, 결재문서명(일자)]";
    need.push(`${y.prev} 정량 실적(인원·비율·건수)`,"계획의 근거 규정·결재문서", `${y.cur} 예산 규모`); }
  return {by:"rule",at:Date.now(),ideas:ideasFor(doc,s),fields:F,check:need}; }
function draftContext(doc,s){ const pr=prof(), D=dat(); const area=pr.evalAreas.find(a=>a.id===s.evalArea);
  const ts=relTasks(s), ks=relKpis(s); const kw=new RegExp((s.title+" "+ts.map(t=>t.name).join(" ")).split(/[\s,()·]+/).filter(w=>w.length>=2).slice(0,10).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"")).join("|")||"과제");
  const prior=SOURCES.filter(x=>x.role==="prior"&&x.text).map(x=>"### "+x.name+"\n"+pickLines(x.text,Math.floor(9000/Math.max(1,SOURCES.filter(z=>z.role==="prior").length)),kw)).join("\n");
  const other=s.from.map(r=>{const x=secRef(r);if(!x)return "";const d=secData(x.doc.id,x.sec.id);return `[${x.sec.no} ${x.sec.title}] `+["text","f1","f2","f3"].map(k=>d[k]).filter(Boolean).join(" / ")}).filter(Boolean).join("\n");
  return {area,ts,ks,prior,other}; }
function draftPrompt(doc,s){ const pr=prof(), D=dat(), y=pr.years; const c=draftContext(doc,s); const keys=draftKeys(s);
  const fieldSpec=s.kind==="pp"?pr.ppFields.map(f=>`"${f.k}": "${f.l}"`).join(", "):`"text": "본문"`;
  return `너는 ${pr.programName||"정부 재정지원사업"} 보고서 작성을 돕는 컨설턴트다. 아래 항목의 '내용(안)'을 한국 공문서 개조식(□ / ㅇ / - 위계)으로 써라. JSON 하나만 답하라.

[문서] ${doc.name} (${doc.type==="report"?"평가·실적 보고서":"사업계획서"})
[기관] ${D.meta.org||"○○기관"} ${D.meta.variant||""}
[항목] ${s.no} ${s.title}
[작성방법] ${(s.guide||[]).join(" / ")||"(없음)"}
[평가영역] ${c.area?`${c.area.name}(${c.area.pts}) — ${c.area.desc} / 주안점: ${(c.area.focus||[]).join(", ")}`:"(미지정)"}
[연도 표기] 전년도 ${y.prev}, 금년도 ${y.cur}, 차년도 ${y.next}
[관련 과제] ${c.ts.map(t=>`${t.name} | 목표: ${t.goal} | 실적: ${t.result||"미입력"} | ${y.cur} 계획: ${t.next||"미입력"}`).join("\n")||"(없음)"}
[관련 지표] ${c.ks.map(k=>`${k.name}: 기준 ${k.base}, 목표 ${k.t1}, 실적 ${k.act===""?"미입력":k.act}${k.unit}`).join("\n")||"(없음)"}
[연결 항목 내용] ${c.other||"(없음)"}
[이미 쓴 내용] ${keys.map(k=>secData(doc.id,s.id)[k]).filter(Boolean).join(" / ")||"(없음)"}
[전년도 문서 발췌] ${c.prior||"(없음)"}

규칙:
- 위 자료에 있는 사실·수치만 쓴다. 모르는 수치는 [OO명], [OO%], [확인 필요]처럼 빈칸으로 남긴다. 기관명·사업명·규정명을 지어내지 않는다.
- 평가 주안점(체계 구축, 양적 규모, 도전성, 실현 가능성 근거)이 드러나게 쓴다. 각 칸 6~14줄.
- 출력 형식: {"ideas":["작성 아이디어 3~5개(한 줄씩)"],"fields":{${fieldSpec}},"check":["작성자가 채워야 할 자료·수치 2~5개"]}`; }
async function aiDraft(doc,s,signal){ const sm=await getSample(); if(!sm)throw {code:"no_sample",message:"이 보기에서는 Claude 내용(안)을 쓸 수 없습니다"};
  const x=await sm.json(draftPrompt(doc,s),{modelTier:"default",signal}); const keys=draftKeys(s); const F={};
  keys.forEach(k=>{ const v=x&&x.fields&&x.fields[k]; if(typeof v==="string"&&v.trim())F[k]=v.trim(); });
  if(!Object.keys(F).length)throw {code:"invalid_json",message:"내용(안)을 받지 못했습니다"};
  return {by:"claude",at:Date.now(),ideas:Array.isArray(x.ideas)?x.ideas.map(String).slice(0,6):[],fields:F,check:Array.isArray(x.check)?x.check.map(String).slice(0,6):[]}; }
function applyDraft(doc,s,mode){ const d=secData(doc.id,s.id); const dr=d.draft; if(!dr)return 0; let c=0; Object.entries(dr.fields||{}).forEach(([k,v])=>{ if(mode==="all"||isEmptyField(d[k])){ d[k]=v; c++; } }); if(c)d.draftApplied=Date.now(); return c; }
function draftBoxHTML(doc,s){ const d=secData(doc.id,s.id), dr=d.draft, pr=prof(); const empt=emptyKeys(doc,s);
  const lab=k=>k==="text"?"본문":(pr.ppFields.find(f=>f.k===k)||{l:k}).l.split("(")[0].split("→")[0].trim();
  return `<div class="draftbox"><div class="row"><b>내용(안) 제시</b><span class="small muted">${empt.length?`빈 칸 ${empt.length}개`:"모든 칸이 채워져 있음"} · 초안을 만들어 보여주고, 확인 후 적용합니다</span><span style="flex:1"></span><button class="btn sm" data-act="ruleDraft" data-ddoc="${esc(doc.id)}" data-dsec="${esc(s.id)}">뼈대(안) 만들기</button><button class="btn sm pri" data-act="aiDraftOne" data-ddoc="${esc(doc.id)}" data-dsec="${esc(s.id)}">Claude로 내용(안) 작성</button></div>
  ${!dr?`<ul class="ideas">${ideasFor(doc,s).map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`:`<div class="small muted" style="margin-top:6px">${dr.by==="claude"?"Claude가 작성한 내용(안)":"규칙 기반 뼈대(안)"} · ${new Date(dr.at).toLocaleString("ko-KR")}</div>
    ${dr.ideas&&dr.ideas.length?`<p class="small" style="margin:8px 0 2px"><b>작성 아이디어</b></p><ul class="ideas">${dr.ideas.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`:""}
    ${Object.entries(dr.fields).map(([k,v])=>`<p class="small" style="margin:8px 0 2px"><b>${esc(lab(k))}</b> ${isEmptyField(d[k])?pill("warn","빈 칸"):pill("n","작성됨")}</p><div class="draftpre">${esc(v)}</div>`).join("")}
    ${dr.check&&dr.check.length?`<p class="small" style="margin:8px 0 2px"><b>채워야 할 자료</b></p><ul class="ideas">${dr.check.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`:""}
    <div class="row" style="margin-top:8px"><button class="btn pri sm" data-act="applyDraft" data-mode="empty" data-ddoc="${esc(doc.id)}" data-dsec="${esc(s.id)}">빈 칸에 적용</button><button class="btn sm" data-act="applyDraft" data-mode="all" data-ddoc="${esc(doc.id)}" data-dsec="${esc(s.id)}">모두 덮어쓰기</button><button class="btn ghost sm" data-act="dropDraft" data-ddoc="${esc(doc.id)}" data-dsec="${esc(s.id)}">버리기</button></div>`}</div>`; }
function batchBoxHTML(){ const T=draftTargets(); const withD=T.filter(x=>secData(x.doc.id,x.s.id).draft).length;
  return `<div class="draftbox" style="margin-bottom:14px"><div class="row"><b>빈 항목 내용(안) 일괄 작성</b><span class="small muted">내용이 없는 항목 ${T.length}개 · 내용(안) 준비 ${withD}개</span><span style="flex:1"></span>${BATCH?`<span class="busy">${esc(BATCH.msg)}</span><button class="btn sm" data-act="batchStop">멈추기</button>`:`<button class="btn sm" data-act="batchRule" ${T.length?"":"disabled"}>뼈대(안) 일괄</button><button class="btn sm pri" data-act="batchAI" ${T.length?"":"disabled"}>Claude로 일괄 작성</button><button class="btn sm" data-act="batchApply" ${withD?"":"disabled"}>준비된 내용(안)을 빈 칸에 적용</button>`}</div>
  <label class="row small" style="margin-top:6px"><input type="checkbox" id="showDraft" ${SHOWDRAFT?"checked":""}> 미리보기에서 빈 칸에 내용(안) 표시 (노란 배경, 제출 전 확인 필요)</label></div>`; }
