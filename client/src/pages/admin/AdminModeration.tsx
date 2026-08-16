import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type Post = {
  _id: string;
  content: string;
  isActive: boolean;
  likes?: string[];
  comments?: unknown[];
  moderationReason?: string;
  userId?: { email?: string; fullName?: string };
  createdAt?: string;
};

type Report = {
  _id: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt?: string;
  adminNote?: string;
  reporterId?: { fullName?: string; email?: string };
  postId?: { _id?: string; content?: string; isActive?: boolean } | null;
  postSnapshot?: { content?: string; authorName?: string };
};

export function AdminModeration() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportFilter, setReportFilter] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    if (!accessToken) return;
    try {
      const [feed, reportList] = await Promise.all([
        api<Post[]>('/social/posts?hidden=true', { token: accessToken }),
        api<Report[]>(`/social/reports?status=${reportFilter}&limit=50`, { token: accessToken }),
      ]);
      setPosts(Array.isArray(feed) ? feed : []);
      setReports(Array.isArray(reportList) ? reportList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, reportFilter]);

  async function moderate(id: string, action: 'hide' | 'restore' | 'remove') {
    if (!accessToken) return;
    const reason =
      action === 'remove'
        ? prompt('Reason for removal (sent to the author)') || 'Removed by admin'
        : action === 'hide'
          ? prompt('Reason for hiding') || 'Hidden by admin'
          : 'Restored by admin';
    try {
      await api(`/social/posts/${id}/moderate`, {
        method: 'POST',
        token: accessToken,
        body: { action, reason },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moderation failed');
    }
  }

  async function review(id: string, action: 'approve' | 'deny', fallbackReason: string) {
    if (!accessToken) return;
    const raw =
      action === 'approve'
        ? prompt('Reason sent to the author when this post is deleted', fallbackReason)
        : prompt('Optional note for denying this report (Cancel to abort)');
    if (raw === null) return;
    const reason = action === 'approve' ? raw.trim() || fallbackReason : raw.trim();
    setBusyId(id);
    setError('');
    try {
      await api(`/social/reports/${id}/review`, {
        method: 'POST',
        token: accessToken,
        body: { action, reason },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review report');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="admin-topbar">
        <div>
          <h1>Community moderation</h1>
          <p className="lead">
            Review reported posts, then hide, restore, or remove field posts. Approving a report
            deletes the post and notifies the author with your reason.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="panel stack am-reports">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Reported posts</h2>
          <div className="row">
            {(['pending', 'approved', 'denied'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={reportFilter === s ? undefined : 'secondary'}
                onClick={() => setReportFilter(s)}
              >
                {s === 'pending' ? 'Pending' : s === 'approved' ? 'Deleted' : 'Denied'}
              </button>
            ))}
          </div>
        </div>
        {reports.length === 0 && (
          <div className="empty-state">
            {reportFilter === 'pending' ? 'No pending reports.' : `No ${reportFilter} reports.`}
          </div>
        )}
        {reports.map((r) => {
          const postText = r.postId?.content || r.postSnapshot?.content || '(Post no longer available)';
          const author = r.postSnapshot?.authorName || 'Farmer';
          const reporter = r.reporterId?.fullName || r.reporterId?.email || 'Reporter';
          return (
            <article key={r._id} className="feed-item">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{author}</strong>
                  <div className="muted">
                    Reported by {reporter}
                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleString()}` : ''}
                  </div>
                </div>
                <span className={`pill ${r.status === 'pending' ? 'warn' : r.status === 'approved' ? 'danger' : 'ok'}`}>
                  {r.status}
                </span>
              </div>
              <p>{postText}</p>
              <p>
                <strong>Report reason:</strong> {r.reason}
              </p>
              {r.adminNote && r.status !== 'pending' && (
                <p className="muted">Admin note: {r.adminNote}</p>
              )}
              {r.status === 'pending' && (
                <div className="row">
                  <button
                    type="button"
                    className="danger"
                    disabled={busyId === r._id}
                    onClick={() => void review(r._id, 'approve', r.reason)}
                  >
                    Delete post
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busyId === r._id}
                    onClick={() => void review(r._id, 'deny', r.reason)}
                  >
                    Deny report
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="panel stack">
        <h2>All posts</h2>
        {posts.map((p) => (
          <article key={p._id} className="feed-item">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{p.userId?.fullName || p.userId?.email || 'Farmer'}</strong>
                <div className="muted">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                </div>
              </div>
              <span className={`pill ${p.isActive ? 'ok' : 'danger'}`}>
                {p.isActive ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <p>{p.content}</p>
            {p.moderationReason && (
              <p className="muted">Reason: {p.moderationReason}</p>
            )}
            <div className="muted">
              {p.likes?.length || 0} likes · {p.comments?.length || 0} comments
            </div>
            <div className="row">
              {p.isActive ? (
                <button type="button" className="secondary" onClick={() => void moderate(p._id, 'hide')}>
                  Hide
                </button>
              ) : (
                <button type="button" className="secondary" onClick={() => void moderate(p._id, 'restore')}>
                  Restore
                </button>
              )}
              <button type="button" className="danger" onClick={() => void moderate(p._id, 'remove')}>
                Remove
              </button>
            </div>
          </article>
        ))}
        {posts.length === 0 && <div className="empty-state">No posts in the feed yet.</div>}
      </div>
    </div>
  );
}
