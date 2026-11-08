/**
 * viscosity-sus/calc.js — kinematic viscosity in centistokes (mm²/s) to Saybolt Universal Seconds (SUS, SSU) and back
 * by ASTM D2161, with the dynamic viscosity in centipoise for a given density.
 *
 * At 100 °F (37.78 °C): SUS = 4.6324 ν + (1.0 + 0.03264 ν) / ((3930.2 + 262.7 ν + 23.97 ν² + 1.646 ν³) × 10⁻⁵).
 * At another temperature t (°F): SUS_t = SUS_100 × (1 + 0.000061 (t − 100)).  μ (cP) = ν (cSt) × ρ (g/cm³).
 * Schema units: ν in cSt (mm²/s), SUS in seconds, °C, kg/m³, cP.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';

/** SUS at 100 °F from ν in cSt (ASTM D2161 eq. 1). */
export function susAt100F(nu) {
  return 4.6324 * nu + (1.0 + 0.03264 * nu) / ((3930.2 + 262.7 * nu + 23.97 * nu * nu + 1.646 * nu ** 3) * 1e-5);
}

/** Saybolt Furol seconds at 122 °F from ν (cSt) at 122 °F, ASTM D2161 eq. 7; valid from 25.1 SFS. */
export const sfsAt122F = (nu) => 0.4717 * nu + 13924 / (nu * nu - 72.59 * nu + 6816);

/** Temperature correction of ASTM D2161 for a test temperature in °F. */
export const tempFactor = (tF) => 1 + 0.000061 * (tF - 100);

/** ν in cSt from SUS at 100 °F, by bisection (SUS increases with ν). */
export function cstFromSus100(sus) {
  let lo = 1.8; let hi = 1e5;
  for (let k = 0; k < 200; k += 1) { const mid = (lo + hi) / 2; if (susAt100F(mid) < sus) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

export const schema = {
  id: 'viscosity-sus',
  name: 'cSt to SSU viscosity converter (Saybolt seconds)',
  category: 'thermal',
  summary: 'Convert kinematic viscosity between centistokes and Saybolt Universal Seconds (SUS, SSU) by ASTM D2161, with dynamic viscosity in centipoise.',
  related: ['unit-converter', 'reynolds-number', 'pipe-flow', 'pump-power'],
  assumptions: [
    'The conversion is the ASTM D2161 equation for Saybolt Universal viscosity at 100 °F (37.8 °C), with its temperature correction for other test temperatures; it applies from 1.8 cSt (about 32 SUS) upward.',
    'Saybolt seconds are an obsolete empirical unit: the time 60 mL of oil takes to flow through a calibrated orifice. Modern specifications use mm²/s (cSt) measured to ASTM D445 or ISO 3104.',
    'Dynamic viscosity in centipoise is the kinematic viscosity times the density in g/cm³ at the same temperature.',
  ],
  notes: [
    'Verification 2026-11-08: 20.00 cSt gives 97.8 SUS at 100 °F and 98.5 SUS at 210 °F, and 50.0 cSt gives 233 and 234 SUS, as in ASTM D2161 Table 1; the equation coefficients were checked against the printed standard.',
  ],
  sources: [
    'ASTM D2161-21, Standard Practice for Conversion of Kinematic Viscosity to Saybolt Universal Viscosity or to Saybolt Furol Viscosity, eqs. 1 and 2',
    'ASTM D445-24, Kinematic Viscosity of Transparent and Opaque Liquids (the modern measurement in mm²/s)',
  ],
  inputs: [
    { id: 'direction', label: 'Convert', type: 'select', default: 'to_sus', options: [{ value: 'to_sus', label: 'Centistokes (cSt, mm²/s) to SUS' }, { value: 'to_cst', label: 'SUS (SSU) to centistokes' }] },
    { id: 'cst', label: 'Kinematic viscosity (cSt = mm²/s)', group: 'dimensionless', unit: 'none', default: 20, min: 1.8, max: 1e5, visibleWhen: { direction: 'to_sus' } },
    { id: 'sus', label: 'Saybolt Universal Seconds (SUS)', group: 'dimensionless', unit: 'none', default: 100, min: 32, max: 5e5, visibleWhen: { direction: 'to_cst' } },
    { id: 'temp_c', label: 'Test temperature', group: 'temperature', unit: 'C', default: 37.7778, min: -20, max: 200 },
    { id: 'density', label: 'Density at that temperature (for centipoise)', group: 'density', unit: 'kg_m3', default: 870, min: 100, max: 3000 },
  ],
  outputs: [
    { id: 'cst_out', label: 'Kinematic viscosity, cSt (mm²/s)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'sus_out', label: 'Saybolt Universal Seconds, SUS', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'cp', label: 'Dynamic viscosity, cP (mPa·s)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'sfs', label: 'Saybolt Furol seconds at 122 °F (if the cSt value is at 122 °F)', group: 'dimensionless', unit: 'none', decimals: 1 },
  ],
  example: {
    inputs: { direction: 'to_sus', cst: 20, temp_c: [37.7778, 'C'], density: [870, 'kg_m3'] },
    results: { sus_out: '97.82', cp: '17.40' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.direction, ['to_sus', 'to_cst'], 'direction', 'Convert');
  const tF = assertRange(x.temp_c, -20, 200, 'temp_c', 'Test temperature') * 9 / 5 + 32;
  const rho = assertRange(x.density, 100, 3000, 'density', 'Density');
  const f = tempFactor(tF);
  let nu; let sus;
  if (x.direction === 'to_sus') {
    nu = assertRange(x.cst, 1.8, 1e5, 'cst', 'Kinematic viscosity');
    sus = susAt100F(nu) * f;
  } else {
    sus = assertPositive(x.sus, 'sus', 'Saybolt Universal Seconds');
    if (sus / f < susAt100F(1.8)) throw new Error('Saybolt Universal Seconds: below about 32 SUS the Saybolt Universal scale does not apply.');
    nu = cstFromSus100(sus / f);
  }
  const warnings = [];
  if (sus > 1000) warnings.push('Above about 1 000 SUS, oils were usually measured in Saybolt Furol seconds (SFS), about one tenth of the SUS value.');
  const sfs = sfsAt122F(nu);
  return { outputs: { cst_out: nu, sus_out: sus, cp: nu * rho / 1000, sfs: sfs >= 25.1 ? sfs : null }, warnings };
}
