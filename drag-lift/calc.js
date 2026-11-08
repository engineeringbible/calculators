/**
 * drag-lift/calc.js — aerodynamic drag or lift force F = ½ ρ v² C A, the power to overcome the drag P = F v, and the
 * dynamic pressure, with typical drag coefficients and the air density from altitude and temperature.
 *
 * q = ½ ρ v²;  F = q C A;  P = F v.  Air density ρ = p / (R T) with p from the standard atmosphere at the altitude
 * (shared/psychro.js: ASHRAE Fundamentals Ch. 1 eq. 3 and dry-air specific volume). Schema units: SI — m², m/s, Pa, N, W.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';
import { standardPressure, moistAirDensity } from '../shared/psychro.js';

const MPH = 0.44704;
const FT2 = 0.09290304;
const FT = 0.3048;

/** Typical drag coefficients on frontal area, with their sources. */
export const SHAPES = {
  car: { cd: 0.3, label: 'Passenger car, Cd 0.30 (Çengel and Cimbala Table 11-2)' },
  cyclist_upright: { cd: 1.1, label: 'Cyclist, upright commuting, Cd 1.1 on 0.5 m² (Munson et al.)' },
  cyclist_racing: { cd: 0.88, label: 'Cyclist, racing crouch, Cd 0.88 on 0.36 m² (Munson et al.)' },
  plate: { cd: 1.17, label: 'Flat square plate or disc facing the flow, Cd 1.17 (Hoerner)' },
  sphere: { cd: 0.47, label: 'Sphere, laminar boundary layer, Cd 0.47 (Hoerner)' },
};

export const schema = {
  id: 'drag-lift',
  name: 'Drag and lift force calculator',
  category: 'automotive',
  summary: 'Aerodynamic drag or lift force from ½ρv²CA, the power to overcome drag, and air density from altitude and temperature, with typical Cd values.',
  related: ['thrust-weight', 'true-airspeed', 'quarter-mile', 'wind-load'],
  assumptions: [
    'The force is F = ½ ρ v² C A with the coefficient referred to the area given: the frontal area for drag coefficients of cars, cyclists and bluff bodies, the wing planform area for lift coefficients.',
    'The coefficient is taken as constant; real coefficients change with Reynolds number (a sphere drops from 0.47 to about 0.2 when its boundary layer turns turbulent), yaw angle and, near Mach 0.3 and above, compressibility.',
    'The speed is the air speed relative to the body: for a car or cyclist in still air it is the road speed; add a head wind, subtract a tail wind.',
    'Air density comes from the standard-atmosphere pressure at the altitude and the actual temperature for dry air, or can be entered directly; humidity lowers it slightly (saturated air at 30 °C is 1.6 % lighter than dry air).',
    'The power is the drag force times the speed; the engine or rider must also supply rolling resistance and drivetrain losses, which are not included.',
  ],
  notes: [
    'Verification 2026-11-08: Cd 0.30, 24 ft² frontal area, 70 mph at sea level and 59 °F: ρ 1.225 kg/m³, q 12.53 psf, drag 90.2 lbf, 16.84 hp to overcome it. Checked by hand.',
  ],
  sources: [
    'S.F. Hoerner, Fluid-Dynamic Drag, published by the author, 1965, Chapter 3 (flat plates and discs normal to the flow, C_D ≈ 1.17; sphere 0.47 subcritical)',
    'Y.A. Çengel and J.M. Cimbala, Fluid Mechanics: Fundamentals and Applications, 4th ed., McGraw-Hill 2018, Table 11-2 (passenger car C_D ≈ 0.3)',
    'B.R. Munson, D.F. Young and T.H. Okiishi, Fundamentals of Fluid Mechanics, Wiley, figure of typical drag coefficients (bicycle upright 1.1 on 0.5 m², racing 0.88 on 0.36 m²)',
    'ASHRAE Handbook — Fundamentals, Chapter 1, eq. (3) standard atmospheric pressure, via the shared psychrometric module',
  ],
  inputs: [
    { id: 'force_type', label: 'Force', type: 'select', default: 'drag', options: [{ value: 'drag', label: 'Drag (Cd on frontal area)' }, { value: 'lift', label: 'Lift (CL on wing area)' }] },
    { id: 'shape', label: 'Body (typical Cd)', type: 'select', default: 'custom', options: [{ value: 'custom', label: 'Enter my own coefficient' }, ...Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label }))], visibleWhen: { force_type: 'drag' } },
    { id: 'coef', label: 'Coefficient Cd or CL (used unless a typical body is chosen)', group: 'dimensionless', unit: 'none', default: 0.3, min: 0, max: 5 },
    { id: 'area_m2', label: 'Reference area (frontal for drag, wing for lift)', group: 'area', unit: 'm2', display: 'ft2', default: 24 * FT2, min: 1e-4, max: 10000 },
    { id: 'speed_m_s', label: 'Air speed relative to the body', group: 'speed', unit: 'm_s', display: 'mph', default: 70 * MPH, min: 0, max: 340 },
    { id: 'air', label: 'Air density from', type: 'select', default: 'standard', options: [{ value: 'standard', label: 'Altitude and temperature' }, { value: 'density', label: 'Enter the density' }] },
    { id: 'altitude_m', label: 'Altitude', group: 'length', unit: 'm', display: 'ft', default: 0, min: -400, max: 11000, visibleWhen: { air: 'standard' } },
    { id: 'temp_c', label: 'Air temperature', group: 'temperature', unit: 'C', display: 'F', default: 15, min: -60, max: 60, visibleWhen: { air: 'standard' } },
    { id: 'density_kg_m3', label: 'Air density', group: 'density', unit: 'kg_m3', default: 1.225, min: 0.01, max: 2000, visibleWhen: { air: 'density' } },
  ],
  outputs: [
    { id: 'force_n', label: 'Force', group: 'force', unit: 'N', display: 'lbf', decimals: 1 },
    { id: 'power_w', label: 'Power to overcome the drag', group: 'power', unit: 'W', display: 'hp', decimals: 2 },
    { id: 'q_pa', label: 'Dynamic pressure ½ ρ v²', group: 'pressure', unit: 'Pa', display: 'psf', decimals: 2 },
    { id: 'rho_kg_m3', label: 'Air density used', group: 'density', unit: 'kg_m3', decimals: 4 },
    { id: 'coef_used', label: 'Coefficient used', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ca_m2', label: 'Drag or lift area C × A', group: 'area', unit: 'm2', display: 'ft2', decimals: 2 },
  ],
  example: {
    inputs: { force_type: 'drag', shape: 'custom', coef: 0.3, area_m2: [24, 'ft2'], speed_m_s: [70, 'mph'], air: 'standard', altitude_m: [0, 'ft'], temp_c: [59, 'F'] },
    results: { rho_kg_m3: '1.225 kg/m³', q_pa: '12.53 psf', force_n: '90.2 lbf', power_w: '16.84 hp' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.force_type, ['drag', 'lift'], 'force_type', 'Force');
  assertOneOf(x.air, ['standard', 'density'], 'air', 'Air density from');
  const preset = x.force_type === 'drag' ? assertOneOf(x.shape, ['custom', ...Object.keys(SHAPES)], 'shape', 'Body') : 'custom';
  const c = preset === 'custom' ? assertRange(x.coef, 0, 5, 'coef', 'Coefficient') : SHAPES[preset].cd;
  const area = assertPositive(x.area_m2, 'area_m2', 'Reference area');
  const v = assertRange(x.speed_m_s, 0, 340, 'speed_m_s', 'Air speed');
  let rho;
  if (x.air === 'standard') {
    const h = assertRange(x.altitude_m, -400, 11000, 'altitude_m', 'Altitude');
    const t = assertRange(x.temp_c, -60, 60, 'temp_c', 'Air temperature');
    rho = moistAirDensity(t, 0, standardPressure(h));
  } else {
    rho = assertRange(x.density_kg_m3, 0.01, 2000, 'density_kg_m3', 'Air density');
  }
  const q = 0.5 * rho * v * v;
  const f = q * c * area;
  const warnings = [];
  if (v > 0.3 * 340) warnings.push('Above about Mach 0.3 (230 mph) compressibility changes the coefficients; use data measured at that speed.');
  if (x.force_type === 'lift' && c > 2.5) warnings.push('A lift coefficient above 2.5 is beyond most wings even with full flaps; check the value.');
  return {
    outputs: {
      force_n: f, power_w: x.force_type === 'drag' ? f * v : null, q_pa: q, rho_kg_m3: rho, coef_used: c, ca_m2: c * area,
    },
    warnings,
  };
}
