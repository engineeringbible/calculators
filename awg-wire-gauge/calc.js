/**
 * awg-wire-gauge/calc.js — American Wire Gauge chart and converter: diameter, cross-section, circular mils,
 * resistance and mass of a gauge, or the gauge of a given diameter or cross-section, with the matching IEC metric size.
 *
 * d = 0.005 in × 92^((36 − n) / 39) (ASTM B258);  A = π d² / 4;  R' = ρ(T) / A × k_s;  m' = ρ_m A × k_s.
 * Schema units: SI — m, m², Ω/km, kg/m, °C.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import {
  AWG_GAUGES, awgOptions, awgName, awgDiameterMm, gaugeNumberForDiameterMm, smallestAwgForArea,
  smallestIecSize, conductorOptions, CONDUCTORS, resistancePerMetre, STRANDING_FACTOR,
} from '../shared/awg.js';

/** Mass density, kg/m³: copper 8890 (ASTM B258 basis), aluminium 1350 2705 (ASTM B231). */
const MASS_DENSITY = { copper: 8890, aluminium: 2705 };

export const schema = {
  id: 'awg-wire-gauge',
  name: 'AWG wire gauge chart and converter',
  category: 'electrical',
  summary: 'Diameter, mm², circular mils, resistance and weight of every AWG size from 4/0 to 40, or the gauge of a measured wire, with the matching metric size.',
  related: ['wire-size', 'cable-sizing', 'ohms-law', 'unit-converter'],
  assumptions: [
    'Diameters and areas follow the ASTM B258 formula for solid round wire. A stranded conductor of the same gauge has the same metal area but a larger overall diameter.',
    'Resistance is ρ/A at the chosen temperature, with the ASTM B8 increment of 2 % for stranded conductors; tinned or coated wire is a few percent higher.',
    'The metric size shown is the smallest IEC 60228 nominal cross-section at least as large as the AWG area, the usual safe substitution; IEC conductors are specified by maximum resistance, so check the resistance too.',
    'Current-carrying capacity is not given: it depends on insulation, installation and ambient temperature and is set by the wiring code (NEC Table 310.16, IEC 60364-5-52).',
  ],
  notes: [
    'Verification 2026-11-07: 12 AWG is 2.053 mm, 3.309 mm² and 6 530 cmil (ASTM B258 Table 1); 5.21 Ω/km solid copper at 20 °C. At 75 °C the shared module matches NEC Chapter 9 Table 8 (see shared/awg.js).',
  ],
  sources: [
    'ASTM B258-18, Standard Nominal Diameters and Cross-Sectional Areas of AWG Sizes of Solid Round Wires Used as Electrical Conductors',
    'ASTM B8-23, Concentric-Lay-Stranded Copper Conductors (2 % increment of resistance and mass)',
    'IEC 60028 (resistivity of annealed copper, 1.7241 × 10⁻⁸ Ω·m at 20 °C) and IEC 60228:2004 (nominal metric sizes)',
  ],
  inputs: [
    { id: 'mode', label: 'Start from', type: 'select', default: 'gauge', options: [{ value: 'gauge', label: 'An AWG gauge' }, { value: 'diameter', label: 'A measured diameter' }, { value: 'area', label: 'A cross-section (mm², kcmil)' }] },
    { id: 'gauge', label: 'Gauge', type: 'select', default: '12', options: awgOptions(), visibleWhen: { mode: 'gauge' } },
    { id: 'diameter_m', label: 'Bare conductor diameter', group: 'length', unit: 'm', display: 'mm', default: 0.002, min: 1e-5, max: 0.05, visibleWhen: { mode: 'diameter' } },
    { id: 'area_m2', label: 'Cross-section', group: 'area', unit: 'm2', display: 'mm2', default: 2.5e-6, min: 1e-10, max: 2e-3, visibleWhen: { mode: 'area' } },
    { id: 'material', label: 'Conductor', type: 'select', default: 'copper', options: conductorOptions() },
    { id: 'construction', label: 'Construction', type: 'select', default: 'solid', options: [{ value: 'solid', label: 'Solid' }, { value: 'stranded', label: 'Stranded (ASTM B8, +2 % resistance)' }] },
    { id: 'temperature_c', label: 'Conductor temperature', group: 'temperature', unit: 'C', default: 20, min: -50, max: 250 },
  ],
  outputs: [
    { id: 'awg', label: 'AWG size (smallest gauge with at least this area)', type: 'text' },
    { id: 'gauge_number', label: 'Exact gauge number (4/0 = −3)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'diameter_out_m', label: 'Diameter (solid)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'area_out_m2', label: 'Cross-section', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'area_kcmil_m2', label: 'Cross-section in circular mils', group: 'area', unit: 'm2', display: 'kcmil' },
    { id: 'resistance_ohm_km', label: 'DC resistance', group: 'resistance_per_length', unit: 'ohm_km' },
    { id: 'resistance_kft_ohm_km', label: 'DC resistance per 1000 ft', group: 'resistance_per_length', unit: 'ohm_km', display: 'ohm_kft' },
    { id: 'mass_kg_m', label: 'Conductor weight', group: 'linear_density', unit: 'kg_m', display: 'kg_km' },
    { id: 'iec', label: 'Metric size at least as large (IEC 60228)', type: 'text' },
  ],
  example: {
    inputs: { mode: 'gauge', gauge: '12', material: 'copper', construction: 'solid', temperature_c: 20 },
    results: { diameter_out_m: '2.053 mm', area_out_m2: '3.309 mm²', resistance_ohm_km: '5.211 Ω/km', resistance_kft_ohm_km: '1.588 Ω/1000 ft' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['gauge', 'diameter', 'area'], 'mode', 'Start from');
  assertOneOf(x.material, Object.keys(CONDUCTORS), 'material', 'Conductor');
  assertOneOf(x.construction, ['solid', 'stranded'], 'construction', 'Construction');
  const t = assertRange(x.temperature_c, -50, 250, 'temperature_c', 'Conductor temperature');

  let dMm;
  if (x.mode === 'gauge') {
    assertOneOf(String(x.gauge), AWG_GAUGES, 'gauge', 'Gauge');
    dMm = awgDiameterMm(String(x.gauge));
  } else if (x.mode === 'diameter') {
    dMm = assertPositive(x.diameter_m, 'diameter_m', 'Bare conductor diameter') * 1000;
  } else {
    dMm = Math.sqrt((4 * assertPositive(x.area_m2, 'area_m2', 'Cross-section') * 1e6) / Math.PI);
  }
  const areaMm2 = (Math.PI / 4) * dMm * dMm;
  const stranded = x.construction === 'stranded';
  const rOhmKm = resistancePerMetre(areaMm2, x.material, t, stranded) * 1000;
  const gaugeNumber = gaugeNumberForDiameterMm(dMm);
  const atLeast = x.mode === 'gauge' ? String(x.gauge) : smallestAwgForArea(areaMm2);
  const iec = smallestIecSize(areaMm2);

  const warnings = [];
  if (x.mode !== 'gauge' && (atLeast === null || gaugeNumber > 40.5)) warnings.push('This size is outside the AWG range (4/0 to 40); larger conductors are sized in kcmil (250 kcmil and up).');
  else if (x.mode !== 'gauge' && atLeast !== null && Math.abs(gaugeNumber - Math.round(gaugeNumber)) > 0.25) warnings.push(`The size falls between gauges (exact gauge ${gaugeNumber.toFixed(2)}); ${awgName(atLeast)} is the next larger.`);

  return {
    outputs: {
      awg: atLeast === null ? 'Larger than 4/0: use kcmil sizes' : awgName(atLeast),
      gauge_number: gaugeNumber,
      diameter_out_m: dMm / 1000,
      area_out_m2: areaMm2 * 1e-6,
      area_kcmil_m2: areaMm2 * 1e-6,
      resistance_ohm_km: rOhmKm,
      resistance_kft_ohm_km: rOhmKm,
      mass_kg_m: MASS_DENSITY[x.material] * areaMm2 * 1e-6 * (stranded ? STRANDING_FACTOR : 1),
      iec: iec === null ? 'Larger than 1000 mm²' : `${iec} mm²`,
    },
    warnings,
  };
}
