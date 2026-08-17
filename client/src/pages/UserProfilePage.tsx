import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconChat, IconPin, IconRice, IconUserPlus } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { profileCopy, socialCopy } from '../i18n/messages';
import { api } from '../services/api';
import { formatCropLabel, formatRegionLabel } from '../utils/localizeFarm';
import { mediaUrl } from '../utils/mediaUrl';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

type PublicProfile = {
  _id: string;
  email?: string;
  fullName?: string;
  role?: string;
  bio?: string;
  crops?: string[];
  avatarUrl?: string;
  avatarTone?: Tone;
  coverUrl?: string;
  createdAt?: string;
  location?: { township?: string; region?: string };
};

type PublicPost = {
  _id: string;
  content: string;
  images?: string[];
  likes?: string[];
  comments?: unknown[];
  createdAt?: string;
  diagnosticId?: { disease?: string; cropType?: string; severityIndex?: number };
};

type Friendship =
  | { status: 'self' }
  | { status: 'none' }
  | { status: 'friends'; id?: string }
  | { status: 'outgoing'; id?: string }
  | { status: 'incoming'; id?: string }
  | { status: 'blocked' }
  | { status: 'blocked_by' };

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`pf-ico ${tone} ${className}`}>{children}</span>;
}

function roleLabel(role: string | undefined, st: ReturnType<typeof socialCopy>) {
  if (role === 'expert') return st.expert;
  if (role === 'admin') return st.admin;
  return st.farmer;
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = profileCopy(lang);
  const st = socialCopy(lang);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [friendship, setFriendship] = useState<Friendship>({ status: 'none' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const isSelf = Boolean(user?.id && userId && user.id === userId);

  useEffect(() => {
    if (!accessToken || !userId || isSelf) return;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api<{
          profile: PublicProfile;
          posts: PublicPost[];
          friendship: Friendship;
        }>(`/social/users/${userId}`, { token: accessToken });
        setProfile(data.profile);
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setFriendship(data.friendship || { status: 'none' });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadingProfile);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, userId, isSelf, t.loadingProfile]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    return profile.fullName?.trim() || profile.email?.split('@')[0] || st.farmer;
  }, [profile, st.farmer]);

  const tone = profile?.avatarTone || 'mint';
  const township = profile?.location?.township || (lang === 'my' ? 'မြန်မာ' : 'Myanmar');
  const region = profile?.location?.region ? formatRegionLabel(profile.location.region, lang) : '';
  const cropLabel = profile?.crops?.length
    ? profile.crops.map((c) => formatCropLabel(c, lang)).join(' · ')
    : '—';
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  async function addFriend() {
    if (!accessToken || !userId || working) return;
    setWorking(true);
    try {
      const data = await api<{ _id?: string }>('/messages/friends/request', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      setFriendship({
        status: friendship.status === 'incoming' ? 'friends' : 'outgoing',
        id: data?._id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : st.addFriend;
      if (/already sent/i.test(message)) setFriendship({ status: 'outgoing' });
      else if (/already friends/i.test(message)) setFriendship({ status: 'friends' });
      else setError(message);
    } finally {
      setWorking(false);
    }
  }

  async function cancelRequest() {
    if (!accessToken || !userId || working) return;
    setWorking(true);
    try {
      await api('/messages/friends/cancel', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      setFriendship({ status: 'none' });
    } catch (err) {
      setError(err instanceof Error ? err.message : st.addFriend);
    } finally {
      setWorking(false);
    }
  }

  async function denyRequest() {
    if (!accessToken || !userId || working) return;
    setWorking(true);
    try {
      await api('/messages/friends/deny', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      setFriendship({ status: 'none' });
    } catch (err) {
      setError(err instanceof Error ? err.message : st.addFriend);
    } finally {
      setWorking(false);
    }
  }

  async function blockThisUser() {
    if (!accessToken || !userId || working) return;
    if (!window.confirm(st.blockConfirm)) return;
    setWorking(true);
    try {
      await api('/messages/blocks', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      setFriendship({ status: 'blocked' });
    } catch (err) {
      setError(err instanceof Error ? err.message : st.blockUser);
    } finally {
      setWorking(false);
    }
  }

  async function unblockThisUser() {
    if (!accessToken || !userId || working) return;
    setWorking(true);
    try {
      await api(`/messages/blocks/${userId}`, { method: 'DELETE', token: accessToken });
      setFriendship({ status: 'none' });
    } catch (err) {
      setError(err instanceof Error ? err.message : st.unblockUser);
    } finally {
      setWorking(false);
    }
  }

  async function messageUser() {
    if (!accessToken || !userId) return;
    setWorking(true);
    try {
      const data = await api<{ _id: string }>('/messages/conversations', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      navigate(`/messages?c=${data._id}`);
    } catch {
      navigate('/messages');
    } finally {
      setWorking(false);
    }
  }

  if (!user || !accessToken) return <Navigate to="/login" replace />;
  if (isSelf) return <Navigate to="/profile" replace />;

  return (
    <div className="pf-page pf-public">
      <section className="pf-panel pf-hero">
        <div className="pf-section-head">
          <h1>{displayName || t.title}</h1>
          <Link className="button secondary compact" to="/social">
            {st.backCommunity}
          </Link>
        </div>

        {loading && <p className="muted">{t.loadingProfile}</p>}
        {error && <p className="error">{error}</p>}

        {profile && (
          <div className="pf-cover">
            <div
              className={`pf-cover-art tone-${tone}`}
              style={
                profile.coverUrl
                  ? {
                      backgroundImage: `url(${mediaUrl(profile.coverUrl) || profile.coverUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
              aria-hidden
            />
            <div className="pf-identity">
              <div className={`pf-avatar tone-${tone}`}>
                {profile.avatarUrl ? (
                  <img src={mediaUrl(profile.avatarUrl) || profile.avatarUrl} alt="" />
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
                <p className="muted">
                  {roleLabel(profile.role, st)} · {t.joined}: {joined}
                </p>
                <p>
                  <SoftIcon tone="mint" className="sm">
                    <IconRice />
                  </SoftIcon>
                  {cropLabel}
                </p>
                {profile.bio ? (
                  <p className="pf-bio">{profile.bio}</p>
                ) : (
                  <p className="pf-bio">{st.noBio}</p>
                )}
                <div className="pf-quick-stats">
                  <span>
                    {posts.length} {t.posts}
                  </span>
                </div>
              </div>
            </div>
            <div className="pf-hero-actions">
              {friendship.status === 'none' && !user.isGuest && (
                <button type="button" className="button compact" disabled={working} onClick={() => void addFriend()}>
                  <IconUserPlus /> {st.addFriend}
                </button>
              )}
              {friendship.status === 'outgoing' && (
                <>
                  <button type="button" className="button secondary compact" disabled>
                    {st.requestPending}
                  </button>
                  <button type="button" className="button secondary compact" disabled={working} onClick={() => void cancelRequest()}>
                    {st.cancelRequest}
                  </button>
                </>
              )}
              {friendship.status === 'incoming' && (
                <>
                  <button type="button" className="button compact" disabled={working} onClick={() => void addFriend()}>
                    {st.acceptRequest}
                  </button>
                  <button type="button" className="button secondary compact" disabled={working} onClick={() => void denyRequest()}>
                    {st.denyRequest}
                  </button>
                </>
              )}
              {friendship.status === 'friends' && (
                <span className="pf-friend-pill">{st.friends}</span>
              )}
              {friendship.status === 'blocked' && (
                <span className="pf-friend-pill">{st.blockUser}</span>
              )}
              {friendship.status !== 'blocked' && !user.isGuest && (
                <button
                  type="button"
                  className="button secondary compact"
                  disabled={working}
                  onClick={() => void messageUser()}
                >
                  <IconChat /> {st.messageUser}
                </button>
              )}
              {!user.isGuest && friendship.status === 'blocked' ? (
                <button type="button" className="button compact" disabled={working} onClick={() => void unblockThisUser()}>
                  {st.unblockUser}
                </button>
              ) : !user.isGuest ? (
                <button type="button" className="button secondary compact" disabled={working} onClick={() => void blockThisUser()}>
                  {st.blockUser}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {profile && (
        <section className="pf-panel">
          <div className="pf-section-head">
            <h2>{st.posts}</h2>
          </div>
          {!posts.length && <p className="muted">{t.noCommunityPosts}</p>}
          <ul className="pf-post-list">
            {posts.map((p) => {
              const img = p.images?.[0];
              return (
                <li key={p._id}>
                  <Link className="pf-post-link" to={`/social#post-${p._id}`}>
                    {img && <img src={mediaUrl(img) || img} alt="" />}
                    <div>
                      <strong>{p.content.trim() || '—'}</strong>
                      <small>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                        {p.diagnosticId?.disease ? ` · ${p.diagnosticId.disease}` : ''}
                        {typeof p.likes?.length === 'number' ? ` · ${p.likes.length}` : ''}
                      </small>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
