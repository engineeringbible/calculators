/**
 * solar-battery-bank/tests.js — checks against the IEEE 485 temperature table and hand calculations of the bank.
 * Run: node run-tests.js solar-battery-bank
 */
import { calculate, ieee485Factor } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const fToC = (f) => ((f - 32) * 5) / 9;

export const tests = [
  {
    name: '3 kWh/day, 3 days, 90 % inverter, flooded 50 %, 50 °F: 10 kWh, factor 1.19, 23.8 kWh, 991.7 Ah at 24 V, 2 × 5 of 12 V 200 Ah',
    source: 'Hand calculation from E = E_day × days / η, C = E k_T / DoD; IEEE 485 Table 1 (50 °F → 1.19)',
    run: () => {
      const o = calculate({ daily_wh: 3000, autonomy_days: 3, chemistry: 'flooded', derating: 'table', temp_c: 10, inverter_eff: 0.9, margin: 0, system_v: 24, battery_v: 12, battery_ah: 200 }).outputs;
      assertClose(o.bank_energy_wh, 10000, { rel: 1e-12 }, 'bank energy');
      assertClose(o.temp_factor, 1.19, { rel: 1e-9 }, 'k_T');
      assertClose(o.required_wh, 23800, { rel: 1e-9 }, 'Wh');
      assertClose(o.required_ah, 991.667, { abs: 0.001 }, 'Ah');
      assertEqual(o.series, 2, 'series');
      assertEqual(o.parallel, 5, 'parallel');
      assertEqual(o.total, 10, 'total');
      assertClose(o.usable_wh, 10084.03, { abs: 0.01 }, 'usable at 10 °C');
    },
  },
  {
    name: 'IEEE 485 Table 1 rows: 60 °F 1.11 (the TSEWG TP-4 example), 40 °F 1.30, 77 °F 1.000, 25 °F 1.52; 32 °F interpolates to 1.398',
    source: 'IEEE 485 Table 1 as reproduced in TSEWG TP-4 (2008), Table 1',
    run: () => {
      assertClose(ieee485Factor(fToC(60)), 1.11, { abs: 1e-6 }, '60 °F');
      assertClose(ieee485Factor(fToC(40)), 1.3, { abs: 1e-6 }, '40 °F');
      assertClose(ieee485Factor(25), 1.0, { abs: 1e-6 }, '77 °F');
      assertClose(ieee485Factor(fToC(25)), 1.52, { abs: 1e-6 }, '25 °F');
      assertClose(ieee485Factor(0), 1.398, { abs: 1e-6 }, '32 °F, between 30 °F (1.43) and 35 °F (1.35)');
      assertEqual(ieee485Factor(-10), null, 'below the table');
    },
  },
  {
    name: 'LiFePO4 at 80 %, 10 kWh for one day through a 95 % inverter at 51.2 V: 13.16 kWh, 257.0 Ah, 4 × 3 of 12.8 V 100 Ah',
    source: 'Hand calculation: 10 000 / 0.95 / 0.8 = 13 158 Wh; / 51.2 V = 257.0 Ah',
    run: () => {
      const o = calculate({ daily_wh: 10000, autonomy_days: 1, chemistry: 'lifepo4', derating: 'none', inverter_eff: 0.95, system_v: 51.2, battery_v: 12.8, battery_ah: 100 }).outputs;
      assertClose(o.required_wh, 13157.89, { abs: 0.01 }, 'Wh');
      assertClose(o.required_ah, 256.990, { abs: 0.001 }, 'Ah');
      assertEqual(o.series, 4, 'series');
      assertEqual(o.parallel, 3, 'parallel');
      assertClose(o.bank_wh, 15360, { rel: 1e-12 }, 'bank Wh');
    },
  },
  {
    name: 'The IEEE 485 ageing factor 1.25 raises the capacity by 25 %; a warm battery (35 °C) takes no credit, factor 1',
    source: 'IEEE 485 ageing factor 1/0.8 = 1.25; design decision (no credit above 25 °C)',
    run: () => {
      const base = calculate({ derating: 'none', margin: 0 }).outputs.required_ah;
      assertClose(calculate({ derating: 'none', margin: 0.25 }).outputs.required_ah, base * 1.25, { rel: 1e-12 }, 'ageing');
      assertEqual(calculate({ derating: 'table', temp_c: 35 }).outputs.temp_factor, 1, 'warm');
      assertClose(calculate({ derating: 'factor', capacity_factor: 0.8 }).outputs.temp_factor, 1.25, { rel: 1e-12 }, 'data-sheet factor');
    },
  },
  {
    name: 'Days of autonomy of the bank as built are at least the days asked for; the bank Ah is a whole number of strings',
    source: 'Consistency of the sizing',
    run: () => {
      const o = calculate({ daily_wh: 4200, autonomy_days: 2.5, chemistry: 'agm', temp_c: 5, system_v: 48, battery_v: 6, battery_ah: 225 }).outputs;
      assertEqual(o.actual_days >= 2.5 - 1e-9, true, 'autonomy kept');
      assertEqual(o.series, 8, 'series');
      assertClose(o.bank_ah, o.parallel * 225, { rel: 1e-12 }, 'Ah');
    },
  },
  {
    name: 'A system voltage that is not a multiple of the battery voltage, the lead-acid table for LiFePO4 and a temperature off the table are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ system_v: 48, battery_v: 12.8 }), 'whole multiple');
      assertThrows(() => calculate({ chemistry: 'lifepo4', derating: 'table' }), 'lead-acid');
      assertThrows(() => calculate({ derating: 'table', temp_c: -10 }), 'Lowest battery temperature');
      assertThrows(() => calculate({ daily_wh: 0 }), 'Energy used per day');
    },
  },
];
