import mongoose from 'mongoose';
import crypto from 'crypto';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from './notification.service.js';
import { areFriends } from './friend.service.js';
import { clearTyping, listTypingUserIds, setTyping } from './typing.service.js';

const USER_PUBLIC = 'fullName email avatarUrl avatarTone role';

function pairKey(a: string, b: string) {
  return [a, b].sort().join(':');
}

function makeInviteCode() {
  return crypto.randomBytes(6).toString('hex');
}

async function uniqueInviteCode() {
  for (let i = 0; i < 8; i++) {
    const code = makeInviteCode();
    const exists = await Conversation.exists({ inviteCode: code });
    if (!exists) return code;
  }
  return crypto.randomBytes(10).toString('hex');
}

function isGroupAdmin(convo: { adminIds?: unknown[]; createdBy?: unknown }, userId: string) {
  if (String(convo.createdBy || '') === userId) return true;
  return (convo.adminIds || []).some((id) => String(id) === userId);
}

export async function searchUsers(q: string, selfId: string) {
  const term = q.trim();
  if (!term) return [];
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({
    _id: { $ne: selfId },
    isActive: true,
    isGuest: { $ne: true },
    role: { $in: ['farmer', 'expert', 'admin'] },
    $or: [{ fullName: regex }, { email: regex }],
  })
    .select(USER_PUBLIC)
    .limit(20)
    .lean();

  return Promise.all(
    users.map(async (u) => ({
      ...u,
      isFriend: await areFriends(selfId, String(u._id)),
    }))
  );
}

function shapeConversation(c: Record<string, unknown>, userId: string, unread: number) {
  const type = (c.type as string) || 'direct';
  const participants = (c.participants || []) as Array<{ _id: mongoose.Types.ObjectId }>;
  const other = participants.find((p) => String(p._id) !== userId) || null;
  const mutedFor = (c.mutedFor || []) as Array<{ toString(): string } | string>;
  return {
    ...c,
    type,
    otherUser: type === 'direct' ? other : null,
    memberCount: participants.length,
    unread,
    muted: mutedFor.some((id) => String(id) === userId),
  };
}

export async function listConversations(userId: string, typeFilter?: 'direct' | 'group' | 'all') {
  const filter: Record<string, unknown> = { participants: userId, hiddenFor: { $ne: userId } };
  if (typeFilter === 'direct' || typeFilter === 'group') filter.type = typeFilter;

  const list = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();

  return Promise.all(
    list.map(async (c) => {
      const unread = await Message.countDocuments({
        conversationId: c._id,
        senderId: { $ne: userId },
        readBy: { $nin: [userId] },
      });
      return shapeConversation(c as Record<string, unknown>, userId, unread);
    })
  );
}

export async function getOrCreateConversation(selfId: string, otherUserId: string) {
  if (selfId === otherUserId) throw new AppError('Cannot message yourself', 400);
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) throw new AppError('User not found', 404);

  const other = await User.findOne({
    _id: otherUserId,
    isActive: true,
    isGuest: { $ne: true },
  }).select(USER_PUBLIC);
  if (!other) throw new AppError('User not found', 404);

  let convo = await Conversation.findOne({
    type: 'direct',
    participants: { $all: [selfId, otherUserId], $size: 2 },
  }).populate('participants', USER_PUBLIC);

  if (!convo) {
    // Also match older direct chats that may lack type field
    convo = await Conversation.findOne({
      $or: [{ type: 'direct' }, { type: { $exists: false } }],
      participants: { $all: [selfId, otherUserId], $size: 2 },
    }).populate('participants', USER_PUBLIC);
  }

  if (!convo) {
    convo = await Conversation.create({
      type: 'direct',
      participants: [selfId, otherUserId],
      adminIds: [],
      createdBy: selfId,
      lastMessageAt: new Date(),
      lastMessagePreview: '',
    });
    convo = await Conversation.findById(convo._id).populate('participants', USER_PUBLIC);
  } else {
    await Conversation.updateOne({ _id: convo._id }, { $pull: { hiddenFor: selfId } });
  }

  const otherUser = (convo!.participants as Array<{ _id: mongoose.Types.ObjectId }>).find(
    (p) => String(p._id) !== selfId
  );

  return {
    ...convo!.toObject(),
    type: 'direct',
    otherUser: otherUser || other,
    pair: pairKey(selfId, otherUserId),
  };
}

export async function createGroup(
  creatorId: string,
  input: {
    name: string;
    description?: string;
    memberIds: string[];
    visibility?: 'private' | 'public';
  }
) {
  const name = input.name.trim();
  if (!name) throw new AppError('Group name is required', 400);

  const visibility = input.visibility === 'public' ? 'public' : 'private';
  const uniqueMembers = [...new Set(input.memberIds.map(String).filter((id) => id !== creatorId))];

  if (uniqueMembers.length) {
    const users = await User.find({
      _id: { $in: uniqueMembers },
      isActive: true,
      isGuest: { $ne: true },
    }).select('_id');
    if (users.length !== uniqueMembers.length) throw new AppError('One or more members not found', 400);
  }

  const participants = [creatorId, ...uniqueMembers];
  const inviteCode = await uniqueInviteCode();
  const convo = await Conversation.create({
    type: 'group',
    name,
    description: (input.description || '').trim(),
    visibility,
    inviteCode,
    participants,
    adminIds: [creatorId],
    createdBy: creatorId,
    lastMessageAt: new Date(),
    lastMessagePreview: 'Group created',
  });

  const creator = await User.findById(creatorId).select('fullName email');
  const creatorName = creator?.fullName?.trim() || creator?.email?.split('@')[0] || 'Someone';

  await Promise.all(
    uniqueMembers.map((id) =>
      createNotification({
        userId: id,
        type: 'system',
        title: `${creatorName} added you to “${name}”`,
        body: 'Open Messages to join the group chat.',
        link: `/messages?c=${convo._id}&tab=group`,
        fromUserId: creatorId,
        meta: { conversationId: String(convo._id) },
      })
    )
  );

  return Conversation.findById(convo._id)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();
}

export async function addGroupMembers(conversationId: string, actorId: string, memberIds: string[]) {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new AppError('Group not found', 404);
  if (!isGroupAdmin(convo, actorId)) {
    throw new AppError('Only group admins can add members', 403);
  }

  const toAdd = [...new Set(memberIds.map(String))].filter(
    (id) => !convo.participants.some((p) => String(p) === id)
  );
  if (!toAdd.length) {
    return Conversation.findById(convo._id)
      .populate('participants', USER_PUBLIC)
      .populate('adminIds', USER_PUBLIC)
      .populate('createdBy', USER_PUBLIC)
      .lean();
  }

  const users = await User.find({ _id: { $in: toAdd }, isActive: true, isGuest: { $ne: true } });
  if (users.length !== toAdd.length) throw new AppError('One or more members not found', 400);

  convo.participants.push(...toAdd.map((id) => new mongoose.Types.ObjectId(id)));
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = 'New members added';
  await convo.save();

  const actor = await User.findById(actorId).select('fullName email');
  const actorName = actor?.fullName?.trim() || actor?.email?.split('@')[0] || 'Someone';
  await Promise.all(
    toAdd.map((id) =>
      createNotification({
        userId: id,
        type: 'system',
        title: `${actorName} added you to “${convo.name || 'a group'}”`,
        body: 'Open Messages to chat with the group.',
        link: `/messages?c=${convo._id}&tab=group`,
        fromUserId: actorId,
        meta: { conversationId: String(convo._id) },
      })
    )
  );

  return Conversation.findById(convo._id)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();
}

export async function updateGroupSettings(
  conversationId: string,
  actorId: string,
  input: { visibility?: 'private' | 'public' }
) {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new AppError('Group not found', 404);
  if (!isGroupAdmin(convo, actorId)) {
    throw new AppError('Only group admins can change settings', 403);
  }

  if (input.visibility === 'public' || input.visibility === 'private') {
    convo.visibility = input.visibility;
  }
  if (!convo.inviteCode) {
    convo.inviteCode = await uniqueInviteCode();
  }
  await convo.save();

  return Conversation.findById(convo._id)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();
}

export async function regenerateInvite(conversationId: string, actorId: string) {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new AppError('Group not found', 404);
  if (!isGroupAdmin(convo, actorId)) {
    throw new AppError('Only group admins can refresh the invite link', 403);
  }
  convo.inviteCode = await uniqueInviteCode();
  await convo.save();
  return Conversation.findById(convo._id)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();
}

export async function previewInvite(code: string) {
  const inviteCode = code.trim();
  if (!inviteCode) throw new AppError('Invite not found', 404);
  const convo = await Conversation.findOne({ type: 'group', inviteCode })
    .populate('createdBy', USER_PUBLIC)
    .select('name description visibility inviteCode participants createdBy')
    .lean();
  if (!convo) throw new AppError('Invite not found', 404);
  return {
    name: convo.name,
    description: convo.description,
    visibility: convo.visibility || 'private',
    inviteCode: convo.inviteCode,
    memberCount: (convo.participants || []).length,
    createdBy: convo.createdBy,
  };
}

export async function joinViaInvite(code: string, userId: string) {
  const inviteCode = code.trim();
  if (!inviteCode) throw new AppError('Invite not found', 404);

  const convo = await Conversation.findOne({ type: 'group', inviteCode });
  if (!convo) throw new AppError('Invite not found', 404);

  const already = convo.participants.some((id) => String(id) === userId);
  if (already) {
    return Conversation.findById(convo._id)
      .populate('participants', USER_PUBLIC)
      .populate('adminIds', USER_PUBLIC)
      .populate('createdBy', USER_PUBLIC)
      .lean();
  }

  // Invite link join is for public groups. Private groups use admin "Add members" only.
  if ((convo.visibility || 'private') === 'private') {
    throw new AppError('This group is private. Ask an admin to add you.', 403);
  }

  const user = await User.findOne({ _id: userId, isActive: true, isGuest: { $ne: true } });
  if (!user) throw new AppError('User not found', 404);

  convo.participants.push(new mongoose.Types.ObjectId(userId));
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = 'Someone joined via invite';
  await convo.save();

  return Conversation.findById(convo._id)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC)
    .lean();
}

export async function leaveGroup(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new AppError('Group not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not a member', 403);
  }

  convo.participants = convo.participants.filter((id) => String(id) !== userId) as typeof convo.participants;
  convo.adminIds = convo.adminIds.filter((id) => String(id) !== userId) as typeof convo.adminIds;

  if (!convo.participants.length) {
    await Message.deleteMany({ conversationId });
    await convo.deleteOne();
    return { left: true, deleted: true };
  }

  if (!convo.adminIds.length && convo.participants[0]) {
    convo.adminIds = [convo.participants[0]];
  }
  await convo.save();
  return { left: true, deleted: false };
}

export async function hideConversation(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not allowed', 403);
  }
  if (convo.type === 'group') {
    return leaveGroup(conversationId, userId);
  }
  await Conversation.updateOne({ _id: convo._id }, { $addToSet: { hiddenFor: userId } });
  return { hidden: true };
}

export async function setMuted(conversationId: string, userId: string, muted: boolean) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not allowed', 403);
  }
  await Conversation.updateOne(
    { _id: convo._id },
    muted ? { $addToSet: { mutedFor: userId } } : { $pull: { mutedFor: userId } }
  );
  return { muted };
}

export async function clearConversationMessages(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);
  await Message.deleteMany({ conversationId });
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessagePreview: '', lastMessageAt: new Date() } }
  );
  return { cleared: true };
}

export async function listMessages(conversationId: string, userId: string, limit = 80) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not allowed', 403);
  }

  const messages = await Message.find({
    conversationId,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 200))
    .populate('senderId', USER_PUBLIC)
    .populate({
      path: 'replyTo',
      select: 'text senderId attachments deletedForEveryone',
      populate: { path: 'senderId', select: USER_PUBLIC },
    })
    .lean();

  await Message.updateMany(
    { conversationId, senderId: { $ne: userId }, readBy: { $nin: [userId] } },
    { $addToSet: { readBy: userId } }
  );

  return messages.reverse().map((m) => {
    if (!m.deletedForEveryone) return m;
    return {
      ...m,
      text: '',
      attachments: [],
      deleted: true,
    };
  });
}

export type MessageAttachmentInput = {
  kind: 'image' | 'link' | 'file';
  url: string;
  name?: string;
};

function previewFromMessage(text: string, attachments: MessageAttachmentInput[]) {
  if (text) return text.slice(0, 140);
  const first = attachments[0];
  if (!first) return '';
  if (first.kind === 'image') return 'Photo';
  if (first.kind === 'file') return first.name?.trim() || 'File';
  return first.name?.trim() || 'Link';
}

export async function assertConversationMember(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not allowed', 403);
  }
  return convo;
}

export async function uploadConversationImage(
  conversationId: string,
  userId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string }
) {
  await assertConversationMember(conversationId, userId);
  const { uploadBuffer } = await import('./storage.service.js');
  const safeName = file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  const url = await uploadBuffer(file.buffer, safeName || 'photo.jpg', file.mimetype);
  return { url, name: safeName || 'photo.jpg', kind: 'image' as const };
}

export async function uploadConversationFile(
  conversationId: string,
  userId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string }
) {
  await assertConversationMember(conversationId, userId);
  const { uploadBuffer } = await import('./storage.service.js');
  const safeName = file.originalname.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120);
  const isImage = file.mimetype.startsWith('image/');
  const url = await uploadBuffer(
    file.buffer,
    safeName || (isImage ? 'photo.jpg' : 'file.bin'),
    file.mimetype
  );
  return {
    url,
    name: safeName || (isImage ? 'photo.jpg' : 'file'),
    kind: (isImage ? 'image' : 'file') as 'image' | 'file',
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  attachments: MessageAttachmentInput[] = [],
  extras: { replyTo?: string; forwardedFrom?: { senderName?: string } } = {}
) {
  const body = text.trim();
  const cleanAttachments = attachments
    .map((a) => ({
      kind: a.kind,
      url: String(a.url || '').trim(),
      name: String(a.name || '').trim().slice(0, 200),
    }))
    .filter((a) => a.url && (a.kind === 'image' || a.kind === 'link' || a.kind === 'file'))
    .slice(0, 5);

  if (!body && cleanAttachments.length === 0) {
    throw new AppError('Message cannot be empty', 400);
  }

  const convo = await assertConversationMember(conversationId, senderId);

  let replyTo: string | undefined;
  if (extras.replyTo) {
    const quoted = await Message.findById(extras.replyTo).select('conversationId deletedForEveryone');
    if (
      quoted &&
      String(quoted.conversationId) === conversationId &&
      !quoted.deletedForEveryone
    ) {
      replyTo = String(quoted._id);
    }
  }

  const forwardedName = extras.forwardedFrom?.senderName?.trim().slice(0, 80);

  const msg = await Message.create({
    conversationId,
    senderId,
    text: body,
    attachments: cleanAttachments,
    replyTo,
    forwardedFrom: forwardedName ? { senderName: forwardedName } : undefined,
    readBy: [senderId],
  });

  clearTyping(conversationId, senderId);

  const preview = previewFromMessage(body, cleanAttachments);
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = preview.slice(0, 140);
  await convo.save();

  const sender = await User.findById(senderId).select('fullName email');
  const senderName = sender?.fullName?.trim() || sender?.email?.split('@')[0] || 'Someone';
  const recipients = convo.participants.filter((id) => String(id) !== senderId);
  const title =
    convo.type === 'group'
      ? `${senderName} in ${convo.name || 'group'}`
      : `${senderName} sent you a message`;

  await Promise.all(
    recipients.map((id) =>
      createNotification({
        userId: String(id),
        type: 'new_message',
        title,
        body: preview.slice(0, 120),
        link: `/messages?c=${conversationId}${convo.type === 'group' ? '&tab=group' : ''}`,
        fromUserId: senderId,
        meta: { conversationId },
      })
    )
  );

  return Message.findById(msg._id)
    .populate('senderId', USER_PUBLIC)
    .populate({
      path: 'replyTo',
      select: 'text senderId attachments deletedForEveryone',
      populate: { path: 'senderId', select: USER_PUBLIC },
    })
    .lean();
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
  userId: string,
  forEveryone = false
) {
  await assertConversationMember(conversationId, userId);
  const msg = await Message.findOne({ _id: messageId, conversationId });
  if (!msg) throw new AppError('Message not found', 404);

  if (forEveryone) {
    if (String(msg.senderId) !== userId) {
      throw new AppError('Only the sender can delete this for everyone', 403);
    }
    msg.deletedForEveryone = true;
    msg.text = '';
    msg.set('attachments', []);
    await msg.save();
    return { deleted: true, forEveryone: true, _id: String(msg._id) };
  }

  await Message.updateOne({ _id: msg._id }, { $addToSet: { deletedFor: userId } });
  return { deleted: true, forEveryone: false, _id: String(msg._id) };
}

export async function forwardMessage(
  messageId: string,
  conversationIds: string[],
  userId: string
) {
  const src = await Message.findById(messageId).populate('senderId', USER_PUBLIC);
  if (!src || src.deletedForEveryone) throw new AppError('Message not found', 404);
  await assertConversationMember(String(src.conversationId), userId);

  const sender =
    src.senderId && typeof src.senderId === 'object' && 'fullName' in src.senderId
      ? (src.senderId as { fullName?: string; email?: string })
      : null;
  const senderName = sender?.fullName?.trim() || sender?.email?.split('@')[0] || 'Farmer';

  const unique = [...new Set(conversationIds.map(String))].slice(0, 20);
  const sent = [];
  for (const destId of unique) {
    const copy = await sendMessage(
      destId,
      userId,
      src.text || '',
      (src.attachments || []) as MessageAttachmentInput[],
      { forwardedFrom: { senderName } }
    );
    sent.push(copy);
  }
  return { count: sent.length };
}

export async function getConversation(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId)
    .populate('participants', USER_PUBLIC)
    .populate('adminIds', USER_PUBLIC)
    .populate('createdBy', USER_PUBLIC);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((p) => String((p as { _id: unknown })._id || p) === userId)) {
    throw new AppError('Not allowed', 403);
  }

  // Ensure public groups always have a shareable invite code for members
  if (convo.type === 'group' && convo.visibility === 'public' && !convo.inviteCode) {
    convo.inviteCode = await uniqueInviteCode();
    await convo.save();
  }

  return shapeConversation(convo.toObject() as Record<string, unknown>, userId, 0);
}

async function assertMember(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId).select('participants');
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((id) => String(id) === userId)) {
    throw new AppError('Not allowed', 403);
  }
  return convo;
}

export async function updateTyping(conversationId: string, userId: string, typing: boolean) {
  await assertMember(conversationId, userId);
  setTyping(conversationId, userId, typing);
  return { typing };
}

export async function getTyping(conversationId: string, userId: string) {
  await assertMember(conversationId, userId);
  const userIds = listTypingUserIds(conversationId, userId);
  if (!userIds.length) return { typing: [] as Array<{ _id: string; fullName?: string; email?: string; avatarUrl?: string; avatarTone?: string }> };

  const users = await User.find({ _id: { $in: userIds } }).select(USER_PUBLIC).lean();
  return { typing: users };
}
