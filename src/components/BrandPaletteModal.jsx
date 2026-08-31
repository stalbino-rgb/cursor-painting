import React, { useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';
import { calculateSparseMixPreferCaran, formatPartNameWithBadges } from '../utils/colorPickerUtils';
import { getNearestColorInPalette } from '../utils/paletteMatching';
import { normalizeHexColor } from '../utils/hexNormalize';
import { getMixPoolForMode, getMixModeHint, MIX_MODE_OPTIONS, MAX_MIX_COLORS } from '../utils/mixPools';
import MixingAnimation from './MixingAnimation';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function formatNo(no) {
  if (typeof no !== 'number') return '';
  return String(no);
}

function BrandPaletteModal({ mixMode, targetHex, open, onClose, onApplyNearestAsTarget }) {
  const meta = MIX_MODE_OPTIONS.find((o) => o.id === mixMode) || MIX_MODE_OPTIONS[0];
  const pool = useMemo(() => (mixMode ? getMixPoolForMode(mixMode) : []), [mixMode]);

  const palette = useMemo(
    () => ({
      id: mixMode,
      name: meta.label,
      brand: meta.label,
      colors: pool
    }),
    [mixMode, meta.label, pool]
  );

  const nearest = useMemo(
    () => (targetHex && pool.length ? getNearestColorInPalette(normalizeHexColor(targetHex), palette) : null),
    [targetHex, palette, pool.length]
  );

  const mix = useMemo(() => {
    if (!targetHex || !pool.length) return null;
    const t = normalizeHexColor(targetHex);
    const exact = pool.find((c) => normalizeHexColor(c.hex) === t);
    if (exact) {
      return {
        approximateHex: exact.hex,
        parts: [{ ...exact, ratio: 1, key: exact.key || exact.hex }]
      };
    }
    return calculateSparseMixPreferCaran(targetHex, pool, {
      maxK: MAX_MIX_COLORS,
      candidateLimit: 20,
      minRatio: 0.03
    });
  }, [targetHex, pool]);

  const parts = mix?.parts ?? [];
  const hasMix = parts.length > 0;

  const nearestLabel = useMemo(() => {
    if (!nearest) return '—';
    const n = formatNo(nearest.no ?? nearest.prismaNo ?? nearest.shieldNo ?? nearest.mijelloNo ?? nearest.shinhanNo);
    const base = n ? `No.${n} ${nearest.name}` : nearest.name;
    if (nearest.isCaran30 || nearest.brand === "Caran d'Ache") return `${base} (30)`;
    return base;
  }, [nearest]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-8 md:inset-12 z-50 overflow-y-auto flex items-start justify-center pt-8 pb-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-200 via-amber-200 to-rose-200 flex items-center justify-center shadow-sm">
                  <Sparkles size={18} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    {meta.label} 조색
                  </p>
                  <p className="text-[11px] text-slate-500">{getMixModeHint(mixMode)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase mb-2">
                  가장 가까운 색상
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">목표</p>
                    <div className="h-14 rounded-2xl border border-slate-200 shadow-inner" style={{ backgroundColor: targetHex }} />
                    <code className="text-[11px] font-mono text-slate-600">{String(targetHex || '').toUpperCase()}</code>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">Nearest</p>
                    <div
                      className="h-14 rounded-2xl border border-slate-200 shadow-inner"
                      style={{ backgroundColor: nearest?.hex ?? '#ffffff' }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 truncate">{nearestLabel}</span>
                      <code className="text-[11px] font-mono text-slate-600 shrink-0">
                        {String(nearest?.hex || '').toUpperCase()}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {hasMix && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">
                    디지털 팔레트 · 필요 색상 비율 (최대 {MAX_MIX_COLORS}색)
                  </p>
                  <MixingAnimation parts={parts.map((p) => ({ ...p, key: p.key ?? p.hex }))} resultHex={mix.approximateHex} />
                  <div className="space-y-2">
                    {parts
                      .slice()
                      .sort((a, b) => (b.ratio || 0) - (a.ratio || 0))
                      .map((p, i) => (
                        <div key={p.key ?? `${p.hex}-${i}`} className="flex items-center gap-3 text-sm text-slate-700">
                          <div className="w-8 h-8 rounded-xl border border-white shadow-md shrink-0" style={{ backgroundColor: p.hex }} />
                          <span className="font-medium min-w-[140px] truncate">{formatPartNameWithBadges(p)}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/80 border border-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-slate-300 to-slate-400"
                              style={{ width: formatPercent(p.ratio) }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 w-10 text-right">{formatPercent(p.ratio)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => nearest?.hex && onApplyNearestAsTarget?.(nearest)}
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

export default BrandPaletteModal;
