/**
 * trim-change/calc.js — change of trim and new end drafts when a weight is shifted, loaded or discharged, from MCTC,
 * TPC and the position of the centre of flotation (LCF); bodily sinkage from TPC; and the positions at which a weight
 * can be loaded without changing the aft or forward draft.
 *
 * Sinkage s = w / TPC (cm);  change of trim t = w × d / MCTC (cm), d = lever about the LCF;
 * change aft = t × LCF / L, change forward = t × (L − LCF) / L (LCF from the aft perpendicular).
 * Constant aft draft: load at MCTC × L / (TPC × LCF) forward of the LCF.
 * Sign conventions: positions from the AP, + forward; trim + by the stern. Schema units: m, t, t/cm, t·m/cm.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'trim-change',
  name: 'Change of trim and new drafts calculator',
  category: 'maritime',
  summary: 'New forward and aft drafts after shifting, loading or discharging a weight, from MCTC, TPC and LCF: bodily sinkage, change of trim and draft changes.',
  related: ['hydrostatics', 'draft-survey', 'loading-condition', 'initial-stability'],
  assumptions: [
    'The weight is small compared with the displacement (up to about 10 %), so TPC, MCTC and the LCF read at the initial mean draught stay valid. For larger weights take them at the mean of the initial and final draughts, or use a full loading calculation.',
    'Positions are measured from the aft perpendicular, positive forward, and trim is positive by the stern, as in the hydrostatics calculator. LCF given from midships must be converted: LCF from AP = L/2 + LCF forward of midships.',
    'A loaded weight first sinks the ship bodily by w / TPC at the LCF, then trims it about the LCF by w × lever / MCTC. A shifted weight only trims the ship.',
    'Drafts are at the perpendiculars. Draught marks away from the perpendiculars need the usual correction for their position, as in a draft survey.',
    'Only the longitudinal effect is calculated; a weight off the centreline also lists the ship, and a weight moved vertically changes GM (see the initial stability calculator).',
  ],
  notes: [
    'Verification 2026-11-08: L = 150 m, drafts F 7.20 m and A 8.00 m, LCF 72 m from AP, TPC 25 t/cm, MCTC 180 t·m/cm; loading 300 t at 110 m from AP sinks 12.0 cm, trims 63.3 cm by the head and gives A 7.816 m and F 7.649 m; a weight loaded 87 m from AP leaves the aft draft unchanged. Checked by hand.',
    'Verification 2026-11-08: shifting 120 t forward 45 m on a 126 m ship with MCTC 240 t·m/cm and LCF 60 m from AP trims 22.5 cm by the head: aft −10.7 cm, forward +11.8 cm. Checked by hand (method of Derrett & Barrass, ch. 15).',
  ],
  sources: [
    'Derrett, D.R. and Barrass, C.B., Ship Stability for Masters and Mates, 7th ed. (Butterworth-Heinemann, 2012), ch. 9 (TPC), ch. 15 (trim: change of trim and the effect of loading, discharging and shifting weights)',
    'Lewis, E.V. (ed.), Principles of Naval Architecture, 2nd rev. (SNAME, 1988), Vol. I: hydrostatics, moment to change trim and the centre of flotation',
  ],
  inputs: [
    { id: 'lbp_m', label: 'Length between perpendiculars L', group: 'length', unit: 'm', default: 150, min: 1, max: 500 },
    { id: 'draft_fwd_m', label: 'Draft forward before', group: 'length', unit: 'm', default: 7.2, min: 0, max: 40 },
    { id: 'draft_aft_m', label: 'Draft aft before', group: 'length', unit: 'm', default: 8.0, min: 0, max: 40 },
    { id: 'lcf_m', label: 'LCF from AP (+ forward)', group: 'length', unit: 'm', default: 72, min: 0, max: 500 },
    { id: 'tpc', label: 'TPC at the mean draught', group: 'tpc', unit: 't_cm', default: 25, min: 0.001, max: 300 },
    { id: 'mctc', label: 'MCTC at the mean draught', group: 'mctc', unit: 't_m_cm', default: 180, min: 0.001, max: 10000 },
    {
      id: 'operation', label: 'Operation', type: 'select', default: 'load',
      options: [
        { value: 'load', label: 'Load a weight' },
        { value: 'discharge', label: 'Discharge a weight' },
        { value: 'shift', label: 'Shift a weight already on board' },
      ],
    },
    { id: 'weight_t', label: 'Weight', group: 'mass', unit: 't', default: 300, min: 0, max: 500000 },
    { id: 'position_m', label: 'Position of the weight\'s centre from AP (+ forward)', group: 'length', unit: 'm', default: 110, min: -50, max: 550, visibleWhen: { operation: ['load', 'discharge'] } },
    { id: 'shift_m', label: 'Distance shifted (+ forward, − aft)', group: 'length', unit: 'm', default: 20, min: -500, max: 500, visibleWhen: { operation: 'shift' } },
  ],
  outputs: [
    { id: 'sinkage_cm', label: 'Bodily sinkage w / TPC (+ deeper)', group: 'length', unit: 'cm', decimals: 1 },
    { id: 'moment_t_m', label: 'Trimming moment about the LCF (+ by the stern)', group: 'mass_moment', unit: 't_m' },
    { id: 'trim_change_cm', label: 'Change of trim (+ by the stern, − by the head)', group: 'length', unit: 'cm', decimals: 1 },
    { id: 'change_aft_cm', label: 'Change of draft aft (incl. sinkage)', group: 'length', unit: 'cm', decimals: 1 },
    { id: 'change_fwd_cm', label: 'Change of draft forward (incl. sinkage)', group: 'length', unit: 'cm', decimals: 1 },
    { id: 'new_aft_m', label: 'New draft aft', group: 'length', unit: 'm', decimals: 3 },
    { id: 'new_fwd_m', label: 'New draft forward', group: 'length', unit: 'm', decimals: 3 },
    { id: 'new_trim_cm', label: 'New trim (+ by the stern)', group: 'length', unit: 'cm', decimals: 1 },
    { id: 'new_mean_m', label: 'New mean of the end drafts', group: 'length', unit: 'm', decimals: 3 },
    { id: 'trim_text', label: 'New trim', type: 'text' },
    { id: 'keep_aft_m', label: 'Loading position for no change of the aft draft (from AP)', group: 'length', unit: 'm', decimals: 2 },
    { id: 'keep_fwd_m', label: 'Loading position for no change of the forward draft (from AP)', group: 'length', unit: 'm', decimals: 2 },
  ],
  example: {
    inputs: { lbp_m: [150, 'm'], draft_fwd_m: [7.2, 'm'], draft_aft_m: [8.0, 'm'], lcf_m: [72, 'm'], tpc: [25, 't_cm'], mctc: [180, 't_m_cm'], operation: 'load', weight_t: [300, 't'], position_m: [110, 'm'] },
    results: { sinkage_cm: '12.0 cm', trim_change_cm: '−63.3 cm', new_aft_m: '7.816 m', new_fwd_m: '7.649 m', keep_aft_m: '87.00 m' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.operation, ['load', 'discharge', 'shift'], 'operation', 'Operation');
  const L = assertPositive(x.lbp_m, 'lbp_m', 'Length between perpendiculars');
  const df = assertNonNegative(x.draft_fwd_m, 'draft_fwd_m', 'Draft forward');
  const da = assertNonNegative(x.draft_aft_m, 'draft_aft_m', 'Draft aft');
  const lcf = assertRange(x.lcf_m, 0, L, 'lcf_m', 'LCF from AP');
  if (lcf === 0 || lcf === L) throw new Error('LCF from AP: the centre of flotation must lie between the perpendiculars.');
  const tpc = assertPositive(x.tpc, 'tpc', 'TPC');
  const mctc = assertPositive(x.mctc, 'mctc', 'MCTC');
  const w = assertNonNegative(x.weight_t, 'weight_t', 'Weight');
  let sinkage = 0;
  let moment;
  if (x.operation === 'shift') {
    const s = assertRange(x.shift_m, -500, 500, 'shift_m', 'Distance shifted');
    moment = -w * s;
  } else {
    const pos = assertRange(x.position_m, -50, 550, 'position_m', 'Position of the weight');
    const sign = x.operation === 'load' ? 1 : -1;
    sinkage = (sign * w) / tpc;
    moment = -sign * w * (pos - lcf);
  }
  const t = moment / mctc; // cm, + by the stern
  const changeAft = sinkage + (t * lcf) / L;
  const changeFwd = sinkage - (t * (L - lcf)) / L;
  const newAft = da + changeAft / 100;
  const newFwd = df + changeFwd / 100;
  const newTrim = (newAft - newFwd) * 100;
  const warnings = [];
  const meanBefore = (da + df) / 2;
  const dispEstimate = tpc * 100 * meanBefore; // rough upper bound on displacement (box ship), t
  if (w > 0.1 * dispEstimate && dispEstimate > 0) warnings.push('The weight is large compared with the ship: TPC, MCTC and LCF change with draught, so take them at the mean of the initial and final draughts or use a full loading calculation.');
  if (newAft < 0 || newFwd < 0) warnings.push('A new end draft is negative: the operation is not possible as entered (check the units and the sign of the position).');
  if (Math.abs(newTrim) > L) warnings.push('The trim exceeds 1 % of the length: the small-trim formulas lose accuracy. Recheck with the hydrostatic tables at the new draught.');
  const describe = Math.abs(newTrim) < 0.05 ? 'Even keel' : `${Math.abs(newTrim).toFixed(1)} cm by the ${newTrim > 0 ? 'stern' : 'head'}`;
  return {
    outputs: {
      sinkage_cm: sinkage,
      moment_t_m: moment,
      trim_change_cm: t,
      change_aft_cm: changeAft,
      change_fwd_cm: changeFwd,
      new_aft_m: newAft,
      new_fwd_m: newFwd,
      new_trim_cm: newTrim,
      new_mean_m: (newAft + newFwd) / 2,
      trim_text: describe,
      keep_aft_m: lcf + (mctc * L) / (tpc * lcf),
      keep_fwd_m: lcf - (mctc * L) / (tpc * (L - lcf)),
    },
    warnings,
  };
}
