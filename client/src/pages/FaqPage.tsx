import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { faqCopy } from '../i18n/messages';

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`faq-chevron ${open ? 'is-open' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 6.5 15 12l-6 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqPage() {
  const { lang } = useLanguage();
  const t = faqCopy(lang);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(0);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return t.items.map((item, i) => ({ ...item, i }));
    return t.items
      .map((item, i) => ({ ...item, i }))
      .filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [query, t.items]);

  return (
    <div className="faq-page">
      <section className="faq-hero" aria-labelledby="faq-hero-title">
        <div className="faq-hero-art" aria-hidden>
          <div className="faq-hill faq-hill-a" />
          <div className="faq-hill faq-hill-b" />
          <div className="faq-hill faq-hill-c" />
          <div className="faq-tree faq-tree-1" />
          <div className="faq-tree faq-tree-2" />
          <div className="faq-tree faq-tree-3" />
          <div className="faq-tree faq-tree-4" />
        </div>

        <div className="faq-hero-content">
          <Link className="faq-back" to="/profile?tab=settings">
            ← {t.backSettings}
          </Link>
          <h1 id="faq-hero-title">{t.heroTitle}</h1>
          <p>{t.heroLead}</p>

          <label className="faq-search">
            <span className="faq-search-ico">
              <IconSearch />
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenId(null);
              }}
              placeholder={t.search}
              aria-label={t.search}
            />
            <kbd className="faq-search-kbd" aria-hidden>
              ⌘K
            </kbd>
          </label>
        </div>
      </section>

      <section className="faq-body">
        <aside className="faq-aside">
          <p className="faq-support">{t.support}</p>
          <h2>{t.faqs}</h2>
          <p>{t.faqsLead}</p>
        </aside>

        <div className="faq-list" role="list">
          {items.length === 0 && <p className="faq-empty muted">{t.empty}</p>}
          {items.map((item) => {
            const open = openId === item.i;
            return (
              <div key={item.i} className={`faq-item ${open ? 'is-open' : ''}`} role="listitem">
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.i)}
                >
                  <span>{item.q}</span>
                  <IconChevron open={open} />
                </button>
                {open && <div className="faq-a">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
