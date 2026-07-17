import React, { useMemo, useState } from 'react';
import colorData from '../data/colorData.json';

/** Approx. display hex for pigment names in the wheel. */
const HEX_BY_NAME = {
  'Lemon Yellow': '#FFF44F',
  'Per. Yellow Middle': '#F2D04B',
  'Per. Yellow Deep': '#E0B400',
  'Naples Yellow': '#FADA5E',
  'Yellow Ochre': '#C9A227',
  'Per. Orange': '#FF8A00',
  Vermilion: '#E53935',
  'Coral Red': '#FF6F61',
  'Naphtol Red Light': '#E85A4F',
  Carmine: '#B71C1C',
  Magenta: '#C2185B',
  'Medium Magenta': '#E91E8C',
  Violet: '#7B2D8E',
  'Middle Violet': '#9B59B6',
  Lilac: '#C8A2C8',
  Ultramarine: '#1E3A7A',
  'Cyanine Blue': '#1A4B8C',
  'Cerulean Blue': '#2A7AB0',
  'Cobalt Blue': '#0047AB',
  'Acqua Green': '#26A69A',
  'Green Light': '#7CB342',
  'Cyanine Green': '#2E7D32',
  'Emerald Green': '#009E60',
  'Sap Green': '#507D2A',
  'Olive Green': '#6B7C32'
};

const EMPTY_FILL = '#CBD5E1'; // gray placeholder so rings stay continuous
const RING_LAYERS = [
  { key: 'outer', rInner: 150, rOuter: 210 }, // largest
  { key: 'mid', rInner: 96, rOuter: 150 }, // middle
  { key: 'inner', rInner: 48, rOuter: 96 } // smallest
];

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function donutSlice(cx, cy, rInner, rOuter, startDeg, endDeg) {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, startDeg);
  const p2 = polar(cx, cy, rOuter, endDeg);
  const p3 = polar(cx, cy, rInner, endDeg);
  const p4 = polar(cx, cy, rInner, startDeg);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z'
  ].join(' ');
}

function textColorForHex(hex) {
  if (!hex || hex === EMPTY_FILL) return '#475569';
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.62 ? '#0f172a' : '#ffffff';
}

function shortName(name) {
  if (!name) return '';
  return String(name)
    .replace(/^Per\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure SVG color wheel: 12 hue sections × Outer / Mid / Inner rings.
 * Clicking a filled cell calls onSelectHex(hex).
 */
function ColorWheel({ onSelectHex }) {
  const [active, setActive] = useState(null);

  const size = 460;
  const cx = size / 2;
  const cy = size / 2;

  const sectors = useMemo(() => {
    const n = colorData.length || 12;
    const sweep = 360 / n;
    // IMPORTANT: do not overwrite sector.mid / sector.inner from JSON.
    // Angle midpoint must use a different property name (midAngle).
    return colorData.map((sector, i) => {
      const startAngle = i * sweep;
      const endAngle = (i + 1) * sweep;
      return {
        cat: sector.cat,
        label: sector.label,
        outer: sector.outer,
        mid: sector.mid,
        inner: sector.inner,
        startAngle,
        endAngle,
        midAngle: startAngle + sweep / 2
      };
    });
  }, []);

  const handleSelect = (sector, ringKey, num, color, hex) => {
    if (num == null || color == null) return;
    setActive(`${sector.cat}-${ringKey}`);
    onSelectHex?.(hex);
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 md:p-5 shadow-md w-full min-h-[360px]">
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Color Wheel
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          12섹션 · Outer / Mid / Inner · 클릭하면 목표색으로 적용됩니다.
        </p>
      </div>

      <div className="w-full flex flex-col items-center justify-center gap-5">
        <div className="w-full max-w-[460px] aspect-square">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="xMidYMid meet"
            className="block w-full h-full select-none"
            role="img"
            aria-label="SVG concentric color wheel"
          >
            <circle cx={cx} cy={cy} r={222} fill="rgba(255,255,255,0.75)" />
            <circle
              cx={cx}
              cy={cy}
              r={216}
              fill="none"
              stroke="rgba(148,163,184,0.4)"
              strokeWidth={1}
            />

            {/* Draw every section × 3 rings (outer → mid → inner) */}
            {sectors.map((sector) =>
              RING_LAYERS.map((layer) => {
                const ringKey = layer.key; // 'outer' | 'mid' | 'inner'
                const cell = sector[ringKey]; // JSON: { num, color }
                const gap = 0.55;
                const d = donutSlice(
                  cx,
                  cy,
                  layer.rInner,
                  layer.rOuter,
                  sector.startAngle + gap,
                  sector.endAngle - gap
                );

                const labelR = (layer.rInner + layer.rOuter) / 2;
                const tp = polar(cx, cy, labelR, sector.midAngle);
                const key = `${sector.cat}-${ringKey}`;
                const isActive = active === key;

                // If num & color exist → fill with pigment color + show number
                // Else → gray so the ring stays continuous
                let fill = EMPTY_FILL;
                let hasData = false;
                let num = null;
                let colorName = null;

                if (cell && cell.num != null && cell.color != null) {
                  hasData = true;
                  num = cell.num;
                  colorName = cell.color;
                  fill = HEX_BY_NAME[cell.color] || '#94A3B8';
                }

                const ink = textColorForHex(fill);
                const name = shortName(colorName);

                return (
                  <g key={key}>
                    <path
                      d={d}
                      fill={fill}
                      stroke={isActive ? '#0284c7' : 'rgba(255,255,255,0.95)'}
                      strokeWidth={isActive ? 2.75 : 1.1}
                      style={{
                        cursor: hasData ? 'pointer' : 'default',
                        opacity: hasData ? 1 : 0.85
                      }}
                      onClick={() =>
                        hasData && handleSelect(sector, ringKey, num, colorName, fill)
                      }
                    >
                      {hasData && (
                        <title>{`No.${num} · ${colorName} · ${sector.label} (${ringKey})`}</title>
                      )}
                    </path>

                    {hasData && (
                      <g style={{ pointerEvents: 'none' }}>
                        <text
                          x={tp.x}
                          y={tp.y - (ringKey === 'outer' ? 6 : 0)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={ringKey === 'outer' ? 14 : 12}
                          fontWeight={800}
                          fill={ink}
                        >
                          {num}
                        </text>
                        {ringKey === 'outer' && name && (
                          <text
                            x={tp.x}
                            y={tp.y + 10}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={7.5}
                            fontWeight={600}
                            fill={ink}
                            opacity={0.92}
                          >
                            {name.length > 14 ? `${name.slice(0, 13)}…` : name}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })
            )}

            {/* center hub */}
            <circle cx={cx} cy={cy} r={44} fill="#fff" stroke="rgba(148,163,184,0.45)" />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={700}
              fill="#475569"
            >
              HUE
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              12 × 3
            </text>

            {/* category labels around rim */}
            {sectors.map((sector) => {
              const p = polar(cx, cy, 224, sector.midAngle);
              return (
                <text
                  key={`cat-${sector.cat}`}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#334155"
                >
                  {sector.cat}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="w-full max-w-xs space-y-3 text-[11px] text-slate-600">
          <div>
            <p className="font-medium text-slate-700 mb-1.5">레이어</p>
            <ul className="space-y-1.5">
              <li>Outer — 가장 바깥 (큰 반지름)</li>
              <li>Mid — 중간 링</li>
              <li>Inner — 가장 안쪽 (작은 반지름)</li>
            </ul>
          </div>

          {active &&
            (() => {
              const [cat, ring] = active.split('-');
              const sector = sectors.find((s) => s.cat === cat);
              const cell = sector?.[ring];
              if (!sector || !cell || cell.num == null || cell.color == null) return null;
              const hex = HEX_BY_NAME[cell.color] || '#94A3B8';
              return (
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    {sector.label} · {ring}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="h-8 w-8 rounded-lg border border-slate-200 shadow-inner shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div>
                      <p className="font-semibold text-slate-800">
                        No.{cell.num} {cell.color}
                      </p>
                      <p className="font-mono text-slate-500">{hex}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

          <p className="text-slate-400">회색 칸은 JSON에서 num/color가 null인 구간입니다.</p>
        </div>
      </div>
    </div>
  );
}

export default ColorWheel;
