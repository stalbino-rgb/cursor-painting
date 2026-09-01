import React from 'react';
import { Droplets } from 'lucide-react';
import { toRgb255 } from '../utils/colorFormats';
import { isWaterPart } from '../utils/mixing';

function BasePigmentsLegend({ pigments }) {
  const baseFive = (pigments || []).filter((p) => !isWaterPart(p));

  return (
    <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          <Droplets size={14} className="text-sky-400" />
          Base Colors
        </div>
        <span className="text-[11px] text-slate-400">
          기본 안료 5색
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {baseFive.map((p) => {
          const rgb = toRgb255(p.hex);
          return (
            <div
              key={p.key}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2"
            >
              <span
                className="h-9 w-9 rounded-xl border border-white shadow-sm shrink-0"
                style={{ backgroundColor: p.hex }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                <p className="text-[11px] font-mono text-slate-600">{String(p.hex).toUpperCase()}</p>
                <p className="text-[11px] font-mono text-slate-500">
                  RGB {rgb.r} {rgb.g} {rgb.b}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BasePigmentsLegend;
