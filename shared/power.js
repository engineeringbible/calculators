/**
 * shared/power.js — conversions between power, current and voltage for DC, single-phase AC and balanced three-phase
 * AC circuits, used by the watts-to-amps family of calculators. DOM-free.
 *
 * DC: P = V I.  Single-phase: P = V I cos φ.  Three-phase: P = √3 V_LL I cos φ.  S = P / cos φ.
 */

export const SYSTEMS = {
  dc: { label: 'DC', factor: () => 1 },
  ac1: { label: 'AC single-phase', factor: () => 1 },
  ac3: { label: 'AC three-phase (line-to-line voltage)', factor: () => Math.sqrt(3) },
};

export const systemOptions = () => Object.entries(SYSTEMS).map(([value, s]) => ({ value, label: s.label }));

const pfOf = (system, pf) => (system === 'dc' ? 1 : pf);

/** Current in A from real power in W. */
export function currentFromPower(system, powerW, voltageV, pf = 1) {
  return powerW / (SYSTEMS[system].factor() * voltageV * pfOf(system, pf));
}

/** Real power in W from current in A. */
export function powerFromCurrent(system, currentA, voltageV, pf = 1) {
  return SYSTEMS[system].factor() * voltageV * currentA * pfOf(system, pf);
}

/** Apparent power in VA from real power in W. */
export const apparentFromReal = (powerW, pf) => powerW / pf;

/** Real power in W from apparent power in VA. */
export const realFromApparent = (apparentVA, pf) => apparentVA * pf;

/** Reactive power in var from real power and power factor. */
export const reactiveFromReal = (powerW, pf) => (powerW / pf) * Math.sqrt(Math.max(0, 1 - pf * pf));
