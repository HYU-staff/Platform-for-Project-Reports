/* =====================================================================
   10. 이벤트 · 시작
   ===================================================================== */
function readVal(el){ if(el.dataset.bool)return el.checked; if(el.dataset.n)return el.value===""?"":parseFloat(el.value); if(el.dataset.arr)return el.value.split("\n").map(s=>s.trim()).filter(Boolean); if(el.dataset.csv)return el.value.split(/[,\n]/).map(s=>s.trim()).filter(Boolean); return el.value; }
document.addEventListener("input",e=>{ const el=e.target; if(!P||!el.dataset||!el.dataset.b||el.type==="checkbox")return; setPath(el.dataset.b,readVal(el)); save(); });
document.addEventListener("change",async e=>{ const el=e.target;
  if(el.id==="projSel"){ if(el.value)await openProject(el.value); return; }
  if(el.id==="showDraft"){ SHOWDRAFT=el.checked; render(true); return; }
  if(el.id==="fileIn"){ await addFiles([...el.files]); el.value=""; return; }
  if(el.id==="jsonIn"){ const f=el.files[0]; el.value=""; if(f)importJSON(await f.text()); return; }
  if(el.dataset&&el.dataset.srcrole){ const s=SOURCES.find(x=>x.id===el.dataset.srcrole); if(s){ s.role=el.value; try{await Store.saveSource(P.id,s)}catch(err){} render(true);} return; }
  if(el.dataset&&el.dataset.b&&P){ setPath(el.dataset.b,readVal(el)); if(/\.(variant|status|group|kind|src|type|chg)$|meta\.flag|modules\..*\.on|bonus$/.test(el.dataset.b))ensureData(prof(),dat()); save(); render(true); } });
["dragover","dragleave","drop"].forEach(ev=>document.addEventListener(ev,e=>{ const dz=e.target.closest&&e.target.closest("#dz"); if(!dz)return; e.preventDefault(); if(ev==="dragover")dz.classList.add("on"); else dz.classList.remove("on"); if(ev==="drop")addFiles([...e.dataTransfer.files]); }));
document.addEventListener("keydown",e=>{ if(e.target.id==="dz"&&(e.key==="Enter"||e.key===" ")){e.preventDefault();$("#fileIn").click();} });
document.addEventListener("click",async e=>{
  const b=e.target.closest("button,[data-act]"); if(!b)return;
  if(b.dataset.go){ if(b.dataset.tab)setupTab=b.dataset.tab; go(b.dataset.go); return; }
  if(b.dataset.sec){ curSec=b.dataset.sec; render(true); return; }
  if(b.dataset.otab){ outTab=b.dataset.otab; render(true); return; }
  if(b.dataset.stab){ setupTab=b.dataset.stab; render(true); return; }
  const a=b.dataset.act; if(!a)return; const i=+b.dataset.i;
  const arrOf=p=>{let v=getPath(p);if(!Array.isArray(v)){v=[];setPath(p,v);}return v};
  const A={
    async newProjAsk(){ if(P&&P.demo)await exitDemo(true); cur="newproj"; render(); },
    startDemo(){ startDemo(); return "skip"; },
    async exitDemo(){ await exitDemo(); return "skip"; },
    demoNew(){ P=demoBlankProject(); setSave("데모 · 저장 안 함"); SOURCES=DEMO_SOURCES.map((s,i)=>({id:"demo-src"+i,name:s.name,role:s.role,chars:s.text.length,text:s.text,error:""})); TOURI=TOUR.findIndex(x=>x.demoStep==="analyze"); setupTab="docs"; go("setup"); return "skip"; },
    tourNext(){ if(TOURI>=TOUR.length-1){ TOURI=-1; render(true); toast("안내를 마쳤습니다. 데모를 자유롭게 써 보세요"); return "skip"; } const nx=TOUR[TOURI+1]; if(nx.demoStep==="analyze"&&!P.id.startsWith("demo-new")){ b.dataset.act="demoNew"; return A.demoNew(); } TOURI++; go(TOUR[TOURI].go); return "skip"; },
    tourPrev(){ if(TOURI>0){TOURI--; go(TOUR[TOURI].go);} return "skip"; },
    tourClose(){ TOURI=-1; render(true); return "skip"; },
    tourResume(){ TOURI=P.id.startsWith("demo-new")?TOUR.findIndex(x=>x.demoStep==="analyze"):0; go(TOUR[TOURI].go); return "skip"; },
    async createFrom(){ const t=TEMPLATES[b.dataset.key]; const p=newProject(t.programName,t); await adopt(p); toast("템플릿으로 사업을 만들었습니다"); go("meta"); return "skip"; },
    async createBlank(){ const nm=($("#newName")||{}).value||"새 재정지원사업"; const p=newProject(nm,BLANK_PROFILE()); p.profile.programName=nm; await adopt(p); setupTab="basic"; go("setup"); toast("사업을 만들었습니다. 기본계획과 서식을 올려 주세요"); return "skip"; },
    delProjAsk(){ $("#delSlot").innerHTML=`<span class="confirm">사업과 원문을 모두 지웁니다 <button class="btn sm" data-act="delProjDo">삭제</button><button class="btn sm" data-act="noop">취소</button></span>`; return "skip"; },
    async delProjDo(){ await Store.remove(P.id); PROJ=await Store.list(); P=null; SOURCES=[]; if(PROJ.length)await openProject(PROJ[0].id); else { cur="home"; render(); } toast("삭제했습니다"); return "skip"; },
    noop(){ render(true); return "skip"; },
    rowAdd(){ arrOf(b.dataset.arr).push(JSON.parse(b.dataset.tpl||"{}")); },
    rowDel(){ arrOf(b.dataset.arr).splice(i,1); },
    rowUp(){ const ar=arrOf(b.dataset.arr); if(i>0){const t=ar[i];ar[i]=ar[i-1];ar[i-1]=t;} },
    secAdd(){ const d=prof().docs[+b.dataset.di]; d.sections.push(SEC("s"+uid().slice(0,5),"","새 항목","text")); },
    docAdd(){ prof().docs.push({id:"d"+uid().slice(0,5),type:"report",name:"새 문서",due:"",pageLimit:null,cover:["새 문서"],sections:[]}); },
    taskAdd(){ const gs=taskGroups(); const g=(gs.find(x=>tasksBy(x.area).length<x.n)||gs[0]||{area:""}).area; dat().tasks.push({group:g,no:"",name:"새 과제",planName:"",goal:"",result:"",status:"",fb:"",next:"",next2:"",p1:"",p2:"",p3:"",chg:"유지",chgNote:"",oldName:""}); },
    ruleDraft(){ const doc=docById(b.dataset.ddoc), s=doc.sections.find(x=>x.id===b.dataset.dsec); secData(doc.id,s.id).draft=ruleDraft(doc,s); toast("뼈대(안)을 만들었습니다. 확인 후 적용하세요"); },
    async aiDraftOne(){ const doc=docById(b.dataset.ddoc), s=doc.sections.find(x=>x.id===b.dataset.dsec); b.disabled=true; b.textContent="Claude가 작성 중…";
      try{ secData(doc.id,s.id).draft=await aiDraft(doc,s); toast("내용(안)을 만들었습니다. 확인 후 적용하세요"); }catch(err){ toast(draftErr(err)); if(err.code==="no_sample"){ secData(doc.id,s.id).draft=ruleDraft(doc,s); toast("Claude를 쓸 수 없어 뼈대(안)을 만들었습니다"); } } },
    applyDraft(){ const doc=docById(b.dataset.ddoc), s=doc.sections.find(x=>x.id===b.dataset.dsec); const c=applyDraft(doc,s,b.dataset.mode); toast(c?`${c}개 칸에 적용했습니다. 내용을 확인해 고쳐 주세요`:"적용할 빈 칸이 없습니다"); },
    dropDraft(){ delete secData(b.dataset.ddoc,b.dataset.dsec).draft; },
    batchRule(){ let c=0; draftTargets().forEach(({doc,s})=>{ const d=secData(doc.id,s.id); if(!d.draft){d.draft=ruleDraft(doc,s);c++;} }); toast(`${c}개 항목에 뼈대(안)을 만들었습니다`); },
    async batchAI(){ const sm=await getSample(); if(!sm){ toast("이 보기에서는 Claude를 쓸 수 없습니다. 뼈대(안) 일괄을 이용하세요"); return "skip"; } const T=draftTargets().filter(x=>!secData(x.doc.id,x.s.id).draft||secData(x.doc.id,x.s.id).draft.by!=="claude"); const ac=new AbortController(); BATCH={ac,msg:"준비 중"}; render(true); let ok=0;
      for(let k=0;k<T.length;k++){ if(ac.signal.aborted)break; const {doc,s}=T[k]; BATCH.msg=`${k+1}/${T.length} ${s.no} ${s.title.slice(0,18)} 작성 중`; render(true);
        try{ secData(doc.id,s.id).draft=await aiDraft(doc,s,ac.signal); ok++; save(); }catch(err){ if(err.code==="cancelled")break; if(err.code==="rate_limited"||err.code==="not_granted"){ toast(draftErr(err)); break; } } }
      BATCH=null; toast(`${ok}개 항목에 내용(안)을 만들었습니다. 각 항목에서 확인 후 적용하세요`); },
    batchStop(){ if(BATCH)BATCH.ac.abort(); return "skip"; },
    batchApply(){ let c=0; prof().docs.forEach(doc=>visibleSecs(doc).forEach(s=>{ if(secData(doc.id,s.id).draft)c+=applyDraft(doc,s,"empty"); })); toast(`${c}개 칸에 내용(안)을 적용했습니다. 제출 전 수치·사실을 꼭 확인하세요`); },
    copyDraft(){ const s=docById(b.dataset.doc).sections.find(x=>x.id===b.dataset.sec); secData(b.dataset.doc,s.id).text=draftFrom(s); toast("본문으로 복사했습니다"); },
    clearFindingsAsk(){ b.outerHTML=`<span class="confirm">대조 결과를 지웁니다 <button class="btn sm" data-act="clearFindingsDo">지우기</button><button class="btn sm" data-act="noop">취소</button></span>`; return "skip"; },
    clearFindingsDo(){ dat().findings=[]; cur="home"; },
    pickFiles(){ $("#fileIn").click(); return "skip"; },
    srcPrev(){ const s=SOURCES.find(x=>x.id===b.dataset.id); if(s)s._open=!s._open; render(true); return "skip"; },
    async srcDel(){ const id=b.dataset.id; SOURCES=SOURCES.filter(x=>x.id!==id); try{await Store.delSource(P.id,id)}catch(err){} render(true); return "skip"; },
    ruleAnalyze(){ const base={key:"custom",programName:prof().programName,orgLabel:prof().orgLabel,years:prof().years,variantLabel:prof().variantLabel,variants:prof().variants}; const np=ruleBasedProfile(SOURCES.filter(s=>s.text),base); if(!np.programName)np.programName=prof().programName; P.profile=np; ensureData(np,dat()); setupTab="docs"; toast(`문서 ${np.docs.length}종, 평가영역 ${np.evalAreas.length}개, 집행기준 ${np.rules.length}개를 찾았습니다`); if(P.demo&&TOURI>=0&&TOUR[TOURI]&&TOUR[TOURI].demoStep==="analyze")TOURI++; },
    async claudeAnalyze(){ const s=await getSample(); if(!s){toast("이 보기에서는 Claude 분석을 쓸 수 없습니다");return "skip";} BUSY="Claude가 기본계획과 서식을 읽는 중입니다 (1~2분)"; render(true);
      try{ const fallback=ruleBasedProfile(SOURCES.filter(x=>x.text),{programName:prof().programName,orgLabel:prof().orgLabel,years:prof().years}); const x=await s.json(profilePrompt(SOURCES),{modelTier:"complex"}); const np=sanitizeProfile(x,fallback); if(!np.docs.length)np.docs=fallback.docs; P.profile=np; ensureData(np,dat()); setupTab="docs"; toast(`Claude 분석 완료: 문서 ${np.docs.length}종, 평가영역 ${np.evalAreas.length}개`); }
      catch(err){ toast(err.code==="not_granted"?"Claude 분석이 허용되지 않았습니다":err.code==="rate_limited"?"요청이 많습니다. 잠시 후 다시 눌러 주세요":err.code==="prompt_too_large"?"원문이 너무 깁니다. 참고 자료를 줄여 주세요":err.code==="invalid_json"?"결과를 해석하지 못했습니다. 한 번 더 시도하거나 규칙 분석을 쓰세요":"분석하지 못했습니다: "+(err.message||err.code)); }
      BUSY=""; },
    async priorExtract(){ const s=await getSample(); if(!s){toast("이 보기에서는 Claude 분석을 쓸 수 없습니다");return "skip";} BUSY="Claude가 전년도 문서를 읽고 대조하는 중입니다 (1~3분)"; render(true);
      try{ PRIOR=await s.json(priorPrompt(SOURCES),{modelTier:"complex"}); if(!PRIOR||typeof PRIOR!=="object")throw {message:"빈 결과"}; toast("추출을 마쳤습니다. 미리보기를 확인하고 적용하세요"); }
      catch(err){ PRIOR=null; toast(err.code==="invalid_json"?"결과를 해석하지 못했습니다. 다시 시도해 주세요":"추출하지 못했습니다: "+(err.message||err.code)); } BUSY=""; },
    dropPrior(){ PRIOR=null; },
    applyPrior(){ applyPrior(PRIOR); PRIOR=null; toast("전년도 데이터를 적용했습니다"); },
    exportProfile(){ saveFile((prof().programName||"사업")+"_구조.json",JSON.stringify({kind:"profile",profile:prof()},null,1)); return "skip"; },
    exportProject(){ saveFile((P.name||"사업")+".json",JSON.stringify({kind:"project",name:P.name,profile:P.profile,data:P.data},null,1)); return "skip"; },
    importAsk(){ $("#jsonIn").click(); return "skip"; },
    copyDoc(){ copyDoc(); return "skip"; },
    saveDoc(){ const nm=(outTab==="__diff"?"신구대조표":(docById(outTab)||{}).name||"문서")+"_"+ORG(); saveFile(nm+".html",`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(nm)}</title>${docStyle()}</head><body>${$("#docOut").innerHTML}</body></html>`); return "skip"; }
  };
  if(!A[a])return; const r=await A[a](); if(r!=="skip"&&P){ save(); render(true); }
});
function startDemo(){ if(P&&!P.demo)DEMO_BACK=P.id; P=demoProject(); setSave("데모 · 저장 안 함"); SOURCES=[]; PRIOR=null; curSec=""; outTab=""; TOURI=0; go(TOUR[0].go); }
async function exitDemo(silent){ TOURI=-1; setSave(Store.mode==="db"?"공유 저장소 연결":"이 브라우저에 저장"); const back=DEMO_BACK; DEMO_BACK=null; P=null; SOURCES=[]; if(back&&PROJ.find(p=>p.id===back))await openProject(back); else if(PROJ.length)await openProject(PROJ[0].id); else { cur="home"; render(); } if(!silent)toast("데모를 마쳤습니다"); }
function draftErr(err){ return err.code==="not_granted"?"Claude 사용이 허용되지 않았습니다":err.code==="rate_limited"?"요청이 많습니다. 잠시 후 다시 시도해 주세요":err.code==="no_sample"?err.message:err.code==="invalid_json"?"내용(안)을 해석하지 못했습니다. 다시 시도해 주세요":"내용(안)을 만들지 못했습니다: "+(err.message||err.code); }
async function adopt(p){ P=p; SOURCES=[]; Store.save(P); await new Promise(r=>setTimeout(r,50)); PROJ=[{id:p.id,name:p.name,program:p.profile.programName,updatedAt:Date.now()}].concat(PROJ.filter(x=>x.id!==p.id)); try{localStorage.setItem(LKEY+"-last",p.id)}catch(e){} }
async function openProject(id){ const p=await Store.load(id); if(!p){toast("사업을 불러오지 못했습니다");return;} P=p; ensureData(P.profile,P.data); SOURCES=await Store.listSources(id); try{localStorage.setItem(LKEY+"-last",id)}catch(e){} cur="home"; curSec=""; outTab=""; PRIOR=null; render(); }
async function addFiles(files){ if(!P||!files.length)return; for(const f of files){ BUSY=`${f.name} 읽는 중…`; render(true);
    try{ const buf=await f.arrayBuffer(); const outs=await extractFile(f.name,buf); for(const o of outs){ const s={id:"s"+uid(),name:o.name,role:o.error?"attach":guessRole(o.name,o.text),chars:(o.text||"").length,text:o.text||"",error:o.error||""}; if(!s.error&&s.chars<30){s.error="본문 텍스트가 거의 없습니다(스캔 이미지일 수 있음)";} SOURCES.push(s); try{await Store.saveSource(P.id,s)}catch(err){ toast("원문 저장 실패: "+(err.code||err.message)); } } }
    catch(err){ SOURCES.push({id:"s"+uid(),name:f.name,role:"attach",chars:0,text:"",error:err.message||String(err)}); } }
  BUSY=""; render(true); toast("파일을 읽었습니다. 역할(기본계획·서식·전년도 문서)을 확인하세요"); }
function applyPrior(x){ if(!x)return; const D=dat(), pr=prof();
  if(x.meta){ ["org","addr","url"].forEach(k=>{if(x.meta[k])D.meta[k]=x.meta[k]}); if(x.meta.variant&&(pr.variants||[]).includes(x.meta.variant))D.meta.variant=x.meta.variant; }
  if(Array.isArray(x.tasks)&&x.tasks.length)D.tasks=x.tasks.map(t=>({group:String(t.group||""),no:String(t.no||""),name:String(t.name||""),planName:String(t.planName||t.name||""),goal:String(t.goal||""),result:"",status:"",fb:"",next:String(t.next||""),next2:String(t.next2||""),p1:String(t.p1||""),p2:"",p3:"",chg:"유지",chgNote:"",oldName:""}));
  if(Array.isArray(x.kpi)&&x.kpi.length)D.kpi=x.kpi.map(k=>{const v=f=>k[f]===""||k[f]==null?"":n(k[f]);return {name:String(k.name||""),st:String(k.st||"기존"),unit:String(k.unit||""),base:v("base"),t1:v("t1"),t2:v("t2"),t3:v("t3"),act:"",formula:String(k.formula||""),why:String(k.why||""),links:String(k.links||""),src:{base:v("base"),t1:v("t1"),t2:v("t2"),t3:v("t3")}}});
  if(x.b1&&typeof x.b1==="object")Object.entries(x.b1).forEach(([k,v])=>{const key=pr.budgetItems.find(b=>norm(b)===norm(k))||k; if(!pr.budgetItems.includes(key))pr.budgetItems.push(key); D.b1[key]={bud:n(v),exe:""};});
  if(x.area3&&typeof x.area3==="object")Object.entries(x.area3).forEach(([k,v])=>{ if(!pr.budgetAreas.includes(k))pr.budgetAreas.push(k); D.area3[k]=Array.isArray(v)?v.slice(0,3).map(n):["","",""]; });
  const tb=pr.budgetItems.reduce((s,k)=>s+n((D.b1[k]||{}).bud),0); if(tb&&!n(D.meta.totalPrev))D.meta.totalPrev=Math.round(tb*10)/10;
  if(Array.isArray(x.gov)&&x.gov.length)D.gov=x.gov.map(g=>({name:String(g.name||""),func:String(g.func||""),members:String(g.members||""),y1:"",y2:"",out:""}));
  if(Array.isArray(x.findings))D.findings=x.findings.map(f=>({lv:["bad","warn","ok","info"].includes(f.lv)?f.lv:"info",area:String(f.area||""),msg:String(f.msg||""),src:String(f.src||""),fix:String(f.fix||"")}));
  D.preset="전년도 제출 문서에서 추출 ("+SOURCES.filter(s=>s.role==="prior").map(s=>s.name).join(", ")+")";
  ensureData(pr,D); }
function importJSON(t){ let o; try{o=JSON.parse(t)}catch(e){toast("JSON 형식이 아닙니다");return;}
  if(o.kind==="profile"&&o.profile){ if(!P){toast("먼저 사업을 만드세요");return;} P.profile=sanitizeProfile(o.profile,null); Object.assign(P.profile,o.profile); ensureData(P.profile,dat()); save(); render(); toast("사업 구조를 불러왔습니다"); return; }
  if(o.profile&&o.data){ const p=newProject(o.name||o.profile.programName,o.profile,o.data); adopt(p).then(()=>{render();toast("사업을 불러왔습니다");}); return; }
  toast("사업 데이터나 구조 파일이 아닙니다"); }
async function saveFile(name,text){ try{ const dl=window.claude&&window.claude.use?await window.claude.use("downloads"):null; if(dl){ await dl.save({filename:name,data:text}); toast("저장했습니다"); return; } }catch(err){ if(err&&err.code==="declined")return; if(err&&err.code&&err.code!=="unavailable"&&err.code!=="not_granted"){toast("저장하지 못했습니다: "+err.code);return;} }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:name.endsWith(".json")?"application/json":"text/html"})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); }catch(err){ toast("이 보기에서는 파일 저장을 쓸 수 없습니다. 본문 복사를 이용하세요"); } }
function copyDoc(){ const el=$("#docOut"); const html=el.innerHTML; const fb=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);let ok=false;try{ok=document.execCommand("copy")}catch(e){}toast(ok?"본문을 복사했습니다. 한글·워드 문서에 붙여넣으세요":"본문이 선택되었습니다. Ctrl+C로 복사하세요")};
  try{ if(window.ClipboardItem&&navigator.clipboard&&navigator.clipboard.write){ navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([el.innerText],{type:"text/plain"})})]).then(()=>toast("본문을 복사했습니다. 한글·워드 문서에 붙여넣으세요"),fb); return; } }catch(e){} fb(); }
function docStyle(){return `<style>body{font-family:'맑은 고딕','Malgun Gothic','나눔고딕','Apple SD Gothic Neo',sans-serif;font-size:12pt;line-height:160%;max-width:780px;margin:30px auto}table{border-collapse:collapse;width:100%;margin:6pt 0}th,td{border:1px solid #555;padding:3pt 5pt;font-size:11pt;vertical-align:middle}th{background:#e9efe9}td.n{text-align:right}h1{font-size:20pt;text-align:center}h2{font-size:15pt;border-bottom:2pt solid #1f5c46}.kmark{background:#1f5c46;color:#fff;font-size:9pt;padding:0 6pt;margin-left:4pt}.draft{background:#fff8dc;border-left:3pt solid #c9a227;padding:2pt 6pt}.dlabel{font-size:9pt;font-weight:700;color:#8a6d00}.empty{color:#a33}.cover{text-align:center;border:3pt double #1f5c46;padding:30pt;margin-bottom:20pt}.reg{background:#1f5c46;color:#fff;padding:2pt 10pt}.pb{page-break-after:always}.pre{white-space:pre-wrap}.ai{font-size:9pt;color:#555}</style>`}

async function boot(){
  $("#main").innerHTML='<p class="busy">불러오는 중…</p>';
  await Store.init(); setSave(Store.mode==="db"?"공유 저장소 연결":"이 브라우저에 저장");
  PROJ=await Store.list(); let last=null; try{last=localStorage.getItem(LKEY+"-last")}catch(e){}
  const wantDemo=/^#demo/i.test(location.hash||"");
  if(wantDemo||!PROJ.length){ startDemo(); if(!wantDemo)toast("처음 방문이라 데모로 시작합니다. 위의 ‘데모 종료’를 누르면 내 사업을 만들 수 있습니다"); }
  else { await openProject(PROJ.find(p=>p.id===last)?last:PROJ[0].id); }
  if(Store.mode==="db"){ try{ Store.db.collection("projects").onSnapshot(q=>{ const L=q.docs.map(d=>{const x=d.data();return {id:d.id,name:x.name,program:x.profile&&x.profile.programName,updatedAt:x.updatedAt||0}}).sort((a,b)=>b.updatedAt-a.updatedAt); const changed=L.map(x=>x.id+x.name).join()!==PROJ.map(x=>x.id+x.name).join(); PROJ=L; if(changed)renderTop(); },()=>{}); }catch(e){} }
}
boot();
