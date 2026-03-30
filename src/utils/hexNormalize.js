/**
 * Normalize any common hex input to lowercase `#rrggbb`.
 * Invalid input falls back to `#000000` so downstream math never sees NaN.
 */
export function normalizeHexColor(input) {
  if (input == null || input === '') return '#000000';
  let s = String(input).trim();
  if (!s.startsWith('#')) s = `#${s}`;
  if (s.length === 4 && /^#[0-9A-Fa-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(s)) return '#000000';
  return s.toLowerCase();
}
