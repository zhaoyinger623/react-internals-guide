import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = path.join(root, 'react-principles-simplified.html');
const outputDir = path.join(root, 'react-internals-multipage');
const publicDir = path.join(root, 'docs/public/chapters');
const source = await readFile(sourceFile, 'utf8');

const style = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const aside = source.match(/<aside id="side">([\s\S]*?)<\/aside>/)?.[1];
const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const runtime = scripts.at(-1)?.[1];

if (!style || !aside || !runtime) {
  throw new Error('无法从原始 HTML 中提取样式、侧栏或交互脚本。');
}

const sections = new Map();
for (const match of source.matchAll(/<section class="topic(?: active)?" id="([^"]+)">([\s\S]*?)<\/section>/g)) {
  sections.set(match[1], `<section class="topic active" id="${match[1]}">${match[2]}</section>`);
}

const entries = [...aside.matchAll(/<a data-t="([^"]+)">([\s\S]*?)<\/a>/g)].map((match) => ({
  id: match[1],
  title: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
}));

if (entries.length !== sections.size) {
  throw new Error(`章节与侧栏数量不一致：章节 ${sections.size}，侧栏 ${entries.length}`);
}

const titles = Object.fromEntries(entries.map(({ id, title }) => [id, title.replace(/^[◎★]|^\d+|^C\d|^A\d/, '').trim()]));
const demoStart = runtime.indexOf('/* ===== T1 re-render ===== */');
if (demoStart < 0) throw new Error('找不到原 HTML 的动画脚本起点。');
const demos = runtime.slice(demoStart);

const multipageOverrides = `
/* Multi-page shell: the visual language stays identical to the source HTML. */
section.topic { display: block !important; }
.navbtns button { min-width: 180px; }
html.is-embed, html.is-embed body { min-height: 0; overflow: hidden; }
html.is-embed body { display: block; background: transparent; }
html.is-embed body aside { display: none; }
html.is-embed body main { width: 100%; max-width: none; margin: 0; padding: 8px 4px 24px; }
html.is-embed body section.topic { animation: none; }
html.is-embed body .navbtns { display: none; }
html.is-embed body .crumb { margin-top: 0; }
@media (max-width: 860px) {
  body:not(.embed) aside { position: relative; }
  html.is-embed body main { padding: 8px 4px 20px; }
}
`;

function buildSidebar(currentId) {
  return aside.replace(/<a data-t="([^"]+)">/g, (whole, id) => {
    const active = id === currentId ? ' class="active" aria-current="page"' : '';
    return `<a href="./${id}.html" data-t="${id}"${active}>`;
  });
}

function buildNav(id) {
  const index = entries.findIndex((entry) => entry.id === id);
  const previous = entries[index - 1];
  const next = entries[index + 1];
  const left = previous
    ? `<button class="ghost" data-go="${previous.id}">← ${previous.title}</button>`
    : '<span></span>';
  const right = next
    ? `<button class="act" data-go="${next.id}">${next.title} →</button>`
    : '<button class="act" data-go="intro">↑ 回到开头</button>';
  return `<div class="navbtns">${left}${right}</div>`;
}

function buildSection(id) {
  return sections.get(id).replace(/<div class="navbtns">[\s\S]*?<\/div>/, buildNav(id));
}

function pageTemplate(id) {
  const title = titles[id];
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<title>${title} · React 原理全景</title>
<script>
  const embedParams = new URLSearchParams(location.search);
  if (embedParams.get('embed') === '1') document.documentElement.classList.add('is-embed');
  if (embedParams.get('theme') === 'light') document.documentElement.classList.add('embed-light');
</script>
<link rel="stylesheet" href="./assets/site.css">
</head>
<body data-chapter="${id}">
<aside id="side">${buildSidebar(id)}</aside>
<main id="main">${buildSection(id)}</main>
<script src="./assets/site.js"></script>
<script src="./assets/demos.js"></script>
</body>
</html>
`;
}

const siteRuntime = `const EMBED_MODE = new URLSearchParams(location.search).get('embed') === '1';
if (EMBED_MODE) document.body.classList.add('embed');
const CURRENT_ID = document.body.dataset.chapter;
const TITLES = ${JSON.stringify(titles, null, 2)};
const redraws = [];
const $ = id => document.getElementById(id);
function cssVar(name) { return getComputedStyle(document.body).getPropertyValue(name).trim() || '#888'; }
function constrainSvgScale() {
  document.querySelectorAll('section.topic svg[viewBox]').forEach(svg => {
    const nativeWidth = svg.viewBox?.baseVal?.width;
    if (!nativeWidth) return;
    svg.style.width = '100%';
    svg.style.maxWidth = nativeWidth + 'px';
    svg.style.height = 'auto';
    svg.style.marginInline = 'auto';
    svg.style.display = 'block';
  });
}
constrainSvgScale();
function reportEmbedHeight() {
  if (!EMBED_MODE) return;
  const main = document.getElementById('main');
  const section = main?.querySelector('section.topic.active');
  if (!section) return;
  const bodyTop = document.body.getBoundingClientRect().top;
  const sectionBottom = section.getBoundingClientRect().bottom;
  const mainPaddingBottom = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
  const height = Math.ceil(sectionBottom - bodyTop + mainPaddingBottom + 4);
  parent.postMessage({ type: 'react-guide:height', chapter: CURRENT_ID, height }, location.origin);
}
function applyTheme(light) {
  document.body.classList.toggle('light', light);
  document.documentElement.classList.toggle('embed-light', light && EMBED_MODE);
  const label = $('themeLabel');
  const icon = document.querySelector('#themeBtn .ic');
  if (label) label.textContent = light ? '切换到深色模式' : '切换到浅色模式';
  if (icon) icon.textContent = light ? '☀️' : '🌙';
  try { localStorage.setItem('react-theme', light ? 'light' : 'dark'); } catch {}
  redraws.forEach(fn => { try { fn(); } catch {} });
  requestAnimationFrame(reportEmbedHeight);
}
let initialTheme = EMBED_MODE ? (new URLSearchParams(location.search).get('theme') || 'light') : 'dark';
if (!EMBED_MODE) { try { initialTheme = localStorage.getItem('react-theme') || 'dark'; } catch {} }
applyTheme(initialTheme === 'light');
const themeButton = $('themeBtn');
if (themeButton) themeButton.onclick = () => applyTheme(!document.body.classList.contains('light'));
document.addEventListener('click', event => {
  const target = event.target.closest('[data-go]');
  if (!target) return;
  const chapter = target.dataset.go;
  if (!TITLES[chapter]) return;
  event.preventDefault();
  if (EMBED_MODE) parent.postMessage({ type: 'react-guide:navigate', chapter }, location.origin);
  else location.href = './' + chapter + '.html';
});
if (EMBED_MODE) {
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'react-guide:theme') return;
    applyTheme(event.data.theme === 'light');
  });
  addEventListener('load', reportEmbedHeight);
  addEventListener('resize', reportEmbedHeight);
  const target = document.getElementById('main');
  new ResizeObserver(reportEmbedHeight).observe(target);
  new MutationObserver(() => requestAnimationFrame(reportEmbedHeight)).observe(target, { childList: true, subtree: true, attributes: true });
}
`;

const readme = `# React 原理全景 · 多页 HTML 实验版

这是从根目录原始完整 HTML 自动拆分得到的多页版本。每章一个 HTML，共享同一份 CSS 和交互脚本，因此完整保留原教程的布局、重点块和动画。

## 本地运行

在仓库根目录执行：

\`\`\`bash
npm run multipage:build
npm run multipage:dev
\`\`\`

然后访问 <http://127.0.0.1:4174/>。

不要直接手改生成后的章节文件；应修改根目录的 \`react-principles-simplified.html\`，再运行 \`npm run multipage:build\`。
`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'assets'), { recursive: true });
await writeFile(path.join(outputDir, 'assets/site.css'), `${style}\n${multipageOverrides}`);
await writeFile(path.join(outputDir, 'assets/site.js'), siteRuntime);
await writeFile(path.join(outputDir, 'assets/demos.js'), demos);
await writeFile(path.join(outputDir, 'README.md'), readme);
await writeFile(path.join(outputDir, 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./intro.html"><title>React 原理全景</title><a href="./intro.html">进入教程</a>');
for (const { id } of entries) await writeFile(path.join(outputDir, `${id}.html`), pageTemplate(id));

await rm(publicDir, { recursive: true, force: true });
await mkdir(path.dirname(publicDir), { recursive: true });
await cp(outputDir, publicDir, { recursive: true });

console.log(`已生成 ${entries.length} 个章节：${path.relative(root, outputDir)}`);
console.log(`已同步 Rspress 静态资源：${path.relative(root, publicDir)}`);
