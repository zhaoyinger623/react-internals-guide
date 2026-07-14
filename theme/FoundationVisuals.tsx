import { useEffect, useState } from 'react';

const journeySteps = [
  { title: '浏览器派发点击事件', body: 'React 从根容器收到事件，定位组件的 onClick。', tone: 'accent' },
  { title: '调用 setState', body: '事件中的 setState 表达“状态要怎样变化”。', tone: 'purple' },
  { title: '创建 Update 并入队', body: 'Update 进入组件队列，Lane 被标记到 root。', tone: 'purple' },
  { title: '选择 Lane 并安排任务', body: 'React 决定本轮处理哪些更新，以及何时获得执行机会。', tone: 'orange' },
  { title: 'Render · beginWork', body: '向下执行组件、计算状态并协调子 Fiber。', tone: 'green' },
  { title: 'Render · completeWork', body: '向上完成节点并汇总 flags 和 subtreeFlags。', tone: 'green' },
  { title: '得到 workInProgress 树', body: '新树仍在内存中，尚未修改用户看到的页面。', tone: 'green' },
  { title: 'Commit 修改 DOM', body: '根据 flags 同步插入、更新或删除真实节点。', tone: 'pink' },
  { title: '执行 Layout / Passive Effect', body: 'Layout 在绘制前；普通 Effect 通常在绘制后。', tone: 'pink' },
  { title: '浏览器显示新界面', body: '一次状态更新的完整旅程结束。', tone: 'accent' },
] as const;

export function ArchitectureFlow() {
  return (
    <div className="architecture-flow" aria-label="React 三大模块协作动画">
      <div className="architecture-flow__rail"><i /></div>
      <div className="architecture-flow__module is-scheduler"><strong>Scheduler</strong><span>WHEN</span><p>何时执行、是否让位</p></div>
      <div className="architecture-flow__module is-reconciler"><strong>Reconciler</strong><span>WHAT</span><p>执行组件、Fiber 与 Diff</p></div>
      <div className="architecture-flow__module is-renderer"><strong>Renderer</strong><span>HOW</span><p>把变更应用到 DOM</p></div>
      <footer>一个 Update 沿调用链从左向右推进，最终形成屏幕更新。</footer>
    </div>
  );
}

export function UpdateJourneyDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep((value) => {
      if (value === journeySteps.length - 1) { setPlaying(false); return value; }
      return value + 1;
    }), 820);
    return () => window.clearTimeout(timer);
  }, [playing, step]);
  return (
    <section className="update-journey-demo">
      <div className="update-journey-demo__progress"><span style={{ width: `${((step + 1) / journeySteps.length) * 100}%` }} /></div>
      <div className="update-journey-demo__list">
        {journeySteps.map((item, index) => (
          <button type="button" key={item.title} onClick={() => { setPlaying(false); setStep(index); }} className={`${index === step ? 'is-current' : ''}${index < step ? ' is-done' : ''} is-${item.tone}`}>
            <i>{index + 1}</i><span><strong>{item.title}</strong><small>{item.body}</small></span>
          </button>
        ))}
      </div>
      <div className="update-journey-demo__controls">
        <button type="button" onClick={() => setStep((value) => Math.min(value + 1, journeySteps.length - 1))}>下一步</button>
        <button type="button" onClick={() => { setStep(0); setPlaying(true); }}>自动播放</button>
        <button type="button" className="is-ghost" onClick={() => { setPlaying(false); setStep(0); }}>重置</button>
        <span>当前 {step + 1} / {journeySteps.length}</span>
      </div>
    </section>
  );
}

const phases = [
  { name: 'Trigger', detail: '记录状态变化，创建 Update 并放入队列', tone: 'accent' },
  { name: 'Schedule', detail: '分配 Lane，选择本轮工作并安排执行', tone: 'orange' },
  { name: 'Render', detail: '执行组件、计算新状态、协调 Fiber', tone: 'green' },
  { name: 'Commit', detail: '应用 DOM 变更，运行提交阶段 Effect', tone: 'pink' },
] as const;

export function FourPhaseDiagram() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % phases.length), 1150);
    return () => window.clearTimeout(timer);
  }, [active, playing]);
  return (
    <section className="four-phase-diagram">
      <div className="four-phase-diagram__flow">
        {phases.map((phase, index) => <button type="button" key={phase.name} onClick={() => { setPlaying(false); setActive(index); }} className={`${index === active ? 'is-active' : ''} is-${phase.tone}`}><i>{index + 1}</i><strong>{phase.name}</strong><span>{phase.detail}</span></button>)}
      </div>
      <div className="four-phase-diagram__caption"><b>当前阶段：{phases[active].name}</b><span>{phases[active].detail}</span><button type="button" onClick={() => setPlaying((value) => !value)}>{playing ? '暂停' : '继续播放'}</button></div>
    </section>
  );
}

const vdomStages = [
  { title: 'JSX', code: '<button className="save">保存</button>', note: '开发者声明希望得到怎样的界面。' },
  { title: 'React Element', code: "{ type: 'button', props: { className: 'save', children: '保存' } }", note: '普通 JavaScript 对象，只描述类型、属性和子节点。' },
  { title: 'Fiber', code: "{ tag: HostComponent, type: 'button', pendingProps, child, return }", note: 'React 为这次工作建立可遍历、可复用的工作单元。' },
  { title: 'DOM', code: '<button class="save">保存</button>', note: 'Commit 阶段由 React DOM 创建或更新真实节点。' },
] as const;

export function VirtualDomPipeline() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStage((value) => {
      if (value === vdomStages.length - 1) { setPlaying(false); return value; }
      return value + 1;
    }), 950);
    return () => window.clearTimeout(timer);
  }, [playing, stage]);
  return (
    <section className="vdom-pipeline">
      <div className="vdom-pipeline__steps">{vdomStages.map((item, index) => <button type="button" onClick={() => { setPlaying(false); setStage(index); }} className={index === stage ? 'is-active' : index < stage ? 'is-done' : ''} key={item.title}><i>{index + 1}</i><strong>{item.title}</strong></button>)}</div>
      <div className="vdom-pipeline__detail"><span>{vdomStages[stage].title}</span><code>{vdomStages[stage].code}</code><p>{vdomStages[stage].note}</p></div>
      <div className="vdom-pipeline__controls"><button type="button" onClick={() => setStage((value) => Math.min(value + 1, vdomStages.length - 1))}>下一步</button><button type="button" onClick={() => { setStage(0); setPlaying(true); }}>自动播放</button><button type="button" className="is-ghost" onClick={() => { setPlaying(false); setStage(0); }}>重置</button></div>
    </section>
  );
}

export function LearningRoute() {
  const groups = [
    { phase: 'Trigger', tone: 'accent', links: [{ label: '第 5 章 UpdateQueue', href: '/02-update-pipeline/t9' }], note: '更新怎样产生并进入队列。' },
    { phase: 'Schedule', tone: 'orange', links: [{ label: '第 6 章 Lane', href: '/02-update-pipeline/t13' }, { label: '第 7 章 Scheduler', href: '/02-update-pipeline/t12' }], note: '先选择做什么，再安排什么时候做。' },
    { phase: 'Render', tone: 'green', links: [{ label: '第 8 章 Fiber', href: '/02-update-pipeline/t8' }, { label: '第 9 章 双缓存', href: '/02-update-pipeline/t5' }, { label: '第 10 章 Hooks', href: '/02-update-pipeline/t7' }, { label: '第 11 章 Diff', href: '/02-update-pipeline/t6' }, { label: '第 12 章 flags', href: '/02-update-pipeline/t10' }], note: '在内存中执行组件、协调节点并记录变更。' },
    { phase: 'Commit', tone: 'pink', links: [{ label: '第 13 章 Commit', href: '/02-update-pipeline/t11' }], note: '把 Render 的计算结果应用到页面。' },
  ];
  return <div className="learning-route">{groups.map((group) => <section className={`is-${group.tone}`} key={group.phase}><strong>{group.phase}</strong><div>{group.links.map((link, index) => <span key={link.href}>{index > 0 && <i>→</i>}<a href={link.href}>{link.label}</a></span>)}</div><p>{group.note}</p></section>)}</div>;
}
