import React from 'react';
import { Info } from 'lucide-react';
import MixRatioEditor from './MixRatioEditor';
import { toRgb255 } from '../utils/colorFormats';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function MixingPreview({
  containerKey,
  baseMix,
  adjustedHex,
  partsToShow,
  hasMix,
  waterAmount,
  setWaterAmount,
  onChangePartWeight
}) {
  const rgb = toRgb255(adjustedHex);

  return (
    <div key={containerKey} className="rounded-3xl bg-slate-950/95 text-slate-50 p-4 md:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Mixing Preview
          </p>
          <p className="text-sm text-slate-300">
            실제 조색 결과는 사용하는 물감에 따라 달라질 수 있어요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info size={13} />
          안료 최대 4색 · 물 별도
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
            Target Color
          </p>
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="h-20 w-full" style={{ backgroundColor: baseMix.targetHex }} />
            <div className="px-3 py-2.5 flex items-center justify-between text-[11px] text-slate-300">
              <span>선택한 색</span>
              <code className="font-mono">{baseMix.targetHex.toUpperCase()}</code>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
            Mixed Result
          </p>
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="h-20 w-full relative" style={{ backgroundColor: adjustedHex }}>
              <div
                className="absolute inset-0 opacity-25 mix-blend-soft-light"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 0 0, rgba(255,255,255,0.7) 0, transparent 55%), radial-gradient(circle at 100% 100%, rgba(15,23,42,0.8) 0, transparent 60%)'
                }}
              />
            </div>
            <div className="px-3 py-2.5 text-[11px] text-slate-300 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>조색 근사값</span>
                <code className="font-mono">{adjustedHex.toUpperCase()}</code>
              </div>
              <p className="font-mono text-slate-400 text-right">
                RGB {rgb.r} {rgb.g} {rgb.b}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-4 rounded-full overflow-hidden bg-slate-800">
          <div
            className="h-full"
            style={{
              backgroundImage: `linear-gradient(to right, ${baseMix.targetHex}, ${adjustedHex})`
            }}
          />
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          목표 ↔ 조색
        </span>
      </div>

      <div className="mt-2 border-t border-slate-800/80 pt-3">
        <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase mb-1">
          Mixing Ratios
        </p>

        {hasMix ? (
          <>
            <div className="space-y-2 mb-4">
              {partsToShow.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-3 text-xs text-slate-100"
                >
                  <div className="flex items-center gap-2 min-w-[92px]">
                    <span
                      className="h-4 w-4 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-100 via-slate-50 to-amber-200"
                      style={{ width: formatPercent(p.ratio) }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] text-slate-300">
                    {formatPercent(p.ratio)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-1 pt-3 border-t border-slate-800/70">
              <MixRatioEditor
                parts={partsToShow}
                waterAmount={waterAmount}
                onChangePartWeight={onChangePartWeight}
                onChangeWater={setWaterAmount}
                resultHex={adjustedHex}
                tone="dark"
              />
            </div>
          </>
        ) : (
          <p className="text-[11px] text-slate-500">
            아직 조색 정보가 충분하지 않습니다. 상단에서 색상을 선택해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}

export default MixingPreview;
