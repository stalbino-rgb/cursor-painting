import React, { useMemo } from 'react';
import { approximateMaxChromaFor, munsellToHex, formatMunsellNotation } from '../utils/munsell';

function rangeInclusive(start, end, step = 1) {
  const out = [];
  for (let v = start; v <= end; v += step) out.push(v);
  return out;
}

function MunsellToneGrid({ hue, selected, onSelect }) {
  const values = useMemo(() => rangeInclusive(10, 0, -1), []);

  const grid = useMemo(() => {
    return values.map((value) => {
      const maxC = approximateMaxChromaFor(value);
      const chromas = rangeInclusive(0, maxC, 1);
      return {
        value,
        maxC,
        chromas: chromas.map((chroma) => ({
          value,
          chroma,
          hex: munsellToHex({ angle: hue.angle, value, chroma })
        }))
      };
    });
  }, [values, hue.angle]);

  const selectedKey = selected ? `${selected.value}-${selected.chroma}` : null;
  const maxChroma = useMemo(() => Math.max(...grid.map((row) => row.maxC), 0), [grid]);
  const chromaScale = useMemo(() => rangeInclusive(0, maxChroma, 1), [maxChroma]);

  return (
    <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Tone (Value/Chroma)
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            선택한 Hue에 대한 Munsell Color Tree 단면(근사)에서 명도/채도를 고르세요.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">선택 Hue</p>
          <p className="text-xs font-semibold text-slate-800">{hue.id}</p>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.08em] text-slate-600">Y축: Value</span>
        <span className="text-xs font-semibold tracking-[0.08em] text-slate-600">X축: Chroma</span>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-100 bg-slate-50/50">
        <div className="min-w-[620px] p-3">
          <div className="flex items-stretch gap-2">
            <div className="w-8 shrink-0 flex items-start justify-center pt-1">
              <span className="text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                Y
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid gap-1.5" style={{ gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))` }}>
                {grid.map((row) => (
                  <div key={`row-${row.value}`} className="flex items-center gap-2">
                    <div className="w-8 shrink-0 text-[10px] text-slate-500 font-mono text-right pr-1">
                      V{row.value}
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxChroma + 1}, 1.5rem)` }}>
                      {chromaScale.map((chroma) => {
                        if (chroma > row.maxC) {
                          return <div key={`empty-${row.value}-${chroma}`} className="h-6 w-6 rounded-md bg-slate-100/70 border border-slate-100" />;
                        }
                        const cell = row.chromas[chroma];
                        const key = `${cell.value}-${cell.chroma}`;
                        const isSelected = selectedKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onSelect?.(cell)}
                            className={`h-6 w-6 rounded-md border shadow-sm transition-transform active:scale-95 ${
                              isSelected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-white/80'
                            }`}
                            style={{ backgroundColor: cell.hex }}
                            aria-label={formatMunsellNotation({
                              step: hue.step,
                              major: hue.major,
                              value: cell.value,
                              chroma: cell.chroma
                            })}
                            title={`V${cell.value} C${cell.chroma}`}
                          />
                        );
                      })}
                    </div>
                    <div className="pl-2 text-[10px] text-slate-400 font-mono">
                      max C {row.maxC}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 pl-10">
                <div
                  className="grid gap-1 text-[10px] text-slate-400 font-mono"
                  style={{ gridTemplateColumns: `repeat(${maxChroma + 1}, 1.5rem)` }}
                >
                  {chromaScale.map((chroma) => (
                    <span key={`tick-${chroma}`} className="text-center">
                      {chroma % 2 === 0 ? chroma : ''}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                  X
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        Y축: Value(0–10) · X축: Chroma(0–max) · 셀을 탭하면 즉시 목표 색과 레시피가 갱신됩니다.
      </p>
    </div>
  );
}

export default MunsellToneGrid;

