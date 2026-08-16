import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

function loadNotifyPending() {
  try {
    const raw = localStorage.getItem('smart_agro_admin_prefs');
    if (raw) {
      const prefs = JSON.parse(raw) as { notifyPending?: boolean };
      if (typeof prefs.notifyPending === 'boolean') return prefs.notifyPending;
    }
    return localStorage.getItem('smart_agro_admin_notify') !== 'off';
  } catch {
    return true;
  }
}

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

type DashboardData = {
  users: number;
  posts: number;
  diagnoses: number;
  diagnosesMonth: number;
  knowledge: number;
  verified: number;
  pendingReviews: number;
  urgentPending: number;
  knowledgeByCategory: {
    Book: number;
    Article: number;
    Journal: number;
    published: number;
    drafts: number;
  };
  weekDelta: { users: number; diagnoses: number; knowledge: number; posts: number };
  recentActivity: Array<{ type: string; title: string; at: string }>;
  pendingDiagnoses: Array<{
    _id: string;
    disease: string;
    cropType: string;
    severityIndex: number;
    riskLevel?: string;
    createdAt?: string;
    farmer: string;
  }>;
  recentKnowledge: Array<{
    _id: string;
    title: string;
    category: string;
    isPublished: boolean;
    version?: number;
    updatedAt?: string;
  }>;
  usersPreview: Array<{
    _id: string;
    fullName?: string;
    email: string;
    role: string;
    isActive: boolean;
    region: string;
    createdAt?: string;
  }>;
  analytics: { diagnosesSpark: number[]; sparkLabels: string[] };
};

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`ad-ico ${tone} ${className}`}>{children}</span>;
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Sparkline({ values, wide = false }: { values: number[]; wide?: boolean }) {
  const w = wide ? 220 : 120;
  const h = wide ? 56 : 36;
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 4) + 2;
      const y = h - 4 - (v / max) * (h - 8);
      return `${x},${y}`;
    })
    .join(' ');
  const area = `2,${h - 2} ${pts} ${w - 2},${h - 2}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`ad-spark ${wide ? 'wide' : ''}`} aria-hidden>
      <polygon fill="currentColor" opacity="0.12" points={area} />
      <polyline fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

type PieSlice = { label: string; value: number; color: string };

function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: PieSlice[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = Math.max(1, slices.reduce((n, s) => n + s.value, 0));
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const stroke = 22;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="ad-donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="ad-donut" aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#edf2f7" strokeWidth={stroke} />
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="ad-donut-value">
          {centerValue}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="ad-donut-label">
          {centerLabel}
        </text>
      </svg>
      <ul className="ad-donut-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ values, labels }: { values: number[]; labels?: string[] }) {
  const max = Math.max(1, ...values);
  const w = 320;
  const h = 160;
  const pad = 18;
  const gap = 8;
  const barW = (w - pad * 2 - gap * (values.length - 1)) / Math.max(1, values.length);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ad-bar-chart" role="img" aria-label="Weekly diagnoses">
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = h - pad - t * (h - pad * 2);
        return <line key={t} x1={pad} x2={w - pad} y1={y} y2={y} stroke="#edf2f7" strokeWidth="1" />;
      })}
      {values.map((v, i) => {
        const barH = (v / max) * (h - pad * 2);
        const x = pad + i * (barW + gap);
        const y = h - pad - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={8} fill="url(#adBarGrad)" />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" className="ad-bar-label">
              {labels?.[i] || `D${i + 1}`}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="adBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4318FF" />
          <stop offset="100%" stopColor="#6AD2FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AreaChart({ values }: { values: number[] }) {
  const w = 320;
  const h = 140;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (w - 16) + 8;
    const y = h - 20 - (v / max) * (h - 36);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `8,${h - 12} ${line} ${w - 8},${h - 12}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ad-area-chart" aria-hidden>
      <defs>
        <linearGradient id="adAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#01B574" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#01B574" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#adAreaFill)" points={area} />
      <polyline fill="none" stroke="#01B574" strokeWidth="3" strokeLinejoin="round" points={line} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#01B574" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function AdminDashboard() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const showPendingReminders = useMemo(() => loadNotifyPending(), []);

  useEffect(() => {
    if (!accessToken || user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<DashboardData>('/admin/dashboard', { token: accessToken })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  if (user?.role === 'expert') {
    return (
      <div className="ad-page">
        <header className="ad-page-head">
          <div>
            <h1>Expert review desk</h1>
            <p>Verify AI diagnoses and validate regional disease signals.</p>
          </div>
        </header>
        <div className="ad-panel ad-expert-cta">
          <SoftIcon tone="coral">
            <IconDiag />
          </SoftIcon>
          <div>
            <strong>Focus on clinical validation</strong>
            <p className="muted">Mark AI results verified so farmers can share trusted records.</p>
          </div>
          <Link className="button" to="/admin/diagnoses">
            Open diagnostics
          </Link>
          <Link className="button secondary" to="/admin/heatmap">
            Outbreak map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Orchestrate knowledge, users, and diagnosis review for Myanmar farmers.</p>
        </div>
      </header>

      {error && <div className="auth-banner error">{error}</div>}
      {loading && !data && <p className="muted">Loading field telemetry…</p>}

      {data && (
        <>
          <section className="ad-kpi-row">
            <article className="ad-kpi mint">
              <SoftIcon tone="mint">
                <IconUsers />
              </SoftIcon>
              <strong>{data.users.toLocaleString()}</strong>
              <span>Total Users</span>
              <small>+{data.weekDelta.users} this week</small>
            </article>
            <article className="ad-kpi coral">
              <SoftIcon tone="coral">
                <IconDiag />
              </SoftIcon>
              <strong>{data.diagnosesMonth.toLocaleString()}</strong>
              <span>Diagnostics This Month</span>
              <small>+{data.weekDelta.diagnoses} this week</small>
            </article>
            <article className="ad-kpi amber">
              <SoftIcon tone="amber">
                <IconBook />
              </SoftIcon>
              <strong>{data.knowledge.toLocaleString()}</strong>
              <span>Knowledge Articles</span>
              <small>+{data.weekDelta.knowledge} this week</small>
            </article>
            <article className="ad-kpi peach">
              <SoftIcon tone="peach">
                <IconAlert />
              </SoftIcon>
              <strong>{data.pendingReviews}</strong>
              <span>Pending Reviews</span>
              <small className={data.urgentPending ? 'urgent' : ''}>
                Urgent: {data.urgentPending}
              </small>
            </article>
          </section>

          <section className="ad-panel ad-analytics-hero">
            <header className="ad-section-head">
              <div>
                <h2>
                  <SoftIcon tone="mint">
                    <IconChart />
                  </SoftIcon>
                  Analytics & Reports
                </h2>
                <p className="muted ad-analytics-lead">
                  Charts inspired by modern admin dashboards — field metrics at a glance.
                </p>
              </div>
            </header>

            <div className="ad-kpi-row ad-kpi-horizon">
              <article className="ad-kpi-card">
                <span>Diagnoses this month</span>
                <strong>{data.diagnosesMonth.toLocaleString()}</strong>
                <Sparkline values={data.analytics.diagnosesSpark} />
                <small>+{data.weekDelta.diagnoses} this week</small>
              </article>
              <article className="ad-kpi-card">
                <span>Published knowledge</span>
                <strong>{data.knowledgeByCategory.published}</strong>
                <Sparkline
                  values={padSpark(data.analytics.diagnosesSpark, data.weekDelta.knowledge)}
                />
                <small>+{data.weekDelta.knowledge} this week</small>
              </article>
              <article className="ad-kpi-card">
                <span>Community posts</span>
                <strong>{data.posts.toLocaleString()}</strong>
                <Sparkline values={padSpark(data.analytics.diagnosesSpark, data.weekDelta.posts)} />
                <small>+{data.weekDelta.posts} this week</small>
              </article>
              <article className="ad-kpi-card">
                <span>Pending reviews</span>
                <strong>{data.pendingReviews}</strong>
                <Sparkline
                  values={padSpark(data.analytics.diagnosesSpark, data.pendingReviews || 1)}
                />
                <small className={data.urgentPending ? 'urgent' : ''}>
                  {data.urgentPending} urgent
                </small>
              </article>
            </div>

            <div className="ad-chart-grid">
              <article className="ad-chart-card">
                <header>
                  <div>
                    <h3>Weekly diagnoses</h3>
                    <p>Traffic-style bars for recent detection volume</p>
                  </div>
                  <span className="ad-chart-pill">7 days</span>
                </header>
                <BarChart
                  values={
                    data.analytics.diagnosesSpark.length
                      ? data.analytics.diagnosesSpark
                      : [2, 4, 3, 6, 5, 7, 4]
                  }
                  labels={
                    data.analytics.sparkLabels?.length
                      ? data.analytics.sparkLabels.map((l) => l.slice(0, 3))
                      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  }
                />
              </article>

              <article className="ad-chart-card">
                <header>
                  <div>
                    <h3>Knowledge mix</h3>
                    <p>Library share by content type</p>
                  </div>
                </header>
                <DonutChart
                  centerValue={
                    data.knowledgeByCategory.Book +
                    data.knowledgeByCategory.Article +
                    data.knowledgeByCategory.Journal
                  }
                  centerLabel="Items"
                  slices={[
                    { label: 'Books', value: data.knowledgeByCategory.Book, color: '#4318FF' },
                    { label: 'Articles', value: data.knowledgeByCategory.Article, color: '#6AD2FF' },
                    { label: 'Journals', value: data.knowledgeByCategory.Journal, color: '#01B574' },
                  ]}
                />
              </article>

              <article className="ad-chart-card">
                <header>
                  <div>
                    <h3>Review status</h3>
                    <p>Verified vs waiting in the queue</p>
                  </div>
                </header>
                <DonutChart
                  centerValue={data.verified + data.pendingReviews}
                  centerLabel="Total"
                  slices={[
                    { label: 'Verified', value: data.verified, color: '#01B574' },
                    {
                      label: 'Pending',
                      value: Math.max(0, data.pendingReviews - data.urgentPending),
                      color: '#FFB547',
                    },
                    { label: 'Urgent', value: data.urgentPending, color: '#E31A1A' },
                  ]}
                />
              </article>

              <article className="ad-chart-card">
                <header>
                  <div>
                    <h3>Disease trend</h3>
                    <p>Area view of diagnosis activity</p>
                  </div>
                  <span className="ad-chart-pill mint">Live</span>
                </header>
                <AreaChart
                  values={
                    data.analytics.diagnosesSpark.length
                      ? data.analytics.diagnosesSpark
                      : [1, 3, 2, 5, 4, 6, 5]
                  }
                />
                <div className="ad-chart-foot">
                  <strong>{data.diagnosesMonth}</strong>
                  <span>diagnoses this month · +{data.weekDelta.diagnoses} week</span>
                </div>
              </article>
            </div>

            <div className="ad-analytics-links">
              <Link className="button compact" to="/admin/diagnoses">
                Review queue
              </Link>
              <Link className="button secondary compact" to="/admin/heatmap">
                Outbreak map
              </Link>
              <Link className="button secondary compact" to="/admin/knowledge">
                Knowledge library
              </Link>
            </div>
          </section>

          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>
                <SoftIcon tone="amber">
                  <IconBook />
                </SoftIcon>
                Knowledge Center Management
              </h2>
              <Link className="button compact" to="/admin/knowledge">
                Manage
              </Link>
            </header>
            <div className="ad-know-stats">
              <div>
                <SoftIcon tone="amber">
                  <IconBook />
                </SoftIcon>
                <strong>{data.knowledgeByCategory.Book}</strong>
                <span>Books</span>
              </div>
              <div>
                <SoftIcon tone="sky">
                  <IconArticle />
                </SoftIcon>
                <strong>{data.knowledgeByCategory.Article}</strong>
                <span>Articles</span>
              </div>
              <div>
                <SoftIcon tone="teal">
                  <IconJournal />
                </SoftIcon>
                <strong>{data.knowledgeByCategory.Journal}</strong>
                <span>Journals</span>
              </div>
              <div>
                <SoftIcon tone="mint">
                  <IconCheck />
                </SoftIcon>
                <strong>{data.knowledgeByCategory.published}</strong>
                <span>Published</span>
              </div>
            </div>
            <ul className="ad-list">
              {data.recentKnowledge.map((k) => (
                <li key={k._id}>
                  <SoftIcon
                    tone={k.category === 'Book' ? 'amber' : k.category === 'Journal' ? 'teal' : 'sky'}
                  >
                    {k.category === 'Book' ? (
                      <IconBook />
                    ) : k.category === 'Journal' ? (
                      <IconJournal />
                    ) : (
                      <IconArticle />
                    )}
                  </SoftIcon>
                  <div>
                    <strong>{k.title}</strong>
                    <span>
                      {k.category} · {k.isPublished ? 'Published' : 'Draft'} · {timeAgo(k.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="ad-cta-row">
              <Link className="button" to="/admin/knowledge">
                Create New Article
              </Link>
              <Link className="button secondary" to="/admin/knowledge">
                Bulk Upload
              </Link>
            </div>
          </section>

          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>
                <SoftIcon tone="sky">
                  <IconUsers />
                </SoftIcon>
                User Management
              </h2>
              <Link className="button compact secondary" to="/admin/users">
                View all
              </Link>
            </header>
            <div className="ad-table-wrap">
              <table className="data-table ad-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Region</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usersPreview.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <strong>{u.fullName || u.email.split('@')[0]}</strong>
                        <div className="muted">{u.email}</div>
                      </td>
                      <td>
                        <span className={`pill ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{u.region}</td>
                      <td>
                        <span className={`pill ${u.isActive ? 'ok' : 'warn'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {showPendingReminders && (
            <section className="ad-panel">
              <header className="ad-section-head">
                <h2>
                  <SoftIcon tone="coral">
                    <IconDiag />
                  </SoftIcon>
                  Diagnostics Review
                </h2>
                <span className="ad-badge warn">{data.pendingReviews} pending</span>
              </header>
              <ul className="ad-diag-queue">
                {data.pendingDiagnoses.map((d) => (
                  <li key={d._id}>
                    <SoftIcon tone={d.severityIndex >= 70 ? 'coral' : 'amber'}>
                      <IconDiag />
                    </SoftIcon>
                    <div>
                      <strong>
                        {d.disease} · {d.cropType}
                      </strong>
                      <span>
                        {d.farmer} · severity {d.severityIndex}
                        {d.riskLevel ? ` · ${d.riskLevel}` : ''} · {timeAgo(d.createdAt)}
                      </span>
                    </div>
                    <Link className="button compact" to="/admin/diagnoses">
                      Review
                    </Link>
                  </li>
                ))}
                {data.pendingDiagnoses.length === 0 && (
                  <li className="muted">Queue clear — no pending diagnoses.</li>
                )}
              </ul>
            </section>
          )}

          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>
                <SoftIcon tone="teal">
                  <IconGear />
                </SoftIcon>
                System Settings
              </h2>
            </header>
            <div className="ad-settings-grid">
              <Link to="/admin/settings" className="ad-setting-card">
                <SoftIcon tone="coral">
                  <IconLock />
                </SoftIcon>
                <strong>Security</strong>
                <span>Roles & access</span>
              </Link>
              <Link to="/admin/settings" className="ad-setting-card">
                <SoftIcon tone="sky">
                  <IconBell />
                </SoftIcon>
                <strong>Notifications</strong>
                <span>Alerts preferences</span>
              </Link>
              <Link to="/admin/settings" className="ad-setting-card">
                <SoftIcon tone="amber">
                  <IconLang />
                </SoftIcon>
                <strong>Language</strong>
                <span>EN / Myanmar</span>
              </Link>
              <Link to="/admin/settings" className="ad-setting-card">
                <SoftIcon tone="mint">
                  <IconBackup />
                </SoftIcon>
                <strong>Backup</strong>
                <span>Database snapshot</span>
              </Link>
            </div>
          </section>

          <section className="ad-panel ad-recent-compact">
            <header className="ad-section-head">
              <h2>
                <SoftIcon tone="sky">
                  <IconActivity />
                </SoftIcon>
                Recent Activity
              </h2>
            </header>
            <ul className="ad-activity ad-activity-dense">
              {data.recentActivity.map((a, i) => (
                <li key={`${a.at}-${i}`}>
                  <SoftIcon tone={activityTone(a.type)}>{activityIcon(a.type)}</SoftIcon>
                  <div>
                    <strong>{a.title}</strong>
                    <span>{timeAgo(a.at)}</span>
                  </div>
                </li>
              ))}
              {data.recentActivity.length === 0 && (
                <li className="muted">No recent activity yet.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function padSpark(base: number[], seed: number) {
  if (!base.length) return [0, seed, seed, seed, seed, seed, seed];
  return base.map((v, i) => Math.max(0, Math.round(v * 0.3 + (seed / 7) * (i + 1))));
}

function activityTone(type: string): Tone {
  if (type === 'diagnosis') return 'coral';
  if (type === 'knowledge') return 'amber';
  if (type === 'user') return 'sky';
  if (type === 'alert') return 'peach';
  return 'teal';
}

function activityIcon(type: string) {
  if (type === 'diagnosis') return <IconDiag />;
  if (type === 'knowledge') return <IconBook />;
  if (type === 'user') return <IconUsers />;
  if (type === 'alert') return <IconAlert />;
  return <IconActivity />;
}

function svg(size = 18) {
  return { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': true as const };
}
function IconUsers() {
  return (
    <svg {...svg()}>
      <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 18.5c.8-2.6 2.8-4 5.2-4s4.3 1.4 5 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconDiag() {
  return (
    <svg {...svg()}>
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg {...svg()}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg {...svg()}>
      <path d="M12 4.5 21 19H3L12 4.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4M12 16.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg {...svg()}>
      <path d="M4 12h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArticle() {
  return (
    <svg {...svg()}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconJournal() {
  return (
    <svg {...svg()}>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg {...svg()}>
      <path d="M5.5 12.5 10 17l8.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg {...svg()}>
      <path d="M5 19V5M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 15l3.5-4 3 2.5L18 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg {...svg()}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5v2.2M12 18.3V21M3.5 12h2.2M18.3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg {...svg()}>
      <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg {...svg()}>
      <path d="M6.5 16.5h11l-1.2-1.5V10a4.3 4.3 0 1 0-8.6 0v5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconLang() {
  return (
    <svg {...svg()}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 12h15M12 4c2.5 2.8 2.5 12.2 0 16M12 4c-2.5 2.8-2.5 12.2 0 16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconBackup() {
  return (
    <svg {...svg()}>
      <path d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6-1.5A3.5 3.5 0 0 0 7 18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 14v-5M10 11l2-2 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
