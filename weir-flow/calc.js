/**
 * weir-flow/calc.js — flow over sharp-crested weirs and through Parshall flumes from the measured head.
 *
 * Rectangular (Francis):  Q = 3.33 (L − 0.1 n H) H^1.5          (ft, ft³/s; n = number of end contractions)
 * 90° V-notch (Cone):     Q = 2.49 H^2.48                        (USBR WMM eq. 7-6)
 * Cipolletti:             Q = 3.367 L H^1.5                      (USBR WMM eq. 7-7)
 * Parshall flume:         Q = C H_a^n (USBR WMM eq. 8-3, Table 8-6); 2–8 ft: Q = 4 W H_a^(1.522 W^0.026)
 * The equations are dimensional in feet; inputs are converted to ft and the flow back to m³/s.
 * Schema units: SI — m, m³/s.
 */
import { withDefaults, assertPositive, assertOneOf, assertNonNegative } from '../shared/validate.js';

const FT = 0.3048;
const CFS = 0.028316846592;

/**
 * Parshall flumes 1 in to 8 ft: free-flow equation, head range of the USBR free-flow tables A8-7 to A8-12 (ft) and
 * the submergence limit hb/ha at which the free-flow discharge starts to fall (USBR WMM chapter 8).
 */
export const PARSHALL = {
  in1: { label: '1 in', W: 1 / 12, q: (h) => 0.338 * h ** 1.55, hMin: 0.05, hMax: 0.69, sub: 0.5 },
  in2: { label: '2 in', W: 2 / 12, q: (h) => 0.676 * h ** 1.55, hMin: 0.05, hMax: 0.79, sub: 0.5 },
  in3: { label: '3 in', W: 3 / 12, q: (h) => 0.992 * h ** 1.55, hMin: 0.05, hMax: 1.09, sub: 0.5 },
  in6: { label: '6 in', W: 0.5, q: (h) => 2.06 * h ** 1.58, hMin: 0.10, hMax: 1.29, sub: 0.6 },
  in9: { label: '9 in', W: 0.75, q: (h) => 3.07 * h ** 1.53, hMin: 0.10, hMax: 1.59, sub: 0.6 },
  ft1: { label: '1 ft', W: 1, q: (h) => 3.95 * h ** 1.55, hMin: 0.20, hMax: 2.50, sub: 0.7 },
  ft2: { label: '2 ft', W: 2, hMin: 0.20, hMax: 2.50, sub: 0.7 },
  ft3: { label: '3 ft', W: 3, hMin: 0.20, hMax: 2.50, sub: 0.7 },
  ft4: { label: '4 ft', W: 4, hMin: 0.20, hMax: 2.50, sub: 0.7 },
  ft5: { label: '5 ft', W: 5, hMin: 0.25, hMax: 2.50, sub: 0.7 },
  ft6: { label: '6 ft', W: 6, hMin: 0.25, hMax: 2.50, sub: 0.7 },
  ft7: { label: '7 ft', W: 7, hMin: 0.30, hMax: 2.50, sub: 0.7 },
  ft8: { label: '8 ft', W: 8, hMin: 0.30, hMax: 2.50, sub: 0.7 },
};

/** Free-flow discharge of a Parshall flume, ft³/s, head in ft. */
export function parshallQ(size, hFt) {
  const p = PARSHALL[size];
  return p.q ? p.q(hFt) : 4 * p.W * hFt ** (1.522 * p.W ** 0.026);
}

export const TYPES = {
  rect: { label: 'Rectangular sharp-crested weir (Francis)' },
  vnotch: { label: '90° V-notch weir' },
  cipolletti: { label: 'Cipolletti (trapezoidal, 1 : 4 sides) weir' },
  parshall: { label: 'Parshall flume' },
};

export const schema = {
  id: 'weir-flow',
  name: 'Weir and flume flow calculator',
  category: 'civil',
  summary: 'Flow over rectangular (Francis), 90° V-notch and Cipolletti weirs and through Parshall flumes from the measured head, with USBR limits.',
  related: ['manning-channel-flow', 'culvert-capacity', 'orifice-flow', 'drain-pipe-size'],
  assumptions: [
    'Free flow over a thin, sharp crest with an aerated nappe; the approach velocity is neglected, as in the Francis, Cone and Cipolletti equations. A submerged or clinging nappe gives more flow than calculated.',
    'The head is measured in still water at least four heads upstream of the crest; for a Parshall flume the upstream head H_a is read at the standard gauge point in the converging section.',
    'Contracted weirs and V-notches are fully contracted: crest height and side clearances of at least twice the maximum head. Suppressed weirs span the full channel width with ventilated nappes.',
    'Heads are limited to the ranges of the USBR Water Measurement Manual: at least 0.2 ft (61 mm) on weirs, at most L/3 on contracted and Cipolletti weirs, 1.25 ft on the V-notch, and the free-flow table range for each Parshall flume.',
    'Parshall flumes must be built to the standard dimensions; the free-flow equations apply while the submergence H_b/H_a stays below 0.5 (1 to 3 in), 0.6 (6 to 9 in) or 0.7 (1 to 8 ft). Accuracy is about ±5 % for weirs and ±3 to 5 % for flumes.',
  ],
  notes: [
    'Verification 2026-11-08: a 2 ft contracted rectangular weir with 0.5 ft head carries 3.33 × 1.9 × 0.5^1.5 = 2.24 ft³/s (63.3 L/s); a 90° V-notch at 0.5 ft gives 0.446 ft³/s; a 1 ft Parshall flume at 1.00 ft gives 3.95 ft³/s, as in USBR Table A8-12. Checked by hand.',
    'Parshall coefficients and head ranges transcribed from USBR WMM Table 8-6 and the free-flow tables A8-7 to A8-12; the 2 to 8 ft flumes use the table formula Q = 4 W H_a^(1.522 W^0.026), which Table 8-6 rounds to two-decimal exponents.',
  ],
  sources: [
    'US Bureau of Reclamation, Water Measurement Manual, 3rd ed. revised (2001), chapter 7: eq. 7-6 (90° V-notch, Cone) and eq. 7-7 (Cipolletti) with their limits',
    'US Bureau of Reclamation, Water Measurement Manual, chapter 8: eq. 8-3 and Table 8-6 (Parshall flume coefficients), submergence limits, and appendix tables A8-7 to A8-12',
    'E. F. Brater, H. W. King, J. E. Lindell and C. Y. Wei, Handbook of Hydraulics, 7th ed. (McGraw-Hill, 1996), sharp-crested weirs: Francis formula Q = 3.33 (L − 0.1 n H) H^1.5 for sharp-crested rectangular weirs',
  ],
  inputs: [
    { id: 'type', label: 'Device', type: 'select', default: 'rect', options: Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label })) },
    { id: 'head_m', label: 'Head over the crest H (upstream head H_a for a flume)', group: 'length', unit: 'm', display: 'ft', default: 0.5 * FT, min: 0.001, max: 5 },
    { id: 'crest_m', label: 'Crest length L', group: 'length', unit: 'm', display: 'ft', default: 2 * FT, min: 0.05, max: 50, visibleWhen: { type: ['rect', 'cipolletti'] } },
    { id: 'contractions', label: 'End contractions', type: 'select', default: '2', options: [{ value: '2', label: 'Two (contracted weir)' }, { value: '1', label: 'One' }, { value: '0', label: 'None (suppressed, full channel width)' }], visibleWhen: { type: 'rect' } },
    { id: 'crest_height_m', label: 'Crest height above the channel bed P', group: 'length', unit: 'm', display: 'ft', default: 1.5 * FT, min: 0, max: 50, visibleWhen: { type: ['rect', 'vnotch', 'cipolletti'] } },
    { id: 'throat', label: 'Parshall throat width W', type: 'select', default: 'ft1', options: Object.entries(PARSHALL).map(([value, p]) => ({ value, label: p.label })), visibleWhen: { type: 'parshall' } },
    { id: 'hb_m', label: 'Downstream throat head H_b (optional, 0 = free flow)', group: 'length', unit: 'm', display: 'ft', default: 0, min: 0, max: 5, visibleWhen: { type: 'parshall' } },
  ],
  outputs: [
    { id: 'flow_m3s', label: 'Flow Q', group: 'volume_flow', unit: 'm3_s', display: 'cfs' },
    { id: 'flow_ls_m3s', label: 'Flow in litres per second', group: 'volume_flow', unit: 'm3_s', display: 'L_s' },
    { id: 'flow_gpm_m3s', label: 'Flow in US gallons per minute', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us' },
    { id: 'equation', label: 'Equation used', type: 'text' },
    { id: 'effective_m', label: 'Effective crest length L − 0.1 n H', group: 'length', unit: 'm', display: 'ft' },
    { id: 'range', label: 'Valid head range', type: 'text' },
  ],
  example: {
    inputs: { type: 'rect', head_m: [0.5, 'ft'], crest_m: [2, 'ft'], contractions: '2', crest_height_m: [1.5, 'ft'] },
    results: { effective_m: '1.9 ft', flow_m3s: '2.24 ft³/s', flow_ls_m3s: '63.3 L/s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, Object.keys(TYPES), 'type', 'Device');
  const H = assertPositive(x.head_m, 'head_m', 'Head') / FT;
  const warnings = [];
  let q;
  let equation;
  let effective = null;
  let range;
  if (x.type === 'parshall') {
    assertOneOf(x.throat, Object.keys(PARSHALL), 'throat', 'Parshall throat width');
    const p = PARSHALL[x.throat];
    range = `${p.hMin.toFixed(2)} to ${p.hMax.toFixed(2)} ft (${Math.round(p.hMin * 304.8)} to ${Math.round(p.hMax * 304.8)} mm), free flow below H_b/H_a = ${p.sub}`;
    if (H < p.hMin - 1e-9 || H > p.hMax + 1e-9) throw new Error(`Head: ${H.toFixed(3)} ft is outside the free-flow range of the ${p.label} Parshall flume, ${p.hMin} to ${p.hMax} ft (USBR tables)`);
    const hb = assertNonNegative(x.hb_m, 'hb_m', 'Downstream throat head') / FT;
    if (hb / H > p.sub) throw new Error(`Downstream throat head: submergence H_b/H_a = ${(hb / H).toFixed(2)} exceeds ${p.sub} for the ${p.label} flume; the free-flow equation does not apply, use the USBR submerged-flow corrections`);
    q = parshallQ(x.throat, H);
    equation = p.q ? `Q = C H_a^n, USBR Table 8-6, ${p.label} flume` : `Q = 4 W H_a^(1.522 W^0.026), W = ${p.W} ft`;
  } else {
    const P = assertNonNegative(x.crest_height_m, 'crest_height_m', 'Crest height') / FT;
    if (H < 0.2 - 1e-9) throw new Error(`Head: ${H.toFixed(3)} ft is below the 0.2 ft (61 mm) minimum for sharp-crested weirs (USBR WMM chapter 7)`);
    if (x.type === 'vnotch') {
      if (H > 1.25 + 1e-9) throw new Error(`Head: ${H.toFixed(3)} ft exceeds the 1.25 ft (381 mm) limit of a fully contracted V-notch (USBR WMM chapter 7)`);
      q = 2.49 * H ** 2.48;
      equation = 'Q = 2.49 H^2.48 (Cone, 90° V-notch)';
      range = '0.2 to 1.25 ft (61 to 381 mm)';
    } else {
      const L = assertPositive(x.crest_m, 'crest_m', 'Crest length') / FT;
      if (x.type === 'cipolletti') {
        if (H > L / 3 + 1e-9) throw new Error(`Head: ${H.toFixed(3)} ft exceeds one third of the crest length (${(L / 3).toFixed(3)} ft), the limit of the Cipolletti equation`);
        q = 3.367 * L * H ** 1.5;
        equation = 'Q = 3.367 L H^1.5 (Cipolletti)';
        range = `0.2 to ${(L / 3).toFixed(2)} ft (L/3)`;
      } else {
        assertOneOf(String(x.contractions), ['0', '1', '2'], 'contractions', 'End contractions');
        const n = Number(x.contractions);
        if (n > 0 && H > L / 3 + 1e-9) throw new Error(`Head: ${H.toFixed(3)} ft exceeds one third of the crest length (${(L / 3).toFixed(3)} ft), the limit for a contracted rectangular weir`);
        effective = L - 0.1 * n * H;
        q = 3.33 * effective * H ** 1.5;
        equation = `Q = 3.33 (L − 0.1 n H) H^1.5 (Francis, n = ${n})`;
        range = n > 0 ? `0.2 to ${(L / 3).toFixed(2)} ft (L/3)` : 'from 0.2 ft; keep H below half the crest height';
        if (n === 0 && P > 0 && H > P / 2) warnings.push('Head more than half the crest height on a suppressed weir: the approach velocity is no longer negligible and the Francis formula underestimates the flow.');
      }
    }
    if (P < 2 * H && !(x.type === 'rect' && String(x.contractions) === '0')) warnings.push('Crest height less than twice the head: the weir is not fully contracted and the equation overestimates the contraction; raise the crest or use a calibrated rating.');
  }
  const Q = q * CFS;
  return {
    outputs: { flow_m3s: Q, flow_ls_m3s: Q, flow_gpm_m3s: Q, equation, effective_m: effective === null ? null : effective * FT, range },
    warnings,
  };
}
