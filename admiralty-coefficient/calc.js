/**
 * admiralty-coefficient/calc.js — Admiralty coefficient and speed–power–displacement scaling from one known point.
 *
 * A_c = Δ^(2/3) V³ / P.  Scaling: P₂ = P₁ (Δ₂/Δ₁)^(2/3) (V₂/V₁)^n with n = 3 by default; fuel per day ∝ P at constant SFOC.
 * Schema units: t, kn, kW, g/kWh.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const HOURS_PER_DAY = 24;
const DISPLACEMENT_EXPONENT = 2 / 3;

export const schema = {
  id: 'admiralty-coefficient',
  name: 'Admiralty coefficient and speed–power scaling',
  category: 'maritime',
  summary: 'Admiralty and fuel coefficients from a known point; power or speed at a new displacement and speed (cube or chosen exponent), with fuel per day and per mile.',
  related: ['fuel-voyage-cost', 'propeller-slip', 'cii-rating', 'pump-affinity'],
  sendTo: [
    {
      target: 'optimal-speed-charter',
      label: 'Optimal speed from this speed–fuel point',
      note: 'The known speed, its fuel per day and the speed exponent define the same power law there; enter the distance, the prices and the charter terms.',
      links: [
        { to: 'v_ref_kn', from: 'input:speed1_kn' },
        { to: 'fuel_ref_t_day', from: 'fuel1_t_day', raw: true },
        { to: 'exponent_n', from: 'input:speed_exponent' },
      ],
    },
  ],
  assumptions: [
    'The Admiralty coefficient A_c = Δ^(2/3) V³ / P is a similarity rule: it holds between conditions of the SAME ship (or closely similar ships) at similar speed–length ratios, in calm water, with the same hull and propeller condition and the same propulsive efficiency.',
    'Power scales with displacement to the power 2/3 (wetted surface scaling) — this ignores the change of trim, draft-dependent wave resistance and propeller immersion that accompany a real displacement change.',
    'The speed exponent n is 3 by default (the cube law); real exponents are 3.2–3.5 for container ships and ferries and rise steeply near the hull speed, so the result is reliable only for speed changes of ±15–20 % around the known point.',
    'Fuel per day is proportional to power at constant specific fuel consumption; SFOC rises by 5–10 % below about 50 % engine load, which is not modelled.',
    'Fuel per nautical mile uses the same speed for both conditions\' distance (fuel/day ÷ 24 V), so with n = 3 it scales with V² at constant displacement.',
    'Weather, fouling and shallow water are excluded; the known point should be a calm-water, clean-hull reference (sea trials or a verified noon report).',
    'The fuel coefficient Δ^(2/3) V³ / (fuel per day) is a legacy comparison figure and depends on SFOC and fuel calorific value.',
  ],
  notes: [
    'Verification 2026-10-30: the default point (47 232 t, 14 kn, 8 000 kW) gives A_c = 447.7, inside the 350–600 range quoted for cargo ships; power at 12 kn (5 038 kW), speed at 6 000 kW (12.72 kn), displacement scaling to 40 000 t (7 161 kW) and the fuel-per-mile change (−26.5 %) were checked by hand.',
    'Design decision: the speed exponent is an input (default 3) because the cube law is a teaching idealisation; MAN quotes 3.2–3.5 for faster hull forms.',
    'Design decision: the fuel outputs reuse the SFOC definition of the fuel-voyage-cost calculator (P × SFOC × 24 / 10⁶ t/day) so the two agree.',
  ],
  sources: [
    'Rawson & Tupper, Basic Ship Theory, 5th ed. (2001), ch. 10 "Powering of ships" (Admiralty coefficient)',
    'D.A. Taylor, Introduction to Marine Engineering, 2nd ed. (1996), "Admiralty coefficient" and "fuel coefficient"',
    'C.B. Barrass, Ship Design and Performance for Masters and Mates (2004), ch. "Admiralty coefficient and fuel coefficient"',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018), "Power and speed relationship" (speed exponent 3 to 4 by ship type)',
  ],
  inputs: [
    { id: 'displacement1_t', label: 'Known displacement Δ₁', group: 'mass', unit: 't', default: 47232, min: 1, max: 1e6 },
    { id: 'speed1_kn', label: 'Known speed V₁', group: 'speed', unit: 'kn', default: 14, min: 0.1, max: 60 },
    { id: 'power1_kw', label: 'Known shaft or brake power P₁', group: 'power', unit: 'kW', default: 8000, min: 1, max: 200000 },
    { id: 'sfoc_g_kwh', label: 'Specific fuel consumption (for the fuel outputs)', group: 'specific_fuel', unit: 'g_kWh', default: 175, min: 100, max: 400 },
    {
      id: 'mode',
      label: 'Find',
      type: 'select',
      default: 'power',
      options: [
        { value: 'power', label: 'Power at a new displacement and speed' },
        { value: 'speed', label: 'Speed at a new displacement and power' },
      ],
    },
    { id: 'displacement2_t', label: 'New displacement Δ₂', group: 'mass', unit: 't', default: 47232, min: 1, max: 1e6 },
    { id: 'speed2_kn', label: 'New speed V₂', group: 'speed', unit: 'kn', default: 12, min: 0.1, max: 60, visibleWhen: { mode: 'power' } },
    { id: 'power2_kw', label: 'Available power P₂', group: 'power', unit: 'kW', default: 6000, min: 1, max: 200000, visibleWhen: { mode: 'speed' } },
    { id: 'speed_exponent', label: 'Speed exponent n (P ∝ Vⁿ)', group: 'dimensionless', unit: 'none', default: 3, min: 2, max: 5, help: 'Cube law 3; container ships and ferries 3.2–3.5; higher near hull speed.' },
  ],
  outputs: [
    { id: 'admiralty_coefficient', label: 'Admiralty coefficient A_c = Δ^(2/3) V³ / P', group: 'dimensionless', unit: 'none' },
    { id: 'fuel_coefficient', label: 'Fuel coefficient Δ^(2/3) V³ / (fuel per day)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'power2_out_kw', label: 'Power at the new condition P₂', group: 'power', unit: 'kW' },
    { id: 'speed2_out_kn', label: 'Speed at the new condition V₂', group: 'speed', unit: 'kn' },
    { id: 'power_ratio', label: 'Power ratio P₂ / P₁', group: 'dimensionless', unit: 'none' },
    { id: 'speed_ratio', label: 'Speed ratio V₂ / V₁', group: 'dimensionless', unit: 'none' },
    { id: 'fuel1_t_day', label: 'Fuel per day at the known point', group: 'mass_flow', unit: 't_day' },
    { id: 'fuel2_t_day', label: 'Fuel per day at the new condition', group: 'mass_flow', unit: 't_day' },
    { id: 'fuel_per_nmi1_kg', label: 'Fuel per nautical mile, known point', group: 'mass_per_distance', unit: 'kg_nmi' },
    { id: 'fuel_per_nmi2_kg', label: 'Fuel per nautical mile, new condition', group: 'mass_per_distance', unit: 'kg_nmi' },
    { id: 'fuel_per_nmi_change_pct', label: 'Change in fuel per mile', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      admiralty_coefficient: '448',
      fuel_coefficient: '106 700',
      power2_out_kw: '5 038 kW',
      fuel1_t_day: '33.6 t/day',
      fuel2_t_day: '21.2 t/day',
      fuel_per_nmi1_kg: '100 kg/nmi',
      fuel_per_nmi2_kg: '73.5 kg/nmi',
    },
  },
};

/** Admiralty coefficient from displacement (t), speed (kn) and power (kW). */
export function admiraltyCoefficient(displacementT, speedKn, powerKw) {
  return (displacementT ** DISPLACEMENT_EXPONENT * speedKn ** 3) / powerKw;
}

/** Power at a new displacement and speed: P₂ = P₁ (Δ₂/Δ₁)^(2/3) (V₂/V₁)^n. */
export function scalePower(power1, displacement1, speed1, displacement2, speed2, exponent = 3) {
  return power1 * (displacement2 / displacement1) ** DISPLACEMENT_EXPONENT * (speed2 / speed1) ** exponent;
}

/** Speed at a new displacement and power: V₂ = V₁ [(P₂/P₁) (Δ₁/Δ₂)^(2/3)]^(1/n). */
export function scaleSpeed(speed1, displacement1, power1, displacement2, power2, exponent = 3) {
  return speed1 * ((power2 / power1) * (displacement1 / displacement2) ** DISPLACEMENT_EXPONENT) ** (1 / exponent);
}

/** Daily fuel (t/day) from power (kW) and SFOC (g/kWh). */
export function dailyFuelT(powerKw, sfocGPerKwh) {
  return (powerKw * sfocGPerKwh * HOURS_PER_DAY) / 1e6;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.displacement1_t, 'displacement1_t', 'Known displacement');
  assertPositive(i.speed1_kn, 'speed1_kn', 'Known speed');
  assertPositive(i.power1_kw, 'power1_kw', 'Known power');
  assertPositive(i.sfoc_g_kwh, 'sfoc_g_kwh', 'SFOC');
  assertOneOf(i.mode, ['power', 'speed'], 'mode', 'Find');
  assertPositive(i.displacement2_t, 'displacement2_t', 'New displacement');
  assertRange(i.speed_exponent, 1, 6, 'speed_exponent', 'Speed exponent');

  let power2;
  let speed2;
  if (i.mode === 'power') {
    speed2 = assertPositive(i.speed2_kn, 'speed2_kn', 'New speed');
    power2 = scalePower(i.power1_kw, i.displacement1_t, i.speed1_kn, i.displacement2_t, speed2, i.speed_exponent);
  } else {
    power2 = assertPositive(i.power2_kw, 'power2_kw', 'Available power');
    speed2 = scaleSpeed(i.speed1_kn, i.displacement1_t, i.power1_kw, i.displacement2_t, power2, i.speed_exponent);
  }

  const fuel1 = dailyFuelT(i.power1_kw, i.sfoc_g_kwh);
  const fuel2 = dailyFuelT(power2, i.sfoc_g_kwh);
  const fuelPerNmi1 = (fuel1 * 1000) / (HOURS_PER_DAY * i.speed1_kn);
  const fuelPerNmi2 = (fuel2 * 1000) / (HOURS_PER_DAY * speed2);
  const speedRatio = speed2 / i.speed1_kn;

  const warnings = [];
  if (speedRatio > 1.2 || speedRatio < 0.8) warnings.push('Speed change beyond ±20 % of the known point: the fixed speed exponent is unreliable (resistance curves bend); use a nearer reference point.');
  if (i.displacement2_t / i.displacement1_t > 1.3 || i.displacement2_t / i.displacement1_t < 0.7) warnings.push('Displacement change beyond ±30 %: trim, draft and propeller-immersion effects are not captured by the 2/3 power.');
  if (power2 / i.power1_kw < 0.5) warnings.push('New power below 50 % of the known point: SFOC rises at low engine load, so the fuel figures understate consumption.');
  const ac = admiraltyCoefficient(i.displacement1_t, i.speed1_kn, i.power1_kw);
  if (ac < 250 || ac > 800) warnings.push('Admiralty coefficient outside 250–800: check the units of the known point (power in kW at the shaft, speed in knots, displacement in tonnes).');

  return {
    outputs: {
      admiralty_coefficient: ac,
      fuel_coefficient: (i.displacement1_t ** DISPLACEMENT_EXPONENT * i.speed1_kn ** 3) / fuel1,
      power2_out_kw: power2,
      speed2_out_kn: speed2,
      power_ratio: power2 / i.power1_kw,
      speed_ratio: speedRatio,
      fuel1_t_day: fuel1,
      fuel2_t_day: fuel2,
      fuel_per_nmi1_kg: fuelPerNmi1,
      fuel_per_nmi2_kg: fuelPerNmi2,
      fuel_per_nmi_change_pct: ((fuelPerNmi2 - fuelPerNmi1) / fuelPerNmi1) * 100,
    },
    warnings,
  };
}
