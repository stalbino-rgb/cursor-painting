import { hexToHsv } from './colorUtils';
import { SHINHAN_NO_TO_HUE } from '../data/shinhanHueWheel';
import { MIJELLO_NO_TO_HUE } from '../data/mijelloHueWheel';
import { SHIELD_NO_TO_HUE } from '../data/shieldHueWheel';

/**
 * 12-hue wheel categories, clockwise from 12 o'clock Y.
 * Painter-style HSV ranges (not equal 30° Munsell bins).
 */
export function hexToHueWheelCat(hex) {
  const { h, s, v } = hexToHsv(hex);
  if (s < 0.14 || v < 0.12) return null;
  const hue = ((h % 360) + 360) % 360;
  if (hue >= 48 && hue < 75) return 'Y';
  if (hue >= 32 && hue < 48) return 'YO';
  if (hue >= 18 && hue < 32) return 'O';
  if (hue >= 5 && hue < 18) return 'OR';
  if (hue >= 350 || hue < 5) return 'R';
  if (hue >= 300 && hue < 350) return 'RV';
  if (hue >= 265 && hue < 300) return 'V';
  if (hue >= 228 && hue < 265) return 'VB';
  if (hue >= 198 && hue < 228) return 'B';
  if (hue >= 155 && hue < 198) return 'BG';
  if (hue >= 100 && hue < 155) return 'G';
  return 'GY';
}

export function colorToHueWheelCat(color) {
  if (color?.shinhanNo != null && SHINHAN_NO_TO_HUE[color.shinhanNo]) {
    return SHINHAN_NO_TO_HUE[color.shinhanNo];
  }
  if (color?.mijelloNo != null && MIJELLO_NO_TO_HUE[color.mijelloNo]) {
    return MIJELLO_NO_TO_HUE[color.mijelloNo];
  }
  if (color?.shieldNo != null && SHIELD_NO_TO_HUE[color.shieldNo]) {
    return SHIELD_NO_TO_HUE[color.shieldNo];
  }
  return hexToHueWheelCat(color?.hex);
}
