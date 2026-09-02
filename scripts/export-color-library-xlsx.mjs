import ExcelJS from 'exceljs';
import { COLOR_LIBRARY } from '../src/data/colorLibrary.js';
import { CARAN_NEOCOLOR_II_30, FABER_CASTELL_ALBRECHT_DURER_72 } from '../src/data/colors.js';

function hexToRgb(hex) {
  const h = String(hex || '')
    .replace('#', '')
    .toUpperCase();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return { r: '', g: '', b: '' };
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: '', g: '', b: '' };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorNo(c) {
  return c.prismaNo ?? c.shieldNo ?? c.mijelloNo ?? c.shinhanNo ?? c.no ?? '';
}

function groupOf(c) {
  if (c.brand === '기본색' || String(c.name || '').startsWith('기본색')) return '기본색';
  if (c.prismaNo != null || c.brand === 'Prisma') return '프리즈마 Premier 72';
  if (c.shieldNo != null || c.brand === 'Shield') return '쉴드 에픽 아크릴 36';
  if (c.mijelloNo != null || c.brand === 'Mijello') return '미젤로 미션골드 34';
  if (c.shinhanNo != null || c.brand === 'Shinhan') return '신한 SWC 32';
  if (c.brand === 'Faber-Castell' || c.isSet72) return '파버카스텔 Albrecht Durer';
  if (c.brand === "Caran d'Ache" || c.isSet30) return "카란다시 Neocolor II";
  return '일반 라이브러리';
}

function mediumOf(c) {
  return c.medium || '';
}

function setLabel(c) {
  if (c.isSet72) return '72세트';
  if (c.isSet30) return '30세트';
  return '';
}

function flatten() {
  const extra = [
    ...CARAN_NEOCOLOR_II_30.colors.map((color) => ({
      ...color,
      brand: CARAN_NEOCOLOR_II_30.brand,
      source: CARAN_NEOCOLOR_II_30.name,
      medium: CARAN_NEOCOLOR_II_30.medium
    })),
    ...FABER_CASTELL_ALBRECHT_DURER_72.colors.map((color) => ({
      ...color,
      brand: FABER_CASTELL_ALBRECHT_DURER_72.brand,
      source: FABER_CASTELL_ALBRECHT_DURER_72.name,
      medium: FABER_CASTELL_ALBRECHT_DURER_72.medium
    }))
  ];
  const all = [
    ...COLOR_LIBRARY.map((c) => ({ ...c, source: c.source || c.brand || 'library' })),
    ...extra
  ];
  const seen = new Set();
  const unique = [];
  for (const item of all) {
    const key = `${item.source || ''}|${item.name}|${item.hex}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

const HEADERS = [
  '일련번호',
  '그룹',
  '브랜드',
  '색상번호',
  '물감명(영문)',
  '물감명(한글)',
  '현재_HEX',
  '현재_R',
  '현재_G',
  '현재_B',
  '매체',
  '세트표시',
  '실제보유_Y/N',
  '교체필요_Y/N',
  '실제_색상번호',
  '실제_물감명',
  '바꿀_HEX',
  '바꿀_R',
  '바꿀_G',
  '바꿀_B',
  '비고'
];

const USER_COLS = [13, 14, 15, 16, 17, 18, 19, 20, 21];

function toRow(c, i) {
  const rgb = hexToRgb(c.hex);
  return [
    i,
    groupOf(c),
    c.brand || '',
    colorNo(c),
    c.name || '',
    c.koName || '',
    String(c.hex || '').toUpperCase(),
    rgb.r,
    rgb.g,
    rgb.b,
    mediumOf(c),
    setLabel(c),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];
}

function styleSheet(ws, rowCount) {
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rowCount, column: HEADERS.length } };
  const widths = [10, 28, 16, 12, 28, 28, 12, 10, 10, 10, 14, 12, 14, 14, 14, 22, 12, 10, 10, 10, 28];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 28;
  for (let r = 2; r <= rowCount; r++) {
    const hex = String(ws.getCell(r, 7).value || '').replace('#', '');
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      const cell = ws.getCell(r, 7);
      const n = parseInt(hex, 16);
      const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hex}` } };
      cell.font = { color: { argb: lum < 148 ? 'FFFFFFFF' : 'FF111111' } };
    }
    USER_COLS.forEach((col) => {
      ws.getCell(r, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3C4' } };
    });
  }
  for (let r = 2; r <= rowCount; r++) {
    ws.getCell(r, 13).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Y,N"']
    };
    ws.getCell(r, 14).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Y,N"']
    };
  }
}

async function main() {
  const rows = flatten();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'cursor painting';
  wb.created = new Date();

  const guide = wb.addWorksheet('사용법', { properties: { tabColor: { argb: 'FF0EA5E9' } } });
  guide.columns = [{ width: 92 }];
  [
    'Color Library 물감 비교표',
    '',
    '노란 칸만 입력하세요. 흰 칸은 앱에 들어 있는 현재 값입니다.',
    '',
    '1) 실제보유_Y/N : 해당 물감을 가지고 있으면 Y',
    '2) 교체필요_Y/N : 앱 HEX가 실제 물감과 다르면 Y',
    '3) 실제_색상번호 / 실제_물감명 : 튜브·연필에 적힌 번호와 이름',
    '4) 바꿀_HEX : 실제에 맞게 고칠 색. 예) #E32636',
    '5) 바꿀_R / G / B : HEX를 모를 때 0~255 숫자로 적어도 됩니다',
    '6) 비고 : 시리즈, 구매처, 투명/불투명 등',
    '',
    '시트는 그룹별로 나뉘어 있습니다. 전체 목록은 [전체] 시트를 보세요.',
    '작성 후 이 파일을 주시면 노란 칸 내용으로 Color Library를 수정할 수 있습니다.'
  ].forEach((text, i) => {
    guide.getCell(i + 1, 1).value = text;
    guide.getCell(i + 1, 1).font = i === 0 ? { bold: true, size: 14 } : { size: 11 };
  });

  const groups = [
    ['전체', rows],
    ['기본색', rows.filter((c) => groupOf(c) === '기본색')],
    ['일반 라이브러리', rows.filter((c) => groupOf(c) === '일반 라이브러리')],
    ['프리즈마', rows.filter((c) => groupOf(c) === '프리즈마 Premier 72')],
    ['쉴드', rows.filter((c) => groupOf(c) === '쉴드 에픽 아크릴 36')],
    ['미젤로', rows.filter((c) => groupOf(c) === '미젤로 미션골드 34')],
    ['신한', rows.filter((c) => groupOf(c) === '신한 SWC 32')],
    ['파버카스텔', rows.filter((c) => groupOf(c) === '파버카스텔 Albrecht Durer')],
    ['카란다시', rows.filter((c) => groupOf(c) === "카란다시 Neocolor II")]
  ];

  for (const [name, list] of groups) {
    const ws = wb.addWorksheet(name);
    ws.addRow(HEADERS);
    list.forEach((c, idx) => ws.addRow(toRow(c, idx + 1)));
    styleSheet(ws, list.length + 1);
  }

  const out = new URL('../Color-Library-비교표.xlsx', import.meta.url);
  const { fileURLToPath } = await import('node:url');
  const path = fileURLToPath(out);
  await wb.xlsx.writeFile(path);
  console.log(`wrote ${path} (${rows.length} colors)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
