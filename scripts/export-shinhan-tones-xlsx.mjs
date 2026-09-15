import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Shinhan SWC 32 — same order and tone as SHINHAN_SWC_32 */
const ROWS = [
  [803, 'Crimson Lake', '크림슨 레이크', '#B71C1C', 'cool'],
  [811, 'Rose Madder', '로즈 매더', '#E32636', 'cool'],
  [821, 'Opera', '오페라', '#FF2E88', 'cool'],
  [833, 'Vermilion Hue', '버밀리온 휴', '#E34234', 'warm'],
  [807, 'Permanent Rose', '퍼머넌트 로즈', '#E91E63', 'cool'],
  [814, 'Permanent Red', '퍼머넌트 레드', '#D32F2F', 'warm'],
  [861, 'Lemon Yellow', '레몬 옐로우', '#F6E04B', 'cool'],
  [970, 'Yellow Ochre', '옐로우 오커', '#C9A227', 'warm'],
  [858, 'Permanent Yellow Light', '퍼머넌트 옐로우 라이트', '#F3D23A', 'warm'],
  [856, 'Permanent Yellow Deep', '퍼머넌트 옐로우 딥', '#E8A825', 'warm'],
  [840, 'Permanent Yellow Orange', '퍼머넌트 옐로우 오렌지', '#F0A020', 'warm'],
  [843, 'Cadmium Yellow Orange', '카드뮴 옐로우 오렌지', '#ED872D', 'warm'],
  [868, 'Greenish Yellow', '그리니시 옐로우', '#C0CA33', 'cool'],
  [888, 'Viridian Hue', '비리디언 휴', '#00897B', 'cool'],
  [883, "Hooker's Green", '후커스 그린', '#2E7D32', 'cool'],
  [874, 'Permanent Green No.1', '퍼머넌트 그린 No.1', '#43A047', 'warm'],
  [870, 'Olive Green', '올리브 그린', '#827717', 'warm'],
  [879, 'Sap Green', '샙 그린', '#507D2A', 'warm'],
  [923, 'Cobalt Blue Hue', '코발트 블루 휴', '#1565C0', 'cool'],
  [920, 'Cerulean Blue Hue', '세룰리안 블루 휴', '#0288D1', 'cool'],
  [926, 'Ultramarine Deep', '울트라마린 딥', '#1A237E', 'warm'],
  [928, 'Prussian Blue', '프러시안 블루', '#003153', 'cool'],
  [933, 'Indigo', '인디고', '#283593', 'cool'],
  [911, 'Peacock Blue', '피콕 블루', '#00838F', 'cool'],
  [938, 'Permanent Violet', '퍼머넌트 바이올렛', '#6A1B9A', 'cool'],
  [959, 'Light Red', '라이트 레드', '#C62828', 'warm'],
  [966, 'Raw Umber', '로우 엄버', '#6D4C41', 'cool'],
  [964, 'Burnt Umber', '번트 엄버', '#5D4037', 'warm'],
  [963, 'Burnt Sienna', '번트 시에나', '#E97451', 'warm'],
  [977, 'Sepia', '세피아', '#4A3728', 'warm'],
  [975, 'Vandyke', '반다이크', '#4E342E', 'warm'],
  [957, 'Brown Red', '브라운 레드', '#8B3A2A', 'warm']
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

  const ws = wb.addWorksheet('신한 SWC 32', { properties: { tabColor: { argb: 'FF059669' } } });
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

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '신한-SWC-32-cool-warm.xlsx');
  await wb.xlsx.writeFile(out);
  console.log(`wrote ${out} (${ROWS.length} colors)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
