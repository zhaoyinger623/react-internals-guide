import { useEffect, useRef, useState } from 'react';

type Mode = 'idle' | 'effect-render' | 'effect-paint' | 'effect-move' | 'layout-render' | 'layout-move' | 'layout-paint';

const messages: Record<Mode, string> = {
  idle: '请先点击“useEffect 定位”。重点观察 Tooltip 是否在 A 短暂停留后才移动到 B。',
  'effect-render': 'Render：Tooltip 的初始位置是 A。',
  'effect-paint': '浏览器绘制：用户先看到 Tooltip 位于 A。',
  'effect-move': 'useEffect：绘制后才移动到 B，因此用户看到了从 A 到 B 的位置变化。',
  'layout-render': 'Render：Tooltip 的初始位置仍是 A，但浏览器还没有绘制。',
  'layout-move': 'useLayoutEffect：在绘制前把 Tooltip 修正到 B。',
  'layout-paint': '浏览器绘制：第一次显示时 Tooltip 已经位于 B，用户看不到位置 A。',
};

export function LifecycleTimingDemo() {
  const [mode, setMode] = useState<Mode>('idle');
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  const later = (next: Mode, delay: number, done = false) => {
    timers.current.push(window.setTimeout(() => {
      setMode(next);
      if (done) setBusy(false);
    }, delay));
  };

  const reset = () => {
    clearTimers();
    setBusy(false);
    setMode('idle');
  };

  useEffect(() => clearTimers, []);

  const runEffect = () => {
    if (busy) return;
    clearTimers();
    setBusy(true);
    setMode('effect-render');
    later('effect-paint', 520);
    later('effect-move', 1320, true);
  };

  const runLayout = () => {
    if (busy) return;
    clearTimers();
    setBusy(true);
    setMode('layout-render');
    later('layout-move', 260);
    later('layout-paint', 760, true);
  };

  const atTarget = mode === 'effect-move' || mode === 'layout-move' || mode === 'layout-paint';
  const animated = mode === 'effect-move';

  return (
    <section className="lifecycle-demo">
      <header>
        <span>INTERACTIVE</span>
        <h3>比较两种 Effect 的执行时机</h3>
        <p>先运行 useEffect，再重置并运行 useLayoutEffect。观察屏幕中是否出现从 A 到 B 的可见移动。</p>
      </header>
      <div className="lifecycle-demo__stage">
        <b>🖥 浏览器画面</b>
        <div className="lifecycle-demo__marker is-start"><i />A · 初始位置</div>
        <div className="lifecycle-demo__marker is-target"><i />B · 目标位置</div>
        <div className={`lifecycle-demo__tooltip${atTarget ? ' is-target' : ''}${animated ? ' is-animated' : ''}`}>Tooltip</div>
      </div>
      <div className="lifecycle-demo__timeline" aria-label="执行阶段">
        {['Render', 'Mutation', 'Browser Paint', 'Effect'].map((label, index) => {
          const activeIndex = mode === 'idle' ? -1
            : mode.includes('render') ? 0
              : mode === 'layout-move' ? 1
                : mode === 'effect-paint' || mode === 'layout-paint' ? 2 : 3;
          return <span className={index === activeIndex ? 'is-active' : index < activeIndex ? 'is-done' : ''} key={label}>{label}</span>;
        })}
      </div>
      <div className="lifecycle-demo__controls">
        <button disabled={busy} type="button" className="is-effect" onClick={runEffect}>① useEffect 定位</button>
        <button disabled={busy} type="button" className="is-layout" onClick={runLayout}>② useLayoutEffect 定位</button>
        <button type="button" className="is-reset" onClick={reset}>重置</button>
      </div>
      <div className="lifecycle-demo__status" role="status" aria-live="polite">{messages[mode]}</div>
    </section>
  );
}
