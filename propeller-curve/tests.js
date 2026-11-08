/**
 * propeller-curve/tests.js — SMCR with margins, light and layout propeller curves, heavy running of a measured point.
 * Run: node run-tests.js propeller-curve
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'SMCR from PD 7000 kW at 80 rpm with 15 % sea margin, 10 % engine margin and 5 % LRM: 8944.4 kW at 82.47 rpm',
    source: 'Everllence project guide 2.01, eqs 2.01.01 and 2.01.02',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.smcr_power_kw, (7000 * 115) / 90, { rel: 1e-12 }, 'SMCR power');
      assertClose(outputs.smcr_rpm, 80 * Math.cbrt(115 / 90) * 0.95, { rel: 1e-12 }, 'SMCR speed');
      assertClose(outputs.smcr_rpm, 82.47, { abs: 0.005 }, 'value');
    },
  },
  {
    name: 'Service propulsion point at 90 % SMCR power on the layout curve: 8050 kW (PD + 15 %) at 79.62 rpm',
    source: 'Everllence project guide 2.01: SP = PD with sea margin, placed on the engine layout curve',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.sp_power_kw, 7000 * 1.15, { rel: 1e-12 }, 'SP power');
      assertClose(outputs.sp_rpm, outputs.smcr_rpm * Math.cbrt(0.9), { rel: 1e-12 }, 'SP speed');
      assertClose(outputs.sp_rpm, 79.62, { abs: 0.005 }, 'value');
    },
  },
  {
    name: 'At the same rpm the layout curve needs 1/(1 − LRM)³ times the light curve power: at 100 % SMCR rpm the light curve gives 0.95³ = 85.74 % of SMCR power',
    source: 'Propeller law P = c n³ with the light running margin of eq. 2.01.02',
    run: () => {
      const { outputs } = calculate({});
      outputs.curve_table.rows.forEach((r) => assertClose(r[4] / r[2], 1 / 0.95 ** 3, { rel: 1e-12 }, `ratio at ${r[0]} %`));
      const full = outputs.curve_table.rows.find((r) => r[0] === 100);
      assertClose(full[3], 0.95 ** 3 * 100, { rel: 1e-12 }, 'light curve at SMCR speed');
      assertClose(full[5], 100, { rel: 1e-12 }, 'layout curve through SMCR');
    },
  },
  {
    name: 'Sea trial: the clean ship reaches 1/(1 − LRM) of the SMCR speed at full power, 105.26 % for 5 %; 10 % LRM gives 111.1 %, above the 110 % limit of line 9',
    source: 'Everllence project guide 2.03, line 9 (110 % of SMCR rpm at sea trial)',
    run: () => {
      assertClose(calculate({}).outputs.trial_rpm_pct, 100 / 0.95, { rel: 1e-12 }, '5 %');
      const high = calculate({ lrm_pct: 10 });
      assertClose(high.outputs.trial_rpm_pct, 100 / 0.9, { rel: 1e-12 }, '10 %');
      assertEqual(high.warnings.some((w) => w.includes('line 9')), true, 'warning');
    },
  },
  {
    name: 'A measured point on the light curve runs 0 % heavy with LRM/(1 − LRM) = 5.26 % margin left; on the layout curve it runs 5 % heavy with no margin left',
    source: 'Heavy running = 1 − n/n_light(P); margin = n/n_layout(P) − 1',
    run: () => {
      const light = calculate({ measured_power_kw: 7000, measured_rpm: 80 }).outputs;
      assertClose(light.heavy_running_pct, 0, { abs: 1e-12 }, 'heavy running on the light curve');
      assertClose(light.margin_left_pct, (0.05 / 0.95) * 100, { rel: 1e-9 }, 'margin');
      const base = calculate({}).outputs;
      const onLayout = calculate({ measured_power_kw: base.sp_power_kw, measured_rpm: base.sp_rpm }).outputs;
      assertClose(onLayout.heavy_running_pct, 5, { rel: 1e-9 }, 'heavy running on the layout curve');
      assertClose(onLayout.margin_left_pct, 0, { abs: 1e-9 }, 'no margin');
    },
  },
  {
    name: 'A point heavier than the layout curve (8000 kW at 76 rpm) has a negative margin of 4.35 % and is flagged',
    source: 'Everllence project guide 2.03: heavy running moves the propeller curve towards line 2 and beyond',
    run: () => {
      const { outputs, warnings } = calculate({ measured_power_kw: 8000, measured_rpm: 76 });
      assertClose(outputs.margin_left_pct, -4.35, { abs: 0.005 }, 'margin');
      assertEqual(warnings.some((w) => w.includes('heavier than the engine layout curve')), true, 'warning');
    },
  },
  {
    name: 'Invalid inputs are rejected: zero design power, an engine margin above 50 %, negative speed',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ pd_power_kw: 0 }), 'greater than zero');
      assertThrows(() => calculate({ engine_margin_pct: 60 }), 'must be between');
      assertThrows(() => calculate({ measured_rpm: -5 }), 'greater than zero');
    },
  },
];
