import React, { useState } from 'react';
import ColorWheel from './ColorWheel';
import ShinhanColorWheel from './ShinhanColorWheel';
import ShinhanPalette40 from './ShinhanPalette40';
import MijelloColorWheel from './MijelloColorWheel';
import MijelloPalette40 from './MijelloPalette40';
import ShieldColorWheel from './ShieldColorWheel';
import ShieldPalette40 from './ShieldPalette40';
import { MAX_MIX_COLORS } from '../utils/mixPools';

const TABS = [
  { id: 'palette', label: '신한 팔레트' },
  { id: 'mijello-palette', label: '미젤로 팔레트' },
  { id: 'shield-palette', label: '쉴드 팔레트' },
  { id: 'shinhan', label: '신한 색상환' },
  { id: 'mijello', label: '미젤로 색상환' },
  { id: 'shield', label: '쉴드 색상환' },
  { id: 'base', label: '기본 색상환' }
];

function ColorWheelPanel({ selectedMixColors = [], onToggleMixColor }) {
  const [tab, setTab] = useState('palette');
  const selectedKeys = new Set(selectedMixColors.map((c) => c.key));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              tab === item.id
                ? item.id === 'base'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-emerald-600 text-white border-emerald-600'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
        <p className="text-[11px] text-slate-500 ml-auto">
          조색 물감 {selectedMixColors.length}/{MAX_MIX_COLORS} · 목표색은 Color Picker
        </p>
      </div>
      {tab === 'palette' ? (
        <ShinhanPalette40 selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'mijello-palette' ? (
        <MijelloPalette40 selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'shield-palette' ? (
        <ShieldPalette40 selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'shinhan' ? (
        <ShinhanColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'mijello' ? (
        <MijelloColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : tab === 'shield' ? (
        <ShieldColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      ) : (
        <ColorWheel selectedKeys={selectedKeys} onToggleMixColor={onToggleMixColor} />
      )}
    </div>
  );
}

export default ColorWheelPanel;
