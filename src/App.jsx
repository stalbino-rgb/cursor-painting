import React, { useMemo, useState } from 'react';
import { Droplets, Palette, Wand2, Info, Save } from 'lucide-react';
import { calculateMixForHex, PIGMENT_LIST, mixFromPigmentRatios } from './utils/mixing';
import PhotoToPalette from './components/PhotoToPalette';
import MixingAnimation from './components/MixingAnimation';
import ColorLibrary from './components/ColorLibrary';
import ColorDetailModal from './components/ColorDetailModal';

const SWATCHES = [
  '#F6C035',
  '#D7263D',
  '#225CAD',
  '#F97373',
  '#A3E635',
  '#2DD4BF',
  '#F472B6',
  '#FACCFF',
  '#0F172A'
];

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function App() {
  const [hex, setHex] = useState('#f97373');
  const [adjustments, setAdjustments] = useState({});
  const [recipeName, setRecipeName] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedLibraryColor, setSelectedLibraryColor] = useState(null);

  const baseMix = useMemo(() => calculateMixForHex(hex), [hex]);

  const adjustedMix = useMemo(() => {
    if (!baseMix || !baseMix.parts?.length) return null;
    const ratioByKey = {};
    baseMix.parts.forEach((p) => {
      const factor = adjustments[p.key] ?? 1;
      ratioByKey[p.key] = p.ratio * factor;
    });
    return mixFromPigmentRatios(ratioByKey);
  }, [baseMix, adjustments]);

  const partsToShow = adjustedMix?.parts?.length ? adjustedMix.parts : baseMix.parts;
  const adjustedHex = adjustedMix?.hex ?? baseMix.approximateHex;

  const adjustedPartsByKey = useMemo(() => {
    const map = {};
    (adjustedMix?.parts || []).forEach((p) => {
      map[p.key] = p;
    });
    return map;
  }, [adjustedMix]);

  const hasMix = partsToShow && partsToShow.length > 0;

  const handleChangePigmentFactor = (key, value) => {
    const factor = value / 100;
    setAdjustments((prev) => ({
      ...prev,
      [key]: factor
    }));
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || !hasMix) return;

    const mixedHex = adjustedHex;
    const parts = partsToShow;

    setSavedRecipes((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: recipeName.trim(),
        targetHex: baseMix.targetHex,
        mixedHex,
        parts
      }
    ]);
    setRecipeName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <main className="glass-card max-w-6xl w-full px-8 py-8 md:px-12 md:py-10 relative overflow-hidden">
        {/* floating paint drops */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-rose-200/70 via-amber-200/70 to-sky-200/70 blur-2xl opacity-70 animate-float-slow" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-sky-200/70 via-indigo-200/70 to-emerald-200/70 blur-2xl opacity-60 animate-float-slow" />

        <div className="relative z-10 space-y-8">
          {/* header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <span className="pill inline-flex items-center gap-2">
                <Droplets size={14} className="text-rose-400" />
                ACRYLIC MIXING GUIDE
              </span>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                아크릴 컬러 조색 가이드
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

          {/* main layout */}
          <section className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] gap-8 lg:gap-10 items-start">
            {/* left: controls */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-50/80 border border-slate-100/80 p-4 md:p-5">
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

                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <label className="flex-1 flex items-center justify-center paint-swatch shadow-inner cursor-pointer">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      className="h-20 w-full rounded-2xl border-0 bg-transparent cursor-pointer appearance-none p-0"
                      aria-label="목표 색상 선택"
                    />
                  </label>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">HEX</span>
                      <code className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-[11px] font-mono text-slate-700">
                        {hex.toUpperCase()}
                      </code>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHex(c)}
                          className="h-7 w-full paint-chip transition-transform"
                          style={{ backgroundColor: c }}
                          aria-label={`추천 색상 ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* photo to palette */}
              <PhotoToPalette onColorPick={setHex} />

              {/* pigments legend */}
              <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    <Droplets size={14} className="text-sky-400" />
                    Base Colors
                  </div>
                  <span className="text-[11px] text-slate-400">
                    실무 기준에 맞게 커스터마이징 가능
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PIGMENT_LIST.map((p) => (
                    <div
                      key={p.key}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right: visual feedback */}
            <div className="space-y-4">
              {/* mixing animation palette */}
              <MixingAnimation parts={partsToShow} resultHex={adjustedHex} />

              <div className="rounded-3xl bg-slate-950/95 text-slate-50 p-4 md:p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
                      Mixing Preview
                    </p>
                    <p className="text-sm text-slate-300">
                      실제 조색 결과는 사용하는 물감에 따라 달라질 수 있어요.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Info size={13} />
                    감산 혼합(CMY) 공간에서 근사 계산
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* target */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                      Target Color
                    </p>
                    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                      <div className="h-36 w-full" style={{ backgroundColor: baseMix.targetHex }} />
                      <div className="px-3 py-2.5 flex items-center justify-between text-[11px] text-slate-300">
                        <span>선택한 색</span>
                        <code className="font-mono">{baseMix.targetHex.toUpperCase()}</code>
                      </div>
                    </div>
                  </div>

                  {/* approximate */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                      Mixed Result
                    </p>
                    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                      <div className="h-36 w-full relative" style={{ backgroundColor: adjustedHex }}>
                        <div
                          className="absolute inset-0 opacity-25 mix-blend-soft-light"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle at 0 0, rgba(255,255,255,0.7) 0, transparent 55%), radial-gradient(circle at 100% 100%, rgba(15,23,42,0.8) 0, transparent 60%)'
                          }}
                        />
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between text-[11px] text-slate-300">
                        <span>조색 근사값{adjustedMix ? ' (조정 반영)' : ''}</span>
                        <code className="font-mono">
                          {adjustedHex.toUpperCase()}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* bar comparison */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-800">
                    <div
                      className="h-full"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${baseMix.targetHex}, ${adjustedHex})`
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    목표 ↔ 조색
                  </span>
                </div>

                {/* ratios */}
                <div className="mt-2 border-t border-slate-800/80 pt-3">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase mb-1">
                    Mixing Ratios
                  </p>

                  {hasMix ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {partsToShow.map((p) => (
                          <div
                            key={p.key}
                            className="flex items-center gap-3 text-xs text-slate-100"
                          >
                            <div className="flex items-center gap-2 min-w-[92px]">
                              <span
                                className="h-4 w-4 rounded-full border border-white/40 shadow-sm"
                                style={{ backgroundColor: p.hex }}
                              />
                              <span className="font-medium">{p.name}</span>
                            </div>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-slate-100 via-slate-50 to-amber-200"
                                style={{ width: formatPercent(p.ratio) }}
                              />
                            </div>
                            <span className="w-10 text-right text-[11px] text-slate-300">
                              {formatPercent(p.ratio)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-1 pt-3 border-t border-slate-800/70 space-y-2">
                        <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                          비율 조절
                        </p>
                        <p className="text-[11px] text-slate-400 mb-1">
                          특정 색 물감을 더하거나 덜 넣었을 때 결과가 어떻게 달라지는지 슬라이더로
                          시뮬레이션해 보세요. (기본값 100%)
                        </p>
                        <div className="space-y-3">
                          {baseMix.parts.map((p) => {
                            const factor = adjustments[p.key] ?? 1;
                            const current = adjustedPartsByKey[p.key]?.ratio ?? p.ratio;
                            return (
                              <div key={p.key} className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-slate-300">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                                      style={{ backgroundColor: p.hex }}
                                    />
                                    <span className="font-medium text-slate-100">{p.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">
                                      조정: {(factor * 100).toFixed(0)}%
                                    </span>
                                    <span className="text-slate-400">
                                      현재 비율: {formatPercent(current)}
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={50}
                                  max={150}
                                  value={Math.round(factor * 100)}
                                  onChange={(e) =>
                                    handleChangePigmentFactor(p.key, Number(e.target.value))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      아직 조색 정보가 충분하지 않습니다. 상단에서 색상을 선택해 주세요.
                    </p>
                  )}
                </div>
              </div>

              {/* note */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                이 도구는{' '}
                <span className="font-medium">
                  RGB 색상을 감산 혼합(CMY) 공간으로 변환한 뒤, 기본 5색의 비율을 근사하는 방식
                </span>
                으로 계산합니다. 실제 물감의 안료 특성, 브랜드, 종이/캔버스 상태에 따라 결과는
                달라질 수 있으니, <span className="font-medium">초기 가이드</span>로 활용하고 손으로
                미세 조정해 주세요.
              </p>
            </div>
          </section>

          {/* color library */}
          <section>
            <ColorLibrary onColorSelect={setSelectedLibraryColor} />
          </section>

          {/* save recipes */}
          <section className="mt-4 space-y-4">
            <div className="rounded-3xl bg-white/90 border border-slate-100/80 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase flex items-center gap-2">
                  <Save size={14} className="text-emerald-400" />
                  Save Recipe
                </p>
                <p className="text-[11px] text-slate-500 max-w-md">
                  지금 보고 있는 조색 비율에 이름을 붙여 나중에 다시 참고할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-1 flex-col sm:flex-row gap-2 items-stretch">
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="예: 따뜻한 코랄 하이라이트"
                  className="flex-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-gradient-to-r from-emerald-200 via-sky-200 to-amber-200 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-transform"
                >
                  <Save size={14} />
                  저장
                </button>
              </div>
            </div>

            {savedRecipes.length > 0 && (
              <div className="rounded-3xl bg-white/95 border border-slate-100/80 p-4 md:p-5 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Saved Recipes
                  </p>
                  <p className="text-[11px] text-slate-400">
                    항목을 클릭하면 해당 목표 색으로 다시 불러옵니다.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setHex(r.targetHex)}
                      className="text-left rounded-2xl border border-slate-100 bg-slate-50/90 hover:bg-slate-100/90 transition-colors p-3 space-y-2 shadow-sm"
                    >
                      <p className="text-xs font-medium text-slate-800 truncate">{r.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: r.targetHex }}
                          />
                          <span>목표</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: r.mixedHex }}
                          />
                          <span>조색</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.parts.map((p) => (
                          <span
                            key={p.key}
                            className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                          >
                            <span
                              className="h-2 w-2 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: p.hex }}
                            />
                            <span>{p.name}</span>
                            <span className="text-slate-400">{formatPercent(p.ratio)}</span>
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* color detail modal */}
      <ColorDetailModal
        color={selectedLibraryColor}
        onClose={() => setSelectedLibraryColor(null)}
        onApplyToTarget={setHex}
      />
    </div>
  );
}

export default App;

