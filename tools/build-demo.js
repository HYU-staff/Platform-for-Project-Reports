// 사용법: node tools/build-demo.js  → 루트의 demo.html 생성 (시연 전용 웹 버전)
// index.html과 같은 소스를 쓰되, 다음만 바꿉니다.
//  - 내장 데모 데이터(가상 대학 데이터·예시 원문·안내 투어)를 넣지 않음 → 빈 상태에서 '새 사업' 화면으로 시작
//  - 공유 저장소(db)에 연결하지 않음 → 입력 내용은 보는 사람의 브라우저에만 저장
//  - 상단에 '시연용' 표시, 탭 제목 변경
//  - 내장 사업 템플릿도 넣지 않음 → 구조는 올린 파일(기본계획·서식·전년도 문서)로만 만듦
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), src = path.join(root, "src");
const files = fs.readdirSync(src).sort();
const DEMO_STUB = `/* 시연판: 내장 데모 데이터 없음 */
function demoProject(){ return null; }
function demoBlankProject(){ return null; }
const DEMO_SOURCES=[];
const TOUR=[];
let TOURI=-1, DEMO_BACK=null;
`;
// 내장 사업 템플릿 제거 (BLANK_PROFILE 등 기본 틀은 유지)
function stripTemplates(t){ const r=t.replace(/const TEMPLATES=\{[\s\S]*?\n\};/, "const TEMPLATES={}; /* 시연판: 내장 템플릿 없음 */"); if(r===t)throw new Error("TEMPLATES 블록을 찾지 못함"); return r; }
const layout = files.filter(f => f.endsWith(".html")).map(f => fs.readFileSync(path.join(src, f), "utf8")).join("\n");
const scripts = files.filter(f => f.endsWith(".js")).map(f => `/* ---- ${f} ---- */\n` + (f === "03.demo.js" ? DEMO_STUB : f === "02.template.js" ? stripTemplates(fs.readFileSync(path.join(src, f), "utf8")) : fs.readFileSync(path.join(src, f), "utf8"))).join("\n");
let h = `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${layout}\n<script>\n"use strict";\nconst DEMO_ONLY=true;\n${scripts}\n</script>\n</html>\n`;
const rep = (a, b) => { if (!h.includes(a)) throw new Error("패치 위치를 찾지 못함: " + a.slice(0, 60)); h = h.split(a).join(b); };
rep("<title>Platform for Project Reports</title>", "<title>Platform for Project Reports · 시연판</title>");
rep('<b>Platform for Project Reports</b>', '<b>Platform for Project Reports <span class="chip g" style="vertical-align:middle;font-size:11px;margin-left:4px">시연용</span></b>');
rep('<button class="btn sm" data-act="startDemo">데모 체험</button>', '');
rep("async init(){\n", "async init(){\n    if(DEMO_ONLY)return;\n");
rep('if(wantDemo||!PROJ.length){ startDemo(); if(!wantDemo)toast("처음 방문이라 데모로 시작합니다. 위의 ‘데모 종료’를 누르면 내 사업을 만들 수 있습니다"); }', 'if(!PROJ.length){ cur="newproj"; render(); }');
// 새 사업 화면: 내장 템플릿 카드·안내 문구 제거
h = h.replace(/<div class="grid2"><div class="panel"><h3>내장 템플릿으로 시작<\/h3>[\s\S]*?\.join\(""\)\}<\/div>\n\s*<div class="panel"><h3>다른 재정지원사업 \(파일에서 만들기\)<\/h3>/, '<div><div class="panel"><h3>파일 없이 빈 사업 만들기</h3>');
rep("내장 템플릿과 같은 사업이면 템플릿 구조를 씁니다.", "작성 서식이 없으면 전년도 보고서·계획서의 목차로 구조를 만듭니다.");
h = h.replace(/내장 템플릿으로 시작하거나, /, "");
if (/내장 템플릿으로 시작|이 템플릿으로 만들기/.test(h)) throw new Error("템플릿 화면이 남아 있음");
// 새 사업 화면의 '데모부터' 안내 카드 제거
h = h.replace(/<div class="panel demo-card"[\s\S]*?data-act="startDemo">데모 체험 시작<\/button><\/div><\/div>/, "");
if (/하냥|demo-uni|DEMO_SOURCES=\[\s*\{/.test(h)) throw new Error("데모 데이터가 남아 있음");
fs.writeFileSync(path.join(root, "demo.html"), h);
console.log("demo.html 생성 완료 (" + Math.round(h.length / 1024) + " KB, 내장 데모 데이터·템플릿 없음)");
