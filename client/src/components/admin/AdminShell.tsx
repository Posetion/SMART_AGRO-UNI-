import { useRef, useState, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { AdminMailboxBell } from './AdminMailboxBell';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

const adminPrimary = [
  { to: '/admin', label: 'Dashboard', end: true, tone: 'mint' as Tone, Icon: IconDash },
  { to: '/admin/knowledge', label: 'Knowledge', end: false, tone: 'amber' as Tone, Icon: IconBook },
  { to: '/admin/users', label: 'Users', end: false, tone: 'sky' as Tone, Icon: IconUsers },
  { to: '/admin/diagnoses', label: 'Diagnostics', end: false, tone: 'coral' as Tone, Icon: IconDiag },
  { to: '/admin/settings', label: 'Settings', end: false, tone: 'teal' as Tone, Icon: IconGear },
];

const adminSecondary = [
  { to: '/admin/moderation', label: 'Community', Icon: IconChat },
  { to: '/admin/heatmap', label: 'Outbreak map', Icon: IconMap },
  { to: '/admin/audit', label: 'Audit log', Icon: IconAudit },
];

const expertLinks = [
  { to: '/admin', label: 'Dashboard', end: true, tone: 'mint' as Tone, Icon: IconDash },
  { to: '/admin/diagnoses', label: 'Diagnostics', end: false, tone: 'coral' as Tone, Icon: IconDiag },
  { to: '/admin/heatmap', label: 'Outbreak map', end: false, tone: 'peach' as Tone, Icon: IconMap },
];

function SoftIcon({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`ad-ico ${tone}`}>{children}</span>;
}

export function AdminShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestLogout, dialog: logoutDialog } = useLogoutConfirm({
    afterLogout: () => navigate('/login'),
  });
  const isAdmin = user?.role === 'admin';
  const primary = isAdmin ? adminPrimary : expertLinks;
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  const bottomLinks = isAdmin
    ? [
        adminPrimary[0],
        adminPrimary[3],
        adminPrimary[1],
        { to: '#more', label: 'More', end: false, tone: 'teal' as Tone, Icon: IconMenu },
      ]
    : [
        ...expertLinks.slice(0, 2),
        { to: '#more', label: 'More', end: false, tone: 'teal' as Tone, Icon: IconMenu },
      ];

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="ad-side-glow" aria-hidden />
        <div className="ad-side-grain" aria-hidden />

        <div className="ad-side-brand">
          <div className="ad-side-mark" aria-hidden>
            <BrandLogo size={36} decorative />
          </div>
          <div>
            <div className="ad-side-title">
              Smart Agro <span>Admin</span>
            </div>
            <p className="ad-side-sub">Field operations console</p>
          </div>
        </div>

        <div className="ad-side-role">
          <span className="ad-side-role-dot" aria-hidden />
          <span>{isAdmin ? 'Administrator' : 'Expert reviewer'}</span>
        </div>

        <nav className="ad-nav" aria-label="Admin">
          <div className="ad-nav-label">Workspace</div>
          {primary.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`}
            >
              <SoftIcon tone={l.tone}>
                <l.Icon />
              </SoftIcon>
              <span>{l.label}</span>
              <em className="ad-nav-chev" aria-hidden />
            </NavLink>
          ))}
        </nav>

        {isAdmin && (
          <nav className="ad-nav ad-nav-secondary" aria-label="More">
            <div className="ad-nav-label">Operations</div>
            {adminSecondary.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`}
              >
                <SoftIcon tone="teal">
                  <l.Icon />
                </SoftIcon>
                <span>{l.label}</span>
                <em className="ad-nav-chev" aria-hidden />
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ad-side-foot">
          <div className="ad-side-user">
            <span className="ad-side-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{displayName}</strong>
              <small>{user?.email || user?.role}</small>
            </div>
          </div>
          <div className="ad-side-actions">
            <Link className="ad-side-link" to="/">
              <IconHome />
              <span>Farmer app</span>
            </Link>
            <button type="button" className="ad-side-logout" onClick={requestLogout}>
              <IconLogout />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="ad-topbar">
          <div className="ad-topbar-left">
            <button
              type="button"
              className="ad-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="ad-mobile-nav"
              onClick={() => setNavOpen((v) => !v)}
            >
              <IconMenu />
              <span>Workspace</span>
            </button>
            <div className="ad-topbar-title">
              <BrandLogo size={28} decorative />
              <div>
                <strong>Smart Agro Community</strong>
                <span>Admin Panel</span>
              </div>
            </div>
          </div>
          <div className="ad-topbar-actions">
            <AdminMailboxBell />
            <div className="ad-profile" ref={menuRef}>
              <button
                type="button"
                className="ad-profile-btn"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span>
                  <strong>{displayName}</strong>
                  <small>{user?.role}</small>
                </span>
              </button>
              {menuOpen && (
                <div className="ad-profile-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/'); }}>
                    Farmer app
                  </button>
                  {isAdmin && (
                    <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/admin/settings'); }}>
                      Settings
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="danger-item"
                    onClick={() => {
                      setMenuOpen(false);
                      requestLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <Outlet />
      </div>

      {navOpen && (
        <div
          className="ad-mobile-nav-backdrop"
          role="presentation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        id="ad-mobile-nav"
        className={`ad-mobile-nav${navOpen ? ' is-open' : ''}`}
        aria-hidden={!navOpen}
      >
        <header className="ad-mobile-nav-head">
          <div>
            <strong>Workspace</strong>
            <span>{isAdmin ? 'All admin pages' : 'Expert pages'}</span>
          </div>
          <button type="button" className="ad-mobile-nav-close" onClick={() => setNavOpen(false)} aria-label="Close">
            ×
          </button>
        </header>
        <nav className="ad-mobile-nav-links" aria-label="Mobile workspace">
          <p className="ad-mobile-nav-label">Workspace</p>
          {(isAdmin ? adminPrimary : expertLinks).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `ad-mobile-nav-link${isActive ? ' active' : ''}`}
              onClick={() => setNavOpen(false)}
            >
              <SoftIcon tone={l.tone}>
                <l.Icon />
              </SoftIcon>
              <span>{l.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <p className="ad-mobile-nav-label">Operations</p>
              {adminSecondary.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => `ad-mobile-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setNavOpen(false)}
                >
                  <SoftIcon tone="teal">
                    <l.Icon />
                  </SoftIcon>
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="ad-mobile-nav-foot">
          <Link to="/" onClick={() => setNavOpen(false)}>
            Farmer app
          </Link>
          <button type="button" onClick={() => { setNavOpen(false); requestLogout(); }}>
            Logout
          </button>
        </div>
      </aside>

      <nav className="bottom-nav ad-bottom">
        {bottomLinks.map((l) =>
          l.to === '#more' ? (
            <button
              key="more"
              type="button"
              className={navOpen ? 'active' : undefined}
              onClick={() => setNavOpen(true)}
            >
              <l.Icon />
              <span>More</span>
            </button>
          ) : (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <l.Icon />
              <span>{l.label.split(' ')[0]}</span>
            </NavLink>
          )
        )}
      </nav>
      {logoutDialog}
    </div>
  );
}

function svgProps(size = 18) {
  return { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': true as const };
}

function IconMenu() {
  return (
    <svg {...svgProps()}>
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconDash() {
  return (
    <svg {...svgProps()}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg {...svgProps()}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 5.5V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg {...svgProps()}>
      <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 18.5c.8-2.6 2.8-4 5.2-4s4.3 1.4 5 3.6M14 14.5c1.6.2 3.1 1.1 3.8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconDiag() {
  return (
    <svg {...svgProps()}>
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5v2.2M12 18.3V21M3.5 12h2.2M18.3 12H21M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M5.8 18.2l1.6-1.6M16.6 7.4l1.6-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg {...svgProps()}>
      <path d="M5 16.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9l-4 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg {...svgProps()}>
      <path d="M4 7.5 9.5 5l5 2.5L20 5v13.5L14.5 21l-5-2.5L4 21V7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconAudit() {
  return (
    <svg {...svgProps()}>
      <path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg {...svgProps(16)}>
      <path d="M4 11.5 12 5l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20v-8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 21.5v-6h4v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg {...svgProps(16)}>
      <path d="M10 12h9M15.5 8.5 19 12l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7V6.5A2.5 2.5 0 0 0 10.5 4h-5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h5A2.5 2.5 0 0 0 13 17.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
