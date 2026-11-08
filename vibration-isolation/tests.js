/**
 * vibration-isolation/tests.js — natural frequency, transmissibility and ISO 10816-3 evaluation zones.
 * Run: node run-tests.js vibration-isolation
 */
import { calculate, transmissibility } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '2000 kg on four 1500 N/mm mounts: f_n = (1/2π)√(6 × 10⁶/2000) = 8.717 Hz and 3.27 mm static deflection, consistent with f_n = (1/2π)√(g/δ)',
    source: 'Single-degree-of-freedom system (Harris, ch. 2)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.natural_frequency_hz, Math.sqrt(6e6 / 2000) / (2 * Math.PI), { rel: 1e-12 }, 'f_n');
      assertClose(outputs.static_deflection_mm, (2000 * 9.80665) / 6e6 * 1000, { rel: 1e-12 }, 'δ');
      assertClose(outputs.natural_frequency_hz, Math.sqrt(9.80665 / (outputs.static_deflection_mm / 1000)) / (2 * Math.PI), { rel: 1e-12 }, 'from δ');
    },
  },
  {
    name: 'Transmissibility is 1 at r = √2 for any damping, 1/|1 − r²| = 0.125 at r = 3 without damping, and √(1 + 4ζ²)/(2ζ) = 10.05 at resonance with ζ = 0.05',
    source: 'Force transmissibility of a damped isolator (Harris, ch. 30)',
    run: () => {
      [0, 0.1, 0.5].forEach((zeta) => assertClose(transmissibility(Math.SQRT2, zeta), 1, { rel: 1e-12 }, `ζ = ${zeta}`));
      assertClose(transmissibility(3, 0), 0.125, { rel: 1e-12 }, 'undamped');
      assertClose(transmissibility(1, 0.05), Math.sqrt(1.01) / 0.1, { rel: 1e-12 }, 'resonance');
    },
  },
  {
    name: 'Default machine at 1500 r/min: r = 25/8.717 = 2.868, T = 0.144, 86 % isolation',
    source: 'Force transmissibility with ζ = 0.05',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.frequency_ratio, 25 / (Math.sqrt(3000) / (2 * Math.PI)), { rel: 1e-12 }, 'r');
      assertClose(outputs.transmissibility, transmissibility(outputs.frequency_ratio, 0.05), { rel: 1e-12 }, 'T');
      assertClose(outputs.transmissibility, 0.144, { abs: 0.0005 }, 'value');
      assertClose(outputs.isolation_pct, 85.6, { abs: 0.05 }, 'isolation');
    },
  },
  {
    name: 'ISO 10816-3 zones: 3.0 mm/s is zone C for a group 2 machine on a rigid support (1.4/2.8/4.5) and zone A for group 1 on a flexible support (3.5/7.1/11)',
    source: 'ISO 10816-3:2009 Annex A, Tables A.1 and A.2',
    run: () => {
      assertEqual(calculate({ support: 'rigid' }).outputs.zone.startsWith('C'), true, 'group 2 rigid');
      assertEqual(calculate({ machine_group: 'group1', support: 'flexible' }).outputs.zone.startsWith('A'), true, 'group 1 flexible');
      assertEqual(calculate({ velocity_mm_s: 7.1, support: 'flexible' }).outputs.zone.startsWith('D'), true, 'boundary C/D');
    },
  },
  {
    name: 'Resilient mounts below 1.25 × the excitation frequency make the support flexible: the default 3.0 mm/s is then zone B (2.3/4.5/7.1)',
    source: 'ISO 10816-3: rigid support when the lowest natural frequency is at least 25 % above the main excitation',
    run: () => {
      const { outputs } = calculate({});
      assertEqual(outputs.zone.includes('flexible support'), true, 'flexible');
      assertEqual(outputs.zone.startsWith('B'), true, 'zone B');
    },
  },
  {
    name: 'Invalid inputs are rejected: zero mass, a fractional number of mounts, damping above 1',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ mass_kg: 0 }), 'greater than zero');
      assertThrows(() => calculate({ mounts: 2.5 }), 'whole number');
      assertThrows(() => calculate({ damping_ratio: 1.5 }), 'must be between');
    },
  },
];
