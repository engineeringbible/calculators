/**
 * fuel-voyage-cost/tests.js — checks against published factors and hand-verified arithmetic.
 * Run: node run-tests.js fuel-voyage-cost
 */
import { calculate, dailyConsumptionFromPower, CO2_FACTOR_T_PER_T } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '3 000 nmi at 14 kn takes 214.29 h = 8.9286 days',
    source: 'Time = distance / speed; 1 knot = 1 nmi/h by definition (BIPM SI Brochure, 9th ed., Table 8)',
    run: () => {
      const { outputs } = calculate({ distance_nmi: 3000, speed_kn: 14 });
      assertClose(outputs.sea_days, 3000 / 14 / 24, { rel: 1e-9 }, 'sea_days');
      assertClose(outputs.sea_days, 8.9286, { abs: 5e-4 }, 'sea_days');
    },
  },
  {
    name: '8 000 kW at 175 g/kWh burns 33.6 t/day',
    source: 'SFOC definition, ISO 3046-1:2002 §3 and MAN Energy Solutions, Basic Principles of Ship Propulsion (2018): fuel = P × SFOC × t',
    run: () => {
      assertClose(dailyConsumptionFromPower(8000, 175), 33.6, { rel: 1e-9 }, 'daily consumption');
      const { outputs } = calculate({ power_kw: 8000, sfoc_g_kwh: 175, margin_pct: 0 });
      assertClose(outputs.me_daily_used_t, 33.6, { rel: 1e-9 }, 'me_daily_used_t');
    },
  },
  {
    name: 'Default passage: 300.0 t main engine, 22.32 t auxiliaries, cost 177 277 $ at 550 $/t',
    source: 'Hand calculation: 33.6 t/day × 8.9286 d = 300.0 t; 2.5 × 8.9286 = 22.321 t; 322.321 t × 550 $/t',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.me_fuel_t, 300.0, { rel: 1e-6 }, 'me_fuel_t');
      assertClose(outputs.aux_fuel_t, 22.3214, { abs: 1e-3 }, 'aux_fuel_t');
      assertClose(outputs.total_fuel_t, 322.3214, { abs: 1e-3 }, 'total_fuel_t');
      assertClose(outputs.total_cost, 177276.8, { abs: 0.5 }, 'total_cost');
      assertClose(outputs.fuel_per_nmi_kg, 107.44, { abs: 0.01 }, 'fuel_per_nmi_kg');
      assertClose(outputs.cost_per_nmi, 59.09, { abs: 0.01 }, 'cost_per_nmi');
    },
  },
  {
    name: 'Daily-consumption basis: 30 t/day for a 10-day passage = 300 t, 165 000 $',
    source: 'Hand calculation: 3 360 nmi / 14 kn = 240 h = 10 days',
    run: () => {
      const { outputs } = calculate({ basis: 'daily', distance_nmi: 3360, speed_kn: 14, me_daily_t: 30, aux_daily_t: 0, bunker_price: 550 });
      assertClose(outputs.sea_days, 10, { rel: 1e-9 }, 'sea_days');
      assertClose(outputs.me_fuel_t, 300, { rel: 1e-9 }, 'me_fuel_t');
      assertClose(outputs.total_cost, 165000, { rel: 1e-9 }, 'total_cost');
    },
  },
  {
    name: 'CO₂ factors: 100 t HFO → 311.4 t, MGO → 320.6 t, LNG → 275.0 t',
    source: 'IMO Resolution MEPC.364(79), 2022 EEDI calculation guidelines, Table 1 (CF values)',
    run: () => {
      assertEqual(CO2_FACTOR_T_PER_T.hfo, 3.114, 'CF HFO');
      assertEqual(CO2_FACTOR_T_PER_T.mgo, 3.206, 'CF MGO');
      assertEqual(CO2_FACTOR_T_PER_T.lng, 2.75, 'CF LNG');
      assertEqual(CO2_FACTOR_T_PER_T.methanol, 1.375, 'CF methanol');
      const base = { basis: 'daily', distance_nmi: 3360, speed_kn: 14, me_daily_t: 10, aux_daily_t: 0 };
      assertClose(calculate({ ...base, fuel_type: 'hfo' }).outputs.co2_t, 311.4, { rel: 1e-9 }, 'co2 HFO');
      assertClose(calculate({ ...base, fuel_type: 'mgo' }).outputs.co2_t, 320.6, { rel: 1e-9 }, 'co2 MGO');
      assertClose(calculate({ ...base, fuel_type: 'lng' }).outputs.co2_t, 275.0, { rel: 1e-9 }, 'co2 LNG');
    },
  },
  {
    name: 'A 10 % margin raises main-engine fuel from 300 t to 330 t; port fuel 2 days × 3 t/day = 6 t',
    source: 'Hand calculation; sea margin practice per MAN Energy Solutions, Basic Principles of Ship Propulsion (2018), "Sea margin"',
    run: () => {
      const { outputs } = calculate({ margin_pct: 10, port_days: 2, port_daily_t: 3 });
      assertClose(outputs.me_daily_used_t, 36.96, { rel: 1e-9 }, 'me_daily_used_t');
      assertClose(outputs.me_fuel_t, 330, { rel: 1e-6 }, 'me_fuel_t');
      assertClose(outputs.port_fuel_t, 6, { rel: 1e-9 }, 'port_fuel_t');
    },
  },
  {
    name: 'Unit layer: 3 000 nmi = 5 556 km, 14 kn = 7.2022 m/s, 1 long ton = 1.01605 t',
    source: '1 nmi = 1852 m (International Hydrographic Conference 1929); 1 long ton = 2240 lb × 0.45359237 kg',
    run: () => {
      assertClose(convert(3000, 'nmi', 'km', 'length'), 5556, { rel: 1e-12 }, 'nmi → km');
      assertClose(convert(14, 'kn', 'm_s', 'speed'), 7.20222, { abs: 1e-5 }, 'kn → m/s');
      assertClose(convert(1, 'lt', 't', 'mass'), 1.0160469088, { rel: 1e-12 }, 'long ton → t');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero speed, negative distance, unknown fuel',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ speed_kn: 0 }), 'greater than zero', 'zero speed');
      assertThrows(() => calculate({ distance_nmi: -1 }), 'must not be negative', 'negative distance');
      assertThrows(() => calculate({ fuel_type: 'coal' }), 'must be one of', 'unknown fuel');
    },
  },
];
