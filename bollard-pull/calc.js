/**
 * bollard-pull/calc.js — tug bollard pull required to hold (or make way with) a towed vessel in a design weather:
 * wind force on the windage area, current/hull force (frontal drag for barges or ITTC friction for ship-shaped hulls),
 * wave drift force (DNV-RP-H103 §7.2.6 form) and the tug efficiency factor — the DNV marine-operations approach.
 *
 * F_wind = ½ ρ_a C_s C_h A_w V_w²;  F_current = ½ ρ_w C_d A_c V_rel² (or friction);  F_wd = ⅛ ρ_w g R² B H_s²;
 * BP_required = (F_wind + F_current + F_wd) / η_tug.
 * Schema units: m, m², m/s, kn, N (display kN), t.
 */
import { GRAVITY_M_S2, toBase } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const KNOT_M_S = toBase(1, 'kn', 'speed'); // 1852/3600 m/s, from shared/units.js

/** Reflection coefficients for the wave drift force, DNV-RP-H103 (2011) §7.2.6.4. */
export const REFLECTION = {
  square: { label: 'Square face / vertical wall (R 1.00)', r: 1.0 },
  condeep: { label: 'Condeep base (R 0.97)', r: 0.97 },
  cylinder: { label: 'Vertical cylinder (R 0.88)', r: 0.88 },
  raked_barge: { label: 'Barge with raked bow (R 0.67)', r: 0.67 },
  spoon_barge: { label: 'Barge with spoon bow (R 0.55)', r: 0.55 },
  ship_bow: { label: 'Ship bow (R 0.45)', r: 0.45 },
  custom: { label: 'Custom R', r: null },
};

export const CURRENT_CD = {
  ship: { label: 'Ship-shaped bow (C_d 0.20)', cd: 0.2 },
  intermediate: { label: 'Intermediate / spoon bow (C_d 0.35)', cd: 0.35 },
  barge: { label: 'Raked or square barge bow (C_d 0.50)', cd: 0.5 },
  custom: { label: 'Custom C_d', cd: null },
};

export const schema = {
  id: 'bollard-pull',
  name: 'Bollard pull for a tow',
  category: 'maritime',
  summary: 'Towing force to hold a tow in wind, waves and current (DNV method: wind, current and wave-drift forces) and the tug bollard pull required with tug efficiency.',
  related: ['holtrop-mennen', 'beaufort-sea-state', 'wave-properties', 'anchor-catenary'],
  assumptions: [
    'Static (zero-speed) holding condition with wind, waves and current co-linear and head-on to the tow, as the DNV marine-operations rules require: ocean tows must hold station in 20 m/s wind, 5 m significant wave height and 0.5–1 m/s current (DNVGL-ST-N001 / ND-0030 use 0.5 m/s, the 1996 DNV Rules for Marine Operations 1 m/s); benign-weather tows 15 m/s, 2 m, 0.5 m/s; coastal tows must make 2 knots over the ground, which adds 2 knots to the current speed.',
    'Wind force ½ ρ_air C_s C_h A V² with the DNV-OS-C301 shape coefficient (1.0 flat hull side, 1.1 clustered deckhouses, 1.25–1.5 isolated structures) and height coefficient (1.0 below 15.3 m, 1.1 to 30.5 m, 1.2 to 46 m, 1.3 to 61 m, 1.37 to 76 m) applied to the whole transverse windage area; a real calculation sums several area bands — enter Σ C_s C_h A as the area with coefficients 1.0 if you have it.',
    'Current/hull force: for barges and blunt tows ½ ρ_w C_d A_frontal V² with C_d 0.5 (raked or square bow), 0.35 or 0.20 (DNV-OS-C301 / RP-H103 §3.2.4); for ship-shaped hulls the ITTC-1957 friction on the wetted surface with a form factor and an optional fouling allowance ΔC_F — a Holtrop–Mennen calm-water resistance at the current speed is the more complete alternative.',
    'Wave drift force on the towed object ⅛ ρ_w g R² B H_s² with the DNV-RP-H103 §7.2.6.4 reflection coefficients (ship bow 0.45, spoon-bow barge 0.55, raked barge 0.67, vertical cylinder 0.88, Condeep 0.97, square face 1.0): a mean second-order force in irregular head seas, valid for the object much longer than the waves; wave-frequency towline snatch loads are a separate dynamic matter.',
    'Tug efficiency η = effective pull in the weather ÷ certified continuous static bollard pull: 0.75 is the classic DNV value for ocean tows; DNVGL-ST-N001 Table 11-2 gives values by tug size and weather (roughly 0.70 for small tugs up to 0.80 for large tugs in moderate seas) — enter the value agreed with the marine warranty surveyor. Certified BP is at 100 % MCR averaged over 10 minutes; the 110 % maximum must not be used.',
    'No allowance is made for the towline catenary weight, propeller-race interaction at short towlines (ST-N001 §11.12.2.14), shallow water or the tug\'s own resistance when making way; the "towing speed" shown is a simple linear estimate of the free-running pull reduction.',
  ],
  notes: [
    'Verification 2026-10-30: the Global Maritime technical note for the Haewene Brim FPSO tow (L 252 m, B 42 m, T 7 m; 20 m/s, 5 m, 1 m/s; Σ C_s C_h A = 2 113 m², bow area 292.7 m² with C_d 0.5, R 0.45, η 0.75) is reproduced: wave drift 27.2 t, wind 52.6 t, current 7.65 t, required 116.7 t; the 2-knot case (2.03 m/s relative) gives 148.5 t — against 165 t available.',
    'Design decision: forces are reported in kN and tonnes-force because towing contracts and bollard pull certificates quote tonnes.',
    'Design decision: the DNV reflection-coefficient table is offered as a select with a custom value, and both the frontal-drag and friction hull methods are available because barges and ships are treated differently in practice.',
  ],
  sources: [
    'DNVGL-ST-N001 Marine operations and marine warranty (2016, amended 2020), Sec. 11.12 tug selection and bollard pull requirements; DNV Rules for Planning and Execution of Marine Operations (1996/2000) Pt. 2 Ch. 2 §3.3 towing resistance and tug efficiency 0.75',
    'DNV-RP-H103 Modelling and analysis of marine operations (2011), §7.2.6 wave drift force on towed objects and reflection coefficients, §3.2.4 current force',
    'DNV-OS-C301 Stability and watertight integrity (2011), Tables B1–B2 wind shape and height coefficients',
    'Global Maritime, Technical Note TN_24138_1 "Haewene Brim bollard pull calculation" (2013) — worked example used for verification; Noble Denton ND-0030 Guidelines for marine transportations (design environments 20 m/s, 5 m, 0.5 m/s)',
  ],
  inputs: [
    { id: 'condition', label: 'Tow condition', type: 'select', default: 'ocean_hold', options: [{ value: 'ocean_hold', label: 'Ocean tow — hold station (zero speed)' }, { value: 'coastal_2kn', label: 'Coastal / restricted waters — make 2 knots over the ground' }] },
    { id: 'wind_m_s', label: 'Design wind speed V_w', group: 'speed', unit: 'm_s', default: 20, min: 0, max: 60, help: 'DNV ocean 20 m/s, benign 15 m/s.' },
    { id: 'hs_m', label: 'Design significant wave height H_s', group: 'length', unit: 'm', default: 5, min: 0, max: 15, help: 'DNV ocean 5 m, benign 2 m.' },
    { id: 'current_m_s', label: 'Design current speed V_c', group: 'speed', unit: 'm_s', default: 1, min: 0, max: 5, help: 'DNVGL-ST-N001 / ND-0030 0.5 m/s; DNV 1996 rules 1 m/s.' },
    { id: 'windage_area_m2', label: 'Transverse windage area A_w (or Σ C_s C_h A with coefficients 1.0)', group: 'area', unit: 'm2', default: 2113.06, min: 0, max: 50000 },
    { id: 'shape_coef', label: 'Wind shape coefficient C_s', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.5, max: 2, help: 'DNV-OS-C301: 1.0 hull, 1.1 deckhouses, 1.25–1.5 isolated structures.' },
    { id: 'height_coef', label: 'Wind height coefficient C_h', group: 'dimensionless', unit: 'none', default: 1.0, min: 1, max: 2, help: '1.0 below 15.3 m, 1.1 to 30.5 m, 1.2 to 46 m, 1.3 to 61 m.' },
    { id: 'rho_air', label: 'Air density', group: 'density', unit: 'kg_m3', default: 1.22, min: 1.1, max: 1.35 },
    { id: 'rho_water', label: 'Water density', group: 'density', unit: 'kg_m3', default: 1025, min: 990, max: 1040 },
    { id: 'hull_method', label: 'Current / hull force method', type: 'select', default: 'frontal', options: [{ value: 'frontal', label: 'Frontal drag on the submerged bow area (barges, blunt tows)' }, { value: 'friction', label: 'ITTC friction on the wetted surface (ship-shaped hull)' }] },
    { id: 'frontal_area_m2', label: 'Submerged frontal area A_c = B × T (less bilge cuts)', group: 'area', unit: 'm2', default: 292.74, min: 0, max: 20000, visibleWhen: { hull_method: 'frontal' } },
    { id: 'cd_preset', label: 'Current drag coefficient', type: 'select', default: 'barge', options: Object.entries(CURRENT_CD).map(([value, c]) => ({ value, label: c.label })), visibleWhen: { hull_method: 'frontal' } },
    { id: 'cd_custom', label: 'Custom C_d', group: 'dimensionless', unit: 'none', default: 0.5, min: 0.05, max: 2, visibleWhen: { hull_method: 'frontal', cd_preset: 'custom' } },
    { id: 'wetted_area_m2', label: 'Wetted surface S', group: 'area', unit: 'm2', default: 12000, min: 1, max: 100000, visibleWhen: { hull_method: 'friction' } },
    { id: 'length_m', label: 'Waterline length (Reynolds number)', group: 'length', unit: 'm', default: 252, min: 5, max: 500, visibleWhen: { hull_method: 'friction' } },
    { id: 'form_factor', label: 'Form factor 1+k', group: 'dimensionless', unit: 'none', default: 1.25, min: 1, max: 2, visibleWhen: { hull_method: 'friction' } },
    { id: 'fouling_dcf', label: 'Roughness / fouling allowance ΔC_F', group: 'dimensionless', unit: 'none', default: 0.0004, min: 0, max: 0.005, visibleWhen: { hull_method: 'friction' } },
    { id: 'beam_m', label: 'Breadth of the towed object B (wave drift)', group: 'length', unit: 'm', default: 42, min: 1, max: 200 },
    { id: 'reflection', label: 'Bow type for the reflection coefficient R', type: 'select', default: 'ship_bow', options: Object.entries(REFLECTION).map(([value, r]) => ({ value, label: r.label })) },
    { id: 'reflection_custom', label: 'Custom reflection coefficient R', group: 'dimensionless', unit: 'none', default: 0.5, min: 0.1, max: 1, visibleWhen: { reflection: 'custom' } },
    { id: 'tug_efficiency', label: 'Tug efficiency η (effective / certified bollard pull)', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.4, max: 1, help: 'DNV 0.75 for ocean tows; ST-N001 ≈ 0.70–0.80 by tug size and sea state.' },
    { id: 'available_bp_t', label: 'Certified continuous bollard pull of the tug(s) (0 = not compared)', group: 'mass', unit: 't', default: 165, min: 0, max: 1000 },
    { id: 'free_running_kn', label: 'Tug free-running speed (for the towing-speed estimate)', group: 'speed', unit: 'kn', default: 14, min: 1, max: 30 },
  ],
  outputs: [
    { id: 'relative_current_m_s', label: 'Relative water speed (current + required speed)', group: 'speed', unit: 'm_s' },
    { id: 'wind_force_n', label: 'Wind force F_wind', group: 'force', unit: 'N', display: 'kN' },
    { id: 'current_force_n', label: 'Current / hull force F_current', group: 'force', unit: 'N', display: 'kN' },
    { id: 'wave_force_n', label: 'Wave drift force F_wd = ⅛ ρ g R² B H_s²', group: 'force', unit: 'N', display: 'kN' },
    { id: 'reflection_used', label: 'Reflection coefficient R used', group: 'dimensionless', unit: 'none' },
    { id: 'total_force_n', label: 'Total towline pull required', group: 'force', unit: 'N', display: 'kN' },
    { id: 'total_force_t', label: 'Total towline pull required (tonnes-force)', group: 'mass', unit: 't' },
    { id: 'required_bp_t', label: 'Required certified bollard pull = total / η', group: 'mass', unit: 't' },
    { id: 'required_bp_n', label: 'Required certified bollard pull', group: 'force', unit: 'N', display: 'kN' },
    { id: 'wind_share_pct', label: 'Wind share of the total', group: 'ratio', unit: 'pct' },
    { id: 'wave_share_pct', label: 'Wave drift share of the total', group: 'ratio', unit: 'pct' },
    { id: 'tug_check', label: 'Tug adequacy', type: 'text' },
    { id: 'margin_pct', label: 'Available / required bollard pull margin', group: 'ratio', unit: 'pct' },
    { id: 'towing_speed_kn', label: 'Estimated towing speed in the design weather (linear pull reduction)', group: 'speed', unit: 'kn' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      wind_force_n: '516 kN',
      current_force_n: '75 kN',
      wave_force_n: '267 kN',
      total_force_t: '87.5 t',
      margin_pct: '41 %',
    },
  },
};

/** ITTC-1957 friction coefficient. */
export function ittcCf(speedMs, lengthM, nu = 1.18831e-6) {
  const rn = (speedMs * lengthM) / nu;
  return 0.075 / (Math.log10(rn) - 2) ** 2;
}

/** Wave drift force, N (DNV-RP-H103 §7.2.6 form). */
export function waveDriftForceN(rhoWater, reflection, beamM, hsM) {
  return (rhoWater * GRAVITY_M_S2 * reflection * reflection * beamM * hsM * hsM) / 8;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.condition, ['ocean_hold', 'coastal_2kn'], 'condition', 'Tow condition');
  assertOneOf(i.hull_method, ['frontal', 'friction'], 'hull_method', 'Hull method');
  assertOneOf(i.cd_preset, Object.keys(CURRENT_CD), 'cd_preset', 'Drag coefficient');
  assertOneOf(i.reflection, Object.keys(REFLECTION), 'reflection', 'Reflection');
  assertNonNegative(i.wind_m_s, 'wind_m_s', 'Wind speed');
  assertNonNegative(i.hs_m, 'hs_m', 'Wave height');
  assertNonNegative(i.current_m_s, 'current_m_s', 'Current');
  assertNonNegative(i.windage_area_m2, 'windage_area_m2', 'Windage area');
  assertPositive(i.shape_coef, 'shape_coef', 'Shape coefficient');
  assertRange(i.height_coef, 1, 3, 'height_coef', 'Height coefficient');
  assertPositive(i.rho_air, 'rho_air', 'Air density');
  assertPositive(i.rho_water, 'rho_water', 'Water density');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertRange(i.tug_efficiency, 0.3, 1, 'tug_efficiency', 'Tug efficiency');
  assertNonNegative(i.available_bp_t, 'available_bp_t', 'Available bollard pull');
  assertPositive(i.free_running_kn, 'free_running_kn', 'Free-running speed');

  const g = GRAVITY_M_S2;
  const requiredSpeed = i.condition === 'coastal_2kn' ? 2 * KNOT_M_S : 0;
  const vRel = i.current_m_s + requiredSpeed;
  const windForce = 0.5 * i.rho_air * i.shape_coef * i.height_coef * i.windage_area_m2 * i.wind_m_s ** 2;

  let currentForce;
  if (i.hull_method === 'frontal') {
    assertNonNegative(i.frontal_area_m2, 'frontal_area_m2', 'Frontal area');
    const cd = i.cd_preset === 'custom' ? assertPositive(i.cd_custom, 'cd_custom', 'Drag coefficient') : CURRENT_CD[i.cd_preset].cd;
    currentForce = 0.5 * i.rho_water * cd * i.frontal_area_m2 * vRel ** 2;
  } else {
    assertPositive(i.wetted_area_m2, 'wetted_area_m2', 'Wetted surface');
    assertPositive(i.length_m, 'length_m', 'Length');
    assertRange(i.form_factor, 1, 3, 'form_factor', 'Form factor');
    assertNonNegative(i.fouling_dcf, 'fouling_dcf', 'Fouling allowance');
    currentForce = vRel > 0 ? 0.5 * i.rho_water * i.wetted_area_m2 * vRel ** 2 * (ittcCf(vRel, i.length_m) * i.form_factor + i.fouling_dcf) : 0;
  }
  const R = i.reflection === 'custom' ? assertRange(i.reflection_custom, 0.05, 1, 'reflection_custom', 'Reflection coefficient') : REFLECTION[i.reflection].r;
  const waveForce = waveDriftForceN(i.rho_water, R, i.beam_m, i.hs_m);
  const total = windForce + currentForce + waveForce;
  if (total <= 0) throw new Error('No environmental force: enter a wind speed, wave height or current');
  const requiredBpN = total / i.tug_efficiency;
  const requiredBpT = requiredBpN / (1000 * g);
  const totalT = total / (1000 * g);

  let tugCheck = 'Not compared (enter the certified bollard pull)';
  let margin = null;
  if (i.available_bp_t > 0) {
    margin = (i.available_bp_t / requiredBpT - 1) * 100;
    tugCheck = margin >= 0 ? `OK — ${i.available_bp_t} t certified ≥ ${requiredBpT.toFixed(1)} t required (margin ${margin.toFixed(0)} %)` : `INSUFFICIENT — ${i.available_bp_t} t certified < ${requiredBpT.toFixed(1)} t required: larger tug or additional tug`;
  }
  // towing speed estimate: available pull falls linearly from BP at 0 kn to 0 at free-running speed; resistance ∝ V² relative to tow
  let towingSpeed = null;
  if (i.available_bp_t > 0) {
    const effectiveBpN = i.available_bp_t * 1000 * g * i.tug_efficiency;
    const vFree = i.free_running_kn * KNOT_M_S;
    const resistanceAt = (v) => windForce + waveForce + currentForce * ((i.current_m_s + v) / (vRel || 1)) ** 2;
    const pullAt = (v) => effectiveBpN * Math.max(0, 1 - v / vFree);
    if (pullAt(0) > resistanceAt(0)) {
      let lo = 0;
      let hi = vFree;
      for (let k = 0; k < 60; k += 1) {
        const mid = (lo + hi) / 2;
        if (pullAt(mid) > resistanceAt(mid)) lo = mid;
        else hi = mid;
      }
      towingSpeed = ((lo + hi) / 2) / KNOT_M_S;
    } else towingSpeed = 0;
  }

  const warnings = [];
  if (i.condition === 'coastal_2kn') warnings.push('Coastal condition: 2 knots over the ground added to the current for the hull force (wind and waves unchanged), per the DNV marine-operations rules.');
  if (i.shape_coef === 1 && i.height_coef === 1) warnings.push('Shape and height coefficients 1.0: either the windage area already includes Σ C_s C_h A, or deckhouses and tall structures are being under-counted (C_s up to 1.5, C_h up to 1.37).');
  if (i.hull_method === 'frontal') warnings.push('Frontal-drag hull force is a barge simplification subject to warranty-surveyor acceptance; use the friction method or Holtrop–Mennen for a ship-shaped tow.');
  if (margin !== null && margin >= 0 && margin < 10) warnings.push('Margin below 10 %: warranty surveyors usually expect some reserve over the calculated requirement.');
  warnings.push(`Tug efficiency ${i.tug_efficiency} converts the towline pull to certified bollard pull; confirm the value with the marine warranty surveyor (DNVGL-ST-N001 Table 11-2).`);
  warnings.push('Static holding calculation with co-linear head weather; towline dynamics, catenary weight and short-towline propeller-race losses are not included.');

  return {
    outputs: {
      relative_current_m_s: vRel,
      wind_force_n: windForce,
      current_force_n: currentForce,
      wave_force_n: waveForce,
      reflection_used: R,
      total_force_n: total,
      total_force_t: totalT,
      required_bp_t: requiredBpT,
      required_bp_n: requiredBpN,
      wind_share_pct: (windForce / total) * 100,
      wave_share_pct: (waveForce / total) * 100,
      tug_check: tugCheck,
      margin_pct: margin,
      towing_speed_kn: towingSpeed,
    },
    warnings,
  };
}
