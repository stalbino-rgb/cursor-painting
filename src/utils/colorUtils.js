/** Hex to HSV for similar-color sorting (hue primary) */
export function hexToHsv(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
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
