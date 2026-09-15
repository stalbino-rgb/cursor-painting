import { SHIELD_NEUTRALS } from './shieldHueWheel';
import { SHIELD_EPIC_36 as EPIC } from './brandSetColors';

export { shortPaletteName, toneMark } from './shinhanPaletteMwp1640';

const byNo = Object.fromEntries(EPIC.map((c) => [c.shieldNo, c]));

function paint(no, hue) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Shield no ${no}`);
  return { ...c, hue, extra: false };
}

function extra(id, name, koName, hex, tone) {
  return { id, name, koName, hex, tone, extra: true, hue: 'N' };
}

const N = {
  payne: extra('payne', "Payne's Grey", '페인스', '#3D4C5C', 'cool'),
  tint: extra('tint', 'Neutral Tint', '뉴트럴', '#4A4540', 'cool'),
  reserve: extra('reserve', 'Reserve', '예비', '#E2E8F0', null)
};

/**
 * MWP-1640 as 16 + 12 + 12.
 * Row 1: Y → RV + 예비 (Jaune Brilliant stays in YO).
 * Row 2: complements V → GY, same family order; G keeps Emerald only.
 * Row 3: Shield 무채·메탈·어스 9 + extra 3.
 */
export const SHIELD_PALETTE_ROWS = {
  row1: {
    label: '맨 위 16칸 · Y → RV',
    note: 'Y 2 · YO 4 · O 1 · OR 3 · R 2 · RV 3 · 예비 1',
    groups: [
      { hue: 'Y', span: 2, pair: 'V', colors: [paint(603, 'Y'), paint(604, 'Y')] },
      {
        hue: 'YO',
        span: 4,
        pair: 'VB',
        colors: [paint(605, 'YO'), paint(608, 'YO'), paint(607, 'YO'), paint(611, 'YO')]
      },
      { hue: 'O', span: 1, pair: 'B', colors: [paint(610, 'O')] },
      { hue: 'OR', span: 3, pair: 'BG', colors: [paint(613, 'OR'), paint(614, 'OR'), paint(621, 'OR')] },
      { hue: 'R', span: 2, pair: 'G', colors: [paint(615, 'R'), paint(617, 'R')] },
      {
        hue: 'RV',
        span: 3,
        pair: 'GY',
        colors: [paint(618, 'RV'), paint(619, 'RV'), paint(651, 'RV')]
      },
      { hue: '예비', span: 1, pair: '', colors: [N.reserve] }
    ]
  },
  row2: {
    label: '중간 12칸 · 보색 V → GY',
    note: '위와 1:1은 불가 · 같은 순서로 가족끼리 인접 (Y↔V, YO↔VB, O↔B, OR↔BG, R↔G, RV↔GY)',
    groups: [
      { hue: 'V', span: 2, pair: 'Y', colors: [paint(649, 'V'), paint(650, 'V')] },
      { hue: 'VB', span: 3, pair: 'YO', colors: [paint(644, 'VB')] },
      { hue: 'B', span: 2, pair: 'O', colors: [paint(643, 'B'), paint(641, 'B')] },
      { hue: 'BG', span: 3, pair: 'OR', colors: [paint(646, 'BG'), paint(640, 'BG'), paint(631, 'BG')] },
      { hue: 'G', span: 2, pair: 'R', colors: [paint(632, 'G')] },
      { hue: 'GY', span: 4, pair: 'RV', colors: [paint(630, 'GY'), paint(638, 'GY'), paint(639, 'GY')] }
    ]
  },
  row3: {
    label: '셋째 줄 12칸 · 무채',
    note: '쉴드 화이트·펄·그레이·블랙·메탈 2 · 어스 3 + 예비 무채 3',
    groups: [
      {
        hue: 'N',
        span: 16,
        pair: '',
        colors: [
          ...SHIELD_NEUTRALS.map((c) => ({ ...c, hue: 'N', extra: false })),
          N.payne,
          N.tint,
          N.reserve
        ]
      }
    ]
  }
};
