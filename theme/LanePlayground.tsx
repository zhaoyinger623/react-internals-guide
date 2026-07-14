import { useMemo, useState, type CSSProperties } from 'react';

const LANES = [
  { name: 'Sync', bit: 0b0001, color: '#ef476f' },
  { name: 'InputContinuous', bit: 0b0010, color: '#e7a519' },
  { name: 'Default', bit: 0b0100, color: '#0b93b8' },
  { name: 'Transition', bit: 0b1000, color: '#7c5ce7' },
];

const binary = (value: number) => value.toString(2).padStart(4, '0');

export function LanePlayground() {
  const [pending, setPending] = useState(0);
  const highest = pending === 0 ? 0 : pending & -pending;
  const highestName = useMemo(
    () => LANES.find((lane) => lane.bit === highest)?.name ?? '无',
    [highest],
  );

  return (
    <div className="lane-playground">
      <div className="lane-playground__buttons">
        {LANES.map((lane) => (
          <button
            key={lane.name}
            type="button"
            style={{ '--lane-color': lane.color } as CSSProperties}
            onClick={() => setPending((value) => value | lane.bit)}
          >
            加入 {lane.name}
          </button>
        ))}
        <button type="button" className="lane-playground__reset" onClick={() => setPending(0)}>
          重置
        </button>
      </div>

      <div className="lane-playground__result">
        <div>
          <span>root.pendingLanes</span>
          <strong>{binary(pending)}</strong>
        </div>
        <div>
          <span>最高优先级 bit</span>
          <strong>{highest ? binary(highest) : '0000'}</strong>
        </div>
        <div>
          <span>识别出的优先级组</span>
          <strong>{highestName}</strong>
        </div>
      </div>

      <div className="lane-playground__chips">
        {LANES.map((lane) => (
          <span key={lane.name} className={pending & lane.bit ? 'is-active' : ''}>
            {lane.name}: {binary(lane.bit)}
          </span>
        ))}
      </div>
      <p>这里的“最高 bit”只用于识别优先级组；真实的 getNextLanes 随后可能返回该组中的多个 Lane。</p>
    </div>
  );
}
