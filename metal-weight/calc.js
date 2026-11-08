/**
 * metal-weight/calc.js — weight of steel and other metals in plate, bar, tube and structural shapes: cross-section,
 * weight per metre and per foot, weight per piece and in total.
 *
 * m = ρ × A × L × n, with A from the shape's dimensions (sharp corners, no root fillets).
 * Schema units: SI — m, m², kg/m³, kg, kg/m.
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger } from '../shared/validate.js';

export const MATERIALS = {
  steel: ['Carbon steel', 7850],
  ss304: ['Stainless steel 304 / 1.4301', 7900],
  ss316: ['Stainless steel 316 / 1.4401', 8000],
  aluminium: ['Aluminium (6061, 6082)', 2700],
  copper: ['Copper', 8940],
  brass: ['Brass', 8500],
  bronze: ['Bronze', 8800],
  cast_iron: ['Cast iron (grey)', 7200],
  titanium: ['Titanium Ti-6Al-4V', 4430],
  lead: ['Lead', 11340],
  custom: ['Other (enter density)', null],
};

export const SHAPES = {
  plate: 'Plate or sheet', round: 'Round bar', square: 'Square bar', hex: 'Hex bar (across flats)', flat: 'Flat bar',
  pipe: 'Round tube or pipe', rhs: 'Square or rectangular tube', angle: 'Angle', ibeam: 'I-beam / H-beam', channel: 'Channel',
};

const d = (id, label, def, shapes, display = 'mm') => ({ id, label, group: 'length', unit: 'm', display, default: def, min: 1e-6, max: 100, visibleWhen: { shape: shapes } });

export const schema = {
  id: 'metal-weight',
  name: 'Steel and metal weight calculator',
  category: 'structural',
  summary: 'Weight of steel, stainless, aluminium, copper and brass plate, bar, tube, pipe, angle, beam and channel, per metre or foot, per piece and in total.',
  related: ['rebar-weight', 'moment-of-inertia', 'concrete-volume', 'lifting-sling'],
  assumptions: [
    'Weights are theoretical: density × volume with sharp corners. Rolled and formed sections have root fillets or corner radii, and mill tolerances allow ± a few percent, so a weighed piece can differ by up to about 5 %.',
    'Densities: carbon steel 7 850 kg/m³ (EN 1993-1-1), stainless 304 7 900 and 316 8 000 kg/m³ (EN 10088-1), aluminium 2 700, copper 8 940, brass 8 500, bronze 8 800, grey cast iron 7 200, Ti-6Al-4V 4 430, lead 11 340 kg/m³; alloys vary by a percent or two.',
    'Pipe and tube use the outside diameter and wall; for standard pipe sizes enter the actual outside diameter (2 in NPS is 60.3 mm), not the nominal size.',
  ],
  notes: [
    'Verification 2026-11-07: a 20 mm steel round bar weighs 2.466 kg/m, so 14.80 kg for 6 m; 48.3 × 3.2 mm tube 3.56 kg/m, as in EN 10219 tables (3.56 kg/m). Checked by hand.',
  ],
  sources: [
    'EN 1993-1-1:2005 §3.2.6 (steel density 7 850 kg/m³); EN 10088-1:2014 Annex (densities of stainless steels)',
    'EN 10219-2:2006 (cold-formed hollow sections: dimensions and masses)',
    'ASM Handbook Vol. 2 (densities of aluminium, copper and their alloys)',
  ],
  inputs: [
    { id: 'shape', label: 'Shape', type: 'select', default: 'round', options: Object.entries(SHAPES).map(([value, label]) => ({ value, label })) },
    { id: 'material', label: 'Material', type: 'select', default: 'steel', options: Object.entries(MATERIALS).map(([value, [label]]) => ({ value, label })) },
    { id: 'density_kg_m3', label: 'Density', group: 'density', unit: 'kg_m3', default: 7850, min: 100, max: 25000, visibleWhen: { material: 'custom' } },
    d('width_m', 'Width (plate, flat, tube, flange, leg a)', 0.1, ['plate', 'flat', 'rhs', 'angle', 'ibeam', 'channel']),
    d('height_m', 'Height (tube, beam depth, leg b)', 0.2, ['rhs', 'angle', 'ibeam', 'channel']),
    d('thickness_m', 'Thickness (plate, flat, wall, angle)', 0.01, ['plate', 'flat', 'pipe', 'rhs', 'angle']),
    d('diameter_m', 'Diameter (round bar, tube outside diameter)', 0.02, ['round', 'pipe']),
    d('side_m', 'Side or across flats', 0.02, ['square', 'hex']),
    d('flange_m', 'Flange thickness', 0.0085, ['ibeam', 'channel']),
    d('web_m', 'Web thickness', 0.0056, ['ibeam', 'channel']),
    { id: 'length_m', label: 'Length of each piece', group: 'length', unit: 'm', default: 6, min: 1e-4, max: 100000 },
    { id: 'count', label: 'Number of pieces', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1e6, integer: true },
  ],
  outputs: [
    { id: 'area_m2', label: 'Cross-section area', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'per_m_kg_m', label: 'Weight per metre', group: 'linear_density', unit: 'kg_m' },
    { id: 'per_ft_kg_m', label: 'Weight per foot', group: 'linear_density', unit: 'kg_m', display: 'lb_ft' },
    { id: 'piece_kg', label: 'Weight of one piece', group: 'mass', unit: 'kg' },
    { id: 'total_kg', label: 'Total weight', group: 'mass', unit: 'kg' },
  ],
  example: {
    inputs: { shape: 'round', material: 'steel', diameter_m: [20, 'mm'], length_m: [6, 'm'], count: 1 },
    results: { area_m2: '314.2 mm²', per_m_kg_m: '2.466 kg/m', piece_kg: '14.80 kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, Object.keys(SHAPES), 'shape', 'Shape');
  assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
  const rho = x.material === 'custom' ? assertPositive(x.density_kg_m3, 'density_kg_m3', 'Density') : MATERIALS[x.material][1];
  const p = (id, label) => assertPositive(x[id], id, label);
  let A;
  switch (x.shape) {
    case 'plate': case 'flat': A = p('width_m', 'Width') * p('thickness_m', 'Thickness'); break;
    case 'round': A = (Math.PI / 4) * p('diameter_m', 'Diameter') ** 2; break;
    case 'square': A = p('side_m', 'Side') ** 2; break;
    case 'hex': A = (Math.sqrt(3) / 2) * p('side_m', 'Across flats') ** 2; break;
    case 'pipe': {
      const D = p('diameter_m', 'Diameter'); const t = p('thickness_m', 'Thickness');
      if (2 * t >= D) throw new Error('Thickness: the wall must be less than half the outside diameter.');
      A = Math.PI * t * (D - t); break;
    }
    case 'rhs': {
      const b = p('width_m', 'Width'); const h = p('height_m', 'Height'); const t = p('thickness_m', 'Thickness');
      if (2 * t >= Math.min(b, h)) throw new Error('Thickness: twice the wall must be less than the width and the height.');
      A = b * h - (b - 2 * t) * (h - 2 * t); break;
    }
    case 'angle': {
      const a = p('width_m', 'Leg a'); const b = p('height_m', 'Leg b'); const t = p('thickness_m', 'Thickness');
      if (t >= Math.min(a, b)) throw new Error('Thickness: it must be less than both legs.');
      A = t * (a + b - t); break;
    }
    default: {
      const b = p('width_m', 'Flange width'); const h = p('height_m', 'Depth'); const tf = p('flange_m', 'Flange thickness'); const tw = p('web_m', 'Web thickness');
      if (2 * tf >= h || tw >= b) throw new Error('Flange thickness: the flanges and web do not fit inside the overall size.');
      A = 2 * b * tf + (h - 2 * tf) * tw;
    }
  }
  const L = p('length_m', 'Length of each piece');
  const n = assertInteger(x.count, 'count', 'Number of pieces');
  if (n < 1) throw new Error('Number of pieces: enter 1 or more.');
  const perM = rho * A;
  return {
    outputs: { area_m2: A, per_m_kg_m: perM, per_ft_kg_m: perM, piece_kg: perM * L, total_kg: perM * L * n },
    warnings: [],
  };
}
