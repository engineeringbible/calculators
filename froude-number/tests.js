/**
 * froude-number/tests.js — checks against Fn = V/√(gL), Fn_h = V/√(gh) and the regime bands.
 * Run: node run-tests.js froude-number
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KN = 1852 / 3600;
const G = 9.80665;

export const tests = [
  {
    name: '180 m ship at 14 kn: Fn = 0.171; in 20 m of water Fn_h = 0.514 and the critical speed is 27.2 kn',
    source: 'Lewis, PNA Vol. II ch. 5 (Fn = V/√(gL), critical speed √(gh)); hand calculation',
    run: () => {
      const o = calculate({ length_m: 180, speed_kn: 14, depth_m: 20 }).outputs;
      assertClose(o.fn, 0.171423, { abs: 1e-5 }, 'Fn');
      assertClose(o.fnh, 0.514270, { abs: 1e-5 }, 'Fn_h');
      assertClose(o.critical_kn, 27.2231, { abs: 1e-3 }, 'critical');
      assertClose(o.squat_limit_kn, 0.7 * 27.2231, { abs: 1e-3 }, 'Fn_h 0.7');
    },
  },
  {
    name: 'At hull speed (Fn = 1/√(2π) = 0.399) the transverse wave is exactly as long as the hull',
    source: 'Deep-water wave length λ = 2π V²/g (Lewis, PNA Vol. II ch. 5)',
    run: () => {
      const L = 100;
      const v = calculate({ length_m: L }).outputs.hull_speed_kn;
      const o = calculate({ length_m: L, speed_kn: v, depth_m: 0 }).outputs;
      assertClose(o.wave_length_m, L, { rel: 1e-9 }, 'λ = L');
      assertClose(o.fn, 0.398942, { abs: 1e-6 }, 'Fn');
      assertClose(o.hump_speed_kn, (0.5 * Math.sqrt(G * L)) / KN, { rel: 1e-12 }, 'hump');
    },
  },
  {
    name: 'Depth regimes: Fn_h 0.95 is critical and warns, 1.2 is supercritical; no depth means deep water',
    source: 'SVA Potsdam: subcritical < 0.9, critical 0.9–1.1, supercritical > 1.1',
    run: () => {
      const h = 10;
      const vCrit = Math.sqrt(G * h) / KN;
      const a = calculate({ depth_m: h, speed_kn: 0.95 * vCrit });
      assertEqual(a.outputs.depth_regime.startsWith('Critical'), true, 'critical');
      assertEqual(a.warnings.length, 1, 'warning');
      assertEqual(calculate({ depth_m: h, speed_kn: 1.2 * vCrit }).outputs.depth_regime.startsWith('Supercritical'), true, 'super');
      const deep = calculate({ depth_m: 0 }).outputs;
      assertEqual(deep.fnh, null, 'no Fn_h');
      assertEqual(deep.critical_kn, null, 'no critical speed');
    },
  },
  {
    name: 'Fast craft: 30 kn with ∇ = 3 m³ gives Fn_∇ = 15.433 / √(9.80665 × 1.4422) = 4.10, planing',
    source: 'Savitsky (2003): planing above Fn_∇ = 3; hand calculation',
    run: () => {
      const o = calculate({ length_m: 8, speed_kn: 30, depth_m: 0, volume_m3: 3 }).outputs;
      assertClose(o.fn_vol, 4.1037, { abs: 1e-3 }, 'Fn_vol');
      assertEqual(o.vol_regime.startsWith('Planing'), true, 'regime');
    },
  },
  {
    name: 'Zero length and a negative depth are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ length_m: 0 }), 'Waterline length must be greater than zero');
      assertThrows(() => calculate({ depth_m: -1 }), 'Water depth must not be negative');
    },
  },
];
