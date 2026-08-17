import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { IconDetect, IconLeaf, IconPin, IconRice } from '../components/icons';
import { TownshipLocationPicker, type TownshipOption } from '../components/TownshipLocationPicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDiseaseLabel } from '../data/diseaseNames';
import { getDiseaseGuide, labTreatmentFor, treatmentProtocolFromGuide } from '../data/diseaseGuides';
import { detectCopy } from '../i18n/messages';
import { api } from '../services/api';
import { downloadLabReportDocx } from '../utils/labReport';
import {
  formatCropLabel,
  formatRegionLabel,
  formatTownshipLabel,
} from '../utils/localizeFarm';

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

type Probability = { disease: string; diseaseMy?: string; probability: number };

type DiagnosisResult = {
  _id: string;
  cropType?: string;
  disease?: string;
  diseaseMy?: string;
  aiDetectedDisease?: string;
  diseaseCorrected?: boolean;
  severityIndex?: number;
  probabilities?: Probability[];
  treatmentProtocol?: string;
  expertSuggestion?: string;
  expertBooks?: string;
  expertDrugs?: string;
  imageUrl?: string;
  createdAt?: string;
  isVerified?: boolean;
  isRejected?: boolean;
  reviewRequested?: boolean;
  location?: { coordinates?: [number, number] };
  prediction?: { confidence?: number; riskLevel?: string };
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/*';
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`dt-ico ${tone} ${className}`}>{children}</span>;
}

function PhotoExample({ kind }: { kind: 'good' | 'far' | 'blur' | 'dark' }) {
  return (
    <svg className="dt-photo-ex-art" viewBox="0 0 120 150" aria-hidden>
      <defs>
        <linearGradient id={`dt-sky-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kind === 'dark' ? '#1a2e24' : '#d8efe0'} />
          <stop offset="100%" stopColor={kind === 'dark' ? '#0d1a14' : '#b7dcc4'} />
        </linearGradient>
      </defs>
      <rect width="120" height="150" rx="14" fill={`url(#dt-sky-${kind})`} />
      {kind === 'far' ? (
        <>
          <ellipse cx="60" cy="118" rx="48" ry="14" fill="#6fa87a" opacity="0.85" />
          <path d="M18 110 Q40 70 60 95 T102 108" fill="none" stroke="#3d7a4a" strokeWidth="3" />
          <path d="M28 112 Q50 78 70 100 T98 110" fill="none" stroke="#4d8f5a" strokeWidth="2.5" />
          <circle cx="60" cy="42" r="10" fill="#fff" opacity="0.35" stroke="#fff" strokeWidth="2" />
          <path d="M60 52 v18" stroke="#fff" strokeWidth="2" opacity="0.4" />
        </>
      ) : (
        <>
          <path
            d={
              kind === 'blur'
                ? 'M28 28 C48 18, 78 18, 96 32 C104 58, 98 95, 78 122 C62 138, 42 132, 30 108 C20 82, 18 48, 28 28Z'
                : 'M30 26 C52 14, 82 16, 98 34 C106 60, 100 98, 78 124 C60 140, 40 132, 28 106 C18 80, 16 46, 30 26Z'
            }
            fill={kind === 'dark' ? '#2f5a3a' : '#3f8f52'}
            opacity={kind === 'blur' ? 0.55 : 1}
          />
          {kind !== 'blur' && (
            <>
              <ellipse cx="58" cy="62" rx="14" ry="9" fill="#c9a227" opacity="0.9" transform="rotate(-18 58 62)" />
              <ellipse cx="72" cy="88" rx="10" ry="7" fill="#8b5a2b" opacity="0.85" transform="rotate(12 72 88)" />
              <path d="M48 48 Q62 78 70 118" fill="none" stroke="#2d6b3c" strokeWidth="2.2" />
            </>
          )}
          {kind === 'dark' && (
            <rect width="120" height="150" rx="14" fill="#000" opacity="0.45" />
          )}
          {kind === 'dark' && (
            <ellipse cx="88" cy="36" rx="22" ry="14" fill="#fff" opacity="0.28" />
          )}
          {kind === 'blur' && (
            <g opacity="0.5">
              <circle cx="52" cy="70" r="8" fill="#c9a227" />
              <circle cx="74" cy="96" r="6" fill="#8b5a2b" />
            </g>
          )}
        </>
      )}
      {kind === 'good' && (
        <g fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.95">
          <path d="M14 34 V18 H30" />
          <path d="M106 34 V18 H90" />
          <path d="M14 116 V132 H30" />
          <path d="M106 116 V132 H90" />
        </g>
      )}
    </svg>
  );
}

/** Phone cameras often return empty MIME or image/jpg — normalize before upload. */
function normalizeImageFile(file: File): File | null {
  const name = file.name || `leaf-${Date.now()}.jpg`;
  const lower = name.toLowerCase();
  let type = (file.type || '').toLowerCase();

  if (type === 'image/jpg') type = 'image/jpeg';
  if (!type || type === 'application/octet-stream') {
    if (lower.endsWith('.png')) type = 'image/png';
    else if (lower.endsWith('.webp')) type = 'image/webp';
    else type = 'image/jpeg';
  }

  if (type === 'image/heic' || type === 'image/heif' || lower.endsWith('.heic') || lower.endsWith('.heif')) {
    return null;
  }
  if (!ALLOWED_MIME.has(type) && !type.startsWith('image/')) {
    return null;
  }
  if (!ALLOWED_MIME.has(type)) {
    // Unknown image/* from camera — treat as JPEG for upload
    type = 'image/jpeg';
  }

  if (file.type === type) return file;
  return new File([file], lower.includes('.') ? name : `${name}.jpg`, { type, lastModified: file.lastModified });
}

function severityLabel(n?: number, lang: 'en' | 'my' = 'en') {
  if (n == null) return '—';
  if (lang === 'my') {
    if (n >= 75) return 'အရေးပေါ်';
    if (n >= 50) return 'ပြင်းထန်';
    if (n >= 25) return 'အလယ်အလတ်';
    return 'ပေါ့ပါး';
  }
  if (n >= 75) return 'Critical';
  if (n >= 50) return 'Severe';
  if (n >= 25) return 'Moderate';
  return 'Mild';
}

function severityTone(n?: number): Tone {
  if (n == null) return 'mint';
  if (n >= 75) return 'coral';
  if (n >= 50) return 'amber';
  if (n >= 25) return 'peach';
  return 'mint';
}

function timeAgo(iso?: string, lang: 'en' | 'my' = 'en') {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return lang === 'my' ? 'ယခုလေး' : 'Just now';
  if (m < 60) return lang === 'my' ? `${m} မိနစ်အကြာ` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'my' ? `${h} နာရီအကြာ` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === 'my' ? `${d} ရက်အကြာ` : `${d}d ago`;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function treatmentSteps(protocol?: string): string[] {
  if (!protocol?.trim()) return [];
  const parts = protocol
    .split(/\n|(?<=\.)\s+|(?=\d+\.)/)
    .map((s) => s.replace(/^\d+[\).\-\s]+/, '').trim())
    .filter(Boolean);
  return parts.length ? parts : [protocol.trim()];
}

export function DetectPage() {
  const { lang } = useLanguage();
  const t = detectCopy(lang);
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [zoom, setZoom] = useState(1);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewFlash, setReviewFlash] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [township, setTownship] = useState('Yangon');
  const [townshipMy, setTownshipMy] = useState('ရန်ကုန်');
  const [region, setRegion] = useState('Yangon');
  const [lat, setLat] = useState(16.8661);
  const [lng, setLng] = useState(96.1951);
  const [locating, setLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<'default' | 'gps' | 'picker'>('default');

  const locationDisplay = useMemo(() => {
    const town = formatTownshipLabel(township, townshipMy, lang);
    const reg = formatRegionLabel(region, lang);
    return { town, reg, line: reg ? `${town} · ${reg}` : town, comma: reg ? `${town}, ${reg}` : town };
  }, [township, townshipMy, region, lang]);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const data = await api<DiagnosisResult[]>('/detections/history', { token: accessToken });
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        /* ignore */
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    setGuideOpen(false);
  }, [result?._id]);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setPhase('');
      return;
    }
    const phases = [t.phaseQuality, t.phaseCrop, t.phaseDisease, t.phaseTreatment];
    let i = 0;
    setPhase(phases[0]);
    setProgress(12);
    const id = window.setInterval(() => {
      i = Math.min(i + 1, phases.length - 1);
      setPhase(phases[i]);
      setProgress((p) => Math.min(92, p + 18));
    }, 900);
    return () => window.clearInterval(id);
  }, [loading, t.phaseQuality, t.phaseCrop, t.phaseDisease, t.phaseTreatment]);

  const monthCount = useMemo(() => {
    const now = new Date();
    return history.filter((d) => {
      if (!d.createdAt) return false;
      const dt = new Date(d.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
  }, [history]);

  const topConfidence = useMemo(() => {
    const probs = result?.probabilities || [];
    if (!probs.length) return result?.prediction?.confidence != null ? Math.round(result.prediction.confidence * 100) : null;
    const top = [...probs].sort((a, b) => b.probability - a.probability)[0];
    return Math.round((top?.probability || 0) * 100);
  }, [result]);

  function pickFile(next: File | null) {
    setError('');
    setResult(null);
    setZoom(1);
    clearPreviewUrl(preview);
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    const normalized = normalizeImageFile(next);
    if (!normalized) {
      setError(t.errType);
      return;
    }
    if (normalized.size > MAX_BYTES) {
      setError(t.errSize);
      return;
    }
    setFile(normalized);
    const url = URL.createObjectURL(normalized);
    setPreview(url);
  }

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function closeCamera() {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError('');
  }

  function openNativeCameraInput() {
    if (cameraRef.current) {
      cameraRef.current.value = '';
      cameraRef.current.click();
    }
  }

  async function openTakePhoto() {
    setCameraError('');
    setError('');
    // Prefer live camera when available (desktop + modern mobile over HTTPS)
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setCameraOpen(true);
        return;
      } catch {
        // Fall through to native file capture (phones) or gallery
      }
    }
    openNativeCameraInput();
  }

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      setCameraError(t.cameraPlayError);
    });
  }, [cameraOpen, t.cameraPlayError]);

  useEffect(() => () => stopCameraStream(), []);

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError(t.cameraNotReady);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError(t.cameraNotReady);
      return;
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(t.cameraNotReady);
          return;
        }
        const shot = new File([blob], `leaf-${Date.now()}.jpg`, { type: 'image/jpeg' });
        pickFile(shot);
        closeCamera();
      },
      'image/jpeg',
      0.92
    );
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function useDeviceLocation(force = true) {
    if (!navigator.geolocation) {
      if (force) setError(t.geoUnsupported);
      return;
    }
    setLocating(true);
    if (force) setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: force ? 15000 : 10000,
          maximumAge: force ? 30_000 : 120_000,
        });
      });
      const nextLat = pos.coords.latitude;
      const nextLng = pos.coords.longitude;
      setLat(nextLat);
      setLng(nextLng);

      try {
        const place = await api<{
          township?: { nameEn?: string; name?: string; nameMy?: string; region?: string };
        }>(
          `/weather/place?lat=${nextLat}&lng=${nextLng}&name=${encodeURIComponent('My location')}&region=${encodeURIComponent('Myanmar')}`,
          accessToken ? { token: accessToken } : undefined
        );
        const name = place.township?.nameEn || place.township?.name || 'My location';
        setTownship(name);
        setTownshipMy(place.township?.nameMy || (name === 'My location' ? t.myLocationLabel : ''));
        setRegion(place.township?.region || 'Myanmar');
      } catch {
        setTownship('My location');
        setTownshipMy(t.myLocationLabel);
        setRegion('Myanmar');
      }
      setLocationSource('gps');
    } catch {
      if (force) setError(t.geoFailed);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    void useDeviceLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-locate once on mount
  }, []);

  function onTownshipSelect(tw: TownshipOption) {
    setTownship(tw.nameEn || tw.name);
    setTownshipMy(tw.nameMy || '');
    setRegion(tw.region || '');
    setLocationSource('picker');
    if (tw.lat != null && tw.lng != null) {
      setLat(tw.lat);
      setLng(tw.lng);
    } else if (tw.coordinates?.coordinates) {
      setLng(tw.coordinates.coordinates[0]);
      setLat(tw.coordinates.coordinates[1]);
    }
  }

  async function analyze() {
    if (!file || !accessToken) return;
    setLoading(true);
    setError('');
    setResult(null);
    setReviewFlash('');
    setReviewModalOpen(false);
    setDontAskAgain(false);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('lat', String(lat));
      form.append('lng', String(lng));
      form.append('township', township || 'Yangon');
      const data = await api<DiagnosisResult>('/detections/analyze', {
        method: 'POST',
        token: accessToken,
        formData: form,
      });
      setProgress(100);
      setResult(data);
      setHistory((prev) => [data, ...prev.filter((d) => d._id !== data._id)]);
      if (!data.reviewRequested && !data.isVerified && !data.isRejected && shouldAskExpertReview()) {
        setReviewModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errAnalyze);
    } finally {
      setLoading(false);
    }
  }

  function clearPreviewUrl(url: string | null) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  function resetAll() {
    closeCamera();
    clearPreviewUrl(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setZoom(1);
    setSavedFlash(false);
    setReviewFlash('');
    setReviewModalOpen(false);
    setDontAskAgain(false);
    setRequestingReview(false);
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  function shouldAskExpertReview() {
    try {
      const raw = localStorage.getItem('smart_agro_profile_prefs');
      if (!raw) return true;
      const prefs = JSON.parse(raw) as { askExpertReview?: boolean };
      return prefs.askExpertReview !== false;
    } catch {
      return true;
    }
  }

  function persistAskExpertReview(ask: boolean) {
    try {
      const raw = localStorage.getItem('smart_agro_profile_prefs');
      const prefs = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(
        'smart_agro_profile_prefs',
        JSON.stringify({ ...prefs, askExpertReview: ask })
      );
    } catch {
      /* ignore */
    }
  }

  function closeReviewModal(saveDontAsk: boolean) {
    if (saveDontAsk && dontAskAgain) {
      persistAskExpertReview(false);
    }
    setReviewModalOpen(false);
    setDontAskAgain(false);
  }

  async function requestExpertReview() {
    if (!accessToken || !result?._id) return;
    setRequestingReview(true);
    setError('');
    setReviewFlash('');
    try {
      const data = await api<DiagnosisResult>(`/detections/${result._id}/request-review`, {
        method: 'POST',
        token: accessToken,
      });
      const next = { ...result, ...data, reviewRequested: true };
      setResult(next);
      setHistory((prev) => prev.map((d) => (d._id === next._id ? { ...d, ...next } : d)));
      setReviewFlash(t.reviewRequestedOk);
      setReviewModalOpen(false);
      setDontAskAgain(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.reviewRequestFailed);
    } finally {
      setRequestingReview(false);
    }
  }

  function statusLabel(d: DiagnosisResult) {
    if (d.isVerified) return t.verified;
    if (d.isRejected) return t.pending;
    if (d.reviewRequested) return t.reviewRequestedBadge;
    return t.aiOnly;
  }

  function shareDiagnosis(d: DiagnosisResult) {
    const crop = formatCropLabel(d.cropType, lang);
    const content =
      lang === 'my'
        ? `${formatDiseaseLabel(d.disease, 'my')} ကို ${crop} တွင် တွေ့ရှိပါသည်။ ပြင်းထန်မှု: ${severityLabel(d.severityIndex, lang)}။`
        : `Detected ${formatDiseaseLabel(d.disease, 'en')} on ${crop}. Severity: ${severityLabel(d.severityIndex, lang)}.`;
    navigate('/social', {
      state: {
        draftContent: content,
        diagnosticId: d._id,
        cropHint: d.cropType || 'Rice',
      },
    });
  }

  function shareToCommunity() {
    if (!result) return;
    shareDiagnosis(result);
  }

  function saveLocal() {
    if (!result) return;
    try {
      const key = 'smart_agro_saved_diagnoses';
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(result._id)) list.unshift(result._id);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function deleteDiagnosis(id: string) {
    if (!accessToken) return;
    if (!window.confirm(t.deleteConfirm)) return;
    setDeletingId(id);
    setError('');
    try {
      await api(`/detections/${id}`, { method: 'DELETE', token: accessToken });
      setHistory((prev) => prev.filter((d) => d._id !== id));
      if (result?._id === id) {
        // Fully reset so the upload section returns (preview-without-file left a blank gap)
        resetAll();
      }
      try {
        const key = 'smart_agro_saved_diagnoses';
        const raw = localStorage.getItem(key);
        const list: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(key, JSON.stringify(list.filter((x) => x !== id)));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errAnalyze);
    } finally {
      setDeletingId(null);
    }
  }

  async function downloadGuide() {
    if (!result || !accessToken) return;
    try {
      // Prefer latest expert-corrected fields from the server
      let report = result;
      try {
        const fresh = await api<DiagnosisResult>(`/detections/${result._id}`, {
          token: accessToken,
        });
        report = { ...result, ...fresh };
        setResult(report);
        setHistory((prev) =>
          prev.map((d) => (d._id === report._id ? { ...d, ...report } : d))
        );
      } catch {
        /* use local result if refresh fails */
      }

      const guide = getDiseaseGuide(report.disease, report.cropType);
      const steps =
        lang === 'my'
          ? guide?.controlsMy?.length
            ? guide.controlsMy
            : guide?.controlsEn?.length
              ? guide.controlsEn
              : treatmentSteps(
                  report.treatmentProtocol?.trim() ||
                    treatmentProtocolFromGuide(report.disease, 'my', report.cropType) ||
                    ''
                )
          : guide?.controlsEn?.length
            ? guide.controlsEn
            : guide?.controlsMy?.length
              ? guide.controlsMy
              : treatmentSteps(
                  report.treatmentProtocol?.trim() ||
                    treatmentProtocolFromGuide(report.disease, 'en', report.cropType) ||
                    ''
                );
      const probs = [...(report.probabilities || [])]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 6)
        .map((p) => ({
          disease: p.disease,
          pct: Math.round((p.probability <= 1 ? p.probability * 100 : p.probability) * 10) / 10,
        }));
      const confidencePct =
        report.prediction?.confidence != null
          ? Math.round(
              (report.prediction.confidence <= 1
                ? report.prediction.confidence * 100
                : report.prediction.confidence) * 10
            ) / 10
          : probs[0]?.pct != null
            ? Math.round(probs[0].pct)
            : null;
      await downloadLabReportDocx(
        {
          reportId: `SA-${String(report._id || 'SAMPLE').slice(-8).toUpperCase()}`,
          cropType: report.cropType || '',
          disease: report.disease || '',
          severityLabelEn: severityLabel(report.severityIndex, 'en'),
          severityLabelMy: severityLabel(report.severityIndex, 'my'),
          severityIndex: report.severityIndex,
          confidencePct,
          probabilities: probs,
          location: locationDisplay.comma,
          analyzedAt: report.createdAt
            ? new Date(report.createdAt).toLocaleString(lang === 'my' ? 'my-MM' : 'en-US')
            : new Date().toLocaleString(lang === 'my' ? 'my-MM' : 'en-US'),
          verified: Boolean(report.isVerified),
          diseaseCorrected: Boolean(report.diseaseCorrected),
          aiDetectedDisease: report.aiDetectedDisease || undefined,
          expertBooks: report.expertBooks?.trim() || undefined,
          expertDrugs: report.expertDrugs?.trim() || undefined,
          expertSuggestion: report.expertSuggestion?.trim() || undefined,
          treatmentProtocol: report.isVerified
            ? report.treatmentProtocol?.trim() || undefined
            : undefined,
          guide,
          treatmentSteps: steps,
        },
        `lab-report-${(report.disease || 'result').replace(/\s+/g, '-').toLowerCase()}.docx`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errAnalyze);
    }
  }

  if (!user || !accessToken) {
    return (
      <div className="dt-page">
        <section className="dt-hero">
          <SoftIcon tone="mint">
            <IconDetect />
          </SoftIcon>
          <div>
            <h1>{t.aiTitle}</h1>
            <p>{t.guestLead}</p>
          </div>
        </section>
        <Link className="button" to="/login">
          {t.login}
        </Link>
      </div>
    );
  }

  const showUpload = !loading && !result && !file;
  const showPreview = Boolean(file) && Boolean(preview) && !loading && !result;
  const sortedProbs = [...(result?.probabilities || [])].sort((a, b) => b.probability - a.probability).slice(0, 4);

  return (
    <div className="dt-page">
      <header className="dt-hero">
        <div>
          <p className="dt-eyebrow">
            <SoftIcon tone="mint" className="sm">
              <IconDetect />
            </SoftIcon>
            {t.badge}
          </p>
          <h1>{t.aiTitle}</h1>
          <p className="dt-lead">{t.tagline}</p>
          <div className="dt-stats">
            <span>
              <strong>{monthCount || history.length}</strong> {t.statsMonth}
            </span>
            <span>
              <strong>95%</strong> {t.statsAccuracy}
            </span>
            <span>
              <SoftIcon tone="amber" className="sm">
                <IconRice />
              </SoftIcon>
              {t.statsCrops}
            </span>
          </div>
        </div>
      </header>

      <section className="dt-panel">
        <div className="dt-location">
          <div className="dt-location-row">
            <div className="dt-location-current">
              <SoftIcon tone="coral" className="sm">
                <IconPin />
              </SoftIcon>
              <div>
                <strong>{locationDisplay.line}</strong>
                <span>
                  {locating
                    ? t.locating
                    : locationSource === 'gps'
                      ? t.locationReady
                      : t.farmLocation}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="button secondary compact"
              disabled={locating}
              onClick={() => void useDeviceLocation(true)}
            >
              {locating ? t.locating : t.useMyLocation}
            </button>
          </div>
          <TownshipLocationPicker
            currentName={township}
            currentNameMy={townshipMy}
            currentRegion={region}
            lang={lang}
            onSelect={onTownshipSelect}
            locating={locating}
            townshipLabel={t.township}
            searchPlaceholder={t.searchTownships}
            listLabel={t.listTownships}
            closeLabel={t.closeList}
            emptyLabel={t.noTownship}
            useLocationLabel={t.useMyLocation}
            locatingLabel={t.locating}
          />
        </div>

        {showUpload && (
          <div className="dt-capture-block">
            <div
              className={`dt-drop ${dragOver ? 'is-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="dt-drop-glow" aria-hidden />
              <div className="dt-drop-main">
                <SoftIcon tone="sky" className="lg">
                  <IconDetect />
                </SoftIcon>
                <h2>{t.uploadTitle}</h2>
                <p>{t.uploadHint}</p>
                <p className="muted">{t.uploadSupport}</p>
                <div className="dt-upload-actions">
                  <button type="button" className="button dt-take-btn" onClick={() => void openTakePhoto()}>
                    <span className="dt-take-ico" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                        <path
                          d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.8A1.5 1.5 0 0 1 11 3.5h2a1.5 1.5 0 0 1 1.3.7L15.5 6h2A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </span>
                    {t.takePhoto}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      if (galleryRef.current) {
                        galleryRef.current.value = '';
                        galleryRef.current.click();
                      }
                    }}
                  >
                    {t.uploadGallery}
                  </button>
                </div>
                <p className="dt-drop-or muted">{t.uploadDropOr}</p>
              </div>
            </div>

            <aside className="dt-photo-guide" aria-label={t.photoGuideTitle}>
              <div className="dt-photo-guide-head">
                <h3>{t.photoGuideTitle}</h3>
                <p>{t.photoGuideLead}</p>
              </div>
              <div className="dt-photo-examples">
                <figure className="dt-photo-ex is-good">
                  <PhotoExample kind="good" />
                  <figcaption>
                    <strong>{t.photoGood}</strong>
                    <span>{t.photoGoodHint}</span>
                  </figcaption>
                </figure>
                <figure className="dt-photo-ex is-bad">
                  <PhotoExample kind="far" />
                  <figcaption>
                    <strong>{t.photoFar}</strong>
                    <span>{t.photoFarHint}</span>
                  </figcaption>
                </figure>
                <figure className="dt-photo-ex is-bad">
                  <PhotoExample kind="blur" />
                  <figcaption>
                    <strong>{t.photoBlur}</strong>
                    <span>{t.photoBlurHint}</span>
                  </figcaption>
                </figure>
                <figure className="dt-photo-ex is-bad">
                  <PhotoExample kind="dark" />
                  <figcaption>
                    <strong>{t.photoDark}</strong>
                    <span>{t.photoDarkHint}</span>
                  </figcaption>
                </figure>
              </div>
              <ul className="dt-photo-tips">
                <li>
                  <strong>{t.photoTipsTitle}</strong>
                </li>
                <li>{t.photoTip1}</li>
                <li>{t.photoTip2}</li>
                <li>{t.photoTip3}</li>
                <li>{t.photoTip4}</li>
              </ul>
            </aside>
          </div>
        )}

        <input
          ref={galleryRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            pickFile(e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            pickFile(e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />

        {cameraOpen &&
          createPortal(
            <div className="dt-camera-modal" role="dialog" aria-modal="true" aria-label={t.takePhoto}>
              <div className="dt-camera-sheet">
                <header className="dt-camera-head">
                  <div>
                    <strong>{t.takePhoto}</strong>
                    <p className="dt-camera-sub">{t.cameraGuide}</p>
                  </div>
                  <button type="button" className="button secondary compact" onClick={closeCamera}>
                    {t.closeCamera}
                  </button>
                </header>
                <div className="dt-camera-stage">
                  <video ref={videoRef} playsInline muted autoPlay />
                  <p className="dt-camera-chip">{t.cameraGuide}</p>
                </div>
                {cameraError && <p className="dt-camera-error">{cameraError}</p>}
                <div className="dt-camera-actions">
                  <button type="button" className="button secondary" onClick={openNativeCameraInput}>
                    {t.usePhoneCamera}
                  </button>
                  <button type="button" className="button dt-capture-btn" onClick={captureFromCamera}>
                    {t.capturePhoto}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {showPreview && preview && file && (
          <div className="dt-preview">
            <div className="dt-preview-head">
              <span>
                {t.selected}: <strong>{file.name}</strong> ({formatBytes(file.size)})
              </span>
            </div>
            <div className="dt-preview-grid">
              <img src={preview} alt="" />
              <div className="dt-preview-actions">
                <p className="dt-tip">{t.tip}</p>
                <button type="button" className="button dt-analyze-btn" onClick={() => void analyze()}>
                  {t.analyzeDisease}
                </button>
                <button type="button" className="dt-remove" onClick={resetAll}>
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="dt-loading">
            <div className="dt-spinner" aria-hidden />
            <h2>{t.analyzingTitle}</h2>
            <p>{t.analyzingLead}</p>
            <div className="dt-progress">
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="muted">
              {t.eta} · {phase}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="dt-error">
            <h2>{t.errorTitle}</h2>
            <p>{error}</p>
            {/session expired|log in|access token|unauthorized/i.test(error) ? (
              <p className="muted">Log out and sign in again (or Continue as Guest), then retry analyze.</p>
            ) : (
              <>
                <p className="dt-error-label">{t.errorReasons}</p>
                <ul>
                  <li>{t.reasonBlur}</li>
                  <li>{t.reasonLeaf}</li>
                  <li>{t.reasonNotLeaf}</li>
                  <li>{t.reasonFormat}</li>
                  <li>{t.reasonNetwork}</li>
                </ul>
                <p className="dt-error-label">{t.tipsTitle}</p>
                <ul>
                  <li>{t.tipLight}</li>
                  <li>{t.tipFocus}</li>
                  <li>{t.tipTissue}</li>
                  <li>{t.tipShadow}</li>
                </ul>
              </>
            )}
            <div className="dt-actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setError('');
                  galleryRef.current?.click();
                }}
              >
                {t.tryAgain}
              </button>
              <button type="button" className="button secondary" onClick={resetAll}>
                {t.newDetection}
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="dt-results">
            <div className="dt-results-head">
              <h2>{t.complete}</h2>
              <span className="muted">{timeAgo(result.createdAt, lang)}</span>
            </div>

            <div className="dt-results-grid">
              <div className="dt-result-image">
                <div className="dt-zoom-frame">
                  <img
                    src={preview || result.imageUrl || ''}
                    alt=""
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
                <div className="dt-zoom-controls">
                  <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.2))} aria-label="-">
                    −
                  </button>
                  <button type="button" onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} aria-label="+">
                    +
                  </button>
                </div>
              </div>

              <div className="dt-result-meta">
                <div>
                  <span>{t.crop}</span>
                  <strong>
                    <SoftIcon tone="amber" className="sm">
                      <IconRice />
                    </SoftIcon>
                    {formatCropLabel(result.cropType, lang)}
                  </strong>
                </div>
                <div>
                  <span>{t.disease}</span>
                  <strong>
                    <SoftIcon tone="coral" className="sm">
                      <IconLeaf />
                    </SoftIcon>
                    {formatDiseaseLabel(result.disease, lang)}
                  </strong>
                </div>
                <div>
                  <span>{t.severity}</span>
                  <em className={`dt-sev ${severityTone(result.severityIndex)}`}>
                    {severityLabel(result.severityIndex, lang)}
                  </em>
                </div>
                <div>
                  <span>{t.confidence}</span>
                  <strong>{topConfidence != null ? `${topConfidence}%` : '—'}</strong>
                </div>
                <div>
                  <span>{t.location}</span>
                  <strong>{locationDisplay.comma}</strong>
                </div>
                <div>
                  <span>{t.analyzed}</span>
                  <strong>{timeAgo(result.createdAt, lang)}</strong>
                </div>
              </div>
            </div>

            {sortedProbs.length > 0 && (
              <div className="dt-breakdown">
                <h3>{t.breakdown}</h3>
                {sortedProbs.map((p, i) => {
                  const pct = Math.round(p.probability * 100);
                  return (
                    <div key={`${p.disease}-${i}`} className="dt-bar">
                      <div className="dt-bar-label">
                        <span>{formatDiseaseLabel(p.disease, lang)}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="dt-bar-track">
                        <div className={`fill tone-${i}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="dt-treatment">
              <h3>{t.treatmentTitle}</h3>
              {(() => {
                const guide = getDiseaseGuide(result.disease, result.cropType);
                const treatment = labTreatmentFor({
                  disease: result.disease,
                  crop: result.cropType,
                  guide,
                  expertProtocol: result.isVerified ? result.treatmentProtocol : undefined,
                });
                const isHealthy =
                  !result.disease ||
                  result.disease === 'Healthy' ||
                  result.disease.toLowerCase() === 'healthy';
                const treatSteps =
                  lang === 'my' ? treatment.stepsMy : treatment.stepsEn;
                const fieldTip = treatSteps.join(lang === 'my' ? ' ' : ' ');
                const aiTip = isHealthy
                  ? fieldTip
                  : fieldTip || result.treatmentProtocol?.trim() || '';
                const symptoms =
                  lang === 'my'
                    ? guide?.symptomsMy?.length
                      ? guide.symptomsMy
                      : guide?.symptomsEn || []
                    : guide?.symptomsEn?.length
                      ? guide.symptomsEn
                      : guide?.symptomsMy || [];
                const controls =
                  lang === 'my'
                    ? guide?.controlsMy?.length
                      ? guide.controlsMy
                      : guide?.controlsEn || []
                    : guide?.controlsEn?.length
                      ? guide.controlsEn
                      : guide?.controlsMy || [];
                const chemicals =
                  lang === 'my'
                    ? treatment.chemicalsMy.length
                      ? treatment.chemicalsMy
                      : guide?.chemicalsMy?.length
                        ? guide.chemicalsMy
                        : guide?.chemicals || []
                    : treatment.chemicals.length
                      ? treatment.chemicals
                      : guide?.chemicals?.length
                        ? guide.chemicals
                        : guide?.chemicalsMy || [];
                const canExpand =
                  Boolean(guide) &&
                  (symptoms.length > 0 ||
                    treatSteps.length > 1 ||
                    controls.length > 2 ||
                    chemicals.length > 0);
                const previewTreat = treatSteps.slice(0, 2);
                const previewChemicals = chemicals.slice(0, 2);
                const hasExpertAdvice = Boolean(
                  result.isVerified &&
                    (result.diseaseCorrected ||
                      result.expertBooks?.trim() ||
                      result.expertDrugs?.trim() ||
                      result.expertSuggestion?.trim())
                );

                return (
                  <>
                    {hasExpertAdvice && (
                      <div className="dt-expert-advice">
                        <h4>{t.expertAdviceTitle}</h4>
                        {result.diseaseCorrected && (
                          <p className="dt-expert-corrected">
                            <strong>{t.expertCorrectedLabel}:</strong>{' '}
                            {formatDiseaseLabel(result.disease, lang)}
                            {result.aiDetectedDisease ? (
                              <>
                                {' '}
                                <span className="muted">
                                  ({t.expertAiOriginal}:{' '}
                                  {formatDiseaseLabel(result.aiDetectedDisease, lang)})
                                </span>
                              </>
                            ) : null}
                          </p>
                        )}
                        {result.expertDrugs?.trim() && (
                          <p>
                            <strong>{t.expertDrugsLabel}:</strong> {result.expertDrugs.trim()}
                          </p>
                        )}
                        {result.expertBooks?.trim() && (
                          <p>
                            <strong>{t.expertBooksLabel}:</strong> {result.expertBooks.trim()}
                          </p>
                        )}
                        {result.expertSuggestion?.trim() && (
                          <p>
                            <strong>{t.expertNotesLabel}:</strong> {result.expertSuggestion.trim()}
                          </p>
                        )}
                      </div>
                    )}

                    {guide && (
                      <p className="dt-treatment-org muted">
                        {t.causalOrganism}: {guide.organism}
                      </p>
                    )}

                    {!guideOpen && (
                      <>
                        {previewTreat.length > 0 ? (
                          <ol className="dt-treatment-steps">
                            {previewTreat.map((step, i) => (
                              <li key={`treat-pre-${i}`}>{step}</li>
                            ))}
                          </ol>
                        ) : aiTip ? (
                          <p className="dt-treatment-ai">{aiTip}</p>
                        ) : (
                          <p className="dt-treatment-ai muted">{t.noTreatment}</p>
                        )}
                        {previewChemicals.length > 0 && (
                          <div className="dt-chem-block">
                            <h4>{t.recommendedChemicals}</h4>
                            <ul className="dt-chem-list">
                              {previewChemicals.map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {guideOpen && guide && (
                      <div className="dt-guide-full">
                        <div className="dt-guide-section">
                          <h4>{t.howToTreatTitle}</h4>
                          {treatSteps.length > 0 ? (
                            <ol className="dt-treatment-steps">
                              {treatSteps.map((step, i) => (
                                <li key={`treat-${i}`}>{step}</li>
                              ))}
                            </ol>
                          ) : (
                            <p className="dt-treatment-ai muted">{t.noTreatment}</p>
                          )}
                        </div>
                        {symptoms.length > 0 && (
                          <div className="dt-guide-section">
                            <h4>{t.symptomsTitle}</h4>
                            <ul className="dt-chem-list">
                              {symptoms.map((s, i) => (
                                <li key={`sym-${i}`}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="dt-guide-section">
                          <h4>{t.controlsTitle}</h4>
                          <ol className="dt-treatment-steps">
                            {controls.map((step, i) => (
                              <li key={`ctl-${i}`}>{step}</li>
                            ))}
                            {controls.length === 0 && <li>{t.noTreatment}</li>}
                          </ol>
                        </div>
                        {chemicals.length > 0 && (
                          <div className="dt-guide-section">
                            <h4>{t.recommendedChemicals}</h4>
                            <ul className="dt-chem-list">
                              {chemicals.map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {canExpand && (
                      <button
                        type="button"
                        className="dt-show-more"
                        onClick={() => setGuideOpen((v) => !v)}
                      >
                        {guideOpen ? t.showLess : t.showMore}
                      </button>
                    )}
                  </>
                );
              })()}
              <div className="dt-download-wrap">
                <button
                  type="button"
                  className="dt-download-btn"
                  onClick={() => void downloadGuide()}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t.downloadGuide}
                </button>
              </div>
            </div>

            {(result.reviewRequested || reviewFlash) && (
              <p className="dt-review-ok">{reviewFlash || t.reviewRequestedBadge}</p>
            )}

            <div className="dt-actions">
              <button type="button" className="button" onClick={shareToCommunity}>
                {t.shareCommunity}
              </button>
              {!result.isVerified && !result.isRejected && !result.reviewRequested && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={requestingReview}
                  onClick={() => void requestExpertReview()}
                >
                  {requestingReview ? t.requestingReview : t.requestExpertReview}
                </button>
              )}
              <button type="button" className="button secondary" onClick={saveLocal}>
                {savedFlash ? t.saved : t.saveDiagnosis}
              </button>
              <button
                type="button"
                className="button danger"
                disabled={!result._id || deletingId === result._id}
                onClick={() => void deleteDiagnosis(result._id)}
              >
                {deletingId === result._id ? t.deleting : t.delete}
              </button>
              <button type="button" className="button secondary" onClick={resetAll}>
                {t.newDetection}
              </button>
              <a className="button secondary" href="#dt-history">
                {t.viewHistory}
              </a>
            </div>
          </div>
        )}

      </section>

      {reviewModalOpen &&
        result &&
        createPortal(
          <div
            className="dt-modal-backdrop"
            role="presentation"
            onClick={() => closeReviewModal(true)}
          >
            <div
              className="dt-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dt-review-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="dt-modal-head">
                <span className="dt-modal-icon" aria-hidden>
                  <IconDetect />
                </span>
                <button
                  type="button"
                  className="dt-modal-close"
                  aria-label={t.keepAiOnly}
                  onClick={() => closeReviewModal(true)}
                >
                  ×
                </button>
              </header>

              <div className="dt-modal-body">
                <h3 id="dt-review-modal-title">{t.reviewPromptTitle}</h3>
                <p>{t.reviewPromptLead}</p>

                <label className="dt-modal-check">
                  <input
                    type="checkbox"
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                  />
                  <span>
                    <strong>{t.dontAskAgain}</strong>
                    <small>{t.dontAskAgainHint}</small>
                  </span>
                </label>
              </div>

              <footer className="dt-modal-actions">
                <button
                  type="button"
                  className="dt-modal-btn primary"
                  disabled={requestingReview}
                  onClick={() => void requestExpertReview()}
                >
                  {requestingReview ? t.requestingReview : t.requestExpertReview}
                </button>
                <button
                  type="button"
                  className="dt-modal-btn ghost"
                  disabled={requestingReview}
                  onClick={() => closeReviewModal(true)}
                >
                  {t.keepAiOnly}
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}

      <section className="dt-panel" id="dt-history">
        <div className="dt-history-head">
          <h2>{t.recentTitle}</h2>
          <Link to="/profile">{t.viewAll}</Link>
        </div>
        {history.length === 0 ? (
          <p className="muted">{t.noHistory}</p>
        ) : (
          <ul className="dt-history-list">
            {history.slice(0, 5).map((d) => (
              <li key={d._id}>
                <div className="dt-history-thumb">
                  {d.imageUrl ? <img src={d.imageUrl} alt="" /> : <IconLeaf />}
                </div>
                <div className="dt-history-body">
                  <strong>
                    {formatDiseaseLabel(d.disease, lang)} · {severityLabel(d.severityIndex, lang)}
                  </strong>
                  <span>
                    {formatCropLabel(d.cropType, lang)} · {timeAgo(d.createdAt, lang)} · {statusLabel(d)}
                  </span>
                </div>
                <div className="dt-history-actions">
                  <button
                    type="button"
                    className="button secondary compact"
                    onClick={() => {
                      void (async () => {
                        clearPreviewUrl(preview);
                        setFile(null);
                        setError('');
                        setReviewFlash('');
                        setReviewModalOpen(false);
                        setDontAskAgain(false);
                        setPreview(d.imageUrl || null);
                        setResult(d);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (!accessToken) return;
                        try {
                          const fresh = await api<DiagnosisResult>(`/detections/${d._id}`, {
                            token: accessToken,
                          });
                          const next = { ...d, ...fresh };
                          setResult(next);
                          setPreview(next.imageUrl || d.imageUrl || null);
                          setHistory((prev) =>
                            prev.map((item) => (item._id === next._id ? { ...item, ...next } : item))
                          );
                        } catch {
                          /* keep list item */
                        }
                      })();
                    }}
                  >
                    {t.viewDetails}
                  </button>
                  <button
                    type="button"
                    className="button compact"
                    onClick={() => shareDiagnosis(d)}
                  >
                    {t.share}
                  </button>
                  <button
                    type="button"
                    className="button danger compact"
                    disabled={deletingId === d._id}
                    onClick={() => void deleteDiagnosis(d._id)}
                  >
                    {deletingId === d._id ? t.deleting : t.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
