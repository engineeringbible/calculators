/**
 * wire-size/tests.js — checks against hand calculations on the NEC Chapter 9 Table 8 resistance basis.
 * Run: node run-tests.js wire-size
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;

export const tests = [
  {
    name: '20 A at 120 V over 100 ft with 3 %: 7.24 mm² needed, 8 AWG at 2.60 % (3.12 V), 10 mm² metric at 2.17 %',
    source: 'ΔV = 2 I L R′ with R′ = ρ(75 °C) × 1.02 / A, ρ(75 °C) = 1.7241 × 10⁻⁸ × (1 + 0.00393 × 55) Ω·m (NEC Chapter 9 Table 8 basis)',
    run: () => {
      const { outputs } = calculate({ system: 'ac1', voltage_v: 120, current_a: 20, length_m: 100 * FT, max_drop: 0.03, material: 'copper', construction: 'stranded', temperature_c: 75 });
      assertClose(outputs.min_area_m2 * 1e6, 7.243, { abs: 0.001 }, 'A_min');
      assertEqual(outputs.awg, '8 AWG', 'AWG');
      assertClose(outputs.awg_drop, 0.02597, { abs: 1e-5 }, 'drop %');
      assertClose(outputs.awg_drop_v, 3.117, { abs: 0.001 }, 'drop V');
      assertClose(outputs.load_voltage_v, 116.883, { abs: 0.001 }, 'load V');
      assertEqual(outputs.iec, '10 mm²', 'IEC');
      assertClose(outputs.iec_drop, 0.02173, { abs: 1e-5 }, 'IEC drop');
    },
  },
  {
    name: 'Cross-check with the NEC table: 12 AWG stranded copper (1.98 Ω/1000 ft) on 20 A over 50 ft drops 3.96 V',
    source: 'NFPA 70 (2023) Chapter 9 Table 8: 12 AWG stranded uncoated copper 1.98 Ω/kft at 75 °C; ΔV = 2 × 20 × 50 × 1.98 / 1000',
    run: () => {
      const { outputs } = calculate({ system: 'ac1', voltage_v: 120, current_a: 20, length_m: 50 * FT, max_drop: 0.035 });
      assertEqual(outputs.awg, '12 AWG', 'AWG');
      assertClose(outputs.awg_drop_v, 3.96, { rel: 0.01 }, 'drop V');
      assertClose(outputs.loss_w, 2 * 20 * 20 * 50 * 1.98 / 1000, { rel: 0.01 }, 'loss');
    },
  },
  {
    name: 'Three-phase 100 A at 480 V over 200 ft with 3 %: 15.68 mm², 4 AWG from common sizes or 5 AWG from every gauge, 16 mm² metric',
    source: 'ΔV = √3 I L R′ for a balanced three-phase circuit (line-to-line drop)',
    run: () => {
      const common = calculate({ system: 'ac3', voltage_v: 480, current_a: 100, length_m: 200 * FT, max_drop: 0.03 }).outputs;
      assertClose(common.min_area_m2 * 1e6, 15.68, { abs: 0.01 }, 'A_min');
      assertEqual(common.awg, '4 AWG', 'common sizes');
      assertEqual(common.iec, '16 mm²', 'IEC');
      assertEqual(calculate({ system: 'ac3', voltage_v: 480, current_a: 100, length_m: 200 * FT, max_drop: 0.03, sizes: 'all' }).outputs.awg, '5 AWG', 'every gauge');
    },
  },
  {
    name: 'DC needs the same area as single-phase; aluminium needs 1.639 times the copper area; solid wire 1/1.02 of stranded',
    source: 'Factor 2 for DC and single-phase; resistivities 2.8264 and 1.7241 × 10⁻⁸ Ω·m; ASTM B8 2 % increment',
    run: () => {
      const base = { voltage_v: 12, current_a: 30, length_m: 6, max_drop: 0.03 };
      const dc = calculate({ ...base, system: 'dc' }).outputs.min_area_m2;
      assertClose(calculate({ ...base, system: 'ac1' }).outputs.min_area_m2, dc, { rel: 1e-12 }, 'dc = ac1');
      assertClose(calculate({ ...base, system: 'dc', material: 'aluminium' }).outputs.min_area_m2 / dc, (2.8264 * (1 + 0.00403 * 55)) / (1.7241 * (1 + 0.00393 * 55)), { rel: 1e-12 }, 'Al');
      assertClose(calculate({ ...base, system: 'dc', construction: 'solid' }).outputs.min_area_m2, dc / 1.02, { rel: 1e-12 }, 'solid');
    },
  },
  {
    name: '400 A at 400 V over 200 m needs more than 4/0: the AWG outputs are empty and a warning names the remedy; bad inputs are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const r = calculate({ system: 'ac3', voltage_v: 400, current_a: 400, length_m: 200, max_drop: 0.03 });
      assertEqual(r.outputs.awg, 'Larger than 4/0', 'AWG');
      assertEqual(r.outputs.awg_drop, null, 'no drop');
      assertEqual(r.warnings.some((w) => w.includes('No size up to 4/0')), true, 'warning');
      assertThrows(() => calculate({ current_a: 0 }), 'Load current must be greater than zero');
      assertThrows(() => calculate({ max_drop: 0.5 }), 'Allowed voltage drop');
      assertThrows(() => calculate({ sizes: 'odd' }), 'AWG sizes to choose from');
    },
  },
];
