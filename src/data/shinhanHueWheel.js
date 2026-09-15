import { SHINHAN_SWC_32 } from './brandSetColors';

/** Clockwise from 12 o'clock. */
export const SHINHAN_HUE_ORDER = ['Y', 'YO', 'O', 'OR', 'R', 'RV', 'V', 'VB', 'B', 'BG', 'G', 'GY'];

export const SHINHAN_HUE_LABELS = {
  Y: 'Yellow',
  YO: 'Yellow Orange',
  O: 'Orange',
  OR: 'Orange Red',
  R: 'Red',
  RV: 'Red Violet',
  V: 'Violet',
  VB: 'Violet Blue',
  B: 'Blue',
  BG: 'Blue Green',
  G: 'Green',
  GY: 'Green Yellow'
};

const byNo = Object.fromEntries(SHINHAN_SWC_32.map((c) => [c.shinhanNo, c]));

function paint(no, extra = {}) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Shinhan no ${no}`);
  return { ...c, ...extra };
}

/**
 * Hue-wheel placement for Shinhan SWC 32.
 * `uncertain` colors stay on the wheel but are flagged.
 * Near-neutrals (low-chroma earths) sit in the center: this 32-set has no white/black/grey.
 */
export const SHINHAN_HUE_SECTORS = [
  { cat: 'Y', nos: [861, 858] },
  { cat: 'YO', nos: [856, 840, 970] },
  { cat: 'O', nos: [843] },
  { cat: 'OR', nos: [833, 963, 959] },
  { cat: 'R', nos: [814, 957] },
  { cat: 'RV', nos: [803, 811, 807, 821] },
  { cat: 'V', nos: [938] },
  { cat: 'VB', nos: [926, 933] },
  { cat: 'B', nos: [923, 920] },
  { cat: 'BG', nos: [911, 888, 928] },
  { cat: 'G', nos: [883, 874] },
  { cat: 'GY', nos: [868, 879, 870] }
];

export const SHINHAN_NO_TO_HUE = Object.fromEntries(
  SHINHAN_HUE_SECTORS.flatMap((s) => s.nos.map((no) => [no, s.cat]))
);

export const SHINHAN_UNCERTAIN = {
  856: 'Y와 YO 사이 금빛 노랑',
  959: 'OR와 R 사이 어스 레드',
  957: 'R와 OR 사이 갈색 레드',
  933: 'VB와 B 사이 어두운 청보라',
  928: 'B와 BG 사이 녹빛 암청색',
  874: 'G와 GY 사이 노란 초록',
  870: 'GY이지만 어스 갈녹으로도 읽힘'
};

export const SHINHAN_NEUTRALS = [
  paint(966, { note: '쿨 브라운. 채도가 낮아 무채에 가깝고 GY/YO 어스로도 읽힘' }),
  paint(964, { note: '웜 다크 브라운. 색상각이 불분명한 어스' }),
  paint(977, { note: '어두운 웜 브라운. 무채에 가장 가까움' }),
  paint(975, { note: '어두운 갈. 세피아와 함께 뉴트럴 조색용' })
];

function hexValue(hex) {
  const h = String(hex || '').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return Math.max(r, g, b);
}

export function getShinhanHueSectors() {
  return SHINHAN_HUE_SECTORS.map((sector) => {
    const colors = sector.nos
      .map((no) => {
        const c = paint(no);
        const reason = SHINHAN_UNCERTAIN[no];
        return {
          ...c,
          uncertain: Boolean(reason),
          uncertainNote: reason || ''
        };
      })
      .sort((a, b) => hexValue(b.hex) - hexValue(a.hex));
    return {
      cat: sector.cat,
      label: SHINHAN_HUE_LABELS[sector.cat],
      colors
    };
  });
}
