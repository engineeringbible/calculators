/**
 * bunker-quantity/tests.js — checks against the Table 54B generating equation, ISO 91 air buoyancy and hand values.
 * Run: node run-tests.js bunker-quantity
 */
import { calculate, volumeCorrectionFactor, alphaPerC, productGroup, PRODUCT_GROUPS, AIR_BUOYANCY_KG_M3 } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'VCF is exactly 1 at 15 °C for any density; product groups cover 610.6–1163.5 kg/m³ contiguously',
    source: 'ASTM D1250-80 Table 54B: reference temperature 15 °C; group boundaries 770.352, 787.5195, 838.3127 kg/m³',
    run: () => {
      assertClose(volumeCorrectionFactor(991, 15), 1, { rel: 1e-12 }, 'HFO');
      assertClose(volumeCorrectionFactor(850, 15), 1, { rel: 1e-12 }, 'MGO');
      assertClose(volumeCorrectionFactor(700, 15), 1, { rel: 1e-12 }, 'gasoline');
      for (let k = 1; k < PRODUCT_GROUPS.length; k += 1) assertEqual(PRODUCT_GROUPS[k].min, PRODUCT_GROUPS[k - 1].max, `group ${k} contiguous`);
      assertEqual(productGroup(991).id, 'fuel_oils', 'HFO group');
      assertEqual(productGroup(850).id, 'fuel_oils', 'MGO is in the fuel-oil group');
      assertEqual(productGroup(800).id, 'jet_fuels', 'jet group');
      assertEqual(productGroup(780).id, 'transition', 'transition group');
      assertEqual(productGroup(740).id, 'gasolines', 'gasoline group');
      assertEqual(productGroup(600), null, 'below range');
    },
  },
  {
    name: 'HFO 991 kg/m³ at 50 °C: α = 186.9696/991² + 0.4862/991 = 6.810 × 10⁻⁴ /°C, VCF = 0.9760 (density falls to 967 kg/m³)',
    source: 'Table 54B fuel-oil coefficients K0 = 186.9696, K1 = 0.4862 (API MPMS 11.1-1980, °C form); printed Table 54B value 0.9760; field rule 0.00068 kg/L per °C',
    run: () => {
      assertClose(alphaPerC(991), 6.810e-4, { rel: 2e-3 }, 'α');
      assertClose(volumeCorrectionFactor(991, 50), 0.9760, { abs: 5e-4 }, 'VCF');
      const { outputs } = calculate({ volume_obs_m3: 500, temperature_c: 50, density15_kg_m3: 991 });
      assertClose(outputs.density_at_temp_kg_m3, 991 * 0.976, { abs: 0.6 }, 'density at 50 °C');
      assertEqual(outputs.product_group.startsWith('Fuel oils'), true, 'group label');
    },
  },
  {
    name: 'MGO 850 kg/m³ at 30 °C: VCF = 0.9875; at 0 °C the factor exceeds 1 (contraction)',
    source: 'Table 54B generating equation; printed value 0.9875 for 850 kg/m³ at 30 °C',
    run: () => {
      assertClose(volumeCorrectionFactor(850, 30), 0.9875, { abs: 5e-4 }, 'VCF 30 °C');
      assertEqual(volumeCorrectionFactor(850, 0) > 1, true, 'cold fuel is denser');
      assertClose(volumeCorrectionFactor(850, 0), 1.0126, { abs: 6e-4 }, 'VCF 0 °C');
    },
  },
  {
    name: 'Default parcel: 500 m³ at 45 °C, 985 kg/m³ → VCF 0.9796, 489.8 m³ at 15 °C, 482.4 t in vacuo, 481.9 t in air (ρ − 1.1)',
    source: 'Table 54B relation; ISO 91 / ASTM Table 56 air-buoyancy convention of 1.1 kg/m³; hand calculation',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.vcf, 0.9796, { abs: 5e-4 }, 'VCF');
      assertClose(outputs.volume_15_m3, 500 * outputs.vcf, { rel: 1e-12 }, 'V15');
      assertClose(outputs.mass_vacuo_t, (outputs.volume_15_m3 * 985) / 1000, { rel: 1e-12 }, 'mass vacuo');
      assertClose(outputs.mass_air_t, (outputs.volume_15_m3 * (985 - AIR_BUOYANCY_KG_M3)) / 1000, { rel: 1e-12 }, 'mass air');
      assertClose(outputs.mass_vacuo_t, 482.4, { abs: 0.3 }, 'mass vacuo value');
      assertClose(outputs.mass_air_t / outputs.mass_vacuo_t, (985 - 1.1) / 985, { rel: 1e-12 }, 'air/vacuo ratio');
    },
  },
  {
    name: 'Density stated in air: 985 in air = 986.1 in vacuo, and the mass in air is then based on 985 again',
    source: 'ISO 91: ρ_air = ρ_vacuo − 1.1 kg/m³',
    run: () => {
      const { outputs } = calculate({ density_basis: 'air', density15_kg_m3: 985 });
      assertClose(outputs.density15_vacuo_kg_m3, 986.1, { rel: 1e-12 }, 'vacuo');
      assertClose(outputs.mass_air_t, (outputs.volume_15_m3 * 985) / 1000, { rel: 1e-12 }, 'mass in air');
    },
  },
  {
    name: 'Energy and reference fuel: 481.9 t × 40.5 MJ/kg = 19 517 GJ = 457.1 t of 42.7 MJ/kg reference fuel; cost 481.9 × 550 $',
    source: 'Energy = mass × LCV; reference LCV 42 700 kJ/kg (ISO 3046-1 / ISO 15550)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.energy_j, outputs.mass_air_t * 1000 * 40.5e6, { rel: 1e-12 }, 'energy');
      assertClose(outputs.reference_fuel_t, outputs.mass_air_t * (40.5 / 42.7), { rel: 1e-9 }, 'reference fuel');
      assertClose(outputs.cost, outputs.mass_air_t * 550, { rel: 1e-12 }, 'cost');
      assertClose(convert(outputs.energy_j, 'J', 'GJ', 'energy'), 19517, { abs: 15 }, 'GJ');
    },
  },
  {
    name: 'BDN comparison: BDN 500 t vs measured 481.9 t = −18.1 t = −3.6 % and a protest warning; 0 disables the comparison',
    source: 'Bunker-dispute practice: ±0.5 % measurement tolerance (industry guidance, e.g. IBIA best practice)',
    run: () => {
      const { outputs, warnings } = calculate({ bdn_mass_t: 500 });
      assertClose(outputs.bdn_difference_t, outputs.mass_air_t - 500, { rel: 1e-12 }, 'difference');
      assertClose(outputs.bdn_difference_pct, ((outputs.mass_air_t - 500) / 500) * 100, { rel: 1e-12 }, 'difference %');
      assertEqual(warnings.some((w) => w.includes('letter of protest')), true, 'protest warning');
      assertEqual(calculate({ bdn_mass_t: 0 }).outputs.bdn_difference_t, null, 'disabled');
    },
  },
  {
    name: 'Temperature sensitivity: for HFO a 1 °C error moves the mass by about 0.07 %',
    source: 'd(VCF)/dT ≈ −α ≈ −6.8 × 10⁻⁴ per °C for residual fuel',
    run: () => {
      const a = calculate({ temperature_c: 45, density15_kg_m3: 991 }).outputs.mass_air_t;
      const b = calculate({ temperature_c: 46, density15_kg_m3: 991 }).outputs.mass_air_t;
      assertClose((a - b) / a, 6.9e-4, { abs: 1e-4 }, 'relative change per °C');
    },
  },
  {
    name: 'Unit layer: 1 MJ/kg = 1000 kJ/kg = 429.9 Btu/lb; 1 US gal = 0.003785 m³',
    source: 'NIST SP 811: 1 Btu/lb = 2326 J/kg exactly',
    run: () => {
      assertClose(convert(1, 'MJ_kg', 'kJ_kg', 'specific_energy'), 1000, { rel: 1e-12 }, 'MJ → kJ');
      assertClose(convert(1, 'MJ_kg', 'btu_lb', 'specific_energy'), 429.92, { abs: 0.01 }, 'MJ/kg → Btu/lb');
      assertClose(convert(1, 'gal_us', 'm3', 'volume'), 0.003785411784, { rel: 1e-12 }, 'gallon');
    },
  },
  {
    name: 'Invalid inputs fail fast: density outside Table 54B, temperature above 150 °C, negative volume',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ density15_kg_m3: 1200 }), 'outside the Table 54B range', 'density high');
      assertThrows(() => calculate({ density15_kg_m3: 605 }), 'outside the Table 54B range', 'density low');
      assertThrows(() => calculate({ temperature_c: 200 }), 'between -50 and 150', 'temperature');
      assertThrows(() => calculate({ volume_obs_m3: -1 }), 'must not be negative', 'volume');
    },
  },
];
