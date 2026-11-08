/**
 * mohr-circle/calc.js — plane-stress transformation by Mohr's circle: principal stresses, maximum in-plane and absolute
 * shear stress, principal angle, stresses on a plane rotated by θ, von Mises and Tresca equivalent stresses and the
 * factors of safety against yield.
 *
 * C = (σx + σy)/2, R = √(((σx − σy)/2)² + τxy²); σ1,2 = C ± R; θp = ½ atan2(2τxy, σx − σy) (x axis to σ1, counter-clockwise);
 * σx' = C + (σx − σy)/2 cos 2θ + τxy sin 2θ; τx'y' = −(σx − σy)/2 sin 2θ + τxy cos 2θ; σy' = 2C − σx'.
 * von Mises σ' = √(σx² − σxσy + σy² + 3τxy²); Tresca σ_T = max(|σ1 − σ2|, |σ1|, |σ2|) with σ3 = 0.
 * Schema units: SI — Pa, rad.
 */
import { withDefaults, assertFinite, assertNonNegative, assertRange } from '../shared/validate.js';

export function principal(sx, sy, txy) {
  const c = (sx + sy) / 2;
  const r = Math.hypot((sx - sy) / 2, txy);
  return { c, r, s1: c + r, s2: c - r, thetaP: 0.5 * Math.atan2(2 * txy, sx - sy) };
}

export function rotate(sx, sy, txy, th) {
  const c = (sx + sy) / 2;
  const h = (sx - sy) / 2;
  const sxp = c + h * Math.cos(2 * th) + txy * Math.sin(2 * th);
  return { sxp, syp: 2 * c - sxp, txyp: -h * Math.sin(2 * th) + txy * Math.cos(2 * th) };
}

export const schema = {
  id: 'mohr-circle',
  name: "Mohr's circle calculator (principal stress, von Mises)",
  category: 'mechanical',
  summary: "Plane-stress Mohr's circle: principal stresses and angle, maximum shear, stresses on a rotated plane, von Mises and Tresca stress and safety factor.",
  related: ['stress-strain', 'shaft-torsion', 'fatigue-goodman', 'elastic-constants'],
  assumptions: [
    'Plane stress: the third principal stress, normal to the plane, is zero. The absolute maximum shear and the Tresca stress include it, so for two principal stresses of the same sign they exceed the in-plane values.',
    'Sign convention: tension positive; τxy positive when it acts in +y on the face whose normal is +x; angles positive counter-clockwise from the x axis. On the circle drawn with shear positive downward, rotations have the same sense as on the element.',
    'Yield criteria are those of ductile isotropic metals with equal yield strength in tension and compression: distortion energy (von Mises) and maximum shear stress (Tresca), Shigley §5-4 and §5-5. Brittle materials need Coulomb–Mohr or modified Mohr criteria instead.',
    'The factors of safety are static: yield strength over equivalent stress. Fluctuating stresses need a fatigue check.',
  ],
  notes: [
    'Verification 2026-11-08: Shigley Example 3-4 (σx = 80 MPa, σy = 0, τxy = 50 MPa clockwise, i.e. −50 here) gives σ1 = 104.0 MPa, σ2 = −24.0 MPa, τmax = 64.0 MPa and the principal direction 25.7° clockwise from x; with Sy = 250 MPa the von Mises stress is 117.9 MPa and n = 2.12. Shigley Example 5-1 (Sy = 100 kpsi) factors of safety are reproduced in the tests.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §3-6 and §3-7 (plane stress, Mohr's circle, eqs. 3-8 to 3-13, Example 3-4)",
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §5-4 and §5-5 (maximum-shear-stress and distortion-energy theories, eqs. 5-3 and 5-15, Example 5-1)",
    'Hibbeler, Mechanics of Materials, 10th ed., §9.2 to §9.4 (stress transformation equations, principal stresses, Mohr\'s circle)',
  ],
  inputs: [
    { id: 'sx_pa', label: 'Normal stress σx', group: 'pressure', unit: 'Pa', display: 'MPa', default: 80e6, min: -1e10, max: 1e10 },
    { id: 'sy_pa', label: 'Normal stress σy', group: 'pressure', unit: 'Pa', display: 'MPa', default: 0, min: -1e10, max: 1e10 },
    { id: 'txy_pa', label: 'Shear stress τxy', group: 'pressure', unit: 'Pa', display: 'MPa', default: -50e6, min: -1e10, max: 1e10 },
    { id: 'theta_rad', label: 'Rotation of the plane θ (counter-clockwise from x)', group: 'angle', unit: 'rad', display: 'deg', default: 0, min: -2 * Math.PI, max: 2 * Math.PI },
    { id: 'sy_yield_pa', label: 'Yield strength S_y (optional, for the safety factor)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 250e6, min: 0, max: 1e10 },
  ],
  outputs: [
    { id: 's1_pa', label: 'Principal stress σ1', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 's2_pa', label: 'Principal stress σ2', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'theta_p_rad', label: 'Principal angle θp (x axis to σ1, counter-clockwise positive)', group: 'angle', unit: 'rad', display: 'deg', decimals: 2 },
    { id: 'tau_max_pa', label: 'Maximum in-plane shear stress (circle radius)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'tau_abs_pa', label: 'Absolute maximum shear stress (with σ3 = 0)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'centre_pa', label: 'Circle centre (average normal stress)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'sxp_pa', label: "σx' on the rotated plane", group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'syp_pa', label: "σy' on the rotated plane", group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'txyp_pa', label: "τx'y' on the rotated plane", group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'von_mises_pa', label: 'von Mises equivalent stress', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'tresca_pa', label: 'Tresca equivalent stress (2 τ_abs)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'fs_vm', label: 'Factor of safety, distortion energy (von Mises)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'fs_tresca', label: 'Factor of safety, maximum shear stress (Tresca)', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { sx_pa: [80, 'MPa'], sy_pa: [0, 'MPa'], txy_pa: [-50, 'MPa'], theta_rad: [0, 'deg'], sy_yield_pa: [250, 'MPa'] },
    results: { s1_pa: '104.0 MPa', s2_pa: '−24.0 MPa', tau_max_pa: '64.0 MPa', von_mises_pa: '117.9 MPa', tresca_pa: '128.1 MPa', fs_vm: '2.12', fs_tresca: '1.95' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const sx = assertFinite(x.sx_pa, 'sx_pa', 'Normal stress σx');
  const sy = assertFinite(x.sy_pa, 'sy_pa', 'Normal stress σy');
  const txy = assertFinite(x.txy_pa, 'txy_pa', 'Shear stress τxy');
  const th = assertRange(x.theta_rad, -2 * Math.PI, 2 * Math.PI, 'theta_rad', 'Rotation of the plane');
  const fy = assertNonNegative(x.sy_yield_pa, 'sy_yield_pa', 'Yield strength');
  const p = principal(sx, sy, txy);
  const r = rotate(sx, sy, txy, th);
  const vm = Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
  const tresca = Math.max(Math.abs(p.s1 - p.s2), Math.abs(p.s1), Math.abs(p.s2));
  const warnings = [];
  const fsVm = fy > 0 && vm > 0 ? fy / vm : null;
  if (fsVm !== null && fsVm < 1) warnings.push('The von Mises stress exceeds the yield strength: the material yields at this point.');
  if (p.s1 * p.s2 > 0) warnings.push('Both in-plane principal stresses have the same sign: the absolute maximum shear acts out of the plane and is larger than the circle radius.');
  return {
    outputs: {
      s1_pa: p.s1, s2_pa: p.s2, theta_p_rad: p.thetaP, tau_max_pa: p.r, tau_abs_pa: tresca / 2, centre_pa: p.c,
      sxp_pa: r.sxp, syp_pa: r.syp, txyp_pa: r.txyp,
      von_mises_pa: vm, tresca_pa: tresca,
      fs_vm: fsVm,
      fs_tresca: fy > 0 && tresca > 0 ? fy / tresca : null,
    },
    warnings,
  };
}
