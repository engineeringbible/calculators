/**
 * ppm-concentration/tests.js — checks against the NIOSH ppm to mg/m³ factors and hand calculations.
 * Run: node run-tests.js ppm-concentration
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '35 g/L of NaCl in a 1 025 kg/m³ solution: 34 146 ppm, 3.415 % w/w, 0.5989 mol/L',
    source: 'Hand calculation: w = c / ρ, molarity = c / M with M(NaCl) = 58.44 g/mol (IUPAC 2021)',
    run: () => {
      const o = calculate({ phase: 'solution', sol_unit: 'g_L', value: 35, molar_mass: 58.44, density_kg_m3: 1025 }).outputs;
      assertClose(o.ppm_mass, 34146.34, { abs: 0.01 }, 'ppm');
      assertClose(o.pct_w, 3.41463, { abs: 1e-5 }, '% w/w');
      assertClose(o.mol_L, 0.598905, { abs: 1e-6 }, 'mol/L');
      assertEqual(o.ppmv, null, 'gas outputs are null');
    },
  },
  {
    name: 'NIOSH factors at 25 °C and 1 atm: 1 ppm of CO is 1.15 mg/m³, of H₂S 1.39 mg/m³, of benzene 3.19 mg/m³ (M / 24.45)',
    source: 'NIOSH Pocket Guide to Chemical Hazards (2005-149), conversion factors; NIOSH rounds the molar volume to 24.45 L (exact 24.465)',
    run: () => {
      for (const [M, f] of [[28.01, 1.15], [34.08, 1.39], [78.11, 3.19]]) {
        const o = calculate({ phase: 'gas', gas_unit: 'ppmv', value: 1, molar_mass: M, temp_k: 298.15, pressure_pa: 101325 }).outputs;
        assertClose(o.mg_m3, M / 24.45, { rel: 1e-3 }, `M ${M}`);
        assertClose(o.mg_m3, f, { abs: 0.006 }, `NIOSH ${f}`);
      }
    },
  },
  {
    name: 'Molar volume is 22.414 L/mol at 0 °C and 1 atm; 1 % by volume is 10 000 ppmv; mg/m³ round-trips to ppmv',
    source: 'CODATA molar volume of an ideal gas (273.15 K, 101.325 kPa)',
    run: () => {
      const o = calculate({ phase: 'gas', gas_unit: 'pctv', value: 1, temp_k: 273.15, pressure_pa: 101325 }).outputs;
      assertClose(o.molar_volume_L, 22.41397, { abs: 1e-4 }, 'Vm');
      assertClose(o.ppmv, 10000, { rel: 1e-12 }, 'ppmv');
      const back = calculate({ phase: 'gas', gas_unit: 'mg_m3', value: o.mg_m3, temp_k: 273.15, pressure_pa: 101325 }).outputs;
      assertClose(back.ppmv, 10000, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: '1 000 ppmv of CO₂ in air is 1 518.6 ppm by mass; in water 1 mg/L is 1 ppm; 100 mg/L of CaCO₃ is 0.999 mmol/L',
    source: 'Hand calculation: w = x M / (x M + (1 − x) M_air) with M_air = 28.9644 g/mol (ISO 2533); M(CaCO₃) = 100.09 g/mol',
    run: () => {
      const g = calculate({ phase: 'gas', gas_unit: 'ppmv', value: 1000, molar_mass: 44.0095 }).outputs;
      assertClose(g.ppm_mass_air, 1518.65, { abs: 0.05 }, 'CO₂ by mass');
      const s = calculate({ phase: 'solution', sol_unit: 'mg_L', value: 1, density_kg_m3: 1000 }).outputs;
      assertClose(s.ppm_mass, 1, { rel: 1e-12 }, 'ppm');
      assertClose(s.ppb_mass, 1000, { rel: 1e-12 }, 'ppb');
      assertClose(calculate({ sol_unit: 'mg_L', value: 100, molar_mass: 100.09 }).outputs.mmol_L, 0.99910, { abs: 1e-5 }, 'mmol/L');
    },
  },
  {
    name: 'More than 100 % is rejected; strong solutions at the default density warn; a bad unit is rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ sol_unit: 'pct', value: 120 }), 'more than 100 %');
      assertThrows(() => calculate({ phase: 'gas', gas_unit: 'pctv', value: 101 }), 'more than 100 %');
      assertEqual(calculate({ sol_unit: 'pct', value: 10 }).warnings.length, 1, 'density warning');
      assertThrows(() => calculate({ sol_unit: 'grains' }), 'Concentration given in');
    },
  },
];
