/**
 * steel-beam-size/calc.js — lightest standard rolled steel beam for a simply supported span carrying a uniform load
 * and an optional central point load: bending, shear and live-load deflection, self-weight included.
 *
 * W-shapes to AISC 360-22 (ASD or LRFD): M_n = F_y Z_x (F2.1, compact, continuously braced), V_n = 0.6 F_y A_w C_v1
 * (G2.1, A_w = d t_w), loads 1.2D + 1.6L or 1.4D (LRFD) and D + L (ASD) of ASCE 7.
 * IPE to EN 1993-1-1: M_c,Rd = W_pl f_y / γ_M0 (6.2.5, class 1 or 2), V_pl,Rd = A_v f_y / (√3 γ_M0) (6.2.6), with the
 * bending–shear interaction of 6.2.8 at midspan, loads 1.35 G + 1.5 Q (EN 1990 eq. 6.10).
 * M = w L²/8 + P L/4, V = w L/2 + P/2, δ = 5 w L⁴/(384 E I) + P L³/(48 E I).
 * Schema units: SI — m, N/m, N, N·m, kg/m, m³, m⁴.
 */
import { withDefaults, assertNonNegative, assertOneOf, assertRange } from '../shared/validate.js';

const G = 9.80665;
const IN = 0.0254;
const IN2 = IN ** 2;
const IN3 = IN ** 3;
const IN4 = IN ** 4;
const KSI = 6894757.293168;
const LB_FT = 0.45359237 / 0.3048;
const PLF = 14.593902937206;
/** AISC 360-22 and Manual: E = 29 000 ksi. */
const E_AISC_KSI = 29000;
/** EN 1993-1-1 §3.2.6: E = 210 000 N/mm². */
const E_EC3 = 210e9;
/** EN 1993-1-1 §6.1, recommended γ_M0. */
const GAMMA_M0 = 1.0;

/**
 * AISC Shapes Database v16.0 (August 2023), W-shapes: [label, W lb/ft, A in², d in, b_f in, t_w in, t_f in,
 * I_x in⁴, S_x in³, Z_x in³, b_f/2t_f, h/t_w]. The lightest few of each depth from W6 to W24.
 */
export const W_SHAPES = [
  ['W6x9', 9, 2.68, 5.9, 3.94, 0.17, 0.215, 16.4, 5.56, 6.23, 9.16, 29.2],
  ['W6x12', 12, 3.55, 6.03, 4, 0.23, 0.28, 22.1, 7.31, 8.3, 7.14, 21.6],
  ['W6x16', 16, 4.74, 6.28, 4.03, 0.26, 0.405, 32.1, 10.2, 11.7, 4.98, 19.1],
  ['W8x10', 10, 2.96, 7.89, 3.94, 0.17, 0.205, 30.8, 7.81, 8.87, 9.61, 40.5],
  ['W8x13', 13, 3.84, 7.99, 4, 0.23, 0.255, 39.6, 9.91, 11.4, 7.84, 29.9],
  ['W8x15', 15, 4.44, 8.11, 4.02, 0.245, 0.315, 48, 11.8, 13.6, 6.37, 28.1],
  ['W8x18', 18, 5.26, 8.14, 5.25, 0.23, 0.33, 61.9, 15.2, 17, 7.95, 29.9],
  ['W8x21', 21, 6.16, 8.28, 5.27, 0.25, 0.4, 75.3, 18.2, 20.4, 6.59, 27.5],
  ['W8x24', 24, 7.08, 7.93, 6.5, 0.245, 0.4, 82.7, 20.9, 23.1, 8.12, 25.9],
  ['W8x28', 28, 8.25, 8.06, 6.54, 0.285, 0.465, 98, 24.3, 27.2, 7.03, 22.3],
  ['W8x31', 31, 9.13, 8, 8, 0.285, 0.435, 110, 27.5, 30.4, 9.19, 22.3],
  ['W10x12', 12, 3.54, 9.87, 3.96, 0.19, 0.21, 53.8, 10.9, 12.6, 9.43, 46.6],
  ['W10x15', 15, 4.41, 9.99, 4, 0.23, 0.27, 68.9, 13.8, 16, 7.41, 38.5],
  ['W10x17', 17, 4.99, 10.1, 4.01, 0.24, 0.33, 81.9, 16.2, 18.7, 6.08, 36.9],
  ['W10x19', 19, 5.62, 10.2, 4.02, 0.25, 0.395, 96.3, 18.8, 21.6, 5.09, 35.4],
  ['W10x22', 22, 6.49, 10.2, 5.75, 0.24, 0.36, 118, 23.2, 26, 7.99, 36.9],
  ['W10x26', 26, 7.61, 10.3, 5.77, 0.26, 0.44, 144, 27.9, 31.3, 6.56, 34],
  ['W10x30', 30, 8.84, 10.5, 5.81, 0.3, 0.51, 170, 32.4, 36.6, 5.7, 29.5],
  ['W10x33', 33, 9.71, 9.73, 7.96, 0.29, 0.435, 171, 35, 38.8, 9.15, 27.1],
  ['W12x14', 14, 4.16, 11.9, 3.97, 0.2, 0.225, 88.6, 14.9, 17.4, 8.82, 54.3],
  ['W12x16', 16, 4.71, 12, 3.99, 0.22, 0.265, 103, 17.1, 20.1, 7.53, 49.4],
  ['W12x19', 19, 5.57, 12.2, 4.01, 0.235, 0.35, 130, 21.3, 24.7, 5.72, 46.2],
  ['W12x22', 22, 6.48, 12.3, 4.03, 0.26, 0.425, 156, 25.4, 29.3, 4.74, 41.8],
  ['W12x26', 26, 7.65, 12.2, 6.49, 0.23, 0.38, 204, 33.4, 37.2, 8.54, 47.2],
  ['W12x30', 30, 8.79, 12.3, 6.52, 0.26, 0.44, 238, 38.6, 43.1, 7.41, 41.8],
  ['W12x35', 35, 10.3, 12.5, 6.56, 0.3, 0.52, 285, 45.6, 51.2, 6.31, 36.2],
  ['W12x40', 40, 11.7, 11.9, 8.01, 0.295, 0.515, 307, 51.5, 57, 7.77, 33.6],
  ['W14x22', 22, 6.49, 13.7, 5, 0.23, 0.335, 199, 29, 33.2, 7.46, 53.3],
  ['W14x26', 26, 7.69, 13.9, 5.03, 0.255, 0.42, 245, 35.3, 40.2, 5.98, 48.1],
  ['W14x30', 30, 8.85, 13.8, 6.73, 0.27, 0.385, 291, 42, 47.3, 8.74, 45.4],
  ['W14x34', 34, 10, 14, 6.75, 0.285, 0.455, 340, 48.6, 54.6, 7.41, 43.1],
  ['W14x38', 38, 11.2, 14.1, 6.77, 0.31, 0.515, 385, 54.6, 61.5, 6.57, 39.6],
  ['W14x43', 43, 12.6, 13.7, 8, 0.305, 0.53, 428, 62.6, 69.6, 7.54, 37.4],
  ['W14x48', 48, 14.1, 13.8, 8.03, 0.34, 0.595, 484, 70.2, 78.4, 6.75, 33.6],
  ['W16x26', 26, 7.68, 15.7, 5.5, 0.25, 0.345, 301, 38.4, 44.2, 7.97, 56.8],
  ['W16x31', 31, 9.13, 15.9, 5.53, 0.275, 0.44, 375, 47.2, 54, 6.28, 51.6],
  ['W16x36', 36, 10.6, 15.9, 6.99, 0.295, 0.43, 448, 56.5, 64, 8.12, 48.1],
  ['W16x40', 40, 11.8, 16, 7, 0.305, 0.505, 518, 64.7, 73, 6.93, 46.5],
  ['W16x45', 45, 13.3, 16.1, 7.04, 0.345, 0.565, 586, 72.7, 82.3, 6.23, 41.1],
  ['W16x50', 50, 14.7, 16.3, 7.07, 0.38, 0.63, 659, 81, 92, 5.61, 37.4],
  ['W18x35', 35, 10.3, 17.7, 6, 0.3, 0.425, 510, 57.6, 66.5, 7.06, 53.5],
  ['W18x40', 40, 11.8, 17.9, 6.02, 0.315, 0.525, 612, 68.4, 78.4, 5.73, 50.9],
  ['W18x46', 46, 13.5, 18.1, 6.06, 0.36, 0.605, 712, 78.8, 90.7, 5.01, 44.6],
  ['W18x50', 50, 14.7, 18, 7.5, 0.355, 0.57, 800, 88.9, 101, 6.57, 45.2],
  ['W18x55', 55, 16.2, 18.1, 7.53, 0.39, 0.63, 890, 98.3, 112, 5.98, 41.1],
  ['W18x60', 60, 17.6, 18.2, 7.56, 0.415, 0.695, 984, 108, 123, 5.44, 38.7],
  ['W21x44', 44, 13, 20.7, 6.5, 0.35, 0.45, 843, 81.6, 95.4, 7.22, 53.6],
  ['W21x50', 50, 14.7, 20.8, 6.53, 0.38, 0.535, 984, 94.5, 110, 6.1, 49.4],
  ['W21x57', 57, 16.7, 21.1, 6.56, 0.405, 0.65, 1170, 111, 129, 5.04, 46.3],
  ['W21x62', 62, 18.3, 21, 8.24, 0.4, 0.615, 1330, 127, 144, 6.7, 46.9],
  ['W21x68', 68, 20, 21.1, 8.27, 0.43, 0.685, 1480, 140, 160, 6.04, 43.6],
  ['W24x55', 55, 16.2, 23.6, 7.01, 0.395, 0.505, 1350, 114, 134, 6.94, 54.6],
  ['W24x62', 62, 18.2, 23.7, 7.04, 0.43, 0.59, 1550, 131, 153, 5.97, 50.1],
  ['W24x68', 68, 20.1, 23.7, 8.97, 0.415, 0.585, 1830, 154, 177, 7.66, 52],
  ['W24x76', 76, 22.4, 23.9, 8.99, 0.44, 0.68, 2100, 176, 200, 6.61, 49],
  ['W24x84', 84, 24.7, 24.1, 9.02, 0.47, 0.77, 2370, 196, 224, 5.86, 45.9],
];

/**
 * ArcelorMittal, Sections and Merchant Bars, IPE (EN 10365 dimensions), as listed by its distributor STAD:
 * [label, G kg/m, h mm, b mm, t_w mm, t_f mm, r mm, A cm², I_y cm⁴, W_el,y cm³, W_pl,y cm³, A_vz cm²].
 * A_vz = A − 2 b t_f + (t_w + 2 r) t_f (EN 1993-1-1 6.2.6(3)a), equal to the catalogue A_vz within 0.05 cm².
 */
export const IPE_SECTIONS = [
  ['IPE 80', 6, 80, 46, 3.8, 5.2, 5, 7.64, 80, 20, 23.2, 3.57],
  ['IPE 100', 8.1, 100, 55, 4.1, 5.7, 7, 10.32, 171, 34.2, 39.4, 5.08],
  ['IPE 120', 10.4, 120, 64, 4.4, 6.3, 7, 13.21, 318, 53, 60.7, 6.31],
  ['IPE 140', 12.9, 140, 73, 4.7, 6.9, 7, 16.43, 541, 77.3, 88.3, 7.65],
  ['IPE 160', 15.8, 160, 82, 5, 7.4, 9, 20.09, 869, 108.7, 123.9, 9.66],
  ['IPE 180', 18.8, 180, 91, 5.3, 8, 9, 23.95, 1317, 146.3, 166.4, 11.25],
  ['IPE 200', 22.4, 200, 100, 5.6, 8.5, 12, 28.48, 1943, 194.3, 220.6, 14.00],
  ['IPE 220', 26.2, 220, 110, 5.9, 9.2, 12, 33.37, 2772, 252, 285.4, 15.88],
  ['IPE 240', 30.7, 240, 120, 6.2, 9.8, 15, 39.12, 3892, 324.3, 366.7, 19.15],
  ['IPE 270', 36.1, 270, 135, 6.6, 10.2, 15, 45.95, 5790, 428.9, 484, 22.14],
  ['IPE 300', 42.2, 300, 150, 7.1, 10.7, 15, 53.81, 8356, 557.1, 628.4, 25.68],
  ['IPE 330', 49.1, 330, 160, 7.5, 11.5, 18, 62.61, 11767, 713.2, 804.3, 30.81],
  ['IPE 360', 57.1, 360, 170, 8, 12.7, 18, 72.73, 16266, 903.7, 1019.2, 35.14],
  ['IPE 400', 66.3, 400, 180, 8.6, 13.5, 21, 84.47, 23128, 1156.4, 1307.2, 42.70],
  ['IPE 450', 77.6, 450, 190, 9.4, 14.6, 21, 98.82, 33743, 1499.7, 1701.8, 50.84],
  ['IPE 500', 90.7, 500, 200, 10.2, 16, 21, 115.52, 48199, 1928, 2194.2, 59.87],
  ['IPE 550', 105.5, 550, 210, 11.1, 17.2, 24, 134.42, 67117, 2440.6, 2787.1, 72.35],
  ['IPE 600', 122.5, 600, 220, 12, 19, 24, 155.99, 92083, 3069.4, 3512.5, 83.79],
];

/** Steel grades: AISC F_y (ksi); EN 10025-2 f_y for t ≤ 40 mm (MPa), which covers every IPE flange. */
const W_GRADES = { a992: 50, a36: 36 };
const EC_GRADES = { s235: 235, s275: 275, s355: 355 };
const LIMITS = ['180', '240', '360', '480'];

function wSection([label, w, A, d, bf, tw, tf, Ix, Sx, Zx, bf2tf, htw]) {
  return {
    label, series: 'w', nominal: Number(label.slice(1, label.indexOf('x'))) * IN,
    mass: w * LB_FT, area: A * IN2, depth: d * IN, bf: bf * IN, tw: tw * IN, tf: tf * IN,
    ix: Ix * IN4, sx: Sx * IN3, zx: Zx * IN3, bf2tf, htw,
  };
}
function ipeSection([label, g, h, b, tw, tf, r, A, Iy, Wel, Wpl, Avz]) {
  return {
    label, series: 'ipe', nominal: h / 1000,
    mass: g, area: A * 1e-4, depth: h / 1000, bf: b / 1000, tw: tw / 1000, tf: tf / 1000, r: r / 1000,
    ix: Iy * 1e-8, sx: Wel * 1e-6, zx: Wpl * 1e-6, av: Avz * 1e-4,
  };
}
/** Both series in SI units, lightest first within each depth as tabulated. */
export const SECTIONS = { w: W_SHAPES.map(wSection), ipe: IPE_SECTIONS.map(ipeSection) };

export const schema = {
  id: 'steel-beam-size',
  name: 'Steel beam size calculator',
  category: 'structural',
  summary: 'Lightest W-shape (AISC 360, ASD or LRFD) or IPE beam (Eurocode 3) for a simply supported span: bending, shear and live-load deflection with self-weight.',
  related: ['beam-deflection', 'moment-of-inertia', 'column-buckling', 'metal-weight'],
  assumptions: [
    'The beam is simply supported, carries a uniform load over the whole span plus an optional point load at midspan, and its compression flange is braced continuously (for example by a floor deck), so lateral-torsional buckling is not checked.',
    'Sections whose flange or web is not compact (AISC 360 Table B4.1b) or not class 1 or 2 (EN 1993-1-1 Table 5.2) at the chosen grade are skipped, so local buckling of non-compact sections is never checked or relied on; web shear buckling follows AISC G2.1, and IPE webs satisfy hw/tw ≤ 72ε.',
    'W-shapes use AISC 360-22 with F_y of A992 (50 ksi) or A36 (36 ksi), E = 29 000 ksi and the ASCE 7 combinations 1.2D + 1.6L or 1.4D (LRFD) and D + L (ASD); IPE beams use EN 1993-1-1 with γ_M0 = 1.0, E = 210 GPa and 1.35 G + 1.5 Q (EN 1990 eq. 6.10).',
    'Deflection is checked for the live load alone against span / limit; total deflection is reported but not checked. Web bearing and crippling at the supports, vibration, fire, fatigue and connections are not checked.',
    'The beam self-weight is added to the dead load unless switched off. The table holds the common light and medium W6 to W24 shapes and IPE 80 to IPE 600 only; heavier or deeper sections are not considered.',
  ],
  notes: [
    'Verification 2026-11-08: AISC Design Examples F.1-1A (35 ft span, 0.45 kip/ft dead including the beam, 0.75 kip/ft live, nominal depth ≤ 18 in, L/360) selects W18x50 with φM_n = 378.8 kip·ft and M_n/Ω = 252.0 kip·ft, as published. Worked example: 20 ft span, 400 lb/ft dead and 800 lb/ft live, LRFD, A992, gives W14x22 with M_u = 89 320 lbf·ft against φM_n = 124 500 lbf·ft (72 %), φV_n = 94.5 kip, live-load deflection 0.50 in against 0.67 in (75 %, governs). Checked by hand.',
    'Table provenance: W-shape values from the AISC Shapes Database v16.0, read from two independent copies that agree in every value used; A, d, t_w, b_f, t_f, I_x and S_x of W8x13, W8x21, W10x19, W10x30, W12x22, W12x26, W14x22, W14x34, W16x31, W16x40, W18x40, W21x68 and W24x84 agree with the AISC table reprinted in LibreTexts Strength of Materials (Table A.1), and Z_x of W8x10, W18x35 and W24x55 with a second web table.',
    'Table provenance: IPE values from the ArcelorMittal Sections and Merchant Bars table as published by STAD; G, A, I_y, W_el,y and W_pl,y of all 18 sizes agree within 0.6 % with a second copy of the ArcelorMittal table, and A_vz from the EN 1993-1-1 formula matches its A_vz within 0.05 cm² (IPE 300: 25.68 cm², IPE 600: 83.8 cm²).',
    'Design decision: ties in weight go to the section with the larger plastic modulus. E = 210 GPa follows EN 1993-1-1 3.2.6 for the IPE series rather than a rounded 200 GPa.',
  ],
  sources: [
    'ANSI/AISC 360-22 Specification for Structural Steel Buildings, Table B4.1b, F2.1 (M_n = F_y Z_x), G2.1 (shear); AISC Shapes Database v16.0 (2023)',
    'AISC Design Examples, Examples F.1-1A and F.1-1B (W18x50 on a 35 ft span, continuously braced)',
    'EN 1993-1-1:2005 Eurocode 3, 3.2.6, Table 5.2, 6.2.5 (M_c,Rd = W_pl f_y / γ_M0), 6.2.6 (V_pl,Rd and A_v), 6.2.8; EN 1990:2002 eq. 6.10',
    'ArcelorMittal, Sections and Merchant Bars catalogue, IPE table (EN 10365 dimensions and properties)',
  ],
  inputs: [
    { id: 'series', label: 'Section series and design code', type: 'select', default: 'w', options: [{ value: 'w', label: 'US W-shapes, AISC 360' }, { value: 'ipe', label: 'European IPE, Eurocode 3' }] },
    { id: 'method', label: 'AISC design method', type: 'select', default: 'lrfd', options: [{ value: 'lrfd', label: 'LRFD (φ_b = 0.90)' }, { value: 'asd', label: 'ASD (Ω_b = 1.67)' }], visibleWhen: { series: 'w' } },
    { id: 'grade_w', label: 'Steel grade', type: 'select', default: 'a992', options: [{ value: 'a992', label: 'ASTM A992, F_y = 50 ksi' }, { value: 'a36', label: 'ASTM A36, F_y = 36 ksi' }], visibleWhen: { series: 'w' } },
    { id: 'grade_ipe', label: 'Steel grade', type: 'select', default: 's355', options: [{ value: 's235', label: 'S235, f_y = 235 MPa' }, { value: 's275', label: 'S275, f_y = 275 MPa' }, { value: 's355', label: 'S355, f_y = 355 MPa' }], visibleWhen: { series: 'ipe' } },
    { id: 'span_m', label: 'Span L', group: 'length', unit: 'm', display: 'ft', default: 20 * 0.3048, min: 0.5, max: 30 },
    { id: 'dead_n_m', label: 'Uniform dead load, without the beam', group: 'line_load', unit: 'N_m', display: 'lbf_ft', default: 400 * PLF, min: 0, max: 1e6, help: 'Floor dead load × beam spacing, e.g. 50 psf × 8 ft = 400 lb/ft.' },
    { id: 'live_n_m', label: 'Uniform live load', group: 'line_load', unit: 'N_m', display: 'lbf_ft', default: 800 * PLF, min: 0, max: 1e6, help: 'Floor live load × beam spacing, e.g. 100 psf × 8 ft = 800 lb/ft.' },
    { id: 'point_dead_n', label: 'Point load at midspan, dead part', group: 'force', unit: 'N', display: 'kip', default: 0, min: 0, max: 1e7 },
    { id: 'point_live_n', label: 'Point load at midspan, live part', group: 'force', unit: 'N', display: 'kip', default: 0, min: 0, max: 1e7 },
    { id: 'limit', label: 'Live-load deflection limit', type: 'select', default: '360', options: [{ value: '180', label: 'L/180' }, { value: '240', label: 'L/240' }, { value: '360', label: 'L/360 (floors with plaster or brittle finishes)' }, { value: '480', label: 'L/480' }] },
    { id: 'self_weight', label: 'Beam self-weight', type: 'select', default: 'add', options: [{ value: 'add', label: 'Add it to the dead load' }, { value: 'included', label: 'Already in the dead load' }] },
    { id: 'max_depth_m', label: 'Maximum nominal depth (0 = no limit)', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 1 },
  ],
  outputs: [
    { id: 'section', label: 'Lightest section that works', type: 'text' },
    { id: 'governs', label: 'Governing check', type: 'text' },
    { id: 'mass_kg_m', label: 'Beam weight', group: 'linear_density', unit: 'kg_m', display: 'lb_ft' },
    { id: 'self_n_m', label: 'Self-weight load added', group: 'line_load', unit: 'N_m', display: 'lbf_ft' },
    { id: 'moment_nm', label: 'Design moment (factored for LRFD and Eurocode)', group: 'torque', unit: 'N_m', display: 'lbf_ft' },
    { id: 'moment_cap_nm', label: 'Moment capacity φM_n, M_n/Ω or M_c,Rd', group: 'torque', unit: 'N_m', display: 'lbf_ft' },
    { id: 'util_bending', label: 'Bending utilisation', group: 'ratio', unit: 'frac', display: 'pct', decimals: 0 },
    { id: 'shear_n', label: 'Design shear at the support', group: 'force', unit: 'N', display: 'kip' },
    { id: 'shear_cap_n', label: 'Shear capacity φV_n, V_n/Ω or V_pl,Rd', group: 'force', unit: 'N', display: 'kip' },
    { id: 'util_shear', label: 'Shear utilisation', group: 'ratio', unit: 'frac', display: 'pct', decimals: 0 },
    { id: 'defl_live_m', label: 'Live-load deflection', group: 'length', unit: 'm', display: 'in' },
    { id: 'defl_allow_m', label: 'Allowed live-load deflection L/limit', group: 'length', unit: 'm', display: 'in' },
    { id: 'util_defl', label: 'Deflection utilisation', group: 'ratio', unit: 'frac', display: 'pct', decimals: 0 },
    { id: 'defl_total_m', label: 'Total deflection, dead + live (not checked)', group: 'length', unit: 'm', display: 'in' },
    { id: 'zx_m3', label: 'Plastic section modulus Z_x (W_pl,y)', group: 'section_modulus', unit: 'm3', display: 'in3' },
    { id: 'ix_m4', label: 'Moment of inertia I_x (I_y for IPE)', group: 'second_moment_of_area', unit: 'm4', display: 'in4' },
    { id: 'ix_req_m4', label: 'Moment of inertia needed for the deflection limit', group: 'second_moment_of_area', unit: 'm4', display: 'in4' },
    { id: 'by_depth', label: 'Lightest W-shape that works at each depth', type: 'text' },
  ],
  example: {
    inputs: { series: 'w', method: 'lrfd', grade_w: 'a992', span_m: [20, 'ft'], dead_n_m: [400, 'lbf_ft'], live_n_m: [800, 'lbf_ft'], point_dead_n: [0, 'kip'], point_live_n: [0, 'kip'], limit: '360', self_weight: 'add', max_depth_m: [0, 'in'] },
    results: { mass_kg_m: '22 lb/ft', moment_nm: '89 320 lbf·ft', moment_cap_nm: '124 500 lbf·ft', defl_live_m: '0.50 in', defl_allow_m: '0.67 in', ix_req_m4: '149 in⁴' },
  },
};

/**
 * Demands, capacities and utilisations of one section for the prepared inputs x.
 * Returns null when the section is not compact (AISC) or not class 1 or 2 (EC3) at the grade.
 */
export function checkSection(s, x) {
  const L = x.span;
  const swLoad = x.addSelf ? s.mass * G : 0;
  const wD = x.wD + swLoad;
  let wU; let pU; let mCap; let vCap; let E;
  if (s.series === 'w') {
    const fy = x.fyKsi;
    const r = Math.sqrt(E_AISC_KSI / fy);
    if (s.bf2tf > 0.38 * r || s.htw > 3.76 * r) return null; // Table B4.1b, case 10 and 15
    const Fy = fy * KSI;
    const lrfd = x.method === 'lrfd';
    const comb = (d, l) => (lrfd ? Math.max(1.2 * d + 1.6 * l, 1.4 * d) : d + l);
    wU = comb(wD, x.wL);
    pU = comb(x.pD, x.pL);
    const mn = Fy * s.zx;
    mCap = lrfd ? 0.9 * mn : mn / 1.67;
    const limitCv = 1.10 * Math.sqrt((5.34 * E_AISC_KSI) / fy); // G2.1(b)(1), unstiffened web, k_v = 5.34
    const cv1 = s.htw <= limitCv ? 1 : limitCv / s.htw;
    const vn = 0.6 * Fy * s.depth * s.tw * cv1;
    const stocky = s.htw <= 2.24 * r; // G2.1(a): φ_v = 1.00, Ω_v = 1.50
    vCap = stocky ? (lrfd ? vn : vn / 1.5) : (lrfd ? 0.9 * vn : vn / 1.67);
    E = E_AISC_KSI * KSI;
  } else {
    const fy = x.fyMpa * 1e6;
    const eps = Math.sqrt(235 / x.fyMpa);
    const hw = s.depth - 2 * s.tf;
    const cFlange = (s.bf - s.tw - 2 * s.r) / 2 / s.tf;
    const cWeb = (hw - 2 * s.r) / s.tw;
    if (cFlange > 10 * eps || cWeb > 83 * eps || hw / s.tw > 72 * eps) return null;
    wU = 1.35 * wD + 1.5 * x.wL;
    pU = 1.35 * x.pD + 1.5 * x.pL;
    mCap = (s.zx * fy) / GAMMA_M0;
    vCap = (s.av * fy) / (Math.sqrt(3) * GAMMA_M0);
    // 6.2.8: a central point load leaves V = P/2 at midspan, where the moment is largest
    const vMid = pU / 2;
    if (vMid > 0.5 * vCap) {
      const rho = ((2 * vMid) / vCap - 1) ** 2;
      mCap = Math.min(mCap, ((s.zx - (rho * hw * hw * s.tw) / 4) * fy) / GAMMA_M0);
    }
    E = E_EC3;
  }
  const M = (wU * L * L) / 8 + (pU * L) / 4;
  const V = (wU * L) / 2 + pU / 2;
  const deflEI = (w, p) => (5 * w * L ** 4) / (384 * E) + (p * L ** 3) / (48 * E);
  const dLive = deflEI(x.wL, x.pL) / s.ix;
  const dTotal = deflEI(wD + x.wL, x.pD + x.pL) / s.ix;
  const allow = L / x.limit;
  const uB = M / mCap;
  const uV = V / vCap;
  const uD = dLive / allow;
  return {
    swLoad, M, mCap, V, vCap, dLive, dTotal, allow, uB, uV, uD,
    ixReq: deflEI(x.wL, x.pL) / allow,
    ok: uB <= 1 + 1e-9 && uV <= 1 + 1e-9 && uD <= 1 + 1e-9,
  };
}

const pct = (u) => `${Math.round(u * 100)} %`;

export function calculate(inputs) {
  const i = withDefaults(schema, inputs);
  assertOneOf(i.series, ['w', 'ipe'], 'series', 'Section series');
  assertOneOf(i.method, ['lrfd', 'asd'], 'method', 'AISC design method');
  assertOneOf(i.grade_w, Object.keys(W_GRADES), 'grade_w', 'Steel grade');
  assertOneOf(i.grade_ipe, Object.keys(EC_GRADES), 'grade_ipe', 'Steel grade');
  assertOneOf(i.limit, LIMITS, 'limit', 'Live-load deflection limit');
  assertOneOf(i.self_weight, ['add', 'included'], 'self_weight', 'Beam self-weight');
  const x = {
    span: assertRange(i.span_m, 0.5, 30, 'span_m', 'Span L'),
    wD: assertNonNegative(i.dead_n_m, 'dead_n_m', 'Uniform dead load'),
    wL: assertNonNegative(i.live_n_m, 'live_n_m', 'Uniform live load'),
    pD: assertNonNegative(i.point_dead_n, 'point_dead_n', 'Point load, dead part'),
    pL: assertNonNegative(i.point_live_n, 'point_live_n', 'Point load, live part'),
    limit: Number(i.limit),
    addSelf: i.self_weight === 'add',
    method: i.method,
    fyKsi: W_GRADES[i.grade_w],
    fyMpa: EC_GRADES[i.grade_ipe],
  };
  const maxDepth = assertNonNegative(i.max_depth_m, 'max_depth_m', 'Maximum nominal depth');
  if (x.wD + x.wL + x.pD + x.pL === 0 && !x.addSelf) throw new Error('Loads: enter at least one dead or live load.');
  const name = i.series === 'w' ? 'W-shape' : 'IPE';
  const list = SECTIONS[i.series].filter((s) => maxDepth === 0 || s.nominal <= maxDepth + 1e-6);
  if (!list.length) throw new Error(`Maximum nominal depth: no ${name} in the table is that shallow; the shallowest is ${SECTIONS[i.series][0].label}.`);
  const checked = list.map((s) => ({ s, c: checkSection(s, x) }));
  const usable = checked.filter((e) => e.c);
  const passing = usable.filter((e) => e.c.ok);
  if (!passing.length) {
    const big = usable.reduce((a, b) => (b.s.zx > a.s.zx ? b : a));
    throw new Error(`Loads: no ${name} in the table works; the strongest one allowed, ${big.s.label}, is at ${pct(big.c.uB)} in bending, ${pct(big.c.uV)} in shear and ${pct(big.c.uD)} in deflection. Shorten the span or use a deeper or heavier section.`);
  }
  const lighter = (a, b) => (b.s.mass < a.s.mass - 1e-9 || (Math.abs(b.s.mass - a.s.mass) <= 1e-9 && b.s.zx > a.s.zx) ? b : a);
  const { s, c } = passing.reduce(lighter);
  const checks = [['Bending', c.uB], ['Shear', c.uV], ['Live-load deflection', c.uD]];
  const top = checks.reduce((a, b) => (b[1] > a[1] ? b : a));
  let byDepth = null;
  if (i.series === 'w') {
    const depths = [...new Set(passing.map((e) => e.s.nominal))].sort((a, b) => a - b);
    byDepth = depths.map((d) => passing.filter((e) => e.s.nominal === d).reduce(lighter).s.label).join(', ');
  }
  const warnings = [];
  const skipped = checked.filter((e) => !e.c && e.s.mass < s.mass).map((e) => e.s.label);
  if (skipped.length) warnings.push(`${skipped.join(', ')} not considered although lighter: the flange is not compact at this grade (AISC 360 Table B4.1b), and flange local buckling is outside this calculator.`);
  if (x.span / s.depth > 30) warnings.push('Span over 30 times the beam depth: a floor this slender may be lively underfoot; check vibration separately.');
  if (c.dTotal > x.span / 240) warnings.push('Total deflection exceeds L/240: consider a stiffer beam or a precamber.');
  if (i.series === 'ipe' && c.mCap < s.zx * x.fyMpa * 1e6 / GAMMA_M0 - 1e-6) warnings.push('The shear from the point load exceeds half the shear resistance at midspan, so the moment resistance is reduced (EN 1993-1-1 6.2.8).');
  return {
    outputs: {
      section: s.label,
      governs: `${top[0]} (${pct(top[1])})`,
      mass_kg_m: s.mass,
      self_n_m: c.swLoad,
      moment_nm: c.M,
      moment_cap_nm: c.mCap,
      util_bending: c.uB,
      shear_n: c.V,
      shear_cap_n: c.vCap,
      util_shear: c.uV,
      defl_live_m: c.dLive,
      defl_allow_m: c.allow,
      util_defl: c.uD,
      defl_total_m: c.dTotal,
      zx_m3: s.zx,
      ix_m4: s.ix,
      ix_req_m4: c.ixReq,
      by_depth: byDepth,
    },
    warnings,
  };
}
