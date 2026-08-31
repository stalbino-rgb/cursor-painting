import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ImagePlus } from 'lucide-react';
import { rgbToHex } from '../utils/mixing';
import { normalizeHexColor } from '../utils/hexNormalize';
import { colorSnapshot, emitColorSelect } from '../utils/colorFormats';
import { extractPhotoPalette, findNearestSwatch } from '../utils/extractPhotoPalette';
import ExtractedSwatchStrip from './ExtractedSwatchStrip';

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

function findSwatchElAtClient(host, clientX, clientY) {
  if (!host) return null;
  const row = host.querySelector('.swatch-h-scroll');
  if (!row) return null;
  const hostRect = host.getBoundingClientRect();
  if (clientY < hostRect.top - 6 || clientY > hostRect.bottom + 10) return null;
  const chips = row.querySelectorAll('[data-swatch]');
  if (!chips.length) return null;
  let inside = null;
  let nearest = null;
  let nearestD = Infinity;
  chips.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right) inside = el;
    const mid = (r.left + r.right) / 2;
    const d = Math.abs(clientX - mid);
    if (d < nearestD) {
      nearestD = d;
      nearest = el;
    }
  });
  return inside || nearest;
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
function PhotoToPalette({
  targetHex,
  onColorChange,
  pickEnabled,
  onPickComplete,
  onPaletteExtracted
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const wrapRef = useRef(null);
  const magRef = useRef(null);
  const magWrapRef = useRef(null);
  const lastEmitRef = useRef({ at: 0, hex: '' });
  const lastNormRef = useRef({ nx: 0.5, ny: 0.5 });
  const markerRef = useRef(null);
  const pixelsReadyRef = useRef(false);

  const [imageSrc, setImageSrc] = useState(null);
  const [pointerInsideImage, setPointerInsideImage] = useState(false);
  const [hoverNorm, setHoverNorm] = useState(null);
  const [pickedNorm, setPickedNorm] = useState(null);
  const [hasPickedOnce, setHasPickedOnce] = useState(false);
  const [touchFlash, setTouchFlash] = useState(false);
  const [tapDot, setTapDot] = useState(null); // { nx, ny, at }
  const [dragMag, setDragMag] = useState(false);
  const [extractedSwatches, setExtractedSwatches] = useState([]);
  const [activeSwatchHex, setActiveSwatchHex] = useState(null);
  const [liveSampleHex, setLiveSampleHex] = useState(null);
  const extractedSwatchesRef = useRef([]);
  const liveRafRef = useRef(0);
  const fileInputRef = useRef(null);
  const swatchHostRef = useRef(null);
  const overSwatchRef = useRef(null);

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

  const sampleHexAtNorm = useCallback((nx, ny) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return null;
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const maxDim = 400;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * scale));
      const h = Math.max(1, Math.round(nh * scale));
      if (!pixelsReadyRef.current || canvas.width !== w) {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        pixelsReadyRef.current = true;
      }
      const x = Math.min(w - 1, Math.max(0, Math.floor(nx * w)));
      const y = Math.min(h - 1, Math.max(0, Math.floor(ny * h)));
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
      onColorChange(newHex, { openPalette: false });
    }
    emitColorSelect(colorSnapshot(newHex, { source: 'photo-pick', action: 'mix' }));
    setActiveSwatchHex(newHex);
    setHasPickedOnce(true);
  }, [onColorChange]);

  const pendingHexRef = useRef(null);

  const syncSwatchToSample = useCallback((hex) => {
    if (!hex) return;
    pendingHexRef.current = hex;
    if (liveRafRef.current) return;
    liveRafRef.current = requestAnimationFrame(() => {
      liveRafRef.current = 0;
      const h = pendingHexRef.current;
      if (!h) return;
      setLiveSampleHex(h);
      const near = findNearestSwatch(h, extractedSwatchesRef.current);
      if (near?.hex) setActiveSwatchHex(near.hex);
    });
  }, []);

  const commitPickAtLoupe = useCallback(() => {
    const { nx, ny } = lastNormRef.current;
    const hexRaw = sampleHexAtNorm(nx, ny);
    if (!hexRaw) return;
    const hex = normalizeHexColor(hexRaw);
    setPickedNorm({ nx, ny });
    syncSwatchToSample(hex);
    reportHexToParent(hex);
  }, [reportHexToParent, sampleHexAtNorm, syncSwatchToSample]);

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
      setExtractedSwatches([]);
      setActiveSwatchHex(null);
      setLiveSampleHex(null);
      extractedSwatchesRef.current = [];
      pixelsReadyRef.current = false;
      e.target.value = '';
    })();
  };

  const trackPickAtClient = useCallback((clientX, clientY) => {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !imageSrc) return 'none';

    const hit = clientToNorm(clientX, clientY, img);
    if (hit) {
      overSwatchRef.current = null;
      lastNormRef.current = { nx: hit.nx, ny: hit.ny };
      drawMagnifier({ img, magCanvas: magRef.current, nx: hit.nx, ny: hit.ny });
      const sampleHex = sampleHexAtNorm(hit.nx, hit.ny);
      if (sampleHex) syncSwatchToSample(sampleHex);
      const marker = markerRef.current;
      if (marker && wrap) {
        const wrapRect = wrap.getBoundingClientRect();
        const box = 10;
        marker.style.left = `${hit.ox - wrapRect.left + hit.nx * hit.dw - box / 2}px`;
        marker.style.top = `${hit.oy - wrapRect.top + hit.ny * hit.dh - box / 2}px`;
        marker.style.opacity = '1';
      }
      setPointerInsideImage(true);
      return 'image';
    }

    setPointerInsideImage(false);
    const el = findSwatchElAtClient(swatchHostRef.current, clientX, clientY);
    if (el) {
      const hex = String(el.getAttribute('data-swatch') || '').toLowerCase();
      const swatch = extractedSwatchesRef.current.find(
        (s) => s.hex.toLowerCase() === hex
      );
      if (swatch) {
        overSwatchRef.current = swatch;
        setLiveSampleHex(swatch.hex);
        setActiveSwatchHex(swatch.hex);
        return 'swatch';
      }
    }
    return 'outside';
  }, [imageSrc, sampleHexAtNorm, syncSwatchToSample]);

  const finishPickAtClient = useCallback(
    (clientX, clientY) => {
      const where = trackPickAtClient(clientX, clientY);
      if (where === 'swatch' && overSwatchRef.current?.hex) {
        reportHexToParent(overSwatchRef.current.hex);
        return;
      }
      if (pickEnabled) commitPickAtLoupe();
    },
    [commitPickAtLoupe, pickEnabled, reportHexToParent, trackPickAtClient]
  );

  const handleImageTouchStart = useCallback(
    (e) => {
      const t = e.touches?.[0] || e.changedTouches?.[0];
      if (!t) return;
      trackPickAtClient(t.clientX, t.clientY);
    },
    [trackPickAtClient]
  );

  useEffect(() => {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap) return;

    const onNativeTouchStart = (evt) => {
      const touch = evt.touches?.[0] || evt.changedTouches?.[0];
      if (!touch) return;
      if (pickEnabled) {
        try {
          evt.preventDefault();
        } catch {
          // ignore
        }
      }
      trackPickAtClient(touch.clientX, touch.clientY);
    };

    const onNativeTouchMove = (evt) => {
      const touch = evt.touches?.[0] || evt.changedTouches?.[0];
      if (!touch) return;
      if (pickEnabled) {
        try {
          evt.preventDefault();
        } catch {
          // ignore
        }
      }
      trackPickAtClient(touch.clientX, touch.clientY);
    };

    const onNativeTouchEnd = (evt) => {
      const touch = evt.changedTouches?.[0] || evt.touches?.[0];
      if (touch) finishPickAtClient(touch.clientX, touch.clientY);
      else if (pickEnabled) commitPickAtLoupe();
    };

    wrap.addEventListener('touchstart', onNativeTouchStart, { passive: false, capture: true });
    wrap.addEventListener('touchmove', onNativeTouchMove, { passive: false, capture: true });
    wrap.addEventListener('touchend', onNativeTouchEnd, { passive: true, capture: true });
    img.addEventListener('touchstart', onNativeTouchStart, { passive: false, capture: true });
    img.addEventListener('touchmove', onNativeTouchMove, { passive: false, capture: true });
    img.addEventListener('touchend', onNativeTouchEnd, { passive: true, capture: true });
    return () => {
      wrap.removeEventListener('touchstart', onNativeTouchStart, { capture: true });
      wrap.removeEventListener('touchmove', onNativeTouchMove, { capture: true });
      wrap.removeEventListener('touchend', onNativeTouchEnd, { capture: true });
      img.removeEventListener('touchstart', onNativeTouchStart, { capture: true });
      img.removeEventListener('touchmove', onNativeTouchMove, { capture: true });
      img.removeEventListener('touchend', onNativeTouchEnd, { capture: true });
    };
  }, [pickEnabled, trackPickAtClient, finishPickAtClient, commitPickAtLoupe]);

  const clearImage = () => {
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPickedNorm(null);
    setHoverNorm(null);
    setExtractedSwatches([]);
    setActiveSwatchHex(null);
    setLiveSampleHex(null);
    extractedSwatchesRef.current = [];
    pixelsReadyRef.current = false;
  };

  useEffect(() => () => imageSrc && URL.revokeObjectURL(imageSrc), [imageSrc]);

  useEffect(() => {
    if (!imageSrc) return undefined;
    const img = imgRef.current;
    if (!img) return undefined;
    let cancelled = false;

    const runExtract = () => {
      if (cancelled || !img.naturalWidth) return;
      try {
        const palette = extractPhotoPalette(img, { maxColors: 48 });
        if (cancelled) return;
        extractedSwatchesRef.current = palette;
        setExtractedSwatches(palette);
        if (palette[0]?.hex) setActiveSwatchHex(palette[0].hex);
        if (typeof onPaletteExtracted === 'function') onPaletteExtracted(palette);
      } catch {
        if (!cancelled) {
          extractedSwatchesRef.current = [];
          setExtractedSwatches([]);
        }
      }
    };

    const start = () => {
      window.setTimeout(runExtract, 50);
    };
    if (img.complete && img.naturalWidth) {
      start();
    } else {
      img.addEventListener('load', start);
    }
    return () => {
      cancelled = true;
      img.removeEventListener('load', start);
    };
  }, [imageSrc, onPaletteExtracted]);

  useEffect(() => {
    if (!imageSrc || !imgRef.current || !magRef.current) return;
    const n = lastNormRef.current;
    drawMagnifier({ img: imgRef.current, magCanvas: magRef.current, nx: n.nx, ny: n.ny });
  }, [imageSrc]);

  return (
    <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-3 sm:p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-300 via-fuchsia-300 to-pink-300 flex items-center justify-center shadow-sm">
            <ImagePlus size={14} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Photo to Palette
            </p>
            <p className="text-[10px] text-slate-500">
              스와치를 밀어 더 많은 색을 보고, 스포이드를 켠 뒤 사진을 문지르면 확대가 따라갑니다.
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="이미지 업로드"
      />

      {!imageSrc ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer p-6 transition-colors"
        >
          <ImagePlus size={32} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">사진 업로드</span>
          <span className="text-[11px] text-slate-400">JPG, PNG 등 이미지 파일</span>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div
            ref={wrapRef}
            className={`relative bg-slate-100 ${pickEnabled ? 'ring-2 ring-inset ring-sky-300/80' : ''}`}
          >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="업로드된 사진"
                crossOrigin="anonymous"
              className={`w-full h-auto max-h-56 sm:max-h-72 object-contain mx-auto block touch-manipulation ${
                pickEnabled ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{
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
                const n = lastNormRef.current;
                drawMagnifier({ img, magCanvas: magRef.current, nx: n.nx, ny: n.ny });
              }}
              onPointerEnter={(e) => {
                trackPickAtClient(e.clientX, e.clientY);
              }}
              onPointerLeave={() => {
                setPointerInsideImage(false);
              }}
              onPointerMove={(e) => trackPickAtClient(e.clientX, e.clientY)}
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // ignore
                }
                trackPickAtClient(e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                finishPickAtClient(e.clientX, e.clientY);
              }}
              onTouchStart={handleImageTouchStart}
              />

              {/* dim overlay (very subtle, never blocks viewing) */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                style={{
                  opacity: pointerInsideImage ? 0.02 : 0.04,
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

              <div
                ref={markerRef}
                className="absolute pointer-events-none rounded-sm border-2 border-white shadow-md opacity-0"
                style={{
                  width: 10,
                  height: 10,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
                }}
              />

            <div className="absolute right-1.5 top-1.5 z-20 flex flex-col items-center gap-1.5">
              <div
                ref={magWrapRef}
                className="rounded-full border-2 border-white/90 overflow-hidden shadow-md w-14 h-14 pointer-events-none"
                aria-hidden
              >
                <canvas ref={magRef} width={96} height={96} className="w-full h-full block" />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full bg-sky-500 text-white shadow-md flex items-center justify-center"
                aria-label="다른 사진 업로드"
              >
                <ImagePlus size={16} />
              </button>
            </div>
          </div>

          <ExtractedSwatchStrip
            hostRef={swatchHostRef}
            swatches={extractedSwatches}
            selectedHex={activeSwatchHex}
            liveHex={liveSampleHex}
            onSelect={(swatch) => {
              if (!swatch?.hex) return;
              setActiveSwatchHex(swatch.hex);
              setLiveSampleHex(swatch.hex);
              reportHexToParent(swatch.hex);
            }}
          />
        </div>
      )}

      {imageSrc ? (
        <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500">
          <span>{extractedSwatches.length ? `${extractedSwatches.length}색 · 가로로 밀어 보세요` : '추출 중…'}</span>
          <button type="button" onClick={clearImage} className="text-slate-400 hover:text-slate-600 underline shrink-0">
            이미지 제거
          </button>
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default PhotoToPalette;
