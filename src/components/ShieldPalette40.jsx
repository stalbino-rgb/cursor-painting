import React from 'react';
import { SHIELD_PALETTE_ROWS, shortPaletteName, toneMark } from '../data/shieldPaletteMwp1640';
import { mixSwatchKey } from '../utils/mixPools';

function textColorForHex(hex, empty) {
  if (empty) return '#64748B';
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#0f172a';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.62 ? '#0f172a' : '#ffffff';
}

function Well({ color, active, onSelect }) {
  if (!color) return <div className="rounded-md bg-slate-100 min-h-[3.4rem]" />;
  const empty = Boolean(color.extra && color.koName === '예비');
  const ink = textColorForHex(color.hex, empty);
  const no = color.shieldNo != null ? String(color.shieldNo) : '·';
  const name = shortPaletteName(color);
  const mark = toneMark(color.tone);

  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      disabled={empty}
      title={`${color.shieldNo ? `S${color.shieldNo} · ` : ''}${color.koName || ''} ${color.name || ''} · ${color.hue}${mark ? ` · ${mark}` : ''}`}
      className={`min-h-[3.4rem] w-full rounded-md px-0.5 py-0.5 flex flex-col items-center justify-center leading-tight ${
        active ? 'ring-2 ring-sky-500 ring-offset-1' : ''
      }`}
      style={{
        backgroundColor: color.hex,
        color: ink,
        boxShadow: color.extra
          ? 'inset 0 0 0 1.5px rgba(245,158,11,0.85)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.35)'
      }}
    >
      <span className="text-[8px] font-extrabold tabular-nums">{no}</span>
      <span className="text-[8px] font-semibold truncate max-w-full px-0.5">
        {name.length > 7 ? `${name.slice(0, 7)}…` : name}
      </span>
      <span className="text-[8px] font-bold opacity-90">
        {color.hue}
        {mark ? ` ${mark}` : ''}
      </span>
    </button>
  );
}

function PaletteRow({ rowKey, row, selectedKeys, onSelect }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-700">{row.label}</p>
        <p className="text-[10px] text-slate-500 text-right">{row.note}</p>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
        {row.groups.map((group, gi) => (
          <div key={`${rowKey}-g${gi}`} className="min-w-0 space-y-0.5" style={{ gridColumn: `span ${group.span}` }}>
            {group.hue !== 'N' || rowKey !== 'r3' ? (
              <p className="text-[8px] font-bold text-slate-500 text-center tracking-wide">
                {group.hue}
                {group.pair ? ` ↔ ${group.pair}` : ''}
              </p>
            ) : (
              <p className="text-[8px] font-bold text-slate-500 text-center tracking-wide">무채</p>
            )}
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${group.colors.length}, minmax(0, 1fr))` }}
            >
              {group.colors.map((color, i) => (
                <Well
                  key={`${rowKey}-${gi}-${i}`}
                  color={color}
                  active={selectedKeys?.has(mixSwatchKey(color))}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShieldPalette40({ selectedKeys, onToggleMixColor }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 md:p-5 shadow-md w-full">
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Shield Epic Acrylic 36 · MWP-1640
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          칸을 눌러 조색 물감을 고릅니다 (최대 4색). 다시 누르면 해제됩니다.
        </p>
      </div>

      <div className="space-y-3">
        <PaletteRow rowKey="r1" row={SHIELD_PALETTE_ROWS.row1} selectedKeys={selectedKeys} onSelect={onToggleMixColor} />
        <PaletteRow rowKey="r2" row={SHIELD_PALETTE_ROWS.row2} selectedKeys={selectedKeys} onSelect={onToggleMixColor} />
        <PaletteRow rowKey="r3" row={SHIELD_PALETTE_ROWS.row3} selectedKeys={selectedKeys} onSelect={onToggleMixColor} />
      </div>

      <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
        고른 물감으로 위 Mixing Preview · 디지털 팔레트가 목표색을 조색합니다. 안료 최대 4색, 물은 별도.
        노란 테두리는 36색에 없는 예비 무채입니다.
      </p>
    </div>
  );
}

export default ShieldPalette40;
