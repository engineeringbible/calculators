/**
 * wind-load/calc.js — wind pressure on a structure: the peak velocity pressure q_p(z) of EN 1991-1-4 or the velocity
 * pressure q_z of ASCE 7-16, and the force on an area for a force or pressure coefficient.
 *
 * EN: c_r = k_r ln(z/z0), k_r = 0.19 (z0/0.05)^0.07, v_m = c_r c_o v_b, I_v = k_I / (c_o ln(z/z0)),
 *     q_p = (1 + 7 I_v) ½ ρ v_m² (z ≥ z_min; below, z = z_min).
 * ASCE: K_z = 2.01 (z/z_g)^(2/α) (z ≥ 15 ft), q_z = 0.00256 K_z K_zt K_d K_e V² psf (V in mph).
 * F = q × C × A.  Schema units: SI — m/s, m, Pa, m², N.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** EN 1991-1-4 Table 4.1: terrain category → [z0, z_min] in m. */
export const TERRAIN = {
  '0': ['Sea or coastal area exposed to the open sea', 0.003, 1],
  I: ['Lakes or flat, open country without obstacles', 0.01, 1],
  II: ['Low vegetation, isolated obstacles 20 heights apart', 0.05, 2],
  III: ['Regular vegetation, villages, suburbs, forests', 0.3, 5],
  IV: ['At least 15 % covered by buildings over 15 m high', 1.0, 10],
};
/** ASCE 7-16 Table 26.11-1: exposure → [α, z_g ft]. */
export const EXPOSURE = { B: ['B — urban and suburban, wooded', 7.0, 1200], C: ['C — open terrain, scattered obstructions', 9.5, 900], D: ['D — flat, unobstructed, facing water', 11.5, 700] };

const FT = 0.3048;
const MPH = 0.44704;
const PSF = 4.4482216152605 / 0.09290304;

export function enPeakPressure(vb, cat, z, rho = 1.25) {
  const [, z0, zmin] = TERRAIN[cat];
  const ze = Math.max(z, zmin);
  const kr = 0.19 * (z0 / 0.05) ** 0.07;
  const cr = kr * Math.log(ze / z0);
  const vm = cr * vb;
  const iv = 1 / Math.log(ze / z0);
  const qb = 0.5 * rho * vb * vb;
  const qp = (1 + 7 * iv) * 0.5 * rho * vm * vm;
  return { kr, cr, vm, iv, qb, qp, ce: qp / qb };
}

export function asceKz(exposure, zFt) {
  const [, alpha, zg] = EXPOSURE[exposure];
  return 2.01 * (Math.max(zFt, 15) / zg) ** (2 / alpha);
}

export const schema = {
  id: 'wind-load',
  name: 'Wind load calculator (Eurocode and ASCE 7)',
  category: 'structural',
  summary: 'Wind pressure at any height by EN 1991-1-4 (peak velocity pressure) or ASCE 7-16 (velocity pressure q_z), and the wind force on an area.',
  related: ['snow-load', 'air-density', 'beam-deflection', 'moment-of-inertia'],
  assumptions: [
    'The basic wind speed comes from the national annex map (EN, 10-minute mean at 10 m in open country) or the ASCE 7 map for the risk category (3-second gust at 33 ft, exposure C); the calculator does not look it up.',
    'EN: orography factor c_o = 1, turbulence factor k_I = 1, directional and seasonal factors 1, air density 1.25 kg/m³ (EN 1991-1-4 recommended values; national annexes may change them).',
    'ASCE: K_z from the power law of Table 26.10-1 notes with α and z_g of Table 26.11-1; K_d = 0.85 for buildings; K_e = 1 at sea level (Table 26.9-1 gives lower values at altitude). ASCE 7-22 revised α and z_g slightly.',
    'The force uses one coefficient for the whole area (a force coefficient c_f, or a net pressure coefficient); real design applies zone-by-zone external and internal pressure coefficients and, for ASCE, the gust-effect factor G (0.85 for rigid buildings) inside the coefficient.',
  ],
  notes: [
    'Verification 2026-11-07: EN, v_b = 27 m/s, terrain II, z = 10 m: c_e = 2.35, q_p = 1.07 kPa; ASCE, V = 115 mph, exposure C, z = 30 ft: K_z = 0.98, q_z = 28.3 psf. Both match the code tables (EN Fig. 4.2; ASCE Table 26.10-1). Checked by hand.',
  ],
  sources: [
    'EN 1991-1-4:2005 + A1:2010, Actions on structures — Wind actions: §4.2–4.5, Table 4.1, eqs. (4.3)–(4.8), Fig. 4.2',
    'ASCE/SEI 7-16, Chapter 26: eq. 26.10-1, Tables 26.6-1 (K_d), 26.9-1 (K_e), 26.10-1 and 26.11-1 (K_z, α, z_g)',
  ],
  inputs: [
    { id: 'code', label: 'Code', type: 'select', default: 'en', options: [{ value: 'en', label: 'Eurocode EN 1991-1-4' }, { value: 'asce', label: 'ASCE 7-16 (US)' }] },
    { id: 'vb_m_s', label: 'Basic wind speed (EN v_b, 10-min mean)', group: 'speed', unit: 'm_s', default: 27, min: 1, max: 100, visibleWhen: { code: 'en' } },
    { id: 'terrain', label: 'Terrain category', type: 'select', default: 'II', options: Object.entries(TERRAIN).map(([value, [label]]) => ({ value, label: `${value}: ${label}` })), visibleWhen: { code: 'en' } },
    { id: 'v_asce_m_s', label: 'Basic wind speed V (ASCE, 3-s gust)', group: 'speed', unit: 'm_s', display: 'mph', default: 115 * MPH, min: 1, max: 150, visibleWhen: { code: 'asce' } },
    { id: 'exposure', label: 'Exposure category', type: 'select', default: 'C', options: Object.entries(EXPOSURE).map(([value, [label]]) => ({ value, label })), visibleWhen: { code: 'asce' } },
    { id: 'kzt', label: 'Topographic factor K_zt', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 3, visibleWhen: { code: 'asce' } },
    { id: 'kd', label: 'Directionality factor K_d', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.5, max: 1, visibleWhen: { code: 'asce' } },
    { id: 'ke', label: 'Ground elevation factor K_e', group: 'dimensionless', unit: 'none', default: 1, min: 0.5, max: 1, visibleWhen: { code: 'asce' } },
    { id: 'height_m', label: 'Height above ground z', group: 'length', unit: 'm', default: 10, min: 0.1, max: 500 },
    { id: 'coef', label: 'Force or net pressure coefficient (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 5 },
    { id: 'area_m2', label: 'Area for the force (optional)', group: 'area', unit: 'm2', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'pressure_pa', label: 'Wind pressure (EN q_p, ASCE q_z)', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'factor', label: 'Exposure factor (EN c_e, ASCE K_z)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'mean_speed_m_s', label: 'Mean wind speed at height (EN v_m)', group: 'speed', unit: 'm_s' },
    { id: 'turbulence', label: 'Turbulence intensity (EN I_v)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'force_n', label: 'Force on the area (q × coefficient × area)', group: 'force', unit: 'N', display: 'kN' },
  ],
  example: {
    inputs: { code: 'en', vb_m_s: [27, 'm_s'], terrain: 'II', height_m: [10, 'm'], coef: 0, area_m2: [0, 'm2'] },
    results: { pressure_pa: '1.07 kPa', factor: '2.35' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.code, ['en', 'asce'], 'code', 'Code');
  const z = assertPositive(x.height_m, 'height_m', 'Height');
  const coef = assertNonNegative(x.coef, 'coef', 'Coefficient');
  const area = assertNonNegative(x.area_m2, 'area_m2', 'Area');
  const warnings = [];
  let out;
  if (x.code === 'en') {
    assertOneOf(String(x.terrain), Object.keys(TERRAIN), 'terrain', 'Terrain category');
    const vb = assertRange(x.vb_m_s, 1, 100, 'vb_m_s', 'Basic wind speed');
    if (z > 200) warnings.push('EN 1991-1-4 covers heights up to 200 m.');
    if (z < TERRAIN[String(x.terrain)][2]) warnings.push(`Below z_min = ${TERRAIN[String(x.terrain)][2]} m the pressure is taken at z_min.`);
    const r = enPeakPressure(vb, String(x.terrain), z);
    out = { pressure_pa: r.qp, factor: r.ce, mean_speed_m_s: r.vm, turbulence: r.iv };
  } else {
    assertOneOf(x.exposure, Object.keys(EXPOSURE), 'exposure', 'Exposure category');
    const V = assertRange(x.v_asce_m_s, 1, 150, 'v_asce_m_s', 'Basic wind speed') / MPH;
    const kzt = assertRange(x.kzt, 1, 3, 'kzt', 'K_zt');
    const kd = assertRange(x.kd, 0.5, 1, 'kd', 'K_d');
    const ke = assertRange(x.ke, 0.5, 1, 'ke', 'K_e');
    const kz = asceKz(x.exposure, z / FT);
    const qz = 0.00256 * kz * kzt * kd * ke * V * V * PSF;
    out = { pressure_pa: qz, factor: kz, mean_speed_m_s: null, turbulence: null };
  }
  out.force_n = coef > 0 && area > 0 ? out.pressure_pa * coef * area : null;
  return { outputs: out, warnings };
}
