/**
 * wave-properties/calc.js — linear (Airy) wave theory in finite depth: dispersion relation, wavelength, celerity, group
 * velocity, depth regime, orbital velocities, energy flux, breaking limit and the encounter period for a ship.
 *
 * ω² = g k tanh(k h);  c = ω/k;  c_g = c/2 (1 + 2kh/sinh 2kh);  ω_e = ω + k V cos α (α = 0 head seas).
 * Schema units: m, s, m/s, kn, degrees, kW/m.
 */
import { GRAVITY_M_S2, toBase } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const KNOT_M_S = toBase(1, 'kn', 'speed'); // 1852/3600 m/s, from shared/units.js

export const schema = {
  id: 'wave-properties',
  name: 'Wave properties and encounter period',
  category: 'maritime',
  summary: 'Linear wave theory: wavelength, celerity, group velocity, deep/shallow regime, orbital velocities and the encounter period for a ship speed and heading.',
  related: ['roll-period', 'beaufort-sea-state', 'ship-squat', 'tidal-height'],
  assumptions: [
    'Linear (Airy) wave theory: small steepness, irrotational flow, flat impermeable bottom, no current; the dispersion relation ω² = g k tanh(kh) is solved numerically for the wavenumber, so no deep- or shallow-water approximation is made in the results — the regime labels follow the usual h/λ > 0.5 (deep) and h/λ < 0.05 (shallow) limits.',
    'A single regular wave of period T and height H represents the sea: for an irregular sea use the significant height and the peak or energy period, and read the orbital velocities as representative of the larger waves rather than extremes.',
    'Orbital velocities are the linear-theory amplitudes at the surface (z = 0) and at a chosen depth below the still-water level; near breaking and in very shallow water the crest velocities are larger than the linear value (Stokes/cnoidal effects).',
    'Breaking limit by the Miche criterion H_max/λ = 0.142 tanh(kh) (0.142 in deep water, approaching 0.88 h in shallow water); real breaking depends on bottom slope and wave irregularity.',
    'Energy flux per metre of crest P = ρ g H² c_g/8 for a regular wave; for an irregular sea with significant height H_s and energy period T_e in deep water the usual form is P ≈ ρ g² H_s² T_e/(64π) — half the regular-wave value for the same H and T.',
    'Encounter frequency from the linear kinematics ω_e = ω + k V cos α with α the angle between the ship\'s heading and the wave direction (0° head seas, 180° following); in deep water this is the exact form of the MSC.1/Circ.1228 approximation T_E = 3T²/(3T + V_kn cos α), and the two agree within about 1.5 %.',
  ],
  notes: [
    'Verification 2026-10-30: T = 10 s deep water gives λ = 156.1 m, c = 15.6 m/s, c_g = 7.8 m/s (textbook λ = 1.56 T²); for h/λ₀ = 0.10 the solver gives h/λ = 0.1410 (kh 0.886) as in the Wiegel/CEM dispersion tables; the shallow limit c → √(gh) is reproduced within 1 %; head-sea encounter at 15 kn in 10 s waves is 6.69 s against 6.67 s from the circular\'s formula.',
    'Design decision: the dispersion relation is solved by Newton iteration from the Eckart/Fenton–McKee initial guess, so results are exact to machine precision in all depths.',
  ],
  sources: [
    'R. G. Dean & R. A. Dalrymple, Water Wave Mechanics for Engineers and Scientists (World Scientific 1991), ch. 3–4',
    'USACE Coastal Engineering Manual EM 1110-2-1100 Part II-1 (2002), linear wave theory and the dispersion tables; R. L. Wiegel, Oceanographical Engineering (1964) Table A1',
    'R. Miche (1944) breaking criterion; L. H. Holthuijsen, Waves in Oceanic and Coastal Waters (CUP 2007) — wave energy flux',
    'IMO MSC.1/Circ.1228 (2007) §1.5–1.6 — encounter period approximation used for cross-checking',
  ],
  inputs: [
    { id: 'wave_input', label: 'Wave given as', type: 'select', default: 'period', options: [{ value: 'period', label: 'Period T' }, { value: 'length', label: 'Wavelength λ' }] },
    { id: 'period_s', label: 'Wave period T', group: 'time', unit: 's', default: 10, min: 0.5, max: 60, visibleWhen: { wave_input: 'period' } },
    { id: 'length_m', label: 'Wavelength λ', group: 'length', unit: 'm', default: 156, min: 0.1, max: 5000, visibleWhen: { wave_input: 'length' } },
    { id: 'height_m', label: 'Wave height H (crest to trough)', group: 'length', unit: 'm', default: 3, min: 0, max: 40 },
    { id: 'depth_mode', label: 'Water depth', type: 'select', default: 'finite', options: [{ value: 'deep', label: 'Deep water (no depth effect)' }, { value: 'finite', label: 'Finite depth h' }] },
    { id: 'depth_m', label: 'Water depth h', group: 'length', unit: 'm', default: 30, min: 0.1, max: 12000, visibleWhen: { depth_mode: 'finite' } },
    { id: 'eval_depth_m', label: 'Depth below the surface for the orbital velocity', group: 'length', unit: 'm', default: 10, min: 0, max: 12000 },
    { id: 'speed_kn', label: 'Ship speed V (encounter period)', group: 'speed', unit: 'kn', default: 15, min: 0, max: 60 },
    { id: 'heading_deg', label: 'Angle between heading and wave direction α (0 = head seas, 180 = following)', group: 'angle', unit: 'deg', default: 0, min: 0, max: 360 },
    { id: 'rho_kg_m3', label: 'Water density', group: 'density', unit: 'kg_m3', default: 1025, min: 990, max: 1040 },
  ],
  outputs: [
    { id: 'period_out_s', label: 'Period T', group: 'time', unit: 's' },
    { id: 'length_out_m', label: 'Wavelength λ', group: 'length', unit: 'm' },
    { id: 'deep_length_m', label: 'Deep-water wavelength λ₀ = g T²/2π', group: 'length', unit: 'm' },
    { id: 'wavenumber', label: 'Wavenumber k = 2π/λ (1/m)', group: 'dimensionless', unit: 'none' },
    { id: 'celerity_m_s', label: 'Phase speed (celerity) c = λ/T', group: 'speed', unit: 'm_s' },
    { id: 'group_velocity_m_s', label: 'Group velocity c_g', group: 'speed', unit: 'm_s' },
    { id: 'depth_ratio', label: 'Relative depth h/λ', group: 'dimensionless', unit: 'none' },
    { id: 'regime', label: 'Depth regime', type: 'text' },
    { id: 'steepness', label: 'Steepness H/λ', group: 'dimensionless', unit: 'none' },
    { id: 'breaking_height_m', label: 'Breaking height limit (Miche) H_max = 0.142 λ tanh(kh)', group: 'length', unit: 'm' },
    { id: 'breaking_status', label: 'Breaking check', type: 'text' },
    { id: 'surface_velocity_m_s', label: 'Horizontal orbital velocity amplitude at the surface', group: 'speed', unit: 'm_s' },
    { id: 'depth_velocity_m_s', label: 'Horizontal orbital velocity amplitude at the chosen depth', group: 'speed', unit: 'm_s' },
    { id: 'bottom_velocity_m_s', label: 'Horizontal orbital velocity at the bottom', group: 'speed', unit: 'm_s' },
    { id: 'energy_flux_kw_m', label: 'Energy flux P = ρ g H² c_g/8 per metre of crest', group: 'power', unit: 'W', display: 'kW' },
    { id: 'encounter_period_s', label: 'Encounter period T_e = 2π/(ω + k V cos α)', group: 'time', unit: 's' },
    { id: 'encounter_circ_s', label: 'Encounter period by MSC.1/Circ.1228 (deep water)', group: 'time', unit: 's' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      depth_mode: 'deep',
    },
    results: {
      deep_length_m: '156.1 m',
      celerity_m_s: '15.6 m/s',
      group_velocity_m_s: '7.8 m/s',
      steepness: '0.019',
      breaking_height_m: '22 m',
      surface_velocity_m_s: '0.94 m/s',
      depth_velocity_m_s: '0.63 m/s',
      energy_flux_kw_m: '88 kW',
      encounter_period_s: '6.7 s',
      encounter_circ_s: '6.67 s',
    },
  },
};

/** Wavenumber from the dispersion relation for angular frequency omega and depth h (m); Infinity depth allowed. */
export function wavenumber(omega, depthM) {
  const g = GRAVITY_M_S2;
  const k0 = (omega * omega) / g;
  if (!Number.isFinite(depthM)) return k0;
  // Fenton & McKee (1990) initial guess, then Newton on f(k) = g k tanh(kh) − ω²
  let k = k0 * (1 / Math.tanh((k0 * depthM) ** 0.75)) ** (2 / 3);
  for (let n = 0; n < 50; n += 1) {
    const th = Math.tanh(k * depthM);
    const f = g * k * th - omega * omega;
    const df = g * th + g * k * depthM * (1 - th * th);
    const step = f / df;
    k -= step;
    if (Math.abs(step) < 1e-14 * k) break;
  }
  return k;
}

/** Wave period for a wavelength and depth. */
export function periodFromLength(lengthM, depthM) {
  const k = (2 * Math.PI) / lengthM;
  const th = Number.isFinite(depthM) ? Math.tanh(k * depthM) : 1;
  return (2 * Math.PI) / Math.sqrt(GRAVITY_M_S2 * k * th);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.wave_input, ['period', 'length'], 'wave_input', 'Wave input');
  assertOneOf(i.depth_mode, ['deep', 'finite'], 'depth_mode', 'Depth mode');
  assertNonNegative(i.height_m, 'height_m', 'Wave height');
  assertNonNegative(i.eval_depth_m, 'eval_depth_m', 'Evaluation depth');
  assertNonNegative(i.speed_kn, 'speed_kn', 'Speed');
  assertRange(i.heading_deg, 0, 360, 'heading_deg', 'Heading');
  assertPositive(i.rho_kg_m3, 'rho_kg_m3', 'Density');
  const g = GRAVITY_M_S2;
  const h = i.depth_mode === 'deep' ? Infinity : assertPositive(i.depth_m, 'depth_m', 'Water depth');

  let T;
  let k;
  if (i.wave_input === 'period') {
    T = assertPositive(i.period_s, 'period_s', 'Period');
    k = wavenumber((2 * Math.PI) / T, h);
  } else {
    const L = assertPositive(i.length_m, 'length_m', 'Wavelength');
    k = (2 * Math.PI) / L;
    T = periodFromLength(L, h);
  }
  const omega = (2 * Math.PI) / T;
  const L = (2 * Math.PI) / k;
  const L0 = (g * T * T) / (2 * Math.PI);
  const c = L / T;
  const kh = Number.isFinite(h) ? k * h : Infinity;
  const n = Number.isFinite(h) ? 0.5 * (1 + (2 * kh) / Math.sinh(2 * kh)) : 0.5;
  const cg = n * c;
  const depthRatio = Number.isFinite(h) ? h / L : Infinity;
  const regime = !Number.isFinite(h) || depthRatio > 0.5 ? 'Deep water (h/λ > 0.5): no bottom influence' : depthRatio < 0.05 ? 'Shallow water (h/λ < 0.05): c ≈ √(gh), non-dispersive' : 'Intermediate depth (0.05 ≤ h/λ ≤ 0.5): full dispersion relation';
  const H = i.height_m;
  const tanhkh = Number.isFinite(h) ? Math.tanh(kh) : 1;
  const hMax = 0.142 * L * tanhkh;
  let breaking;
  if (H === 0) breaking = 'No height entered';
  else if (H >= hMax) breaking = `BREAKING — H ${H} m ≥ Miche limit ${hMax.toFixed(2)} m`;
  else if (H >= 0.7 * hMax) breaking = `Near breaking — H is ${((H / hMax) * 100).toFixed(0)} % of the Miche limit ${hMax.toFixed(2)} m; linear theory is rough here`;
  else breaking = `Stable — H is ${((H / hMax) * 100).toFixed(0)} % of the Miche limit ${hMax.toFixed(2)} m`;

  const a = H / 2;
  // cosh(k(h − z))/sinh(kh) written as e^(−kz)(1 + e^(−2k(h−z)))/(1 − e^(−2kh)) so that deep water (kh > 710) cannot overflow
  const uAt = (z) => {
    if (!Number.isFinite(h)) return a * omega * Math.exp(-k * z);
    return (a * omega * Math.exp(-k * z) * (1 + Math.exp(-2 * k * (h - z)))) / -Math.expm1(-2 * kh);
  };
  const zEval = Number.isFinite(h) ? Math.min(i.eval_depth_m, h) : i.eval_depth_m;
  const uSurface = uAt(0);
  const uDepth = uAt(zEval);
  const uBottom = Number.isFinite(h) ? uAt(h) : 0;
  const energyFlux = (i.rho_kg_m3 * g * H * H * cg) / 8;

  const V = i.speed_kn * KNOT_M_S;
  const cosA = Math.cos((i.heading_deg * Math.PI) / 180);
  const omegaE = omega + k * V * cosA;
  const Te = Math.abs(omegaE) > 1e-9 ? (2 * Math.PI) / Math.abs(omegaE) : null;
  const denomCirc = 3 * T + i.speed_kn * cosA;
  const TeCirc = Math.abs(denomCirc) > 1e-9 ? Math.abs((3 * T * T) / denomCirc) : null;

  const warnings = [];
  if (Number.isFinite(h) && i.eval_depth_m > h) warnings.push(`Evaluation depth ${i.eval_depth_m} m exceeds the water depth: velocity shown at the bottom (${h} m).`);
  if (H > 0 && H / L > 0.05) warnings.push('Steepness above 1/20: second-order effects (sharper crests, flatter troughs) are noticeable; linear theory underestimates crest velocities.');
  if (Number.isFinite(h) && depthRatio < 0.05) warnings.push('Shallow water: waves are non-dispersive and the linear profile is poor near breaking (cnoidal theory applies).');
  if (omegaE < 0) warnings.push('Ship overtaking the waves (ω_e negative): the encounter period shown is the magnitude; the waves pass from ahead to astern relative to the ship.');
  if (Te === null) warnings.push('Ship running exactly with the waves: infinite encounter period (surf-riding regime).');
  if (!Number.isFinite(h)) warnings.push('Deep-water assumption: for h/λ below 0.5 choose finite depth.');
  warnings.push('Regular linear wave: for an irregular sea use H_s and the peak/energy period and treat the velocities as representative, not extreme.');

  return {
    outputs: {
      period_out_s: T,
      length_out_m: L,
      deep_length_m: L0,
      wavenumber: k,
      celerity_m_s: c,
      group_velocity_m_s: cg,
      depth_ratio: Number.isFinite(depthRatio) ? depthRatio : null,
      regime,
      steepness: H / L,
      breaking_height_m: hMax,
      breaking_status: breaking,
      surface_velocity_m_s: uSurface,
      depth_velocity_m_s: uDepth,
      bottom_velocity_m_s: uBottom,
      energy_flux_kw_m: energyFlux,
      encounter_period_s: Te,
      encounter_circ_s: !Number.isFinite(h) || depthRatio > 0.5 ? TeCirc : null,
    },
    warnings,
  };
}
