import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { calculateMixForHex } from '../utils/mixing';
import { calculateSparseMixPreferCaran } from '../utils/colorPickerUtils';
import {
  detectColorMixMode,
  getMixPoolForMode,
  getMixModeHint,
  MIX_MODE_OPTIONS,
  MAX_MIX_COLORS
} from '../utils/mixPools';
import MixingAnimation from './MixingAnimation';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function safeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#000000';
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function ColorDetailModal({ color, onClose, onApplyToTarget }) {
  const brandMode = detectColorMixMode(color);
  const brandMeta = MIX_MODE_OPTIONS.find((o) => o.id === brandMode);

  const mix = useMemo(() => {
    if (!color?.hex) return null;
    const hex = safeHex(color.hex);
    try {
      if (brandMode) {
        const pool = getMixPoolForMode(brandMode);
        const exact = pool.find((c) => String(c.hex).toLowerCase() === hex.toLowerCase());
        if (exact) {
          return {
            approximateHex: exact.hex,
            parts: [{ ...exact, ratio: 1, key: exact.key || exact.hex }]
          };
        }
        return calculateSparseMixPreferCaran(hex, pool, {
          maxK: MAX_MIX_COLORS,
          candidateLimit: 20,
          minRatio: 0.03
        });
      }
      const base = calculateMixForHex(hex);
      return {
        approximateHex: base.approximateHex,
        parts: (base.parts || []).slice(0, MAX_MIX_COLORS)
      };
    } catch {
      try {
        return calculateMixForHex(hex);
      } catch {
        return { approximateHex: hex, parts: [] };
      }
    }
  }, [color, brandMode]);

  if (!color) return null;

  const hex = safeHex(color.hex);
  const parts = mix?.parts ?? [];
  const hasMix = parts.length > 0;
  const koName = color.koName;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-[70] overflow-y-auto flex items-start justify-center pt-8 pb-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-detail-title"
      >
        <div className="w-full max-w-2xl">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <div className="min-w-0">
                  <h2 id="color-detail-title" className="text-lg font-semibold text-slate-900 truncate">
                    {color.name || 'Color'}
                  </h2>
                  {koName ? <p className="text-sm text-slate-500 truncate">{koName}</p> : null}
                  <p className="text-sm font-mono text-slate-500">{hex.toUpperCase()}</p>
                  {brandMeta ? (
                    <p className="text-[11px] text-slate-500 mt-0.5">{brandMeta.label} 등록 색상</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5">미등록 그룹 · Base Colors 6색 조색</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                aria-label="닫기"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {hasMix && (
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase mb-3">
                    디지털 팔레트
                  </p>
                  <MixingAnimation
                    parts={parts.map((p, i) => ({ ...p, key: p.key ?? `${p.hex}-${i}` }))}
                    resultHex={mix.approximateHex || hex}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500">목표 색</p>
                  <div className="h-16 rounded-2xl border border-slate-200 shadow-inner" style={{ backgroundColor: hex }} />
                  <p className="text-xs font-mono text-slate-600">{hex.toUpperCase()}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    {brandMode ? '조색 결과 (브랜드 풀)' : '조색 결과 (Base Colors)'}
                  </p>
                  <div
                    className="h-16 rounded-2xl border border-slate-200 shadow-inner"
                    style={{ backgroundColor: mix?.approximateHex ?? hex }}
                  />
                  <p className="text-xs font-mono text-slate-600">
                    {String(mix?.approximateHex ?? hex).toUpperCase()}
                  </p>
                </div>
              </div>

              {brandMode ? (
                <p className="text-[11px] text-slate-500">{getMixModeHint(brandMode)}</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  등록되지 않은 색은 워터·레드·옐로우·블루·화이트·블랙 기본색 조합으로 안내합니다.
                </p>
              )}

              {hasMix ? (
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase mb-3">
                    필요한 색상 비율
                  </p>
                  <div className="space-y-2">
                    {parts.map((p, i) => (
                      <div key={p.key ?? `${p.hex}-${i}`} className="flex items-center gap-3 text-sm text-slate-700">
                        <div
                          className="w-8 h-8 rounded-xl border border-white shadow-md shrink-0"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="font-medium min-w-[100px] truncate">{p.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-slate-200 to-slate-300"
                            style={{ width: formatPercent(p.ratio || 0) }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-10 text-right">
                          {formatPercent(p.ratio || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">이 색상에 대한 조색 정보를 계산할 수 없습니다.</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyToTarget?.(hex);
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
