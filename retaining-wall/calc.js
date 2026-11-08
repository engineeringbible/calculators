/**
 * retaining-wall/calc.js — lateral earth pressure on a retaining wall by Rankine (active, passive) and Jaky (at rest),
 * with a uniform surcharge and sloping backfill, the thrust and its height, and the sliding and overturning safety of
 * a rectangular gravity wall.
 *
 * K_a = cos β (cos β − √(cos²β − cos²φ)) / (cos β + √(cos²β − cos²φ)) (= tan²(45° − φ/2) for level fill);
 * K_p = tan²(45° + φ/2); K_0 = 1 − sin φ.  P = ½ K γ H² + K q H;  FS_s = μ W / P_h;  FS_o = W b/2 / (P_h ȳ).
 * Schema units: SI — m, kPa (as Pa), kN/m³ (numbers), N per metre of wall.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const rad = (d) => (d * Math.PI) / 180;

export function rankineKa(phiDeg, betaDeg = 0) {
  const p = rad(phiDeg); const b = rad(betaDeg);
  if (betaDeg >= phiDeg) throw new Error('Backfill slope: it must be flatter than the friction angle, or the slope itself is unstable.');
  const r = Math.sqrt(Math.cos(b) ** 2 - Math.cos(p) ** 2);
  return (Math.cos(b) * (Math.cos(b) - r)) / (Math.cos(b) + r);
}

export const schema = {
  id: 'retaining-wall',
  name: 'Retaining wall earth pressure calculator (Rankine)',
  category: 'civil',
  summary: 'Active, at-rest and passive earth pressure on a retaining wall by Rankine, with surcharge and sloping backfill, the thrust, and sliding and overturning checks.',
  related: ['soil-bearing', 'footing-size', 'trench-volume', 'slope'],
  assumptions: [
    'Rankine theory: a vertical, smooth back face and a cohesionless, drained backfill; wall friction (Coulomb) would lower the active thrust slightly. With sloping backfill the thrust acts parallel to the slope; the stability checks use its horizontal component and ignore the small vertical one.',
    'Active pressure needs the wall to move or rotate slightly away from the soil (about 0.1–0.2 % of its height for sand); walls that cannot move (basement walls, braced walls) carry the higher at-rest pressure K_0 = 1 − sin φ (Jaky).',
    'The backfill is drained: water pressure behind an undrained wall can double the load and is not included. Compaction and traffic loads beyond the uniform surcharge are not included.',
    'The gravity-wall check treats the wall as a rectangular block founded on soil, with no passive resistance at the toe; cantilever walls with a heel and toe need the full design. Typical minimum factors of safety are 1.5 for sliding and 2.0 for overturning.',
  ],
  notes: [
    'Verification 2026-11-07: a 3 m wall retaining sand with φ = 30°, γ = 18 kN/m³ and 10 kPa surcharge has K_a = 1/3, thrust 27 + 10 = 37 kN/m acting 1.135 m above the base; a 1.8 m wide concrete block gives FS 1.75 on sliding (μ = 0.5) and 2.78 on overturning. Checked by hand.',
  ],
  sources: [
    'Rankine, W.J.M. (1857), On the stability of loose earth; Das, B.M., Principles of Foundation Engineering, ch. 7 (Rankine coefficients, sloping backfill)',
    'Jaky, J. (1944), The coefficient of earth pressure at rest (K_0 = 1 − sin φ)',
    'EN 1997-1:2004 §9 (retaining structures) and Annex C (earth pressures; wall movement for active and passive states)',
  ],
  inputs: [
    { id: 'height_m', label: 'Height of retained soil H', group: 'length', unit: 'm', default: 3, min: 0.1, max: 30 },
    { id: 'phi_deg', label: 'Friction angle of the backfill φ (degrees)', group: 'dimensionless', unit: 'none', default: 30, min: 10, max: 50 },
    { id: 'gamma', label: 'Unit weight of the backfill γ (kN/m³)', group: 'dimensionless', unit: 'none', default: 18, min: 10, max: 25 },
    { id: 'beta_deg', label: 'Backfill slope above the wall β (degrees)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 45 },
    { id: 'surcharge_pa', label: 'Uniform surcharge on the backfill', group: 'pressure', unit: 'Pa', display: 'kPa', default: 10000, min: 0, max: 1e6 },
    { id: 'state', label: 'Pressure state', type: 'select', default: 'active', options: [{ value: 'active', label: 'Active (wall free to move slightly)' }, { value: 'rest', label: 'At rest (rigid or braced wall)' }] },
    { id: 'wall_width_m', label: 'Gravity wall: width of the block (0 to skip the check)', group: 'length', unit: 'm', default: 1.8, min: 0, max: 30 },
    { id: 'gamma_wall', label: 'Gravity wall: unit weight (kN/m³)', group: 'dimensionless', unit: 'none', default: 24, min: 10, max: 30 },
    { id: 'mu', label: 'Base friction coefficient μ (tan δ)', group: 'dimensionless', unit: 'none', default: 0.5, min: 0.1, max: 1 },
  ],
  outputs: [
    { id: 'ka', label: 'Active coefficient K_a', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'k0', label: 'At-rest coefficient K_0', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'kp', label: 'Passive coefficient K_p (level ground)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'p_base_pa', label: 'Lateral pressure at the base', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'thrust_n_m', label: 'Thrust per metre of wall P (kN/m)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'ybar_m', label: 'Height of the thrust above the base', group: 'length', unit: 'm' },
    { id: 'moment_knm_m', label: 'Overturning moment per metre (kN·m/m)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'fs_sliding', label: 'Factor of safety against sliding', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'fs_overturning', label: 'Factor of safety against overturning', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { height_m: [3, 'm'], phi_deg: 30, gamma: 18, beta_deg: 0, surcharge_pa: [10, 'kPa'], state: 'active', wall_width_m: [1.8, 'm'], gamma_wall: 24, mu: 0.5 },
    results: { thrust_n_m: '37.00', ybar_m: '1.135 m', fs_sliding: '1.75', fs_overturning: '2.78' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.state, ['active', 'rest'], 'state', 'Pressure state');
  const H = assertPositive(x.height_m, 'height_m', 'Height');
  const phi = assertRange(x.phi_deg, 10, 50, 'phi_deg', 'Friction angle');
  const g = assertRange(x.gamma, 10, 25, 'gamma', 'Unit weight of the backfill');
  const beta = assertRange(x.beta_deg, 0, 45, 'beta_deg', 'Backfill slope');
  const q = assertNonNegative(x.surcharge_pa, 'surcharge_pa', 'Surcharge') / 1000;
  const bw = assertNonNegative(x.wall_width_m, 'wall_width_m', 'Wall width');
  const gw = assertRange(x.gamma_wall, 10, 30, 'gamma_wall', 'Wall unit weight');
  const mu = assertRange(x.mu, 0.1, 1, 'mu', 'Base friction coefficient');
  const ka = rankineKa(phi, beta);
  const k0 = (1 - Math.sin(rad(phi))) * (beta > 0 ? 1 + Math.sin(rad(beta)) : 1);
  const kp = Math.tan(Math.PI / 4 + rad(phi) / 2) ** 2;
  const K = x.state === 'active' ? ka : k0;
  const pSoil = 0.5 * K * g * H * H;
  const pQ = K * q * H;
  const P = pSoil + pQ;
  const ybar = (pSoil * (H / 3) + pQ * (H / 2)) / P;
  const Ph = P * Math.cos(rad(beta));
  const M = Ph * ybar;
  let fsS = null; let fsO = null;
  const warnings = [];
  if (bw > 0) {
    const W = gw * bw * H;
    fsS = (mu * W) / Ph;
    fsO = (W * bw / 2) / M;
    if (fsS < 1.5) warnings.push(`Sliding factor of safety ${fsS.toFixed(2)} is below the usual 1.5: widen the base, add a key or rely on passive resistance with care.`);
    if (fsO < 2) warnings.push(`Overturning factor of safety ${fsO.toFixed(2)} is below the usual 2.0: widen the wall or add a heel.`);
  }
  if (beta > 0 && x.state === 'rest') warnings.push('At-rest pressure with sloping backfill uses the approximation K_0 (1 + sin β).');
  return {
    outputs: { ka, k0, kp, p_base_pa: (K * g * H + K * q) * 1000, thrust_n_m: P, ybar_m: ybar, moment_knm_m: M, fs_sliding: fsS, fs_overturning: fsO },
    warnings,
  };
}
