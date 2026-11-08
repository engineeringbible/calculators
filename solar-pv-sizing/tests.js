/**
 * solar-pv-sizing/tests.js — checks against published stand-alone sizing examples and the NEC/IEEE sizing rules.
 * Run: node run-tests.js solar-pv-sizing
 */
import { calculate, BATTERY_TYPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CASE = { daily_load_wh: 8500, peak_load_w: 3000, psh_h: 4.8, system_efficiency: 0.75, design_margin_pct: 0, module_w: 400, module_voc_v: 49, module_isc_a: 10.5, modules_series: 2, min_temp_c: -5, controller_max_v: 150, controller_type: 'mppt', battery_v: 48, battery_type: 'lifepo4', autonomy_days: 2, inverter_eff: 0.92 };

export const tests = [
  {
    name: 'Array: 8.5 kWh/day at 4.8 PSH and 75 % efficiency → 2.36 kW_p (published example); with a 15 % margin 2.72 kW_p; 400 W modules in strings of 2 → 3 strings, 6 modules, 2.4 kW installed',
    source: 'Firgelli off-grid sizing example (8.5 kWh, 4.8 h, 75 % → 2.36 kW; +15 % margin); IEEE 1562 energy-balance method',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.array_w_no_margin, 8500 / (4.8 * 0.75), { rel: 1e-12 }, 'formula');
      assertClose(outputs.array_w_no_margin / 1000, 2.361, { abs: 1e-3 }, '2.36 kW');
      assertEqual(outputs.modules, 6, 'modules');
      assertEqual(outputs.strings, 3, 'strings');
      assertClose(outputs.array_installed_w, 2400, { rel: 1e-12 }, 'installed');
      const margin = calculate({ ...CASE, design_margin_pct: 15 }).outputs;
      assertClose(margin.array_w / 1000, 2.361 * 1.15, { rel: 1e-3 }, 'with margin');
      assertEqual(margin.modules, 8, '4 strings with margin');
    },
  },
  {
    name: 'Yield and balance: 2.4 kW × 4.8 h × 0.75 = 8.64 kWh/day = 102 % of the load; a 2 kW array would give 7.2 kWh (85 %)',
    source: 'Energy balance E_yield = P × PSH × η',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.daily_yield_wh, 2400 * 4.8 * 0.75, { rel: 1e-12 }, 'yield');
      assertClose(outputs.energy_balance_pct, (8640 / 8500) * 100, { rel: 1e-12 }, 'balance');
      const small = calculate({ ...CASE, module_w: 500, modules_series: 2, daily_load_wh: 8500, design_margin_pct: 0 }).outputs;
      assertEqual(small.strings === 3 && small.array_installed_w === 3000, true, 'string arithmetic with 500 W modules');
    },
  },
  {
    name: 'Battery: 10 kWh/day, 2 days, 80 % DoD, inverter 100 % → 25 kWh (published example); at 48 V = 521 Ah; usable 20 kWh; lead-acid at 50 % DoD needs 40 kWh',
    source: 'Vatrer off-grid battery example (10 kWh × 2 / 0.8 = 25 kWh); IEEE 1013 autonomy and DoD method',
    run: () => {
      const li = calculate({ ...CASE, daily_load_wh: 10000, inverter_eff: 1 }).outputs;
      assertClose(li.battery_wh / 1000, 25, { rel: 1e-12 }, '25 kWh');
      assertClose(li.battery_ah, 25000 / 48, { rel: 1e-12 }, 'Ah');
      assertClose(li.usable_wh / 1000, 20, { rel: 1e-12 }, 'usable');
      const pb = calculate({ ...CASE, daily_load_wh: 10000, inverter_eff: 1, battery_type: 'lead_acid' }).outputs;
      assertClose(pb.battery_wh / 1000, 40, { rel: 1e-12 }, 'lead-acid');
      assertEqual(BATTERY_TYPES.lead_acid.dod === 0.5 && BATTERY_TYPES.lifepo4.dod === 0.8, true, 'DoD presets');
      const withInverter = calculate(CASE).outputs;
      assertClose(withInverter.battery_wh, (8500 * 2) / (0.8 * 0.92), { rel: 1e-12 }, 'inverter losses included');
    },
  },
  {
    name: 'Charge controller: MPPT 2.4 kW at 48 V × 1.25 = 62.5 A; PWM 3 strings × 10.5 A × 1.25 = 39.4 A; string V_oc at −5 °C = 2 × 49 × (1 + 0.003 × 30) = 106.8 V ≤ 150 V OK; 4 in series exceeds',
    source: 'NEC 690.8 125 % continuous factor; V_oc temperature coefficient −0.3 %/K',
    run: () => {
      const mppt = calculate(CASE).outputs;
      assertClose(mppt.controller_a, (2400 / 48) * 1.25, { rel: 1e-12 }, 'MPPT');
      const pwm = calculate({ ...CASE, controller_type: 'pwm' }).outputs;
      assertClose(pwm.controller_a, 3 * 10.5 * 1.25, { rel: 1e-12 }, 'PWM');
      assertClose(mppt.string_voc_cold_v, 2 * 49 * 1.09, { rel: 1e-12 }, 'V_oc cold');
      assertEqual(mppt.voc_check.startsWith('OK'), true, 'OK');
      const four = calculate({ ...CASE, modules_series: 4 });
      assertEqual(four.outputs.voc_check.startsWith('EXCEEDED'), true, 'exceeded');
      assertEqual(four.warnings.some((w) => w.includes('Cold-weather')), true, 'warning');
    },
  },
  {
    name: 'Inverter and charging: 3 kW peak × 1.25 = 3.75 kW inverter, DC input 3000/(0.92 × 48) = 67.9 A; average charge current 8 640/4.8/48 = 37.5 A (0.078 C); at the 102 % balance only 140 Wh/day is left over, so recharging 18.5 kWh usable takes 132 days — flagged; a 15 % margin (3.2 kW) brings it to 6.1 days',
    source: 'Sizing rules of thumb (IEEE 1562; Sandia handbook); recharge = usable / (yield − load)',
    run: () => {
      const { outputs, warnings } = calculate(CASE);
      assertClose(outputs.inverter_w, 3750, { rel: 1e-12 }, 'inverter');
      assertClose(outputs.inverter_dc_a, 3000 / (0.92 * 48), { rel: 1e-12 }, 'DC current');
      assertClose(outputs.daily_charge_a, 8640 / 4.8 / 48, { rel: 1e-12 }, 'charge current');
      assertClose(outputs.charge_rate_c, outputs.daily_charge_a / outputs.battery_ah, { rel: 1e-12 }, 'C-rate');
      assertClose(outputs.recharge_days, outputs.usable_wh / 140, { rel: 1e-9 }, 'recharge days formula');
      assertClose(outputs.recharge_days, 132, { abs: 0.5 }, 'recharge days value');
      assertEqual(warnings.some((w) => w.includes('days of design-month sun')), true, 'warning');
      const margin = calculate({ ...CASE, design_margin_pct: 15 }).outputs;
      assertClose(margin.array_installed_w, 3200, { rel: 1e-12 }, '8 modules');
      assertClose(margin.recharge_days, margin.usable_wh / (3200 * 4.8 * 0.75 - 8500), { rel: 1e-9 }, 'margin recharge');
      assertClose(margin.recharge_days, 6.1, { abs: 0.05 }, '6.1 days');
    },
  },
  {
    name: 'Zero-surplus case: an 8.64 kWh/day load needs exactly 2.4 kW, so the yield equals the load and the bank can never recharge → recharge days null with a warning; invalid inputs fail fast (zero PSH, fractional series count, unknown battery)',
    source: 'Behaviour specification (surplus ≤ 0 → null); validation contract',
    run: () => {
      const zero = calculate({ ...CASE, daily_load_wh: 8640 });
      assertClose(zero.outputs.energy_balance_pct, 100, { rel: 1e-9 }, 'exact balance');
      assertEqual(zero.outputs.recharge_days, null, 'yield equal to load → null');
      assertEqual(zero.warnings.some((w) => w.includes('cannot recharge')), true, 'deficit warning');
      assertThrows(() => calculate({ ...CASE, psh_h: 0 }), 'greater than zero', 'PSH');
      assertThrows(() => calculate({ ...CASE, modules_series: 1.5 }), 'whole number', 'series');
      assertThrows(() => calculate({ ...CASE, battery_type: 'nicd' }), 'must be one of', 'battery');
    },
  },
];
