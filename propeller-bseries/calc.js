/**
 * propeller-bseries/calc.js — Wageningen B-series open-water characteristics from the Oosterveld & van Oossanen (1975)
 * polynomials (Rn 2·10⁶), with the ITTC-1978 full-scale section-drag correction, in two modes:
 *   point  — KT, KQ, η_O, thrust, torque and power at a given J (from V_A and n), P/D, A_E/A_0, Z;
 *   design — optimum P/D and rpm for a required thrust and a given diameter (maximum η_O on KT = K J²), plus Keller.
 * Schema units: SI — m, m/s, N, N·m, W, rpm.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** KT polynomial: [C, s (J), t (P/D), u (A_E/A_0), v (Z)] — Oosterveld & van Oossanen 1975, 39 terms. */
export const KT_TERMS = [
  [0.00880496, 0, 0, 0, 0], [-0.204554, 1, 0, 0, 0], [0.166351, 0, 1, 0, 0], [0.158114, 0, 2, 0, 0], [-0.147581, 2, 0, 1, 0],
  [-0.481497, 1, 1, 1, 0], [0.415437, 0, 2, 1, 0], [0.0144043, 0, 0, 0, 1], [-0.0530054, 2, 0, 0, 1], [0.0143481, 0, 1, 0, 1],
  [0.0606826, 1, 1, 0, 1], [-0.0125894, 0, 0, 1, 1], [0.0109689, 1, 0, 1, 1], [-0.133698, 0, 3, 0, 0], [0.00638407, 0, 6, 0, 0],
  [-0.00132718, 2, 6, 0, 0], [0.168496, 3, 0, 1, 0], [-0.0507214, 0, 0, 2, 0], [0.0854559, 2, 0, 2, 0], [-0.0504475, 3, 0, 2, 0],
  [0.010465, 1, 6, 2, 0], [-0.00648272, 2, 6, 2, 0], [-0.00841728, 0, 3, 0, 1], [0.0168424, 1, 3, 0, 1], [-0.00102296, 3, 3, 0, 1],
  [-0.0317791, 0, 3, 1, 1], [0.018604, 1, 0, 2, 1], [-0.00410798, 0, 2, 2, 1], [-0.000606848, 0, 0, 0, 2], [-0.0049819, 1, 0, 0, 2],
  [0.0025983, 2, 0, 0, 2], [-0.000560528, 3, 0, 0, 2], [-0.00163652, 1, 2, 0, 2], [-0.000328787, 1, 6, 0, 2], [0.000116502, 2, 6, 0, 2],
  [0.000690904, 0, 0, 1, 2], [0.00421749, 0, 3, 1, 2], [0.0000565229, 3, 6, 1, 2], [-0.00146564, 0, 3, 2, 2],
];

/** KQ polynomial, 47 terms. */
export const KQ_TERMS = [
  [0.00379368, 0, 0, 0, 0], [0.00886523, 2, 0, 0, 0], [-0.032241, 1, 1, 0, 0], [0.00344778, 0, 2, 0, 0], [-0.0408811, 0, 1, 1, 0],
  [-0.108009, 1, 1, 1, 0], [-0.0885381, 2, 1, 1, 0], [0.188561, 0, 2, 1, 0], [-0.00370871, 1, 0, 0, 1], [0.00513696, 0, 1, 0, 1],
  [0.0209449, 1, 1, 0, 1], [0.00474319, 2, 1, 0, 1], [-0.00723408, 2, 0, 1, 1], [0.00438388, 1, 1, 1, 1], [-0.0269403, 0, 2, 1, 1],
  [0.0558082, 3, 0, 1, 0], [0.0161886, 0, 3, 1, 0], [0.00318086, 1, 3, 1, 0], [0.015896, 0, 0, 2, 0], [0.0471729, 1, 0, 2, 0],
  [0.0196283, 3, 0, 2, 0], [-0.0502782, 0, 1, 2, 0], [-0.030055, 3, 1, 2, 0], [0.0417122, 2, 2, 2, 0], [-0.0397722, 0, 3, 2, 0],
  [-0.00350024, 0, 6, 2, 0], [-0.0106854, 3, 0, 0, 1], [0.00110903, 3, 3, 0, 1], [-0.000313912, 0, 6, 0, 1], [0.0035985, 3, 0, 1, 1],
  [-0.00142121, 0, 6, 1, 1], [-0.00383637, 1, 0, 2, 1], [0.0126803, 0, 2, 2, 1], [-0.00318278, 2, 3, 2, 1], [0.00334268, 0, 6, 2, 1],
  [-0.00183491, 1, 1, 0, 2], [0.000112451, 3, 2, 0, 2], [-0.0000297228, 3, 6, 0, 2], [0.000269551, 1, 0, 1, 2], [0.00083265, 2, 0, 1, 2],
  [0.00155334, 0, 2, 1, 2], [0.000302683, 0, 6, 1, 2], [-0.0001843, 0, 0, 2, 2], [-0.000425399, 0, 3, 2, 2], [0.0000869243, 3, 3, 2, 2],
  [-0.0004659, 0, 6, 2, 2], [0.0000554194, 1, 6, 2, 2],
];

/** Static pressure minus vapour pressure at the free surface, sea water 15 °C (Holtrop & Mennen 1982), Pa. */
export const P0_MINUS_PV_PA = 99047;

export const schema = {
  id: 'propeller-bseries',
  name: 'Wageningen B-series propeller',
  category: 'maritime',
  summary: 'Wageningen B-series KT, KQ and efficiency from the 1975 polynomials at a given J, or the optimum pitch ratio and rpm for a thrust and diameter; Keller check.',
  related: ['holtrop-mennen', 'propeller-slip', 'shaft-torque', 'admiralty-coefficient'],
  sendTo: [
    {
      target: 'shaft-torque',
      label: 'Propeller shaft torque and diameter',
      note: 'Delivered power and rpm at the propeller; enter the shaft dimensions and material there.',
      links: [
        { to: 'power_w', from: 'delivered_power_w' },
        { to: 'speed_rpm', from: 'n_out_rpm' },
      ],
    },
  ],
  assumptions: [
    'The polynomials (39 KT and 47 KQ terms in J, P/D, A_E/A_0 and Z) are the Oosterveld & van Oossanen (1975) regression of the 120 B-series models at Rn = 2·10⁶; validity Z 2–7, A_E/A_0 0.30–1.05, P/D 0.5–1.4, J ≥ 0; Helma (2019) shows unphysical behaviour at high P/D with few blades, so results near the edges deserve a check against the published diagrams.',
    'Full-scale correction by the ITTC-1978 section-drag method as used in Holtrop & Mennen (1982): ΔC_D = (2 + 4 t/c)[0.003605 − (1.89 + 1.62 log10(c/k_p))^−2.5] with chord c_0.75 = 2.073 (A_E/A_0) D/Z, t/c = (0.0185 − 0.00125 Z) D/c, blade roughness k_p = 30 µm; ΔKT = +0.3 ΔC_D (P/D) cZ/D, ΔKQ = −0.25 ΔC_D cZ/D. The model values are also reported.',
    'Open water only: the propeller works behind the hull in a wake, so the speed of advance V_A = V (1 − w) must be entered and the relative-rotative efficiency and thrust deduction come from the hull (Holtrop–Mennen calculator).',
    'Design mode maximises open-water efficiency for the given diameter: for each P/D the operating J solves KT(J) = (T/(ρ V_A² D²)) J², and the P/D with the highest η_O is taken; the diameter is not optimised (a larger diameter at lower rpm is usually better until clearance limits).',
    'Cavitation is only screened with Keller\'s formula A_E/A_0 ≥ K + (1.3 + 0.3 Z) T/(D² (p_0 − p_v + ρ g h)) with p_0 − p_v = 99 047 Pa (15 °C sea water); K = 0.2 single screw, 0–0.1 twin screw. A proper check needs a cavitation diagram (Burrill) or lifting-line analysis.',
    'Standard B-series geometry: 15° rake, blade outlines and thickness of the series; skewed or tip-modified modern propellers differ by a few per cent in KQ.',
  ],
  notes: [
    'Verification 2026-10-30: coefficient table checked term by term against two independent copies of the 1975 table (Fossen\'s Marine Systems Simulator WageningData.txt and the UMich Lie-MPC-AMVs copy); the Holtrop & Mennen (1982) example propeller (Z 4, A_E/A_0 0.7393 from Keller, D 8 m, V_A 9.538 m/s, T 2172.75 kN) is reproduced to about 1 %: ΔC_D 0.000956, c_0.75 3.065 m and t/c 0.03524 exactly; at the paper\'s operating point (n 1.6594 Hz, KT 0.18802) the polynomials give KQ 0.03296 (paper 0.033275, −0.95 %) and η_O 0.6523 (paper 0.6461); because the efficiency curve is flat (0.648–0.652 for P/D 0.90–1.10) the design optimum lands at P/D 1.017 and 1.683 Hz instead of the paper\'s ≈ 1.037 and 1.659 Hz — a 1.4 % rpm difference with the same thrust.',
    'Design decision: the ITTC-1978 ΔC_D route is used for scale effects instead of the 1975 paper\'s Reynolds-number correction polynomials, because it is what the Holtrop example uses and it needs only the blade roughness.',
    'Design decision: the P/D search is a coarse 0.01 sweep refined to 0.001 around the best value; J is solved by bisection on a function that is monotone in J.',
  ],
  sources: [
    'M. W. C. Oosterveld & P. van Oossanen, "Further computer-analyzed data of the Wageningen B-screw series", International Shipbuilding Progress 22 (251), 1975 — the KT/KQ polynomials',
    'M. M. Bernitsas, D. Ray & P. Kinley, "KT, KQ and efficiency curves for the Wageningen B-series propellers", Univ. of Michigan report 237 (1981); T. I. Fossen, Marine Systems Simulator (github.com/cybergalactic/MSS, WageningData.txt) — reproductions of the table',
    'J. Holtrop & G. G. J. Mennen, "An approximate power prediction method", ISP 29 (1982) — ITTC-1978 propeller scale correction, Keller formula, numerical example',
    'J. S. Carlton, Marine Propellers and Propulsion, 4th ed. (2019) §6.5.1 Table 6.6; S. Helma, "Surprising behaviour of the Wageningen B-screw series polynomials", smp\'19 — validity caveats',
  ],
  inputs: [
    { id: 'mode', label: 'Find', type: 'select', default: 'design', options: [{ value: 'design', label: 'Optimum P/D and rpm for a required thrust (given diameter)' }, { value: 'point', label: 'Open-water point for a given P/D and rpm' }] },
    { id: 'blades', label: 'Number of blades Z', group: 'dimensionless', unit: 'none', default: 4, min: 2, max: 7, integer: true },
    { id: 'ae_a0', label: 'Expanded blade area ratio A_E/A_0', group: 'dimensionless', unit: 'none', default: 0.7393, min: 0.3, max: 1.05 },
    { id: 'diameter_m', label: 'Propeller diameter D', group: 'length', unit: 'm', default: 8, min: 0.1, max: 12 },
    { id: 'va_m_s', label: 'Speed of advance V_A = V (1 − w)', group: 'speed', unit: 'm_s', default: 9.538, min: 0.1, max: 30 },
    { id: 'rho_kg_m3', label: 'Water density ρ', group: 'density', unit: 'kg_m3', default: 1025, min: 990, max: 1040 },
    { id: 'scale', label: 'Scale effect', type: 'select', default: 'full', options: [{ value: 'full', label: 'Full scale — ITTC-1978 section-drag correction' }, { value: 'model', label: 'Model scale (Rn 2·10⁶) — raw polynomials' }] },
    { id: 'kp_um', label: 'Blade surface roughness k_p', group: 'dimensionless', unit: 'none', default: 30, min: 5, max: 300, visibleWhen: { scale: 'full' }, help: 'µm; 30 µm is the ITTC-1978 standard for a new propeller.' },
    { id: 'pd_ratio', label: 'Pitch ratio P/D', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.5, max: 1.4, visibleWhen: { mode: 'point' } },
    { id: 'n_rpm', label: 'Shaft speed n', group: 'rotational_speed', unit: 'rpm', default: 99.56, min: 1, max: 5000, visibleWhen: { mode: 'point' } },
    { id: 'thrust_n', label: 'Required thrust T = R_T/(1 − t)', group: 'force', unit: 'N', display: 'kN', default: 2172750, min: 1, max: 1e8, visibleWhen: { mode: 'design' } },
    { id: 'immersion_m', label: 'Shaft centreline immersion h (Keller)', group: 'length', unit: 'm', default: 5.8, min: 0.05, max: 30, visibleWhen: { mode: 'design' } },
    { id: 'keller_k', label: 'Keller constant K', group: 'dimensionless', unit: 'none', default: 0.2, min: 0, max: 0.3, visibleWhen: { mode: 'design' }, help: '0.2 single screw; 0–0.1 twin screw.' },
  ],
  outputs: [
    { id: 'j_out', label: 'Advance coefficient J = V_A/(n D)', group: 'dimensionless', unit: 'none' },
    { id: 'pd_out', label: 'Pitch ratio P/D', group: 'dimensionless', unit: 'none' },
    { id: 'n_out_rpm', label: 'Shaft speed n', group: 'rotational_speed', unit: 'rpm' },
    { id: 'kt', label: 'Thrust coefficient KT (at scale chosen)', group: 'dimensionless', unit: 'none' },
    { id: 'kq', label: 'Torque coefficient KQ', group: 'dimensionless', unit: 'none' },
    { id: 'eta_o', label: 'Open-water efficiency η_O = J KT/(2π KQ)', group: 'dimensionless', unit: 'none' },
    { id: 'kt_model', label: 'KT from the polynomials (Rn 2·10⁶)', group: 'dimensionless', unit: 'none' },
    { id: 'kq_model', label: 'KQ from the polynomials (Rn 2·10⁶)', group: 'dimensionless', unit: 'none' },
    { id: 'thrust_out_n', label: 'Thrust T = KT ρ n² D⁴', group: 'force', unit: 'N', display: 'kN' },
    { id: 'torque_n_m', label: 'Torque Q = KQ ρ n² D⁵', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'delivered_power_w', label: 'Delivered power P_D = 2π n Q', group: 'power', unit: 'W', display: 'kW' },
    { id: 'thrust_power_w', label: 'Thrust power P_T = T V_A', group: 'power', unit: 'W', display: 'kW' },
    { id: 'chord_m', label: 'Chord at 0.75 R (c = 2.073 A_E/A_0 D/Z)', group: 'length', unit: 'm' },
    { id: 'tc_ratio', label: 'Thickness/chord at 0.75 R', group: 'dimensionless', unit: 'none' },
    { id: 'dcd', label: 'Section drag difference ΔC_D (model − ship)', group: 'dimensionless', unit: 'none' },
    { id: 'keller_ae_a0', label: 'Keller minimum A_E/A_0 for the thrust and immersion', group: 'dimensionless', unit: 'none' },
    { id: 'keller_status', label: 'Cavitation screen (Keller)', type: 'text' },
    { id: 'tip_speed_m_s', label: 'Blade tip speed π n D', group: 'speed', unit: 'm_s' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      chord_m: '3.065 m',
      tc_ratio: '0.0352',
      dcd: '0.000956',
      keller_ae_a0: '0.739',
    },
  },
};

function polynomial(terms, J, pd, ae, z) {
  let sum = 0;
  for (const [c, s, t, u, v] of terms) sum += c * J ** s * pd ** t * ae ** u * z ** v;
  return sum;
}

/** KT at Rn 2·10⁶. */
export function ktPolynomial(J, pd, ae, z) {
  return polynomial(KT_TERMS, J, pd, ae, z);
}

/** KQ at Rn 2·10⁶. */
export function kqPolynomial(J, pd, ae, z) {
  return polynomial(KQ_TERMS, J, pd, ae, z);
}

/** ITTC-1978 blade section drag correction (Holtrop & Mennen 1982 form). */
export function ittcCorrection(z, ae, diameterM, kpM) {
  const chord = (2.073 * ae * diameterM) / z;
  const tc = ((0.0185 - 0.00125 * z) * diameterM) / chord;
  const dcd = (2 + 4 * tc) * (0.003605 - (1.89 + 1.62 * Math.log10(chord / kpM)) ** -2.5);
  return { chord, tc, dcd, czd: (chord * z) / diameterM };
}

/** KT, KQ, η_O at J for the propeller, with the scale correction when `corr` is given. */
export function openWater(J, pd, ae, z, corr) {
  const ktModel = ktPolynomial(J, pd, ae, z);
  const kqModel = kqPolynomial(J, pd, ae, z);
  const kt = corr ? ktModel + 0.3 * corr.dcd * pd * corr.czd : ktModel;
  const kq = corr ? kqModel - 0.25 * corr.dcd * corr.czd : kqModel;
  const eta = kq > 0 && J > 0 ? (J * kt) / (2 * Math.PI * kq) : 0;
  return { kt, kq, eta, ktModel, kqModel };
}

/** J where KT(J) = K J² (thrust loading identity), by bisection; null when no positive thrust at J = 0. */
export function solveAdvanceCoefficient(K, pd, ae, z, corr) {
  const f = (J) => openWater(J, pd, ae, z, corr).kt - K * J * J;
  if (f(0) <= 0) return null;
  let lo = 0;
  let hi = 2.5;
  if (f(hi) > 0) return null;
  for (let k = 0; k < 80; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Optimum P/D (max η_O) for the thrust-loading constant K: coarse sweep then refinement. */
export function optimumPitchRatio(K, ae, z, corr) {
  let best = null;
  const evaluate = (pd) => {
    const J = solveAdvanceCoefficient(K, pd, ae, z, corr);
    if (J === null) return;
    const ow = openWater(J, pd, ae, z, corr);
    if (!best || ow.eta > best.eta) best = { pd, J, ...ow };
  };
  for (let pd = 0.5; pd <= 1.4001; pd += 0.01) evaluate(Number(pd.toFixed(2)));
  if (!best) return null;
  const centre = best.pd;
  for (let pd = centre - 0.01; pd <= centre + 0.01001; pd += 0.001) if (pd >= 0.5 && pd <= 1.4) evaluate(Number(pd.toFixed(3)));
  return best;
}

/** Keller minimum blade area ratio for Z blades. */
export function kellerWithZ(thrustN, diameterM, immersionM, rho, K, z) {
  return K + ((1.3 + 0.3 * z) * thrustN) / (diameterM * diameterM * (P0_MINUS_PV_PA + rho * 9.80665 * immersionM));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['design', 'point'], 'mode', 'Find');
  assertOneOf(i.scale, ['full', 'model'], 'scale', 'Scale effect');
  assertInteger(i.blades, 'blades', 'Number of blades');
  assertRange(i.blades, 2, 7, 'blades', 'Number of blades');
  assertRange(i.ae_a0, 0.3, 1.05, 'ae_a0', 'Blade area ratio');
  assertPositive(i.diameter_m, 'diameter_m', 'Diameter');
  assertPositive(i.va_m_s, 'va_m_s', 'Speed of advance');
  assertPositive(i.rho_kg_m3, 'rho_kg_m3', 'Density');
  const corr = i.scale === 'full' ? ittcCorrection(i.blades, i.ae_a0, i.diameter_m, assertPositive(i.kp_um, 'kp_um', 'Blade roughness') * 1e-6) : null;
  const geometry = ittcCorrection(i.blades, i.ae_a0, i.diameter_m, 30e-6);
  const rho = i.rho_kg_m3;
  const D = i.diameter_m;
  const VA = i.va_m_s;

  let J;
  let pd;
  let n;
  let ow;
  let keller = null;
  let kellerStatus = 'Not screened in open-water point mode (enter the thrust in design mode)';
  const warnings = [];
  if (i.mode === 'point') {
    pd = assertRange(i.pd_ratio, 0.5, 1.4, 'pd_ratio', 'Pitch ratio');
    n = assertPositive(i.n_rpm, 'n_rpm', 'Shaft speed') / 60;
    J = VA / (n * D);
    ow = openWater(J, pd, i.ae_a0, i.blades, corr);
    if (ow.kt <= 0) warnings.push('KT ≤ 0: the propeller is windmilling (J beyond the zero-thrust advance ratio).');
  } else {
    const T = assertPositive(i.thrust_n, 'thrust_n', 'Thrust');
    assertPositive(i.immersion_m, 'immersion_m', 'Immersion');
    assertRange(i.keller_k, 0, 0.5, 'keller_k', 'Keller constant');
    const K = T / (rho * VA * VA * D * D);
    const best = optimumPitchRatio(K, i.ae_a0, i.blades, corr);
    if (!best) throw new Error(`No B-series propeller of this diameter produces the thrust at V_A ${VA} m/s (thrust loading K = ${K.toFixed(3)} too high): increase the diameter or blade area`);
    pd = best.pd;
    J = best.J;
    n = VA / (J * D);
    ow = best;
    keller = kellerWithZ(T, D, i.immersion_m, rho, i.keller_k, i.blades);
    kellerStatus = i.ae_a0 + 1e-4 >= keller ? `OK — A_E/A_0 ${i.ae_a0.toFixed(3)} ≥ Keller minimum ${keller.toFixed(3)}` : `INSUFFICIENT — Keller needs A_E/A_0 ≥ ${keller.toFixed(3)} against ${i.ae_a0.toFixed(3)}: cavitation risk, increase the blade area`;
    if (i.ae_a0 + 1e-4 < keller) warnings.push('Blade area below the Keller minimum for this thrust and immersion: cavitation likely; increase A_E/A_0 and recompute (efficiency falls slightly).');
    if (pd >= 1.39) warnings.push('Optimum at the upper P/D limit of the series (1.4): the propeller is lightly loaded — a smaller diameter or higher rpm may be intended.');
    if (pd <= 0.51) warnings.push('Optimum at the lower P/D limit (0.5): heavily loaded — a larger diameter would help.');
  }
  if (i.blades <= 3 && pd > 1.2) warnings.push('High P/D with few blades: Helma (2019) shows the 1975 polynomials misbehave here; check against the open-water diagrams.');
  if (corr) warnings.push(`Full-scale correction applied: ΔC_D = ${corr.dcd.toExponential(3)} (ITTC-1978, k_p ${i.kp_um} µm); model values shown separately.`);
  warnings.push('Open-water values: behind the hull multiply by η_R and use V_A = V (1 − w); cavitation is only screened by Keller\'s formula.');

  const thrust = ow.kt * rho * n * n * D ** 4;
  const torque = ow.kq * rho * n * n * D ** 5;
  return {
    outputs: {
      j_out: J,
      pd_out: pd,
      n_out_rpm: n * 60,
      kt: ow.kt,
      kq: ow.kq,
      eta_o: ow.eta,
      kt_model: ow.ktModel,
      kq_model: ow.kqModel,
      thrust_out_n: thrust,
      torque_n_m: torque,
      delivered_power_w: 2 * Math.PI * n * torque,
      thrust_power_w: thrust * VA,
      chord_m: geometry.chord,
      tc_ratio: geometry.tc,
      dcd: corr ? corr.dcd : null,
      keller_ae_a0: keller,
      keller_status: kellerStatus,
      tip_speed_m_s: Math.PI * n * D,
    },
    warnings,
  };
}
