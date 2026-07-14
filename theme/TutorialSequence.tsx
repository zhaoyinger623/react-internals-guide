import { useEffect, useState } from 'react';

const sequences = {
  render: ['调用组件', '得到新 JSX', '与旧结果比较', '生成下一版 Fiber'],
  lifecycle: ['Render 计算', 'Mutation 修改 DOM', 'Layout Effect', 'Passive Effect'],
  doubleBuffer: ['读取 current', '构建 workInProgress', '完成整棵新树', '切换 current 指针'],
  diff: ['读取旧子节点', '按 key 与类型匹配', '复用或创建 Fiber', '记录移动与删除'],
  hooks: ['进入组件 Fiber', '按顺序读取 Hook', '计算本轮状态', '保存 Hook 链表'],
  fiber: ['beginWork 向下', '处理一个 Fiber', 'completeWork 向上', '返回可提交的新树'],
  queue: ['创建 Update', '接入 pending 环', 'Render 时拆环', '按 Lane 依次计算'],
  flags: ['比较节点', '写入 flags', '向上汇总 subtreeFlags', 'Commit 定点访问变更'],
  commit: ['Before Mutation', 'Mutation', '切换 current', 'Layout / Passive Effect'],
} as const;

export type TutorialSequenceKind = keyof typeof sequences;

export function TutorialSequence({ kind }: { kind: TutorialSequenceKind }) {
  const steps = sequences[kind];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setStep((value) => {
        if (value >= steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, 720);
    return () => window.clearTimeout(timer);
  }, [playing, step, steps.length]);

  return (
    <div className="tutorial-sequence" aria-label="交互流程演示">
      <div className="tutorial-sequence__track">
        {steps.map((label, index) => (
          <div key={label} className={index < step ? 'is-done' : index === step ? 'is-current' : ''}>
            <span>{index + 1}</span><strong>{label}</strong>
          </div>
        ))}
      </div>
      <p>当前：{steps[step]}</p>
      <div className="tutorial-sequence__controls">
        <button type="button" onClick={() => { setPlaying(false); setStep((value) => Math.min(value + 1, steps.length - 1)); }}>下一步</button>
        <button type="button" onClick={() => { setStep(0); setPlaying(true); }}>自动播放</button>
        <button type="button" className="is-ghost" onClick={() => { setPlaying(false); setStep(0); }}>重置</button>
      </div>
    </div>
  );
}
