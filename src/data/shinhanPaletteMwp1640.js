import { SHINHAN_NEUTRALS } from './shinhanHueWheel';
import { SHINHAN_SWC_32 as SWC } from './brandSetColors';

const byNo = Object.fromEntries(SWC.map((c) => [c.shinhanNo, c]));

function paint(no, hue) {
  const c = byNo[no];
  if (!c) throw new Error(`Unknown Shinhan no ${no}`);
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
  warmGrey: extra('warmGrey', 'Warm Grey', '웜그레이', '#A3978C', 'warm'),
  reserve: extra('reserve', 'Reserve', '예비', '#E2E8F0', null)
};

/**
 * MWP-1640 as 16 + 12 + 12 wells on a shared 16-column grid.
 *
 * Row 1 (16): Y → RV, then one 예비.
 * Row 2 (12): complements V → GY in the same left-to-right family order.
 *   Counts cannot be 1:1 (Y2↔V1, YO3↔VB2, O1↔B2, OR3↔BG3, R2↔G2, RV4↔GY2),
 *   so groups sit under the matching family as adjacent as possible:
 *   V under Y, VB under YO, B under O plus the first OR well,
 *   BG under the rest of OR, G under R, GY under RV (+ 예비).
 * Row 3 (12): leftover olive (GY/earth) + Shinhan earths + extra 무채.
 */
export const PALETTE_ROWS = {
  row1: {
    label: '맨 위 16칸 · Y → RV',
    note: 'Y 2 · YO 3 · O 1 · OR 3 · R 2 · RV 4 · 예비 1',
    groups: [
      { hue: 'Y', span: 2, pair: 'V', colors: [paint(861, 'Y'), paint(858, 'Y')] },
      { hue: 'YO', span: 3, pair: 'VB', colors: [paint(856, 'YO'), paint(840, 'YO'), paint(970, 'YO')] },
      { hue: 'O', span: 1, pair: 'B', colors: [paint(843, 'O')] },
      { hue: 'OR', span: 3, pair: 'BG', colors: [paint(833, 'OR'), paint(963, 'OR'), paint(959, 'OR')] },
      { hue: 'R', span: 2, pair: 'G', colors: [paint(814, 'R'), paint(957, 'R')] },
      { hue: 'RV', span: 4, pair: 'GY', colors: [paint(803, 'RV'), paint(811, 'RV'), paint(807, 'RV'), paint(821, 'RV')] },
      { hue: '예비', span: 1, pair: '', colors: [N.reserve] }
    ]
  },
  row2: {
    label: '중간 12칸 · 보색 V → GY',
    note: '위와 1:1은 불가 · 같은 순서로 가족끼리 인접 (Y↔V, YO↔VB, O↔B, OR↔BG, R↔G, RV↔GY)',
    groups: [
      { hue: 'V', span: 2, pair: 'Y', colors: [paint(938, 'V')] },
      { hue: 'VB', span: 3, pair: 'YO', colors: [paint(926, 'VB'), paint(933, 'VB')] },
      { hue: 'B', span: 2, pair: 'O', colors: [paint(923, 'B'), paint(920, 'B')] },
      { hue: 'BG', span: 3, pair: 'OR', colors: [paint(911, 'BG'), paint(888, 'BG'), paint(928, 'BG')] },
      { hue: 'G', span: 2, pair: 'R', colors: [paint(883, 'G'), paint(874, 'G')] },
      { hue: 'GY', span: 4, pair: 'RV', colors: [paint(868, 'GY'), paint(879, 'GY')] }
    ]
  },
  row3: {
    label: '셋째 줄 12칸 · 무채',
    note: '올리브(GY·어스) + 신한 어스 4 + 예비 무채 7',
    groups: [
      {
        hue: 'N',
        span: 16,
        pair: '',
        colors: [
          paint(870, 'GY'),
          ...SHINHAN_NEUTRALS.map((c) => ({ ...c, hue: 'N', extra: false })),
          N.white,
          N.black,
          N.payne,
          N.tint,
          N.coolGrey,
          N.warmGrey,
          N.reserve
        ]
      }
    ]
  }
};

export function shortPaletteName(color) {
  const ko = (color.koName || '').trim();
  const en = (color.name || '').trim();
  if (!ko) return en;
  if (!en) return ko;
  return ko.length <= en.length ? ko : en;
}

export function toneMark(tone) {
  if (tone === 'cool') return 'C';
  if (tone === 'warm') return 'W';
  return '';
}
