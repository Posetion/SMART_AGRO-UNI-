import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ALL_DETECT_LABELS,
  ALL_PESTS,
  diseaseNameMy,
  formatDiseaseLabel,
} from '../../data/diseaseNames';
import { api } from '../../services/api';
import { mediaUrl } from '../../utils/mediaUrl';

type Farmer = { _id?: string; email?: string; fullName?: string; role?: string; avatarUrl?: string };

type Diagnosis = {
  _id: string;
  cropType: string;
  disease: string;
  aiDetectedDisease?: string;
  diseaseCorrected?: boolean;
  severityIndex: number;
  treatmentProtocol?: string;
  expertSuggestion?: string;
  expertBooks?: string;
  expertDrugs?: string;
  isVerified: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  reapprovalNote?: string;
  reapprovalRequestedAt?: string;
  reviewRequested?: boolean;
  reviewRequestedAt?: string;
  imageUrl?: string;
  userId?: Farmer | string;
  createdAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  verifiedBy?: Farmer | string;
  rejectedBy?: Farmer | string;
  probabilities?: Array<{ disease?: string; probability?: number }>;
  location?: { type?: string; coordinates?: [number, number] };
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    rainfall?: number;
    windSpeed?: number;
  };
  prediction?: { riskLevel?: string; forecastDays?: number; confidence?: number };
};

type Filter = 'pending' | 'verified' | 'rejected' | 'all';

const PEST_SET = new Set<string>(ALL_PESTS);

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

function farmerLabel(user?: Farmer | string) {
  if (!user || typeof user === 'string') return 'Farmer';
  return user.fullName?.trim() || user.email || 'Farmer';
}

function pct(n?: number) {
  if (n == null || Number.isNaN(n)) return '—';
  const value = n <= 1 ? n * 100 : n;
  return `${Math.round(value)}%`;
}

function statusOf(d: Diagnosis): 'verified' | 'rejected' | 'pending' {
  if (d.isVerified) return 'verified';
  if (d.isRejected) return 'rejected';
  return 'pending';
}

function labelWithMy(name: string) {
  const my = diseaseNameMy(name);
  return my && my !== name ? `${name} · ${my}` : name;
}

function loadDiagPrefs() {
  try {
    const raw = localStorage.getItem('smart_agro_admin_prefs');
    if (!raw) return { filter: 'pending' as Filter, highlightUrgent: true };
    const prefs = JSON.parse(raw) as {
      diagDefaultFilter?: Filter;
      diagHighlightUrgent?: boolean;
    };
    const filter = prefs.diagDefaultFilter || 'pending';
    return {
      filter:
        filter === 'verified' || filter === 'rejected' || filter === 'all' || filter === 'pending'
          ? filter
          : ('pending' as Filter),
      highlightUrgent: prefs.diagHighlightUrgent !== false,
    };
  } catch {
    return { filter: 'pending' as Filter, highlightUrgent: true };
  }
}

export function AdminDiagnoses() {
  const { accessToken } = useAuth();
  const initialPrefs = useMemo(() => loadDiagPrefs(), []);
  const [items, setItems] = useState<Diagnosis[]>([]);
  const [filter, setFilter] = useState<Filter>(initialPrefs.filter);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Diagnosis | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [correctDisease, setCorrectDisease] = useState('');
  const [severityEdit, setSeverityEdit] = useState(0);
  const [expertBooks, setExpertBooks] = useState('');
  const [expertDrugs, setExpertDrugs] = useState('');
  const [expertSuggestion, setExpertSuggestion] = useState('');
  const [treatmentEdit, setTreatmentEdit] = useState('');

  function resetReviewForm(d?: Diagnosis | null) {
    setShowDenyForm(false);
    setDenyReason('');
    const allowed = new Set<string>(ALL_DETECT_LABELS);
    const disease =
      d?.disease && allowed.has(d.disease)
        ? d.disease
        : d?.aiDetectedDisease && allowed.has(d.aiDetectedDisease)
          ? d.aiDetectedDisease
          : 'Healthy';
    setCorrectDisease(disease);
    setSeverityEdit(d?.severityIndex ?? 0);
    setExpertBooks(d?.expertBooks || '');
    setExpertDrugs(d?.expertDrugs || '');
    setExpertSuggestion(d?.expertSuggestion || '');
    setTreatmentEdit(d?.treatmentProtocol || '');
  }

  async function load() {
    if (!accessToken) return;
    try {
      const q = filter === 'all' ? '?status=all' : `?status=${filter}`;
      const data = await api<Diagnosis[]>(`/detections/review${q}`, { token: accessToken });
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagnoses');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken, filter]);

  useEffect(() => {
    if (!accessToken || !reviewId) {
      setDetail(null);
      resetReviewForm(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setError('');
    void api<Diagnosis>(`/detections/${reviewId}`, { token: accessToken })
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          resetReviewForm(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load diagnosis');
          setReviewId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reviewId]);

  const diseaseChanged = Boolean(
    detail && correctDisease && correctDisease !== (detail.aiDetectedDisease || detail.disease)
  );

  async function accept() {
    if (!accessToken || !detail) return;
    if (!correctDisease) {
      setError('Select the correct disease or pest before accepting.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(`/detections/${detail._id}/verify`, {
        method: 'POST',
        token: accessToken,
        body: {
          disease: correctDisease,
          severityIndex: severityEdit,
          treatmentProtocol: treatmentEdit.trim() || undefined,
          expertBooks: expertBooks.trim(),
          expertDrugs: expertDrugs.trim(),
          expertSuggestion: expertSuggestion.trim(),
        },
      });
      setReviewId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    } finally {
      setBusy(false);
    }
  }

  async function deny() {
    if (!accessToken || !detail) return;
    const reason = denyReason.trim();
    if (reason.length < 3) {
      setError('Please enter a reason (at least 3 characters) before denying.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(`/detections/${detail._id}/reject`, {
        method: 'POST',
        token: accessToken,
        body: { reason },
      });
      setReviewId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deny failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    if (!window.confirm('Delete this diagnosis? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api(`/detections/${id}`, { method: 'DELETE', token: accessToken });
      if (reviewId === id) setReviewId(null);
      setItems((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = useMemo(
    () => items.filter((d) => statusOf(d) === 'pending').length,
    [items]
  );

  const coords = detail?.location?.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length >= 2 && (coords[0] !== 0 || coords[1] !== 0);
  const imageSrc = detail?.imageUrl ? mediaUrl(detail.imageUrl) : '';
  const aiOriginal = detail?.aiDetectedDisease || detail?.disease || '';

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <div>
          <h1>Diagnostics Review</h1>
          <p>
            Accept or deny detections, correct disease/pest labels, and add drug or book suggestions
            for farmers.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="pending">Pending</option>
          <option value="verified">Accepted</option>
          <option value="rejected">Denied</option>
          <option value="all">All</option>
        </select>
      </header>

      {filter === 'pending' && (
        <div className="ad-badge warn" style={{ width: 'fit-content' }}>
          Pending review: {pendingCount} diagnostics
        </div>
      )}

      <div className="ad-panel">
        {error && !reviewId && <p className="error">{error}</p>}
        <ul className="ad-diag-queue">
          {items.map((d) => {
            const status = statusOf(d);
            const urgent =
              initialPrefs.highlightUrgent && status === 'pending' && d.severityIndex >= 70;
            return (
              <li key={d._id} className={urgent ? 'is-urgent' : undefined}>
                <span
                  className={`ad-ico ${
                    status === 'verified' ? 'mint' : status === 'rejected' ? 'coral' : urgent ? 'coral' : 'amber'
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                    <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <div>
                  <strong>
                    {d.disease} · {d.cropType}
                    {d.diseaseCorrected ? ' · corrected' : ''}
                  </strong>
                  <span>
                    {farmerLabel(d.userId)} · severity {d.severityIndex}
                    {d.prediction?.riskLevel ? ` · ${d.prediction.riskLevel}` : ''} ·{' '}
                    {timeAgo(d.createdAt)}
                  </span>
                  {d.reapprovalNote && (
                    <p className="ad-diag-note">Reapproval: {d.reapprovalNote.slice(0, 140)}</p>
                  )}
                  {(d.expertDrugs || d.expertBooks || d.expertSuggestion) && !d.reapprovalNote && (
                    <p className="ad-diag-note">
                      Expert: {(d.expertDrugs || d.expertBooks || d.expertSuggestion || '').slice(0, 160)}
                    </p>
                  )}
                  {d.treatmentProtocol && !d.reapprovalNote && !d.expertDrugs && !d.expertBooks && (
                    <p className="ad-diag-note">{d.treatmentProtocol.slice(0, 160)}</p>
                  )}
                </div>
                <div className="ad-diag-actions">
                  <span
                    className={`pill ${
                      status === 'verified' ? 'ok' : status === 'rejected' ? 'danger' : d.reapprovalNote ? 'ok' : 'warn'
                    }`}
                  >
                    {status === 'verified'
                      ? 'Accepted'
                      : status === 'rejected'
                        ? 'Denied'
                        : d.reapprovalNote
                          ? 'Reapproval'
                          : urgent
                            ? 'Urgent'
                            : 'Pending'}
                  </span>
                  <button
                    type="button"
                    className="button compact"
                    disabled={busy}
                    onClick={() => setReviewId(d._id)}
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    className="button danger compact"
                    disabled={busy}
                    onClick={() => void remove(d._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {items.length === 0 && <div className="empty-state">No diagnoses in this queue.</div>}
      </div>

      {reviewId && (
        <div
          className="ad-diag-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setReviewId(null);
          }}
        >
          <div
            className="ad-diag-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ad-diag-review-title"
          >
            <header className="ad-diag-modal-head">
              <div>
                <p className="muted">Detection review</p>
                <h2 id="ad-diag-review-title">
                  {detail ? `${detail.disease} · ${detail.cropType}` : 'Loading…'}
                </h2>
              </div>
              <button
                type="button"
                className="ad-diag-close"
                aria-label="Close"
                disabled={busy}
                onClick={() => setReviewId(null)}
              >
                ×
              </button>
            </header>

            {detailLoading && <p className="ad-diag-loading">Loading detection details…</p>}
            {error && reviewId && <p className="error ad-diag-error">{error}</p>}

            {detail && !detailLoading && (
              <>
                <div className="ad-diag-modal-body">
                  <div className="ad-diag-media">
                    {imageSrc ? (
                      <img src={imageSrc} alt={`${detail.cropType} leaf detection`} />
                    ) : (
                      <div className="ad-diag-media-empty">No leaf image</div>
                    )}
                    {imageSrc && (
                      <a href={imageSrc} target="_blank" rel="noreferrer">
                        Open full image
                      </a>
                    )}
                  </div>

                  <div className="ad-diag-details">
                    <section>
                      <h3>Plant detection</h3>
                      <dl className="ad-diag-grid">
                        <div>
                          <dt>Crop</dt>
                          <dd>{detail.cropType}</dd>
                        </div>
                        <div>
                          <dt>AI label</dt>
                          <dd>{formatDiseaseLabel(aiOriginal, 'en')}</dd>
                        </div>
                        <div>
                          <dt>Current label</dt>
                          <dd>{formatDiseaseLabel(detail.disease, 'en')}</dd>
                        </div>
                        <div>
                          <dt>Severity</dt>
                          <dd>{detail.severityIndex}/100</dd>
                        </div>
                        <div>
                          <dt>Risk level</dt>
                          <dd>{detail.prediction?.riskLevel || '—'}</dd>
                        </div>
                        <div>
                          <dt>Confidence</dt>
                          <dd>{pct(detail.prediction?.confidence)}</dd>
                        </div>
                        <div>
                          <dt>Forecast days</dt>
                          <dd>{detail.prediction?.forecastDays ?? '—'}</dd>
                        </div>
                        <div>
                          <dt>Detected</dt>
                          <dd>
                            {detail.createdAt
                              ? new Date(detail.createdAt).toLocaleString()
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd className={`ad-diag-status is-${statusOf(detail)}`}>
                            {statusOf(detail) === 'verified'
                              ? detail.diseaseCorrected
                                ? 'Accepted (corrected)'
                                : 'Accepted'
                              : statusOf(detail) === 'rejected'
                                ? 'Denied'
                                : 'Pending review'}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section>
                      <h3>Farmer</h3>
                      <dl className="ad-diag-grid">
                        <div>
                          <dt>Name</dt>
                          <dd>{farmerLabel(detail.userId)}</dd>
                        </div>
                        <div>
                          <dt>Email</dt>
                          <dd>
                            {typeof detail.userId === 'object' && detail.userId?.email
                              ? detail.userId.email
                              : '—'}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section>
                      <h3>Location</h3>
                      <dl className="ad-diag-grid">
                        <div>
                          <dt>Coordinates</dt>
                          <dd>
                            {hasCoords
                              ? `${coords![1].toFixed(5)}, ${coords![0].toFixed(5)}`
                              : 'Not provided'}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section>
                      <h3>Weather at detection</h3>
                      <dl className="ad-diag-grid">
                        <div>
                          <dt>Temperature</dt>
                          <dd>
                            {detail.weatherConditions?.temperature != null
                              ? `${detail.weatherConditions.temperature}°C`
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Humidity</dt>
                          <dd>
                            {detail.weatherConditions?.humidity != null
                              ? `${detail.weatherConditions.humidity}%`
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Rainfall</dt>
                          <dd>
                            {detail.weatherConditions?.rainfall != null
                              ? `${detail.weatherConditions.rainfall} mm`
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Wind</dt>
                          <dd>
                            {detail.weatherConditions?.windSpeed != null
                              ? `${detail.weatherConditions.windSpeed} km/h`
                              : '—'}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    {!!detail.probabilities?.length && (
                      <section>
                        <h3>Disease / pest probabilities</h3>
                        <ul className="ad-diag-probs">
                          {detail.probabilities.map((p, i) => (
                            <li key={`${p.disease || 'd'}-${i}`}>
                              <span>{p.disease || 'Unknown'}</span>
                              <strong>{pct(p.probability)}</strong>
                              <i style={{ width: pct(p.probability) }} />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section>
                      <h3>AI treatment protocol</h3>
                      <p className="ad-diag-treatment">
                        {detail.treatmentProtocol?.trim() || 'No treatment notes recorded.'}
                      </p>
                    </section>

                    {statusOf(detail) === 'verified' &&
                      (detail.diseaseCorrected ||
                        detail.expertBooks ||
                        detail.expertDrugs ||
                        detail.expertSuggestion) && (
                        <section className="ad-diag-expert-box">
                          <h3>Saved expert review</h3>
                          {detail.diseaseCorrected && (
                            <p>
                              Corrected from <strong>{aiOriginal}</strong> →{' '}
                              <strong>{detail.disease}</strong>
                            </p>
                          )}
                          {detail.expertDrugs && (
                            <p>
                              <strong>Drugs:</strong> {detail.expertDrugs}
                            </p>
                          )}
                          {detail.expertBooks && (
                            <p>
                              <strong>Books:</strong> {detail.expertBooks}
                            </p>
                          )}
                          {detail.expertSuggestion && <p>{detail.expertSuggestion}</p>}
                        </section>
                      )}

                    {detail.isRejected && detail.rejectionReason && (
                      <section className="ad-diag-reject-box">
                        <h3>Denial reason</h3>
                        <p>{detail.rejectionReason}</p>
                      </section>
                    )}
                    {detail.reapprovalNote && (
                      <section
                        className="ad-diag-reject-box"
                        style={{
                          borderColor: 'rgba(37,99,235,0.25)',
                          background: 'rgba(37,99,235,0.08)',
                        }}
                      >
                        <h3>Farmer reapproval request</h3>
                        <p>{detail.reapprovalNote}</p>
                        {detail.reapprovalRequestedAt && (
                          <small>{timeAgo(detail.reapprovalRequestedAt)}</small>
                        )}
                        <p className="muted" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                          Reply from the inbox bell in the admin top bar, or accept / deny below.
                        </p>
                      </section>
                    )}
                  </div>
                </div>

                {statusOf(detail) === 'pending' && (
                  <footer className="ad-diag-modal-foot ad-diag-modal-foot-wide">
                    {!showDenyForm ? (
                      <div className="ad-diag-accept-form">
                        <div className="ad-diag-accept-grid">
                          <label>
                            Correct disease / pest
                            <select
                              value={correctDisease}
                              onChange={(e) => setCorrectDisease(e.target.value)}
                              disabled={busy}
                            >
                              <optgroup label="Diseases">
                                {ALL_DETECT_LABELS.filter((d) => !PEST_SET.has(d)).map((d) => (
                                  <option key={d} value={d}>
                                    {labelWithMy(d)}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Pests">
                                {ALL_DETECT_LABELS.filter((d) => PEST_SET.has(d)).map((d) => (
                                  <option key={d} value={d}>
                                    {labelWithMy(d)}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                            {diseaseChanged && (
                              <span className="ad-diag-correct-hint">
                                AI said “{aiOriginal}” — you are correcting to “{correctDisease}”.
                              </span>
                            )}
                          </label>
                          <label>
                            Severity (0–100)
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={severityEdit}
                              onChange={(e) =>
                                setSeverityEdit(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                              }
                              disabled={busy}
                            />
                          </label>
                          <label className="ad-diag-span-2">
                            Recommended drugs / chemicals
                            <input
                              type="text"
                              value={expertDrugs}
                              onChange={(e) => setExpertDrugs(e.target.value)}
                              maxLength={1000}
                              placeholder="e.g. Tricyclazole, Isoprothiolane — follow label rates"
                              disabled={busy}
                            />
                          </label>
                          <label className="ad-diag-span-2">
                            Recommended books / guides
                            <input
                              type="text"
                              value={expertBooks}
                              onChange={(e) => setExpertBooks(e.target.value)}
                              maxLength={1000}
                              placeholder="e.g. DOA Rice Disease Field Guide, IRRI pest fact sheet"
                              disabled={busy}
                            />
                          </label>
                          <label className="ad-diag-span-2">
                            Extra advice for the farmer
                            <textarea
                              value={expertSuggestion}
                              onChange={(e) => setExpertSuggestion(e.target.value)}
                              rows={3}
                              maxLength={2000}
                              placeholder="Field tips, IPM steps, when to spray, what to monitor…"
                              disabled={busy}
                            />
                          </label>
                          <label className="ad-diag-span-2">
                            Treatment protocol (optional override)
                            <textarea
                              value={treatmentEdit}
                              onChange={(e) => setTreatmentEdit(e.target.value)}
                              rows={2}
                              maxLength={2000}
                              placeholder="Leave blank to keep AI text, or rewrite for the farmer"
                              disabled={busy}
                            />
                          </label>
                        </div>
                        <div className="ad-diag-deny-actions">
                          <button
                            type="button"
                            className="button secondary"
                            disabled={busy}
                            onClick={() => {
                              setShowDenyForm(true);
                              setError('');
                            }}
                          >
                            Deny
                          </button>
                          <button
                            type="button"
                            className="button"
                            disabled={busy || !correctDisease}
                            onClick={() => void accept()}
                          >
                            {busy
                              ? 'Saving…'
                              : diseaseChanged
                                ? 'Correct & accept'
                                : 'Accept with advice'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ad-diag-deny-form">
                        <label htmlFor="ad-diag-deny-reason">
                          Reason for denial (farmer will be notified)
                        </label>
                        <textarea
                          id="ad-diag-deny-reason"
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="e.g. Image is unclear / disease label looks incorrect…"
                          disabled={busy}
                        />
                        <div className="ad-diag-deny-actions">
                          <button
                            type="button"
                            className="button secondary"
                            disabled={busy}
                            onClick={() => {
                              setShowDenyForm(false);
                              setDenyReason('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="button danger"
                            disabled={busy || denyReason.trim().length < 3}
                            onClick={() => void deny()}
                          >
                            {busy ? 'Sending…' : 'Confirm deny & notify'}
                          </button>
                        </div>
                      </div>
                    )}
                  </footer>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
