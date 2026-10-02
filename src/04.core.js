/* =====================================================================
   2. 유틸
   ===================================================================== */
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const n=v=>{const x=parseFloat(v);return isFinite(x)?x:0};
const f1=v=>isFinite(v)?(Math.round(v*10)/10).toFixed(1):"-";
const won=v=>{const x=n(v);return (Math.round(x*10)/10).toLocaleString("ko-KR",{maximumFractionDigits:1})};
const pct=(a,b)=>b?a/b*100:NaN;
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const clone=o=>JSON.parse(JSON.stringify(o));
const norm=s=>String(s||"").replace(/[\s ]+/g,"").replace(/[·‧ㆍ･・]/g,"·").replace(/[’'"“”‘「」『』()（）\[\]【】<>《》〈〉:：,，.。~\-–—_/|]/g,"").toLowerCase();
function bigrams(s){const t=norm(s);const b=new Set();for(let i=0;i<t.length-1;i++)b.add(t.slice(i,i+2));return b}
function overlap(a,b){const A=bigrams(a),B=bigrams(b);if(!A.size||!B.size)return 0;let c=0;A.forEach(x=>{if(B.has(x))c++});return c/Math.min(A.size,B.size)}
function jacc(a,b){const A=bigrams(a),B=bigrams(b);if(!A.size||!B.size)return 0;let c=0;A.forEach(x=>{if(B.has(x))c++});return c/(A.size+B.size-c)}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2200)}
function pill(cls,t){return `<span class="pill ${cls}">${esc(t)}</span>`}
const lvPill=lv=>pill(lv==="ok"?"ok":lv==="warn"?"warn":lv==="bad"?"bad":"n",lv==="ok"?"적합":lv==="warn"?"확인":lv==="bad"?"수정 필요":"참고");
const KEYMARK=()=>`<span class="key">${esc(P&&P.profile.modules.tasks.mark||"핵심")}</span>`;

/* 현재 사업(프로젝트) */
let P=null;           // {id,name,profile,data,createdAt,updatedAt}
let PROJ=[];          // [{id,name,program,updatedAt}]
let SOURCES=[];       // 현재 사업의 업로드 원문 [{id,name,role,chars,text}]
const prof=()=>P.profile, dat=()=>P.data;
const dec=k=>{try{return decodeURIComponent(k)}catch(e){return k}};
const pth=(...a)=>a.map(x=>encodeURIComponent(String(x)).replace(/\./g,"%2E")).join(".");
function getPath(p){return p.split(".").map(dec).reduce((o,k)=>o==null?o:o[k],P)}
function setPath(p,v){const ks=p.split(".").map(dec);let o=P;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null)o[ks[i]]=/^\d+$/.test(ks[i+1])?[]:{};o=o[ks[i]];}o[ks[ks.length-1]]=v}
const pid=p=>p.replace(/[^\w가-힣]/g,"_");
function inp(path,opt={}){const v=getPath(path);const t=opt.num?"number":"text";return `<input id="i_${pid(path)}" type="${t}" ${opt.num?'step="any" class="num"':''} data-b="${esc(path)}" ${opt.num?'data-n="1"':''} value="${esc(v==null?'':v)}" placeholder="${esc(opt.ph||'')}" ${opt.aria?`aria-label="${esc(opt.aria)}"`:''}>`}
function ta(path,ph,rows,arr){let v=getPath(path);if(arr&&Array.isArray(v))v=v.join("\n");return `<textarea id="t_${pid(path)}" data-b="${esc(path)}" ${arr?'data-arr="1"':''} rows="${rows||4}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`}
function sel(path,opts,aria){const v=getPath(path);return `<select id="s_${pid(path)}" data-b="${esc(path)}" ${aria?`aria-label="${esc(aria)}"`:''}>${opts.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(val)===String(v==null?"":v)?'selected':''}>${esc(lab)}</option>`}).join("")}</select>`}

function blankData(profile){
  const d={meta:{org:"",variant:(profile.variants||[])[0]||"",type:"",addr:"",url:"",leaderOrg:"",leaderName:"",phone:"",rid:"",flag:"X",flagPrev:"X",totalPrev:0,budgetCur:0,carry:0,aiNote:""},
    tasks:[],sec:{},kpi:[],b1:{},b2:{},area3:{},equip:[],bonus:{total:0,ex:[0,0,0],t1:0,t2:0,scope:"입학정원",year:""},gov:[],findings:[],preset:""};
  ensureData(profile,d); return d;
}
function ensureData(profile,d){
  d.meta=d.meta||{}; d.sec=d.sec||{}; d.b1=d.b1||{}; d.b2=d.b2||{}; d.area3=d.area3||{}; d.tasks=d.tasks||[]; d.kpi=d.kpi||[]; d.gov=d.gov||[]; d.equip=d.equip||[]; d.findings=d.findings||[];
  d.bonus=d.bonus||{total:0,ex:[0,0,0],t1:0,t2:0}; if(!Array.isArray(d.bonus.ex))d.bonus.ex=[0,0,0];
  (profile.budgetItems||[]).forEach(k=>{if(!d.b1[k])d.b1[k]={bud:"",exe:""}});
  (profile.budgetPlanItems&&profile.budgetPlanItems.length?profile.budgetPlanItems:profile.budgetItems||[]).forEach(k=>{if(!d.b2[k])d.b2[k]=["",""]});
  (profile.budgetAreas||[]).forEach(k=>{if(!d.area3[k])d.area3[k]=["","",""]});
  (profile.docs||[]).forEach(doc=>{d.sec[doc.id]=d.sec[doc.id]||{};doc.sections.forEach(s=>{d.sec[doc.id][s.id]=d.sec[doc.id][s.id]||{}})});
  return d;
}
function newProject(name,profile,data){const p={id:"p"+uid(),name:name||profile.programName||"새 사업",profile:clone(profile),data:data||blankData(profile),createdAt:Date.now(),updatedAt:Date.now()};ensureData(p.profile,p.data);return p}

/* =====================================================================
   3. 저장소 : db(공유·기기 간 유지) 우선, 없으면 브라우저 저장소
   ===================================================================== */
const LKEY="fin-support-platform-v1";
const Store={
  mode:"local", db:null, writing:false, pending:null, srcCache:{},
  async init(){
    try{ if(window.claude&&typeof window.claude.use==="function"){ const db=await window.claude.use("db"); if(db){this.db=db;this.mode="db";} } }catch(e){}
  },
  lsGet(){try{return JSON.parse(localStorage.getItem(LKEY)||"null")||{projects:{},sources:{}}}catch(e){return {projects:{},sources:{}}}},
  lsSet(o){try{localStorage.setItem(LKEY,JSON.stringify(o));return true}catch(e){return false}},
  async list(){
    if(this.mode==="db"){ try{ const q=await this.db.collection("projects").get(); return q.docs.map(d=>{const x=d.data();return {id:d.id,name:x.name,program:x.profile&&x.profile.programName,updatedAt:x.updatedAt||0}}).sort((a,b)=>b.updatedAt-a.updatedAt);}catch(e){ toast("저장소를 읽지 못했습니다: "+(e.code||e.message)); return []; } }
    const o=this.lsGet(); return Object.values(o.projects).map(x=>({id:x.id,name:x.name,program:x.profile.programName,updatedAt:x.updatedAt})).sort((a,b)=>b.updatedAt-a.updatedAt);
  },
  async load(id){
    if(this.mode==="db"){ const s=await this.db.doc("projects/"+id).get(); if(!s.exists)return null; const x=clone(s.data()); x.id=id; return x; }
    const o=this.lsGet(); return o.projects[id]?clone(o.projects[id]):null;
  },
  save(p){ if(p&&p.demo){ setSave("데모 · 저장 안 함"); return; } p.updatedAt=Date.now(); this.pending=clone(p); this.flush(); },
  async flush(){
    if(this.writing||!this.pending)return; this.writing=true; const p=this.pending; this.pending=null;
    try{
      if(this.mode==="db"){ const body={name:p.name,profile:p.profile,data:p.data,createdAt:p.createdAt||Date.now(),updatedAt:p.updatedAt}; await this.db.doc("projects/"+p.id).set(body); }
      else { const o=this.lsGet(); o.projects[p.id]=p; if(!this.lsSet(o)) throw {code:"local_full",message:"브라우저 저장 공간 부족"}; }
      setSave((this.mode==="db"?"저장됨 ":"이 브라우저에 저장 ")+new Date().toTimeString().slice(0,5));
    }catch(e){ setSave("저장 실패"); toast(e.code==="quota_exceeded"?"저장 공간이 가득 찼습니다. 쓰지 않는 사업이나 원문을 지워 주세요":e.code==="invalid_argument"?"이 보기에서는 저장 권한이 없습니다(읽기 전용)":"저장하지 못했습니다: "+(e.message||e.code)); }
    this.writing=false; if(this.pending) this.flush();
  },
  async remove(id){ if(this.mode==="db"){ const ss=await this.listSources(id); for(const s of ss){ try{await this.db.doc(`projects/${id}/sources/${s.id}`).delete()}catch(e){} } await this.db.doc("projects/"+id).delete(); } else { const o=this.lsGet(); delete o.projects[id]; delete o.sources[id]; this.lsSet(o);} },
  async listSources(id){
    if(this.mode==="db"){ try{ const q=await this.db.collection(`projects/${id}/sources`).get(); return q.docs.map(d=>Object.assign({id:d.id},d.data())); }catch(e){ return []; } }
    const o=this.lsGet(); return Object.values((o.sources||{})[id]||{});
  },
  async saveSource(id,src){
    if(String(id).startsWith("demo"))return;
    const body={name:src.name,role:src.role,chars:src.chars,text:(src.text||"").slice(0,70000),truncated:(src.text||"").length>70000,addedAt:Date.now()};
    if(this.mode==="db"){ await this.db.doc(`projects/${id}/sources/${src.id}`).set(body); return; }
    const o=this.lsGet(); o.sources=o.sources||{}; o.sources[id]=o.sources[id]||{}; o.sources[id][src.id]=Object.assign({id:src.id},body); if(!this.lsSet(o)){ delete o.sources[id][src.id]; o.sources[id][src.id]=Object.assign({id:src.id},body,{text:body.text.slice(0,15000),truncated:true}); this.lsSet(o); }
  },
  async delSource(id,sid){ if(String(id).startsWith("demo"))return; if(this.mode==="db"){ await this.db.doc(`projects/${id}/sources/${sid}`).delete(); return; } const o=this.lsGet(); if(o.sources&&o.sources[id]){delete o.sources[id][sid]; this.lsSet(o);} }
};
function setSave(t){const c=$("#chipSave");if(c)c.textContent=t}
let saveT=null; function save(){ clearTimeout(saveT); saveT=setTimeout(()=>Store.save(P),500); }

/* =====================================================================
   4. 업로드 파일 → 텍스트 (PDF · HWP · HWPX · DOCX · XLSX/XLS/CSV · ZIP · TXT)
   ===================================================================== */
const LIBS={jszip:"https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",xlsx:"https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",pdf:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",pdfw:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js"};
const libP={};
function loadLib(k){ if(libP[k])return libP[k]; libP[k]=new Promise((res,rej)=>{const s=document.createElement("script");s.src=LIBS[k];s.onload=()=>res();s.onerror=()=>{delete libP[k];rej(new Error("파일 해석 라이브러리를 불러오지 못했습니다. 네트워크를 확인해 주세요."))};document.head.appendChild(s)}); return libP[k]; }
function decodeXmlEnt(s){return s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,d)=>String.fromCharCode(+d)).replace(/&amp;/g,"&")}
function xmlToText(x,P_END,TAB,CELL){ x=x.replace(new RegExp(P_END,"g"),"\n").replace(new RegExp(TAB,"g"),"\t"); if(CELL)x=x.replace(new RegExp(CELL,"g")," | "); x=x.replace(/<[^>]+>/g,""); return decodeXmlEnt(x); }
function cleanText(t){ return t.replace(/\r/g,"").replace(/[  ]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim(); }
async function pdfText(buf){
  await loadLib("pdf"); await loadLib("pdfw");
  const lib=window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc=LIBS.pdfw;
  const doc=await lib.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise; const out=[];
  for(let i=1;i<=doc.numPages;i++){ const pg=await doc.getPage(i); const tc=await pg.getTextContent(); let lastY=null, lastEnd=null, line="";
    const flush=()=>{ if(line){ out.push(line.replace(/(\S+)(?: \1){2,}/g,"$1")); } line=""; };
    tc.items.forEach(it=>{ if(!it.str&&!it.hasEOL)return; const x=it.transform[4], y=Math.round(it.transform[5]), fs=Math.abs(it.transform[0])||10;
      if(lastY!==null&&Math.abs(y-lastY)>2){ flush(); lastEnd=null; }
      if(line&&lastEnd!==null&&x-lastEnd>fs*0.25&&!/\s$/.test(line)&&!/^\s/.test(it.str))line+=" ";
      line+=it.str; lastY=y; lastEnd=x+(it.width||0); if(it.hasEOL){ flush(); lastY=null; lastEnd=null; } });
    flush(); out.push(""); }
  return cleanText(out.join("\n"));
}
async function zipOpen(buf){ await loadLib("jszip"); return window.JSZip.loadAsync(buf,{decodeFileName:b=>{try{return new TextDecoder("utf-8",{fatal:true}).decode(b)}catch(e){try{return new TextDecoder("euc-kr").decode(b)}catch(e2){return String.fromCharCode.apply(null,b)}}}}); }
async function hwpxText(buf){ const z=await zipOpen(buf); const names=Object.keys(z.files).filter(k=>/Contents\/section\d+\.xml$/i.test(k)).sort((a,b)=>parseInt(a.match(/(\d+)\.xml/)[1])-parseInt(b.match(/(\d+)\.xml/)[1])); let t=""; for(const k of names){ t+=xmlToText(await z.file(k).async("string"),"</hp:p>","<hp:tab[^>]*/>","</hp:tc>")+"\n"; } return cleanText(t); }
async function docxText(buf){ const z=await zipOpen(buf); const f=z.file("word/document.xml"); if(!f)throw new Error("DOCX 본문을 찾지 못했습니다"); return cleanText(xmlToText(await f.async("string"),"</w:p>","<w:tab/>","</w:tc>")); }
async function inflateWith(fmt,u8){ const ds=new DecompressionStream(fmt); const st=new Blob([u8]).stream().pipeThrough(ds); return new Uint8Array(await new Response(st).arrayBuffer()); }
async function inflateRaw(u8){ if(typeof DecompressionStream==="undefined")throw new Error("이 브라우저는 HWP 압축 해제를 지원하지 않습니다. HWPX나 PDF로 저장해 올려 주세요."); try{ return await inflateWith("deflate-raw",u8); }catch(e){ try{ return await inflateWith("deflate",u8); }catch(e2){ throw new Error("HWP 본문 압축을 풀지 못했습니다. 한글에서 HWPX 또는 PDF로 저장해 올려 주세요."); } } }
async function hwpText(buf){
  await loadLib("xlsx"); const CFB=window.XLSX.CFB; const cfb=CFB.read(new Uint8Array(buf),{type:"array"});
  const ent=name=>{const i=cfb.FullPaths.findIndex(p=>p.replace(/\/$/,"").endsWith(name));return i>=0?cfb.FileIndex[i]:null};
  const fh=ent("/FileHeader"); if(!fh)throw new Error("HWP 파일 구조를 읽지 못했습니다");
  const flags=fh.content[36]|(fh.content[37]<<8); if(flags&4)throw new Error("배포용(암호화) HWP 문서는 읽을 수 없습니다. PDF로 변환해 올려 주세요.");
  const comp=flags&1; const secs=[];
  cfb.FullPaths.forEach((p,i)=>{const m=p.match(/BodyText\/Section(\d+)$/);if(m)secs.push([+m[1],cfb.FileIndex[i]])}); secs.sort((a,b)=>a[0]-b[0]);
  const out=[];
  for(const [,e] of secs){ let d=e.content instanceof Uint8Array?e.content:new Uint8Array(e.content); if(comp)d=await inflateRaw(d); let i=0; const dv=new DataView(d.buffer,d.byteOffset,d.byteLength);
    while(i+4<=d.length){ const h=dv.getUint32(i,true); const tag=h&0x3ff; let sz=(h>>>20)&0xfff; i+=4; if(sz===0xfff){sz=dv.getUint32(i,true);i+=4;} if(tag===67){ let s=""; for(let j=i;j+1<i+sz;){ const c=d[j]|(d[j+1]<<8); if(c<32){ if(c===10||c===13){s+="\n";j+=2;} else if(c===0||(c>=24&&c<=31)){j+=2;} else { if(c===9)s+="\t"; j+=16; } } else { s+=String.fromCharCode(c); j+=2; } } out.push(s.trim()); } i+=sz; } }
  return cleanText(out.filter(Boolean).join("\n"));
}
async function sheetText(buf){ await loadLib("xlsx"); const wb=window.XLSX.read(new Uint8Array(buf),{type:"array"}); return wb.SheetNames.map(nm=>"## "+nm+"\n"+window.XLSX.utils.sheet_to_csv(wb.Sheets[nm],{FS:" | ",blankrows:false})).join("\n\n"); }
function plainText(buf){ const u=new Uint8Array(buf); let t=new TextDecoder("utf-8").decode(u); if((t.match(/\uFFFD/g)||[]).length>5){try{t=new TextDecoder("euc-kr").decode(u)}catch(e){}} return cleanText(t.replace(/<[^>]+>/g," ")); }
async function extractFile(name,buf,depth){
  const ext=(name.split(".").pop()||"").toLowerCase(); depth=depth||0;
  if(ext==="zip"){ if(depth>1)return []; const z=await zipOpen(buf); const out=[]; for(const k of Object.keys(z.files)){ const f=z.files[k]; if(f.dir||/(^|\/)(__MACOSX|\.)/.test(k))continue; const b=await f.async("arraybuffer"); try{ out.push(...await extractFile(k.split("/").pop(),b,depth+1)); }catch(e){ out.push({name:k.split("/").pop(),text:"",error:e.message}); } } return out; }
  let text="";
  if(ext==="pdf")text=await pdfText(buf);
  else if(ext==="hwpx")text=await hwpxText(buf);
  else if(ext==="hwp")text=await hwpText(buf);
  else if(ext==="docx")text=await docxText(buf);
  else if(["xlsx","xls","xlsm","csv"].includes(ext))text=await sheetText(buf);
  else if(["txt","md","html","htm","json"].includes(ext))text=plainText(buf);
  else throw new Error("지원하지 않는 형식입니다(."+ext+")");
  return [{name,text}];
}
function guessRole(name,text){
  const s=name+" "+(text||"").slice(0,400);
  if(/제출서|동의서|확인서|서약서|신구대조|증빙\s*자료/.test(name))return "attach";
  if(/기본\s*계획|시행\s*계획|공고|추진\s*계획\(안\)|운영\s*계획/.test(s)&&!/서식|양식/.test(name))return "plan";
  if(/서식|양식|작성\s*요령|작성방법/.test(s))return "form";
  if(/보고서|계획서|실적|결과/.test(name))return "prior";
  return "form";
}
const ROLE_LABEL={plan:"기본계획(안)",form:"작성 서식",prior:"전년도 제출 문서",attach:"참고(분석 제외)"};

/* =====================================================================
   5. 규칙 기반 분석 : 기본계획 → 평가영역·집행기준·일정 / 서식 → 문서·목차·작성방법
   ===================================================================== */
const ROMAN="ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ";
const KNOWN_ITEMS=["교육·연구 프로그램 개발 운영비","실험·실습 장비 및 기자재 구입·운영비","교육·연구 환경 개선비","인건비","장학금","그 밖의 사업운영경비","학생인건비","연구활동비","연구재료비","연구수당","연구시설·장비비","위탁연구개발비","간접비","직접비","교육훈련비","프로그램 운영비","사업추진비","시설·장비비","기자재 구입비","운영비","활동비","여비","회의비","홍보비","재료비","임차료"];
function analyzePlanText(text){
  const T=text.replace(/\s+/g," "); const lines=text.split("\n").map(l=>l.trim()).filter(Boolean); const R={};
  const hd=lines.slice(0,12).join(" ").replace(/(\S+)(\s+\1)+/g,"$1").replace(/(.{2,24}?)\1+/g,"$1");
  const ym=hd.match(/(\d{4})\s*년?\s*[-~∼]\s*(\d{4})\s*년?/), pm=hd.match(/([가-힣A-Za-z0-9·]{2,30}사업)/), pa=hd.match(/\(\s*([가-힣·A-Za-z0-9]{2,15})\s*\)/), tm=hd.match(/(기본|시행|추진|운영)\s*계획\s*(\(\s*안\s*\))?/);
  R.programName=pm?pm[1]+(pa?"("+pa[1]+")":""):""; R.planTitle=R.programName?[(ym?ym[1]+"~"+ym[2]+"년":""),R.programName,(tm?tm[1]+"계획"+(tm[2]?"(안)":""):"")].filter(Boolean).join(" "):"";
  let m=T.match(/사업\s*목표\s*[:：)\]】]?\s*([^□◦ㅇ▪]{10,140}?)(?:\s{2}|기본\s*방향|$)/); R.goal=m?m[1].trim():"";
  m=T.match(/[’'‘]?\d{2}\.\s*\d{1,2}\.\s*\d{1,2}\.?\s*[~∼]\s*[’'‘]?\d{2}\.\s*\d{1,2}\.\s*\d{1,2}\.?(\s*\([^)]{1,12}\))?/); R.period=m?m[0]:"";
  // 평가영역·배점
  const areas=[]; let idx=T.search(/배점/); if(idx<0)idx=T.search(/평가\s*(영역|지표)\s*및/); const win=idx>=0?T.slice(Math.max(0,idx-400),idx+5000):T;
  const re=/(?:\d+\.\s*)?([가-힣A-Za-z·\s]{2,30}?)\s*\(\s*(\d{1,3})\s*점?\s*\)/g; let a;
  while((a=re.exec(win))){ const nm=a[1].replace(/^\s*(및|등|의)\s*/,"").trim(); const pts=+a[2]; if(pts<5||pts>100||nm.length<2||/^(년|월|일|억|명|교|개|점)$|기준|최대|최소|이상|미만|%/.test(nm))continue; if(areas.find(x=>norm(x.name)===norm(nm)))continue; areas.push({id:"E"+(areas.length+1),name:nm,pts,how:"",desc:"",focus:[]}); if(areas.reduce((s,x)=>s+x.pts,0)>=100)break; }
  m=[...T.matchAll(/가[산]?점\s*\(?\s*최대\s*(\d{1,2})\s*점/g)].pop()||T.match(/가점[^.]{0,40}?최대\s*(\d{1,2})\s*점/); if(m)areas.push({id:"B",name:"가산점",pts:+m[1],bonus:true,how:"",desc:"",focus:[]});
  // 평가 주안점
  const fm=T.match(/평가\s*주안점\s*(.{0,400})/); if(fm&&areas[0]){ areas[0].focus=fm[1].split(/[•▪◦]/).map(s=>s.trim()).filter(s=>s.length>6&&s.length<60).slice(0,4); }
  R.evalAreas=areas;
  // 집행기준
  const rules=[]; const add=(id,label,kw,max,basis,extra)=>{ if(max!=null&&!rules.find(r=>r.id===id))rules.push(Object.assign({id,label,kw,max,basis},extra||{})) };
  m=T.match(/인건비[^%]{0,50}?(\d{1,2})\s*%/); const alt=T.match(/동결[^%]{0,70}?(\d{1,2})\s*%/);
  if(m)add("pers","인건비","인건비|인센티브",+m[1],"기본계획 집행기준: "+m[0].slice(0,60),alt&&+alt[1]>+m[1]?{altMax:+alt[1],altLabel:"등록금 동결(인하)"}:{});
  m=T.match(/인센티브[^%]{0,40}?(\d{1,2})\s*%\s*이내/); if(m)add("inc","기존 교직원 인센티브","인센티브\\(b\\)|인센티브\\(기존",+m[1],m[0].slice(0,60));
  m=T.match(/(그\s*밖의\s*사업운영\s*경비)[^%]{0,70}?(\d{1,2})\s*%/)||T.match(/(경상비|일반\s*운영비)[^%]{0,70}?(\d{1,2})\s*%/); if(m)add("ovh",/그/.test(m[1])?"그 밖의 사업운영경비":m[1],"그 밖의|경상비|운영\\s*경비",+m[2],m[0].slice(0,60));
  m=T.match(/간접비[^%]{0,40}?(\d{1,2})\s*%/); if(m)add("ind","간접비","간접비",+m[1],m[0].slice(0,60));
  m=T.match(/(\d{1,2})\s*%\s*범위\s*내에서[^.]{0,50}이월/)||T.match(/이월[^%]{0,40}?(\d{1,2})\s*%/); if(m)add("carry","전년도 이월금","",+m[1],m[0].slice(0,60),{type:"carry"});
  R.rules=rules;
  m=T.match(/(\d{1,2})\s*천만\s*원\s*이상/); R.equipThreshold=m?+m[1]*10:null;
  // 비목
  const NT=norm(T); R.budgetItems=KNOWN_ITEMS.filter(k=>NT.includes(norm(k))).sort((x,y)=>NT.indexOf(norm(x))-NT.indexOf(norm(y)));
  if(R.budgetItems.some(k=>k.length>=8)) R.budgetItems=R.budgetItems.filter(k=>k.length>=4||k==="인건비"||k==="장학금"||k==="간접비");
  // 일정
  const sch=[]; const si=lines.findIndex(l=>/향후\s*일정|추진\s*일정|세부\s*일정/.test(l));
  (si>=0?lines.slice(si,si+25):lines).forEach(l=>{ const d=l.match(/[~∼]?\s*[’'‘]\s*\d{2}\s*\.\s*\d{1,2}(?:\.\s*\d{1,2})?\.?(?:\s*[~∼-]\s*\d{1,2})?\s*월?/); if(d&&l.length<90&&sch.length<8){ const w=l.replace(d[0],"").replace(/^[ㅇ◦○▪•\-\s:]+|[:\s]+$/g,""); if(w.length>2)sch.push({d:d[0].replace(/\s+/g,""),w,s:""}); } });
  R.schedule=sch;
  R.hints={tasks:/핵심\s*과제/.test(T),kpi:/성과\s*지표/.test(T),gov:/위원회/.test(T),finance:R.budgetItems.length>0||rules.length>0};
  m=T.match(/성과\s*지표[^.]{0,40}?(\d{1,2})\s*개\s*내외/); R.kpiN=m?+m[1]:null;
  R.required=[]; if(/재학생[^.]{0,25}필수|필수[^.]{0,15}재학생/.test(T))R.required.push({match:"위원회",must:"학생",label:"재학생"}); if(/외부\s*전문가[^.]{0,25}필수|필수[^.]{0,15}외부\s*전문가/.test(T))R.required.push({match:"운영위원회|평가",must:"외부|교외",label:"외부전문가"});
  return R;
}
const TOC_RE=new RegExp("^\\s*((?:["+ROMAN+"]+(?:-\\d+)?\\.?)|(?:\\d+\\))|(?:\\d+(?:\\.\\d+){0,3}\\.?)|(?:\\[참고\\])|(?:[가-하]\\.))\\s*(.+?)\\s*(?:[·.…‥]{2,}|\\t)\\s*\\d{1,3}\\s*$");
const HEAD_RE=new RegExp("^\\s*((?:["+ROMAN+"]+(?:-\\d+)?\\.)|(?:\\d+(?:\\.\\d+){0,3}\\.?))\\s+(\\S.{1,58})$");
function secKind(title,guide,docType){
  const s=title+" "+guide.join(" ");
  if(/요약/.test(title))return {kind:"auto",src:"summary"};
  if(/이행\s*점검|핵심\s*과제\s*총괄/.test(title))return {kind:"auto",src:"tasks"};
  if(/성과\s*지표|자율\s*지표|KPI/i.test(title))return {kind:"auto",src:"kpi"};
  if(/총괄\s*체계|조직\s*구성|위원회|총괄표/.test(title)&&/거버넌스|조직|위원회|성과관리/.test(title))return {kind:"auto",src:"gov"};
  if(/사업비|투자\s*계획|예산|집행\s*(계획|실적)|비목/.test(title)&&!/전략/.test(title))return {kind:"auto",src:"budget"};
  if(/(성과|실적)[^.]{0,60}계획|계획[^.]{0,60}(성과|실적)/.test(s)||(docType==="report"&&/성과/.test(title)))return {kind:"pp",src:""};
  return {kind:"text",src:""};
}
function analyzeFormText(name,text,idx){
  const raw=text.split("\n"); const lines=raw.map(l=>l.replace(/^\s*\|\s*/,"").replace(/\s*\|\s*$/,""));
  const nm=name.replace(/\.[^.]+$/,"").replace(/\+/g," ").replace(/^\s*\(서식[^)]*\)\s*/,"").replace(/_수정$|\s작성\s*서식|\s서식(?=\(|\s|$)/g,"").replace(/\s+/g," ").trim();
  const type=/성과|평가|결과|실적|점검/.test(nm)?"report":/계획/.test(nm)?"plan":"report";
  const doc={id:"d"+(idx+1),type,name:nm,due:"",pageLimit:null,cover:[nm],sections:[]};
  const T=text.replace(/\s+/g," ");
  let m=T.match(/(?:\d{4}\.\s*)?(\d{1,2})\.\s*(\d{1,2})\.\s*\(([월화수목금토일])\)\s*(\d{1,2}:\d{2})/); if(m)doc.due=`${m[1]}.${m[2]}.(${m[3]}) ${m[4]}`;
  m=T.match(/(?:본문|분량|보고서)[^.\n]{0,30}?(\d{2,3})\s*(?:쪽|페이지|page|p)\s*이내/i); if(m)doc.pageLimit=+m[1];
  // 1) 목차 (쪽번호가 붙은 줄) + 목차 구간 안의 장 제목(Ⅰ. …)
  let toc=[]; let tocStart=-1, tocEnd=-1;
  lines.forEach((l,i)=>{ const t=l.match(TOC_RE); if(t&&l.length<120){ toc.push({no:t[1].replace(/\.$/,""),title:t[2].replace(/[·.…‥\s]+$/,"").trim(),line:i}); if(tocStart<0)tocStart=i; tocEnd=i; } });
  if(toc.length>=4){ const RL=new RegExp("^\\s*(["+ROMAN+"]+)\\.\\s*(\\S.{1,50})$"); for(let i=Math.max(0,tocStart-3);i<=tocEnd;i++){ const t=lines[i].match(RL); if(t&&!toc.find(x=>x.line===i))toc.push({no:t[1],title:t[2].trim(),line:i}); } toc.sort((x,y)=>x.line-y.line); }
  toc=toc.filter(x=>x.title.length>1);
  let heads=toc;
  if(toc.length<4){ heads=[]; lines.forEach((l,i)=>{ const t=l.match(HEAD_RE); if(t&&!/[다음함임됨]\.?$/.test(t[2])&&!/^\d+$/.test(t[2])){ const no=t[1].replace(/\.$/,""); if(!heads.find(h=>h.no===no&&norm(h.title)===norm(t[2])))heads.push({no,title:t[2].trim(),line:i}); } }); tocEnd=-1; }
  heads=heads.filter(h=>(!/^(표지|목차|간지)$/.test(norm(h.title)))&&!/O{3}|ㅇ{3}|○{3}/.test(h.title));
  // 레벨·계층 번호
  let prefix="", prefixLvl=0, lastNum="", lastLvl=1; const secs=[];
  heads.forEach((h,i)=>{ let lvl=1, no=h.no; const rm=h.no.match(new RegExp("^(["+ROMAN+"]+)(?:-(\\d+))?$"));
    if(rm){ prefix=h.no; lvl=rm[2]?2:1; prefixLvl=lvl; lastNum=""; }
    else if(/^\d+\)$/.test(h.no)){ lvl=lastLvl+1; no=(lastNum?lastNum+"-":"")+h.no; }
    else if(/^\d/.test(h.no)){ const segs=h.no.split(".").filter(Boolean); lvl=segs.length+(prefix?prefixLvl:0); no=prefix?prefix+(prefix.includes("-")?".":"-")+segs.join("."):segs.join("."); lastNum=no; }
    else if(/^\[/.test(h.no)){ lvl=prefix?prefixLvl+1:1; }
    else { lvl=lastLvl+1; }
    if(!/^\d+\)$/.test(h.no))lastLvl=lvl;
    secs.push({id:"s"+(i+1),no,title:h.title,lvl,line:h.line,guide:[],keys:0}); });
  // 2) 본문에서 작성방법 수집
  const start=tocEnd+1; let cur=null; let gi=-1;
  const keyOf=s=>norm(s.title).slice(0,14);
  for(let i=start;i<lines.length;i++){ const l=lines[i].trim(); if(!l)continue;
    const nl=norm(l); const hit=l.length<90&&secs.find(s=>s.title.length>=3&&nl.includes(keyOf(s))&&nl.length<=norm(s.no+s.title).length+10); if(hit&&!/【/.test(l)){cur=hit;gi=-1;continue;}
    if(/【\s*작성\s*방법\s*】|【\s*작성\s*요령/.test(l)){ gi=0; continue; }
    if(/【\s*증빙/.test(l)){ gi=0; if(cur)cur.guide.push("증빙 필수: "+l.replace(/.*】/,"").trim().slice(0,70)); continue; }
    if(gi>=0&&cur){ if(/^【/.test(l)||gi>45){gi=-1;continue;} gi++; const k=l.match(/핵심\s*과제를?\s*(\d)\s*개/); if(k)cur.keys=+k[1];
      const g=l.replace(/^[\s\d)·ㆍ\-※*◦○▪]+/,"").trim(); if(g.length>5&&cur.guide.length<6&&!cur.guide.includes(g.slice(0,90)))cur.guide.push(g.slice(0,90)); }
  }
  // 3) 종류 판정 : 하위 항목이 있으면 제목만, 같은 공통 데이터 표는 한 번만
  const seen={};
  secs.forEach((s,i)=>{ const nx=secs[i+1]; const hasChild=nx&&nx.lvl>s.lvl; const k=secKind(s.title,s.guide,type);
    if(hasChild){ s.kind="head"; s.src=""; } else { s.kind=(k.kind==="pp"&&type==="plan")?"text":k.kind; s.src=k.src; if(s.kind==="auto"){ if(seen[s.src]){ s.kind=s.src==="kpi"||s.src==="gov"?"text":"head"; s.src=""; } else seen[s.src]=1; } }
    s.group=""; s.evalArea=""; s.from=[]; s.onlyVariant=""; delete s.line; });
  doc.sections=secs;
  return doc;
}
function linkProfile(p){
  const reps=p.docs.filter(d=>d.type==="report"), plans=p.docs.filter(d=>d.type==="plan");
  // 핵심과제 그룹: 작성방법에 "핵심과제 n개"가 있는 항목 (첫 보고서 기준, 중복 제거)
  const groups=[]; reps.forEach(d=>d.sections.forEach(s=>{ if(s.keys>0){ s.group=s.title.replace(/[’']\d{2}학년도\s*/,"").replace(/을\s*성공적으로\s*추진하기\s*위한\s*/,"").slice(0,18).trim(); if(s.kind==="text"||s.kind==="head")s.kind="pp"; if(!groups.find(g=>g.area===s.group))groups.push({area:s.group,sec:s.no.replace(/^[ⅠⅡⅢⅣⅤ]+-/,""),n:s.keys,variant:""}); } }));
  if(groups.length){ p.modules.tasks.on=true; p.modules.tasks.groups=groups; }
  // 평가영역 → 보고서 항목
  reps.forEach(d=>d.sections.forEach(s=>{ if(s.kind==="head")return; let best=null,bs=0; p.evalAreas.forEach(a=>{ const sc=overlap(s.title+" "+s.guide.join(" "),a.name+" "+a.desc+" "+(a.focus||[]).join(" ")); if(sc>bs){bs=sc;best=a;} });
    if(s.src==="kpi"||s.src==="gov"||/성과\s*관리|환류|성과\s*지표/.test(s.title)){ const a=p.evalAreas.find(x=>/성과\s*관리|자체|환류|지표/.test(x.name)); if(a){best=a;bs=1;} }
    else if(/모집|가산점|가점/.test(s.title)){ const a=p.evalAreas.find(x=>x.bonus); if(a){best=a;bs=1;} }
    else if(s.kind==="pp"||s.kind==="text"){ const a=p.evalAreas.filter(x=>!x.bonus&&!/성과\s*관리|자체/.test(x.name)).sort((x,y)=>y.pts-x.pts)[0]; if(a&&bs<0.3){best=a;bs=0.31;} }
    if(best&&bs>=0.3)s.evalArea=best.id; }));
  // 계획서 ↔ 짝이 되는 보고서(이름이 가장 비슷한 것)
  plans.forEach(d=>{ const partner=reps.slice().sort((x,y)=>jacc(y.name.replace(/계획|보고서|서식|성과평가/g,""),d.name.replace(/계획|보고서|서식|자율혁신/g,""))-jacc(x.name.replace(/계획|보고서|서식|성과평가/g,""),d.name.replace(/계획|보고서|서식|자율혁신/g,"")))[0]; if(!partner)return; d.partner=partner.id;
    d.sections.forEach(s=>{ if(s.kind==="head")return; const r=partner;
      if(s.kind==="auto"){ r.sections.filter(x=>x.kind==="auto"&&x.src===s.src).forEach(x=>s.from.push(r.id+":"+x.id)); return; }
      if(/세부\s*(내용|과제|추진)/.test(s.title)){ const gp=r.sections.filter(x=>x.kind==="pp"&&x.group); const pps=(gp.length?gp:r.sections.filter(x=>x.kind==="pp")).map(x=>r.id+":"+x.id); if(pps.length){s.kind="derived";s.from=pps;return;} }
      r.sections.forEach(x=>{ if(x.kind==="head"||x.kind==="auto")return; if(jacc(s.title,x.title)>=0.3||overlap(s.title,x.title)>=0.6)s.from.push(r.id+":"+x.id); }); }); });
  // 같은 계획서 안에 '세부 내용' 항목이 여러 개면 첫 항목만 모아쓰기
  plans.forEach(d=>{ let first=null; d.sections.forEach(s=>{ if(s.kind==="derived"){ if(!first)first=s; else if(s.from.join()===first.from.join()){ s.kind="head"; s.from=[]; } } }); });
  if(p.docs.some(d=>d.sections.some(s=>s.src==="kpi")))p.modules.kpi.on=true;
  if(p.docs.some(d=>d.sections.some(s=>s.src==="gov")))p.modules.gov.on=true;
  if(p.docs.some(d=>d.sections.some(s=>s.src==="budget"))||p.budgetItems.length)p.modules.finance.on=true;
  return p;
}
function ruleBasedProfile(sources,base){
  const p=Object.assign(BLANK_PROFILE(),base?clone(base):{}); p.docs=[];
  const plans=sources.filter(s=>s.role==="plan"), forms=sources.filter(s=>s.role==="form");
  if(plans.length){ const R=analyzePlanText(plans.map(s=>s.text).join("\n\n")); ["planTitle","programName","goal","period"].forEach(k=>{if(R[k])p[k]=R[k]}); if(R.evalAreas.length)p.evalAreas=R.evalAreas; if(R.rules.length)p.rules=R.rules; if(R.budgetItems.length){p.budgetItems=R.budgetItems;p.budgetPlanItems=R.budgetItems.slice();} if(R.schedule.length)p.schedule=R.schedule; if(R.equipThreshold)p.equipThreshold=R.equipThreshold;
    if(R.hints.kpi)p.modules.kpi.on=true; if(R.hints.gov)p.modules.gov.on=true; if(R.hints.finance)p.modules.finance.on=true; if(R.kpiN){p.modules.kpi.min=Math.max(1,R.kpiN-2);p.modules.kpi.max=R.kpiN+2;} if(R.required.length)p.modules.gov.required=R.required;
    if(R.evalAreas.some(a=>a.bonus))p.modules.bonus.on=false; }
  forms.forEach((s,i)=>{ const d=analyzeFormText(s.name,s.text,i); if(d.sections.length>=3)p.docs.push(d); });
  const FT=forms.map(s=>s.text).join(" ").replace(/\s+/g," "); const em=FT.match(/(\d{1,2})\s*천만\s*원\s*이상/); if(em&&!p.equipThreshold)p.equipThreshold=+em[1]*10;
  p.docs.forEach(d=>{ if(d.due)p.schedule.push({d:d.due,w:d.name+" 제출",s:""}); });
  // 같은 문서명이 여러 개(기존/신규 등)면 유지하되 구분 표시
  return linkProfile(p);
}

/* =====================================================================
   6. Claude 분석 (sample 기능이 있는 보기에서)
   ===================================================================== */
let SAMPLE=null; let sampleChecked=false;
async function getSample(){ if(sampleChecked)return SAMPLE; sampleChecked=true; try{ if(window.claude&&window.claude.use)SAMPLE=await window.claude.use("sample"); }catch(e){SAMPLE=null} return SAMPLE; }
function pickLines(text,max,kw){ if(text.length<=max)return text; const L=text.split("\n"); const keep=[]; let len=0; const re=kw||/평가|배점|지표|과제|목표|기준값|목푯값|예산|비목|집행|%|백만|위원회|작성방법|제출|쪽 이내|[ⅠⅡⅢⅣⅤ]\.|^\s*\d+(\.\d+)*\.?\s/;
  L.forEach((l,i)=>{ if(len>max)return; if(i<40||re.test(l)){ keep.push(l.slice(0,220)); len+=Math.min(l.length,220)+1; } }); return keep.join("\n"); }
const PROFILE_SCHEMA=`{"programName":"사업명","planTitle":"기본계획 제목","goal":"사업 목표 한 문장","period":"사업기간","orgLabel":"대학|기관 등 수행기관 호칭","years":{"prev":"’25","cur":"’26","next":"’27"},"variantLabel":"권역 등 구분명 또는 빈 문자열","variants":["수도권",...],
"evalAreas":[{"id":"E1","name":"평가영역","pts":80,"how":"평가방식","desc":"평가내용 한 문장","focus":["평가 주안점(최대 3개)"],"bonus":false}],
"rules":[{"id":"r1","label":"인건비","kw":"비목명 매칭 정규식","max":25,"altMax":30,"altLabel":"예외조건 또는 null","basis":"근거 문구 짧게","type":"limit|carry"}],
"equipThreshold":30,"budgetItems":["비목1",...],"budgetAreas":["영역1",...],
"schedule":[{"d":"’26.6.23","w":"할 일","s":"비고"}],
"modules":{"tasks":{"on":true,"label":"핵심과제 등 명칭","groups":[{"area":"세부영역명","sec":"3.1.1","n":2,"variant":""}]},"kpi":{"on":true,"label":"성과지표 명칭","min":3,"max":7},"gov":{"on":true,"label":"명칭","required":[{"match":"위원회","must":"학생","label":"재학생"}]},"finance":{"on":true,"label":"재정·집행기준"}},
"docs":[{"id":"d1","type":"report|plan","name":"문서명","due":"제출기한","pageLimit":40,"cover":["표지 문구"],"sections":[{"id":"s1","no":"Ⅰ-1","title":"목차 제목","kind":"head|text|pp|auto|derived","src":"tasks|kpi|gov|budget|summary|빈문자열","group":"핵심과제 세부영역명 또는 빈 문자열","keys":0,"evalArea":"E1 또는 빈 문자열","onlyVariant":"","guide":["작성방법 요지(최대 3개, 각 60자 이내)"],"from":["d1:s3"]}]}]}`;
function profilePrompt(sources){
  const plans=sources.filter(s=>s.role==="plan"), forms=sources.filter(s=>s.role==="form");
  const per=forms.length?Math.floor(42000/forms.length):0;
  return `너는 한국 정부 재정지원사업(대학·기관 대상) 문서 구조 분석가다. 아래 [기본계획]과 [작성 서식]을 읽고, 보고서 작성 자동화 플랫폼이 쓸 "사업 프로필" JSON 하나만 답하라. 설명 문장 없이 JSON만.

스키마:
${PROFILE_SCHEMA}

규칙:
- docs: 실제 작성할 본문 서식만(표지·제출서·동의서 제외). type은 실적·성과·평가·결과 보고서면 "report", 사업계획서·자율계획서면 "plan".
- sections: 서식 목차 순서 그대로. 하위 항목이 있는 상위 제목은 kind "head". 전년도 성과와 향후 계획을 함께 쓰는 항목은 "pp", 서술형은 "text", 표·수치가 공통 데이터(핵심과제 이행점검/총괄표=tasks, 성과지표=kpi, 조직·위원회=gov, 사업비·재정=budget, 요약표=summary)로 채워지면 "auto"와 src. 계획서에서 보고서의 여러 '계획' 항목을 모아 세부과제로 쓰는 항목은 "derived".
- from: 계획서 항목이 반영해야 하는 보고서 항목 id들("문서id:항목id"). 서식에 '○○보고서 내용 반영·연계' 지시가 있으면 반드시 연결.
- evalArea: 보고서 항목이 평가되는 기본계획 평가영역 id.
- 작성방법에 '핵심과제 n개 지정'이 있으면 그 항목 keys=n, group=세부영역명, modules.tasks.groups에 추가. 지역·유형별로 다르면 variant 사용.
- rules: 기본계획 사업비 집행기준의 비목별 한도(%)와 이월 한도. kw는 비목명을 찾는 짧은 정규식.
- 값을 모르면 빈 문자열·빈 배열·null. 추측으로 수치를 만들지 말 것.

[기본계획]
${plans.map(s=>"### "+s.name+"\n"+pickLines(s.text,Math.floor(26000/plans.length))).join("\n\n")||"(없음)"}

[작성 서식]
${forms.map(s=>"### "+s.name+"\n"+pickLines(s.text,per)).join("\n\n")||"(없음)"}`;
}
function sanitizeProfile(x,fallback){
  const p=Object.assign(BLANK_PROFILE(),fallback?clone(fallback):{});
  if(!x||typeof x!=="object")return p;
  ["programName","planTitle","goal","period","orgLabel","variantLabel","grades"].forEach(k=>{if(typeof x[k]==="string"&&x[k])p[k]=x[k]});
  if(x.years&&typeof x.years==="object")p.years=Object.assign(p.years,x.years);
  if(Array.isArray(x.variants))p.variants=x.variants.filter(v=>typeof v==="string");
  if(Array.isArray(x.evalAreas)&&x.evalAreas.length)p.evalAreas=x.evalAreas.map((a,i)=>({id:String(a.id||"E"+(i+1)),name:String(a.name||""),pts:n(a.pts),how:String(a.how||""),desc:String(a.desc||""),focus:Array.isArray(a.focus)?a.focus.map(String).slice(0,4):[],bonus:!!a.bonus,onlyVariant:String(a.onlyVariant||"")}));
  if(Array.isArray(x.rules))p.rules=x.rules.filter(r=>r&&r.label).map((r,i)=>({id:String(r.id||"r"+(i+1)),label:String(r.label),kw:String(r.kw||""),max:r.max==null?null:n(r.max),altMax:r.altMax==null?null:n(r.altMax),altLabel:r.altLabel||"",basis:String(r.basis||""),type:r.type==="carry"?"carry":"limit"}));
  if(x.equipThreshold!=null)p.equipThreshold=n(x.equipThreshold)||null;
  if(Array.isArray(x.budgetItems)&&x.budgetItems.length){p.budgetItems=x.budgetItems.map(String);p.budgetPlanItems=p.budgetItems.slice();}
  if(Array.isArray(x.budgetAreas))p.budgetAreas=x.budgetAreas.map(String);
  if(Array.isArray(x.schedule))p.schedule=x.schedule.map(s=>({d:String(s.d||""),w:String(s.w||""),s:String(s.s||"")}));
  if(x.modules)["tasks","kpi","gov","finance","bonus"].forEach(k=>{const m=x.modules[k];if(m)Object.assign(p.modules[k],m,{on:!!m.on});});
  if(Array.isArray(p.modules.tasks.groups))p.modules.tasks.groups=p.modules.tasks.groups.map(g=>({area:String(g.area||""),sec:String(g.sec||""),n:n(g.n)||1,variant:String(g.variant||"")}));
  if(Array.isArray(x.docs)&&x.docs.length){ const ids=new Set(); p.docs=x.docs.map((d,i)=>{ let id=String(d.id||"d"+(i+1)).replace(/[^\w-]/g,"")||"d"+(i+1); while(ids.has(id))id+="x"; ids.add(id); const sids=new Set();
    return {id,type:d.type==="plan"?"plan":"report",name:String(d.name||"문서"+(i+1)),due:String(d.due||""),pageLimit:d.pageLimit?n(d.pageLimit):null,cover:Array.isArray(d.cover)?d.cover.map(String):[String(d.name||"")],
      sections:(d.sections||[]).map((s,j)=>{ let sid=String(s.id||"s"+(j+1)).replace(/[^\w-]/g,"")||"s"+(j+1); while(sids.has(sid))sid+="x"; sids.add(sid);
        return {id:sid,no:String(s.no||""),title:String(s.title||""),kind:["head","text","pp","auto","derived"].includes(s.kind)?s.kind:"text",src:["tasks","kpi","gov","budget","summary","bonus"].includes(s.src)?s.src:"",group:String(s.group||""),keys:n(s.keys),evalArea:String(s.evalArea||""),onlyVariant:String(s.onlyVariant||""),guide:Array.isArray(s.guide)?s.guide.map(String).slice(0,6):[],from:Array.isArray(s.from)?s.from.map(String):[]}; })}; }); }
  return p;
}
function priorPrompt(sources){
  const pr=prof(); const priors=sources.filter(s=>s.role==="prior"); const per=priors.length?Math.floor(68000/priors.length):0;
  const groups=(pr.modules.tasks.groups||[]).map(g=>g.area+(g.variant?"("+g.variant+")":"")+" "+g.n+"개").join(", ");
  return `너는 정부 재정지원사업 보고서 검토자다. 아래 [전년도 제출 문서]에서 다음 작성 사이클에 필요한 공통 데이터를 뽑고, 문서 간·문서 내 불일치를 찾아라. JSON 하나만 답하라.

사업: ${pr.programName} / 평가(실적)보고서·계획서 연계 / 핵심과제 세부영역: ${groups||"(없음)"} / 비목: ${(pr.budgetItems||[]).join(", ")}

스키마:
{"meta":{"org":"기관명","addr":"","url":"","variant":"${esc(pr.variantLabel||"구분")} 값"},
"tasks":[{"group":"세부영역명(위 목록 중)","no":원문 과제번호,"name":"과제명(보고서 표기)","planName":"계획서 표기(다르면)","goal":"운영목표 한 문장","next":"${pr.years.cur} 계획 요지","next2":"${pr.years.next} 계획 요지","p1":"원문 쪽"}],
"kpi":[{"name":"지표명","st":"신규|기존|수정","unit":"","base":숫자,"t1":숫자,"t2":숫자,"t3":숫자,"formula":"산출식 원문","why":"세부지표 요지","links":"연계 과제번호들 쉼표"}],
"b1":{"비목명":금액(백만원)},
"area3":{"영역명":[전년도,금년도,차년도]},
"gov":[{"name":"조직명","func":"기능","members":"구성 요약(학생·외부 위원 수 포함)"}],
"findings":[{"lv":"bad|warn|ok|info","area":"영역","msg":"발견 내용(수치 포함)","src":"근거 위치","fix":"다음 문서 작성 시 조치"}]}

규칙: 핵심과제는 '핵심' 표시된 과제만. 숫자는 원문 그대로. 원문에 없는 값은 빈 문자열. findings에는 같은 값이 표마다 다른 경우, 산출식·과제명 표기 오류, 비목 한도 초과·편중, 필수 구성 누락 등 근거가 있는 것만 적는다.

[전년도 제출 문서]
${priors.map(s=>"### "+s.name+"\n"+pickLines(s.text,per)).join("\n\n")}`;
}

/* =====================================================================
   7. 계산 · 점검 (프로필 규칙 기반)
   ===================================================================== */
const variant=()=>dat().meta.variant||"";
const vOK=x=>!x||!x.onlyVariant||vMatch(x.onlyVariant,variant());
function vMatch(want,v){ if(!want)return true; if(want===v)return true; if(want.startsWith("비")&&v&&v!==want.slice(1))return true; return false; }
function taskGroups(){ const gs=prof().modules.tasks.groups||[]; if(!gs.some(g=>g.variant))return gs; const v=variant(); const m=gs.filter(g=>g.variant&&vMatch(g.variant,v)); return m.concat(gs.filter(g=>!g.variant)); }
function tasksBy(group){return dat().tasks.filter(t=>t.group===group)}
function keyLabel(t){const g=taskGroups().find(x=>x.area===t.group);return `${g?g.sec:""} ${prof().modules.tasks.mark||"핵심"}${tasksBy(t.group).indexOf(t)+1}`}
function itemsSum(map,kw,cols){ if(!kw)return 0; const re=new RegExp(kw); return Object.entries(map).filter(([k])=>re.test(k)).reduce((s,[,v])=>s+(Array.isArray(v)?cols.reduce((a,c)=>a+n(v[c]),0):n(v.bud)),0); }
function calcB1(){ const items=prof().budgetItems||[]; const rows=items.map(k=>({name:k,bud:n((dat().b1[k]||{}).bud),exe:n((dat().b1[k]||{}).exe),exeRaw:(dat().b1[k]||{}).exe})); const tb=rows.reduce((a,r)=>a+r.bud,0),te=rows.reduce((a,r)=>a+r.exe,0); return {rows,tb,te,rate:pct(te,tb)}; }
function planItems(){const p=prof();return p.budgetPlanItems&&p.budgetPlanItems.length?p.budgetPlanItems:p.budgetItems||[]}
function calcB2(){ const ent=planItems().map(k=>{const v=dat().b2[k]||["",""];return {k,A:n(v[0]),B:n(v[1])}}); const A=ent.reduce((s,e)=>s+e.A,0),B=ent.reduce((s,e)=>s+e.B,0); return {ent,A,B,C:A+B,base:n(dat().meta.budgetCur)||A}; }
function ruleEval(rule,which){
  if(rule.type==="carry"){ const tp=n(dat().meta.totalPrev); const c=n(dat().meta.carry); if(!tp||!c)return null; return {val:pct(c,tp),lim:rule.max}; }
  if(!rule.kw)return null;
  if(which==="b1"){ const b=calcB1(); if(!b.tb)return null; const re=new RegExp(rule.kw); const s=b.rows.filter(r=>re.test(r.name)).reduce((a,r)=>a+r.bud,0); if(!b.rows.some(r=>re.test(r.name)))return null; return {val:pct(s,b.tb),lim:dat().meta.flagPrev==="O"&&rule.altMax?rule.altMax:rule.max}; }
  const b=calcB2(); if(!b.C)return null; const re=new RegExp(rule.kw); if(!b.ent.some(e=>re.test(e.k)))return null; const s=b.ent.filter(e=>re.test(e.k)).reduce((a,e)=>a+e.A+e.B,0); return {val:pct(s,b.base),lim:dat().meta.flag==="O"&&rule.altMax?rule.altMax:rule.max};
}
function calcBonus(){ const m=prof().modules.bonus; const b=dat().bonus; const tot=n(b.total); const mo=tot-(b.ex||[]).reduce((s,x)=>s+n(x),0); const r1=pct(n(b.t1),mo), r2=pct(n(b.t2),mo), sum=r1+r2;
  const re=m.rowEdges||[], ce=m.colEdges||[]; const ri=re.filter(e=>r1>=e).length, ci=ce.filter(e=>sum>=e).length; const pts=(isFinite(sum)&&mo>0&&m.table&&m.table[ri])?m.table[ri][ci]:null;
  return {mo,r1,r2,sum,ri,ci,pts,selfR:pct(n((b.ex||[])[m.selfIdx||0]),tot)}; }
function kpiAch(k){const t=n(k.t1),a=n(k.act); if(!t||k.act===""||k.act==null)return NaN; const lower=new RegExp(prof().modules.kpi.lowerKw||"감소|탈락률").test(k.name); return lower?(n(k.base)-a)/(n(k.base)-t)*100:a/t*100;}
const textFilled=t=>(t||"").trim().length>=20;
function secData(docId,secId){ const d=dat().sec; d[docId]=d[docId]||{}; d[docId][secId]=d[docId][secId]||{}; return d[docId][secId]; }
function docById(id){return prof().docs.find(d=>d.id===id)}
function secRef(ref){const [d,s]=String(ref).split(":");const doc=docById(d);const sec=doc&&doc.sections.find(x=>x.id===s);return sec?{doc,sec}:null}
function visibleSecs(doc){return doc.sections.filter(vOK)}
function taskCheck(){ const out=[];let ok=true; const gs=taskGroups();
  gs.forEach(a=>{const c=tasksBy(a.area).length; if(c!==a.n){ok=false;out.push(`${a.sec} ${a.area}: ${c}/${a.n}개`)}});
  const nr=dat().tasks.filter(t=>!t.result||!t.status); if(nr.length){ok=false;out.push(`이행 실적·달성 여부 미기재: ${nr.map(t=>"과제"+(t.no||dat().tasks.indexOf(t)+1)).join(", ")}`)}
  return {ok,out,need:gs.reduce((s,a)=>s+a.n,0)}; }
function secStatus(doc,s){
  const d=secData(doc.id,s.id);
  if(s.kind==="head")return "";
  if(s.kind==="text")return textFilled(d.text)||(s.from.length&&draftFrom(s))?"ok":d.draft?"warn":"bad";
  if(s.kind==="pp"){ const fs=prof().ppFields.filter(f=>!f.short); const c=fs.filter(f=>textFilled(d[f.k])).length; const keysOk=!s.group||tasksBy(s.group).length>=(s.keys||0); return c===fs.length&&keysOk?"ok":c>0||d.draft?"warn":"bad"; }
  if(s.kind==="derived")return s.from.every(r=>{const x=secRef(r);return !x||!vOK(x.sec)||textFilled(secData(x.doc.id,x.sec.id).f2)})?"ok":"warn";
  if(s.src==="tasks")return taskCheck().ok?"ok":"warn";
  if(s.src==="kpi")return dat().kpi.length&&dat().kpi.every(k=>k.name&&k.t1!==""&&k.act!==""&&k.act!=null)?"ok":"warn";
  if(s.src==="gov")return dat().gov.length?"ok":"bad";
  if(s.src==="budget"){const b=calcB1();return b.tb&&Math.abs(b.tb-n(dat().meta.totalPrev))<1?"ok":"warn"}
  return "warn";
}
function draftFrom(s){ return s.from.map(r=>{const x=secRef(r);if(!x)return "";const d=secData(x.doc.id,x.sec.id);return d.text||d.f1||""}).filter(Boolean).join("\n\n"); }
function checks(){
  const L=[]; const add=(lv,area,msg,go)=>L.push({lv,area,msg,go}); const pr=prof(), D=dat(), M=pr.modules;
  if(!pr.docs.length) add("bad","사업 구조","문서 서식이 아직 없습니다 — ‘사업 구조 설정’에서 서식을 올리거나 문서를 추가하세요","setup");
  pr.evalAreas.filter(vOK).forEach(a=>{ if(!pr.docs.some(d=>d.sections.some(s=>s.evalArea===a.id))) add("warn","평가 매칭",`평가영역 ‘${a.name}’에 연결된 보고서 항목이 없음`,"setup"); });
  if(M.tasks.on){ const tc=taskCheck(); add(tc.ok?"ok":"bad",M.tasks.label,tc.ok?`세부영역별 ${M.tasks.label} ${tc.need}개 지정·실적 기재 완료`:tc.out.join(" · "),"tasks");
    D.tasks.forEach(t=>{ if(t.planName&&norm(t.planName)!==norm(t.name)) add("warn",M.tasks.label,`과제명 불일치: ‘${t.name}’ ↔ 계획서 ‘${t.planName}’`,"tasks"); }); }
  pr.docs.forEach(doc=>visibleSecs(doc).forEach(s=>{ const d=secData(doc.id,s.id);
    if(s.kind==="pp"){ const f2=pr.ppFields.find(f=>f.k==="f2"); if(!textFilled(d.f2)) add("bad",doc.name,`${s.no} ${s.title}: ${f2?f2.l.split("(")[0].trim():"계획"} 미작성 → 다음 문서로 이어지지 않음`,"doc:"+doc.id+":"+s.id); else if(!d.basis) add("warn",doc.name,`${s.no}: 계획의 근거(규정·결재문서) 미기재`,"doc:"+doc.id+":"+s.id); }
    if(s.kind==="text"&&!textFilled(d.text)&&!(s.from.length&&draftFrom(s))) add("warn",doc.name,`${s.no} ${s.title} 미작성${d.draft?" — 내용(안) 준비됨, 확인 후 적용":" — 내용(안) 제시 기능 사용 가능"}`,"doc:"+doc.id+":"+s.id); }));
  pr.docs.forEach(doc=>{ if(doc.pageLimit){ const chars=(docHTML(doc).replace(/<[^>]+>/g,"").length); const pages=chars/1400; if(pages>doc.pageLimit) add("warn",doc.name,`예상 분량 약 ${Math.round(pages)}쪽 — 한도 ${doc.pageLimit}쪽 초과 가능`,"out"); } });
  if(M.kpi.on){ const kc=D.kpi.length; add(kc>=(M.kpi.min||1)&&kc<=(M.kpi.max||99)?"ok":"warn",M.kpi.label,`지표 ${kc}개 (권장 ${M.kpi.min}~${M.kpi.max}개)`,"kpi");
    D.kpi.forEach(k=>{ if(k.base===""||k.base==null) add("bad",M.kpi.label,`‘${k.name}’ 기준값 없음`,"kpi");
      const a=kpiAch(k); if(isFinite(a)&&a<100) add("warn",M.kpi.label,`‘${k.name}’ 달성도 ${f1(a)}% — 미달성 사유·개선방안 기술`,"kpi");
      if(k.src&&["base","t1","t2","t3"].some(f=>k.src[f]!==""&&k.src[f]!=null&&Math.abs(n(k[f])-n(k.src[f]))>1e-9)) add("bad",M.kpi.label,`‘${k.name}’ 기준·목표값이 확정값(${["base","t1","t2","t3"].map(f=>f1(n(k.src[f]))).join("/")})과 다름 — 임의 변경 불가`,"kpi");
      const fm=(k.formula||"").split("=")[0].trim(); if(fm&&fm!==k.name&&D.kpi.some(o=>o!==k&&o.name===fm)) add("bad",M.kpi.label,`‘${k.name}’ 산출식이 다른 지표명(‘${fm}’)으로 시작 — 복사 오류`,"kpi");
      if(!k.unit||/^n\/?a$/i.test(String(k.unit).trim())) add("warn",M.kpi.label,`‘${k.name}’ 단위 미기재(${k.unit||"공란"})`,"kpi");
      if(k.act===""||k.act==null) add("warn",M.kpi.label,`‘${k.name}’ 실적값 미입력`,"kpi"); });
    if(M.tasks.on&&D.kpi.some(k=>k.links)){ const linked=new Set(D.kpi.flatMap(k=>String(k.links||"").split(/[,\s]+/).filter(Boolean))); const nl=D.tasks.filter(t=>t.no&&!linked.has(String(t.no))); if(nl.length) add("warn",M.kpi.label,`연계 지표가 없는 ${M.tasks.label}: ${nl.map(t=>"과제"+t.no).join(", ")}`,"kpi"); } }
  if(M.finance.on){ const b1=calcB1(), tp=n(D.meta.totalPrev);
    if(pr.budgetItems.length) add(tp&&Math.abs(b1.tb-tp)<1?"ok":"bad","전년도 재정",tp?`비목별 예산 합계 ${won(b1.tb)} / 최종 사업비 ${won(tp)}백만원 ${Math.abs(b1.tb-tp)<1?"일치":"불일치"}`:"전년도 최종 사업비 총액 미입력","finance");
    pr.rules.filter(r=>r.type!=="carry").forEach(r=>{ const e=ruleEval(r,"b1"); if(e) add(e.val<=e.lim?"ok":"bad","전년도 재정",`${r.label} ${f1(e.val)}% (한도 ${e.lim}%)`,"finance"); });
    if(b1.tb){ b1.rows.forEach(r=>{const sh=pct(r.bud,b1.tb); if(sh>(pr.concentration||40)) add("warn","전년도 재정",`${r.name} 비중 ${f1(sh)}% — 특정 비목 편중, 편성 사유 설명 필요`,"finance")}); if(b1.rows.every(r=>r.exeRaw===""||r.exeRaw==null)) add("warn","전년도 재정","집행액 미입력 — 집행률 산출 불가","finance"); }
    const b2=calcB2();
    if(!b2.C||!n(D.meta.budgetCur)) add("warn","금년도 재정",`금년도 사업비·비목 미입력 — ${pr.rules.filter(r=>r.type!=="carry").map(r=>r.label+" "+r.max+"%").join(", ")||"집행기준"} 검증 대기`,"finance");
    else { pr.rules.forEach(r=>{ const e=ruleEval(r,"b2"); if(e) add(e.val<=e.lim?"ok":r.type==="carry"?"warn":"bad","금년도 재정",`${r.label} ${f1(e.val)}% (한도 ${e.lim}%${r.altMax&&D.meta.flag==="O"?", "+r.altLabel:""})`,"finance"); });
      const exp=n(D.meta.budgetCur)+n(D.meta.carry); add(Math.abs(b2.C-exp)<1?"ok":"bad","금년도 재정",`비목 합계 ${won(b2.C)} / 사업비+이월금 ${won(exp)}백만원`,"finance"); }
    const a3=Object.values(D.area3); if(a3.length&&a3.some(v=>n(v[0]))&&a3.every(v=>n(v[0])===n(v[1])&&n(v[1])===n(v[2]))) add("warn","금년도 재정","영역별 예산이 연도마다 같은 값 — 확정 사업비로 재산정 필요","finance");
    if(pr.equipThreshold){ const big=D.equip.filter(e=>n(e.unit)>=pr.equipThreshold); if(big.length) add("warn","장비",`${won(pr.equipThreshold)}백만원 이상 장비 ${big.length}건 — 사전 승인·집행계획 필수`,"finance"); } }
  if(M.bonus&&M.bonus.on&&vOK(M.bonus)&&M.bonus.table){ const bo=calcBonus(); add(bo.pts!=null?"ok":"warn",M.bonus.label,bo.pts!=null?`${M.bonus.rowLabel} ${f1(bo.r1)}% · ${M.bonus.colLabel} ${f1(bo.sum)}% → 예상 ${bo.pts}점`:"인원 미입력","bonus"); if(M.bonus.selfMax&&bo.selfR>M.bonus.selfMax) add("bad",M.bonus.label,`자율 제외 ${f1(bo.selfR)}% — ${M.bonus.selfMax}% 이내`,"bonus"); }
  if(M.gov.on){ (M.gov.required||[]).forEach(rq=>{ const re=new RegExp(rq.match), must=new RegExp(rq.must); const g=D.gov.filter(x=>re.test(x.name)); const miss=g.filter(x=>!must.test(x.members||"")); if(g.length) add(miss.length?"bad":"ok",M.gov.label,miss.length?`${rq.label} 미포함: ${miss.map(x=>x.name).join(", ")}`:`${rq.label} 포함(${g.map(x=>x.name).join(", ")})`,"gov"); }); if(!D.gov.length) add("warn",M.gov.label,"조직 미입력","gov"); }
  return L;
}

/* =====================================================================
   8. 문서 생성 (프로필의 목차 순서대로)
   ===================================================================== */
const ORG=()=>dat().meta.org||"○○기관";
const para=t=>t&&t.trim()?`<p class="pre">${esc(t)}</p>`:`<p class="empty">[작성 필요]</p>`;
function paraD(d,k,fallback){ const v=d[k]||fallback; if(v&&v.trim())return `<p class="pre">${esc(v)}</p>`; const dv=d.draft&&d.draft.fields&&d.draft.fields[k]; if(SHOWDRAFT&&dv)return `<div class="draft"><span class="dlabel">내용(안)</span><p class="pre">${esc(dv)}</p></div>`; return `<p class="empty">[작성 필요]</p>`; }
function tblTasksCheck(){ const y=prof().years; return `<table><tr><th>과제</th><th>계획 목표<br>(${esc(y.prev)} 보고서 기준)</th><th>쪽</th><th>이행 실적</th><th>쪽</th><th>달성 여부</th><th>환류</th></tr>${dat().tasks.map(t=>`<tr><td>과제${esc(t.no||"")}<br>(${esc(t.name)})<br>※ ${esc(keyLabel(t))}</td><td>${esc(t.goal)}</td><td>${esc(t.p1)}</td><td>${t.result?esc(t.result):'<span class="empty">[작성 필요]</span>'}</td><td>${esc(t.p2)}</td><td>${esc(t.status)}</td><td>${esc(t.fb)}</td></tr>`).join("")}</table>`+
  (dat().tasks.some(t=>t.status&&t.status!=="달성")?`<h4>목표 미달 시 원인 분석</h4>${dat().tasks.filter(t=>t.status&&t.status!=="달성").map(t=>`<p>(과제${esc(t.no)}) ${esc(t.name)} — ${esc(t.status)} · 환류: ${esc(t.fb)} · 보완: ${esc(t.next)}</p>`).join("")}`:""); }
function tblTasksSummary(){ return `<table><tr><th colspan="2">총괄표</th><th>계획 목표</th><th>보고서 쪽</th><th>계획서 쪽</th></tr>${taskGroups().map(a=>{const ts=tasksBy(a.area);if(!ts.length)return `<tr><td>${esc(a.area)}</td><td>-</td><td>미설정</td><td></td><td></td></tr>`;return ts.map((t,j)=>`<tr>${j===0?`<td rowspan="${ts.length}">${esc(a.area)}</td>`:""}<td>과제${esc(t.no)}(${esc(t.name)})<br>※ ${esc(keyLabel(t))}</td><td>${esc(t.next||t.goal)}</td><td>${esc(t.p2)}</td><td>${esc(t.p3||"p.00")}</td></tr>`).join("")}).join("")}</table>`; }
function tblKpi(kind){ const K=dat().kpi; const rows=K.map((k,i)=>{const a=kpiAch(k);return `<tr><td>${"①②③④⑤⑥⑦⑧⑨⑩"[i]||i+1}</td><td>${esc(k.name)}(${esc(k.st)})</td><td>${esc(k.unit)}</td><td class="n">${f1(n(k.base))}</td><td class="n">${f1(n(k.t1))}</td><td class="n">${f1(n(k.t2))}</td><td class="n">${f1(n(k.t3))}</td><td class="n">${k.act===""||k.act==null?"":f1(n(k.act))}</td><td class="n">${kind==="report"?f1(a):(n(k.base)?f1(n(k.t3)/n(k.base)*100):"-")}</td></tr>`}).join("");
  const av=K.map(kpiAch).filter(isFinite); return `<table><tr><th></th><th>지표명</th><th>단위</th><th>기준값</th><th>1차 목표</th><th>2차 목표</th><th>3차 목표</th><th>실적</th><th>${kind==="report"?"달성도(%)":"향상률(%)"}</th></tr>${rows}${kind==="report"?`<tr><td colspan="8">평균 달성도</td><td class="n">${f1(av.length?av.reduce((a,b)=>a+b,0)/av.length:NaN)}</td></tr>`:""}</table>`+K.map((k,i)=>`<h4>${i+1}. ${esc(k.name)}</h4><table><tr><th style="width:22%">산출식</th><td>${esc(k.formula)||"<span class='empty'>[작성 필요]</span>"}</td></tr><tr><th>지표 설정 근거</th><td>${esc(k.why)||"<span class='empty'>[작성 필요]</span>"}</td></tr></table>`).join(""); }
function tblGov(){ return `<table><tr><th>연번</th><th>구분</th><th>주요기능</th><th>구성</th><th>전년도 실적</th><th>금년도 계획</th><th>주요 성과(Outcome)</th></tr>${dat().gov.map((g,i)=>`<tr><td>${i+1}</td><td>${esc(g.name)}</td><td>${esc(g.func)}</td><td>${esc(g.members)}</td><td>${esc(g.y1)}</td><td>${esc(g.y2)}</td><td>${esc(g.out)}</td></tr>`).join("")}</table>`; }
function tblB1(){ const b=calcB1(); return `<table><tr><th>비목</th><th>예산(A)</th><th>비중(%)</th><th>집행(B)</th><th>집행률(B/A,%)</th></tr>${b.rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="n">${won(r.bud)}</td><td class="n">${f1(pct(r.bud,b.tb))}</td><td class="n">${r.exeRaw===""?"":won(r.exe)}</td><td class="n">${r.exeRaw===""?"":f1(pct(r.exe,r.bud))}</td></tr>`).join("")}<tr><th>합계</th><td class="n">${won(b.tb)}</td><td class="n">100.0</td><td class="n">${won(b.te)}</td><td class="n">${f1(b.rate)}</td></tr></table>`; }
function tblArea(){ const a=dat().area3, ys=prof().budgetYears; const ks=prof().budgetAreas.filter(k=>a[k]); if(!ks.length)return ""; const sum=j=>ks.reduce((s,k)=>s+n(a[k][j]),0); return `<table><tr><th>영역</th>${ys.map(y=>`<th>${esc(y)}</th>`).join("")}</tr>${ks.map(k=>`<tr><td>${esc(k)}</td>${[0,1,2].map(j=>`<td class="n">${won(a[k][j])}</td>`).join("")}</tr>`).join("")}<tr><th>계</th>${[0,1,2].map(j=>`<td class="n">${won(sum(j))}</td>`).join("")}</tr></table>`; }
function tblB2(){ const b=calcB2(); if(!b.ent.length)return ""; return `<table><tr><th>비목명</th><th>당해연도(A)</th><th>이월금(B)</th><th>합계(C)</th><th>총액 대비(%)</th><th>사업비 대비(%)</th></tr>${b.ent.map(e=>`<tr><td>${esc(e.k)}</td><td class="n">${won(e.A)}</td><td class="n">${won(e.B)}</td><td class="n">${won(e.A+e.B)}</td><td class="n">${f1(pct(e.A+e.B,b.C))}</td><td class="n">${f1(pct(e.A+e.B,b.base))}</td></tr>`).join("")}<tr><th>총계</th><td class="n">${won(b.A)}</td><td class="n">${won(b.B)}</td><td class="n">${won(b.C)}</td><td class="n">100.0</td><td></td></tr></table>`; }
function tblEquip(){ const th=prof().equipThreshold; if(!th)return ""; const big=dat().equip.filter(e=>n(e.unit)>=th); return `<h4>장비 및 기자재 집행 계획 (${won(th)}백만원 이상)</h4>`+(big.length?`<table><tr><th>연번</th><th>장비명</th><th>활용목적</th><th>산출 내역</th></tr>${big.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.name)}</td><td>${esc(e.purpose)}</td><td>${won(e.unit)}백만원 × ${esc(e.qty)}식 = ${won(n(e.unit)*n(e.qty))}백만원</td></tr>`).join("")}</table>`:"<p>해당 없음</p>"); }
function tblBonus(){ const m=prof().modules.bonus; if(!m||!m.on||!vOK(m))return ""; const bo=calcBonus(); return `<table><tr><th>산정 기준</th><th>모수</th><th>${esc(m.rowLabel)}</th><th>${esc(m.colLabel)}</th><th>예상 가점</th></tr><tr><td>${esc(dat().bonus.scope)} ${esc(dat().bonus.year||"")}</td><td class="n">${won(bo.mo)}</td><td class="n">${f1(bo.r1)}%</td><td class="n">${f1(bo.sum)}%</td><td class="n">${bo.pts==null?"-":bo.pts+"점"}</td></tr></table>`; }
function autoHTML(src,doc){ if(src==="tasks")return doc.type==="report"?tblTasksCheck():tblTasksSummary(); if(src==="kpi")return tblKpi(doc.type); if(src==="gov")return tblGov(); if(src==="budget")return doc.type==="report"?tblB1():tblArea()+tblB2()+tblEquip(); if(src==="summary")return (prof().modules.finance.on?"<h4>재정투자 현황(백만원)</h4>"+tblB1():"")+(prof().modules.kpi.on?"<h4>"+esc(prof().modules.kpi.label)+" 달성도</h4>"+tblKpi("report").split("<h4>")[0]:""); if(src==="bonus")return tblBonus(); return ""; }
function derivedHTML(s){ const pr=prof(); let h=""; s.from.forEach(r=>{ const x=secRef(r); if(!x||!vOK(x.sec))return; const d=secData(x.doc.id,x.sec.id); const ts=x.sec.group?tasksBy(x.sec.group):[];
  if(ts.length) ts.forEach(t=>{ h+=`<h4>세부 과제 : ${esc(t.name)}<span class="kmark">${esc(pr.modules.tasks.mark||"핵심")}</span> <small>[${esc(x.sec.no)} ${esc(x.sec.title)}]</small></h4><p><b>가. 추진배경 및 목표</b></p>${para(t.goal)}<p><b>나. 중기 추진계획 및 ${esc(pr.years.cur)} 세부 추진계획</b></p><table><tr><th style="width:18%">${esc(pr.years.prev)}(실적)</th><td>${esc(t.result)}</td></tr><tr><th>${esc(pr.years.cur)}</th><td class="pre">${esc([t.next,d.f2].filter(Boolean).join("\n"))}</td></tr><tr><th>${esc(pr.years.next)}</th><td class="pre">${esc([t.next2,d.f3].filter(Boolean).join("\n"))}</td></tr><tr><th>근거</th><td>${esc(d.basis)}</td></tr></table>`; });
  else if(d.f2||d.f3) h+=`<h4>${esc(x.sec.title)}</h4><table><tr><th style="width:18%">${esc(pr.years.cur)}</th><td class="pre">${esc(d.f2)}</td></tr><tr><th>${esc(pr.years.next)}</th><td class="pre">${esc(d.f3)}</td></tr></table>`; }); return h||'<p class="empty">[연결된 보고서 항목의 계획을 먼저 작성하세요]</p>'; }
function secHTML(doc,s){ const d=secData(doc.id,s.id); const pr=prof(); const lv=Math.min(4,Math.max(2,(s.no.match(/[.\-]/g)||[]).length+2)); const H=`<h${lv===2?3:4}>${esc(s.no)} ${esc(s.title)}</h${lv===2?3:4}>`;
  if(s.kind==="head")return `<h${lv<=2?2:3}>${esc(s.no)} ${esc(s.title)}</h${lv<=2?2:3}>`;
  if(s.kind==="text")return H+paraD(d,"text",draftFrom(s));
  if(s.kind==="pp"){ const ts=s.group?tasksBy(s.group):[]; return H+(s.group?`<p><b>세부 추진 내용(과제)</b></p>${ts.length?`<ul>${ts.map(t=>`<li>${esc(t.name)}<span class="kmark">${esc(pr.modules.tasks.mark||"핵심")}</span></li>`).join("")}</ul>`:'<p class="empty">[과제 지정 필요]</p>'}`:"")+pr.ppFields.map(f=>f.short?(d[f.k]?`<p><b>※ ${esc(f.l.split("(")[0].trim())}</b> : ${esc(d[f.k])}</p>`:""):`<p><b>□ ${esc(f.l.split("(")[0].split("→")[0].trim())}</b></p>${paraD(d,f.k)}`).join(""); }
  if(s.kind==="derived")return H+derivedHTML(s);
  return H+(d.text?para(d.text):"")+autoHTML(s.src,doc); }
function docHTML(doc){ const pr=prof(), m=dat().meta; return `<div class="cover">${m.variant?`<span class="reg">${esc(m.variant)}</span>`:""}<h1>${(doc.cover&&doc.cover.length?doc.cover:[doc.name]).map(esc).join("<br>")}</h1><p style="font-size:16pt;font-weight:700;margin-top:30px">${esc(ORG())}</p></div>
  <table><tr><th>${esc(pr.orgLabel||"기관")}</th><td>${esc(ORG())}</td></tr><tr><th>주소 / URL</th><td>${esc(m.addr)} ${esc(m.url)}</td></tr><tr><th>사업 총괄책임자</th><td>${esc(m.leaderOrg)} ${esc(m.leaderName)} ${m.phone?"("+esc(m.phone)+")":""}</td></tr><tr><th>사업기간</th><td>${esc(pr.period)}</td></tr></table><div class="pb"></div>
  ${visibleSecs(doc).map(s=>secHTML(doc,s)).join("")}${m.aiNote?`<p class="ai">※ 생성형 AI 활용 내역: ${esc(m.aiNote)}</p>`:""}`; }
