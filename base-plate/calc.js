/**
 * base-plate/calc.js — steel column base plate under a concentric axial compression, LRFD, by AISC Design Guide 1
 * (2nd ed., section 3.1): required bearing area, plate dimensions N × B, cantilevers m, n and λn', and the required
 * plate thickness.
 *
 * φc Pp = 0.65 × 0.85 f'c A1 √(A2/A1) ≤ 0.65 × 1.7 f'c A1 (AISC 360-16 J8);  Δ = (0.95 d − 0.8 bf)/2, N ≈ √A1 + Δ, B = A1/N;
 * m = (N − 0.95 d)/2, n = (B − 0.8 bf)/2, X = 4 d bf/(d + bf)² × Pu/(φc Pp), λ = 2√X/(1 + √(1 − X)) ≤ 1,
 * λn' = λ √(d bf)/4, l = max(m, n, λn'), t_min = l √(2 Pu / (0.9 Fy B N)).
 * Schema units: N, m, Pa.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';

const PHI_C = 0.65; // AISC 360-16 J8, LRFD bearing on concrete
const PHI_B = 0.90; // plate bending
const IN = 0.0254;
const STEP = { in: IN, mm10: 0.01, none: 0 };

/** Design bearing strength φc Pp (N) of a plate area A1 on a support area A2 (m², Pa). */
export function bearingStrength(fc, a1, a2) {
  return PHI_C * 0.85 * fc * a1 * Math.min(Math.sqrt(Math.max(a2, a1) / a1), 2);
}

/** Largest support area geometrically similar to and concentric with an N × B plate on an N2 × B2 pedestal. */
export function supportArea(N, B, support, N2, B2) {
  if (support === 'equal') return N * B;
  if (support === 'large') return 4 * N * B;
  return N * B * Math.min(N2 / N, B2 / B) ** 2;
}

/** Required thickness and its intermediate values for a plate N × B. */
export function thickness({ pu, d, bf, fy, N, B, phiPp }) {
  const m = (N - 0.95 * d) / 2;
  const n = (B - 0.8 * bf) / 2;
  const X = Math.min(1, ((4 * d * bf) / (d + bf) ** 2) * (pu / phiPp));
  const lambda = Math.min(1, (2 * Math.sqrt(X)) / (1 + Math.sqrt(1 - X)));
  const lnp = (lambda * Math.sqrt(d * bf)) / 4;
  const l = Math.max(m, n, lnp);
  return { m, n, X, lambda, lnp, l, t: l * Math.sqrt((2 * pu) / (PHI_B * fy * B * N)) };
}

export const schema = {
  id: 'base-plate',
  name: 'Column base plate calculator (AISC Design Guide 1)',
  category: 'structural',
  summary: 'Size a steel column base plate for a concentric axial load by AISC Design Guide 1 (LRFD): bearing area, plate N × B, cantilevers and required thickness.',
  related: ['load-combinations', 'column-buckling', 'concrete-column', 'footing-size'],
  assumptions: [
    'The column is a wide-flange (I-shaped) section carrying a concentric axial compression only; moments, uplift, shear and anchor rods need the other cases of Design Guide 1.',
    'LRFD with φc = 0.65 for bearing on concrete (AISC 360-16 J8) and φ = 0.90 for plate bending; the factored load Pu comes from the LRFD load combinations.',
    'The support area A2 is the largest area of the pedestal or footing that is geometrically similar to and concentric with the plate; √(A2/A1) is limited to 2.',
    'The plate is sized with Design Guide 1\'s near-optimum rule N ≈ √A1 + Δ and rounded up to whole inches or 10 mm, then checked again for bearing. Grout, the pedestal reinforcement and the column-to-plate weld are not designed here.',
  ],
  notes: [
    'Verification 2026-11-08: AISC Design Guide 1 (2nd ed.) Example 4.1, a W12×96 (d 12.7 in, bf 12.2 in) with Pu = 700 kips on f\'c = 3 ksi concrete with A2 = A1 and an A36 plate: A1 required 422 in², plate 22 × 20 in, φcPp = 729 kips, n = 5.12 in governs and t = 1.60 in, as in the Guide. Checked by hand.',
  ],
  sources: [
    'Fisher, J.M. and Kloiber, L.A. (2006), AISC Steel Design Guide 1: Base Plate and Anchor Rod Design, 2nd ed., section 3.1 (concentric compressive axial loads) and Example 4.1',
    'ANSI/AISC 360-16 Specification for Structural Steel Buildings, section J8 Column Bases and Bearing on Concrete',
    'ACI 318-19 Building Code Requirements for Structural Concrete, 22.8 Bearing (√(A2/A1) ≤ 2)',
  ],
  inputs: [
    { id: 'pu_n', label: 'Factored axial load Pu (LRFD)', group: 'force', unit: 'N', display: 'kip', default: 700 * 4448.2216152605, min: 1, max: 1e9 },
    { id: 'd_m', label: 'Column depth d', group: 'length', unit: 'm', display: 'in', default: 12.7 * IN, min: 0.05, max: 2 },
    { id: 'bf_m', label: 'Column flange width bf', group: 'length', unit: 'm', display: 'in', default: 12.2 * IN, min: 0.05, max: 2 },
    { id: 'fc_pa', label: 'Concrete strength f\'c', group: 'pressure', unit: 'Pa', display: 'ksi', default: 3 * 6894757.293168, min: 10e6, max: 100e6 },
    { id: 'fy_pa', label: 'Plate yield strength Fy', group: 'pressure', unit: 'Pa', display: 'ksi', default: 36 * 6894757.293168, min: 200e6, max: 700e6 },
    { id: 'support', label: 'Concrete support area A2', type: 'select', default: 'equal', options: [{ value: 'equal', label: 'Same size as the plate (A2 = A1)' }, { value: 'large', label: 'Large footing (A2 ≥ 4 A1)' }, { value: 'pedestal', label: 'Pedestal of given size' }] },
    { id: 'n2_m', label: 'Pedestal length N2 (along the column depth)', group: 'length', unit: 'm', display: 'in', default: 24 * IN, min: 0.1, max: 10, visibleWhen: { support: 'pedestal' } },
    { id: 'b2_m', label: 'Pedestal width B2', group: 'length', unit: 'm', display: 'in', default: 24 * IN, min: 0.1, max: 10, visibleWhen: { support: 'pedestal' } },
    { id: 'sizing', label: 'Plate size', type: 'select', default: 'in', options: [{ value: 'in', label: 'Design Guide 1 sizing, rounded up to whole inches' }, { value: 'mm10', label: 'Design Guide 1 sizing, rounded up to 10 mm' }, { value: 'none', label: 'Design Guide 1 sizing, not rounded' }, { value: 'given', label: 'Enter N and B' }] },
    { id: 'n_m', label: 'Plate length N (along the column depth)', group: 'length', unit: 'm', display: 'in', default: 22 * IN, min: 0.05, max: 10, visibleWhen: { sizing: 'given' } },
    { id: 'b_m', label: 'Plate width B', group: 'length', unit: 'm', display: 'in', default: 20 * IN, min: 0.05, max: 10, visibleWhen: { sizing: 'given' } },
  ],
  outputs: [
    { id: 'a1_req_m2', label: 'Required bearing area A1', group: 'area', unit: 'm2', display: 'in2', decimals: 0 },
    { id: 'n_out_m', label: 'Plate length N', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'b_out_m', label: 'Plate width B', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'phi_pp_n', label: 'Design bearing strength φc Pp', group: 'force', unit: 'N', display: 'kip', decimals: 0 },
    { id: 'ratio', label: 'Bearing utilisation Pu / φc Pp', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'm_m', label: 'Cantilever m = (N − 0.95 d)/2', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'nn_m', label: 'Cantilever n = (B − 0.8 bf)/2', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'lnp_m', label: 'λn\' (Thornton)', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'governs', label: 'Governing cantilever', type: 'text' },
    { id: 't_m', label: 'Required plate thickness t_min', group: 'length', unit: 'm', display: 'in', decimals: 3 },
  ],
  example: {
    inputs: {},
    results: { a1_req_m2: '422 in²', n_out_m: '22.00 in', b_out_m: '20.00 in', phi_pp_n: '729 kip', t_m: '1.60 in' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.support, ['equal', 'large', 'pedestal'], 'support', 'Concrete support area');
  assertOneOf(x.sizing, ['in', 'mm10', 'none', 'given'], 'sizing', 'Plate size');
  const pu = assertPositive(x.pu_n, 'pu_n', 'Factored axial load');
  const d = assertRange(x.d_m, 0.05, 2, 'd_m', 'Column depth');
  const bf = assertRange(x.bf_m, 0.05, 2, 'bf_m', 'Column flange width');
  const fc = assertRange(x.fc_pa, 10e6, 100e6, 'fc_pa', 'Concrete strength f\'c');
  const fy = assertRange(x.fy_pa, 200e6, 700e6, 'fy_pa', 'Plate yield strength');
  const ped = x.support === 'pedestal';
  const N2 = ped ? assertRange(x.n2_m, 0.1, 10, 'n2_m', 'Pedestal length') : Infinity;
  const B2 = ped ? assertRange(x.b2_m, 0.1, 10, 'b2_m', 'Pedestal width') : Infinity;
  const k = PHI_C * 0.85 * fc;
  let a1Req;
  if (x.support === 'equal') a1Req = pu / k;
  else if (x.support === 'large') a1Req = pu / (2 * k);
  else a1Req = Math.max(pu / (2 * k), Math.min(pu / k, (pu / k) ** 2 / (N2 * B2)));
  let N; let B;
  if (x.sizing === 'given') {
    N = assertRange(x.n_m, 0.05, 10, 'n_m', 'Plate length N');
    B = assertRange(x.b_m, 0.05, 10, 'b_m', 'Plate width B');
  } else {
    const step = STEP[x.sizing];
    const up = (v) => (step ? Math.ceil(v / step - 1e-9) * step : v);
    const delta = (0.95 * d - 0.8 * bf) / 2;
    N = up(Math.max(Math.sqrt(a1Req) + delta, d));
    B = up(Math.max(a1Req / N, bf));
    // a pedestal not similar to the plate can leave the rounded plate short of bearing: grow it until it passes
    for (let i = 0; i < 2000 && bearingStrength(fc, N * B, supportArea(N, B, x.support, N2, B2)) < pu * (1 - 1e-12); i += 1) {
      const s = step || 0.002;
      if (i % 2 === 0) N += s; else B += s;
    }
  }
  if (N < d || B < bf) throw new Error('Plate length N: the plate must be at least as large as the column (N ≥ d and B ≥ bf).');
  if (ped && (N > N2 + 1e-9 || B > B2 + 1e-9)) throw new Error('Pedestal length N2: the plate does not fit on the pedestal; enlarge the pedestal.');
  const phiPp = bearingStrength(fc, N * B, supportArea(N, B, x.support, N2, B2));
  const th = thickness({ pu, d, bf, fy, N, B, phiPp });
  const warnings = [];
  if (pu > phiPp * (1 + 1e-9)) warnings.push('Pu exceeds the design bearing strength: the plate or the support area is too small.');
  if (th.t > 0.1) warnings.push('The plate is thicker than 100 mm (4 in): consider a larger plate, stiffeners or a stronger concrete.');
  const names = { m: 'm (beyond the column depth)', n: 'n (beyond the flange width)', lnp: 'λn\' (between the flanges)' };
  const gov = th.l === th.m ? 'm' : th.l === th.n ? 'n' : 'lnp';
  return {
    outputs: {
      a1_req_m2: a1Req,
      n_out_m: N,
      b_out_m: B,
      phi_pp_n: phiPp,
      ratio: pu / phiPp,
      m_m: th.m,
      nn_m: th.n,
      lnp_m: th.lnp,
      governs: names[gov],
      t_m: th.t,
    },
    warnings,
  };
}
