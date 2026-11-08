/**
 * cathodic-protection/tests.js — checks against the DNV-RP-B401 (2021) tables and formulas.
 * Run: node run-tests.js cathodic-protection
 */
import { calculate, anodeResistance, CURRENT_DENSITY, COATING, ANODE_MATERIALS, ANODE_TYPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const OFFSHORE = { mode: 'offshore', area_m2: 1000, design_life_y: 25, region: 'temperate', depth_band: '0_30', coating: 'II', material: 'al', anode_type: 'long_standoff', anode_mass_kg: 300, anode_length_m: 2, anode_width_m: 0.157, anode_thickness_m: 0.157, resistivity_ohm_m: 0.3 };
const HULL = { mode: 'hull', area_m2: 6000, design_life_y: 2.5, hull_density_a_m2: 0.015, extend_30_months: 'auto', propeller_area_m2: 40, propeller_density_a_m2: 0.5, bare_area_m2: 50, bare_density_a_m2: 0.12, material: 'zn', anode_type: 'bracelet_flush', anode_mass_kg: 20, anode_length_m: 0.6, anode_width_m: 0.15, anode_thickness_m: 0.05, resistivity_ohm_m: 0.25 };

export const tests = [
  {
    name: 'RP-B401 tables: temperate 0–30 m bare steel 0.200/0.100/0.130 A/m² (initial/mean/final), tropical > 300 m 0.180/0.090/0.130; category II a 0.05, b 0.025 (0–30 m) and 0.015 (> 30 m); Al 2 000 Ah/kg −1.05 V, Zn 780 Ah/kg −1.03 V; u 0.90/0.85/0.85/0.80',
    source: 'DNV-RP-B401 (May 2021) Tables 8-1, 8-2, 8-4, 8-6, 8-8',
    run: () => {
      assertEqual(CURRENT_DENSITY.temperate.bands['0_30'].join(','), '0.2,0.1,0.13', 'temperate 0–30');
      assertEqual(CURRENT_DENSITY.tropical.bands['300'].join(','), '0.18,0.09,0.13', 'tropical > 300');
      assertEqual(CURRENT_DENSITY.arctic.bands['0_30'].join(','), '0.25,0.12,0.17', 'arctic 0–30');
      assertEqual(COATING.II.a === 0.05 && COATING.II.b.shallow === 0.025 && COATING.II.b.deep === 0.015, true, 'category II');
      assertEqual(COATING.I.b.shallow === 0.1 && COATING.III.b.shallow === 0.012 && COATING.IV.b.deep === 0.005, true, 'other categories');
      assertEqual(ANODE_MATERIALS.al.capacity === 2000 && ANODE_MATERIALS.al.potential === -1.05, true, 'Al');
      assertEqual(ANODE_MATERIALS.zn.capacity === 780 && ANODE_MATERIALS.zn.potential === -1.03, true, 'Zn');
      assertEqual([ANODE_TYPES.long_standoff.u, ANODE_TYPES.short_standoff.u, ANODE_TYPES.long_flush.u, ANODE_TYPES.bracelet_flush.u].join(','), '0.9,0.85,0.85,0.8', 'utilisation');
    },
  },
  {
    name: 'Offshore example: 1 000 m² temperate 0–30 m, category II, 25 years → f_ci 0.05, f_cm 0.3625, f_cf 0.675; I_ci 10 A, I_cm 36.25 A, I_cf 87.75 A; charge 7.94 MAh; Al anodes u 0.9 → 4 410 kg → 15 × 300 kg',
    source: 'DNV-RP-B401 §3.4 (f_c = a + b t), §4.4 (I_c = A i_c f_c), eq. 4.5 (M = I_cm t_f 8760/(u ε))',
    run: () => {
      const { outputs } = calculate(OFFSHORE);
      assertClose(outputs.fc_initial, 0.05, { rel: 1e-12 }, 'f_ci');
      assertClose(outputs.fc_mean, 0.05 + 0.025 * 12.5, { rel: 1e-12 }, 'f_cm');
      assertClose(outputs.fc_final, 0.05 + 0.025 * 25, { rel: 1e-12 }, 'f_cf');
      assertClose(outputs.current_initial_a, 1000 * 0.2 * 0.05, { rel: 1e-12 }, 'I_ci');
      assertClose(outputs.current_mean_a, 36.25, { rel: 1e-12 }, 'I_cm');
      assertClose(outputs.current_final_a, 1000 * 0.13 * 0.675, { rel: 1e-12 }, 'I_cf');
      assertClose(outputs.charge_ah, 36.25 * 25 * 8760, { rel: 1e-12 }, 'charge');
      assertClose(outputs.mass_required_kg, (36.25 * 25 * 8760) / (0.9 * 2000), { rel: 1e-12 }, 'mass');
      assertClose(outputs.mass_required_kg, 4410, { abs: 1 }, 'mass value');
      assertEqual(outputs.anode_count, 15, 'count');
      assertClose(outputs.life_installed_y, (15 * 300 * 0.9 * 2000) / (36.25 * 8760), { rel: 1e-12 }, 'life');
    },
  },
  {
    name: 'Anode resistance (Table 8-7): long slender stand-off L 2 m, periphery 0.628 m (r 0.1 m), ρ 0.3 Ω·m → R_a = 0.3/(4π)(ln 80 − 1) = 0.0807 Ω, output (−0.80 + 1.05)/0.0807 = 3.10 A; bracelet 0.315 ρ/√A',
    source: 'DNV-RP-B401 Table 8-7 (Dwight formula), protective potential −0.80 V, Al closed-circuit potential −1.05 V',
    run: () => {
      const ra = anodeResistance('long_standoff', 0.3, 2, 0.157, 0.157);
      const r = (2 * (0.157 + 0.157)) / (2 * Math.PI);
      assertClose(r, 0.1, { abs: 1e-3 }, 'equivalent radius');
      assertClose(ra, (0.3 / (4 * Math.PI)) * (Math.log(8 / r) - 1), { rel: 1e-12 }, 'formula');
      assertClose(ra, 0.0807, { abs: 3e-4 }, 'R_a value');
      const { outputs } = calculate(OFFSHORE);
      assertClose(outputs.anode_output_a, 0.25 / ra, { rel: 1e-9 }, 'I_a');
      assertClose(outputs.anode_output_a, 3.10, { abs: 0.02 }, 'I_a value');
      assertClose(anodeResistance('bracelet_flush', 0.25, 0.6, 0.15, 0.05), (0.315 * 0.25) / Math.sqrt(0.09), { rel: 1e-12 }, 'bracelet');
      assertClose(anodeResistance('long_flush', 0.25, 0.6, 0.15, 0.05), 0.25 / (2 * 0.375), { rel: 1e-12 }, 'long flush ρ/2S');
    },
  },
  {
    name: 'Output check: 15 Al stand-off anodes give 46.5 A — above the 10 A initial demand but below the 87.75 A final demand → INSUFFICIENT with the count governed by output (29 anodes)',
    source: 'RP-B401 §4.8: total anode current output must meet the initial and final demands',
    run: () => {
      const { outputs, warnings } = calculate(OFFSHORE);
      assertEqual(outputs.output_check.startsWith('INSUFFICIENT'), true, 'insufficient');
      assertEqual(outputs.output_check.includes(`${Math.ceil(outputs.current_final_a / outputs.anode_output_a)} anodes`), true, 'needed count');
      assertEqual(warnings.some((w) => w.includes('governed by current output')), true, 'warning');
      const more = calculate({ ...OFFSHORE, anode_mass_kg: 120 }).outputs;
      assertEqual(more.anode_count >= 37 && more.output_check.startsWith('OK'), true, 'smaller anodes → enough output');
    },
  },
  {
    name: 'Ship hull: 6 000 m² at 15 mA/m² + 40 m² propeller at 500 + 50 m² bare at 120 → 116 A; 2.5 years → 2.54 MAh; zinc, u 0.80 → 4 070 kg → 204 × 20 kg; life 2.51 years; 3.4 anodes per 100 m²',
    source: 'Hull practice (DNV-CG-0288 / Cathwell: coated hull 10–20 mA/m², propeller 500 mA/m²); RP-B401 mass formula',
    run: () => {
      const { outputs } = calculate(HULL);
      assertClose(outputs.current_mean_a, 6000 * 0.015 + 40 * 0.5 + 50 * 0.12, { rel: 1e-12 }, 'I_cm');
      assertClose(outputs.current_mean_a, 116, { rel: 1e-12 }, 'value');
      assertClose(outputs.mass_required_kg, (116 * 2.5 * 8760) / (0.8 * 780), { rel: 1e-12 }, 'mass');
      assertClose(outputs.mass_required_kg, 4072, { abs: 1 }, 'mass value');
      assertEqual(outputs.anode_count, 204, 'count');
      assertClose(outputs.life_installed_y, (204 * 20 * 0.8 * 780) / (116 * 8760), { rel: 1e-12 }, 'life');
      assertClose(outputs.anodes_per_100m2, 204 / 60, { rel: 1e-12 }, 'per 100 m²');
      assertEqual(outputs.fc_mean, null, 'no breakdown factor in hull mode');
    },
  },
  {
    name: '30-month rule: design life 3 years adds 5 mA/m² automatically (20 mA/m²); "no" suppresses it, "yes" forces it at 2 years',
    source: 'Class guidance: increase the design current density by 5 mA/m² for operation beyond 30 months',
    run: () => {
      assertClose(calculate({ ...HULL, design_life_y: 3 }).outputs.density_used_a_m2, 0.02, { rel: 1e-12 }, 'auto');
      assertClose(calculate({ ...HULL, design_life_y: 3, extend_30_months: 'no' }).outputs.density_used_a_m2, 0.015, { rel: 1e-12 }, 'no');
      assertClose(calculate({ ...HULL, design_life_y: 2, extend_30_months: 'yes' }).outputs.density_used_a_m2, 0.02, { rel: 1e-12 }, 'yes');
      assertClose(calculate(HULL).outputs.density_used_a_m2, 0.015, { rel: 1e-12 }, '2.5 years exactly: no addition');
    },
  },
  {
    name: 'Aluminium instead of zinc on the hull needs 780/2000 = 39 % of the mass; bare steel coating category gives f_c = 1 and the full bare-steel demand',
    source: 'Table 8-6 capacities; f_c = 1 for uncoated steel',
    run: () => {
      const zn = calculate(HULL).outputs.mass_required_kg;
      const al = calculate({ ...HULL, material: 'al' }).outputs.mass_required_kg;
      assertClose(al / zn, 780 / 2000, { rel: 1e-12 }, 'ratio');
      const bare = calculate({ ...OFFSHORE, coating: 'bare' }).outputs;
      assertEqual(bare.fc_mean, 1, 'f_c = 1');
      assertClose(bare.current_mean_a, 1000 * 0.1, { rel: 1e-12 }, 'bare demand');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero area, negative design life, unknown region',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...HULL, area_m2: 0 }), 'greater than zero', 'area');
      assertThrows(() => calculate({ ...HULL, design_life_y: -1 }), 'greater than zero', 'life');
      assertThrows(() => calculate({ ...OFFSHORE, region: 'mars' }), 'must be one of', 'region');
    },
  },
];
