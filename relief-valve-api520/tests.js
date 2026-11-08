/**
 * relief-valve-api520/tests.js — checks against the API 520 Part I worked examples and the API 526 table.
 * Run: node run-tests.js relief-valve-api520
 */
import { calculate, coefficientC, coefficientF2, selectOrifice, API526, OVERPRESSURE } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

// Set pressure chosen so that P₁ = set × 1.10 + 101.325 = 670 kPa abs exactly (API example P₁).
const SET_FOR_670 = (670 - 101.325) / 1.1;
const GAS = { service: 'gas', flow_kg_h: 24270, gas: 'custom', molecular_weight: 51, k_ratio: 1.11, temperature_c: 348 - 273.15, z_factor: 0.9, kd_gas: 0.975, kb: 1, set_pressure_kpa: SET_FOR_670, overpressure: 'single', back_pressure_kpa: 0, atmospheric_kpa: 101.325, rupture_disk: 'no' };
const LIQUID = { service: 'liquid', flow_l_min: 6814, specific_gravity: 0.9, kd_liquid: 0.65, kw: 0.97, kv: 1, set_pressure_kpa: 1724, overpressure: 'single', back_pressure_kpa: 344.8, atmospheric_kpa: 101.325, rupture_disk: 'no' };

export const tests = [
  {
    name: 'API 520 example 1 (critical gas flow): 24 270 kg/h, T 348 K, Z 0.90, M 51, k 1.11, P₁ 670 kPa, K_d 0.975 → C 0.02489, A = 3 699 mm² → API 526 "P" orifice (4 116 mm²), 90 % used',
    source: 'API 520 Part I example 1 as reproduced by fluids.safety_valve.API520_A_g (0.0036990 m²)',
    run: () => {
      const { outputs } = calculate(GAS);
      assertClose(outputs.relieving_pressure_kpa, 670, { rel: 1e-12 }, 'P₁');
      assertClose(outputs.coefficient_c, 0.024890, { abs: 2e-6 }, 'C');
      assertClose(outputs.required_area_mm2, 3699.046, { rel: 1e-5 }, 'A');
      assertEqual(outputs.orifice.startsWith('P'), true, 'P orifice');
      assertClose(outputs.selected_area_mm2, 6.38 * 645.16, { rel: 1e-12 }, 'P area');
      assertClose(outputs.utilisation_pct, (3699.046 / (6.38 * 645.16)) * 100, { rel: 1e-4 }, 'utilisation');
      assertEqual(outputs.flow_regime.startsWith('Critical'), true, 'critical');
    },
  },
  {
    name: 'API 520 example 2 (sub-critical): same gas with P₂ = 532 kPa abs → r 0.794 > critical ratio 0.583, F₂ 0.8548, A = 4 248 mm²',
    source: 'API 520 Part I example 2 as reproduced by fluids.safety_valve.API520_A_g (0.0042484 m²)',
    run: () => {
      const { outputs } = calculate({ ...GAS, back_pressure_kpa: 532 - 101.325 });
      assertClose(outputs.critical_ratio, (2 / 2.11) ** (1.11 / 0.11), { rel: 1e-12 }, 'critical ratio');
      assertClose(outputs.critical_ratio, 0.5826, { abs: 1e-4 }, 'critical ratio value');
      assertEqual(outputs.flow_regime.startsWith('Sub-critical'), true, 'regime');
      assertClose(outputs.coefficient_c, coefficientF2(1.11, 532 / 670), { rel: 1e-12 }, 'F₂');
      assertClose(outputs.coefficient_c, 0.8548, { abs: 1e-4 }, 'F₂ value');
      assertClose(outputs.required_area_mm2, 4248.36, { rel: 1e-4 }, 'A');
    },
  },
  {
    name: 'Coefficient C: k 1.35 → 0.026694 (library doctest); k 1.40 → 0.027034, i.e. 356 in the US-unit form (C_US = 520/0.03948 × C_SI); k → 1 limit 0.03948/√e',
    source: 'API 520 C formula; fluids.safety_valve.API520_C(1.35) = 0.0266942',
    run: () => {
      assertClose(coefficientC(1.35), 0.02669420, { rel: 1e-6 }, 'k 1.35');
      assertClose(coefficientC(1.4), 0.027034, { abs: 2e-6 }, 'k 1.40');
      assertClose((coefficientC(1.4) / 0.03948) * 520, 356.06, { abs: 0.05 }, 'US-unit 356');
      assertClose(coefficientC(1), 0.03948 / Math.sqrt(Math.E), { rel: 1e-12 }, 'k = 1');
    },
  },
  {
    name: 'API 520 example 5 (liquid, balanced bellows): 6 814 L/min, G 0.90, set 1 724 kPag + 10 % = 1 896.4, back pressure 344.8 kPag → Δp 1 551.6 kPa, K_d 0.65, K_w 0.97 → A = 3 066 mm² → "P" orifice',
    source: 'API 520 Part I example 5 (10th ed.) as reproduced by fluids.safety_valve.API520_A_l ("matches the 3066 mm² shown")',
    run: () => {
      const { outputs } = calculate(LIQUID);
      assertClose(outputs.relieving_pressure_kpa - outputs.back_pressure_abs_kpa, 1551.6, { rel: 1e-9 }, 'Δp');
      assertClose(outputs.required_area_mm2, ((11.78 * 6814) / (0.65 * 0.97)) * Math.sqrt(0.9 / 1551.6), { rel: 1e-12 }, 'formula');
      assertClose(outputs.required_area_mm2, 3066.2, { abs: 0.5 }, 'A');
      assertEqual(outputs.orifice.startsWith('P'), true, 'orifice');
      assertClose(outputs.capacity_liquid_l_min, 6814 * ((6.38 * 645.16) / outputs.required_area_mm2), { rel: 1e-12 }, 'capacity');
    },
  },
  {
    name: 'API 526 table and selection: 14 orifices D 0.110 in² (70.97 mm²) … T 26.0 in² (16 774 mm²); an area equal to a table value selects that letter; 40 000 mm² needs 3 × T',
    source: 'API 526 effective orifice areas (fluids.safety_valve.API526_A_sq_inch)',
    run: () => {
      assertEqual(API526.length, 14, 'count');
      assertEqual(API526.map((o) => o.letter).join(''), 'DEFGHJKLMNPQRT', 'letters');
      assertClose(API526[0].mm2, 70.97, { abs: 0.01 }, 'D');
      assertClose(API526[13].mm2, 16774.16, { abs: 0.01 }, 'T');
      assertEqual(selectOrifice(API526[5].mm2).letter, 'J', 'exact J');
      const big = selectOrifice(40000);
      assertEqual(big.letter === 'T' && big.count === 3, true, '3 × T');
      const r = calculate({ ...GAS, flow_kg_h: 300000 });
      assertEqual(r.warnings.some((w) => w.includes('valves are needed')), true, 'multiple valves warning');
    },
  },
  {
    name: 'Overpressure, rupture disk and validation: multiple valves 16 % and fire 21 % raise P₁; a 100 kPag set pressure takes the 20.7 kPa minimum; K_c 0.9 raises the area by 1/0.9; back pressure above relieving pressure is rejected',
    source: 'ASME VIII UG-125; API 520 K_c = 0.9 with a rupture disk',
    run: () => {
      assertClose(calculate({ ...GAS, overpressure: 'multiple' }).outputs.relieving_pressure_kpa, SET_FOR_670 * 1.16 + 101.325, { rel: 1e-12 }, '16 %');
      assertClose(calculate({ ...GAS, overpressure: 'fire' }).outputs.relieving_pressure_kpa, SET_FOR_670 * 1.21 + 101.325, { rel: 1e-12 }, '21 %');
      assertClose(calculate({ ...GAS, set_pressure_kpa: 100 }).outputs.relieving_pressure_kpa, 100 + 20.7 + 101.325, { rel: 1e-12 }, 'minimum overpressure');
      assertClose(calculate({ ...GAS, rupture_disk: 'yes' }).outputs.required_area_mm2, calculate(GAS).outputs.required_area_mm2 / 0.9, { rel: 1e-12 }, 'K_c');
      assertEqual(OVERPRESSURE.single.fraction === 0.1 && OVERPRESSURE.fire.fraction === 0.21, true, 'table');
      assertThrows(() => calculate({ ...GAS, back_pressure_kpa: 700 }), 'at or above the relieving pressure', 'back pressure');
      assertThrows(() => calculate({ ...GAS, gas: 'xenon' }), 'must be one of', 'gas');
    },
  },
];
