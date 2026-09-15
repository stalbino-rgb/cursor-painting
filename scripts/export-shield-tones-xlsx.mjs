import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Shield Epic Acrylic 36 — same order and tone as SHIELD_EPIC_36 */
const ROWS = [
  [600, 'White', '화이트', '#F7F7F5', 'cool'],
  [603, 'Lemon Yellow', '레몬 옐로우', '#F4E14B', 'cool'],
  [604, 'Permanent Yellow Middle', '퍼머넌트 옐로우 미들', '#F2C93A', 'warm'],
  [605, 'Permanent Yellow Deep', '퍼머넌트 옐로우 딥', '#E8A825', 'warm'],
  [607, 'Yellow Ochre', '옐로우 오커', '#C9A227', 'warm'],
  [608, 'Naples Yellow', '네이플스 옐로우', '#F3D67A', 'warm'],
  [610, 'Permanent Orange', '퍼머넌트 오렌지', '#ED872D', 'warm'],
  [611, 'Jaune Brilliant', '존 브릴리언트', '#F6C9A0', 'warm'],
  [613, 'Coral Red', '코랄 레드', '#E57373', 'warm'],
  [614, 'Vermilion', '버밀리온', '#E34234', 'warm'],
  [615, 'Naphthol Red Light', '나프톨 레드 라이트', '#D32F2F', 'warm'],
  [617, 'Carmine', '카민', '#B71C1C', 'cool'],
  [618, 'Magenta', '마젠타', '#C2185B', 'cool'],
  [619, 'Medium Magenta', '미디엄 마젠타', '#AD1457', 'cool'],
  [621, 'Burnt Sienna', '번트 시에나', '#E97451', 'warm'],
  [624, 'Burnt Umber', '번트 엄버', '#8A3324', 'warm'],
  [626, 'Vandyke Brown', '반다이크 브라운', '#5C4033', 'warm'],
  [628, 'Raw Umber', '로우 엄버', '#826644', 'cool'],
  [630, 'Green Light', '그린 라이트', '#7CB342', 'warm'],
  [631, 'Cyanine Green', '시아닌 그린', '#00897B', 'cool'],
  [632, 'Emerald Green', '에메랄드 그린', '#2E7D32', 'cool'],
  [638, 'Sap Green', '샙 그린', '#507D2A', 'warm'],
  [639, 'Olive Green', '올리브 그린', '#6B7C32', 'warm'],
  [640, 'Aqua Green', '아쿠아 그린', '#26A69A', 'cool'],
  [641, 'Cerulean Blue', '세룰리안 블루', '#0288D1', 'cool'],
  [643, 'Cobalt Blue', '코발트 블루', '#1565C0', 'cool'],
  [644, 'Ultramarine', '울트라마린', '#1B3D96', 'warm'],
  [646, 'Cyanine Blue', '시아닌 블루', '#01579B', 'cool'],
  [649, 'Violet', '바이올렛', '#7B1FA2', 'cool'],
  [650, 'Middle Violet', '미들 바이올렛', '#7E57C2', 'cool'],
  [651, 'Lilac', '라일락', '#CE93D8', 'cool'],
  [654, 'French Grey', '프렌치 그레이', '#9E9E9E', 'cool'],
  [660, 'Black', '블랙', '#212121', 'cool'],
  [670, 'Gold', '골드', '#C9A227', 'warm'],
  [671, 'Silver', '실버', '#B0BEC5', 'cool'],
  [673, 'Pearl White', '펄 화이트', '#F4EEE6', 'warm']
];

function argb(hex) {
  return `FF${String(hex).replace('#', '').toUpperCase()}`;
}

function luminance(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'cursor painting';
  wb.created = new Date();

  const ws = wb.addWorksheet('쉴드 Epic 36', { properties: { tabColor: { argb: 'FF0F766E' } } });
  ws.columns = [
    { header: 'No', key: 'no', width: 10 },
    { header: 'Color', key: 'color', width: 14 },
    { header: 'Name', key: 'name', width: 42 },
    { header: 'Hex', key: 'hex', width: 12 },
    { header: 'Tone', key: 'tone', width: 10 }
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;

  ROWS.forEach(([no, name, koName, hex, tone], i) => {
    const row = ws.addRow({
      no,
      color: '',
      name: `${koName} ${name}`,
      hex: hex.toUpperCase(),
      tone
    });
    row.alignment = { vertical: 'middle' };
    row.height = 20;

    const lum = luminance(hex);
    const textArgb = lum < 148 ? 'FFFFFFFF' : 'FF111111';
    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } };

    const colorCell = row.getCell(2);
    colorCell.fill = fill;
    colorCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    const hexCell = row.getCell(4);
    hexCell.fill = fill;
    hexCell.font = { name: 'Consolas', color: { argb: textArgb } };
    hexCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const toneCell = row.getCell(5);
    toneCell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (tone === 'cool') {
      toneCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      toneCell.font = { bold: true, color: { argb: 'FF075985' } };
    } else {
      toneCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      toneCell.font = { bold: true, color: { argb: 'FF92400E' } };
    }

    if (i % 2 === 1) {
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  ws.getColumn(1).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ROWS.length + 1, column: 5 } };

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '쉴드-EPIC-36-cool-warm.xlsx');
  await wb.xlsx.writeFile(out);
  console.log(`wrote ${out} (${ROWS.length} colors)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
