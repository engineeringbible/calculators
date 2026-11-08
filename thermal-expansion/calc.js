/**
 * thermal-expansion/calc.js — linear expansion of solids with free, partial or full restraint (thermal stress and force),
 * and volumetric expansion of liquids with the pressure rise of a trapped liquid in a pipe or tank.
 *
 * ΔL = α L ΔT;  σ = E (α ΔT − δ_allowed / L) when restrained;  ΔV = β V ΔT;  Δp = K (β − 3 α_pipe) ΔT for a confined liquid.
 * Schema units: SI — m, K, 1/K, Pa, m², m³.
 */
import { withDefaults, assertPositive, assertNonNegative, assertFinite, assertOneOf } from '../shared/validate.js';

/** Solid materials: mean linear expansion coefficient α (1/K, ~20–100 °C) and Young's modulus E (Pa). Typical handbook values. */
export const SOLIDS = {
  carbon_steel: { label: 'Carbon steel (α 12.0 µm/m·K, E 200 GPa)', alpha: 12.0e-6, e: 200e9, yieldPa: 235e6 },
  stainless_304: { label: 'Stainless steel 304 (α 17.3 µm/m·K, E 193 GPa)', alpha: 17.3e-6, e: 193e9, yieldPa: 205e6 },
  stainless_316: { label: 'Stainless steel 316 (α 16.0 µm/m·K, E 193 GPa)', alpha: 16.0e-6, e: 193e9, yieldPa: 205e6 },
  aluminium: { label: 'Aluminium alloy (α 23.1 µm/m·K, E 69 GPa)', alpha: 23.1e-6, e: 69e9, yieldPa: 240e6 },
  copper: { label: 'Copper (α 16.5 µm/m·K, E 117 GPa)', alpha: 16.5e-6, e: 117e9, yieldPa: 70e6 },
  cupronickel_9010: { label: 'Copper-nickel 90/10 (α 17.1 µm/m·K, E 135 GPa)', alpha: 17.1e-6, e: 135e9, yieldPa: 105e6 },
  brass: { label: 'Brass (α 19.0 µm/m·K, E 100 GPa)', alpha: 19.0e-6, e: 100e9, yieldPa: 120e6 },
  cast_iron: { label: 'Grey cast iron (α 10.5 µm/m·K, E 100 GPa)', alpha: 10.5e-6, e: 100e9, yieldPa: 150e6 },
  titanium: { label: 'Titanium Grade 2 (α 8.6 µm/m·K, E 105 GPa)', alpha: 8.6e-6, e: 105e9, yieldPa: 275e6 },
  pvc: { label: 'PVC-U (α 70 µm/m·K, E 3 GPa)', alpha: 70e-6, e: 3e9, yieldPa: 50e6 },
  hdpe: { label: 'HDPE (α 150 µm/m·K, E 0.9 GPa)', alpha: 150e-6, e: 0.9e9, yieldPa: 22e6 },
  grp: { label: 'GRP pipe, axial (α 25 µm/m·K, E 10 GPa)', alpha: 25e-6, e: 10e9, yieldPa: 100e6 },
  concrete: { label: 'Concrete (α 12 µm/m·K, E 30 GPa)', alpha: 12e-6, e: 30e9, yieldPa: 3e6 },
  glass: { label: 'Soda-lime glass (α 9.0 µm/m·K, E 70 GPa)', alpha: 9.0e-6, e: 70e9, yieldPa: 40e6 },
  custom: { label: 'Custom α and E', alpha: null, e: null, yieldPa: null },
};

/** Liquids: volumetric expansion coefficient β (1/K, near 20 °C) and bulk modulus K (Pa). Typical handbook values. */
export const LIQUIDS = {
  fresh_water: { label: 'Fresh water, 20 °C (β 0.21 ×10⁻³/K, K 2.2 GPa)', beta: 0.21e-3, bulk: 2.2e9 },
  sea_water: { label: 'Sea water, 20 °C (β 0.25 ×10⁻³/K, K 2.3 GPa)', beta: 0.25e-3, bulk: 2.3e9 },
  diesel_mgo: { label: 'Diesel / MGO (β 0.83 ×10⁻³/K, K 1.5 GPa)', beta: 0.83e-3, bulk: 1.5e9 },
  heavy_fuel_oil: { label: 'Heavy fuel oil (β 0.68 ×10⁻³/K, K 1.6 GPa)', beta: 0.68e-3, bulk: 1.6e9 },
  lube_oil: { label: 'Lubricating / hydraulic mineral oil (β 0.70 ×10⁻³/K, K 1.5 GPa)', beta: 0.70e-3, bulk: 1.5e9 },
  glycol_50: { label: 'Water–glycol 50 % (β 0.45 ×10⁻³/K, K 2.6 GPa)', beta: 0.45e-3, bulk: 2.6e9 },
  custom: { label: 'Custom β and K', beta: null, bulk: null },
};

export const schema = {
  id: 'thermal-expansion',
  name: 'Thermal expansion and restraint stress',
  category: 'mechanical',
  summary: 'Length change of solids with temperature, stress and force when restrained, and the volume change and pressure rise of a liquid trapped in a pipe or tank.',
  related: ['pressure-vessel', 'pipe-flow', 'bunker-quantity', 'heat-exchanger-lmtd'],
  assumptions: [
    'Linear expansion uses a mean coefficient α over the temperature range; α itself rises with temperature (carbon steel 11.5 at 20 °C to about 13.5 µm/m·K at 300 °C), so for large ranges use the mean value from the piping code tables (ASME B31.3 Appendix C) as a custom α.',
    'Material presets are typical handbook values for the alloy family, not certified properties; the yield strength used for the utilisation is a common grade (S235 for carbon steel, 304 annealed, etc.).',
    'Restraint stress σ = E (α ΔT − δ/L) assumes a straight, uniformly heated member held between rigid anchors with no bowing; real anchors and supports deflect, which lowers the force, and a slender restrained member buckles before it reaches the yield stress in compression.',
    'The thermal force σ A is the anchor load for full restraint and is independent of the member length; the allowed movement δ (expansion joint, loop, sliding support) is subtracted from the free expansion before the stress is formed.',
    'Volumetric expansion ΔV = β V ΔT uses a constant β near 20 °C; β of water varies strongly with temperature (near zero at 4 °C) and β of oils is given at 15–20 °C. For custody-transfer accuracy use the bunker-quantity calculator (Table 54B) rather than a constant β.',
    'The trapped-liquid pressure rise Δp = K (β − 3 α_pipe) ΔT assumes a completely filled, closed, rigid-walled system with no vapour space; the pipe or tank wall expansion (3 α_pipe) is credited but wall stretch under pressure and any air pocket are not, both of which reduce the real rise substantially.',
    'Temperature difference inputs are differences (K); the same number of Celsius degrees applies.',
  ],
  notes: [
    'Verification 2026-10-30: 100 m of carbon steel over 100 K expands 120 mm and, fully restrained, develops E α ΔT = 240 MPa (2.4 MPa per kelvin), the classic textbook figure that exceeds S235 yield; a trapped column of water in steel pipe rises about 3.8 bar per kelvin, matching the engineering rule of thumb of 3–5 bar/°C for blocked-in water lines.',
    'Design decision: liquids are included alongside solids because the blocked-in thermal expansion of fuel, oil and water in ship piping is the practical question that follows the linear case.',
    'Design decision: the 3 α_pipe credit for wall expansion is applied and stated, since omitting it overstates the pressure rise by 15–20 % for water in steel.',
  ],
  sources: [
    'Hibbeler, Mechanics of Materials, 10th ed., §4-6 "Thermal stress" (δ_T = α ΔT L, σ = E α ΔT)',
    'ASME B31.3 Process Piping, Appendix C Table C-1 (thermal expansion coefficients of piping materials) and Table C-6 (moduli)',
    'Callister & Rethwisch, Materials Science and Engineering, 10th ed., Table 19.1 (linear coefficients of thermal expansion)',
    'CRC Handbook of Chemistry and Physics (volumetric expansion and compressibility of liquids); API Std 521 §4.4.12 (hydraulic expansion of trapped liquids)',
    'ISO 91 / ASTM D1250 Table 54B (thermal expansion of petroleum products, consistent with β ≈ 0.68 ×10⁻³/K for residual fuel)',
  ],
  inputs: [
    {
      id: 'mode',
      label: 'Case',
      type: 'select',
      default: 'linear',
      options: [
        { value: 'linear', label: 'Linear expansion of a solid member (pipe, bar, hull structure)' },
        { value: 'volumetric', label: 'Volumetric expansion of a liquid (tank or blocked-in pipe)' },
      ],
    },
    { id: 'material', label: 'Material', type: 'select', default: 'carbon_steel', options: Object.entries(SOLIDS).map(([value, m]) => ({ value, label: m.label })), visibleWhen: { mode: 'linear' } },
    { id: 'alpha_per_k', label: 'Linear expansion coefficient α', group: 'thermal_expansion', unit: 'per_K', display: 'ppm_K', default: 12e-6, min: 1e-7, max: 1e-3, visibleWhen: { material: 'custom', mode: 'linear' } },
    { id: 'modulus_pa', label: "Young's modulus E", group: 'pressure', unit: 'Pa', display: 'GPa', default: 200e9, min: 1e7, max: 1e12, visibleWhen: { material: 'custom', mode: 'linear' } },
    { id: 'yield_pa', label: 'Yield strength (for the utilisation)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 235e6, min: 1e5, max: 5e9, visibleWhen: { material: 'custom', mode: 'linear' } },
    { id: 'length_m', label: 'Length L at the reference temperature', group: 'length', unit: 'm', default: 100, min: 0.001, max: 10000, visibleWhen: { mode: 'linear' } },
    { id: 'delta_t_k', label: 'Temperature change ΔT (+ heating)', group: 'temperature_difference', unit: 'K', default: 100, min: -300, max: 1500 },
    {
      id: 'restraint',
      label: 'Restraint',
      type: 'select',
      default: 'full',
      options: [
        { value: 'free', label: 'Free to expand (no stress)' },
        { value: 'partial', label: 'Partially restrained: a given movement is allowed' },
        { value: 'full', label: 'Fully restrained between rigid anchors' },
      ],
      visibleWhen: { mode: 'linear' },
    },
    { id: 'allowed_movement_m', label: 'Allowed movement δ (expansion joint, loop, gap)', group: 'length', unit: 'm', display: 'mm', default: 0.06, min: 0, max: 10, visibleWhen: { restraint: 'partial', mode: 'linear' } },
    { id: 'area_m2', label: 'Cross-section area A (for the anchor force)', group: 'area', unit: 'm2', display: 'cm2', default: 0.01, min: 1e-8, max: 100, visibleWhen: { mode: 'linear' } },
    { id: 'liquid', label: 'Liquid', type: 'select', default: 'fresh_water', options: Object.entries(LIQUIDS).map(([value, l]) => ({ value, label: l.label })), visibleWhen: { mode: 'volumetric' } },
    { id: 'beta_per_k', label: 'Volumetric expansion coefficient β', group: 'thermal_expansion', unit: 'per_K', default: 0.21e-3, min: 1e-6, max: 1e-2, visibleWhen: { liquid: 'custom', mode: 'volumetric' } },
    { id: 'bulk_modulus_pa', label: 'Bulk modulus K', group: 'pressure', unit: 'Pa', display: 'GPa', default: 2.2e9, min: 1e7, max: 1e11, visibleWhen: { liquid: 'custom', mode: 'volumetric' } },
    { id: 'volume_m3', label: 'Liquid volume V', group: 'volume', unit: 'm3', default: 10, min: 1e-6, max: 1e6, visibleWhen: { mode: 'volumetric' } },
    { id: 'confined', label: 'Confinement', type: 'select', default: 'confined', options: [{ value: 'vented', label: 'Vented tank: volume change only' }, { value: 'confined', label: 'Blocked-in, completely filled: pressure rise' }], visibleWhen: { mode: 'volumetric' } },
    { id: 'pipe_alpha_per_k', label: 'Linear expansion coefficient of the containing pipe or tank', group: 'thermal_expansion', unit: 'per_K', display: 'ppm_K', default: 12e-6, min: 0, max: 1e-3, visibleWhen: { confined: 'confined', mode: 'volumetric' } },
  ],
  outputs: [
    { id: 'alpha_out_per_k', label: 'Linear expansion coefficient used', group: 'thermal_expansion', unit: 'per_K', display: 'ppm_K', visibleWhen: { mode: 'linear' } },
    { id: 'free_expansion_m', label: 'Free expansion ΔL = α L ΔT', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'linear' } },
    { id: 'thermal_strain', label: 'Thermal strain α ΔT', group: 'dimensionless', unit: 'none', visibleWhen: { mode: 'linear' } },
    { id: 'restrained_strain', label: 'Mechanical strain imposed by the restraint', group: 'dimensionless', unit: 'none', visibleWhen: { mode: 'linear' } },
    { id: 'thermal_stress_pa', label: 'Thermal stress σ = E × restrained strain (compression when heated)', group: 'pressure', unit: 'Pa', display: 'MPa', visibleWhen: { mode: 'linear' } },
    { id: 'stress_per_k_pa', label: 'Stress per kelvin for full restraint E α', group: 'pressure', unit: 'Pa', display: 'MPa', visibleWhen: { mode: 'linear' } },
    { id: 'anchor_force_n', label: 'Force on the anchors σ A', group: 'force', unit: 'N', display: 'kN', visibleWhen: { mode: 'linear' } },
    { id: 'yield_utilisation_pct', label: 'Thermal stress ÷ yield strength', group: 'ratio', unit: 'pct', visibleWhen: { mode: 'linear' } },
    { id: 'movement_for_zero_stress_m', label: 'Movement to allow for zero stress', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'linear' } },
    { id: 'beta_out_per_k', label: 'Volumetric expansion coefficient used', group: 'thermal_expansion', unit: 'per_K', visibleWhen: { mode: 'volumetric' } },
    { id: 'volume_change_m3', label: 'Volume change ΔV = β V ΔT (unconfined)', group: 'volume', unit: 'm3', display: 'L', visibleWhen: { mode: 'volumetric' } },
    { id: 'volume_change_pct', label: 'Volume change', group: 'ratio', unit: 'pct', visibleWhen: { mode: 'volumetric' } },
    { id: 'pressure_rise_pa', label: 'Pressure rise if blocked in, K (β − 3 α_pipe) ΔT', group: 'pressure', unit: 'Pa', display: 'bar', visibleWhen: { mode: 'volumetric' } },
    { id: 'pressure_rise_per_k_pa', label: 'Pressure rise per kelvin', group: 'pressure', unit: 'Pa', display: 'bar', visibleWhen: { mode: 'volumetric' } },
    { id: 'relief_volume_m3', label: 'Liquid to be relieved to hold the pressure', group: 'volume', unit: 'm3', display: 'L', visibleWhen: { mode: 'volumetric' } },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      free_expansion_m: '0.120 m',
      thermal_stress_pa: '240 MPa',
      anchor_force_n: '2.4 MN',
      yield_utilisation_pct: '102 %',
      movement_for_zero_stress_m: '0.120 m',
    },
  },
};

/** Linear thermal expansion, m. */
export function linearExpansionM(alphaPerK, lengthM, deltaTK) {
  return alphaPerK * lengthM * deltaTK;
}

/** Thermal stress (Pa, positive = compression when heated) for a member restrained except for an allowed movement. */
export function restraintStressPa(modulusPa, alphaPerK, deltaTK, lengthM, allowedMovementM) {
  const thermalStrain = alphaPerK * deltaTK;
  const allowedStrain = Math.min(Math.abs(thermalStrain), allowedMovementM / lengthM) * Math.sign(thermalStrain);
  return modulusPa * (thermalStrain - allowedStrain);
}

/** Pressure rise of a completely filled, blocked-in liquid, Pa. */
export function trappedLiquidPressureRisePa(bulkModulusPa, betaPerK, pipeAlphaPerK, deltaTK) {
  return bulkModulusPa * (betaPerK - 3 * pipeAlphaPerK) * deltaTK;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['linear', 'volumetric'], 'mode', 'Case');
  assertFinite(i.delta_t_k, 'delta_t_k', 'Temperature change');
  const warnings = [];

  if (i.mode === 'linear') {
    assertOneOf(i.material, Object.keys(SOLIDS), 'material', 'Material');
    assertOneOf(i.restraint, ['free', 'partial', 'full'], 'restraint', 'Restraint');
    assertPositive(i.length_m, 'length_m', 'Length');
    assertPositive(i.area_m2, 'area_m2', 'Cross-section area');
    const preset = SOLIDS[i.material];
    const alpha = i.material === 'custom' ? assertPositive(i.alpha_per_k, 'alpha_per_k', 'Expansion coefficient') : preset.alpha;
    const E = i.material === 'custom' ? assertPositive(i.modulus_pa, 'modulus_pa', "Young's modulus") : preset.e;
    const yieldPa = i.material === 'custom' ? assertPositive(i.yield_pa, 'yield_pa', 'Yield strength') : preset.yieldPa;

    const freeExpansion = linearExpansionM(alpha, i.length_m, i.delta_t_k);
    let allowed;
    if (i.restraint === 'free') allowed = Infinity;
    else if (i.restraint === 'partial') allowed = assertNonNegative(i.allowed_movement_m, 'allowed_movement_m', 'Allowed movement');
    else allowed = 0;
    const stress = i.restraint === 'free' ? 0 : restraintStressPa(E, alpha, i.delta_t_k, i.length_m, allowed);
    const thermalStrain = alpha * i.delta_t_k;

    if (Math.abs(stress) > yieldPa) warnings.push('Thermal stress exceeds the yield strength: a fully restrained member yields (or buckles in compression) — provide expansion joints, loops or sliding supports.');
    if (Math.abs(i.delta_t_k) > 200) warnings.push('Temperature change above 200 K: the mean expansion coefficient varies with temperature; use the code value for the actual range.');
    if (stress > 0 && i.restraint !== 'free') warnings.push('Compressive thermal stress: a long slender member (pipe between anchors) buckles at a stress far below yield — check Euler buckling with the column calculator.');
    if (i.restraint === 'partial' && allowed >= Math.abs(freeExpansion)) warnings.push('The allowed movement exceeds the free expansion: no thermal stress develops.');

    return {
      outputs: {
        alpha_out_per_k: alpha,
        free_expansion_m: freeExpansion,
        thermal_strain: thermalStrain,
        restrained_strain: stress / E,
        thermal_stress_pa: stress,
        stress_per_k_pa: E * alpha,
        anchor_force_n: stress * i.area_m2,
        yield_utilisation_pct: (Math.abs(stress) / yieldPa) * 100,
        movement_for_zero_stress_m: Math.abs(freeExpansion),
      },
      warnings,
    };
  }

  assertOneOf(i.liquid, Object.keys(LIQUIDS), 'liquid', 'Liquid');
  assertOneOf(i.confined, ['vented', 'confined'], 'confined', 'Confinement');
  assertPositive(i.volume_m3, 'volume_m3', 'Liquid volume');
  const liquid = LIQUIDS[i.liquid];
  const beta = i.liquid === 'custom' ? assertPositive(i.beta_per_k, 'beta_per_k', 'Volumetric expansion coefficient') : liquid.beta;
  const bulk = i.liquid === 'custom' ? assertPositive(i.bulk_modulus_pa, 'bulk_modulus_pa', 'Bulk modulus') : liquid.bulk;
  const pipeAlpha = i.confined === 'confined' ? assertNonNegative(i.pipe_alpha_per_k, 'pipe_alpha_per_k', 'Pipe expansion coefficient') : 0;
  const volumeChange = beta * i.volume_m3 * i.delta_t_k;
  const pressureRise = i.confined === 'confined' ? trappedLiquidPressureRisePa(bulk, beta, pipeAlpha, i.delta_t_k) : null;

  if (i.confined === 'confined' && pressureRise > 10e5) warnings.push('Blocked-in pressure rise above 10 bar: fit a thermal relief valve (API 521 §4.4.12) or ensure a vapour space — the rise assumes rigid walls and no air, so it is an upper bound.');
  if (i.liquid === 'fresh_water' && i.delta_t_k !== 0) warnings.push('β of water varies strongly with temperature (zero at 4 °C, 0.21 ×10⁻³/K at 20 °C, 0.59 ×10⁻³/K at 80 °C): use a custom value for other ranges.');
  warnings.push('Constant β near 20 °C; for bunker custody transfer use the Table 54B method in the bunker-quantity calculator.');

  return {
    outputs: {
      beta_out_per_k: beta,
      volume_change_m3: volumeChange,
      volume_change_pct: beta * i.delta_t_k * 100,
      pressure_rise_pa: pressureRise,
      pressure_rise_per_k_pa: i.confined === 'confined' ? bulk * (beta - 3 * pipeAlpha) : null,
      relief_volume_m3: i.confined === 'confined' ? Math.max(0, (beta - 3 * pipeAlpha) * i.volume_m3 * i.delta_t_k) : null,
    },
    warnings,
  };
}
