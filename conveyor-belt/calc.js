/**
 * conveyor-belt/calc.js — belt conveyor speed from the drive pulley, and the capacity of a flat or three-equal-roll
 * troughed belt from belt width, trough and surcharge angles, speed and bulk density (simplified CEMA method), with the
 * power needed to lift the load.
 *
 * v = π D n.  Edge distance c = 0.055 b + 0.9 in (CEMA standard edge distance).  Loaded belt length b' = b − 2c.
 * Troughed: side length s = (b' − l)/2, trapezoid (l + W)/2 × s sin λ with W = l + 2 s cos λ; flat: W = b'.
 * Surcharge: circular segment over the chord W with edge angle β, R = W / (2 sin β), A_s = R² (β − sin β cos β).
 * Q = A v ρ;  lift power P = Q g H.  Schema units: SI — m, rad, m/s, kg/m³, kg/s, W.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';
import { GRAVITY_M_S2 } from '../shared/units.js';

const IN = 0.0254;
const FT2 = 0.09290304;
const FT3 = 0.028316846592;
const SHORT_TON = 907.18474;

/** CEMA standard edge distance, m, for a belt width b in m. */
export function edgeDistance(b) {
  return (0.055 * (b / IN) + 0.9) * IN;
}

/** Load cross-section, m²: belt width b, trough angle λ (0 for flat), surcharge angle β, centre roll length l. */
export function loadArea(b, lambda, beta, l) {
  const loaded = b - 2 * edgeDistance(b);
  let base = 0;
  let W = loaded;
  if (lambda > 0 && loaded > l) {
    const s = (loaded - l) / 2;
    W = l + 2 * s * Math.cos(lambda);
    base = ((l + W) / 2) * s * Math.sin(lambda);
  }
  const surcharge = beta > 0 ? (W / (2 * Math.sin(beta))) ** 2 * (beta - Math.sin(beta) * Math.cos(beta)) : 0;
  return { area: base + surcharge, loaded, top: W };
}

export const schema = {
  id: 'conveyor-belt',
  name: 'Belt conveyor speed and capacity calculator',
  category: 'manufacturing',
  summary: 'Belt speed from pulley diameter and rpm, and the capacity in t/h of a flat or troughed belt from width, angles and bulk density (CEMA method).',
  related: ['speeds-feeds', 'gear-ratio', 'torque-power-rpm', 'pump-power'],
  assumptions: [
    'Belt speed is the pulley circumference times its speed, measured at the pulley surface (include the lagging); belt slip and the belt thickness are neglected.',
    'The load lies on the belt width less the CEMA standard edge distance of 0.055 b + 0.9 in on each side, with a circular top surface meeting the belt edges at the surcharge angle, as in the CEMA standard cross-section.',
    'Troughed belts sit on three equal rolls; the gaps between the rolls are ignored. With the default centre roll of a third of the belt width the area is 2.5 to 3 % above the Precision Pulley & Idler table for 24 to 36 in belts at 20° surcharge (4.6 % at 0°); entering the real roll length (13 in for a 36 in belt) brings it within about 1 %.',
    'The surcharge angle is usually 5° to 15° less than the angle of repose of the material; capacity assumes the belt is evenly and fully loaded to that cross-section.',
    'Power is only the power to lift the load through the given height; belt, idler and skirt friction, accelerating the load and drive losses need the full CEMA or ISO 5048 method and are not included.',
  ],
  notes: [
    'Verification 2026-11-08: a 36 in belt on 35° three-equal-roll idlers with 13 in rolls and a 20° surcharge carries 0.991 ft² (CEMA edge distance 2.88 in); at 100 fpm that is 5 946 ft³/h against 5 886 ft³/h in the Precision Pulley & Idler table (+1.0 %). Driven by a 24 in pulley at 100 rpm the belt runs 628.3 fpm and carries 1 694 t/h of 100 lb/ft³ material; lifting it 30 ft takes 42.2 kW. Checked by hand.',
  ],
  sources: [
    'CEMA, Belt Conveyors for Bulk Materials, 7th ed., Chapter 4 (standard edge distance 0.055 b + 0.9 in, standard cross-sectional area of the load on three equal roll idlers, eq. 4.15)',
    'Precision Pulley & Idler, Idler selection guide, Table 2: 35° troughed belt, 3 equal rolls, capacity at 100 fpm (36 in belt, 20° surcharge, 5 886 ft³/h); surcharge angle 5–15° below the angle of repose',
  ],
  inputs: [
    { id: 'belt_type', label: 'Belt', type: 'select', default: 'troughed', options: [{ value: 'troughed', label: 'Troughed, three equal rolls' }, { value: 'flat', label: 'Flat belt' }] },
    { id: 'width_m', label: 'Belt width b', group: 'length', unit: 'm', display: 'in', default: 36 * IN, min: 0.2, max: 3.5 },
    { id: 'trough_deg', label: 'Trough angle λ', group: 'angle', unit: 'deg', default: 35, min: 5, max: 60, visibleWhen: { belt_type: 'troughed' } },
    { id: 'roll_m', label: 'Centre roll length (0 = a third of the belt width)', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 2, visibleWhen: { belt_type: 'troughed' } },
    { id: 'surcharge_deg', label: 'Surcharge angle β of the material', group: 'angle', unit: 'deg', default: 20, min: 0, max: 45 },
    { id: 'speed_mode', label: 'Belt speed', type: 'select', default: 'pulley', options: [{ value: 'pulley', label: 'From drive pulley diameter and rpm' }, { value: 'direct', label: 'Enter the belt speed' }] },
    { id: 'pulley_m', label: 'Drive pulley diameter (over lagging)', group: 'length', unit: 'm', display: 'in', default: 24 * IN, min: 0.05, max: 3, visibleWhen: { speed_mode: 'pulley' } },
    { id: 'pulley_rpm', label: 'Drive pulley speed', group: 'rotational_speed', unit: 'rpm', default: 100, min: 0.1, max: 2000, visibleWhen: { speed_mode: 'pulley' } },
    { id: 'speed_m_s', label: 'Belt speed v', group: 'speed', unit: 'm_s', display: 'fpm', default: 2.54, min: 0.01, max: 15, visibleWhen: { speed_mode: 'direct' } },
    { id: 'density', label: 'Bulk density of the material', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: 100 * 16.01846337396, min: 50, max: 5000 },
    { id: 'lift_m', label: 'Lift height (0 for a level belt)', group: 'length', unit: 'm', display: 'ft', default: 0, min: 0, max: 1000 },
  ],
  outputs: [
    { id: 'speed_out_m_s', label: 'Belt speed', group: 'speed', unit: 'm_s', display: 'fpm' },
    { id: 'edge_m', label: 'CEMA edge distance on each side', group: 'length', unit: 'm', display: 'in' },
    { id: 'area_m2', label: 'Load cross-section', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'volume_m3_s', label: 'Volumetric capacity', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'ft3_h_100fpm', label: 'Equivalent capacity at 100 fpm, ft³/h (for idler tables)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mass_kg_s', label: 'Capacity', group: 'mass_flow', unit: 'kg_s', display: 't_h' },
    { id: 'short_tph', label: 'Capacity, US short tons per hour', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'lift_w', label: 'Power to lift the load (no friction)', group: 'power', unit: 'W', display: 'kW' },
  ],
  example: {
    inputs: { belt_type: 'troughed', width_m: [36, 'in'], trough_deg: [35, 'deg'], roll_m: [13, 'in'], surcharge_deg: [20, 'deg'], speed_mode: 'pulley', pulley_m: [24, 'in'], pulley_rpm: [100, 'rpm'], density: [100, 'lb_ft3'], lift_m: [30, 'ft'] },
    results: { area_m2: '0.991 ft²', speed_out_m_s: '628.3 ft/min', mass_kg_s: '1 694 t/h', lift_w: '42.2 kW' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.belt_type, ['troughed', 'flat'], 'belt_type', 'Belt');
  assertOneOf(x.speed_mode, ['pulley', 'direct'], 'speed_mode', 'Belt speed');
  const b = assertRange(x.width_m, 0.2, 3.5, 'width_m', 'Belt width');
  const beta = (assertRange(x.surcharge_deg, 0, 45, 'surcharge_deg', 'Surcharge angle') * Math.PI) / 180;
  const rho = assertRange(x.density, 50, 5000, 'density', 'Bulk density');
  const H = assertNonNegative(x.lift_m, 'lift_m', 'Lift height');
  let lambda = 0;
  let l = 0;
  const warnings = [];
  if (x.belt_type === 'troughed') {
    lambda = (assertRange(x.trough_deg, 5, 60, 'trough_deg', 'Trough angle') * Math.PI) / 180;
    const roll = assertNonNegative(x.roll_m, 'roll_m', 'Centre roll length');
    l = roll > 0 ? roll : b / 3;
    if (l >= b) throw new Error('Centre roll length: it must be shorter than the belt width.');
  }
  const v = x.speed_mode === 'pulley'
    ? Math.PI * assertPositive(x.pulley_m, 'pulley_m', 'Drive pulley diameter') * (assertPositive(x.pulley_rpm, 'pulley_rpm', 'Drive pulley speed') / 60)
    : assertRange(x.speed_m_s, 0.01, 15, 'speed_m_s', 'Belt speed');
  const g = loadArea(b, lambda, beta, l);
  if (g.area <= 0) throw new Error('Surcharge angle: a flat belt with no surcharge carries no load; enter the surcharge angle of the material.');
  if (x.belt_type === 'troughed' && g.loaded <= l) warnings.push('The loaded width is no wider than the centre roll: the load sits on the centre roll only, as on a flat belt.');
  const Qv = g.area * v;
  const Qm = Qv * rho;
  return {
    outputs: {
      speed_out_m_s: v,
      edge_m: edgeDistance(b),
      area_m2: g.area,
      volume_m3_s: Qv,
      ft3_h_100fpm: (g.area / FT2) * 100 * 60,
      mass_kg_s: Qm,
      short_tph: (Qm * 3600) / SHORT_TON,
      lift_w: Qm * GRAVITY_M_S2 * H,
    },
    warnings,
  };
}
