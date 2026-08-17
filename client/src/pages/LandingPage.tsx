import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { landingCopy } from '../i18n/messages';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  IconBook,
  IconChat,
  IconCommunity,
  IconDetect,
  IconWeather,
} from '../components/icons';

function Reveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`lp-reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let frame = 0;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

function TrustCounters({ t }: { t: ReturnType<typeof landingCopy> }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const rating = useCountUp(49, visible);
  const farmers = useCountUp(10000, visible);
  const yieldPct = useCountUp(30, visible);

  return (
    <div ref={ref} className={`lp-trust-grid lp-reveal ${visible ? 'is-visible' : ''}`}>
      <article>
        <strong>{(rating / 10).toFixed(1)}</strong>
        <span>{t.farmerRating}</span>
      </article>
      <article>
        <strong>{farmers.toLocaleString()}+</strong>
        <span>{t.fromGrowers}</span>
      </article>
      <article>
        <strong>+{yieldPct}%</strong>
        <span>{t.betterDecisions}</span>
      </article>
      <article>
        <strong>PWA</strong>
        <span>{t.mobileFirst}</span>
      </article>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = landingCopy(lang);

  return (
    <>
      {/* Hero — full bleed */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero-bg" aria-hidden>
          <div className="lp-hero-glow" />
          <svg className="lp-hero-art" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lpSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9fd4a8" />
                <stop offset="55%" stopColor="#4c8f5c" />
                <stop offset="100%" stopColor="#1b4332" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#lpSky)" />
            <ellipse cx="980" cy="140" rx="90" ry="90" fill="#ffe8a3" opacity="0.55" />
            <path d="M0 420 C220 340 420 400 620 360 C820 320 980 280 1200 320 L1200 800 L0 800 Z" fill="#1b4332" opacity="0.55" />
            <path d="M0 520 C260 470 480 540 720 500 C940 465 1080 520 1200 490 L1200 800 L0 800 Z" fill="#2d6a4f" opacity="0.7" />
            {[120, 200, 280, 360, 440, 520, 600, 680].map((x, i) => (
              <path
                key={x}
                d={`M${x} 720 Q${x - 12} 620 ${x + 6} 540`}
                stroke="#d8f3dc"
                strokeWidth="4"
                fill="none"
                opacity={0.35 + (i % 3) * 0.1}
              />
            ))}
          </svg>
        </div>

        <div className="lp-hero-content">
          <h1>{t.tagline}</h1>
          <p className="lp-hero-sub">{t.subtitle}</p>
          <div className="lp-hero-ctas">
            {user ? (
              <Link className="button" to="/social">
                {t.openApp}
              </Link>
            ) : (
              <Link className="button" to="/login">
                {t.member}
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          className="lp-scroll-cue"
          onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span>{t.scroll}</span>
          <span className="lp-scroll-arrow" aria-hidden />
        </button>
      </section>

      {/* Why */}
      <section id="why" className="lp-section">
        <Reveal>
          <h2>{t.why}</h2>
          <p className="lp-lead">{t.whyLead}</p>
        </Reveal>
        <div className="lp-why-grid">
          {[
            { Icon: IconDetect, title: t.whyDetect, text: t.whyDetectText },
            { Icon: IconChat, title: t.whyChat, text: t.whyChatText },
            { Icon: IconWeather, title: t.whyWeather, text: t.whyWeatherText },
            { Icon: IconCommunity, title: t.whyCommunity, text: t.whyCommunityText },
          ].map((item, i) => (
            <Reveal key={item.title} className={`lp-delay-${i}`}>
              <article className="lp-why-card">
                <span className="lp-why-icon">
                  <item.Icon />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Detection deep dive */}
      <section id="detect" className="lp-section lp-split">
        <Reveal>
          <div className="lp-visual-panel lp-detect-viz" aria-hidden>
            <div className="lp-detect-stage">
              <svg className="lp-detect-leaf" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lpLeafGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a5d6a7" />
                    <stop offset="100%" stopColor="#2e7d32" />
                  </linearGradient>
                </defs>
                <path
                  d="M100 18 C142 48 168 95 158 148 C148 198 118 222 100 228 C82 222 52 198 42 148 C32 95 58 48 100 18 Z"
                  fill="url(#lpLeafGrad)"
                />
                <path
                  d="M100 28 C100 28 100 210 100 220"
                  fill="none"
                  stroke="#1b5e20"
                  strokeWidth="2"
                  opacity="0.45"
                />
                <path
                  d="M100 70 C128 88 138 110 142 132 M100 110 C74 124 64 146 60 168 M100 150 C126 162 132 178 134 192"
                  fill="none"
                  stroke="#1b5e20"
                  strokeWidth="1.4"
                  opacity="0.35"
                />
                {/* disease spots that get “found” */}
                <circle className="lp-detect-spot s1" cx="118" cy="96" r="7" fill="#c62828" opacity="0.85" />
                <circle className="lp-detect-spot s2" cx="78" cy="130" r="5.5" fill="#ef6c00" opacity="0.9" />
                <circle className="lp-detect-spot s3" cx="112" cy="168" r="6" fill="#ad1457" opacity="0.8" />
              </svg>

              <span className="lp-detect-ring" />
              <span className="lp-detect-node n1" />
              <span className="lp-detect-node n2" />
              <span className="lp-detect-node n3" />
              <span className="lp-detect-chip c1">{lang === 'my' ? 'ဂုတ်ကျိုး' : 'Blast'}</span>
              <span className="lp-detect-chip c2">88%</span>
              <div className="lp-detect-status">
                <i />
                <span>{t.scanLabel}</span>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal className="lp-delay-1">
          <div className="lp-copy-panel">
            <p className="lp-eyebrow dark">{t.feature}</p>
            <h2>{t.detectTitle}</h2>
            <p className="lp-lead">{t.detectLead}</p>
            <ol className="lp-steps">
              <li>{t.detectStep1}</li>
              <li>{t.detectStep2}</li>
              <li>{t.detectStep3}</li>
            </ol>
            <Link className="button" to={user ? '/detect' : '/register'}>
              {t.tryDetect}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Weather + Heatmap */}
      <section id="weather" className="lp-section lp-split reverse">
        <Reveal>
          <div className="lp-copy-panel">
            <p className="lp-eyebrow dark">{t.feature}</p>
            <h2>{t.weatherTitle}</h2>
            <p className="lp-lead">{t.weatherLead}</p>
            <ul className="lp-bullets">
              <li>{t.weatherB1}</li>
              <li>{t.weatherB2}</li>
              <li>{t.weatherB3}</li>
            </ul>
            <div className="lp-inline-ctas">
              <Link className="button" to="/weather">
                {t.viewWeather}
              </Link>
              <Link className="button secondary" to="/heatmap">
                {t.viewHeatmap}
              </Link>
            </div>
          </div>
        </Reveal>
        <Reveal className="lp-delay-1">
          <div className="lp-visual-panel lp-map-panel" aria-hidden>
            <div className="lp-heat-viz">
              <svg className="lp-heat-outline" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
                {/* simplified Myanmar silhouette */}
                <path
                  d="M96 18 C118 22 132 40 138 62 C146 78 158 88 168 108 C176 128 172 148 160 164 C150 178 148 196 152 214 C154 228 146 242 128 248 C110 252 98 240 92 224 C84 236 70 242 56 236 C42 228 40 208 48 192 C40 178 34 160 38 142 C44 122 58 112 62 92 C66 70 74 48 86 32 C88 26 90 20 96 18 Z"
                  fill="#e8f5e9"
                  stroke="#81c784"
                  strokeWidth="2"
                />
              </svg>
              <span className="lp-heat-bloom b1" />
              <span className="lp-heat-bloom b2" />
              <span className="lp-heat-bloom b3" />
              <span className="lp-heat-pin p1" />
              <span className="lp-heat-pin p2" />
              <span className="lp-heat-pin p3" />
              <div className="lp-map-legend">
                <span>
                  <i className="lg-high" /> {t.high}
                </span>
                <span>
                  <i className="lg-mid" /> {t.medium}
                </span>
                <span>
                  <i className="lg-low" /> {t.low}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Knowledge */}
      <section id="knowledge" className="lp-section">
        <Reveal>
          <h2>{t.knowledgeTitle}</h2>
          <p className="lp-lead">{t.knowledgeLead}</p>
        </Reveal>
        <div className="lp-know-grid">
          {[
            { title: t.books, text: t.booksText },
            { title: t.articles, text: t.articlesText },
            { title: t.journals, text: t.journalsText },
          ].map((item, i) => (
            <Reveal key={item.title} className={`lp-delay-${i}`}>
              <article className="lp-know-card">
                <IconBook />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <Link className="button" to="/knowledge">
            {t.startReading}
          </Link>
        </Reveal>
      </section>

      {/* Chatbot */}
      <section id="chatbot" className="lp-section lp-split">
        <Reveal>
          <div className="lp-visual-panel lp-chat-demo">
            <div className="lp-bubble bot">
              {lang === 'my'
                ? 'မင်္ဂလာပါ — စပါးဂုတ်ကျိုးရောဂါ ကုသနည်း မေးနိုင်ပါတယ်။'
                : 'Hello — ask me how to treat Rice Blast.'}
            </div>
            <div className="lp-bubble user">
              {lang === 'my' ? 'စပါးဂုတ်ကျိုးကို ဘယ်လို ကုသမလဲ?' : 'How do I treat Rice Blast?'}
            </div>
            <div className="lp-bubble bot">Apply recommended fungicide and improve drainage…</div>
            <div className="lp-chat-bar">
              <span>{t.typeQuestion}</span>
              <span className="lp-send-hint">{t.send}</span>
            </div>
          </div>
        </Reveal>
        <Reveal className="lp-delay-1">
          <div className="lp-copy-panel">
            <p className="lp-eyebrow dark">{t.feature}</p>
            <h2>{t.chatTitle}</h2>
            <p className="lp-lead">{t.chatLead}</p>
            <ul className="lp-bullets">
              <li>{t.chatB1}</li>
              <li>{t.chatB2}</li>
              <li>{t.chatB3}</li>
            </ul>
            <Link className="button" to={user ? '/chat' : '/login'}>
              {t.tryChat}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Community */}
      <section id="community" className="lp-section">
        <Reveal>
          <h2>{t.communityTitle}</h2>
          <p className="lp-lead">{t.communityLead}</p>
        </Reveal>
        <Reveal>
          <article className="lp-feed-card">
            <header>
              <div className="avatar">U</div>
              <div>
                <strong>U Aung Myint</strong>
                <span>{t.hoursAgo}</span>
              </div>
            </header>
            <p>{t.feedSample}</p>
            <div className="lp-feed-meta">
              <span>{t.diseaseLinked}</span>
              <span>{t.likesReplies}</span>
            </div>
          </article>
        </Reveal>
        <Reveal>
          <Link className="button" to={user ? '/social' : '/register'}>
            {t.joinCommunity}
          </Link>
        </Reveal>
      </section>

      {/* Trust */}
      <section className="lp-section lp-trust">
        <Reveal>
          <h2>{t.trustTitle}</h2>
          <p className="lp-lead">{t.trustLead}</p>
        </Reveal>
        <TrustCounters t={t} />
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <Reveal>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaLead}</p>
          <div className="lp-hero-ctas">
            {user ? (
              <Link className="button" to="/social">
                {t.openApp}
              </Link>
            ) : (
              <Link className="button" to="/login">
                {t.loginAccount}
              </Link>
            )}
          </div>
        </Reveal>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-mark" aria-hidden>
              <BrandLogo size={40} decorative />
            </div>
            <div>
              <strong>SMART AGRO</strong>
              <p>{t.footerTagline}</p>
            </div>
          </div>

          <div className="lp-footer-cols">
            <div>
              <h4>{t.product}</h4>
              <Link to="/detect">{t.aiDetection}</Link>
              <Link to="/weather">{t.weather}</Link>
              <Link to="/knowledge">{t.knowledge}</Link>
              <Link to="/heatmap">{t.heatmap}</Link>
              <Link to="/social">{t.feed}</Link>
              <Link to="/chat">{t.chatbot}</Link>
            </div>
            <div>
              <h4>{t.company}</h4>
              <Link to="/faq">{t.faq}</Link>
              <Link to="/contact">{t.contactUs}</Link>
            </div>
            <div>
              <h4>{t.support}</h4>
              <Link to="/faq">{t.faq}</Link>
              <Link to="/login">{t.loginAccount}</Link>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>{t.madeFor}</span>
          <Link to="/faq">{t.help}</Link>
        </div>
      </footer>
    </>
  );
}
