// Simple subtractive-style mixing model using a CMY-ish space.
// We approximate pigments as CMY triplets and solve a small
// constrained least-squares problem for (R, Y, B, W, K).

const BASE_PIGMENTS = {
  red: { name: '레드', key: 'red', cmy: [0.1, 0.85, 0.8], hex: '#D7263D' },
  yellow: { name: '옐로우', key: 'yellow', cmy: [0.05, 0.1, 0.85], hex: '#F6C035' },
  blue: { name: '블루', key: 'blue', cmy: [0.9, 0.7, 0.1], hex: '#225CAD' },
  white: { name: '화이트', key: 'white', cmy: [0.03, 0.03, 0.03], hex: '#FDFDFD' },
  black: { name: '블랙', key: 'black', cmy: [0.9, 0.9, 0.9], hex: '#111111' }
};

export const PIGMENT_LIST = [
  BASE_PIGMENTS.red,
  BASE_PIGMENTS.yellow,
  BASE_PIGMENTS.blue,
  BASE_PIGMENTS.white,
  BASE_PIGMENTS.black
];

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r / 255, g / 255, b / 255];
}

export function rgbToHex([r, g, b]) {
  const toHex = (v) => {
    const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
    return n.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToCmy(rgb) {
  return rgb.map((v) => 1 - v);
}

function cmyToRgb(cmy) {
  return cmy.map((v) => 1 - v);
}

// Solve non‑negative least squares for weights of 5 pigments.
// We keep it simple with a projected gradient descent.
export function calculateMixForHex(hex) {
  const rgbTarget = hexToRgb(hex);
  const target = rgbToCmy(rgbTarget); // go to subtractive-ish space

  const pigments = PIGMENT_LIST.map((p) => p.cmy);
  const m = pigments.length;

  let w = new Array(m).fill(1 / m);
  const lr = 0.25;

  const steps = 180;
  for (let s = 0; s < steps; s++) {
    const mix = [0, 0, 0];
    for (let i = 0; i < m; i++) {
      mix[0] += w[i] * pigments[i][0];
      mix[1] += w[i] * pigments[i][1];
      mix[2] += w[i] * pigments[i][2];
    }
    const grad = new Array(m).fill(0);
    const diff = [mix[0] - target[0], mix[1] - target[1], mix[2] - target[2]];
    for (let i = 0; i < m; i++) {
      grad[i] =
        2 *
        (diff[0] * pigments[i][0] +
          diff[1] * pigments[i][1] +
          diff[2] * pigments[i][2]);
    }
    // gradient step
    for (let i = 0; i < m; i++) {
      w[i] -= lr * grad[i];
      if (w[i] < 0) w[i] = 0;
    }
    // normalize to sum=1
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < m; i++) w[i] /= sum;
  }

  const finalMixCmy = [0, 0, 0];
  for (let i = 0; i < m; i++) {
    finalMixCmy[0] += w[i] * pigments[i][0];
    finalMixCmy[1] += w[i] * pigments[i][1];
    finalMixCmy[2] += w[i] * pigments[i][2];
  }
  const finalRgb = cmyToRgb(finalMixCmy);

  const resultHex = rgbToHex(finalRgb);

  const parts = PIGMENT_LIST.map((p, idx) => ({
    ...p,
    ratio: w[idx]
  })).filter((p) => p.ratio > 0.01);

  return {
    targetHex: hex,
    approximateHex: resultHex,
    parts
  };
}

// Mix color directly from an object of pigment ratios (by key).
// ratioByKey: { red: number, yellow: number, ... }
export function mixFromPigmentRatios(ratioByKey) {
  const entries = Object.entries(ratioByKey || {}).filter(([, r]) => r > 0);
  if (!entries.length) {
    return {
      hex: '#ffffff',
      parts: []
    };
  }

  const total = entries.reduce((sum, [, r]) => sum + r, 0) || 1;
  const weights = entries.map(([key, r]) => [key, r / total]);

  const mixCmy = [0, 0, 0];
  const parts = [];

  for (const [key, w] of weights) {
    const pigment = BASE_PIGMENTS[key];
    if (!pigment) continue;
    mixCmy[0] += w * pigment.cmy[0];
    mixCmy[1] += w * pigment.cmy[1];
    mixCmy[2] += w * pigment.cmy[2];
    parts.push({
      ...pigment,
      ratio: w
    });
  }

  const rgb = cmyToRgb(mixCmy);
  const hex = rgbToHex(rgb);

  return {
    hex,
    parts
  };
}

// Mix from an arbitrary list of colors (e.g. library colors) using CMY-based NNLS.
// Returns { approximateHex, parts: [{ name, hex, ratio }] }.
export function calculateMixFromLibrary(targetHex, colorList, minRatio = 0.01) {
  if (!colorList?.length) return { approximateHex: targetHex, parts: [] };

  const rgbTarget = hexToRgb(targetHex);
  const target = rgbToCmy(rgbTarget);

  const colors = colorList.map((c) => ({
    ...c,
    cmy: rgbToCmy(hexToRgb(c.hex))
  }));

  const n = colors.length;
  let w = new Array(n).fill(1 / n);
  const lr = 0.2;
  const steps = 200;

  for (let s = 0; s < steps; s++) {
    const mix = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      mix[0] += w[i] * colors[i].cmy[0];
      mix[1] += w[i] * colors[i].cmy[1];
      mix[2] += w[i] * colors[i].cmy[2];
    }
    const diff = [mix[0] - target[0], mix[1] - target[1], mix[2] - target[2]];
    for (let i = 0; i < n; i++) {
      const grad =
        2 * (diff[0] * colors[i].cmy[0] + diff[1] * colors[i].cmy[1] + diff[2] * colors[i].cmy[2]);
      w[i] -= lr * grad;
      if (w[i] < 0) w[i] = 0;
    }
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < n; i++) w[i] /= sum;
  }

  const finalMixCmy = [0, 0, 0];
  const parts = [];
  for (let i = 0; i < n; i++) {
    if (w[i] < minRatio) continue;
    finalMixCmy[0] += w[i] * colors[i].cmy[0];
    finalMixCmy[1] += w[i] * colors[i].cmy[1];
    finalMixCmy[2] += w[i] * colors[i].cmy[2];
    parts.push({
      name: colors[i].name,
      hex: colors[i].hex,
      key: `lib-${i}`,
      ratio: w[i]
    });
  }

  const finalRgb = cmyToRgb(finalMixCmy);
  const approximateHex = rgbToHex(finalRgb);

  return { approximateHex, parts };
}

