/**
 * engine-displacement/tests.js — checks against published bore, stroke and displacement of production engines.
 * Run: node run-tests.js engine-displacement
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const IN3 = IN ** 3;

export const tests = [
  {
    name: 'Honda K20: 86 × 86 mm, 4 cylinders is 1 998 cc; Toyota 2JZ: 86 × 86 mm, 6 cylinders is 2 997 cc',
    source: 'Honda and Toyota published specifications (1 998 cc and 2 997 cc)',
    run: () => {
      const k20 = calculate({ bore_m: 0.086, stroke_m: 0.086, cylinders: 4 }).outputs;
      assertClose(k20.displacement_cc_m3 * 1e6, 1998, { abs: 0.5 }, 'K20');
      assertEqual(k20.design, 'Square (bore ≈ stroke)', 'square');
      const jz = calculate({ bore_m: 0.086, stroke_m: 0.086, cylinders: 6 }).outputs;
      assertClose(jz.displacement_cc_m3 * 1e6, 2997, { abs: 0.5 }, '2JZ');
    },
  },
  {
    name: 'GM LS3: 4.065 × 3.622 in × 8 is 376 cu in (6.2 L); small-block 350: 4.00 × 3.48 in is 349.9 cu in',
    source: 'GM published specifications (LS3 6.2 L / 376 cu in; 350 cu in, 5.7 L)',
    run: () => {
      const ls3 = calculate({ bore_m: 4.065 * IN, stroke_m: 3.622 * IN, cylinders: 8 }).outputs;
      assertClose(ls3.displacement_m3 / IN3, 376.05, { abs: 0.01 }, 'LS3 in³');
      assertClose(ls3.displacement_l_m3 * 1000, 6.162, { abs: 0.001 }, 'LS3 L');
      const sbc = calculate({ bore_m: 4 * IN, stroke_m: 3.48 * IN, cylinders: 8 }).outputs;
      assertClose(sbc.displacement_m3 / IN3, 349.85, { abs: 0.01 }, '350');
    },
  },
  {
    name: 'Inverse: 350 cu in with a 3.48 in stroke needs a 4.001 in bore; 2.0 L from an 86 mm bore and 4 cylinders needs an 86.08 mm stroke',
    source: 'Rearranged V = π/4 b² s n; consistency with the forward calculation',
    run: () => {
      const b = calculate({ mode: 'bore', volume_m3: 350 * IN3, stroke_m: 3.48 * IN, cylinders: 8 }).outputs;
      assertClose(b.bore_out_m / IN, 4.00087, { abs: 1e-5 }, 'bore');
      assertClose(b.displacement_m3 / IN3, 350, { rel: 1e-12 }, 'round trip');
      const s = calculate({ mode: 'stroke', volume_m3: 0.002, bore_m: 0.086, cylinders: 4 }).outputs;
      assertClose(s.stroke_out_m * 1000, 86.08, { abs: 0.01 }, 'stroke');
    },
  },
  {
    name: 'Mean piston speed: 3.622 in stroke at 6 600 rpm is 2 × 3.622/12 × 6 600 = 3 984 ft/min (20.24 m/s)',
    source: 'Heywood Section 2.2, S_p = 2 L N',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.piston_speed_m_s / 0.00508, 3984.2, { abs: 0.01 }, 'ft/min');
      assertEqual(calculate({ rpm: 0 }).outputs.piston_speed_m_s, null, 'no rpm');
    },
  },
  {
    name: 'Fractional cylinders, zero bore and an unknown mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ cylinders: 3.5 }), 'whole number');
      assertThrows(() => calculate({ bore_m: 0 }), 'Cylinder bore');
      assertThrows(() => calculate({ mode: 'rotary' }), 'Calculate');
    },
  },
];
