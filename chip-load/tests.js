/**
 * chip-load/tests.js — checks against the chip load definition and Dapra's published chip thinning adjustments.
 * Run: node run-tests.js chip-load
 */
import { calculate, rctf } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'Chip load: 40 in/min at 5 000 rpm with 4 flutes is 40 / (4 × 5 000) = 0.002 in per tooth; at half-diameter engagement the chip is not thinned',
    source: 'Harvey Tool: IPM = RPM × IPT × T (rearranged)',
    run: () => {
      const o = calculate({ mode: 'from_feed', feed_units: 'ipm', feed_rate: 40, rpm: 5000, flutes: 4, ae_m: 0.25 * IN }).outputs;
      assertClose(o.fz_m / IN, 0.002, { rel: 1e-12 }, 'fz');
      assertClose(o.rctf, 1, { rel: 1e-12 }, 'RCTF');
      assertClose(o.hex_m, o.fz_m, { rel: 1e-12 }, 'hex = fz');
      assertClose(o.angle_rad, Math.PI / 2, { rel: 1e-12 }, '90° engagement');
    },
  },
  {
    name: 'Dapra: 35 % radial engagement needs × 1.05; 5 % engagement allows 130 % more feed (factor 2.29)',
    source: 'Dapra Corporation, Radial chip thinning (published adjustments)',
    run: () => {
      assertClose(rctf(0.35), 1.05, { abs: 0.005 }, '35 %');
      assertClose(rctf(0.05), 2.294, { abs: 0.001 }, '5 %');
      assertClose(rctf(0.05) - 1, 1.3, { abs: 0.01 }, '+130 %');
    },
  },
  {
    name: '10 % engagement: RCTF = 1/√(1 − 0.8²) = 1.667; a 0.002 in chip needs 0.00333 in per tooth, 66.67 in/min instead of 40',
    source: 'RCTF = 1/√(1 − (1 − 2 a_e/D)²) (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'from_chip', target_m: 0.002 * IN, rpm: 5000, flutes: 4, diameter_m: 0.5 * IN, ae_m: 0.05 * IN }).outputs;
      assertClose(o.rctf, 5 / 3, { rel: 1e-12 }, 'RCTF');
      assertClose(o.feed_ipm, 66.6667, { abs: 0.0001 }, 'ipm');
      assertClose(o.feed_plain_ipm, 40, { rel: 1e-12 }, 'plain');
      assertClose(o.angle_rad * 180 / Math.PI, 36.870, { abs: 0.001 }, 'engagement angle');
    },
  },
  {
    name: 'Metric round trip: 600 mm/min at 8 000 rpm, 3 flutes = 0.025 mm per tooth; with 1 mm of a 10 mm cutter the chip is 0.015 mm, and asking for 0.015 mm gives 600 mm/min back',
    source: 'Consistency of the forward and inverse calculations',
    run: () => {
      const base = { feed_units: 'mm_min', rpm: 8000, flutes: 3, diameter_m: 0.01, ae_m: 0.001 };
      const a = calculate({ ...base, mode: 'from_feed', feed_rate: 600 }).outputs;
      assertClose(a.fz_m * 1000, 0.025, { rel: 1e-12 }, 'fz');
      assertClose(a.hex_m * 1000, 0.015, { rel: 1e-12 }, 'hex (RCTF 5/3)');
      const b = calculate({ ...base, mode: 'from_chip', target_m: a.hex_m }).outputs;
      assertClose(b.feed_mm_min, 600, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Very light cuts warn; a cut wider than the cutter, zero stepover and a fractional flute count are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ ae_m: 0.01 * IN }).warnings.length, 1, 'RCTF above 3');
      assertThrows(() => calculate({ ae_m: 0.6 * IN }), 'cannot exceed the cutter diameter');
      assertThrows(() => calculate({ ae_m: 0 }), 'Radial depth of cut');
      assertThrows(() => calculate({ flutes: 2.5 }), 'whole number');
    },
  },
];
