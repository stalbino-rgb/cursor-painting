import { hexToRgb, rgbToHex } from './mixing';
import { normalizeHexColor } from './hexNormalize';

/** Future hooks: `window.addEventListener('colormix:color-select', (e) => e.detail)` */
export const COLOR_SELECT_EVENT = 'colormix:color-select';

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function toRgb255(hex) {
  const [r, g, b] = hexToRgb(hex);
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function fromRgb255(r, g, b) {
  return rgbToHex([
    clamp(r, 0, 255) / 255,
    clamp(g, 0, 255) / 255,
    clamp(b, 0, 255) / 255
  ]);
}

export function rgb255ToCmyk({ r, g, b }) {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100)
  };
}

export function cmykToRgb255({ c, m, y, k }) {
  const C = clamp(c, 0, 100) / 100;
  const M = clamp(m, 0, 100) / 100;
  const Y = clamp(y, 0, 100) / 100;
  const K = clamp(k, 0, 100) / 100;
  return {
    r: Math.round(255 * (1 - C) * (1 - K)),
    g: Math.round(255 * (1 - M) * (1 - K)),
    b: Math.round(255 * (1 - Y) * (1 - K))
  };
}

export function formatRgbCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatCmyk({ c, m, y, k }) {
  return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}

export function parseHexStrict(input) {
  let s = String(input ?? '').trim();
  if (!s) return null;
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(s)) return null;
  return s.toLowerCase();
}

export function parseRgbChannels(r, g, b) {
  const R = Number(r);
  const G = Number(g);
  const B = Number(b);
  if (![R, G, B].every((n) => Number.isFinite(n))) return null;
  if ([R, G, B].some((n) => n < 0 || n > 255)) return null;
  return fromRgb255(R, G, B);
}

export function parseCmykChannels(c, m, y, k) {
  const C = Number(c);
  const M = Number(m);
  const Y = Number(y);
  const K = Number(k);
  if (![C, M, Y, K].every((n) => Number.isFinite(n))) return null;
  if ([C, M, Y, K].some((n) => n < 0 || n > 100)) return null;
  const rgb = cmykToRgb255({ c: C, m: M, y: Y, k: K });
  return fromRgb255(rgb.r, rgb.g, rgb.b);
}

export function colorSnapshot(hex, extra = {}) {
  const h = parseHexStrict(hex) || normalizeHexColor(hex);
  const rgb = toRgb255(h);
  const cmyk = rgb255ToCmyk(rgb);
  return {
    hex: h,
    hexUpper: h.toUpperCase(),
    rgb,
    rgbText: formatRgbCss(rgb),
    cmyk,
    cmykText: formatCmyk(cmyk),
    ...extra
  };
}

export function emitColorSelect(snapshot) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(COLOR_SELECT_EVENT, { detail: snapshot }));
}

export async function copyToClipboard(text) {
  const value = String(text ?? '');
  if (!value) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
