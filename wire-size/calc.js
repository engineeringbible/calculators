/**
 * wire-size/calc.js — smallest AWG and metric wire size that keeps the voltage drop of a DC, single-phase or
 * three-phase circuit within a limit, with the actual drop, the voltage at the load and the power lost in the wire.
 *
 * ΔV = b × I × L × R';  b = 2 (DC, single-phase: out and back), √3 (balanced three-phase, line-to-line).
 * A_min = b × I × L × ρ(T) × k_s / ΔV_max.  Resistance from shared/awg.js (ρ/A with the ASTM B8 stranding increment).
 * Schema units: SI — V, A, m, m², W, fraction, °C.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { systemOptions } from '../shared/power.js';
import {
  awgName, awgAreaMm2, smallestAwgForArea, BUILDING_GAUGES, smallestIecSize, conductorOptions, CONDUCTORS, resistivity,
  resistancePerMetre, STRANDING_FACTOR,
} from '../shared/awg.js';

export const schema = {
  id: 'wire-size',
  name: 'Wire size calculator (AWG and mm²)',
  category: 'electrical',
  summary: 'Smallest AWG and metric wire size that keeps the voltage drop within your limit for a DC, single-phase or three-phase circuit, with the drop and the loss.',
  related: ['awg-wire-gauge', 'cable-sizing', 'watts-to-amps', 'ohms-law'],
  assumptions: [
    'The wire is sized for voltage drop only. Its ampacity must also be checked against the wiring code for the insulation and installation (NEC Table 310.16 and 240.4(D), IEC 60364-5-52), and the larger of the two sizes used.',
    'Resistance is ρ/A at the conductor temperature with the ASTM B8 increment of 2 % for stranded wire; 75 °C matches the NEC Chapter 9 Table 8 basis. Reactance is neglected, which is conservative for conductors up to about 1/0 AWG (50 mm²); for large feeders use the cable sizing calculator.',
    'The length is the one-way route length from the supply to the load; the formula adds the return conductor (factor 2) or the three-phase factor √3.',
    'The percentage is referred to the supply voltage: DC voltage, phase-to-neutral or line-to-line for single-phase, line-to-line for three-phase.',
    'The drop limit is the designer\'s choice: the NEC informational notes suggest 3 % for a branch circuit and 5 % for feeder plus branch; IEC 60364-5-52 Annex G suggests 3 % for lighting and 5 % for other uses; 12 V DC systems often use 3 %.',
  ],
  notes: [
    'Verification 2026-11-07: 20 A at 120 V over 100 ft with a 3 % limit needs 7.24 mm², so 8 AWG copper (2.60 % drop) or 10 mm² metric; checked by hand from ρ = 2.0968 × 10⁻⁸ Ω·m at 75 °C.',
  ],
  sources: [
    'NFPA 70, National Electrical Code (2023): 210.19(A) Informational Note No. 4 and 215.2(A)(1) Informational Note No. 2 (3 % and 5 % drop); Chapter 9 Table 8 (resistance basis at 75 °C)',
    'IEC 60364-5-52:2009 Annex G (voltage drop in consumers\' installations)',
    'ASTM B258-18 (AWG sizes) and ASTM B8-23 (stranding increment); IEC 60228:2004 (metric sizes)',
  ],
  inputs: [
    { id: 'system', label: 'System', type: 'select', default: 'ac1', options: systemOptions() },
    { id: 'voltage_v', label: 'Supply voltage (line-to-line for three-phase)', group: 'voltage', unit: 'V', default: 120, min: 1, max: 100000 },
    { id: 'current_a', label: 'Load current I', group: 'current', unit: 'A', default: 20, min: 0, max: 5000 },
    { id: 'length_m', label: 'One-way length L', group: 'length', unit: 'm', display: 'ft', default: 30.48, min: 0, max: 100000 },
    { id: 'max_drop', label: 'Allowed voltage drop', group: 'ratio', unit: 'frac', display: 'pct', default: 0.03, min: 0.001, max: 0.25 },
    { id: 'material', label: 'Conductor', type: 'select', default: 'copper', options: conductorOptions() },
    { id: 'construction', label: 'Construction', type: 'select', default: 'stranded', options: [{ value: 'stranded', label: 'Stranded (ASTM B8)' }, { value: 'solid', label: 'Solid' }] },
    { id: 'sizes', label: 'AWG sizes to choose from', type: 'select', default: 'building', options: [{ value: 'building', label: 'Common wire sizes (18–4 even, 3, 2, 1, 1/0–4/0)' }, { value: 'all', label: 'Every gauge, 40 to 4/0' }] },
    { id: 'temperature_c', label: 'Conductor temperature', group: 'temperature', unit: 'C', default: 75, min: -50, max: 250 },
  ],
  outputs: [
    { id: 'awg', label: 'Smallest AWG size', type: 'text' },
    { id: 'awg_drop', label: 'Voltage drop with this AWG size', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'awg_drop_v', label: 'Voltage drop in volts', group: 'voltage', unit: 'V' },
    { id: 'load_voltage_v', label: 'Voltage at the load', group: 'voltage', unit: 'V' },
    { id: 'loss_w', label: 'Power lost in the wire', group: 'power', unit: 'W' },
    { id: 'iec', label: 'Smallest metric size (IEC 60228)', type: 'text' },
    { id: 'iec_drop', label: 'Voltage drop with this metric size', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'min_area_m2', label: 'Minimum conductor area for the drop', group: 'area', unit: 'm2', display: 'mm2' },
  ],
  example: {
    inputs: { system: 'ac1', voltage_v: [120, 'V'], current_a: [20, 'A'], length_m: [100, 'ft'], max_drop: [3, 'pct'], material: 'copper', construction: 'stranded', sizes: 'building', temperature_c: 75 },
    results: { min_area_m2: '7.24 mm²', awg_drop: '2.60 %', awg_drop_v: '3.12 V', iec_drop: '2.17 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, ['dc', 'ac1', 'ac3'], 'system', 'System');
  assertOneOf(x.material, Object.keys(CONDUCTORS), 'material', 'Conductor');
  assertOneOf(x.construction, ['solid', 'stranded'], 'construction', 'Construction');
  assertOneOf(x.sizes, ['building', 'all'], 'sizes', 'AWG sizes to choose from');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Supply voltage');
  const i = assertPositive(x.current_a, 'current_a', 'Load current');
  const len = assertPositive(x.length_m, 'length_m', 'One-way length');
  const limit = assertRange(x.max_drop, 0.001, 0.25, 'max_drop', 'Allowed voltage drop');
  const t = assertRange(x.temperature_c, -50, 250, 'temperature_c', 'Conductor temperature');
  const stranded = x.construction === 'stranded';
  const b = x.system === 'ac3' ? Math.sqrt(3) : 2;
  const conductors = x.system === 'ac3' ? 3 : 2;

  const minAreaMm2 = (b * i * len * resistivity(x.material, t) * (stranded ? STRANDING_FACTOR : 1)) / (limit * v) * 1e6;
  const dropWith = (areaMm2) => (b * i * len * resistancePerMetre(areaMm2, x.material, t, stranded)) / v;

  const gauge = smallestAwgForArea(minAreaMm2, x.sizes === 'building' ? BUILDING_GAUGES : undefined);
  const iec = smallestIecSize(minAreaMm2);
  const warnings = [];
  let awgDrop = null;
  let loss = null;
  if (gauge === null) {
    warnings.push('No size up to 4/0 AWG meets the limit: use kcmil conductors, parallel runs or a higher voltage, and check reactance with the cable sizing calculator.');
  } else {
    awgDrop = dropWith(awgAreaMm2(gauge));
    loss = conductors * i * i * len * resistancePerMetre(awgAreaMm2(gauge), x.material, t, stranded);
  }
  if (iec === null) warnings.push('No metric size up to 1000 mm² meets the limit: use parallel conductors.');
  if (x.system !== 'dc' && minAreaMm2 > 25) warnings.push('For conductors above about 25 mm² (4 AWG) the reactance adds to the AC drop at a power factor below 1; check with the cable sizing calculator.');
  if (gauge !== null && x.system !== 'dc' && limit > 0.05) warnings.push('A drop above 5 % exceeds the usual NEC and IEC recommendations for AC circuits.');

  return {
    outputs: {
      awg: gauge === null ? 'Larger than 4/0' : awgName(gauge),
      awg_drop: awgDrop,
      awg_drop_v: awgDrop === null ? null : awgDrop * v,
      load_voltage_v: awgDrop === null ? null : v * (1 - awgDrop),
      loss_w: loss,
      iec: iec === null ? 'Larger than 1000 mm²' : `${iec} mm²`,
      iec_drop: iec === null ? null : dropWith(iec),
      min_area_m2: minAreaMm2 * 1e-6,
    },
    warnings,
  };
}
