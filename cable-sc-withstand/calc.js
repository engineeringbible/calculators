/**
 * cable-sc-withstand/calc.js — adiabatic short-circuit withstand of a cable and its protective conductor, with the
 * earth-fault loop impedance, the minimum fault current and the disconnection time of the protective device.
 *
 * k = K √ln((θf + β)/(θi + β))  (IEC 60949, IEC 60364-5-54 Annex A);  I² t ≤ k² S²  (IEC 60364-4-43 434.5.2)
 * R(θ) = R20 (β + θ)/(β + 20);  Zs = Ze + (R1 + R2);  If = c U0 / Zs
 * Schema units: mm², m, V, Ω, A, s, A²s.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** IEC 60949: K (A·s^½/mm²), β (K) and ρ20 (Ω·mm²/m). */
export const MATERIALS = {
  copper: { label: 'Copper', K: 226, beta: 234.5, rho20: 0.017241 },
  aluminium: { label: 'Aluminium', K: 148, beta: 228, rho20: 0.028264 },
};
/** Maximum operating and short-circuit temperatures (°C) by insulation. */
export const INSULATIONS = {
  pvc: { label: 'PVC (70 °C; 160 °C, or 140 °C above 300 mm²)', initial: 70, final: 160, finalLarge: 140 },
  xlpe: { label: 'XLPE or EPR (90 °C; 250 °C)', initial: 90, final: 250 },
  rubber: { label: 'Rubber 60 °C (60 °C; 200 °C)', initial: 60, final: 200 },
  custom: { label: 'Custom temperatures (below)' },
};

export const schema = {
  id: 'cable-sc-withstand',
  name: 'Cable short-circuit withstand',
  category: 'electrical',
  summary: 'Adiabatic short-circuit check of a cable and its protective conductor, with the earth-fault loop impedance, fault current and disconnection time.',
  related: ['short-circuit-current', 'cable-sizing', 'transformer-sizing', 'motor-starting'],
  assumptions: [
    'Adiabatic heating for faults up to 5 s: the energy let through, I²t, must not exceed k²S² for each conductor (IEC 60364-4-43 434.5.2); for current-limiting devices and times below about 0.1 s the let-through energy from the device data is used instead of I²t.',
    'k = K √ln((θf + β)/(θi + β)) with K = 226 and β = 234.5 °C for copper, 148 and 228 °C for aluminium (IEC 60949, IEC 60364-5-54 Annex A); θi is the maximum operating temperature and θf the short-circuit limit of the insulation: PVC 70/160 °C (140 °C above 300 mm²), XLPE or EPR 90/250 °C, 60 °C rubber 60/200 °C. These give the tabulated k of 115, 103, 143 and 141 for copper and 76 and 94 for aluminium.',
    'The protective conductor is a core of the same cable, at the same temperatures as the line conductor; a separate or bare protective conductor has other k values.',
    'Loop impedance Zs = Ze + R1 + R2 with the conductor resistances at the maximum operating temperature, R(θ) = R20 (β + θ)/(β + 20); R20 from the cable data (IEC 60228) or, when not entered, ρ20/S, which underestimates stranded conductors by a few per cent. Reactance is neglected, which suits cross-sections up to about 35 mm².',
    'Minimum earth-fault current If = c U0/Zs with c = 0.95 for low-voltage systems (IEC 60909-0 Table 1, c_min); the device must disconnect within the permitted time, for example 0.4 s for 230 V final circuits up to 32 A and 5 s for distribution circuits in TN systems (IEC 60364-4-41).',
  ],
  notes: [
    'Verification 2026-10-31: K reproduces the tabulated k: copper 70 → 160 °C 115.0, 70 → 140 °C 102.8, 90 → 250 °C 143.1, 60 → 200 °C 140.9; aluminium 70 → 160 °C 76.0, 90 → 250 °C 94.5. K itself is √(Q_c (β + 20)/ρ20) with Q_c = 3.45 J/(K·cm³) for copper (225.7) and 2.5 J/(K·cm³) for aluminium (148.1).',
    'Design decision: the device operating time at the fault current is an input read from its time–current curve, so any fuse or breaker can be checked.',
  ],
  sources: [
    'IEC 60949:1988 Calculation of thermally permissible short-circuit currents — adiabatic constants K, β, ρ20',
    'IEC 60364-4-43 (434.5.2) and IEC 60364-5-54 Annex A — adiabatic equation and k factors, as reproduced in myCableEngineering, The adiabatic equation',
    'IEC 60909-0:2016 Table 1 — voltage factor c_min = 0.95 for low voltage',
    'IEC 60364-4-41 — automatic disconnection times in TN systems',
  ],
  inputs: [
    {
      id: 'material',
      label: 'Conductor material',
      type: 'select',
      default: 'copper',
      options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })),
    },
    {
      id: 'insulation',
      label: 'Insulation',
      type: 'select',
      default: 'xlpe',
      options: Object.entries(INSULATIONS).map(([value, m]) => ({ value, label: m.label })),
    },
    { id: 'custom_initial_c', label: 'Initial (maximum operating) temperature', group: 'temperature', unit: 'C', default: 90, min: -20, max: 300, visibleWhen: { insulation: 'custom' } },
    { id: 'custom_final_c', label: 'Final (short-circuit) temperature', group: 'temperature', unit: 'C', default: 250, min: 0, max: 400, visibleWhen: { insulation: 'custom' } },
    { id: 'line_csa_mm2', label: 'Line conductor cross-section', group: 'area', unit: 'mm2', default: 16, min: 0.5, max: 2000 },
    { id: 'cpc_csa_mm2', label: 'Protective conductor cross-section', group: 'area', unit: 'mm2', default: 16, min: 0.5, max: 2000 },
    { id: 'length_m', label: 'Cable length', group: 'length', unit: 'm', default: 50, min: 0.1, max: 10000 },
    { id: 'line_r20_ohm_km', label: 'Line conductor resistance at 20 °C (0 = from ρ/S)', group: 'resistance_per_length', unit: 'ohm_km', default: 0, min: 0, max: 100 },
    { id: 'cpc_r20_ohm_km', label: 'Protective conductor resistance at 20 °C (0 = from ρ/S)', group: 'resistance_per_length', unit: 'ohm_km', default: 0, min: 0, max: 100 },
    { id: 'u0_v', label: 'Nominal voltage to earth U0', group: 'voltage', unit: 'V', default: 230, min: 1, max: 1000 },
    { id: 'ze_ohm', label: 'External loop impedance Ze', group: 'resistance', unit: 'ohm', default: 0.35, min: 0, max: 100 },
    { id: 'c_factor', label: 'Voltage factor c', group: 'dimensionless', unit: 'none', default: 0.95, min: 0.5, max: 1.2 },
    { id: 'device_time_s', label: 'Device operating time at the fault current', group: 'time', unit: 's', default: 0.1, min: 0.001, max: 5 },
    { id: 'let_through_a2s', label: 'Device let-through energy I²t, A²s (0 = use I² t)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 1e12 },
    { id: 'max_disconnection_s', label: 'Permitted disconnection time', group: 'time', unit: 's', default: 0.4, min: 0.01, max: 5 },
  ],
  outputs: [
    { id: 'k_line', label: 'k of the line conductor', group: 'dimensionless', unit: 'none' },
    { id: 'k_cpc', label: 'k of the protective conductor', group: 'dimensionless', unit: 'none' },
    { id: 'zs_ohm', label: 'Earth-fault loop impedance Zs', group: 'resistance', unit: 'ohm' },
    { id: 'fault_current_a', label: 'Minimum earth-fault current', group: 'current', unit: 'A' },
    { id: 'energy_a2s', label: 'Energy let through (A²s)', group: 'dimensionless', unit: 'none' },
    { id: 'line_utilisation', label: 'Line conductor: I²t / k²S²', group: 'dimensionless', unit: 'none' },
    { id: 'cpc_utilisation', label: 'Protective conductor: I²t / k²S²', group: 'dimensionless', unit: 'none' },
    { id: 'min_cpc_csa_mm2', label: 'Smallest protective conductor that withstands the fault', group: 'area', unit: 'mm2' },
    { id: 'cpc_max_time_s', label: 'Longest fault the protective conductor withstands', group: 'time', unit: 's' },
    { id: 'checks_table', label: 'Checks', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      k_line: '143.1',
      k_cpc: '143.1',
      zs_ohm: '0.487 Ω',
      fault_current_a: '448 A',
      cpc_max_time_s: '26 s',
    },
  },
};

/** k factor (A·s^½/mm²) for a material between the initial and final temperatures (°C). */
export function kFactor(material, initial, final) {
  const m = MATERIALS[material];
  return m.K * Math.sqrt(Math.log((final + m.beta) / (initial + m.beta)));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Conductor material');
  assertOneOf(i.insulation, Object.keys(INSULATIONS), 'insulation', 'Insulation');
  assertPositive(i.line_csa_mm2, 'line_csa_mm2', 'Line conductor cross-section');
  assertPositive(i.cpc_csa_mm2, 'cpc_csa_mm2', 'Protective conductor cross-section');
  assertPositive(i.length_m, 'length_m', 'Cable length');
  assertNonNegative(i.line_r20_ohm_km, 'line_r20_ohm_km', 'Line conductor resistance');
  assertNonNegative(i.cpc_r20_ohm_km, 'cpc_r20_ohm_km', 'Protective conductor resistance');
  assertPositive(i.u0_v, 'u0_v', 'Nominal voltage');
  assertNonNegative(i.ze_ohm, 'ze_ohm', 'External loop impedance');
  assertRange(i.c_factor, 0.5, 1.5, 'c_factor', 'Voltage factor');
  assertPositive(i.device_time_s, 'device_time_s', 'Device operating time');
  assertNonNegative(i.let_through_a2s, 'let_through_a2s', 'Let-through energy');
  assertPositive(i.max_disconnection_s, 'max_disconnection_s', 'Permitted disconnection time');

  const m = MATERIALS[i.material];
  const ins = INSULATIONS[i.insulation];
  const temps = (csa) => (i.insulation === 'custom' ? [i.custom_initial_c, i.custom_final_c] : [ins.initial, csa > 300 && ins.finalLarge ? ins.finalLarge : ins.final]);
  const [lineInitial, lineFinal] = temps(i.line_csa_mm2);
  const [cpcInitial, cpcFinal] = temps(i.cpc_csa_mm2);
  if (lineFinal <= lineInitial || cpcFinal <= cpcInitial) throw new Error('The final temperature must be above the initial temperature');
  const kLine = kFactor(i.material, lineInitial, lineFinal);
  const kCpc = kFactor(i.material, cpcInitial, cpcFinal);
  const hot = (r20OhmKm, csa, theta) => ((r20OhmKm > 0 ? r20OhmKm / 1000 : m.rho20 / csa) * (m.beta + theta)) / (m.beta + 20);
  const r1 = hot(i.line_r20_ohm_km, i.line_csa_mm2, lineInitial) * i.length_m;
  const r2 = hot(i.cpc_r20_ohm_km, i.cpc_csa_mm2, cpcInitial) * i.length_m;
  const zs = i.ze_ohm + r1 + r2;
  const current = (i.c_factor * i.u0_v) / zs;
  const energy = i.let_through_a2s > 0 ? i.let_through_a2s : current ** 2 * i.device_time_s;
  const lineWithstand = (kLine * i.line_csa_mm2) ** 2;
  const cpcWithstand = (kCpc * i.cpc_csa_mm2) ** 2;
  const cpcMaxTime = ((kCpc * i.cpc_csa_mm2) / current) ** 2;
  const minCpc = Math.sqrt(energy) / kCpc;
  const disconnects = i.device_time_s <= i.max_disconnection_s;

  const warnings = [];
  if (energy > lineWithstand) warnings.push('The line conductor does not withstand the fault energy: use a larger cable or a faster device.');
  if (energy > cpcWithstand) warnings.push(`The protective conductor needs at least ${minCpc.toFixed(1)} mm² for this fault energy.`);
  if (!disconnects) warnings.push(`The device takes ${i.device_time_s} s, longer than the permitted ${i.max_disconnection_s} s: reduce the loop impedance or choose a device that trips faster at ${current.toFixed(0)} A.`);
  if (i.line_r20_ohm_km === 0 || i.cpc_r20_ohm_km === 0) warnings.push('Resistance from ρ/S: stranded conductors have a few per cent more (IEC 60228 maximum values); enter the data-sheet resistance for an exact loop impedance.');
  if (Math.max(i.line_csa_mm2, i.cpc_csa_mm2) > 35) warnings.push('Above about 35 mm² the cable reactance becomes significant and the loop impedance shown is too low.');
  if (i.device_time_s < 0.1 && i.let_through_a2s === 0) warnings.push('Below 0.1 s use the let-through energy from the device data rather than I² t.');

  return {
    outputs: {
      k_line: kLine,
      k_cpc: kCpc,
      zs_ohm: zs,
      fault_current_a: current,
      energy_a2s: energy,
      line_utilisation: energy / lineWithstand,
      cpc_utilisation: energy / cpcWithstand,
      min_cpc_csa_mm2: minCpc,
      cpc_max_time_s: cpcMaxTime,
      checks_table: {
        columns: ['Check', 'Value', 'Limit', 'Result'],
        rows: [
          ['Line conductor I²t (A²s)', energy, lineWithstand, energy <= lineWithstand ? 'withstands' : 'fails'],
          ['Protective conductor I²t (A²s)', energy, cpcWithstand, energy <= cpcWithstand ? 'withstands' : 'fails'],
          ['Disconnection time (s)', i.device_time_s, i.max_disconnection_s, disconnects ? 'within the limit' : 'too slow'],
          ['Loop impedance R1 + R2 (Ω)', r1 + r2, zs, `${((100 * (r1 + r2)) / zs).toFixed(0)} % of Zs`],
        ],
      },
      summary: `Zs = ${zs.toFixed(3)} Ω gives ${current.toFixed(0)} A; in ${i.device_time_s} s the fault lets through ${energy.toExponential(3)} A²s against ${lineWithstand.toExponential(3)} A²s for the ${i.line_csa_mm2} mm² line conductor (k = ${kLine.toFixed(1)}) and ${cpcWithstand.toExponential(3)} A²s for the ${i.cpc_csa_mm2} mm² protective conductor.`,
    },
    warnings,
  };
}
