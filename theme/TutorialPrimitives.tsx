import type { ReactNode } from 'react';

type RouteStep = {
  label: string;
  href?: string;
  active?: boolean;
};

export function ChapterRoute({ steps }: { steps: RouteStep[] }) {
  return (
    <nav className="chapter-route" aria-label="一次更新的主线">
      <strong>🧭 主线</strong>
      {steps.map((step, index) => (
        <span className="chapter-route__item" key={step.label}>
          {index > 0 && <i aria-hidden="true">→</i>}
          {step.href ? (
            <a className={step.active ? 'is-active' : ''} href={step.href}>{step.label}</a>
          ) : (
            <span className={step.active ? 'is-active' : ''}>{step.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}) {
  return <aside className={`tutorial-callout tutorial-callout--${type}`}>{children}</aside>;
}

export function ContentCard({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'accent' | 'warning' | 'success' | 'purple';
  children: ReactNode;
}) {
  return <section className={`content-card content-card--${tone}`}>{children}</section>;
}

export function PhaseStrip({
  items,
}: {
  items: Array<{ title: string; description: string; tone?: string }>;
}) {
  return (
    <div className="phase-strip-native">
      {items.map((item, index) => (
        <div className={item.tone ? `is-${item.tone}` : ''} key={item.title}>
          <span>{index + 1}</span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({
  tone = 'accent',
  children,
}: {
  tone?: 'accent' | 'purple' | 'green' | 'pink' | 'orange';
  children: ReactNode;
}) {
  return <h2 className={`rp-not-doc tutorial-section-title is-${tone}`}><span aria-hidden="true" />{children}</h2>;
}
