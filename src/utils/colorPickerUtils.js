// App-focused color picker helpers (extracted from mixing.js + sparse mix helpers).

import { normalizeHexColor } from './hexNormalize';
import { hexToRgb, rgbToHex, calculateMixFromLibrary, calculateMixForHex, mixFromPigmentRatios, PIGMENT_LIST } from './mixing';
import { distanceSq } from './paletteMatchingInternal';

export { calculateMixForHex, mixFromPigmentRatios, PIGMENT_LIST };

/**
 * Prefer Caran d'Ache when distances are very close.
 * (match earlier behavior but configurable)
 */
export const BRAND_TIE_DISTANCE_SQ = 1400;
const K4_IMPROVEMENT_REQUIRED = 0.15; // 15%

export function isCaranPart(part) {
  return Boolean(part?.isCaran30) || (typeof part?.key === 'string' && part.key.startsWith('caran-'));
}

export function formatPartNameWithBadges(part) {
  if (!part) return '';
  const no = typeof part.no === 'number' ? String(part.no).padStart(3, '0') : '';
  const base = `${no ? `No.${no} ` : ''}${part.name || ''}`.trim();
  return isCaranPart(part) ? `${base} (30)` : base;
}

/**
 * Find nearest single color in a list. If multiple are similarly close,
 * prefer Caran d'Ache entries (`isCaran30: true`).
 */
export function getNearestPreferCaran(targetHex, list) {
  const t = normalizeHexColor(targetHex);
  if (!list?.length) return null;
  const scored = list
    .map((c) => ({ ...c, distance: distanceSq(t, c.hex) }))
    .sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  const close = scored.filter((e) => e.distance <= best.distance + BRAND_TIE_DISTANCE_SQ);
  const caran = close.find((e) => e.isCaran30 || (typeof e.key === 'string' && e.key.startsWith('caran-')));
  return caran || best;
}

function solveWeightsProjectedGD(targetHex, colors, steps = 220, lr = 0.22) {
  const t = normalizeHexColor(targetHex);
  const target = hexToRgb(t).map((v) => 1 - v);
  const cmy = colors.map((c) => hexToRgb(normalizeHexColor(c.hex)).map((v) => 1 - v));
  const n = colors.length;
  let w = new Array(n).fill(1 / n);
  for (let s = 0; s < steps; s++) {
    const mix = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      mix[0] += w[i] * cmy[i][0];
      mix[1] += w[i] * cmy[i][1];
      mix[2] += w[i] * cmy[i][2];
    }
    const diff = [mix[0] - target[0], mix[1] - target[1], mix[2] - target[2]];
    for (let i = 0; i < n; i++) {
      const grad = 2 * (diff[0] * cmy[i][0] + diff[1] * cmy[i][1] + diff[2] * cmy[i][2]);
      w[i] -= lr * grad;
      if (w[i] < 0) w[i] = 0;
    }
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < n; i++) w[i] /= sum;
  }
  const finalCmy = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    finalCmy[0] += w[i] * cmy[i][0];
    finalCmy[1] += w[i] * cmy[i][1];
    finalCmy[2] += w[i] * cmy[i][2];
  }
  const approx = rgbToHex(finalCmy.map((v) => 1 - v));
  return { w, approximateHex: approx };
}

function pickTopCandidates(targetHex, list, limit = 12) {
  const t = normalizeHexColor(targetHex);
  return list
    .map((c) => ({ ...c, distance: distanceSq(t, c.hex) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function srgbToLinear(u) {
  return u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
}

function rgb01ToLab([r, g, b]) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  // sRGB D65
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041;
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;
  const fx = fLab(x / xn);
  const fy = fLab(y / yn);
  const fz = fLab(z / zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return [L, a, bb];
}

function fLab(t) {
  return t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
}

function deltaE76Hex(hexA, hexB) {
  const labA = rgb01ToLab(hexToRgb(normalizeHexColor(hexA)));
  const labB = rgb01ToLab(hexToRgb(normalizeHexColor(hexB)));
  const d0 = labA[0] - labB[0];
  const d1 = labA[1] - labB[1];
  const d2 = labA[2] - labB[2];
  return Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2);
}

function hexToHsvLocal(hex) {
  const [r, g, b] = hexToRgb(normalizeHexColor(hex));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function sampleDiverseCandidates(targetHex, list, options) {
  const {
    nearestCount = 10,
    hueBins = 8,
    perBin = 1,
    includeValueExtremes = true,
    maxTotal = 24
  } = options || {};

  const t = normalizeHexColor(targetHex);
  const targetHsv = hexToHsvLocal(t);

  const scored = list
    .map((c) => ({ ...c, distance: distanceSq(t, c.hex), hsv: hexToHsvLocal(c.hex) }))
    .sort((a, b) => a.distance - b.distance);

  const picked = [];
  const seen = new Set();

  const push = (c) => {
    const key = c.key ?? `${c.name}|${c.hex}`;
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(c);
  };

  scored.slice(0, nearestCount).forEach(push);

  // hue bins: pick colors whose hue covers spectrum, biased toward complementary/triadic regions
  const binSize = 360 / hueBins;
  const byBin = new Map();
  for (let i = 0; i < hueBins; i++) byBin.set(i, []);
  for (const c of scored) {
    const bin = Math.floor(((c.hsv.h % 360) + 360) % 360 / binSize);
    byBin.get(bin).push(c);
  }

  const preferHues = [
    targetHsv.h,
    (targetHsv.h + 180) % 360,
    (targetHsv.h + 120) % 360,
    (targetHsv.h + 240) % 360
  ];
  for (const ph of preferHues) {
    const bin = Math.floor(ph / binSize) % hueBins;
    byBin.get(bin).slice(0, perBin).forEach(push);
  }

  // also sample overall bins lightly
  for (let i = 0; i < hueBins; i++) {
    byBin.get(i).slice(0, perBin).forEach(push);
  }

  if (includeValueExtremes) {
    const brightest = [...scored].sort((a, b) => b.hsv.v - a.hsv.v).slice(0, 2);
    const darkest = [...scored].sort((a, b) => a.hsv.v - b.hsv.v).slice(0, 2);
    brightest.forEach(push);
    darkest.forEach(push);
  }

  return picked.slice(0, maxTotal);
}

/**
 * Sparse mix: choose smallest number of colors (1..maxK) to approximate target.
 * - Uses nearest-only if exact/very close
 * - Else greedily chooses candidates and solves weights for that subset
 * - Brand tie-break: if errors are similar, prefer solution containing Caran
 */
export function calculateSparseMixPreferCaran(targetHex, list, options) {
  const { maxK = 4, candidateLimit = 24, minRatio = 0.03, steps = 140 } = options || {};
  const t = normalizeHexColor(targetHex);
  if (!list?.length) return { approximateHex: t, parts: [] };

  // Exact match
  const exact = list.find((c) => normalizeHexColor(c.hex) === t);
  if (exact) {
    return {
      approximateHex: normalizeHexColor(exact.hex),
      parts: [{ ...exact, ratio: 1 }]
    };
  }

  const candidates = sampleDiverseCandidates(t, list, { nearestCount: 10, hueBins: 8, perBin: 1, maxTotal: candidateLimit });
  let best = null;

  // k=1: nearest with tie-break
  const nearest1 = getNearestPreferCaran(t, candidates);
  if (nearest1) {
    best = {
      approximateHex: normalizeHexColor(nearest1.hex),
      parts: [{ ...nearest1, ratio: 1 }],
      k: 1,
      err: deltaE76Hex(t, nearest1.hex)
    };
  }

  const consider = (candidateSol) => {
    if (!best) {
      best = candidateSol;
      return;
    }
    const errClose = candidateSol.err <= best.err + 2; // ΔE close threshold
    if (candidateSol.k < best.k && errClose) {
      best = candidateSol;
      return;
    }
    if (candidateSol.err + 1e-9 < best.err) {
      best = candidateSol;
      return;
    }
    if (errClose) {
      const hasCaran = candidateSol.parts.some(isCaranPart);
      const bestHasCaran = best.parts.some(isCaranPart);
      if (hasCaran && !bestHasCaran) best = candidateSol;
    }
  };

  // greedy forward selection for k=2..maxK
  const bestErrK = {};
  if (best) bestErrK[1] = best.err;
  for (let k = 2; k <= maxK; k++) {
    const subset = [];
    // seed with best single or nearest candidate
    if (best?.parts?.[0]) subset.push(best.parts[0]);
    else if (candidates[0]) subset.push(candidates[0]);
    while (subset.length < k) {
      let bestAdd = null;
      let bestSol = null;
      for (const cand of candidates) {
        if (subset.some((s) => (s.key ?? s.hex) === (cand.key ?? cand.hex))) continue;
        const trial = [...subset, cand];
        const solved = solveWeightsProjectedGD(t, trial, steps, 0.22);
        const err = deltaE76Hex(t, solved.approximateHex);
        if (!bestSol || err < bestSol.err) {
          bestSol = { err, solved, trial };
          bestAdd = cand;
        }
      }
      if (!bestAdd || !bestSol) break;
      subset.push(bestAdd);
      // optional early stop: if error improvement is tiny, stop adding more
      if (subset.length >= 2 && bestSol.err < 1.2) break;
    }
    if (subset.length < 2) continue;

    const solved = solveWeightsProjectedGD(t, subset, steps, 0.22);
    const parts = subset
      .map((c, i) => ({ ...c, ratio: solved.w[i] }))
      .filter((p) => p.ratio >= minRatio)
      .sort((a, b) => b.ratio - a.ratio);
    if (parts.length === 0) continue;

    const err = deltaE76Hex(t, solved.approximateHex);
    bestErrK[k] = err;
    const candidateSol = { approximateHex: solved.approximateHex, parts, k, err };

    if (k === 4) {
      const baseErr = bestErrK[3] ?? best?.err ?? err;
      const improved = baseErr > 0 ? (baseErr - err) / baseErr : 0;
      if (improved < K4_IMPROVEMENT_REQUIRED) {
        continue; // 15% 이상 개선 없으면 4색 추천 금지
      }
    }
    consider(candidateSol);
  }

  if (!best) return calculateMixFromLibrary(t, list, minRatio);
  return { approximateHex: best.approximateHex, parts: best.parts };
}


