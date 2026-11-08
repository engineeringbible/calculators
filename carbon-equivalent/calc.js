/**
 * carbon-equivalent/calc.js — weldability carbon equivalents of a steel from its chemical composition: IIW CE, the
 * AWS D1.1 variant with silicon, Ito–Bessyo Pcm and the EN 1011-2 CET, with the optional minimum preheat temperature of
 * EN 1011-2 Annex C method B (CET method).
 *
 * CE(IIW) = C + Mn/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15;  CE(AWS) = CE(IIW) + Si/6;
 * Pcm = C + Si/30 + (Mn + Cu + Cr)/20 + Ni/60 + Mo/15 + V/10 + 5B;  CET = C + (Mn + Mo)/10 + (Cr + Cu)/20 + Ni/40;
 * T_p = 697 CET + 160 tanh(d/35) + 62 HD^0.35 + (53 CET − 32) Q − 328  (°C), EN 1011-2 C.3.
 * Schema units: element contents in mass %, thickness in m, temperature in °C.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

/** EN 1011-2 Annex C method B: composition range (mass %) for which the CET preheat formula is valid. */
export const CET_LIMITS = { c: [0.05, 0.32], si: [0, 0.8], mn: [0.5, 1.9], cr: [0, 1.5], cu: [0, 0.7], mo: [0, 0.75], nb: [0, 0.06], ni: [0, 2.5], ti: [0, 0.12], v: [0, 0.18], b: [0, 0.005] };
const NAMES = { c: 'C', si: 'Si', mn: 'Mn', cr: 'Cr', cu: 'Cu', mo: 'Mo', nb: 'Nb', ni: 'Ni', ti: 'Ti', v: 'V', b: 'B' };

export function carbonEquivalents({ c, mn, si, cr, mo, v, ni, cu, b }) {
  const ceIiw = c + mn / 6 + (cr + mo + v) / 5 + (ni + cu) / 15;
  return {
    ceIiw,
    ceAws: ceIiw + si / 6,
    pcm: c + si / 30 + (mn + cu + cr) / 20 + ni / 60 + mo / 15 + v / 10 + 5 * b,
    cet: c + (mn + mo) / 10 + (cr + cu) / 20 + ni / 40,
  };
}

/** EN 1011-2 C.3 minimum preheat (°C) from CET, thickness d (mm), diffusible hydrogen HD (ml/100 g) and heat input Q (kJ/mm). */
export function preheatEn1011(cet, dMm, hd, q) {
  return 697 * cet + 160 * Math.tanh(dMm / 35) + 62 * hd ** 0.35 + (53 * cet - 32) * q - 328;
}

const el = (id, label, def, max) => ({ id, label: `${label} (mass %)`, group: 'dimensionless', unit: 'none', default: def, min: 0, max });

export const schema = {
  id: 'carbon-equivalent',
  name: 'Carbon equivalent calculator (CE, Pcm, CET) and preheat',
  category: 'mechanical',
  summary: 'Weldability of steel from its composition: IIW carbon equivalent, AWS CE with silicon, Pcm and CET, with the EN 1011-2 minimum preheat temperature.',
  related: ['fillet-weld', 'hardness-conversion', 'material-properties', 'weld-fatigue'],
  assumptions: [
    'Element contents are mass per cent from the mill certificate (heat or product analysis). Elements left at zero are taken as absent, which can understate the carbon equivalent if they are present.',
    'CE(IIW) suits carbon and carbon-manganese steels; AWS D1.1 adds Si/6 to it. Pcm (Ito and Bessyo) was derived for low-carbon low-alloy steels, where CE(IIW) is less suitable. CET is the carbon equivalent of EN 1011-2 method B.',
    'The preheat temperature uses the formula of EN 1011-2 Annex C method B and is given only within its validity range: CET 0.20 to 0.50 %, thickness 10 to 90 mm, diffusible hydrogen 1 to 20 ml/100 g, heat input 0.5 to 4.0 kJ/mm, and the composition limits of that annex. Outside it the calculator refuses rather than extrapolates.',
    'The preheat is the minimum to avoid hydrogen cold cracking in the heat-affected zone of a butt weld; restraint, hardness limits, the welding procedure and the governing code may require more. Heat input Q here is the effective value (arc energy × thermal efficiency).',
  ],
  notes: [
    'Verification 2026-11-08: C 0.18, Mn 1.40, Si 0.30, Cr 0.05, Mo 0.02, V 0.01, Ni 0.05, Cu 0.10: CE(IIW) 0.439, CE(AWS) 0.489, Pcm 0.271, CET 0.331; EN 1011-2 preheat for 30 mm, HD 5 ml/100 g, Q 1.0 kJ/mm = 108 °C. Checked by hand.',
    'Formula provenance: the CET, Pcm and IIW expressions, the preheat equation and its validity ranges were checked against the Dillinger welding tool documentation of EN 1011-2 method B; the Si/6 term of AWS D1.1 against the TWI FAQ on carbon equivalent formulae.',
  ],
  sources: [
    'EN 1011-2:2001, Welding — Recommendations for welding of metallic materials — Part 2: Arc welding of ferritic steels, Annex C (method A, CE; method B, CET and preheat equation C.3)',
    'AWS D1.1/D1.1M:2025, Structural Welding Code — Steel, Annex B (alternative methods for determining preheat; CE with Si/6 and Pcm)',
    'Ito, Y. and Bessyo, K. (1968), Weldability formula of high strength steels related to heat-affected zone cracking, IIW Doc. IX-576-68 (Pcm)',
    'TWI, FAQ: What is the difference between the various carbon equivalent formulae used in relation to hydrogen cracking?',
  ],
  inputs: [
    el('c', 'Carbon C', 0.18, 2), el('mn', 'Manganese Mn', 1.4, 5), el('si', 'Silicon Si', 0.3, 3), el('cr', 'Chromium Cr', 0.05, 10),
    el('mo', 'Molybdenum Mo', 0.02, 5), el('v', 'Vanadium V', 0.01, 2), el('ni', 'Nickel Ni', 0.05, 10), el('cu', 'Copper Cu', 0.1, 3),
    el('b', 'Boron B', 0, 0.1), el('nb', 'Niobium Nb (validity check only)', 0, 1), el('ti', 'Titanium Ti (validity check only)', 0, 1),
    { id: 'preheat', label: 'Preheat estimate', type: 'select', default: 'en1011', options: [{ value: 'none', label: 'None: carbon equivalents only' }, { value: 'en1011', label: 'EN 1011-2 method B (CET)' }] },
    { id: 'thickness_m', label: 'Plate thickness d', group: 'length', unit: 'm', display: 'mm', default: 0.03, min: 0.001, max: 0.5, visibleWhen: { preheat: 'en1011' } },
    { id: 'hd', label: 'Diffusible hydrogen of the weld metal HD (ml/100 g)', group: 'dimensionless', unit: 'none', default: 5, min: 0.1, max: 100, visibleWhen: { preheat: 'en1011' } },
    { id: 'q_kj_mm', label: 'Effective heat input Q (kJ/mm)', group: 'dimensionless', unit: 'none', default: 1, min: 0.05, max: 20, visibleWhen: { preheat: 'en1011' } },
  ],
  outputs: [
    { id: 'ce_iiw', label: 'CE (IIW) = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ce_aws', label: 'CE (AWS D1.1) = CE(IIW) + Si/6', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'pcm', label: 'Pcm (Ito–Bessyo)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cet', label: 'CET (EN 1011-2)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'preheat_c', label: 'Minimum preheat temperature (EN 1011-2 method B)', group: 'temperature', unit: 'C', decimals: 0, visibleWhen: { preheat: 'en1011' } },
    { id: 'preheat_note', label: 'Preheat', type: 'text', visibleWhen: { preheat: 'en1011' } },
  ],
  example: {
    inputs: { c: 0.18, mn: 1.4, si: 0.3, cr: 0.05, mo: 0.02, v: 0.01, ni: 0.05, cu: 0.1, b: 0, preheat: 'en1011', thickness_m: [30, 'mm'], hd: 5, q_kj_mm: 1 },
    results: { ce_iiw: '0.439', ce_aws: '0.489', pcm: '0.271', cet: '0.331', preheat_c: '108 °C' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const comp = {};
  for (const id of ['c', 'mn', 'si', 'cr', 'mo', 'v', 'ni', 'cu', 'b', 'nb', 'ti']) {
    const spec = schema.inputs.find((i) => i.id === id);
    comp[id] = assertRange(x[id], 0, spec.max, id, spec.label.replace(' (mass %)', ''));
  }
  const sum = Object.values(comp).reduce((s, v) => s + v, 0);
  if (sum > 30) throw new Error('Composition: the alloying elements add up to more than 30 %; carbon equivalents apply to carbon and low-alloy steels.');
  assertOneOf(x.preheat, ['none', 'en1011'], 'preheat', 'Preheat estimate');
  const ce = carbonEquivalents(comp);
  const warnings = [];
  if (comp.c > 0.5) warnings.push('Carbon above 0.5 %: a high-carbon steel, beyond the range the carbon-equivalent formulas were derived for; welding needs a specific procedure.');
  if (comp.c < 0.18) warnings.push('Carbon below 0.18 %: for such low-carbon steels Pcm or CET describes cold-cracking risk better than CE(IIW).');
  let preheat = null;
  let note = null;
  if (x.preheat === 'en1011') {
    const out = Object.entries(CET_LIMITS).filter(([k, [lo, hi]]) => comp[k] < lo - 1e-12 || comp[k] > hi + 1e-12).map(([k, [lo, hi]]) => `${NAMES[k]} ${comp[k]} % (valid ${lo === 0 ? 'up to' : `${lo} to`} ${hi} %)`);
    if (out.length) throw new Error(`Composition: outside the range of the EN 1011-2 method B preheat formula: ${out.join(', ')}. Choose "carbon equivalents only".`);
    if (ce.cet < 0.2 || ce.cet > 0.5) throw new Error(`Composition: CET = ${ce.cet.toFixed(3)} %, outside 0.20 to 0.50 % where the EN 1011-2 preheat formula is valid.`);
    const d = assertRange(x.thickness_m * 1000, 10, 90, 'thickness_m', 'Plate thickness (mm)');
    const hd = assertRange(x.hd, 1, 20, 'hd', 'Diffusible hydrogen HD');
    const q = assertRange(x.q_kj_mm, 0.5, 4, 'q_kj_mm', 'Effective heat input Q');
    preheat = preheatEn1011(ce.cet, d, hd, q);
    note = preheat <= 20
      ? 'The formula gives no preheat above room temperature: weld at not less than the minimum workshop temperature the procedure requires.'
      : `Preheat to at least ${Math.ceil(preheat / 5) * 5} °C (EN 1011-2 method B, minimum to avoid hydrogen cracking).`;
  }
  return {
    outputs: { ce_iiw: ce.ceIiw, ce_aws: ce.ceAws, pcm: ce.pcm, cet: ce.cet, preheat_c: preheat, preheat_note: note },
    warnings,
  };
}
