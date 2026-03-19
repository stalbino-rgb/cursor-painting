import { hexToRgb, rgbToHex } from './mixing';

export const MAJOR_HUES = [
  { code: 'R', en: 'Red', ko: '빨강', baseAngle: 0 },
  { code: 'YR', en: 'Yellow Red', ko: '주황', baseAngle: 36 },
  { code: 'Y', en: 'Yellow', ko: '노랑', baseAngle: 72 },
  { code: 'GY', en: 'Green Yellow', ko: '연두', baseAngle: 108 },
  { code: 'G', en: 'Green', ko: '초록', baseAngle: 144 },
  { code: 'BG', en: 'Blue Green', ko: '청록', baseAngle: 180 },
  { code: 'B', en: 'Blue', ko: '파랑', baseAngle: 216 },
  { code: 'PB', en: 'Purple Blue', ko: '청보라', baseAngle: 252 },
  { code: 'P', en: 'Purple', ko: '보라', baseAngle: 288 },
  { code: 'RP', en: 'Red Purple', ko: '자주', baseAngle: 324 }
];

export const MUNSELL_40_HUES = MAJOR_HUES.flatMap((h) =>
  [2.5, 5, 7.5, 10].map((step, idx) => ({
    id: `${step}${h.code}`,
    step,
    major: h.code,
    en: h.en,
    ko: h.ko,
    // 4 steps within each 36° major sector
    angle: (h.baseAngle + idx * 9) % 360
  }))
);

const MAJOR_HUE_ANCHOR_HEX = {
  R: '#C63A3D',
  YR: '#D67A2C',
  Y: '#D6B22A',
  GY: '#93A83A',
  G: '#3A8A52',
  BG: '#2A8F8A',
  B: '#3A5DA8',
  PB: '#5252A8',
  P: '#7A4FA8',
  RP: '#A84F86'
};

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function hsvToRgb(h, s, v) {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) [rp, gp, bp] = [c, x, 0];
  else if (hh < 120) [rp, gp, bp] = [x, c, 0];
  else if (hh < 180) [rp, gp, bp] = [0, c, x];
  else if (hh < 240) [rp, gp, bp] = [0, x, c];
  else if (hh < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [rp + m, gp + m, bp + m];
}

function rgbToHsv([r, g, b]) {
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

function hexChannelToRgb01(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixRgb(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function getMajorHueInfo(code) {
  return MAJOR_HUES.find((h) => h.code === code) ?? MAJOR_HUES[0];
}

export function formatMunsellHueId(step, major) {
  const stepStr = Number.isInteger(step) ? String(step) : String(step);
  return `${stepStr}${major}`;
}

export function formatMunsellNotation({ step, major, value, chroma }) {
  return `${formatMunsellHueId(step, major)} ${value}/${chroma}`;
}

export function munsellHueToApproxHex(step, major) {
  const codes = MAJOR_HUES.map((h) => h.code);
  const idx = Math.max(0, codes.indexOf(major));
  const next = (idx + 1) % codes.length;
  const c0 = hexChannelToRgb01(MAJOR_HUE_ANCHOR_HEX[codes[idx]]);
  const c1 = hexChannelToRgb01(MAJOR_HUE_ANCHOR_HEX[codes[next]]);

  // Munsell intra-sector steps: 2.5 -> 5 -> 7.5 -> 10(next major)
  const t = step === 2.5 ? 0.25 : step === 5 ? 0.5 : step === 7.5 ? 0.75 : 1;
  const mixed = mixRgb(c0, c1, t);
  return rgbToHex(mixed);
}

export function approximateMaxChromaFor(value) {
  // Heuristic for a "tree slice" look: highest chroma around mid-values.
  const v = Math.round(value);
  const peak = 5;
  const dist = Math.abs(v - peak);
  const max = Math.round((10 - dist) * 2); // 0..20
  return Math.max(0, Math.min(20, max));
}

export function munsellToHex({ angle, value, chroma }) {
  const v = clamp01(value / 10);
  const maxC = approximateMaxChromaFor(value) || 1;
  const s = clamp01(chroma / maxC);
  // tweak: keep dark values from becoming overly saturated
  const sAdj = clamp01(s * (0.65 + 0.7 * v));
  const rgb = hsvToRgb(angle, sAdj, v);
  return rgbToHex(rgb);
}

export function munsellHueToAngle({ step, major }) {
  const majorInfo = getMajorHueInfo(major);
  const idx = step === 2.5 ? 0 : step === 5 ? 1 : step === 7.5 ? 2 : 3;
  return (majorInfo.baseAngle + idx * 9) % 360;
}

export function hexToApproxMunsell(hex) {
  const rgb = hexToRgb(hex);
  const { h, s, v } = rgbToHsv(rgb);
  const value = Math.max(0, Math.min(10, Math.round(v * 10)));
  const maxC = approximateMaxChromaFor(value) || 1;
  const chroma = Math.max(0, Math.round(s * maxC));

  // Find closest of 40 hue angles.
  let best = MUNSELL_40_HUES[0];
  let bestD = Infinity;
  for (const hh of MUNSELL_40_HUES) {
    const d0 = Math.abs(((h - hh.angle + 540) % 360) - 180);
    if (d0 < bestD) {
      bestD = d0;
      best = hh;
    }
  }
  return {
    step: best.step,
    major: best.major,
    angle: best.angle,
    value,
    chroma
  };
}

