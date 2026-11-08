/**
 * orifice-flow/calc.js — flow measurement with orifice plates (ISO 5167-2, Reader-Harris/Gallagher discharge coefficient)
 * and classical Venturi tubes (ISO 5167-4): mass and volume flow from the differential pressure, or the differential
 * pressure for a given flow, with expansibility for gases, Reynolds-number iteration, permanent pressure loss and the
 * validity limits of the standard.
 *
 * q_m = C/√(1 − β⁴) ε (π/4) d² √(2 Δp ρ₁).
 * Schema units: m, Pa, kg/m³, Pa·s, kg/s, m³/s.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

export const DEVICES = {
  orifice_corner: { label: 'Orifice plate — corner tappings', kind: 'orifice', L1: 0, L2: 0 },
  orifice_flange: { label: 'Orifice plate — flange tappings (25.4 mm)', kind: 'orifice', L1: null, L2: null },
  orifice_dd2: { label: 'Orifice plate — D and D/2 tappings', kind: 'orifice', L1: 1, L2: 0.47 },
  venturi_machined: { label: 'Classical Venturi — machined convergent (C 0.995)', kind: 'venturi', C: 0.995, betaMin: 0.4, betaMax: 0.75, reMin: 2e5, reMax: 1e6, dMin: 0.05, dMax: 0.25 },
  venturi_cast: { label: 'Classical Venturi — as-cast convergent (C 0.984)', kind: 'venturi', C: 0.984, betaMin: 0.3, betaMax: 0.75, reMin: 2e5, reMax: 2e6, dMin: 0.1, dMax: 0.8 },
  venturi_welded: { label: 'Classical Venturi — rough-welded sheet-iron convergent (C 0.985)', kind: 'venturi', C: 0.985, betaMin: 0.4, betaMax: 0.7, reMin: 2e5, reMax: 2e6, dMin: 0.2, dMax: 1.2 },
};

export const schema = {
  id: 'orifice-flow',
  name: 'Orifice and venturi flow (ISO 5167)',
  category: 'thermal',
  summary: 'Flow from differential pressure for orifice plates and venturis with the Reader-Harris/Gallagher discharge coefficient and expansibility.',
  related: ['pipe-flow', 'pump-npsh', 'tank-volume', 'unit-converter'],
  assumptions: [
    'ISO 5167 applies to steady, single-phase, subsonic flow in a circular pipe running full, with the straight lengths and plate/tube geometry of the standard; the discharge coefficient is the Reader-Harris/Gallagher (1998) equation of ISO 5167-2:2003 eq. 4 for orifice plates (corner, flange or D and D/2 tappings, with the extra term for D < 71.12 mm) and the constant coefficients of ISO 5167-4 for classical Venturi tubes (0.995 machined, 0.984 as-cast, 0.985 rough-welded).',
    'The flow depends on the Reynolds number through C and vice versa, so the flow-from-Δp mode iterates until the Reynolds number is consistent (the standard\'s iterative procedure); the Δp-from-flow mode is direct.',
    'Expansibility for gases: ε = 1 − (0.351 + 0.256 β⁴ + 0.93 β⁸)[1 − (p₂/p₁)^(1/κ)] for orifice plates (ISO 5167-2 eq. 5, valid for p₂/p₁ ≥ 0.75) and the isentropic Venturi expression of ISO 5167-4 eq. 3; liquids have ε = 1. The density is the upstream density at p₁ and T₁.',
    'Permanent pressure loss for orifice plates Δϖ = [√(1 − β⁴(1 − C²)) − C β²]/[√(1 − β⁴(1 − C²)) + C β²] Δp (ISO 5167-2 §5.4.1); for classical Venturis the loss is taken as 10 % of Δp (ISO 5167-4 gives 5–20 % depending on the divergent angle).',
    'Validity limits checked and reported: orifice d ≥ 12.5 mm, 50 ≤ D ≤ 1 000 mm, 0.10 ≤ β ≤ 0.75, Re_D ≥ 5 000 (and ≥ 16 000 β² for β > 0.56 with corner or D–D/2 taps; flange taps also Re_D ≥ 170 β² D/mm); Venturi β, Re_D and D ranges per type; outside them the uncertainty of the standard (0.5–0.75 % on C) no longer applies and the page warns.',
    'Pipe roughness, plate edge sharpness, bending of the plate and upstream disturbances are assumed within the standard\'s limits; drain holes, wet gas and pulsating flow are excluded.',
  ],
  notes: [
    'Verification 2026-10-30: the Reader-Harris/Gallagher equation was transcribed term by term against the HydrauCalc reproduction of ISO 5167-2:2003 eq. 4; the flange-tap case D 102.26 mm, d 51.13 mm, water 998.2 kg/m³ / 1.002 mPa·s, Δp 250 mbar converges to Re_D 112 800, C 0.6059, 9.078 kg/s (32.74 m³/h), the published calculator result; the gas expansibility for β 0.5, p₂/p₁ 0.9, κ 1.4 is 0.9731 by hand.',
    'Design decision: three orifice tapping arrangements and three Venturi types are offered through one device select; the ISA 1932 and long-radius nozzles of ISO 5167-3 are not included.',
    'Design decision: mode "Δp from flow" is included because transmitter ranging needs it; it accepts mass or volume flow.',
  ],
  sources: [
    'ISO 5167-1:2003 General principles and requirements; ISO 5167-2:2003 Orifice plates (eq. 4 discharge coefficient, eq. 5 expansibility, §5.4 pressure loss); ISO 5167-4:2003 Venturi tubes',
    'M. J. Reader-Harris & J. A. Sattary, "The orifice plate discharge coefficient equation — further work" (NEL, Flow Measurement and Instrumentation 1996/1998)',
    'HydrauCalc, "Square-edge orifice flowmeter ISO 5167-2:2003" application notes (corner, D–D/2 tappings), March 2019 — reproduction of the equations used for transcription checking',
    'R. W. Miller, Flow Measurement Engineering Handbook, 3rd ed. (McGraw-Hill 1996) — background and iteration procedure',
  ],
  inputs: [
    { id: 'device', label: 'Primary device', type: 'select', default: 'orifice_flange', options: Object.entries(DEVICES).map(([value, d]) => ({ value, label: d.label })) },
    { id: 'mode', label: 'Find', type: 'select', default: 'flow', options: [{ value: 'flow', label: 'Flow from the differential pressure' }, { value: 'dp', label: 'Differential pressure for a given flow' }] },
    { id: 'pipe_d_m', label: 'Pipe internal diameter D', group: 'length', unit: 'm', display: 'mm', default: 0.10226, min: 0.01, max: 2 },
    { id: 'bore_d_m', label: 'Orifice bore / Venturi throat diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.05113, min: 0.005, max: 2 },
    { id: 'fluid', label: 'Fluid', type: 'select', default: 'liquid', options: [{ value: 'liquid', label: 'Liquid (ε = 1)' }, { value: 'gas', label: 'Gas or steam (expansibility from κ and p₁)' }] },
    { id: 'density_kg_m3', label: 'Fluid density at upstream conditions ρ₁', group: 'density', unit: 'kg_m3', default: 998.2, min: 0.05, max: 2000 },
    { id: 'viscosity_pa_s', label: 'Dynamic viscosity μ', group: 'dynamic_viscosity', unit: 'Pa_s', display: 'mPa_s', default: 0.001002, min: 1e-6, max: 10 },
    { id: 'dp_pa', label: 'Differential pressure Δp', group: 'pressure', unit: 'Pa', display: 'mbar', default: 25000, min: 1, max: 1e6, visibleWhen: { mode: 'flow' } },
    { id: 'flow_basis', label: 'Flow given as', type: 'select', default: 'volume', options: [{ value: 'volume', label: 'Volume flow (at upstream conditions)' }, { value: 'mass', label: 'Mass flow' }], visibleWhen: { mode: 'dp' } },
    { id: 'volume_flow_m3_s', label: 'Volume flow q_v', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 0.009094, min: 1e-7, max: 100, visibleWhen: { mode: 'dp', flow_basis: 'volume' } },
    { id: 'mass_flow_kg_s', label: 'Mass flow q_m', group: 'mass_flow', unit: 'kg_s', default: 9.078, min: 1e-6, max: 1e5, visibleWhen: { mode: 'dp', flow_basis: 'mass' } },
    { id: 'p1_pa', label: 'Upstream absolute pressure p₁ (gas)', group: 'pressure', unit: 'Pa', display: 'bar', default: 500000, min: 1000, max: 5e7, visibleWhen: { fluid: 'gas' } },
    { id: 'kappa', label: 'Isentropic exponent κ (gas)', group: 'dimensionless', unit: 'none', default: 1.4, min: 1.05, max: 1.8, visibleWhen: { fluid: 'gas' } },
  ],
  outputs: [
    { id: 'beta', label: 'Diameter ratio β = d/D', group: 'dimensionless', unit: 'none' },
    { id: 'discharge_coefficient', label: 'Discharge coefficient C', group: 'dimensionless', unit: 'none' },
    { id: 'expansibility', label: 'Expansibility factor ε', group: 'dimensionless', unit: 'none' },
    { id: 'reynolds_pipe', label: 'Pipe Reynolds number Re_D', group: 'dimensionless', unit: 'none' },
    { id: 'reynolds_bore', label: 'Bore Reynolds number Re_d = Re_D/β', group: 'dimensionless', unit: 'none' },
    { id: 'dp_out_pa', label: 'Differential pressure Δp', group: 'pressure', unit: 'Pa', display: 'mbar' },
    { id: 'mass_flow_out_kg_s', label: 'Mass flow q_m', group: 'mass_flow', unit: 'kg_s' },
    { id: 'volume_flow_out_m3_s', label: 'Volume flow q_v (upstream conditions)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'pipe_velocity_m_s', label: 'Pipe velocity', group: 'speed', unit: 'm_s' },
    { id: 'throat_velocity_m_s', label: 'Bore / throat velocity', group: 'speed', unit: 'm_s' },
    { id: 'velocity_of_approach', label: 'Velocity of approach factor E = 1/√(1 − β⁴)', group: 'dimensionless', unit: 'none' },
    { id: 'flow_coefficient', label: 'Flow coefficient α = C E', group: 'dimensionless', unit: 'none' },
    { id: 'pressure_loss_pa', label: 'Permanent pressure loss Δϖ', group: 'pressure', unit: 'Pa', display: 'mbar' },
    { id: 'pressure_loss_ratio_pct', label: 'Permanent loss as share of Δp', group: 'ratio', unit: 'pct' },
    { id: 'validity', label: 'ISO 5167 validity', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      discharge_coefficient: '0.6059',
      mass_flow_out_kg_s: '9.08 kg/s',
      volume_flow_out_m3_s: '32.7 m³/h',
      pipe_velocity_m_s: '1.11 m/s',
      throat_velocity_m_s: '4.43 m/s',
      velocity_of_approach: '1.033',
    },
  },
};

/** Reader-Harris/Gallagher discharge coefficient (ISO 5167-2:2003 eq. 4). D in metres. */
export function readerHarrisGallagher(beta, reD, tapping, pipeDm) {
  const Dmm = pipeDm * 1000;
  let L1;
  let L2;
  if (tapping === 'orifice_flange') {
    L1 = 25.4 / Dmm;
    L2 = 25.4 / Dmm;
  } else {
    L1 = DEVICES[tapping].L1;
    L2 = DEVICES[tapping].L2;
  }
  const M2 = (2 * L2) / (1 - beta);
  const A = ((19000 * beta) / reD) ** 0.8;
  let C = 0.5961 + 0.0261 * beta ** 2 - 0.216 * beta ** 8 + 0.000521 * ((1e6 * beta) / reD) ** 0.7
    + (0.0188 + 0.0063 * A) * beta ** 3.5 * (1e6 / reD) ** 0.3
    + (0.043 + 0.08 * Math.exp(-10 * L1) - 0.123 * Math.exp(-7 * L1)) * (1 - 0.11 * A) * (beta ** 4 / (1 - beta ** 4))
    - 0.031 * (M2 - 0.8 * M2 ** 1.1) * beta ** 1.3;
  if (Dmm < 71.12) C += 0.011 * (0.75 - beta) * (2.8 - Dmm / 25.4);
  return C;
}

/** Orifice expansibility (ISO 5167-2 eq. 5). */
export function orificeExpansibility(beta, pressureRatio, kappa) {
  return 1 - (0.351 + 0.256 * beta ** 4 + 0.93 * beta ** 8) * (1 - pressureRatio ** (1 / kappa));
}

/** Venturi expansibility (ISO 5167-4 eq. 3). */
export function venturiExpansibility(beta, tau, kappa) {
  const b4 = beta ** 4;
  return Math.sqrt(((kappa * tau ** (2 / kappa)) / (kappa - 1)) * ((1 - b4) / (1 - b4 * tau ** (2 / kappa))) * ((1 - tau ** ((kappa - 1) / kappa)) / (1 - tau)));
}

/** Permanent pressure loss ratio for an orifice plate (ISO 5167-2 §5.4.1). */
export function orificeLossRatio(beta, C) {
  const s = Math.sqrt(1 - beta ** 4 * (1 - C * C));
  return (s - C * beta * beta) / (s + C * beta * beta);
}

function validity(deviceKey, beta, reD, pipeDm, boreDm, pressureRatio, isGas) {
  const d = DEVICES[deviceKey];
  const issues = [];
  if (d.kind === 'orifice') {
    if (boreDm < 0.0125) issues.push('d < 12.5 mm');
    if (pipeDm < 0.05 || pipeDm > 1) issues.push('D outside 50–1 000 mm');
    if (beta < 0.1 || beta > 0.75) issues.push('β outside 0.10–0.75');
    if (reD < 5000) issues.push('Re_D < 5 000');
    if (deviceKey === 'orifice_flange') {
      if (reD < 170 * beta * beta * pipeDm * 1000) issues.push('Re_D < 170 β² D (flange taps)');
    } else if (beta > 0.56 && reD < 16000 * beta * beta) issues.push('Re_D < 16 000 β² (β > 0.56)');
    if (isGas && pressureRatio < 0.75) issues.push('p₂/p₁ < 0.75 (expansibility equation)');
  } else {
    if (beta < d.betaMin || beta > d.betaMax) issues.push(`β outside ${d.betaMin}–${d.betaMax}`);
    if (reD < d.reMin || reD > d.reMax) issues.push(`Re_D outside ${d.reMin.toExponential(0)}–${d.reMax.toExponential(0)}`);
    if (pipeDm < d.dMin || pipeDm > d.dMax) issues.push(`D outside ${d.dMin * 1000}–${d.dMax * 1000} mm`);
  }
  return issues;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.device, Object.keys(DEVICES), 'device', 'Primary device');
  assertOneOf(i.mode, ['flow', 'dp'], 'mode', 'Find');
  assertOneOf(i.fluid, ['liquid', 'gas'], 'fluid', 'Fluid');
  assertOneOf(i.flow_basis, ['volume', 'mass'], 'flow_basis', 'Flow basis');
  assertPositive(i.pipe_d_m, 'pipe_d_m', 'Pipe diameter');
  assertPositive(i.bore_d_m, 'bore_d_m', 'Bore diameter');
  assertPositive(i.density_kg_m3, 'density_kg_m3', 'Density');
  assertPositive(i.viscosity_pa_s, 'viscosity_pa_s', 'Viscosity');
  if (i.bore_d_m >= i.pipe_d_m) throw new Error(`Bore ${(i.bore_d_m * 1000).toFixed(2)} mm must be smaller than the pipe diameter ${(i.pipe_d_m * 1000).toFixed(2)} mm`);
  const device = DEVICES[i.device];
  const D = i.pipe_d_m;
  const d = i.bore_d_m;
  const beta = d / D;
  const E = 1 / Math.sqrt(1 - beta ** 4);
  const area = (Math.PI / 4) * d * d;
  const rho = i.density_kg_m3;
  const mu = i.viscosity_pa_s;
  const isGas = i.fluid === 'gas';
  let kappa = 1.4;
  let p1 = Infinity;
  if (isGas) {
    kappa = assertRange(i.kappa, 1.01, 2, 'kappa', 'Isentropic exponent');
    p1 = assertPositive(i.p1_pa, 'p1_pa', 'Upstream pressure');
  }
  const eps = (dp) => {
    if (!isGas) return 1;
    const tau = (p1 - dp) / p1;
    if (tau <= 0) throw new Error('Differential pressure exceeds the upstream absolute pressure');
    return device.kind === 'orifice' ? orificeExpansibility(beta, tau, kappa) : venturiExpansibility(beta, tau, kappa);
  };
  const coefficient = (reD) => (device.kind === 'venturi' ? device.C : readerHarrisGallagher(beta, Math.max(reD, 100), i.device, D));

  let dp;
  let qm;
  let C;
  let epsilon;
  if (i.mode === 'flow') {
    dp = assertPositive(i.dp_pa, 'dp_pa', 'Differential pressure');
    epsilon = eps(dp);
    C = 0.6;
    for (let k = 0; k < 50; k += 1) {
      qm = C * E * epsilon * area * Math.sqrt(2 * dp * rho);
      const reD = (4 * qm) / (Math.PI * D * mu);
      const next = coefficient(reD);
      if (Math.abs(next - C) < 1e-12) { C = next; break; }
      C = next;
    }
    qm = C * E * epsilon * area * Math.sqrt(2 * dp * rho);
  } else {
    qm = i.flow_basis === 'mass' ? assertPositive(i.mass_flow_kg_s, 'mass_flow_kg_s', 'Mass flow') : assertPositive(i.volume_flow_m3_s, 'volume_flow_m3_s', 'Volume flow') * rho;
    const reD = (4 * qm) / (Math.PI * D * mu);
    C = coefficient(reD);
    epsilon = 1;
    dp = (qm / (C * E * area)) ** 2 / (2 * rho);
    if (isGas) {
      for (let k = 0; k < 50; k += 1) {
        epsilon = eps(dp);
        const next = (qm / (C * E * epsilon * area)) ** 2 / (2 * rho);
        if (Math.abs(next - dp) < 1e-9 * dp) { dp = next; break; }
        dp = next;
      }
    }
  }
  const reD = (4 * qm) / (Math.PI * D * mu);
  const qv = qm / rho;
  const lossRatio = device.kind === 'orifice' ? orificeLossRatio(beta, C) : 0.1;
  const pressureRatio = isGas ? (p1 - dp) / p1 : 1;
  const issues = validity(i.device, beta, reD, D, d, pressureRatio, isGas);
  const validityText = issues.length ? `OUTSIDE ISO 5167 limits: ${issues.join('; ')} — coefficient uncertainty not guaranteed` : `Within ISO 5167 limits (β ${beta.toFixed(3)}, Re_D ${reD.toExponential(2)})`;

  const warnings = [];
  if (issues.length) warnings.push('Operating point outside the standard\'s validity: the discharge coefficient equation is being extrapolated.');
  if (device.kind === 'venturi') warnings.push('Classical Venturi: constant discharge coefficient of ISO 5167-4 within its Reynolds range; permanent loss taken as 10 % of Δp (5–20 % depending on the divergent angle).');
  if (isGas) warnings.push('Gas: density and volume flow refer to upstream conditions p₁, T₁; the expansibility equation holds for p₂/p₁ ≥ 0.75.');
  if (device.kind === 'orifice' && beta > 0.65) warnings.push('β above 0.65: the standard\'s uncertainty on C grows (up to 0.75 %) and the permanent pressure loss is small but the plate is sensitive to upstream disturbances.');
  warnings.push('Uncertainty of C per ISO 5167: 0.5 % (β ≤ 0.6) to 0.75 % for orifice plates, 1–1.5 % for Venturi tubes; add Δp, density and diameter uncertainties for the flow uncertainty.');

  return {
    outputs: {
      beta,
      discharge_coefficient: C,
      expansibility: epsilon,
      reynolds_pipe: reD,
      reynolds_bore: reD / beta,
      dp_out_pa: dp,
      mass_flow_out_kg_s: qm,
      volume_flow_out_m3_s: qv,
      pipe_velocity_m_s: qv / ((Math.PI / 4) * D * D),
      throat_velocity_m_s: qv / area,
      velocity_of_approach: E,
      flow_coefficient: C * E,
      pressure_loss_pa: lossRatio * dp,
      pressure_loss_ratio_pct: lossRatio * 100,
      validity: validityText,
    },
    warnings,
  };
}
