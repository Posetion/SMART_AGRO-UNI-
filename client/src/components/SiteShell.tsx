import { Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LandingNavbar } from './LandingNavbar';

/** Single shared site navbar (landing + app pages). No duplicate farmer top nav. */
export function SiteShell() {
  const { lang, setLang } = useLanguage();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className={isLanding ? 'landing' : 'farmer-shell no-bottom-nav site-app'}>
      <LandingNavbar lang={lang} onLangChange={setLang} />
      {isLanding ? (
        <div className="landing-scroll">
          <Outlet context={{ lang }} />
        </div>
      ) : (
        <main
          className={`farmer-main ${
            pathname === '/messages' || pathname.startsWith('/messages/')
              ? 'farmer-main-wide farmer-main-chat'
              : pathname === '/home' ||
                  pathname === '/social' ||
                  pathname === '/weather' ||
                  pathname === '/knowledge' ||
                  pathname.startsWith('/profile') ||
                  pathname === '/chat' ||
                  pathname === '/heatmap' ||
                  pathname === '/detect' ||
                  pathname === '/faq'
                ? 'farmer-main-wide'
                : ''
          }`}
        >
          <Outlet context={{ lang }} />
        </main>
      )}
    </div>
  );
}
