/**
 * propeller-slip/calc.js — theoretical (engine) speed, apparent slip, speed through water and real slip.
 *
 * Schema units: pitch m, rpm, speeds in knots, slip and wake fraction as given (percent / fraction).
 */
import { withDefaults, assertPositive, assertFinite, assertRange, assertOneOf } from '../shared/validate.js';

const METRES_PER_NMI = 1852;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const schema = {
  id: 'propeller-slip',
  name: 'Propeller slip and speed through water',
  category: 'maritime',
  summary: 'Theoretical propeller speed, apparent and real slip, speed through water and speed of advance from pitch, RPM and observed speed.',
  related: ['fuel-voyage-cost', 'admiralty-coefficient', 'shaft-torque', 'great-circle-distance'],
  notes: [
    'Verification 2026-10-30: theoretical speed uses the exact nautical mile (6 m pitch × 100 rpm = 36 000 m/h = 19.4384 kn); slip definitions follow MAN "Basic Principles of Ship Propulsion".',
    'Design decision: three slips are reported (apparent vs speed over ground, through water, real vs speed of advance) because noon reports and model-test reports mean different things by "slip".',
    'Design decision: negative slip is allowed with a warning rather than rejected, since following seas and currents produce it legitimately.',
  ],
  assumptions: [
    'Pitch is the mean face pitch of a fixed-pitch propeller; for a controllable-pitch propeller use the pitch at the current setting and compare like with like.',
    'Apparent slip mixes propeller behaviour with current, wind, waves and the accuracy of the speed input; it is a trend indicator, not a measure of propeller efficiency.',
    'Speed through water is speed over ground minus a single along-track current; cross currents are ignored. A calibrated speed log reading can be entered as the observed speed with zero current.',
    'The wake fraction is an input, not a prediction (single-screw 0.20–0.35, twin-screw 0.10–0.20); with w = 0 the real slip equals the slip through water.',
    'Negative apparent slip is physically possible (following current or sea) and is reported with a warning rather than rejected.',
    'Revolutions per mile are referred to speed over ground, as kept in most engine logs.',
  ],
  sources: [
    'D.A. Taylor, Introduction to Marine Engineering, 2nd ed. (1996), propellers and slip',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018), "Slip ratio"',
    'J.S. Carlton, Marine Propellers and Propulsion, 4th ed., ch. 5 (wake and speed of advance)',
    'Bowditch, American Practical Navigator (2019), "Dead Reckoning" (speed through water)',
  ],
  inputs: [
    { id: 'pitch_m', label: 'Propeller pitch', group: 'length', unit: 'm', default: 6.0, min: 0.01, max: 15, help: 'Mean face pitch from the propeller drawing.' },
    { id: 'rpm', label: 'Propeller speed', group: 'rotational_speed', unit: 'rpm', default: 90, min: 0.1, max: 3000 },
    {
      id: 'mode',
      label: 'What do you know?',
      type: 'select',
      default: 'slip',
      options: [
        { value: 'slip', label: 'Observed speed → find slip' },
        { value: 'speed', label: 'Apparent slip → find speed' },
      ],
    },
    { id: 'sog_kn', label: 'Observed speed over ground', group: 'speed', unit: 'kn', default: 14, min: 0, max: 60, visibleWhen: { mode: 'slip' }, help: 'From GPS or distance run between fixes.' },
    { id: 'slip_pct', label: 'Apparent slip', group: 'ratio', unit: 'pct', default: 8, min: -50, max: 90, visibleWhen: { mode: 'speed' } },
    {
      id: 'current_kn',
      label: 'Current along the track',
      group: 'speed',
      unit: 'kn',
      default: 0,
      min: -10,
      max: 10,
      help: 'Positive with the ship (following), negative against (head). Speed through water = speed over ground − current.',
    },
    {
      id: 'wake_fraction',
      label: 'Taylor wake fraction w',
      group: 'ratio',
      unit: 'frac',
      default: 0,
      min: 0,
      max: 0.6,
      visibleWhen: { mode: 'slip' },
      help: 'Speed of advance Va = STW × (1 − w). Single-screw ships 0.20–0.35, twin-screw 0.10–0.20. Leave 0 if unknown; real slip then equals slip through water.',
    },
  ],
  outputs: [
    { id: 'vt_kn', label: 'Theoretical (engine) speed Vₜ = pitch × rpm', group: 'speed', unit: 'kn' },
    { id: 'engine_distance_day_nmi', label: 'Engine distance per day', group: 'length', unit: 'nmi' },
    { id: 'ship_speed_kn', label: 'Ship speed over ground from the slip', group: 'speed', unit: 'kn', visibleWhen: { mode: 'speed' } },
    { id: 'apparent_slip_pct', label: 'Apparent slip (vs speed over ground)', group: 'ratio', unit: 'pct', visibleWhen: { mode: 'slip' } },
    { id: 'stw_kn', label: 'Speed through water (STW)', group: 'speed', unit: 'kn' },
    { id: 'slip_stw_pct', label: 'Slip through water (vs STW)', group: 'ratio', unit: 'pct', visibleWhen: { mode: 'slip' } },
    { id: 'va_kn', label: 'Speed of advance Vₐ = STW × (1 − w)', group: 'speed', unit: 'kn', visibleWhen: { mode: 'slip' } },
    { id: 'real_slip_pct', label: 'Real slip (vs speed of advance)', group: 'ratio', unit: 'pct', visibleWhen: { mode: 'slip' } },
    { id: 'observed_distance_day_nmi', label: 'Observed distance per day', group: 'length', unit: 'nmi' },
    { id: 'revs_per_nmi', label: 'Propeller revolutions per nautical mile over ground', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      vt_kn: '17.49 kn',
      engine_distance_day_nmi: '419.9 nmi',
      apparent_slip_pct: '19.98 %',
      slip_stw_pct: '19.98 %',
      real_slip_pct: '19.98 %',
      observed_distance_day_nmi: '336 nmi',
      revs_per_nmi: '385.7',
    },
  },
};

/** Theoretical propeller speed in knots from pitch (m) and revolutions per minute. */
export function theoreticalSpeedKn(pitchM, rpm) {
  return (pitchM * rpm * MINUTES_PER_HOUR) / METRES_PER_NMI;
}

/** Slip as a fraction: (Vt − V) / Vt. Negative when the ship moves faster than the propeller "screws" through the water. */
export function slipFraction(theoreticalKn, actualKn) {
  return (theoreticalKn - actualKn) / theoreticalKn;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.pitch_m, 'pitch_m', 'Propeller pitch');
  assertPositive(i.rpm, 'rpm', 'Propeller speed');
  assertOneOf(i.mode, ['slip', 'speed'], 'mode', 'Mode');
  assertFinite(i.current_kn, 'current_kn', 'Current');

  const vt = theoreticalSpeedKn(i.pitch_m, i.rpm);
  const warnings = [];
  const outputs = {
    vt_kn: vt,
    engine_distance_day_nmi: vt * HOURS_PER_DAY,
  };

  let sog;
  if (i.mode === 'slip') {
    assertFinite(i.sog_kn, 'sog_kn', 'Observed speed');
    if (i.sog_kn < 0) throw new Error('Observed speed must not be negative');
    assertRange(i.wake_fraction, 0, 0.9, 'wake_fraction', 'Wake fraction');
    sog = i.sog_kn;
    const stw = sog - i.current_kn;
    const va = stw * (1 - i.wake_fraction);
    outputs.apparent_slip_pct = slipFraction(vt, sog) * 100;
    outputs.stw_kn = stw;
    outputs.slip_stw_pct = slipFraction(vt, stw) * 100;
    outputs.va_kn = va;
    outputs.real_slip_pct = slipFraction(vt, va) * 100;
    if (outputs.apparent_slip_pct < 0) warnings.push('Negative apparent slip: the ship is moving faster than pitch × rpm. Typical of a following current or sea, or a wrong pitch/rpm.');
    if (stw < 0) warnings.push('Speed through water is negative — the current exceeds the speed over ground. Check the sign of the current.');
    if (outputs.apparent_slip_pct > 40) warnings.push('Apparent slip above 40 % is unusual in service — check pitch, rpm and speed.');
  } else {
    assertRange(i.slip_pct, -100, 99.9, 'slip_pct', 'Apparent slip');
    sog = vt * (1 - i.slip_pct / 100);
    outputs.ship_speed_kn = sog;
    outputs.stw_kn = sog - i.current_kn;
  }

  outputs.observed_distance_day_nmi = sog * HOURS_PER_DAY;
  outputs.revs_per_nmi = sog > 0 ? (i.rpm * MINUTES_PER_HOUR) / sog : null;
  return { outputs, warnings };
}
