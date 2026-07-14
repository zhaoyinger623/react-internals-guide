import { useEffect, useState, type ReactNode } from 'react';
import { Root as BasicRoot } from '@rspress/core/theme-original';
import './locked.css';
import './tutorial-system.css';

const LOCKED_ROUTE_PREFIXES = [
  'legacy',
  '03-concurrent',
  '04-advanced',
  '05-core-topics',
  '06-source-reading',
];

const GROUP_LABELS: Record<string, string> = {
  '01-foundations': '第一部分 · 建立全局认知',
  '02-update-pipeline': '第二部分 · 一次更新的主线',
  '03-concurrent': '第三部分 · 并发与架构协作',
  '04-advanced': '第四部分 · 高级实践与性能',
  '05-core-topics': '补充专题 · 核心概念',
  '06-source-reading': '源码附录 · 阅读地图',
};

function getRouteFromHref(href: string) {
  try {
    const url = new URL(href, window.location.href);
    return url.pathname.split('/').filter(Boolean);
  } catch {
    return [];
  }
}

function isLockedHref(href: string) {
  const segments = getRouteFromHref(href);
  return segments.some((segment) => LOCKED_ROUTE_PREFIXES.includes(segment));
}

function getBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const routeIndex = segments.findIndex((segment) =>
    /^(?:0[1-6]-|legacy$)/.test(segment),
  );
  if (routeIndex > 0) return `/${segments.slice(0, routeIndex).join('/')}/`;
  if (routeIndex === 0 || segments.length === 0) return '/';
  return `/${segments.join('/')}/`;
}

export function Root({ children }: { children: ReactNode }) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const basePath = getBasePath();
    if (window.location.pathname === basePath) {
      window.location.replace(`${basePath}01-foundations/intro`);
      return;
    }

    const markLockedLinks = () => {
      const sidebarGroups = document.querySelectorAll<HTMLElement>(
        ".rp-doc-layout__sidebar .rp-sidebar-group[data-depth='0']",
      );
      sidebarGroups.forEach((groupHeader, index) => {
        if (index === 0) groupHeader.dataset.tutorialFirstGroup = 'true';
        else delete groupHeader.dataset.tutorialFirstGroup;
        const label = groupHeader.querySelector<HTMLElement>('.rp-doc');
        const current = label?.textContent?.trim() || '';
        if (label && GROUP_LABELS[current] && label.textContent !== GROUP_LABELS[current]) {
          label.textContent = GROUP_LABELS[current];
        }
      });
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        const labelText = link.querySelector<HTMLElement>('.rp-doc')?.textContent?.trim();
        if (labelText === 'index') link.dataset.tutorialRoot = 'true';
        const segments = getRouteFromHref(link.href);
        const group = segments.find((segment) => GROUP_LABELS[segment]);
        if (group && link.pathname.replace(/\/$/, '').endsWith(group)) {
          if (link.classList.contains('rp-sidebar-group')) {
            const label = link.querySelector<HTMLElement>('.rp-doc');
            if (label) label.textContent = GROUP_LABELS[group];
          } else if (link.classList.contains('rp-sidebar-item--group-item')) {
            link.dataset.tutorialOverview = 'true';
          }
        }
        if (link.classList.contains('rp-sidebar-item') && (link.pathname === getBasePath() || link.pathname.endsWith('/index.html'))) {
          link.dataset.tutorialRoot = 'true';
        }
        if (isLockedHref(link.href)) {
          link.dataset.courseLocked = 'true';
          link.setAttribute('aria-disabled', 'true');
          link.title = '正在编撰中，敬请期待';
        } else if (link.dataset.courseLocked === 'true') {
          delete link.dataset.courseLocked;
          link.removeAttribute('aria-disabled');
          if (link.title === '正在编撰中，敬请期待') link.removeAttribute('title');
        }
      });
    };

    const currentPathIsLocked = LOCKED_ROUTE_PREFIXES.some((prefix) =>
      window.location.pathname.split('/').includes(prefix),
    );
    if (currentPathIsLocked) {
      sessionStorage.setItem('react-guide-show-draft-notice', 'true');
      window.location.replace(`${getBasePath()}02-update-pipeline/t11`);
      return;
    }

    if (sessionStorage.getItem('react-guide-show-draft-notice') === 'true') {
      sessionStorage.removeItem('react-guide-show-draft-notice');
      setShowNotice(true);
    }

    markLockedLinks();
    const observer = new MutationObserver(markLockedLinks);
    observer.observe(document.body, { childList: true, subtree: true });

    const stopLockedNavigation = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!link || !isLockedHref(link.href)) return;
      event.preventDefault();
      event.stopPropagation();
      setShowNotice(true);
    };
    document.addEventListener('click', stopLockedNavigation, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', stopLockedNavigation, true);
    };
  }, []);

  useEffect(() => {
    if (!showNotice) return;
    const timer = window.setTimeout(() => setShowNotice(false), 2600);
    return () => window.clearTimeout(timer);
  }, [showNotice]);

  return (
    <BasicRoot>
      {children}
      {showNotice && (
        <div className="course-draft-notice" role="status" aria-live="polite">
          <span aria-hidden="true">🚧</span>
          <div><strong>正在编撰中</strong><small>敬请期待</small></div>
        </div>
      )}
    </BasicRoot>
  );
}

export * from '@rspress/core/theme-original';
