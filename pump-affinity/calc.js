/**
 * pump-affinity/calc.js — affinity (similarity) laws for centrifugal pumps and fans: flow, head or pressure, and power
 * at a new speed and/or impeller diameter, plus hydraulic power, efficiency and specific speed at the known point.
 *
 * Speed change (same machine):      Q ∝ N,      H ∝ N²,     P ∝ N³
 * Impeller trim (same casing):      Q ∝ D,      H ∝ D²,     P ∝ D³        (industry approximation)
 * Geometric scaling (similar pumps): Q ∝ D³,     H ∝ D²,     P ∝ D⁵
 *
 * Schema units: SI — m³/s, m, Pa, W, rpm, m, kg/m³.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

/** Exponents [flow, head, power] on the diameter ratio for the two diameter laws. */
export const DIAMETER_EXPONENTS = {
  trim: { flow: 1, head: 2, power: 3 },
  similar: { flow: 3, head: 2, power: 5 },
};

/** Exponents on the speed ratio. */
export const SPEED_EXPONENTS = { flow: 1, head: 2, power: 3 };

export const schema = {
  id: 'pump-affinity',
  name: 'Pump and fan affinity laws',
  category: 'mechanical',
  summary: 'Flow, head or pressure and power at a new speed or impeller diameter from one known operating point, with efficiency and specific speed.',
  related: ['pipe-flow', 'shaft-torque', 'three-phase-power', 'heat-exchanger-lmtd'],
  notes: [
    'Design decision: two diameter laws are offered because impeller trimming (Q ∝ D) and geometric scaling (Q ∝ D³) are routinely confused; trimming is the default since that is what happens to an existing pump.',
    'Verification 2026-10-30: the 1 450 → 1 750 rpm case was checked by hand (×1.2069, ×1.4566, ×1.7580) and the specific speed against the radial-flow range in Gülich.',
    'Design decision: efficiency at the known point is reported so an inconsistent input set (hydraulic power above shaft power) is flagged before the laws are applied.',
  ],
  assumptions: [
    'Efficiency is assumed unchanged at the scaled point; this holds within about ±25 % speed change and for trims above 80–85 % of the full impeller diameter.',
    'The laws move the pump or fan curve, not the duty point: with static head in the system the new operating point must be found from the intersection with the system curve.',
    'Impeller trimming uses the industry approximation Q ∝ D, H ∝ D², P ∝ D³ (same casing); geometric scaling of a similar machine uses Q ∝ D³, H ∝ D², P ∝ D⁵. Trims below 75 % are flagged as unreliable.',
    'NPSH required rises roughly with the square of speed; cavitation margin must be rechecked after a speed increase.',
    'Fan laws assume incompressible flow (pressure rise below about 10 kPa); density affects only the hydraulic power and efficiency outputs here.',
    'Specific speed n_q uses the European convention (rpm, m³/s, m); the US Ns in gpm and ft is 51.6 × n_q.',
    'Not applicable to positive-displacement pumps, whose flow follows speed but whose pressure is set by the system.',
  ],
  sources: [
    'ANSI/HI 14.3 — Rotodynamic Pumps for Design and Application (affinity laws)',
    'Karassik, Messina, Cooper & Heald, Pump Handbook, 4th ed. (2008), §2.3',
    'J.F. Gülich, Centrifugal Pumps, 3rd ed. (2014), §3.4 similarity laws, §4.5 impeller trimming',
    'ASHRAE Handbook — HVAC Systems and Equipment, ch. 21 "Fans" (fan laws)',
  ],
  inputs: [
    {
      id: 'machine',
      label: 'Machine',
      type: 'select',
      default: 'pump',
      options: [
        { value: 'pump', label: 'Centrifugal pump (head in metres of liquid)' },
        { value: 'fan', label: 'Fan or blower (total pressure in Pa)' },
      ],
    },
    { id: 'flow1_m3_s', label: 'Known flow Q₁', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 200 / 3600, min: 0, max: 1000 },
    { id: 'head1_m', label: 'Known head H₁', group: 'length', unit: 'm', default: 50, min: 0, max: 5000, visibleWhen: { machine: 'pump' } },
    { id: 'pressure1_pa', label: 'Known total pressure rise Δp₁', group: 'pressure', unit: 'Pa', default: 1000, min: 0, max: 1e6, visibleWhen: { machine: 'fan' } },
    { id: 'power1_w', label: 'Known shaft power P₁', group: 'power', unit: 'W', display: 'kW', default: 35000, min: 0, max: 1e8 },
    { id: 'rho_kg_m3', label: 'Fluid density ρ', group: 'density', unit: 'kg_m3', default: 1000, min: 0.01, max: 20000, help: 'Water 1000, sea water 1025, air 1.2. Used for hydraulic power and efficiency only.' },
    { id: 'speed1_rpm', label: 'Known speed N₁', group: 'rotational_speed', unit: 'rpm', default: 1450, min: 0.1, max: 100000 },
    { id: 'speed2_rpm', label: 'New speed N₂', group: 'rotational_speed', unit: 'rpm', default: 1750, min: 0.1, max: 100000 },
    { id: 'diameter1_m', label: 'Known impeller diameter D₁', group: 'length', unit: 'm', display: 'mm', default: 0.25, min: 0.001, max: 10 },
    { id: 'diameter2_m', label: 'New impeller diameter D₂', group: 'length', unit: 'm', display: 'mm', default: 0.25, min: 0.001, max: 10 },
    {
      id: 'diameter_law',
      label: 'Diameter change is',
      type: 'select',
      default: 'trim',
      options: [
        { value: 'trim', label: 'Impeller trim in the same casing (Q ∝ D, H ∝ D², P ∝ D³)' },
        { value: 'similar', label: 'Geometrically similar machine (Q ∝ D³, H ∝ D², P ∝ D⁵)' },
      ],
    },
  ],
  outputs: [
    { id: 'speed_ratio', label: 'Speed ratio N₂/N₁', group: 'dimensionless', unit: 'none' },
    { id: 'diameter_ratio', label: 'Diameter ratio D₂/D₁', group: 'dimensionless', unit: 'none' },
    { id: 'flow2_m3_s', label: 'New flow Q₂', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'head2_m', label: 'New head H₂', group: 'length', unit: 'm', visibleWhen: { machine: 'pump' } },
    { id: 'pressure2_pa', label: 'New total pressure rise Δp₂', group: 'pressure', unit: 'Pa', visibleWhen: { machine: 'fan' } },
    { id: 'power2_w', label: 'New shaft power P₂', group: 'power', unit: 'W', display: 'kW' },
    { id: 'hydraulic_power1_w', label: 'Hydraulic (useful) power at the known point', group: 'power', unit: 'W', display: 'kW' },
    { id: 'efficiency_pct', label: 'Overall efficiency at the known point (assumed unchanged)', group: 'ratio', unit: 'pct' },
    { id: 'specific_speed_nq', label: 'Specific speed n_q = N √Q / H^0.75 (rpm, m³/s, m)', group: 'dimensionless', unit: 'none', visibleWhen: { machine: 'pump' } },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      speed_ratio: '1.207',
      flow2_m3_s: '241.4 m³/h',
      head2_m: '72.8 m',
      power2_w: '61.5 kW',
      hydraulic_power1_w: '27.2 kW',
      efficiency_pct: '77.8 %',
      specific_speed_nq: '18.2',
    },
  },
};

/**
 * Scale a known operating point by speed and diameter ratios.
 * @returns {{ flow: number, head: number, power: number }} multipliers to apply to Q, H (or Δp) and P
 */
export function affinityMultipliers(speedRatio, diameterRatio, diameterLaw = 'trim') {
  const d = DIAMETER_EXPONENTS[diameterLaw];
  return {
    flow: speedRatio ** SPEED_EXPONENTS.flow * diameterRatio ** d.flow,
    head: speedRatio ** SPEED_EXPONENTS.head * diameterRatio ** d.head,
    power: speedRatio ** SPEED_EXPONENTS.power * diameterRatio ** d.power,
  };
}

/** Hydraulic power of a pump, W: ρ g Q H. */
export function pumpHydraulicPowerW(rhoKgM3, flowM3S, headM) {
  return rhoKgM3 * GRAVITY_M_S2 * flowM3S * headM;
}

/** Specific speed n_q in the European convention (rpm, m³/s, m). */
export function specificSpeedNq(speedRpm, flowM3S, headM) {
  return (speedRpm * Math.sqrt(flowM3S)) / headM ** 0.75;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.machine, ['pump', 'fan'], 'machine', 'Machine');
  assertOneOf(i.diameter_law, Object.keys(DIAMETER_EXPONENTS), 'diameter_law', 'Diameter law');
  assertPositive(i.speed1_rpm, 'speed1_rpm', 'Known speed');
  assertPositive(i.speed2_rpm, 'speed2_rpm', 'New speed');
  assertPositive(i.diameter1_m, 'diameter1_m', 'Known impeller diameter');
  assertPositive(i.diameter2_m, 'diameter2_m', 'New impeller diameter');
  assertPositive(i.rho_kg_m3, 'rho_kg_m3', 'Density');
  if (i.flow1_m3_s < 0 || i.power1_w < 0) throw new Error('Flow and power must not be negative');

  const speedRatio = i.speed2_rpm / i.speed1_rpm;
  const diameterRatio = i.diameter2_m / i.diameter1_m;
  const m = affinityMultipliers(speedRatio, diameterRatio, i.diameter_law);
  const warnings = [];

  const outputs = {
    speed_ratio: speedRatio,
    diameter_ratio: diameterRatio,
    flow2_m3_s: i.flow1_m3_s * m.flow,
    power2_w: i.power1_w * m.power,
  };

  let hydraulicPower;
  if (i.machine === 'pump') {
    if (i.head1_m < 0) throw new Error('Head must not be negative');
    outputs.head2_m = i.head1_m * m.head;
    hydraulicPower = pumpHydraulicPowerW(i.rho_kg_m3, i.flow1_m3_s, i.head1_m);
    outputs.specific_speed_nq = i.head1_m > 0 && i.flow1_m3_s > 0 ? specificSpeedNq(i.speed1_rpm, i.flow1_m3_s, i.head1_m) : null;
  } else {
    if (i.pressure1_pa < 0) throw new Error('Pressure rise must not be negative');
    outputs.pressure2_pa = i.pressure1_pa * m.head;
    hydraulicPower = i.flow1_m3_s * i.pressure1_pa;
  }
  outputs.hydraulic_power1_w = hydraulicPower;
  outputs.efficiency_pct = i.power1_w > 0 ? (hydraulicPower / i.power1_w) * 100 : null;

  if (outputs.efficiency_pct !== null && outputs.efficiency_pct > 100) warnings.push('Hydraulic power exceeds shaft power — the known point is inconsistent (check units of flow, head and power).');
  if (outputs.efficiency_pct !== null && outputs.efficiency_pct < 20) warnings.push('Efficiency below 20 % is very low for a centrifugal machine — check the known point.');
  if (i.diameter_law === 'trim' && diameterRatio < 0.75) warnings.push('Trim below 75 % of the full impeller: the Q ∝ D approximation is unreliable and efficiency drops several points. Consult the pump curve.');
  if (i.diameter_law === 'trim' && diameterRatio > 1) warnings.push('Diameter larger than the known impeller: trimming laws only apply to reducing a diameter within the same casing.');
  if (speedRatio > 1.25 || speedRatio < 0.5) warnings.push('Large speed change: efficiency is not constant far from the design point, and NPSH required rises with the square of speed.');
  if (i.machine === 'fan' && outputs.pressure2_pa > 10000) warnings.push('Pressure rise above 10 kPa: gas compressibility starts to matter and the simple fan laws lose accuracy.');

  return { outputs, warnings };
}
