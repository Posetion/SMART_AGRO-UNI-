import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Diagnosis } from '../models/Diagnosis.js';
import { Knowledge } from '../models/Knowledge.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import type { Role } from '../config/constants.js';
import { assertPasswordStrength, hashPassword } from '../utils/password.js';
import { writeAuditLog } from './audit.service.js';

export async function listUsers() {
  const rows = await User.find()
    .sort({ createdAt: -1 })
    .select(
      '+passwordHash email fullName role isActive isGuest createdAt updatedAt avatarUrl avatarTone location.township location.region'
    )
    .lean();

  return rows.map(({ passwordHash, ...user }) => ({
    ...user,
    hasPassword: Boolean(passwordHash),
  }));
}

export async function adminSetUserPassword(
  id: string,
  newPassword: string,
  actorId: string,
  ip = ''
) {
  try {
    assertPasswordStrength(newPassword);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Invalid password', 400);
  }

  const user = await User.findById(id).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);
  if (user.isGuest) {
    throw new AppError('Guest accounts cannot have a password', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.isVerified = true;
  await user.save();

  await writeAuditLog({
    actorId,
    action: 'USER_PASSWORD_SET',
    resourceType: 'User',
    resourceId: id,
    metadata: { email: user.email },
    ip,
  });

  return { id: String(user._id), email: user.email, message: 'Password updated' };
}

export async function updateUserRole(id: string, role: Role, actorId: string, ip = '') {
  if (!['farmer', 'expert', 'admin'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  await writeAuditLog({
    actorId,
    action: 'USER_ROLE_UPDATE',
    resourceType: 'User',
    resourceId: id,
    metadata: { role },
    ip,
  });
  return user;
}

export async function deleteUserAccount(id: string, actorId: string, ip = '') {
  if (String(id) === String(actorId)) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new AppError('Cannot delete the last admin account', 400);
    }
  }

  await User.findByIdAndDelete(id);
  await writeAuditLog({
    actorId,
    action: 'USER_DELETE',
    resourceType: 'User',
    resourceId: id,
    metadata: { email: user.email, role: user.role },
    ip,
  });

  return { id, deleted: true };
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function personLabel(u?: { fullName?: string; email?: string } | null) {
  if (!u) return 'Farmer';
  return u.fullName?.trim() || u.email?.split('@')[0] || 'Farmer';
}

export async function dashboardStats() {
  const monthStart = startOfMonth();
  const urgentBefore = daysAgo(2);
  const weekAgo = daysAgo(7);

  const [
    users,
    posts,
    diagnoses,
    diagnosesMonth,
    knowledge,
    verified,
    pendingReviews,
    urgentPending,
    books,
    articles,
    journals,
    published,
    drafts,
    recentUsers,
    recentDiagnoses,
    recentKnowledge,
    recentAudit,
    pendingDiagnoses,
    usersPreview,
    weekDiagnoses,
    weekUsers,
    weekKnowledge,
    weekPosts,
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ isActive: true }),
    Diagnosis.countDocuments(),
    Diagnosis.countDocuments({ createdAt: { $gte: monthStart } }),
    Knowledge.countDocuments(),
    Diagnosis.countDocuments({ isVerified: true }),
    Diagnosis.countDocuments({
      isVerified: false,
      isRejected: { $ne: true },
      reviewRequested: true,
    }),
    Diagnosis.countDocuments({
      isVerified: false,
      isRejected: { $ne: true },
      reviewRequested: true,
      createdAt: { $lte: urgentBefore },
    }),
    Knowledge.countDocuments({ category: 'Book' }),
    Knowledge.countDocuments({ category: 'Article' }),
    Knowledge.countDocuments({ category: 'Journal' }),
    Knowledge.countDocuments({ isPublished: true }),
    Knowledge.countDocuments({ isPublished: false }),
    User.find().sort({ createdAt: -1 }).limit(8).select('fullName email role createdAt'),
    Diagnosis.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'fullName email')
      .select('disease cropType isVerified createdAt userId severityIndex'),
    Knowledge.find()
      .sort({ updatedAt: -1 })
      .limit(6)
      .select('title category isPublished updatedAt createdAt version'),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).select('action resourceType createdAt metadata'),
    Diagnosis.find({
      isVerified: false,
      isRejected: { $ne: true },
      reviewRequested: true,
    })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate('userId', 'fullName email')
      .select('disease cropType severityIndex createdAt userId prediction'),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role isActive createdAt location'),
    Diagnosis.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Knowledge.countDocuments({ createdAt: { $gte: weekAgo } }),
    Post.countDocuments({ createdAt: { $gte: weekAgo }, isActive: true }),
  ]);

  type Activity = {
    type: 'user' | 'diagnosis' | 'knowledge' | 'audit' | 'alert';
    title: string;
    at: string;
  };

  const activity: Activity[] = [];

  for (const u of recentUsers) {
    activity.push({
      type: 'user',
      title: `${personLabel(u)} registered new account`,
      at: (u as { createdAt?: Date }).createdAt?.toISOString?.() || new Date().toISOString(),
    });
  }
  for (const d of recentDiagnoses) {
    const farmer = personLabel(
      typeof d.userId === 'object' && d.userId
        ? (d.userId as { fullName?: string; email?: string })
        : null
    );
    activity.push({
      type: 'diagnosis',
      title: d.isVerified
        ? `${farmer} diagnosis verified — ${d.disease}`
        : `${farmer} uploaded a diagnosis — ${d.disease}`,
      at: (d as { createdAt?: Date }).createdAt?.toISOString?.() || new Date().toISOString(),
    });
  }
  for (const k of recentKnowledge) {
    const status = k.isPublished ? 'Published' : 'Draft';
    activity.push({
      type: 'knowledge',
      title: `${status}: "${k.title}" (${k.category})`,
      at:
        (k as { updatedAt?: Date }).updatedAt?.toISOString?.() ||
        (k as { createdAt?: Date }).createdAt?.toISOString?.() ||
        new Date().toISOString(),
    });
  }
  for (const a of recentAudit) {
    if (a.action === 'BACKUP_TRIGGERED') {
      activity.push({
        type: 'audit',
        title: 'System backup queued',
        at: (a as { createdAt?: Date }).createdAt?.toISOString?.() || new Date().toISOString(),
      });
    } else if (a.action === 'USER_ROLE_UPDATE') {
      activity.push({
        type: 'audit',
        title: `User role updated to ${(a.metadata as { role?: string })?.role || 'new role'}`,
        at: (a as { createdAt?: Date }).createdAt?.toISOString?.() || new Date().toISOString(),
      });
    }
  }

  if (pendingReviews > 0) {
    activity.push({
      type: 'alert',
      title: `${pendingReviews} diagnostics pending review`,
      at: new Date().toISOString(),
    });
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Simple 7-day sparkline buckets (diagnoses per day)
  const sparkDays = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end, label: start.toLocaleDateString('en-US', { weekday: 'short' }) };
  });

  const sparkCounts = await Promise.all(
    sparkDays.map(({ start, end }) =>
      Diagnosis.countDocuments({ createdAt: { $gte: start, $lt: end } })
    )
  );

  return {
    users,
    posts,
    diagnoses,
    diagnosesMonth,
    knowledge,
    verified,
    pendingReviews,
    urgentPending,
    knowledgeByCategory: {
      Book: books,
      Article: articles,
      Journal: journals,
      published,
      drafts,
    },
    weekDelta: {
      users: weekUsers,
      diagnoses: weekDiagnoses,
      knowledge: weekKnowledge,
      posts: weekPosts,
    },
    recentActivity: activity.slice(0, 10),
    pendingDiagnoses: pendingDiagnoses.map((d) => ({
      _id: d._id,
      disease: d.disease,
      cropType: d.cropType,
      severityIndex: d.severityIndex,
      riskLevel: d.prediction?.riskLevel,
      createdAt: (d as { createdAt?: Date }).createdAt,
      farmer: personLabel(
        typeof d.userId === 'object' && d.userId
          ? (d.userId as { fullName?: string; email?: string })
          : null
      ),
    })),
    recentKnowledge: recentKnowledge.map((k) => ({
      _id: k._id,
      title: k.title,
      category: k.category,
      isPublished: k.isPublished,
      version: k.version,
      updatedAt: (k as { updatedAt?: Date }).updatedAt,
    })),
    usersPreview: usersPreview.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      isActive: u.isActive !== false,
      region: u.location?.region || u.location?.township || '—',
      createdAt: (u as { createdAt?: Date }).createdAt,
    })),
    analytics: {
      diagnosesSpark: sparkCounts,
      sparkLabels: sparkDays.map((d) => d.label),
    },
  };
}

export async function listAuditLogs(limit = 100) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(limit);
}

export async function triggerBackup() {
  await writeAuditLog({
    action: 'BACKUP_TRIGGERED',
    resourceType: 'System',
    metadata: { status: 'queued' },
  });
  return {
    message: 'Backup job queued (stub). Configure Atlas or mongodump in production.',
    queuedAt: new Date().toISOString(),
  };
}
