import React from 'react';
import { Info } from 'lucide-react';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function MixingPreview({
  containerKey,
  baseMix,
  adjustedHex,
  adjustedMix,
  partsToShow,
  hasMix,
  waterAmount,
  setWaterAmount,
  PIGMENT_LIST,
  adjustments,
  adjustedPartsByKey,
  onChangePigmentFactor
}) {
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
          감산 혼합(CMY) 공간에서 근사 계산
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
            <div className="px-3 py-2.5 flex items-center justify-between text-[11px] text-slate-300">
              <span>조색 근사값{adjustedMix ? ' (조정 반영)' : ''}</span>
              <code className="font-mono">
                {adjustedHex.toUpperCase()}
              </code>
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

            <div className="mt-1 pt-3 border-t border-slate-800/70 space-y-2">
              <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                비율 조절
              </p>
              <p className="text-[11px] text-slate-400 mb-1">
                특정 색 물감을 더하거나 덜 넣었을 때 결과가 어떻게 달라지는지 슬라이더로
                시뮬레이션해 보세요. (기본값 100%)
              </p>
              <div className="space-y-3">
                {PIGMENT_LIST.map((p) => {
                  const factor = adjustments[p.key] ?? 1;
                  const current = adjustedPartsByKey[p.key]?.ratio ?? 0;
                  return (
                    <div key={p.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                            style={{ backgroundColor: p.hex }}
                          />
                          <span className="font-medium text-slate-100">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.key === 'water' ? (
                            <span className="text-slate-400">
                              물 추가: {waterAmount.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              조정: {(factor * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className="text-slate-400">
                            현재 비율: {formatPercent(current)}
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={p.key === 'water' ? 0 : 50}
                        max={p.key === 'water' ? 100 : 150}
                        value={p.key === 'water' ? Math.round(waterAmount) : Math.round(factor * 100)}
                        onChange={(e) => {
                          if (p.key === 'water') {
                            setWaterAmount(Number(e.target.value));
                            return;
                          }
                          onChangePigmentFactor(p.key, Number(e.target.value));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
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

