import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { colorSnapshot, copyToClipboard, emitColorSelect } from '../utils/colorFormats';

function isDarkRgb({ r, g, b }) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 148;
}

function ExtractedSwatchStrip({ hostRef, swatches, selectedHex, liveHex, onSelect }) {
  const [copied, setCopied] = useState(null);
  const rowRef = useRef(null);
  const list = swatches || [];

  const preview = liveHex ? colorSnapshot(liveHex) : null;
  const matched = selectedHex
    ? list.find((s) => s.hex.toLowerCase() === String(selectedHex).toLowerCase())
    : null;
  const panel = preview || matched || list[0] || null;

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !selectedHex) return;
    const el = row.querySelector(`[data-swatch="${selectedHex.toLowerCase()}"]`);
    if (!el) return;
    const left = el.offsetLeft - row.clientWidth / 2 + el.offsetWidth / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
  }, [selectedHex]);

  if (!panel) return null;

  const lightText = isDarkRgb(panel.rgb);
  const ink = lightText ? 'text-white' : 'text-slate-900';
  const muted = lightText ? 'text-white/80' : 'text-slate-800/80';

  const markCopied = (key) => {
    setCopied(key);
    window.setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 1200);
  };

  const copyValue = async (key, value, action) => {
    const ok = await copyToClipboard(value);
    if (ok) {
      markCopied(key);
      emitColorSelect({ ...panel, action });
    }
  };

  return (
    <div ref={hostRef} className="min-w-0">
      <div ref={rowRef} className="swatch-h-scroll">
        {list.map((swatch, i) => {
          const selected = selectedHex && swatch.hex.toLowerCase() === String(selectedHex).toLowerCase();
          return (
            <button
              key={`${swatch.hex}-${i}`}
              type="button"
              data-swatch={swatch.hex.toLowerCase()}
              onClick={() => {
                onSelect?.(swatch);
                copyToClipboard(swatch.hexUpper);
                emitColorSelect({ ...swatch, action: 'mix' });
              }}
              className={`relative h-8 shrink-0 ${selected ? 'ring-2 ring-white z-[1]' : ''}`}
              style={{ backgroundColor: swatch.hex, flex: '0 0 28px' }}
              aria-label={`추출 색 ${swatch.hexUpper}`}
              aria-pressed={Boolean(selected)}
            />
          );
        })}
      </div>

      <div className={`relative flex items-center justify-between gap-2 px-3 py-2 ${ink}`} style={{ backgroundColor: panel.hex }}>
        <div className="min-w-0">
          <button type="button" onClick={() => copyValue('hex', panel.hexUpper, 'copy-hex')} className="block text-left" title="HEX 복사">
            <p className="text-lg font-bold tracking-tight leading-none">
              {copied === 'hex' ? '복사됨' : panel.hexUpper}
            </p>
          </button>
          <button
            type="button"
            onClick={() => copyValue('rgb', `RGB ${panel.rgb.r} ${panel.rgb.g} ${panel.rgb.b}`, 'copy-rgb')}
            className={`mt-0.5 block text-left text-[11px] font-medium ${muted}`}
            title="RGB 복사"
          >
            {copied === 'rgb' ? '복사됨' : `RGB ${panel.rgb.r} ${panel.rgb.g} ${panel.rgb.b} · 100%`}
          </button>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => copyValue('hex', panel.hexUpper, 'copy-hex')}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              lightText ? 'bg-white/20' : 'bg-black/10'
            }`}
          >
            {copied === 'hex' ? <Check size={10} /> : <Copy size={10} />}
            HEX
          </button>
          <button
            type="button"
            onClick={() => copyValue('rgb', `RGB ${panel.rgb.r} ${panel.rgb.g} ${panel.rgb.b}`, 'copy-rgb')}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              lightText ? 'bg-white/20' : 'bg-black/10'
            }`}
          >
            {copied === 'rgb' ? <Check size={10} /> : <Copy size={10} />}
            RGB
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExtractedSwatchStrip;
