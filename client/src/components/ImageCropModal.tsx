import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type Props = {
  src: string;
  aspect: number;
  title: string;
  hint?: string;
  applyLabel: string;
  cancelLabel: string;
  zoomLabel?: string;
  onCancel: () => void;
  onCrop: (file: File) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ImageCropModal({
  src,
  aspect,
  title,
  hint,
  applyLabel,
  cancelLabel,
  zoomLabel = 'Zoom',
  onCancel,
  onCrop,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [busy, setBusy] = useState(false);

  const stageSize = useMemo(() => {
    const maxW = Math.min(420, typeof window !== 'undefined' ? window.innerWidth - 48 : 420);
    const h = Math.round(maxW / aspect);
    return { w: maxW, h: Math.max(140, Math.min(h, 320)) };
  }, [aspect]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      setReady(true);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  const coverScale = Math.max(stageSize.w / natural.w, stageSize.h / natural.h) * zoom;
  const dispW = natural.w * coverScale;
  const dispH = natural.h * coverScale;
  const maxPanX = Math.max(0, (dispW - stageSize.w) / 2);
  const maxPanY = Math.max(0, (dispH - stageSize.h) / 2);

  useEffect(() => {
    setPan((p) => ({
      x: clamp(p.x, -maxPanX, maxPanX),
      y: clamp(p.y, -maxPanY, maxPanY),
    }));
  }, [maxPanX, maxPanY]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({
      x: clamp(dragRef.current.panX + dx, -maxPanX, maxPanX),
      y: clamp(dragRef.current.panY + dy, -maxPanY, maxPanY),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  async function apply() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const outW = aspect >= 1.5 ? 1200 : 512;
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not crop image');
      const imgLeft = (stageSize.w - dispW) / 2 + pan.x;
      const imgTop = (stageSize.h - dispH) / 2 + pan.y;
      const sx = clamp(-imgLeft / coverScale, 0, natural.w);
      const sy = clamp(-imgTop / coverScale, 0, natural.h);
      const sw = clamp(stageSize.w / coverScale, 1, natural.w - sx);
      const sh = clamp(stageSize.h / coverScale, 1, natural.h - sy);
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(0, 0, outW, outH);
      const source = imgRef.current;
      if (!source) throw new Error('Image not ready');
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not crop image'))), 'image/jpeg', 0.9);
      });
      onCrop(new File([blob], aspect >= 1.5 ? 'cover.jpg' : 'avatar.jpg', { type: 'image/jpeg' }));
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="pf-crop-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="pf-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {hint && <p className="muted">{hint}</p>}
        <div
          ref={stageRef}
          className="pf-crop-stage"
          style={{ width: stageSize.w, height: stageSize.h, aspectRatio: `${aspect}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            style={{
              width: dispW,
              height: dispH,
              transform: `translate(${(stageSize.w - dispW) / 2 + pan.x}px, ${(stageSize.h - dispH) / 2 + pan.y}px)`,
              visibility: ready ? 'visible' : 'hidden',
            }}
          />
        </div>
        <label className="pf-crop-zoom">
          <span>{zoomLabel}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className="pf-crop-actions">
          <button type="button" className="button secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="button" onClick={() => void apply()} disabled={!ready || busy}>
            {busy ? '…' : applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
