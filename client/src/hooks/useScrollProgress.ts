import { useEffect, useState } from 'react';

function pageScrollEl() {
  const inner = document.querySelector('.landing-scroll, .farmer-main');
  if (inner && inner.scrollHeight > inner.clientHeight + 4) return inner;
  return document.documentElement;
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      const el = pageScrollEl();
      const max = el.scrollHeight - el.clientHeight;
      const top = el.scrollTop;
      const pct = max > 0 ? (top / max) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
      setScrolled(top > 40);
    }
    onScroll();
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  return { progress, scrolled };
}
