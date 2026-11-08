/**
 * fuel-lcv-co2/tests.js — checks of the ISO 8217 Annex H correlations and the CO₂ factor arithmetic.
 * Run: node run-tests.js fuel-lcv-co2
 */
import { calculate, netSpecificEnergyMjKg, grossSpecificEnergyMjKg } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HFO = { fuel_class: 'residual', density_15_kg_m3: 991, water_pct: 0.2, ash_pct: 0.05, sulphur_pct: 0.5, co2_mode: 'grade', fuel_grade: 'vlsfo', carbon_pct: 86.5, reference_lcv_kj_kg: 42700 };
const MGO = { ...HFO, fuel_class: 'distillate', density_15_kg_m3: 850, water_pct: 0.05, ash_pct: 0.01, sulphur_pct: 0.1, fuel_grade: 'mgo' };

export const tests = [
  {
    name: 'Residual fuel H.1: ρ 991, 0.2 % water, 0.05 % ash, 0.5 % sulphur → (46.704 − 8.6443 + 3.1385) × 0.9925 + 0.0471 − 0.0049 = 40.93 MJ/kg; gross H.2 = 43.27 MJ/kg',
    source: 'ISO 8217:2017 Annex H formulae (H.1), (H.2)',
    run: () => {
      const base = 46.704 - 8.802 * 991 * 991 * 1e-6 + 3.167 * 0.991;
      const expected = base * (1 - 0.01 * 0.75) + 0.0942 * 0.5 - 0.02449 * 0.2;
      assertClose(netSpecificEnergyMjKg('residual', 991, 0.2, 0.05, 0.5), expected, { rel: 1e-12 }, 'H.1 formula');
      assertClose(expected, 40.93, { abs: 0.01 }, 'H.1 value');
      const { outputs } = calculate(HFO);
      assertClose(outputs.q_net_kj_kg / 1000, 40.93, { abs: 0.01 }, 'in calculate');
      const gross = (52.19 - 8.802 * 991 * 991 * 1e-6) * (1 - 0.0075) + 0.0942 * 0.5;
      assertClose(outputs.q_gross_kj_kg / 1000, gross, { rel: 1e-12 }, 'H.2');
      assertClose(outputs.q_gross_kj_kg / 1000, 43.27, { abs: 0.01 }, 'H.2 value');
      assertClose(outputs.hydrogen_penalty_kj_kg, outputs.q_gross_kj_kg - outputs.q_net_kj_kg, { rel: 1e-12 }, 'gross − net');
    },
  },
  {
    name: 'Distillate H.3: ρ 850, 0.05 % water, 0.01 % ash, 0.1 % sulphur → 42.71 MJ/kg (the usual MGO value); gross 45.50 MJ/kg',
    source: 'ISO 8217:2017 Annex H formulae (H.3), (H.4); FuelEU default MGO LCV 42.7 MJ/kg',
    run: () => {
      const { outputs } = calculate(MGO);
      const base = 46.423 - 8.792 * 850 * 850 * 1e-6 + 3.17 * 0.85;
      assertClose(outputs.q_net_kj_kg / 1000, base * (1 - 0.0016) + 0.0942 * 0.1 - 0.02449 * 0.05, { rel: 1e-12 }, 'H.3');
      assertClose(outputs.q_net_kj_kg / 1000, 42.71, { abs: 0.01 }, 'value');
      assertClose(grossSpecificEnergyMjKg('distillate', 850, 0.05, 0.01, 0.1), (51.916 - 8.792 * 0.7225) * 0.9984 + 0.00942, { rel: 1e-12 }, 'H.4');
      assertClose(outputs.q_gross_kj_kg / 1000, 45.50, { abs: 0.01 }, 'H.4 value');
    },
  },
  {
    name: 'Energy per tonne and litre: HFO 40.93 GJ/t and 40.56 MJ/L at 991 kg/m³; MGO 36.30 MJ/L — the distillate has more energy per kg but less per litre',
    source: 'Unit conversions at 15 °C',
    run: () => {
      const h = calculate(HFO).outputs;
      const m = calculate(MGO).outputs;
      assertClose(h.energy_per_tonne_gj, h.q_net_kj_kg / 1000, { rel: 1e-12 }, 'GJ/t');
      assertClose(h.energy_per_litre_mj, (h.q_net_kj_kg / 1000) * 0.991, { rel: 1e-12 }, 'MJ/L');
      assertClose(h.energy_per_litre_mj, 40.56, { abs: 0.01 }, 'HFO MJ/L');
      assertClose(m.energy_per_litre_mj, 36.30, { abs: 0.01 }, 'MGO MJ/L');
      assertEqual(m.q_net_kj_kg > h.q_net_kj_kg && m.energy_per_litre_mj < h.energy_per_litre_mj, true, 'per kg vs per litre');
    },
  },
  {
    name: 'CO₂ factor: VLSFO grade 3.151 t/t implies 86.0 % carbon; HFO 3.114/40.5 MJ/kg = 76.9 g CO₂/MJ (FuelEU default); measured 86.5 % carbon → C_F = 0.865 × 44.0095/12.011 = 3.169',
    source: 'MEPC.364(79) Table 1; FuelEU Annex II defaults; stoichiometry C + O₂ → CO₂',
    run: () => {
      const v = calculate(HFO).outputs;
      assertClose(v.co2_factor, 3.151, { rel: 1e-12 }, 'VLSFO C_F');
      assertClose(v.carbon_content_pct, (3.151 / (44.0095 / 12.011)) * 100, { rel: 1e-12 }, 'implied carbon');
      assertClose(v.carbon_content_pct, 86.0, { abs: 0.05 }, 'carbon value');
      const hfo = calculate({ ...HFO, fuel_grade: 'hfo', density_15_kg_m3: 991 }).outputs;
      assertClose((3.114 * 1000) / 40.5, 76.89, { abs: 0.01 }, 'FuelEU default intensity');
      assertClose(hfo.co2_per_mj, (3.114 * 1000) / (hfo.q_net_kj_kg / 1000), { rel: 1e-12 }, 'g/MJ formula');
      const c = calculate({ ...HFO, co2_mode: 'carbon', carbon_pct: 86.5 }).outputs;
      assertClose(c.co2_factor, 0.865 * (44.0095 / 12.011), { rel: 1e-12 }, 'from carbon');
      assertClose(c.co2_factor, 3.169, { abs: 1e-3 }, 'value');
    },
  },
  {
    name: 'Reference-fuel scaling: 42 700/40 930 = 1.0432 t of this HFO per tonne of reference fuel; MGO at 42.71 MJ/kg scales by 0.9998; warnings for a mis-classed fuel and for LNG with the petroleum formula',
    source: 'ISO 3046 / ISO 19030 42 700 kJ/kg reference; behaviour specification',
    run: () => {
      const h = calculate(HFO).outputs;
      assertClose(h.reference_scale, 42700 / h.q_net_kj_kg, { rel: 1e-12 }, 'scale');
      assertClose(h.reference_scale, 1.0432, { abs: 1e-4 }, 'value');
      assertClose(calculate(MGO).outputs.reference_scale, 0.9998, { abs: 2e-4 }, 'MGO scale');
      assertEqual(calculate({ ...HFO, density_15_kg_m3: 850 }).warnings.some((w) => w.includes('check the fuel class')), true, 'class warning');
      assertEqual(calculate({ ...HFO, fuel_grade: 'lng' }).warnings.some((w) => w.includes('does not apply to LNG')), true, 'LNG warning');
    },
  },
  {
    name: 'Validation: density outside 600–1 200, unknown grade and carbon content above 100 % are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...HFO, density_15_kg_m3: 1300 }), 'between', 'density');
      assertThrows(() => calculate({ ...HFO, fuel_grade: 'coal' }), 'must be one of', 'grade');
      assertThrows(() => calculate({ ...HFO, co2_mode: 'carbon', carbon_pct: 120 }), 'between', 'carbon');
    },
  },
];
