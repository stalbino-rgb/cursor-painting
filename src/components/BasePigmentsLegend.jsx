import React from 'react';
import { Droplets } from 'lucide-react';

function BasePigmentsLegend({ pigments }) {
  return (
    <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          <Droplets size={14} className="text-sky-400" />
          Base Colors
        </div>
        <span className="text-[11px] text-slate-400">
          실무 기준에 맞게 커스터마이징 가능
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {pigments.map((p) => (
          <div
            key={p.key}
            className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1"
          >
            <span
              className="h-4 w-4 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: p.hex }}
            />
            <span className="text-xs font-medium text-slate-700">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BasePigmentsLegend;

