/**
 * stair-stringer/tests.js — checks against hand calculations and the IRC R311.7 and IBC §1011 limits.
 * Run: node run-tests.js stair-stringer
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: '108 in rise, risers ≤ 7.5 in, 10 in treads: 15 risers of 7.2 in, 14 treads, run 140 in, stringer 176.8 in, 2R + T = 24.4 in',
    source: 'Hand calculation: 108 / 7.5 = 14.4 → 15; 108 / 15 = 7.2; √(108² + 140²) = 176.82; atan(7.2/10) = 35.75°',
    run: () => {
      const o = calculate({ rise_m: 108 * IN, max_riser_m: 7.5 * IN, tread_m: 10 * IN, code: 'irc' }).outputs;
      assertEqual(o.risers, 15, 'risers');
      assertClose(o.riser_m / IN, 7.2, { abs: 1e-9 }, 'riser');
      assertEqual(o.treads, 14, 'treads');
      assertClose(o.run_m / IN, 140, { abs: 1e-9 }, 'run');
      assertClose(o.stringer_m / IN, 176.816, { abs: 1e-3 }, 'stringer');
      assertClose(o.angle_rad * 180 / Math.PI, 35.754, { abs: 1e-3 }, 'angle');
      assertClose(o.comfort_m / IN, 24.4, { abs: 1e-9 }, '2R + T');
      assertEqual(o.check.startsWith('Meets the IRC'), true, 'IRC ok');
    },
  },
  {
    name: 'IRC limit exactly: risers of 7¾ in and treads of 10 in pass (R311.7.5.1 and R311.7.5.2); a 9¾ in tread fails',
    source: 'IRC 2021 R311.7.5.1 (maximum riser 7¾ in) and R311.7.5.2 (minimum tread 10 in)',
    run: () => {
      const ok = calculate({ rise_m: 15.5 * IN, max_riser_m: 7.75 * IN, tread_m: 10 * IN, code: 'irc' }).outputs;
      assertEqual(ok.risers, 2, 'two risers');
      assertClose(ok.riser_m / IN, 7.75, { abs: 1e-9 }, 'riser');
      assertEqual(ok.check.startsWith('Meets'), true, 'passes');
      const bad = calculate({ rise_m: 15.5 * IN, max_riser_m: 7.75 * IN, tread_m: 9.75 * IN, code: 'irc' }).outputs;
      assertEqual(bad.check.includes('tread 9.75 in is below 10 in'), true, 'tread fails');
    },
  },
  {
    name: 'IBC: a 7¾ in riser fails the 7 in maximum; 11 in treads are required; 78 in of headroom fails the 80 in minimum',
    source: 'IBC 2021 §1011.5.2 (risers 4 to 7 in, treads 11 in minimum) and §1011.3 (headroom 80 in)',
    run: () => {
      const o = calculate({ rise_m: 108 * IN, max_riser_m: 7.75 * IN, tread_m: 10 * IN, code: 'ibc', headroom_m: 78 * IN }).outputs;
      assertEqual(o.check.includes('exceeds 7 in'), true, 'riser');
      assertEqual(o.check.includes('below 11 in'), true, 'tread');
      assertEqual(o.check.includes('headroom 78.0 in'), true, 'headroom');
      const good = calculate({ rise_m: 108 * IN, max_riser_m: 7 * IN, tread_m: 11 * IN, code: 'ibc', headroom_m: 84 * IN }).outputs;
      assertEqual(good.risers, 16, '108 / 7 = 15.4 → 16');
      assertClose(good.riser_m / IN, 6.75, { abs: 1e-9 }, 'riser');
      assertEqual(good.check.startsWith('Meets the IBC'), true, 'passes');
    },
  },
  {
    name: 'A rise of 160 in exceeds the IRC 151 in limit for one flight and calls for a landing',
    source: 'IRC 2021 R311.7.3: the vertical rise of a flight is limited to 151 in between floor levels or landings',
    run: () => {
      const r = calculate({ rise_m: 160 * IN, max_riser_m: 7.5 * IN, tread_m: 10 * IN });
      assertEqual(r.outputs.check.includes('a landing is needed'), true, 'landing');
      assertEqual(r.warnings.some((w) => w.includes('landing')), true, 'warning');
    },
  },
  {
    name: 'Comfort rule: 7.714 in risers on 10 in treads give 2R + T = 25.43 in and warn; rise 0 and an unknown code are rejected',
    source: 'Blondel stride rule 2R + T = 24 to 25 in; validation contract',
    run: () => {
      const r = calculate({ rise_m: 108 * IN, max_riser_m: 7.75 * IN, tread_m: 10 * IN, headroom_m: 84 * IN });
      assertEqual(r.outputs.risers, 14, 'risers');
      assertClose(r.outputs.comfort_m / IN, 25.4286, { abs: 1e-4 }, '2R + T');
      assertEqual(r.warnings.length, 1, 'comfort warning');
      assertThrows(() => calculate({ rise_m: 0 }), 'Total rise');
      assertThrows(() => calculate({ code: 'nbc' }), 'Check against');
    },
  },
];
