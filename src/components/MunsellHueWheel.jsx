import React, { useMemo } from 'react';
import { MUNSELL_40_HUES, MAJOR_HUES, munsellHueToApproxHex } from '../utils/munsell';

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function MunsellHueWheel({ value = 5, chroma = 10, selectedHueId, onSelectHue }) {
  const items = useMemo(() => {
    return MUNSELL_40_HUES.map((h) => ({
      ...h,
      // Keep wheel colors stable by using hue anchors (not current V/C)
      hex: munsellHueToApproxHex(h.step, h.major)
    }));
  }, [value, chroma]);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const rSwatch = 120;
  const rText = 153;

  return (
    <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Munsell Hue Wheel (40)
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            원형 스와치에서 색상(H)을 선택하세요.
          </p>
        </div>
      </div>

      <div className="w-full flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
          {/* center */}
          <circle cx={cx} cy={cy} r={54} fill="rgba(15,23,42,0.04)" />
          <circle cx={cx} cy={cy} r={52} fill="rgba(255,255,255,0.65)" stroke="rgba(148,163,184,0.35)" />

          {items.map((h) => {
            const angle = h.angle;
            const p = polarToCartesian(cx, cy, rSwatch, angle);
            const pt = polarToCartesian(cx, cy, rText, angle);
            const isSelected = selectedHueId === h.id;
            const label = h.step === 10 ? h.major : `${h.step}${h.major}`;
            return (
              <g key={h.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill={h.hex}
                  stroke={isSelected ? 'rgba(2,132,199,1)' : 'rgba(255,255,255,0.9)'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="drop-shadow"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectHue?.(h)}
                />
                <text
                  x={pt.x}
                  y={pt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill={isSelected ? '#0369a1' : 'rgba(51,65,85,0.9)'}
                  style={{ fontWeight: isSelected ? 700 : 500 }}
                  cursor="pointer"
                  onClick={() => onSelectHue?.(h)}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Major hue reference table */}
      <div className="mt-3 rounded-2xl bg-slate-50/80 border border-slate-100 px-3 py-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase mb-2">
          Major Hue Reference (10)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {MAJOR_HUES.map((h) => (
            <div
              key={h.code}
              className="rounded-xl bg-white/80 border border-slate-100 px-2.5 py-2 text-[11px] text-slate-600"
            >
              <div className="font-semibold text-slate-700">{h.code}</div>
              <div className="text-slate-500">
                {h.en} / {h.ko}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MunsellHueWheel;

