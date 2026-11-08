/**
 * thermal-expansion/tests.js — checks against textbook thermal-stress values and the trapped-liquid rule of thumb.
 * Run: node run-tests.js thermal-expansion
 */
import { calculate, linearExpansionM, restraintStressPa, trappedLiquidPressureRisePa, SOLIDS, LIQUIDS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '100 m of carbon steel heated 100 K expands 12.0 × 10⁻⁶ × 100 × 100 = 120 mm (1.2 mm per metre per 100 K)',
    source: 'Hibbeler, Mechanics of Materials, §4-6, δ_T = α ΔT L; α steel 12 ×10⁻⁶/°C (Hibbeler back cover table)',
    run: () => {
      assertClose(linearExpansionM(12e-6, 100, 100), 0.12, { rel: 1e-12 }, 'helper');
      const { outputs } = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 100, delta_t_k: 100, restraint: 'free' });
      assertClose(outputs.free_expansion_m, 0.12, { rel: 1e-12 }, 'ΔL');
      assertClose(outputs.thermal_strain, 1.2e-3, { rel: 1e-12 }, 'strain');
      assertClose(outputs.thermal_stress_pa, 0, { abs: 1e-9 }, 'no stress when free');
      assertClose(outputs.movement_for_zero_stress_m, 0.12, { rel: 1e-12 }, 'movement needed');
    },
  },
  {
    name: 'Fully restrained steel heated 100 K: σ = E α ΔT = 200 GPa × 12 ×10⁻⁶ × 100 = 240 MPa (2.4 MPa per K), above S235 yield; force on a 100 cm² section 2.4 MN',
    source: 'Hibbeler §4-6 Example 4-10 type problem: thermal stress E α ΔT independent of length',
    run: () => {
      assertClose(restraintStressPa(200e9, 12e-6, 100, 100, 0), 240e6, { rel: 1e-12 }, 'helper');
      const { outputs, warnings } = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 100, delta_t_k: 100, restraint: 'full', area_m2: 0.01 });
      assertClose(outputs.thermal_stress_pa, 240e6, { rel: 1e-12 }, 'stress');
      assertClose(outputs.stress_per_k_pa, 2.4e6, { rel: 1e-12 }, 'per kelvin');
      assertClose(outputs.anchor_force_n, 2.4e6, { rel: 1e-12 }, 'force');
      assertClose(outputs.yield_utilisation_pct, (240 / 235) * 100, { rel: 1e-9 }, 'utilisation');
      assertEqual(warnings.some((w) => w.includes('exceeds the yield')), true, 'yield warning');
      const short = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 1, delta_t_k: 100, restraint: 'full', area_m2: 0.01 }).outputs;
      assertClose(short.thermal_stress_pa, 240e6, { rel: 1e-12 }, 'stress independent of length');
    },
  },
  {
    name: 'Partial restraint: allowing 60 mm of the 120 mm free expansion halves the stress to 120 MPa; allowing 150 mm gives zero',
    source: 'σ = E (α ΔT − δ/L), Hibbeler §4-6 (gap problems)',
    run: () => {
      const half = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 100, delta_t_k: 100, restraint: 'partial', allowed_movement_m: 0.06 }).outputs;
      assertClose(half.thermal_stress_pa, 120e6, { rel: 1e-12 }, 'half stress');
      assertClose(half.restrained_strain, 0.6e-3, { rel: 1e-12 }, 'mechanical strain');
      const none = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 100, delta_t_k: 100, restraint: 'partial', allowed_movement_m: 0.15 });
      assertClose(none.outputs.thermal_stress_pa, 0, { abs: 1e-9 }, 'zero stress');
      assertEqual(none.warnings.some((w) => w.includes('exceeds the free expansion')), true, 'warning');
    },
  },
  {
    name: 'Cooling produces tension: steel cooled 50 K fully restrained gives −120 MPa (tensile); aluminium expands 23.1/12.0 = 1.93 × steel',
    source: 'Sign convention of this calculator (compression positive when heated); α aluminium 23.1 ×10⁻⁶/K (Callister Table 19.1)',
    run: () => {
      const cold = calculate({ mode: 'linear', material: 'carbon_steel', length_m: 10, delta_t_k: -50, restraint: 'full' }).outputs;
      assertClose(cold.thermal_stress_pa, -120e6, { rel: 1e-12 }, 'tensile');
      assertClose(cold.free_expansion_m, -6e-3, { rel: 1e-12 }, 'contraction');
      assertClose(SOLIDS.aluminium.alpha / SOLIDS.carbon_steel.alpha, 1.925, { abs: 1e-3 }, 'Al/steel ratio');
      const al = calculate({ mode: 'linear', material: 'aluminium', length_m: 10, delta_t_k: 50, restraint: 'free' }).outputs;
      assertClose(al.free_expansion_m, 23.1e-6 * 10 * 50, { rel: 1e-12 }, 'Al expansion');
    },
  },
  {
    name: 'Custom material: α 17.3 ppm/K and E 193 GPa (304 stainless) heated 100 K → 334 MPa, matching the preset',
    source: 'Stainless 304 α 17.3 ×10⁻⁶/K, E 193 GPa (ASME B31.3 Appendix C / Callister)',
    run: () => {
      const custom = calculate({ mode: 'linear', material: 'custom', alpha_per_k: 17.3e-6, modulus_pa: 193e9, yield_pa: 205e6, length_m: 10, delta_t_k: 100, restraint: 'full' }).outputs;
      const preset = calculate({ mode: 'linear', material: 'stainless_304', length_m: 10, delta_t_k: 100, restraint: 'full' }).outputs;
      assertClose(custom.thermal_stress_pa, 333.89e6, { abs: 0.01e6 }, 'stress');
      assertClose(custom.thermal_stress_pa, preset.thermal_stress_pa, { rel: 1e-12 }, 'custom equals preset');
    },
  },
  {
    name: 'Volumetric: 500 m³ of heavy fuel oil warmed 10 K expands by 0.68 ×10⁻³ × 500 × 10 = 3.4 m³ (0.68 %), consistent with the Table 54B density slope',
    source: 'ΔV = β V ΔT; β residual fuel ≈ 0.68 ×10⁻³/K ≈ α of Table 54B for 991 kg/m³ (0.681 ×10⁻³/°C)',
    run: () => {
      const { outputs } = calculate({ mode: 'volumetric', liquid: 'heavy_fuel_oil', volume_m3: 500, delta_t_k: 10, confined: 'vented' });
      assertClose(outputs.volume_change_m3, 3.4, { rel: 1e-9 }, 'ΔV');
      assertClose(outputs.volume_change_pct, 0.68, { rel: 1e-9 }, 'ΔV %');
      assertEqual(outputs.pressure_rise_pa, null, 'vented: no pressure rise');
      assertClose(LIQUIDS.heavy_fuel_oil.beta, 0.68e-3, { rel: 1e-12 }, 'β HFO');
    },
  },
  {
    name: 'Blocked-in water in steel pipe: Δp = K (β − 3 α) ΔT = 2.2 GPa × (0.21 − 0.036) ×10⁻³ × 10 K = 38 bar (≈ 3.8 bar per kelvin, the 3–5 bar/°C rule of thumb)',
    source: 'API Std 521 §4.4.12 hydraulic expansion; K water 2.2 GPa, β 0.21 ×10⁻³/K (CRC Handbook); pipe wall credit 3 α',
    run: () => {
      assertClose(trappedLiquidPressureRisePa(2.2e9, 0.21e-3, 12e-6, 10), 2.2e9 * 0.174e-3 * 10, { rel: 1e-12 }, 'helper');
      const { outputs, warnings } = calculate({ mode: 'volumetric', liquid: 'fresh_water', volume_m3: 1, delta_t_k: 10, confined: 'confined', pipe_alpha_per_k: 12e-6 });
      assertClose(convert(outputs.pressure_rise_pa, 'Pa', 'bar', 'pressure'), 38.28, { abs: 0.01 }, 'Δp');
      assertClose(convert(outputs.pressure_rise_per_k_pa, 'Pa', 'bar', 'pressure'), 3.828, { abs: 1e-3 }, 'Δp per K');
      assertClose(outputs.relief_volume_m3, 0.174e-3 * 10, { rel: 1e-9 }, 'relief volume');
      assertEqual(warnings.some((w) => w.includes('thermal relief valve')), true, 'relief warning');
      const rigid = trappedLiquidPressureRisePa(2.2e9, 0.21e-3, 0, 10);
      assertClose(rigid / outputs.pressure_rise_pa, 0.21 / 0.174, { rel: 1e-9 }, 'ignoring wall expansion overstates by 21 %');
    },
  },
  {
    name: 'Unit layer: 12 µm/(m·K) = 6.67 µin/(in·°F) = 1.2 ×10⁻⁵/K; 100 K = 180 °F difference',
    source: 'α per °F = α per K / 1.8 (temperature interval conversion)',
    run: () => {
      assertClose(convert(12e-6, 'per_K', 'ppm_F', 'thermal_expansion'), 6.667, { abs: 1e-3 }, 'ppm/°F');
      assertClose(convert(12, 'ppm_K', 'per_K', 'thermal_expansion'), 1.2e-5, { rel: 1e-12 }, 'ppm/K → 1/K');
      assertClose(convert(100, 'K', 'F', 'temperature_difference'), 180, { rel: 1e-12 }, 'ΔT');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero length, unknown material, zero liquid volume',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ mode: 'linear', length_m: 0 }), 'greater than zero', 'length');
      assertThrows(() => calculate({ mode: 'linear', material: 'unobtainium' }), 'must be one of', 'material');
      assertThrows(() => calculate({ mode: 'volumetric', volume_m3: 0 }), 'greater than zero', 'volume');
    },
  },
];
