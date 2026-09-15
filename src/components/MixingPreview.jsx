import React from 'react';
import { Info, X } from 'lucide-react';
import MixRatioEditor from './MixRatioEditor';
import { toRgb255 } from '../utils/colorFormats';
import { MAX_MIX_COLORS } from '../utils/mixPools';

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
  onChangePartWeight,
  selectedMixColors = [],
  onClearMixPicks,
  onRemoveMixPick
}) {
  const rgb = toRgb255(adjustedHex);
  const usingPicks = selectedMixColors.length > 0;

  return (
    <div key={containerKey} className="rounded-3xl bg-slate-950/95 text-slate-50 p-4 md:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Mixing Preview
          </p>
          <p className="text-sm text-slate-300">
            {usingPicks
              ? `고른 물감 ${selectedMixColors.length}/${MAX_MIX_COLORS}색으로 목표색을 조색합니다.`
              : '실제 조색 결과는 사용하는 물감에 따라 달라질 수 있어요.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info size={13} />
          안료 최대 4색 · 물 별도
        </div>
      </div>

      {usingPicks ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {selectedMixColors.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onRemoveMixPick?.(c.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 pl-1 pr-2 py-0.5 text-[11px] text-slate-200"
              title="선택 해제"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/30"
                style={{ backgroundColor: c.hex }}
              />
              <span className="max-w-[7rem] truncate">{c.koName || c.name}</span>
              <X size={11} className="text-slate-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClearMixPicks}
            className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            선택 해제
          </button>
        </div>
      ) : null}

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
