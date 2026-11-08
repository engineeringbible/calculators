/**
 * gear-speed/calc.js — vehicle road speed from engine rpm, transmission gear ratio, final drive ratio and tire
 * diameter; the rpm at a road speed; and the speedometer error after a change of tire diameter.
 *
 * v = rpm × π D / (60 i_g i_f);  in US units mph = rpm × D[in] / (i_g i_f × 336.13), 336.13 = 63 360 / (60 π).
 * Speedometer reading = true speed × D_cal / D_actual (the speedometer counts tire revolutions).
 * Schema units: SI — rpm, m, m/s.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const IN = 0.0254;
const MILE = 1609.344;
const MPH = 0.44704;

export const schema = {
  id: 'gear-speed',
  name: 'Gear ratio and vehicle speed calculator',
  category: 'automotive',
  summary: 'Vehicle speed from rpm, gear ratio, final drive and tire diameter, the rpm at a speed, and speedometer error after changing tire size.',
  related: ['tire-size', 'gear-ratio', 'quarter-mile', 'horsepower'],
  assumptions: [
    'Road speed is engine rpm divided by the overall ratio (gear × final drive) times the tire circumference; there is no clutch, torque-converter or tire slip.',
    'The tire diameter is the unloaded overall diameter; under load the rolling radius is a little smaller, so the true speed is a little lower than the result and tire makers list slightly more revolutions per mile.',
    'With a locked torque converter or a manual gearbox the engine and wheels are tied together; an unlocked converter slips, so the engine then turns faster than calculated.',
    'The speedometer is assumed to read correctly with the tire diameter it was calibrated for; it counts wheel or output-shaft revolutions, so it reads high with a smaller tire and low with a larger one.',
  ],
  notes: [
    'Verification 2026-11-08: 3 000 rpm, 1.00 gear, 3.73 final drive, 28 in tire: 67.0 mph (3 000 × 28 / (3.73 × 336.13)); 720.3 tire revolutions per mile; with the speedometer calibrated for a 26 in tire it reads 62.2 mph, −7.1 %. Checked by hand.',
  ],
  sources: [
    'T.D. Gillespie, Fundamentals of Vehicle Dynamics, SAE 1992, Chapter 2 Acceleration performance (road speed from engine speed, overall gear ratio and tire radius)',
    'NIST Handbook 44 and SP 811: 1 mile = 63 360 in, 1 mph = 0.44704 m/s (exact)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'speed', options: [{ value: 'speed', label: 'Speed at an engine rpm' }, { value: 'rpm', label: 'Engine rpm at a speed' }] },
    { id: 'rpm', label: 'Engine speed', group: 'rotational_speed', unit: 'rpm', default: 3000, min: 1, max: 30000, visibleWhen: { mode: 'speed' } },
    { id: 'speed_m_s', label: 'Vehicle speed', group: 'speed', unit: 'm_s', display: 'mph', default: 65 * MPH, min: 0.1, max: 200, visibleWhen: { mode: 'rpm' } },
    { id: 'gear', label: 'Transmission gear ratio (1.00 for direct drive)', group: 'dimensionless', unit: 'none', default: 1, min: 0.2, max: 20 },
    { id: 'final', label: 'Final drive (axle) ratio', group: 'dimensionless', unit: 'none', default: 3.73, min: 0.5, max: 20 },
    { id: 'tire_m', label: 'Tire overall diameter fitted', group: 'length', unit: 'm', display: 'in', default: 28 * IN, min: 0.1, max: 3 },
    { id: 'cal_tire_m', label: 'Tire diameter the speedometer is calibrated for', group: 'length', unit: 'm', display: 'in', default: 26 * IN, min: 0.1, max: 3 },
  ],
  outputs: [
    { id: 'speed_out_m_s', label: 'Vehicle speed', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'rpm_out', label: 'Engine speed', group: 'rotational_speed', unit: 'rpm', decimals: 0 },
    { id: 'overall', label: 'Overall ratio (gear × final drive)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'revs_mile', label: 'Tire revolutions per mile', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'mph_per_1000', label: 'Speed per 1 000 rpm', group: 'speed', unit: 'm_s', display: 'mph', decimals: 2 },
    { id: 'speedo_m_s', label: 'Speedometer reading at this true speed', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'speedo_error', label: 'Speedometer error (reading − true) / true', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
  ],
  example: {
    inputs: { mode: 'speed', rpm: [3000, 'rpm'], gear: 1, final: 3.73, tire_m: [28, 'in'], cal_tire_m: [26, 'in'] },
    results: { overall: '3.730', speed_out_m_s: '67.0 mph', revs_mile: '720.3', speedo_m_s: '62.2 mph', speedo_error: '−7.1 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['speed', 'rpm'], 'mode', 'Calculate');
  const gear = assertRange(x.gear, 0.2, 20, 'gear', 'Transmission gear ratio');
  const final = assertRange(x.final, 0.5, 20, 'final', 'Final drive ratio');
  const d = assertRange(x.tire_m, 0.1, 3, 'tire_m', 'Tire diameter fitted');
  const dCal = assertRange(x.cal_tire_m, 0.1, 3, 'cal_tire_m', 'Calibrated tire diameter');
  const overall = gear * final;
  const perRpm = (Math.PI * d) / (60 * overall); // m/s per rpm
  let rpm;
  let v;
  if (x.mode === 'speed') {
    rpm = assertRange(x.rpm, 1, 30000, 'rpm', 'Engine speed');
    v = rpm * perRpm;
  } else {
    v = assertRange(x.speed_m_s, 0.1, 200, 'speed_m_s', 'Vehicle speed');
    rpm = v / perRpm;
  }
  const warnings = [];
  if (rpm > 9000) warnings.push('Above 9 000 rpm: beyond the redline of most car engines; check the ratios and the speed.');
  if (Math.abs(dCal / d - 1) > 0.03) warnings.push('The tire diameter differs from the speedometer calibration by more than 3 %; the speedometer and odometer should be recalibrated.');
  return {
    outputs: {
      speed_out_m_s: v, rpm_out: rpm, overall, revs_mile: MILE / (Math.PI * d), mph_per_1000: 1000 * perRpm,
      speedo_m_s: (v * dCal) / d, speedo_error: dCal / d - 1,
    },
    warnings,
  };
}
