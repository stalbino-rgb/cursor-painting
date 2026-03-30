import React from 'react';
import { Save } from 'lucide-react';

function formatPercent(v) {
  return `${(v * 100).toFixed(0)}%`;
}

function SaveRecipes({
  recipeName,
  setRecipeName,
  savedRecipes,
  onSaveRecipe,
  onApplyRecipeTarget
}) {
  return (
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
            onClick={onSaveRecipe}
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
                onClick={() => onApplyRecipeTarget(r.targetHex)}
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
  );
}

export default SaveRecipes;

