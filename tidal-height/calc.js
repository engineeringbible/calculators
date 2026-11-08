/**
 * tidal-height/calc.js — height of tide between two turning points by the rule of twelfths or the cosine curve,
 * the depth available, and the time at which a required height is reached.
 *
 * Rule of twelfths: the range is covered in sixths of the duration by 1/12, 2/12, 3/12, 3/12, 2/12, 1/12.
 * Cosine curve: h = h₁ ± R (1 − cos(π t/D)) / 2 — the harmonic the rule approximates.
 * Schema units: clock times as decimal hours (14.5 = 14:30), heights and depths in metres.
 */
import { withDefaults, assertFinite, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Cumulative fraction of the range reached at the end of each sixth of the duration (rule of twelfths). */
export const TWELFTHS_CUMULATIVE = [0, 1 / 12, 3 / 12, 6 / 12, 9 / 12, 11 / 12, 1];

export const schema = {
  id: 'tidal-height',
  name: 'Tidal height (rule of twelfths)',
  category: 'maritime',
  summary: 'Height of tide and depth at any time between high and low water by the rule of twelfths or the cosine curve, and the time a required depth becomes available.',
  related: ['ship-squat', 'great-circle-distance', 'hydrostatics', 'draft-survey'],
  assumptions: [
    'The tide is treated as a regular semidiurnal curve between two consecutive turning points: symmetric, with the rule of twelfths (1-2-3-3-2-1 twelfths per sixth of the duration) or its continuous equivalent, the cosine curve h = h₁ ± R(1 − cos πt/D)/2.',
    'Both methods are approximations for places with a near-sinusoidal tide and a duration close to 6 hours; they are not valid for ports with double high waters, long stands or strongly distorted shallow-water tides (e.g. Southampton, parts of the Channel, estuaries), where the Admiralty tidal curve for the standard port must be used.',
    'Heights are above chart datum as given in the tide tables; depth available = charted depth + height of tide. Negative predicted heights (below datum) are allowed.',
    'Times are clock times in decimal hours in a single time zone; an interval that passes midnight is handled by adding 24 h to the second time; the query time must lie between the two turning points.',
    'No meteorological corrections: barometric pressure, wind set-up and seiches can change the real height by several decimetres and are not included.',
    'The rule of twelfths and the cosine curve differ by at most about 1/24 of the range (6.5 % of the range, near the first and fifth hours); the calculator shows both so the difference is visible.',
    'The time at which a required height is reached is interpolated on the chosen curve; it is the earliest time on a rising tide or the latest time on a falling tide within the interval.',
  ],
  notes: [
    'Verification 2026-10-30: the rule-of-twelfths cumulative fractions (1/12, 3/12, 6/12, 9/12, 11/12, 1) were checked against the Admiralty Manual of Navigation / Bowditch rule; the cosine form gives exactly half the range at half the duration and the two curves agree at 0, 3 and 6 hours.',
    'Design decision: both methods are computed every time (one chosen, the other shown for comparison), and the required-height time is inverted analytically on each curve rather than searched.',
    'Design decision: clock times are decimal hours (no Date objects) so the pure function stays deterministic and testable; a midnight crossing is handled by adding 24 h.',
  ],
  sources: [
    'Admiralty Manual of Navigation, Vol. 1 (BR 45), ch. "Tides and tidal streams" — rule of twelfths and the tidal curve method',
    'Bowditch, The American Practical Navigator (2019), ch. 9 "Tides and tidal currents" (semidiurnal tide approximated by a cosine curve)',
    'UKHO Admiralty Tide Tables (NP 201–204), standard-port tidal curves and secondary-port corrections (the authoritative method)',
  ],
  inputs: [
    { id: 'time_first_h', label: 'Time of the first turning point (decimal hours, e.g. 14.5 = 14:30)', group: 'dimensionless', unit: 'none', default: 2.0, min: 0, max: 24 },
    { id: 'height_first_m', label: 'Height at the first turning point', group: 'length', unit: 'm', default: 1.0, min: -5, max: 20 },
    { id: 'time_second_h', label: 'Time of the second turning point (decimal hours)', group: 'dimensionless', unit: 'none', default: 8.3, min: 0, max: 24 },
    { id: 'height_second_m', label: 'Height at the second turning point', group: 'length', unit: 'm', default: 5.0, min: -5, max: 20 },
    { id: 'time_query_h', label: 'Time of interest (decimal hours)', group: 'dimensionless', unit: 'none', default: 4.5, min: 0, max: 24 },
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      default: 'twelfths',
      options: [
        { value: 'twelfths', label: 'Rule of twelfths (1-2-3-3-2-1)' },
        { value: 'cosine', label: 'Cosine (harmonic) curve' },
      ],
    },
    { id: 'charted_depth_m', label: 'Charted depth at the spot', group: 'length', unit: 'm', default: 8.0, min: -10, max: 200 },
    { id: 'required_depth_m', label: 'Required depth (draft + clearance)', group: 'length', unit: 'm', default: 10.5, min: 0, max: 200 },
  ],
  outputs: [
    { id: 'tide_state', label: 'Tide', type: 'text' },
    { id: 'range_m', label: 'Range', group: 'length', unit: 'm' },
    { id: 'duration_h', label: 'Duration of rise or fall', group: 'time', unit: 'h' },
    { id: 'elapsed_h', label: 'Time elapsed since the first turning point', group: 'time', unit: 'h' },
    { id: 'height_m', label: 'Height of tide at the time of interest (chosen method)', group: 'length', unit: 'm' },
    { id: 'height_other_m', label: 'Height by the other method (comparison)', group: 'length', unit: 'm' },
    { id: 'rate_m_per_h', label: 'Rate of rise (+) or fall (−) at the time of interest', group: 'speed', unit: 'm_s', display: 'm_s' },
    { id: 'depth_m', label: 'Depth available = charted depth + height', group: 'length', unit: 'm' },
    { id: 'depth_margin_m', label: 'Margin over the required depth', group: 'length', unit: 'm' },
    { id: 'required_height_m', label: 'Height of tide needed for the required depth', group: 'length', unit: 'm' },
    { id: 'time_required_h', label: 'Time the required height is reached (decimal hours)', group: 'dimensionless', unit: 'none' },
    { id: 'window_text', label: 'Depth window', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      range_m: '4.0 m',
      duration_h: '6.3 h',
      elapsed_h: '2.5 h',
      height_m: '2.38 m',
      height_other_m: '2.36 m',
      depth_m: '10.38 m',
      required_height_m: '2.5 m',
    },
  },
};

/** Fraction of the range reached after fraction f (0–1) of the duration, rule of twelfths. */
export function twelfthsFraction(f) {
  const clamped = Math.min(1, Math.max(0, f));
  const sixth = Math.min(5, Math.floor(clamped * 6));
  const local = clamped * 6 - sixth;
  return TWELFTHS_CUMULATIVE[sixth] + (TWELFTHS_CUMULATIVE[sixth + 1] - TWELFTHS_CUMULATIVE[sixth]) * local;
}

/** Inverse of twelfthsFraction: fraction of the duration at which a given fraction of the range is reached. */
export function twelfthsInverse(rangeFraction) {
  const target = Math.min(1, Math.max(0, rangeFraction));
  for (let sixth = 0; sixth < 6; sixth += 1) {
    const lo = TWELFTHS_CUMULATIVE[sixth];
    const hi = TWELFTHS_CUMULATIVE[sixth + 1];
    if (target <= hi) return (sixth + (target - lo) / (hi - lo)) / 6;
  }
  return 1;
}

/** Cosine-curve fraction of the range after fraction f of the duration, and its inverse. */
export function cosineFraction(f) {
  return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, f)))) / 2;
}
export function cosineInverse(rangeFraction) {
  return Math.acos(1 - 2 * Math.min(1, Math.max(0, rangeFraction))) / Math.PI;
}

/** Format decimal clock hours as HH:MM, wrapping past 24 h. */
export function formatClock(hoursDecimal) {
  const total = Math.round(hoursDecimal * 60);
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  for (const id of ['time_first_h', 'time_second_h', 'time_query_h']) assertRange(i[id], 0, 24, id, 'Clock time');
  for (const id of ['height_first_m', 'height_second_m', 'charted_depth_m']) assertFinite(i[id], id, id);
  assertNonNegative(i.required_depth_m, 'required_depth_m', 'Required depth');
  assertOneOf(i.method, ['twelfths', 'cosine'], 'method', 'Method');

  const tSecond = i.time_second_h <= i.time_first_h ? i.time_second_h + 24 : i.time_second_h;
  const duration = tSecond - i.time_first_h;
  let tQuery = i.time_query_h < i.time_first_h ? i.time_query_h + 24 : i.time_query_h;
  if (tQuery > tSecond) throw new Error(`Time of interest ${formatClock(i.time_query_h)} is outside the interval ${formatClock(i.time_first_h)}–${formatClock(tSecond)} between the two turning points`);
  const elapsed = tQuery - i.time_first_h;
  const range = Math.abs(i.height_second_m - i.height_first_m);
  if (range === 0) throw new Error('The two turning points have the same height — the range is zero');
  const rising = i.height_second_m > i.height_first_m;
  const sign = rising ? 1 : -1;

  const f = elapsed / duration;
  const fracTwelfths = twelfthsFraction(f);
  const fracCosine = cosineFraction(f);
  const heightTwelfths = i.height_first_m + sign * range * fracTwelfths;
  const heightCosine = i.height_first_m + sign * range * fracCosine;
  const height = i.method === 'twelfths' ? heightTwelfths : heightCosine;
  const heightOther = i.method === 'twelfths' ? heightCosine : heightTwelfths;

  // Rate: cosine derivative, or the slope of the current twelfth segment.
  let rateMPerH;
  if (i.method === 'cosine') rateMPerH = (sign * range * Math.PI * Math.sin(Math.PI * Math.min(1, f))) / (2 * duration);
  else {
    const sixth = Math.min(5, Math.floor(Math.min(0.999999, f) * 6));
    rateMPerH = (sign * range * (TWELFTHS_CUMULATIVE[sixth + 1] - TWELFTHS_CUMULATIVE[sixth]) * 6) / duration;
  }

  const depth = i.charted_depth_m + height;
  const requiredHeight = i.required_depth_m - i.charted_depth_m;
  const requiredFraction = (requiredHeight - i.height_first_m) / (sign * range);
  let timeRequired = null;
  let windowText;
  const inverse = i.method === 'twelfths' ? twelfthsInverse : cosineInverse;
  if (requiredFraction < 0) {
    windowText = rising ? `Depth is sufficient throughout: ${i.required_depth_m.toFixed(2)} m is available even at the first turning point` : `Depth sufficient throughout (required height ${requiredHeight.toFixed(2)} m is below the low water of ${i.height_second_m.toFixed(2)} m)`;
    if (!rising) windowText = `Depth sufficient throughout: required height ${requiredHeight.toFixed(2)} m is below the final height ${i.height_second_m.toFixed(2)} m`;
  } else if (requiredFraction > 1) {
    windowText = `Not reached: the tide never gives ${i.required_depth_m.toFixed(2)} m in this interval (needs a height of ${requiredHeight.toFixed(2)} m, maximum ${Math.max(i.height_first_m, i.height_second_m).toFixed(2)} m)`;
  } else {
    timeRequired = i.time_first_h + inverse(requiredFraction) * duration;
    windowText = rising
      ? `Required depth available from ${formatClock(timeRequired)} (rising) until the tide falls back through ${requiredHeight.toFixed(2)} m`
      : `Required depth available until ${formatClock(timeRequired)} (falling)`;
  }

  const warnings = [];
  if (duration < 5 || duration > 7.5) warnings.push('Duration outside 5–7.5 h: not a standard semidiurnal interval; the rule of twelfths and the cosine curve assume about 6 h between turning points — use the port tidal curve.');
  if (Math.abs(heightTwelfths - heightCosine) > 0.01) warnings.push(`The two methods differ by ${(Math.abs(heightTwelfths - heightCosine) * 100).toFixed(0)} cm at this time; the real curve for the port may differ from both.`);
  warnings.push('No allowance for weather: pressure and wind can shift the actual height by several decimetres.');

  return {
    outputs: {
      tide_state: `${rising ? 'Rising' : 'Falling'}: ${formatClock(i.time_first_h)} (${i.height_first_m.toFixed(2)} m) → ${formatClock(tSecond)} (${i.height_second_m.toFixed(2)} m)`,
      range_m: range,
      duration_h: duration,
      elapsed_h: elapsed,
      height_m: height,
      height_other_m: heightOther,
      rate_m_per_h: rateMPerH / 3600,
      depth_m: depth,
      depth_margin_m: depth - i.required_depth_m,
      required_height_m: requiredHeight,
      time_required_h: timeRequired === null ? null : timeRequired % 24,
      window_text: windowText,
    },
    warnings,
  };
}
