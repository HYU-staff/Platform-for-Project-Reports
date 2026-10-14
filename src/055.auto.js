/* =====================================================================
   7-c. 자동 채우기 : 올린 파일만으로 구조 → 공통 데이터 → 항목별 전년도 원문까지
   - Claude 없이(로컬 파일로 열어도) 동작하는 규칙 처리. Claude가 있으면 그 위에 정밀 분석을 더할 수 있음
   - 이미 입력된 값은 덮어쓰지 않음(빈 곳만 채움)
   ===================================================================== */
const CIRC="①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";
let AUTO_NEW=false;
const numOf=s=>{ const v=parseFloat(String(s).replace(/,/g,"")); return isNaN(v)?"":v; };
const noParen=s=>String(s||"").replace(/\([^)]*\)?/g," ").replace(/\[[^\]]*\]/g," ");
// 파일이 보고서인지 계획서인지
function srcType(s){ const nm=s.name||""; if(/보고서|평가|실적|결과/.test(nm))return "report"; if(/계획/.test(nm))return "plan"; const t=(s.text||"").slice(0,1500); return /보고서/.test(t)?"report":/계획서/.test(t)?"plan":"report"; }
// 내장 템플릿과 같은 사업인지 (파일 이름·표지에 사업명이 있으면)
function matchTemplate(srcs){ let best=null;
  Object.values(TEMPLATES).forEach(t=>{ const core=norm(noParen(t.programName)); if(core.length<4)return;
    const hit=srcs.filter(s=>norm((s.name||"")+" "+(s.text||"").slice(0,2500)).includes(core)).length; if(hit&&(!best||hit>best.hit))best={t,hit}; });
  return best&&best.t; }
function tocEndOf(L){ let e=-1; const lim=Math.min(L.length,Math.max(300,Math.floor(L.length*0.25))); for(let i=0;i<lim;i++)if(TOC_RE.test(L[i]))e=i; return e; }
const stripNo=l=>String(l).replace(/^\s*(?:(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+|I{1,3}|IV|V|VI{0,3})(?:-\d+)?\.?|\d+(?:\.\d+)*\.?|\d+\)|[가-하]\.|\[[^\]]{1,6}\])\s*/,"").trim();
// 본문에서 항목 제목 줄 찾기 (목차 다음부터, 첫 번째로 충분히 닮은 줄)
function locate(L,start,title,from){ const key=norm(noParen(title)); if(key.length<2)return -1; let best=-1,bs=0; const sub=/[:：]/.test(title)?norm(noParen(title.split(/[:：]/).pop())):"";
  for(let i=Math.max(start,from||0);i<L.length;i++){ const l=L[i]; if(!l||l.length>110||TOC_RE.test(l))continue; const a=norm(noParen(stripNo(l))); if(a.length<2||a.length>key.length*1.8+8)continue;
    let sc=a===key?1:jacc(a,key); if(sub.length>=4&&/[:：]/.test(l)&&a.endsWith(sub))sc=Math.max(sc,0.85); if(sc>=0.8)return i; if(sc>bs){bs=sc;best=i;} }
  return bs>=0.55?best:-1; }
const CHAPTER_RE=/^\s*(?:[ⅠⅡⅢⅣⅤⅥ]+|I{1,3}|IV|V)(?:-\d+)?\.\s*\S/;
function cleanBody(lines,freq){ const kept=lines.filter(l=>{ const t=l.trim(); if(!t)return true; if(/^\d{1,3}$/.test(t))return false; const k=norm(t); if(k.length<40&&(freq[k]||0)>=3)return false; return true; }).map(l=>l.replace(/ᆞ\s*∙\s*|∙\s*/g,"ㅇ ").replace(/\s+$/,""));
  const out=[]; kept.forEach(l=>{ const t=l.trim(), prev=out.length?out[out.length-1]:""; if(t&&prev.length>38&&!/[.:)다음함임됨]$/.test(prev.trim())&&!/^(ㅇ|-|□|○|※|\*|[①-⑮]|\d+[.)]|\(|\[|<|【|’|')/.test(t))out[out.length-1]=prev+" "+t; else out.push(l); });
  return out.join("\n").replace(/\n{3,}/g,"\n\n").trim(); }
function lineFreq(L){ const f={}; L.forEach(l=>{ const k=norm(l); if(k&&k.length<40)f[k]=(f[k]||0)+1; }); return f; }

/* ── 1. 구조 ── */
function autoStructure(srcs){ const pr=prof(); if(pr.docs&&pr.docs.length)return "";
  const t=matchTemplate(srcs);
  if(t){ const keep={name:P.name}; P.profile=clone(t); ensureData(P.profile,dat()); if(!P.name||/새 (재정지원)?사업/.test(P.name))P.name=t.programName; return `내장 템플릿 ‘${t.programName}’과 같은 사업이라 그 구조(평가영역·집행기준·문서 목차·매칭)를 적용했습니다`; }
  const base={key:"custom",programName:pr.programName,orgLabel:pr.orgLabel,years:pr.years,variantLabel:pr.variantLabel,variants:pr.variants};
  const np=ruleBasedProfile(srcs,base); if(!np.programName)np.programName=pr.programName;
  np.docs.forEach(d=>{ const nm=d.name.replace(/[_\s]+\d{3,4}(\s*\d{1,2}\s*시)?(\s*\d{1,2}\s*분)?$/,"").replace(/[_]+/g," ").trim(); if(nm){ if(d.cover&&d.cover[0]===d.name)d.cover[0]=nm; d.name=nm; } });
  P.profile=np; ensureData(np,dat());
  const viaPrior=!srcs.some(s=>s.role==="form")&&srcs.some(s=>s.role==="prior");
  return `${viaPrior?"작성 서식이 없어 전년도 제출 문서의 목차로 ":""}문서 ${np.docs.length}종 · 평가영역 ${np.evalAreas.length}개 · 집행기준 ${np.rules.length}개 구조를 만들었습니다`; }

/* ── 2. 전년도 문서 → 공통 데이터 (규칙) ── */
function groupFor(no,title){ const gs=taskGroups(); let best=null,bl=0;
  if(no)gs.forEach(g=>{ const sec=String(g.sec||"").replace(/\.$/,""); if(!sec)return; if((no===sec||no.startsWith(sec+"."))&&sec.length>bl){best=g;bl=sec.length;} });
  if(best)return best.area; let bs=0; gs.forEach(g=>{ const sc=overlap(title,g.area); if(sc>bs){bs=sc;best=g;} }); return bs>=0.5?best.area:""; }
function tasksFrom(s){ const L=s.text.split("\n"); const st=tocEndOf(L)+1; const fq=lineFreq(L); const TRE=/^\s*(?:\d{1,2}\s+|[가-하]\.\s*)?과제\s*(\d{1,2})\s*[:：]\s*(.{2,90})$/; let head={no:"",title:""}; const out=[];
  for(let i=st;i<L.length;i++){ const l=L[i].trim(); if(!l)continue;
    let h=l.match(/^(\d{1,2}(?:\.\d{1,2})+)\.?\s+(\S.{1,50})$/)||l.match(/^(\d{1,2})\.\s+(\S.{1,60})$/); if(h&&!/과제\s*\d/.test(l)&&/[가-힣]{2}/.test(h[2])&&(fq[norm(l)]||0)<3){ head={no:h[1],title:h[2].replace(/\s*증빙.*$/,"").trim()}; continue; }
    h=l.match(/세부\s*내용\s*\d*\s*[:：]\s*(.{2,40})$/); if(h){ head={no:"",title:h[1]}; continue; }
    const m=l.match(TRE); if(!m||out.find(x=>x.no===m[1]))continue;
    let goal=""; for(let j=i+1;j<Math.min(L.length,i+16);j++){ const g=L[j].match(/\((?:운영\s*)?목표\)\s*(.+)/); if(g){ goal=g[1].trim(); for(let k=j+1;k<j+4&&k<L.length;k++){ const c=L[k].trim(); if(!c||/^(ᆞ|∙|•|-|□|ㅇ|○|※)/.test(c)||/증빙|^\(/.test(c))break; goal+=" "+c; } break; } if(TRE.test(L[j].trim()))break; }
    out.push({no:m[1],name:m[2].replace(/\s*\([A-Za-z][A-Za-z\s]*\)\s*$/,"").trim(),goal:goal.slice(0,220),group:groupFor(head.no,head.title),head:head.title.trim(),headNo:head.no,src:s.name}); }
  return out.sort((a,b)=>+a.no-+b.no); }
function kpiFrom(s){ const L=s.text.split("\n"); const RE=new RegExp("^\\s*["+CIRC+"]\\s*[\\(\\[]\\s*(신규|기존|수정)\\s*[\\)\\]]\\s*(.+)$"); const out=[];
  L.forEach((l,i)=>{ const m=l.match(RE); if(!m)return; const tk=m[2].trim().split(/\s+/); const nums=[]; while(tk.length&&/^-?[\d,]+(\.\d+)?%?$/.test(tk[tk.length-1])&&nums.length<4)nums.unshift(tk.pop().replace(/%$/,"")); if(nums.length<4)return;
    let unit=""; if(tk.length&&/^(%|N\/A|점|명|건|개|회|원|시간|배|\(%\))$/i.test(tk[tk.length-1]))unit=tk.pop().replace(/[()]/g,""); if(unit==="N/A")unit="";
    const name=tk.join(" ").replace(/\s*증빙.*$/,"").trim(); if(name.length<2)return;
    out.push({name,st:m[1],unit,base:numOf(nums[0]),t1:numOf(nums[1]),t2:numOf(nums[2]),t3:numOf(nums[3]),src:s.name,line:i+1}); });
  return out; }
function budgetFrom(s,items){ const L=s.text.split("\n"); const b={}; let total=null, at=-1;
  for(let i=0;i<L.length;i++){ const m=L[i].match(new RegExp("^\\s*["+CIRC+"]?\\s*(.+?)\\s+([\\d,]+(?:\\.\\d+)?)\\s+([\\d.]+)\\s*%?\\s*$")); if(!m)continue;
    const circ=CIRC.includes(L[i].trim()[0]); const nm=m[1].trim(); let key=items.find(k=>norm(k)===norm(nm)); if(!key&&at>=0&&circ&&nm.length>=2&&nm.length<40&&!/합\s*계|총\s*계/.test(nm))key=nm; if(key&&b[key]==null){ b[key]=numOf(m[2]); if(at<0)at=i; continue; }
    if(at>=0&&/^합\s*계$|^총\s*계$/.test(m[1].trim())){ total=numOf(m[2]); break; } if(at>=0&&i-at>12)break; }
  return {b,total,src:s.name}; }
function govFrom(s){ const L=s.text.split("\n"); let st=L.findIndex(l=>/연번\s*구분\s*주요\s*기능/.test(l)); if(st<0)return []; const blocks=[]; let cur=null;
  for(let i=st+1;i<Math.min(L.length,st+160);i++){ const l=L[i].trim(); if(!l){ if(cur&&blocks.length>=2)break; continue; } if(CHAPTER_RE.test(l)||/^\d+\.\d+\s/.test(l))break;
    if(CIRC.includes(l[0])){ cur=[l.slice(1).trim()]; blocks.push(cur); } else if(cur)cur.push(l); }
  return blocks.map(bl=>{ const S=bl.join(" ").replace(/\s+/g," "); const fi=S.search(/ᆞ|∙|•/); const name=(fi>=0?S.slice(0,fi):S).trim(); let R=fi>=0?S.slice(fi):"";
    const mi=R.search(/(위원장|센터장|단장|본부장|팀장)/); const funcs=(mi>=0?R.slice(0,mi):R).split(/ᆞ∙|ᆞ|∙|•/).map(x=>x.trim()).filter(Boolean); let tail=mi>=0?R.slice(mi):"";
    const cm=tail.match(/(\d+\s*회|상시|수시|-)\s+(\d+\s*회|상시|수시|-)/); const members=(cm?tail.slice(0,cm.index):tail).replace(/\s+\d+[~\-]?\d*p\s*$/,"").trim();
    return {name,func:funcs.join(", ").slice(0,160),members:members.slice(0,160),y1:cm?cm[1]:"",y2:cm?cm[2]:"",out:""}; }).filter(g=>g.name&&g.name.length<40); }
function rulePrior(srcs){ const pr=prof(); const priors=srcs.filter(s=>s.role==="prior"&&s.text); const reps=priors.filter(s=>srcType(s)==="report"), plans=priors.filter(s=>srcType(s)==="plan"); const order=reps.concat(plans);
  const X={meta:{},tasks:[],kpi:[],b1:{},gov:[],findings:[],counts:{}};
  for(const s of order){ const head=s.text.split("\n").slice(0,40);
    if(!X.meta.org){ const o=head.map(l=>l.trim()).find(l=>/^[가-힣]{2,15}(대학교|대학|기관|센터|재단)(\s+[A-Za-z가-힣]{2,12})?$/.test(l)&&!/사업|계획|보고/.test(l)); if(o)X.meta.org=o; }
    if(!X.meta.variant)(pr.variants||[]).forEach(v=>{ if(!X.meta.variant&&head.some(l=>norm(l)===norm(v)))X.meta.variant=v; }); }
  // 과제 세부영역은 권역 등 구분에 따라 달라지므로 먼저 정함
  const D0=dat(); if(X.meta.variant&&!D0._variantSet){ D0.meta.variant=X.meta.variant; D0._variantSet=1; X.variantApplied=1; } else if(!D0.meta.variant&&(pr.variants||[]).length)D0.meta.variant=pr.variants[0];
  // 과제: 보고서 우선, 계획서는 표기 대조·목표 보충
  const rt=reps.length?tasksFrom(reps[0]):[], pt=plans.length?tasksFrom(plans[0]):[]; const base=rt.length?rt:pt;
  X.taskHeads=base.map(t=>({area:t.head,sec:t.headNo})); X.tasks=base.map(t=>{ const p=pt.find(x=>x.no===t.no); return {group:t.group||(p&&p.group)||"",no:t.no,name:t.name,planName:p?p.name:"",goal:t.goal||(p&&p.goal)||"",result:"",status:"",fb:"",next:"",next2:"",p1:"",p2:"",p3:"",chg:"유지",chgNote:"",oldName:""}; });
  if(rt.length&&pt.length)rt.forEach(t=>{ const p=pt.find(x=>x.no===t.no); if(p&&norm(p.name)!==norm(t.name))X.findings.push({lv:"warn",area:pr.modules.tasks.label||"과제",msg:`과제${t.no} 이름이 문서마다 다릅니다: 보고서 ‘${t.name}’ / 계획서 ‘${p.name}’`,src:`${rt[0].src} · ${pt[0].src}`,fix:"올해 문서에서는 한 가지 표기로 통일"}); });
  // 지표: 첫 표를 기준으로, 다른 표·문서의 값과 대조
  const allK=[]; order.forEach(s=>kpiFrom(s).forEach(k=>allK.push(k)));
  allK.forEach(k=>{ const ex=X.kpi.find(x=>norm(x.name)===norm(k.name)); if(!ex){ X.kpi.push(k); return; }
    const a=[ex.base,ex.t1,ex.t2,ex.t3].join(" / "), b=[k.base,k.t1,k.t2,k.t3].join(" / "); if(a!==b&&!X.findings.find(f=>f.msg.includes(k.name)&&f.msg.includes(b)))X.findings.push({lv:"bad",area:pr.modules.kpi.label||"성과지표",msg:`‘${k.name}’ 기준값·목푯값이 표마다 다릅니다: ${a} ↔ ${b} (기준/1차/2차/3차)`,src:`${ex.src} ${ex.line}행 ↔ ${k.src} ${k.line}행`,fix:"확정값 하나로 통일하고 변경 사유가 있으면 명시"}); });
  // 비목 예산
  const items=pr.budgetItems||[]; if(items.length)for(const s of order){ const r=budgetFrom(s,items); if(Object.keys(r.b).length>=Math.min(3,items.length)){ X.b1=r.b; X.total=r.total; const sum=Object.values(r.b).reduce((a,v)=>a+n(v),0); if(r.total!=null&&Math.abs(sum-r.total)>0.5)X.findings.push({lv:"bad",area:"재정",msg:`비목 예산 합(${won(sum)})과 표의 합계(${won(r.total)})가 다릅니다`,src:r.src,fix:"비목별 금액을 다시 확인"}); break; } }
  // 거버넌스
  for(const s of order){ const g=govFrom(s); if(g.length){ X.gov=g; break; } }
  X.counts={tasks:X.tasks.length,kpi:X.kpi.length,b1:Object.keys(X.b1).length,gov:X.gov.length}; X.srcNames=priors.map(s=>s.name);
  return X; }
function applyPriorEmpty(X){ const D=dat(), pr=prof(); const done=[];
  if(X.meta.org&&!D.meta.org){ D.meta.org=X.meta.org; done.push("기관명"); }
  if(X.variantApplied)done.push(`${pr.variantLabel||"구분"}(${X.meta.variant})`);
  if(X.tasks.length&&!D.tasks.length){
    if(!taskGroups().length&&X.taskHeads){ const gs=[]; X.taskHeads.forEach(h=>{ if(!h.area)return; const g=gs.find(x=>x.area===h.area); if(g)g.n++; else gs.push({area:h.area,sec:h.sec||"",n:1,variant:""}); });
      if(gs.length){ pr.modules.tasks.on=true; pr.modules.tasks.groups=gs; X.tasks.forEach((t,i)=>{ if(!t.group)t.group=X.taskHeads[i].area||""; });
        pr.docs.forEach(d=>d.sections.forEach(sc=>{ if(sc.kind==="head"||sc.kind==="auto")return; const g=gs.find(x=>(x.sec&&sc.no&&String(sc.no).replace(/^[ⅠⅡⅢⅣⅤ]+-/,"")===x.sec)||jacc(norm(sc.title),norm(x.area))>=0.7); if(g&&!sc.group)sc.group=g.area; }));
        done.push(`과제 세부영역 ${gs.length}개(문서 소제목 기준)`); } }
    D.tasks=X.tasks; done.push(`${pr.modules.tasks.label} ${X.tasks.length}개`); }
  if(X.kpi.length&&!D.kpi.length){ D.kpi=X.kpi.map(k=>({name:k.name,st:k.st,unit:k.unit,base:k.base,t1:k.t1,t2:k.t2,t3:k.t3,act:"",formula:"",why:"",links:"",src:{base:k.base,t1:k.t1,t2:k.t2,t3:k.t3}})); done.push(`${pr.modules.kpi.label} ${X.kpi.length}개`); }
  let nb=0; Object.keys(X.b1).forEach(k=>{ if(!(pr.budgetItems||[]).includes(k)){ pr.budgetItems=(pr.budgetItems||[]).concat(k); if(pr.budgetPlanItems&&pr.budgetPlanItems.length&&!pr.budgetPlanItems.includes(k))pr.budgetPlanItems.push(k); } }); Object.entries(X.b1).forEach(([k,v])=>{ D.b1[k]=D.b1[k]||{bud:"",exe:""}; if(D.b1[k].bud===""||D.b1[k].bud==null){ D.b1[k].bud=v; nb++; } }); if(nb){ done.push(`비목 예산 ${nb}개`); if(!n(D.meta.totalPrev))D.meta.totalPrev=X.total!=null?X.total:Object.values(X.b1).reduce((a,v)=>a+n(v),0); }
  if(X.gov.length&&!D.gov.length){ D.gov=X.gov; done.push(`조직 ${X.gov.length}개`); }
  let nf=0; X.findings.forEach(f=>{ if(!D.findings.find(x=>x.msg===f.msg)){ D.findings.push(f); nf++; } }); if(nf)done.push(`문서 대조 ${nf}건`);
  if(done.length&&!D.preset)D.preset="전년도 제출 문서에서 자동 추출 ("+X.srcNames.join(", ")+")";
  ensureData(pr,D); return done; }

/* ── 3. 항목별 전년도 원문 → 내용(안) ── */
function attachPriorSections(srcs){ const priors=srcs.filter(s=>s.role==="prior"&&s.text); let nSec=0, nDraft=0;
  prof().docs.forEach(doc=>{ const cands=priors.filter(s=>srcType(s)===doc.type).sort((a,b)=>jacc(b.name,doc.name)-jacc(a.name,doc.name)); const s=cands[0]; if(!s)return;
    const L=s.text.split("\n"), st=tocEndOf(L)+1, freq=lineFreq(L);
    const pos=doc.sections.filter(x=>x.title).map(x=>({x,i:locate(L,st,x.title)})).filter(f=>f.i>=0).sort((a,b)=>a.i-b.i);
    pos.forEach((f,k)=>{ if(f.x.kind!=="text"&&f.x.kind!=="pp")return; let end=k+1<pos.length?pos[k+1].i:Math.min(L.length,f.i+400);
      for(let j=f.i+3;j<end;j++)if(CHAPTER_RE.test(L[j])&&!(norm(L[j]).length<40&&(freq[norm(L[j])]||0)>=3)){ end=j; break; }
      const body=cleanBody(L.slice(f.i+1,end),freq); if(body.length<60)return; const d=secData(doc.id,f.x.id);
      d.prior={src:s.name,head:L[f.i].trim().slice(0,80),text:body.slice(0,8000)}; nSec++;
      const key=f.x.kind==="pp"?(prof().ppFields[0]||{k:"f1"}).k:"text";
      if(!d.draft&&isEmptyField(d[key])&&!(key==="text"&&f.x.from.length&&draftFrom(f.x))){ d.draft={by:"prior",at:Date.now(),ideas:[`‘${s.name}’의 ‘${d.prior.head}’ 원문을 그대로 가져왔습니다`,"연도·수치를 올해 기준으로 고치고, 올해 새로 한 일을 더하세요"],fields:{[key]:d.prior.text},check:["연도 표기와 수치를 올해 기준으로 갱신","올해 추가 실적·변경 사항 반영"]}; nDraft++; } }); });
  return {nSec,nDraft}; }

/* ── 전체 흐름 ── */
async function autoFill(manual){ if(!P)return; const srcs=SOURCES.filter(s=>s.text&&!s.error); if(!srcs.length){ if(manual)toast("읽은 파일이 없습니다"); return; }
  const log=[]; const st=autoStructure(srcs); if(st)log.push(st);
  const X=rulePrior(srcs); const done=applyPriorEmpty(X); if(done.length)log.push("공통 데이터: "+done.join(" · "));
  else if(srcs.some(s=>s.role==="prior"))log.push("공통 데이터: 새로 채울 빈 곳이 없거나 표를 찾지 못했습니다");
  const r=attachPriorSections(srcs); if(r.nSec)log.push(`문서 항목 ${r.nSec}곳에 전년도 원문 연결 · 빈 항목 ${r.nDraft}곳에 내용(안) 준비`);
  if(!log.length)log.push("자동으로 채울 내용을 찾지 못했습니다. 파일 역할(기본계획·서식·전년도)을 확인해 주세요");
  dat().autoLog={at:Date.now(),steps:log,files:srcs.map(s=>s.name+" ("+ROLE_LABEL[s.role]+")")}; save(); return log; }
function autoLogHTML(){ const a=P&&dat().autoLog; if(!a)return ""; return `<div class="panel" style="margin-bottom:16px;border-color:var(--accent)"><div class="row" style="justify-content:space-between"><h3 style="margin:0">파일에서 자동으로 채운 결과</h3><span class="small muted">${new Date(a.at).toLocaleString("ko-KR")}</span></div>
  <ul class="ideas" style="margin:8px 0">${a.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ul><p class="small muted" style="margin:0 0 8px">사용한 파일: ${a.files.map(esc).join(", ")}</p>
  <div class="row"><button class="btn sm pri" data-go="map">매칭 맵 보기</button><button class="btn sm" data-go="tasks">${esc(prof().modules.tasks.label)} 확인</button><button class="btn sm" data-go="kpi">${esc(prof().modules.kpi.label)} 확인</button><button class="btn sm" data-act="autoFillAgain">다시 실행</button><button class="btn ghost sm" data-act="autoLogHide">닫기</button></div>
  <p class="small muted" style="margin:8px 0 0">규칙으로 뽑은 값입니다. 노란 표시(내용(안))와 ‘문서 대조 결과’를 확인한 뒤 쓰세요. Claude를 쓸 수 있는 보기에서는 ‘사업 구조 설정 → 전년도 문서 분석’으로 더 정밀하게 뽑을 수 있습니다.</p></div>`; }
async function autoStartFiles(files){ if(!files.length)return; if(P&&P.demo)await exitDemo(true); const p=newProject("새 사업",BLANK_PROFILE()); await adopt(p);
  await addFiles(files); const pr=prof(), D=dat(); P.name=[D.meta.org,pr.programName].filter(Boolean).join(" · ")||P.name; PROJ=PROJ.map(x=>x.id===P.id?Object.assign(x,{name:P.name}):x); save(); go("home"); }
