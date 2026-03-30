import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ImagePlus } from 'lucide-react';
import { rgbToHex } from '../utils/mixing';
import { normalizeHexColor } from '../utils/hexNormalize';

function getContainedImageRect(img) {
  const rect = img.getBoundingClientRect();
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;
  const rw = rect.width;
  const rh = rect.height;
  const scale = Math.min(rw / nw, rh / nh);
  const dw = nw * scale;
  const dh = nh * scale;
  const ox = rect.left + (rw - dw) / 2;
  const oy = rect.top + (rh - dh) / 2;
  return { rect, nw, nh, ox, oy, dw, dh, scale };
}

function clientToNorm(clientX, clientY, img) {
  const g = getContainedImageRect(img);
  if (!g) return null;
  const nx = (clientX - g.ox) / g.dw;
  const ny = (clientY - g.oy) / g.dh;
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
  return { nx, ny, ...g };
}

function clientToNormClamped(clientX, clientY, img) {
  const g = getContainedImageRect(img);
  if (!g) return null;
  const nxRaw = (clientX - g.ox) / g.dw;
  const nyRaw = (clientY - g.oy) / g.dh;
  const nx = Math.min(1, Math.max(0, nxRaw));
  const ny = Math.min(1, Math.max(0, nyRaw));
  const inside = nxRaw >= 0 && nxRaw <= 1 && nyRaw >= 0 && nyRaw <= 1;
  return { nx, ny, inside, ...g };
}

function drawMagnifier({ img, magCanvas, nx, ny }) {
  if (!magCanvas || !img?.naturalWidth) return;
  if (
    !Number.isFinite(nx) ||
    !Number.isFinite(ny) ||
    nx < 0 ||
    ny < 0 ||
    nx > 1 ||
    ny > 1
  ) {
    return;
  }
  const ctx = magCanvas.getContext('2d');
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const size = magCanvas.width;
  const zoom = 10;
  const sw = nw / zoom;
  const sh = nh / zoom;
  let sx = nx * nw - sw / 2;
  let sy = ny * nh - sh / 2;
  sx = Math.max(0, Math.min(nw - sw, sx));
  sy = Math.max(0, Math.min(nh - sh, sy));

  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  const step = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  for (let x = 0; x <= size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const cx = ((nx * nw - sx) / sw) * size;
  const cy = ((ny * nh - sy) / sh) * size;
  const box = 7;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - box / 2 + 0.5, cy - box / 2 + 0.5, box - 1, box - 1);
}

function getMagnifierSampleNorm({ img, centerNx, centerNy, localX, localY, magSize }) {
  if (!img?.naturalWidth || !img?.naturalHeight || !magSize) return null;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const zoom = 10;
  const sw = nw / zoom;
  const sh = nh / zoom;
  let sx = centerNx * nw - sw / 2;
  let sy = centerNy * nh - sh / 2;
  sx = Math.max(0, Math.min(nw - sw, sx));
  sy = Math.max(0, Math.min(nh - sh, sy));
  const clampedX = Math.max(0, Math.min(magSize, localX));
  const clampedY = Math.max(0, Math.min(magSize, localY));
  const srcX = sx + (clampedX / magSize) * sw;
  const srcY = sy + (clampedY / magSize) * sh;
  return {
    nx: Math.max(0, Math.min(1, srcX / nw)),
    ny: Math.max(0, Math.min(1, srcY / nh))
  };
}

/**
 * 부모(App)의 targetHex만 바꿉니다. 반드시 `onColorChange(hex)` 로 부모에게 보고합니다.
 *
 * @param {string} [targetHex] — 부모 현재 목표색(표시용)
 * @param {function(string): void} [onColorChange] — 권장: 단일 진실 공급원으로 HEX 전달
 */
function PhotoToPalette({ targetHex, onColorChange, pickEnabled, onPickComplete }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const wrapRef = useRef(null);
  const magRef = useRef(null);
  const magWrapRef = useRef(null);
  const lastEmitRef = useRef({ at: 0, hex: '' });

  const [imageSrc, setImageSrc] = useState(null);
  const [pointerInsideImage, setPointerInsideImage] = useState(false);
  const [hoverNorm, setHoverNorm] = useState(null);
  const [pickedNorm, setPickedNorm] = useState(null);
  const [hasPickedOnce, setHasPickedOnce] = useState(false);
  const [touchFlash, setTouchFlash] = useState(false);
  const [tapDot, setTapDot] = useState(null); // { nx, ny, at }
  const [dragMag, setDragMag] = useState(false);

  const resizeImageFile = useCallback(async (file, maxWidth = 1200) => {
    const blobUrl = URL.createObjectURL(file);
    try {
      let bitmap = null;
      if (window?.createImageBitmap) {
        bitmap = await createImageBitmap(file);
      }
      const img = bitmap;
      const w = bitmap ? bitmap.width : 0;
      const h = bitmap ? bitmap.height : 0;
      if (!bitmap || !w || !h) {
        // fallback: use Image decode
        const el = new Image();
        el.decoding = 'async';
        el.src = blobUrl;
        await el.decode();
        const fw = el.naturalWidth;
        const fh = el.naturalHeight;
        const scale = fw > maxWidth ? maxWidth / fw : 1;
        const tw = Math.max(1, Math.round(fw * scale));
        const th = Math.max(1, Math.round(fh * scale));
        const c = document.createElement('canvas');
        c.width = tw;
        c.height = th;
        const ctx = c.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(el, 0, 0, tw, th);
        const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.92));
        return blob || file;
      }

      const scale = w > maxWidth ? maxWidth / w : 1;
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const c = document.createElement('canvas');
      c.width = tw;
      c.height = th;
      const ctx = c.getContext('2d', { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, tw, th);
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.92));
      return blob || file;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }, []);

  const sampleHexAtNormAsync = useCallback(async (nx, ny) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return null;
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      // iOS Safari: give the browser a tick to finalize the draw before getImageData.
      await new Promise((r) => window.setTimeout(r, 0));
      const x = Math.min(img.naturalWidth - 1, Math.max(0, Math.floor(nx * img.naturalWidth)));
      const y = Math.min(img.naturalHeight - 1, Math.max(0, Math.floor(ny * img.naturalHeight)));
      const data = ctx.getImageData(x, y, 1, 1).data;
      return rgbToHex([data[0] / 255, data[1] / 255, data[2] / 255]);
    } catch {
      return null;
    }
  }, []);

  const reportHexToParent = useCallback((hexFinal) => {
    const newHex = normalizeHexColor(hexFinal);
    const now = Date.now();
    if (
      newHex === lastEmitRef.current.hex &&
      now - lastEmitRef.current.at < 350
    ) {
      return;
    }
    lastEmitRef.current = { at: now, hex: newHex };

    if (typeof onColorChange === 'function') {
      onColorChange(newHex);
    }
    setHasPickedOnce(true);
  }, [onColorChange]);

  const tryPickAtNormAsync = useCallback(
    async (nx, ny) => {
      const hexRaw = await sampleHexAtNormAsync(nx, ny);
      if (!hexRaw) return false;
      const extractedHex = normalizeHexColor(hexRaw);
      console.log('TRACE [Photo]: 사진 클릭 ->', extractedHex);
      setPickedNorm({ nx, ny });
      setTapDot({ nx, ny, at: Date.now() });
      window.setTimeout(() => setTapDot(null), 260);
      reportHexToParent(extractedHex);
      queueMicrotask(() => onPickComplete?.());
      return true;
    },
    [onPickComplete, reportHexToParent, sampleHexAtNormAsync]
  );

  const pickAtNormWithRetry = useCallback(
    (nx, ny) => {
      let cancelled = false;
      const retry = (left) => {
        if (cancelled) return;
        if (left <= 0) return;
        requestAnimationFrame(async () => {
          if (cancelled) return;
          const ok = await tryPickAtNormAsync(nx, ny);
          if (ok) return;
          retry(left - 1);
        });
      };
      retry(5);
      return () => {
        cancelled = true;
      };
    },
    [tryPickAtNormAsync]
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    (async () => {
      const resizedBlob = await resizeImageFile(file, 1200);
      const url = URL.createObjectURL(resizedBlob);
      setImageSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPickedNorm(null);
      setHasPickedOnce(false);
    })();
  };

  const updateHoverFromEvent = useCallback(
    (e) => {
      const img = imgRef.current;
      if (!img || !imageSrc) return;
      const hit = clientToNorm(e.clientX, e.clientY, img);
      if (!hit) {
        setHoverNorm(null);
        return;
      }
      setHoverNorm({ nx: hit.nx, ny: hit.ny });
      drawMagnifier({ img, magCanvas: magRef.current, nx: hit.nx, ny: hit.ny });
    },
    [imageSrc]
  );

  const handleImagePick = useCallback(
    (e) => {
      if (!pickEnabled) return;
      const img = imgRef.current;
      if (!img || !imageSrc) return;
      const hit = clientToNorm(e.clientX, e.clientY, img);
      if (!hit) return;
      e.preventDefault();
      setTapDot({ nx: hit.nx, ny: hit.ny, at: Date.now() });
      window.setTimeout(() => setTapDot(null), 260);
      pickAtNormWithRetry(hit.nx, hit.ny);
    },
    [imageSrc, pickAtNormWithRetry, pickEnabled]
  );

  const handleImageTouchStart = useCallback(
    (e) => {
      if (!pickEnabled) return;
      const img = imgRef.current;
      if (!img || !imageSrc) return;
      const t = e.touches?.[0] || e.changedTouches?.[0];
      if (!t) return;
      // iOS Safari: avoid long-press callout interfering with sampling.
      // Don't rely on preventDefault (may be passive); just sample coordinates.
      const hit = clientToNorm(t.clientX, t.clientY, img);
      if (!hit) return;
      setTapDot({ nx: hit.nx, ny: hit.ny, at: Date.now() });
      window.setTimeout(() => setTapDot(null), 260);
      pickAtNormWithRetry(hit.nx, hit.ny);
    },
    [imageSrc, pickAtNormWithRetry, pickEnabled]
  );

  // iOS Safari: React touch events can be passive by default.
  // Attach a native touchstart listener with { passive: false }.
  useEffect(() => {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap) return;

    const onNativeTouchStart = (evt) => {
      if (!pickEnabled) return;
      // critical: passive:false enables preventDefault
      try {
        evt.preventDefault();
      } catch {
        // ignore
      }
      const touch = evt.touches?.[0] || evt.changedTouches?.[0];
      if (!touch) return;
      const hitAny = clientToNormClamped(touch.clientX, touch.clientY, img);
      if (!hitAny) return;
      setTouchFlash(true);
      window.setTimeout(() => setTouchFlash(false), 140);
      // Always show the dot (even if outside image rect) so user can see touch is detected.
      setTapDot({ nx: hitAny.nx, ny: hitAny.ny, at: Date.now() });
      window.setTimeout(() => setTapDot(null), 260);
      if (hitAny.inside) {
        pickAtNormWithRetry(hitAny.nx, hitAny.ny);
      }
    };

    // Attach to wrapper (more reliable on iOS than <img> alone), capture to win race with browser.
    wrap.addEventListener('touchstart', onNativeTouchStart, { passive: false, capture: true });
    img.addEventListener('touchstart', onNativeTouchStart, { passive: false, capture: true });
    return () => {
      wrap.removeEventListener('touchstart', onNativeTouchStart, { capture: true });
      img.removeEventListener('touchstart', onNativeTouchStart, { capture: true });
    };
  }, [pickEnabled, pickAtNormWithRetry]);

  const pickFromMagnifierEvent = useCallback(
    (e) => {
      if (!pickEnabled) return;
      const img = imgRef.current;
      const mag = magRef.current;
      if (!img || !mag) return;
      const base = pickedNorm || hoverNorm || { nx: 0.5, ny: 0.5 };
      const rect = mag.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const hit = getMagnifierSampleNorm({
        img,
        centerNx: base.nx,
        centerNy: base.ny,
        localX,
        localY,
        magSize: rect.width
      });
      if (!hit) return;
      setTapDot({ nx: hit.nx, ny: hit.ny, at: Date.now() });
      window.setTimeout(() => setTapDot(null), 260);
      setPickedNorm({ nx: hit.nx, ny: hit.ny });
      pickAtNormWithRetry(hit.nx, hit.ny);
    },
    [hoverNorm, pickAtNormWithRetry, pickEnabled, pickedNorm]
  );

  // iOS Safari: magnifier 영역에서도 pointer 이벤트가 안 들어오는 경우가 있어 native touch로 보강합니다.
  useEffect(() => {
    const wrap = magWrapRef.current;
    if (!wrap) return;

    const onMagTouchStart = (evt) => {
      if (!pickEnabled) return;
      try {
        evt.preventDefault();
      } catch {
        // ignore
      }
      const touch = evt.touches?.[0] || evt.changedTouches?.[0];
      if (!touch) return;
      // synthesize minimal event object for existing picker
      pickFromMagnifierEvent({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const onMagTouchMove = (evt) => {
      if (!pickEnabled || !dragMag) return;
      try {
        evt.preventDefault();
      } catch {
        // ignore
      }
      const touch = evt.touches?.[0] || evt.changedTouches?.[0];
      if (!touch) return;
      pickFromMagnifierEvent({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const onMagTouchEnd = () => {
      if (!pickEnabled) return;
      setDragMag(false);
    };

    wrap.addEventListener('touchstart', onMagTouchStart, { passive: false, capture: true });
    wrap.addEventListener('touchmove', onMagTouchMove, { passive: false, capture: true });
    wrap.addEventListener('touchend', onMagTouchEnd, { passive: true, capture: true });
    wrap.addEventListener('touchcancel', onMagTouchEnd, { passive: true, capture: true });
    return () => {
      wrap.removeEventListener('touchstart', onMagTouchStart, { capture: true });
      wrap.removeEventListener('touchmove', onMagTouchMove, { capture: true });
      wrap.removeEventListener('touchend', onMagTouchEnd, { capture: true });
      wrap.removeEventListener('touchcancel', onMagTouchEnd, { capture: true });
    };
  }, [dragMag, pickEnabled, pickFromMagnifierEvent]);

  const clearImage = () => {
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPickedNorm(null);
    setHoverNorm(null);
  };

  useEffect(() => () => imageSrc && URL.revokeObjectURL(imageSrc), [imageSrc]);

  useEffect(() => {
    if (!imageSrc || !imgRef.current || !magRef.current) return;
    const img = imgRef.current;
    const norm = hoverNorm || pickedNorm || { nx: 0.5, ny: 0.5 };
    drawMagnifier({ img, magCanvas: magRef.current, nx: norm.nx, ny: norm.ny });
  }, [imageSrc, hoverNorm, pickedNorm]);

  const displayMarkerNorm = pickedNorm || hoverNorm;

  return (
    <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-300 via-fuchsia-300 to-pink-300 flex items-center justify-center shadow-sm">
            <ImagePlus size={18} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Photo to Palette
            </p>
            <p className="text-[11px] text-slate-500">
              스포이드 활성 시 사진 또는 오른쪽 확대 격자를 탭해 색을 추출합니다.
            </p>
          </div>
        </div>
      </div>

      {!imageSrc ? (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer p-6 transition-colors paint-swatch">
          <ImagePlus size={32} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">사진 업로드</span>
          <span className="text-[11px] text-slate-400">JPG, PNG 등 이미지 파일</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="이미지 업로드"
          />
        </label>
      ) : (
        <div className="space-y-2">
          <div
            className={`flex flex-col sm:flex-row gap-2 items-start rounded-2xl border border-slate-100/80 bg-white/50 p-2 shadow-inner ${
              pickEnabled ? 'ring-2 ring-sky-300/80' : ''
            }`}
          >
            <div
              ref={wrapRef}
              className="relative flex-1 min-w-0 rounded-xl overflow-hidden paint-swatch max-h-48"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="업로드된 사진"
                crossOrigin="anonymous"
                className={`w-full h-auto max-h-48 object-contain mx-auto block touch-manipulation ${
                  pickEnabled ? 'cursor-crosshair' : 'cursor-default'
                }`}
                style={{
                  // When sampling, disable browser gestures so touchstart is delivered reliably.
                  touchAction: pickEnabled ? 'none' : 'manipulation',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (hoverNorm) {
                    drawMagnifier({
                      img,
                      magCanvas: magRef.current,
                      nx: hoverNorm.nx,
                      ny: hoverNorm.ny
                    });
                  }
                }}
                onPointerEnter={(e) => {
                  setPointerInsideImage(true);
                  updateHoverFromEvent(e);
                }}
                onPointerLeave={() => {
                  setPointerInsideImage(false);
                  setHoverNorm(null);
                  const ctx = magRef.current?.getContext('2d');
                  if (ctx && magRef.current) ctx.clearRect(0, 0, magRef.current.width, magRef.current.height);
                }}
                onPointerMove={updateHoverFromEvent}
                onPointerDown={handleImagePick}
                onClick={handleImagePick}
                onTouchStart={handleImageTouchStart}
              />

              {/* dim overlay (very subtle, never blocks viewing) */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                style={{
                  opacity: pointerInsideImage ? 0.04 : 0.12,
                  background: 'rgba(0,0,0,0.10)'
                }}
              />

              {/* touch feedback flash (mobile) */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                style={{
                  opacity: touchFlash ? 0.22 : 0,
                  background: 'rgba(255,255,255,0.55)'
                }}
              />

              {displayMarkerNorm &&
                imgRef.current &&
                wrapRef.current &&
                (() => {
                  const g = getContainedImageRect(imgRef.current);
                  const wrapRect = wrapRef.current.getBoundingClientRect();
                  if (!g) return null;
                  const box = 10;
                  const left = g.ox - wrapRect.left + displayMarkerNorm.nx * g.dw - box / 2;
                  const top = g.oy - wrapRect.top + displayMarkerNorm.ny * g.dh - box / 2;
                  return (
                    <div
                      className="absolute pointer-events-none rounded-sm border-2 border-white shadow-md"
                      style={{
                        left,
                        top,
                        width: box,
                        height: box,
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
                      }}
                    />
                  );
                })()}

              {/* debugging: red tap dot */}
              {tapDot &&
                imgRef.current &&
                wrapRef.current &&
                (() => {
                  const g = getContainedImageRect(imgRef.current);
                  const wrapRect = wrapRef.current.getBoundingClientRect();
                  if (!g) return null;
                  const d = 6;
                  const left = g.ox - wrapRect.left + tapDot.nx * g.dw - d / 2;
                  const top = g.oy - wrapRect.top + tapDot.ny * g.dh - d / 2;
                  return (
                    <div
                      className="absolute pointer-events-none rounded-full"
                      style={{
                        left,
                        top,
                        width: d,
                        height: d,
                        background: 'rgba(255,0,0,0.95)',
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 2px 6px rgba(0,0,0,0.35)'
                      }}
                    />
                  );
                })()}
            </div>

            <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-1 pt-1">
              <div
                ref={magWrapRef}
                role="button"
                tabIndex={pickEnabled ? 0 : -1}
                onKeyDown={(e) => {
                  if (!pickEnabled) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const norm = pickedNorm || hoverNorm || { nx: 0.5, ny: 0.5 };
                    setTapDot({ nx: norm.nx, ny: norm.ny, at: Date.now() });
                    window.setTimeout(() => setTapDot(null), 260);
                    pickAtNormWithRetry(norm.nx, norm.ny);
                  }
                }}
                onPointerDownCapture={(e) => {
                  if (!pickEnabled) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragMag(true);
                  pickFromMagnifierEvent(e);
                }}
                onPointerMove={(e) => {
                  if (!pickEnabled || !dragMag) return;
                  pickFromMagnifierEvent(e);
                }}
                onPointerUp={() => setDragMag(false)}
                onPointerCancel={() => setDragMag(false)}
                className={`rounded-full border-2 border-slate-200 bg-slate-900/5 overflow-hidden shadow-md w-[92px] h-[92px] sm:w-[96px] sm:h-[96px] ${
                  pickEnabled ? 'cursor-crosshair ring-offset-2 ring-sky-200/80' : 'cursor-default'
                }`}
                style={{ touchAction: pickEnabled ? 'none' : 'manipulation' }}
                aria-label={pickEnabled ? '확대 격자에서 색 추출' : '확대 미리보기'}
              >
                <canvas ref={magRef} width={96} height={96} className="w-full h-full block pointer-events-none" />
              </div>
              <span className="text-[9px] text-slate-400 text-center leading-tight px-0.5">
                확대 · 촘촘한 격자
              </span>
            </div>
          </div>

          {/* tip moved below image: disappears after first successful pick */}
          {!hasPickedOnce && (
            <div className="text-center text-xs text-slate-500">
              {pickEnabled
                ? '사진/확대창을 탭해 색을 추출하세요.'
                : '스포이드를 켠 뒤 사진에서 색을 찍으세요.'}
            </div>
          )}

          <div className="text-center text-xs text-slate-500">
            선택한 색상이 실시간으로 조색 엔진에 반영됩니다.
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>목표 색은 App의 targetHex와 동기화됩니다.</span>
              <code className="rounded-full bg-white/90 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700">
                {(targetHex || '#000000').toUpperCase()}
              </code>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="text-slate-400 hover:text-slate-600 underline shrink-0"
            >
              이미지 제거
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default PhotoToPalette;
