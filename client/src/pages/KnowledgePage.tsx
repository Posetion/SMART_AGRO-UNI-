import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  IconArticle,
  IconBook,
  IconBug,
  IconChat,
  IconCheck,
  IconDisease,
  IconDownload,
  IconDrop,
  IconJournal,
  IconLeaf,
  IconRice,
  IconSprout,
  IconStarFilled,
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { knowledgeCopy } from '../i18n/messages';
import { api } from '../services/api';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';
type ResourceType = 'Book' | 'Article' | 'Journal';
type ViewMode = 'grid' | 'list';
type SortKey = 'popular' | 'latest' | 'rating' | 'alpha';
type TypeFilter = 'all' | 'Book' | 'Article' | 'Journal';
type TopicKey =
  | 'all'
  | 'rice'
  | 'disease'
  | 'farming'
  | 'organic'
  | 'irrigation'
  | 'pest';

type IconComp = (props: { className?: string }) => React.ReactElement;

type KnowledgeItem = {
  _id: string;
  title: string;
  category: ResourceType;
  description?: string;
  content?: string;
  author?: string;
  tags?: string[];
  views?: number;
  downloads?: number;
  fileUrl?: string;
  coverUrl?: string;
  updatedAt?: string;
  createdAt?: string;
};

const DEFAULT_BOOK_COVER = '/default-book-cover.svg';

function bookCoverSrc(item: Pick<KnowledgeItem, 'coverUrl'>) {
  return item.coverUrl?.trim() || DEFAULT_BOOK_COVER;
}

function fileHref(fileUrl?: string) {
  const value = fileUrl?.trim();
  if (!value) return '';
  if (!value.startsWith('/api/') || !/^https?:\/\//i.test(import.meta.env.VITE_API_URL || '')) return value;
  return new URL(value, import.meta.env.VITE_API_URL).toString();
}

function isExternalFile(fileUrl?: string) {
  return /^https?:\/\//i.test(fileUrl?.trim() || '');
}

type Topic = {
  key: TopicKey;
  label: string;
  tone: Tone;
  Icon: IconComp;
};

type LocalComment = { id: string; text: string; at: string };

const TOPIC_LABEL: Record<Exclude<TopicKey, 'all'>, string> = {
  rice: 'rice',
  disease: 'disease',
  farming: 'farming',
  organic: 'organic',
  irrigation: 'irrigation',
  pest: 'pest',
};

const SAVED_KEY = 'smartagro-knowledge-saved';
const COMMENTS_KEY = 'smartagro-knowledge-comments';

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`kc-ico ${tone} ${className}`}>{children}</span>;
}

function typeTone(cat: ResourceType): Tone {
  if (cat === 'Book') return 'sky';
  if (cat === 'Journal') return 'amber';
  return 'mint';
}

function TypeIcon({ category }: { category: ResourceType }) {
  if (category === 'Article') return <IconArticle />;
  if (category === 'Journal') return <IconJournal />;
  return <IconBook />;
}

function displayRating(item: KnowledgeItem) {
  const base = 4.4 + ((item.views || 0) % 6) * 0.1;
  return Math.min(5, Math.round(base * 10) / 10);
}

function reviewCount(item: KnowledgeItem) {
  return Math.max(12, Math.floor((item.views || 0) / 10));
}

function pageCount(item: KnowledgeItem) {
  const plain = stripHtml(`${item.description || ''} ${item.content || ''}`);
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.min(320, Math.max(80, Math.round(words / 4) || 120));
}

function readMinutes(item: KnowledgeItem) {
  const plain = `${item.description || ''} ${item.content || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.ceil(words / 180));
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(iso?: string) {
  if (!iso) return 'October 2026';
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatMonth(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function matchesTopic(item: KnowledgeItem, topic: TopicKey) {
  if (topic === 'all') return true;
  const tags = (item.tags || []).map((t) => t.toLowerCase());
  const title = item.title.toLowerCase();
  return tags.includes(topic) || title.includes(topic);
}

function primaryTopic(item: KnowledgeItem): Exclude<TopicKey, 'all'> {
  const tags = (item.tags || []).map((t) => t.toLowerCase());
  for (const key of Object.keys(TOPIC_LABEL) as Exclude<TopicKey, 'all'>[]) {
    if (tags.includes(key)) return key;
  }
  return 'farming';
}

function topicMeta(key: Exclude<TopicKey, 'all'>, topics: Topic[]) {
  return topics.find((t) => t.key === key)!;
}

function stripHtml(value?: string) {
  return (value || '')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistSaved(ids: Set<string>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

function loadComments(id: string): LocalComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, LocalComment[]>;
    return all[id] || [];
  } catch {
    return [];
  }
}

function persistComments(id: string, comments: LocalComment[]) {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, LocalComment[]>) : {};
    all[id] = comments;
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14L12 16.2 5.5 20V6A1.5 1.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11.2 16 6.8M8 12.8l8 5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="kc-stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStarFilled key={i} className={i < full ? 'is-on' : 'is-off'} />
      ))}
    </span>
  );
}

function similarItems(current: KnowledgeItem, all: KnowledgeItem[], type?: ResourceType, limit = 3) {
  const tags = new Set((current.tags || []).map((t) => t.toLowerCase()));
  return all
    .filter((i) => i._id !== current._id && (!type || i.category === type))
    .map((i) => ({
      item: i,
      score: (i.tags || []).filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .sort((a, b) => b.score - a.score || (b.item.views || 0) - (a.item.views || 0))
    .slice(0, limit)
    .map((x) => x.item);
}

export function KnowledgePage() {
  const { lang } = useLanguage();
  const t = knowledgeCopy(lang);
  const topics = useMemo<Topic[]>(
    () => [
      { key: 'all', label: t.all, tone: 'sky', Icon: IconBook },
      { key: 'rice', label: t.rice, tone: 'mint', Icon: IconRice },
      { key: 'disease', label: t.diseaseGuide, tone: 'coral', Icon: IconDisease },
      { key: 'farming', label: t.farmingTips, tone: 'teal', Icon: IconSprout },
      { key: 'organic', label: t.organic, tone: 'mint', Icon: IconLeaf },
      { key: 'irrigation', label: t.irrigation, tone: 'teal', Icon: IconDrop },
      { key: 'pest', label: t.pest, tone: 'coral', Icon: IconBug },
    ],
    [lang, t]
  );
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<TopicKey>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<SortKey>('popular');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => loadSaved());
  const [citeCopied, setCiteCopied] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const data = await api<KnowledgeItem[]>('/knowledge/articles?limit=200');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = items.filter((item) => matchesTopic(item, topic));
    if (typeFilter !== 'all') list = list.filter((item) => item.category === typeFilter);

    if (term) {
      list = list.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const tags = (item.tags || []).join(' ').toLowerCase();
        // Prefer title match so typing a book/article/journal name shows only that item
        return (
          title.includes(term) ||
          author.includes(term) ||
          description.includes(term) ||
          tags.includes(term)
        );
      });
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (term) {
        // Rank exact/starts-with title matches first when searching by name
        const at = (a.title || '').toLowerCase();
        const bt = (b.title || '').toLowerCase();
        const aExact = at === term ? 0 : at.startsWith(term) ? 1 : 2;
        const bExact = bt === term ? 0 : bt.startsWith(term) ? 1 : 2;
        if (aExact !== bExact) return aExact - bExact;
      }
      if (sort === 'popular') return (b.views || 0) - (a.views || 0);
      if (sort === 'rating') return displayRating(b) - displayRating(a);
      if (sort === 'alpha') return a.title.localeCompare(b.title);
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
    return sorted;
  }, [items, topic, typeFilter, sort, q]);

  async function openDetail(item: KnowledgeItem) {
    setDetailLoading(true);
    setCiteCopied(false);
    try {
      const full = await api<KnowledgeItem>(`/knowledge/articles/${item._id}`);
      setSelected(full);
      setItems((prev) =>
        prev.map((x) => (x._id === full._id ? { ...x, views: full.views ?? (x.views || 0) + 1 } : x))
      );
    } catch {
      setSelected(item);
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistSaved(next);
      return next;
    });
  }

  async function shareItem(item: KnowledgeItem) {
    const url = `${window.location.origin}/knowledge?id=${item._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.description || item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
  }

  function citation(item: KnowledgeItem) {
    const year = item.createdAt ? new Date(item.createdAt).getFullYear() : new Date().getFullYear();
    return `${item.author || 'Unknown'}. (${year}). ${item.title}. Smart Agro Knowledge Center.`;
  }

  async function copyCitation(item: KnowledgeItem) {
    try {
      await navigator.clipboard.writeText(citation(item));
      setCiteCopied(true);
    } catch {
      setCiteCopied(false);
    }
  }

  const books = filtered.filter((i) => i.category === 'Book');
  const articles = filtered.filter((i) => i.category === 'Article');
  const journals = filtered.filter((i) => i.category === 'Journal');

  const stats = useMemo(() => {
    return {
      total: items.length,
      books: items.filter((i) => i.category === 'Book').length,
      articles: items.filter((i) => i.category === 'Article').length,
      journals: items.filter((i) => i.category === 'Journal').length,
    };
  }, [items]);

  const popularTopics = useMemo(() => {
    return topics.filter((t) => t.key !== 'all').map((t) => ({
      ...t,
      count: items.filter((i) => matchesTopic(i, t.key)).length,
    }));
  }, [items, topics]);

  const showBooks = typeFilter === 'all' || typeFilter === 'Book';
  const showArticles = typeFilter === 'all' || typeFilter === 'Article';
  const showJournals = typeFilter === 'all' || typeFilter === 'Journal';

  return (
    <div className="kc-page">
      <section className="kc-hero kc-panel">
        <div className="kc-hero-top">
          <SoftIcon tone="sky">
            <IconBook />
          </SoftIcon>
          <div>
            <h1>{t.title}</h1>
            <p className="kc-tagline">{t.lead}</p>
          </div>
        </div>

        <form
          className="kc-search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <span className="kc-search-ico" aria-hidden>
            <IconSearch />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
          />
          {q.trim() ? (
            <button type="button" className="button secondary compact" onClick={() => setQ('')}>
              {t.clearSearch}
            </button>
          ) : (
            <button type="submit" className="button compact">
              {t.searchBtn}
            </button>
          )}
        </form>

        <div className="kc-stats" role="list">
          <span role="listitem">{stats.total.toLocaleString()} {t.resources}</span>
          <span role="listitem">{stats.books}+ {t.books}</span>
          <span role="listitem">{stats.articles}+ {t.articles}</span>
          <span role="listitem">{stats.journals}+ {t.journals}</span>
          <span role="listitem">{t.expertReviewed}</span>
          <span role="listitem">{t.inBurmese}</span>
        </div>
      </section>

      <section className="kc-panel">
        <div className="kc-section-head">
          <h2>{t.categories}</h2>
        </div>
        <div className="kc-topics" role="tablist" aria-label={t.categories}>
          {topics.map((topicItem) => {
            const count =
              topicItem.key === 'all' ? items.length : items.filter((i) => matchesTopic(i, topicItem.key)).length;
            const Icon = topicItem.Icon;
            return (
              <button
                key={topicItem.key}
                type="button"
                role="tab"
                aria-selected={topic === topicItem.key}
                className={`kc-topic ${topic === topicItem.key ? 'is-active' : ''}`}
                onClick={() => setTopic(topicItem.key)}
              >
                <SoftIcon tone={topicItem.tone} className="sm">
                  <Icon />
                </SoftIcon>
                <span>
                  {topicItem.label}
                  <small>({count})</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="kc-browse">
        <div className="kc-section-head">
          <h2>{t.browse}</h2>
        </div>
        <div className="kc-controls kc-panel">
          <div className="kc-view-toggle" role="group" aria-label={t.browse}>
            <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}>
              {t.grid}
            </button>
            <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>
              {t.list}
            </button>
          </div>
          <label className="kc-select">
            {t.sortLabel}
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="popular">{t.popular}</option>
              <option value="latest">{t.latest}</option>
              <option value="rating">{t.rating}</option>
              <option value="alpha">{t.alphabetical}</option>
            </select>
          </label>
          <label className="kc-select">
            {t.filterLabel}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}>
              <option value="all">{t.allTypes}</option>
              <option value="Book">{t.booksOnly}</option>
              <option value="Article">{t.articlesOnly}</option>
              <option value="Journal">{t.journalsOnly}</option>
            </select>
          </label>
        </div>
      </section>

      {error && <p className="error kc-error">{error}</p>}
      {loading && <p className="muted kc-error">{t.loadingResources}</p>}

      {!loading && filtered.length === 0 && (
        <div className="kc-panel soft-empty">
          <p>{t.emptyState}</p>
          <button
            type="button"
            className="button secondary compact"
            onClick={() => {
              setQ('');
              setTopic('all');
              setTypeFilter('all');
              void loadAll();
            }}
          >
            {t.resetFilters}
          </button>
        </div>
      )}

      {showBooks && books.length > 0 && (
        <section className="kc-panel">
          <div className="kc-section-head">
            <SoftIcon tone="sky" className="sm">
              <IconBook />
            </SoftIcon>
            <h2>{t.books}</h2>
          </div>
          <div className={view === 'grid' ? 'kc-book-grid' : 'kc-list'}>
            {books.map((item) =>
              view === 'grid' ? (
                <article key={item._id} className="kc-book-card">
                  <button type="button" className="kc-book-thumb" onClick={() => void openDetail(item)}>
                    <img src={bookCoverSrc(item)} alt="" loading="lazy" />
                  </button>
                  <h3>{item.title}</h3>
                  <div className="kc-meta">
                    <span className="kc-rating">
                      <IconStarFilled /> {displayRating(item).toFixed(1)}
                    </span>
                    <span>{(item.views || 0).toLocaleString()} {t.reads}</span>
                  </div>
                  <div className="kc-card-actions">
                    <button type="button" className="button compact" onClick={() => void openDetail(item)}>
                      {t.viewBook}
                    </button>
                    {item.fileUrl ? (
                      <a
                        className="button secondary compact"
                        href={fileHref(item.fileUrl)}
                        download
                        target={isExternalFile(item.fileUrl) ? '_blank' : undefined}
                        rel={isExternalFile(item.fileUrl) ? 'noreferrer' : undefined}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.download}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={`kc-icon-btn ${saved.has(item._id) ? 'is-saved' : ''}`}
                        aria-label={saved.has(item._id) ? t.unsave : t.save}
                        onClick={() => toggleSave(item._id)}
                      >
                        <IconBookmark filled={saved.has(item._id)} />
                      </button>
                    )}
                  </div>
                </article>
              ) : (
                <ResourceRow
                  key={item._id}
                  item={item}
                  saved={saved.has(item._id)}
                  onOpen={() => void openDetail(item)}
                  onSave={() => toggleSave(item._id)}
                  onShare={() => void shareItem(item)}
                  labels={t}
                />
              )
            )}
          </div>
        </section>
      )}

      {showArticles && articles.length > 0 && (
        <section className="kc-panel">
          <div className="kc-section-head">
            <SoftIcon tone="mint" className="sm">
              <IconArticle />
            </SoftIcon>
            <h2>{t.articles}</h2>
          </div>
          <div className="kc-list">
            {articles.map((item) => (
              <ResourceRow
                key={item._id}
                item={item}
                saved={saved.has(item._id)}
                onOpen={() => void openDetail(item)}
                onSave={() => toggleSave(item._id)}
                onShare={() => void shareItem(item)}
                showExcerpt
                labels={t}
              />
            ))}
          </div>
        </section>
      )}

      {showJournals && journals.length > 0 && (
        <section className="kc-panel">
          <div className="kc-section-head">
            <SoftIcon tone="amber" className="sm">
              <IconJournal />
            </SoftIcon>
            <h2>{t.researchJournals}</h2>
          </div>
          <div className="kc-list">
            {journals.map((item) => (
              <article key={item._id} className="kc-journal-card">
                <div className="kc-journal-top">
                  <SoftIcon tone="amber" className="sm">
                    <IconJournal />
                  </SoftIcon>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="muted">
                      {t.journals} · {item.author || 'Research team'} · {formatMonth(item.updatedAt || item.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="kc-excerpt">
                  {stripHtml(item.description) || stripHtml(item.content).slice(0, 160)}
                </p>
                <div className="kc-row-actions">
                  {item.fileUrl && (
                    <a className="button compact" href={fileHref(item.fileUrl)} download target={isExternalFile(item.fileUrl) ? '_blank' : undefined} rel={isExternalFile(item.fileUrl) ? 'noreferrer' : undefined}>
                      {t.downloadPdf}
                    </a>
                  )}
                  <button type="button" className="button secondary compact" onClick={() => void openDetail(item)}>
                    {t.viewAbstract}
                  </button>
                  <button type="button" className="button secondary compact" onClick={() => void openDetail(item)}>
                    {t.cite}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="kc-panel">
        <div className="kc-section-head">
          <h2>{t.popularCategories}</h2>
        </div>
        <div className="kc-popular-grid">
          {popularTopics.map((topicItem) => {
            const Icon = topicItem.Icon;
            return (
              <button
                key={topicItem.key}
                type="button"
                className="kc-popular-card"
                onClick={() => {
                  setTopic(topicItem.key);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <SoftIcon tone={topicItem.tone}>
                  <Icon />
                </SoftIcon>
                <strong>{topicItem.label}</strong>
                <span>
                  {topicItem.count} {topicItem.count === 1 ? t.resource : t.resourcesPlural}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {(selected || detailLoading) && (
        <div className="kc-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div
            className="kc-modal kc-modal-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Resource detail"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="kc-modal-head">
              <div className="kc-modal-title-row">
                <button type="button" className="kc-close-link" onClick={() => setSelected(null)}>
                  <IconClose /> {t.close}
                </button>
                <span className="kc-modal-sep" aria-hidden>
                  |
                </span>
                <span className="kc-modal-kind">
                  <SoftIcon tone={typeTone(selected?.category || 'Book')} className="sm">
                    <TypeIcon category={selected?.category || 'Book'} />
                  </SoftIcon>
                  {selected?.category || t.resource} Detail
                </span>
              </div>
            </header>

            <div className="kc-modal-scroll">
              {detailLoading && <p className="muted kc-modal-loading">Loading…</p>}

              {selected && !detailLoading && selected.category === 'Book' && (
                <BookDetail
                  item={selected}
                  all={items}
                  topics={topics}
                  labels={t}
                  saved={saved.has(selected._id)}
                  onOpen={(i) => void openDetail(i)}
                  onSave={() => toggleSave(selected._id)}
                />
              )}

              {selected && !detailLoading && selected.category === 'Article' && (
                <ArticleDetail
                  item={selected}
                  all={items}
                  saved={saved.has(selected._id)}
                  labels={t}
                  onSave={() => toggleSave(selected._id)}
                  onOpen={(i) => void openDetail(i)}
                />
              )}

              {selected && !detailLoading && selected.category === 'Journal' && (
                <div className="kc-modal-body">
                  <h2 className="kc-detail-title">{selected.title}</h2>
                  <div className="kc-meta wrap">
                    <span>{selected.author || 'Research team'}</span>
                    <span>{formatMonth(selected.updatedAt || selected.createdAt)}</span>
                  </div>
                  {selected.description && <p className="kc-lead">{selected.description}</p>}
                  <div className="kc-cite-box">
                    <strong>Citation (APA)</strong>
                    <p>{citation(selected)}</p>
                    <button type="button" className="button secondary compact" onClick={() => void copyCitation(selected)}>
                      {citeCopied ? t.copied : t.copyCitation}
                    </button>
                  </div>
                  <div className="kc-content">
                    {(selected.content || '')
                      .split(/\n{2,}/)
                      .map((block, i) => (
                        <p key={i}>{block}</p>
                      ))}
                  </div>
                  <div className="kc-row-actions">
                    {selected.fileUrl && (
                      <a className="button" href={fileHref(selected.fileUrl)} download target={isExternalFile(selected.fileUrl) ? '_blank' : undefined} rel={isExternalFile(selected.fileUrl) ? 'noreferrer' : undefined}>
                        <IconDownload /> {t.downloadPdf}
                      </a>
                    )}
                    <button
                      type="button"
                      className={`button secondary ${saved.has(selected._id) ? 'is-saved' : ''}`}
                      onClick={() => toggleSave(selected._id)}
                    >
                      {saved.has(selected._id) ? t.saved : t.save}
                    </button>
                    <button type="button" className="button secondary" onClick={() => void shareItem(selected)}>
                      {t.share}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function BookDetail({
  item,
  all,
  topics,
  labels,
  saved,
  onOpen,
  onSave,
}: {
  item: KnowledgeItem;
  all: KnowledgeItem[];
  topics: Topic[];
  labels: ReturnType<typeof knowledgeCopy>;
  saved: boolean;
  onOpen: (item: KnowledgeItem) => void;
  onSave: () => void;
}) {
  const topic = primaryTopic(item);
  const topicInfo = topicMeta(topic, topics);
  const TopicIcon = topicInfo.Icon;
  const rating = displayRating(item);
  const similar = similarItems(item, all, 'Book', 3);
  const pages = pageCount(item);
  const reviews = reviewCount(item);
  const description = (item.description || '').trim();
  const descriptionHtml = description
    ? looksLikeHtml(description)
      ? sanitizeHtml(description)
      : `<p>${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    : '<p>A practical guide for Myanmar farmers.</p>';

  return (
    <div className="kc-book-detail">
      <div className={`kc-book-hero tone-${topicInfo.tone}`}>
        <div className="kc-book-hero-glow" aria-hidden />
        <div className={`kc-book-cover ${item.coverUrl ? 'has-photo' : `tone-${topicInfo.tone}`}`}>
          <img className="kc-book-cover-img" src={bookCoverSrc(item)} alt={`${item.title} cover`} />
          {!item.coverUrl && (
            <div className="kc-book-cover-caption">
              <strong>{item.title}</strong>
              <span>Smart Agro Library</span>
            </div>
          )}
        </div>

        <div className="kc-book-hero-copy">
          <div className="kc-book-pills">
            <span className="kc-pill">
              <SoftIcon tone={topicInfo.tone} className="sm">
                <TopicIcon />
              </SoftIcon>
              {topicInfo.label}
            </span>
            <span className="kc-pill">
              <SoftIcon tone="sky" className="sm">
                <IconBook />
              </SoftIcon>
              {labels.book}
            </span>
          </div>

          <h2 className="kc-book-title">{item.title}</h2>
          <p className="kc-book-author">by {item.author || 'Smart Agro Team'}</p>

          <div className="kc-book-rating-panel">
            <StarRow rating={rating} />
            <strong>{rating.toFixed(1)}</strong>
            <span className="muted">{reviews.toLocaleString()} reviews</span>
          </div>

          <div className="kc-book-stat-strip">
            <article>
              <span>Published</span>
              <strong>{formatMonthYear(item.createdAt || item.updatedAt)}</strong>
            </article>
            <article>
              <span>Pages</span>
              <strong>{pages}</strong>
            </article>
            <article>
              <span>{labels.language}</span>
              <strong>{labels.languageLabel}</strong>
            </article>
            <article>
              <span>{labels.reads}</span>
              <strong>{(item.views || 0).toLocaleString()}</strong>
            </article>
          </div>

          <div className="kc-book-cta">
            {item.fileUrl ? (
              <a className="kc-book-btn primary" href={fileHref(item.fileUrl)} download target={isExternalFile(item.fileUrl) ? '_blank' : undefined} rel={isExternalFile(item.fileUrl) ? 'noreferrer' : undefined}>
                <IconDownload />
                <span>PDF</span>
              </a>
            ) : (
              <button type="button" className="kc-book-btn primary" disabled>
                <IconDownload />
                <span>PDF</span>
              </button>
            )}
            <button
              type="button"
              className={`kc-book-btn ghost ${saved ? 'is-saved' : ''}`}
              onClick={onSave}
            >
              <IconBookmark filled={saved} />
              <span>{saved ? labels.saved : labels.save}</span>
            </button>
          </div>
        </div>
      </div>

      <section className="kc-book-panel">
        <div className="kc-book-panel-head">
          <SoftIcon tone="mint" className="sm">
            <IconLeaf />
          </SoftIcon>
          <h3>About this book</h3>
        </div>
        <div className="kc-html-body" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      </section>

      {(item.tags || []).length > 0 && (
        <section className="kc-book-panel compact">
          <div className="kc-book-panel-head">
            <h3>Topics</h3>
          </div>
          <div className="kc-tags">
            {(item.tags || []).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="kc-book-panel">
          <div className="kc-book-panel-head">
            <SoftIcon tone="amber" className="sm">
              <IconSprout />
            </SoftIcon>
            <h3>More like this</h3>
          </div>
          <div className="kc-similar-grid">
            {similar.map((s) => (
              <button key={s._id} type="button" className="kc-similar-card" onClick={() => onOpen(s)}>
                <img src={bookCoverSrc(s)} alt="" />
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.author || 'Smart Agro Team'}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArticleDetail({
  item,
  all,
  saved,
  labels,
  onSave,
  onOpen,
}: {
  item: KnowledgeItem;
  all: KnowledgeItem[];
  saved: boolean;
  labels: ReturnType<typeof knowledgeCopy>;
  onSave: () => void;
  onOpen: (item: KnowledgeItem) => void;
}) {
  const [comments, setComments] = useState<LocalComment[]>(() => loadComments(item._id));
  const [draft, setDraft] = useState('');
  const [showComments, setShowComments] = useState(true);
  const rating = displayRating(item);
  const related = similarItems(item, all, undefined, 3);
  const topic = primaryTopic(item);
  const captions = articleCaptions(item, topic);

  useEffect(() => {
    setComments(loadComments(item._id));
    setDraft('');
  }, [item._id]);

  function postComment(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [
      ...comments,
      { id: `${Date.now()}`, text, at: new Date().toISOString() },
    ];
    setComments(next);
    persistComments(item._id, next);
    setDraft('');
    setShowComments(true);
  }

  return (
    <div className="kc-modal-body">
      <div className="kc-article-head">
        <SoftIcon tone="mint">
          <IconArticle />
        </SoftIcon>
        <h2 className="kc-detail-title">{item.title}</h2>
      </div>

      <div className="kc-meta wrap">
        <span>By {item.author || 'Smart Agro Team'}</span>
        <span>Published: {formatDate(item.createdAt || item.updatedAt)}</span>
        <span>{readMinutes(item)} min read</span>
      </div>

      <div className="kc-rating-line">
        <StarRow rating={rating} />
        <strong>{rating.toFixed(1)}</strong>
        <span className="muted">({reviewCount(item)} reviews)</span>
      </div>

      {(item.tags || []).length > 0 && (
        <div className="kc-tags">
          {(item.tags || []).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}

      <hr className="kc-divider" />

      <div className="kc-article-body">
        {renderArticleBody(item.content || '', captions)}
      </div>

      {related.length > 0 && (
        <section className="kc-detail-block">
          <h3>Related Content</h3>
          <div className="kc-related">
            {related.map((r) => (
              <button key={r._id} type="button" className="kc-related-item" onClick={() => onOpen(r)}>
                <SoftIcon tone={typeTone(r.category)} className="sm">
                  <TypeIcon category={r.category} />
                </SoftIcon>
                <span>{r.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="kc-row-actions">
        <button
          type="button"
          className={`button secondary ${showComments ? 'is-active-soft' : ''}`}
          onClick={() => setShowComments((v) => !v)}
        >
          <IconChat /> Comments ({comments.length})
        </button>
        <button type="button" className={`button ${saved ? 'is-saved' : ''}`} onClick={onSave}>
          <IconBookmark filled={saved} /> {saved ? labels.saved : labels.save}
        </button>
      </div>

      {showComments && (
        <section className="kc-comments">
          {comments.length === 0 && <p className="muted">Be the first to share a tip with the community.</p>}
          <ul className="kc-comment-list">
            {comments.map((c) => (
              <li key={c.id}>
                <strong>Farmer</strong>
                <span className="muted">{formatDate(c.at)}</span>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
          <form className="kc-comment-form" onSubmit={postComment}>
            <SoftIcon tone="teal" className="sm">
              <IconChat />
            </SoftIcon>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment..."
              aria-label="Write a comment"
            />
            <button type="submit" className="button compact">
              Post
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function articleCaptions(item: KnowledgeItem, topic: Exclude<TopicKey, 'all'>) {
  if (topic === 'rice' || /blast/i.test(item.title)) {
    return ['Rice Blast Symptoms on Leaves', 'Disease Progression Stages'];
  }
  if (/pest|borer|planthopper|hispa|folder|gall/i.test(item.title)) {
    return ['Rice Pest Scouting', 'IPM Field Checklist'];
  }
  return ['Field Observation Notes', 'Recommended Farm Practice'];
}

type BodyBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'checks'; items: string[] }
  | { kind: 'image'; caption: string };

function parseArticleBlocks(content: string): BodyBlock[] {
  const lines = content.split(/\n/);
  const blocks: BodyBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      i += 1;
      continue;
    }

    const isHeading =
      (/^[A-Z][\w\s/&-]+:?$/.test(line) && line.length < 60 && !/^\d+\./.test(line) && !line.startsWith('-')) ||
      line.endsWith(':');

    if (isHeading && !/^\d+\./.test(line)) {
      blocks.push({ kind: 'heading', text: line.replace(/:$/, '') });
      i += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'list', ordered: true, items });
      continue;
    }

    if (/^[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'checks', items });
      continue;
    }

    const paras: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        /^\d+\.\s+/.test(next) ||
        /^[-•]\s+/.test(next) ||
        ((/^[A-Z][\w\s/&-]+:?$/.test(next) || next.endsWith(':')) && next.length < 60)
      ) {
        break;
      }
      paras.push(next);
      i += 1;
    }
    blocks.push({ kind: 'para', text: paras.join(' ') });
  }

  return blocks;
}

function looksLikeHtml(content: string) {
  return /<\/?(p|div|ul|ol|li|h[1-6]|span|strong|em|b|i|u|br)\b/i.test(content);
}

function renderArticleBody(content: string, captions: string[]) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="kc-html-body"
        dangerouslySetInnerHTML={{
          __html: content
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, ''),
        }}
      />
    );
  }

  const blocks = parseArticleBlocks(content);
  const nodes: ReactNode[] = [];
  let imagesInserted = 0;

  blocks.forEach((block, idx) => {
    if (block.kind === 'heading') {
      nodes.push(
        <h3 key={`h-${idx}`} className="kc-article-h">
          {block.text}
        </h3>
      );
    } else if (block.kind === 'para') {
      nodes.push(
        <p key={`p-${idx}`} className="kc-article-p">
          {block.text}
        </p>
      );
      if (imagesInserted < captions.length && (idx === 0 || block.text.length > 80)) {
        nodes.push(
          <figure key={`img-${imagesInserted}`} className="kc-article-figure">
            <div className={`kc-article-img tone-${imagesInserted === 0 ? 'mint' : 'peach'}`} />
            <figcaption>{captions[imagesInserted]}</figcaption>
          </figure>
        );
        imagesInserted += 1;
      }
    } else if (block.kind === 'list') {
      nodes.push(
        <ol key={`ol-${idx}`} className="kc-article-ol">
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ol>
      );
      if (imagesInserted < captions.length && imagesInserted === 1) {
        nodes.push(
          <figure key={`img-${imagesInserted}`} className="kc-article-figure">
            <div className="kc-article-img tone-peach" />
            <figcaption>{captions[imagesInserted]}</figcaption>
          </figure>
        );
        imagesInserted += 1;
      }
    } else if (block.kind === 'checks') {
      nodes.push(
        <ul key={`ck-${idx}`} className="kc-article-checks">
          {block.items.map((it) => (
            <li key={it}>
              <SoftIcon tone="mint" className="sm">
                <IconCheck />
              </SoftIcon>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    }
  });

  while (imagesInserted < Math.min(2, captions.length)) {
    nodes.push(
      <figure key={`img-fill-${imagesInserted}`} className="kc-article-figure">
        <div className={`kc-article-img tone-${imagesInserted === 0 ? 'mint' : 'sky'}`} />
        <figcaption>{captions[imagesInserted]}</figcaption>
      </figure>
    );
    imagesInserted += 1;
  }

  return nodes;
}

function ResourceRow({
  item,
  saved,
  onOpen,
  onSave,
  onShare,
  showExcerpt,
  labels,
}: {
  item: KnowledgeItem;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
  onShare: () => void;
  showExcerpt?: boolean;
  labels: ReturnType<typeof knowledgeCopy>;
}) {
  return (
    <article className="kc-row-card">
      <div className="kc-row-top">
        {item.category === 'Book' ? (
          <button type="button" className="kc-row-cover" onClick={onOpen} aria-label={item.title}>
            <img src={bookCoverSrc(item)} alt="" loading="lazy" />
          </button>
        ) : (
          <SoftIcon tone={typeTone(item.category)} className="sm">
            <TypeIcon category={item.category} />
          </SoftIcon>
        )}
        <div>
          <button type="button" className="kc-title-btn" onClick={onOpen}>
            {item.title}
          </button>
          <div className="kc-meta">
            <span>By {item.author || 'Smart Agro Team'}</span>
            <span className="kc-rating">
              <IconStarFilled /> {displayRating(item).toFixed(1)}
            </span>
            <span>{formatDate(item.updatedAt || item.createdAt)}</span>
            {item.category === 'Article' && <span>{readMinutes(item)} min read</span>}
          </div>
        </div>
      </div>
      {showExcerpt && (
        <p className="kc-excerpt">
          {stripHtml(item.description) || stripHtml(item.content).slice(0, 140) || '—'}
        </p>
      )}
      {(item.tags || []).length > 0 && (
        <div className="kc-tags">
          {(item.tags || []).slice(0, 4).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}
      <div className="kc-row-actions">
        <button type="button" className="button compact" onClick={onOpen}>
          {item.category === 'Article'
            ? labels.readArticle
            : item.category === 'Book'
              ? labels.viewBook
              : labels.readNow}
        </button>
        {item.category === 'Book' && item.fileUrl && (
          <a className="button secondary compact" href={fileHref(item.fileUrl)} download target={isExternalFile(item.fileUrl) ? '_blank' : undefined} rel={isExternalFile(item.fileUrl) ? 'noreferrer' : undefined}>
            <IconDownload /> {labels.download}
          </a>
        )}
        <button type="button" className={`button secondary compact ${saved ? 'is-saved' : ''}`} onClick={onSave}>
          <IconBookmark filled={saved} /> {saved ? labels.saved : labels.save}
        </button>
        <button type="button" className="button secondary compact" onClick={onShare}>
          <IconShare /> {labels.share}
        </button>
      </div>
    </article>
  );
}
