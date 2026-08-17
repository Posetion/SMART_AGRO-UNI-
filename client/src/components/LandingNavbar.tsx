import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { MailboxBell } from './MailboxBell';
import { useAuth } from '../context/AuthContext';
import type { Lang } from '../context/LanguageContext';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { navCopy } from '../i18n/messages';

/** App routes used when the farmer is logged in (laptop Home must open the dashboard). */
const APP_SECTION_ROUTES: Record<string, string> = {
  hero: '/home',
  detect: '/detect',
  weather: '/weather',
  knowledge: '/knowledge',
  chatbot: '/chat',
};

/** Section anchors on the landing page */
const SECTION_LINKS = [
  { id: 'hero', en: 'Home', my: 'ပင်မစာမျက်နှာ' },
  { id: 'detect', en: 'Detection', my: 'ရောဂါရှာ' },
  { id: 'weather', en: 'Weather', my: 'ရာသီဥတု' },
  { id: 'knowledge', en: 'Knowledge', my: 'ဗဟုသုတ' },
  { id: 'chatbot', en: 'BaGyi Pyoe', my: 'ဘကြီးပျိုး' },
] as const;

type Props = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
};

export function LandingNavbar({ lang, onLangChange }: Props) {
  const { user } = useAuth();
  const { progress, scrolled } = useScrollProgress();
  const location = useLocation();
  const navigate = useNavigate();
  const { requestLogout, dialog: logoutDialog } = useLogoutConfirm({
    afterLogout: () => navigate('/'),
  });
  const isLanding = location.pathname === '/';
  const onFeed = location.pathname === '/social';
  const onMessages = location.pathname === '/messages' || location.pathname.startsWith('/messages/');
  const t = navCopy(lang);

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeId, setActiveId] = useState('hero');
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || '';

  useEffect(() => {
    if (!isLanding) return;
    const ids = SECTION_LINKS.map((l) => l.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.1, 0.35, 0.6] }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [isLanding]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function homePath() {
    return user ? '/home' : '/';
  }

  function goHome() {
    setMenuOpen(false);
    const dest = homePath();
    if (location.pathname === dest) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(dest);
  }

  function goSection(id: string) {
    setMenuOpen(false);
    const appPath = user ? APP_SECTION_ROUTES[id] : undefined;
    if (appPath) {
      navigate(appPath);
      return;
    }
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate({ pathname: '/', hash: id });
    }
  }

  function isSectionActive(id: string) {
    if (user) {
      const path = APP_SECTION_ROUTES[id];
      return Boolean(path && location.pathname === path);
    }
    return isLanding && activeId === id;
  }

  function goFeed() {
    setMenuOpen(false);
    navigate('/social');
  }

  function goMessages() {
    setMenuOpen(false);
    navigate('/messages');
  }

  useEffect(() => {
    if (!isLanding || !location.hash) return;
    const id = location.hash.replace('#', '');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isLanding, location.hash]);

  const solid = scrolled || menuOpen || !isLanding;

  return (
    <>
      {isLanding && <div className="lp-progress" style={{ width: `${progress}%` }} aria-hidden />}

      <header className={`lp-nav ${solid ? 'is-solid' : ''}`}>
        <button type="button" className="lp-brand" onClick={goHome}>
          <span className="lp-brand-mark" aria-hidden>
            <BrandLogo size={34} decorative />
          </span>
          <span>
            <strong>SMART AGRO</strong>
            <small>{t.community}</small>
          </span>
        </button>

        <nav className="lp-nav-links" aria-label="Primary">
          {SECTION_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={isSectionActive(link.id) ? 'is-active' : undefined}
              onClick={() => goSection(link.id)}
            >
              {lang === 'en' ? link.en : link.my}
            </button>
          ))}
          <button type="button" className={onFeed ? 'is-active' : undefined} onClick={goFeed}>
            {t.feed}
          </button>
          {user && !user.isGuest && (
            <button type="button" className={onMessages ? 'is-active' : undefined} onClick={goMessages}>
              {t.messages}
            </button>
          )}
        </nav>

        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-lang"
            onClick={() => onLangChange(lang === 'en' ? 'my' : 'en')}
            aria-label={t.switchLang}
          >
            {lang === 'en' ? 'EN' : 'MY'}
          </button>

          <MailboxBell />

          {user ? (
            <div className="profile-menu" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
              >
                <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="profile-meta">
                  <span className="profile-name">{displayName}</span>
                  <span className="profile-online">{t.online}</span>
                </span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-head">
                    <strong>{displayName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                    {t.myProfile}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); goFeed(); }}>
                    {t.myFeed}
                  </button>
                  {user && !user.isGuest && (
                    <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); goMessages(); }}>
                      {t.messages}
                    </button>
                  )}
                  <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/detect'); }}>
                    {t.detectDisease}
                  </button>
                  {(user.role === 'admin' || user.role === 'expert') && (
                    <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/admin'); }}>
                      {t.admin}
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="danger-item"
                    onClick={() => {
                      setProfileOpen(false);
                      requestLogout();
                    }}
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="button compact lp-nav-cta" to="/login">
              {t.login}
            </Link>
          )}

          <button
            type="button"
            className={`lp-burger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((v) => !v);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`lp-mobile-drawer ${menuOpen ? 'is-open' : ''}`} role="dialog" aria-modal={menuOpen}>
        <nav className="lp-mobile-links" aria-label="Mobile">
          <p className="lp-mobile-group">{t.appPages}</p>
          <button
            type="button"
            className={location.pathname === '/home' || location.pathname === '/' ? 'is-active' : undefined}
            onClick={goHome}
          >
            {t.home}
          </button>
          <button
            type="button"
            className={location.pathname === '/detect' ? 'is-active' : undefined}
            onClick={() => {
              setMenuOpen(false);
              navigate('/detect');
            }}
          >
            {t.detectDisease}
          </button>
          <button
            type="button"
            className={location.pathname === '/weather' ? 'is-active' : undefined}
            onClick={() => {
              setMenuOpen(false);
              navigate('/weather');
            }}
          >
            {t.weather}
          </button>
          <button
            type="button"
            className={location.pathname === '/heatmap' ? 'is-active' : undefined}
            onClick={() => {
              setMenuOpen(false);
              navigate('/heatmap');
            }}
          >
            {t.heatmap}
          </button>
          <button
            type="button"
            className={location.pathname === '/knowledge' ? 'is-active' : undefined}
            onClick={() => {
              setMenuOpen(false);
              navigate('/knowledge');
            }}
          >
            {t.knowledge}
          </button>
          <button
            type="button"
            className={location.pathname === '/chat' ? 'is-active' : undefined}
            onClick={() => {
              setMenuOpen(false);
              navigate('/chat');
            }}
          >
            {t.chat}
          </button>
          <button type="button" className={onFeed ? 'is-active' : undefined} onClick={goFeed}>
            {t.feed}
          </button>
          {user && !user.isGuest && (
            <button type="button" className={onMessages ? 'is-active' : undefined} onClick={goMessages}>
              {t.messages}
            </button>
          )}
          {user && (
            <button
              type="button"
              className={location.pathname.startsWith('/profile') ? 'is-active' : undefined}
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
            >
              {t.myProfile}
            </button>
          )}
          {isLanding && (
            <>
              <p className="lp-mobile-group">{lang === 'en' ? 'About' : 'အကြောင်း'}</p>
              {SECTION_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className={activeId === link.id ? 'is-active' : undefined}
                  onClick={() => goSection(link.id)}
                >
                  {lang === 'en' ? link.en : link.my}
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="lp-mobile-auth">
          {user ? (
            <>
              <button type="button" className="button" onClick={goFeed}>
                {t.openFeed}
              </button>
              {!user.isGuest && (
                <button type="button" className="button secondary" onClick={goMessages}>
                  {t.messages}
                </button>
              )}
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setMenuOpen(false);
                  requestLogout();
                }}
              >
                {t.logout}
              </button>
            </>
          ) : (
            <Link className="button" to="/login" onClick={() => setMenuOpen(false)}>
              {t.login}
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="lp-drawer-backdrop"
          aria-label={t.closeMenu}
          onClick={() => setMenuOpen(false)}
        />
      )}
      {logoutDialog}
    </>
  );
}
