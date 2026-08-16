const TYPING_TTL_MS = 3500;

/** conversationId -> userId -> expiresAt */
const typingStore = new Map<string, Map<string, number>>();

function prune(conversationId: string) {
  const row = typingStore.get(conversationId);
  if (!row) return;
  const now = Date.now();
  for (const [uid, expires] of row) {
    if (expires <= now) row.delete(uid);
  }
  if (!row.size) typingStore.delete(conversationId);
}

export function setTyping(conversationId: string, userId: string, typing: boolean) {
  if (!typing) {
    const row = typingStore.get(conversationId);
    row?.delete(userId);
    if (row && !row.size) typingStore.delete(conversationId);
    return;
  }
  let row = typingStore.get(conversationId);
  if (!row) {
    row = new Map();
    typingStore.set(conversationId, row);
  }
  row.set(userId, Date.now() + TYPING_TTL_MS);
}

export function listTypingUserIds(conversationId: string, excludeUserId?: string) {
  prune(conversationId);
  const row = typingStore.get(conversationId);
  if (!row) return [] as string[];
  return [...row.keys()].filter((id) => id !== excludeUserId);
}

export function clearTyping(conversationId: string, userId: string) {
  setTyping(conversationId, userId, false);
}
