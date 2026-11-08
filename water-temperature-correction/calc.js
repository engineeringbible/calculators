/**
 * water-temperature-correction/calc.js — ISO 15016:2025 Annex E: resistance increase R_AS due to the deviation of the
 * water temperature and density from the reference condition (15 °C, 1026.0 kg/m³), the power equivalent and the two
 * terms (density and friction).
 *
 * E.1  R_AS = R_Tref (ρ_act/ρ_ref − 1) − R_Fact [(C_Fref + ΔC_Fref)/(C_Fact + ΔC_Fact) − 1]
 * E.2  R_Fact = ½ ρ_act S V_S² (C_Fact + ΔC_Fact);  E.4  R_Tref = P_ref η_D / V_S;  E.5–E.7  C_F (ITTC-57), Re, ΔC_F (k_s default 150 µm)
 * Schema units: m, m², kn, °C, µm, kW, kN.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { seawaterDensity, seawaterKinematicViscosity, cfIttc57, roughnessAllowance, RHO_REF_ISO_KG_M3, NU_REF_ISO_M2_S } from '../shared/seawater.js';

const KN_TO_M_S = 1852 / 3600;

export const schema = {
  id: 'water-temperature-correction',
  name: 'Water temperature and density correction',
  category: 'maritime',
  summary: 'ISO 15016 Annex E resistance and power correction for sea water temperature and density against the 15 °C / 1026 kg/m³ reference.',
  related: ['hull-roughness-penalty', 'shallow-water-speed', 'stawave-added-resistance', 'hydrostatics', 'draft-survey'],
  assumptions: [
    'ISO 15016:2025 Annex E, transcribed term for term: R_AS = R_Tref (ρ_act/ρ_ref − 1) − R_Fact [(C_Fref + ΔC_Fref)/(C_Fact + ΔC_Fact) − 1], where the first term is the change of the whole resistance with density and the second the change of the frictional resistance with viscosity (through the Reynolds number in the ITTC-57 line and the roughness allowance E.7 with k_s default 150 µm); reference condition 15 °C and 1026.0 kg/m³ with ν_ref 1.1883e-6 m²/s.',
    'R_Tref is the total resistance at the reference condition: from the tank-predicted (or baseline) power and the propulsive efficiency as E.4, R_Tref = P η_D/V_S, or entered directly; ISO uses the tank-test power at the trial speed — in service analysis the baseline curve plays that role.',
    'Water density and viscosity come from the ITTC 7.5-02-01-03 table at the temperature and salinity entered (shared/seawater.js) rather than Annex E\'s own viscosity polynomial (E.8), which differs by 0.17 % at 15 °C and is second order inside the ratio; a measured density may be entered instead.',
    'Sign: R_AS is negative in water warmer (less dense, less viscous) than 15 °C — the ship had a hidden advantage — so the power correction ΔP_AS = R_AS V_S/η_D is negative and the corrected power P_ref = P_measured − ΔP_AS is HIGHER than measured in warm water; the opposite in cold water.',
    'The correction acts on speed through water (ISO clause 13) and assumes the propulsive efficiency is unaffected by the small resistance change; effect scale ±1 % of power over 5–30 °C for typical merchant ships.',
  ],
  notes: [
    'Verification 2026-10-31: L_PP 180 m, S 5 500 m², 6.5 m/s, R_Tref 861.5 kN (8 000 kW, η_D 0.70) reproduces the atlas_physics production module to 1e-6: R_AS +2 683 N at 5 °C, −84 N at 15 °C (the harmless seam between the ITTC 15 °C density 1025.9 and the ISO reference 1026.0), −3 579 N at 25 °C and −5 413 N at 30 °C.',
    'Design decision: the ITTC table is used for both density and viscosity so that one consistent equation of state feeds both terms (E.8 gives viscosity only); a measured-density input is offered for trial reports that record it.',
  ],
  sources: [
    'ISO 15016:2025 Ships and marine technology — speed and power trials, Annex E (normative) Correction for water temperature and density, Formulae E.1–E.8',
    'ITTC Recommended Procedure 7.5-02-01-03, Fresh Water and Seawater Properties (2011)',
    'ITTC 7.5-04-01-01.1 Preparation, Conduct and Analysis of Speed/Power Trials (2017), section on water temperature and density',
    'atlas_physics.temperature_resistance (production implementation of Annex E, 2026) — cross-check values',
  ],
  inputs: [
    { id: 'lpp_m', label: 'Length between perpendiculars L_PP', group: 'length', unit: 'm', default: 180, min: 10, max: 450 },
    { id: 'wetted_surface_m2', label: 'Wetted surface at zero speed S', group: 'area', unit: 'm2', default: 5500, min: 50, max: 60000 },
    { id: 'speed_kn', label: 'Ship speed through water V_S', group: 'speed', unit: 'kn', default: 12.6, min: 0.5, max: 40 },
    { id: 'sst_c', label: 'Sea water temperature', group: 'temperature', unit: 'C', default: 25, min: -2, max: 40 },
    { id: 'density_mode', label: 'Actual water density from', type: 'select', default: 'table', options: [{ value: 'table', label: 'ITTC table at the temperature and salinity' }, { value: 'measured', label: 'Measured density (hydrometer)' }] },
    { id: 'salinity_g_kg', label: 'Salinity (g/kg)', group: 'dimensionless', unit: 'none', default: 35, min: 0, max: 45, visibleWhen: { density_mode: 'table' } },
    { id: 'rho_measured', label: 'Measured water density', group: 'density', unit: 'kg_m3', default: 1023, min: 990, max: 1040, visibleWhen: { density_mode: 'measured' } },
    { id: 'ks_um', label: 'Hull roughness k_s', group: 'length', unit: 'um', default: 150, min: 1, max: 2000 },
    { id: 'ref_mode', label: 'Reference total resistance R_Tref from', type: 'select', default: 'power', options: [{ value: 'power', label: 'Predicted power at the reference condition and η_D (E.4)' }, { value: 'resistance', label: 'Total resistance entered directly' }] },
    { id: 'ref_power_kw', label: 'Tank-predicted / baseline delivered power at V_S', group: 'power', unit: 'kW', default: 8000, min: 1, max: 200000, visibleWhen: { ref_mode: 'power' } },
    { id: 'eta_d', label: 'Propulsive efficiency η_D', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.3, max: 0.9 },
    { id: 'ref_resistance_kn', label: 'Total resistance at the reference condition R_Tref', group: 'force', unit: 'kN', default: 860, min: 0.1, max: 50000, visibleWhen: { ref_mode: 'resistance' } },
  ],
  outputs: [
    { id: 'rho_act', label: 'Actual water density ρ_act', group: 'density', unit: 'kg_m3' },
    { id: 'nu_act', label: 'Actual kinematic viscosity ν_act', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt' },
    { id: 'reynolds_act', label: 'Reynolds number, actual', group: 'dimensionless', unit: 'none' },
    { id: 'reynolds_ref', label: 'Reynolds number, reference (15 °C)', group: 'dimensionless', unit: 'none' },
    { id: 'cf_total_act', label: 'C_Fact + ΔC_Fact', group: 'dimensionless', unit: 'none' },
    { id: 'cf_total_ref', label: 'C_Fref + ΔC_Fref', group: 'dimensionless', unit: 'none' },
    { id: 'r_tref_n', label: 'Total resistance at reference R_Tref', group: 'force', unit: 'N', display: 'kN' },
    { id: 'r_fact_n', label: 'Frictional resistance, actual R_Fact (E.2)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'density_term_n', label: 'Density term R_Tref (ρ_act/ρ_ref − 1)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'friction_term_n', label: 'Friction term −R_Fact [(C_Fref+ΔC_Fref)/(C_Fact+ΔC_Fact) − 1]', group: 'force', unit: 'N', display: 'kN' },
    { id: 'r_as_n', label: 'Resistance increase R_AS (E.1)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'r_as_pct', label: 'R_AS as share of R_Tref', group: 'ratio', unit: 'pct' },
    { id: 'power_correction_w', label: 'Power equivalent ΔP_AS = R_AS V_S/η_D (subtract from the measured power)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'sign_note', label: 'Reading the sign', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      r_as_n: '−3.58 kN',
      power_correction_w: '−33 kW',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.lpp_m, 'lpp_m', 'Length');
  assertPositive(i.wetted_surface_m2, 'wetted_surface_m2', 'Wetted surface');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');
  assertRange(i.sst_c, -2, 40, 'sst_c', 'Water temperature');
  assertOneOf(i.density_mode, ['table', 'measured'], 'density_mode', 'Density mode');
  assertPositive(i.ks_um, 'ks_um', 'Roughness');
  assertOneOf(i.ref_mode, ['power', 'resistance'], 'ref_mode', 'Reference mode');
  assertRange(i.eta_d, 0.2, 1, 'eta_d', 'Propulsive efficiency');

  const V = i.speed_kn * KN_TO_M_S;
  let rhoAct;
  let salinity = i.salinity_g_kg;
  if (i.density_mode === 'table') {
    assertRange(i.salinity_g_kg, 0, 45, 'salinity_g_kg', 'Salinity');
    rhoAct = seawaterDensity(i.sst_c, i.salinity_g_kg);
  } else {
    rhoAct = assertRange(i.rho_measured, 950, 1100, 'rho_measured', 'Measured density');
    salinity = 35;
  }
  const nuAct = seawaterKinematicViscosity(i.sst_c, salinity);
  const rTref = i.ref_mode === 'power'
    ? (assertPositive(i.ref_power_kw, 'ref_power_kw', 'Reference power') * 1000 * i.eta_d) / V
    : assertPositive(i.ref_resistance_kn, 'ref_resistance_kn', 'Reference resistance') * 1000;
  const ks = i.ks_um * 1e-6;
  const reAct = (V * i.lpp_m) / nuAct;
  const reRef = (V * i.lpp_m) / NU_REF_ISO_M2_S;
  const cfAct = cfIttc57(reAct) + roughnessAllowance(reAct, i.lpp_m, ks);
  const cfRef = cfIttc57(reRef) + roughnessAllowance(reRef, i.lpp_m, ks);
  const rFact = 0.5 * rhoAct * i.wetted_surface_m2 * V * V * cfAct;
  const densityTerm = rTref * (rhoAct / RHO_REF_ISO_KG_M3 - 1);
  const frictionTerm = -rFact * (cfRef / cfAct - 1);
  const rAs = densityTerm + frictionTerm;
  const dP = (rAs * V) / i.eta_d;

  const warnings = [];
  if (i.sst_c < 0 || i.sst_c > 35) warnings.push('Temperature outside the 0–35 °C ITTC table: properties held at the table end.');
  if (rFact > rTref) warnings.push('Frictional resistance exceeds the reference total resistance: check the wetted surface, the reference power or η_D.');
  if (Math.abs(rAs / rTref) > 0.03) warnings.push('Correction above 3 % of the total resistance: unusual for sea water — check the temperature and density inputs.');
  warnings.push('R_AS is negative in water warmer than 15 °C: the corrected (reference-condition) power is then higher than measured. Apply on speed through water.');
  warnings.push('Propulsive efficiency assumed unaffected; the reference power should be the tank prediction (trials) or the performance baseline (service) at this speed.');

  return {
    outputs: {
      rho_act: rhoAct,
      nu_act: nuAct,
      reynolds_act: reAct,
      reynolds_ref: reRef,
      cf_total_act: cfAct,
      cf_total_ref: cfRef,
      r_tref_n: rTref,
      r_fact_n: rFact,
      density_term_n: densityTerm,
      friction_term_n: frictionTerm,
      r_as_n: rAs,
      r_as_pct: (rAs / rTref) * 100,
      power_correction_w: dP,
      sign_note: rAs < 0
        ? `Water warmer / lighter than the reference: R_AS ${(rAs / 1000).toFixed(2)} kN, the ship was favoured — add ${(-dP / 1000).toFixed(1)} kW to the measured power to reach the 15 °C / 1026 kg/m³ condition`
        : `Water colder / denser than the reference: R_AS +${(rAs / 1000).toFixed(2)} kN, the ship was penalised — subtract ${(dP / 1000).toFixed(1)} kW from the measured power to reach the reference condition`,
    },
    warnings,
  };
}
