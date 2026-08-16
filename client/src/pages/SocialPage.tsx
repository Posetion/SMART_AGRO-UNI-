import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { IconChat, IconDetect, IconUserPlus } from '../components/icons';
import { socialCopy } from '../i18n/messages';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';

type SocialMessages = ReturnType<typeof socialCopy>;

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`sf-ico ${tone} ${className}`}>{children}</span>;
}

type DiagnosisOpt = {
  _id: string;
  disease: string;
  cropType?: string;
  severityIndex?: number;
  createdAt?: string;
  isVerified?: boolean;
};

type PostAuthor = {
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  avatarTone?: string;
};

type Reply = {
  _id?: string;
  userId?: string | PostAuthor;
  content: string;
  timestamp?: string;
};

type Comment = {
  _id: string;
  userId?: string | PostAuthor;
  content: string;
  timestamp?: string;
  replies?: Reply[];
};

type Post = {
  _id: string;
  content: string;
  images?: string[];
  likes?: string[];
  comments?: Comment[];
  createdAt?: string;
  userId?: PostAuthor;
  diagnosticId?: {
    _id?: string;
    disease?: string;
    severityIndex?: number;
    cropType?: string;
    isVerified?: boolean;
  } | null;
};

type CropFilter = 'all' | 'rice';

function personName(u: string | PostAuthor | null | undefined, t: SocialMessages) {
  if (!u) return t.farmer;
  if (typeof u === 'string') return t.farmer;
  return u.fullName?.trim() || u.email?.split('@')[0] || t.farmer;
}

function personId(u: string | PostAuthor | null | undefined): string | null {
  if (!u || typeof u === 'string') return null;
  return u._id || null;
}

function personAvatar(u: string | PostAuthor | null | undefined): string | undefined {
  if (!u || typeof u === 'string') return undefined;
  return u.avatarUrl?.trim() || undefined;
}

function AuthorLink({
  user: author,
  name,
  className = '',
}: {
  user?: string | PostAuthor | null;
  name: string;
  className?: string;
}) {
  const id = personId(author);
  if (!id) return <strong className={className}>{name}</strong>;
  return (
    <Link className={`sf-author-link ${className}`.trim()} to={`/profile/${id}`} title={name}>
      {name}
    </Link>
  );
}

function AuthorAvatar({
  user,
  name,
  size = '',
}: {
  user?: string | PostAuthor | null;
  name: string;
  size?: string;
}) {
  const src = mediaUrl(personAvatar(user));
  const tone =
    user && typeof user !== 'string' && user.avatarTone ? `tone-${user.avatarTone}` : '';
  const cls = `avatar ${size} ${tone}`.trim();
  if (src) {
    return <img className={cls} src={src} alt="" />;
  }
  return <span className={cls}>{name.slice(0, 1).toUpperCase()}</span>;
}

function roleLabel(role: string | undefined, t: SocialMessages) {
  if (role === 'admin') return t.admin;
  if (role === 'expert') return t.expert;
  return t.farmer;
}

function timeAgo(iso: string | undefined, t: SocialMessages) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return t.justNow;
  if (m < 60) return `${m}${t.agoM}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t.agoH}`;
  const d = Math.floor(h / 24);
  return `${d}${t.agoD}`;
}

function severityLabel(n: number | undefined, t: SocialMessages) {
  if (n == null) return '—';
  if (n >= 70) return t.high;
  if (n >= 40) return t.moderate;
  return t.low;
}

function renderContent(text: string) {
  const parts = text.split(/(#[\w\u1000-\u109F]+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="sf-hashtag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const MAX_POST_PHOTOS = 10;

/** Facebook-style photo grid: 1 / 2 / 3 / 4(+N) layouts */
function PhotoGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen?: (index: number) => void;
}) {
  if (!images.length) return null;
  const total = images.length;
  const layout = Math.min(total, 4);
  const shown = images.slice(0, layout);
  const extra = total - layout;

  return (
    <div className={`sf-gallery layout-${layout}${total >= 5 ? ' has-more' : ''}`}>
      {shown.map((src, idx) => {
        const content = (
          <>
            <img src={mediaUrl(src) || src} alt="" loading="lazy" />
            {idx === layout - 1 && extra > 0 && (
              <span className="sf-img-more">+{extra}</span>
            )}
          </>
        );
        const className = `sf-img tile-${idx + 1}`;
        if (onOpen) {
          return (
            <button
              key={`${src}-${idx}`}
              type="button"
              className={className}
              onClick={() => onOpen(idx)}
            >
              {content}
            </button>
          );
        }
        return (
          <div key={`${src}-${idx}`} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function SocialPage() {
  const { lang } = useLanguage();
  const t = socialCopy(lang);
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisOpt[]>([]);
  const [cropFilter, setCropFilter] = useState<CropFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [diagnosticId, setDiagnosticId] = useState('');
  const [cropHint, setCropHint] = useState<'Rice' | ''>('');
  const [publishing, setPublishing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('smart_agro_saved_posts') || '{}');
    } catch {
      return {};
    }
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const [reportCategory, setReportCategory] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || t.farmer;
  const handle = user?.email?.split('@')[0] || 'farmer';
  const avatarSrc = mediaUrl(profileAvatarUrl);

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    if (!menuOpenId) return;
    function onDoc(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (el?.closest('.sf-more-wrap')) return;
      setMenuOpenId(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpenId]);

  const linkedDiagnosis = useMemo(
    () => diagnoses.find((d) => d._id === diagnosticId) || null,
    [diagnoses, diagnosticId]
  );

  const previewBody = useMemo(() => {
    const text = content.trim();
    if (!text) return '';
    if (cropHint && !text.includes(`Crop: ${cropHint}`)) {
      return `${text}\n\nCrop: ${cropHint}`;
    }
    return text;
  }, [content, cropHint]);

  const hasPreview = Boolean(previewBody || previewUrls.length || linkedDiagnosis);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const [feed, history, me] = await Promise.all([
        api<Post[]>('/social/posts?limit=50', { token: accessToken }),
        api<DiagnosisOpt[]>('/detections/history', { token: accessToken }).catch(() => []),
        api<{ fullName?: string; avatarUrl?: string }>('/auth/me', {
          token: accessToken,
        }).catch(() => null),
      ]);
      setPosts(Array.isArray(feed) ? feed : []);
      setDiagnoses(
        (history || []).filter((d) => d.isVerified).length
          ? (history || []).filter((d) => d.isVerified)
          : history || []
      );
      setProfileAvatarUrl(mediaUrl(me?.avatarUrl) || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') {
        setLightbox((cur) =>
          cur
            ? { ...cur, index: (cur.index - 1 + cur.images.length) % cur.images.length }
            : cur
        );
      }
      if (e.key === 'ArrowRight') {
        setLightbox((cur) =>
          cur ? { ...cur, index: (cur.index + 1) % cur.images.length } : cur
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  useEffect(() => {
    const draft = location.state as
      | { draftContent?: string; diagnosticId?: string; cropHint?: 'Rice' | '' }
      | null;
    if (!draft?.draftContent && !draft?.diagnosticId) return;
    if (draft.draftContent) setContent(draft.draftContent);
    if (draft.diagnosticId) {
      setDiagnosticId(draft.diagnosticId);
      setShowAdvanced(true);
    }
    if (draft.cropHint) setCropHint(draft.cropHint);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const myPosts = useMemo(
    () => posts.filter((p) => p.userId?._id && user?.id && String(p.userId._id) === user.id),
    [posts, user?.id]
  );

  const likesReceived = useMemo(
    () => myPosts.reduce((n, p) => n + (p.likes?.length || 0), 0),
    [myPosts]
  );

  const savedCount = useMemo(() => Object.values(saved).filter(Boolean).length, [saved]);

  const filtered = useMemo(() => {
    let list = [...posts];
    const q = search.trim().toLowerCase();

    list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (cropFilter === 'rice') {
      list = list.filter(
        (p) =>
          p.diagnosticId?.cropType === 'Rice' ||
          /rice|blast|blight|tungro|smut|planthopper|borer|hispa|folder|#rice/i.test(p.content)
      );
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.diagnosticId?.disease?.toLowerCase().includes(q) ||
          personName(p.userId, t).toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, cropFilter, search, t]);

  function persistSaved(next: Record<string, boolean>) {
    setSaved(next);
    localStorage.setItem('smart_agro_saved_posts', JSON.stringify(next));
  }

  async function publish(e?: FormEvent) {
    e?.preventDefault();
    if (!accessToken || !content.trim()) return;
    setPublishing(true);
    setError('');
    try {
      const form = new FormData();
      const bodyText =
        cropHint && !content.includes(`Crop: ${cropHint}`)
          ? `${content.trim()}\n\nCrop: ${cropHint}`
          : content.trim();
      form.append('content', bodyText);
      if (diagnosticId) form.append('diagnosticId', diagnosticId);
      files.slice(0, MAX_POST_PHOTOS).forEach((f) => form.append('images', f));

      await api('/social/posts', {
        method: 'POST',
        token: accessToken,
        formData: form,
      });
      setContent('');
      setFiles([]);
      setDiagnosticId('');
      setCropHint('');
      setShowAdvanced(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  async function like(id: string) {
    if (!accessToken) return;
    try {
      await api(`/social/posts/${id}/like`, { method: 'POST', token: accessToken });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  }

  async function sendComment(postId: string) {
    if (!accessToken) return;
    const text = (replyDrafts[postId] || '').trim();
    if (!text) return;
    try {
      await api(`/social/posts/${postId}/comments`, {
        method: 'POST',
        token: accessToken,
        body: { content: text },
      });
      setReplyDrafts((d) => ({ ...d, [postId]: '' }));
      setExpandedComments((e) => ({ ...e, [postId]: true }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to comment');
    }
  }

  async function sendNestedReply(postId: string, commentId: string, text: string) {
    if (!accessToken || !text.trim()) return;
    try {
      await api(`/social/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        token: accessToken,
        body: { content: text.trim() },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reply');
    }
  }

  async function deleteOwnPost(id: string) {
    if (!accessToken) return;
    if (!window.confirm(t.deletePostConfirm)) return;
    setError('');
    try {
      await api(`/social/posts/${id}`, { method: 'DELETE', token: accessToken });
      setMenuOpenId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }

  function openReport(post: Post) {
    setMenuOpenId(null);
    setReportTarget(post);
    setReportCategory('spam');
    setReportDetails('');
  }

  async function submitReport() {
    if (!accessToken || !reportTarget) return;
    const labels: Record<string, string> = {
      spam: t.reportSpam,
      harassment: t.reportHarassment,
      false: t.reportFalse,
      inappropriate: t.reportInappropriate,
      other: t.reportOther,
    };
    const label = labels[reportCategory] || t.reportOther;
    const extra = reportDetails.trim();
    const reason = extra ? `${label}: ${extra}` : label;
    if (reason.length < 3) return;
    setReportBusy(true);
    setError('');
    try {
      await api(`/social/posts/${reportTarget._id}/report`, {
        method: 'POST',
        token: accessToken,
        body: { reason },
      });
      setReportedIds((prev) => ({ ...prev, [reportTarget._id]: true }));
      setReportTarget(null);
      setNotice(t.reportSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report post');
    } finally {
      setReportBusy(false);
    }
  }

  if (!user || !accessToken) {
    return (
      <div className="sf-guest">
        <div className="sf-guest-card">
          <SoftIcon tone="mint" className="lg">
            <IconChat />
          </SoftIcon>
          <h1>{t.guestTitle}</h1>
          <p>{t.guestLead}</p>
          <Link className="button" to="/login">
            {t.loginOtp}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-layout sf-layout-2col">
      <section className="sf-center">
        <label className="sf-search sf-search-inline">
          <SoftIcon tone="teal">
            <SvgSearch />
          </SoftIcon>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPosts}
            aria-label={t.searchPosts}
          />
        </label>

        <div className="sf-crop-chips">
          <button
            type="button"
            className={`chip-all ${cropFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setCropFilter('all')}
          >
            <SoftIcon tone="mint">
              <SvgSprout />
            </SoftIcon>
            {t.allCrops}
          </button>
          <button
            type="button"
            className={`chip-rice ${cropFilter === 'rice' ? 'is-active' : ''}`}
            onClick={() => setCropFilter('rice')}
          >
            <SoftIcon tone="amber">
              <SvgRice />
            </SoftIcon>
            {t.rice}
          </button>
        </div>

        <form className="sf-composer sf-composer-simple" onSubmit={(e) => void publish(e)}>
          <div className="sf-composer-top">
            {avatarSrc ? (
              <img className="avatar" src={avatarSrc} alt="" />
            ) : (
              <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.mindPlaceholder}
            />
          </div>

          {files.length > 0 && (
            <ul className="sf-composer-thumbs">
              {previewUrls.map((src, i) => (
                <li key={`${files[i]?.name || 'img'}-${i}`}>
                  <img src={src} alt="" />
                  <button
                    type="button"
                    aria-label={t.removePhoto}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {(files.length > 0 || showAdvanced) && (
            <div className="sf-composer-meta">
              {files.length > 0 && (
                <span className="sf-meta-pill sky">
                  <SvgPhoto /> {files.length}/{MAX_POST_PHOTOS} {t.photosReady}
                </span>
              )}
              {showAdvanced && (
                <select value={diagnosticId} onChange={(e) => setDiagnosticId(e.target.value)}>
                  <option value="">{t.noDiagnosis}</option>
                  {diagnoses.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.disease} · {d.cropType || t.crop}
                      {d.isVerified ? ` · ${t.verified}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="sf-composer-bar">
            <div className="sf-composer-tools">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  setFiles((prev) => {
                    const next = [...prev];
                    for (const file of picked) {
                      if (next.length >= MAX_POST_PHOTOS) break;
                      const dup = next.some(
                        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
                      );
                      if (!dup) next.push(file);
                    }
                    return next;
                  });
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="tool-sky"
                aria-label={t.photos}
                title={`${t.photos} (max ${MAX_POST_PHOTOS})`}
                disabled={files.length >= MAX_POST_PHOTOS}
                onClick={() => fileRef.current?.click()}
              >
                <SoftIcon tone="sky">
                  <SvgPhoto />
                </SoftIcon>
              </button>
              <button
                type="button"
                className="tool-amber"
                aria-label={t.linkDiagnosis}
                title={t.linkDiagnosis}
                onClick={() => setShowAdvanced((v) => !v)}
              >
                <SoftIcon tone="amber">
                  <SvgLink />
                </SoftIcon>
              </button>
              <button
                type="button"
                className={`sf-preview-toggle ${showPreview ? 'is-active' : ''}`}
                onClick={() => setShowPreview((v) => !v)}
              >
                {t.postPreview}
              </button>
            </div>
            <button type="submit" className="sf-post-btn" disabled={publishing || !content.trim()}>
              {publishing ? t.posting : t.post}
              <SvgSend />
            </button>
          </div>

          {showPreview && (
            <div className="sf-post-preview" aria-live="polite">
              <header className="sf-post-preview-head">
                <div>
                  <strong>{t.postPreview}</strong>
                  <span>{t.postPreviewLead}</span>
                </div>
              </header>
              {hasPreview ? (
                <article className="sf-card sf-card-simple sf-preview-card">
                  <header className="sf-card-head">
                    {avatarSrc ? (
                      <img className="avatar" src={avatarSrc} alt="" />
                    ) : (
                      <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                    )}
                    <div>
                      <strong>{displayName}</strong>
                      <span>
                        {roleLabel(user?.role, t)} · {t.justNow}
                      </span>
                    </div>
                  </header>
                  {previewBody ? <p className="sf-content">{renderContent(previewBody)}</p> : null}
                  <PhotoGallery images={previewUrls} />
                  {linkedDiagnosis && (
                    <div className="sf-diag">
                      <span className="diag-disease">
                        <IconDetect /> {linkedDiagnosis.disease}
                      </span>
                      <span className="diag-sev">
                        {severityLabel(linkedDiagnosis.severityIndex, t)}
                      </span>
                      {linkedDiagnosis.cropType && (
                        <span className="diag-crop">{linkedDiagnosis.cropType}</span>
                      )}
                      {linkedDiagnosis.isVerified && (
                        <span className="ok">{t.verifiedBadge}</span>
                      )}
                    </div>
                  )}
                  <div className="sf-preview-actions" aria-hidden>
                    <span>Like</span>
                    <span>Comment</span>
                    <span>Share</span>
                  </div>
                </article>
              ) : (
                <p className="sf-preview-empty">{t.previewEmpty}</p>
              )}
            </div>
          )}
        </form>

        {error && <div className="auth-banner error">{error}</div>}
        {notice && <div className="auth-banner ok">{notice}</div>}
        {loading && <p className="sf-muted">{t.loading}</p>}

        <div className="sf-list">
          {filtered.map((p) => {
            const liked = Boolean(user.id && p.likes?.some((id) => String(id) === user.id));
            const open = expandedComments[p._id];
            const comments = p.comments || [];
            const name = personName(p.userId, t);

            return (
              <article key={p._id} id={`post-${p._id}`} className="sf-card sf-card-simple">
                <header className="sf-card-head">
                  <Link
                    className="sf-avatar-link"
                    to={personId(p.userId) ? `/profile/${personId(p.userId)}` : '/social'}
                    aria-label={name}
                  >
                    <AuthorAvatar user={p.userId} name={name} />
                  </Link>
                  <div>
                    <AuthorLink user={p.userId} name={name} />
                    <span>
                      {roleLabel(p.userId?.role, t)} · {timeAgo(p.createdAt, t)}
                    </span>
                  </div>
                  {!user.isGuest && (
                    <div className="sf-more-wrap">
                      <button
                        type="button"
                        className="sf-more-btn"
                        aria-label={t.moreActions}
                        aria-expanded={menuOpenId === p._id}
                        onClick={() => setMenuOpenId((id) => (id === p._id ? null : p._id))}
                      >
                        ⋯
                      </button>
                      {menuOpenId === p._id && (
                        <div className="sf-more-menu" role="menu">
                          {String(p.userId?._id) === user.id ? (
                            <button
                              type="button"
                              className="sf-more-danger"
                              onClick={() => void deleteOwnPost(p._id)}
                            >
                              {t.deletePost}
                            </button>
                          ) : reportedIds[p._id] ? (
                            <button type="button" disabled>
                              {t.alreadyReported}
                            </button>
                          ) : (
                            <button type="button" onClick={() => openReport(p)}>
                              {t.report}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </header>

                <p className="sf-content">{renderContent(p.content)}</p>

                {!!p.images?.length && (
                  <PhotoGallery
                    images={p.images}
                    onOpen={(index) => setLightbox({ images: p.images || [], index })}
                  />
                )}

                {p.diagnosticId && (
                  <div className="sf-diag">
                    <span className="diag-disease">
                      <IconDetect /> {p.diagnosticId.disease}
                    </span>
                    <span className="diag-sev">{severityLabel(p.diagnosticId.severityIndex, t)}</span>
                    {p.diagnosticId.cropType && (
                      <span className="diag-crop">{p.diagnosticId.cropType}</span>
                    )}
                  </div>
                )}

                <div className="sf-actions">
                  <button
                    type="button"
                    className={`act-like ${liked ? 'liked' : ''}`}
                    onClick={() => void like(p._id)}
                  >
                    <SoftIcon tone="coral">
                      <ActionIcon kind="like" filled={liked} />
                    </SoftIcon>
                    {p.likes?.length || 0}
                  </button>
                  <button
                    type="button"
                    className={`act-comment ${open ? 'is-open' : ''}`}
                    aria-expanded={open}
                    onClick={() => setExpandedComments((e) => ({ ...e, [p._id]: !e[p._id] }))}
                  >
                    <SoftIcon tone="sky">
                      <ActionIcon kind="comment" />
                    </SoftIcon>
                    {comments.length}
                  </button>
                  <button
                    type="button"
                    className={`sf-save act-save ${saved[p._id] ? 'saved' : ''}`}
                    aria-label={saved[p._id] ? t.unsave : t.save}
                    onClick={() => persistSaved({ ...saved, [p._id]: !saved[p._id] })}
                  >
                    <SoftIcon tone="amber">
                      <ActionIcon kind="save" filled={Boolean(saved[p._id])} />
                    </SoftIcon>
                  </button>
                  {p.userId?._id && user.id && String(p.userId._id) !== user.id && !user.isGuest && (
                    <>
                      <button
                        type="button"
                        className="act-friend"
                        onClick={() => {
                          void (async () => {
                            if (!accessToken || !p.userId?._id) return;
                            try {
                              await api('/messages/friends/request', {
                                method: 'POST',
                                token: accessToken,
                                body: { userId: p.userId._id },
                              });
                            } catch {
                              /* ignore duplicate / already friends */
                            }
                          })();
                        }}
                      >
                        <SoftIcon tone="coral">
                          <IconUserPlus />
                        </SoftIcon>
                        {t.addFriend}
                      </button>
                      <button
                        type="button"
                        className="act-message"
                        onClick={() => {
                          void (async () => {
                            if (!accessToken || !p.userId?._id) return;
                            try {
                              const data = await api<{ _id: string }>('/messages/conversations', {
                                method: 'POST',
                                token: accessToken,
                                body: { userId: p.userId._id },
                              });
                              navigate(`/messages?c=${data._id}`);
                            } catch {
                              navigate('/messages');
                            }
                          })();
                        }}
                      >
                        <SoftIcon tone="teal">
                          <IconChat />
                        </SoftIcon>
                        {t.messageUser}
                      </button>
                    </>
                  )}
                </div>

                {open && (
                  <div className="sf-thread">
                    {comments.length === 0 && <p className="sf-muted">{t.noReplies}</p>}
                    {comments.map((c) => (
                      <div key={c._id} className="sf-comment">
                        <div className="sf-comment-head">
                          <Link
                            className="sf-avatar-link"
                            to={
                              personId(c.userId) ? `/profile/${personId(c.userId)}` : '/social'
                            }
                            aria-label={personName(c.userId, t)}
                          >
                            <AuthorAvatar user={c.userId} name={personName(c.userId, t)} size="sm" />
                          </Link>
                          <AuthorLink user={c.userId} name={personName(c.userId, t)} />
                          <span className="sf-muted">{timeAgo(c.timestamp, t)}</span>
                        </div>
                        <p>{c.content}</p>
                        {(c.replies || []).map((r, idx) => (
                          <div key={r._id || idx} className="sf-reply">
                            <AuthorLink user={r.userId} name={personName(r.userId, t)} />
                            <p>{r.content}</p>
                          </div>
                        ))}
                        <NestedReplyBox t={t} onSend={(text) => void sendNestedReply(p._id, c._id, text)} />
                      </div>
                    ))}
                    <div className="sf-reply-box">
                      <input
                        value={replyDrafts[p._id] || ''}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [p._id]: e.target.value }))}
                        placeholder={t.writeReply}
                      />
                      <button type="button" className="sf-send-reply" onClick={() => void sendComment(p._id)}>
                        <SvgSend /> {t.send}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="sf-empty">
            <SoftIcon tone="mint" className="lg">
              <SvgSprout />
            </SoftIcon>
            <p>{t.empty}</p>
            <button type="button" className="button" onClick={() => navigate('/detect')}>
              <IconDetect /> {t.runDetect}
            </button>
          </div>
        )}
      </section>

      <aside className="sf-right">
        <div className="sf-profile sf-profile-compact">
          <div className="sf-profile-avatar">
            {avatarSrc ? (
              <img className="avatar lg" src={avatarSrc} alt="" />
            ) : (
              <span className="avatar lg">{displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <h2>{displayName}</h2>
          <p className="sf-handle">@{handle}</p>

          <div className="sf-stats">
            <div>
              <strong>{myPosts.length}</strong>
              <span>{t.posts}</span>
            </div>
            <div>
              <strong>{likesReceived}</strong>
              <span>{t.likes}</span>
            </div>
            <div>
              <strong>{savedCount}</strong>
              <span>{t.saved}</span>
            </div>
          </div>

          <Link className="button secondary compact sf-profile-link" to="/profile">
            {t.aboutMe}
          </Link>
        </div>
      </aside>

      {lightbox && (
        <div
          className="sf-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="sf-lightbox-close"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>

          <div className="sf-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {lightbox.images.length > 1 ? (
              <button
                type="button"
                className="sf-lightbox-nav"
                aria-label="Previous"
                onClick={() =>
                  setLightbox((cur) =>
                    cur
                      ? {
                          ...cur,
                          index: (cur.index - 1 + cur.images.length) % cur.images.length,
                        }
                      : cur
                  )
                }
              >
                ‹
              </button>
            ) : (
              <span className="sf-lightbox-spacer" aria-hidden />
            )}

            <img
              src={mediaUrl(lightbox.images[lightbox.index]) || lightbox.images[lightbox.index]}
              alt=""
              className="sf-lightbox-img"
            />

            {lightbox.images.length > 1 ? (
              <button
                type="button"
                className="sf-lightbox-nav"
                aria-label="Next"
                onClick={() =>
                  setLightbox((cur) =>
                    cur ? { ...cur, index: (cur.index + 1) % cur.images.length } : cur
                  )
                }
              >
                ›
              </button>
            ) : (
              <span className="sf-lightbox-spacer" aria-hidden />
            )}
          </div>

          {lightbox.images.length > 1 && (
            <div className="sf-lightbox-count" onClick={(e) => e.stopPropagation()}>
              {lightbox.index + 1} / {lightbox.images.length}
            </div>
          )}
        </div>
      )}

      {reportTarget && (
        <div
          className="sf-report-backdrop"
          role="presentation"
          onClick={() => !reportBusy && setReportTarget(null)}
        >
          <form
            className="sf-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sf-report-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void submitReport();
            }}
          >
            <header className="sf-report-head">
              <span className="sf-report-ico" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path
                    d="M6 4.5h9.2a1.3 1.3 0 0 1 1.1 2L14 10.2l2.3 3.7a1.3 1.3 0 0 1-1.1 2H6V4.5z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path d="M6 4.5v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <h2 id="sf-report-title">{t.reportPost}</h2>
                <p>{t.reportLead}</p>
              </div>
              <button
                type="button"
                className="sf-report-close"
                aria-label={t.reportCancel}
                disabled={reportBusy}
                onClick={() => setReportTarget(null)}
              >
                ×
              </button>
            </header>

            <p className="sf-report-section">{t.reportReason}</p>
            <div className="sf-report-reasons" role="radiogroup" aria-label={t.reportReason}>
              {(
                [
                  ['spam', t.reportSpam],
                  ['harassment', t.reportHarassment],
                  ['false', t.reportFalse],
                  ['inappropriate', t.reportInappropriate],
                  ['other', t.reportOther],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className={reportCategory === id ? 'is-on' : ''}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={id}
                    checked={reportCategory === id}
                    onChange={() => setReportCategory(id)}
                  />
                  <span className="sf-report-dot" aria-hidden />
                  <span className="sf-report-label">{label}</span>
                </label>
              ))}
            </div>

            <label className="sf-report-details">
              <span>
                {t.reportDetails}
                <em>{reportDetails.length}/400</em>
              </span>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t.reportDetailsPh}
                maxLength={400}
              />
            </label>

            <div className="sf-report-actions">
              <button
                type="button"
                className="secondary"
                disabled={reportBusy}
                onClick={() => setReportTarget(null)}
              >
                {t.reportCancel}
              </button>
              <button type="submit" disabled={reportBusy}>
                {reportBusy ? t.reportSending : t.reportSubmit}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function svgProps(size = 18) {
  return { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': true as const };
}

function SvgSearch() {
  return (
    <svg {...svgProps()}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SvgSprout() {
  return (
    <svg {...svgProps()}>
      <path d="M12 20V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 12c-3-1-5-3.5-5-6 3.5.2 5.5 2.2 6 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 14c3-.8 5-3 5-5.8-3 .4-4.8 2.4-5 5.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SvgRice() {
  return (
    <svg {...svgProps()}>
      <path d="M12 20V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 9c-2.2-.8-4-2.6-4.5-5C11 4.4 12 6.4 12 9zM12 9c2.2-.8 4-2.6 4.5-5C13 4.4 12 6.4 12 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 13c-2-.6-3.5-2-4-4 2.4.3 3.6 1.8 4 3.7M12 13c2-.6 3.5-2 4-4-2.4.3-3.6 1.8-4 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SvgPhoto() {
  return (
    <svg {...svgProps()}>
      <rect x="4" y="6" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 17l3.2-3.2a1.2 1.2 0 0 1 1.6 0L16 15.8 18 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgLink() {
  return (
    <svg {...svgProps()}>
      <path d="M9 12a3 3 0 0 1 3-3h5a3 3 0 1 1 0 6h-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 12a3 3 0 0 1-3 3H7a3 3 0 1 1 0-6h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SvgSend() {
  return (
    <svg {...svgProps(16)}>
      <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionIcon({ kind, filled }: { kind: 'like' | 'comment' | 'save'; filled?: boolean }) {
  if (kind === 'like') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} aria-hidden>
        <path
          d="M12 20s-7-4.2-7-9.2A3.8 3.8 0 0 1 12 8.2a3.8 3.8 0 0 1 7 2.6C19 15.8 12 20 12 20z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'comment') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
        <path
          d="M5 16.5V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6A2.5 2.5 0 0 1 16.5 16H9l-4 3v-2.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14L12 16.2 5.5 20V6A1.5 1.5 0 0 1 7 4.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NestedReplyBox({ t, onSend }: { t: SocialMessages; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="sf-nested-toggle" onClick={() => setOpen(true)}>
        Reply
      </button>
    );
  }
  return (
    <div className="sf-reply-box nested">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.writeReply}
      />
      <button
        type="button"
        onClick={() => {
          onSend(text);
          setText('');
          setOpen(false);
        }}
      >
        {t.send}
      </button>
    </div>
  );
}
