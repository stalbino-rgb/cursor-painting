import { MIJELLO_NEUTRALS } from './mijelloHueWheel';
import { MIJELLO_MISSION_GOLD_34 as MG } from './brandSetColors';

export { shortPaletteName, toneMark } from './shinhanPaletteMwp1640';

const byNo = Object.fromEntries(MG.map((c) => [c.mijelloNo, c]));

function paint(no, hue) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Mijello no ${no}`);
  return { ...c, hue, extra: false };
}

function extra(id, name, koName, hex, tone) {
  return { id, name, koName, hex, tone, extra: true, hue: 'N' };
}

const N = {
  white: extra('white', 'Chinese White', '화이트', '#F4F1EA', 'cool'),
  black: extra('black', 'Ivory Black', '블랙', '#1C1C1C', 'cool'),
  payne: extra('payne', "Payne's Grey", '페인스', '#3D4C5C', 'cool'),
  tint: extra('tint', 'Neutral Tint', '뉴트럴', '#4A4540', 'cool'),
  coolGrey: extra('coolGrey', 'Cool Grey', '쿨그레이', '#90A4AE', 'cool'),
  warmGrey: extra('warmGrey', 'Warm Grey', '웜그레이', '#A3978C', 'warm')
};

/**
 * MWP-1640 as 16 + 12 + 12.
 * Row 1: Y → RV fills all 16 (RV is 5, so no 예비).
 * Row 2: complements V → GY, same family order; G keeps Hooker's only.
 * Row 3: olive + Van Dyke Green + earths + extra 무채.
 */
export const MIJELLO_PALETTE_ROWS = {
  row1: {
    label: '맨 위 16칸 · Y → RV',
    note: 'Y 2 · YO 3 · O 1 · OR 3 · R 2 · RV 5',
    groups: [
      { hue: 'Y', span: 2, pair: 'V', colors: [paint(521, 'Y'), paint(522, 'Y')] },
      { hue: 'YO', span: 3, pair: 'VB', colors: [paint(523, 'YO'), paint(518, 'YO'), paint(561, 'YO')] },
      { hue: 'O', span: 1, pair: 'B', colors: [paint(517, 'O')] },
      { hue: 'OR', span: 3, pair: 'BG', colors: [paint(516, 'OR'), paint(564, 'OR'), paint(562, 'OR')] },
      { hue: 'R', span: 2, pair: 'G', colors: [paint(511, 'R'), paint(565, 'R')] },
      {
        hue: 'RV',
        span: 5,
        pair: 'GY',
        colors: [paint(514, 'RV'), paint(513, 'RV'), paint(512, 'RV'), paint(551, 'RV'), paint(552, 'RV')]
      }
    ]
  },
  row2: {
    label: '중간 12칸 · 보색 V → GY',
    note: '위와 1:1은 불가 · Van Dyke Green은 셋째 줄 무채',
    groups: [
      { hue: 'V', span: 2, pair: 'Y', colors: [paint(553, 'V')] },
      { hue: 'VB', span: 3, pair: 'YO', colors: [paint(545, 'VB'), paint(546, 'VB')] },
      { hue: 'B', span: 2, pair: 'O', colors: [paint(542, 'B'), paint(541, 'B')] },
      { hue: 'BG', span: 3, pair: 'OR', colors: [paint(543, 'BG'), paint(536, 'BG'), paint(544, 'BG')] },
      { hue: 'G', span: 2, pair: 'R', colors: [paint(535, 'G')] },
      { hue: 'GY', span: 4, pair: 'RV', colors: [paint(531, 'GY'), paint(532, 'GY'), paint(534, 'GY')] }
    ]
  },
  row3: {
    label: '셋째 줄 12칸 · 무채',
    note: '올리브 + 반다이크 그린 + 미젤로 어스 4 + 예비 무채 6',
    groups: [
      {
        hue: 'N',
        span: 16,
        pair: '',
        colors: [
          paint(533, 'GY'),
          paint(537, 'G'),
          ...MIJELLO_NEUTRALS.map((c) => ({ ...c, hue: 'N', extra: false })),
          N.white,
          N.black,
          N.payne,
          N.tint,
          N.coolGrey,
          N.warmGrey
        ]
      }
    ]
  }
};
