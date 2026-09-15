import { SHIELD_EPIC_36 } from './brandSetColors';
import { SHINHAN_HUE_LABELS, SHINHAN_HUE_ORDER } from './shinhanHueWheel';

export const SHIELD_HUE_ORDER = SHINHAN_HUE_ORDER;
export const SHIELD_HUE_LABELS = SHINHAN_HUE_LABELS;

const byNo = Object.fromEntries(SHIELD_EPIC_36.map((c) => [c.shieldNo, c]));

function paint(no, extra = {}) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Shield no ${no}`);
  return { ...c, ...extra };
}

/**
 * Hue-wheel placement for Shield Epic acrylic 36.
 * Mixing temperature (cool/warm), not HSV.
 * Whites, greys, black, metallics, and low-chroma earths sit in the center.
 */
export const SHIELD_HUE_SECTORS = [
  { cat: 'Y', nos: [603, 604] },
  { cat: 'YO', nos: [605, 608, 607, 611] },
  { cat: 'O', nos: [610] },
  { cat: 'OR', nos: [613, 614, 621] },
  { cat: 'R', nos: [615, 617] },
  { cat: 'RV', nos: [618, 619, 651] },
  { cat: 'V', nos: [649, 650] },
  { cat: 'VB', nos: [644] },
  { cat: 'B', nos: [641, 643] },
  { cat: 'BG', nos: [646, 640, 631] },
  { cat: 'G', nos: [632] },
  { cat: 'GY', nos: [630, 638, 639] }
];

export const SHIELD_NO_TO_HUE = Object.fromEntries(
  SHIELD_HUE_SECTORS.flatMap((s) => s.nos.map((no) => [no, s.cat]))
);

export const SHIELD_UNCERTAIN = {
  605: 'Y와 YO 사이 금빛 노랑',
  611: 'YO와 O 사이 살구/살색',
  613: 'OR와 R 사이 코랄',
  617: 'R와 RV 사이 쿨 레드',
  644: 'VB와 B 사이 적빛 파랑',
  646: 'B와 BG 사이 녹빛 파랑',
  639: 'GY이지만 어스 갈녹으로도 읽힘'
};

export const SHIELD_NEUTRALS = [
  paint(600, { note: '티타늄에 가까운 쿨 화이트' }),
  paint(673, { note: '크림빛 펄. 웜 화이트로 읽힘' }),
  paint(654, { note: '중성 그레이. 쿨에 가깝고 무채 조색용' }),
  paint(660, { note: '쿨 블랙' }),
  paint(671, { note: '메탈릭 실버. 색상각이 없는 무채' }),
  paint(670, { note: '메탈릭 골드. YO 오커와 비슷한 색이지만 메탈이라 중앙' }),
  paint(628, { note: '쿨 브라운. 채도가 낮아 무채에 가깝고 GY/YO 어스로도 읽힘' }),
  paint(624, { note: '웜 다크 브라운. 색상각이 불분명한 어스' }),
  paint(626, { note: '어두운 웜 브라운. 무채에 가장 가까움' })
];

function hexValue(hex) {
  const h = String(hex || '').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return Math.max(r, g, b);
}

export function getShieldHueSectors() {
  return SHIELD_HUE_SECTORS.map((sector) => {
    const colors = sector.nos
      .map((no) => {
        const c = paint(no);
        const reason = SHIELD_UNCERTAIN[no];
        return {
          ...c,
          uncertain: Boolean(reason),
          uncertainNote: reason || ''
        };
      })
      .sort((a, b) => hexValue(b.hex) - hexValue(a.hex));
    return {
      cat: sector.cat,
      label: SHIELD_HUE_LABELS[sector.cat],
      colors
    };
  });
}
