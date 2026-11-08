/**
 * moment-of-inertia/calc.js — area moment of inertia (second moment of area) and section properties of common
 * shapes: area, centroid, I about both centroidal axes, elastic and plastic section moduli, radii of gyration and
 * the polar moment.
 *
 * Flanged and hollow shapes are built from rectangles: I = Σ (b h³/12 + A d²) (parallel-axis theorem); the plastic
 * neutral axis halves the area and Z = Σ A_i |y_i − y_p|. Round shapes use the closed forms.
 * Schema units: SI — m, m², m⁴, m³.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

export const SHAPES = {
  rect: 'Rectangle (solid)',
  box: 'Hollow rectangle (box, RHS / SHS)',
  circle: 'Circle (solid round bar)',
  tube: 'Hollow circle (tube, CHS, pipe)',
  ibeam: 'I-beam or H-section (symmetric)',
  tee: 'T-section',
  channel: 'Channel (C / U section)',
  triangle: 'Triangle (isosceles, base down)',
};

/** Rectangles [x0, x1, y0, y1] that make up each shape, origin at the bottom left. */
function rectangles(shape, b, h, t, tf, tw) {
  switch (shape) {
    case 'rect': return [[0, b, 0, h]];
    case 'box': return [[0, b, 0, t], [0, b, h - t, h], [0, t, t, h - t], [b - t, b, t, h - t]];
    case 'ibeam': return [[0, b, 0, tf], [0, b, h - tf, h], [(b - tw) / 2, (b + tw) / 2, tf, h - tf]];
    case 'tee': return [[0, b, h - tf, h], [(b - tw) / 2, (b + tw) / 2, 0, h - tf]];
    case 'channel': return [[0, tw, 0, h], [tw, b, 0, tf], [tw, b, h - tf, h]];
    default: return null;
  }
}

/** Plastic modulus about an axis: split each strip [a0, a1] with weight w (the other dimension) at the axis p. */
function plastic(strips, total) {
  const below = (p) => strips.reduce((s, [a0, a1, w]) => s + w * Math.max(0, Math.min(a1, p) - a0), 0);
  let lo = Math.min(...strips.map((s) => s[0]));
  let hi = Math.max(...strips.map((s) => s[1]));
  for (let k = 0; k < 200; k += 1) { const mid = (lo + hi) / 2; if (below(mid) < total / 2) lo = mid; else hi = mid; }
  const p = (lo + hi) / 2;
  // ∫ |a − p| w da over each strip, split at p
  return strips.reduce((s, [a0, a1, w]) => {
    const below = a0 < p ? ((p - a0) ** 2 - (p - Math.min(a1, p)) ** 2) / 2 : 0;
    const above = a1 > p ? ((a1 - p) ** 2 - (Math.max(a0, p) - p) ** 2) / 2 : 0;
    return s + w * (below + above);
  }, 0);
}

/** Properties of a set of rectangles. */
export function composite(rects) {
  let A = 0; let sx = 0; let sy = 0;
  for (const [x0, x1, y0, y1] of rects) { const a = (x1 - x0) * (y1 - y0); A += a; sx += a * (x0 + x1) / 2; sy += a * (y0 + y1) / 2; }
  const xb = sx / A; const yb = sy / A;
  let Ix = 0; let Iy = 0;
  for (const [x0, x1, y0, y1] of rects) {
    const w = x1 - x0; const d = y1 - y0; const a = w * d;
    Ix += (w * d ** 3) / 12 + a * ((y0 + y1) / 2 - yb) ** 2;
    Iy += (d * w ** 3) / 12 + a * ((x0 + x1) / 2 - xb) ** 2;
  }
  const ymin = Math.min(...rects.map((r) => r[2])); const ymax = Math.max(...rects.map((r) => r[3]));
  const xmin = Math.min(...rects.map((r) => r[0])); const xmax = Math.max(...rects.map((r) => r[1]));
  return {
    A, xb, yb, Ix, Iy,
    Sx: Ix / Math.max(yb - ymin, ymax - yb), Sy: Iy / Math.max(xb - xmin, xmax - xb),
    Zx: plastic(rects.map(([x0, x1, y0, y1]) => [y0, y1, x1 - x0]), A),
    Zy: plastic(rects.map(([x0, x1, y0, y1]) => [x0, x1, y1 - y0]), A),
  };
}

const dim = (id, label, def, shapes) => ({ id, label, group: 'length', unit: 'm', display: 'mm', default: def, min: 1e-5, max: 100, visibleWhen: { shape: shapes } });

export const schema = {
  id: 'moment-of-inertia',
  name: 'Moment of inertia calculator (section properties)',
  category: 'structural',
  summary: 'Area moment of inertia, section modulus, plastic modulus, centroid and radius of gyration of rectangles, tubes, I-beams, T and channel sections.',
  related: ['beam-deflection', 'column-buckling', 'stiffener-section', 'mass-moment-of-inertia'],
  assumptions: [
    'Sections are made of straight-sided rectangles with sharp corners; rolled steel sections also have root fillets and tapered flanges, so catalogue values of I are typically 2 to 6 % higher than this idealised shape.',
    'Ix is about the horizontal axis through the centroid, Iy about the vertical one; for the T, channel and triangle the centroid is not at mid-height or mid-width and is reported.',
    'Elastic section modulus S = I / c uses the extreme fibre farthest from the centroid; the plastic modulus Z uses the axis that splits the area in half.',
    'The polar moment for round sections is the torsion constant J; for other shapes Ix + Iy is given, which is not the torsion constant of an open section.',
  ],
  notes: [
    'Verification 2026-11-07: a 100 × 200 mm rectangle gives A = 20 000 mm², Ix = 6 667 cm⁴, Sx = 667 cm³, Zx = 1 000 cm³ and rx = 57.7 mm (closed forms); the composite routine reproduces the I-beam and tube closed forms.',
  ],
  sources: [
    'Young, W.C. and Budynas, R.G., Roark\'s Formulas for Stress and Strain, 8th ed., Table A.1 (properties of sections)',
    'Gere, J.M. and Goodno, B.J., Mechanics of Materials, Appendix E (moments of inertia of plane areas; parallel-axis theorem)',
    'EN 1993-1-1:2005 §6.2.5 and AISC 360-22 Chapter F (use of elastic and plastic section moduli)',
  ],
  inputs: [
    { id: 'shape', label: 'Shape', type: 'select', default: 'rect', options: Object.entries(SHAPES).map(([value, label]) => ({ value, label })) },
    dim('width_m', 'Width b (flange width)', 0.1, ['rect', 'box', 'ibeam', 'tee', 'channel', 'triangle']),
    dim('height_m', 'Height h (overall depth)', 0.2, ['rect', 'box', 'ibeam', 'tee', 'channel', 'triangle']),
    dim('wall_m', 'Wall thickness t', 0.01, ['box', 'tube']),
    dim('flange_m', 'Flange thickness t_f', 0.0085, ['ibeam', 'tee', 'channel']),
    dim('web_m', 'Web thickness t_w', 0.0056, ['ibeam', 'tee', 'channel']),
    dim('diameter_m', 'Outside diameter D', 0.1, ['circle', 'tube']),
  ],
  outputs: [
    { id: 'area_m2', label: 'Area A', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'ybar_m', label: 'Centroid height from the bottom', group: 'length', unit: 'm', display: 'mm' },
    { id: 'ix_m4', label: 'Moment of inertia Ix (horizontal axis)', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
    { id: 'iy_m4', label: 'Moment of inertia Iy (vertical axis)', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
    { id: 'sx_m3', label: 'Elastic section modulus Sx = Ix / c', group: 'section_modulus', unit: 'm3', display: 'cm3' },
    { id: 'sy_m3', label: 'Elastic section modulus Sy', group: 'section_modulus', unit: 'm3', display: 'cm3' },
    { id: 'zx_m3', label: 'Plastic section modulus Zx', group: 'section_modulus', unit: 'm3', display: 'cm3' },
    { id: 'zy_m3', label: 'Plastic section modulus Zy', group: 'section_modulus', unit: 'm3', display: 'cm3' },
    { id: 'rx_m', label: 'Radius of gyration rx', group: 'length', unit: 'm', display: 'mm' },
    { id: 'ry_m', label: 'Radius of gyration ry', group: 'length', unit: 'm', display: 'mm' },
    { id: 'j_m4', label: 'Polar moment (J for round sections, Ix + Iy otherwise)', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
  ],
  example: {
    inputs: { shape: 'rect', width_m: [100, 'mm'], height_m: [200, 'mm'] },
    results: { area_m2: '20 000 mm²', ix_m4: '6 667 cm⁴', sx_m3: '666.7 cm³', zx_m3: '1 000 cm³', rx_m: '57.7 mm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, Object.keys(SHAPES), 'shape', 'Shape');
  const warnings = [];
  let p;
  if (x.shape === 'circle' || x.shape === 'tube') {
    const D = assertPositive(x.diameter_m, 'diameter_m', 'Outside diameter');
    const d = x.shape === 'tube' ? D - 2 * assertPositive(x.wall_m, 'wall_m', 'Wall thickness') : 0;
    if (d < 0) throw new Error('Wall thickness: it must be less than half the outside diameter.');
    const I = (Math.PI * (D ** 4 - d ** 4)) / 64;
    const A = (Math.PI * (D * D - d * d)) / 4;
    const Z = (D ** 3 - d ** 3) / 6;
    p = { A, yb: D / 2, Ix: I, Iy: I, Sx: (2 * I) / D, Sy: (2 * I) / D, Zx: Z, Zy: Z, J: 2 * I };
  } else {
    const b = assertPositive(x.width_m, 'width_m', 'Width');
    const h = assertPositive(x.height_m, 'height_m', 'Height');
    if (x.shape === 'triangle') {
      p = { A: (b * h) / 2, yb: h / 3, Ix: (b * h ** 3) / 36, Iy: (h * b ** 3) / 48, Sx: (b * h ** 3) / 36 / ((2 * h) / 3), Sy: (h * b ** 3) / 48 / (b / 2), Zx: null, Zy: null };
    } else {
      let t = 0; let tf = 0; let tw = 0;
      if (x.shape === 'box') {
        t = assertPositive(x.wall_m, 'wall_m', 'Wall thickness');
        if (2 * t >= Math.min(b, h)) throw new Error('Wall thickness: twice the wall must be less than the width and the height.');
      }
      if (['ibeam', 'tee', 'channel'].includes(x.shape)) {
        tf = assertPositive(x.flange_m, 'flange_m', 'Flange thickness');
        tw = assertPositive(x.web_m, 'web_m', 'Web thickness');
        if (tw >= b) throw new Error('Web thickness: it must be less than the width.');
        if ((x.shape === 'ibeam' ? 2 : 1) * tf >= h) throw new Error('Flange thickness: the flanges are thicker than the section is deep.');
      }
      p = composite(rectangles(x.shape, b, h, t, tf, tw));
      if (['ibeam', 'tee', 'channel', 'box'].includes(x.shape) && Math.min(t || Infinity, tf || Infinity, tw || Infinity) < Math.min(b, h) / 100) warnings.push('Very thin walls: local buckling will govern long before the section reaches its plastic moment.');
    }
    p.J = p.Ix + p.Iy;
  }
  return {
    outputs: {
      area_m2: p.A, ybar_m: p.yb, ix_m4: p.Ix, iy_m4: p.Iy, sx_m3: p.Sx, sy_m3: p.Sy, zx_m3: p.Zx, zy_m3: p.Zy,
      rx_m: Math.sqrt(p.Ix / p.A), ry_m: Math.sqrt(p.Iy / p.A), j_m4: p.J,
    },
    warnings,
  };
}
