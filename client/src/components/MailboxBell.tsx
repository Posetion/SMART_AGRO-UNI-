import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mailboxCopy } from '../i18n/messages';
import { api } from '../services/api';

type Notice = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: string;
  fromUserId?: { fullName?: string; email?: string; avatarUrl?: string } | string;
  meta?: {
    reason?: string;
    diagnosisId?: string;
    postId?: string;
    conversationId?: string;
    appealed?: boolean;
  };
};

/** Open as a full system message on the Messages → Notices tab */
const NOTICE_DETAIL_TYPES = new Set([
  'post_removed',
  'post_hidden',
  'post_restored',
  'post_reported',
  'diagnosis_verified',
  'diagnosis_rejected',
  'diagnosis_review_requested',
  'reapproval_requested',
  'system',
]);

export function MailboxBell() {
  const { accessToken, user } = useAuth();
  const { lang } = useLanguage();
  const t = mailboxCopy(lang);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    if (!accessToken || user?.isGuest) return;
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
    const id = window.setInterval(() => void refresh(), 20000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.isGuest]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!accessToken || user?.isGuest) return null;

  async function openNotice(n: Notice) {
    if (!accessToken) return;
    if (!n.read) {
      try {
        await api(`/messages/notifications/${n._id}/read`, { method: 'POST', token: accessToken });
        setCount((c) => Math.max(0, c - 1));
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);

    if (NOTICE_DETAIL_TYPES.has(n.type)) {
      navigate(`/messages?tab=notices&n=${n._id}`);
      return;
    }
    if (n.link) {
      navigate(n.link);
      return;
    }
    navigate('/messages?tab=notices&n=' + n._id);
  }

  async function markAll() {
    if (!accessToken) return;
    try {
      await api('/messages/notifications/read-all', { method: 'POST', token: accessToken });
      setCount(0);
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-bell" ref={ref}>
      <button
        type="button"
        className="mb-bell-btn"
        aria-label={t.mailbox}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
      >
        <IconMail />
        {count > 0 && <em>{count > 9 ? '9+' : count}</em>}
      </button>

      {open && (
        <div className="mb-panel" role="dialog" aria-label={t.mailbox}>
          <header className="mb-panel-head">
            <strong>{t.mailbox}</strong>
            <div className="mb-panel-actions">
              <button type="button" className="linkish" onClick={() => void markAll()}>
                {t.markAll}
              </button>
              <button
                type="button"
                className="linkish"
                onClick={() => {
                  setOpen(false);
                  navigate('/messages?tab=notices');
                }}
              >
                {t.openMessages}
              </button>
            </div>
          </header>
          <ul className="mb-list">
            {items.length === 0 && <li className="mb-empty">{t.empty}</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  className={n.read ? undefined : 'is-unread'}
                  onClick={() => void openNotice(n)}
                >
                  <strong>{n.title}</strong>
                  {n.body && <span>{n.body}</span>}
                  <small>
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
