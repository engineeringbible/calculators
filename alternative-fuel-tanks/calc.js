/**
 * alternative-fuel-tanks/calc.js — fuel mass, volume and tank capacity of an alternative fuel carrying the same
 * energy as a given quantity of oil fuel, with the engine efficiency ratio, filling limit and unpumpable volume,
 * and a comparison of all the listed fuels.
 *
 * E = m_ref × LCV_ref;  m = E / (η_rel × LCV);  V = m / ρ;  tank capacity = V / (fill limit − unpumpable)
 * Schema units: tonnes, kg/m³, MJ/kg, cubic metres, percent.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

/** Oil fuels: FuelEU Maritime Annex II LCV (MJ/kg). */
export const REFERENCE_FUELS = {
  mgo: { label: 'MDO / MGO (DMX–DMB)', lcv: 42.7 },
  lfo: { label: 'LFO / VLSFO (RMA–RMD)', lcv: 41.0 },
  hfo: { label: 'HFO (RME–RMK)', lcv: 40.5 },
};

/** Alternative fuels: LCV (MJ/kg) from FuelEU Annex II or RED Annex III; density (kg/m³) at the stated storage condition. */
export const FUELS = {
  lng: { label: 'LNG (as methane, −161.5 °C)', lcv: 49.1, density: 422.4 },
  methanol: { label: 'Methanol (15 °C)', lcv: 19.9, density: 795.7 },
  ethanol: { label: 'Ethanol (20 °C)', lcv: 27.0, density: 789.3 },
  nh3_refrigerated: { label: 'Ammonia, refrigerated (−33.3 °C, 1 atm)', lcv: 18.6, density: 681.8 },
  nh3_pressurised: { label: 'Ammonia, pressurised (15 °C, 7.3 bar)', lcv: 18.6, density: 617.7 },
  lh2: { label: 'Hydrogen, liquid (−252.8 °C)', lcv: 120.0, density: 70.85 },
  h2_700: { label: 'Hydrogen, compressed 700 bar (15 °C)', lcv: 120.0, density: 40.17 },
  h2_350: { label: 'Hydrogen, compressed 350 bar (15 °C)', lcv: 120.0, density: 24.0 },
  lpg_refrigerated: { label: 'LPG as propane, refrigerated (−42.1 °C)', lcv: 46.0, density: 580.9 },
  lpg_pressurised: { label: 'LPG as propane, pressurised (15 °C, 7.3 bar)', lcv: 46.0, density: 507.6 },
  hvo: { label: 'HVO (EN 15940, 15 °C)', lcv: 44.0, density: 780 },
  fame: { label: 'Biodiesel FAME (EN 14214, 15 °C)', lcv: 37.0, density: 880 },
};

export const schema = {
  id: 'alternative-fuel-tanks',
  name: 'Alternative fuel tank volume',
  category: 'maritime',
  summary: 'Mass, volume and tank capacity of LNG, methanol, ammonia, hydrogen, LPG or biofuels carrying the same energy as a quantity of oil fuel.',
  related: ['fuel-lcv-co2', 'eu-ets-fueleu', 'bunker-quantity', 'tank-volume', 'fuel-voyage-cost'],
  assumptions: [
    'Same energy on board: E = m_ref × LCV_ref; the alternative fuel mass is E / (η_rel × LCV), where η_rel is the efficiency of the machinery on the alternative fuel relative to the reference (1 = same energy per kWh delivered).',
    'Lower calorific values: FuelEU Maritime Annex II defaults (HFO 40.5, LFO 41.0, MGO 42.7, LNG 49.1, LPG 46.0, hydrogen 120, ammonia 18.6, methanol 19.9 MJ/kg) and the RED Annex III values used in the EC FuelEU guidance for biofuels (ethanol 27, FAME 37, HVO 44 MJ/kg).',
    'Densities of the pure substances from NIST (SRD 69) at the storage condition named: saturated liquid at 1 atm for refrigerated liquids, saturated liquid at 15 °C for pressurised LPG and ammonia, 15 °C for compressed hydrogen. LNG is taken as methane (422 kg/m³); real LNG with ethane and heavier components is denser, so enter the delivered density as a custom fuel. HVO and FAME use values inside the EN 15940 (765–800) and EN 14214 (860–900 kg/m³) ranges.',
    'Tank capacity = fuel volume / (filling limit − unpumpable volume). For liquefied gas fuels the IGF Code limits filling to 98 % at the reference temperature and the loading limit is lower (LL = FL ρR/ρL), and a heel may be kept to hold the tank cold.',
    'Not included: the space of the tank system around the tank (insulation, cylindrical type C tanks in a prismatic hold, cofferdams, tank connection spaces, vent masts), pilot fuel, boil-off, and the mass of the tanks themselves.',
  ],
  notes: [
    'Verification 2026-10-31: 1000 t of MGO (42 700 GJ) equals 2145.7 t of methanol, 2696.6 m³ at 795.7 kg/m³, 2.32 times the MGO volume at 860 kg/m³; with a 98 % filling limit and 2 % unpumpable the tank capacity is 2809.0 m³. NIST densities read 2026-10-31: methanol 795.69 (15 °C), NH3 681.8 (1 atm) and 617.7 (15 °C), H2 70.85 (1 atm), 23.995 (350 bar) and 40.172 (700 bar), propane 580.90 (1 atm) and 507.63 (15 °C), methane 422.36 kg/m³ (1 atm).',
    'Design decision: the reference fuel density is an input, since bunker densities vary across the ISO 8217 grades; the alternative fuels use fixed property values, and any other fuel or condition can be entered as a custom fuel.',
  ],
  sources: [
    'European Commission, Guidance on the FuelEU Maritime Regulation (2025), Table 4.2 (reproduction of Regulation (EU) 2023/1805 Annex II) and Table 4.9 (biofuel LCVs from Directive (EU) 2018/2001 Annex III)',
    'NIST Chemistry WebBook, SRD 69: Thermophysical properties of fluid systems (E. W. Lemmon et al.) — densities of methanol, ammonia, hydrogen, propane and methane',
    'IMO, IGF Code (MSC.391(95)), 6.8 — maximum filling limit of liquefied gas fuel tanks',
    'ISO 8217:2017 (marine fuel density limits), EN 15940:2016+A1 (paraffinic diesel 765–800 kg/m³), EN 14214:2012+A2 (FAME 860–900 kg/m³)',
    'CRC Handbook of Chemistry and Physics — density of ethanol 789.3 kg/m³ at 20 °C',
  ],
  inputs: [
    {
      id: 'reference_fuel',
      label: 'Reference fuel',
      type: 'select',
      default: 'mgo',
      options: Object.entries(REFERENCE_FUELS).map(([value, f]) => ({ value, label: `${f.label}, ${f.lcv} MJ/kg` })),
    },
    { id: 'reference_mass_t', label: 'Reference fuel quantity', group: 'mass', unit: 't', default: 1000, min: 0.1, max: 1e6 },
    { id: 'reference_density_kg_m3', label: 'Reference fuel density at 15 °C', group: 'density', unit: 'kg_m3', default: 860, min: 800, max: 1010 },
    {
      id: 'fuel',
      label: 'Alternative fuel',
      type: 'select',
      default: 'methanol',
      options: [...Object.entries(FUELS).map(([value, f]) => ({ value, label: f.label })), { value: 'custom', label: 'Custom (LCV and density below)' }],
    },
    { id: 'custom_lcv_mj_kg', label: 'Custom fuel LCV', group: 'specific_energy', unit: 'MJ_kg', default: 19.9, min: 1, max: 150, visibleWhen: { fuel: 'custom' } },
    { id: 'custom_density_kg_m3', label: 'Custom fuel density at storage', group: 'density', unit: 'kg_m3', default: 795.7, min: 1, max: 2000, visibleWhen: { fuel: 'custom' } },
    { id: 'relative_efficiency', label: 'Efficiency on the alternative fuel relative to the reference', group: 'dimensionless', unit: 'none', default: 1, min: 0.5, max: 2 },
    { id: 'fill_limit_pct', label: 'Filling limit', group: 'ratio', unit: 'pct', default: 98, min: 50, max: 100 },
    { id: 'unpumpable_pct', label: 'Unpumpable volume or heel', group: 'ratio', unit: 'pct', default: 2, min: 0, max: 40 },
  ],
  outputs: [
    { id: 'energy_gj', label: 'Energy to carry', group: 'energy', unit: 'GJ' },
    { id: 'fuel_mass_t', label: 'Alternative fuel mass', group: 'mass', unit: 't' },
    { id: 'fuel_volume_m3', label: 'Alternative fuel volume', group: 'volume', unit: 'm3' },
    { id: 'tank_capacity_m3', label: 'Tank capacity required', group: 'volume', unit: 'm3' },
    { id: 'reference_volume_m3', label: 'Reference fuel volume', group: 'volume', unit: 'm3' },
    { id: 'mass_ratio', label: 'Mass ratio to the reference fuel', group: 'dimensionless', unit: 'none' },
    { id: 'volume_ratio', label: 'Volume ratio to the reference fuel', group: 'dimensionless', unit: 'none' },
    { id: 'comparison_table', label: 'All fuels for the same energy', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      energy_gj: '42 700 GJ',
      fuel_mass_t: '2145.7 t',
      fuel_volume_m3: '2696.7 m³',
      tank_capacity_m3: '2809.0 m³',
      reference_volume_m3: '1162.8 m³',
      volume_ratio: '2.32',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.reference_fuel, Object.keys(REFERENCE_FUELS), 'reference_fuel', 'Reference fuel');
  assertPositive(i.reference_mass_t, 'reference_mass_t', 'Reference fuel quantity');
  assertRange(i.reference_density_kg_m3, 700, 1100, 'reference_density_kg_m3', 'Reference fuel density');
  assertOneOf(i.fuel, [...Object.keys(FUELS), 'custom'], 'fuel', 'Alternative fuel');
  assertPositive(i.custom_lcv_mj_kg, 'custom_lcv_mj_kg', 'Custom fuel LCV');
  assertPositive(i.custom_density_kg_m3, 'custom_density_kg_m3', 'Custom fuel density');
  assertRange(i.relative_efficiency, 0.2, 5, 'relative_efficiency', 'Relative efficiency');
  assertRange(i.fill_limit_pct, 1, 100, 'fill_limit_pct', 'Filling limit');
  assertRange(i.unpumpable_pct, 0, 99, 'unpumpable_pct', 'Unpumpable volume');
  if (i.unpumpable_pct >= i.fill_limit_pct) throw new Error('The unpumpable volume must be smaller than the filling limit');

  const ref = REFERENCE_FUELS[i.reference_fuel];
  const energyGj = i.reference_mass_t * ref.lcv;
  const refVolume = (i.reference_mass_t * 1000) / i.reference_density_kg_m3;
  const usable = (i.fill_limit_pct - i.unpumpable_pct) / 100;
  const custom = { label: 'Custom fuel', lcv: i.custom_lcv_mj_kg, density: i.custom_density_kg_m3 };
  const size = (f) => {
    const mass = energyGj / (i.relative_efficiency * f.lcv);
    const volume = (mass * 1000) / f.density;
    return { mass, volume, tank: volume / usable };
  };
  const chosen = i.fuel === 'custom' ? custom : FUELS[i.fuel];
  const s = size(chosen);

  const rows = Object.entries(FUELS).map(([key, f]) => ({ key, f }));
  if (i.fuel === 'custom') rows.push({ key: 'custom', f: custom });
  const warnings = [];
  if (['lng', 'lh2', 'h2_700', 'h2_350', 'nh3_refrigerated', 'nh3_pressurised', 'lpg_refrigerated', 'lpg_pressurised'].includes(i.fuel)) {
    warnings.push('Gas fuels: the IGF Code loading limit, the tank type and the space around cylindrical or insulated tanks add to the space needed beyond the capacity shown.');
  }
  if (i.fuel === 'lng') warnings.push('LNG is taken as pure methane (422 kg/m³); delivered LNG is denser, which reduces the volume — enter its density as a custom fuel.');
  if (i.fuel.startsWith('h2_')) warnings.push('Compressed hydrogen: the volume is the gas inside the cylinders only; the cylinders and their spacing take a multiple of it.');
  if (i.relative_efficiency !== 1) warnings.push(`The alternative fuel needs ${(1 / i.relative_efficiency).toFixed(3)} times the reference energy for the same work.`);

  return {
    outputs: {
      energy_gj: energyGj,
      fuel_mass_t: s.mass,
      fuel_volume_m3: s.volume,
      tank_capacity_m3: s.tank,
      reference_volume_m3: refVolume,
      mass_ratio: s.mass / i.reference_mass_t,
      volume_ratio: s.volume / refVolume,
      comparison_table: {
        columns: ['Fuel', 'LCV (MJ/kg)', 'Density (kg/m³)', 'Energy density (GJ/m³)', 'Mass (t)', 'Volume (m³)', 'Volume ÷ reference'],
        rows: [
          [`Reference: ${ref.label}`, ref.lcv, i.reference_density_kg_m3, (ref.lcv * i.reference_density_kg_m3) / 1000, i.reference_mass_t, refVolume, 1],
          ...rows.map(({ f }) => {
            const r = size(f);
            return [f.label, f.lcv, f.density, (f.lcv * f.density) / 1000, r.mass, r.volume, r.volume / refVolume];
          }),
        ],
      },
      summary: `${i.reference_mass_t} t of ${ref.label} carries ${energyGj.toFixed(0)} GJ; the same work needs ${s.mass.toFixed(1)} t of ${chosen.label}, ${s.volume.toFixed(1)} m³ (${(s.volume / refVolume).toFixed(2)} × the reference volume), in ${s.tank.toFixed(1)} m³ of tank capacity.`,
    },
    warnings,
  };
}
