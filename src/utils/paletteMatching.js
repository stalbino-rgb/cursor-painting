import { hexToRgb } from './mixing';

function distanceSq(hexA, hexB) {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return dr * dr + dg * dg + db * db;
}

export function getNearestColorInPalette(targetHex, palette) {
  if (!palette?.colors?.length) return null;
  let best = null;
  for (const color of palette.colors) {
    const score = distanceSq(targetHex, color.hex);
    if (!best || score < best.distance) {
      best = {
        ...color,
        paletteId: palette.id,
        paletteName: palette.name,
        paletteBrand: palette.brand,
        distance: score
      };
    }
  }
  return best;
}

export function collectNearestPaletteCandidates(targetHex, options) {
  const {
    palettes = [],
    priorityPaletteIds = [],
    maxPerPalette = 10,
    maxTotal = 24
  } = options || {};

  const paletteById = new Map(palettes.map((p) => [p.id, p]));
  const ordered = [
    ...priorityPaletteIds.map((id) => paletteById.get(id)).filter(Boolean),
    ...palettes.filter((p) => !priorityPaletteIds.includes(p.id))
  ];

  const candidates = [];
  const nearestByPalette = [];

  for (const palette of ordered) {
    const scored = (palette.colors || [])
      .map((color) => ({
        ...color,
        paletteId: palette.id,
        paletteName: palette.name,
        paletteBrand: palette.brand,
        distance: distanceSq(targetHex, color.hex)
      }))
      .sort((a, b) => a.distance - b.distance);

    if (scored.length > 0) {
      nearestByPalette.push(scored[0]);
    }

    for (const item of scored.slice(0, maxPerPalette)) {
      candidates.push(item);
      if (candidates.length >= maxTotal) break;
    }
    if (candidates.length >= maxTotal) break;
  }

  return {
    candidates,
    nearestByPalette
  };
}

/** Squared RGB distance below this is treated as “similar” for brand tie-break. */
const BRAND_TIE_DISTANCE_SQ = 1400;

/**
 * Nearest color across multiple palettes. If two colors are similarly close,
 * Caran d'Ache is preferred (per product requirement).
 */
export function getNearestAcrossPalettesPreferCaran(targetHex, palettes) {
  if (!targetHex || !palettes?.length) return null;
  const entries = [];
  for (const palette of palettes) {
    for (const color of palette.colors || []) {
      const d = distanceSq(targetHex, color.hex);
      entries.push({
        ...color,
        paletteId: palette.id,
        paletteName: palette.name,
        paletteBrand: palette.brand,
        distance: d
      });
    }
  }
  if (!entries.length) return null;
  entries.sort((a, b) => a.distance - b.distance);
  const bestD = entries[0].distance;
  const close = entries.filter((e) => e.distance <= bestD + BRAND_TIE_DISTANCE_SQ);
  const caran = close.find((e) => e.paletteBrand === "Caran d'Ache");
  return caran || entries[0];
}

