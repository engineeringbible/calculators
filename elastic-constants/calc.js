/**
 * elastic-constants/calc.js — the elastic constants of an isotropic linear-elastic material: Young's modulus E, shear
 * modulus G, bulk modulus K and Poisson's ratio ν, from any two of them, with Lamé's first parameter λ and the
 * P-wave (constrained) modulus M.
 *
 * G = E / (2(1 + ν));  K = E / (3(1 − 2ν));  E = 9KG / (3K + G);  ν = (3K − 2G) / (2(3K + G));
 * λ = E ν / ((1 + ν)(1 − 2ν));  M = K + 4G/3.
 * Schema units: SI — Pa; ν dimensionless.
 */
import { withDefaults, assertPositive, assertOneOf, assertFinite } from '../shared/validate.js';

const PAIRS = ['E_nu', 'E_G', 'E_K', 'G_nu', 'G_K', 'K_nu'];

/** Young's modulus and Poisson's ratio from any pair; throws when the pair is not physically possible. */
export function fromPair(pair, { E, G, K, nu }) {
  switch (pair) {
    case 'E_nu': return { E, nu };
    case 'E_G': return { E, nu: E / (2 * G) - 1 };
    case 'E_K': return { E, nu: (3 * K - E) / (6 * K) };
    case 'G_nu': return { E: 2 * G * (1 + nu), nu };
    case 'G_K': return { E: (9 * K * G) / (3 * K + G), nu: (3 * K - 2 * G) / (2 * (3 * K + G)) };
    case 'K_nu': return { E: 3 * K * (1 - 2 * nu), nu };
    default: throw new Error(`Known constants: unknown pair ${pair}`);
  }
}

export const schema = {
  id: 'elastic-constants',
  name: 'Elastic constants calculator (E, G, K, Poisson\'s ratio)',
  category: 'mechanical',
  summary: 'Young\'s modulus, shear modulus, bulk modulus and Poisson\'s ratio of an isotropic material from any two of them, with Lamé\'s constant.',
  related: ['stress-strain', 'material-properties', 'shaft-torsion', 'mohr-circle'],
  assumptions: [
    'The material is isotropic and linear elastic, so two constants define all the others. Wood, fibre composites, rolled single crystals and many plastics are anisotropic, and these relations do not hold for them.',
    'Poisson\'s ratio must lie between −1 and 0.5 for a stable isotropic solid; at 0.5 the material is incompressible and the bulk modulus is infinite, so the calculator refuses ν ≥ 0.5.',
    'Measured E, G and ν of real alloys are often not exactly consistent with G = E/(2(1 + ν)), because they come from different tests and textured products; differences of a few per cent are normal.',
  ],
  notes: [
    'Verification 2026-11-08: steel with E = 210 GPa and ν = 0.3 gives G = 80.77 GPa (EN 1993-1-1 rounds to 81 GPa), K = 175.0 GPa, λ = 121.2 GPa and M = 282.7 GPa. Checked by hand.',
    'Data check: EN 1999-1-1 gives aluminium E = 70 000 MPa, G = 27 000 MPa and ν = 0.3; the relation gives G = 26 923 MPa, so the code value is rounded. Copper C11000 (National Bronze data sheet, E 17 000 ksi, G 6 400 ksi) implies ν = 0.328.',
  ],
  sources: [
    'Timoshenko and Goodier, Theory of Elasticity, 3rd ed., §3–§7 (relations between the elastic constants of an isotropic body)',
    'Gere and Goodno, Mechanics of Materials, 9th ed., §3.6 (G = E/(2(1 + ν))) and §7.5 (bulk modulus K = E/(3(1 − 2ν)))',
    'EN 1993-1-1:2005 §3.2.6 (steel E 210 GPa, G 81 GPa, ν 0.3); EN 1999-1-1:2007 §3.2.5 (aluminium E 70 GPa, G 27 GPa, ν 0.3)',
  ],
  inputs: [
    {
      id: 'pair', label: 'Constants you know', type: 'select', default: 'E_nu',
      options: [
        { value: 'E_nu', label: 'Young\'s modulus E and Poisson\'s ratio ν' }, { value: 'E_G', label: 'E and shear modulus G' },
        { value: 'E_K', label: 'E and bulk modulus K' }, { value: 'G_nu', label: 'G and ν' },
        { value: 'G_K', label: 'G and K' }, { value: 'K_nu', label: 'K and ν' },
      ],
    },
    { id: 'e_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa', default: 210e9, min: 1e3, max: 1.5e12, visibleWhen: { pair: ['E_nu', 'E_G', 'E_K'] } },
    { id: 'g_pa', label: 'Shear modulus G', group: 'pressure', unit: 'Pa', display: 'GPa', default: 81e9, min: 1e3, max: 1e12, visibleWhen: { pair: ['E_G', 'G_nu', 'G_K'] } },
    { id: 'k_pa', label: 'Bulk modulus K', group: 'pressure', unit: 'Pa', display: 'GPa', default: 175e9, min: 1e3, max: 1e13, visibleWhen: { pair: ['E_K', 'G_K', 'K_nu'] } },
    { id: 'nu', label: 'Poisson\'s ratio ν', group: 'dimensionless', unit: 'none', default: 0.3, min: -0.99, max: 0.499, visibleWhen: { pair: ['E_nu', 'G_nu', 'K_nu'] } },
  ],
  outputs: [
    { id: 'e_out_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'g_out_pa', label: 'Shear modulus G', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'k_out_pa', label: 'Bulk modulus K', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'nu_out', label: 'Poisson\'s ratio ν', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'lambda_pa', label: 'Lamé\'s first parameter λ', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'm_pa', label: 'P-wave (constrained) modulus M = K + 4G/3', group: 'pressure', unit: 'Pa', display: 'GPa' },
  ],
  example: {
    inputs: { pair: 'E_nu', e_pa: [210, 'GPa'], nu: 0.3 },
    results: { g_out_pa: '80.77 GPa', k_out_pa: '175.0 GPa', lambda_pa: '121.2 GPa' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.pair, PAIRS, 'pair', 'Constants you know');
  const given = {};
  if (x.pair.includes('E')) given.E = assertPositive(x.e_pa, 'e_pa', 'Young\'s modulus E');
  if (x.pair.includes('G')) given.G = assertPositive(x.g_pa, 'g_pa', 'Shear modulus G');
  if (x.pair.includes('K')) given.K = assertPositive(x.k_pa, 'k_pa', 'Bulk modulus K');
  if (x.pair.includes('nu')) given.nu = assertFinite(x.nu, 'nu', 'Poisson\'s ratio');
  const { E, nu } = fromPair(x.pair, given);
  if (!(nu > -1 && nu < 0.5)) {
    const label = x.pair.includes('nu') ? 'Poisson\'s ratio' : 'Known constants';
    throw new Error(`${label}: the values give ν = ${Number(nu.toFixed(4))}, outside −1 < ν < 0.5 for a stable isotropic solid${x.pair === 'E_G' ? '; G must be more than E/3' : ''}.`);
  }
  const G = E / (2 * (1 + nu));
  const K = E / (3 * (1 - 2 * nu));
  const warnings = [];
  if (nu < 0) warnings.push('Negative Poisson\'s ratio (auxetic): possible for foams and lattices, but no common engineering metal or plastic behaves this way; check the inputs.');
  if (nu > 0.45) warnings.push('ν above 0.45: nearly incompressible (rubber-like); the bulk modulus is very sensitive to small changes in ν.');
  return {
    outputs: {
      e_out_pa: E, g_out_pa: G, k_out_pa: K, nu_out: nu,
      lambda_pa: (E * nu) / ((1 + nu) * (1 - 2 * nu)),
      m_pa: K + (4 * G) / 3,
    },
    warnings,
  };
}
