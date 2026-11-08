/**
 * density/calc.js — density, mass and volume: any one from the other two, with a library of reference densities for
 * common liquids, gases at 0 °C and 1 atm, metals, structural timber and building materials.
 *
 * ρ = m / V;  m = ρ V;  V = m / ρ;  SG = ρ / ρ_water(4 °C).
 * Schema units: SI — kg/m³, kg, m³.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

/** Density of water at 4 °C, kg/m³ (CIPM 2001, Tanaka et al.), the reference for specific gravity here. */
export const WATER_4C = 999.972;

// [label, density kg/m³]. Liquids at 20 °C unless stated (CRC Handbook of Chemistry and Physics; water IAPWS-95,
// sea water ITTC 7.5-02-01-03); fuels are mid-range values of the EN 228 and EN 590 density limits at 15 °C; gases at
// 0 °C and 101.325 kPa (real-gas normal densities, CRC); elements at 20 °C (CRC); carbon steel EN 1993-1-1 §3.2.6,
// stainless EN 10088-1; timber EN 338:2016 mean densities; glass EN 572-1; concrete typical normal-weight values.
export const MATERIALS = {
  water_20: ['Water, 20 °C', 998.2],
  water_4: ['Water, 4 °C (maximum density)', 999.97],
  seawater: ['Sea water, 35 g/kg salinity, 15 °C', 1025.9],
  ethanol: ['Ethanol, 20 °C', 789.3],
  methanol: ['Methanol, 20 °C', 791.4],
  acetone: ['Acetone, 25 °C', 784.5],
  benzene: ['Benzene, 20 °C', 876.5],
  toluene: ['Toluene, 20 °C', 866.8],
  glycerol: ['Glycerol, 20 °C', 1261.3],
  ethylene_glycol: ['Ethylene glycol, 20 °C', 1113.5],
  mercury: ['Mercury, 20 °C', 13546],
  gasoline: ['Petrol (gasoline), 15 °C, typical (EN 228: 720–775)', 745],
  diesel: ['Diesel fuel, 15 °C, typical (EN 590: 820–845)', 835],
  air: ['Air, dry, 0 °C and 1 atm', 1.293],
  nitrogen: ['Nitrogen, 0 °C and 1 atm', 1.2506],
  oxygen: ['Oxygen, 0 °C and 1 atm', 1.429],
  co2: ['Carbon dioxide, 0 °C and 1 atm', 1.977],
  hydrogen: ['Hydrogen, 0 °C and 1 atm', 0.0899],
  helium: ['Helium, 0 °C and 1 atm', 0.1785],
  argon: ['Argon, 0 °C and 1 atm', 1.7837],
  methane: ['Methane, 0 °C and 1 atm', 0.717],
  steel: ['Carbon steel (EN 1993-1-1)', 7850],
  ss304: ['Stainless steel 304 / 1.4301', 7900],
  ss316: ['Stainless steel 316 / 1.4401', 8000],
  cast_iron: ['Cast iron, grey', 7200],
  aluminium: ['Aluminium', 2700],
  copper: ['Copper', 8960],
  brass: ['Brass', 8500],
  bronze: ['Bronze', 8800],
  lead: ['Lead', 11340],
  zinc: ['Zinc', 7140],
  titanium: ['Titanium', 4506],
  nickel: ['Nickel', 8908],
  silver: ['Silver', 10490],
  gold: ['Gold', 19300],
  c16: ['Softwood timber C16 (EN 338 mean)', 370],
  c24: ['Softwood timber C24 (EN 338 mean)', 420],
  d30: ['Hardwood timber D30 (EN 338 mean)', 640],
  d40: ['Hardwood timber D40 (EN 338 mean)', 660],
  concrete: ['Concrete, plain normal-weight, typical', 2400],
  concrete_rc: ['Concrete, reinforced, typical', 2500],
  glass: ['Glass, soda-lime (EN 572-1)', 2500],
  ice: ['Ice, 0 °C', 917],
  custom: ['Other (enter the density)', null],
};

const GAS_IDS = ['air', 'nitrogen', 'oxygen', 'co2', 'hydrogen', 'helium', 'argon', 'methane'];

export const schema = {
  id: 'density',
  name: 'Density calculator (mass, volume and density)',
  category: 'process',
  summary: 'Density, mass or volume from the other two, with reference densities of water, solvents, fuels, gases, metals, timber, concrete and glass.',
  related: ['specific-gravity', 'mass-flow', 'metal-weight', 'tank-volume'],
  assumptions: [
    'Density is mass divided by volume, ρ = m / V; the calculator solves for whichever of the three is missing.',
    'Library liquids are at 20 °C unless the label says otherwise, gases at 0 °C and 101.325 kPa; liquids lose about 0.02 % (water at 20 °C) to 0.1 % (solvents, fuels) of their density per kelvin of warming and gases change with pressure and temperature as in the ideal gas law.',
    'Fuel, timber and concrete densities are typical values within a range: petrol 720–775 and diesel 820–845 kg/m³ at 15 °C, timber at about 12 % moisture, concrete with normal aggregates; use a measured value for anything that matters.',
    'Specific gravity is the density divided by that of water at 4 °C (999.972 kg/m³).',
  ],
  notes: [
    'Verification 2026-11-08: 200 L of ethanol at 20 °C (789.3 kg/m³) has a mass of 157.9 kg and a specific gravity of 0.789; 1 m³ of carbon steel is 7 850 kg. Checked by hand.',
    'Library values checked against the CRC Handbook (organic liquids at 20 °C: ethanol 0.7893, methanol 0.7914, benzene 0.8765, toluene 0.8668, glycerol 1.2613 g/cm³; gas densities at 0 °C agree with M/22.414 L corrected for the second virial coefficient).',
  ],
  sources: [
    'CRC Handbook of Chemistry and Physics, 97th ed., sections 3 (organic liquids), 4 (elements) and 6 (density of gases and of water)',
    'EN 1993-1-1:2005 §3.2.6 (steel 7 850 kg/m³); EN 10088-1:2014 (stainless steels); EN 338:2016 Tables 1 and 3 (timber mean densities)',
    'EN 228:2012 and EN 590:2013 (density limits of petrol and diesel at 15 °C); EN 572-1:2012 (soda-lime glass 2 500 kg/m³)',
  ],
  inputs: [
    { id: 'solve', label: 'Solve for', type: 'select', default: 'mass', options: [{ value: 'mass', label: 'Mass (from density and volume)' }, { value: 'volume', label: 'Volume (from density and mass)' }, { value: 'density', label: 'Density (from mass and volume)' }] },
    { id: 'material', label: 'Material', type: 'select', default: 'water_20', options: Object.entries(MATERIALS).map(([value, [label, rho]]) => ({ value, label: rho ? `${label}: ${rho} kg/m³` : label })), visibleWhen: { solve: ['mass', 'volume'] } },
    { id: 'density_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 1000, min: 0.01, max: 25000, visibleWhen: { solve: ['mass', 'volume'], material: 'custom' } },
    { id: 'volume_m3', label: 'Volume V', group: 'volume', unit: 'm3', default: 1, min: 1e-12, max: 1e9, visibleWhen: { solve: ['mass', 'density'] } },
    { id: 'mass_kg', label: 'Mass m', group: 'mass', unit: 'kg', default: 1000, min: 1e-12, max: 1e12, visibleWhen: { solve: ['volume', 'density'] } },
  ],
  outputs: [
    { id: 'density_out', label: 'Density ρ', group: 'density', unit: 'kg_m3' },
    { id: 'density_lb_ft3', label: 'Density in lb/ft³', group: 'density', unit: 'kg_m3', display: 'lb_ft3' },
    { id: 'mass_out', label: 'Mass m', group: 'mass', unit: 'kg' },
    { id: 'volume_out', label: 'Volume V', group: 'volume', unit: 'm3' },
    { id: 'volume_l', label: 'Volume in litres', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'sg', label: 'Specific gravity (water at 4 °C = 1)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'basis', label: 'Density used', type: 'text' },
  ],
  example: {
    inputs: { solve: 'mass', material: 'ethanol', volume_m3: [200, 'L'] },
    results: { mass_out: '157.9 kg', sg: '0.789' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['mass', 'volume', 'density'], 'solve', 'Solve for');
  let rho;
  let m;
  let v;
  let basis;
  if (x.solve === 'density') {
    m = assertPositive(x.mass_kg, 'mass_kg', 'Mass m');
    v = assertPositive(x.volume_m3, 'volume_m3', 'Volume V');
    rho = m / v;
    basis = 'Calculated from the mass and volume';
  } else {
    assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
    rho = x.material === 'custom' ? assertPositive(x.density_kg_m3, 'density_kg_m3', 'Density ρ') : MATERIALS[x.material][1];
    basis = x.material === 'custom' ? 'Entered value' : `${MATERIALS[x.material][0]}: ${MATERIALS[x.material][1]} kg/m³`;
    if (x.solve === 'mass') {
      v = assertPositive(x.volume_m3, 'volume_m3', 'Volume V');
      m = rho * v;
    } else {
      m = assertPositive(x.mass_kg, 'mass_kg', 'Mass m');
      v = m / rho;
    }
  }
  const warnings = [];
  if (x.solve !== 'density' && GAS_IDS.includes(x.material)) warnings.push('Gas densities are for 0 °C and 1 atm; at 20 °C they are 7 % lower, and they rise in proportion to the absolute pressure.');
  if (x.solve === 'density' && rho > 23000) warnings.push('The density is above that of osmium (22 590 kg/m³), the densest element: check the mass and volume units.');
  return {
    outputs: { density_out: rho, density_lb_ft3: rho, mass_out: m, volume_out: v, volume_l: v, sg: rho / WATER_4C, basis },
    warnings,
  };
}
