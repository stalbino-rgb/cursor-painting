import React, { useCallback, useState } from 'react';
import { PIGMENT_LIST, calculateSparseMixPreferCaran } from './utils/colorPickerUtils';
import { calculateMixForHex, capPigmentParts } from './utils/mixing';
import { getMixPoolForMode, MAX_MIX_COLORS, isBrandMixMode } from './utils/mixPools';
import { SWATCHES } from './data/colors';
import MixingAnimation from './components/MixingAnimation';
import ColorLibrary from './components/ColorLibrary';
import ColorDetailModal from './components/ColorDetailModal';
import BrandPaletteModal from './components/BrandPaletteModal';
import MixingPreview from './components/MixingPreview';
import SaveRecipes from './components/SaveRecipes';
import AppHeader from './components/AppHeader';
import ColorPickerSection from './components/ColorPickerSection';
import ColorWheel from './components/ColorWheel';
import { normalizeHexColor } from './utils/hexNormalize';
import { useLiveMix } from './hooks/useLiveMix';

function App() {
  /** Single Source of Truth: 앱 전체 목표색 (Color Picker · Photo · Mixing · Library 적용 동일) */
  const [targetHex, setTargetHex] = useState('#f97373');
  const [renderKey, setRenderKey] = useState(0);
  const [mixMode, setMixMode] = useState('default'); // default | faber | prisma | shield | mijello | shinhan
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [photoPickMode, setPhotoPickMode] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedLibraryColor, setSelectedLibraryColor] = useState(null);
  console.log('App 렌더링 - 현재 색상:', targetHex);

  const handleColorUpdate = useCallback(
    (hex, options) => {
      console.log('TRACE [App]: 부모 수신 성공 ->', hex);
      console.log('디버깅: 부모가 받은 색상 =', hex);
      if (hex == null || String(hex).trim() === '') return;
      const normalized = normalizeHexColor(hex);
      setTargetHex(() => normalized);
      setRenderKey((k) => k + 1);
      if (isBrandMixMode(mixMode) && options?.openPalette !== false) setPaletteModalOpen(true);
    },
    [mixMode]
  );

  const mixPool = isBrandMixMode(mixMode) ? getMixPoolForMode(mixMode) : PIGMENT_LIST.filter((p) => p.key !== 'water');
  const sparseMix = isBrandMixMode(mixMode)
    ? calculateSparseMixPreferCaran(targetHex, mixPool, {
        maxK: MAX_MIX_COLORS,
        candidateLimit: 20,
        minRatio: 0.04
      })
    : calculateMixForHex(targetHex);
  const mixParts = capPigmentParts(sparseMix.parts || []);
  const mixPartSum = mixParts.reduce((s, p) => s + (p.ratio || 0), 0) || 1;
  const baseMix = {
    targetHex,
    approximateHex: sparseMix.approximateHex || targetHex,
    parts: mixParts.map((p, i) => ({
      ...p,
      key: p.key || `mix-${i}`,
      ratio: p.ratio / mixPartSum
    }))
  };

  const live = useLiveMix(baseMix.parts, `${mixMode}:${targetHex}`);
  const partsToShow = live.partsToShow?.length ? live.partsToShow : baseMix.parts;
  const adjustedHex = live.adjustedHex || baseMix.approximateHex;
  const hasMix = partsToShow && partsToShow.length > 0;

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || !hasMix) return;

    setSavedRecipes((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: recipeName.trim(),
        targetHex: baseMix.targetHex,
        mixedHex: adjustedHex,
        parts: partsToShow
      }
    ]);
    setRecipeName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <main className="glass-card max-w-6xl w-full px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 relative overflow-visible">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-rose-200/70 via-amber-200/70 to-sky-200/70 blur-2xl opacity-70 animate-float-slow" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-sky-200/70 via-indigo-200/70 to-emerald-200/70 blur-2xl opacity-60 animate-float-slow" />
        </div>
        <div className="relative z-10 space-y-6 sm:space-y-8">
          <AppHeader />

          <section className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] gap-8 lg:gap-10 items-start">
            <div className="space-y-4 min-w-0">
              <ColorPickerSection
                targetHex={targetHex}
                renderKey={renderKey}
                mixMode={mixMode}
                setMixMode={(mode) => {
                  setMixMode(mode);
                  if (!isBrandMixMode(mode)) setPaletteModalOpen(false);
                }}
                setPaletteModalOpen={setPaletteModalOpen}
                handleColorUpdate={handleColorUpdate}
                swatches={SWATCHES}
                photoPickMode={photoPickMode}
                setPhotoPickMode={setPhotoPickMode}
                pigments={PIGMENT_LIST}
              />
            </div>

            <div className="space-y-4 min-w-0">
              <MixingAnimation parts={partsToShow} resultHex={adjustedHex} />

              <MixingPreview
                containerKey={`${targetHex}-${mixMode}`}
                baseMix={baseMix}
                adjustedHex={adjustedHex}
                partsToShow={partsToShow}
                hasMix={hasMix}
                waterAmount={live.waterAmount}
                setWaterAmount={live.setWaterAmount}
                onChangePartWeight={live.onChangePartWeight}
              />

              <p className="text-[11px] text-slate-500 leading-relaxed">
                이 도구는{' '}
                <span className="font-medium">
                  선택한 브랜드 물감(또는 Base Colors)에서 가장 가까운 색을 고르고, RGB를 감산
                  혼합(CMY) 공간으로 변환해 비율을 근사하는 방식
                </span>
                으로 계산하며, <span className="font-medium">안료는 한 번에 최대 4색</span>만 섞어
                탁색을 줄입니다. <span className="font-medium">물(워터)은 안료 수에 넣지 않아</span>{' '}
                물 포함 시 총 5가지까지 쓸 수 있습니다. 실제 물감의 안료 특성, 브랜드, 종이/캔버스
                상태에 따라 결과는 달라질 수 있으니, <span className="font-medium">초기 가이드</span>
                로 활용하고 손으로 미세 조정해 주세요.
              </p>
            </div>
          </section>

          <section>
            <ColorLibrary onColorSelect={setSelectedLibraryColor} />
          </section>

          <SaveRecipes
            recipeName={recipeName}
            setRecipeName={setRecipeName}
            savedRecipes={savedRecipes}
            onSaveRecipe={handleSaveRecipe}
            onApplyRecipeTarget={handleColorUpdate}
          />

          <section>
            <ColorWheel onSelectHex={handleColorUpdate} />
          </section>
        </div>
      </main>

      <ColorDetailModal
        color={selectedLibraryColor}
        onClose={() => setSelectedLibraryColor(null)}
        onApplyToTarget={handleColorUpdate}
      />

      <BrandPaletteModal
        mixMode={mixMode}
        open={isBrandMixMode(mixMode) && paletteModalOpen}
        targetHex={targetHex}
        onClose={() => setPaletteModalOpen(false)}
        onApplyNearestAsTarget={(nearest) => {
          if (!nearest?.hex) return;
          setMixMode('default');
          setPaletteModalOpen(false);
          handleColorUpdate(nearest.hex, { openPalette: false });
        }}
      />
    </div>
  );
}

export default App;
