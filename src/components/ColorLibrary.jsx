import React, { useMemo, useState, useRef, useCallback } from 'react';
import { BookOpen, Search, ChevronDown, Loader2 } from 'lucide-react';
import { COLOR_LIBRARY } from '../data/colorLibrary';
import { FABER_CASTELL_ALBRECHT_DURER_72 } from '../data/colorData';
import { sortBySimilarColor, sortByAlpha } from '../utils/colorUtils';
import { hexToApproxMunsell, formatMunsellNotation } from '../utils/munsell';

const SORT_OPTIONS = [
  { id: 'similar', label: '비슷한 색상순' },
  { id: 'alpha', label: '알파벳 이름순 (A-Z)' },
  { id: 'faberNo', label: 'Faber-Castell No.순' }
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function normalizeHex(h) {
  if (!h || typeof h !== 'string') return '';
  const s = h.replace('#', '').toUpperCase();
  return s.length === 6 ? `#${s}` : s.length === 3 ? `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}` : '';
}

async function fetchColorFromAPI(name) {
  if (!name?.trim()) return [];
  const q = encodeURIComponent(name.trim());
  const res = await fetch(`https://api.color.pizza/v1/names/?name=${q}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data?.colors?.length) return [];
  return data.colors.map((c) => {
    const h = c.hex?.startsWith('#') ? c.hex : `#${(c.hex || '').replace('#', '')}`;
    return { name: c.name, hex: normalizeHex(h) || h, source: 'external' };
  });
}

function ColorLibrary({ onColorSelect }) {
  const [sortBy, setSortBy] = useState('similar');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalResults, setExternalResults] = useState([]);
  const [sortOpen, setSortOpen] = useState(false);
  const listRef = useRef(null);
  const rowRefs = useRef({});
  const searchTimeoutRef = useRef(null);
  const [munsellFilter, setMunsellFilter] = useState('all');
  const [showSet72Only, setShowSet72Only] = useState(false);

  const mergedLibrary = useMemo(() => {
    const merged = [
      ...FABER_CASTELL_ALBRECHT_DURER_72.colors.map((color) => ({
        ...color,
        source: FABER_CASTELL_ALBRECHT_DURER_72.name,
        brand: FABER_CASTELL_ALBRECHT_DURER_72.brand
      })),
      ...COLOR_LIBRARY
    ];
    const unique = [];
    const seen = new Set();
    for (const item of merged) {
      const key = `${item.name}|${item.hex}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }, []);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...mergedLibrary];
    if (showSet72Only) {
      const faberName = FABER_CASTELL_ALBRECHT_DURER_72.name;
      list = list.filter(
        (c) => (c.source === faberName || c.brand === 'Faber-Castell') && c.isSet72
      );
    }
    if (munsellFilter !== 'all') {
      list = list.filter((c) => {
        const m = hexToApproxMunsell(c.hex);
        if (!m) return false;
        // Avoid showing broad neutral/gray tones in hue filters.
        if (m.chroma < 2) return false;
        return m.major === munsellFilter;
      });
    }
    if (q) {
      const match = (c) => {
        const en = (c.name || '').toLowerCase();
        const ko = (c.koName || '').toLowerCase();
        const h = (normalizeHex(c.hex) || c.hex || '').toLowerCase();
        const m = formatMunsellNotation(hexToApproxMunsell(c.hex) || { step: 5, major: 'R', value: 5, chroma: 10 })
          .toLowerCase();
        return en.includes(q) || ko.includes(q) || h.includes(q) || m.includes(q);
      };
      const exact = list.filter((c) => (c.name || '').toLowerCase() === q || (c.koName || '').toLowerCase() === q);
      const partial = list.filter((c) => match(c) && !exact.some((e) => e.name === c.name));
      list = [...exact, ...partial];
    }
    if (sortBy === 'alpha') return sortByAlpha(list);
    if (sortBy === 'faberNo') {
      const faberName = FABER_CASTELL_ALBRECHT_DURER_72.name;
      return [...list].sort((a, b) => {
        const aIs = a.source === faberName || a.paletteId === FABER_CASTELL_ALBRECHT_DURER_72.id || a.brand === 'Faber-Castell';
        const bIs = b.source === faberName || b.paletteId === FABER_CASTELL_ALBRECHT_DURER_72.id || b.brand === 'Faber-Castell';
        if (aIs !== bIs) return aIs ? -1 : 1;
        const an = typeof a.no === 'number' ? a.no : Number.POSITIVE_INFINITY;
        const bn = typeof b.no === 'number' ? b.no : Number.POSITIVE_INFINITY;
        if (an !== bn) return an - bn;
        return (a.name || '').localeCompare(b.name || '', 'en');
      });
    }
    return sortBySimilarColor(list);
  }, [searchQuery, sortBy, munsellFilter, mergedLibrary, showSet72Only]);

  const displayList = useMemo(() => {
    if (externalResults.length > 0) return externalResults;
    return filteredAndSorted;
  }, [filteredAndSorted, externalResults]);

  const alphabetIndex = useMemo(() => {
    const map = {};
    displayList.forEach((c, i) => {
      const letter = (c.name[0] || '').toUpperCase();
      if (/[A-Z]/.test(letter) && map[letter] === undefined) map[letter] = i;
    });
    return map;
  }, [displayList]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    const q = value.trim();
    if (!q) {
      setExternalResults([]);
      setExternalLoading(false);
      return;
    }
    const hasLibraryMatch = mergedLibrary.some(
      (c) =>
        c.name.toLowerCase() === q.toLowerCase() ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.koName || '').toLowerCase().includes(q.toLowerCase())
    );
    if (hasLibraryMatch) {
      setExternalResults([]);
      setExternalLoading(false);
      return;
    }
    setExternalLoading(true);
    setExternalResults([]);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetchColorFromAPI(q);
        setExternalResults(results);
      } catch {
        setExternalResults([]);
      } finally {
        setExternalLoading(false);
      }
    }, 400);
  }, [mergedLibrary]);

  const scrollToLetter = (letter) => {
    const idx = alphabetIndex[letter];
    if (idx == null) return;
    const row = rowRefs.current[`row-${idx}`];
    if (row && listRef.current) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const isFromExternal = externalResults.length > 0;
  const faberSourceName = FABER_CASTELL_ALBRECHT_DURER_72.name;

  return (
    <div className="rounded-3xl bg-white/95 border border-slate-100/80 shadow-md overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-sm">
            <BookOpen size={16} className="text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Color Library
            </p>
            <p className="text-[10px] text-slate-500">
              {mergedLibrary.length}가지 이상 · 클릭 시 조색 상세 화면
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="색상 이름 검색 (예: Cerulean Blue)"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent"
          />
          {externalLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              <span>외부 데이터에서 찾는 중...</span>
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-slate-500">정렬:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
              <ChevronDown size={14} className={sortOpen ? 'rotate-180' : ''} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 ${
                        sortBy === opt.id ? 'text-sky-600 bg-sky-50' : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">필터(H):</span>
            <select
              value={munsellFilter}
              onChange={(e) => setMunsellFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
            >
              <option value="all">전체</option>
              <option value="R">R</option>
              <option value="YR">YR</option>
              <option value="Y">Y</option>
              <option value="GY">GY</option>
              <option value="G">G</option>
              <option value="BG">BG</option>
              <option value="B">B</option>
              <option value="PB">PB</option>
              <option value="P">P</option>
              <option value="RP">RP</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">표시:</span>
            <button
              type="button"
              disabled={isFromExternal}
              onClick={() => setShowSet72Only((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isFromExternal
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : showSet72Only
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title={isFromExternal ? '외부 검색 결과에서는 사용할 수 없어요.' : 'Faber 72 배지 색상만 표시'}
            >
              72만 보기
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex">
        <div
          ref={listRef}
          className="flex-1 max-h-[620px] overflow-y-auto overscroll-contain scroll-smooth color-library-scroll"
        >
          {displayList.length === 0 && !externalLoading ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              {searchQuery.trim() ? '검색 결과가 없습니다.' : '색상이 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 px-2 py-2">
              {displayList.map((color, i) => (
                (() => {
                  const isFaber = color.source === faberSourceName || color.brand === 'Faber-Castell';
                  const isSet72 = Boolean(color.isSet72);
                  const tileClass = isFaber && !isSet72 ? 'opacity-55' : '';
                  return (
                <button
                  key={`${color.hex}-${color.name}-${i}`}
                  type="button"
                  ref={(el) => {
                    rowRefs.current[`row-${i}`] = el;
                  }}
                  onClick={() => onColorSelect?.(color)}
                  className={`group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50/90 active:bg-slate-100/90 text-left transition-colors ${tileClass}`}
                  title={`${color.name} (${(normalizeHex(color.hex) || color.hex).toUpperCase()})`}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 shrink-0 rounded-lg border border-white/80 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    {isFaber && isSet72 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 text-white text-[9px] font-semibold px-1.5 py-0.5 shadow-sm">
                        72
                      </span>
                    )}
                  </div>
                  <code className="mt-1 text-[9px] font-mono text-slate-500 group-hover:text-slate-600">
                    {(normalizeHex(color.hex) || color.hex).slice(0, 7)}
                  </code>
                </button>
                  );
                })()
              ))}
            </div>
          )}
        </div>

        {/* Alphabet index */}
        {!isFromExternal && displayList.length > 0 && (
          <div className="h-[620px] flex flex-col items-center justify-between py-2 pr-2 gap-px border-l border-slate-100">
            {ALPHABET.map((letter) => {
              const hasLetter = alphabetIndex[letter] != null;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => scrollToLetter(letter)}
                  className={`w-6 h-5 flex items-center justify-center text-[10px] font-semibold rounded transition-colors ${
                    hasLetter
                      ? 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                      : 'text-slate-300 cursor-default'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ColorLibrary;
