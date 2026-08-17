import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { messagesCopy } from '../i18n/messages';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';
type Tab = 'personal' | 'group' | 'friends' | 'notices';

type PublicUser = {
  _id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  avatarTone?: Tone;
  role?: string;
  isFriend?: boolean;
  friendship?: 'none' | 'friends' | 'outgoing' | 'incoming';
};

type Notice = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: string;
  fromUserId?: PublicUser | string;
  meta?: {
    reason?: string;
    diagnosisId?: string;
    postId?: string;
    conversationId?: string;
    disease?: string;
    cropType?: string;
    appealed?: boolean;
    appealMessage?: string;
    staffReplied?: boolean;
    staffReplyMessage?: string;
    originalBody?: string;
    sourceType?: string;
  };
};

type Conversation = {
  _id: string;
  type?: 'direct' | 'group';
  name?: string;
  description?: string;
  visibility?: 'private' | 'public';
  inviteCode?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unread?: number;
  muted?: boolean;
  otherUser?: PublicUser | null;
  participants?: PublicUser[];
  adminIds?: Array<PublicUser | string>;
  createdBy?: PublicUser | string;
  memberCount?: number;
};

type MessageAttachment = {
  kind: 'image' | 'link' | 'file';
  url: string;
  name?: string;
};

type PendingFile = {
  id: string;
  file: File;
  preview?: string;
  kind: 'image' | 'file';
};

const MAX_MSG_ATTACHMENTS = 8;

type ChatMessage = {
  _id: string;
  text: string;
  attachments?: MessageAttachment[];
  createdAt?: string;
  senderId?: PublicUser | string;
  deleted?: boolean;
  replyTo?: {
    _id?: string;
    text?: string;
    deletedForEveryone?: boolean;
    senderId?: PublicUser | string;
    attachments?: MessageAttachment[];
  } | null;
  forwardedFrom?: { senderName?: string } | null;
};

type FriendRow = { friendshipId: string; user: PublicUser; since?: string };
type FriendRequest = {
  _id: string;
  fromUserId?: PublicUser;
  toUserId?: PublicUser;
  createdAt?: string;
};

function displayName(u?: PublicUser | null) {
  if (!u) return 'Farmer';
  return u.fullName?.trim() || u.email?.split('@')[0] || 'Farmer';
}

function Avatar({ user, size = '' }: { user?: PublicUser | null; size?: string }) {
  const name = displayName(user);
  const tone = user?.avatarTone || 'sky';
  if (user?.avatarUrl) {
    return <img className={`avatar ${size}`.trim()} src={mediaUrl(user.avatarUrl) || user.avatarUrl} alt="" />;
  }
  return <span className={`avatar ${size} tone-${tone}`.trim()}>{name.slice(0, 1).toUpperCase()}</span>;
}

function timeLabel(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function dayKey(iso?: string) {
  return iso ? new Date(iso).toDateString() : '';
}

function dayLabel(iso: string | undefined, todayWord: string) {
  if (!iso) return todayWord;
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return todayWord;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAdmin(convo: Conversation | null, userId: string) {
  if (!convo) return false;
  const created = typeof convo.createdBy === 'string' ? convo.createdBy : convo.createdBy?._id;
  if (created && created === userId) return true;
  if (!convo.adminIds) return false;
  return convo.adminIds.some((a) => (typeof a === 'string' ? a : a._id) === userId);
}

function convoTitle(c?: Conversation | null) {
  if (!c) return '';
  if (c.type === 'group') return c.name || 'Group';
  return displayName(c.otherUser);
}

export function MessagesPage() {
  const { accessToken, user } = useAuth();
  const { lang } = useLanguage();
  const t = messagesCopy(lang);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const routeParams = useParams<{ code?: string }>();
  const activeId = params.get('c') || '';
  const noticeId = params.get('n') || '';
  const inviteParam = params.get('invite') || routeParams.code || '';
  const tabParam = params.get('tab');
  const tab: Tab =
    tabParam === 'group' ||
    tabParam === 'friends' ||
    tabParam === 'personal' ||
    tabParam === 'notices'
      ? tabParam
      : 'personal';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [appealDraft, setAppealDraft] = useState('');
  const [appealing, setAppealing] = useState(false);
  const [appealOk, setAppealOk] = useState('');
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupVisibility, setGroupVisibility] = useState<'private' | 'public'>('private');
  const [pickedMembers, setPickedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState<PublicUser[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingPingRef = useRef<number | null>(null);
  const typingStopRef = useRef<number | null>(null);
  const lastTypingSent = useRef(false);
  const inviteHandled = useRef('');
  const menuRef = useRef<HTMLDivElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const forceScroll = useRef(true);
  const messagesSigRef = useRef('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [msgMenu, setMsgMenu] = useState<{ x: number; y: number; msg: ChatMessage } | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [forwardPick, setForwardPick] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const active = useMemo(
    () => conversations.find((c) => c._id === activeId) || null,
    [conversations, activeId]
  );

  const filtered = useMemo(() => {
    if (tab === 'friends' || tab === 'notices') return [];
    const want = tab === 'group' ? 'group' : 'direct';
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if ((c.type || 'direct') !== want) return false;
      if (!q) return true;
      const title = convoTitle(c).toLowerCase();
      const preview = (c.lastMessagePreview || '').toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
  }, [conversations, tab, search]);

  const activeNotice = useMemo(
    () => notices.find((n) => n._id === noticeId) || null,
    [notices, noticeId]
  );

  const noticesUnread = useMemo(() => notices.filter((n) => !n.read).length, [notices]);

  useEffect(() => {
    setMenuOpen(false);
    setDetailsOpen(false);
  }, [activeId, noticeId]);

  useEffect(() => {
    function onDoc(e: globalThis.MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!msgMenuRef.current?.contains(e.target as Node)) setMsgMenu(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (msgMenu) {
        setMsgMenu(null);
        return;
      }
      if (deleteTarget) {
        setDeleteTarget(null);
        return;
      }
      if (forwardMsg) {
        setForwardMsg(null);
        return;
      }
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (detailsOpen) setDetailsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, detailsOpen, msgMenu, forwardMsg, deleteTarget]);

  const setTab = useCallback(
    (next: Tab) => {
      const nextParams: Record<string, string> = { tab: next };
      if (activeId && next !== 'friends' && next !== 'notices') nextParams.c = activeId;
      if (noticeId && next === 'notices') nextParams.n = noticeId;
      setParams(nextParams);
    },
    [activeId, noticeId, setParams]
  );

  const loadNotices = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api<Notice[]>('/messages/notifications', { token: accessToken });
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }, [accessToken]);

  const loadConversations = useCallback(async () => {
    if (!accessToken) return;
    const data = await api<Conversation[]>('/messages/conversations', { token: accessToken });
    setConversations(Array.isArray(data) ? data : []);
  }, [accessToken]);

  const refreshActiveGroup = useCallback(async () => {
    if (!accessToken || !activeId) return;
    try {
      const data = await api<Conversation>(`/messages/conversations/${activeId}`, {
        token: accessToken,
      });
      setConversations((prev) => {
        const others = prev.filter((c) => c._id !== data._id);
        return [data, ...others];
      });
    } catch {
      /* ignore */
    }
  }, [accessToken, activeId]);

  useEffect(() => {
    if (!accessToken || !inviteParam || inviteHandled.current === inviteParam) return;
    inviteHandled.current = inviteParam;
    void (async () => {
      setError('');
      try {
        const data = await api<Conversation>(`/messages/invite/${inviteParam}/join`, {
          method: 'POST',
          token: accessToken,
        });
        await loadConversations();
        setParams({ tab: 'group', c: data._id });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.joinFailed);
      }
    })();
  }, [accessToken, inviteParam, loadConversations, setParams, t.joinFailed]);

  useEffect(() => {
    if (active?.type === 'group' && detailsOpen) {
      void refreshActiveGroup();
    }
  }, [active?._id, active?.type, detailsOpen, refreshActiveGroup]);

  const loadFriends = useCallback(async () => {
    if (!accessToken) return;
    const [flist, reqs] = await Promise.all([
      api<FriendRow[]>('/messages/friends', { token: accessToken }),
      api<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/messages/friends/requests', {
        token: accessToken,
      }),
    ]);
    setFriends(Array.isArray(flist) ? flist : []);
    setIncoming(Array.isArray(reqs?.incoming) ? reqs.incoming : []);
    setOutgoing(Array.isArray(reqs?.outgoing) ? reqs.outgoing : []);
  }, [accessToken]);

  const loadMessages = useCallback(
    async (id: string) => {
      if (!accessToken || !id) return;
      const data = await api<ChatMessage[]>(`/messages/conversations/${id}/messages`, {
        token: accessToken,
      });
      const next = Array.isArray(data) ? data : [];
      setMessages((prev) => {
        if (
          prev.length === next.length &&
          prev.every(
            (m, i) =>
              m._id === next[i]?._id &&
              m.text === next[i]?.text &&
              Boolean(m.deleted) === Boolean(next[i]?.deleted)
          )
        ) {
          return prev;
        }
        return next;
      });
      const last = next[next.length - 1]?._id;
      const prevLast = messagesSigRef.current;
      messagesSigRef.current = last || '';
      if (last && last !== prevLast) void loadConversations();
    },
    [accessToken, loadConversations]
  );

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadConversations(), loadFriends(), loadNotices()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadFailed);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, loadConversations, loadFriends, loadNotices, t.loadFailed]);

  useEffect(() => {
    if (tab !== 'notices' || !accessToken) return;
    void loadNotices();
    const timer = window.setInterval(() => void loadNotices(), 20000);
    return () => window.clearInterval(timer);
  }, [tab, accessToken, loadNotices]);

  useEffect(() => {
    if (tab !== 'notices' || !noticeId) return;
    setAppealDraft('');
    setAppealOk('');
  }, [tab, noticeId]);

  useEffect(() => {
    if (tab !== 'notices' || !noticeId || !accessToken) return;
    void (async () => {
      try {
        const target = notices.find((n) => n._id === noticeId);
        if (target?.read) return;
        await api(`/messages/notifications/${noticeId}/read`, {
          method: 'POST',
          token: accessToken,
        });
        setNotices((prev) =>
          prev.map((n) => (n._id === noticeId ? { ...n, read: true } : n))
        );
      } catch {
        /* ignore */
      }
    })();
    // Only re-run when the selected notice changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, noticeId, accessToken]);

  useEffect(() => {
    if (!activeId || tab === 'friends' || tab === 'notices') {
      setMessages([]);
      return;
    }
    void loadMessages(activeId).catch((err) => {
      setError(err instanceof Error ? err.message : t.loadFailed);
    });
    const timer = window.setInterval(() => {
      void loadMessages(activeId).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages, t.loadFailed, tab]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    if (forceScroll.current || stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
      forceScroll.current = false;
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    lastTypingSent.current = false;
    setTypingUsers([]);
    setPendingAttachments([]);
    setPendingFiles((prev) => {
      prev.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
    setLinkOpen(false);
    setLinkUrl('');
    setLinkName('');
    setDraft('');
    setReplyTo(null);
    setMsgMenu(null);
    setForwardMsg(null);
    setDeleteTarget(null);
    stickToBottom.current = true;
    forceScroll.current = true;
    messagesSigRef.current = '';
  }, [activeId]);

  useEffect(() => {
    if (!accessToken || !activeId || tab === 'friends') {
      setTypingUsers([]);
      return;
    }
    let cancelled = false;
    const poll = () => {
      void api<{ typing: PublicUser[] }>(`/messages/conversations/${activeId}/typing`, {
        token: accessToken,
      })
        .then((data) => {
          if (!cancelled) setTypingUsers(Array.isArray(data?.typing) ? data.typing : []);
        })
        .catch(() => {
          if (!cancelled) setTypingUsers([]);
        });
    };
    poll();
    const timer = window.setInterval(poll, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [accessToken, activeId, tab]);

  useEffect(() => {
    return () => {
      if (typingPingRef.current) window.clearTimeout(typingPingRef.current);
      if (typingStopRef.current) window.clearTimeout(typingStopRef.current);
    };
  }, []);

  async function notifyTyping(typing: boolean) {
    if (!accessToken || !activeId) return;
    if (!typing && !lastTypingSent.current) return;
    lastTypingSent.current = typing;
    try {
      await api(`/messages/conversations/${activeId}/typing`, {
        method: 'POST',
        token: accessToken,
        body: { typing },
      });
    } catch {
      /* ignore */
    }
  }

  function onDraftChange(value: string) {
    setDraft(value);
    if (!activeId || !accessToken) return;

    if (typingStopRef.current) window.clearTimeout(typingStopRef.current);

    if (!value.trim()) {
      if (typingPingRef.current) window.clearTimeout(typingPingRef.current);
      void notifyTyping(false);
      return;
    }

    if (typingPingRef.current) window.clearTimeout(typingPingRef.current);
    typingPingRef.current = window.setTimeout(() => {
      void notifyTyping(true);
    }, 300);

    typingStopRef.current = window.setTimeout(() => {
      void notifyTyping(false);
    }, 2800);
  }

  useEffect(() => {
    if (active?.type === 'group') setDetailsOpen(true);
  }, [active?._id, active?.type]);

  useEffect(() => {
    if (!accessToken) return;
    const q = search.trim();
    if (q.length < 2) {
      setPeople([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void api<PublicUser[]>(`/messages/users?q=${encodeURIComponent(q)}`, { token: accessToken })
        .then((list) => setPeople(Array.isArray(list) ? list : []))
        .catch(() => setPeople([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [accessToken, search]);

  async function openWith(userId: string) {
    if (!accessToken) return;
    setError('');
    try {
      const data = await api<Conversation>('/messages/conversations', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      setSearch('');
      setPeople([]);
      await loadConversations();
      setParams({ tab: 'personal', c: data._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.openFailed);
    }
  }

  async function addFriend(userId: string) {
    if (!accessToken) return;
    try {
      await api('/messages/friends/request', {
        method: 'POST',
        token: accessToken,
        body: { userId },
      });
      await loadFriends();
      setPeople((prev) =>
        prev.map((p) =>
          p._id === userId
            ? {
                ...p,
                isFriend: p.friendship === 'incoming',
                friendship: p.friendship === 'incoming' ? 'friends' : 'outgoing',
              }
            : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.friendFailed);
    }
  }

  async function respondRequest(id: string, action: 'accept' | 'decline') {
    if (!accessToken) return;
    try {
      await api(`/messages/friends/requests/${id}`, {
        method: 'POST',
        token: accessToken,
        body: { action },
      });
      await loadFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.friendFailed);
    }
  }

  async function sendAppeal(notice: Notice) {
    if (!accessToken) return;
    const message = appealDraft.trim();
    if (message.length < 3) {
      setError(t.appealFailed);
      return;
    }
    setAppealing(true);
    setError('');
    setAppealOk('');
    try {
      if (notice.type === 'diagnosis_rejected' && notice.meta?.diagnosisId) {
        await api(`/detections/${notice.meta.diagnosisId}/request-reapproval`, {
          method: 'POST',
          token: accessToken,
          body: { message },
        });
      } else {
        await api(`/messages/notifications/${notice._id}/appeal`, {
          method: 'POST',
          token: accessToken,
          body: { message },
        });
      }
      setAppealOk(t.appealSent);
      setAppealDraft('');
      setNotices((prev) =>
        prev.map((n) =>
          n._id === notice._id
            ? { ...n, meta: { ...n.meta, appealed: true, appealMessage: message } }
            : n
        )
      );
      await loadNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.appealFailed);
    } finally {
      setAppealing(false);
    }
  }

  async function sendStaffReply(notice: Notice) {
    if (!accessToken) return;
    const message = appealDraft.trim();
    if (message.length < 3) {
      setError(t.appealFailed);
      return;
    }
    setAppealing(true);
    setError('');
    setAppealOk('');
    try {
      await api(`/messages/notifications/${notice._id}/reply`, {
        method: 'POST',
        token: accessToken,
        body: { message },
      });
      setAppealOk(t.staffReplySent);
      setAppealDraft('');
      setNotices((prev) =>
        prev.map((n) =>
          n._id === notice._id
            ? {
                ...n,
                read: true,
                meta: { ...n.meta, staffReplied: true, staffReplyMessage: message },
              }
            : n
        )
      );
      await loadNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.appealFailed);
    } finally {
      setAppealing(false);
    }
  }

  async function sendPayload(text: string, attachments: MessageAttachment[]) {
    if (!accessToken || !activeId) return;
    const caption = text.trim();
    if (!caption && attachments.length === 0) return;

    setSending(true);
    setError('');
    if (typingPingRef.current) window.clearTimeout(typingPingRef.current);
    if (typingStopRef.current) window.clearTimeout(typingStopRef.current);
    void notifyTyping(false);
    try {
      const msg = await api<ChatMessage>(`/messages/conversations/${activeId}/messages`, {
        method: 'POST',
        token: accessToken,
        body: {
          text: caption,
          attachments,
          replyTo: replyTo && !replyTo.deleted ? replyTo._id : undefined,
        },
      });
      setDraft('');
      setReplyTo(null);
      setPendingAttachments([]);
      setPendingFiles((prev) => {
        prev.forEach((p) => {
          if (p.preview) URL.revokeObjectURL(p.preview);
        });
        return [];
      });
      setLinkOpen(false);
      setLinkUrl('');
      setLinkName('');
      forceScroll.current = true;
      stickToBottom.current = true;
      setMessages((prev) => [...prev, msg]);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.sendFailed);
    } finally {
      setSending(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (sending || uploading) return;
    const queued = pendingFiles;
    const links = pendingAttachments.filter((a) => a.kind === 'link');
    if (!draft.trim() && queued.length === 0 && links.length === 0) return;

    setUploading(queued.length > 0);
    setError('');
    try {
      const uploaded: MessageAttachment[] = [];
      for (const item of queued) {
        const form = new FormData();
        if (item.kind === 'image') {
          form.append('image', item.file);
          const data = await api<{ url: string; name?: string; kind: 'image' }>(
            `/messages/conversations/${activeId}/upload`,
            { method: 'POST', token: accessToken, formData: form }
          );
          uploaded.push({ kind: 'image', url: data.url, name: data.name });
        } else {
          form.append('file', item.file);
          const data = await api<{ url: string; name?: string; kind: 'image' | 'file' }>(
            `/messages/conversations/${activeId}/upload-file`,
            { method: 'POST', token: accessToken, formData: form }
          );
          uploaded.push({ kind: data.kind, url: data.url, name: data.name });
        }
      }
      await sendPayload(draft, [...uploaded, ...links]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadFileFailed);
    } finally {
      setUploading(false);
    }
  }

  function addPendingLink(e?: FormEvent) {
    e?.preventDefault();
    const url = linkUrl.trim();
    if (!isValidHttpUrl(url)) {
      setError(t.invalidLink);
      return;
    }
    if (pendingFiles.length + pendingAttachments.length >= MAX_MSG_ATTACHMENTS) {
      setError(t.maxAttachments);
      return;
    }
    setError('');
    setPendingAttachments((prev) => [
      ...prev,
      { kind: 'link', url, name: linkName.trim() || undefined },
    ]);
    setLinkUrl('');
    setLinkName('');
    setLinkOpen(false);
  }

  function addFiles(list: FileList | File[] | null, imagesOnly = false) {
    if (!list) return;
    const picked = Array.from(list);
    setPendingFiles((prev) => {
      const next = [...prev];
      const extra = pendingAttachments.length;
      for (const file of picked) {
        if (next.length + extra >= MAX_MSG_ATTACHMENTS) {
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
          kind: file.type.startsWith('image/') ? 'image' : 'file',
        });
      }
      return next;
    });
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit?.preview) URL.revokeObjectURL(hit.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function onCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !groupName.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      const data = await api<Conversation>('/messages/conversations/group', {
        method: 'POST',
        token: accessToken,
        body: {
          name: groupName.trim(),
          description: groupDesc.trim() || undefined,
          memberIds: pickedMembers,
          visibility: groupVisibility,
        },
      });
      setCreateOpen(false);
      setGroupName('');
      setGroupDesc('');
      setGroupVisibility('private');
      setPickedMembers([]);
      await loadConversations();
      setParams({ tab: 'group', c: data._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    } finally {
      setCreating(false);
    }
  }

  async function onAddMembers(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !activeId || !pickedMembers.length || adding) return;
    setAdding(true);
    setError('');
    try {
      const data = await api<Conversation>(`/messages/conversations/${activeId}/members`, {
        method: 'POST',
        token: accessToken,
        body: { memberIds: pickedMembers },
      });
      setAddOpen(false);
      setPickedMembers([]);
      setConversations((prev) => {
        const others = prev.filter((c) => c._id !== data._id);
        return [data, ...others];
      });
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    } finally {
      setAdding(false);
    }
  }

  async function setVisibility(visibility: 'private' | 'public') {
    if (!accessToken || !activeId || !active || active.type !== 'group') return;
    try {
      const data = await api<Conversation>(`/messages/conversations/${activeId}`, {
        method: 'PATCH',
        token: accessToken,
        body: { visibility },
      });
      setConversations((prev) => {
        const others = prev.filter((c) => c._id !== data._id);
        return [data, ...others];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  function inviteUrl(code?: string) {
    if (!code) return '';
    return `${window.location.origin}/messages/join/${code}`;
  }

  async function copyInvite() {
    const url = inviteUrl(active?.inviteCode);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError(t.groupFailed);
    }
  }

  async function refreshInvite() {
    if (!accessToken || !activeId) return;
    try {
      const data = await api<Conversation>(`/messages/conversations/${activeId}/invite/regenerate`, {
        method: 'POST',
        token: accessToken,
      });
      setConversations((prev) => {
        const others = prev.filter((c) => c._id !== data._id);
        return [data, ...others];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  async function onLeaveGroup() {
    if (!accessToken || !activeId || active?.type !== 'group') return;
    try {
      await api(`/messages/conversations/${activeId}/leave`, {
        method: 'POST',
        token: accessToken,
      });
      setParams({ tab: 'group' });
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  function closeThread() {
    if (detailsOpen) {
      setDetailsOpen(false);
      return;
    }
    const next: Record<string, string> = { tab };
    setParams(next);
    setMenuOpen(false);
  }

  async function toggleMute() {
    if (!accessToken || !activeId) return;
    const next = !active?.muted;
    try {
      await api(`/messages/conversations/${activeId}/mute`, {
        method: 'POST',
        token: accessToken,
        body: { muted: next },
      });
      setConversations((prev) =>
        prev.map((c) => (c._id === activeId ? { ...c, muted: next } : c))
      );
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  async function clearHistory() {
    if (!accessToken || !activeId) return;
    if (!window.confirm(t.clearHistoryConfirm)) return;
    try {
      await api(`/messages/conversations/${activeId}/messages`, {
        method: 'DELETE',
        token: accessToken,
      });
      setMessages([]);
      setConversations((prev) =>
        prev.map((c) => (c._id === activeId ? { ...c, lastMessagePreview: '', unread: 0 } : c))
      );
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  async function deleteChat() {
    if (!accessToken || !activeId) return;
    if (!window.confirm(t.deleteChatConfirm)) return;
    try {
      await api(`/messages/conversations/${activeId}/hide`, {
        method: 'POST',
        token: accessToken,
      });
      setParams({ tab });
      await loadConversations();
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupFailed);
    }
  }

  function messageSender(m: ChatMessage) {
    return typeof m.senderId === 'object' && m.senderId ? m.senderId : undefined;
  }

  function isMine(m: ChatMessage) {
    const sender = messageSender(m);
    return (
      (typeof m.senderId === 'string' && m.senderId === user?.id) ||
      Boolean(sender && sender._id === user?.id)
    );
  }

  function messagePreview(m: ChatMessage) {
    if (m.deleted) return t.messageDeleted;
    if (m.text?.trim()) return m.text.trim();
    const first = m.attachments?.[0];
    if (first?.kind === 'image') return t.photo;
    if (first?.kind === 'file') return first.name || t.file;
    if (first?.kind === 'link') return first.name || t.link;
    return t.message;
  }

  function openMsgMenu(e: MouseEvent, msg: ChatMessage) {
    e.preventDefault();
    if (msg.deleted) return;
    const pad = 8;
    const w = 188;
    const h = 148;
    const x = Math.min(e.clientX, window.innerWidth - w - pad);
    const y = Math.min(e.clientY, window.innerHeight - h - pad);
    setMsgMenu({ x: Math.max(pad, x), y: Math.max(pad, y), msg });
  }

  function startReply(msg: ChatMessage) {
    setReplyTo(msg);
    setMsgMenu(null);
  }

  function startForward(msg: ChatMessage) {
    setForwardMsg(msg);
    setForwardPick([]);
    setMsgMenu(null);
  }

  function askDelete(msg: ChatMessage) {
    setDeleteTarget(msg);
    setMsgMenu(null);
  }

  async function confirmDelete(forEveryone: boolean) {
    if (!accessToken || !activeId || !deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      const q = forEveryone ? '?everyone=1' : '';
      await api(`/messages/conversations/${activeId}/messages/${deleteTarget._id}${q}`, {
        method: 'DELETE',
        token: accessToken,
        body: { forEveryone },
      });
      const id = deleteTarget._id;
      setMessages((prev) =>
        forEveryone
          ? prev.map((m) =>
              m._id === id ? { ...m, text: '', attachments: [], deleted: true, replyTo: null } : m
            )
          : prev.filter((m) => m._id !== id)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteMessageFailed);
    } finally {
      setDeleting(false);
    }
  }

  async function confirmForward() {
    if (!accessToken || !forwardMsg || forwardPick.length === 0) return;
    setForwarding(true);
    setError('');
    try {
      await api('/messages/forward', {
        method: 'POST',
        token: accessToken,
        body: { messageId: forwardMsg._id, conversationIds: forwardPick },
      });
      if (forwardPick.includes(activeId)) {
        forceScroll.current = true;
        stickToBottom.current = true;
        await loadMessages(activeId);
      }
      setForwardMsg(null);
      setForwardPick([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.forwardFailed);
    } finally {
      setForwarding(false);
    }
  }

  function onLogScroll() {
    const el = logRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }

  if (!user || !accessToken) {
    return (
      <div className="pk-page">
        <section className="pk-gate">
          <h1>{t.title}</h1>
          <p>{t.loginLead}</p>
          <Link className="button" to="/login">
            {t.login}
          </Link>
        </section>
      </div>
    );
  }

  if (user.isGuest) {
    return (
      <div className="pk-page">
        <section className="pk-gate">
          <h1>{t.title}</h1>
          <p>{t.guestLead}</p>
          <Link className="button" to="/login">
            {t.login}
          </Link>
        </section>
      </div>
    );
  }

  const showDetails = Boolean(
    active && active.type === 'group' && detailsOpen && tab !== 'friends' && tab !== 'notices'
  );
  const attachCount = pendingFiles.length + pendingAttachments.length;
  const attachFull = attachCount >= MAX_MSG_ATTACHMENTS;

  const isStaff = user?.role === 'admin' || user?.role === 'expert';

  const canAppeal =
    !isStaff &&
    activeNotice &&
    (activeNotice.type === 'diagnosis_rejected' ||
      activeNotice.type === 'post_removed' ||
      activeNotice.type === 'post_hidden') &&
    !activeNotice.meta?.appealed;

  const canStaffReply =
    isStaff &&
    activeNotice &&
    (activeNotice.type === 'reapproval_requested' ||
      activeNotice.type === 'diagnosis_review_requested') &&
    !activeNotice.meta?.staffReplied;

  const noticeReason = (
    activeNotice?.meta?.reason ||
    activeNotice?.body?.match(/Reason:\s*(.+)$/i)?.[1] ||
    ''
  ).trim();
  const noticeBody = (activeNotice?.body || '')
    .replace(/\s*Reason:\s*.+$/i, '')
    .trim();

  return (
    <div className="pk-page tg-skin">
      {error && <p className="error pk-error">{error}</p>}

      <div
        className={`pk-shell ${showDetails ? 'has-details' : ''} ${
          activeId || (tab === 'notices' && noticeId) ? 'is-chat-open' : ''
        }`}
      >
        <aside className="pk-sidebar">
          {tab !== 'notices' && (
            <label className="pk-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchChats}
              />
            </label>
          )}

          {people.length > 0 && tab !== 'notices' && (
            <ul className="pk-people">
              {people.map((p) => (
                <li key={p._id}>
                  <Avatar user={p} size="sm" />
                  <span>
                    <strong>{displayName(p)}</strong>
                    <small>{p.email}</small>
                  </span>
                  <div className="pk-people-acts">
                    {p.friendship === 'friends' || p.isFriend ? null : p.friendship === 'outgoing' ? (
                      <button type="button" className="secondary compact" disabled>
                        {t.requestPending}
                      </button>
                    ) : (
                      <button type="button" className="secondary compact" onClick={() => void addFriend(p._id)}>
                        {p.friendship === 'incoming' ? t.accept : t.addFriend}
                      </button>
                    )}
                    <button type="button" className="compact" onClick={() => void openWith(p._id)}>
                      {t.message}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="pk-tabs pk-tabs-4">
            <button type="button" className={tab === 'personal' ? 'is-active' : undefined} onClick={() => setTab('personal')}>
              {t.personal}
            </button>
            <button type="button" className={tab === 'group' ? 'is-active' : undefined} onClick={() => setTab('group')}>
              {t.group}
            </button>
            <button type="button" className={tab === 'friends' ? 'is-active' : undefined} onClick={() => setTab('friends')}>
              {t.friends}
              {incoming.length > 0 && <em>{incoming.length}</em>}
            </button>
            <button type="button" className={tab === 'notices' ? 'is-active' : undefined} onClick={() => setTab('notices')}>
              {t.notices}
              {noticesUnread > 0 && <em>{noticesUnread}</em>}
            </button>
          </div>

          {tab === 'group' && (
            <button type="button" className="pk-create-btn" onClick={() => setCreateOpen(true)}>
              + {t.createGroup}
            </button>
          )}

          {tab !== 'friends' && tab !== 'notices' && (
            <>
              {loading && <p className="muted">{t.loading}</p>}
              {!loading && filtered.length === 0 && (
                <p className="muted pk-empty">{tab === 'group' ? t.noGroupChats : t.noChats}</p>
              )}
              <ul className="pk-convo-list">
                {filtered.map((c) => {
                  const selected = c._id === activeId;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        className={`${selected ? 'is-active' : ''} ${c.unread ? 'is-unread' : ''}`.trim()}
                        onClick={() => setParams({ tab, c: c._id })}
                      >
                        {c.type === 'group' ? (
                          <span className="avatar tone-sky">{(c.name || 'G').slice(0, 1).toUpperCase()}</span>
                        ) : (
                          <Avatar user={c.otherUser} />
                        )}
                        <span className="pk-convo-copy">
                          <strong>{convoTitle(c)}</strong>
                          <small>{c.lastMessagePreview || t.noMessagesYet}</small>
                        </span>
                        <span className="pk-convo-meta">
                          <time>{timeLabel(c.lastMessageAt)}</time>
                          {c.muted ? <i className="pk-muted-ico" aria-hidden>🔇</i> : null}
                          {c.unread ? <em className="pk-unread">{c.unread}</em> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === 'notices' && (
            <>
              {loading && <p className="muted">{t.loading}</p>}
              {!loading && notices.length === 0 && <p className="muted pk-empty">{t.noNotices}</p>}
              <ul className="pk-convo-list pk-notice-list">
                {notices.map((n) => {
                  const selected = n._id === noticeId;
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        className={`${selected ? 'is-active' : ''} ${n.read ? '' : 'is-unread'}`.trim()}
                        onClick={() => setParams({ tab: 'notices', n: n._id })}
                      >
                        <span className="avatar tone-amber">S</span>
                        <span className="pk-convo-copy">
                          <strong>
                            {n.title}
                            {!n.read ? <em>{t.noticesUnread}</em> : null}
                          </strong>
                          <small>{n.body || t.systemMessage}</small>
                        </span>
                        <time>{timeLabel(n.createdAt)}</time>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === 'friends' && (
            <div className="pk-friends-panel">
              <h3>{t.friendRequests}</h3>
              <p className="pk-section-label">{t.incoming}</p>
              {!incoming.length && <p className="muted pk-empty">{t.noRequests}</p>}
              <ul className="pk-req-list">
                {incoming.map((r) => (
                  <li key={r._id}>
                    <Avatar user={r.fromUserId} />
                    <span>
                      <strong>{displayName(r.fromUserId)}</strong>
                      <small>{timeLabel(r.createdAt)}</small>
                    </span>
                    <button type="button" className="compact" onClick={() => void respondRequest(r._id, 'accept')}>
                      {t.accept}
                    </button>
                    <button type="button" className="secondary compact" onClick={() => void respondRequest(r._id, 'decline')}>
                      {t.decline}
                    </button>
                  </li>
                ))}
              </ul>

              {outgoing.length > 0 && (
                <>
                  <p className="pk-section-label">{t.outgoing}</p>
                  <ul className="pk-req-list">
                    {outgoing.map((r) => (
                      <li key={r._id}>
                        <Avatar user={r.toUserId} />
                        <span>
                          <strong>{displayName(r.toUserId)}</strong>
                          <small>{t.requestPending}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3>{t.friendsList}</h3>
              {!friends.length && <p className="muted pk-empty">{t.noFriends}</p>}
              <ul className="pk-friend-list">
                {friends.map((f) => (
                  <li key={f.friendshipId}>
                    <Avatar user={f.user} />
                    <span>
                      <strong>{displayName(f.user)}</strong>
                      <small>{f.user.email}</small>
                    </span>
                    <button type="button" className="compact" onClick={() => void openWith(f.user._id)}>
                      {t.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="pk-thread">
          {tab === 'friends' && (
            <div className="pk-thread-empty">
              <h2>{t.friends}</h2>
              <p>{t.pickChatLead}</p>
            </div>
          )}

          {tab === 'notices' && !activeNotice && (
            <div className="pk-thread-empty">
              <h2>{t.pickNotice}</h2>
              <p>{t.pickNoticeLead}</p>
            </div>
          )}

          {tab === 'notices' && activeNotice && (
            <>
              <header className="pk-thread-head">
                <button type="button" className="pk-back-btn" aria-label={t.backToChats} onClick={closeThread}>
                  ‹
                </button>
                <span className="avatar tone-amber">S</span>
                <div>
                  <strong>{activeNotice.title}</strong>
                  <small>
                    {t.fromSmartAgro} · {timeLabel(activeNotice.createdAt)}
                  </small>
                </div>
                {activeNotice.link &&
                  !activeNotice.link.includes('tab=notices') && (
                    <Link className="button secondary compact" to={activeNotice.link}>
                      {t.openRelated}
                    </Link>
                  )}
              </header>

              <div className="pk-log pk-notice-thread">
                <p className="pk-notice-label">{t.systemMessage}</p>

                <article className="pk-notice-card">
                  <h3>{activeNotice.title}</h3>
                  {activeNotice.meta?.cropType || activeNotice.meta?.disease ? (
                    <p className="pk-notice-meta">
                      {[activeNotice.meta.cropType, activeNotice.meta.disease]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                  {noticeBody ? (
                    <div className="pk-notice-block">
                      <span>{t.noticeBody}</span>
                      <p>{noticeBody}</p>
                    </div>
                  ) : null}
                  {noticeReason ? (
                    <div className="pk-notice-block is-reason">
                      <span>{t.reasonLabel}</span>
                      <p>{noticeReason}</p>
                    </div>
                  ) : null}
                  {activeNotice.meta?.appealMessage ? (
                    <div className="pk-notice-block is-request">
                      <span>{t.askReview}</span>
                      <p>{activeNotice.meta.appealMessage}</p>
                    </div>
                  ) : null}
                  {activeNotice.meta?.staffReplyMessage ? (
                    <div className="pk-notice-block is-reply">
                      <span>{t.staffReply}</span>
                      <p>{activeNotice.meta.staffReplyMessage}</p>
                    </div>
                  ) : null}
                  <time>
                    {activeNotice.createdAt
                      ? new Date(activeNotice.createdAt).toLocaleString()
                      : ''}
                  </time>
                </article>

                {appealOk && <p className="pk-notice-ok">{appealOk}</p>}
              </div>

              {canAppeal && (
                <form
                  className="pk-composer pk-notice-appeal"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendAppeal(activeNotice);
                  }}
                >
                  <textarea
                    value={appealDraft}
                    onChange={(e) => setAppealDraft(e.target.value)}
                    placeholder={t.appealPlaceholder}
                    rows={3}
                    maxLength={500}
                  />
                  <button type="submit" disabled={appealing || appealDraft.trim().length < 3}>
                    {appealing
                      ? t.sendingAppeal
                      : activeNotice.type === 'diagnosis_rejected'
                        ? t.askReapproval
                        : t.askReview}
                  </button>
                </form>
              )}

              {canStaffReply && (
                <form
                  className="pk-composer pk-notice-appeal"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendStaffReply(activeNotice);
                  }}
                >
                  <textarea
                    value={appealDraft}
                    onChange={(e) => setAppealDraft(e.target.value)}
                    placeholder={t.staffReplyPlaceholder}
                    rows={3}
                    maxLength={500}
                  />
                  <button type="submit" disabled={appealing || appealDraft.trim().length < 3}>
                    {appealing ? t.sendingAppeal : t.sendStaffReply}
                  </button>
                </form>
              )}

              {!canAppeal && !isStaff && activeNotice.meta?.appealed && (
                <div className="pk-notice-footer muted">{t.alreadyAppealed}</div>
              )}

              {isStaff && activeNotice.meta?.staffReplied && (
                <div className="pk-notice-footer muted">{t.staffReplySent}</div>
              )}
            </>
          )}

          {tab !== 'friends' && tab !== 'notices' && !activeId && (
            <div className="pk-thread-empty">
              <h2>{t.pickChat}</h2>
              <p>{t.pickChatLead}</p>
            </div>
          )}

          {tab !== 'friends' && tab !== 'notices' && activeId && (
            <>
              <header className="pk-thread-head">
                <button type="button" className="pk-back-btn" aria-label={t.backToChats} onClick={closeThread}>
                  ‹
                </button>
                {active?.type === 'group' ? (
                  <span className="avatar tone-sky">{(active.name || 'G').slice(0, 1).toUpperCase()}</span>
                ) : (
                  <Avatar user={active?.otherUser} />
                )}
                <button
                  type="button"
                  className="pk-thread-who"
                  onClick={() => {
                    if (active?.type === 'group') setDetailsOpen(true);
                    else if (active?.otherUser?._id) navigate(`/profile/${active.otherUser._id}`);
                  }}
                >
                  <strong>{convoTitle(active)}</strong>
                  <small>
                    {typingUsers.length
                      ? t.typing
                      : active?.type === 'group'
                        ? `${active.memberCount || active.participants?.length || 0} ${t.membersOnline}`
                        : t.lastSeenRecently}
                  </small>
                </button>
                <div className="pk-thread-tools">
                  {active?.type === 'group' && (
                    <button
                      type="button"
                      className="pk-icon-btn"
                      aria-label={t.groupInfo}
                      title={t.groupInfo}
                      onClick={() => setDetailsOpen((v) => !v)}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M9 5v14" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </button>
                  )}
                  <div className="pk-more" ref={menuRef}>
                    <button
                      type="button"
                      className="pk-icon-btn"
                      aria-label={t.moreOptions}
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                    >
                      ⋮
                    </button>
                    {menuOpen && (
                      <div className="pk-more-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => void toggleMute()}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                            {active?.muted ? (
                              <>
                                <path d="M12 4v2m0 12v2M6.5 7.5 8 9m8.5-1.5L15 9M5 12h2m10 0h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                <path d="M9 10.5a3 3 0 1 1 6 0v3.2l1.4 2.3H7.6L9 13.7v-3.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                              </>
                            ) : (
                              <>
                                <path d="M15 17H8.6L7 14.5V10.5a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                                <path d="M4 5l16 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                              </>
                            )}
                          </svg>
                          {active?.muted ? t.unmuteNotifications : t.muteNotifications}
                        </button>
                        {active?.type === 'direct' && active.otherUser?._id && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpen(false);
                              navigate(`/profile/${active.otherUser!._id}`);
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                              <path d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                            {t.viewProfile}
                          </button>
                        )}
                        {active?.type === 'group' && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpen(false);
                              setDetailsOpen(true);
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
                              <path d="M12 11v5M12 8.2v.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            {t.groupInfo}
                          </button>
                        )}
                        <button type="button" role="menuitem" onClick={() => void clearHistory()}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                            <path d="M5 7h14M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m-1 0v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                          </svg>
                          {t.clearHistory}
                        </button>
                        <button type="button" role="menuitem" className="danger-item" onClick={() => void deleteChat()}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                            <path d="M5 7h14M10 11v6m4-6v6M8 7l1 12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          {active?.type === 'group' ? t.leaveGroup : t.deleteChat}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div className="pk-log" ref={logRef} onScroll={onLogScroll}>
                {messages.map((m, i) => {
                  const sender = messageSender(m);
                  const mine = isMine(m);
                  const attachments = Array.isArray(m.attachments) ? m.attachments : [];
                  const prev = messages[i - 1];
                  const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                  const quoted = m.replyTo;
                  const quotedSender =
                    quoted && typeof quoted.senderId === 'object' ? quoted.senderId : undefined;
                  return (
                    <div key={m._id}>
                      {showDay && <div className="pk-day">{dayLabel(m.createdAt, t.today)}</div>}
                      <div
                        id={`msg-${m._id}`}
                        className={`pk-bubble ${mine ? 'mine' : 'theirs'}${m.deleted ? ' is-deleted' : ''}`}
                        onContextMenu={(e) => openMsgMenu(e, m)}
                      >
                        {!mine && <Avatar user={sender || active?.otherUser} size="sm" />}
                        <div>
                          {!mine && active?.type === 'group' && (
                            <em className="pk-sender">{displayName(sender)}</em>
                          )}
                          {m.forwardedFrom?.senderName && !m.deleted && (
                            <em className="pk-fwd">{t.forwardedFrom} {m.forwardedFrom.senderName}</em>
                          )}
                          {quoted && !m.deleted && (
                            <button
                              type="button"
                              className="pk-quote"
                              onClick={() => {
                                if (quoted._id) {
                                  document.getElementById(`msg-${quoted._id}`)?.scrollIntoView({
                                    block: 'center',
                                    behavior: 'smooth',
                                  });
                                }
                              }}
                            >
                              <strong>{displayName(quotedSender) || t.message}</strong>
                              <small>
                                {quoted.deletedForEveryone
                                  ? t.messageDeleted
                                  : quoted.text?.trim() ||
                                    (quoted.attachments?.[0]?.kind === 'image' ? t.photo : t.message)}
                              </small>
                            </button>
                          )}
                          {m.deleted ? (
                            <p className="pk-deleted">{t.messageDeleted}</p>
                          ) : (
                            <>
                          {attachments.length > 0 && (
                            <div className="pk-attach-list">
                              {attachments.map((a, ai) =>
                                a.kind === 'image' ? (
                                  <a
                                    key={`${m._id}-img-${ai}`}
                                    className="pk-attach-image"
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img src={a.url} alt={a.name || t.photo} />
                                  </a>
                                ) : (
                                  <a
                                    key={`${m._id}-${a.kind}-${ai}`}
                                    className={`pk-attach-link ${a.kind === 'file' ? 'is-file' : ''}`}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={a.kind === 'file' ? a.name || true : undefined}
                                  >
                                    <span aria-hidden>{a.kind === 'file' ? 'F' : '↗'}</span>
                                    <span>
                                      <strong>{a.name || (a.kind === 'file' ? t.file : t.link)}</strong>
                                      <small>{a.kind === 'file' ? t.openFile : a.url}</small>
                                    </span>
                                  </a>
                                )
                              )}
                            </div>
                          )}
                          {m.text?.trim() ? <p>{m.text}</p> : null}
                            </>
                          )}
                          <time>
                            {timeLabel(m.createdAt)}
                            {mine && !m.deleted ? <span className="pk-ticks" aria-hidden>✓✓</span> : null}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && !typingUsers.length && (
                  <p className="muted pk-empty">{t.noMessagesYet}</p>
                )}
                {typingUsers.length > 0 && (
                  <div className="pk-bubble theirs pk-typing" aria-live="polite">
                    <Avatar user={typingUsers[0] || active?.otherUser} size="sm" />
                    <div>
                      {active?.type === 'group' && (
                        <em className="pk-sender">
                          {typingUsers.map((u) => displayName(u)).join(', ')}
                        </em>
                      )}
                      <div className="pk-typing-dots" aria-label={t.typing}>
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pk-composer-wrap">
                {replyTo && (
                  <div className="pk-reply-bar">
                    <div>
                      <strong>{t.replyingTo} {isMine(replyTo) ? t.you : displayName(messageSender(replyTo))}</strong>
                      <small>{messagePreview(replyTo)}</small>
                    </div>
                    <button type="button" aria-label={t.cancel} onClick={() => setReplyTo(null)}>
                      ×
                    </button>
                  </div>
                )}
                {(pendingFiles.length > 0 || pendingAttachments.length > 0) && (
                  <ul className="pk-pending">
                    {pendingFiles.map((p) => (
                      <li key={p.id}>
                        {p.preview ? (
                          <img src={p.preview} alt="" />
                        ) : (
                          <span className="pk-pending-link">{p.file.name}</span>
                        )}
                        <button
                          type="button"
                          aria-label={t.removeAttachment}
                          onClick={() => removePendingFile(p.id)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                    {pendingAttachments.map((a, i) => (
                      <li key={`${a.kind}-${a.url}-${i}`}>
                        {a.kind === 'image' ? (
                          <img src={a.url} alt="" />
                        ) : (
                          <span className="pk-pending-link">{a.name || a.url}</span>
                        )}
                        <button
                          type="button"
                          aria-label={t.removeAttachment}
                          onClick={() =>
                            setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {linkOpen && (
                  <form className="pk-link-form" onSubmit={(e) => addPendingLink(e)}>
                    <label>
                      {t.linkUrl}
                      <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder={t.linkUrlPlaceholder}
                        autoFocus
                      />
                    </label>
                    <label>
                      {t.linkName}
                      <input
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        placeholder={t.linkNamePlaceholder}
                        maxLength={200}
                      />
                    </label>
                    <div className="pk-link-actions">
                      <button type="button" className="secondary compact" onClick={() => setLinkOpen(false)}>
                        {t.cancel}
                      </button>
                      <button type="submit" className="compact" disabled={!linkUrl.trim()}>
                        {t.addLink}
                      </button>
                    </div>
                  </form>
                )}

                <form className="pk-composer" onSubmit={(e) => void onSend(e)}>
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
                    multiple
                    hidden
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    className="pk-attach-btn"
                    title={t.attachFile}
                    aria-label={t.attachFile}
                    disabled={sending || uploading || attachFull}
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
                    className="pk-attach-btn"
                    title={t.attachPhoto}
                    aria-label={t.attachPhoto}
                    disabled={sending || uploading || attachFull}
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
                  <button
                    type="button"
                    className={`pk-attach-btn ${linkOpen ? 'is-active' : ''}`}
                    title={t.attachLink}
                    aria-label={t.attachLink}
                    disabled={sending || uploading || attachFull}
                    onClick={() => setLinkOpen((v) => !v)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                      <path
                        d="M10 13a5 5 0 0 0 7.1.1l1.8-1.8a5 5 0 0 0-7.1-7.1L10.5 5.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.1-.1L5.1 12.7a5 5 0 0 0 7.1 7.1L13.5 18.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    onBlur={() => void notifyTyping(false)}
                    placeholder={
                      uploading ? t.uploadingFile : attachCount ? t.attachHint : t.writeMessage
                    }
                    maxLength={2000}
                    disabled={uploading}
                  />
                  <button
                    type="submit"
                    disabled={
                      sending ||
                      uploading ||
                      (!draft.trim() && pendingFiles.length === 0 && pendingAttachments.length === 0)
                    }
                    aria-label={uploading ? t.uploadingFile : sending ? t.sending : t.send}
                    title={uploading ? t.uploadingFile : sending ? t.sending : t.send}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M3.4 20.29 21.02 12 3.4 3.71 3.41 10.1 15.2 12 3.41 13.9z"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {showDetails && active && (
          <aside className="pk-details">
            <button
              type="button"
              className="pk-details-back"
              aria-label={t.backToChats}
              onClick={() => setDetailsOpen(false)}
            >
              ‹
            </button>
            <button type="button" className="pk-details-close" aria-label="Close" onClick={() => setDetailsOpen(false)}>
              ×
            </button>
            <div className="pk-details-hero">
              <span className="avatar lg tone-sky">{(active.name || 'G').slice(0, 1).toUpperCase()}</span>
              <h2>{active.name || 'Group'}</h2>
              <p>
                {active.memberCount || active.participants?.length || 0} {t.members}
                {' · '}
                {(active.visibility || 'private') === 'public' ? t.privacyPublic : t.privacyPrivate}
              </p>
            </div>
            {active.description && (
              <div className="pk-details-block">
                <h3>{t.groupInfo}</h3>
                <p>{active.description}</p>
              </div>
            )}

            {user.id && isAdmin(active, user.id) && (
              <>
                <div className="pk-details-block">
                  <h3>{t.privacy}</h3>
                  <div className="pk-privacy-toggle">
                    <button
                      type="button"
                      className={(active.visibility || 'private') === 'private' ? 'is-active' : undefined}
                      onClick={() => void setVisibility('private')}
                    >
                      {t.privacyPrivate}
                    </button>
                    <button
                      type="button"
                      className={active.visibility === 'public' ? 'is-active' : undefined}
                      onClick={() => void setVisibility('public')}
                    >
                      {t.privacyPublic}
                    </button>
                  </div>
                  <p className="pk-hint">
                    {(active.visibility || 'private') === 'public'
                      ? t.privacyPublicHint
                      : t.privacyPrivateHint}
                  </p>
                </div>

                {(active.visibility || 'private') !== 'public' && (
                  <div className="pk-details-block">
                    <h3>{t.inviteLink}</h3>
                    <p className="pk-hint">{t.invitePrivateHint}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="pk-add-member"
                  onClick={() => {
                    setPickedMembers([]);
                    setAddOpen(true);
                  }}
                >
                  + {t.addMember}
                </button>
              </>
            )}

            {active.visibility === 'public' && (
              <div className="pk-details-block">
                <h3>{t.inviteLink}</h3>
                <p className="pk-hint">{t.privacyPublicHint}</p>
                <div className="pk-invite-row">
                  <input
                    readOnly
                    value={active.inviteCode ? inviteUrl(active.inviteCode) : '—'}
                  />
                  <button
                    type="button"
                    className="compact"
                    onClick={() => void copyInvite()}
                    disabled={!active.inviteCode}
                  >
                    {copied ? t.copied : t.copyInvite}
                  </button>
                </div>
                {user.id && isAdmin(active, user.id) && (
                  <button
                    type="button"
                    className="secondary compact pk-invite-refresh"
                    onClick={() => void refreshInvite()}
                  >
                    {t.refreshInvite}
                  </button>
                )}
              </div>
            )}

            <div className="pk-details-block">
              <h3>{t.members}</h3>
              <ul className="pk-member-list">
                {(active.participants || []).map((p) => {
                  const createdId =
                    typeof active.createdBy === 'string' ? active.createdBy : active.createdBy?._id;
                  return (
                    <li key={p._id}>
                      <Avatar user={p} size="sm" />
                      <span>
                        <strong>
                          {displayName(p)}
                          {p._id === user.id ? ` (${t.you})` : ''}
                        </strong>
                        {createdId === p._id && <em className="pk-admin">{t.creator}</em>}
                        {createdId !== p._id && isAdmin(active, p._id) && (
                          <em className="pk-admin">{t.admin}</em>
                        )}
                        <small>{p.email}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <button type="button" className="pk-leave" onClick={() => void onLeaveGroup()}>
              {t.leaveGroup}
            </button>
          </aside>
        )}
      </div>

      {createOpen && (
        <div className="pk-modal-backdrop" role="presentation" onClick={() => setCreateOpen(false)}>
          <form
            className="pk-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void onCreateGroup(e)}
          >
            <h2>{t.createGroup}</h2>
            <label>
              {t.groupName}
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} required maxLength={80} />
            </label>
            <label>
              {t.groupDesc}
              <textarea value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} rows={2} maxLength={500} />
            </label>
            <p className="pk-section-label">{t.privacy}</p>
            <div className="pk-privacy-toggle">
              <button
                type="button"
                className={groupVisibility === 'private' ? 'is-active' : undefined}
                onClick={() => setGroupVisibility('private')}
              >
                {t.privacyPrivate}
              </button>
              <button
                type="button"
                className={groupVisibility === 'public' ? 'is-active' : undefined}
                onClick={() => setGroupVisibility('public')}
              >
                {t.privacyPublic}
              </button>
            </div>
            <p className="pk-hint">
              {groupVisibility === 'public' ? t.privacyPublicHint : t.privacyPrivateHint}
            </p>
            <p className="pk-section-label">{t.pickMembers}</p>
            {!friends.length && <p className="muted">{t.noFriends}</p>}
            <ul className="pk-pick-list">
              {friends.map((f) => {
                const checked = pickedMembers.includes(f.user._id);
                return (
                  <li key={f.friendshipId}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setPickedMembers((prev) =>
                            checked ? prev.filter((id) => id !== f.user._id) : [...prev, f.user._id]
                          )
                        }
                      />
                      <Avatar user={f.user} size="sm" />
                      <span>{displayName(f.user)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="pk-modal-actions">
              <button type="button" className="secondary" onClick={() => setCreateOpen(false)}>
                {t.cancel}
              </button>
              <button type="submit" disabled={creating || !groupName.trim()}>
                {creating ? t.creating : t.create}
              </button>
            </div>
          </form>
        </div>
      )}

      {addOpen && active && (
        <div className="pk-modal-backdrop" role="presentation" onClick={() => setAddOpen(false)}>
          <form
            className="pk-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void onAddMembers(e)}
          >
            <h2>{t.addMembersTitle}</h2>
            {(() => {
              const memberIds = new Set((active.participants || []).map((p) => p._id));
              const candidates = friends.filter((f) => !memberIds.has(f.user._id));
              if (!candidates.length) return <p className="muted">{t.noFriendsToAdd}</p>;
              return (
                <ul className="pk-pick-list">
                  {candidates.map((f) => {
                    const checked = pickedMembers.includes(f.user._id);
                    return (
                      <li key={f.friendshipId}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setPickedMembers((prev) =>
                                checked ? prev.filter((id) => id !== f.user._id) : [...prev, f.user._id]
                              )
                            }
                          />
                          <Avatar user={f.user} size="sm" />
                          <span>{displayName(f.user)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
            <div className="pk-modal-actions">
              <button type="button" className="secondary" onClick={() => setAddOpen(false)}>
                {t.cancel}
              </button>
              <button type="submit" disabled={adding || !pickedMembers.length}>
                {adding ? t.addingMembers : t.addMember}
              </button>
            </div>
          </form>
        </div>
      )}

      {msgMenu && (
        <div
          ref={msgMenuRef}
          className="pk-msg-menu"
          style={{ left: msgMenu.x, top: msgMenu.y }}
          role="menu"
        >
          <button type="button" role="menuitem" onClick={() => startReply(msgMenu.msg)}>
            {t.reply}
          </button>
          <button type="button" role="menuitem" onClick={() => startForward(msgMenu.msg)}>
            {t.forward}
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger-item"
            onClick={() => askDelete(msgMenu.msg)}
          >
            {t.deleteMessage}
          </button>
        </div>
      )}

      {deleteTarget && (
        <div className="pk-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="pk-modal pk-del-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>{t.deleteMessageTitle}</h2>
            <p>{isMine(deleteTarget) ? t.deleteMessageLead : t.deleteForMeLead}</p>
            <div className="pk-del-actions">
              <button
                type="button"
                className="pk-del-me"
                disabled={deleting}
                onClick={() => void confirmDelete(false)}
              >
                {t.deleteForMe}
              </button>
              {isMine(deleteTarget) && (
                <button
                  type="button"
                  className="pk-del-both"
                  disabled={deleting}
                  onClick={() => void confirmDelete(true)}
                >
                  {t.deleteForBoth}
                </button>
              )}
              <button
                type="button"
                className="secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {forwardMsg && (
        <div className="pk-modal-backdrop" onClick={() => setForwardMsg(null)}>
          <form
            className="pk-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void confirmForward();
            }}
          >
            <h2>{t.forwardTo}</h2>
            <ul className="pk-pick-list">
              {conversations
                .filter((c) => c._id !== activeId)
                .map((c) => {
                  const checked = forwardPick.includes(c._id);
                  return (
                    <li key={c._id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForwardPick((prev) =>
                              checked ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                            )
                          }
                        />
                        <Avatar user={c.otherUser} size="sm" />
                        <span>{convoTitle(c)}</span>
                      </label>
                    </li>
                  );
                })}
            </ul>
            {conversations.filter((c) => c._id !== activeId).length === 0 && (
              <p className="muted">{t.noChats}</p>
            )}
            <div className="pk-modal-actions">
              <button type="button" className="secondary" onClick={() => setForwardMsg(null)}>
                {t.cancel}
              </button>
              <button type="submit" disabled={forwarding || forwardPick.length === 0}>
                {forwarding ? t.sending : t.forward}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
