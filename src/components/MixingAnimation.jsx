import React, { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';

function MixingAnimation({ parts, resultHex }) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [parts?.map((p) => p.key + p.ratio).join(','), resultHex]);

  if (!parts?.length) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/80 p-6 shadow-md">
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500 min-h-[200px]">
          <Droplets size={40} className="opacity-40" />
          <p className="text-xs">색상을 선택하면 혼합 애니메이션이 여기 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const n = parts.length;
  const positions = parts.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: 50 + 42 * Math.cos(angle), y: 50 + 42 * Math.sin(angle) };
  });

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/80 p-4 md:p-5 shadow-md overflow-hidden">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase mb-3 flex items-center gap-2">
        <Droplets size={14} className="text-amber-500" />
        디지털 팔레트
      </p>
      <div className="relative aspect-square max-w-[280px] mx-auto">
        {/* palette base - elliptical bowl */}
        <div className="absolute inset-0 rounded-[45%] bg-gradient-to-b from-slate-300/60 to-slate-400/50 shadow-[inset_0_6px_20px_rgba(0,0,0,0.15)]" />

        {/* center blend result - appears as droplets merge */}
        <div
          key={`center-${key}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44%] h-[44%] rounded-full opacity-0 animate-blend-in shadow-lg border-2 border-white/60"
          style={{ backgroundColor: resultHex }}
        />

        {/* pigment droplets - start at perimeter, converge to center */}
        {parts.map((p, i) => {
          const pos = positions[i];
          const size = 14 + Math.min(p.ratio * 60, 20);
          return (
            <div
              key={`${p.key}-${key}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-droplet-mix"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                '--start-x': `${pos.x}%`,
                '--start-y': `${pos.y}%`,
                animationDelay: `${i * 0.12}s`
              }}
            >
              <div
                className="rounded-full shadow-lg border-2 border-white/70"
                style={{
                  backgroundColor: p.hex,
                  width: `${size}px`,
                  height: `${size}px`
                }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 text-center mt-3">
        원색 물감이 중앙으로 모여 섞이는 과정을 시뮬레이션합니다.
      </p>
    </div>
  );
}

export default MixingAnimation;
