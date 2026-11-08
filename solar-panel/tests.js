/**
 * solar-panel/tests.js — checks against hand calculations of the PVWatts-style energy balance.
 * Run: node run-tests.js solar-panel
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '10 000 kWh/yr, 4.5 sun hours, 14 % losses: 1 412.6 kWh per kW, 7.08 kW, 18 × 400 W = 7.2 kW, 10 170 kWh/yr, 34.2 m²',
    source: 'E = P × PSH × 365 × (1 − losses), NREL PVWatts v8 default losses 14 %',
    run: () => {
      const { outputs } = calculate({ annual_kwh: 10000, offset: 1, psh_h: 4.5, losses: 0.14, panel_w: 400, panel_area_m2: 1.9 });
      assertClose(outputs.yield_kwh_kw, 1412.55, { rel: 1e-12 }, 'specific yield');
      assertClose(outputs.system_w, 7079.4, { abs: 0.1 }, 'kW');
      assertEqual(outputs.panels, 18, 'panels');
      assertEqual(outputs.installed_w, 7200, 'installed');
      assertClose(outputs.production_kwh, 10170.36, { abs: 0.01 }, 'production');
      assertClose(outputs.roof_m2, 34.2, { abs: 1e-9 }, 'area');
    },
  },
  {
    name: 'Covering half the use halves the system: 3.54 kW, 9 panels',
    source: 'P ∝ E × offset',
    run: () => {
      const { outputs } = calculate({ annual_kwh: 10000, offset: 0.5 });
      assertClose(outputs.system_w, 3539.7, { abs: 0.1 }, 'kW');
      assertEqual(outputs.panels, 9, 'panels');
    },
  },
  {
    name: 'Southern Europe flat, 4 000 kWh/yr at 4.8 sun hours with 450 W panels: 2.65 kW, 6 panels, 2.7 kW, 3 240 at 1.20 per watt',
    source: '4 000 / (4.8 × 365 × 0.86) = 2.655 kW',
    run: () => {
      const { outputs } = calculate({ annual_kwh: 4000, psh_h: 4.8, losses: 0.14, panel_w: 450, panel_area_m2: 2.1, price_per_w: 1.2 });
      assertClose(outputs.system_w, 2654.8, { abs: 0.1 }, 'kW');
      assertEqual(outputs.panels, 6, 'panels');
      assertClose(outputs.cost, 3240, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'An exact fit needs no extra panel; more sun hours mean fewer panels; no losses gives P = E / (PSH × 365)',
    source: 'Energy balance',
    run: () => {
      assertEqual(calculate({ annual_kwh: 1412.55 * 4, panel_w: 1000, losses: 0.14, psh_h: 4.5 }).outputs.panels, 4, 'exact');
      const sunny = calculate({ psh_h: 6 }).outputs.panels;
      assertEqual(sunny < 18, true, 'sunnier needs fewer');
      assertClose(calculate({ annual_kwh: 3650, psh_h: 5, losses: 0 }).outputs.system_w, 2000, { rel: 1e-12 }, 'lossless');
    },
  },
  {
    name: 'Offset above 100 % and an impossible panel efficiency warn; zero use and out-of-range sun hours are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertEqual(calculate({ offset: 1.2 }).warnings.length, 1, 'offset');
      assertEqual(calculate({ panel_w: 600, panel_area_m2: 1.5 }).warnings.length, 1, '400 W/m²');
      assertThrows(() => calculate({ annual_kwh: 0 }), 'Electricity use per year must be greater than zero');
      assertThrows(() => calculate({ psh_h: 12 }), 'Peak sun hours');
    },
  },
];
