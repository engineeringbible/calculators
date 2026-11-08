/**
 * molarity/calc.js — molarity, mass of solute or volume of solution from the other two and the molar mass, with a
 * table of common reagents (molar masses from the IUPAC 2021 standard atomic weights), the amount in moles, the
 * normality for acids and bases, and the molality and % w/w when the solution density is known.
 *
 * c = n / V,  n = m / M;  N = c × z (equivalents per mole);  b = n / (ρ V − m);  w = m / (ρ V).
 * Schema units: SI — kg, m³, kg/m³; molarity in mol/L, molar mass in g/mol.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** IUPAC 2021 standard atomic weights, abridged (CIAAW), g/mol. */
export const ATOMIC = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, Mg: 24.305, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Mn: 54.938, Cu: 63.546, Ag: 107.87 };

const mm = (formula) => Object.entries(formula).reduce((s, [el, n]) => s + ATOMIC[el] * n, 0);

// [label, composition, acid–base equivalents per mole or null]
const TABLE = {
  nacl: ['Sodium chloride NaCl', { Na: 1, Cl: 1 }, null],
  naoh: ['Sodium hydroxide NaOH', { Na: 1, O: 1, H: 1 }, 1],
  koh: ['Potassium hydroxide KOH', { K: 1, O: 1, H: 1 }, 1],
  hcl: ['Hydrochloric acid HCl', { H: 1, Cl: 1 }, 1],
  h2so4: ['Sulphuric acid H₂SO₄', { H: 2, S: 1, O: 4 }, 2],
  hno3: ['Nitric acid HNO₃', { H: 1, N: 1, O: 3 }, 1],
  h3po4: ['Phosphoric acid H₃PO₄', { H: 3, P: 1, O: 4 }, 3],
  acetic: ['Acetic acid CH₃COOH', { C: 2, H: 4, O: 2 }, 1],
  na2co3: ['Sodium carbonate Na₂CO₃', { Na: 2, C: 1, O: 3 }, 2],
  nahco3: ['Sodium bicarbonate NaHCO₃', { Na: 1, H: 1, C: 1, O: 3 }, 1],
  kcl: ['Potassium chloride KCl', { K: 1, Cl: 1 }, null],
  cacl2: ['Calcium chloride CaCl₂ (anhydrous)', { Ca: 1, Cl: 2 }, null],
  nh4cl: ['Ammonium chloride NH₄Cl', { N: 1, H: 4, Cl: 1 }, null],
  kh2po4: ['Potassium dihydrogen phosphate KH₂PO₄', { K: 1, H: 2, P: 1, O: 4 }, null],
  kmno4: ['Potassium permanganate KMnO₄', { K: 1, Mn: 1, O: 4 }, null],
  agno3: ['Silver nitrate AgNO₃', { Ag: 1, N: 1, O: 3 }, null],
  cuso4_5h2o: ['Copper(II) sulphate pentahydrate CuSO₄·5H₂O', { Cu: 1, S: 1, O: 9, H: 10 }, null],
  mgso4_7h2o: ['Magnesium sulphate heptahydrate MgSO₄·7H₂O', { Mg: 1, S: 1, O: 11, H: 14 }, null],
  glucose: ['Glucose C₆H₁₂O₆', { C: 6, H: 12, O: 6 }, null],
  sucrose: ['Sucrose C₁₂H₂₂O₁₁', { C: 12, H: 22, O: 11 }, null],
  tris: ['Tris base C₄H₁₁NO₃', { C: 4, H: 11, N: 1, O: 3 }, null],
  edta: ['EDTA disodium dihydrate C₁₀H₁₄N₂Na₂O₈·2H₂O', { C: 10, H: 18, N: 2, Na: 2, O: 10 }, null],
};

export const REAGENTS = Object.fromEntries(Object.entries(TABLE).map(([k, [label, f, eq]]) => [k, { label, M: Math.round(mm(f) * 1000) / 1000, eq }]));

export const schema = {
  id: 'molarity',
  name: 'Molarity calculator (moles, mass, volume, normality)',
  category: 'process',
  summary: 'Molarity, mass of solute or volume of solution from the other two, with molar masses of common reagents, moles, normality, molality and % w/w.',
  related: ['dilution', 'ppm-concentration', 'density', 'chemical-dosing'],
  assumptions: [
    'Molarity is moles of solute per litre of final solution (not per litre of solvent): dissolve the solute and then make up to the volume.',
    'Molar masses are computed from the IUPAC 2021 abridged standard atomic weights; hydrates include their water, so weigh the form named on the bottle.',
    'Normality uses the acid–base equivalents per mole in the table (H₂SO₄ 2, H₃PO₄ 3, Na₂CO₃ 2 to carbonic acid); redox and precipitation normalities differ and must be entered for the reaction.',
    'Molality and % w/w need the density of the solution, which depends on the concentration and temperature; leave it at zero to skip them.',
    'Purity is taken as 100 %; divide the mass by the assay fraction for a technical-grade reagent.',
  ],
  notes: [
    'Verification 2026-11-08: 250 mL of 0.5 M sodium chloride (58.44 g/mol) needs 0.125 mol, 7.305 g. Checked by hand.',
    'Harris, Quantitative Chemical Analysis: reagent hydrochloric acid of 37.0 wt% and density 1.18 g/mL is 12.0 M; reproduced in the tests.',
  ],
  sources: [
    'IUPAC Commission on Isotopic Abundances and Atomic Weights (CIAAW), Standard atomic weights 2021, abridged to five significant figures',
    'Harris, D.C., Quantitative Chemical Analysis, 9th ed., W.H. Freeman, ch. 1 (molarity, molality and preparing solutions; molarity of 37.0 wt% HCl)',
    'IUPAC Compendium of Chemical Terminology (Gold Book): amount concentration, molality, equivalent entity',
  ],
  inputs: [
    { id: 'solve', label: 'Solve for', type: 'select', default: 'mass', options: [{ value: 'mass', label: 'Mass of solute (from molarity and volume)' }, { value: 'molarity', label: 'Molarity (from mass and volume)' }, { value: 'volume', label: 'Volume of solution (from mass and molarity)' }] },
    { id: 'reagent', label: 'Solute', type: 'select', default: 'nacl', options: [...Object.entries(REAGENTS).map(([value, r]) => ({ value, label: `${r.label}: ${r.M} g/mol` })), { value: 'custom', label: 'Other (enter the molar mass)' }] },
    { id: 'molar_mass', label: 'Molar mass M, g/mol', group: 'dimensionless', unit: 'none', default: 100, min: 1, max: 1e6, visibleWhen: { reagent: 'custom' } },
    { id: 'molarity', label: 'Molarity c, mol/L', group: 'dimensionless', unit: 'none', default: 0.5, min: 1e-12, max: 30, visibleWhen: { solve: ['mass', 'volume'] } },
    { id: 'mass_kg', label: 'Mass of solute m', group: 'mass', unit: 'kg', display: 'g', default: 0.01, min: 1e-15, max: 1e6, visibleWhen: { solve: ['molarity', 'volume'] } },
    { id: 'volume_m3', label: 'Volume of solution V', group: 'volume', unit: 'm3', display: 'mL', default: 0.00025, min: 1e-12, max: 1e6, visibleWhen: { solve: ['mass', 'molarity'] } },
    { id: 'equivalents', label: 'Equivalents per mole for normality (0 = use the table)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 10 },
    { id: 'density_kg_m3', label: 'Solution density, for molality and % w/w (0 = not known)', group: 'density', unit: 'kg_m3', default: 0, min: 0, max: 3000 },
  ],
  outputs: [
    { id: 'molarity_out', label: 'Molarity c, mol/L', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'moles', label: 'Amount of solute n, mol', group: 'dimensionless', unit: 'none', decimals: 5 },
    { id: 'mass_out', label: 'Mass of solute m', group: 'mass', unit: 'kg', display: 'g' },
    { id: 'volume_out', label: 'Volume of solution V', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'g_per_l', label: 'Mass concentration, g/L', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'normality', label: 'Normality N, eq/L', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'molality', label: 'Molality b, mol/kg of solvent', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'mass_fraction', label: 'Mass fraction of solute', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'molar_mass_out', label: 'Molar mass used, g/mol', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: { solve: 'mass', reagent: 'nacl', molarity: 0.5, volume_m3: [250, 'mL'] },
    results: { moles: '0.125', mass_out: '7.305 g' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['mass', 'molarity', 'volume'], 'solve', 'Solve for');
  assertOneOf(x.reagent, [...Object.keys(REAGENTS), 'custom'], 'reagent', 'Solute');
  const M = x.reagent === 'custom' ? assertRange(x.molar_mass, 1, 1e6, 'molar_mass', 'Molar mass M') : REAGENTS[x.reagent].M;
  let c;
  let m;
  let V;
  if (x.solve === 'mass') {
    c = assertPositive(x.molarity, 'molarity', 'Molarity c');
    V = assertPositive(x.volume_m3, 'volume_m3', 'Volume of solution V');
    m = (c * V * 1000 * M) / 1000;
  } else if (x.solve === 'molarity') {
    m = assertPositive(x.mass_kg, 'mass_kg', 'Mass of solute m');
    V = assertPositive(x.volume_m3, 'volume_m3', 'Volume of solution V');
    c = (m * 1000) / M / (V * 1000);
  } else {
    m = assertPositive(x.mass_kg, 'mass_kg', 'Mass of solute m');
    c = assertPositive(x.molarity, 'molarity', 'Molarity c');
    V = (m * 1000) / M / c / 1000;
  }
  const n = (m * 1000) / M;
  const eqIn = assertNonNegative(x.equivalents, 'equivalents', 'Equivalents per mole');
  const eq = eqIn > 0 ? eqIn : x.reagent === 'custom' ? null : REAGENTS[x.reagent].eq;
  const rho = assertNonNegative(x.density_kg_m3, 'density_kg_m3', 'Solution density');
  let molality = null;
  let w = null;
  const warnings = [];
  if (rho > 0) {
    const solution = rho * V;
    const solvent = solution - m;
    if (!(solvent > 0)) throw new Error('Solution density: the solute alone outweighs the solution at this density; check the density and the amounts.');
    molality = n / solvent;
    w = m / solution;
  }
  if (c > 20) warnings.push('Above 20 mol/L only a few liquids exist in pure form (water is 55.5 mol/L); check the amounts and units.');
  return {
    outputs: {
      molarity_out: c, moles: n, mass_out: m, volume_out: V, g_per_l: m / V,
      normality: eq ? c * eq : null, molality, mass_fraction: w, molar_mass_out: M,
    },
    warnings,
  };
}
