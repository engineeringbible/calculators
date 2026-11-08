/**
 * transformer-sizing/calc.js — rating selection and performance of a two-winding distribution transformer: required kVA
 * from load, power factor, growth and maximum loading, the next IEC 60076 preferred rating, rated currents, impedance
 * components, voltage regulation at load, secondary voltage, losses and efficiency, maximum-efficiency load and the
 * secondary short-circuit current.
 *
 * S_req = P/(pf) (1 + g)/k_load;  u_r = P_k/S_r;  u_x = √(u_k² − u_r²);  ε ≈ x(u_r cosφ + u_x sinφ) + x²(u_x cosφ − u_r sinφ)²/200.
 * Schema units: W (display kW), VA (display kVA), V, %, A, Wh (display MWh).
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** IEC 60076-1 preferred ratings (R10 series), kVA. */
export const PREFERRED_KVA = [25, 50, 63, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000];

/** IEEE C57.12.00 preferred continuous ratings of three-phase transformers (US practice), kVA. */
export const ANSI_KVA = [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500, 3750, 5000, 7500, 10000];

export const schema = {
  id: 'transformer-sizing',
  name: 'Transformer size calculator (kVA)',
  category: 'electrical',
  summary: 'Transformer kVA size from the load, power factor and growth, the next IEC or ANSI standard rating, rated currents, voltage regulation and losses.',
  related: ['short-circuit-current', 'three-phase-power', 'generator-load', 'cable-sizing'],
  sendTo: [
    {
      target: 'short-circuit-current',
      label: 'Short-circuit current on the LV side (IEC 60909)',
      note: 'Transformer rating, voltages, impedance and load losses; enter the network short-circuit power and the cable there.',
      links: [
        { to: 'voltage_v', from: 'input:lv_voltage_v' },
        { to: 'hv_voltage_v', from: 'input:hv_voltage_v' },
        { to: 'transformer_va', from: 'rating_out_va' },
        { to: 'ukr_pct', from: 'input:uk_pct' },
        { to: 'pkr_w', from: 'input:pk_w' },
      ],
    },
  ],
  assumptions: [
    'Required rating S_req = P/pf × (1 + growth)/(maximum loading): the active load at the design power factor, a growth allowance and the permitted steady loading (0.8–1.0; IEC 60076-7 allows cyclic overloads, not applied); the preferred rating is the next IEC 60076-1 R10 value (… 630, 800, 1 000, 1 250, 1 600, 2 000, 2 500 kVA). Diversity between loads must already be in the active load.',
    'Impedance components from the nameplate: u_r = P_k/S_r (load losses at rated current), u_x = √(u_k² − u_r²), both in per unit of the rating; voltage regulation at a load fraction x and power factor cos φ by the standard approximation ε = x(u_r cos φ + u_x sin φ) + x²(u_x cos φ − u_r sin φ)²/200 (IEC 60076-8 / Say), lagging power factor positive; the no-load secondary voltage is the rated value.',
    'Losses: no-load (iron) losses constant, load (copper) losses P_k x²; efficiency η = P_out/(P_out + P_0 + x² P_k) with P_out = x S_r cos φ; maximum efficiency at the load fraction √(P_0/P_k). Annual energy loss uses the entered operating hours at the given load (a load-duration curve is not modelled).',
    'Secondary short-circuit current I_k ≈ I_r/u_k is the transformer-only, infinite-source value without the IEC 60909 voltage factor and K_T correction (the short-circuit calculator refines it); inrush current (8–12 × I_r for 0.1 s) is noted, not computed.',
    'Three-phase, two-winding, ONAN at nominal tap; harmonics (K-factor derating), altitude and ambient derating, parallel operation and tap-changer range are not covered.',
    'EU Ecodesign (Regulation 548/2014, Tier 2 2021) loss limits are given as a reference in the help texts for common ratings; the entered losses are the nameplate values.',
  ],
  notes: [
    'Verification 2026-10-31: 1 000 kVA, 6 %, P_0 1.1 kW, P_k 10.5 kW at full load and pf 0.8 lagging: u_r 1.05 %, u_x 5.91 %, regulation 4.47 %, secondary voltage 382.9 V, efficiency 98.57 %, maximum efficiency at 32.4 % load; 800 kW at pf 0.8 with 20 % growth and 80 % loading needs 1 500 kVA → 1 600 kVA preferred.',
    'Design decision: the regulation formula includes the second-order term so leading power factors (negative regulation) are handled; the rating list stops at 5 000 kVA, beyond which transformers are specified individually.',
  ],
  sources: [
    'IEEE C57.12.00-2021 General requirements for liquid-immersed distribution, power and regulating transformers (preferred continuous kVA ratings)',
    'IEC 60076-1:2011 Power transformers — General (rated quantities, preferred ratings R10 series), IEC 60076-7 loading guide, IEC 60076-8 application guide (voltage drop and regulation)',
    'M. G. Say, Alternating Current Machines, 5th ed. (Pitman 1983) — per-unit regulation approximation; B. L. Theraja, Electrical Technology vol. II',
    'Commission Regulation (EU) No 548/2014 (Ecodesign, Tier 2 2021) — maximum load and no-load losses for distribution transformers',
    'Schneider Electric Electrical Installation Guide, ch. B/N (transformer selection, inrush, short-circuit current I_r/u_k)',
  ],
  inputs: [
    { id: 'load_w', label: 'Design active load P (with diversity applied)', group: 'power', unit: 'W', display: 'kW', default: 800e3, min: 1e3, max: 1e8 },
    { id: 'pf', label: 'Load power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.5, max: 1 },
    { id: 'pf_type', label: 'Power factor type', type: 'select', default: 'lagging', options: [{ value: 'lagging', label: 'Lagging (inductive)' }, { value: 'leading', label: 'Leading (capacitive)' }] },
    { id: 'growth_pct', label: 'Load growth allowance', group: 'ratio', unit: 'pct', default: 20, min: 0, max: 200 },
    { id: 'max_loading', label: 'Maximum steady loading of the transformer', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.3, max: 1.1 },
    { id: 'rating_mode', label: 'Transformer rating', type: 'select', default: 'preferred', options: [{ value: 'preferred', label: 'Next IEC 60076 preferred rating above the requirement' }, { value: 'ansi', label: 'Next ANSI/IEEE C57.12 standard rating (US practice)' }, { value: 'given', label: 'Given rating (check an existing unit)' }] },
    { id: 'rating_va', label: 'Given rating S_r', group: 'apparent_power', unit: 'VA', display: 'kVA', default: 1000e3, min: 10e3, max: 1e8, visibleWhen: { rating_mode: 'given' } },
    { id: 'hv_voltage_v', label: 'Primary (HV) rated voltage', group: 'voltage', unit: 'V', display: 'kV', default: 11000, min: 200, max: 400000 },
    { id: 'lv_voltage_v', label: 'Secondary (LV) rated voltage (no load)', group: 'voltage', unit: 'V', default: 400, min: 100, max: 36000 },
    { id: 'uk_pct', label: 'Impedance voltage u_k', group: 'ratio', unit: 'pct', default: 6, min: 2, max: 20, help: '4 % up to 630 kVA, 6 % 800–2 500 kVA typical.' },
    { id: 'p0_w', label: 'No-load losses P_0', group: 'power', unit: 'W', display: 'kW', default: 1100, min: 0, max: 1e5, help: 'Ecodesign Tier 2: 1 000 kVA ≤ 693 W (AAA0) … 1 100 W typical older units.' },
    { id: 'pk_w', label: 'Load losses P_k at rated current', group: 'power', unit: 'W', display: 'kW', default: 10500, min: 1, max: 1e6, help: 'Ecodesign Tier 2: 1 000 kVA ≤ 10 500 W (Ak).' },
    { id: 'hours_per_year', label: 'Operating hours per year at this load', group: 'dimensionless', unit: 'none', default: 6000, min: 0, max: 8760 },
  ],
  outputs: [
    { id: 'apparent_load_va', label: 'Apparent load S = P/cos φ (present)', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'required_va', label: 'Required rating with growth and loading limit', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'rating_out_va', label: 'Transformer rating S_r selected / checked', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'loading_pct', label: 'Present loading S/S_r', group: 'ratio', unit: 'pct' },
    { id: 'loading_future_pct', label: 'Loading after growth', group: 'ratio', unit: 'pct' },
    { id: 'i_hv_a', label: 'Rated HV current', group: 'current', unit: 'A' },
    { id: 'i_lv_a', label: 'Rated LV current', group: 'current', unit: 'A' },
    { id: 'i_load_a', label: 'LV current at the present load', group: 'current', unit: 'A' },
    { id: 'ur_pct', label: 'Resistive impedance voltage u_r = P_k/S_r', group: 'ratio', unit: 'pct' },
    { id: 'ux_pct', label: 'Reactive impedance voltage u_x', group: 'ratio', unit: 'pct' },
    { id: 'regulation_pct', label: 'Voltage regulation at the present load', group: 'ratio', unit: 'pct' },
    { id: 'lv_voltage_load_v', label: 'Secondary voltage at the present load', group: 'voltage', unit: 'V' },
    { id: 'regulation_full_pct', label: 'Voltage regulation at rated load, same power factor', group: 'ratio', unit: 'pct' },
    { id: 'losses_w', label: 'Total losses at the present load P_0 + x² P_k', group: 'power', unit: 'W', display: 'kW' },
    { id: 'efficiency_pct', label: 'Efficiency at the present load', group: 'ratio', unit: 'pct' },
    { id: 'efficiency_full_pct', label: 'Efficiency at rated load', group: 'ratio', unit: 'pct' },
    { id: 'max_eff_load_pct', label: 'Load fraction of maximum efficiency √(P_0/P_k)', group: 'ratio', unit: 'pct' },
    { id: 'annual_loss_wh', label: 'Annual energy loss at the present load', group: 'energy', unit: 'Wh', display: 'MWh' },
    { id: 'isc_lv_a', label: 'Secondary short-circuit current ≈ I_r/u_k (infinite source)', group: 'current', unit: 'A', display: 'kA' },
    { id: 'sizing_remark', label: 'Sizing remark', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      rating_mode: 'given',
      rating_va: [1000, 'kVA'],
    },
    results: {
      required_va: '1 500 kVA',
      loading_future_pct: '120 %',
      ur_pct: '1.05 %',
      ux_pct: '5.91 %',
      regulation_pct: '4.47 %',
      lv_voltage_load_v: '382 V',
      losses_w: '11.6 kW',
      efficiency_pct: '98.6 %',
      max_eff_load_pct: '32 %',
      i_hv_a: '52.5 A',
      i_lv_a: '1 443 A',
    },
  },
};

/** Next preferred rating (VA) at or above the requirement; null if above the list. */
export function preferredRatingVa(requiredVa, list = PREFERRED_KVA) {
  const kva = requiredVa / 1000;
  const next = list.find((r) => r >= kva - 1e-9);
  return next ? next * 1000 : null;
}

/** Per-unit regulation at load fraction x, pf cos φ (sin φ positive lagging). */
export function regulationPu(x, ur, ux, cosPhi, sinPhi) {
  return x * (ur * cosPhi + ux * sinPhi) + (x * x * (ux * cosPhi - ur * sinPhi) ** 2) / 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.load_w, 'load_w', 'Load');
  assertRange(i.pf, 0.3, 1, 'pf', 'Power factor');
  assertOneOf(i.pf_type, ['lagging', 'leading'], 'pf_type', 'Power factor type');
  assertNonNegative(i.growth_pct, 'growth_pct', 'Growth');
  assertRange(i.max_loading, 0.2, 1.5, 'max_loading', 'Maximum loading');
  assertOneOf(i.rating_mode, ['preferred', 'ansi', 'given'], 'rating_mode', 'Rating mode');
  assertPositive(i.hv_voltage_v, 'hv_voltage_v', 'HV voltage');
  assertPositive(i.lv_voltage_v, 'lv_voltage_v', 'LV voltage');
  assertRange(i.uk_pct, 1, 30, 'uk_pct', 'Impedance voltage');
  assertNonNegative(i.p0_w, 'p0_w', 'No-load losses');
  assertPositive(i.pk_w, 'pk_w', 'Load losses');
  assertRange(i.hours_per_year, 0, 8760, 'hours_per_year', 'Hours');

  const sLoad = i.load_w / i.pf;
  const required = (sLoad * (1 + i.growth_pct / 100)) / i.max_loading;
  let Sr;
  if (i.rating_mode !== 'given') {
    const list = i.rating_mode === 'ansi' ? ANSI_KVA : PREFERRED_KVA;
    Sr = preferredRatingVa(required, list);
    if (Sr === null) throw new Error(`Required rating ${(required / 1000).toFixed(0)} kVA exceeds the preferred list (${list[list.length - 1]} kVA): specify the transformer individually`);
  } else Sr = assertPositive(i.rating_va, 'rating_va', 'Rating');

  const ur = i.pk_w / Sr;
  const uk = i.uk_pct / 100;
  if (ur >= uk) throw new Error(`Load losses ${i.pk_w} W give u_r = ${(ur * 100).toFixed(2)} % ≥ u_k ${i.uk_pct} %: check the nameplate values`);
  const ux = Math.sqrt(uk * uk - ur * ur);
  const cosPhi = i.pf;
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi) * (i.pf_type === 'lagging' ? 1 : -1);
  const x = sLoad / Sr;
  const reg = regulationPu(x, ur, ux, cosPhi, sinPhi);
  const regFull = regulationPu(1, ur, ux, cosPhi, sinPhi);
  const vLoad = i.lv_voltage_v * (1 - reg);
  const losses = i.p0_w + x * x * i.pk_w;
  const pOut = i.load_w;
  const eff = pOut / (pOut + losses);
  const effFull = (Sr * cosPhi) / (Sr * cosPhi + i.p0_w + i.pk_w);
  const xMaxEff = Math.sqrt(i.p0_w / i.pk_w);
  const iHv = Sr / (Math.sqrt(3) * i.hv_voltage_v);
  const iLv = Sr / (Math.sqrt(3) * i.lv_voltage_v);
  const iLoad = sLoad / (Math.sqrt(3) * i.lv_voltage_v);
  const isc = iLv / uk;
  const loadingFuture = (sLoad * (1 + i.growth_pct / 100)) / Sr;

  let remark;
  if (loadingFuture > i.max_loading + 1e-9) remark = `Loading after growth ${(loadingFuture * 100).toFixed(0)} % exceeds the ${(i.max_loading * 100).toFixed(0)} % limit: the next rating (${(preferredRatingVa(Sr * 1.0001) / 1000) || '> 5 000'} kVA) is needed`;
  else if (x < 0.3) remark = `Lightly loaded (${(x * 100).toFixed(0)} %): no-load losses dominate; a smaller unit or a lower-loss design would be more efficient`;
  else remark = `OK — ${(x * 100).toFixed(0)} % loaded now, ${(loadingFuture * 100).toFixed(0)} % after growth; regulation ${(reg * 100).toFixed(2)} %`;

  const warnings = [];
  if (Math.abs(reg) > 0.05) warnings.push('Voltage regulation above 5 %: consider a tap setting or a lower-impedance unit; downstream voltage drop adds to it.');
  if (i.pf < 0.85) warnings.push('Power factor below 0.85: correction capacitors would reduce the required kVA and the regulation.');
  if (i.pf_type === 'leading') warnings.push('Leading power factor: the secondary voltage can rise above the no-load value (negative regulation).');
  if (i.rating_mode !== 'given') warnings.push(`${i.rating_mode === 'ansi' ? 'Standard rating from the IEEE C57.12.00 series' : 'Preferred rating from the IEC 60076 R10 series'}; the required ${(required / 1000).toFixed(0)} kVA includes ${i.growth_pct} % growth at ${(i.max_loading * 100).toFixed(0)} % maximum loading.`);
  warnings.push('Nameplate losses assumed; EU Ecodesign Tier 2 (2021) limits for new units are often well below older designs — check the datasheet.');
  warnings.push(`Short-circuit current is the transformer-only estimate I_r/u_k; inrush can reach 8–12 × I_r (${(8 * iLv / 1000).toFixed(1)}–${(12 * iLv / 1000).toFixed(1)} kA) for the first cycles.`);

  return {
    outputs: {
      apparent_load_va: sLoad,
      required_va: required,
      rating_out_va: Sr,
      loading_pct: x * 100,
      loading_future_pct: loadingFuture * 100,
      i_hv_a: iHv,
      i_lv_a: iLv,
      i_load_a: iLoad,
      ur_pct: ur * 100,
      ux_pct: ux * 100,
      regulation_pct: reg * 100,
      lv_voltage_load_v: vLoad,
      regulation_full_pct: regFull * 100,
      losses_w: losses,
      efficiency_pct: eff * 100,
      efficiency_full_pct: effFull * 100,
      max_eff_load_pct: xMaxEff * 100,
      annual_loss_wh: losses * i.hours_per_year,
      isc_lv_a: isc,
      sizing_remark: remark,
    },
    warnings,
  };
}
