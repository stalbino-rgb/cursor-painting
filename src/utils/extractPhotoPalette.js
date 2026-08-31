import { rgbToHex } from './mixing';
import { colorSnapshot } from './colorFormats';

function distSq(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function chroma255(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function hueDeg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 1) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function snapshotFromRgb(r, g, b, i, weight) {
  const hex = rgbToHex([r / 255, g / 255, b / 255]);
  return colorSnapshot(hex, { source: 'photo-swatch', index: i, weight: weight ?? 1 });
}

export function findNearestSwatch(hex, swatches) {
  if (!hex || !swatches?.length) return null;
  const t = colorSnapshot(hex).rgb;
  let best = swatches[0];
  let bestD = Infinity;
  for (const s of swatches) {
    const r = s.rgb || t;
    const d = distSq(t, r);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/**
 * Fast palette: one histogram pass, keep vivid hues + common areas.
 */
export function extractPhotoPalette(img, options = {}) {
  const maxColors = options.maxColors ?? 48;
  const maxDim = options.maxDim ?? 140;
  if (!img) return [];

  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (!nw || !nh) return [];

  try {
    const scale = Math.min(1, maxDim / Math.max(nw, nh));
    const w = Math.max(16, Math.round(nw * scale));
    const h = Math.max(16, Math.round(nh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const STEP = 16;
    const HUE_BINS = 24;
    const area = new Map();
    const vivid = new Array(HUE_BINS);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const c = chroma255(r, g, b);
      const v = Math.max(r, g, b);
      const score = c * 1.4 + v * 0.35;
      const bin = Math.min(HUE_BINS - 1, ((hueDeg(r, g, b) / 360) * HUE_BINS) | 0);
      const prev = vivid[bin];
      if (!prev || score > prev.score) {
        vivid[bin] = { r, g, b, score, chroma: c, count: 1 };
      }

      const key = `${(r / STEP) | 0},${(g / STEP) | 0},${(b / STEP) | 0}`;
      const hist = area.get(key);
      if (hist) {
        hist.n += 1;
        hist.r += r;
        hist.g += g;
        hist.b += b;
      } else {
        area.set(key, { n: 1, r, g, b });
      }
    }

    const picked = [];
    const push = (c, minD) => {
      if (picked.some((p) => distSq(p, c) < minD)) return;
      picked.push(c);
    };

    for (const v of vivid) {
      if (v && v.chroma >= 20) push(v, 12 * 12);
    }

    const areas = [...area.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, maxColors * 2)
      .map((e) => ({
        r: (e.r / e.n + 0.5) | 0,
        g: (e.g / e.n + 0.5) | 0,
        b: (e.b / e.n + 0.5) | 0,
        count: e.n
      }));

    for (const c of areas) {
      push(c, 10 * 10);
      if (picked.length >= maxColors) break;
    }

    picked.sort((a, b) => hueDeg(a.r, a.g, a.b) - hueDeg(b.r, b.g, b.b));
    return picked.slice(0, maxColors).map((c, i) => snapshotFromRgb(c.r, c.g, c.b, i, c.count));
  } catch {
    return [];
  }
}
