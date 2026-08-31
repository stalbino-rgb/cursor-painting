import React, { useMemo, useState } from 'react';
import { Hash } from 'lucide-react';
import { getMixModeHint, isBrandMixMode } from '../utils/mixPools';
import {
  colorSnapshot,
  emitColorSelect,
  parseCmykChannels,
  parseHexStrict,
  parseRgbChannels,
  rgb255ToCmyk,
  toRgb255
} from '../utils/colorFormats';

const TABS = [
  { id: 'hex', label: 'HEX' },
  { id: 'rgb', label: 'RGB' },
  { id: 'cmyk', label: 'CMYK' }
];

function CustomColorInput({ targetHex, mixMode, onApply }) {
  const [tab, setTab] = useState('hex');
  const [hexText, setHexText] = useState('');
  const [rgb, setRgb] = useState({ r: '', g: '', b: '' });
  const [cmyk, setCmyk] = useState({ c: '', m: '', y: '', k: '' });
  const [error, setError] = useState('');

  const previewHex = useMemo(() => {
    if (tab === 'hex') return parseHexStrict(hexText);
    if (tab === 'rgb') return parseRgbChannels(rgb.r, rgb.g, rgb.b);
    return parseCmykChannels(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
  }, [tab, hexText, rgb, cmyk]);

  const apply = () => {
    const hex = previewHex;
    if (!hex) {
      setError(
        tab === 'hex'
          ? 'HEX는 #RGB 또는 #RRGGBB 형식이어야 합니다.'
          : tab === 'rgb'
            ? 'RGB는 0–255 사이 숫자여야 합니다.'
            : 'CMYK는 0–100 사이 숫자여야 합니다.'
      );
      return;
    }
    setError('');
    const snap = colorSnapshot(hex, { source: 'custom-input', inputMode: tab });
    emitColorSelect({ ...snap, action: 'mix' });
    onApply?.(snap.hex);
  };

  const fillFromTarget = () => {
    if (!targetHex) return;
    const rgb255 = toRgb255(targetHex);
    const ck = rgb255ToCmyk(rgb255);
    setHexText(String(targetHex).toUpperCase());
    setRgb({ r: String(rgb255.r), g: String(rgb255.g), b: String(rgb255.b) });
    setCmyk({ c: String(ck.c), m: String(ck.m), y: String(ck.y), k: String(ck.k) });
    setError('');
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 outline-none focus:border-slate-400';

  return (
    <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-300 via-sky-200 to-emerald-200 flex items-center justify-center shadow-sm shrink-0">
            <Hash size={16} className="text-slate-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Custom Mix
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
              라이브러리에 없는 색도 HEX · RGB · CMYK로 조색할 수 있습니다.
            </p>
          </div>
        </div>
        {previewHex ? (
          <div
            className="w-10 h-10 rounded-xl border border-white shadow-md shrink-0"
            style={{ backgroundColor: previewHex }}
            aria-hidden
          />
        ) : null}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 p-1 w-fit mb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError('');
            }}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
              tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hex' && (
        <input
          type="text"
          value={hexText}
          onChange={(e) => setHexText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="#F97373"
          className={fieldClass}
          aria-label="HEX 코드"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}

      {tab === 'rgb' && (
        <div className="grid grid-cols-3 gap-2">
          {['r', 'g', 'b'].map((ch) => (
            <label key={ch} className="text-[10px] font-medium text-slate-500 uppercase">
              {ch}
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => setRgb((prev) => ({ ...prev, [ch]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                className={`${fieldClass} mt-1`}
                placeholder="0–255"
              />
            </label>
          ))}
        </div>
      )}

      {tab === 'cmyk' && (
        <div className="grid grid-cols-4 gap-2">
          {['c', 'm', 'y', 'k'].map((ch) => (
            <label key={ch} className="text-[10px] font-medium text-slate-500 uppercase">
              {ch}
              <input
                type="number"
                min={0}
                max={100}
                value={cmyk[ch]}
                onChange={(e) => setCmyk((prev) => ({ ...prev, [ch]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                className={`${fieldClass} mt-1`}
                placeholder="%"
              />
            </label>
          ))}
        </div>
      )}

      {error ? <p className="mt-2 text-[11px] text-rose-600">{error}</p> : null}
      <p className="mt-2 text-[11px] text-slate-500">
        {isBrandMixMode(mixMode)
          ? getMixModeHint(mixMode)
          : '기본 조색은 Base Colors(워터·레드·옐로우·블루·화이트·블랙)에서 최대 4색으로 맞춥니다.'}
      </p>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={apply}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          이 코드로 조색
        </button>
        <button
          type="button"
          onClick={fillFromTarget}
          className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-white transition-colors"
        >
          현재 목표색 채우기
        </button>
      </div>
    </div>
  );
}

export default CustomColorInput;
