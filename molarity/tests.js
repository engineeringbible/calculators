/**
 * molarity/tests.js — checks against a textbook molarity example, published molar masses and hand calculations.
 * Run: node run-tests.js molarity
 */
import { calculate, REAGENTS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '250 mL of 0.5 M NaCl: 0.125 mol, 7.305 g (29.22 g/L)',
    source: 'Hand calculation: m = c V M with M(NaCl) = 58.44 g/mol',
    run: () => {
      const o = calculate({ solve: 'mass', reagent: 'nacl', molarity: 0.5, volume_m3: 0.00025 }).outputs;
      assertClose(o.moles, 0.125, { rel: 1e-12 }, 'n');
      assertClose(o.mass_out * 1000, 7.305, { abs: 1e-9 }, 'g');
      assertClose(o.g_per_l, 29.22, { abs: 1e-9 }, 'g/L');
    },
  },
  {
    name: 'Reagent HCl, 37.0 wt% with density 1.18 g/mL, is 12.0 M (molality 16.1 mol/kg)',
    source: 'Harris, Quantitative Chemical Analysis, ch. 1: molarity of 37.0 wt% HCl from its density',
    run: () => {
      const o = calculate({ solve: 'molarity', reagent: 'hcl', mass_kg: 0.37 * 1.18, volume_m3: 0.001, density_kg_m3: 1180 }).outputs;
      assertClose(o.molarity_out, 12.0, { abs: 0.05 }, 'M');
      assertClose(o.mass_fraction, 0.37, { rel: 1e-12 }, 'w');
      assertClose(o.molality, 16.11, { abs: 0.01 }, 'mol/kg');
    },
  },
  {
    name: 'Molar masses agree with published values within 0.01 %: NaCl 58.44, NaOH 40.00, H₂SO₄ 98.08, glucose 180.16, KMnO₄ 158.03, CuSO₄·5H₂O 249.69',
    source: 'IUPAC 2021 atomic weights; CRC Handbook formula weights',
    run: () => {
      for (const [k, M] of [['nacl', 58.44], ['naoh', 40.00], ['h2so4', 98.08], ['glucose', 180.16], ['kmno4', 158.03], ['cuso4_5h2o', 249.69]]) {
        assertClose(REAGENTS[k].M, M, { rel: 1e-4 }, k);
      }
    },
  },
  {
    name: 'Normality: 0.5 M H₂SO₄ is 1.0 N, 0.1 M H₃PO₄ is 0.3 N; a salt has no table normality unless equivalents are entered',
    source: 'Acid–base equivalents per mole (Harris ch. 1; IUPAC equivalent entity)',
    run: () => {
      assertClose(calculate({ reagent: 'h2so4', molarity: 0.5 }).outputs.normality, 1, { rel: 1e-12 }, 'H₂SO₄');
      assertClose(calculate({ reagent: 'h3po4', molarity: 0.1 }).outputs.normality, 0.3, { rel: 1e-12 }, 'H₃PO₄');
      assertEqual(calculate({ reagent: 'nacl' }).outputs.normality, null, 'NaCl');
      assertClose(calculate({ reagent: 'kmno4', molarity: 0.02, equivalents: 5 }).outputs.normality, 0.1, { rel: 1e-12 }, 'KMnO₄ redox');
    },
  },
  {
    name: 'Round trip: 10 g of glucose in 500 mL is 0.1110 M, and 10 g at that molarity fills 500 mL',
    source: 'c = m / (M V) and V = m / (M c) by hand',
    run: () => {
      const c = calculate({ solve: 'molarity', reagent: 'glucose', mass_kg: 0.01, volume_m3: 0.0005 }).outputs.molarity_out;
      assertClose(c, 0.111015, { abs: 1e-6 }, 'M');
      assertClose(calculate({ solve: 'volume', reagent: 'glucose', mass_kg: 0.01, molarity: c }).outputs.volume_out, 0.0005, { rel: 1e-12 }, 'V');
    },
  },
  {
    name: 'A density too low for the solute, zero volume and an unknown reagent are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ solve: 'molarity', mass_kg: 1, volume_m3: 0.001, density_kg_m3: 900 }), 'outweighs the solution');
      assertThrows(() => calculate({ volume_m3: 0 }), 'Volume of solution V must be greater than zero');
      assertThrows(() => calculate({ reagent: 'unobtainium' }), 'Solute');
    },
  },
];
