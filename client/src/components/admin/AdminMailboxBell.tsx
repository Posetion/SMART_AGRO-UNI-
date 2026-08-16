import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type Notice = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: string;
  fromUserId?: { _id?: string; fullName?: string; email?: string } | string;
  meta?: {
    reason?: string;
    diagnosisId?: string;
    postId?: string;
    appealMessage?: string;
    originalBody?: string;
    sourceType?: string;
    staffReplied?: boolean;
    staffReplyMessage?: string;
  };
};

function farmerName(n: Notice) {
  const u = n.fromUserId;
  if (!u || typeof u === 'string') return 'Farmer';
  return u.fullName?.trim() || u.email || 'Farmer';
}

function timeLabel(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminMailboxBell() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState<Notice | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function refresh() {
    if (!accessToken) return;
    try {
      const [list, unread] = await Promise.all([
        api<Notice[]>('/messages/notifications', { token: accessToken }),
        api<{ count: number }>('/messages/notifications/unread-count', { token: accessToken }),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setCount(unread?.count || 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setActive(null);
        setError('');
        setOk('');
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function openNotice(n: Notice) {
    if (!accessToken) return;
    setError('');
    setOk('');
    setReply('');
    setActive(n);
    if (!n.read) {
      try {
        await api(`/messages/notifications/${n._id}/read`, { method: 'POST', token: accessToken });
        setCount((c) => Math.max(0, c - 1));
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch {
        /* ignore */
      }
    }
  }

  async function sendReply() {
    if (!accessToken || !active) return;
    const message = reply.trim();
    if (message.length < 3) {
      setError('Write a short reply (at least 3 characters).');
      return;
    }
    setSending(true);
    setError('');
    setOk('');
    try {
      await api(`/messages/notifications/${active._id}/reply`, {
        method: 'POST',
        token: accessToken,
        body: { message },
      });
      setOk('Reply sent to the farmer.');
      setReply('');
      setItems((prev) =>
        prev.map((x) =>
          x._id === active._id
            ? {
                ...x,
                read: true,
                meta: { ...x.meta, staffReplied: true, staffReplyMessage: message },
              }
            : x
        )
      );
      setActive((cur) =>
        cur
          ? {
              ...cur,
              read: true,
              meta: { ...cur.meta, staffReplied: true, staffReplyMessage: message },
            }
          : cur
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSending(false);
    }
  }

  function goRelated(n: Notice) {
    const source = String(n.meta?.sourceType || '');
    if (n.meta?.diagnosisId || source.includes('diagnosis')) {
      navigate('/admin/diagnoses');
      setOpen(false);
      setActive(null);
      return;
    }
    if (n.link?.startsWith('/admin')) {
      navigate(n.link);
      setOpen(false);
      setActive(null);
      return;
    }
    if (n.type === 'post_reported' || n.meta?.postId || source.startsWith('post')) {
      navigate('/admin/moderation');
      setOpen(false);
      setActive(null);
    }
  }

  const canReply =
    (active?.type === 'reapproval_requested' || active?.type === 'diagnosis_review_requested') &&
    !active.meta?.staffReplied;

  return (
    <div className="ad-mb" ref={ref}>
      <button
        type="button"
        className="ad-bell"
        aria-label="Admin notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setActive(null);
            void refresh();
          }
        }}
      >
        <IconBell />
        {count > 0 && <em>{count > 9 ? '9+' : count}</em>}
      </button>

      {open && (
        <div className="ad-mb-panel" role="dialog" aria-label="Admin notifications">
          {!active ? (
            <>
              <header className="ad-mb-head">
                <strong>Inbox</strong>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => {
                    if (!accessToken) return;
                    void api('/messages/notifications/read-all', {
                      method: 'POST',
                      token: accessToken,
                    }).then(() => {
                      setCount(0);
                      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
                    });
                  }}
                >
                  Mark all read
                </button>
              </header>
              <ul className="ad-mb-list">
                {items.length === 0 && <li className="ad-mb-empty">No notifications yet.</li>}
                {items.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      className={n.read ? undefined : 'is-unread'}
                      onClick={() => void openNotice(n)}
                    >
                      <strong>{n.title}</strong>
                      <span>{n.body || 'Open to read'}</span>
                      <small>
                        {farmerName(n)} · {timeLabel(n.createdAt)}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="ad-mb-detail">
              <header className="ad-mb-head">
                <button type="button" className="linkish" onClick={() => setActive(null)}>
                  ← Back
                </button>
                <button type="button" className="linkish" onClick={() => goRelated(active)}>
                  Open page
                </button>
              </header>

              <div className="ad-mb-card">
                <p className="ad-mb-kicker">From {farmerName(active)}</p>
                <h3>{active.title}</h3>
                {active.body &&
                active.body !== active.meta?.appealMessage ? (
                  <p className="ad-mb-body">{active.body}</p>
                ) : null}

                {active.meta?.appealMessage ? (
                  <div className="ad-mb-block">
                    <span>Farmer request</span>
                    <p>{active.meta.appealMessage}</p>
                  </div>
                ) : active.body ? (
                  <div className="ad-mb-block">
                    <span>Message</span>
                    <p>{active.body}</p>
                  </div>
                ) : null}

                {active.meta?.reason || active.meta?.originalBody ? (
                  <div className="ad-mb-block is-reason">
                    <span>Original reason</span>
                    <p>{active.meta.reason || active.meta.originalBody}</p>
                  </div>
                ) : null}

                {active.meta?.staffReplied && active.meta.staffReplyMessage ? (
                  <div className="ad-mb-block is-reply">
                    <span>Your reply</span>
                    <p>{active.meta.staffReplyMessage}</p>
                  </div>
                ) : null}

                <time>{timeLabel(active.createdAt)}</time>
              </div>

              {error && <p className="error ad-mb-msg">{error}</p>}
              {ok && <p className="ad-mb-ok">{ok}</p>}

              {canReply && (
                <form
                  className="ad-mb-reply"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendReply();
                  }}
                >
                  <label htmlFor="ad-mb-reply">Reply to farmer</label>
                  <textarea
                    id="ad-mb-reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Explain your decision or next steps…"
                    rows={3}
                    maxLength={500}
                  />
                  <button type="submit" disabled={sending || reply.trim().length < 3}>
                    {sending ? 'Sending…' : 'Send reply'}
                  </button>
                </form>
              )}

              {!canReply && active.type !== 'reapproval_requested' && (
                <p className="ad-mb-hint muted">Open the related page to take action.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M6.5 16.5h11l-1.2-1.5V10a4.3 4.3 0 1 0-8.6 0v5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18.2a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
