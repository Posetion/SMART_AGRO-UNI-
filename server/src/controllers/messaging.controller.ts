import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as messaging from '../services/messaging.service.js';
import * as notifications from '../services/notification.service.js';
import * as friends from '../services/friend.service.js';

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.searchUsers(String(req.query.q || ''), req.user!.id);
  res.json({ success: true, data });
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const type = String(req.query.type || 'all');
  const filter =
    type === 'direct' || type === 'group' ? (type as 'direct' | 'group') : 'all';
  const data = await messaging.listConversations(req.user!.id, filter);
  res.json({ success: true, data });
});

export const openConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.getOrCreateConversation(req.user!.id, String(req.body.userId));
  res.status(201).json({ success: true, data });
});

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.createGroup(req.user!.id, {
    name: String(req.body.name || ''),
    description: req.body.description ? String(req.body.description) : undefined,
    memberIds: Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [],
    visibility: req.body.visibility === 'public' ? 'public' : 'private',
  });
  res.status(201).json({ success: true, data });
});

export const updateGroupSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.updateGroupSettings(req.params.id, req.user!.id, {
    visibility: req.body.visibility === 'public' ? 'public' : req.body.visibility === 'private' ? 'private' : undefined,
  });
  res.json({ success: true, data });
});

export const regenerateInvite = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.regenerateInvite(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const previewInvite = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.previewInvite(String(req.params.code || ''));
  res.json({ success: true, data });
});

export const joinInvite = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.joinViaInvite(String(req.params.code || ''), req.user!.id);
  res.json({ success: true, data });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.getConversation(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const addGroupMembers = asyncHandler(async (req: Request, res: Response) => {
  const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [];
  const data = await messaging.addGroupMembers(req.params.id, req.user!.id, memberIds);
  res.json({ success: true, data });
});

export const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.leaveGroup(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const hideConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.hideConversation(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const muteConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.setMuted(req.params.id, req.user!.id, Boolean(req.body.muted));
  res.json({ success: true, data });
});

export const clearMessages = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.clearConversationMessages(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.listMessages(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
  const data = await messaging.sendMessage(
    req.params.id,
    req.user!.id,
    String(req.body.text || ''),
    attachments,
    {
      replyTo: req.body.replyTo ? String(req.body.replyTo) : undefined,
      forwardedFrom: req.body.forwardedFrom,
    }
  );
  res.status(201).json({ success: true, data });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const everyone =
    Boolean(req.body?.forEveryone) ||
    req.query.everyone === '1' ||
    req.query.everyone === 'true';
  const data = await messaging.deleteMessage(
    req.params.id,
    req.params.messageId,
    req.user!.id,
    everyone
  );
  res.json({ success: true, data });
});

export const forwardMessage = asyncHandler(async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body.conversationIds) ? req.body.conversationIds : [];
  const data = await messaging.forwardMessage(String(req.body.messageId), ids, req.user!.id);
  res.status(201).json({ success: true, data });
});

export const uploadMessageImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Please choose a photo', 400);
  const data = await messaging.uploadConversationImage(req.params.id, req.user!.id, req.file);
  res.status(201).json({ success: true, data });
});

export const uploadMessageFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Please choose a file to attach', 400);
  const data = await messaging.uploadConversationFile(req.params.id, req.user!.id, req.file);
  res.status(201).json({ success: true, data });
});

export const updateTyping = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.updateTyping(req.params.id, req.user!.id, Boolean(req.body.typing));
  res.json({ success: true, data });
});

export const getTyping = asyncHandler(async (req: Request, res: Response) => {
  const data = await messaging.getTyping(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.sendFriendRequest(req.user!.id, String(req.body.userId));
  res.status(201).json({ success: true, data });
});

export const respondFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  const raw = String(req.body.action);
  const action = raw === 'decline' || raw === 'cancel' ? raw : 'accept';
  const data = await friends.respondFriendRequest(req.params.id, req.user!.id, action);
  res.json({ success: true, data });
});

export const cancelFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.cancelOutgoingRequest(req.user!.id, String(req.body.userId));
  res.json({ success: true, data });
});

export const denyFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.denyIncomingRequest(req.user!.id, String(req.body.userId));
  res.json({ success: true, data });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.blockUser(req.user!.id, String(req.body.userId));
  res.status(201).json({ success: true, data });
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.unblockUser(req.user!.id, String(req.params.userId));
  res.json({ success: true, data });
});

export const listBlocked = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.listBlocked(req.user!.id);
  res.json({ success: true, data });
});

export const listFriends = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.listFriends(req.user!.id);
  res.json({ success: true, data });
});

export const listFriendRequests = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.listFriendRequests(req.user!.id);
  res.json({ success: true, data });
});

export const friendshipStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await friends.friendshipStatus(req.user!.id, String(req.query.userId || ''));
  res.json({ success: true, data });
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifications.listNotifications(req.user!.id);
  res.json({ success: true, data });
});

export const unreadNotifications = asyncHandler(async (req: Request, res: Response) => {
  const count = await notifications.unreadCount(req.user!.id);
  res.json({ success: true, data: { count } });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifications.markRead(req.params.id, req.user!.id);
  res.json({ success: true, data });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifications.markAllRead(req.user!.id);
  res.json({ success: true, data });
});

export const appealNotification = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifications.appealNotification(
    req.params.id,
    req.user!.id,
    String(req.body.message || '')
  );
  res.json({ success: true, data });
});

export const replyToAppeal = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifications.replyToAppeal(
    req.params.id,
    req.user!,
    String(req.body.message || '')
  );
  res.json({ success: true, data });
});
