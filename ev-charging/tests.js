/**
 * ev-charging/tests.js — checks against hand calculations, the AFDC Level 1 figure and unit consistency.
 * Run: node run-tests.js ev-charging
 */
import { calculate, hoursMinutes } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MI = 1609.344;

export const tests = [
  {
    name: '75 kWh from 20 to 80 % on a 7.2 kW Level 2 charger at 90 %: 45 kWh in, 50 kWh drawn, 6.94 h, 7.50 at 0.15, 153 mi at 3.4 mi/kWh',
    source: 'Hand calculation: E = C ΔSoC, E_grid = E / η, t = E_grid / P',
    run: () => {
      const o = calculate({ capacity_wh: 75000, soc_start: 0.2, soc_end: 0.8, charger_type: 'ac', charger_w: 7200, onboard_w: 11000, efficiency: 0.9, price_kwh: 0.15, consumption_unit: 'mi_kwh', cons_mi_kwh: 3.4 }).outputs;
      assertClose(o.battery_wh, 45000, { rel: 1e-12 }, 'battery');
      assertClose(o.grid_wh, 50000, { rel: 1e-12 }, 'grid');
      assertClose(o.time_s / 3600, 6.9444, { abs: 1e-4 }, 'hours');
      assertEqual(o.time_text, '6 h 57 min', 'text');
      assertClose(o.cost, 7.5, { rel: 1e-12 }, 'cost');
      assertClose(o.range_m / MI, 153, { rel: 1e-12 }, 'range');
      assertClose(o.range_rate_m_s * 3600 / MI, 22.032, { rel: 1e-9 }, 'mi per hour');
    },
  },
  {
    name: 'Level 1 at 1.92 kW (120 V, 16 A) adds about 5 miles per hour of charging at 3 mi/kWh and 90 %',
    source: 'U.S. DOE Alternative Fuels Data Center: Level 1 about 5 miles of range per hour; SAE J1772 Level 1 16 A',
    run: () => {
      const o = calculate({ charger_w: 1920, efficiency: 0.9, cons_mi_kwh: 3 }).outputs;
      assertClose(o.range_rate_m_s * 3600 / MI, 5.184, { abs: 0.001 }, 'mi/h');
      assertClose(o.range_rate_m_s * 3600 / MI, 5, { rel: 0.1 }, 'about 5');
    },
  },
  {
    name: 'The lower of charger and car sets the power: 11 kW wallbox with a 7.4 kW onboard charger runs at 7.4 kW; a 350 kW DC charger with a 150 kW car at 150 kW',
    source: 'Definition of the vehicle limit',
    run: () => {
      const ac = calculate({ charger_type: 'ac', charger_w: 11000, onboard_w: 7400 }).outputs;
      assertEqual(ac.power_w, 7400, 'AC');
      assertEqual(ac.limited_by, 'The car\'s onboard charger', 'AC text');
      const dc = calculate({ charger_type: 'dc', charger_w: 350000, dc_limit_w: 150000, soc_end: 0.8 });
      assertEqual(dc.outputs.power_w, 150000, 'DC');
      assertClose(dc.outputs.time_s / 60, 50000 / 150000 * 60, { rel: 1e-12 }, '20 min');
      assertEqual(calculate({ charger_type: 'dc', charger_w: 150000, soc_end: 0.95 }).warnings.length, 1, 'taper warning');
    },
  },
  {
    name: '3.4 mi/kWh = 29.41 kWh/100 mi = 294.1 Wh/mi = 18.28 kWh/100 km = 5.472 km/kWh give the same range',
    source: 'Unit definitions (1 mi = 1.609344 km)',
    run: () => {
      const ref = calculate({ consumption_unit: 'mi_kwh', cons_mi_kwh: 3.4 }).outputs.range_m;
      const kwh100mi = 100 / 3.4;
      assertClose(calculate({ consumption_unit: 'kwh_100mi', cons_kwh_100mi: kwh100mi }).outputs.range_m, ref, { rel: 1e-12 }, 'kWh/100 mi');
      assertClose(calculate({ consumption_unit: 'wh_mi', cons_wh_mi: kwh100mi * 10 }).outputs.range_m, ref, { rel: 1e-12 }, 'Wh/mi');
      assertClose(calculate({ consumption_unit: 'kwh_100km', cons_kwh_100km: kwh100mi / 1.609344 }).outputs.range_m, ref, { rel: 1e-12 }, 'kWh/100 km');
      assertClose(calculate({ consumption_unit: 'km_kwh', cons_km_kwh: 3.4 * 1.609344 }).outputs.range_m, ref, { rel: 1e-12 }, 'km/kWh');
    },
  },
  {
    name: 'At 100 % efficiency grid energy equals battery energy; the cost per mile is price / (mi/kWh × η)',
    source: 'Limiting case; definition of cost per distance',
    run: () => {
      const o = calculate({ efficiency: 1 }).outputs;
      assertClose(o.grid_wh, o.battery_wh, { rel: 1e-12 }, 'no loss');
      assertClose(o.loss_wh, 0, { abs: 1e-6 }, 'loss');
      assertClose(calculate({ efficiency: 0.9 }).outputs.cost_per_mi, 0.15 / (3.4 * 0.9), { rel: 1e-12 }, 'cost per mile');
      assertEqual(hoursMinutes(45 * 60), '45 min', 'minutes only');
    },
  },
  {
    name: 'An end state of charge at or below the start, a consumption out of range and a negative price are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ soc_start: 0.8, soc_end: 0.8 }), 'State of charge at the end');
      assertThrows(() => calculate({ consumption_unit: 'mi_kwh', cons_mi_kwh: 20 }), 'Consumption, mi/kWh');
      assertThrows(() => calculate({ price_kwh: -1 }), 'Electricity price');
    },
  },
];
