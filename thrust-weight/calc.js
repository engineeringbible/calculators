/**
 * thrust-weight/calc.js — thrust-to-weight ratio, wing loading and power loading of aircraft, drones and rockets, the
 * net vertical acceleration at full thrust, and the stall speed from the wing loading and the maximum lift coefficient.
 *
 * W = m g0;  T/W;  a_vertical = g0 (T/W − 1);  W/S;  W/P;  V_s = √(2 W / (ρ S CL_max)), ρ from the ISA at the altitude
 * (ICAO Doc 7488). Schema units: SI — kg, N, W, m², m, m/s.
 */
import { withDefaults, assertRange, assertNonNegative } from '../shared/validate.js';

const G0 = 9.80665;
const LB = 0.45359237;
const LBF = 4.4482216152605;
const FT2 = 0.09290304;
const HP = 745.69987158227;
const FT = 0.3048;
const T0 = 288.15;
const L = 0.0065;
const R = 287.05287;
const N = G0 / (L * R);
const RHO0 = 101325 / (R * T0);

/** ISA density (kg/m³) at a height h (m) in the troposphere. */
export const isaDensity = (h) => RHO0 * (1 - (L * h) / T0) ** (N - 1);

export const schema = {
  id: 'thrust-weight',
  name: 'Thrust-to-weight, wing loading and stall speed calculator',
  category: 'automotive',
  summary: 'Thrust-to-weight ratio, wing loading, power loading and stall speed for aircraft, drones and rockets, with the vertical acceleration at full thrust.',
  related: ['drag-lift', 'rocket-equation', 'density-altitude', 'true-airspeed'],
  assumptions: [
    'Weight is mass × standard gravity 9.806 65 m/s²; 1 lb of mass weighs 1 lbf, so lb/ft² and lbf/ft² are the same number for wing loading.',
    'The thrust-to-weight ratio uses the static thrust given (sea-level static for jets and rockets, measured for a drone); above 1 the vehicle can accelerate straight up, and the net vertical acceleration is g (T/W − 1) before drag.',
    'The stall speed is the speed at which lift at CL_max equals the weight in level, unaccelerated flight: V_s = √(2 W / (ρ S CL_max)). It is a true airspeed; the equivalent (and roughly indicated) stall speed is the same at every altitude.',
    'CL_max comes from the aircraft or wing-section data and rises with flaps; a load factor n, as in a banked turn, raises the stall speed by √n.',
    'Air density is the ICAO standard atmosphere value at the altitude entered; use the density altitude for a hot or high day.',
  ],
  notes: [
    'Verification 2026-11-08: 2 550 lb, 174 ft² of wing, 180 hp, CL_max 1.5 at sea level: wing loading 14.66 lb/ft² (71.6 kg/m²), power loading 14.17 lb/hp, stall 53.7 kn; at 5 000 ft 57.9 kn true. Checked by hand.',
  ],
  sources: [
    'J.D. Anderson, Aircraft Performance and Design, McGraw-Hill 1999, Chapter 5 (stall speed V_stall = √(2W / (ρ S C_L,max)), thrust-to-weight ratio and wing loading)',
    'D.P. Raymer, Aircraft Design: A Conceptual Approach, 6th ed., AIAA 2018, Chapter 5 Thrust-to-weight ratio and wing loading',
    'ICAO Doc 7488/3, Manual of the ICAO Standard Atmosphere, 3rd ed. 1993 (density with altitude)',
  ],
  inputs: [
    { id: 'mass_kg', label: 'Gross weight (mass)', group: 'mass', unit: 'kg', display: 'lb', default: 2550 * LB, min: 0.001, max: 5e6 },
    { id: 'thrust_n', label: 'Static thrust (optional, 0 if none)', group: 'force', unit: 'N', display: 'lbf', default: 0, min: 0, max: 1e8 },
    { id: 'power_w', label: 'Engine or motor power (optional, 0 if none)', group: 'power', unit: 'W', display: 'hp', default: 180 * HP, min: 0, max: 1e9 },
    { id: 'wing_area_m2', label: 'Wing area (optional, 0 if none)', group: 'area', unit: 'm2', display: 'ft2', default: 174 * FT2, min: 0, max: 2000 },
    { id: 'clmax', label: 'Maximum lift coefficient CL_max', group: 'dimensionless', unit: 'none', default: 1.5, min: 0.3, max: 4 },
    { id: 'altitude_m', label: 'Altitude (or density altitude)', group: 'length', unit: 'm', display: 'ft', default: 0, min: -600, max: 11000 },
  ],
  outputs: [
    { id: 'weight_n', label: 'Weight', group: 'force', unit: 'N', display: 'lbf', decimals: 0 },
    { id: 'tw', label: 'Thrust-to-weight ratio T/W', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'accel_m_s2', label: 'Net vertical acceleration at full thrust', group: 'acceleration', unit: 'm_s2', display: 'g', decimals: 3 },
    { id: 'verdict', label: 'Vertical capability', type: 'text' },
    { id: 'wing_loading_pa', label: 'Wing loading W/S', group: 'pressure', unit: 'Pa', display: 'psf', decimals: 2 },
    { id: 'wing_loading_kg_m2', label: 'Wing loading, kg/m²', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'power_loading_lb_hp', label: 'Power loading, lb/hp', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'power_loading_kg_kw', label: 'Power loading, kg/kW', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'stall_m_s', label: 'Stall speed (true airspeed)', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'rho_kg_m3', label: 'Air density used', group: 'density', unit: 'kg_m3', decimals: 4 },
  ],
  example: {
    inputs: { mass_kg: [2550, 'lb'], thrust_n: [0, 'lbf'], power_w: [180, 'hp'], wing_area_m2: [174, 'ft2'], clmax: 1.5, altitude_m: [0, 'ft'] },
    results: { wing_loading_pa: '14.66 psf', wing_loading_kg_m2: '71.6', power_loading_lb_hp: '14.17', stall_m_s: '53.7 kn' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const m = assertRange(x.mass_kg, 0.001, 5e6, 'mass_kg', 'Gross weight');
  const thrust = assertNonNegative(x.thrust_n, 'thrust_n', 'Static thrust');
  const power = assertNonNegative(x.power_w, 'power_w', 'Power');
  const s = assertNonNegative(x.wing_area_m2, 'wing_area_m2', 'Wing area');
  const cl = assertRange(x.clmax, 0.3, 4, 'clmax', 'Maximum lift coefficient');
  const h = assertRange(x.altitude_m, -600, 11000, 'altitude_m', 'Altitude');
  const w = m * G0;
  const rho = isaDensity(h);
  const tw = thrust > 0 ? thrust / w : null;
  let verdict = 'No thrust entered';
  if (tw !== null) verdict = tw > 1 ? 'T/W above 1: can accelerate straight up (rocket, drone hover and climb)' : tw === 1 ? 'T/W = 1: can just hover' : 'T/W below 1: needs wing lift to fly';
  const wsPa = s > 0 ? w / s : null;
  const warnings = [];
  if (tw !== null && tw > 1 && tw < 1.3) warnings.push('T/W between 1 and 1.3 leaves little margin to climb vertically or to control a hovering drone.');
  if (cl > 3) warnings.push('CL_max above 3 is unusual even with flaps; check the value.');
  return {
    outputs: {
      weight_n: w, tw, accel_m_s2: tw === null ? null : G0 * (tw - 1), verdict,
      wing_loading_pa: wsPa, wing_loading_kg_m2: s > 0 ? m / s : null,
      power_loading_lb_hp: power > 0 ? (m / LB) / (power / HP) : null,
      power_loading_kg_kw: power > 0 ? m / (power / 1000) : null,
      stall_m_s: s > 0 ? Math.sqrt((2 * w) / (rho * s * cl)) : null,
      rho_kg_m3: rho,
    },
    warnings,
  };
}
