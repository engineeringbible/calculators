/**
 * air-draft/calc.js — vertical clearance of a ship passing under a bridge or an overhead cable: the charted clearance
 * converted to the actual water level by the tide, the ship's actual air draft from the height of its highest point
 * above the keel and the draft at that point (trim included), allowances for squat credit, ship motions and
 * electrical safety, the resulting margin and the highest tide at which the passage keeps the required margin.
 *
 * Clearance above the water = charted clearance + (clearance datum − chart datum) − height of tide
 * Air draft = height of the highest point above the keel − draft at its position (− squat credit, if taken)
 * Margin = clearance above the water − air draft − motion allowance − electrical safety distance
 * Schema units: metres.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'air-draft',
  name: 'Air draft and bridge clearance',
  category: 'maritime',
  summary: 'Clearance under a bridge or power cable from the charted clearance, tide, the ship\'s air draft at its actual draft and trim, and the allowances.',
  related: ['tidal-height', 'ship-squat', 'hydrostatics', 'light-range'],
  assumptions: [
    'The charted vertical clearance is measured from its own datum (HAT on recent British Admiralty charts, MHWS on older ones, MHW on US charts); the height of that datum above chart datum comes from the tide tables, and the predicted height of tide is above chart datum. Clearance above the water = charted clearance + datum above chart datum − height of tide.',
    'The ship\'s air draft is the height of its highest fixed point above the keel minus the draft at the longitudinal position of that point, interpolated linearly between the forward and aft drafts (perpendiculars); masts, antennas and cranes must be lowered or stowed as they will be during the passage.',
    'Squat lowers the ship and so increases the clearance, but it is taken as a credit only when entered explicitly; ship motions (pitch, heave, roll of a mast off the centreline) and the uncertainty of the tide are covered by one allowance; negative surges and storm surges are not predicted by the tide tables.',
    'For overhead power cables an additional electrical safety distance is kept clear of the conductor (flash-over); it depends on the line voltage and is set by the cable owner or the port, and sag increases with temperature and load so the charted figure can be optimistic in hot weather.',
    'The required margin is the clearance the master, the pilot or the port requires above the allowances; the highest permissible tide gives the window: the passage is safe while the tide is below it.',
  ],
  notes: [
    'Verification 2026-10-31: a 45 m charted clearance above HAT with HAT 5.6 m above chart datum and a 2.5 m tide leaves 48.1 m over the water; a 56 m highest point above the keel at 150 m from the aft perpendicular of a 280 m ship trimmed 11.5 m forward and 12.5 m aft sits at a draft of 11.96 m, so the air draft is 44.04 m and the gross clearance 4.06 m.',
    'Design decision: squat is not credited by default; taking it reduces the safety margin exactly when the ship is moving fastest, so the page warns whenever a credit is entered.',
  ],
  sources: [
    'IHO Publication S-4, Regulations for International (INT) Charts and Chart Specifications of the IHO, B-302 and B-380 (vertical datums for heights and clearances)',
    'UKHO NP 100 The Mariner\'s Handbook — heights, clearances and their datums on Admiralty charts',
    'UKHO Admiralty Tide Tables (NP 201) — HAT, MHWS and predicted heights above chart datum',
    'PIANC Report 121 (2014) Harbour Approach Channels — Design Guidelines, air draft allowances',
  ],
  inputs: [
    { id: 'charted_clearance_m', label: 'Charted vertical clearance of the bridge or cable', group: 'length', unit: 'm', default: 45, min: 0, max: 300 },
    { id: 'datum_above_cd_m', label: 'Clearance datum (e.g. HAT) above chart datum', group: 'length', unit: 'm', default: 5.6, min: -10, max: 20 },
    { id: 'tide_height_m', label: 'Predicted height of tide above chart datum', group: 'length', unit: 'm', default: 2.5, min: -5, max: 20 },
    { id: 'highest_point_m', label: 'Height of the ship\'s highest point above the keel', group: 'length', unit: 'm', default: 56, min: 1, max: 120 },
    { id: 'point_from_ap_m', label: 'Position of the highest point forward of the aft perpendicular', group: 'length', unit: 'm', default: 150, min: 0, max: 500 },
    { id: 'lbp_m', label: 'Length between perpendiculars', group: 'length', unit: 'm', default: 280, min: 5, max: 500 },
    { id: 'draft_fwd_m', label: 'Draft forward', group: 'length', unit: 'm', default: 11.5, min: 0, max: 30 },
    { id: 'draft_aft_m', label: 'Draft aft', group: 'length', unit: 'm', default: 12.5, min: 0, max: 30 },
    {
      id: 'squat_credit',
      label: 'Credit for squat',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'No credit (recommended)' },
        { value: 'yes', label: 'Take credit for squat' },
      ],
    },
    { id: 'squat_m', label: 'Squat at the highest point', group: 'length', unit: 'm', default: 0.5, min: 0, max: 5, visibleWhen: { squat_credit: 'yes' } },
    { id: 'motion_allowance_m', label: 'Allowance for ship motions and tide uncertainty', group: 'length', unit: 'm', default: 0.5, min: 0, max: 20 },
    { id: 'electrical_distance_m', label: 'Electrical safety distance (power cables only)', group: 'length', unit: 'm', default: 0, min: 0, max: 20 },
    { id: 'required_margin_m', label: 'Required clear margin', group: 'length', unit: 'm', default: 2, min: 0, max: 50 },
  ],
  outputs: [
    { id: 'clearance_above_water_m', label: 'Clearance above the water at this tide', group: 'length', unit: 'm' },
    { id: 'draft_at_point_m', label: 'Draft at the highest point', group: 'length', unit: 'm' },
    { id: 'air_draft_m', label: 'Ship\'s air draft', group: 'length', unit: 'm' },
    { id: 'gross_clearance_m', label: 'Clearance between the highest point and the structure', group: 'length', unit: 'm' },
    { id: 'net_margin_m', label: 'Net margin after the allowances', group: 'length', unit: 'm' },
    { id: 'margin_status', label: 'Assessment', type: 'text' },
    { id: 'max_tide_m', label: 'Highest tide above chart datum for the required margin', group: 'length', unit: 'm' },
    { id: 'max_air_draft_m', label: 'Largest air draft for the required margin at this tide', group: 'length', unit: 'm' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      clearance_above_water_m: '48.1 m',
      draft_at_point_m: '11.96 m',
      air_draft_m: '44.04 m',
      gross_clearance_m: '4.06 m',
      net_margin_m: '3.56 m',
      max_tide_m: '4.06 m',
    },
  },
};

/** Draft at a position x forward of the aft perpendicular, interpolated between the drafts at the perpendiculars. */
export function draftAt(xFromAp, lbp, draftFwd, draftAft) {
  return draftAft + (draftFwd - draftAft) * (xFromAp / lbp);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.charted_clearance_m, 'charted_clearance_m', 'Charted clearance');
  assertRange(i.datum_above_cd_m, -10, 20, 'datum_above_cd_m', 'Clearance datum above chart datum');
  assertRange(i.tide_height_m, -5, 20, 'tide_height_m', 'Height of tide');
  assertPositive(i.highest_point_m, 'highest_point_m', 'Height of the highest point');
  assertPositive(i.lbp_m, 'lbp_m', 'Length between perpendiculars');
  assertRange(i.point_from_ap_m, 0, i.lbp_m, 'point_from_ap_m', 'Position of the highest point');
  assertNonNegative(i.draft_fwd_m, 'draft_fwd_m', 'Draft forward');
  assertNonNegative(i.draft_aft_m, 'draft_aft_m', 'Draft aft');
  assertOneOf(i.squat_credit, ['no', 'yes'], 'squat_credit', 'Credit for squat');
  assertNonNegative(i.motion_allowance_m, 'motion_allowance_m', 'Motion allowance');
  assertNonNegative(i.electrical_distance_m, 'electrical_distance_m', 'Electrical safety distance');
  assertNonNegative(i.required_margin_m, 'required_margin_m', 'Required margin');

  const clearanceAboveWater = i.charted_clearance_m + i.datum_above_cd_m - i.tide_height_m;
  const draft = draftAt(i.point_from_ap_m, i.lbp_m, i.draft_fwd_m, i.draft_aft_m);
  if (draft >= i.highest_point_m) throw new Error('The draft at the highest point is not below it: check the height above the keel and the drafts');
  let squat = 0;
  if (i.squat_credit === 'yes') {
    assertNonNegative(i.squat_m, 'squat_m', 'Squat');
    squat = i.squat_m;
  }
  const airDraft = i.highest_point_m - draft - squat;
  const gross = clearanceAboveWater - airDraft;
  const deductions = i.motion_allowance_m + i.electrical_distance_m;
  const net = gross - deductions;
  const maxTide = i.charted_clearance_m + i.datum_above_cd_m - airDraft - deductions - i.required_margin_m;
  const maxAirDraft = clearanceAboveWater - deductions - i.required_margin_m;

  let status;
  if (gross <= 0) status = `DO NOT PASS: the highest point is ${(-gross).toFixed(2)} m above the underside of the structure at this tide.`;
  else if (net < 0) status = `DO NOT PASS: only ${gross.toFixed(2)} m clearance, less than the ${deductions.toFixed(2)} m of allowances.`;
  else if (net < i.required_margin_m) status = `Margin ${net.toFixed(2)} m is below the required ${i.required_margin_m} m: wait for the tide to fall below ${maxTide.toFixed(2)} m or reduce the air draft.`;
  else status = `Clear: ${net.toFixed(2)} m net margin (required ${i.required_margin_m} m); the tide may rise to ${maxTide.toFixed(2)} m above chart datum.`;

  const warnings = [];
  if (i.squat_credit === 'yes') warnings.push('Credit taken for squat: it disappears if the ship slows down or stops under the structure — confirm with the pilot.');
  if (i.electrical_distance_m === 0) warnings.push('For an overhead power cable add the electrical safety distance required by the cable owner or the port; cables sag more in hot weather.');
  if (i.tide_height_m > i.datum_above_cd_m) warnings.push('The tide is above the clearance datum: the clearance is LESS than charted.');
  warnings.push('Check the datum of the charted clearance (HAT, MHWS or MHW) on the chart in use; storm surges and river flow can raise the water above the prediction.');

  return {
    outputs: {
      clearance_above_water_m: clearanceAboveWater,
      draft_at_point_m: draft,
      air_draft_m: airDraft,
      gross_clearance_m: gross,
      net_margin_m: net,
      margin_status: status,
      max_tide_m: maxTide,
      max_air_draft_m: maxAirDraft,
    },
    warnings,
  };
}
