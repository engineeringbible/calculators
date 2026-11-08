/**
 * holtrop-mennen/calc.js — calm-water resistance and power by the Holtrop & Mennen statistical method.
 *
 * Two variants: the original Holtrop & Mennen (1982, ISP vol. 29) and the Holtrop (1984, ISP vol. 31) re-analysis
 * (new form factor, m4 hump coefficient, high-speed wave resistance R_W-B with interpolation 0.40 < Fn < 0.55).
 * R_T = R_F (1+k1) + R_APP + R_W + R_B + R_TR + R_A;  P_E = R_T V;  P_D = P_E / (η_H η_R η_O);  P_S = P_D / η_S.
 * Schema units: SI — m, m², m³, kn, N, W; lcb in % of L_WL forward of ½L_WL (negative aft).
 */
import { GRAVITY_M_S2, toBase } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const KNOT_M_S = toBase(1, 'kn', 'speed'); // 1852/3600 m/s, from shared/units.js

export const STERN_TYPES = {
  pram: { label: 'Pram with gondola (C_stern −25, 1984 only)', cstern: -25 },
  v_shaped: { label: 'V-shaped sections (C_stern −10)', cstern: -10 },
  normal: { label: 'Normal section shape (C_stern 0)', cstern: 0 },
  u_hogner: { label: 'U-shaped sections with Hogner stern (C_stern +10)', cstern: 10 },
};

export const schema = {
  id: 'holtrop-mennen',
  name: 'Holtrop–Mennen resistance and power',
  category: 'maritime',
  summary: 'Holtrop–Mennen (1982/1984) resistance components, effective and brake power, wake fraction and thrust deduction from main particulars.',
  related: ['propeller-bseries', 'admiralty-coefficient', 'fuel-voyage-cost', 'propeller-slip'],
  sendTo: [
    {
      target: 'propeller-bseries',
      label: 'Design the propeller (B-series)',
      note: 'Design mode finds the pitch ratio and rpm for the thrust per propeller at the speed of advance; check the blade number and the shaft immersion there.',
      links: [
        { to: 'mode', value: 'design' },
        { to: 'thrust_n', from: 'thrust_per_prop_n' },
        { to: 'va_m_s', from: 'advance_speed_m_s' },
        { to: 'diameter_m', from: 'input:prop_d_m' },
        { to: 'ae_a0', from: 'input:ae_a0' },
        { to: 'rho_kg_m3', from: 'input:rho_kg_m3' },
      ],
    },
    {
      target: 'hull-roughness-penalty',
      label: 'Hull roughness and fouling penalty',
      note: 'Uses the waterline length as L_PP and the delivered power and η_D at this speed; set the sea temperature and the fouling condition there.',
      links: [
        { to: 'lpp_m', from: 'input:lwl_m' },
        { to: 'wetted_surface_m2', from: 'wetted_area_m2' },
        { to: 'speed_kn', from: 'input:speed_kn' },
        { to: 'form_factor', from: 'form_factor' },
        { to: 'ks_clean_um', from: 'input:roughness_um', raw: true },
        { to: 'resistance_mode', value: 'power' },
        { to: 'delivered_power_kw', from: 'pd_w' },
        { to: 'eta_d', from: 'eta_d' },
      ],
    },
    {
      target: 'water-temperature-correction',
      label: 'Water temperature and density correction (ISO 15016 Annex E)',
      note: 'The delivered power at this speed becomes the reference; enter the actual sea temperature and salinity there.',
      links: [
        { to: 'lpp_m', from: 'input:lwl_m' },
        { to: 'wetted_surface_m2', from: 'wetted_area_m2' },
        { to: 'speed_kn', from: 'input:speed_kn' },
        { to: 'ks_um', from: 'input:roughness_um', raw: true },
        { to: 'ref_mode', value: 'power' },
        { to: 'ref_power_kw', from: 'pd_w' },
        { to: 'eta_d', from: 'eta_d' },
      ],
    },
    {
      target: 'shallow-water-speed',
      label: 'Shallow-water power increase and speed loss',
      note: 'Hull particulars, the deep-water delivered power and η_D at this speed; enter the water depth there.',
      links: [
        { to: 'lpp_m', from: 'input:lwl_m' },
        { to: 'beam_m', from: 'input:beam_m' },
        { to: 'draft_m', from: 'draft_mean_m' },
        { to: 'cb', from: 'cb' },
        { to: 'cm', from: 'input:cm' },
        { to: 'cwp', from: 'input:cwp' },
        { to: 'wetted_surface_m2', from: 'wetted_area_m2' },
        { to: 'speed_kn', from: 'input:speed_kn' },
        { to: 'ks_um', from: 'input:roughness_um', raw: true },
        { to: 'delivered_power_kw', from: 'pd_w' },
        { to: 'eta_d', from: 'eta_d' },
      ],
    },
  ],
  assumptions: [
    'Statistical regression method (334 models and 168 full-scale trials in the 1984 sample): valid for hull forms resembling the sample — roughly Cp 0.55–0.85, L/B 3.9–15, B/T 2.1–4.0, Fn below about 0.45 for the 1982 formulae and up to 0.8 for the 1984 high-speed formula — and uncertain to ±5–10 % even inside the range; outside it the formulas extrapolate and the page warns.',
    'ITTC-1957 friction line C_F = 0.075/(log10 Rn − 2)² with the viscosity and density entered (defaults: sea water 15 °C, ν = 1.18831·10⁻⁶ m²/s, ρ = 1025 kg/m³); the form factor 1+k1 multiplies R_F only, and the appendage resistance uses the same C_F with an equivalent 1+k2 from the paper\'s table (rudder behind stern 1.3–1.5, bilge keels 1.4, shaft brackets 3.0).',
    'Wave resistance: the 1982 formula uses m2 = c15 Cp² exp(−0.1 Fn⁻²); the 1984 re-analysis replaces it with m4 = 0.4 c15 exp(−0.034 Fn^−3.29) for Fn ≤ 0.40, uses the Series-64 based R_W-B (c17, m3) for Fn ≥ 0.55 and interpolates linearly between — the interpolation is described in the paper as "more or less arbitrary".',
    'Bulb and transom terms follow the 1982 paper unchanged (the 1984 paper made no new analysis); the 1984 variant caps the bulb centre height h_B at 0.6 T_F as the paper recommends. With A_BT = 0 or A_T = 0 the terms vanish.',
    'Correlation allowance C_A (1982 trial-based formula, 150 µm hull roughness) with the roughness increase (0.105 k_s^(1/3) − 0.005579)/L^(1/3) for rougher hulls; the 1984 paper notes new ships average 91 % of this C_A but recommends keeping the formula. Still-air resistance is inside C_A; wind, waves, shallow water and fouling are not included.',
    'Propulsion factors: single-screw conventional-stern wake and thrust deduction from the chosen variant (1982: c8–c11 formula; 1984: c19/c20 formula), relative-rotative efficiency 0.9922 − 0.05908 A_E/A_0 + 0.07424 (Cp − 0.0225 lcb); twin-screw formulas from 1982. The open-water efficiency η_O is an input (use the B-series calculator), shaft efficiency 0.99 by default; P_S is the shaft power at ideal trial conditions.',
    'lcb is the longitudinal centre of buoyancy forward of ½L_WL in % of L_WL (negative aft). The paper\'s example prints −2.02 % relative to ½L_PP; in the formulas it enters as −0.75 % of L_WL, which is the value that reproduces every printed intermediate (L_R 81.385 m, C_P1 0.5477).',
  ],
  notes: [
    'Verification 2026-10-30, corrected 2026-10-31: the 1982 variant reproduces the numerical example of the paper (L 205 m, 25 kn) within rounding on 1+k1 1.156, S 7381.45 m², C_F 0.001390, R_F 869.63 kN, R_APP 8.83 kN, i_E 12.08°, c1 1.398, c2 0.7595, c5 0.9592, λ 0.6513, m1 −2.1274, m2 −0.17087, P_B 0.6261, R_B 0.049 kN, Fn_T 5.433, C_A 0.000352, w 0.2584, t 0.1747 and η_R 0.9931. It does not reproduce the printed R_A: 220.57 kN against 221.98 kN (−0.6 %). The printed figure equals ½ρV² C_A over S + S_APP (222.07 kN), so the paper appears to apply C_A to the appendage area as well, while this calculator follows the formula R_A = ½ρV² S C_A. With R_W 556.95 kN (printed 557.11) the totals are R_T 1792.10 kN (1793.26), P_E 23 048 kW (23 063), thrust 2171.3 kN (2172.75) and P_S 32 619 kW (32 621) with η_O 0.6461, all within 0.07 %.',
    'Article check 2026-10-31 (schema.example): the worked example of content.md had printed the figures of the paper instead of the results of this calculator, and R_F(1+k1) 1 005 instead of 1 006 kN, η_H 1.113 instead of 1.112, and a rise of about 3 % instead of 1.2 % in total resistance for the 1984 variant; corrected, with the difference to the paper explained there.',
    'Formulas transcribed from the OCR text of both papers (ISP 29 pp. 166–170 and ISP 31 pp. 272–276, fetched 2026-10-30); every coefficient was cross-checked against the reproduced example or against standard reproductions (Birk 2019 ch. 50, Molland et al. 2017).',
    'Design decision: both variants are offered because most textbooks and codes use the 1982 form factor with the 1984 wave resistance; here each variant is internally consistent with its paper. For the example ship the 1984 form factor is 2.5 % higher (1.185 vs 1.156).',
    'Design decision: wake, thrust deduction and η_R are reported as information and used for P_D; η_O must be supplied (default 0.62) because the propeller is not designed here — the B-series calculator does that.',
  ],
  sources: [
    'J. Holtrop & G. G. J. Mennen, "An approximate power prediction method", International Shipbuilding Progress 29 (335), 1982, pp. 166–170 (formulas and the numerical example)',
    'J. Holtrop, "A statistical re-analysis of resistance and propulsion data", International Shipbuilding Progress 31 (363), 1984, pp. 272–276',
    'ITTC-1957 model-ship correlation line and ITTC-1978 performance prediction method (15th ITTC, 1978) — friction line, roughness allowance',
    'L. Birk, Fundamentals of Ship Hydrodynamics (Wiley 2019) ch. 50; A. F. Molland, S. R. Turnock & D. A. Hudson, Ship Resistance and Propulsion (CUP, 2nd ed. 2017) ch. 10 — standard reproductions used for cross-checking',
  ],
  inputs: [
    { id: 'variant', label: 'Method variant', type: 'select', default: 'hm1984', options: [{ value: 'hm1984', label: 'Holtrop 1984 re-analysis (new form factor, m4, high-speed R_W-B)' }, { value: 'hm1982', label: 'Holtrop & Mennen 1982 original' }] },
    { id: 'lwl_m', label: 'Length on the waterline L', group: 'length', unit: 'm', default: 205, min: 5, max: 500 },
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 32, min: 1, max: 80 },
    { id: 'draft_fwd_m', label: 'Draught forward T_F', group: 'length', unit: 'm', default: 10, min: 0.3, max: 30 },
    { id: 'draft_aft_m', label: 'Draught aft T_A', group: 'length', unit: 'm', default: 10, min: 0.3, max: 30 },
    { id: 'displacement_m3', label: 'Displacement volume ∇', group: 'volume', unit: 'm3', default: 37500, min: 1, max: 1e6 },
    { id: 'lcb_pct', label: 'lcb forward of ½L_WL (% of L, negative aft)', group: 'ratio', unit: 'pct', default: -0.75, min: -10, max: 10 },
    { id: 'cm', label: 'Midship section coefficient C_M', group: 'dimensionless', unit: 'none', default: 0.98, min: 0.5, max: 1 },
    { id: 'cwp', label: 'Waterplane area coefficient C_WP', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.5, max: 0.99 },
    { id: 'abt_m2', label: 'Transverse bulb area A_BT at the stem (0 = no bulb)', group: 'area', unit: 'm2', default: 20, min: 0, max: 500 },
    { id: 'hb_m', label: 'Centre of bulb area above keel h_B', group: 'length', unit: 'm', default: 4, min: 0, max: 20 },
    { id: 'at_m2', label: 'Immersed transom area A_T (0 = none)', group: 'area', unit: 'm2', default: 16, min: 0, max: 500 },
    { id: 'sapp_m2', label: 'Wetted area of appendages S_APP', group: 'area', unit: 'm2', default: 50, min: 0, max: 5000 },
    { id: 'k2_app', label: 'Equivalent appendage factor 1+k2', group: 'dimensionless', unit: 'none', default: 1.5, min: 1, max: 4, help: 'Rudder behind stern 1.3–1.5, behind skeg 1.5–2.0, bilge keels 1.4, shaft brackets 3.0, shafts 2.0–4.0.' },
    { id: 'thruster_d_m', label: 'Bow thruster tunnel diameter (0 = none)', group: 'length', unit: 'm', default: 0, min: 0, max: 5 },
    { id: 'stern_type', label: 'Afterbody form', type: 'select', default: 'u_hogner', options: Object.entries(STERN_TYPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'ie_mode', label: 'Half angle of entrance i_E', type: 'select', default: 'estimate', options: [{ value: 'estimate', label: 'Estimate from the hull coefficients (regression)' }, { value: 'given', label: 'Enter a known value' }] },
    { id: 'ie_deg', label: 'Half angle of entrance i_E', group: 'angle', unit: 'deg', default: 12, min: 1, max: 89, visibleWhen: { ie_mode: 'given' } },
    { id: 'speed_kn', label: 'Ship speed V', group: 'speed', unit: 'kn', default: 25, min: 0.1, max: 60 },
    { id: 'rho_kg_m3', label: 'Water density ρ', group: 'density', unit: 'kg_m3', default: 1025, min: 990, max: 1040 },
    { id: 'nu_m2_s', label: 'Kinematic viscosity ν', group: 'kinematic_viscosity', unit: 'm2_s', default: 1.18831e-6, min: 5e-7, max: 2e-6, help: 'Sea water 15 °C 1.18831·10⁻⁶; fresh water 15 °C 1.1390·10⁻⁶ m²/s.' },
    { id: 'roughness_um', label: 'Hull roughness k_s (150 µm standard)', group: 'dimensionless', unit: 'none', default: 150, min: 50, max: 1000 },
    { id: 'arrangement', label: 'Propulsion arrangement', type: 'select', default: 'single', options: [{ value: 'single', label: 'Single screw, conventional stern' }, { value: 'twin', label: 'Twin screw' }] },
    { id: 'prop_d_m', label: 'Propeller diameter D', group: 'length', unit: 'm', default: 8, min: 0.2, max: 12 },
    { id: 'ae_a0', label: 'Blade area ratio A_E/A_0', group: 'dimensionless', unit: 'none', default: 0.7393, min: 0.3, max: 1.1 },
    { id: 'pd_ratio', label: 'Pitch ratio P/D (twin-screw η_R only)', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.5, max: 1.6, visibleWhen: { arrangement: 'twin' } },
    { id: 'eta_o', label: 'Propeller open-water efficiency η_O', group: 'dimensionless', unit: 'none', default: 0.62, min: 0.3, max: 0.8 },
    { id: 'eta_s', label: 'Shaft (transmission) efficiency η_S', group: 'dimensionless', unit: 'none', default: 0.99, min: 0.9, max: 1 },
  ],
  outputs: [
    { id: 'speed_m_s', label: 'Speed', group: 'speed', unit: 'm_s' },
    { id: 'draft_mean_m', label: 'Mean draft T = (T_F + T_A)/2', group: 'length', unit: 'm' },
    { id: 'fn', label: 'Froude number Fn = V/√(gL)', group: 'dimensionless', unit: 'none' },
    { id: 'cb', label: 'Block coefficient C_B (on L_WL)', group: 'dimensionless', unit: 'none' },
    { id: 'cp', label: 'Prismatic coefficient C_P', group: 'dimensionless', unit: 'none' },
    { id: 'lr_m', label: 'Length of run L_R', group: 'length', unit: 'm' },
    { id: 'form_factor', label: 'Form factor 1+k1', group: 'dimensionless', unit: 'none' },
    { id: 'wetted_area_m2', label: 'Wetted surface S (hull incl. bulb)', group: 'area', unit: 'm2' },
    { id: 'reynolds', label: 'Reynolds number Rn', group: 'dimensionless', unit: 'none' },
    { id: 'cf', label: 'Friction coefficient C_F (ITTC-57)', group: 'dimensionless', unit: 'none' },
    { id: 'rf_n', label: 'Frictional resistance R_F', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rf_form_n', label: 'Viscous resistance R_F (1+k1)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rapp_n', label: 'Appendage resistance R_APP', group: 'force', unit: 'N', display: 'kN' },
    { id: 'ie_out_deg', label: 'Half angle of entrance i_E used', group: 'angle', unit: 'deg' },
    { id: 'rw_n', label: 'Wave resistance R_W', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rb_n', label: 'Bulbous bow pressure resistance R_B', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rtr_n', label: 'Transom pressure resistance R_TR', group: 'force', unit: 'N', display: 'kN' },
    { id: 'ca', label: 'Correlation allowance C_A (incl. roughness)', group: 'dimensionless', unit: 'none' },
    { id: 'ra_n', label: 'Correlation resistance R_A', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rt_n', label: 'Total resistance R_T', group: 'force', unit: 'N', display: 'kN' },
    { id: 'wave_share_pct', label: 'Share of R_W + R_B + R_TR in R_T', group: 'ratio', unit: 'pct' },
    { id: 'pe_w', label: 'Effective power P_E = R_T V', group: 'power', unit: 'W', display: 'kW' },
    { id: 'wake', label: 'Wake fraction w', group: 'dimensionless', unit: 'none' },
    { id: 'thrust_deduction', label: 'Thrust deduction t', group: 'dimensionless', unit: 'none' },
    { id: 'hull_eff', label: 'Hull efficiency η_H = (1−t)/(1−w)', group: 'dimensionless', unit: 'none' },
    { id: 'rotative_eff', label: 'Relative-rotative efficiency η_R', group: 'dimensionless', unit: 'none' },
    { id: 'eta_d', label: 'Quasi-propulsive efficiency η_D = η_H η_R η_O = P_E/P_D', group: 'dimensionless', unit: 'none' },
    { id: 'thrust_n', label: 'Required thrust T = R_T/(1−t)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'thrust_per_prop_n', label: 'Thrust per propeller (T/2 for twin screw)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'advance_speed_m_s', label: 'Speed of advance V_A = V(1−w)', group: 'speed', unit: 'm_s' },
    { id: 'pd_w', label: 'Delivered power P_D = P_E/(η_H η_R η_O)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'ps_w', label: 'Shaft power P_S = P_D/η_S (≈ brake power, direct drive)', group: 'power', unit: 'W', display: 'kW' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      variant: 'hm1982',
      eta_o: 0.6461,
    },
    results: {
      form_factor: '1.156',
      wetted_area_m2: '7 381 m²',
      rf_n: '869.6 kN',
      rf_form_n: '1 006 kN',
      rw_n: '557.0 kN',
      ra_n: '220.6 kN',
      rt_n: '1 792 kN',
      pe_w: '23 048 kW',
      hull_eff: '1.112',
      thrust_n: '2 171 kN',
      ps_w: '32 619 kW',
    },
  },
};

/** Half angle of entrance (degrees) by the 1982 regression. */
export function halfAngleOfEntrance(L, B, CWP, CP, lcb, LR, vol) {
  return 1 + 89 * Math.exp(-((L / B) ** 0.80856) * (1 - CWP) ** 0.30484 * (1 - CP - 0.0225 * lcb) ** 0.6367 * (LR / B) ** 0.34574 * ((100 * vol) / L ** 3) ** 0.16302);
}

/**
 * Every intermediate of the resistance prediction for validated inputs (schema units).
 * @returns {object} coefficients, components in N, powers in W
 */
export function resistanceBreakdown(i) {
  const g = GRAVITY_M_S2;
  const L = i.lwl_m;
  const B = i.beam_m;
  const TF = i.draft_fwd_m;
  const TA = i.draft_aft_m;
  const T = (TF + TA) / 2;
  const vol = i.displacement_m3;
  const lcb = i.lcb_pct;
  const CM = i.cm;
  const CWP = i.cwp;
  const ABT = i.abt_m2;
  const AT = i.at_m2;
  const cstern = STERN_TYPES[i.stern_type].cstern;
  const is1984 = i.variant === 'hm1984';
  const V = i.speed_kn * KNOT_M_S;
  const rho = i.rho_kg_m3;

  const CB = vol / (L * B * T);
  const CP = CB / CM;
  if (CP >= 0.95 || CP < 0.3) throw new Error(`Prismatic coefficient ${CP.toFixed(3)} is outside the method (0.30 ≤ C_P < 0.95): check ∇, L, B, T and C_M`);
  const LR = L * (1 - CP + (0.06 * CP * lcb) / (4 * CP - 1));
  if (LR <= 0) throw new Error('Length of run is not positive: check lcb and C_P');
  const Fn = V / Math.sqrt(g * L);
  if (L / B <= 2) throw new Error(`L/B = ${(L / B).toFixed(2)} is outside the Holtrop–Mennen method: the wave resistance terms need L/B greater than 2`);
  const hB = is1984 ? Math.min(i.hb_m, 0.6 * TF) : i.hb_m;

  // form factor
  let formFactor;
  if (is1984) {
    const c14 = 1 + 0.011 * cstern;
    formFactor = 0.93 + 0.487118 * c14 * (B / L) ** 1.06806 * (T / L) ** 0.46106 * (L / LR) ** 0.121563 * (L ** 3 / vol) ** 0.36486 * (1 - CP) ** -0.604247;
  } else {
    const TL = T / L;
    const c12 = TL > 0.05 ? TL ** 0.2228446 : TL > 0.02 ? 48.2 * (TL - 0.02) ** 2.078 + 0.479948 : 0.479948;
    const c13 = 1 + 0.003 * cstern;
    formFactor = c13 * (0.93 + c12 * (B / LR) ** 0.92497 * (0.95 - CP) ** -0.521448 * (1 - CP + 0.0225 * lcb) ** 0.6906);
  }

  const S = L * (2 * T + B) * Math.sqrt(CM) * (0.453 + 0.4425 * CB - 0.2862 * CM - 0.003467 * (B / T) + 0.3696 * CWP) + (2.38 * ABT) / CB;
  const Rn = (V * L) / i.nu_m2_s;
  const CF = 0.075 / (Math.log10(Rn) - 2) ** 2;
  const q = 0.5 * rho * V * V;
  const RF = q * S * CF;
  const RAPP = q * i.sapp_m2 * i.k2_app * CF + rho * V * V * Math.PI * i.thruster_d_m ** 2 * 0.003;

  // wave resistance
  const BL = B / L;
  const c7 = BL < 0.11 ? 0.229577 * BL ** 0.33333 : BL <= 0.25 ? BL : 0.5 - 0.0625 * (L / B);
  const iE = i.ie_mode === 'given' ? i.ie_deg : halfAngleOfEntrance(L, B, CWP, CP, lcb, LR, vol);
  const c1 = 2223105 * c7 ** 3.78613 * (T / B) ** 1.07961 * (90 - iE) ** -1.37565;
  const c3 = ABT > 0 ? (0.56 * ABT ** 1.5) / (B * T * (0.31 * Math.sqrt(ABT) + TF - hB)) : 0;
  const c2 = Math.exp(-1.89 * Math.sqrt(c3));
  const c5 = 1 - (0.8 * AT) / (B * T * CM);
  const lambda = L / B <= 12 ? 1.446 * CP - 0.03 * (L / B) : 1.446 * CP - 0.36;
  const c16 = CP < 0.8 ? 8.07981 * CP - 13.8673 * CP ** 2 + 6.984388 * CP ** 3 : 1.73014 - 0.7067 * CP;
  const m1 = 0.0140407 * (L / T) - 1.75254 * (vol ** (1 / 3) / L) - 4.79323 * BL - c16;
  const L3V = L ** 3 / vol;
  const c15 = L3V < 512 ? -1.69385 : L3V > 1727 ? 0 : -1.69385 + (L / vol ** (1 / 3) - 8) / 2.36;
  const d = -0.9;
  const base = c2 * c5 * vol * rho * g;
  const rwA = (fn) => {
    const hump = is1984 ? c15 * 0.4 * Math.exp(-0.034 * fn ** -3.29) : c15 * CP * CP * Math.exp(-0.1 * fn ** -2);
    return c1 * base * Math.exp(m1 * fn ** d + hump * Math.cos(lambda * fn ** -2));
  };
  const c17 = 6919.3 * CM ** -1.3346 * (vol / L ** 3) ** 2.00977 * (L / B - 2) ** 1.40692;
  const m3 = -7.2035 * BL ** 0.326869 * (T / B) ** 0.605375;
  const rwB = (fn) => c17 * base * Math.exp(m3 * fn ** d + c15 * 0.4 * Math.exp(-0.034 * fn ** -3.29) * Math.cos(lambda * fn ** -2));
  let RW;
  if (!is1984 || Fn <= 0.4) RW = rwA(Fn);
  else if (Fn >= 0.55) RW = rwB(Fn);
  else RW = rwA(0.4) + ((10 * Fn - 4) * (rwB(0.55) - rwA(0.4))) / 1.5;
  const m2 = is1984 ? null : c15 * CP * CP * Math.exp(-0.1 * Fn ** -2);
  const m4 = c15 * 0.4 * Math.exp(-0.034 * Fn ** -3.29);

  // bulb
  let PB = null;
  let Fni = null;
  let RB = 0;
  if (ABT > 0) {
    if (TF - 1.5 * hB <= 0) throw new Error(`Bulb centre too high: T_F − 1.5 h_B must be positive (T_F ${TF} m, h_B ${hB} m)`);
    const immersion = TF - hB - 0.25 * Math.sqrt(ABT);
    if (immersion <= 0) throw new Error('Bulb immersion T_F − h_B − 0.25 √A_BT must be positive');
    PB = (0.56 * Math.sqrt(ABT)) / (TF - 1.5 * hB);
    Fni = V / Math.sqrt(g * immersion + 0.15 * V * V);
    RB = (0.11 * Math.exp(-3 * PB ** -2) * Fni ** 3 * ABT ** 1.5 * rho * g) / (1 + Fni * Fni);
  }

  // transom
  let FnT = null;
  let RTR = 0;
  if (AT > 0) {
    FnT = V / Math.sqrt((2 * g * AT) / (B + B * CWP));
    const c6 = FnT < 5 ? 0.2 * (1 - 0.2 * FnT) : 0;
    RTR = q * AT * c6;
  }

  // correlation allowance
  const c4 = Math.min(TF / L, 0.04);
  const CAstd = 0.006 * (L + 100) ** -0.16 - 0.00205 + 0.003 * Math.sqrt(L / 7.5) * CB ** 4 * c2 * (0.04 - c4);
  const ks = i.roughness_um * 1e-6;
  const dCA = Math.max(0, (0.105 * ks ** (1 / 3) - 0.005579) / L ** (1 / 3));
  const CA = CAstd + dCA;
  const RA = q * S * CA;

  const RT = RF * formFactor + RAPP + RW + RB + RTR + RA;
  const PE = RT * V;

  // propulsion factors
  const CV = formFactor * CF + CA;
  const D = i.prop_d_m;
  let w;
  let t;
  let etaR;
  if (i.arrangement === 'single') {
    const CP1 = 1.45 * CP - 0.315 - 0.0225 * lcb;
    if (CP1 >= 1) throw new Error(`C_P1 = 1.45 C_P − 0.315 − 0.0225 lcb = ${CP1.toFixed(3)} is 1 or more: the single-screw wake formula does not apply to so full an afterbody`);
    const BTA = B / TA;
    const c8 = BTA < 5 ? (B * S) / (L * D * TA) : (S * (7 * BTA - 25)) / (L * D * (BTA - 3));
    const c9 = c8 < 28 ? c8 : 32 - 16 / (c8 - 24);
    const TAD = TA / D;
    const c11 = TAD < 2 ? TAD : 0.0833333 * TAD ** 3 + 1.33333;
    if (is1984) {
      const c19 = CP < 0.7 ? 0.12997 / (0.95 - CB) - 0.11056 / (0.95 - CP) : 0.18567 / (1.3571 - CM) - 0.71276 + 0.38648 * CP;
      const c20 = 1 + 0.015 * cstern;
      w = c9 * c20 * CV * (L / TA) * (0.050776 + (0.93405 * c11 * CV) / (1 - CP1)) + 0.27915 * c20 * Math.sqrt(B / (L * (1 - CP1))) + c19 * c20;
      t = (0.25014 * BL ** 0.28956 * (Math.sqrt(B * T) / D) ** 0.2624) / (1 - CP + 0.0225 * lcb) ** 0.01762 + 0.0015 * cstern;
    } else {
      const c10 = L / B > 5.2 ? BL : 0.25 - 0.003328402 / (BL - 0.134615385);
      w = c9 * CV * (L / TA) * (0.0661875 + (1.21756 * c11 * CV) / (1 - CP1)) + 0.24558 * Math.sqrt(B / (L * (1 - CP1))) - 0.09726 / (0.95 - CP) + 0.11434 / (0.95 - CB) + 0.75 * cstern * CV + 0.002 * cstern;
      t = (0.001979 * L) / (B - B * CP1) + 1.0585 * c10 - 0.00524 - (0.1418 * D * D) / (B * T) + 0.0015 * cstern;
    }
    etaR = 0.9922 - 0.05908 * i.ae_a0 + 0.07424 * (CP - 0.0225 * lcb);
    return finish({ CP1 });
  }
  w = 0.3095 * CB + 10 * CV * CB - (0.23 * D) / Math.sqrt(B * T);
  t = 0.325 * CB - (0.1885 * D) / Math.sqrt(B * T);
  etaR = 0.9737 + 0.111 * (CP - 0.0225 * lcb) - 0.06325 * i.pd_ratio;
  return finish({});

  function finish(extra) {
    const etaH = (1 - t) / (1 - w);
    const PD = PE / (etaH * etaR * i.eta_o);
    return {
      V, Fn, CB, CP, LR, T, formFactor, S, Rn, CF, RF, RAPP, c1, c2, c3, c5, c7, c15, c16, c17, m1, m2, m3, m4, lambda, iE, RW, PB, Fni, RB, FnT, RTR, CA, CAstd, RA, RT, PE,
      CV, w, t, etaR, etaH, PD, PS: PD / i.eta_s, thrust: RT / (1 - t), VA: V * (1 - w), ...extra,
    };
  }
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.variant, ['hm1982', 'hm1984'], 'variant', 'Method variant');
  assertOneOf(i.stern_type, Object.keys(STERN_TYPES), 'stern_type', 'Afterbody form');
  assertOneOf(i.ie_mode, ['estimate', 'given'], 'ie_mode', 'Half angle mode');
  assertOneOf(i.arrangement, ['single', 'twin'], 'arrangement', 'Propulsion arrangement');
  for (const id of ['lwl_m', 'beam_m', 'draft_fwd_m', 'draft_aft_m', 'displacement_m3', 'speed_kn', 'rho_kg_m3', 'nu_m2_s', 'prop_d_m', 'eta_o', 'eta_s']) assertPositive(i[id], id, id);
  for (const id of ['abt_m2', 'hb_m', 'at_m2', 'sapp_m2', 'thruster_d_m']) assertNonNegative(i[id], id, id);
  assertRange(i.cm, 0.5, 1, 'cm', 'Midship coefficient');
  assertRange(i.cwp, 0.4, 0.99, 'cwp', 'Waterplane coefficient');
  assertRange(i.roughness_um, 0, 5000, 'roughness_um', 'Hull roughness');
  assertRange(i.lcb_pct, -10, 10, 'lcb_pct', 'lcb');
  assertRange(i.k2_app, 1, 5, 'k2_app', 'Appendage factor');
  assertRange(i.ae_a0, 0.2, 1.2, 'ae_a0', 'Blade area ratio');
  assertRange(i.eta_o, 0.2, 0.85, 'eta_o', 'Open-water efficiency');
  assertRange(i.eta_s, 0.85, 1, 'eta_s', 'Shaft efficiency');
  if (i.ie_mode === 'given') assertRange(i.ie_deg, 1, 89, 'ie_deg', 'Half angle of entrance');
  if (i.variant === 'hm1982' && i.stern_type === 'pram') throw new Error('The pram-with-gondola stern coefficient (−25) exists only in the 1984 re-analysis');

  const r = resistanceBreakdown(i);
  const warnings = [];
  const fnLimit = i.variant === 'hm1984' ? 0.8 : 0.45;
  if (r.Fn > fnLimit) warnings.push(`Froude number ${r.Fn.toFixed(3)} is above the range of the ${i.variant === 'hm1984' ? '1984' : '1982'} formulas (≈ ${fnLimit}): extrapolation.`);
  if (i.variant === 'hm1984' && r.Fn > 0.4 && r.Fn < 0.55) warnings.push('0.40 < Fn < 0.55: the wave resistance is the paper\'s linear interpolation between the low- and high-speed formulas ("more or less arbitrary").');
  if (r.CP < 0.55 || r.CP > 0.85) warnings.push(`Prismatic coefficient ${r.CP.toFixed(3)} is outside the 0.55–0.85 core of the regression sample.`);
  const LB = i.lwl_m / i.beam_m;
  if (LB < 3.9 || LB > 15) warnings.push(`L/B = ${LB.toFixed(2)} is outside the 3.9–15 range of the sample.`);
  const BT = i.beam_m / r.T;
  if (BT < 2.1 || BT > 4) warnings.push(`B/T = ${BT.toFixed(2)} is outside the 2.1–4.0 range of the sample.`);
  if (i.variant === 'hm1984' && i.hb_m > 0.6 * i.draft_fwd_m) warnings.push(`Bulb centre height h_B capped at 0.6 T_F = ${(0.6 * i.draft_fwd_m).toFixed(2)} m as recommended in the 1984 paper.`);
  if (i.ie_mode === 'estimate') warnings.push(`Half angle of entrance estimated at ${r.iE.toFixed(2)}° from the hull coefficients; enter the actual value from the lines plan if known.`);
  if (r.c15 === 0) warnings.push('L³/∇ > 1727 (very slender hull): the hump coefficient c15 is zero.');
  warnings.push('Ideal trial conditions: calm water, deep water, clean hull (150 µm) — add service margins for wind, waves and fouling.');
  warnings.push(`Open-water efficiency η_O = ${i.eta_o} is an input; design the propeller with the B-series calculator for a consistent value.`);

  return {
    outputs: {
      speed_m_s: r.V,
      draft_mean_m: r.T,
      fn: r.Fn,
      cb: r.CB,
      cp: r.CP,
      lr_m: r.LR,
      form_factor: r.formFactor,
      wetted_area_m2: r.S,
      reynolds: r.Rn,
      cf: r.CF,
      rf_n: r.RF,
      rf_form_n: r.RF * r.formFactor,
      rapp_n: r.RAPP,
      ie_out_deg: r.iE,
      rw_n: r.RW,
      rb_n: r.RB,
      rtr_n: r.RTR,
      ca: r.CA,
      ra_n: r.RA,
      rt_n: r.RT,
      wave_share_pct: ((r.RW + r.RB + r.RTR) / r.RT) * 100,
      pe_w: r.PE,
      wake: r.w,
      thrust_deduction: r.t,
      hull_eff: r.etaH,
      rotative_eff: r.etaR,
      eta_d: r.PE / r.PD,
      thrust_n: r.thrust,
      thrust_per_prop_n: i.arrangement === 'twin' ? r.thrust / 2 : r.thrust,
      advance_speed_m_s: r.VA,
      pd_w: r.PD,
      ps_w: r.PS,
    },
    warnings,
  };
}
