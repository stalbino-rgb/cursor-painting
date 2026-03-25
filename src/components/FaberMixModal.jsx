import React, { useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';
import { calculateMixFromLibrary } from '../utils/mixing';
import { getNearestColorInPalette } from '../utils/paletteMatching';
import { FABER_CASTELL_ALBRECHT_DURER_72 } from '../data/colorData';
import MixingAnimation from './MixingAnimation';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function normalizeHex(hex) {
  if (!hex) return '';
  const s = String(hex).trim().toUpperCase();
  if (s.startsWith('#') && s.length === 7) return s;
  if (!s.startsWith('#') && s.length === 6) return `#${s}`;
  return s;
}

function FaberMixModal({ targetHex, open, onClose, onApplyNearestAsTarget }) {
  const nearest = useMemo(
    () => (targetHex ? getNearestColorInPalette(targetHex, FABER_CASTELL_ALBRECHT_DURER_72) : null),
    [targetHex]
  );

  const mix = useMemo(() => {
    if (!targetHex) return null;
    const t = normalizeHex(targetHex);
    const exact = FABER_CASTELL_ALBRECHT_DURER_72.colors.find((c) => normalizeHex(c.hex) === t);
    if (exact) {
      return {
        approximateHex: exact.hex,
        parts: [
          {
            name: exact.name,
            hex: exact.hex,
            no: exact.no,
            key: `faber-${exact.no}`,
            ratio: 1
          }
        ]
      };
    }
    const list = FABER_CASTELL_ALBRECHT_DURER_72.colors.map((c) => ({
      name: c.name,
      hex: c.hex,
      no: c.no,
      key: `faber-${c.no}`
    }));
    return calculateMixFromLibrary(targetHex, list, 0.03);
  }, [targetHex]);

  const parts = mix?.parts ?? [];
  const hasMix = parts.length > 0;

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
                    Faber-Castell 조색
                  </p>
                  <p className="text-[11px] text-slate-500">
                    목표색에 가장 가까운 색연필과 추천 조합을 먼저 확인하세요.
                  </p>
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
              {/* nearest */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase mb-2">
                  가장 가까운 색상
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">목표</p>
                    <div className="h-14 rounded-2xl border border-slate-200 shadow-inner" style={{ backgroundColor: targetHex }} />
                    <code className="text-[11px] font-mono text-slate-600">{targetHex?.toUpperCase()}</code>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">Nearest (Faber 72)</p>
                    <div
                      className="h-14 rounded-2xl border border-slate-200 shadow-inner"
                      style={{ backgroundColor: nearest?.hex ?? '#ffffff' }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {nearest?.no ? `No.${nearest.no} ` : ''}{nearest?.name ?? '—'}
                      </span>
                      <code className="text-[11px] font-mono text-slate-600">{nearest?.hex?.toUpperCase?.() ?? ''}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* mix list */}
              {hasMix && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">
                    필요한 색상 비율 (Faber 72 내부 조합)
                  </p>
                  <MixingAnimation parts={parts.map((p) => ({ ...p, key: p.key ?? p.hex }))} resultHex={mix.approximateHex} />
                  <div className="space-y-2">
                    {parts
                      .slice()
                      .sort((a, b) => b.ratio - a.ratio)
                      .map((p) => (
                        <div key={p.key} className="flex items-center gap-3 text-sm text-slate-700">
                          <div className="w-8 h-8 rounded-xl border border-white shadow-md shrink-0" style={{ backgroundColor: p.hex }} />
                          <span className="font-medium min-w-[140px] truncate">
                            {typeof p.no === 'number' ? `No.${p.no} ` : ''}{p.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-white/80 border border-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-slate-300 to-slate-400" style={{ width: formatPercent(p.ratio) }} />
                          </div>
                          <span className="text-xs font-medium text-slate-500 w-10 text-right">{formatPercent(p.ratio)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* actions */}
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
              <p className="text-[11px] text-slate-500 leading-relaxed">
                팝업에서 선택한 <span className="font-medium">Nearest 색연필</span>을 목표색으로 설정하면,
                곧바로 <span className="font-medium">기본색 조색(Default)</span> 화면으로 돌아가 실제 물감(기본색+물) 조색 비율을 확인할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FaberMixModal;

