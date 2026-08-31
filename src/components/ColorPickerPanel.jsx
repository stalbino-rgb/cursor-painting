import React, { useCallback, useRef, useState } from 'react';
import { Pipette } from 'lucide-react';
import { hexToHsv, hsvToHex } from '../utils/colorUtils';
import { hexToRgb, rgbToHex } from '../utils/mixing';
import { normalizeHexColor } from '../utils/hexNormalize';

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

/**
 * HSV UI는 항상 부모가 넘긴 `hex`에서 파생합니다 (로컬 h/s/v state 없음).
 * 사진 추출·스와치 등으로 `hex`만 바뀌어도 스펙트럼·RGB가 즉시 맞춰집니다.
 */
function ColorPickerPanel({
  targetHex,
  hex,
  onChange,
  photoPickActive,
  onEnterPhotoPickMode,
  onExitPhotoPickMode
}) {
  const props = { targetHex, hex };
  console.log('TRACE [Picker]: 피커가 받은 Props =', props.targetHex);
  console.log('디버깅: 피커가 받은 Props =', targetHex);
  const safeHex = normalizeHexColor(targetHex ?? hex);
  const { h, s, v } = hexToHsv(safeHex);

  const svRef = useRef(null);
  const hueRef = useRef(null);
  const [dragSv, setDragSv] = useState(false);
  const [dragHue, setDragHue] = useState(false);

  const readSvFromEvent = useCallback((e) => {
    const el = svRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const y = clamp01((e.clientY - r.top) / r.height);
    const ns = x;
    const nv = 1 - y;
    const hue = hexToHsv(normalizeHexColor(safeHex)).h;
    const newHex = hsvToHex(hue, clamp01(ns), clamp01(nv));
    console.log('TRACE [Picker]: 피커 조작 ->', newHex);
    onChange?.(newHex);
  }, [onChange, safeHex]);

  const readHueFromEvent = useCallback((e) => {
    const el = hueRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const nh = x * 360;
    const { s: cs, v: cv } = hexToHsv(normalizeHexColor(safeHex));
    const newHex = hsvToHex(nh, clamp01(cs), clamp01(cv));
    console.log('TRACE [Picker]: 피커 조작 ->', newHex);
    onChange?.(newHex);
  }, [onChange, safeHex]);

  const rgb = hexToRgb(safeHex);
  const r8 = Math.round(rgb[0] * 255);
  const g8 = Math.round(rgb[1] * 255);
  const b8 = Math.round(rgb[2] * 255);

  const setChannel = (channel, value) => {
    const n = Math.min(255, Math.max(0, Number(value) || 0));
    const nextRgb =
      channel === 'r'
        ? [n / 255, rgb[1], rgb[2]]
        : channel === 'g'
          ? [rgb[0], n / 255, rgb[2]]
          : [rgb[0], rgb[1], n / 255];
    const newHex = rgbToHex(nextRgb);
    console.log('TRACE [Picker]: 피커 조작 ->', newHex);
    onChange?.(newHex);
  };

  const handleEyedropper = () => {
    if (photoPickActive) {
      onExitPhotoPickMode?.();
      return;
    }
    // Native EyeDropper steals the pointer on desktop and freezes our photo loupe.
    // Photo sampling is the intended path for this app.
    onEnterPhotoPickMode?.();
  };

  const hueBg =
    'linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-inner space-y-3">
      <div
        ref={svRef}
        className="relative h-36 w-full rounded-xl overflow-hidden cursor-crosshair touch-none select-none ring-1 ring-slate-200/60"
        style={{
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, hsla(0,0%,100%,0)),
            hsl(${h}, 100%, 50%)
          `
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragSv(true);
          readSvFromEvent(e);
        }}
        onPointerMove={(e) => {
          if (!dragSv) return;
          readSvFromEvent(e);
        }}
        onPointerUp={() => setDragSv(false)}
        onPointerCancel={() => setDragSv(false)}
      >
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{
            left: `${s * 100}%`,
            top: `${(1 - v) * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.35)'
          }}
        />
      </div>

      <div className="relative">
        <div
          ref={hueRef}
          className="h-3 w-full rounded-full cursor-pointer touch-none ring-1 ring-slate-200/60"
          style={{ background: hueBg }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragHue(true);
            readHueFromEvent(e);
          }}
          onPointerMove={(e) => {
            if (!dragHue) return;
            readHueFromEvent(e);
          }}
          onPointerUp={() => setDragHue(false)}
          onPointerCancel={() => setDragHue(false)}
        />
        <div
          className="absolute top-1/2 w-0 h-0 pointer-events-none"
          style={{
            left: `${(h / 360) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative -translate-y-1/2">
            <div className="w-2.5 h-5 rounded-sm bg-white border-2 border-slate-800 shadow-md" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleEyedropper}
          className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border shadow-sm transition-colors ${
            photoPickActive
              ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          title={
            photoPickActive
              ? '사진에서 색을 찍어 주세요'
              : '사진 스포이드 켜기'
          }
          aria-pressed={photoPickActive}
        >
          <Pipette size={18} strokeWidth={2} />
        </button>
        <div className="flex-1 grid grid-cols-3 gap-2 text-[11px]">
          <label className="flex flex-col gap-0.5 text-slate-500">
            <span>R</span>
            <input
              type="number"
              min={0}
              max={255}
              value={r8}
              onChange={(e) => setChannel('r', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-1.5 py-1 font-mono text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-slate-500">
            <span>G</span>
            <input
              type="number"
              min={0}
              max={255}
              value={g8}
              onChange={(e) => setChannel('g', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-1.5 py-1 font-mono text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-slate-500">
            <span>B</span>
            <input
              type="number"
              min={0}
              max={255}
              value={b8}
              onChange={(e) => setChannel('b', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-1.5 py-1 font-mono text-slate-800"
            />
          </label>
        </div>
      </div>

      {photoPickActive && (
        <p className="text-[11px] text-sky-700 bg-sky-50/90 border border-sky-100 rounded-lg px-2 py-1.5">
          사진을 문지르면 원형 확대가 따라갑니다. 손을 떼거나 클릭하면 그 색으로 조색합니다. 버튼을 다시 누르면 꺼집니다.
        </p>
      )}
    </div>
  );
}

export default ColorPickerPanel;
