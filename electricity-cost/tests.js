/**
 * electricity-cost/tests.js — checks against E = P t and flat-rate cost.
 * Run: node run-tests.js electricity-cost
 */
import { calculate, DAYS_PER_YEAR } from './calc.js';
import { assertClose } from '../shared/test-runner.js';

const kwh = (j) => j / 3.6e6;

export const tests = [
  {
    name: 'A 2 kW heater 4 h a day at 0.25 per kWh: 8 kWh and 2.00 a day, 243.5 kWh and 60.88 a month, 2 922 kWh and 730.50 a year',
    source: 'Energy W = P t (ISO 80000-6, 1 kWh = 3.6 MJ); average month 365.25 / 12 days',
    run: () => {
      const { outputs } = calculate({ power_w: 2000, hours_s: 4 * 3600, days_per_week: 7, duty: 1, price: 0.25 });
      assertClose(kwh(outputs.energy_day_j), 8, { rel: 1e-12 }, 'day kWh');
      assertClose(outputs.cost_day, 2, { rel: 1e-12 }, 'day cost');
      assertClose(kwh(outputs.energy_month_j), 243.5, { rel: 1e-12 }, 'month kWh');
      assertClose(kwh(outputs.energy_year_j), 2922, { rel: 1e-12 }, 'year kWh');
      assertClose(outputs.cost_year, 730.5, { rel: 1e-12 }, 'year cost');
      assertClose(outputs.cost_hour, 0.5, { rel: 1e-12 }, 'hour cost');
    },
  },
  {
    name: 'A 150 W fridge compressor running 40 % of the time, 24 h a day: 1.44 kWh a day, 526 kWh a year',
    source: 'E = P × duty × t; typical refrigerator duty cycle 30–50 %',
    run: () => {
      const { outputs } = calculate({ power_w: 150, hours_s: 86400, days_per_week: 7, duty: 0.4, price: 0.3 });
      assertClose(kwh(outputs.energy_day_j), 1.44, { rel: 1e-12 }, 'day');
      assertClose(kwh(outputs.energy_year_j), 1.44 * DAYS_PER_YEAR, { rel: 1e-12 }, 'year');
    },
  },
  {
    name: 'Five working days a week cut the monthly and yearly figures to 5/7 but leave the cost per day of use unchanged',
    source: 'Scaling by days of use per week',
    run: () => {
      const all = calculate({ power_w: 1000, hours_s: 8 * 3600, days_per_week: 7, duty: 1, price: 0.2 }).outputs;
      const work = calculate({ power_w: 1000, hours_s: 8 * 3600, days_per_week: 5, duty: 1, price: 0.2 }).outputs;
      assertClose(work.cost_year / all.cost_year, 5 / 7, { rel: 1e-12 }, 'year');
      assertClose(work.cost_day, all.cost_day, { rel: 1e-12 }, 'per day of use');
    },
  },
  {
    name: 'A 5 W standby load all year costs 43.83 kWh, 13.15 at 0.30 per kWh',
    source: 'IEC 62301 standby power; E = 5 W × 8766 h',
    run: () => {
      const { outputs } = calculate({ power_w: 5, hours_s: 86400, days_per_week: 7, duty: 1, price: 0.3 });
      assertClose(kwh(outputs.energy_year_j), 43.83, { abs: 0.001 }, 'kWh');
      assertClose(outputs.cost_year, 13.149, { abs: 0.001 }, 'cost');
    },
  },
  {
    name: 'Zero hours or zero price give zero cost; more than 24 hours a day is rejected',
    source: 'Validation contract',
    run: () => {
      assertClose(calculate({ hours_s: 0 }).outputs.cost_year, 0, { abs: 1e-12 }, 'no hours');
      assertClose(calculate({ price: 0 }).outputs.cost_year, 0, { abs: 1e-12 }, 'free power');
      let threw = false;
      try { calculate({ hours_s: 90000 }); } catch { threw = true; }
      if (!threw) throw new Error('25 hours a day should be rejected');
    },
  },
];
