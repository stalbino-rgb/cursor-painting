import { COLOR_LIBRARY } from '../data/colorLibrary';
import { CARAN_NEOCOLOR_II_30, FABER_CASTELL_ALBRECHT_DURER_72 } from '../data/colorData';
import {
  PRISMA_PREMIER_72,
  SHIELD_EPIC_36,
  MIJELLO_MISSION_GOLD_34,
  SHINHAN_SWC_32
} from '../data/brandSetColors';

export const MAX_MIX_COLORS = 4;

export const MIX_MODE_OPTIONS = [
  { id: 'default', label: '기본 조색' },
  { id: 'faber', label: '파버카스텔' },
  { id: 'prisma', label: '프리즈마' },
  { id: 'shield', label: '쉴드' },
  { id: 'mijello', label: '미젤로' },
  { id: 'shinhan', label: '신한' }
];

function withKeys(list, prefix, noField) {
  return (list || []).map((c, i) => ({
    ...c,
    no: c.no ?? c[noField],
    key: c.key || `${prefix}-${c[noField] ?? c.no ?? i}`
  }));
}

export function getMixPoolForMode(mixMode) {
  if (mixMode === 'faber') {
    const faber = FABER_CASTELL_ALBRECHT_DURER_72.colors.filter((c) => c.isSet72);
    const caran = CARAN_NEOCOLOR_II_30.colors.filter((c) => c.isSet30);
    return [
      ...caran.map((c) => ({
        name: c.name,
        hex: c.hex,
        no: c.no,
        key: `caran-${c.no}`,
        brand: "Caran d'Ache",
        isCaran30: true
      })),
      ...faber.map((c) => ({
        name: c.name,
        hex: c.hex,
        no: c.no,
        key: `faber-${c.no}`,
        brand: 'Faber-Castell',
        isCaran30: false
      }))
    ];
  }
  if (mixMode === 'prisma') return withKeys(PRISMA_PREMIER_72, 'prisma', 'prismaNo');
  if (mixMode === 'shield') return withKeys(SHIELD_EPIC_36, 'shield', 'shieldNo');
  if (mixMode === 'mijello') return withKeys(MIJELLO_MISSION_GOLD_34, 'mijello', 'mijelloNo');
  if (mixMode === 'shinhan') return withKeys(SHINHAN_SWC_32, 'shinhan', 'shinhanNo');

  return COLOR_LIBRARY.map((c, i) => ({
    ...c,
    key: c.key || `all-${c.brand || 'lib'}-${c.prismaNo ?? c.shieldNo ?? c.mijelloNo ?? c.shinhanNo ?? c.name}-${i}`
  }));
}

export const BRAND_MIX_MODES = ['faber', 'prisma', 'shield', 'mijello', 'shinhan'];

export function isBrandMixMode(mixMode) {
  return BRAND_MIX_MODES.includes(mixMode);
}

export function detectColorMixMode(color) {
  if (!color) return null;
  if (color.prismaNo != null || color.brand === 'Prisma') return 'prisma';
  if (color.shieldNo != null || color.brand === 'Shield') return 'shield';
  if (color.mijelloNo != null || color.brand === 'Mijello') return 'mijello';
  if (color.shinhanNo != null || color.brand === 'Shinhan') return 'shinhan';
  if (
    color.isSet72 ||
    color.brand === 'Faber-Castell' ||
    color.isSet30 ||
    color.brand === "Caran d'Ache" ||
    color.isCaran30
  ) {
    return 'faber';
  }
  return null;
}

export function getMixModeHint(mixMode) {
  const extra = '안료는 최대 4색이며, 물은 한도에 넣지 않아 물 포함 시 총 5가지까지 섞을 수 있습니다.';
  if (mixMode === 'faber') return `파버카스텔 72 + 카란다시 30 풀에서 조색합니다. ${extra}`;
  if (mixMode === 'prisma') return `프리즈마 Premier 72색 풀에서 조색합니다. ${extra}`;
  if (mixMode === 'shield') return `쉴드 에픽 아크릴 36색 풀에서 조색합니다. ${extra}`;
  if (mixMode === 'mijello') return `미젤로 미션골드 34색 풀에서 조색합니다. ${extra}`;
  if (mixMode === 'shinhan') return `신한 SWC 32색 풀에서 조색합니다. ${extra}`;
  return `Base Colors에서 조색합니다. ${extra}`;
}
