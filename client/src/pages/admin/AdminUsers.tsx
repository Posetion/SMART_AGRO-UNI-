import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { fallbackAvatarDataUrl, mediaUrl } from '../../utils/mediaUrl';

type Role = 'farmer' | 'expert' | 'admin';

type ApiUser = {
  _id: string;
  email: string;
  fullName?: string;
  role: Role;
  isActive?: boolean;
  isGuest?: boolean;
  hasPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  avatarTone?: string;
  location?: { township?: string; region?: string };
};

const ROLES: Role[] = ['farmer', 'expert', 'admin'];
const PAGE_SIZE = 10;

function displayName(u: ApiUser) {
  return u.fullName?.trim() || u.email.split('@')[0] || 'User';
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleLabel(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function UserAvatar({ user, name }: { user: ApiUser; name: string }) {
  const uploaded = mediaUrl(user.avatarUrl);
  const fallback = useMemo(
    () => fallbackAvatarDataUrl(name, user.avatarTone || 'mint'),
    [name, user.avatarTone]
  );
  const [src, setSrc] = useState(uploaded || fallback);

  useEffect(() => {
    setSrc(uploaded || fallback);
  }, [uploaded, fallback]);

  return (
    <span className="um-avatar-wrap" title={uploaded ? 'Profile photo' : 'Default avatar'}>
      <img
        className="um-avatar"
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setSrc((current) => (current === fallback ? current : fallback));
        }}
      />
    </span>
  );
}

export function AdminUsers() {
  const { accessToken, user: me } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [rolePanelId, setRolePanelId] = useState<string | null>(null);
  const [passwordUser, setPasswordUser] = useState<ApiUser | null>(null);
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!accessToken) return;
    try {
      const data = await api<ApiUser[]>('/admin/users', { token: accessToken });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuId(null);
        setRolePanelId(null);
      }
      if (filtersRef.current && !filtersRef.current.contains(target)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function setRole(id: string, role: Role) {
    if (!accessToken) return;
    setSaving(id);
    setError('');
    try {
      await api(`/admin/users/${id}`, {
        method: 'PUT',
        token: accessToken,
        body: { role },
      });
      const name = displayName(users.find((u) => u._id === id) || ({ email: 'User' } as ApiUser));
      setToast(`‘${name}’ role updated to ${roleLabel(role)}`);
      setMenuId(null);
      setRolePanelId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(null);
    }
  }

  function openPasswordModal(u: ApiUser) {
    if (u.isGuest) {
      setError('Guest accounts cannot have a password.');
      setMenuId(null);
      return;
    }
    setPasswordUser(u);
    setPasswordForm({ next: '', confirm: '' });
    setPasswordError('');
    setMenuId(null);
    setRolePanelId(null);
  }

  async function saveUserPassword() {
    if (!accessToken || !passwordUser) return;
    setPasswordError('');
    if (passwordForm.next.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api(`/admin/users/${passwordUser._id}/password`, {
        method: 'PUT',
        token: accessToken,
        body: { password: passwordForm.next },
      });
      setToast(`Password updated for ‘${displayName(passwordUser)}’`);
      setPasswordUser(null);
      setPasswordForm({ next: '', confirm: '' });
      await load();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function deleteAccount(u: ApiUser) {
    if (!accessToken) return;
    if (me?.id && u._id === me.id) {
      setError('You cannot delete your own account.');
      setMenuId(null);
      return;
    }
    const label = displayName(u);
    const ok = window.confirm(
      `Delete account for ${label}?\n\nThis permanently removes the user and cannot be undone.`
    );
    if (!ok) return;

    setDeleting(u._id);
    setError('');
    try {
      await api(`/admin/users/${u._id}`, {
        method: 'DELETE',
        token: accessToken,
      });
      setToast(`‘${label}’ account deleted`);
      setMenuId(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(u._id);
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.location?.region || '').toLowerCase().includes(q) ||
        (u.location?.township || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds = pageRows.map((u) => u._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<Role, number> = { farmer: 0, expert: 0, admin: 0 };
    for (const u of users) {
      if (u.role in counts) counts[u.role] += 1;
    }
    return counts;
  }, [users]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  return (
    <div className="um-page">
      <header className="um-head">
        <div className="um-head-main">
          <h1>User management</h1>
          <p>Manage your team members and their account permissions here.</p>
        </div>
        <div className="um-head-count" aria-live="polite">
          <strong>{users.length}</strong>
          <span>{users.length === 1 ? 'user' : 'users'}</span>
        </div>
      </header>

      <div className="um-role-counts" aria-label="Users by role">
        <button
          type="button"
          className={`um-role-chip role-farmer ${roleFilter === 'farmer' ? 'is-active' : ''}`}
          onClick={() => setRoleFilter((r) => (r === 'farmer' ? 'all' : 'farmer'))}
        >
          Farmers <b>{roleCounts.farmer}</b>
        </button>
        <button
          type="button"
          className={`um-role-chip role-expert ${roleFilter === 'expert' ? 'is-active' : ''}`}
          onClick={() => setRoleFilter((r) => (r === 'expert' ? 'all' : 'expert'))}
        >
          Experts <b>{roleCounts.expert}</b>
        </button>
        <button
          type="button"
          className={`um-role-chip role-admin ${roleFilter === 'admin' ? 'is-active' : ''}`}
          onClick={() => setRoleFilter((r) => (r === 'admin' ? 'all' : 'admin'))}
        >
          Admins <b>{roleCounts.admin}</b>
        </button>
      </div>

      <section className="um-card">
        <div className="um-card-top">
          <div className="um-title-row">
            <h2>All users</h2>
            <span className="um-count" title="Total users">
              {users.length}
            </span>
          </div>
          <div className="um-tools">
            <label className="um-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                aria-label="Search users"
              />
            </label>
            <div className="um-filters" ref={filtersRef}>
              <button
                type="button"
                className={`um-filter-btn ${filtersOpen || roleFilter !== 'all' ? 'is-active' : ''}`}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                  <path
                    d="M4 6h16M7 12h10M10 18h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Filters
              </button>
              {filtersOpen && (
                <div className="um-filter-menu">
                  <p>Role</p>
                  {(['all', ...ROLES] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={roleFilter === role ? 'is-active' : ''}
                      onClick={() => {
                        setRoleFilter(role);
                        setFiltersOpen(false);
                      }}
                    >
                      {role === 'all' ? 'All roles' : roleLabel(role)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="um-error">{error}</p>}

        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-check">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Select all on this page"
                  />
                </th>
                <th>User name</th>
                <th>Access</th>
                <th>Last active</th>
                <th>Date added</th>
                <th className="um-menu-col" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => {
                const isSelf = Boolean(me?.id && u._id === me.id);
                const busy = saving === u._id || deleting === u._id;
                const open = menuId === u._id;
                const name = displayName(u);
                return (
                  <tr key={u._id} className={selected.has(u._id) ? 'is-selected' : ''}>
                    <td className="um-check">
                      <input
                        type="checkbox"
                        checked={selected.has(u._id)}
                        onChange={() => toggleOne(u._id)}
                        aria-label={`Select ${name}`}
                      />
                    </td>
                    <td>
                      <div className="um-user">
                        <UserAvatar key={`${u._id}-${u.avatarUrl || 'none'}`} user={u} name={name} />
                        <div className="um-user-text">
                          <strong>{name}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`um-badge role-${u.role}`}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="um-date">{formatDate(u.updatedAt || u.createdAt)}</td>
                    <td className="um-date">{formatDate(u.createdAt)}</td>
                    <td className="um-menu-col">
                      <div className="um-menu-wrap" ref={open ? menuRef : undefined}>
                        <button
                          type="button"
                          className="um-kebab"
                          aria-label={`Actions for ${name}`}
                          aria-expanded={open}
                          disabled={busy}
                          onClick={() => {
                            setMenuId(open ? null : u._id);
                            setRolePanelId(null);
                          }}
                        >
                          <span />
                          <span />
                          <span />
                        </button>
                        {open && (
                          <div className="um-menu">
                            <button
                              type="button"
                              className={rolePanelId === u._id ? 'is-active' : ''}
                              onClick={() =>
                                setRolePanelId((prev) => (prev === u._id ? null : u._id))
                              }
                            >
                              Change role
                            </button>
                            {rolePanelId === u._id && (
                              <div className="um-role-list">
                                {ROLES.map((role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    disabled={busy || u.role === role}
                                    onClick={() => void setRole(u._id, role)}
                                  >
                                    {roleLabel(role)}
                                    {u.role === role ? ' · current' : ''}
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={busy || Boolean(u.isGuest)}
                              title={
                                u.isGuest
                                  ? 'Guest accounts cannot have a password'
                                  : u.hasPassword
                                    ? 'Reset password'
                                    : 'Set password'
                              }
                              onClick={() => openPasswordModal(u)}
                            >
                              {u.hasPassword ? 'Reset password' : 'Set password'}
                            </button>
                            <button
                              type="button"
                              className="danger"
                              disabled={busy || isSelf}
                              title={isSelf ? 'You cannot delete your own account' : 'Delete account'}
                              onClick={() => void deleteAccount(u)}
                            >
                              {deleting === u._id ? 'Deleting…' : 'Delete account'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="um-empty">No users match this search.</div>
          )}
        </div>

        {filtered.length > 0 && (
          <footer className="um-pager">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <div className="um-pages">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === safePage ? 'is-active' : ''}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </button>
          </footer>
        )}
      </section>

      {toast && (
        <div className="um-toast" role="status">
          {toast}
        </div>
      )}

      {passwordUser && (
        <div
          className="um-modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!passwordSaving) setPasswordUser(null);
          }}
        >
          <div
            className="um-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Set user password"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <h2>{passwordUser.hasPassword ? 'Reset password' : 'Set password'}</h2>
                <p>
                  {displayName(passwordUser)} · {passwordUser.email}
                </p>
              </div>
              <button
                type="button"
                className="button secondary compact"
                disabled={passwordSaving}
                onClick={() => setPasswordUser(null)}
              >
                Close
              </button>
            </header>
            <div className="um-modal-body">
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                  placeholder="At least 8 characters"
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </label>
              {passwordError && <p className="um-error">{passwordError}</p>}
              <div className="um-modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={passwordSaving}
                  onClick={() => setPasswordUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={passwordSaving || !passwordForm.next}
                  onClick={() => void saveUserPassword()}
                >
                  {passwordSaving ? 'Saving…' : 'Save password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
