/**
 * awg-wire-gauge/tests.js — checks against ASTM B258 geometry, NEC Chapter 9 Table 8 resistances and published weights.
 * Run: node run-tests.js awg-wire-gauge
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CMIL_M2 = (Math.PI / 4) * 0.0000254 ** 2;

export const tests = [
  {
    name: '12 AWG solid copper at 20 °C: 2.053 mm, 3.309 mm², 6 530 cmil, 5.211 Ω/km, 1.588 Ω/1000 ft, next IEC size 4 mm²',
    source: 'ASTM B258-18 Table 1 (0.0808 in, 6 530 cmil); IEC 60028 ρ = 1.7241 × 10⁻⁸ Ω·m',
    run: () => {
      const { outputs } = calculate({ mode: 'gauge', gauge: '12', material: 'copper', construction: 'solid', temperature_c: 20 });
      assertClose(outputs.diameter_out_m * 1000, 2.053, { abs: 5e-4 }, 'd');
      assertClose(outputs.area_out_m2 * 1e6, 3.309, { abs: 5e-4 }, 'A');
      assertClose(outputs.area_kcmil_m2 / CMIL_M2, 6530, { rel: 1e-3 }, 'cmil');
      assertClose(outputs.resistance_ohm_km, 5.211, { abs: 5e-4 }, 'R');
      assertClose(outputs.resistance_kft_ohm_km * 0.3048, 1.588, { abs: 5e-4 }, 'R per kft');
      assertEqual(outputs.iec, '4 mm²', 'IEC');
      assertEqual(outputs.awg, '12 AWG', 'name');
    },
  },
  {
    name: '4/0 is 0.4600 in and 211.6 kcmil; 1/0 is 105.5 kcmil; 40 AWG is 0.0031 in',
    source: 'ASTM B258-18 Table 1',
    run: () => {
      const big = calculate({ gauge: '0000' }).outputs;
      assertClose(big.diameter_out_m / 0.0254, 0.46, { abs: 5e-5 }, '4/0 d');
      assertClose(big.area_kcmil_m2 / CMIL_M2 / 1000, 211.6, { abs: 0.05 }, '4/0 kcmil');
      assertEqual(big.awg, '4/0 AWG', '4/0 name');
      assertClose(calculate({ gauge: '0' }).outputs.area_kcmil_m2 / CMIL_M2 / 1000, 105.5, { abs: 0.05 }, '1/0 kcmil');
      assertClose(calculate({ gauge: '40' }).outputs.diameter_out_m / 0.0254, 0.0031, { abs: 5e-5 }, '40 d');
    },
  },
  {
    name: 'Stranded 10 AWG copper at 75 °C is 1.24 Ω/1000 ft; aluminium is 1.639 times copper at 20 °C',
    source: 'NFPA 70 (2023) Chapter 9 Table 8; resistivities 1.7241 and 2.8264 × 10⁻⁸ Ω·m',
    run: () => {
      const r = calculate({ gauge: '10', construction: 'stranded', temperature_c: 75 }).outputs.resistance_kft_ohm_km * 0.3048;
      assertClose(r, 1.24, { rel: 0.005 }, 'stranded 10 AWG');
      const cu = calculate({ gauge: '6' }).outputs.resistance_ohm_km;
      const al = calculate({ gauge: '6', material: 'aluminium' }).outputs.resistance_ohm_km;
      assertClose(al / cu, 2.8264 / 1.7241, { rel: 1e-12 }, 'Al/Cu');
    },
  },
  {
    name: 'Weight of 12 AWG copper is 19.77 lb per 1000 ft (29.4 kg/km)',
    source: 'ASTM B258 area with copper density 8.89 g/cm³ (the basis of published AWG weight tables: 19.77 lb/1000 ft)',
    run: () => {
      const m = calculate({ gauge: '12' }).outputs.mass_kg_m;
      assertClose(m * 304.8 / 0.45359237, 19.77, { abs: 0.01 }, 'lb/kft');
    },
  },
  {
    name: 'From a measurement: 2.588 mm is exactly 10 AWG; 2.0 mm is gauge 12.22, so 12 AWG is the next larger; 2.5 mm² needs 13 AWG and is 2.5 mm² metric',
    source: 'Inverse of the ASTM B258 formula: n = 36 − 39 log(d / 0.005 in) / log 92',
    run: () => {
      const ten = calculate({ mode: 'diameter', diameter_m: 0.0025882 }).outputs;
      assertClose(ten.gauge_number, 10, { abs: 0.01 }, '10 AWG');
      const two = calculate({ mode: 'diameter', diameter_m: 0.002 }).outputs;
      assertClose(two.gauge_number, 12.22, { abs: 0.01 }, '2 mm gauge');
      assertEqual(two.awg, '12 AWG', '2 mm next larger');
      const a = calculate({ mode: 'area', area_m2: 2.5e-6 }).outputs;
      assertEqual(a.awg, '13 AWG', '2.5 mm²');
      assertEqual(a.iec, '2.5 mm²', 'IEC');
    },
  },
  {
    name: 'A cross-section of 120 mm² is beyond 4/0 and warns; a size between gauges warns; bad inputs are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const big = calculate({ mode: 'area', area_m2: 120e-6 });
      assertEqual(big.outputs.awg, 'Larger than 4/0: use kcmil sizes', 'beyond 4/0');
      assertEqual(big.warnings.length, 1, 'beyond warning');
      assertEqual(calculate({ mode: 'diameter', diameter_m: 0.0024 }).warnings.length, 1, 'between gauges');
      assertThrows(() => calculate({ gauge: '41' }), 'Gauge');
      assertThrows(() => calculate({ mode: 'diameter', diameter_m: 0 }), 'Bare conductor diameter must be greater than zero');
    },
  },
];
