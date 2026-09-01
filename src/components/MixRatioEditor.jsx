import React from 'react';
import { toRgb255 } from '../utils/colorFormats';
import { WATER_PIGMENT, isWaterPart } from '../utils/mixing';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

/**
 * Live mix-ratio sliders for current pigments + water (water is not a pigment slot).
 */
function MixRatioEditor({
  parts,
  waterAmount,
  onChangePartWeight,
  onChangeWater,
  resultHex,
  tone = 'dark'
}) {
  const pigments = (parts || []).filter((p) => !isWaterPart(p));
  const rgb = resultHex ? toRgb255(resultHex) : { r: 255, g: 255, b: 255 };
  const label = tone === 'light' ? 'text-slate-600' : 'text-slate-400';
  const name = tone === 'light' ? 'text-slate-800' : 'text-slate-100';
  const box =
    tone === 'light'
      ? 'rounded-xl bg-white border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-700'
      : 'rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 font-mono text-[11px] text-slate-200';
  const heading = tone === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="space-y-3">
      <p className={`text-[11px] font-medium tracking-[0.18em] uppercase ${heading}`}>
        비율 조절
      </p>
      <p className={`text-[11px] ${label}`}>
        슬라이더로 물감 비율을 바꾸면 팔레트와 혼색 결과가 바로 바뀝니다. 물은 안료 4색 한도에 포함되지
        않습니다.
      </p>
      <div className="space-y-3">
        {pigments.map((p) => {
          const weight = Math.round(Number(p.weight ?? (p.ratio || 0) * 100) || 0);
          return (
            <label key={p.key ?? p.hex} className="block space-y-1">
              <div className={`flex items-center justify-between gap-2 text-[11px] ${label}`}>
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/50 shadow-sm shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className={`font-medium truncate ${name}`}>{p.name}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatPercent(p.ratio || 0)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.min(100, Math.max(1, weight))}
                onChange={(e) => onChangePartWeight?.(p.key, Number(e.target.value))}
                className="w-full accent-sky-500"
                aria-label={`${p.name} 비율`}
              />
            </label>
          );
        })}
        <label className="block space-y-1">
          <div className={`flex items-center justify-between gap-2 text-[11px] ${label}`}>
            <span className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full border border-sky-200 shadow-sm"
                style={{ backgroundColor: WATER_PIGMENT.hex }}
              />
              <span className={`font-medium ${name}`}>{WATER_PIGMENT.name}</span>
              <span className="text-[10px]">안료 제외</span>
            </span>
            <span className="shrink-0 tabular-nums">{Math.round(waterAmount || 0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(waterAmount || 0)}
            onChange={(e) => onChangeWater?.(Number(e.target.value))}
            className="w-full accent-sky-400"
            aria-label="물 비율"
          />
        </label>
      </div>
      <div className={`${box} flex flex-wrap items-center justify-between gap-2`}>
        <span>{String(resultHex || '').toUpperCase()}</span>
        <span>
          RGB {rgb.r} {rgb.g} {rgb.b}
        </span>
      </div>
    </div>
  );
}

export default MixRatioEditor;
