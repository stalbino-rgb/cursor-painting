import { MIJELLO_MISSION_GOLD_34 } from './brandSetColors';
import { SHINHAN_HUE_LABELS, SHINHAN_HUE_ORDER } from './shinhanHueWheel';

export const MIJELLO_HUE_ORDER = SHINHAN_HUE_ORDER;
export const MIJELLO_HUE_LABELS = SHINHAN_HUE_LABELS;

const byNo = Object.fromEntries(MIJELLO_MISSION_GOLD_34.map((c) => [c.mijelloNo, c]));

function paint(no, extra = {}) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Mijello no ${no}`);
  return { ...c, ...extra };
}

/**
 * Hue-wheel placement for Mijello Mission Gold 34.
 * Near-neutrals sit in the center: this 34-set has no white/black/grey.
 */
export const MIJELLO_HUE_SECTORS = [
  { cat: 'Y', nos: [521, 522] },
  { cat: 'YO', nos: [523, 518, 561] },
  { cat: 'O', nos: [517] },
  { cat: 'OR', nos: [516, 564, 562] },
  { cat: 'R', nos: [511, 565] },
  { cat: 'RV', nos: [514, 513, 512, 551, 552] },
  { cat: 'V', nos: [553] },
  { cat: 'VB', nos: [545, 546] },
  { cat: 'B', nos: [542, 541] },
  { cat: 'BG', nos: [543, 536, 544] },
  { cat: 'G', nos: [535, 537] },
  { cat: 'GY', nos: [531, 532, 534, 533] }
];

export const MIJELLO_NO_TO_HUE = Object.fromEntries(
  MIJELLO_HUE_SECTORS.flatMap((s) => s.nos.map((no) => [no, s.cat]))
);

export const MIJELLO_UNCERTAIN = {
  523: 'Y와 YO 사이 금빛 노랑',
  562: 'OR와 R 사이 어스 레드',
  565: 'R와 OR 사이 갈색 레드',
  546: 'VB와 B 사이 어두운 청보라',
  544: 'B와 BG 사이 녹빛 암청색',
  537: 'G와 GY 사이 어두운 갈녹',
  533: 'GY이지만 어스 갈녹으로도 읽힘'
};

export const MIJELLO_NEUTRALS = [
  paint(563, { note: '쿨 브라운. 채도가 낮아 무채에 가깝고 GY/YO 어스로도 읽힘' }),
  paint(570, { note: '웜 다크 브라운. 색상각이 불분명한 어스' }),
  paint(566, { note: '어두운 웜 브라운. 무채에 가장 가까움' }),
  paint(567, { note: '어두운 갈. 반다이크와 함께 뉴트럴 조색용' })
];

function hexValue(hex) {
  const h = String(hex || '').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return Math.max(r, g, b);
}

export function getMijelloHueSectors() {
  return MIJELLO_HUE_SECTORS.map((sector) => {
    const colors = sector.nos
      .map((no) => {
        const c = paint(no);
        const reason = MIJELLO_UNCERTAIN[no];
        return {
          ...c,
          uncertain: Boolean(reason),
          uncertainNote: reason || ''
        };
      })
      .sort((a, b) => hexValue(b.hex) - hexValue(a.hex));
    return {
      cat: sector.cat,
      label: MIJELLO_HUE_LABELS[sector.cat],
      colors
    };
  });
}
