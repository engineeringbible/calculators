/**
 * pump-npsh/calc.js — net positive suction head available from the suction conditions, the margin against the
 * pump's NPSH required, the maximum suction lift, the vapour pressure of water (IAPWS-IF97) and the suction specific speed.
 *
 * NPSHa = (p_abs − p_v)/(ρ g) + z_s − h_f;  z_max = h_f + NPSHr + margin − (p_abs − p_v)/(ρ g).
 * Schema units: kPa, m, kg/m³, °C, rpm, m³/h.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** IAPWS-IF97 region-4 saturation-pressure coefficients (eq. 30), valid 273.15–647.096 K. */
export const IF97_N = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.1202082470247e5, -0.32325550322333e7, 0.1491510861353e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];

export const schema = {
  id: 'pump-npsh',
  name: 'Pump NPSH and suction lift',
  category: 'mechanical',
  summary: 'NPSH available from suction conditions, vapour pressure and losses, margin against NPSH required and the maximum suction lift.',
  related: ['pipe-flow', 'pump-affinity', 'tank-volume', 'fuel-blend-heating'],
  assumptions: [
    'NPSH available is computed by the Hydraulic Institute definition NPSHa = (p_abs − p_v)/(ρ g) + z_s − h_f with p_abs the absolute pressure on the liquid surface (atmospheric plus any vessel gauge pressure), p_v the vapour pressure at the pumping temperature, z_s the liquid level above the pump impeller centreline (negative for a suction lift) and h_f the friction and fitting losses of the suction line at the duty flow (from the pipe-flow calculator); the velocity head is not added because NPSHr is defined on the same basis.',
    'Vapour pressure of water from the IAPWS-IF97 region-4 saturation equation (the steam-table formulation, 0.01–100 °C used here, accurate to 0.01 %); for other liquids or seawater (vapour pressure about 2 % lower than fresh water) enter the vapour pressure directly.',
    'NPSH required is the pump maker\'s 3 % head-drop value (NPSH3) at the duty flow; the recommended margin follows ANSI/HI 9.6.1 — at least 0.6–1 m or a ratio of 1.1–1.3 depending on the energy level of the pump — and the user sets it. A margin met on paper can still cavitate with air entrainment, pre-rotation or hot liquid.',
    'Maximum suction lift is the static lift at which NPSHa just equals NPSHr plus the chosen margin; it falls with temperature, altitude and friction, and the practical limit for cold water is 6–7 m even though the theoretical limit at sea level is about 10 m.',
    'Suction specific speed (US customary, rpm · √gpm / ft^0.75) is a design-quality index of the pump: values above about 11 000 indicate a pump prone to recirculation at part load (HI historic guidance 8 500–11 000); it needs the duty flow and speed.',
    'Thoma cavitation number σ = NPSHr/H compares the required NPSH with the pump head; it is informative only.',
  ],
  notes: [
    'Verification 2026-10-30: IF97 gives 2.339 kPa at 20 °C, 19.95 kPa at 60 °C, 70.18 kPa at 90 °C and 101.42 kPa at 100 °C (steam tables); the theoretical suction lift of 20 °C water at sea level is (101.325 − 2.339)/(998 × 9.81) = 10.1 m, the textbook figure; a 3 m lift with 1 m of friction gives NPSHa 6.1 m, and that layout reaches NPSHa = NPSHr at about 71 °C.',
    'Design decision: the vapour pressure can be taken from IF97 (water) or entered, because marine pumps handle seawater, fuel and lubricating oil as well.',
    'Design decision: NPSHr margin is entered both as an absolute value and a ratio and the stricter one is applied, following the two forms used in HI 9.6.1.',
  ],
  sources: [
    'ANSI/HI 9.6.1-2017, Rotodynamic Pumps — Guideline for NPSH Margin; ANSI/HI 14.6 performance acceptance tests (NPSH3 definition)',
    'I. J. Karassik et al., Pump Handbook, 4th ed. (McGraw-Hill 2008), ch. 2 and 11 — NPSH, suction lift, suction specific speed',
    'IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam — region 4 saturation-pressure equation (30)',
    'ISO 9906:2012 Rotodynamic pumps — hydraulic performance acceptance tests (NPSH test)',
  ],
  inputs: [
    { id: 'liquid', label: 'Liquid vapour pressure', type: 'select', default: 'water', options: [{ value: 'water', label: 'Water — IAPWS-IF97 saturation pressure at the pumping temperature' }, { value: 'custom', label: 'Enter the vapour pressure directly (seawater, fuel, oil)' }] },
    { id: 'temperature_c', label: 'Liquid temperature', group: 'temperature', unit: 'C', default: 20, min: 1, max: 100, visibleWhen: { liquid: 'water' } },
    { id: 'vapour_pressure_kpa', label: 'Vapour pressure (absolute)', group: 'pressure', unit: 'kPa', default: 2.34, min: 0.01, max: 500, visibleWhen: { liquid: 'custom' } },
    { id: 'density_kg_m3', label: 'Liquid density', group: 'density', unit: 'kg_m3', default: 998, min: 500, max: 2000 },
    { id: 'atmospheric_kpa', label: 'Atmospheric pressure (sea level 101.325; ≈ −1.2 kPa per 100 m altitude)', group: 'pressure', unit: 'kPa', default: 101.325, min: 50, max: 110 },
    { id: 'vessel_gauge_kpa', label: 'Gauge pressure on the liquid surface (0 open tank; negative under vacuum)', group: 'pressure', unit: 'kPa', default: 0, min: -100, max: 5000 },
    { id: 'static_head_m', label: 'Liquid level above the impeller centreline z_s (negative = suction lift)', group: 'length', unit: 'm', default: -3, min: -12, max: 100 },
    { id: 'friction_loss_m', label: 'Suction line friction and fitting losses h_f at duty flow', group: 'length', unit: 'm', default: 1, min: 0, max: 50 },
    { id: 'npshr_m', label: 'NPSH required by the pump (NPSH3) at duty flow', group: 'length', unit: 'm', default: 3, min: 0.1, max: 50 },
    { id: 'margin_m', label: 'Minimum NPSH margin (absolute)', group: 'length', unit: 'm', default: 1, min: 0, max: 10, help: 'HI 9.6.1: 0.6–1 m for low-energy pumps.' },
    { id: 'margin_ratio', label: 'Minimum NPSHa / NPSHr ratio', group: 'dimensionless', unit: 'none', default: 1.2, min: 1, max: 3, help: 'HI 9.6.1: 1.1–1.3 (higher for high-energy pumps).' },
    { id: 'flow_m3_h', label: 'Duty flow (for suction specific speed; 0 to skip)', group: 'volume_flow', unit: 'm3_h', default: 100, min: 0, max: 100000 },
    { id: 'speed_rpm', label: 'Pump speed', group: 'rotational_speed', unit: 'rpm', default: 1450, min: 0, max: 20000 },
    { id: 'head_m', label: 'Pump total head at duty (Thoma number; 0 to skip)', group: 'length', unit: 'm', default: 40, min: 0, max: 2000 },
  ],
  outputs: [
    { id: 'vapour_pressure_out_kpa', label: 'Vapour pressure used', group: 'pressure', unit: 'kPa' },
    { id: 'surface_pressure_kpa', label: 'Absolute pressure on the liquid surface', group: 'pressure', unit: 'kPa' },
    { id: 'pressure_head_m', label: 'Pressure head (p_abs − p_v)/(ρ g)', group: 'length', unit: 'm' },
    { id: 'npsha_m', label: 'NPSH available', group: 'length', unit: 'm' },
    { id: 'margin_out_m', label: 'Margin NPSHa − NPSHr', group: 'length', unit: 'm' },
    { id: 'ratio_out', label: 'Ratio NPSHa / NPSHr', group: 'dimensionless', unit: 'none' },
    { id: 'status', label: 'Cavitation check', type: 'text' },
    { id: 'max_lift_m', label: 'Maximum static suction lift meeting NPSHr + margin (positive = level may be this far below the pump; negative = flooded suction needed)', group: 'length', unit: 'm' },
    { id: 'theoretical_lift_m', label: 'Theoretical lift limit (p_abs − p_v)/(ρ g) with no friction or NPSHr', group: 'length', unit: 'm' },
    { id: 'boiling_margin_k', label: 'Water: temperature at which NPSHa would reach NPSHr (°C)', group: 'dimensionless', unit: 'none' },
    { id: 'nss_us', label: 'Suction specific speed N_ss = n √Q_gpm / NPSHr_ft^0.75', group: 'dimensionless', unit: 'none' },
    { id: 'thoma', label: 'Thoma cavitation number σ = NPSHr / H', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      vapour_pressure_out_kpa: '2.34 kPa',
      pressure_head_m: '10.1 m',
      npsha_m: '6.1 m',
      margin_out_m: '3.1 m',
      max_lift_m: '5.1 m',
      theoretical_lift_m: '10.1 m',
      nss_us: '5 480',
    },
  },
};

/** Saturation pressure of water, kPa (IAPWS-IF97 region 4, eq. 30). */
export function waterVapourPressureKpa(tC) {
  const [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10] = IF97_N;
  const T = tC + 273.15;
  const theta = T + n9 / (T - n10);
  const A = theta * theta + n1 * theta + n2;
  const B = n3 * theta * theta + n4 * theta + n5;
  const C = n6 * theta * theta + n7 * theta + n8;
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4 * 1000;
}

/** NPSH available, m. */
export function npshAvailable(pAbsKpa, pVapKpa, rho, zS, hF) {
  return ((pAbsKpa - pVapKpa) * 1000) / (rho * GRAVITY_M_S2) + zS - hF;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.liquid, ['water', 'custom'], 'liquid', 'Liquid');
  assertPositive(i.density_kg_m3, 'density_kg_m3', 'Density');
  assertPositive(i.atmospheric_kpa, 'atmospheric_kpa', 'Atmospheric pressure');
  assertNonNegative(i.friction_loss_m, 'friction_loss_m', 'Friction loss');
  assertPositive(i.npshr_m, 'npshr_m', 'NPSH required');
  assertNonNegative(i.margin_m, 'margin_m', 'Margin');
  assertRange(i.margin_ratio, 1, 5, 'margin_ratio', 'Margin ratio');
  assertNonNegative(i.flow_m3_h, 'flow_m3_h', 'Flow');
  assertNonNegative(i.speed_rpm, 'speed_rpm', 'Speed');
  assertNonNegative(i.head_m, 'head_m', 'Head');
  assertRange(i.static_head_m, -50, 500, 'static_head_m', 'Static head');

  let pv;
  if (i.liquid === 'water') {
    assertRange(i.temperature_c, 0.01, 100, 'temperature_c', 'Temperature');
    pv = waterVapourPressureKpa(i.temperature_c);
  } else pv = assertPositive(i.vapour_pressure_kpa, 'vapour_pressure_kpa', 'Vapour pressure');
  const pAbs = i.atmospheric_kpa + i.vessel_gauge_kpa;
  if (pAbs <= pv) throw new Error(`Surface pressure ${pAbs.toFixed(1)} kPa does not exceed the vapour pressure ${pv.toFixed(1)} kPa: the liquid is boiling at the surface`);

  const g = GRAVITY_M_S2;
  const pressureHead = ((pAbs - pv) * 1000) / (i.density_kg_m3 * g);
  const npsha = npshAvailable(pAbs, pv, i.density_kg_m3, i.static_head_m, i.friction_loss_m);
  const margin = npsha - i.npshr_m;
  const ratio = npsha / i.npshr_m;
  const requiredNpsha = Math.max(i.npshr_m + i.margin_m, i.npshr_m * i.margin_ratio);
  const maxLift = -(requiredNpsha + i.friction_loss_m - pressureHead);

  let status;
  if (npsha <= 0) status = `CAVITATION — NPSHa ${npsha.toFixed(2)} m: the liquid flashes before the impeller`;
  else if (npsha < i.npshr_m) status = `CAVITATION — NPSHa ${npsha.toFixed(2)} m below NPSHr ${i.npshr_m} m`;
  else if (npsha < requiredNpsha) status = `MARGINAL — NPSHa ${npsha.toFixed(2)} m exceeds NPSHr but not the required ${requiredNpsha.toFixed(2)} m (margin ≥ ${i.margin_m} m and ratio ≥ ${i.margin_ratio})`;
  else status = `OK — NPSHa ${npsha.toFixed(2)} m ≥ ${requiredNpsha.toFixed(2)} m required (margin ${margin.toFixed(2)} m, ratio ${ratio.toFixed(2)})`;

  // temperature at which NPSHa = NPSHr for water (bisection on vapour pressure), only in water mode
  let boilingTemp = null;
  if (i.liquid === 'water') {
    const f = (t) => npshAvailable(pAbs, waterVapourPressureKpa(t), i.density_kg_m3, i.static_head_m, i.friction_loss_m) - i.npshr_m;
    if (f(1) > 0 && f(100) < 0) {
      let lo = 1;
      let hi = 100;
      for (let k = 0; k < 60; k += 1) {
        const mid = (lo + hi) / 2;
        if (f(mid) > 0) lo = mid;
        else hi = mid;
      }
      boilingTemp = (lo + hi) / 2;
    } else if (f(100) >= 0) boilingTemp = 100;
  }

  const nss =i.flow_m3_h > 0 && i.speed_rpm > 0 ? (i.speed_rpm * Math.sqrt(i.flow_m3_h / 0.227124707)) / (i.npshr_m / 0.3048) ** 0.75 : null;
  const thoma = i.head_m > 0 ? i.npshr_m / i.head_m : null;

  const warnings = [];
  if (i.liquid === 'water' && i.temperature_c > 60) warnings.push('Hot water: the vapour pressure rises steeply (19.9 kPa at 60 °C, 70 kPa at 90 °C) — small temperature changes move NPSHa by metres; consider a flooded suction or a booster pump.');
  if (i.static_head_m < 0 && i.liquid === 'water' && -i.static_head_m > 6) warnings.push('Suction lift above 6 m: rarely workable in practice even when the arithmetic allows it (priming, air leakage, transients).');
  if (nss !== null && nss > 11000) warnings.push(`Suction specific speed ${nss.toFixed(0)} above 11 000: the pump may suffer suction recirculation at part load (HI guidance).`);
  if (i.vessel_gauge_kpa !== 0) warnings.push('Closed vessel: the surface pressure includes the gauge pressure entered — for a liquid at its boiling point in the vessel (deaerator, condenser) the pressure head term vanishes and only the static head remains.');
  warnings.push('Friction loss must be the suction-line loss at the duty flow (pipe-flow calculator), including strainer, foot valve and entrance losses.');
  warnings.push('NPSHr is the maker\'s 3 % head-drop value; incipient cavitation starts at 2–5 times NPSH3, so margins per ANSI/HI 9.6.1 are advisable.');

  return {
    outputs: {
      vapour_pressure_out_kpa: pv,
      surface_pressure_kpa: pAbs,
      pressure_head_m: pressureHead,
      npsha_m: npsha,
      margin_out_m: margin,
      ratio_out: ratio,
      status,
      max_lift_m: maxLift,
      theoretical_lift_m: pressureHead,
      boiling_margin_k: boilingTemp,
      nss_us: nss,
      thoma,
    },
    warnings,
  };
}
