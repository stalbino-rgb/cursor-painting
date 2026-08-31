import React from 'react';
import { Wand2 } from 'lucide-react';
import ColorPickerPanel from './ColorPickerPanel';
import PhotoToPalette from './PhotoToPalette';
import CustomColorInput from './CustomColorInput';
import BasePigmentsLegend from './BasePigmentsLegend';
import { MIX_MODE_OPTIONS, getMixModeHint, isBrandMixMode } from '../utils/mixPools';

function ColorPickerSection({
  targetHex,
  renderKey,
  mixMode,
  setMixMode,
  setPaletteModalOpen,
  handleColorUpdate,
  swatches,
  photoPickMode,
  setPhotoPickMode,
  pigments
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose-300 via-amber-300 to-sky-300 flex items-center justify-center shadow-sm">
              <Wand2 size={18} className="text-white drop-shadow-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Color Picker
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                목표 색을 골라보세요.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 min-w-0">
          <div className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 p-1 shadow-sm overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
            {MIX_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setMixMode(opt.id);
                  if (isBrandMixMode(opt.id)) setPaletteModalOpen(true);
                  else setPaletteModalOpen(false);
                }}
                className={`shrink-0 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-medium rounded-full transition-colors ${
                  mixMode === opt.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{getMixModeHint(mixMode)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex-1 space-y-3 min-w-0">
            <div
              className="h-20 w-full rounded-2xl border border-slate-200/80 shadow-inner"
              style={{ backgroundColor: targetHex }}
              aria-hidden
            />
            <ColorPickerPanel
              key={`${renderKey}-${targetHex}`}
              targetHex={targetHex}
              onChange={handleColorUpdate}
              photoPickActive={photoPickMode}
              onEnterPhotoPickMode={() => setPhotoPickMode(true)}
              onExitPhotoPickMode={() => setPhotoPickMode(false)}
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">HEX</span>
              <code className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-[11px] font-mono text-slate-700">
                {targetHex.toUpperCase()}
              </code>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {swatches.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorUpdate(c)}
                  className="h-7 w-full paint-chip transition-transform"
                  style={{ backgroundColor: c }}
                  aria-label={`추천 색상 ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <PhotoToPalette
        targetHex={targetHex}
        pickEnabled={photoPickMode}
        // iOS Safari에서 "켜자마자 꺼짐" 체감 방지: pick 모드는 사용자가 스포이드 버튼으로 끌 때까지 유지합니다.
        onPickComplete={() => {}}
        onColorChange={handleColorUpdate}
      />

      <CustomColorInput targetHex={targetHex} mixMode={mixMode} onApply={handleColorUpdate} />

      <BasePigmentsLegend pigments={pigments} />
    </div>
  );
}

export default ColorPickerSection;

