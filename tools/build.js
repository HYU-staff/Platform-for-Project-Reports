// 사용법: node tools/build.js  → 루트의 index.html 생성 (Windows/macOS/Linux 공통)
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), src = path.join(root, "src");
const files = fs.readdirSync(src).sort();
const layout = files.filter(f => f.endsWith(".html")).map(f => fs.readFileSync(path.join(src, f), "utf8")).join("\n");
const scripts = files.filter(f => f.endsWith(".js")).map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(src, f), "utf8")).join("\n");
const html = `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${layout}\n<script>\n"use strict";\n${scripts}\n</script>\n</html>\n`;
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("index.html 생성 완료 (" + Math.round(html.length / 1024) + " KB, 소스 " + files.length + "개)");
