import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import {
  IconChat,
  IconLeaf,
  IconRice,
  IconWeather,
} from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { chatCopy } from '../i18n/messages';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';
type ChatAttachment = { url: string; name?: string; mimeType?: string };
type Msg = {
  sender: 'user' | 'bot';
  text: string;
  at?: string;
  imageUrls?: string[];
  attachments?: ChatAttachment[];
};
type PendingFile = { id: string; file: File; preview?: string };

type SessionSummary = {
  sessionId: string;
  messages?: Array<{
    sender: string;
    text: string;
    timestamp?: string;
    imageUrls?: string[];
    attachments?: ChatAttachment[];
  }>;
  updatedAt?: string;
};

const MAX_CHAT_ATTACHMENTS = 8;

const DEFAULT_CHAT_LOC = {
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  township: undefined as string | undefined,
  source: 'pending' as 'pending' | 'gps' | 'profile' | 'default',
};

type ProfileMe = {
  location?: {
    township?: string;
    region?: string;
    coordinates?: { coordinates?: [number, number] };
  };
};

const SUGGESTION_DEFS: Array<{
  key: keyof ReturnType<typeof chatCopy>;
  prompt: string;
  tone: Tone;
  Icon: typeof IconRice;
  descKey: 'suggestRiceDesc' | 'suggestPestDesc' | 'suggestWeatherDesc';
}> = [
  {
    key: 'riceBlast',
    prompt: 'How do I treat Rice Blast on my paddy?',
    tone: 'mint',
    Icon: IconRice,
    descKey: 'suggestRiceDesc',
  },
  {
    key: 'pestCare',
    prompt: 'How do I control brown planthopper and stem borer in rice?',
    tone: 'peach',
    Icon: IconLeaf,
    descKey: 'suggestPestDesc',
  },
  {
    key: 'weather',
    prompt: "What's the weather outlook for my farm this week?",
    tone: 'sky',
    Icon: IconWeather,
    descKey: 'suggestWeatherDesc',
  },
];

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`cb-ico ${tone} ${className}`}>{children}</span>;
}

function formatTime(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function ChatText({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length <= 1) {
    return <>{text}</>;
  }
  return (
    <>
      {blocks.map((block, i) => (
        <p key={i}>{block}</p>
      ))}
    </>
  );
}

function mapSessionMessages(list?: SessionSummary['messages']): Msg[] {
  return (list || []).map((m) => ({
    sender: m.sender === 'bot' ? 'bot' : 'user',
    text: m.text,
    at: m.timestamp,
    imageUrls: m.imageUrls,
    attachments: m.attachments,
  }));
}

function sessionTitle(s: SessionSummary, fallback: string) {
  const firstUser = s.messages?.find((m) => m.sender === 'user')?.text?.trim();
  if (firstUser) return firstUser.length > 36 ? `${firstUser.slice(0, 36)}…` : firstUser;
  return fallback;
}

export function ChatPage() {
  const { accessToken, user, loginAsGuest } = useAuth();
  const { lang } = useLanguage();
  const t = chatCopy(lang);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [text, setText] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [guestStarting, setGuestStarting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loc, setLoc] = useState(DEFAULT_CHAT_LOC);
  const [locLabel, setLocLabel] = useState(t.locatingFarm);
  const [locError, setLocError] = useState('');
  const [pending, setPending] = useState<PendingFile[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Farmer';

  const loadSessions = async (preferId?: string) => {
    if (!accessToken) return;
    const list = await api<SessionSummary[]>('/chatbot/history', { token: accessToken });
    const rows = Array.isArray(list) ? list : [];
    setSessions(rows);
    const pick =
      (preferId && rows.find((s) => s.sessionId === preferId)) ||
      rows.find((s) => s.sessionId === sessionId) ||
      rows[0];
    if (pick?.messages?.length) {
      setSessionId(pick.sessionId);
      setMessages(mapSessionMessages(pick.messages));
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    void loadSessions().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function applyProfileLocation() {
    if (!accessToken) return false;
    try {
      const me = await api<ProfileMe>('/auth/me', { token: accessToken });
      const coords = me.location?.coordinates?.coordinates;
      const hasCoords =
        Array.isArray(coords) &&
        coords.length >= 2 &&
        !(Number(coords[0]) === 0 && Number(coords[1]) === 0);
      if (hasCoords) {
        const lng = Number(coords![0]);
        const lat = Number(coords![1]);
        const township = me.location?.township?.trim() || 'Saved farm';
        setLoc({ lat, lng, township, source: 'profile' });
        setLocLabel(
          me.location?.township
            ? `${me.location.township}${me.location.region ? `, ${me.location.region}` : ''}`
            : `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
        );
        setLocError('');
        return true;
      }
      if (me.location?.township?.trim()) {
        setLocLabel(me.location.township);
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  async function locateFarm(force = false) {
    setLocError('');
    if (!force) {
      const fromProfile = await applyProfileLocation();
      if (fromProfile) return;
    }
    if (!navigator.geolocation) {
      setLocError(t.geoUnsupported);
      setLocLabel(t.usingDefaultLocation);
      setLoc((prev) => ({ ...prev, source: 'default' }));
      return;
    }
    setLocLabel(t.locatingFarm);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLoc({ lat, lng, township: 'My location', source: 'gps' });
        setLocLabel(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
        setLocError('');
      },
      async () => {
        const ok = await applyProfileLocation();
        if (!ok) {
          setLocError(t.geoDenied);
          setLocLabel(t.usingDefaultLocation);
          setLoc((prev) => ({ ...prev, source: 'default' }));
        }
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  useEffect(() => {
    if (!accessToken) return;
    void locateFarm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locate once per login
  }, [accessToken]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function startGuest() {
    if (guestStarting) return;
    setGuestStarting(true);
    setError('');
    try {
      await loginAsGuest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setGuestStarting(false);
    }
  }

  async function openSession(s: SessionSummary) {
    setSessionId(s.sessionId);
    setMessages(mapSessionMessages(s.messages));
    setError('');
  }

  async function newChat() {
    if (!accessToken) return;
    setMessages([]);
    setError('');
    setHistoryOpen(false);
    clearPending();
    try {
      const session = await api<{ sessionId: string }>('/chatbot/session', {
        method: 'POST',
        token: accessToken,
      });
      setSessionId(session.sessionId);
      await loadSessions(session.sessionId);
      setMessages([]);
      setSessionId(session.sessionId);
    } catch {
      setSessionId(undefined);
    }
  }

  async function deleteChat(id: string) {
    if (!accessToken || !id) return;
    if (!confirm(t.deleteChatConfirm)) return;
    setError('');
    try {
      await api(`/chatbot/session/${id}`, { method: 'DELETE', token: accessToken });
      const next = sessions.filter((s) => s.sessionId !== id);
      setSessions(next);
      if (sessionId === id) {
        const fallback = next[0];
        if (fallback?.messages?.length) {
          setSessionId(fallback.sessionId);
          setMessages(mapSessionMessages(fallback.messages));
        } else {
          setSessionId(undefined);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  async function clearAllHistory() {
    if (!accessToken || !sessions.length) return;
    if (!confirm(t.clearAllConfirm)) return;
    setError('');
    try {
      await api('/chatbot/history', { method: 'DELETE', token: accessToken });
      setSessions([]);
      setSessionId(undefined);
      setMessages([]);
      setHistoryOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.clearAllFailed);
    }
  }

  function clearPending() {
    setPending((prev) => {
      prev.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
  }

  function addFiles(list: FileList | File[] | null, imagesOnly = false) {
    if (!list) return;
    const picked = Array.from(list);
    setPending((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= MAX_CHAT_ATTACHMENTS) {
          setError(t.maxAttachments);
          break;
        }
        if (imagesOnly && !file.type.startsWith('image/')) continue;
        const dup = next.some(
          (f) => f.file.name === file.name && f.file.size === file.size && f.file.lastModified === file.lastModified
        );
        if (dup) continue;
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        });
      }
      return next;
    });
  }

  function removePending(id: string) {
    setPending((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit?.preview) URL.revokeObjectURL(hit.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function send(value: string) {
    const trimmed = value.trim();
    if ((!trimmed && !pending.length) || sending || !accessToken) return;
    setError('');
    setSending(true);
    const now = new Date().toISOString();
    const queued = pending;
    const imageUrls = queued.filter((p) => p.preview).map((p) => p.preview as string);
    const attachments = queued
      .filter((p) => !p.preview)
      .map((p) => ({ url: '', name: p.file.name, mimeType: p.file.type }));
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: trimmed || t.photosReady, at: now, imageUrls, attachments },
    ]);
    setText('');
    setPending([]);
    try {
      let data: { reply: string; sessionId: string };
      if (queued.length) {
        const form = new FormData();
        form.append('text', trimmed);
        if (sessionId) form.append('sessionId', sessionId);
        if (
          (loc.source === 'gps' || loc.source === 'profile') &&
          typeof loc.lat === 'number' &&
          typeof loc.lng === 'number'
        ) {
          form.append('lat', String(loc.lat));
          form.append('lng', String(loc.lng));
          if (loc.township) form.append('township', loc.township);
        }
        queued.forEach((p) => form.append('attachments', p.file));
        data = await api<{ reply: string; sessionId: string }>('/chatbot/message', {
          method: 'POST',
          token: accessToken,
          formData: form,
        });
        queued.forEach((p) => {
          if (p.preview) URL.revokeObjectURL(p.preview);
        });
      } else {
        const body: Record<string, unknown> = { text: trimmed, sessionId };
        if (
          (loc.source === 'gps' || loc.source === 'profile') &&
          typeof loc.lat === 'number' &&
          typeof loc.lng === 'number'
        ) {
          body.lat = loc.lat;
          body.lng = loc.lng;
          body.township = loc.township;
        }
        data = await api<{ reply: string; sessionId: string }>('/chatbot/message', {
          method: 'POST',
          token: accessToken,
          body,
        });
      }
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.reply, at: new Date().toISOString() },
      ]);
      void loadSessions(data.sessionId).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
      setText(trimmed);
      setPending(queued);
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await send(text);
  }

  const recent = useMemo(() => sessions.slice(0, 4), [sessions]);
  const showWelcome = messages.length === 0 && !sending;

  function SessionRow({ s, dense = false }: { s: SessionSummary; dense?: boolean }) {
    return (
      <li className={dense ? 'va-hist-row' : undefined}>
        <button
          type="button"
          className={`va-session-open ${s.sessionId === sessionId ? 'is-active' : ''}`}
          onClick={() => {
            void openSession(s);
            setHistoryOpen(false);
          }}
        >
          <IconChat />
          <span>{sessionTitle(s, t.newChat)}</span>
        </button>
        <button
          type="button"
          className="va-session-del"
          aria-label={t.deleteChat}
          title={t.deleteChat}
          onClick={(e) => {
            e.stopPropagation();
            void deleteChat(s.sessionId);
          }}
        >
          ×
        </button>
      </li>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="va-page va-gate">
        <section className="va-gate-card">
          <span className="va-logo-mark" aria-hidden>
            <BrandLogo size={28} decorative />
          </span>
          <h1>{t.title}</h1>
          <p>{t.guestLead}</p>
          <div className="va-gate-actions">
            <Link className="button" to="/login">
              {t.loginChat}
            </Link>
            <button
              type="button"
              className="button secondary"
              disabled={guestStarting}
              onClick={() => void startGuest()}
            >
              {guestStarting ? t.sending : t.continueAsGuest}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      </div>
    );
  }

  return (
    <>
    <div className={`va-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`.trim()}>
      <aside className="va-sidebar">
        <div className="va-side-top">
          <Link to="/chat" className="va-brand" onClick={() => void newChat()}>
            <span className="va-logo-mark" aria-hidden>
              <BrandLogo size={28} decorative />
            </span>
            <strong>SMART AGRO</strong>
          </Link>
          <button
            type="button"
            className="va-collapse"
            aria-label={sidebarOpen ? t.hideSidebar : t.showSidebar}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>

        <button type="button" className="va-new-chat" onClick={() => void newChat()}>
          + {t.newChat}
        </button>

        <nav className="va-nav" aria-label={t.history}>
          <button
            type="button"
            className={historyOpen ? 'is-active' : undefined}
            onClick={() => setHistoryOpen(true)}
          >
            <IconChat />
            {t.history}
          </button>
        </nav>

        <div className="va-recent">
          <p className="va-recent-label">{t.recentChats}</p>
          {!recent.length && <p className="va-recent-empty muted">{t.noRecent}</p>}
          <ul className="va-session-list">
            {recent.map((s) => (
              <SessionRow key={s.sessionId} s={s} />
            ))}
          </ul>
          {sessions.length > 4 && (
            <button type="button" className="va-older-link" onClick={() => setHistoryOpen(true)}>
              {t.openOlder}
            </button>
          )}
        </div>
      </aside>

      <main className="va-main">
        <header className="va-main-head">
          <div className="va-model-pill">
            <SoftIcon tone="teal" className="sm">
              <IconLeaf />
            </SoftIcon>
            <span>{t.modelName}</span>
          </div>
          <div className="va-user-chip">
            <div>
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </div>
            <span className="avatar sm tone-mint">{displayName.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>

        <div className="va-stage" ref={logRef}>
          {showWelcome ? (
            <div className="va-welcome">
              <h1>
                <span className="va-hello">
                  {t.hello} {displayName}
                </span>
                <span className="va-help">{t.howHelp}</span>
              </h1>
              <p className="va-weather muted">
                <IconWeather /> {t.weatherAware} {locLabel}
              </p>
              {locError && <p className="va-loc-error">{locError}</p>}
              <button type="button" className="button secondary compact" onClick={() => void locateFarm(true)}>
                {t.useMyLocation}
              </button>
              {user.isGuest && (
                <p className="va-guest-note">
                  {t.guestBanner} <Link to="/login">{t.loginChat}</Link>
                </p>
              )}
              <div className="va-suggest-grid">
                {SUGGESTION_DEFS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className="va-suggest-card"
                    disabled={sending}
                    onClick={() => void send(s.prompt)}
                  >
                    <SoftIcon tone={s.tone} className="sm">
                      <s.Icon />
                    </SoftIcon>
                    <strong>{t[s.key]}</strong>
                    <span>{t[s.descKey]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="va-log">
              {messages.map((m, i) => (
                <article key={`${m.sender}-${i}-${m.at || i}`} className={`va-bubble ${m.sender}`}>
                  <header>
                    <SoftIcon tone={m.sender === 'bot' ? 'teal' : 'mint'} className="sm">
                      {m.sender === 'bot' ? (
                        <IconChat />
                      ) : (
                        <span className="cb-user-initial">{displayName[0]}</span>
                      )}
                    </SoftIcon>
                    <strong>{m.sender === 'bot' ? t.bot : t.you}</strong>
                    <span>{formatTime(m.at)}</span>
                  </header>
                  <div className="va-bubble-body">
                    {!!(m.imageUrls?.length || m.attachments?.length) && (
                      <div className="va-bubble-media">
                        {(m.imageUrls || []).map((src) => (
                          <img key={src} src={mediaUrl(src) || src} alt="" />
                        ))}
                        {(m.attachments || [])
                          .filter((a) => a.url && !a.mimeType?.startsWith('image/'))
                          .map((a) => (
                            <a
                              key={a.url}
                              className="va-bubble-file"
                              href={mediaUrl(a.url) || a.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {a.name || t.attachFile}
                            </a>
                          ))}
                      </div>
                    )}
                    {m.text ? <ChatText text={m.text} /> : null}
                  </div>
                </article>
              ))}
              {sending && (
                <article className="va-bubble bot is-typing" aria-live="polite">
                  <header>
                    <SoftIcon tone="teal" className="sm">
                      <IconChat />
                    </SoftIcon>
                    <strong>{t.bot}</strong>
                    <span>{t.generating}</span>
                  </header>
                  <div className="va-bubble-body">
                    <div className="cb-typing-dots" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </div>
                    <p className="cb-typing-msg">{t.thinking}</p>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        <div className="va-composer-wrap">
          {pending.length > 0 && (
            <div className="va-attach-row">
              {pending.map((p) =>
                p.preview ? (
                  <div key={p.id} className="va-attach-thumb">
                    <img src={p.preview} alt="" />
                    <button
                      type="button"
                      className="va-attach-remove"
                      aria-label={t.removeAttachment}
                      onClick={() => removePending(p.id)}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div key={p.id} className="va-attach-chip">
                    <span>{p.file.name}</span>
                    <button
                      type="button"
                      className="va-attach-remove"
                      aria-label={t.removeAttachment}
                      onClick={() => removePending(p.id)}
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}
          <form className="va-composer" onSubmit={(e) => void onSubmit(e)}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files, true);
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.epub,image/jpeg,image/png,image/webp,application/pdf"
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="va-attach-btn"
              title={t.attachFile}
              aria-label={t.attachFile}
              disabled={sending || pending.length >= MAX_CHAT_ATTACHMENTS}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                <path
                  d="M21.4 11.6 12.7 20.3a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.1a1.5 1.5 0 1 1-2.1-2.1l8.1-8.1"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="va-attach-btn"
              title={t.attachPhoto}
              aria-label={t.attachPhoto}
              disabled={sending || pending.length >= MAX_CHAT_ATTACHMENTS}
              onClick={() => photoInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                <path
                  d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l.7-1.2A1.5 1.5 0 0 1 10.6 3h2.8a1.5 1.5 0 0 1 1.3.8L15.4 5h2.1A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={pending.length ? t.attachHint : t.askPlaceholder}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(text);
                }
              }}
            />
            <button
              type="submit"
              className="va-send"
              disabled={sending || (!text.trim() && !pending.length)}
              aria-label={t.send}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
        {error && <p className="error va-error">{error}</p>}
        <p className="va-foot muted">
          {t.footNote} · <button type="button" className="va-linkish" onClick={() => void locateFarm(true)}>{locLabel}</button>
        </p>
      </main>
    </div>

    {historyOpen && (
      <div className="va-hist-backdrop" role="presentation" onClick={() => setHistoryOpen(false)}>
        <aside
          className="va-hist-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t.allHistory}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="va-hist-head">
            <h2>{t.allHistory}</h2>
            <div className="va-hist-actions">
              <button
                type="button"
                className="va-clear-all"
                disabled={!sessions.length}
                onClick={() => void clearAllHistory()}
              >
                {t.clearAllHistory}
              </button>
              <button type="button" className="secondary compact" onClick={() => setHistoryOpen(false)}>
                {t.closeHistory}
              </button>
            </div>
          </header>
          {!sessions.length && <p className="muted va-recent-empty">{t.noHistoryYet}</p>}
          <ul className="va-session-list va-hist-list">
            {sessions.map((s) => (
              <SessionRow key={s.sessionId} s={s} dense />
            ))}
          </ul>
        </aside>
      </div>
    )}
    </>
  );
}
