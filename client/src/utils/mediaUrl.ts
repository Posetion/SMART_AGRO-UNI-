/** Resolve stored GridFS / API media paths for <img src>. */
export function mediaUrl(path?: string | null): string {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const apiBase = String(import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');

  // Absolute API host (cross-origin dev)
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      const origin = new URL(apiBase).origin;
      if (value.startsWith('/')) return `${origin}${value}`;
      if (value.startsWith('api/')) return `${origin}/${value}`;
      return `${apiBase}/${value.replace(/^\//, '')}`;
    } catch {
      /* fall through */
    }
  }

  // Relative API (Vite proxy): keep root-absolute /api/... paths
  if (value.startsWith('/')) return value;
  if (value.startsWith('api/')) return `/${value}`;
  return `${apiBase}/${value.replace(/^\//, '')}`;
}

const TONE_HEX: Record<string, string> = {
  mint: '#12b76a',
  sky: '#2e90fa',
  coral: '#f04438',
  amber: '#f79009',
  peach: '#fb6514',
  teal: '#15b79e',
};

/** Local SVG avatar when the user has no uploaded photo. */
export function fallbackAvatarDataUrl(name: string, tone = 'mint') {
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase();
  const bg = TONE_HEX[tone] || '#98a2b3';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="48" fill="${bg}"/>
  <text x="48" y="58" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${letter}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
