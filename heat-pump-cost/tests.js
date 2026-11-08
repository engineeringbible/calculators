/**
 * heat-pump-cost/tests.js — checks against hand calculations, the EPA heat contents and CO₂ factors, and the
 * break-even COP.
 * Run: node run-tests.js heat-pump-cost
 */
import { calculate, FUELS, CO2_GAS_KG_KWH, CO2_OIL_KG_KWH } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '12 000 kWh at SCOP 3.2 and 0.20/kWh: 3 750 kWh, 750.00; 90 % gas boiler at 0.07/kWh: 13 333 kWh, 933.33; saving 183.33; break-even COP 2.571',
    source: 'Hand calculation: E = Q / SCOP, E = Q / η, COP_be = p_e η / p_f',
    run: () => {
      const o = calculate({ heat_kwh: 12000, scop: 3.2, elec_price: 0.2, fuel: 'gas_kwh', fuel_price: 0.07, boiler_eff: 0.9 }).outputs;
      assertClose(o.hp_kwh, 3750, { rel: 1e-12 }, 'HP kWh');
      assertClose(o.hp_cost, 750, { rel: 1e-12 }, 'HP cost');
      assertClose(o.fuel_kwh, 13333.333, { abs: 0.001 }, 'fuel');
      assertClose(o.boiler_cost, 933.333, { abs: 0.001 }, 'boiler cost');
      assertClose(o.saving, 183.333, { abs: 0.001 }, 'saving');
      assertClose(o.breakeven_cop, 18 / 7, { rel: 1e-12 }, 'break-even');
    },
  },
  {
    name: 'EPA heat contents: a therm is 29.307 kWh, a ccf of gas 30.07 kWh, a US gallon of No. 2 oil 40.44 kWh, a litre 10.68 kWh',
    source: 'EPA GHG Emission Factors Hub Table 1 (1 026 Btu/scf, 0.138 MMBtu/gal); 1 therm = 100 000 Btu; 1 Btu = 1 055.05585262 J',
    run: () => {
      assertClose(FUELS.gas_therm.kwh, 29.3071, { abs: 1e-4 }, 'therm');
      assertClose(FUELS.gas_ccf.kwh, 30.069, { abs: 1e-3 }, 'ccf');
      assertClose(FUELS.oil_gal.kwh, 40.444, { abs: 1e-3 }, 'gallon');
      assertClose(FUELS.oil_l.kwh, 10.684, { abs: 1e-3 }, 'litre');
      const therm = calculate({ fuel: 'gas_therm', fuel_price: 1.5 }).outputs;
      assertClose(therm.boiler_heat_price, 1.5 / 29.307107 / 0.9, { rel: 1e-6 }, '1.50 per therm');
    },
  },
  {
    name: 'EPA CO₂ factors: natural gas 53.06 kg/MMBtu = 0.1810 kg/kWh, No. 2 oil 73.96 kg/MMBtu = 0.2524 kg/kWh',
    source: 'EPA GHG Emission Factors Hub Table 1; 1 MMBtu = 293.071 kWh',
    run: () => {
      assertClose(CO2_GAS_KG_KWH, 0.18105, { abs: 1e-5 }, 'gas');
      assertClose(CO2_OIL_KG_KWH, 0.25236, { abs: 1e-5 }, 'oil');
      const o = calculate({ co2_elec: 0.25, co2_gas: 0.181 }).outputs;
      assertClose(o.boiler_co2_kg, 13333.333 * 0.181, { abs: 0.01 }, 'boiler CO₂');
      assertClose(o.breakeven_cop_co2, 0.25 * 0.9 / 0.181, { rel: 1e-12 }, 'CO₂ break-even');
    },
  },
  {
    name: 'At the break-even COP the heat pump and the boiler cost the same; above it the heat pump is cheaper',
    source: 'Definition of the break-even COP',
    run: () => {
      const be = calculate({ elec_price: 0.25, fuel_price: 0.07, boiler_eff: 0.9 }).outputs.breakeven_cop;
      assertClose(be, 3.2143, { abs: 1e-4 }, 'COP 3.21');
      assertClose(calculate({ elec_price: 0.25, fuel_price: 0.07, boiler_eff: 0.9, scop: be }).outputs.saving, 0, { abs: 1e-9 }, 'equal');
      assertEqual(calculate({ elec_price: 0.25, fuel_price: 0.07, scop: 3.0 }).outputs.saving < 0, true, 'costs more below');
    },
  },
  {
    name: 'Oil at 3.50 per US gallon in an 85 % boiler: 14 118 kWh, 349.1 gal, 1 221.74 a year',
    source: 'Hand calculation with 40.444 kWh per gallon (EPA)',
    run: () => {
      const o = calculate({ fuel: 'oil_gal', fuel_price: 3.5, boiler_eff: 0.85 }).outputs;
      assertClose(o.fuel_kwh, 14117.647, { abs: 0.001 }, 'kWh');
      assertEqual(o.fuel_qty, '349.1 US gal', 'gallons');
      assertClose(o.boiler_cost, 1221.74, { abs: 0.01 }, 'cost');
    },
  },
  {
    name: 'A zero electricity price, an SCOP below 1 and an unknown fuel are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ elec_price: 0 }), 'Electricity price');
      assertThrows(() => calculate({ scop: 0.5 }), 'Heat pump SCOP');
      assertThrows(() => calculate({ fuel: 'coal' }), 'Boiler fuel');
    },
  },
];
