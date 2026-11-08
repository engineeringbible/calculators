/**
 * prop-pitch-speed/calc.js — boat speed from propeller pitch, engine rpm, gear ratio and slip; the pitch needed for a
 * target speed; and the slip from a measured speed.
 *
 * n_prop = n_engine / gear ratio;  V_theory = P × n_prop × 60 / 1852 kn (P in m)  = P[in] × n_prop / 1215.2 kn;
 * V = V_theory (1 − s);  P_required = V / ((1 − s) n_prop) ;  s = 1 − V_measured / V_theory.
 * Schema units: m, rpm, kn, fraction.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const M_PER_NMI = 1852;

/** Theoretical (zero-slip) speed in knots for a pitch in metres and a propeller speed in rpm. */
export function theoreticalSpeedKn(pitchM, propRpm) {
  return (pitchM * propRpm * 60) / M_PER_NMI;
}

export const schema = {
  id: 'prop-pitch-speed',
  name: 'Propeller pitch and boat speed calculator',
  category: 'maritime',
  summary: 'Boat speed from propeller pitch, engine rpm, gear ratio and slip; the pitch for a target speed; or the propeller slip from your GPS speed.',
  related: ['propeller-slip', 'planing-speed', 'hull-speed', 'boat-fuel'],
  assumptions: [
    'Pitch is the nominal pitch stamped on the propeller (the second number of 14 × 19 is 19 in of pitch). Cupped and progressive-pitch propellers behave as if their pitch were somewhat larger.',
    'The gear ratio is engine turns per propeller turn (2.0:1 means the propeller turns at half the engine rpm). Use the lower-unit or gearbox ratio from the engine manual.',
    'Slip here is apparent slip: the shortfall of the measured speed against pitch × propeller rpm. It mixes propeller slip with wake, current and the error of the speed reading, so measure with GPS on runs both ways in calm water.',
    'The required pitch keeps the engine at the chosen rpm only if the propeller can absorb the engine power there; a larger pitch loads the engine and pulls the rpm down. Aim for the top of the rated rpm range at wide-open throttle.',
  ],
  notes: [
    'Verification 2026-11-08: 19 in pitch, 5 500 engine rpm through 2.0:1 gives 2 750 propeller rpm and 43.0 kn theoretical; at 12 % slip 37.8 kn; 37 kn on GPS means 13.9 % slip. Checked by hand (V = pitch[in] × rpm / 1 215.2).',
  ],
  sources: [
    'D. Gerr, The Propeller Handbook (International Marine, 1989): pitch, apparent slip and the theoretical speed pitch × rpm',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018): apparent and real slip ratio',
  ],
  inputs: [
    {
      id: 'mode', label: 'What do you want to find?', type: 'select', default: 'speed',
      options: [
        { value: 'speed', label: 'Boat speed from pitch, rpm and slip' },
        { value: 'pitch', label: 'Pitch for a target speed' },
        { value: 'slip', label: 'Slip from a measured speed' },
      ],
    },
    { id: 'pitch_m', label: 'Propeller pitch', group: 'length', unit: 'm', display: 'in', default: 0.4826, min: 0.02, max: 10, visibleWhen: { mode: ['speed', 'slip'] } },
    { id: 'engine_rpm', label: 'Engine speed', group: 'rotational_speed', unit: 'rpm', default: 5500, min: 50, max: 15000 },
    { id: 'gear_ratio', label: 'Gear ratio (engine turns per propeller turn, 1 for direct drive)', group: 'dimensionless', unit: 'none', default: 2, min: 0.5, max: 10 },
    { id: 'slip_frac', label: 'Apparent slip', group: 'ratio', unit: 'frac', display: 'pct', default: 0.12, min: 0, max: 0.8, visibleWhen: { mode: ['speed', 'pitch'] } },
    { id: 'target_kn', label: 'Target boat speed', group: 'speed', unit: 'kn', default: 40, min: 0.1, max: 150, visibleWhen: { mode: 'pitch' } },
    { id: 'measured_kn', label: 'Measured boat speed (GPS, average of runs both ways)', group: 'speed', unit: 'kn', default: 37, min: 0, max: 150, visibleWhen: { mode: 'slip' } },
  ],
  outputs: [
    { id: 'prop_rpm', label: 'Propeller speed', group: 'rotational_speed', unit: 'rpm' },
    { id: 'theory_kn', label: 'Theoretical speed (no slip)', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'speed_kn', label: 'Boat speed', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'pitch_req_m', label: 'Pitch needed for the target speed', group: 'length', unit: 'm', display: 'in', decimals: 1, visibleWhen: { mode: 'pitch' } },
    { id: 'slip_out', label: 'Apparent slip', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'advance_m', label: 'Advance per propeller turn', group: 'length', unit: 'm', display: 'in', decimals: 1 },
  ],
  example: {
    inputs: { mode: 'speed', pitch_m: [19, 'in'], engine_rpm: [5500, 'rpm'], gear_ratio: 2, slip_frac: [12, 'pct'] },
    results: { prop_rpm: '2 750 rpm', theory_kn: '43.0 kn', speed_kn: '37.8 kn' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['speed', 'pitch', 'slip'], 'mode', 'What do you want to find');
  const rpm = assertPositive(x.engine_rpm, 'engine_rpm', 'Engine speed');
  const ratio = assertRange(x.gear_ratio, 0.5, 10, 'gear_ratio', 'Gear ratio');
  const n = rpm / ratio;
  const warnings = [];
  let pitch;
  let slip;
  let speed;
  if (x.mode === 'pitch') {
    slip = assertRange(x.slip_frac, 0, 0.8, 'slip_frac', 'Apparent slip');
    speed = assertPositive(x.target_kn, 'target_kn', 'Target boat speed');
    pitch = (speed * M_PER_NMI) / (60 * n * (1 - slip));
  } else {
    pitch = assertPositive(x.pitch_m, 'pitch_m', 'Propeller pitch');
    if (x.mode === 'speed') {
      slip = assertRange(x.slip_frac, 0, 0.8, 'slip_frac', 'Apparent slip');
      speed = theoreticalSpeedKn(pitch, n) * (1 - slip);
    } else {
      speed = assertNonNegative(x.measured_kn, 'measured_kn', 'Measured boat speed');
      slip = 1 - speed / theoreticalSpeedKn(pitch, n);
      if (slip < 0) warnings.push('Negative slip: the boat is faster than pitch × rpm allows. Check the gear ratio, the pitch, the rpm reading and any following current.');
      if (slip > 0.5) warnings.push('Slip above 50 %: check the gear ratio and the rpm, or look for a damaged or ventilating propeller.');
    }
  }
  return {
    outputs: {
      prop_rpm: n,
      theory_kn: theoreticalSpeedKn(pitch, n),
      speed_kn: speed,
      pitch_req_m: x.mode === 'pitch' ? pitch : null,
      slip_out: slip,
      advance_m: pitch * (1 - slip),
    },
    warnings,
  };
}
