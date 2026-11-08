/**
 * chain-sprocket/tests.js — checks of Shigley eqs. 17-25 to 17-28 for roller chain drives.
 * Run: node run-tests.js chain-sprocket
 */
import { calculate, pitchDiameter, lengthPitches, centrePitches, chordalVariation } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '2 : 1 drive, 17 and 34 teeth, C = 25 pitches: L/p = 50 + 25.5 + 0.293 = 75.79 → 76 pitches; actual C = 25.104 pitches',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eqs. 17-27 and 17-28 (hand calculation with the data of the §17-5 design example)",
    run: () => {
      assertClose(lengthPitches(25, 17, 34), 75.7928, { abs: 1e-4 }, 'L/p');
      assertClose(centrePitches(76, 17, 34), 25.1042, { abs: 1e-4 }, 'C/p');
      const o = calculate({ chain: '200', n1_teeth: 17, n2_teeth: 34, speed_rpm: 300, c_m: 25 * 2.5 * 0.0254 }).outputs;
      assertEqual(o.links, 76, 'even links');
      assertClose(o.centre_m / 0.0254, 62.76, { abs: 0.01 }, 'C in inches');
    },
  },
  {
    name: 'Pitch diameter D = p / sin(180°/N): 1/2 in chain, 17 teeth = 2.721 in; 51 teeth = 8.122 in',
    source: 'Shigley eq. 17-25 (hand calculation)',
    run: () => {
      assertClose(pitchDiameter(0.5, 17), 2.7211, { abs: 1e-4 }, 'D17');
      assertClose(pitchDiameter(0.5, 51), 8.1220, { abs: 1e-4 }, 'D51');
    },
  },
  {
    name: 'No. 40, 17/51 teeth, 900 rpm, 500 mm: 300 rpm, 3.2385 m/s, 113.48 → 114 pitches (1 447.8 mm), C = 503.31 mm',
    source: 'Shigley eqs. 17-25 to 17-28 (hand calculation)',
    run: () => {
      const o = calculate({ chain: '40', n1_teeth: 17, n2_teeth: 51, speed_rpm: 900, c_m: 0.5 }).outputs;
      assertClose(o.n2_rpm, 300, { rel: 1e-12 }, 'n2');
      assertClose(o.chain_speed_m_s, 3.2385, { abs: 1e-6 }, 'V');
      assertClose(o.length_calc, 113.484, { abs: 1e-3 }, 'L/p');
      assertEqual(o.links, 114, 'links');
      assertClose(o.length_m * 1000, 1447.8, { abs: 1e-6 }, 'length');
      assertClose(o.centre_m * 1000, 503.308, { abs: 1e-3 }, 'C');
    },
  },
  {
    name: 'Equal sprockets: L/p = 2C/p + N exactly, and the centre distance inverts it; an exact even length keeps C',
    source: 'Limiting case N₁ = N₂ of eqs. 17-27 and 17-28',
    run: () => {
      assertClose(lengthPitches(40, 21, 21), 101, { rel: 1e-12 }, 'L/p');
      assertClose(centrePitches(102, 21, 21), 40.5, { rel: 1e-12 }, 'C/p');
    },
  },
  {
    name: 'Chordal speed variation: 1 − cos(180°/N) over N sin(180°/N)/π; 17 teeth 1.71 %, 25 teeth 0.79 %',
    source: 'Shigley §17-5, chordal speed variation of a roller chain (derived from V_max = rω, V_min = rω cos(180°/N))',
    run: () => {
      const n = 17;
      const direct = (Math.PI * (1 - Math.cos(Math.PI / n))) / (n * Math.sin(Math.PI / n));
      assertClose(chordalVariation(n), direct, { rel: 1e-12 }, 'identity');
      assertClose(chordalVariation(17) * 100, 1.712, { abs: 1e-3 }, '17');
      assertClose(chordalVariation(25) * 100, 0.7906, { abs: 1e-4 }, '25');
    },
  },
  {
    name: 'Small sprockets warn; overlapping sprockets, fractional tooth counts and unknown chain sizes are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ n1_teeth: 11 }).warnings.length, 1, 'warning');
      assertThrows(() => calculate({ c_m: 0.1 }), 'Desired centre distance');
      assertThrows(() => calculate({ n1_teeth: 17.5 }), 'whole number');
      assertThrows(() => calculate({ chain: '45' }), 'Chain size');
    },
  },
];
