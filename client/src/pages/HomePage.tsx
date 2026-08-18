import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TownshipLocationPicker, placeCoords, type TownshipOption } from '../components/TownshipLocationPicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { homeCopy } from '../i18n/messages';
import { api } from '../services/api';
import { formatRegionLabel, formatTownshipLabel } from '../utils/localizeFarm';
import { readPreferredTownship, writePreferredTownship } from '../utils/preferredTownship';
import {
  IconBook,
  IconChat,
  IconCommunity,
  IconDetect,
  IconMap,
  IconPin,
  IconWeather,
} from '../components/icons';

type WeatherBundle = {
  township?: { name?: string; nameEn?: string; nameMy?: string; region?: string };
  weather?: {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      weathercode?: number[];
    };
  };
  alerts?: Array<{ type: string; date: string; message: string }>;
};

type Article = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  updatedAt?: string;
  createdAt?: string;
  views?: number;
};

type Post = {
  _id: string;
  content: string;
  images?: string[];
  likes?: string[];
  comments?: unknown[];
  createdAt?: string;
  userId?: { fullName?: string; email?: string };
  diagnosticId?: { disease?: string; severityIndex?: number; cropType?: string };
};

type HeatmapData = {
  features?: Array<{
    properties?: {
      name?: string;
      region?: string;
      outbreakCount?: number;
      riskLevel?: string;
      color?: string;
    };
  }>;
};

const FEATURE_ROUTES = [
  { to: '/detect', keys: ['detect', 'detectSub'] as const, Icon: IconDetect, tone: 'a' },
  { to: '/knowledge', keys: ['knowledge', 'knowledgeSub'] as const, Icon: IconBook, tone: 'b' },
  { to: '/weather', keys: ['weather', 'weatherSub'] as const, Icon: IconWeather, tone: 'c' },
  { to: '/heatmap', keys: ['heatmap', 'heatmapSub'] as const, Icon: IconMap, tone: 'd' },
  { to: '/chat', keys: ['chat', 'chatSub'] as const, Icon: IconChat, tone: 'e' },
  { to: '/social', keys: ['community', 'communitySub'] as const, Icon: IconCommunity, tone: 'f' },
] as const;

function weatherLabel(code?: number, rain?: number, lang: 'en' | 'my' = 'en') {
  if (lang === 'my') {
    if ((rain ?? 0) >= 5) return 'မိုးရွာနိုင်';
    if (code == null) return 'ကောင်းကင်ကြည်';
    if (code === 0) return 'ကောင်းကင်ကြည်';
    if (code <= 2) return 'တိမ်အနည်းငယ်';
    if (code <= 3) return 'တိမ်ထူ';
    if (code >= 61) return 'မိုး';
    return 'ကောင်း';
  }
  if ((rain ?? 0) >= 5) return 'Rain likely';
  if (code == null) return 'Clear sky';
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code <= 3) return 'Overcast';
  if (code >= 61) return 'Rain';
  return 'Fair';
}

function dayName(iso: string | undefined, index: number, t: ReturnType<typeof homeCopy>, lang: 'en' | 'my') {
  if (!iso) return index === 0 ? t.today : index === 1 ? t.tomorrow : lang === 'my' ? `နေ့ ${index + 1}` : `Day ${index + 1}`;
  if (index === 0) return t.today;
  if (index === 1) return t.tomorrow;
  return new Date(iso).toLocaleDateString(lang === 'my' ? 'my-MM' : 'en-US', { weekday: 'short' });
}

function timeAgo(iso: string | undefined, t: ReturnType<typeof homeCopy>) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return t.justNow;
  if (h < 24) return `${h} ${h === 1 ? t.hourAgo : t.hoursAgo}`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? t.dayAgo : t.daysAgo}`;
}

export function HomePage() {
  const { user, accessToken } = useAuth();
  const { lang } = useLanguage();
  const t = homeCopy(lang);
  const savedPlace = readPreferredTownship();
  const [township, setTownship] = useState(savedPlace?.nameEn || 'Yangon');
  const [townshipMy, setTownshipMy] = useState(savedPlace?.nameMy || (savedPlace?.nameEn ? '' : 'ရန်ကုန်'));
  const [region, setRegion] = useState(savedPlace?.region || 'Yangon');
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [diagnosticsCount, setDiagnosticsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [arts, heat] = await Promise.all([
          api<Article[]>('/knowledge/articles').catch(() => []),
          api<HeatmapData>('/heatmap/data').catch(() => null),
        ]);

        if (cancelled) return;
        setArticles(Array.isArray(arts) ? arts.slice(0, 3) : []);
        setHeatmap(heat);

        if (accessToken) {
          const [feed, history] = await Promise.all([
            api<Post[]>('/social/posts', { token: accessToken }).catch(() => []),
            api<unknown[]>('/detections/history', { token: accessToken }).catch(() => []),
          ]);
          if (cancelled) return;
          setPosts(Array.isArray(feed) ? feed.slice(0, 3) : []);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const monthCount = (history || []).filter((d) => {
            const created = (d as { createdAt?: string }).createdAt;
            return created && new Date(created) >= monthStart;
          }).length;
          setDiagnosticsCount(monthCount || (history?.length ?? 0));
        } else {
          setPosts([]);
          setDiagnosticsCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    void api<WeatherBundle>(`/weather/township/${encodeURIComponent(township)}`)
      .then((wx) => {
        if (cancelled) return;
        setWeather(wx);
        const place = wx?.township;
        if (place?.nameEn || place?.name) {
          if (place.nameMy) setTownshipMy(place.nameMy);
          if (place.region) setRegion(place.region);
        }
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [township]);

  function onTownshipSelect(tw: TownshipOption) {
    const nameEn = tw.nameEn || tw.name;
    const nameMy = tw.nameMy || '';
    const nextRegion = tw.region || 'Myanmar';
    const coords = placeCoords(tw);
    setTownship(nameEn);
    setTownshipMy(nameMy);
    setRegion(nextRegion);
    writePreferredTownship({
      nameEn,
      nameMy,
      region: nextRegion,
      lat: coords?.lat,
      lng: coords?.lng,
    });
  }

  const features = useMemo(
    () =>
      FEATURE_ROUTES.map(({ to, keys, Icon, tone }) => ({
        to,
        title: t[keys[0]],
        sub: t[keys[1]],
        Icon,
        tone,
      })),
    [t]
  );

  const locationLabel = useMemo(() => {
    const place = weather?.township as
      | { name?: string; nameEn?: string; nameMy?: string; region?: string }
      | undefined;
    const townName = place?.nameEn || place?.name || township;
    const townMy = place?.nameMy || townshipMy;
    const regionName = place?.region || region;
    const town = formatTownshipLabel(townName, townMy, lang);
    const regionLabel = formatRegionLabel(regionName, lang);
    return regionLabel ? `${town}, ${regionLabel}` : town;
  }, [weather, township, townshipMy, region, lang]);

  const currentTemp = weather?.weather?.current?.temperature_2m;
  const currentLabel = weatherLabel(
    weather?.weather?.current?.weather_code,
    weather?.weather?.daily?.precipitation_sum?.[0],
    lang
  );

  const hotspots = (heatmap?.features || []).filter(
    (f) => (f.properties?.outbreakCount || 0) > 0 || f.properties?.riskLevel === 'High'
  );
  const alertFeature = hotspots.sort(
    (a, b) => (b.properties?.outbreakCount || 0) - (a.properties?.outbreakCount || 0)
  )[0];
  const alertCount = weather?.alerts?.length || hotspots.length;
  const communityCount = posts.length;

  const daily = weather?.weather?.daily;
  const forecastDays = (daily?.time || []).slice(0, 4);

  return (
    <div className="home page-home">
      <div className="home-desk-hero">
        <section className="home-location-bar">
          <div className="home-location-top">
            <div className="home-location-left">
              <IconPin />
              <div>
                <strong>{locationLabel}</strong>
                <span>{weatherLoading || loading ? t.updating : t.liveFieldConditions}</span>
              </div>
            </div>
            <div className="home-location-right">
              <span className="temp">{currentTemp != null ? `${Math.round(currentTemp)}°C` : '—'}</span>
              <span className="cond">{currentLabel}</span>
            </div>
          </div>
          <TownshipLocationPicker
            className="home-loc-picker"
            currentName={township}
            currentNameMy={townshipMy}
            currentRegion={region}
            lang={lang}
            onSelect={onTownshipSelect}
            townshipLabel={t.chooseTownship}
            searchPlaceholder={t.searchTownships}
            listLabel={t.listTownships}
            closeLabel={t.closeList}
            emptyLabel={t.noTownship}
          />
          <p className="home-loc-hint">{t.vpnLocationHint}</p>
        </section>

        <section className="home-section home-stats-section">
          <div className="section-head">
            <h2>{t.dashboard}</h2>
            {!user && <Link to="/login">{t.signInForStats}</Link>}
          </div>
          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-label">{t.diagnostics}</span>
              <strong>{user ? diagnosticsCount : '—'}</strong>
              <span>{t.thisMonth}</span>
            </article>
            <article className="stat-card warn">
              <span className="stat-label">{t.activeAlerts}</span>
              <strong>{alertCount}</strong>
              <span>{t.inArea}</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">{t.diseaseHotspots}</span>
              <strong>{hotspots.length}</strong>
              <span>{t.townships}</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">{t.communityLabel}</span>
              <strong>{user ? communityCount : '—'}</strong>
              <span>{t.recentPosts}</span>
            </article>
          </div>
        </section>
      </div>

      <section className="home-section">
        <div className="feature-grid">
          {features.map(({ to, title, sub, Icon, tone }) => (
            <Link key={to} to={to} className={`feature-card tone-${tone}`}>
              <span className="feature-icon">
                <Icon />
              </span>
              <strong>{title}</strong>
              <span>{sub}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="home-desk-body">
        <div className="home-desk-main">
          <section className="home-section">
            <div className="section-head">
              <h2>{t.communityFeed}</h2>
              <Link to="/social">{t.openFeed}</Link>
            </div>

            {!user && (
              <div className="panel soft-empty">
                <p>{t.guestFeedHint}</p>
                <Link className="button" to="/login">
                  {t.loginToJoin}
                </Link>
              </div>
            )}

            {user && posts.length === 0 && (
              <div className="panel soft-empty">
                <p>{t.noPostsYet}</p>
                <Link className="button" to="/social">
                  {t.createPost}
                </Link>
              </div>
            )}

            <div className="feed-preview-list">
              {posts.map((p) => (
                <article key={p._id} className="feed-card">
                  <header>
                    <div className="avatar">
                      {(p.userId?.fullName || p.userId?.email || 'F').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong>{p.userId?.fullName || p.userId?.email?.split('@')[0] || (lang === 'my' ? 'လယ်သမား' : 'Farmer')}</strong>
                      <span className="muted">{timeAgo(p.createdAt, t)}</span>
                    </div>
                  </header>
                  <p>{p.content}</p>
                  {p.images && p.images.length > 0 && (
                    <div className="feed-thumbs">
                      {p.images.slice(0, 2).map((src) => (
                        <div key={src} className="thumb" style={{ backgroundImage: `url(${src})` }} />
                      ))}
                    </div>
                  )}
                  {p.diagnosticId && (
                    <div className="diag-chip">
                      <span>{t.diseaseLabel} {p.diagnosticId.disease}</span>
                      <span>{t.severityLabel} {p.diagnosticId.severityIndex ?? '—'}</span>
                    </div>
                  )}
                  <footer>
                    <span>{p.likes?.length || 0} {t.likes}</span>
                    <span>{p.comments?.length || 0} {t.replies}</span>
                    <Link to="/social">{t.view}</Link>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="home-desk-side">
          <section className="home-section">
            <div
              className={`alert-banner ${
                alertFeature?.properties?.riskLevel === 'High' || (alertFeature?.properties?.outbreakCount || 0) >= 10
                  ? 'critical'
                  : 'warning'
              }`}
            >
              <div className="alert-banner-top">
                <span className="pill danger">{t.diseaseAlert}</span>
                <span>{alertFeature?.properties?.region || 'Yangon Region'}</span>
              </div>
              <h3>
                {alertFeature
                  ? `${alertFeature.properties?.riskLevel || t.elevated} · ${alertFeature.properties?.name}`
                  : t.noOutbreak}
              </h3>
              <p>
                {alertFeature
                  ? `${alertFeature.properties?.outbreakCount || 0} ${t.reportsLinked} ${alertFeature.properties?.name}`
                  : t.noOutbreakHint}
              </p>
              <Link className="button secondary" to="/heatmap">
                {t.viewDetails}
              </Link>
            </div>
          </section>

          <section className="home-section">
            <div className="section-head">
              <h2>{t.knowledgeCenter}</h2>
              <Link to="/knowledge">{t.viewAll}</Link>
            </div>
            <div className="knowledge-rec-list">
              {articles.length === 0 && (
                <div className="panel soft-empty">
                  <p>No published articles yet. Admins can add guides in the knowledge console.</p>
                </div>
              )}
              {articles.map((a) => (
                <Link key={a._id} to="/knowledge" className="knowledge-rec-card">
                  <div className="knowledge-rec-icon">
                    <IconBook />
                  </div>
                  <div>
                    <strong>{a.title}</strong>
                    <span>
                      {a.category}
                      {a.updatedAt || a.createdAt
                        ? ` · ${new Date(a.updatedAt || a.createdAt || '').toLocaleDateString()}`
                        : ''}
                    </span>
                    {a.description && <p>{a.description.slice(0, 90)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-section">
            <div className="section-head">
              <h2>{t.liveWeather}</h2>
              <Link to="/weather">{t.full7Day}</Link>
            </div>
            <div className="weather-strip">
              {forecastDays.length === 0 && (
                <div className="panel soft-empty" style={{ gridColumn: '1 / -1' }}>
                  <p>
                    {lang === 'my'
                      ? 'ခန့်မှန်းချက် API ရရှိသောအခါ ရာသီဥတု ပေါ်ပါမည်။'
                      : 'Weather will appear when the forecast API is reachable.'}
                  </p>
                </div>
              )}
              {forecastDays.map((date, i) => (
                <article key={date} className="weather-day">
                  <strong>{dayName(date, i, t, lang)}</strong>
                  <span className="wx-temp">
                    {Math.round(daily?.temperature_2m_max?.[i] ?? 0)}°
                    <small> / {Math.round(daily?.temperature_2m_min?.[i] ?? 0)}°</small>
                  </span>
                  <span className="wx-cond">
                    {weatherLabel(daily?.weathercode?.[i], daily?.precipitation_sum?.[i], lang)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
