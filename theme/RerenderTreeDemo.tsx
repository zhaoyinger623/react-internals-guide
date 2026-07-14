import { useState } from 'react';

type NodeKey = 'parent' | 'sibling' | 'child' | 'grandchild';
const nodes: Array<{ key: NodeKey; label: string; depth: number }> = [
  { key: 'parent', label: 'App（父组件）', depth: 0 },
  { key: 'sibling', label: 'Sidebar（兄弟组件）', depth: 1 },
  { key: 'child', label: 'Child', depth: 1 },
  { key: 'grandchild', label: 'GrandChild', depth: 2 },
];

export function RerenderTreeDemo() {
  const [active, setActive] = useState<NodeKey[]>([]);
  const [memo, setMemo] = useState(false);
  const [message, setMessage] = useState('请选择一种更新来源。红色节点表示本次执行了组件函数。');

  const run = (kind: 'state' | 'props' | 'parent') => {
    if (kind === 'state') {
      setActive(['child', 'grandchild']);
      setMessage('更新来自 Child 自己：Child 与 GrandChild 重新渲染；memo 不能阻止组件自身的 state 更新。');
    } else if (kind === 'props') {
      setActive(['parent', 'sibling', 'child', 'grandchild']);
      setMessage('App 传入了新的 props：Child 的输入已经变化，因此即使启用 memo 也不能跳过。');
    } else if (memo) {
      setActive(['parent', 'sibling']);
      setMessage('Child 的 props 没变，memo 让 Child 和 GrandChild bailout；未使用 memo 的 Sidebar 仍会执行。');
    } else {
      setActive(['parent', 'sibling', 'child', 'grandchild']);
      setMessage('默认情况下父组件重新渲染，子组件函数也会执行。启用 memo 后再对比一次。');
    }
  };

  return (
    <section className="rerender-demo">
      <header><span>INTERACTIVE</span><h3>谁会重新渲染？</h3><p>选择更新来源，观察组件树中的执行范围。</p></header>
      <div className="rerender-demo__body">
        <div className="rerender-demo__tree">
          {nodes.map((node) => <div key={node.key} className={active.includes(node.key) ? 'is-active' : ''} style={{ marginLeft: node.depth * 24 }}><span>{node.label}</span>{active.includes(node.key) && <b>重新渲染</b>}</div>)}
        </div>
        <div className="rerender-demo__panel">
          <button onClick={() => run('state')} type="button">① Child state 更新</button>
          <button onClick={() => run('props')} type="button">② Child props 改变</button>
          <button onClick={() => run('parent')} type="button">③ 仅 App 更新</button>
          <label><input checked={memo} onChange={(event) => { setMemo(event.target.checked); setActive([]); }} type="checkbox" />为 Child 启用 React.memo</label>
          <button className="is-reset" onClick={() => { setActive([]); setMemo(false); setMessage('请选择一种更新来源。红色节点表示本次执行了组件函数。'); }} type="button">重置</button>
        </div>
      </div>
      <div className="rerender-demo__status">{message}</div>
    </section>
  );
}
