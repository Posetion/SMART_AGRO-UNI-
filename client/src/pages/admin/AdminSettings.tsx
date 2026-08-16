import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, type Lang } from '../../context/LanguageContext';
import { api } from '../../services/api';

type SectionId =
  | 'general'
  | 'appearance'
  | 'notifications'
  | 'diagnostics'
  | 'security'
  | 'data'
  | 'shortcuts';

type AdminPrefs = {
  notifyPending: boolean;
  notifyUrgentOnly: boolean;
  notifySound: boolean;
  autoRefreshSec: number;
  compactMode: boolean;
  defaultHome: '/admin' | '/admin/diagnoses' | '/admin/users' | '/admin/heatmap';
  diagDefaultFilter: 'pending' | 'verified' | 'rejected' | 'all';
  diagHighlightUrgent: boolean;
  showRoleBadges: boolean;
  confirmDeletes: boolean;
};

const PREFS_KEY = 'smart_agro_admin_prefs';

const DEFAULT_PREFS: AdminPrefs = {
  notifyPending: true,
  notifyUrgentOnly: false,
  notifySound: false,
  autoRefreshSec: 30,
  compactMode: false,
  defaultHome: '/admin',
  diagDefaultFilter: 'pending',
  diagHighlightUrgent: true,
  showRoleBadges: true,
  confirmDeletes: true,
};

const SECTIONS: Array<{ id: SectionId; label: string; hint: string }> = [
  { id: 'general', label: 'General', hint: 'Defaults & workspace' },
  { id: 'appearance', label: 'Appearance', hint: 'Language & layout' },
  { id: 'notifications', label: 'Notifications', hint: 'Alerts & reminders' },
  { id: 'diagnostics', label: 'Diagnostics', hint: 'Review preferences' },
  { id: 'security', label: 'Security', hint: 'Roles & audit' },
  { id: 'data', label: 'Data & backup', hint: 'Exports & jobs' },
  { id: 'shortcuts', label: 'Shortcuts', hint: 'Quick links' },
];

function loadPrefs(): AdminPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      // migrate old keys
      const notify = localStorage.getItem('smart_agro_admin_notify') !== 'off';
      return { ...DEFAULT_PREFS, notifyPending: notify };
    }
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AdminPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(next: AdminPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  localStorage.setItem('smart_agro_admin_notify', next.notifyPending ? 'on' : 'off');
  document.documentElement.classList.toggle('ad-compact', next.compactMode);
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className={`as-toggle ${checked ? 'is-on' : ''}`}>
      <span className="as-toggle-copy">
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="as-switch" aria-hidden />
    </label>
  );
}

export function AdminSettings() {
  const { accessToken, user } = useAuth();
  const { lang, setLang } = useLanguage();
  const [section, setSection] = useState<SectionId>('general');
  const [prefs, setPrefs] = useState<AdminPrefs>(() => loadPrefs());
  const [savedFlash, setSavedFlash] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('ad-compact', prefs.compactMode);
  }, [prefs.compactMode]);

  function patch(partial: Partial<AdminPrefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
      return next;
    });
  }

  function setConsoleLang(next: Lang) {
    setLang(next);
    localStorage.setItem('smart_agro_admin_lang', next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }

  async function triggerBackup() {
    if (!accessToken) return;
    setBusy(true);
    setBackupMsg('');
    setError('');
    try {
      const data = await api<{ message: string }>('/admin/backup', {
        method: 'POST',
        token: accessToken,
      });
      setBackupMsg(data.message || 'Backup queued successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setBusy(false);
    }
  }

  function resetPrefs() {
    if (!window.confirm('Reset all admin console preferences on this device?')) return;
    setPrefs(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }

  const active = useMemo(() => SECTIONS.find((s) => s.id === section) || SECTIONS[0], [section]);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="ad-page as-page">
      <header className="um-head as-head">
        <div className="um-head-main">
          <h1>Settings</h1>
          <p>Customize the admin console, reviews, alerts, and system operations.</p>
        </div>
        {savedFlash && (
          <div className="as-saved" role="status">
            Saved
          </div>
        )}
      </header>

      <div className="as-layout">
        <aside className="as-nav" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`as-nav-item ${section === s.id ? 'is-active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.hint}</span>
            </button>
          ))}
        </aside>

        <section className="as-panel">
          <header className="as-panel-head">
            <div>
              <h2>{active.label}</h2>
              <p>{active.hint}</p>
            </div>
          </header>

          {section === 'general' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Default landing page</h3>
                <p className="as-help">Where the console opens after login (bookmark tip).</p>
                <div className="as-choice-grid">
                  {(
                    [
                      ['/admin', 'Dashboard'],
                      ['/admin/diagnoses', 'Diagnostics'],
                      ['/admin/users', 'Users'],
                      ['/admin/heatmap', 'Outbreak map'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`as-choice ${prefs.defaultHome === value ? 'is-active' : ''}`}
                      onClick={() => patch({ defaultHome: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="as-card">
                <h3>Workspace behavior</h3>
                <div className="as-toggle-list">
                  <Toggle
                    checked={prefs.showRoleBadges}
                    onChange={(v) => patch({ showRoleBadges: v })}
                    label="Show role badges"
                    hint="Highlight admin / expert / farmer labels in lists"
                  />
                  <Toggle
                    checked={prefs.confirmDeletes}
                    onChange={(v) => patch({ confirmDeletes: v })}
                    label="Confirm before delete"
                    hint="Ask before permanently deleting records"
                  />
                </div>
              </div>

              <div className="as-card as-danger-card">
                <h3>Reset preferences</h3>
                <p className="as-help">Clears console preferences stored in this browser only.</p>
                <button type="button" className="button secondary compact" onClick={resetPrefs}>
                  Reset to defaults
                </button>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Language</h3>
                <p className="as-help">Applies across the Smart Agro app on this device.</p>
                <div className="as-choice-grid as-choice-2">
                  <button
                    type="button"
                    className={`as-choice ${lang === 'en' ? 'is-active' : ''}`}
                    onClick={() => setConsoleLang('en')}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`as-choice ${lang === 'my' ? 'is-active' : ''}`}
                    onClick={() => setConsoleLang('my')}
                  >
                    Myanmar
                  </button>
                </div>
              </div>

              <div className="as-card">
                <h3>Layout density</h3>
                <div className="as-toggle-list">
                  <Toggle
                    checked={prefs.compactMode}
                    onChange={(v) => patch({ compactMode: v })}
                    label="Compact mode"
                    hint="Tighter spacing in admin tables and side panels"
                  />
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Dashboard alerts</h3>
                <div className="as-toggle-list">
                  <Toggle
                    checked={prefs.notifyPending}
                    onChange={(v) => patch({ notifyPending: v })}
                    label="Pending review reminders"
                    hint="Show the diagnostics queue card on the dashboard"
                  />
                  <Toggle
                    checked={prefs.notifyUrgentOnly}
                    onChange={(v) => patch({ notifyUrgentOnly: v })}
                    label="Urgent only"
                    hint="Emphasize high-severity detections first"
                  />
                  <Toggle
                    checked={prefs.notifySound}
                    onChange={(v) => patch({ notifySound: v })}
                    label="Soft alert sound"
                    hint="Play a short cue when new pending items appear (browser permitting)"
                  />
                </div>
              </div>

              <div className="as-card">
                <h3>Auto-refresh interval</h3>
                <p className="as-help">How often list pages may refresh in the background.</p>
                <div className="as-choice-grid as-choice-4">
                  {[15, 30, 60, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`as-choice ${prefs.autoRefreshSec === sec ? 'is-active' : ''}`}
                      onClick={() => patch({ autoRefreshSec: sec })}
                    >
                      {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'diagnostics' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Default review filter</h3>
                <p className="as-help">Preferred queue when opening Diagnostics.</p>
                <div className="as-choice-grid as-choice-4">
                  {(
                    [
                      ['pending', 'Pending'],
                      ['verified', 'Accepted'],
                      ['rejected', 'Denied'],
                      ['all', 'All'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`as-choice ${prefs.diagDefaultFilter === value ? 'is-active' : ''}`}
                      onClick={() => patch({ diagDefaultFilter: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="as-card">
                <h3>Review helpers</h3>
                <div className="as-toggle-list">
                  <Toggle
                    checked={prefs.diagHighlightUrgent}
                    onChange={(v) => patch({ diagHighlightUrgent: v })}
                    label="Highlight urgent cases"
                    hint="Mark severity 70+ detections in the queue"
                  />
                </div>
                <div className="as-cta-row">
                  <Link className="button compact" to="/admin/diagnoses">
                    Open diagnostics
                  </Link>
                  <Link className="button secondary compact" to="/admin/heatmap">
                    Outbreak map
                  </Link>
                </div>
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Access control</h3>
                <p className="as-help">
                  Email and password sign-in is enforced for every account. Role changes are written
                  to the audit log.
                </p>
                <div className="as-info-grid">
                  <div>
                    <span>Signed in as</span>
                    <strong>{user?.fullName || user?.email || 'Admin'}</strong>
                  </div>
                  <div>
                    <span>Role</span>
                    <strong>{user?.role || '—'}</strong>
                  </div>
                </div>
                <div className="as-cta-row">
                  {isAdmin && (
                    <Link className="button compact" to="/admin/users">
                      Manage users & roles
                    </Link>
                  )}
                  <Link className="button secondary compact" to="/admin/audit">
                    View audit log
                  </Link>
                </div>
              </div>

              <div className="as-card">
                <h3>Safety tips</h3>
                <ul className="as-bullets">
                  <li>Prefer expert accounts for day-to-day detection review.</li>
                  <li>Keep at least one admin account active.</li>
                  <li>Use deny reasons so farmers understand rejected detections.</li>
                </ul>
              </div>
            </div>
          )}

          {section === 'data' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Database backup</h3>
                <p className="as-help">
                  Queue a backup job. Production should connect Atlas snapshots or mongodump.
                </p>
                <button
                  type="button"
                  className="button"
                  disabled={busy || !isAdmin}
                  onClick={() => void triggerBackup()}
                >
                  {busy ? 'Queuing…' : 'Trigger backup'}
                </button>
                {!isAdmin && (
                  <p className="as-help">Only administrators can trigger backups.</p>
                )}
                {backupMsg && <p className="success">{backupMsg}</p>}
                {error && <p className="error">{error}</p>}
              </div>

              <div className="as-card">
                <h3>Related records</h3>
                <div className="as-link-list">
                  <Link to="/admin/audit">Audit & backup history</Link>
                  <Link to="/admin/knowledge">Knowledge library</Link>
                  <Link to="/admin/moderation">Community moderation</Link>
                </div>
              </div>
            </div>
          )}

          {section === 'shortcuts' && (
            <div className="as-stack">
              <div className="as-card">
                <h3>Jump to</h3>
                <div className="as-shortcut-grid">
                  <Link to="/admin" className="as-shortcut">
                    <strong>Dashboard</strong>
                    <span>KPIs & activity</span>
                  </Link>
                  <Link to="/admin/diagnoses" className="as-shortcut">
                    <strong>Diagnostics</strong>
                    <span>Accept or deny detections</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/users" className="as-shortcut">
                      <strong>Users</strong>
                      <span>Roles & accounts</span>
                    </Link>
                  )}
                  <Link to="/admin/heatmap" className="as-shortcut">
                    <strong>Outbreak map</strong>
                    <span>Field disease spread</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/moderation" className="as-shortcut">
                      <strong>Community</strong>
                      <span>Moderate posts</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin/knowledge" className="as-shortcut">
                      <strong>Knowledge</strong>
                      <span>Books & articles</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
