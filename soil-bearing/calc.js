/**
 * soil-bearing/calc.js — ultimate and allowable bearing capacity of a shallow footing by Eurocode 7 Annex D (drained
 * or undrained) or by Terzaghi's equation, with the bearing capacity factors and the load the footing can carry.
 *
 * EC7 drained: q_ult = c' N_c s_c + q' N_q s_q + ½ γ' B N_γ s_γ; N_q = e^{π tan φ} tan²(45° + φ/2), N_c = (N_q − 1) cot φ,
 * N_γ = 2 (N_q − 1) tan φ.  EC7 undrained: q_ult = (π + 2) c_u s_c + q.
 * Terzaghi: N_q = e^{2(3π/4 − φ/2) tan φ} / (2 cos²(45° + φ/2)), N_c = (N_q − 1) cot φ (5.7 at φ = 0),
 * N_γ ≈ 2 (N_q + 1) tan φ / (1 + 0.4 sin 4φ) (Coduto); shape 1.3 c N_c and 0.4 or 0.3 γ B N_γ.
 * Schema units: SI — m, kPa (as Pa), kN/m³ (as N/m³), degrees, N.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const rad = (d) => (d * Math.PI) / 180;

export function factorsEc7(phiDeg) {
  if (phiDeg === 0) return { Nc: Math.PI + 2, Nq: 1, Ng: 0 };
  const p = rad(phiDeg);
  const Nq = Math.exp(Math.PI * Math.tan(p)) * Math.tan(Math.PI / 4 + p / 2) ** 2;
  return { Nc: (Nq - 1) / Math.tan(p), Nq, Ng: 2 * (Nq - 1) * Math.tan(p) };
}

export function factorsTerzaghi(phiDeg) {
  if (phiDeg === 0) return { Nc: 5.7, Nq: 1, Ng: 0 };
  const p = rad(phiDeg);
  const Nq = Math.exp(2 * ((3 * Math.PI) / 4 - p / 2) * Math.tan(p)) / (2 * Math.cos(Math.PI / 4 + p / 2) ** 2);
  return { Nc: (Nq - 1) / Math.tan(p), Nq, Ng: (2 * (Nq + 1) * Math.tan(p)) / (1 + 0.4 * Math.sin(4 * p)) };
}

export const schema = {
  id: 'soil-bearing',
  name: 'Soil bearing capacity calculator (Terzaghi and Eurocode 7)',
  category: 'civil',
  summary: 'Ultimate and allowable bearing capacity of strip, square, rectangular and circular footings by Terzaghi or Eurocode 7, drained or undrained.',
  related: ['footing-size', 'retaining-wall', 'concrete-footing', 'outrigger-pad-pressure'],
  assumptions: [
    'The footing is shallow (depth no more than about its width), level, and loaded vertically through its centre; inclined or eccentric loads, sloping ground and layered soils need the full factors of EN 1997-1 Annex D or a geotechnical engineer.',
    'Soil parameters are characteristic values from a site investigation. Below the water table use the submerged unit weight (about γ − 9.81 kN/m³).',
    'Eurocode 7 Annex D gives the resistance without depth factors; Terzaghi\'s equation applies to general shear failure in dense or stiff soils. Loose or soft soils fail in local or punching shear at lower loads.',
    'Terzaghi\'s N_γ has no closed form; the Coduto (2001) fit used here is 5–6 % above the Kumbhojkar (1993) tabulation from 25° to 40° and up to about 20 % above it at 20°, where N_γ contributes little.',
    'The allowable pressure is the ultimate divided by the factor of safety (2.5 to 3 is traditional). Eurocode design uses partial factors instead, and settlement often governs before bearing failure.',
  ],
  notes: [
    'Verification 2026-11-07: at φ = 30° Eurocode 7 gives N_q = 18.40, N_c = 30.14, N_γ = 20.09 and Terzaghi N_q = 22.46, N_c = 37.16 (Das, Table 3.1). A 2 m square footing 1 m deep in sand (φ 30°, γ 18 kN/m³) has q_ult = 750 kPa by EC7.',
  ],
  sources: [
    'EN 1997-1:2004 Eurocode 7, Annex D (informative): sample analytical method for bearing resistance calculation, D.3 and D.4',
    'Terzaghi, K. (1943), Theoretical Soil Mechanics, Wiley; Das, B.M., Principles of Foundation Engineering, Table 3.1 (Terzaghi factors)',
    'Coduto, D.P. (2001), Foundation Design: Principles and Practices, 2nd ed., eq. 6.8 (approximation of Terzaghi N_γ)',
  ],
  inputs: [
    { id: 'method', label: 'Method', type: 'select', default: 'ec7', options: [{ value: 'ec7', label: 'Eurocode 7 Annex D' }, { value: 'terzaghi', label: 'Terzaghi (1943)' }] },
    { id: 'condition', label: 'Analysis', type: 'select', default: 'drained', options: [{ value: 'drained', label: 'Drained (sand, gravel; long-term clay): φ′ and c′' }, { value: 'undrained', label: 'Undrained (clay, short term): c_u' }] },
    { id: 'shape', label: 'Footing', type: 'select', default: 'square', options: [{ value: 'strip', label: 'Strip (continuous)' }, { value: 'square', label: 'Square' }, { value: 'rect', label: 'Rectangular' }, { value: 'circle', label: 'Circular (B = diameter)' }] },
    { id: 'width_m', label: 'Width B (diameter for a circle)', group: 'length', unit: 'm', default: 2, min: 0.1, max: 100 },
    { id: 'length_m', label: 'Length L', group: 'length', unit: 'm', default: 3, min: 0.1, max: 1000, visibleWhen: { shape: 'rect' } },
    { id: 'depth_m', label: 'Depth of the base below ground D_f', group: 'length', unit: 'm', default: 1, min: 0, max: 50 },
    { id: 'phi_deg', label: 'Friction angle φ′ (degrees)', group: 'dimensionless', unit: 'none', default: 30, min: 0, max: 50, visibleWhen: { condition: 'drained' } },
    { id: 'c_pa', label: 'Cohesion c′', group: 'pressure', unit: 'Pa', display: 'kPa', default: 0, min: 0, max: 1e6, visibleWhen: { condition: 'drained' } },
    { id: 'cu_pa', label: 'Undrained shear strength c_u', group: 'pressure', unit: 'Pa', display: 'kPa', default: 50000, min: 1, max: 1e6, visibleWhen: { condition: 'undrained' } },
    { id: 'gamma_kn_m3', label: 'Unit weight of soil γ (kN/m³)', group: 'dimensionless', unit: 'none', default: 18, min: 5, max: 25 },
    { id: 'fs', label: 'Factor of safety', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 10 },
  ],
  outputs: [
    { id: 'nc', label: 'N_c', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'nq', label: 'N_q', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'ng', label: 'N_γ', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'q_ult_pa', label: 'Ultimate bearing capacity q_ult', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'q_all_pa', label: 'Allowable bearing pressure q_ult / FS', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'capacity_n', label: 'Allowable load on the footing (per metre for a strip)', group: 'force', unit: 'N', display: 'kN' },
  ],
  example: {
    inputs: { method: 'ec7', condition: 'drained', shape: 'square', width_m: [2, 'm'], depth_m: [1, 'm'], phi_deg: 30, c_pa: [0, 'kPa'], gamma_kn_m3: 18, fs: 3 },
    results: { nq: '18.40', ng: '20.09', q_ult_pa: '750 kPa', q_all_pa: '250 kPa' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.method, ['ec7', 'terzaghi'], 'method', 'Method');
  assertOneOf(x.condition, ['drained', 'undrained'], 'condition', 'Analysis');
  assertOneOf(x.shape, ['strip', 'square', 'rect', 'circle'], 'shape', 'Footing');
  const B = assertPositive(x.width_m, 'width_m', 'Width B');
  const L = x.shape === 'rect' ? assertPositive(x.length_m, 'length_m', 'Length L') : x.shape === 'strip' ? Infinity : B;
  if (x.shape === 'rect' && L < B) throw new Error('Length L: enter the longer side as L and the shorter as B.');
  const Df = assertNonNegative(x.depth_m, 'depth_m', 'Depth');
  const gamma = assertRange(x.gamma_kn_m3, 5, 25, 'gamma_kn_m3', 'Unit weight') * 1000;
  const fs = assertRange(x.fs, 1, 10, 'fs', 'Factor of safety');
  const q = gamma * Df;
  const BL = x.shape === 'strip' ? 0 : B / L;
  const undrained = x.condition === 'undrained';
  const phi = undrained ? 0 : assertRange(x.phi_deg, 0, 50, 'phi_deg', 'Friction angle');
  const c = undrained ? assertPositive(x.cu_pa, 'cu_pa', 'Undrained shear strength') : assertNonNegative(x.c_pa, 'c_pa', 'Cohesion');
  const f = x.method === 'ec7' ? factorsEc7(phi) : factorsTerzaghi(phi);
  let qult;
  if (x.method === 'ec7') {
    if (undrained) qult = (Math.PI + 2) * c * (1 + 0.2 * BL) + q;
    else {
      const sq = 1 + BL * Math.sin(rad(phi));
      const sg = 1 - 0.3 * BL;
      const sc = phi > 0 ? (sq * f.Nq - 1) / (f.Nq - 1) : 1 + 0.2 * BL;
      qult = c * f.Nc * sc + q * f.Nq * sq + 0.5 * gamma * B * f.Ng * sg;
    }
  } else {
    const [scT, sgT] = x.shape === 'strip' ? [1, 0.5] : x.shape === 'circle' ? [1.3, 0.3] : x.shape === 'square' ? [1.3, 0.4] : [1 + 0.3 * BL, 0.5 - 0.1 * BL];
    qult = c * f.Nc * scT + q * f.Nq + sgT * gamma * B * f.Ng;
  }
  const qall = qult / fs;
  const area = x.shape === 'strip' ? B : x.shape === 'circle' ? (Math.PI / 4) * B * B : B * L;
  const warnings = [];
  if (Df > 2 * B) warnings.push('The footing is deeper than twice its width: shallow-foundation theory underestimates the capacity; treat it as a pier.');
  if (!undrained && phi < 28 && c === 0) warnings.push('A friction angle below about 28° in a cohesionless soil suggests loose sand, where local shear failure governs at lower loads.');
  return {
    outputs: { nc: f.Nc, nq: f.Nq, ng: f.Ng, q_ult_pa: qult, q_all_pa: qall, capacity_n: qall * area },
    warnings,
  };
}
