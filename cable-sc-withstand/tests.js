/**
 * cable-sc-withstand/tests.js — k factors, loop impedance, fault current and the adiabatic check.
 * Run: node run-tests.js cable-sc-withstand
 */
import { calculate, kFactor } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const R90 = (0.017241 / 16) * (324.5 / 254.5);

export const tests = [
  {
    name: 'k from IEC 60949 reproduces the tabulated values: copper 115 (PVC), 103 (PVC > 300 mm²), 143 (XLPE), 141 (rubber 60 °C); aluminium 76 (PVC), 94 (XLPE)',
    source: 'IEC 60949 constants; IEC 60364-4-43 Table 43A / IEC 60364-5-54 Annex A',
    run: () => {
      assertClose(kFactor('copper', 70, 160), 115, { abs: 0.5 }, 'Cu PVC');
      assertClose(kFactor('copper', 70, 140), 103, { abs: 0.5 }, 'Cu PVC > 300');
      assertClose(kFactor('copper', 90, 250), 143, { abs: 0.5 }, 'Cu XLPE');
      assertClose(kFactor('copper', 60, 200), 141, { abs: 0.5 }, 'Cu rubber');
      assertClose(kFactor('aluminium', 70, 160), 76, { abs: 0.5 }, 'Al PVC');
      assertClose(kFactor('aluminium', 90, 250), 94, { abs: 0.6 }, 'Al XLPE');
    },
  },
  {
    name: 'Loop impedance and fault current: 16 mm² copper at 90 °C over 50 m and Ze = 0.35 Ω give Zs = 0.4874 Ω and If = 0.95 × 230/Zs = 448.3 A',
    source: 'R(θ) = R20 (β + θ)/(β + 20); If = c U0/Zs (IEC 60909-0 c_min = 0.95)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.zs_ohm, 0.35 + 2 * 50 * R90, { rel: 1e-12 }, 'Zs');
      assertClose(outputs.fault_current_a, (0.95 * 230) / (0.35 + 2 * 50 * R90), { rel: 1e-12 }, 'If');
      assertClose(outputs.fault_current_a, 448.3, { abs: 0.05 }, 'value');
    },
  },
  {
    name: 'Adiabatic limits: the 16 mm² protective conductor withstands the 448 A fault for (k S/I)² = 26.1 s; the smallest conductor for 0.1 s is I √t / k = 0.99 mm²',
    source: 'IEC 60364-4-43 434.5.2: t = (k S/I)²',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.cpc_max_time_s, ((outputs.k_cpc * 16) / outputs.fault_current_a) ** 2, { rel: 1e-12 }, 't max');
      assertClose(outputs.min_cpc_csa_mm2, (outputs.fault_current_a * Math.sqrt(0.1)) / outputs.k_cpc, { rel: 1e-12 }, 'S min');
    },
  },
  {
    name: 'A 2.5 mm² cable 5 m from the board (Ze 0.02 Ω) for 0.2 s lets through 8.2 × 10⁵ A²s against 1.28 × 10⁵: both conductors fail and 6.3 mm² is needed',
    source: 'I²t ≤ k²S² (IEC 60364-4-43 434.5.2)',
    run: () => {
      const { outputs, warnings } = calculate({ ze_ohm: 0.02, cpc_csa_mm2: 2.5, line_csa_mm2: 2.5, length_m: 5, device_time_s: 0.2 });
      assertEqual(outputs.line_utilisation > 1 && outputs.cpc_utilisation > 1, true, 'fails');
      assertClose(outputs.min_cpc_csa_mm2, 6.33, { abs: 0.01 }, 'S min');
      assertEqual(warnings.some((w) => w.includes('does not withstand')), true, 'warning');
    },
  },
  {
    name: 'The device let-through energy, when entered, replaces I² t; a device slower than the permitted time is flagged',
    source: 'IEC 60364-4-43 434.5.2 (current-limiting devices); IEC 60364-4-41 disconnection times',
    run: () => {
      assertEqual(calculate({ let_through_a2s: 50000 }).outputs.energy_a2s, 50000, 'let-through');
      assertEqual(calculate({ device_time_s: 1, max_disconnection_s: 0.4 }).warnings.some((w) => w.includes('longer than the permitted')), true, 'too slow');
    },
  },
  {
    name: 'A data-sheet resistance of 1.15 Ω/km at 20 °C is corrected to 90 °C by (234.5 + 90)/(234.5 + 20)',
    source: 'Temperature correction with β = 234.5 °C for copper (IEC 60949, IEC 60228)',
    run: () => {
      const { outputs } = calculate({ line_r20_ohm_km: 1.15, cpc_r20_ohm_km: 1.15 });
      assertClose(outputs.zs_ohm, 0.35 + ((2 * 50 * 1.15) / 1000) * (324.5 / 254.5), { rel: 1e-12 }, 'Zs');
    },
  },
  {
    name: 'Invalid inputs are rejected: a custom final temperature below the initial one, zero length',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ insulation: 'custom', custom_initial_c: 90, custom_final_c: 80 }), 'above the initial temperature');
      assertThrows(() => calculate({ length_m: 0 }), 'greater than zero');
    },
  },
];
