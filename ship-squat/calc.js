/**
 * ship-squat/calc.js — Barrass squat in open water and confined channels, and the resulting under-keel clearance.
 *
 * Barrass general formula: S_max = C_B × S^0.81 × V^2.08 / 20 (m), with the blockage factor S = B T / (W h); in open
 * water the effective width is the "width of influence" F_B × B with F_B = 7.7 + 20 (1 − C_B)². The simplified rules
 * (open water C_B V²/100, confined C_B S^(2/3) V^2.08 / 20) are shown for comparison.
 * Schema units: m, knots (speed through water), %.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const KNOT_IN_M_S = 1852 / 3600;
const BARRASS_EXPONENT_BLOCKAGE = 0.81;
const BARRASS_EXPONENT_SPEED = 2.08;
const BARRASS_DIVISOR = 20;
const EVEN_KEEL_SQUAT_CB = 0.7;

export const schema = {
  id: 'ship-squat',
  name: 'Ship squat and under-keel clearance',
  category: 'maritime',
  summary: 'Barrass squat in open water and confined channels, Froude depth number, net under-keel clearance against a required margin and the maximum safe speed.',
  related: ['hydrostatics', 'draft-survey', 'tidal-height', 'beaufort-sea-state'],
  notes: [
    'Verification 2026-10-30: the general Barrass formula and the C_B V²/100 rule differ by 8 % at h/T = 1.2 (0.733 vs 0.80 m), consistent with Barrass\'s own comparisons; the maximum-speed inversion was checked by substitution (squat at V_max equals the available clearance to 10⁻⁹ m).',
    'Design decision: both the general formula and the simplified rule are shown so masters can see the spread between the two methods they are usually taught.',
    'Design decision: the required clearance is a percentage of draft set by the user (policy), and the calculator never silently chooses a margin.',
  ],
  assumptions: [
    "Squat follows Barrass's empirical formula S_max = C_B S^0.81 V^2.08 / 20, derived from model and full-scale data for 1.1 ≤ h/T ≤ 1.4; outside that range (and especially for h/T > 1.5) it is an extrapolation and tends to overestimate.",
    'In open water the blockage factor uses the Barrass "width of influence" F_B = 7.7 + 20 (1 − C_B)² times the beam, so S = T / (F_B h); in a confined channel S = B T / (W h) with the channel treated as rectangular (bank slopes and midship-section coefficient ignored).',
    'Speed is speed through the water; with a following current the speed over ground is higher than the squat speed, and with a head current lower.',
    'The static draft entered is the deepest draft at rest (even keel assumed); squat is reported as the maximum sinkage, at the bow for C_B above 0.7 and at the stern below 0.7, and trim changes are not resolved separately.',
    'Froude depth number F_nh = V/√(g h) is reported because squat rises steeply above about 0.7 and the formula is not valid near the critical speed (F_nh ≈ 1).',
    'The allowances input lumps swell and wave response, heel, density/fresh-water effects, chart-datum and sounding uncertainty; the calculator does not compute wave-induced motions.',
    'The required under-keel clearance is a user policy (typically 10 % of draft in open water, more in channels per PIANC or port rules); the maximum speed output is the speed at which net UKC equals that requirement.',
    'Ship-to-ship and ship-to-bank interaction, bow and stern wave effects at very low h/T, and squat of trimmed ships are not covered.',
  ],
  sources: [
    'C.B. Barrass, Ship Squat and Interaction (Witherby, 2004) and Ship Design and Performance for Masters and Mates (2004), ch. "Ship squat"',
    'Barrass & Derrett, Ship Stability for Masters and Mates, 7th ed. (2012), ch. 43 "Ship squat in open water and in confined channels"',
    'PIANC, Approach Channels — A Guide for Design (PTC II-30, 1997) and Harbour Approach Channels Design Guidelines (Report 121, 2014): squat methods and under-keel clearance components',
    'Froude depth number definition: F_nh = V / √(g h)',
  ],
  inputs: [
    { id: 'cb', label: 'Block coefficient C_B at the current draft', group: 'dimensionless', unit: 'none', default: 0.80, min: 0.4, max: 1.0 },
    { id: 'beam_m', label: 'Breadth B', group: 'length', unit: 'm', default: 32, min: 1, max: 80 },
    { id: 'draft_m', label: 'Static draft T (deepest)', group: 'length', unit: 'm', default: 10, min: 0.1, max: 30 },
    { id: 'depth_m', label: 'Water depth h (charted depth + height of tide)', group: 'length', unit: 'm', default: 12, min: 0.1, max: 100 },
    { id: 'speed_kn', label: 'Speed through the water', group: 'speed', unit: 'kn', default: 10, min: 0, max: 30 },
    {
      id: 'waterway',
      label: 'Waterway',
      type: 'select',
      default: 'open',
      options: [
        { value: 'open', label: 'Open water (width ≥ Barrass width of influence)' },
        { value: 'confined', label: 'Confined channel or canal (width given)' },
      ],
    },
    { id: 'channel_width_m', label: 'Channel width W at the bed', group: 'length', unit: 'm', default: 150, min: 1, max: 5000, visibleWhen: { waterway: 'confined' } },
    { id: 'allowances_m', label: 'Other allowances (swell, heel, density, datum uncertainty)', group: 'length', unit: 'm', default: 0.5, min: 0, max: 10 },
    { id: 'required_ukc_pct', label: 'Required net under-keel clearance', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 100, help: 'Percentage of the static draft. Common policy: 10 % open water, 15 % channels, 20–30 % exposed approaches.' },
  ],
  outputs: [
    { id: 'depth_draft_ratio', label: 'Depth-to-draft ratio h / T', group: 'dimensionless', unit: 'none' },
    { id: 'effective_width_m', label: 'Effective width (channel width, or Barrass width of influence)', group: 'length', unit: 'm' },
    { id: 'blockage_factor', label: 'Blockage factor S = B T / (W h)', group: 'dimensionless', unit: 'none' },
    { id: 'squat_m', label: 'Maximum squat (Barrass general formula)', group: 'length', unit: 'm' },
    { id: 'squat_simple_m', label: 'Squat by the simplified Barrass rule (comparison)', group: 'length', unit: 'm' },
    { id: 'squat_location', label: 'Where the maximum squat occurs', type: 'text' },
    { id: 'froude_depth', label: 'Froude depth number V / √(g h)', group: 'dimensionless', unit: 'none' },
    { id: 'static_ukc_m', label: 'Static under-keel clearance h − T', group: 'length', unit: 'm' },
    { id: 'net_ukc_m', label: 'Net under-keel clearance h − T − squat − allowances', group: 'length', unit: 'm' },
    { id: 'required_ukc_m', label: 'Required net under-keel clearance', group: 'length', unit: 'm' },
    { id: 'ukc_margin_m', label: 'Margin over the requirement (negative = short)', group: 'length', unit: 'm' },
    { id: 'ukc_status', label: 'Under-keel clearance check', type: 'text' },
    { id: 'max_speed_kn', label: 'Maximum speed through water that keeps the required clearance', group: 'speed', unit: 'kn' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      depth_draft_ratio: '1.20',
      effective_width_m: '272 m',
      blockage_factor: '0.098',
      squat_m: '0.73 m',
      squat_simple_m: '0.80 m',
      froude_depth: '0.47',
      static_ukc_m: '2.00 m',
      net_ukc_m: '0.77 m',
      required_ukc_m: '1.00 m',
      max_speed_kn: '8.3',
    },
  },
};

/** Barrass width of influence as a multiple of the beam. */
export function widthOfInfluenceFactor(cb) {
  return 7.7 + 20 * (1 - cb) ** 2;
}

/** Barrass general squat formula, metres. */
export function barrassSquatM(cb, blockage, speedKn) {
  return (cb * blockage ** BARRASS_EXPONENT_BLOCKAGE * speedKn ** BARRASS_EXPONENT_SPEED) / BARRASS_DIVISOR;
}

/** Simplified Barrass rules: open water C_B V²/100; confined C_B S^(2/3) V^2.08/20. */
export function simpleSquatM(cb, blockage, speedKn, waterway) {
  if (waterway === 'open') return (cb * speedKn * speedKn) / 100;
  return (cb * blockage ** (2 / 3) * speedKn ** BARRASS_EXPONENT_SPEED) / BARRASS_DIVISOR;
}

/** Speed (kn) at which the Barrass squat equals `availableM`; 0 when nothing is available. */
export function speedForSquatKn(cb, blockage, availableM) {
  if (availableM <= 0) return 0;
  return ((BARRASS_DIVISOR * availableM) / (cb * blockage ** BARRASS_EXPONENT_BLOCKAGE)) ** (1 / BARRASS_EXPONENT_SPEED);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.cb, 0.3, 1.0, 'cb', 'Block coefficient');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.draft_m, 'draft_m', 'Draft');
  assertPositive(i.depth_m, 'depth_m', 'Water depth');
  assertNonNegative(i.speed_kn, 'speed_kn', 'Speed');
  assertOneOf(i.waterway, ['open', 'confined'], 'waterway', 'Waterway');
  assertNonNegative(i.allowances_m, 'allowances_m', 'Allowances');
  assertNonNegative(i.required_ukc_pct, 'required_ukc_pct', 'Required clearance');
  if (i.depth_m <= i.draft_m) throw new Error(`Water depth (${i.depth_m} m) must exceed the static draft (${i.draft_m} m) — the ship would be aground`);

  const effectiveWidth = i.waterway === 'open' ? widthOfInfluenceFactor(i.cb) * i.beam_m : assertPositive(i.channel_width_m, 'channel_width_m', 'Channel width');
  const blockage = (i.beam_m * i.draft_m) / (effectiveWidth * i.depth_m);
  const squat = barrassSquatM(i.cb, blockage, i.speed_kn);
  const simple = simpleSquatM(i.cb, blockage, i.speed_kn, i.waterway);
  const froudeDepth = (i.speed_kn * KNOT_IN_M_S) / Math.sqrt(GRAVITY_M_S2 * i.depth_m);
  const staticUkc = i.depth_m - i.draft_m;
  const netUkc = staticUkc - squat - i.allowances_m;
  const requiredUkc = (i.required_ukc_pct / 100) * i.draft_m;
  const margin = netUkc - requiredUkc;
  const maxSpeed = speedForSquatKn(i.cb, blockage, staticUkc - i.allowances_m - requiredUkc);
  const depthDraftRatio = i.depth_m / i.draft_m;

  let location;
  if (Math.abs(i.cb - EVEN_KEEL_SQUAT_CB) < 0.005) location = 'Even-keel sinkage (C_B ≈ 0.70)';
  else location = i.cb > EVEN_KEEL_SQUAT_CB ? 'At the bow (C_B > 0.70: full-form ship trims by the head)' : 'At the stern (C_B < 0.70: fine-form ship trims by the stern)';

  const warnings = [];
  if (depthDraftRatio < 1.1 || depthDraftRatio > 1.4) warnings.push(`h/T = ${depthDraftRatio.toFixed(2)} is outside the 1.1–1.4 range the Barrass formulas were derived for; treat the squat as indicative (over-estimated for deep water).`);
  if (froudeDepth > 0.7) warnings.push('Froude depth number above 0.7: squat grows faster than the formula predicts as the critical speed is approached. Reduce speed.');
  if (i.waterway === 'confined' && blockage > 0.3) warnings.push('Blockage factor above 0.3: very restricted channel; the formula is at the edge of its data and bank effects become significant.');
  if (i.waterway === 'confined' && effectiveWidth < widthOfInfluenceFactor(i.cb) * i.beam_m === false) warnings.push('The channel is wider than the Barrass width of influence — the open-water setting gives the same or a larger squat.');
  if (margin < 0) warnings.push(`Net under-keel clearance is ${Math.abs(margin).toFixed(2)} m short of the requirement at this speed; the maximum speed for the required clearance is ${maxSpeed.toFixed(1)} kn.`);
  if (i.allowances_m === 0) warnings.push('No allowance for swell, heel or sounding uncertainty: the net clearance is the best case.');

  return {
    outputs: {
      depth_draft_ratio: depthDraftRatio,
      effective_width_m: effectiveWidth,
      blockage_factor: blockage,
      squat_m: squat,
      squat_simple_m: simple,
      squat_location: location,
      froude_depth: froudeDepth,
      static_ukc_m: staticUkc,
      net_ukc_m: netUkc,
      required_ukc_m: requiredUkc,
      ukc_margin_m: margin,
      ukc_status: margin >= 0 ? `OK — net clearance ${netUkc.toFixed(2)} m ≥ required ${requiredUkc.toFixed(2)} m` : `Insufficient — net clearance ${netUkc.toFixed(2)} m < required ${requiredUkc.toFixed(2)} m`,
      max_speed_kn: maxSpeed,
    },
    warnings,
  };
}
