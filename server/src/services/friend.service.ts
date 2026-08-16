import { Friendship } from '../models/Friendship.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from './notification.service.js';

const USER_PUBLIC = 'fullName email avatarUrl avatarTone role';

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) throw new AppError('Cannot friend yourself', 400);
  const other = await User.findById(toUserId);
  if (!other || !other.isActive || other.isGuest) throw new AppError('User not found', 404);

  const existing = await Friendship.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });

  if (existing) {
    if (existing.status === 'accepted') throw new AppError('Already friends', 400);
    if (existing.status === 'pending') {
      if (String(existing.fromUserId) === fromUserId) throw new AppError('Request already sent', 400);
      // They already sent us a request — accept it
      existing.status = 'accepted';
      await existing.save();
      await createNotification({
        userId: toUserId,
        type: 'friend_accepted',
        title: 'Friend request accepted',
        body: 'You are now friends.',
        link: '/messages',
        fromUserId,
      });
      return existing;
    }
    existing.fromUserId = fromUserId as never;
    existing.toUserId = toUserId as never;
    existing.status = 'pending';
    await existing.save();
  } else {
    await Friendship.create({ fromUserId, toUserId, status: 'pending' });
  }

  const from = await User.findById(fromUserId).select('fullName email');
  const name = from?.fullName?.trim() || from?.email?.split('@')[0] || 'Someone';
  await createNotification({
    userId: toUserId,
    type: 'friend_request',
    title: `${name} sent you a friend request`,
    body: 'Open Messages to accept or decline.',
    link: '/messages?tab=friends',
    fromUserId,
  });

  return Friendship.findOne({ fromUserId, toUserId }).populate('fromUserId toUserId', USER_PUBLIC);
}

export async function respondFriendRequest(
  requestId: string,
  userId: string,
  action: 'accept' | 'decline'
) {
  const doc = await Friendship.findById(requestId);
  if (!doc || doc.status !== 'pending') throw new AppError('Request not found', 404);
  if (String(doc.toUserId) !== userId) throw new AppError('Not allowed', 403);

  doc.status = action === 'accept' ? 'accepted' : 'declined';
  await doc.save();

  if (action === 'accept') {
    const me = await User.findById(userId).select('fullName email');
    const name = me?.fullName?.trim() || me?.email?.split('@')[0] || 'Someone';
    await createNotification({
      userId: String(doc.fromUserId),
      type: 'friend_accepted',
      title: `${name} accepted your friend request`,
      body: 'You can now message each other more easily.',
      link: '/messages',
      fromUserId: userId,
    });
  }

  return doc;
}

export async function listFriends(userId: string) {
  const rows = await Friendship.find({
    status: 'accepted',
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .populate('fromUserId toUserId', USER_PUBLIC)
    .lean();

  return rows.map((r) => {
    const from = r.fromUserId as { _id: { toString(): string } };
    const to = r.toUserId as { _id: { toString(): string } };
    const other = String(from._id) === userId ? r.toUserId : r.fromUserId;
    return { friendshipId: r._id, user: other, since: r.updatedAt };
  });
}

export async function listFriendRequests(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    Friendship.find({ toUserId: userId, status: 'pending' })
      .populate('fromUserId', USER_PUBLIC)
      .sort({ createdAt: -1 })
      .lean(),
    Friendship.find({ fromUserId: userId, status: 'pending' })
      .populate('toUserId', USER_PUBLIC)
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  return { incoming, outgoing };
}

export async function areFriends(a: string, b: string) {
  const row = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { fromUserId: a, toUserId: b },
      { fromUserId: b, toUserId: a },
    ],
  }).lean();
  return Boolean(row);
}

export async function friendshipStatus(selfId: string, otherId: string) {
  const row = await Friendship.findOne({
    $or: [
      { fromUserId: selfId, toUserId: otherId },
      { fromUserId: otherId, toUserId: selfId },
    ],
  }).lean();
  if (!row) return { status: 'none' as const };
  if (row.status === 'accepted') return { status: 'friends' as const, id: row._id };
  if (row.status === 'pending') {
    return {
      status: String(row.fromUserId) === selfId ? ('outgoing' as const) : ('incoming' as const),
      id: row._id,
    };
  }
  return { status: 'none' as const };
}
