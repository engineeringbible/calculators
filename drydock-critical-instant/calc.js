/**
 * drydock-critical-instant/calc.js — a ship trimmed by the stern settling on the keel blocks of a dry dock: the
 * upthrust P at the after end of the keel as the trim is taken off, the virtual loss of metacentric height at the
 * critical instant (keel touching the blocks over its whole length) by both textbook methods, the draft at that
 * instant, and the largest trim that keeps a required GM.
 *
 * P = MCTC × t / l   (t = trim in cm, l = distance from the point of contact to the LCF, m)
 * Loss of GM:  method 1 (loss of buoyancy):  P · KM / W;   method 2 (rise of G):  P · KG / (W − P)
 * Draft at the critical instant (even keel) = draft at the LCF − P / TPC;   largest trim: P_max = W (GM − GM_req) / KM
 * Schema units: tonnes, metres, centimetres of trim, t·m/cm, t/cm.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';

export const schema = {
  id: 'drydock-critical-instant',
  name: 'Dry-docking critical instant',
  category: 'maritime',
  summary: 'Upthrust on the keel blocks and the virtual loss of GM at the critical instant of dry-docking, the draft then, and the largest safe trim.',
  related: ['initial-stability', 'hydrostatics', 'bilged-compartment', 'draft-survey'],
  assumptions: [
    'The ship enters the dock trimmed by the stern; as the water falls the after end of the keel lands on the blocks first and the upthrust P there grows until the keel touches along its whole length (the critical instant). Up to that moment the ship trims about its LCF and the trim removed equals P·l/MCTC, so P = MCTC × trim (cm) / l with l the distance from the point of contact to the LCF.',
    'The upthrust acts at the keel and reduces stability exactly like a weight removed from the keel: method 1 treats it as lost buoyancy at the keel with W unchanged (loss = P·KM/W), method 2 as a weight removed at the keel with KM taken at the reduced displacement (loss = P·KG/(W − P), the KM at the critical-instant draft can be entered); both are standard and differ slightly — the smaller GM governs.',
    'The free-surface correction of slack tanks is included in the initial GM (FSM/W in method 1, FSM/(W − P) in method 2); hydrostatic values (MCTC, TPC, LCF, KM) are those at the draft before docking and are taken as constant during the small change of draft.',
    'Side blocks and shores take load only after the critical instant; until then the ship must have positive GM on its own. The required GM at the critical instant is set by the dock master and the docking plan.',
  ],
  notes: [
    'Verification 2026-10-31: W = 6000 t trimmed 30 cm by the stern with MCTC 90 t·m/cm and the LCF 45 m from the point of contact gives P = 90 × 30 / 45 = 60 t; with KM 7.5 m and KG 6.0 m the loss of GM is 60 × 7.5 / 6000 = 0.075 m by method 1 and 60 × 6.0 / 5940 = 0.0606 m by method 2.',
  ],
  sources: [
    'C. B. Barrass, D. R. Derrett, Ship Stability for Masters and Mates, 7th ed., Butterworth-Heinemann 2012 — chapter "Drydocking and grounding" (upthrust, critical instant, both methods)',
    'Rawson & Tupper, Basic Ship Theory, 5th ed., ch. 4 (stability during docking)',
    'US Navy Naval Ships\' Technical Manual (NSTM) chapter 997 Docking instructions — docking stability',
  ],
  inputs: [
    { id: 'displacement_t', label: 'Displacement W before docking', group: 'mass', unit: 't', default: 6000, min: 1, max: 600000 },
    { id: 'draft_fwd_m', label: 'Draft forward', group: 'length', unit: 'm', default: 4.15, min: 0, max: 30 },
    { id: 'draft_aft_m', label: 'Draft aft', group: 'length', unit: 'm', default: 4.45, min: 0, max: 30 },
    { id: 'lbp_m', label: 'Length between perpendiculars', group: 'length', unit: 'm', default: 120, min: 5, max: 500 },
    { id: 'lcf_from_ap_m', label: 'LCF forward of the aft perpendicular', group: 'length', unit: 'm', default: 45, min: 0, max: 500 },
    { id: 'contact_from_ap_m', label: 'First point of contact with the blocks, forward of the AP (− aft)', group: 'length', unit: 'm', default: 0, min: -50, max: 200 },
    { id: 'mctc_t_m_cm', label: 'Moment to change trim 1 cm (MCTC)', group: 'mctc', unit: 't_m_cm', default: 90, min: 0.1, max: 10000 },
    { id: 'tpc_t_cm', label: 'Tonnes per centimetre immersion (TPC)', group: 'tpc', unit: 't_cm', default: 15, min: 0.1, max: 500 },
    { id: 'km_m', label: 'KM before docking', group: 'length', unit: 'm', default: 7.5, min: 0.1, max: 60 },
    { id: 'km_ci_m', label: 'KM at the critical-instant draft (0 = same as before)', group: 'length', unit: 'm', default: 0, min: 0, max: 60 },
    { id: 'kg_m', label: 'KG', group: 'length', unit: 'm', default: 6.0, min: 0, max: 60 },
    { id: 'fsm_t_m', label: 'Free-surface moment of slack tanks', group: 'mass_moment', unit: 't_m', default: 0, min: 0, max: 1e6 },
    { id: 'required_gm_m', label: 'Required GM at the critical instant', group: 'length', unit: 'm', default: 0.15, min: 0, max: 5 },
  ],
  outputs: [
    { id: 'trim_cm', label: 'Trim by the stern', group: 'length', unit: 'cm' },
    { id: 'lever_m', label: 'Lever l: point of contact to the LCF', group: 'length', unit: 'm' },
    { id: 'upthrust_t', label: 'Upthrust P at the critical instant', group: 'mass', unit: 't' },
    { id: 'gm_initial_m', label: 'GM before docking (fluid)', group: 'length', unit: 'm' },
    { id: 'loss_method1_m', label: 'Loss of GM, method 1: P·KM/W', group: 'length', unit: 'm' },
    { id: 'gm_method1_m', label: 'GM at the critical instant, method 1', group: 'length', unit: 'm' },
    { id: 'loss_method2_m', label: 'Loss of GM, method 2: P·KG/(W − P)', group: 'length', unit: 'm' },
    { id: 'gm_method2_m', label: 'GM at the critical instant, method 2', group: 'length', unit: 'm' },
    { id: 'draft_ci_m', label: 'Even-keel draft at the critical instant', group: 'length', unit: 'm' },
    { id: 'max_trim_cm', label: 'Largest trim by the stern for the required GM', group: 'length', unit: 'cm' },
    { id: 'status', label: 'Assessment', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      trim_cm: '30 cm',
      upthrust_t: '60 t',
      gm_initial_m: '1.50 m',
      loss_method1_m: '0.075 m',
      gm_method1_m: '1.425 m',
      loss_method2_m: '0.061 m',
      gm_method2_m: '1.439 m',
      draft_ci_m: '4.30 m',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.displacement_t, 'displacement_t', 'Displacement');
  assertNonNegative(i.draft_fwd_m, 'draft_fwd_m', 'Draft forward');
  assertNonNegative(i.draft_aft_m, 'draft_aft_m', 'Draft aft');
  assertPositive(i.lbp_m, 'lbp_m', 'Length between perpendiculars');
  assertRange(i.lcf_from_ap_m, 0, i.lbp_m, 'lcf_from_ap_m', 'LCF position');
  assertPositive(i.mctc_t_m_cm, 'mctc_t_m_cm', 'MCTC');
  assertPositive(i.tpc_t_cm, 'tpc_t_cm', 'TPC');
  assertPositive(i.km_m, 'km_m', 'KM');
  assertNonNegative(i.km_ci_m, 'km_ci_m', 'KM at the critical instant');
  assertNonNegative(i.kg_m, 'kg_m', 'KG');
  assertNonNegative(i.fsm_t_m, 'fsm_t_m', 'Free-surface moment');
  assertNonNegative(i.required_gm_m, 'required_gm_m', 'Required GM');

  const trimCm = (i.draft_aft_m - i.draft_fwd_m) * 100;
  if (trimCm < 0) throw new Error('The ship is trimmed by the head: it would land forward first; this calculator is for docking trimmed by the stern');
  const lever = i.lcf_from_ap_m - i.contact_from_ap_m;
  if (!(lever > 0)) throw new Error('The point of contact must be aft of the LCF');
  const upthrust = (i.mctc_t_m_cm * trimCm) / lever;
  if (upthrust >= i.displacement_t) throw new Error('The upthrust would exceed the displacement: check the trim, MCTC and lever');
  const w = i.displacement_t;
  const gm0 = i.km_m - i.kg_m - i.fsm_t_m / w;
  const loss1 = (upthrust * i.km_m) / w;
  const gm1 = gm0 - loss1;
  const kmCi = i.km_ci_m > 0 ? i.km_ci_m : i.km_m;
  const loss2 = (upthrust * i.kg_m) / (w - upthrust);
  const gm2 = kmCi - (i.kg_m + loss2) - i.fsm_t_m / (w - upthrust);
  const draftAtLcf = i.draft_aft_m + (i.draft_fwd_m - i.draft_aft_m) * (i.lcf_from_ap_m / i.lbp_m);
  const draftCi = draftAtLcf - upthrust / i.tpc_t_cm / 100;
  const pMax = (w * (gm0 - i.required_gm_m)) / i.km_m;
  const maxTrimCm = pMax > 0 ? (pMax * lever) / i.mctc_t_m_cm : 0;

  const governing = Math.min(gm1, gm2);
  let status;
  if (governing <= 0) status = `UNSAFE: GM at the critical instant is ${governing.toFixed(3)} m — the ship would lose stability before the keel lands; reduce the trim or lower G before docking.`;
  else if (governing < i.required_gm_m) status = `GM at the critical instant ${governing.toFixed(3)} m is below the required ${i.required_gm_m} m: reduce the trim below ${maxTrimCm.toFixed(0)} cm or improve the GM.`;
  else status = `GM at the critical instant ${governing.toFixed(3)} m (smaller of the two methods) meets the required ${i.required_gm_m} m; the trim may be up to ${maxTrimCm.toFixed(0)} cm.`;

  const warnings = [];
  if (i.fsm_t_m > 0) warnings.push('Slack tanks reduce GM throughout docking: press up or empty tanks where possible.');
  if (trimCm > 150) warnings.push('Trim over 1.5 m: large upthrust on the after blocks; check the block loading with the dock master.');
  warnings.push('Hydrostatics at the pre-docking draft are taken as constant; the docking plan and the dock master\'s requirements govern.');

  return {
    outputs: {
      trim_cm: trimCm,
      lever_m: lever,
      upthrust_t: upthrust,
      gm_initial_m: gm0,
      loss_method1_m: loss1,
      gm_method1_m: gm1,
      loss_method2_m: loss2,
      gm_method2_m: gm2,
      draft_ci_m: draftCi,
      max_trim_cm: maxTrimCm,
      status,
    },
    warnings,
  };
}
