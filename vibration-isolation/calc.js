/**
 * vibration-isolation/calc.js — single-degree-of-freedom isolation of a machine on resilient mounts (natural frequency,
 * static deflection, force transmissibility and isolation efficiency at the disturbing frequency) and the evaluation
 * zone of a measured vibration velocity on the ISO 10816-3 / ISO 20816-3 boundaries for industrial machines.
 *
 * f_n = (1/2π) √(k/m);  δ_st = m g/k;  r = f/f_n;  T = √((1 + (2ζr)²) / ((1 − r²)² + (2ζr)²));  efficiency = 1 − T
 * Schema units: kg, N/mm, Hz, rpm, mm/s r.m.s.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

const G = 9.80665;
/** Zone boundaries A/B, B/C, C/D, velocity r.m.s. mm/s (ISO 10816-3:2009 Annex A; retained in ISO 20816-3:2022). */
export const ZONES = {
  group1: { rigid: [2.3, 4.5, 7.1], flexible: [3.5, 7.1, 11.0] },
  group2: { rigid: [1.4, 2.8, 4.5], flexible: [2.3, 4.5, 7.1] },
};
const ZONE_TEXT = {
  A: 'A — vibration of newly commissioned machines',
  B: 'B — acceptable for unrestricted long-term operation',
  C: 'C — unsatisfactory for long-term continuous operation',
  D: 'D — severe enough to cause damage',
};

export const schema = {
  id: 'vibration-isolation',
  name: 'Vibration isolation and severity',
  category: 'mechanical',
  summary: 'Isolator natural frequency and transmissibility of a machine on resilient mounts, and the ISO 10816-3 evaluation zone of a measured vibration velocity.',
  related: ['helical-spring', 'shaft-torque', 'engine-room-ventilation', 'bearing-life'],
  assumptions: [
    'The machine is a rigid mass on mounts acting in parallel in one direction (single degree of freedom) with viscous damping ratio ζ; rocking modes, the flexibility of the foundation and the frequency dependence of rubber stiffness are not included.',
    'Force transmissibility T = √((1 + (2ζr)²)/((1 − r²)² + (2ζr)²)) with r = f/f_n; isolation starts above r = √2, and the isolation efficiency is 1 − T (Harris\' Shock and Vibration Handbook, ch. 30).',
    'Evaluation zones of ISO 10816-3:2009 Annex A for machines above 15 kW at 120–15 000 r/min, broadband velocity r.m.s. measured on the bearing housings: group 1 (large machines, 300 kW to 50 MW) and group 2 (medium, 15 kW to 300 kW), each for rigid and flexible support. The same boundaries appear in ISO 20816-3:2022. The standards are not freely available, so the values were checked against several independent published reproductions.',
    'Support classification of ISO 10816-3: rigid if the lowest natural frequency of machine and support is at least 25 % above the main excitation frequency, otherwise flexible; with the automatic option the mount natural frequency decides.',
  ],
  notes: [
    'Verification 2026-10-31: 2000 kg on four mounts of 1500 N/mm gives f_n = (1/2π)√(6 × 10^6/2000) = 8.72 Hz and 3.27 mm static deflection; at 25 Hz (1500 r/min) r = 2.87 and with ζ = 0.05 T = 0.144, 86 % isolation.',
    'Design decision: zone C/D and the other boundaries are taken as "at or above"; the zones are a first assessment and the machine maker\'s limits, where given, take precedence.',
  ],
  sources: [
    'C. M. Harris, A. G. Piersol (eds.), Harris\' Shock and Vibration Handbook, 5th ed., McGraw-Hill 2002, ch. 2 and ch. 30 — transmissibility and vibration isolation',
    'ISO 10816-3:2009 Mechanical vibration — Evaluation of machine vibration by measurements on non-rotating parts — Part 3, Annex A zone boundaries; superseded by ISO 20816-3:2022 with the same zones',
  ],
  inputs: [
    { id: 'mass_kg', label: 'Machine mass on the mounts', group: 'mass', unit: 'kg', default: 2000, min: 1, max: 1e6 },
    { id: 'mounts', label: 'Number of mounts', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 50, integer: true },
    { id: 'mount_stiffness_n_mm', label: 'Stiffness of each mount (dynamic)', group: 'stiffness', unit: 'N_mm', default: 1500, min: 1, max: 1e7 },
    { id: 'damping_ratio', label: 'Damping ratio ζ of the mounts', group: 'dimensionless', unit: 'none', default: 0.05, min: 0, max: 1 },
    { id: 'speed_rpm', label: 'Machine speed', group: 'rotational_speed', unit: 'rpm', default: 1500, min: 1, max: 100000 },
    { id: 'order', label: 'Excitation order (1 = once per revolution)', group: 'dimensionless', unit: 'none', default: 1, min: 0.1, max: 50 },
    { id: 'velocity_mm_s', label: 'Measured vibration velocity (r.m.s.)', group: 'speed', unit: 'mm_s', default: 3, min: 0, max: 1000 },
    {
      id: 'machine_group',
      label: 'Machine group (ISO 10816-3)',
      type: 'select',
      default: 'group2',
      options: [
        { value: 'group1', label: 'Group 1: large machines, 300 kW to 50 MW' },
        { value: 'group2', label: 'Group 2: medium machines, 15 kW to 300 kW' },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: 'From the mount natural frequency' },
        { value: 'rigid', label: 'Rigid' },
        { value: 'flexible', label: 'Flexible' },
      ],
    },
  ],
  outputs: [
    { id: 'natural_frequency_hz', label: 'Natural frequency on the mounts', group: 'frequency', unit: 'Hz' },
    { id: 'static_deflection_mm', label: 'Static deflection', group: 'length', unit: 'mm' },
    { id: 'excitation_hz', label: 'Disturbing frequency', group: 'frequency', unit: 'Hz' },
    { id: 'frequency_ratio', label: 'Frequency ratio r', group: 'dimensionless', unit: 'none' },
    { id: 'transmissibility', label: 'Force transmissibility T', group: 'dimensionless', unit: 'none' },
    { id: 'isolation_pct', label: 'Isolation efficiency (1 − T)', group: 'ratio', unit: 'pct' },
    { id: 'isolation_db', label: 'Isolation (20 log 1/T)', group: 'dimensionless', unit: 'none' },
    { id: 'zone', label: 'Evaluation zone of the measured velocity', type: 'text' },
    { id: 'zone_table', label: 'Zone boundaries used', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      natural_frequency_hz: '8.72 Hz',
      static_deflection_mm: '3.27 mm',
      excitation_hz: '25 Hz',
      frequency_ratio: '2.87',
      transmissibility: '0.144',
      isolation_pct: '86 %',
    },
  },
};

/** Force transmissibility of a damped single-degree-of-freedom isolator at frequency ratio r. */
export function transmissibility(r, zeta) {
  const num = 1 + (2 * zeta * r) ** 2;
  const den = (1 - r * r) ** 2 + (2 * zeta * r) ** 2;
  return Math.sqrt(num / den);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.mass_kg, 'mass_kg', 'Machine mass');
  assertInteger(i.mounts, 'mounts', 'Number of mounts');
  assertRange(i.mounts, 1, 1000, 'mounts', 'Number of mounts');
  assertPositive(i.mount_stiffness_n_mm, 'mount_stiffness_n_mm', 'Mount stiffness');
  assertRange(i.damping_ratio, 0, 1, 'damping_ratio', 'Damping ratio');
  assertPositive(i.speed_rpm, 'speed_rpm', 'Machine speed');
  assertPositive(i.order, 'order', 'Excitation order');
  assertRange(i.velocity_mm_s, 0, 10000, 'velocity_mm_s', 'Measured velocity');
  assertOneOf(i.machine_group, ['group1', 'group2'], 'machine_group', 'Machine group');
  assertOneOf(i.support, ['auto', 'rigid', 'flexible'], 'support', 'Support');

  const stiffness = i.mounts * i.mount_stiffness_n_mm * 1000;
  const fn = Math.sqrt(stiffness / i.mass_kg) / (2 * Math.PI);
  const deflection = ((i.mass_kg * G) / stiffness) * 1000;
  const f = (i.speed_rpm / 60) * i.order;
  const r = f / fn;
  const t = transmissibility(r, i.damping_ratio);
  const support = i.support === 'auto' ? (fn >= 1.25 * f ? 'rigid' : 'flexible') : i.support;
  const bounds = ZONES[i.machine_group][support];
  const zone = i.velocity_mm_s < bounds[0] ? 'A' : i.velocity_mm_s < bounds[1] ? 'B' : i.velocity_mm_s < bounds[2] ? 'C' : 'D';

  const warnings = [];
  if (r < Math.SQRT2) warnings.push(`The disturbing frequency is only ${r.toFixed(2)} times the natural frequency: below √2 the mounts amplify the force instead of isolating it.`);
  if (Math.abs(r - 1) < 0.2) warnings.push('Near resonance: the machine will shake on its mounts; change the mount stiffness.');
  if (i.damping_ratio === 0) warnings.push('Zero damping: the transmissibility at resonance is unbounded.');
  if (zone === 'C' || zone === 'D') warnings.push(`Zone ${zone}: ${ZONE_TEXT[zone].slice(4)}.`);
  warnings.push('Starting and stopping pass through the natural frequency; check the run-up, rocking modes and the machine maker\'s vibration limits.');

  return {
    outputs: {
      natural_frequency_hz: fn,
      static_deflection_mm: deflection,
      excitation_hz: f,
      frequency_ratio: r,
      transmissibility: t,
      isolation_pct: (1 - t) * 100,
      isolation_db: 20 * Math.log10(1 / t),
      zone: `${ZONE_TEXT[zone]} (${i.machine_group === 'group1' ? 'group 1' : 'group 2'}, ${support} support)`,
      zone_table: {
        columns: ['Zone', 'Velocity r.m.s. (mm/s)', 'Meaning'],
        rows: [
          ['A', `below ${bounds[0]}`, ZONE_TEXT.A.slice(4)],
          ['B', `${bounds[0]} to ${bounds[1]}`, ZONE_TEXT.B.slice(4)],
          ['C', `${bounds[1]} to ${bounds[2]}`, ZONE_TEXT.C.slice(4)],
          ['D', `${bounds[2]} and above`, ZONE_TEXT.D.slice(4)],
        ],
      },
      summary: `Natural frequency ${fn.toFixed(2)} Hz (${deflection.toFixed(2)} mm static deflection); at ${f.toFixed(1)} Hz the transmissibility is ${t.toFixed(3)}, ${((1 - t) * 100).toFixed(0)} % isolation. ${i.velocity_mm_s} mm/s is in zone ${zone}.`,
    },
    warnings,
  };
}
