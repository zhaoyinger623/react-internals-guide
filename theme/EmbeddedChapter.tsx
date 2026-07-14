import { useEffect, useMemo, useRef, useState } from 'react';

const ROUTES: Record<string, string> = {
  intro: '01-foundations/intro', journey: '01-foundations/journey', t1: '01-foundations/t1',
  t2: '01-foundations/t2', t3: '01-foundations/t3', t4: '01-foundations/t4',
  t9: '02-update-pipeline/t9', t13: '02-update-pipeline/t13', t12: '02-update-pipeline/t12',
  t8: '02-update-pipeline/t8', t5: '02-update-pipeline/t5', t7: '02-update-pipeline/t7',
  t6: '02-update-pipeline/t6', t10: '02-update-pipeline/t10', t11: '02-update-pipeline/t11',
  t14: '03-concurrent/t14', t15: '03-concurrent/t15', t16: '03-concurrent/t16',
  t17: '03-concurrent/t17', t18: '03-concurrent/t18', t19: '03-concurrent/t19',
  t20: '04-advanced/t20', t21: '04-advanced/t21', t22: '04-advanced/t22',
  t23: '04-advanced/t23', t24: '04-advanced/t24', t25: '04-advanced/t25',
  t26: '04-advanced/t26', t27: '04-advanced/t27', t28: '04-advanced/t28',
  ctx: '05-core-topics/ctx', ref: '05-core-topics/ref', pk: '06-source-reading/pk',
  boot: '06-source-reading/boot', obj: '06-source-reading/obj', source: '06-source-reading/source',
  main: '06-source-reading/main',
};

function getBasePath(chapter: string) {
  const route = ROUTES[chapter];
  const suffix = `/${route}`;
  const pathname = window.location.pathname.replace(/\/$/, '');
  if (pathname.endsWith(suffix)) return pathname.slice(0, -suffix.length) || '';
  const routeIndex = pathname.split('/').findIndex((part) => /^(?:0[1-6]-)/.test(part));
  return routeIndex < 0 ? '' : `/${pathname.split('/').filter(Boolean).slice(0, routeIndex).join('/')}`;
}

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function EmbeddedChapter({ chapter }: { chapter: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(640);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(currentTheme());
    setReady(true);
  }, []);

  const src = useMemo(() => {
    if (!ready) return undefined;
    const base = getBasePath(chapter);
    return `${base}/chapters/${chapter}.html?embed=1&theme=${theme}`;
  }, [chapter, ready]);

  useEffect(() => {
    const frame = iframeRef.current;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
      if (event.data?.type === 'react-guide:height' && event.data.chapter === chapter) {
        const nextHeight = Math.max(320, Math.min(30000, Number(event.data.height) || 0));
        setHeight(nextHeight);
      }
      if (event.data?.type === 'react-guide:navigate' && ROUTES[event.data.chapter]) {
        window.location.assign(`${getBasePath(chapter)}/${ROUTES[event.data.chapter]}/`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [chapter]);

  useEffect(() => {
    const html = document.documentElement;
    const syncTheme = () => {
      const next = currentTheme();
      setTheme(next);
      iframeRef.current?.contentWindow?.postMessage({ type: 'react-guide:theme', theme: next }, window.location.origin);
    };
    const observer = new MutationObserver(syncTheme);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="embedded-chapter-shell" style={{ minHeight: height }}>
      {src && (
        <iframe
          ref={iframeRef}
          className="embedded-chapter-frame"
          src={src}
          title={`React 原理教程：${chapter}`}
          style={{ height }}
          scrolling="no"
          onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'react-guide:theme', theme }, window.location.origin)}
        />
      )}
    </div>
  );
}
