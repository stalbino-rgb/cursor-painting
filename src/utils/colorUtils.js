import { rgbToHex } from './mixing';

/** Hex to HSV for similar-color sorting (hue primary) */
export function hexToHsv(hex) {
  const raw = (hex || '#000000').replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (full.length !== 6) return { h: 0, s: 0, v: 0 };
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hVal = 0;
  if (d !== 0) {
    if (max === r) hVal = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hVal = ((b - r) / d + 2) / 6;
    else hVal = ((r - g) / d + 4) / 6;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h: hVal * 360, s, v };
}

/** HSV (h 0–360, s/v 0–1) → linear RGB 0–1 */
export function hsvToRgb01(h, s, v) {
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

export function hsvToHex(h, s, v) {
  return rgbToHex(hsvToRgb01(h, s, v));
}

export function sortBySimilarColor(colors) {
  return [...colors].sort((a, b) => {
    const ha = hexToHsv(a.hex);
    const hb = hexToHsv(b.hex);
    if (Math.abs(ha.h - hb.h) > 180) {
      const [lo, hi] = ha.h < hb.h ? [ha, hb] : [hb, ha];
      return (lo.h + 360 - hi.h) - (hi.h - lo.h);
    }
    if (Math.abs(ha.h - hb.h) > 1) return ha.h - hb.h;
    if (Math.abs(ha.s - hb.s) > 0.05) return ha.s - hb.s;
    return ha.v - hb.v;
  });
}

export function sortByAlpha(colors) {
  return [...colors].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
