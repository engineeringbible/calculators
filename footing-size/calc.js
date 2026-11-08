/**
 * footing-size/calc.js — plan size of a spread footing from the service column load and the allowable soil bearing
 * pressure, net of the footing's own weight and the soil above it, rounded to a practical size.
 *
 * q_net = q_all − γ_c t − γ_s h_s;  A = P / q_net;  square side √A, round D = √(4A/π), rectangle B = √(A/r), L = r B,
 * strip B = P'/q_net (per length).  Actual pressure = P / A_rounded + γ_c t + γ_s h_s.
 * Schema units: SI — N, Pa, m, kN/m³ (as numbers).
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'footing-size',
  name: 'Footing size calculator',
  category: 'civil',
  summary: 'Plan size of a square, rectangular, round or strip footing from the column or wall load and the allowable soil bearing pressure, with the actual pressure.',
  related: ['soil-bearing', 'concrete-footing', 'concrete-column', 'rebar-weight'],
  assumptions: [
    'The footing area comes from unfactored (service) loads and the allowable bearing pressure, as ACI 318-19 §13.3.1.1 requires; factored loads are used later for the footing\'s thickness and reinforcement.',
    'The load acts at the centre of the footing; moments or eccentricity raise the pressure at one edge and need the full pressure distribution.',
    'The footing\'s own weight and the soil above it are subtracted from the allowable pressure (net allowable). Concrete 24 kN/m³ (150 pcf) and soil 18 kN/m³ (115 pcf) by default.',
    'The allowable bearing pressure comes from the geotechnical report or the building code\'s presumptive values (for example IBC Table 1806.2); the soil bearing capacity calculator estimates it from soil strength.',
  ],
  notes: [
    'Verification 2026-11-07: 800 kN on soil allowing 200 kPa, with a 0.5 m footing under 0.5 m of soil: net 179 kPa, 4.47 m², 2.114 m square, rounded to 2.15 m, actual 194.1 kPa. Checked by hand.',
  ],
  sources: [
    'ACI 318-19, Building Code Requirements for Structural Concrete, §13.3.1.1 (base area from unfactored loads and permissible soil pressure)',
    'International Building Code 2021, Table 1806.2 (presumptive load-bearing values)',
    'EN 1997-1:2004 §6 (spread foundations)',
  ],
  inputs: [
    { id: 'shape', label: 'Footing shape', type: 'select', default: 'square', options: [{ value: 'square', label: 'Square' }, { value: 'rect', label: 'Rectangular (length to width ratio)' }, { value: 'round', label: 'Round' }, { value: 'strip', label: 'Strip under a wall (load per length)' }] },
    { id: 'load_n', label: 'Service load (dead + live, unfactored)', group: 'force', unit: 'N', display: 'kN', default: 800000, min: 1, max: 1e9, visibleWhen: { shape: ['square', 'rect', 'round'] } },
    { id: 'line_load_n_m', label: 'Service load per length of wall (kN/m)', group: 'dimensionless', unit: 'none', default: 150, min: 0.1, max: 1e5, visibleWhen: { shape: 'strip' } },
    { id: 'ratio', label: 'Length / width', group: 'dimensionless', unit: 'none', default: 1.5, min: 1, max: 10, visibleWhen: { shape: 'rect' } },
    { id: 'q_all_pa', label: 'Allowable bearing pressure', group: 'pressure', unit: 'Pa', display: 'kPa', default: 200000, min: 1000, max: 1e8 },
    { id: 'thickness_m', label: 'Footing thickness', group: 'length', unit: 'm', default: 0.5, min: 0, max: 10 },
    { id: 'soil_m', label: 'Soil above the footing', group: 'length', unit: 'm', default: 0.5, min: 0, max: 20 },
    { id: 'gamma_c', label: 'Unit weight of concrete (kN/m³)', group: 'dimensionless', unit: 'none', default: 24, min: 10, max: 30 },
    { id: 'gamma_s', label: 'Unit weight of soil (kN/m³)', group: 'dimensionless', unit: 'none', default: 18, min: 10, max: 25 },
    { id: 'step_m', label: 'Round the size up to multiples of', group: 'length', unit: 'm', display: 'mm', default: 0.05, min: 0.001, max: 1 },
  ],
  outputs: [
    { id: 'q_net_pa', label: 'Net allowable pressure for the load', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'area_m2', label: 'Required area (per metre for a strip: required width)', group: 'area', unit: 'm2' },
    { id: 'width_m', label: 'Required width (side, or diameter)', group: 'length', unit: 'm' },
    { id: 'width_round_m', label: 'Width rounded up', group: 'length', unit: 'm' },
    { id: 'length_round_m', label: 'Length rounded up (rectangle)', group: 'length', unit: 'm' },
    { id: 'pressure_pa', label: 'Actual bearing pressure with the rounded size', group: 'pressure', unit: 'Pa', display: 'kPa' },
  ],
  example: {
    inputs: { shape: 'square', load_n: [800, 'kN'], q_all_pa: [200, 'kPa'], thickness_m: [0.5, 'm'], soil_m: [0.5, 'm'], gamma_c: 24, gamma_s: 18, step_m: [50, 'mm'] },
    results: { q_net_pa: '179 kPa', area_m2: '4.469 m²', width_m: '2.114 m', width_round_m: '2.15 m', pressure_pa: '194.1 kPa' },
  },
};

const roundUp = (v, step) => Math.ceil(v / step - 1e-9) * step;

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, ['square', 'rect', 'round', 'strip'], 'shape', 'Footing shape');
  const qa = assertPositive(x.q_all_pa, 'q_all_pa', 'Allowable bearing pressure');
  const t = assertNonNegative(x.thickness_m, 'thickness_m', 'Footing thickness');
  const hs = assertNonNegative(x.soil_m, 'soil_m', 'Soil above the footing');
  const gc = assertRange(x.gamma_c, 10, 30, 'gamma_c', 'Unit weight of concrete') * 1000;
  const gs = assertRange(x.gamma_s, 10, 25, 'gamma_s', 'Unit weight of soil') * 1000;
  const step = assertPositive(x.step_m, 'step_m', 'Rounding step');
  const over = gc * t + gs * hs;
  const qnet = qa - over;
  if (qnet <= 0) throw new Error('Allowable bearing pressure: the footing and soil above it already use all of it; reduce the depth or check the value.');
  let area; let B; let Br; let Lr = null; let Ar;
  if (x.shape === 'strip') {
    const w = assertPositive(x.line_load_n_m, 'line_load_n_m', 'Service load per length') * 1000;
    area = w / qnet; B = area; Br = roundUp(B, step); Ar = Br;
    return finish(qnet, area, B, Br, null, (w / Ar) + over);
  }
  const P = assertPositive(x.load_n, 'load_n', 'Service load');
  area = P / qnet;
  if (x.shape === 'square') { B = Math.sqrt(area); Br = roundUp(B, step); Ar = Br * Br; }
  else if (x.shape === 'round') { B = Math.sqrt((4 * area) / Math.PI); Br = roundUp(B, step); Ar = (Math.PI / 4) * Br * Br; }
  else {
    const r = assertRange(x.ratio, 1, 10, 'ratio', 'Length / width');
    B = Math.sqrt(area / r); Br = roundUp(B, step); Lr = roundUp(r * B, step); Ar = Br * Lr;
  }
  return finish(qnet, area, B, Br, Lr, P / Ar + over);

  function finish(qn, a, b, br, lr, p) {
    const warnings = [];
    if (t > 0 && t < 0.15) warnings.push('Footings thinner than about 150 mm (6 in) are below common code minimums (ACI 318 §13.3.1.2).');
    return { outputs: { q_net_pa: qn, area_m2: a, width_m: b, width_round_m: br, length_round_m: lr, pressure_pa: p }, warnings };
  }
}
