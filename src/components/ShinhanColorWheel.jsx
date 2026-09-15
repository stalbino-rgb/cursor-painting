import React, { useMemo } from 'react';
import {
  getShinhanHueSectors,
  SHINHAN_NEUTRALS
} from '../data/shinhanHueWheel';
import { mixSwatchKey } from '../utils/mixPools';

const RING_OUTER = 210;
const RING_INNER = 56;
const NEUTRAL_OUTER = 52;
const NEUTRAL_INNER = 18;

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
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#0f172a';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.62 ? '#0f172a' : '#ffffff';
}

function TonePill({ tone }) {
  if (tone !== 'cool' && tone !== 'warm') return null;
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
        tone === 'cool' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {tone}
    </span>
  );
}

function ColorRow({ color, active, onSelect, extra }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors ${
        active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'
      }`}
    >
      <span
        className="h-7 w-7 rounded-md border border-slate-200 shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-800 truncate">
            H{color.shinhanNo} {color.koName || color.name}
          </span>
          <TonePill tone={color.tone} />
        </span>
        {extra ? <span className="block text-[10px] text-slate-500 leading-snug">{extra}</span> : null}
      </span>
    </button>
  );
}

function ShinhanColorWheel({ selectedKeys, onToggleMixColor }) {
  const sectors = useMemo(() => getShinhanHueSectors(), []);
  const size = 460;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 360 / sectors.length;

  const selectedList = useMemo(() => {
    const all = [
      ...sectors.flatMap((s) => s.colors),
      ...SHINHAN_NEUTRALS
    ];
    return all.filter((c) => selectedKeys?.has(mixSwatchKey(c)));
  }, [sectors, selectedKeys]);

  const handleSelect = (color) => {
    onToggleMixColor?.(color);
  };

  const uncertainOnWheel = sectors.flatMap((s) =>
    s.colors.filter((c) => c.uncertain).map((c) => ({ ...c, cat: s.cat, label: s.label }))
  );

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 md:p-5 shadow-md w-full min-h-[360px]">
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Shinhan SWC 32 Wheel
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          12시 Y · 시계방향 Y → GY · 클릭하면 조색 물감으로 고릅니다 (최대 4색).
        </p>
      </div>

      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5">
        <div className="w-full max-w-[460px] aspect-square shrink-0">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="xMidYMid meet"
            className="block w-full h-full select-none"
            role="img"
            aria-label="신한 SWC 32색 색상환. 12시 Yellow부터 시계방향."
          >
            <circle cx={cx} cy={cy} r={222} fill="rgba(255,255,255,0.75)" />
            <circle cx={cx} cy={cy} r={216} fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth={1} />

            {sectors.map((sector, i) => {
              const startAngle = i * sweep - sweep / 2;
              const endAngle = startAngle + sweep;
              const midAngle = i * sweep;
              const gap = 0.55;
              return (
                <g key={sector.cat}>
                  <path
                    d={donutSlice(cx, cy, RING_INNER, RING_OUTER, startAngle + gap, endAngle - gap)}
                    fill="#F8FAFC"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={1}
                  />
                  {sector.colors.map((color, ring) => {
                    const n = sector.colors.length;
                    const span = (RING_OUTER - RING_INNER) / n;
                    const rOuter = RING_OUTER - ring * span;
                    const rInner = rOuter - span;
                    const key = `${sector.cat}-${ring}`;
                    const isActive = selectedKeys?.has(mixSwatchKey(color));
                    const d = donutSlice(cx, cy, rInner + 0.6, rOuter - 0.4, startAngle + gap, endAngle - gap);
                    const labelR = (rInner + rOuter) / 2;
                    const tp = polar(cx, cy, labelR, midAngle);
                    const ink = textColorForHex(color.hex);
                    const showName = n <= 2 || ring === 0;
                    return (
                      <g key={key}>
                        <path
                          d={d}
                          fill={color.hex}
                          stroke={isActive ? '#0284c7' : color.uncertain ? '#F59E0B' : 'rgba(255,255,255,0.95)'}
                          strokeWidth={isActive ? 2.75 : color.uncertain ? 2 : 1.1}
                          strokeDasharray={color.uncertain && !isActive ? '3.5 2.5' : undefined}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelect(color)}
                        >
                          <title>
                            {`H${color.shinhanNo} · ${color.koName} ${color.name} · ${sector.cat} · ${color.tone}${
                              color.uncertain ? ` · 경계: ${color.uncertainNote}` : ''
                            }`}
                          </title>
                        </path>
                        <g style={{ pointerEvents: 'none' }}>
                          <text
                            x={tp.x}
                            y={tp.y - (showName ? 5 : 0)}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={showName ? 12 : 10}
                            fontWeight={800}
                            fill={ink}
                          >
                            {color.shinhanNo}
                          </text>
                          {showName && (
                            <text
                              x={tp.x}
                              y={tp.y + 9}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={7}
                              fontWeight={600}
                              fill={ink}
                              opacity={0.92}
                            >
                              {(color.koName || color.name).length > 8
                                ? `${(color.koName || color.name).slice(0, 7)}…`
                                : color.koName || color.name}
                            </text>
                          )}
                        </g>
                      </g>
                    );
                  })}
                  <text
                    x={polar(cx, cy, 224, midAngle).x}
                    y={polar(cx, cy, 224, midAngle).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#334155"
                  >
                    {sector.cat}
                  </text>
                </g>
              );
            })}

            {SHINHAN_NEUTRALS.map((color, i) => {
              const slice = 360 / SHINHAN_NEUTRALS.length;
              const startAngle = i * slice - 90;
              const endAngle = startAngle + slice;
              const key = `n-${color.shinhanNo}`;
              const isActive = selectedKeys?.has(mixSwatchKey(color));
              const midAngle = startAngle + slice / 2;
              const tp = polar(cx, cy, (NEUTRAL_INNER + NEUTRAL_OUTER) / 2, midAngle);
              const ink = textColorForHex(color.hex);
              return (
                <g key={key}>
                  <path
                    d={donutSlice(cx, cy, NEUTRAL_INNER, NEUTRAL_OUTER, startAngle + 0.8, endAngle - 0.8)}
                    fill={color.hex}
                    stroke={isActive ? '#0284c7' : '#F59E0B'}
                    strokeWidth={isActive ? 2.5 : 1.6}
                    strokeDasharray={isActive ? undefined : '3 2'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelect(color)}
                  >
                    <title>{`H${color.shinhanNo} · ${color.koName} · 어스/무채 · ${color.note}`}</title>
                  </path>
                  <text
                    x={tp.x}
                    y={tp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fontWeight={800}
                    fill={ink}
                    style={{ pointerEvents: 'none' }}
                  >
                    {color.shinhanNo}
                  </text>
                </g>
              );
            })}

            <circle cx={cx} cy={cy} r={NEUTRAL_INNER - 1} fill="#fff" stroke="rgba(148,163,184,0.45)" />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fontWeight={700}
              fill="#64748B"
            >
              어스
            </text>
          </svg>
        </div>

        <div className="w-full max-w-sm space-y-3 text-[11px] text-slate-600">
          {selectedList.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 shadow-sm space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-sky-700">선택한 조색 물감</p>
              {selectedList.map((color) => (
                <ColorRow
                  key={mixSwatchKey(color)}
                  color={color}
                  active
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          <div>
            <p className="font-medium text-slate-700 mb-1">무채 · 어스 (중앙)</p>
            <p className="text-[10px] text-slate-400 mb-1.5">
              이 32색에는 흰색·검정·회색이 없어, 채도가 낮은 어스 4색을 중앙에 두었습니다.
            </p>
            <div className="space-y-0.5">
              {SHINHAN_NEUTRALS.map((color) => (
                <ColorRow
                  key={color.shinhanNo}
                  color={color}
                  active={selectedKeys?.has(mixSwatchKey(color))}
                  onSelect={handleSelect}
                  extra={color.note}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-700 mb-1">분류가 어려운 색</p>
            <p className="text-[10px] text-slate-400 mb-1.5">색상환에서는 점선 테두리로 표시됩니다.</p>
            <div className="space-y-0.5">
              {uncertainOnWheel.map((color) => {
                const sector = sectors.find((s) => s.cat === color.cat);
                const idx = sector.colors.findIndex((c) => c.shinhanNo === color.shinhanNo);
                const key = `${color.cat}-${idx}`;
                return (
                  <ColorRow
                    key={color.shinhanNo}
                    color={color}
                    active={selectedKeys?.has(mixSwatchKey(color))}
                    onSelect={handleSelect}
                    extra={`${color.cat} · ${color.uncertainNote}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShinhanColorWheel;
