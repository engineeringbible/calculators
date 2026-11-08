/**
 * shallow-water-speed/calc.js — shallow water effect on a speed/power trial: the ISO 15016:2025 Annex G (Raven)
 * power correction — viscous resistance increase and sinkage displacement effect — and the legacy Lackenby speed
 * correction of ISO 15016:2015, with the minimum trial water depth of Formula (7).
 *
 * G.3  R_SHV = R_Vdeep 0.57 (T_M/h)^1.79;   G.4–G.9  R_Vdeep = C_V' ½ρV²S,  C_V' = 1.06 C_F (1+k) + ΔC_F,  (1+k) = 1.017 + 20 C_B (B/L)² (T/B)^0.5
 * G.10–G.13  d = 1.46 ∇/L² [Fr_h²/√(1−Fr_h²) − Fr_hd²/√(1−Fr_hd²)] ≥ 0,  δ = d A_W/∇ ≤ 0.05,  r_sink = (1+δ)^(2/3)
 * G.2  P_Ddeep = (P_Dmsc − R_SHV V_S/η_Did)/r_sink;   G.1  P_SH = P_Dmsc − P_Ddeep
 * Lackenby: ΔV/V = 0.1242 (A_M/h² − 0.05) + 1 − √tanh(g h/V²)
 * Schema units: m, kn, °C, µm, kW.
 */
import { withDefaults, assertPositive, assertRange } from '../shared/validate.js';
import { seawaterDensity, seawaterKinematicViscosity, cfIttc57, roughnessAllowance } from '../shared/seawater.js';

const G = 9.80665;
const KN_TO_M_S = 1852 / 3600;

export const schema = {
  id: 'shallow-water-speed',
  name: 'Shallow water correction (Raven / Lackenby)',
  category: 'maritime',
  summary: 'ISO 15016:2025 Annex G (Raven) shallow-water power correction — viscous increase and sinkage — plus the legacy Lackenby speed correction.',
  related: ['ship-squat', 'stawave-added-resistance', 'water-temperature-correction', 'hull-roughness-penalty', 'holtrop-mennen'],
  assumptions: [
    'Raven method as normative in ISO 15016:2025 Annex G: the shallow-water power increase P_SH is the sum of (a) a viscous resistance increase R_SHV = R_Vdeep × 0.57 (T_M/h)^1.79, with the deep-water viscous resistance from C_V\' = 1.06 C_F (1+k) + ΔC_F (ITTC-57 line, roughness allowance G.8, form factor from G.9: (1+k) = 1.017 + 20 C_B (B/L_PP)² (T_M/B)^0.5), and (b) a sinkage displacement effect r_sink = (1 + δ)^(2/3) with δ = d A_W/∇ (max 0.05) and the additional dynamic sinkage d = 1.46 ∇/L_PP² [Fr_h²/√(1−Fr_h²) − Fr_hd²/√(1−Fr_hd²)] ≥ 0, where Fr_hd is the depth Froude number at the reference depth 0.3 L_PP; the deep-water power is P_Ddeep = (P_Dmsc − R_SHV V_S/η_Did)/r_sink and P_SH = P_Dmsc − P_Ddeep.',
    'The method corrects a measured trial power (already corrected for wind, waves and temperature) to deep water; it is valid where the trial itself is valid, i.e. for water depths above the ISO limit h ≥ max(2.5 T_M, 2.4 V_S²/g) (Formula 7), and for sub-critical depth Froude numbers (Fr_h < 1; the sinkage term diverges towards Fr_h → 1). Below the limit the trial is not acceptable and the correction is not meaningful.',
    'Lackenby (1963) is the legacy ISO 15016:2015 speed correction: ΔV/V = 0.1242 (A_M/h² − 0.05) + 1 − √tanh(g h/V²) with A_M the midship section area (C_M B T_M), applicable for A_M/h² ≥ 0.05; it gives the deep-water speed at the same power, V_deep = V(1 + ΔV/V), and is reported for comparison and for analyses still following the 2015 edition.',
    'The displacement volume is taken as C_B L_PP B T_M and the waterplane area as C_WP L_PP B unless the hydrostatics give better values; the propulsive efficiency in ideal condition η_Did is assumed unchanged in shallow water (ISO notes that wake and efficiency do change — a known limitation of the standard).',
    'Sea water density and viscosity from the ITTC 7.5-02-01-03 table at the trial temperature and salinity (shared/seawater.js).',
  ],
  notes: [
    'Verification 2026-10-31: 180 × 32 × 11 m, C_B 0.80, C_WP 0.88, S 7 000 m², 12 kn in 30 m of 15 °C water, 5 000 kW delivered, η_D 0.70 → Fr_h 0.360, (1+k) 1.313, d 0.146 m, δ 0.0146, r_sink 1.0097, R_Vdeep 306 kN, R_SHV 29.0 kN → P_Ddeep 4 699 kW, P_SH 301 kW (6.0 %); Lackenby gives a 4.1 % speed loss (12.50 kn deep-water speed), the same order (6 % power ≈ 2 % speed by the cubic law, the remainder being the different physics of the two methods).',
    'Transcription check: the G.12 bracket uses Fr²/√(1 − Fr²) (Tuck\'s shallow-water sinkage form), and the ≥ 0 clamp means deep water (h ≥ 0.3 L_PP) gives no sinkage correction by construction; the 0.3 L_PP reference depth is why the correction vanishes at h = 54 m for this ship.',
  ],
  sources: [
    'ISO 15016:2025 Ships and marine technology — speed and power trials, 8.5 Formula (7) and Annex G (normative) Effect of shallow water, Formulae G.1–G.13',
    'H. C. Raven, "A new correction procedure for shallow-water effects in ship speed trials", Proceedings PRADS 2016, Copenhagen; Raven, "Shallow-water effects in ship model testing and at full scale", Ocean Engineering 189, 2019',
    'H. Lackenby, "The effect of shallow water on ship speed", The Shipbuilder and Marine Engine-Builder 70, 1963; ISO 15016:2015 Annex (shallow water correction)',
    'E. O. Tuck, "Shallow-water flows past slender bodies", Journal of Fluid Mechanics 26, 1966 (sinkage ∝ Fr_h²/√(1 − Fr_h²))',
  ],
  inputs: [
    { id: 'lpp_m', label: 'Length between perpendiculars L_PP', group: 'length', unit: 'm', default: 180, min: 10, max: 450 },
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 32, min: 2, max: 80 },
    { id: 'draft_m', label: 'Moulded draught at midships T_M', group: 'length', unit: 'm', default: 11, min: 0.5, max: 30 },
    { id: 'cb', label: 'Block coefficient C_B', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.4, max: 0.95 },
    { id: 'cm', label: 'Midship section coefficient C_M (Lackenby A_M)', group: 'dimensionless', unit: 'none', default: 0.98, min: 0.7, max: 1 },
    { id: 'cwp', label: 'Waterplane coefficient C_WP (A_W = C_WP L_PP B)', group: 'dimensionless', unit: 'none', default: 0.88, min: 0.5, max: 1 },
    { id: 'wetted_surface_m2', label: 'Wetted surface at zero speed S', group: 'area', unit: 'm2', default: 7000, min: 50, max: 60000 },
    { id: 'speed_kn', label: 'Ship speed through water V_S', group: 'speed', unit: 'kn', default: 12, min: 1, max: 40 },
    { id: 'depth_m', label: 'Water depth at the run h', group: 'length', unit: 'm', default: 30, min: 1, max: 5000 },
    { id: 'water_temp_c', label: 'Sea water temperature', group: 'temperature', unit: 'C', default: 15, min: -2, max: 40 },
    { id: 'salinity_g_kg', label: 'Salinity (g/kg)', group: 'dimensionless', unit: 'none', default: 35, min: 0, max: 45 },
    { id: 'ks_um', label: 'Hull roughness k_s', group: 'length', unit: 'um', default: 150, min: 1, max: 2000 },
    { id: 'delivered_power_kw', label: 'Delivered power in the trial condition P_Dmsc (after wind, wave, temperature corrections)', group: 'power', unit: 'kW', default: 5000, min: 1, max: 200000 },
    { id: 'eta_d', label: 'Propulsive efficiency in ideal condition η_Did', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.3, max: 0.9 },
  ],
  outputs: [
    { id: 'min_depth_m', label: 'Minimum trial depth max(2.5 T_M, 2.4 V_S²/g) — Formula (7)', group: 'length', unit: 'm' },
    { id: 'depth_check', label: 'Trial depth check', type: 'text' },
    { id: 'fr_h', label: 'Depth Froude number Fr_h = V_S/√(g h)', group: 'dimensionless', unit: 'none' },
    { id: 'fr_hd', label: 'Reference depth Froude number Fr_hd (depth 0.3 L_PP)', group: 'dimensionless', unit: 'none' },
    { id: 'sinkage_increase_m', label: 'Additional dynamic sinkage d (G.12)', group: 'length', unit: 'm' },
    { id: 'delta_volume_ratio', label: 'Additional displacement fraction δ = d A_W/∇ (max 0.05)', group: 'dimensionless', unit: 'none' },
    { id: 'r_sink', label: 'Sinkage displacement effect r_sink = (1 + δ)^(2/3)', group: 'dimensionless', unit: 'none' },
    { id: 'form_factor', label: 'Form factor (1 + k) — G.9', group: 'dimensionless', unit: 'none' },
    { id: 'cf', label: 'ITTC-57 C_F at the trial temperature', group: 'dimensionless', unit: 'none' },
    { id: 'dcf', label: 'Roughness allowance ΔC_F — G.8', group: 'dimensionless', unit: 'none' },
    { id: 'cv', label: 'Viscous resistance coefficient C_V\' = 1.06 C_F (1+k) + ΔC_F', group: 'dimensionless', unit: 'none' },
    { id: 'r_v_deep_n', label: 'Deep-water viscous resistance R_Vdeep', group: 'force', unit: 'N', display: 'kN' },
    { id: 'r_shv_n', label: 'Viscous resistance increase in shallow water R_SHV', group: 'force', unit: 'N', display: 'kN' },
    { id: 'p_deep_w', label: 'Deep-water delivered power P_Ddeep', group: 'power', unit: 'W', display: 'kW' },
    { id: 'p_sh_w', label: 'Shallow-water power increase P_SH', group: 'power', unit: 'W', display: 'kW' },
    { id: 'p_sh_pct', label: 'P_SH as share of the trial power', group: 'ratio', unit: 'pct' },
    { id: 'lackenby_am_h2', label: 'Lackenby A_M/h²', group: 'dimensionless', unit: 'none' },
    { id: 'lackenby_dv_pct', label: 'Lackenby speed loss ΔV/V', group: 'ratio', unit: 'pct' },
    { id: 'lackenby_deep_speed_kn', label: 'Lackenby deep-water speed at the same power', group: 'speed', unit: 'kn' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      min_depth_m: '27.5 m',
      fr_h: '0.360',
      fr_hd: '0.268',
      sinkage_increase_m: '0.146 m',
      delta_volume_ratio: '0.0146',
      r_sink: '1.0097',
      form_factor: '1.313',
      r_v_deep_n: '306 kN',
    },
  },
};

/** Lackenby speed-loss ratio ΔV/V. */
export function lackenbySpeedLoss(midshipAreaM2, depthM, speedMs) {
  return 0.1242 * (midshipAreaM2 / (depthM * depthM) - 0.05) + 1 - Math.sqrt(Math.tanh((G * depthM) / (speedMs * speedMs)));
}

/** Raven additional sinkage (G.12), m, clamped at zero: none at or beyond the reference depth (Fr_h ≤ Fr_hd). */
export function ravenSinkage(volumeM3, lppM, frH, frHd) {
  if (frH <= frHd) return 0;
  const term = (fr) => (fr * fr) / Math.sqrt(1 - fr * fr);
  return 1.46 * (volumeM3 / (lppM * lppM)) * (term(frH) - term(frHd));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.lpp_m, 'lpp_m', 'Length');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.draft_m, 'draft_m', 'Draught');
  assertRange(i.cb, 0.3, 1, 'cb', 'Block coefficient');
  assertRange(i.cm, 0.5, 1, 'cm', 'Midship coefficient');
  assertRange(i.cwp, 0.4, 1, 'cwp', 'Waterplane coefficient');
  assertPositive(i.wetted_surface_m2, 'wetted_surface_m2', 'Wetted surface');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');
  assertPositive(i.depth_m, 'depth_m', 'Water depth');
  assertRange(i.water_temp_c, -2, 40, 'water_temp_c', 'Water temperature');
  assertRange(i.salinity_g_kg, 0, 45, 'salinity_g_kg', 'Salinity');
  assertPositive(i.ks_um, 'ks_um', 'Roughness');
  assertPositive(i.delivered_power_kw, 'delivered_power_kw', 'Delivered power');
  assertRange(i.eta_d, 0.2, 1, 'eta_d', 'Propulsive efficiency');
  if (i.depth_m <= i.draft_m) throw new Error('Water depth must exceed the draught');

  const V = i.speed_kn * KN_TO_M_S;
  const rho = seawaterDensity(i.water_temp_c, i.salinity_g_kg);
  const nu = seawaterKinematicViscosity(i.water_temp_c, i.salinity_g_kg);
  const minDepth = Math.max(2.5 * i.draft_m, (2.4 * V * V) / G);
  const frH = V / Math.sqrt(G * i.depth_m);
  const frHd = V / Math.sqrt(G * 0.3 * i.lpp_m);
  if (frH >= 1) throw new Error('Depth Froude number at or above 1 (supercritical): the Raven sinkage formula does not apply');
  const volume = i.cb * i.lpp_m * i.beam_m * i.draft_m;
  const aW = i.cwp * i.lpp_m * i.beam_m;
  const d = ravenSinkage(volume, i.lpp_m, frH, frHd);
  const delta = Math.min(0.05, (d * aW) / volume);
  const rSink = (1 + delta) ** (2 / 3);
  const re = (V * i.lpp_m) / nu;
  const cf = cfIttc57(re);
  const dcf = roughnessAllowance(re, i.lpp_m, i.ks_um * 1e-6, 'iso15016');
  const formFactor = 1.017 + 20 * i.cb * (i.beam_m / i.lpp_m) ** 2 * Math.sqrt(i.draft_m / i.beam_m);
  const cv = 1.06 * cf * formFactor + dcf;
  const rVDeep = cv * 0.5 * rho * V * V * i.wetted_surface_m2;
  const rShv = rVDeep * 0.57 * (i.draft_m / i.depth_m) ** 1.79;
  const pMsc = i.delivered_power_kw * 1000;
  const pDeep = (pMsc - (rShv * V) / i.eta_d) / rSink;
  const pSh = pMsc - pDeep;
  const aM = i.cm * i.beam_m * i.draft_m;
  const lack = lackenbySpeedLoss(aM, i.depth_m, V);

  const warnings = [];
  if (i.depth_m < minDepth) warnings.push(`Water depth ${i.depth_m} m is below the ISO 15016 trial limit ${minDepth.toFixed(1)} m (Formula 7): the run is not acceptable as a speed trial and the correction is outside its validity.`);
  if ((d * aW) / volume > 0.05) warnings.push('Additional displacement fraction capped at 0.05 (G.11): very shallow water for this ship.');
  if (frH > 0.7) warnings.push('Depth Froude number above 0.7: approaching the critical speed, where squat and wave pattern change rapidly and the method loses accuracy.');
  if (aM / (i.depth_m * i.depth_m) < 0.05) warnings.push('Lackenby A_M/h² below 0.05: outside the range of the 1963 correction (effectively deep water for Lackenby).');
  if (d === 0) warnings.push('No sinkage correction: the depth is at or beyond the 0.3 L_PP reference depth, so only the viscous term remains.');
  warnings.push('η_Did assumed unchanged in shallow water (ISO 15016 notes wake and efficiency do change); the trial power must already be corrected for wind, waves and water temperature.');
  warnings.push('Displacement ∇ = C_B L_PP B T_M and A_W = C_WP L_PP B are approximations: use the hydrostatic tables at the trial draught when available.');

  return {
    outputs: {
      min_depth_m: minDepth,
      depth_check: i.depth_m >= minDepth ? `OK — ${i.depth_m} m ≥ ${minDepth.toFixed(1)} m: valid trial depth, Annex G correction applies` : `NOT ACCEPTABLE — ${i.depth_m} m < ${minDepth.toFixed(1)} m: below the ISO 15016 minimum trial depth`,
      fr_h: frH,
      fr_hd: frHd,
      sinkage_increase_m: d,
      delta_volume_ratio: delta,
      r_sink: rSink,
      form_factor: formFactor,
      cf,
      dcf,
      cv,
      r_v_deep_n: rVDeep,
      r_shv_n: rShv,
      p_deep_w: pDeep,
      p_sh_w: pSh,
      p_sh_pct: (pSh / pMsc) * 100,
      lackenby_am_h2: aM / (i.depth_m * i.depth_m),
      lackenby_dv_pct: lack * 100,
      lackenby_deep_speed_kn: i.speed_kn * (1 + lack),
    },
    warnings,
  };
}
