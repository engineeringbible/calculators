/**
 * pipe-volume/calc.js — volume and mass of the liquid in a pipe run, the volume per metre, and the time to fill or
 * flush it at a given flow rate.
 *
 * V = π D² L / 4;  m = ρ V;  t = V / Q.
 * Schema units: SI — m, m³, kg, m³/s, s.
 */
import { withDefaults, assertPositive, assertNonNegative } from '../shared/validate.js';
import { FLUIDS, fluidOptions, densityOf } from '../shared/fluids.js';

export const schema = {
  id: 'pipe-volume',
  name: 'Pipe volume and mass of contents',
  category: 'thermal',
  summary: 'Volume and mass of the liquid in a pipe from its bore and length, the litres per metre, and the time to fill or flush it at a given flow.',
  related: ['flow-rate-velocity', 'pipe-flow', 'tank-volume', 'hydrostatic-pressure'],
  assumptions: [
    'The pipe is a straight cylinder of uniform inside diameter running completely full; fittings, valves and bends add volume that can be entered as extra length.',
    'The inside diameter is the bore, not the nominal size: a DN 100 steel pipe has a bore between about 97 and 108 mm depending on its wall thickness.',
    'The liquid density is the reference value at the stated temperature; it changes with temperature (water 1 % between 4 and 45 °C).',
    'Fill time assumes a steady flow that fills the whole bore from the start; venting trapped air and filling uphill take longer in practice.',
  ],
  notes: [
    'Verification 2026-11-07: a 150 mm bore 120 m long holds 2.121 m³ (17.67 L per metre) and 2 117 kg of water; at 30 m³/h it fills in 4.24 min. Checked by hand.',
  ],
  sources: [
    'Geometry of a cylinder: V = π r² L (any engineering handbook, for example Oberg et al., Machinery\'s Handbook, 31st ed., "Areas and volumes")',
    'ASME B36.10M-2018 Welded and seamless wrought steel pipe (bores of nominal sizes, quoted in the article)',
    'ITTC 7.5-02-01-03 (2011), fresh and sea water density (shared/fluids.js)',
  ],
  inputs: [
    { id: 'diameter_m', label: 'Inside diameter (bore) D', group: 'length', unit: 'm', display: 'mm', default: 0.15, min: 1e-4, max: 20 },
    { id: 'length_m', label: 'Pipe length L', group: 'length', unit: 'm', default: 120, min: 0, max: 1e7, help: 'Add an allowance for fittings and valves if they matter.' },
    { id: 'fluid', label: 'Contents', type: 'select', default: 'water_20c', options: fluidOptions(['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom']) },
    { id: 'rho_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 1000, min: 1, max: 25000, visibleWhen: { fluid: 'custom' } },
    { id: 'flow_m3_s', label: 'Fill or flush flow rate (0 to skip)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 30 / 3600, min: 0, max: 1000 },
  ],
  outputs: [
    { id: 'volume_m3', label: 'Volume V = π D² L / 4', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'per_metre_l', label: 'Volume per metre of pipe (L/m)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'mass_kg', label: 'Mass of the contents', group: 'mass', unit: 'kg' },
    { id: 'fill_time_s', label: 'Time to fill or flush once', group: 'time', unit: 's', display: 'min' },
    { id: 'area_m2', label: 'Bore area π D² / 4', group: 'area', unit: 'm2', display: 'cm2' },
  ],
  example: {
    inputs: { diameter_m: [150, 'mm'], length_m: [120, 'm'], fluid: 'water_20c', flow_m3_s: [30, 'm3_h'] },
    results: {
      volume_m3: '2 121 L',
      per_metre_l: '17.67',
      mass_kg: '2 117 kg',
      fill_time_s: '4.24 min',
    },
  },
};

export const boreArea = (diameter) => (Math.PI * diameter * diameter) / 4;

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const d = assertPositive(x.diameter_m, 'diameter_m', 'Inside diameter');
  const length = assertNonNegative(x.length_m, 'length_m', 'Pipe length');
  const rho = densityOf(x.fluid, x.rho_kg_m3);
  const flow = assertNonNegative(x.flow_m3_s, 'flow_m3_s', 'Flow rate');
  const area = boreArea(d);
  const volume = area * length;
  const warnings = [];
  if (FLUIDS[x.fluid] && x.fluid === 'hfo_50c') warnings.push('Heavy fuel oil is only pumpable when heated; its density and volume change by about 0.07 % per kelvin.');
  return {
    outputs: {
      volume_m3: volume,
      per_metre_l: area * 1000,
      mass_kg: rho * volume,
      fill_time_s: flow > 0 ? volume / flow : null,
      area_m2: area,
    },
    warnings,
  };
}
