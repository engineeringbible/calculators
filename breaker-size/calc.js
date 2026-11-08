/**
 * breaker-size/calc.js — circuit breaker rating for a load: the design current from the load current or power, the
 * NEC 125 % rule for continuous loads or the IEC rule Ib ≤ In ≤ Iz, the next standard rating, and a check against
 * the ampacity of the wire.
 *
 * NEC: rating ≥ 1.25 × I_continuous + I_noncontinuous (210.20(A)), next standard size of 240.6(A).
 * IEC: In ≥ Ib, next preferred rating (IEC 60898-1 to 125 A, IEC 60059 R10 above); In ≤ Iz (IEC 60364-4-43, 433.1).
 * Schema units: SI — A, W, V.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';
import { systemOptions, currentFromPower } from '../shared/power.js';

/** NEC 240.6(A) standard ampere ratings of fuses and inverse-time circuit breakers. */
export const NEC_RATINGS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];

/** IEC 60898-1 preferred rated currents of MCBs to 125 A, then the IEC 60059 R10 standard current ratings. */
export const IEC_RATINGS = [6, 8, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300];

/** NEC 240.4(D): largest overcurrent protection of small copper conductors. */
const NEC_SMALL_COPPER = [[15, '14 AWG'], [20, '12 AWG'], [30, '10 AWG']];

export const schema = {
  id: 'breaker-size',
  name: 'Breaker size calculator',
  category: 'electrical',
  summary: 'Breaker size for a load in amps or watts, by the NEC 125 % continuous-load rule or IEC Ib ≤ In ≤ Iz, with the standard rating and a wire check.',
  related: ['wire-size', 'watts-to-amps', 'kw-to-amps', 'awg-wire-gauge'],
  assumptions: [
    'The breaker protects a feeder or branch circuit for general loads. Motor circuits follow other rules (NEC 430.52 allows up to 250 % of the motor current for inverse-time breakers; IEC uses motor-protection breakers or fuses chosen for the starting current).',
    'NEC: a continuous load runs for 3 hours or more, and the breaker must be rated at least 125 % of it (210.20(A), 215.3), the same as loading a standard breaker to 80 %. 100 %-rated breakers in listed assemblies are not covered.',
    'IEC: the rated current must be at least the design current, Ib ≤ In, and at most the current-carrying capacity of the cable, In ≤ Iz (IEC 60364-4-43, 433.1). For MCBs and most circuit breakers the conventional tripping current is 1.45 In or less, so the second condition of 433.1 is then met as well.',
    'The power factor applies only to AC; the current from power uses P = V I (DC), V I cos φ (single-phase) or √3 V I cos φ (three-phase).',
    'The wire is not sized here because its ampacity depends on insulation, installation and ambient temperature; enter it from the code table to check the pair. NEC 240.4(D) limits 14, 12 and 10 AWG copper to 15, 20 and 30 A.',
  ],
  notes: [
    'Verification 2026-11-07: a 7.2 kW EV charger at 240 V draws 30 A; as a continuous load it needs 37.5 A, so a 40 A breaker (NEC 625.41 and 210.20(A)). Checked by hand.',
  ],
  sources: [
    'NFPA 70, National Electrical Code (2023): 210.20(A), 215.3 (125 % of continuous load), 240.4(B) and 240.4(D) (conductor protection), 240.6(A) (standard ratings), 625.41 (EV charging, 125 %)',
    'IEC 60364-4-43:2023, 433.1 (coordination between conductors and overload protective devices: Ib ≤ In ≤ Iz, I2 ≤ 1.45 Iz)',
    'IEC 60898-1:2015 (preferred rated currents of circuit-breakers for household installations) and IEC 60059:1999 (IEC standard current ratings, R10 series)',
  ],
  inputs: [
    { id: 'standard', label: 'Rules', type: 'select', default: 'nec', options: [{ value: 'nec', label: 'NEC (US): 125 % for continuous loads' }, { value: 'iec', label: 'IEC: Ib ≤ In ≤ Iz' }] },
    { id: 'mode', label: 'Load given as', type: 'select', default: 'power', options: [{ value: 'power', label: 'Power (W, kW)' }, { value: 'current', label: 'Current (A)' }] },
    { id: 'system', label: 'System', type: 'select', default: 'ac1', options: systemOptions() },
    { id: 'power_w', label: 'Load power', group: 'power', unit: 'W', display: 'kW', default: 7200, min: 0, max: 1e8, visibleWhen: { mode: 'power' } },
    { id: 'voltage_v', label: 'Voltage (line-to-line for three-phase)', group: 'voltage', unit: 'V', default: 240, min: 1, max: 100000, visibleWhen: { mode: 'power' } },
    { id: 'power_factor', label: 'Power factor cos φ (AC)', group: 'dimensionless', unit: 'none', default: 1, min: 0.05, max: 1, visibleWhen: { mode: 'power' } },
    { id: 'current_a', label: 'Load current', group: 'current', unit: 'A', default: 30, min: 0, max: 10000, visibleWhen: { mode: 'current' } },
    { id: 'continuous', label: 'Continuous load (3 hours or more)?', type: 'select', default: 'yes', options: [{ value: 'yes', label: 'Yes: EV chargers, heaters, lighting, servers' }, { value: 'no', label: 'No: intermittent load' }], visibleWhen: { standard: 'nec' } },
    { id: 'wire_ampacity_a', label: 'Ampacity of the wire, Iz (optional, from the code table)', group: 'current', unit: 'A', default: 0, min: 0, max: 10000 },
  ],
  outputs: [
    { id: 'design_current_a', label: 'Load current Ib', group: 'current', unit: 'A' },
    { id: 'min_rating_a', label: 'Minimum breaker rating', group: 'current', unit: 'A' },
    { id: 'breaker_a', label: 'Breaker size (next standard rating)', group: 'current', unit: 'A', decimals: 0 },
    { id: 'loading', label: 'Load as a share of the breaker rating', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'wire_check', label: 'Wire check', type: 'text' },
    { id: 'small_wire', label: 'Smallest copper wire allowed on this breaker (NEC 240.4(D))', type: 'text', visibleWhen: { standard: 'nec' } },
  ],
  example: {
    inputs: { standard: 'nec', mode: 'power', system: 'ac1', power_w: [7.2, 'kW'], voltage_v: [240, 'V'], power_factor: 1, continuous: 'yes', wire_ampacity_a: [0, 'A'] },
    results: { design_current_a: '30.0 A', min_rating_a: '37.5 A', breaker_a: '40 A', loading: '75 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.standard, ['nec', 'iec'], 'standard', 'Rules');
  assertOneOf(x.mode, ['power', 'current'], 'mode', 'Load given as');
  assertOneOf(x.system, ['dc', 'ac1', 'ac3'], 'system', 'System');
  assertOneOf(x.continuous, ['yes', 'no'], 'continuous', 'Continuous load');
  const iz = assertNonNegative(x.wire_ampacity_a, 'wire_ampacity_a', 'Ampacity of the wire');

  let ib;
  if (x.mode === 'power') {
    const p = assertPositive(x.power_w, 'power_w', 'Load power');
    const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
    const pf = assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
    ib = currentFromPower(x.system, p, v, pf);
  } else {
    ib = assertPositive(x.current_a, 'current_a', 'Load current');
  }

  const nec = x.standard === 'nec';
  const minRating = nec && x.continuous === 'yes' ? 1.25 * ib : ib;
  const ratings = nec ? NEC_RATINGS : IEC_RATINGS;
  const breaker = ratings.find((r) => r >= minRating - 1e-9) ?? null;
  const warnings = [];
  if (breaker === null) warnings.push(`Above the largest standard rating (${ratings[ratings.length - 1]} A): split the load or use parallel feeders.`);

  let wireCheck = 'Not checked: enter the ampacity of the wire.';
  if (iz > 0 && breaker !== null) {
    if (breaker <= iz) wireCheck = `OK: ${breaker} A breaker ≤ ${round(iz)} A wire.`;
    else if (nec && breaker <= 800 && ratings.filter((r) => r > iz)[0] === breaker && iz >= minRating) wireCheck = `OK only under NEC 240.4(B): ${breaker} A is the next standard size above the ${round(iz)} A wire, allowed for ratings up to 800 A when the circuit does not supply multiple receptacles for cord-and-plug loads.`;
    else {
      wireCheck = `FAIL: the ${breaker} A breaker is larger than the ${round(iz)} A the wire can carry; use a larger wire.`;
      warnings.push('The wire is too small for the breaker.');
    }
    if (iz < minRating) warnings.push(`The wire ampacity (${round(iz)} A) is below the minimum rating needed for the load (${round(minRating)} A).`);
  }

  let smallWire = 'Above 30 A: use the ampacity table (NEC 310.16).';
  if (breaker !== null && breaker <= 30) smallWire = NEC_SMALL_COPPER.find(([a]) => breaker <= a)[1];
  if (nec && x.continuous === 'no') warnings.push('Most fixed loads that can run 3 hours or more, such as heaters, EV chargers and lighting, count as continuous under the NEC.');

  return {
    outputs: {
      design_current_a: ib,
      min_rating_a: minRating,
      breaker_a: breaker,
      loading: breaker === null ? null : ib / breaker,
      wire_check: wireCheck,
      small_wire: smallWire,
    },
    warnings,
  };
}

function round(a) {
  return Number(a.toPrecision(4));
}
