import { hexToRgb } from './mixing';
import { normalizeHexColor } from './hexNormalize';

export function distanceSq(hexA, hexB) {
  const [ar, ag, ab] = hexToRgb(normalizeHexColor(hexA));
  const [br, bg, bb] = hexToRgb(normalizeHexColor(hexB));
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return dr * dr + dg * dg + db * db;
}

