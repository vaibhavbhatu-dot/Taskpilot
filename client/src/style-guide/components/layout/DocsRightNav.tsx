import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface Heading {
  id:    string;
  text:  string;
  level: 2 | 3;
}

export function DocsRightNav() {
  const { pathname }              = useLocation();
  const [headings, setHeadings]   = useState<Heading[]>([]);
  const [activeId, setActiveId]   = useState('');

  // Re-scan DOM whenever the route changes
  useEffect(() => {
    setHeadings([]);
    setActiveId('');

    const timer = setTimeout(() => {
      const content = document.getElementById('docs-content');
      if (!content) return;

      const els = Array.from(
        content.querySelectorAll('h2[id], h3[id]')
      ) as HTMLElement[];

      setHeadings(
        els.map(el => ({
          id:    el.id,
          text:  el.textContent?.trim() ?? '',
          level: el.tagName === 'H2' ? 2 : 3,
        }))
      );
    }, 80);

    return () => clearTimeout(timer);
  }, [pathname]);

  // IntersectionObserver highlights active heading
  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="w-[180px] flex-shrink-0 sticky top-8 self-start hidden lg:block">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
        On this page
      </p>
      <ul className="space-y-1">
        {headings.map(h => (
          <li key={h.id}>
            <button
              onClick={() => scrollTo(h.id)}
              className={[
                'text-left w-full text-[13px] transition-colors px-1 py-0.5 rounded',
                h.level === 3 && 'pl-4',
                activeId === h.id
                  ? 'text-primary font-medium'
                  : h.level === 2
                    ? 'text-foreground hover:text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground',
              ].filter(Boolean).join(' ')}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
