import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { PostReport } from '../models/PostReport.js';
import { Diagnosis } from '../models/Diagnosis.js';
import { User } from '../models/User.js';
import { MAX_POST_IMAGES } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';
import { writeAuditLog } from './audit.service.js';
import { createNotification, notifyAdmins } from './notification.service.js';
import { blockedPairIds, friendshipStatus } from './friend.service.js';

const PUBLIC_USER =
  'fullName email role bio crops avatarUrl avatarTone coverUrl location.township location.region createdAt';

export async function getPublicProfile(userId: string, viewerId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('User not found', 404);

  const profile = await User.findOne({
    _id: userId,
    isActive: true,
    isGuest: { $ne: true },
  })
    .select(PUBLIC_USER)
    .lean();
  if (!profile) throw new AppError('User not found', 404);

  const friendship =
    viewerId === userId
      ? { status: 'self' as const }
      : await friendshipStatus(viewerId, userId);
  if (friendship.status === 'blocked_by') throw new AppError('User not found', 404);

  const posts = await Post.find({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(40)
    .populate('diagnosticId', 'disease cropType severityIndex isVerified')
    .lean();

  return { profile, posts, friendship };
}

export async function createPost(input: {
  userId: string;
  content: string;
  images?: string[];
  diagnosticId?: string;
}) {
  if (input.diagnosticId) {
    const diagnosis = await Diagnosis.findById(input.diagnosticId);
    if (!diagnosis || String(diagnosis.userId) !== input.userId || !diagnosis.isVerified) {
      throw new AppError('Can only link your own verified diagnosis', 400);
    }
  }

  return Post.create({
    userId: input.userId,
    content: input.content,
    images: input.images ?? [],
    diagnosticId: input.diagnosticId,
  });
}

export async function listPosts(
  query: { page?: unknown; limit?: unknown },
  includeHidden = false,
  viewerId?: string
) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = includeHidden ? {} : { isActive: true };
  if (viewerId) {
    const blocked = await blockedPairIds(viewerId);
    if (blocked.length) filter.userId = { $nin: blocked };
  }
  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email role avatarUrl avatarTone')
      .populate('comments.userId', 'fullName email role avatarUrl')
      .populate('comments.replies.userId', 'fullName email role avatarUrl')
      .populate('diagnosticId', 'disease cropType severityIndex isVerified'),
    Post.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total } };
}

export async function getPost(id: string) {
  const post = await Post.findById(id)
    .populate('userId', 'fullName email role avatarUrl avatarTone')
    .populate('comments.userId', 'fullName email role avatarUrl')
    .populate('comments.replies.userId', 'fullName email role avatarUrl')
    .populate('diagnosticId', 'disease cropType severityIndex isVerified');
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  return post;
}

export async function updatePost(
  id: string,
  userId: string,
  input: { content: string; keepImages?: string[]; newImages?: string[] }
) {
  const post = await Post.findById(id);
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  if (String(post.userId) !== userId) throw new AppError('Forbidden', 403);
  post.content = input.content;

  const replacing = input.keepImages !== undefined || (input.newImages && input.newImages.length > 0);
  if (replacing) {
    const current = new Set(post.images ?? []);
    const kept =
      input.keepImages !== undefined
        ? input.keepImages.filter((url) => current.has(url))
        : [...(post.images ?? [])];
    const next = [...kept, ...(input.newImages ?? [])];
    if (next.length > MAX_POST_IMAGES) {
      throw new AppError(`You can attach up to ${MAX_POST_IMAGES} photos`, 400);
    }
    post.images = next;
  }

  await post.save();
  return post;
}

export async function deletePost(id: string, userId: string, role: string) {
  const post = await Post.findById(id);
  if (!post) throw new AppError('Post not found', 404);
  if (String(post.userId) !== userId && role !== 'admin') {
    throw new AppError('Forbidden', 403);
  }
  const ownerId = String(post.userId);
  await post.deleteOne();
  await PostReport.updateMany(
    { postId: id, status: 'pending' },
    { $set: { status: 'denied', adminNote: 'Post deleted by the author', reviewedAt: new Date() } }
  );
  if (role === 'admin' && ownerId !== userId) {
    await createNotification({
      userId: ownerId,
      type: 'post_removed',
      title: 'Your post has been deleted',
      body: 'An admin removed your community post.',
      link: '/messages?tab=notices',
      meta: { postId: id },
    });
  }
  return { deleted: true };
}

export async function addComment(postId: string, userId: string, content: string) {
  const post = await Post.findById(postId);
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  post.comments.push({
    userId: new mongoose.Types.ObjectId(userId),
    content,
    replies: [],
    timestamp: new Date(),
  } as never);
  await post.save();
  return post;
}

export async function addReply(postId: string, commentId: string, userId: string, content: string) {
  const post = await Post.findById(postId);
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  const comment = post.comments.id(commentId);
  if (!comment) throw new AppError('Comment not found', 404);
  comment.replies.push({
    userId: new mongoose.Types.ObjectId(userId),
    content,
    timestamp: new Date(),
  } as never);
  await post.save();
  return post;
}

export async function toggleLike(postId: string, userId: string) {
  const post = await Post.findById(postId);
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  const idx = post.likes.findIndex((id) => String(id) === userId);
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(new mongoose.Types.ObjectId(userId));
  await post.save();
  return post;
}

export async function moderatePost(
  postId: string,
  adminId: string,
  action: 'hide' | 'restore' | 'remove',
  reason = '',
  ip = ''
) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  if (action === 'remove') {
    const ownerId = String(post.userId);
    await post.deleteOne();
    await writeAuditLog({
      actorId: adminId,
      action: 'POST_MODERATE_REMOVE',
      resourceType: 'Post',
      resourceId: postId,
      metadata: { reason },
      ip,
    });
    if (ownerId !== adminId) {
      await createNotification({
        userId: ownerId,
        type: 'post_removed',
        title: 'Your post has been deleted',
        body: reason?.trim()
          ? `Reason: ${reason.trim()}`
          : 'An admin removed your community post.',
        link: '/messages?tab=notices',
        meta: { postId, reason },
      });
    }
    return { removed: true };
  }

  post.isActive = action === 'restore';
  post.moderatedBy = new mongoose.Types.ObjectId(adminId);
  post.moderatedAt = new Date();
  post.moderationReason = reason;
  await post.save();

  await writeAuditLog({
    actorId: adminId,
    action: action === 'hide' ? 'POST_MODERATE_HIDE' : 'POST_MODERATE_RESTORE',
    resourceType: 'Post',
    resourceId: postId,
    metadata: { reason },
    ip,
  });

  const ownerId = String(post.userId);
  if (ownerId !== adminId) {
    if (action === 'hide') {
      await createNotification({
        userId: ownerId,
        type: 'post_hidden',
        title: 'Your post was hidden',
        body: reason?.trim()
          ? `Reason: ${reason.trim()}`
          : 'An admin hid your community post.',
        link: '/messages?tab=notices',
        meta: { postId, reason },
      });
    } else {
      await createNotification({
        userId: ownerId,
        type: 'post_restored',
        title: 'Your post was restored',
        body: 'An admin restored your community post.',
        link: '/messages?tab=notices',
        meta: { postId },
      });
    }
  }

  return post;
}

export async function reportPost(postId: string, reporterId: string, reason: string) {
  const post = await Post.findById(postId).populate('userId', 'fullName email');
  if (!post || !post.isActive) throw new AppError('Post not found', 404);
  if (String(post.userId?._id || post.userId) === reporterId) {
    throw new AppError('You cannot report your own post', 400);
  }

  const existing = await PostReport.findOne({ postId, reporterId });
  if (existing) {
    throw new AppError('You already reported this post', 409);
  }

  const author = post.userId as { _id?: unknown; fullName?: string; email?: string } | undefined;
  const authorName =
    (author && typeof author === 'object' && (author.fullName?.trim() || author.email)) || 'Farmer';

  let report;
  try {
    report = await PostReport.create({
      postId,
      reporterId,
      reason: reason.trim(),
      status: 'pending',
      postSnapshot: {
        content: String(post.content || '').slice(0, 400),
        authorId: author?._id || post.userId,
        authorName,
      },
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 11000) throw new AppError('You already reported this post', 409);
    throw err;
  }

  await notifyAdmins({
    type: 'post_reported',
    title: 'Community post reported',
    body: reason.trim(),
    link: '/admin/moderation',
    fromUserId: reporterId,
    meta: {
      postId,
      reportId: String(report._id),
      reason: reason.trim(),
      sourceType: 'post',
    },
  });

  await writeAuditLog({
    actorId: reporterId,
    action: 'POST_REPORT',
    resourceType: 'Post',
    resourceId: postId,
    metadata: { reportId: String(report._id), reason: reason.trim() },
  });

  return { reported: true, reportId: String(report._id) };
}

export async function listPostReports(query: { status?: unknown; page?: unknown; limit?: unknown }) {
  const { page, limit, skip } = getPagination(query);
  const status =
    typeof query.status === 'string' && ['pending', 'approved', 'denied'].includes(query.status)
      ? query.status
      : 'pending';
  const filter = { status };
  const [items, total] = await Promise.all([
    PostReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporterId', 'fullName email role')
      .populate('postId', 'content images isActive userId createdAt')
      .populate('postSnapshot.authorId', 'fullName email'),
    PostReport.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, status } };
}

export async function reviewPostReport(
  reportId: string,
  adminId: string,
  action: 'approve' | 'deny',
  reason = '',
  ip = ''
) {
  const report = await PostReport.findById(reportId);
  if (!report) throw new AppError('Report not found', 404);
  if (report.status !== 'pending') {
    throw new AppError('This report was already reviewed', 400);
  }

  const note = reason.trim() || report.reason;

  if (action === 'approve') {
    const post = await Post.findById(report.postId);
    if (post) {
      await moderatePost(String(report.postId), adminId, 'remove', note, ip);
    }
    await PostReport.updateMany(
      { postId: report.postId, status: 'pending' },
      {
        $set: {
          status: 'approved',
          reviewedBy: new mongoose.Types.ObjectId(adminId),
          reviewedAt: new Date(),
          adminNote: note,
        },
      }
    );
    await writeAuditLog({
      actorId: adminId,
      action: 'POST_REPORT_APPROVE',
      resourceType: 'PostReport',
      resourceId: reportId,
      metadata: { postId: String(report.postId), reason: note },
      ip,
    });
    return { reviewed: true, action: 'approve', deleted: Boolean(post) };
  }

  report.status = 'denied';
  report.reviewedBy = new mongoose.Types.ObjectId(adminId);
  report.reviewedAt = new Date();
  report.adminNote = note;
  await report.save();

  await writeAuditLog({
    actorId: adminId,
    action: 'POST_REPORT_DENY',
    resourceType: 'PostReport',
    resourceId: reportId,
    metadata: { postId: String(report.postId), reason: note },
    ip,
  });

  return { reviewed: true, action: 'deny' };
}
