import React, { useState } from 'react';
import ColorWheel from './ColorWheel';
import ShinhanColorWheel from './ShinhanColorWheel';
import ShinhanPalette40 from './ShinhanPalette40';
import { MAX_MIX_COLORS } from '../utils/mixPools';

function ColorWheelPanel({ selectedMixColors = [], onToggleMixColor }) {
  const [tab, setTab] = useState('palette');
  const selectedKeys = new Set(selectedMixColors.map((c) => c.key));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('palette')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            tab === 'palette'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          40칸 팔레트
        </button>
        <button
          type="button"
          onClick={() => setTab('shinhan')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            tab === 'shinhan'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          신한 SWC 32
        </button>
        <button
          type="button"
          onClick={() => setTab('base')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            tab === 'base'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          기본 색상환
        </button>
        <p className="text-[11px] text-slate-500 ml-auto">
          조색 물감 {selectedMixColors.length}/{MAX_MIX_COLORS} · 목표색은 Color Picker
        </p>
      </div>
      {tab === 'palette' ? (
        <ShinhanPalette40 selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'shinhan' ? (
        <ShinhanColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : (
        <ColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      )}
    </div>
  );
}

export default ColorWheelPanel;
