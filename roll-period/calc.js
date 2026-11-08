/**
 * roll-period/calc.js — natural roll period from the IS Code approximation (or GM from an observed period), the
 * wave encounter period of MSC.1/Circ.1228 and its checks for synchronous rolling, parametric rolling, surf-riding
 * and successive high-wave attack.
 *
 * T_R = 2 C B / √GM, C = 0.373 + 0.023 B/d − 0.043 L_WL/100;  T_E = 3 T_W² / (3 T_W + V cos α), V in knots;  λ = 1.56 T_W².
 * Schema units: m, s, kn, degrees.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';
import { fromBase } from '../shared/units.js';

export const schema = {
  id: 'roll-period',
  name: 'Roll period and synchronous rolling',
  category: 'maritime',
  summary: 'Natural roll period from GM and beam (IS Code) or GM from an observed period, encounter period for speed and heading, synchronous and parametric roll checks.',
  related: ['initial-stability', 'wave-properties', 'beaufort-sea-state', 'hydrostatics'],
  assumptions: [
    'The roll period uses the 2008 IS Code approximation T_R = 2 C B/√GM with C = 0.373 + 0.023 (B/d) − 0.043 (L_WL/100), which the Code offers "in the absence of sufficient information"; it represents a radius of gyration of about 0.35–0.40 B and can be 10–15 % off for ships with unusual mass distribution (containers on deck, heavy double bottom). An observed period from a rolling test is better and the GM mode inverts the same formula.',
    'GM is the metacentric height corrected for free surfaces (fluid GM); at large angles the roll period lengthens because GZ is not linear.',
    'The encounter period is the MSC.1/Circ.1228 formula T_E = 3 T_W²/(3 T_W + V cos α) with V in knots and α the angle between keel and wave direction (0° head seas, 90° beam, 180° following), valid for deep water with λ = 1.56 T_W²; when V cos α ≤ −3 T_W the ship overtakes the waves and the encounter period is reported as the magnitude.',
    'Resonance bands are a judgement: synchronous rolling is flagged as dangerous within ±10 % of T_E = T_R and as caution within ±20 %; parametric rolling is flagged when T_E is within ±10 % of T_R or of 0.5 T_R and the wavelength is 0.6–2.3 L (the range in which the Code says the stability variation on a crest is significant).',
    'Surf-riding and broaching: dangerous when 135° < α < 225° and V > 1.8 √L/cos(180° − α) knots, marginal above 1.4 √L/cos(180° − α) (Circ.1228 §4.2.1 and figure 2); successive high-wave attack: λ > 0.8 L, H_s > 0.04 L and T_E/T_W between 1.8 and 3.0 (§4.2.2).',
    'Irregular seas are represented by a single period and height; real spectra spread the energy, so the danger bands should be read as zones, not lines.',
  ],
  notes: [
    'Verification 2026-10-30: B 32 m, d 10 m, L_WL 205 m gives C = 0.3585 and T_R = 18.7 s at GM 1.5 m; head seas at 15 kn in 10 s waves give T_E = 6.67 s, following seas 20 s, beam seas 10 s (Circ.1228 §1.6); formulas transcribed from the circular text and the IS Code §2.3.4.',
    'Design decision: the roll period approximation is the IS Code one rather than T = 0.8 B/√GM or a user radius of gyration, because it is the formula masters and surveyors recognise; an observed period can be entered instead.',
    'Design decision: the dangerous-zone bands (±10 % / ±20 %) are not in the circular, which only says "nearly equal"; they are stated as judgement in the register.',
  ],
  sources: [
    'IMO Resolution MSC.267(85), International Code on Intact Stability 2008, Part A §2.3.4 (severe wind and rolling criterion — rolling period formula)',
    'IMO MSC.1/Circ.1228 (2007), Revised guidance to the master for avoiding dangerous situations in adverse weather and sea conditions, §1.5–1.6, §3.2–3.3, §4.2',
    'IMO MSC.1/Circ.1200 (2006), interim guidelines for alternative assessment of the weather criterion (roll period from radius of gyration)',
    'Lewis (ed.), Principles of Naval Architecture vol. III, Motions in Waves (SNAME 1989) — roll resonance and encounter frequency',
  ],
  inputs: [
    { id: 'mode', label: 'Roll period from', type: 'select', default: 'gm', options: [{ value: 'gm', label: 'GM and particulars (IS Code approximation)' }, { value: 'observed', label: 'An observed roll period (gives GM)' }] },
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 32, min: 1, max: 80 },
    { id: 'draft_m', label: 'Mean moulded draught d', group: 'length', unit: 'm', default: 10, min: 0.3, max: 30 },
    { id: 'lwl_m', label: 'Waterline length L_WL', group: 'length', unit: 'm', default: 205, min: 5, max: 500 },
    { id: 'lpp_m', label: 'Length between perpendiculars L (for the wave ratios)', group: 'length', unit: 'm', default: 200, min: 5, max: 500 },
    { id: 'gm_m', label: 'Metacentric height GM (fluid)', group: 'length', unit: 'm', default: 1.5, min: 0.01, max: 20, visibleWhen: { mode: 'gm' } },
    { id: 'observed_period_s', label: 'Observed roll period T_R', group: 'time', unit: 's', default: 18.7, min: 1, max: 60, visibleWhen: { mode: 'observed' } },
    { id: 'speed_kn', label: 'Ship speed V', group: 'speed', unit: 'kn', default: 15, min: 0, max: 50 },
    { id: 'heading_deg', label: 'Angle between keel and waves α (0 = head, 90 = beam, 180 = following)', group: 'angle', unit: 'deg', default: 45, min: 0, max: 360 },
    { id: 'wave_input', label: 'Waves given as', type: 'select', default: 'period', options: [{ value: 'period', label: 'Wave period T_W' }, { value: 'length', label: 'Wave length λ' }] },
    { id: 'wave_period_s', label: 'Wave period T_W', group: 'time', unit: 's', default: 10, min: 1, max: 30, visibleWhen: { wave_input: 'period' } },
    { id: 'wave_length_m', label: 'Wave length λ', group: 'length', unit: 'm', default: 156, min: 1, max: 1500, visibleWhen: { wave_input: 'length' } },
    { id: 'hs_m', label: 'Significant wave height H_s', group: 'length', unit: 'm', default: 4, min: 0, max: 30 },
  ],
  outputs: [
    { id: 'c_coef', label: 'IS Code coefficient C', group: 'dimensionless', unit: 'none' },
    { id: 'roll_period_s', label: 'Natural roll period T_R', group: 'time', unit: 's' },
    { id: 'gm_out_m', label: 'Metacentric height GM', group: 'length', unit: 'm' },
    { id: 'wave_period_s_out', label: 'Wave period T_W', group: 'time', unit: 's' },
    { id: 'wave_length_m_out', label: 'Wave length λ = 1.56 T_W²', group: 'length', unit: 'm' },
    { id: 'wave_speed_kn', label: 'Wave celerity', group: 'speed', unit: 'kn' },
    { id: 'encounter_period_s', label: 'Encounter period T_E', group: 'time', unit: 's' },
    { id: 'encounter_ratio', label: 'T_E / T_R', group: 'dimensionless', unit: 'none' },
    { id: 'lambda_l', label: 'λ / L', group: 'dimensionless', unit: 'none' },
    { id: 'hs_l', label: 'H_s / L', group: 'dimensionless', unit: 'none' },
    { id: 'steepness', label: 'Wave steepness H_s / λ', group: 'dimensionless', unit: 'none' },
    { id: 'synchronous_status', label: 'Synchronous rolling (T_E ≈ T_R)', type: 'text' },
    { id: 'parametric_status', label: 'Parametric rolling (T_E ≈ T_R or 0.5 T_R, λ/L 0.6–2.3)', type: 'text' },
    { id: 'surf_status', label: 'Surf-riding / broaching (following and quartering seas)', type: 'text' },
    { id: 'high_wave_status', label: 'Successive high-wave attack', type: 'text' },
    { id: 'surf_speed_limit_kn', label: 'Surf-riding speed limit 1.8 √L / cos(180° − α)', group: 'speed', unit: 'kn' },
    { id: 'te_critical_speed_kn', label: 'Speed at which T_E would equal T_R on this heading', group: 'speed', unit: 'kn' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      c_coef: '0.358',
      roll_period_s: '18.7 s',
    },
  },
};

/** IS Code 2008 §2.3.4 coefficient. */
export function isCodeC(beamM, draftM, lwlM) {
  return 0.373 + 0.023 * (beamM / draftM) - 0.043 * (lwlM / 100);
}

/** Natural roll period (s). */
export function rollPeriodS(beamM, draftM, lwlM, gmM) {
  return (2 * isCodeC(beamM, draftM, lwlM) * beamM) / Math.sqrt(gmM);
}

/** MSC.1/Circ.1228 encounter period (s), V in knots, α in degrees; Infinity when the ship rides with the waves. */
export function encounterPeriodS(waveperiodS, speedKn, headingDeg) {
  const denominator = 3 * waveperiodS + speedKn * Math.cos((headingDeg * Math.PI) / 180);
  if (Math.abs(denominator) < 1e-9) return Infinity;
  return (3 * waveperiodS * waveperiodS) / denominator;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['gm', 'observed'], 'mode', 'Roll period mode');
  assertOneOf(i.wave_input, ['period', 'length'], 'wave_input', 'Wave input');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.draft_m, 'draft_m', 'Draught');
  assertPositive(i.lwl_m, 'lwl_m', 'Waterline length');
  assertPositive(i.lpp_m, 'lpp_m', 'Length between perpendiculars');
  assertNonNegative(i.speed_kn, 'speed_kn', 'Speed');
  assertRange(i.heading_deg, 0, 360, 'heading_deg', 'Heading');
  assertNonNegative(i.hs_m, 'hs_m', 'Wave height');

  const C = isCodeC(i.beam_m, i.draft_m, i.lwl_m);
  if (C <= 0) throw new Error(`IS Code coefficient C = ${C.toFixed(3)} is not positive: the approximation does not apply to these proportions`);
  let TR;
  let GM;
  if (i.mode === 'gm') {
    GM = assertPositive(i.gm_m, 'gm_m', 'GM');
    TR = rollPeriodS(i.beam_m, i.draft_m, i.lwl_m, GM);
  } else {
    TR = assertPositive(i.observed_period_s, 'observed_period_s', 'Observed roll period');
    GM = ((2 * C * i.beam_m) / TR) ** 2;
  }

  const TW = i.wave_input === 'period' ? assertPositive(i.wave_period_s, 'wave_period_s', 'Wave period') : Math.sqrt(assertPositive(i.wave_length_m, 'wave_length_m', 'Wave length') / 1.56);
  const lambda = 1.56 * TW * TW;
  const TEsigned = encounterPeriodS(TW, i.speed_kn, i.heading_deg);
  const overtaking = TEsigned < 0;
  const TE = Number.isFinite(TEsigned) ? Math.abs(TEsigned) : null;
  const ratio = TE === null ? null : TE / TR;
  const L = i.lpp_m;
  const lambdaL = lambda / L;
  const hsL = i.hs_m / L;
  const cosFollowing = Math.cos(((180 - i.heading_deg) * Math.PI) / 180);
  const followingSector = i.heading_deg > 135 && i.heading_deg < 225;
  const surfLimit = followingSector ? (1.8 * Math.sqrt(L)) / cosFollowing : null;
  const surfMarginal = followingSector ? (1.4 * Math.sqrt(L)) / cosFollowing : null;

  // speed at which T_E = T_R on this heading: 3 T_W²/T_R = 3 T_W + V cos α
  const cosA = Math.cos((i.heading_deg * Math.PI) / 180);
  const vCritical = Math.abs(cosA) > 1e-6 ? ((3 * TW * TW) / TR - 3 * TW) / cosA : null;

  let synchronous;
  if (ratio === null) synchronous = 'Ship running with the waves (T_E → ∞): no periodic excitation, surf-riding regime instead';
  else if (Math.abs(ratio - 1) <= 0.1) synchronous = `DANGER — T_E = ${TE.toFixed(1)} s is within 10 % of T_R = ${TR.toFixed(1)} s: change course or speed`;
  else if (Math.abs(ratio - 1) <= 0.2) synchronous = `Caution — T_E within 20 % of T_R (ratio ${ratio.toFixed(2)})`;
  else synchronous = `Clear — T_E/T_R = ${ratio.toFixed(2)}`;

  let parametric;
  const nearHalf = ratio !== null && Math.abs(ratio - 0.5) <= 0.05;
  const nearOne = ratio !== null && Math.abs(ratio - 1) <= 0.1;
  const stabilityVariation = lambdaL >= 0.6 && lambdaL <= 2.3;
  if (ratio === null) parametric = 'Not applicable (no encounter period)';
  else if ((nearHalf || nearOne) && stabilityVariation) parametric = `DANGER — encounter ratio ${nearHalf ? '1:0.5' : '1:1'} with λ/L = ${lambdaL.toFixed(2)} in the 0.6–2.3 stability-variation band`;
  else if (nearHalf || nearOne) parametric = `Caution — encounter ratio ${nearHalf ? '1:0.5' : '1:1'} but λ/L = ${lambdaL.toFixed(2)} outside 0.6–2.3 (small stability variation)`;
  else parametric = `Clear — T_E/T_R = ${ratio.toFixed(2)} away from 0.5 and 1.0`;

  let surf;
  if (!followingSector) surf = 'Not applicable — surf-riding needs following or quartering seas (135° < α < 225°)';
  else if (i.speed_kn > surfLimit) surf = `DANGER — V = ${i.speed_kn} kn exceeds 1.8 √L/cos(180° − α) = ${surfLimit.toFixed(1)} kn (Circ.1228 §4.2.1)`;
  else if (i.speed_kn > surfMarginal) surf = `Marginal — V between 1.4 and 1.8 √L/cos(180° − α) (${surfMarginal.toFixed(1)}–${surfLimit.toFixed(1)} kn)`;
  else surf = `Clear — V below ${surfMarginal.toFixed(1)} kn`;

  let highWave;
  const longHigh = lambdaL > 0.8 && hsL > 0.04;
  const teTw = TE === null ? null : TE / TW;
  if (!longHigh) highWave = `Not critical — needs λ > 0.8 L and H_s > 0.04 L (λ/L ${lambdaL.toFixed(2)}, H_s/L ${hsL.toFixed(3)})`;
  else if (teTw !== null && teTw >= 1.8 && teTw <= 3.0) highWave = `DANGER — long high waves and T_E/T_W = ${teTw.toFixed(2)} in the 1.8–3.0 zone (Circ.1228 §4.2.2)`;
  else highWave = `Caution — long high waves (λ/L ${lambdaL.toFixed(2)}, H_s/L ${hsL.toFixed(3)}) but T_E/T_W = ${teTw === null ? '∞' : teTw.toFixed(2)} outside 1.8–3.0`;

  const warnings = [];
  if (i.mode === 'gm') warnings.push('Roll period from the IS Code approximation (radius of gyration ≈ 0.35–0.40 B): an observed period from a rolling test is more reliable.');
  if (overtaking) warnings.push('Ship faster than the waves on this heading: the encounter period shown is the magnitude of the (negative) formula value.');
  if (ratio !== null && ratio > 0.9 && ratio < 1.1 && !followingSector && i.heading_deg > 60 && i.heading_deg < 120) warnings.push('Beam seas near resonance: the roll amplitude is limited only by damping — bilge keels, speed and heading changes matter most here.');
  if (i.hs_m / lambda > 1 / 10) warnings.push('Wave steepness above 1/10: near breaking; the linear deep-water relations are approximate.');
  warnings.push('Single wave period and height stand for a spectrum: treat the danger bands as zones, not lines (Circ.1228 §2.1).');

  return {
    outputs: {
      c_coef: C,
      roll_period_s: TR,
      gm_out_m: GM,
      wave_period_s_out: TW,
      wave_length_m_out: lambda,
      wave_speed_kn: fromBase(lambda / TW, 'kn', 'speed'),
      encounter_period_s: TE,
      encounter_ratio: ratio,
      lambda_l: lambdaL,
      hs_l: hsL,
      steepness: i.hs_m / lambda,
      synchronous_status: synchronous,
      parametric_status: parametric,
      surf_status: surf,
      high_wave_status: highWave,
      surf_speed_limit_kn: surfLimit,
      te_critical_speed_kn: vCritical !== null && vCritical > 0 ? vCritical : null,
    },
    warnings,
  };
}
