import { Notification, NOTIFICATION_TYPES } from '../models/Notification.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

type NotifType = (typeof NOTIFICATION_TYPES)[number];

export async function createNotification(input: {
  userId: string;
  type: NotifType;
  title: string;
  body?: string;
  link?: string;
  fromUserId?: string;
  meta?: Record<string, unknown>;
}) {
  return Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body || '',
    link: input.link || '',
    fromUserId: input.fromUserId,
    meta: input.meta || {},
    read: false,
  });
}

/** Notify admins only (e.g. community post reports). */
export async function notifyAdmins(input: {
  type: NotifType;
  title: string;
  body?: string;
  link?: string;
  fromUserId?: string;
  meta?: Record<string, unknown>;
}) {
  const admins = await User.find({
    role: 'admin',
    isActive: { $ne: false },
  })
    .select('_id')
    .lean();
  await Promise.all(
    admins.map((u) =>
      createNotification({
        userId: String(u._id),
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        fromUserId: input.fromUserId,
        meta: input.meta,
      })
    )
  );
  return { notified: admins.length };
}

/** Notify all admins and experts (e.g. reapproval / appeal requests). */
export async function notifyStaff(input: {
  type: NotifType;
  title: string;
  body?: string;
  link?: string;
  fromUserId?: string;
  meta?: Record<string, unknown>;
}) {
  const staff = await User.find({
    role: { $in: ['admin', 'expert'] },
    isActive: { $ne: false },
  })
    .select('_id')
    .lean();
  await Promise.all(
    staff.map((u) =>
      createNotification({
        userId: String(u._id),
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        fromUserId: input.fromUserId,
        meta: input.meta,
      })
    )
  );
  return { notified: staff.length };
}

export async function appealNotification(
  notificationId: string,
  userId: string,
  message: string
) {
  const note = message.trim();
  if (note.length < 3) throw new AppError('Please write a short message', 400);

  const doc = await Notification.findOne({ _id: notificationId, userId });
  if (!doc) throw new AppError('Notification not found', 404);

  const appealable = ['post_removed', 'post_hidden', 'diagnosis_rejected'];
  if (!appealable.includes(doc.type)) {
    throw new AppError('This notice cannot be appealed', 400);
  }

  const meta = (doc.meta || {}) as Record<string, unknown>;
  if (meta.appealed) {
    throw new AppError('You already asked for a review on this notice', 400);
  }

  await notifyStaff({
    type: 'reapproval_requested',
    title: doc.type.startsWith('diagnosis')
      ? 'Detection reapproval requested'
      : 'Post moderation review requested',
    body: note,
    link: doc.type.startsWith('diagnosis') ? '/admin/diagnoses' : '/admin/moderation',
    fromUserId: userId,
    meta: {
      sourceNotificationId: String(doc._id),
      sourceType: doc.type,
      originalBody: doc.body,
      reason: meta.reason || '',
      diagnosisId: meta.diagnosisId,
      postId: meta.postId,
      appealMessage: note,
    },
  });

  doc.meta = { ...meta, appealed: true, appealMessage: note, appealedAt: new Date().toISOString() };
  doc.markModified('meta');
  await doc.save();
  return doc;
}

export async function listNotifications(userId: string, limit = 40) {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .populate('fromUserId', 'fullName email avatarUrl avatarTone')
    .lean();
}

export async function unreadCount(userId: string) {
  return Notification.countDocuments({ userId, read: false });
}

export async function markRead(notificationId: string, userId: string) {
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  );
  if (!doc) throw new AppError('Notification not found', 404);
  return doc;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  return { ok: true };
}

/** Staff reply to a farmer reapproval / moderation appeal (from admin panel). */
export async function replyToAppeal(
  notificationId: string,
  staff: { id: string; role: string },
  message: string
) {
  if (staff.role !== 'admin' && staff.role !== 'expert') {
    throw new AppError('Forbidden', 403);
  }
  const note = message.trim();
  if (note.length < 3) throw new AppError('Please write a short reply', 400);

  const doc = await Notification.findOne({ _id: notificationId, userId: staff.id });
  if (!doc) throw new AppError('Notification not found', 404);
  if (doc.type !== 'reapproval_requested' && doc.type !== 'diagnosis_review_requested') {
    throw new AppError('Only review / appeal notices can be replied to here', 400);
  }

  const meta = (doc.meta || {}) as Record<string, unknown>;
  if (meta.staffReplied) {
    throw new AppError('You already replied to this request', 400);
  }

  const farmerId = doc.fromUserId ? String(doc.fromUserId) : '';
  if (!farmerId) throw new AppError('No farmer linked to this request', 400);

  const sourceType = String(meta.sourceType || '');
  const isDiagnosis = sourceType.startsWith('diagnosis') || Boolean(meta.diagnosisId);

  await createNotification({
    userId: farmerId,
    type: 'system',
    title: isDiagnosis ? 'Reply about your detection' : 'Reply about your post review',
    body: note,
    link: '/messages?tab=notices',
    fromUserId: staff.id,
    meta: {
      replyToNotificationId: String(doc._id),
      diagnosisId: meta.diagnosisId,
      postId: meta.postId,
      appealMessage: meta.appealMessage,
      reason: meta.reason,
      staffReply: true,
    },
  });

  doc.read = true;
  doc.meta = {
    ...meta,
    staffReplied: true,
    staffReplyMessage: note,
    staffRepliedAt: new Date().toISOString(),
    staffRepliedBy: staff.id,
  };
  doc.markModified('meta');
  await doc.save();
  return doc;
}
