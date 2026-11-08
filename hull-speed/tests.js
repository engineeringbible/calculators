/**
 * hull-speed/tests.js — checks against V = 1.34 √LWL, Fn = V/√(gL), λ = 2πV²/g and Gerr's S/L = 8.26/(D/L)^0.311.
 * Run: node run-tests.js hull-speed
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;

export const tests = [
  {
    name: 'LWL 30 ft: hull speed 1.34 × √30 = 7.34 kn; the metric form 2.43 × √9.144 m agrees within 0.2 %',
    source: 'Gerr, The Propeller Handbook, ch. 2 (V = 1.34 √LWL); hand calculation',
    run: () => {
      const o = calculate({ lwl_m: 30 * FT }).outputs;
      assertClose(o.hull_speed_kn, 7.3395, { abs: 1e-4 }, 'hull speed');
      assertClose(o.hull_speed_kn, 2.43 * Math.sqrt(30 * FT), { rel: 0.002 }, 'metric form');
    },
  },
  {
    name: 'At hull speed the Froude number is 0.40 and the bow wave is as long as the waterline',
    source: 'Lewis, PNA Vol. II ch. 5: λ = 2π V²/g, so λ = L at Fn = 1/√(2π) = 0.399',
    run: () => {
      const L = 12;
      const v = 1.34 * Math.sqrt(L / FT);
      const o = calculate({ lwl_m: L, speed_kn: v }).outputs;
      assertClose(o.froude, 0.3987, { abs: 2e-4 }, 'Fn');
      assertClose(o.wave_length_m, L, { rel: 0.002 }, 'wave length');
      assertClose(o.sl_ratio, 1.34, { rel: 1e-9 }, 'S/L');
    },
  },
  {
    name: 'Gerr: 10 000 lb on 30 ft LWL is D/L 165, maximum S/L 1.69 and about 9.24 kn',
    source: 'Gerr, The Propeller Handbook, ch. 2 (D/L = long tons / (0.01 LWL)³, S/L = 8.26 / (D/L)^0.311); hand calculation',
    run: () => {
      const o = calculate({ lwl_m: 30 * FT, displacement_kg: 10000 * 0.45359237 }).outputs;
      assertClose(o.dl_ratio, 165.344, { abs: 0.01 }, 'D/L');
      assertClose(o.gerr_sl, 1.6868, { abs: 2e-4 }, 'S/L max');
      assertClose(o.gerr_speed_kn, 9.239, { abs: 0.002 }, 'speed');
    },
  },
  {
    name: 'Regimes: S/L 1.0 is displacement, 2.0 semi-displacement, 3.5 planing; planing starts at 3.0 √LWL',
    source: 'Gerr (displacement ≤ 1.34, semi-displacement 1.45–3.0, planing above 3.0)',
    run: () => {
      const L = 25 * FT;
      assertEqual(calculate({ lwl_m: L, speed_kn: 5 }).outputs.regime.startsWith('Displacement'), true, 'displacement');
      assertEqual(calculate({ lwl_m: L, speed_kn: 10 }).outputs.regime.startsWith('Semi-displacement'), true, 'semi');
      const o = calculate({ lwl_m: L, speed_kn: 17.5 }).outputs;
      assertEqual(o.regime.startsWith('Planing'), true, 'planing');
      assertClose(o.planing_speed_kn, 15, { rel: 1e-9 }, 'planing threshold');
    },
  },
  {
    name: 'A displacement of 0 skips Gerr; zero length is rejected; a very heavy hull warns',
    source: 'Validation contract',
    run: () => {
      const o = calculate({ displacement_kg: 0 }).outputs;
      assertEqual(o.dl_ratio, null, 'D/L');
      assertEqual(o.gerr_speed_kn, null, 'Gerr');
      assertThrows(() => calculate({ lwl_m: 0 }), 'Waterline length must be greater than zero');
      assertEqual(calculate({ lwl_m: 9, displacement_kg: 40000 }).warnings.length > 0, true, 'heavy');
    },
  },
];
