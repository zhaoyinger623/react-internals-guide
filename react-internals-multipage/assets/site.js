const EMBED_MODE = new URLSearchParams(location.search).get('embed') === '1';
if (EMBED_MODE) document.body.classList.add('embed');
const CURRENT_ID = document.body.dataset.chapter;
const TITLES = {
  "intro": "如何使用本页",
  "journey": "一次 setState 的完整旅程",
  "t1": "组件渲染机制",
  "t2": "虚拟 DOM 真实含义",
  "t3": "生命周期执行顺序",
  "t4": "更新的四个阶段",
  "t9": "UpdateQueue：更新入队",
  "t13": "Lane：选择更新",
  "t12": "Scheduler：安排执行",
  "t8": "Fiber：可中断工作单元",
  "t5": "双缓存 Fiber 树",
  "t7": "Hooks：读取与计算状态",
  "t6": "Diff：协调子节点",
  "t10": "flags：记录变更",
  "t11": "Commit：应用变更",
  "t14": "Concurrent 并发渲染",
  "t15": "两大并发 API",
  "t16": "三大模块协作",
  "t17": "批量更新原理",
  "t18": "Suspense / lazy",
  "t19": "合成事件系统",
  "t20": "渲染优化底层",
  "t21": "渲染 bug 底层解释",
  "t22": "SSR / Hydration / 流式",
  "t23": "Server Components",
  "t24": "React 19 新特性",
  "t25": "外部状态与撕裂",
  "t26": "React Compiler",
  "t27": "高级模式与陷阱",
  "t28": "性能诊断与工程化",
  "ctx": "Context 源码原理",
  "ref": "useRef 与 ref 体系",
  "pk": "宏观包结构",
  "boot": "启动过程",
  "obj": "核心对象速查",
  "source": "源码阅读路线",
  "main": "React 更新流程总览"
};
const redraws = [];
const $ = id => document.getElementById(id);
function cssVar(name) { return getComputedStyle(document.body).getPropertyValue(name).trim() || '#888'; }
function reportEmbedHeight() {
  if (!EMBED_MODE) return;
  const main = document.getElementById('main');
  const height = Math.ceil(Math.max(main?.scrollHeight || 0, main?.getBoundingClientRect().height || 0) + 28);
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
