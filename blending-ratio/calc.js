/**
 * blending-ratio/calc.js — blending two liquids A and B to a target property: a property that blends linearly by
 * mass (concentration % w/w, sulphur % m/m), one that blends linearly by volume (density, % v/v), or kinematic
 * viscosity by the Refutas viscosity blending number; gives the mass and volume fractions and the quantity of each.
 *
 * Linear: f_A = (P_t − P_B) / (P_A − P_B) on the blending basis.  Refutas: VBN = 14.534 ln(ln(ν + 0.8)) + 10.975,
 * blended by mass fraction.  Mass ↔ volume: φ_A = (w_A / ρ_A) / (w_A / ρ_A + w_B / ρ_B) (volumes additive).
 * Schema units: SI — m²/s, kg/m³, m³, kg; fractions.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertFinite } from '../shared/validate.js';

export const REFUTAS_A = 14.534;
export const REFUTAS_B = 10.975;

/** Refutas viscosity blending number of a kinematic viscosity in cSt. */
export const vbn = (cSt) => REFUTAS_A * Math.log(Math.log(cSt + 0.8)) + REFUTAS_B;
/** Kinematic viscosity in cSt from a viscosity blending number. */
export const viscFromVbn = (v) => Math.exp(Math.exp((v - REFUTAS_B) / REFUTAS_A)) - 0.8;

export const schema = {
  id: 'blending-ratio',
  name: 'Blending ratio calculator (two liquids to a target property)',
  category: 'process',
  summary: 'Fractions and volumes of two liquids to blend to a target concentration, density, sulphur content or viscosity (Refutas), by mass or by volume.',
  related: ['mass-balance', 'fuel-blend-heating', 'specific-gravity', 'viscosity-sus'],
  assumptions: [
    'Mass-based properties (concentration in % w/w, sulphur in % m/m, ash, water by mass) blend linearly by mass fraction; volume-based properties (density, % v/v, often the octane number as an approximation) blend linearly by volume fraction.',
    'Viscosity blends by the Refutas method: the viscosity blending number VBN = 14.534 ln(ln(ν + 0.8)) + 10.975 is linear in mass fraction, with both viscosities at the same temperature; it is accurate to a few per cent for miscible petroleum oils.',
    'Volumes are taken as additive (no shrinkage on mixing), which is close for similar hydrocarbons but not for alcohol and water, whose mix shrinks by up to about 4 %.',
    'Compatibility and stability are not predicted: some residual and distillate fuels precipitate asphaltenes when blended; test before blending fuels of different types.',
  ],
  notes: [
    'Verification 2026-11-08: ISO VG 100 (VBN 33.196) and ISO VG 32 (VBN 29.143) blend to VG 68 (VBN 31.940) at 69.0 % VG 100 by mass; with densities 880 and 860 kg/m³ that is 68.5 % by volume, 685 L and 315 L of 1 000 L. Checked by hand.',
    'Refutas check: 10 cSt and 100 cSt blend 50/50 by mass to 26.7 cSt, as in the fuel-blend-heating calculator.',
  ],
  sources: [
    'ASTM D7152, Standard Practice for Calculating Viscosity of a Blend of Petroleum Products (blending-index methods)',
    'Maples, R.E., Petroleum Refinery Process Economics, 2nd ed., PennWell, 2000 (Refutas viscosity blending index; linear blending of sulphur by weight and gravity by volume)',
    'ISO 3448:1992 Industrial liquid lubricants — ISO viscosity classification (VG 32, 68, 100 midpoints at 40 °C)',
  ],
  inputs: [
    { id: 'property', label: 'Property to blend', type: 'select', default: 'viscosity', options: [{ value: 'viscosity', label: 'Kinematic viscosity (Refutas, by mass)' }, { value: 'mass', label: 'Property linear by mass (% w/w, sulphur % m/m)' }, { value: 'volume', label: 'Property linear by volume (density, % v/v)' }] },
    { id: 'visc_a', label: 'Viscosity of liquid A', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 100e-6, min: 0.3e-6, max: 1, visibleWhen: { property: 'viscosity' } },
    { id: 'visc_b', label: 'Viscosity of liquid B', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 32e-6, min: 0.3e-6, max: 1, visibleWhen: { property: 'viscosity' } },
    { id: 'visc_t', label: 'Target viscosity of the blend (same temperature)', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 68e-6, min: 0.3e-6, max: 1, visibleWhen: { property: 'viscosity' } },
    { id: 'prop_a', label: 'Property of liquid A', group: 'dimensionless', unit: 'none', default: 3.5, min: -1e9, max: 1e9, visibleWhen: { property: ['mass', 'volume'] } },
    { id: 'prop_b', label: 'Property of liquid B', group: 'dimensionless', unit: 'none', default: 0.1, min: -1e9, max: 1e9, visibleWhen: { property: ['mass', 'volume'] } },
    { id: 'prop_t', label: 'Target property of the blend', group: 'dimensionless', unit: 'none', default: 0.5, min: -1e9, max: 1e9, visibleWhen: { property: ['mass', 'volume'] } },
    { id: 'rho_a', label: 'Density of liquid A', group: 'density', unit: 'kg_m3', default: 880, min: 100, max: 25000 },
    { id: 'rho_b', label: 'Density of liquid B', group: 'density', unit: 'kg_m3', default: 860, min: 100, max: 25000 },
    { id: 'total_m3', label: 'Volume of blend to make', group: 'volume', unit: 'm3', display: 'L', default: 1, min: 1e-9, max: 1e9 },
  ],
  outputs: [
    { id: 'w_a', label: 'Liquid A, mass fraction', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'w_b', label: 'Liquid B, mass fraction', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'phi_a', label: 'Liquid A, volume fraction', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'phi_b', label: 'Liquid B, volume fraction', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'v_a', label: 'Volume of liquid A', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'v_b', label: 'Volume of liquid B', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'm_a', label: 'Mass of liquid A', group: 'mass', unit: 'kg' },
    { id: 'm_b', label: 'Mass of liquid B', group: 'mass', unit: 'kg' },
    { id: 'rho_blend', label: 'Density of the blend', group: 'density', unit: 'kg_m3' },
    { id: 'vbn_a', label: 'Viscosity blending number of A', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { property: 'viscosity' } },
    { id: 'vbn_b', label: 'Viscosity blending number of B', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { property: 'viscosity' } },
    { id: 'vbn_t', label: 'Viscosity blending number of the target', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { property: 'viscosity' } },
  ],
  example: {
    inputs: { property: 'viscosity', visc_a: [100, 'cSt'], visc_b: [32, 'cSt'], visc_t: [68, 'cSt'], rho_a: [880, 'kg_m3'], rho_b: [860, 'kg_m3'], total_m3: [1000, 'L'] },
    results: { vbn_a: '33.196', vbn_b: '29.143', vbn_t: '31.940', w_a: '69.0 %', phi_a: '68.5 %', v_a: '685 L', v_b: '315 L' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.property, ['viscosity', 'mass', 'volume'], 'property', 'Property to blend');
  const rA = assertPositive(x.rho_a, 'rho_a', 'Density of liquid A');
  const rB = assertPositive(x.rho_b, 'rho_b', 'Density of liquid B');
  const V = assertPositive(x.total_m3, 'total_m3', 'Volume of blend to make');
  let pa;
  let pb;
  let pt;
  let vb = [null, null, null];
  if (x.property === 'viscosity') {
    const cst = (v, id, label) => assertRange(v, 0.3e-6, 1, id, label) * 1e6;
    vb = [vbn(cst(x.visc_a, 'visc_a', 'Viscosity of liquid A')), vbn(cst(x.visc_b, 'visc_b', 'Viscosity of liquid B')), vbn(cst(x.visc_t, 'visc_t', 'Target viscosity'))];
    [pa, pb, pt] = vb;
  } else {
    pa = assertFinite(x.prop_a, 'prop_a', 'Property of liquid A');
    pb = assertFinite(x.prop_b, 'prop_b', 'Property of liquid B');
    pt = assertFinite(x.prop_t, 'prop_t', 'Target property');
  }
  if (pa === pb) throw new Error('Property of liquid B: it equals that of liquid A, so no blend can change it.');
  const f = (pt - pb) / (pa - pb);
  if (f < -1e-12 || f > 1 + 1e-12) throw new Error('Target property: it must lie between the values of liquid A and liquid B.');
  const fa = Math.min(1, Math.max(0, f));
  let wA;
  let phiA;
  if (x.property === 'volume') {
    phiA = fa;
    wA = (phiA * rA) / (phiA * rA + (1 - phiA) * rB);
  } else {
    wA = fa;
    phiA = wA / rA / (wA / rA + (1 - wA) / rB);
  }
  const rho = phiA * rA + (1 - phiA) * rB;
  const warnings = [];
  if (Math.abs(rA - rB) / Math.min(rA, rB) > 0.3) warnings.push('The densities differ by more than 30 %: check that the liquids mix, and expect volumes not to add exactly.');
  return {
    outputs: {
      w_a: wA, w_b: 1 - wA, phi_a: phiA, phi_b: 1 - phiA,
      v_a: phiA * V, v_b: (1 - phiA) * V, m_a: phiA * V * rA, m_b: (1 - phiA) * V * rB,
      rho_blend: rho, vbn_a: vb[0], vbn_b: vb[1], vbn_t: vb[2],
    },
    warnings,
  };
}
