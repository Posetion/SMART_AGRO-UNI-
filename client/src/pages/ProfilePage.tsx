import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconArticle,
  IconBook,
  IconChat,
  IconDetect,
  IconPin,
  IconRice,
} from '../components/icons';
import {
  TownshipLocationPicker,
  placeCoords,
} from '../components/TownshipLocationPicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CROP_TYPES, type CropType } from '../data/diseaseNames';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { profileCopy } from '../i18n/messages';
import { api } from '../services/api';
import { formatCropLabel } from '../utils/localizeFarm';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';
type Tab = 'posts' | 'saved' | 'history' | 'settings';
type SavedFilter = 'all' | 'articles' | 'diagnoses' | 'knowledge' | 'recent';
type Crop = CropType;

type ProfileUser = {
  _id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role: string;
  bio?: string;
  crops?: string[];
  avatarTone?: Tone;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt?: string;
  location?: {
    township?: string;
    region?: string;
    coordinates?: { coordinates?: [number, number] };
  };
};

type Post = {
  _id: string;
  content: string;
  likes?: string[];
  comments?: unknown[];
  createdAt?: string;
  userId?: { _id?: string };
};

type Diagnosis = {
  _id: string;
  disease: string;
  cropType?: string;
  severityIndex?: number;
  isVerified?: boolean;
  treatmentProtocol?: string;
  imageUrl?: string;
  createdAt?: string;
  prediction?: { confidence?: number };
};

type KnowledgeItem = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  fileUrl?: string;
  views?: number;
};

const KNOWLEDGE_SAVED_KEY = 'smartagro-knowledge-saved';
const POSTS_SAVED_KEY = 'smart_agro_saved_posts';
const DIAG_SAVED_KEY = 'smartagro-diagnosis-saved';

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`pf-ico ${tone} ${className}`}>{children}</span>;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function severityLabel(n: number | undefined, t: ReturnType<typeof profileCopy>) {
  if (n == null) return t.severityUnknown;
  if (n >= 70) return t.severityHigh;
  if (n >= 40) return t.severityModerate;
  return t.severityMild;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function displayRating(views = 0) {
  return Math.min(5, Math.round((4.4 + (views % 6) * 0.1) * 10) / 10);
}

function profileCoords(p?: ProfileUser | null): { lat: number; lng: number } | null {
  const c = p?.location?.coordinates?.coordinates;
  if (!c || c.length < 2) return null;
  const [lng, lat] = c;
  if (!lat && !lng) return null;
  return { lat, lng };
}

export function ProfilePage() {
  const { user, accessToken, updateLocalUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestLogout, dialog: logoutDialog } = useLogoutConfirm({
    afterLogout: () => navigate('/'),
  });
  const { lang, setLang } = useLanguage();
  const t = profileCopy(lang);
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>(
    initialTab === 'settings' ||
      initialTab === 'posts' ||
      initialTab === 'saved' ||
      initialTab === 'history'
      ? initialTab
      : 'posts'
  );

  useEffect(() => {
    const next = searchParams.get('tab');
    if (next === 'settings' || next === 'posts' || next === 'saved' || next === 'history') {
      setTab(next);
    }
  }, [searchParams]);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [locating, setLocating] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() =>
    loadJson(POSTS_SAVED_KEY, {})
  );
  const [savedKnowledge, setSavedKnowledge] = useState<string[]>(() =>
    loadJson(KNOWLEDGE_SAVED_KEY, [])
  );
  const [savedDiagnoses, setSavedDiagnoses] = useState<string[]>(() =>
    loadJson(DIAG_SAVED_KEY, [])
  );
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState<'avatar' | 'cover' | null>(null);
  const [deletingDiagnosisId, setDeletingDiagnosisId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    township: '',
    region: '',
    phoneNumber: '',
    bio: '',
    crops: ['Rice'] as Crop[],
    avatarTone: 'mint' as Tone,
    lat: null as number | null,
    lng: null as number | null,
  });
  const [prefs, setPrefs] = useState(() =>
    loadJson('smart_agro_profile_prefs', {
      alertDisease: true,
      alertCommunity: true,
      askExpertReview: true,
    })
  );
  const [prefsNote, setPrefsNote] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwNote, setPwNote] = useState('');
  const [pwError, setPwError] = useState('');

  async function onChangePassword() {
    setPwNote('');
    setPwError('');
    if (user?.isGuest) {
      setPwError(t.passwordGuestBlocked);
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError(t.passwordTooShort);
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(t.passwordMismatch);
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwNote(t.passwordChanged);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t.passwordChangeFailed);
    } finally {
      setPwSaving(false);
    }
  }

  function persistPrefs(next: typeof prefs) {
    setPrefs(next);
    localStorage.setItem('smart_agro_profile_prefs', JSON.stringify(next));
  }

  function clearLocalSaved() {
    if (!window.confirm(t.clearSavedConfirm)) return;
    setSavedPosts({});
    setSavedKnowledge([]);
    setSavedDiagnoses([]);
    localStorage.setItem(POSTS_SAVED_KEY, JSON.stringify({}));
    localStorage.setItem(KNOWLEDGE_SAVED_KEY, JSON.stringify([]));
    localStorage.setItem(DIAG_SAVED_KEY, JSON.stringify([]));
    setPrefsNote(t.clearSavedDone);
  }

  const useDeviceLocation = useCallback(async (saveToProfile = false) => {
    if (!navigator.geolocation) {
      setError(t.geoUnsupported);
      return;
    }
    setLocating(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60_000,
        });
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      let township = 'My location';
      let region = 'Myanmar';
      setEditForm((f) => {
        township = f.township || 'My location';
        region = f.region || 'Myanmar';
        return { ...f, township, region, lat, lng };
      });
      if (saveToProfile && accessToken) {
        const updated = await api<ProfileUser>('/auth/me', {
          method: 'PATCH',
          token: accessToken,
          body: { township, region, lat, lng },
        });
        setProfile(updated);
      }
    } catch {
      setError(t.geoFailed);
    } finally {
      setLocating(false);
    }
  }, [accessToken, t.geoFailed, t.geoUnsupported]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [me, feed, history, articles] = await Promise.all([
          api<ProfileUser>('/auth/me', { token: accessToken }),
          api<Post[]>('/social/posts?limit=50', { token: accessToken }).catch(() => []),
          api<Diagnosis[]>('/detections/history', { token: accessToken }).catch(() => []),
          api<KnowledgeItem[]>('/knowledge/articles?limit=50').catch(() => []),
        ]);
        if (cancelled) return;
        setProfile(me);
        setPosts(feed || []);
        setDiagnoses(history || []);
        setKnowledge(articles || []);
        const allowed = new Set<string>(CROP_TYPES);
        const crops = (
          me.crops?.length ? me.crops.filter((c) => allowed.has(c)) : ['Rice']
        ) as Crop[];
        if (!crops.length) crops.push('Rice');
        const coords = profileCoords(me);
        setEditForm({
          fullName: me.fullName || '',
          township: me.location?.township || '',
          region: me.location?.region || 'Myanmar',
          phoneNumber: me.phoneNumber || '',
          bio: me.bio || '',
          crops,
          avatarTone: me.avatarTone || 'mint',
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const myPosts = useMemo(
    () => posts.filter((p) => String(p.userId?._id || '') === String(profile?._id || user?.id || '')),
    [posts, profile?._id, user?.id]
  );
  const commentCount = useMemo(
    () => myPosts.reduce((n, p) => n + (p.comments?.length || 0), 0),
    [myPosts]
  );
  const thisMonthDiagnoses = useMemo(() => {
    const now = new Date();
    return diagnoses.filter((d) => {
      if (!d.createdAt) return false;
      const dt = new Date(d.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
  }, [diagnoses]);
  const verifiedCount = useMemo(() => diagnoses.filter((d) => d.isVerified).length, [diagnoses]);
  const savedKnowledgeItems = useMemo(
    () => knowledge.filter((k) => savedKnowledge.includes(k._id)),
    [knowledge, savedKnowledge]
  );
  const savedPostItems = useMemo(() => posts.filter((p) => savedPosts[p._id]), [posts, savedPosts]);
  const savedDiagnosisItems = useMemo(
    () => diagnoses.filter((d) => savedDiagnoses.includes(d._id)),
    [diagnoses, savedDiagnoses]
  );
  const savedTotal =
    savedKnowledgeItems.length + savedPostItems.length + savedDiagnosisItems.length;

  if (!user || !accessToken) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  }

  const displayName =
    profile?.fullName?.trim() || user.fullName?.trim() || user.email.split('@')[0] || 'Farmer';
  const township = editForm.township || profile?.location?.township || 'Myanmar';
  const region = editForm.region || profile?.location?.region || 'Myanmar';
  const joined = formatDate(profile?.createdAt);
  const avatarTone = editForm.avatarTone || profile?.avatarTone || 'mint';
  const cropLabel =
    (editForm.crops.length ? editForm.crops : (profile?.crops as Crop[]) || ['Rice']).join(' & ') +
    ` ${t.farmerSuffix}`;

  function persistSavedPosts(next: Record<string, boolean>) {
    setSavedPosts(next);
    localStorage.setItem(POSTS_SAVED_KEY, JSON.stringify(next));
  }

  function removeKnowledge(id: string) {
    const next = savedKnowledge.filter((x) => x !== id);
    setSavedKnowledge(next);
    localStorage.setItem(KNOWLEDGE_SAVED_KEY, JSON.stringify(next));
  }

  function toggleDiagnosisSave(id: string) {
    const next = savedDiagnoses.includes(id)
      ? savedDiagnoses.filter((x) => x !== id)
      : [...savedDiagnoses, id];
    setSavedDiagnoses(next);
    localStorage.setItem(DIAG_SAVED_KEY, JSON.stringify(next));
  }

  async function deleteOwnPost(id: string) {
    if (!accessToken) return;
    if (!window.confirm(t.deletePostConfirm)) return;
    setDeletingPostId(id);
    setError('');
    try {
      await api(`/social/posts/${id}`, { method: 'DELETE', token: accessToken });
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeletingPostId(null);
    }
  }

  async function deleteDiagnosis(id: string) {
    if (!accessToken) return;
    if (!window.confirm(t.deleteConfirm)) return;
    setDeletingDiagnosisId(id);
    setError('');
    try {
      await api(`/detections/${id}`, { method: 'DELETE', token: accessToken });
      setDiagnoses((prev) => prev.filter((d) => d._id !== id));
      const nextSaved = savedDiagnoses.filter((x) => x !== id);
      setSavedDiagnoses(nextSaved);
      localStorage.setItem(DIAG_SAVED_KEY, JSON.stringify(nextSaved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagnosis');
    } finally {
      setDeletingDiagnosisId(null);
    }
  }

  function toggleCrop(crop: Crop) {
    setEditForm((f) => ({ ...f, crops: [crop] }));
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        fullName: editForm.fullName.trim(),
        township: editForm.township.trim(),
        region: editForm.region.trim() || 'Myanmar',
        phoneNumber: editForm.phoneNumber.trim(),
        bio: editForm.bio.trim(),
        crops: editForm.crops,
        avatarTone: editForm.avatarTone,
      };
      if (editForm.lat != null && editForm.lng != null) {
        body.lat = editForm.lat;
        body.lng = editForm.lng;
      }
      const updated = await api<ProfileUser>('/auth/me', {
        method: 'PATCH',
        token: accessToken,
        body,
      });
      setProfile(updated);
      updateLocalUser({ fullName: updated.fullName });
      setEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(kind: 'avatar' | 'cover', file: File | null) {
    if (!file || !accessToken) return;
    setPhotoUploading(kind);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const updated = await api<ProfileUser>(`/auth/me/${kind}`, {
        method: 'POST',
        token: accessToken,
        formData: fd,
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not upload ${kind} photo`);
    } finally {
      setPhotoUploading(null);
    }
  }

  return (
    <>
    <div className="pf-page">
      <section className="pf-panel pf-hero">
        <div className="pf-section-head">
          <SoftIcon tone="teal">
            <IconPin />
          </SoftIcon>
          <h1>{t.title}</h1>
        </div>

        <div className="pf-cover">
          <div
            className={`pf-cover-art tone-${avatarTone}`}
            style={
              profile?.coverUrl
                ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
            aria-hidden
          />
          <div className="pf-identity">
            <div className={`pf-avatar tone-${avatarTone}`}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" />
              ) : (
                <span aria-hidden>{displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="pf-identity-text">
              <h2>{displayName}</h2>
              <p>
                <SoftIcon tone="coral" className="sm">
                  <IconPin />
                </SoftIcon>
                {township}
                {region ? `, ${region}` : ''}
              </p>
              <p className="muted">{t.joined}: {joined}</p>
              <p>
                <SoftIcon tone="mint" className="sm">
                  <IconRice />
                </SoftIcon>
                {cropLabel}
              </p>
              {(editForm.bio || profile?.bio) && (
                <p className="pf-bio">{editForm.bio || profile?.bio}</p>
              )}
              <div className="pf-quick-stats">
                <span>{diagnoses.length} {t.diagnoses}</span>
                <span>{myPosts.length} {t.posts}</span>
                <span>{commentCount} {t.comments}</span>
              </div>
            </div>
          </div>
          <div className="pf-hero-actions">
            <button type="button" className="button compact" onClick={() => setEditOpen(true)}>
              {t.editProfile}
            </button>
            <button type="button" className="button secondary compact" onClick={() => setTab('settings')}>
              {t.customize}
            </button>
          </div>
        </div>
      </section>

      <nav className="pf-tabs pf-panel" aria-label="Profile sections">
        {(
          [
            ['posts', t.myPosts],
            ['saved', t.saved],
            ['history', t.history],
            ['settings', t.settings],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">{t.loadingProfile}</p>}

      {tab === 'posts' && (
        <section className="pf-panel">
          <div className="pf-section-head">
            <SoftIcon tone="mint">
              <IconChat />
            </SoftIcon>
            <h2>{t.myPosts}</h2>
          </div>
          <div className="pf-list">
            {myPosts.length === 0 && (
              <div className="pf-empty">
                <p>{t.noCommunityPosts}</p>
                <Link className="button compact" to="/social">
                  {t.goToFeed}
                </Link>
              </div>
            )}
            {myPosts.map((p) => (
              <article key={p._id} className="pf-card">
                <p>{p.content}</p>
                <div className="pf-meta">
                  <span>{formatDateTime(p.createdAt)}</span>
                  <span>{p.likes?.length || 0} {t.likes}</span>
                  <span>{p.comments?.length || 0} {t.commentsLabel}</span>
                </div>
                <div className="pf-row-actions">
                  <Link className="button secondary compact" to={`/social#post-${p._id}`}>
                    {t.openInFeed}
                  </Link>
                  <button
                    type="button"
                    className="button danger compact"
                    disabled={deletingPostId === p._id}
                    onClick={() => void deleteOwnPost(p._id)}
                  >
                    {deletingPostId === p._id ? t.deleting : t.deletePost}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'saved' && (
        <section className="pf-panel">
          <div className="pf-section-head">
            <SoftIcon tone="amber">
              <IconBook />
            </SoftIcon>
            <h2>{t.savedItems}</h2>
          </div>
          <div className="pf-chip-row">
            {(
              [
                ['all', t.filterAll],
                ['articles', t.filterArticles],
                ['diagnoses', t.filterDiagnoses],
                ['knowledge', t.filterKnowledge],
                ['recent', t.filterRecent],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={savedFilter === key ? 'is-active' : ''}
                onClick={() => setSavedFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pf-list">
            {(savedFilter === 'all' ||
              savedFilter === 'knowledge' ||
              savedFilter === 'articles' ||
              savedFilter === 'recent') &&
              savedKnowledgeItems
                .filter((k) => (savedFilter === 'articles' ? k.category === 'Article' : true))
                .map((k) => (
                  <article key={k._id} className="pf-card">
                    <h3>{k.title}</h3>
                    <div className="pf-meta">
                      <span>{k.category}</span>
                      <span>★ {displayRating(k.views).toFixed(1)}</span>
                    </div>
                    <p className="muted">{k.description || t.savedFromKnowledge}</p>
                    <div className="pf-row-actions">
                      {k.fileUrl ? (
                        <a className="button compact" href={k.fileUrl} target="_blank" rel="noreferrer">
                          {t.downloadOpen}
                        </a>
                      ) : (
                        <Link className="button compact" to="/knowledge">
                          {t.readNow}
                        </Link>
                      )}
                      <button
                        type="button"
                        className="button secondary compact"
                        onClick={() => removeKnowledge(k._id)}
                      >
                        {t.remove}
                      </button>
                    </div>
                  </article>
                ))}

            {(savedFilter === 'all' || savedFilter === 'recent') &&
              savedPostItems.map((p) => (
                <article key={p._id} className="pf-card">
                  <h3>{t.savedCommunityPost}</h3>
                  <p>
                    {p.content.slice(0, 160)}
                    {p.content.length > 160 ? '…' : ''}
                  </p>
                  <div className="pf-row-actions">
                    <Link className="button compact" to="/social">
                      {t.view}
                    </Link>
                    <button
                      type="button"
                      className="button secondary compact"
                      onClick={() => persistSavedPosts({ ...savedPosts, [p._id]: false })}
                    >
                      {t.remove}
                    </button>
                  </div>
                </article>
              ))}

            {(savedFilter === 'all' || savedFilter === 'diagnoses' || savedFilter === 'recent') &&
              savedDiagnosisItems.map((d) => (
                <article key={d._id} className="pf-card">
                  <h3>
                    {d.disease} — {d.isVerified ? t.verified : t.pending}
                  </h3>
                  <div className="pf-meta">
                    <span>{t.diagnosis}</span>
                    <span>{t.severity} {severityLabel(d.severityIndex, t)}</span>
                  </div>
                  <div className="pf-row-actions">
                    <Link className="button compact" to="/detect">
                      {t.viewFull}
                    </Link>
                    <button
                      type="button"
                      className="button secondary compact"
                      onClick={() => toggleDiagnosisSave(d._id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                </article>
              ))}

            {savedTotal === 0 && (
              <div className="pf-empty">
                <p>{t.noSaved}</p>
                <Link className="button compact" to="/knowledge">
                  {t.browseKnowledge}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="pf-panel">
          <div className="pf-section-head">
            <SoftIcon tone="coral">
              <IconDetect />
            </SoftIcon>
            <h2>{t.detectionHistory}</h2>
          </div>
          <div className="pf-quick-stats pf-history-summary">
            <span>{t.total} {diagnoses.length}</span>
            <span>{t.thisMonth} {thisMonthDiagnoses}</span>
            <span>{t.verified}: {verifiedCount}</span>
          </div>
          <div className="pf-list">
            {diagnoses.length === 0 && (
              <div className="pf-empty">
                <p>{t.noDiagnosesYet}</p>
                <Link className="button compact" to="/detect">
                  {t.detectDisease}
                </Link>
              </div>
            )}
            {diagnoses.map((d) => (
              <article key={d._id} className="pf-card">
                <div className="pf-card-top">
                  <SoftIcon tone={d.isVerified ? 'mint' : 'amber'} className="sm">
                    <IconDetect />
                  </SoftIcon>
                  <div>
                    <h3>
                      {d.disease} — {d.isVerified ? t.verified : t.pending}
                    </h3>
                    <div className="pf-meta">
                      <span>{township}</span>
                      <span>{formatDateTime(d.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="pf-meta">
                  <span>{t.crop} {d.cropType || '—'}</span>
                  <span>{t.severity} {severityLabel(d.severityIndex, t)}</span>
                  <span>
                    {t.ai}{' '}
                    {d.prediction?.confidence != null
                      ? `${Math.round(
                          d.prediction.confidence * (d.prediction.confidence <= 1 ? 100 : 1)
                        )}%`
                      : '—'}
                  </span>
                </div>
                <p className="muted">
                  {t.treatment}{' '}
                  {d.treatmentProtocol ||
                    (d.isVerified ? t.seeFullReport : t.awaitingVerification)}
                </p>
                <div className="pf-row-actions">
                  <Link className="button compact" to="/detect">
                    {t.viewReport}
                  </Link>
                  <button
                    type="button"
                    className="button secondary compact"
                    onClick={() => toggleDiagnosisSave(d._id)}
                  >
                    {savedDiagnoses.includes(d._id) ? t.saved : t.save}
                  </button>
                  <button
                    type="button"
                    className="button danger compact"
                    disabled={deletingDiagnosisId === d._id}
                    onClick={() => void deleteDiagnosis(d._id)}
                  >
                    {deletingDiagnosisId === d._id ? t.deleting : t.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section className="pf-panel pf-settings-panel">
          <div className="pf-section-head">
            <h2>{t.settings}</h2>
          </div>

          <form className="pf-settings" onSubmit={(e) => void onSaveProfile(e)}>
            <div className="pf-settings-block">
              <header>
                <h3>{t.settingsAccount}</h3>
              </header>
              <div className="pf-settings-grid">
                <label>
                  <span className="pf-field-label">{t.fullName}</span>
                  <input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </label>
                <label>
                  <span className="pf-field-label">{t.phone}</span>
                  <input
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    placeholder="+95…"
                  />
                </label>
                <label className="pf-settings-span">
                  <span className="pf-field-label">{t.emailLabel}</span>
                  <input value={user.email} readOnly disabled />
                </label>
                <label className="pf-settings-span">
                  <span className="pf-field-label">{t.bio}</span>
                  <textarea
                    rows={2}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder={t.bioPlaceholder}
                  />
                </label>
              </div>
            </div>

            <div className="pf-settings-block">
              <header>
                <h3>{t.settingsFarm}</h3>
              </header>
              <div className="pf-settings-grid">
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.cropsGrow}</strong>
                  <div className="pf-crop-cards">
                    {CROP_TYPES.map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        className={`pf-crop-card ${editForm.crops.includes(crop) ? 'is-active' : ''}`}
                        onClick={() => toggleCrop(crop)}
                      >
                        {formatCropLabel(crop, lang)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.farmLocation}</strong>
                  <TownshipLocationPicker
                    currentName={editForm.township || township}
                    currentRegion={editForm.region || region}
                    lang={lang}
                    locating={locating}
                    townshipLabel={t.township}
                    searchPlaceholder={t.searchTownships}
                    listLabel={t.listTownships}
                    closeLabel={t.closeList}
                    emptyLabel={t.noTownship}
                    useLocationLabel={t.useMyLocation}
                    locatingLabel={t.locating}
                    onSelect={(tw) => {
                      const coords = placeCoords(tw);
                      setEditForm((f) => ({
                        ...f,
                        township: tw.nameEn || tw.name,
                        region: tw.region || 'Myanmar',
                        lat: coords?.lat ?? f.lat,
                        lng: coords?.lng ?? f.lng,
                      }));
                    }}
                    onUseDeviceLocation={() => void useDeviceLocation(false)}
                  />
                </div>
              </div>
            </div>

            <div className="pf-settings-block">
              <header>
                <h3>{t.settingsLook}</h3>
              </header>
              <div className="pf-settings-grid">
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.profilePhotos}</strong>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void uploadPhoto('avatar', file);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void uploadPhoto('cover', file);
                      e.target.value = '';
                    }}
                  />
                  <div className="pf-photo-row">
                    <div className={`pf-photo-preview tone-${avatarTone}`}>
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="" />
                      ) : (
                        <span>{displayName.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="pf-row-actions">
                      <button
                        type="button"
                        className="button secondary compact"
                        disabled={photoUploading === 'avatar'}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        {photoUploading === 'avatar' ? t.uploading : t.uploadAvatar}
                      </button>
                      <button
                        type="button"
                        className="button secondary compact"
                        disabled={photoUploading === 'cover'}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {photoUploading === 'cover' ? t.uploading : t.uploadCover}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.avatarColor}</strong>
                  <div className="pf-tone-row">
                    {(
                      [
                        ['mint', 'Mint'],
                        ['sky', 'Sky'],
                        ['coral', 'Coral'],
                        ['amber', 'Amber'],
                        ['peach', 'Peach'],
                        ['teal', 'Teal'],
                      ] as const
                    ).map(([tone, label]) => (
                      <button
                        key={tone}
                        type="button"
                        className={`pf-tone-chip ${tone} ${editForm.avatarTone === tone ? 'is-active' : ''}`}
                        aria-label={label}
                        title={label}
                        onClick={() => setEditForm({ ...editForm, avatarTone: tone })}
                      >
                        <i className={`pf-tone ${tone}`} aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-settings-block">
              <header>
                <h3>{t.settingsPrefs}</h3>
              </header>
              <div className="pf-settings-grid">
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.languagePref}</strong>
                  <div className="pf-chip-row">
                    <button
                      type="button"
                      className={lang === 'en' ? 'is-active' : ''}
                      onClick={() => setLang('en')}
                    >
                      {t.langEnglish}
                    </button>
                    <button
                      type="button"
                      className={lang === 'my' ? 'is-active' : ''}
                      onClick={() => setLang('my')}
                    >
                      {t.langMyanmar}
                    </button>
                  </div>
                </div>
                <div className="pf-settings-span">
                  <strong className="pf-field-label">{t.alertPrefs}</strong>
                  <div className="pf-toggle-list">
                    <label className="pf-toggle">
                      <input
                        type="checkbox"
                        checked={prefs.alertDisease}
                        onChange={(e) => persistPrefs({ ...prefs, alertDisease: e.target.checked })}
                      />
                      <span>{t.alertDisease}</span>
                    </label>
                    <label className="pf-toggle">
                      <input
                        type="checkbox"
                        checked={prefs.alertCommunity}
                        onChange={(e) => persistPrefs({ ...prefs, alertCommunity: e.target.checked })}
                      />
                      <span>{t.alertCommunity}</span>
                    </label>
                    <label className="pf-toggle">
                      <input
                        type="checkbox"
                        checked={prefs.askExpertReview !== false}
                        onChange={(e) =>
                          persistPrefs({ ...prefs, askExpertReview: e.target.checked })
                        }
                      />
                      <span>{t.askExpertReview}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-settings-block">
              <header>
                <h3>{t.settingsPassword}</h3>
              </header>
              {user?.isGuest ? (
                <p className="muted">{t.passwordGuestBlocked}</p>
              ) : (
                <div className="pf-settings-grid">
                  <label className="pf-settings-span">
                    {t.currentPassword}
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder={t.currentPassword}
                      value={pwForm.current}
                      onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                    />
                  </label>
                  <label>
                    {t.newPassword}
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t.newPassword}
                      value={pwForm.next}
                      onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                    />
                  </label>
                  <label>
                    {t.confirmNewPassword}
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t.confirmNewPassword}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    />
                  </label>
                  <div className="pf-settings-span pf-row-actions">
                    <button
                      type="button"
                      className="button"
                      disabled={pwSaving || !pwForm.next}
                      onClick={() => void onChangePassword()}
                    >
                      {pwSaving ? t.saving : t.changePassword}
                    </button>
                  </div>
                  {pwNote && <p className="pf-prefs-note pf-settings-span">{pwNote}</p>}
                  {pwError && (
                    <p className="pf-settings-span" style={{ color: 'var(--danger)', margin: 0 }}>
                      {pwError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pf-settings-block pf-settings-footer">
              <div className="pf-row-actions">
                <button type="submit" className="button" disabled={saving}>
                  {saving ? t.saving : t.saveProfile}
                </button>
                <Link className="button secondary" to="/faq">
                  {t.openFaq}
                </Link>
                <button type="button" className="button secondary" onClick={requestLogout}>
                  {t.logout}
                </button>
              </div>
              {prefsNote && <p className="pf-prefs-note">{prefsNote}</p>}
            </div>
          </form>
        </section>
      )}

      {tab !== 'settings' && (
      <section className="pf-panel">
        <div className="pf-section-head">
          <h2>{t.statsActivity}</h2>
        </div>
        <div className="pf-stats-grid">
          <div>
            <SoftIcon tone="coral">
              <IconDetect />
            </SoftIcon>
            <strong>{diagnoses.length}</strong>
            <span>{t.diagnoses}</span>
            <small>{thisMonthDiagnoses} {t.thisMonthShort}</small>
          </div>
          <div>
            <SoftIcon tone="amber">
              <IconBook />
            </SoftIcon>
            <strong>{savedTotal}</strong>
            <span>{t.savedItemsStat}</span>
            <small>{savedKnowledgeItems.length} {t.knowledgeShort}</small>
          </div>
          <div>
            <SoftIcon tone="mint">
              <IconArticle />
            </SoftIcon>
            <strong>{myPosts.length}</strong>
            <span>{t.communityPosts}</span>
            <small>{t.yourFieldNotes}</small>
          </div>
          <div>
            <SoftIcon tone="teal">
              <IconChat />
            </SoftIcon>
            <strong>{commentCount}</strong>
            <span>{t.comments}</span>
            <small>{t.onYourPosts}</small>
          </div>
        </div>
      </section>
      )}

      {editOpen && (
        <div className="pf-modal-backdrop" role="presentation" onClick={() => setEditOpen(false)}>
          <div
            className="pf-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t.editProfile}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>{t.editProfile}</h2>
              <button type="button" className="button secondary compact" onClick={() => setEditOpen(false)}>
                {t.close}
              </button>
            </header>
            <form className="form-grid" onSubmit={(e) => void onSaveProfile(e)}>
              <label>
                {t.fullName}
                <input
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </label>
              <label>
                {t.bio}
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </label>
              <TownshipLocationPicker
                currentName={editForm.township || township}
                currentRegion={editForm.region || region}
                lang={lang}
                locating={locating}
                townshipLabel={t.township}
                searchPlaceholder={t.searchTownships}
                listLabel={t.listTownships}
                closeLabel={t.closeList}
                emptyLabel={t.noTownship}
                useLocationLabel={t.useMyLocation}
                locatingLabel={t.locating}
                onSelect={(tw) => {
                  const coords = placeCoords(tw);
                  setEditForm((f) => ({
                    ...f,
                    township: tw.nameEn || tw.name,
                    region: tw.region || 'Myanmar',
                    lat: coords?.lat ?? f.lat,
                    lng: coords?.lng ?? f.lng,
                  }));
                }}
                onUseDeviceLocation={() => void useDeviceLocation(false)}
              />
              <button type="submit" className="button" disabled={saving}>
                {saving ? t.saving : t.saveChanges}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    {logoutDialog}
    </>
  );
}
