const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const STORAGE_KEY = 'smart_agro_auth';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  formData?: FormData;
  /** Internal: skip one retry after refresh */
  _retried?: boolean;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  category: 'Category',
  description: 'Description',
  content: 'Content',
  fileUrl: 'File / download link',
  author: 'Author',
  tags: 'Tags',
  isPublished: 'Published',
};

/** Turn API validation `details` into a readable checklist for the UI. */
export function formatApiValidation(details: unknown, fallback = 'Validation failed'): string {
  if (!details || typeof details !== 'object') return fallback;
  const d = details as { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
  const parts: string[] = [];
  if (Array.isArray(d.formErrors)) parts.push(...d.formErrors.filter(Boolean));
  if (d.fieldErrors) {
    for (const [key, msgs] of Object.entries(d.fieldErrors)) {
      if (!msgs?.length) continue;
      parts.push(`${FIELD_LABELS[key] || key}: ${msgs.join(', ')}`);
    }
  }
  return parts.length ? `Please fix: ${parts.join(' · ')}` : fallback;
}

type StoredAuth = {
  user?: unknown;
  accessToken?: string;
  refreshToken?: string;
};

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Rotate tokens via refresh; updates localStorage and notifies AuthContext. */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const stored = readStoredAuth();
    const refreshToken = stored?.refreshToken;
    if (!refreshToken) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('smartagro:auth-expired'));
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('smartagro:auth-expired'));
        return null;
      }

      const accessToken = json.data?.accessToken as string | undefined;
      const nextRefresh = (json.data?.refreshToken as string | undefined) || refreshToken;
      if (!accessToken) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('smartagro:auth-expired'));
        return null;
      }

      const next = {
        ...stored,
        accessToken,
        refreshToken: nextRefresh,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('smartagro:auth-refreshed', { detail: next }));
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body,
  });

  const json = await res.json().catch(() => ({}));

  // Auto-refresh once on expired access token, then retry
  if (
    res.status === 401 &&
    options.token &&
    !options._retried &&
    path !== '/auth/refresh-token' &&
    path !== '/auth/logout'
  ) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return api<T>(path, { ...options, token: nextToken, _retried: true });
    }
    throw new ApiError('Session expired. Please log in again.', 401, json.details);
  }

  if (!res.ok || json.success === false) {
    const raw = json.message || 'Request failed';
    const message =
      raw === 'Validation failed' || json.details
        ? formatApiValidation(json.details, raw)
        : raw === 'Invalid or expired access token'
          ? 'Session expired. Please log in again.'
          : raw;
    throw new ApiError(message, res.status, json.details);
  }
  return json.data as T;
}
