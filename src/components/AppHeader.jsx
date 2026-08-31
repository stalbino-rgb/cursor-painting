import React from 'react';
import { Droplets, Palette } from 'lucide-react';

function AppHeader() {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="space-y-3">
        <span className="pill inline-flex items-center gap-2">
          <Droplets size={14} className="text-rose-400" />
          COLOR MIXING GUIDE
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          칼러 조색 가이드
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
          목표 색을 선택하면, 기본 5색(
          <span className="font-medium text-slate-700">레드·옐로우·블루·화이트·블랙</span>
          )로 가까운 조색 비율을 계산해 드립니다.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 border border-slate-100 shadow-sm">
          <Palette size={16} className="text-amber-400" />
          <span className="text-xs text-slate-500">감산 혼합 기반 가이드</span>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

