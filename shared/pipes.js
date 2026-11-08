/**
 * shared/pipes.js — pipe friction and fitting losses shared by the minor losses and total dynamic head calculators.
 * DOM-free.
 *
 * Colebrook: 1/√f = −2 log10(ε/(3.7 D) + 2.51/(Re √f)); laminar f = 64/Re below Re 2 300.
 * Fully turbulent friction factor f_T = [−2 log10(ε/(3.7 D))]⁻² (Crane TP-410 basis, ε = 0.046 mm for clean steel).
 * Fitting K = f_T × (L/D) with the equivalent lengths of Crane TP-410, Appendix A.
 */

export const G = 9.80665;

/** Darcy friction factor. */
export function frictionFactor(re, relRough) {
  if (re <= 0) throw new Error('Reynolds number must be positive.');
  if (re < 2300) return 64 / re;
  let f = 0.02;
  for (let k = 0; k < 60; k += 1) f = (-2 * Math.log10(relRough / 3.7 + 2.51 / (re * Math.sqrt(f)))) ** -2;
  return f;
}

/** Friction factor in the fully turbulent zone for a pipe of bore d (m) and roughness eps (m). */
export const fullyTurbulentF = (d, eps = 0.000046) => (-2 * Math.log10(eps / (3.7 * d))) ** -2;

/** Crane TP-410 equivalent lengths L/D (K = f_T L/D), and fixed K values for entrance and exit. */
export const FITTINGS = {
  elbow90: { label: '90° standard elbow', ld: 30 },
  bend90: { label: '90° long-radius bend (r/D = 1.5)', ld: 14 },
  elbow45: { label: '45° standard elbow', ld: 16 },
  tee_run: { label: 'Tee, flow through the run', ld: 20 },
  tee_branch: { label: 'Tee, flow through the branch', ld: 60 },
  gate: { label: 'Gate valve, fully open', ld: 8 },
  ball: { label: 'Ball valve, full bore, open', ld: 3 },
  butterfly: { label: 'Butterfly valve, open (2–8 in)', ld: 45 },
  globe: { label: 'Globe valve, fully open', ld: 340 },
  check_swing: { label: 'Swing check valve', ld: 100 },
  entrance: { label: 'Pipe entrance, sharp-edged (K = 0.5)', k: 0.5 },
  exit: { label: 'Pipe exit into a tank (K = 1.0)', k: 1.0 },
};

/** Total K of a set of fitting counts { id: n } for a bore d. */
export function fittingsK(counts, d, eps = 0.000046) {
  const fT = fullyTurbulentF(d, eps);
  let sum = 0;
  for (const [id, n] of Object.entries(counts)) {
    if (!n) continue;
    const f = FITTINGS[id];
    if (!f) throw new Error(`Unknown fitting "${id}"`);
    sum += n * (f.k ?? fT * f.ld);
  }
  return { fT, K: sum };
}
