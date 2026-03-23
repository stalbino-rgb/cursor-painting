import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { calculateMixFromLibrary } from '../utils/mixing';
import { MIXING_PALETTE } from '../data/colorLibrary';
import { DEFAULT_NEAREST_PALETTE_ORDER, PALETTE_REGISTRY } from '../data/colorData';
import { collectNearestPaletteCandidates } from '../utils/paletteMatching';
import MixingAnimation from './MixingAnimation';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function ColorDetailModal({ color, onClose, onApplyToTarget }) {
  const nearestPalette = useMemo(
    () =>
      color
        ? collectNearestPaletteCandidates(color.hex, {
            palettes: PALETTE_REGISTRY,
            priorityPaletteIds: DEFAULT_NEAREST_PALETTE_ORDER,
            maxPerPalette: 14,
            maxTotal: 28
          })
        : null,
    [color?.hex]
  );

  const preferredNearest = nearestPalette?.nearestByPalette?.[0] || null;
  const preferredPaletteMix = useMemo(
    () =>
      nearestPalette?.candidates?.length
        ? nearestPalette.candidates.map((c) => ({
            name: c.name,
            hex: c.hex
          }))
        : MIXING_PALETTE,
    [nearestPalette]
  );

  const mix = useMemo(
    () => (color ? calculateMixFromLibrary(color.hex, preferredPaletteMix) : null),
    [color?.hex, preferredPaletteMix]
  );

  if (!color) return null;

  const parts = mix?.parts ?? [];
  const hasMix = parts.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-50 overflow-y-auto flex items-start justify-center pt-8 pb-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-detail-title"
      >
        <div className="w-full max-w-2xl">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <h2 id="color-detail-title" className="text-lg font-semibold text-slate-900">
                    {color.name}
                  </h2>
                  <p className="text-sm font-mono text-slate-500">{color.hex.toUpperCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="닫기"
              >
                <X size={22} />
              </button>
            </div>

            {/* content */}
            <div className="p-6 space-y-6">
              {preferredNearest && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] text-slate-500">
                    Nearest Palette 우선 참조:
                    <span className="ml-1 font-medium text-slate-700">
                      {preferredNearest.paletteBrand} {preferredNearest.paletteName}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    가장 가까운 색상: <span className="font-medium">{preferredNearest.name}</span>{' '}
                    <span className="font-mono">{preferredNearest.hex.toUpperCase()}</span>
                  </p>
                </div>
              )}

              {/* mixing animation - using library colors as droplets */}
              {hasMix && (
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase mb-3">
                    라이브러리 색상 혼합 시뮬레이션
                  </p>
                  <MixingAnimation
                    parts={parts.map((p) => ({ ...p, key: p.key ?? p.hex }))}
                    resultHex={mix.approximateHex}
                  />
                </div>
              )}

              {/* target vs mixed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500">목표 색</p>
                  <div
                    className="h-16 rounded-2xl border border-slate-200 shadow-inner"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-xs font-mono text-slate-600">{color.hex.toUpperCase()}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500">조색 결과 (라이브러리 기반)</p>
                  <div
                    className="h-16 rounded-2xl border border-slate-200 shadow-inner"
                    style={{ backgroundColor: mix?.approximateHex ?? color.hex }}
                  />
                  <p className="text-xs font-mono text-slate-600">
                    {(mix?.approximateHex ?? color.hex).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* mixing recipe - library colors to use */}
              {hasMix ? (
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase mb-3">
                    필요한 라이브러리 색상 비율
                  </p>
                  <div className="space-y-2">
                    {parts.map((p) => (
                      <div
                        key={p.key}
                        className="flex items-center gap-3 text-sm text-slate-700"
                      >
                        <div
                          className="w-8 h-8 rounded-xl border border-white shadow-md shrink-0"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="font-medium min-w-[100px]">{p.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-slate-200 to-slate-300"
                            style={{ width: formatPercent(p.ratio) }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-10 text-right">
                          {formatPercent(p.ratio)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">이 색상에 대한 조색 정보를 계산할 수 없습니다.</p>
              )}

              {/* actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyToTarget?.(color.hex);
                    onClose?.();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md"
                >
                  이 색상을 목표로 설정
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ColorDetailModal;
