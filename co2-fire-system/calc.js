/**
 * co2-fire-system/calc.js — quantity of carbon dioxide, number of cylinders and minimum discharge rate of a fixed
 * high-pressure CO2 system under the FSS Code chapter 5 for machinery, cargo, solid bulk and vehicle spaces.
 *
 * machinery: free gas = max(40 % of (V without the upper casing + receiver air), 35 % of (V gross + receiver air))
 *            (35 % / 30 % for cargo ships < 2000 GT with machinery spaces not entirely separate)
 * cargo and solid bulk: 30 % of V;  vehicle and ro-ro (not special category): 45 % of V
 * mass = free gas / 0.56 m³/kg;  discharge: 85 % in 2 min (machinery), 2/3 in 10 min (cargo, vehicle), 2/3 in 20 min (bulk)
 * Schema units: m³, kg, bar (gauge), litres, minutes.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';

const FREE_GAS_M3_PER_KG = 0.56;
const P_ATM_BAR = 1.01325;
const FILL_KG_PER_L = 2 / 3;

const SPACES = {
  machinery: { label: 'Machinery space', fraction: 0.85, share: '85 %', minutes: 2 },
  cargo: { label: 'Container or general cargo space', pct: 30, fraction: 2 / 3, share: 'two thirds', minutes: 10 },
  bulk: { label: 'Solid bulk cargo space', pct: 30, fraction: 2 / 3, share: 'two thirds', minutes: 20 },
  vehicle: { label: 'Vehicle or ro-ro space (not special category)', pct: 45, fraction: 2 / 3, share: 'two thirds', minutes: 10 },
};

export const schema = {
  id: 'co2-fire-system',
  name: 'Fixed CO₂ fire-extinguishing system',
  category: 'maritime',
  summary: 'Required CO₂ quantity, cylinders and minimum discharge rate for machinery, cargo, bulk and vehicle spaces under the FSS Code chapter 5.',
  related: ['starting-air', 'engine-room-ventilation', 'enclosed-space-purge', 'tank-volume'],
  assumptions: [
    'FSS Code chapter 5, 2.2.1 (MSC.206(81) as amended by MSC.339(91)): machinery spaces need free gas of the larger of 40 % of the gross volume without the casing above the level where its horizontal area is 40 % or less of that of the space (taken midway between tank top and the lowest part of the casing), and 35 % of the gross volume including the casing; 35 % and 30 % for cargo ships under 2000 GT whose machinery spaces are not entirely separate; cargo spaces 30 %; vehicle and ro-ro spaces that are not special category spaces 45 % of the largest space that can be sealed.',
    'Free carbon dioxide is calculated at 0.56 m³/kg (FSS 2.2.1.5); the free air of the starting air receivers, V (p + p_atm)/p_atm, is added to the machinery space volume unless the receiver safety valves discharge to the open air (FSS 2.1.1.2).',
    'Discharge: 85 % of the gas within 2 min for machinery spaces; two thirds within 10 min for container and general cargo spaces and for vehicle and ro-ro spaces; two thirds within 20 min for solid bulk cargo spaces, whose controls also allow one third, two thirds or the entire quantity to suit the loading condition. The rate shown is the average rate those times require.',
    'Cylinders: the CO₂ in each cylinder may not exceed two thirds of a kilogram per litre of water capacity at 15 °C (MCA MSIS 12 chapter 7), so a cylinder needs at least 1.5 L per kg of charge. The number of cylinders is rounded up.',
    'The concentration shown is that after discharge with free efflux of the displaced atmosphere, 1 − e^(−v/V) (NFPA 12), for information. Only the largest protected space sets the quantity when one system serves several spaces (FSS 2.1.1.1).',
  ],
  notes: [
    'Verification 2026-10-31: a 6000 m³ engine room (5000 m³ without the upper casing) with 2.5 m³ of receivers at 30 bar needs max(0.40 × 5076.5, 0.35 × 6076.5) = 2126.8 m³ of free gas, 3797.9 kg of CO₂, 85 cylinders of 45 kg, and 26.9 kg/s on average to discharge 85 % in 2 min.',
    'Design decision: the calculator gives the regulatory minimum quantity; the system flow calculation, nozzle layout, pre-discharge alarm and time delay remain with the system maker and the Administration.',
  ],
  sources: [
    'IMO, FSS Code chapter 5 as replaced by MSC.206(81) (2006): 2.1.1.1, 2.1.1.2, 2.2.1.1–2.2.1.5',
    'IMO, MSC.339(91) (2012): new FSS 2.2.1.2 (vehicle and ro-ro spaces, 45 %, two thirds in 10 min) and 2.2.1.7 (container, general cargo and solid bulk discharge times)',
    'MCA, MSIS 12 chapter 7, Fixed fire extinguishing installations, 7.3.1.1 — filling ratio of CO₂ cylinders',
    'NFPA 12, Standard on Carbon Dioxide Extinguishing Systems — free-efflux concentration 1 − e^(−v/V)',
  ],
  inputs: [
    {
      id: 'space_type',
      label: 'Protected space',
      type: 'select',
      default: 'machinery',
      options: Object.entries(SPACES).map(([value, s]) => ({ value, label: s.label })),
    },
    { id: 'gross_volume_m3', label: 'Gross volume of the largest protected space (machinery: including the casing)', group: 'volume', unit: 'm3', default: 6000, min: 1, max: 500000 },
    { id: 'volume_excl_casing_m3', label: 'Machinery space volume without the casing above the 40 % level', group: 'volume', unit: 'm3', default: 5000, min: 1, max: 500000, visibleWhen: { space_type: 'machinery' } },
    {
      id: 'small_ship',
      label: 'Machinery spaces of a cargo ship under 2000 GT, not entirely separate',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'No (40 % and 35 %)' },
        { value: 'yes', label: 'Yes (35 % and 30 %)' },
      ],
      visibleWhen: { space_type: 'machinery' },
    },
    {
      id: 'receivers',
      label: 'Starting air receivers',
      type: 'select',
      default: 'add',
      options: [
        { value: 'add', label: 'Add their free air to the space volume' },
        { value: 'vented', label: 'Safety valves discharge to the open air' },
      ],
      visibleWhen: { space_type: 'machinery' },
    },
    { id: 'receiver_volume_m3', label: 'Total starting air receiver volume', group: 'volume', unit: 'm3', default: 2.5, min: 0, max: 200, visibleWhen: { space_type: 'machinery', receivers: 'add' } },
    { id: 'receiver_pressure_bar', label: 'Receiver pressure (gauge)', group: 'pressure', unit: 'bar', default: 30, min: 0, max: 60, visibleWhen: { space_type: 'machinery', receivers: 'add' } },
    { id: 'cylinder_mass_kg', label: 'CO₂ per cylinder', group: 'mass', unit: 'kg', default: 45, min: 1, max: 1000 },
  ],
  outputs: [
    { id: 'free_gas_m3', label: 'Free CO₂ gas required', group: 'volume', unit: 'm3' },
    { id: 'co2_mass_kg', label: 'CO₂ mass required', group: 'mass', unit: 'kg' },
    { id: 'cylinders', label: 'Number of cylinders', group: 'dimensionless', unit: 'none' },
    { id: 'installed_mass_kg', label: 'CO₂ installed', group: 'mass', unit: 'kg' },
    { id: 'cylinder_capacity_l', label: 'Minimum water capacity of each cylinder', group: 'volume', unit: 'L' },
    { id: 'discharge_rate_kg_s', label: 'Average discharge rate required', group: 'mass_flow', unit: 'kg_s' },
    { id: 'concentration_pct', label: 'CO₂ concentration after discharge (free efflux)', group: 'ratio', unit: 'pct' },
    { id: 'criteria_table', label: 'Quantity criteria', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      free_gas_m3: '2126.8 m³',
      co2_mass_kg: '3798 kg',
      installed_mass_kg: '3825 kg',
      discharge_rate_kg_s: '26.9 kg/s',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.space_type, Object.keys(SPACES), 'space_type', 'Protected space');
  assertPositive(i.gross_volume_m3, 'gross_volume_m3', 'Gross volume');
  assertPositive(i.volume_excl_casing_m3, 'volume_excl_casing_m3', 'Volume without the casing');
  assertOneOf(i.small_ship, ['no', 'yes'], 'small_ship', 'Small cargo ship');
  assertOneOf(i.receivers, ['add', 'vented'], 'receivers', 'Starting air receivers');
  assertNonNegative(i.receiver_volume_m3, 'receiver_volume_m3', 'Receiver volume');
  assertNonNegative(i.receiver_pressure_bar, 'receiver_pressure_bar', 'Receiver pressure');
  assertPositive(i.cylinder_mass_kg, 'cylinder_mass_kg', 'CO₂ per cylinder');

  const space = SPACES[i.space_type];
  const machinery = i.space_type === 'machinery';
  if (machinery && i.volume_excl_casing_m3 > i.gross_volume_m3) throw new Error('The volume without the upper casing cannot exceed the gross volume');
  const receiverAir = machinery && i.receivers === 'add' ? (i.receiver_volume_m3 * (i.receiver_pressure_bar + P_ATM_BAR)) / P_ATM_BAR : 0;
  const [pct1, pct2] = i.small_ship === 'yes' ? [35, 30] : [40, 35];
  const rows = machinery
    ? [
        [`${pct1} % of the volume without the upper casing`, i.volume_excl_casing_m3 + receiverAir, pct1, (pct1 / 100) * (i.volume_excl_casing_m3 + receiverAir)],
        [`${pct2} % of the gross volume with the casing`, i.gross_volume_m3 + receiverAir, pct2, (pct2 / 100) * (i.gross_volume_m3 + receiverAir)],
      ]
    : [[`${space.pct} % of the gross volume`, i.gross_volume_m3, space.pct, (space.pct / 100) * i.gross_volume_m3]];
  const governing = rows.reduce((best, r) => (r[3] > best[3] ? r : best));
  const freeGas = governing[3];
  const mass = freeGas / FREE_GAS_M3_PER_KG;
  const cylinders = Math.ceil(mass / i.cylinder_mass_kg - 1e-9);
  const rate = (space.fraction * mass) / (space.minutes * 60);
  const concentration = (1 - Math.exp(-freeGas / governing[1])) * 100;

  const warnings = [];
  if (machinery && receiverAir > 0) warnings.push(`The starting air receivers add ${receiverAir.toFixed(1)} m³ of free air to the machinery space volume (FSS 2.1.1.2).`);
  if (!machinery && i.small_ship === 'yes') warnings.push('The reduced percentages for small cargo ships apply to machinery spaces only.');
  if (i.space_type === 'bulk' || i.space_type === 'cargo') warnings.push('The controls must allow one third, two thirds or the entire quantity to be released to suit the loading condition of the hold.');
  if (i.space_type === 'vehicle') warnings.push('Carbon dioxide systems shall not protect special category spaces.');
  warnings.push('CO₂ at these concentrations is lethal: release only after the space is evacuated and sealed; the pre-discharge alarm and time delay are part of the system (FSS 2.1.3).');

  return {
    outputs: {
      free_gas_m3: freeGas,
      co2_mass_kg: mass,
      cylinders,
      installed_mass_kg: cylinders * i.cylinder_mass_kg,
      cylinder_capacity_l: i.cylinder_mass_kg / FILL_KG_PER_L,
      discharge_rate_kg_s: rate,
      concentration_pct: concentration,
      criteria_table: {
        columns: ['Criterion', 'Volume (m³)', 'Percentage (%)', 'Free gas (m³)'],
        rows: rows.map((r) => [r === governing ? `${r[0]} — governs` : r[0], r[1], r[2], r[3]]),
      },
      summary: `${space.label}: ${freeGas.toFixed(1)} m³ of free gas, ${mass.toFixed(0)} kg of CO₂ in ${cylinders} cylinders of ${i.cylinder_mass_kg} kg; ${space.share} within ${space.minutes} min needs ${rate.toFixed(1)} kg/s on average.`,
    },
    warnings,
  };
}
