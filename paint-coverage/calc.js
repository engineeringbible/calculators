/**
 * paint-coverage/calc.js — theoretical and practical spreading rate of a coating from volume solids and dry film
 * thickness, wet film thickness, paint quantity, cans, mass and cost for an area and number of coats with loss factors
 * and a surface-profile (dead volume) allowance.
 *
 * TSR [m²/L] = VS% × 10 / DFT[µm];  PSR = TSR (1 − loss);  WFT = DFT / VS;  litres = A n / PSR.
 * Schema units: m², µm (length), %, L, kg, currency.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const LOSS_PRESETS = {
  brush_roller: { label: 'Brush / roller, simple shapes (5–15 %)', loss: 10 },
  airless_flat: { label: 'Airless spray, large flat areas, calm (20–30 %)', loss: 25 },
  airless_complex: { label: 'Airless spray, complex steelwork or lattice (30–50 %)', loss: 40 },
  airless_windy: { label: 'Airless spray outdoors, windy (40–60 %)', loss: 50 },
  custom: { label: 'Custom loss factor', loss: null },
};

export const schema = {
  id: 'paint-coverage',
  name: 'Paint coverage and quantity',
  category: 'maritime',
  summary: 'Theoretical and practical spreading rate from volume solids and dry film thickness, litres and cost for an area with loss factors.',
  related: ['cathodic-protection', 'hydrostatics', 'tank-volume', 'unit-converter'],
  assumptions: [
    'Theoretical spreading rate TSR = volume solids (%) × 10 / DFT (µm) in m²/L assumes a perfectly smooth, non-absorbent surface, no overspray and the paint applied at its datasheet volume solids (thinning reduces the solids proportionally); it is the figure printed on datasheets and is never achieved in practice.',
    'Practical spreading rate = TSR × (1 − loss): the loss factor covers overspray, wind, container and line residues, uneven film (the specification usually asks for 80 % of readings ≥ DFT and none < 80 %, which forces a higher average) and masking; typical airless-spray losses are 20–30 % on flat steel, 30–50 % on complex steelwork or lattice and 40–60 % in wind, brush and roller 5–15 % — the presets are industry rules of thumb, not datasheet values.',
    'Surface profile dead volume: a blast profile fills with paint before any film builds above the peaks; the allowance (typically one third to one half of the profile height, or the datasheet\'s "add 25 µm for every 25 µm of profile above 75 µm") is added to the first coat\'s DFT only.',
    'Wet film thickness WFT = DFT / volume solids is the wet-comb reading to aim for immediately after application, before solvent loss; it increases with thinning.',
    'Quantities are per coat with the same DFT and product; multi-product systems (primer + intermediate + topcoat) are computed by running each product separately. Stripe coats, touch-up and spot repair are not included unless added to the area.',
    'Mass and cost use the entered density and price per litre; pack sizes are rounded up to whole containers.',
  ],
  notes: [
    'Verification 2026-10-30: 55 % solids at 75 µm → 7.33 m²/L (industry worked example); 4.0 m²/L theoretical with 39 % loss → 2.44 m²/L (coatings coverage brochure); 10 000 m² × 2 coats of 150 µm at 60 % solids with 30 % loss → 7 143 L and WFT 250 µm.',
    'Design decision: loss presets are offered because specifiers rarely have measured consumption data; the register records them as rules of thumb.',
    'Design decision: the profile allowance is applied only to the first coat, as the dead volume is filled once.',
  ],
  sources: [
    'International Paint / AkzoNobel, "Calculating paint consumption" (theoretical spreading rate, wet film thickness); Jotun and Hempel technical datasheets (volume solids, TSR, loss factors)',
    'Industrial Coatings Ltd, "How to work out paint coverage for protective coatings" — loss allowances by application method (airless 20–30 %, complex 30–50 %)',
    'ISO 19840:2012, Measurement of, and acceptance criteria for, the thickness of dry films on rough surfaces (80/20 rule); ISO 8503 surface profile grades',
    'Wattyl Protective & Marine info sheet I-09 "Coating coverage, costs and calculations" (coverage efficiency factors)',
  ],
  inputs: [
    { id: 'area_m2', label: 'Area to be coated', group: 'area', unit: 'm2', default: 10000, min: 0.1, max: 1e7 },
    { id: 'coats', label: 'Number of coats of this product', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 10, integer: true },
    { id: 'dft_um', label: 'Specified dry film thickness per coat', group: 'length', unit: 'm', display: 'um', default: 150e-6, min: 1e-6, max: 5e-3 },
    { id: 'volume_solids_pct', label: 'Volume solids of the paint', group: 'ratio', unit: 'pct', default: 60, min: 5, max: 100 },
    { id: 'thinner_pct', label: 'Thinner added (by volume)', group: 'ratio', unit: 'pct', default: 0, min: 0, max: 50 },
    { id: 'loss_preset', label: 'Application loss', type: 'select', default: 'airless_flat', options: Object.entries(LOSS_PRESETS).map(([value, p]) => ({ value, label: p.label })) },
    { id: 'loss_pct', label: 'Custom loss factor', group: 'ratio', unit: 'pct', default: 30, min: 0, max: 80, visibleWhen: { loss_preset: 'custom' } },
    { id: 'profile_um', label: 'Surface profile dead-volume allowance on the first coat (0 for smooth or previously coated surfaces)', group: 'length', unit: 'm', display: 'um', default: 0, min: 0, max: 200e-6, help: 'Blast profile 50–75 µm: allow 25–40 µm.' },
    { id: 'density_kg_l', label: 'Paint density (mixed)', group: 'density', unit: 'kg_L', default: 1.4, min: 0.8, max: 3 },
    { id: 'price_per_l', label: 'Price per litre', group: 'money', unit: 'cur', default: 8, min: 0, max: 1000 },
    { id: 'pack_l', label: 'Container size', group: 'volume', unit: 'L', default: 20, min: 0.1, max: 1000 },
  ],
  outputs: [
    { id: 'effective_solids_pct', label: 'Volume solids after thinning', group: 'ratio', unit: 'pct' },
    { id: 'tsr_m2_l', label: 'Theoretical spreading rate TSR = VS × 10 / DFT', group: 'spreading_rate', unit: 'm2_L' },
    { id: 'psr_m2_l', label: 'Practical spreading rate TSR × (1 − loss)', group: 'spreading_rate', unit: 'm2_L' },
    { id: 'loss_used_pct', label: 'Loss factor used', group: 'ratio', unit: 'pct' },
    { id: 'wft_um', label: 'Wet film thickness to apply WFT = DFT / VS', group: 'length', unit: 'm', display: 'um' },
    { id: 'total_dft_um', label: 'Total specified DFT (all coats)', group: 'length', unit: 'm', display: 'um' },
    { id: 'first_coat_dft_um', label: 'First-coat DFT incl. profile allowance', group: 'length', unit: 'm', display: 'um' },
    { id: 'theoretical_litres', label: 'Theoretical quantity (no loss)', group: 'volume', unit: 'L' },
    { id: 'practical_litres', label: 'Practical quantity to order', group: 'volume', unit: 'L' },
    { id: 'litres_per_coat', label: 'Practical quantity per coat (average)', group: 'volume', unit: 'L' },
    { id: 'containers', label: 'Containers to order', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mass_kg', label: 'Mass of paint', group: 'mass', unit: 'kg' },
    { id: 'cost', label: 'Paint cost', group: 'money', unit: 'cur' },
    { id: 'cost_per_m2', label: 'Paint cost per m² (all coats)', group: 'money', unit: 'cur' },
    { id: 'dry_mass_kg', label: 'Dry film mass on the structure (approx., solids × density)', group: 'mass', unit: 'kg' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      loss_preset: 'custom',
      loss_pct: 30,
    },
    results: {
      tsr_m2_l: '4.0 m²/L',
      psr_m2_l: '2.8 m²/L',
      wft_um: '250 µm',
      theoretical_litres: '5 000 L',
      practical_litres: '7 143 L',
      containers: '358',
      mass_kg: '10 t',
      cost: '57 143',
      cost_per_m2: '5.7',
    },
  },
};

/** Theoretical spreading rate, m²/L. */
export function theoreticalSpreadingRate(volumeSolidsPct, dftUm) {
  return (volumeSolidsPct * 10) / dftUm;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.area_m2, 'area_m2', 'Area');
  assertInteger(i.coats, 'coats', 'Number of coats');
  assertRange(i.coats, 1, 20, 'coats', 'Number of coats');
  assertPositive(i.dft_um, 'dft_um', 'Dry film thickness');
  assertRange(i.volume_solids_pct, 1, 100, 'volume_solids_pct', 'Volume solids');
  assertRange(i.thinner_pct, 0, 90, 'thinner_pct', 'Thinner');
  assertOneOf(i.loss_preset, Object.keys(LOSS_PRESETS), 'loss_preset', 'Loss preset');
  assertNonNegative(i.profile_um, 'profile_um', 'Profile allowance');
  assertPositive(i.density_kg_l, 'density_kg_l', 'Density');
  assertNonNegative(i.price_per_l, 'price_per_l', 'Price');
  assertPositive(i.pack_l, 'pack_l', 'Container size');

  const dftUm = i.dft_um * 1e6;
  const profileUm = i.profile_um * 1e6;
  const solids = i.volume_solids_pct / (1 + i.thinner_pct / 100);
  const loss = i.loss_preset === 'custom' ? assertRange(i.loss_pct, 0, 95, 'loss_pct', 'Loss factor') : LOSS_PRESETS[i.loss_preset].loss;
  const tsr = theoreticalSpreadingRate(solids, dftUm);
  const psr = tsr * (1 - loss / 100);
  const wft = dftUm / (solids / 100);
  const firstCoatDft = dftUm + profileUm;
  const totalDftEquivalent = dftUm * i.coats + profileUm;
  const theoreticalLitres = (i.area_m2 * totalDftEquivalent) / (solids * 10);
  const practicalLitres = theoreticalLitres / (1 - loss / 100);
  const containers = Math.ceil(practicalLitres / i.pack_l);
  const mass = practicalLitres * i.density_kg_l;
  const cost = practicalLitres * i.price_per_l;

  const warnings = [];
  if (i.thinner_pct > 0) warnings.push(`Thinning ${i.thinner_pct} % lowers the volume solids to ${solids.toFixed(1)} % and raises the wet film to ${wft.toFixed(0)} µm for the same DFT.`);
  if (wft > 600) warnings.push('Wet film above 600 µm per coat: sagging and solvent entrapment risk on vertical surfaces — check the product\'s maximum WFT.');
  if (i.loss_preset !== 'custom') warnings.push(`Loss factor ${loss} % is a rule of thumb for "${LOSS_PRESETS[i.loss_preset].label}"; measured consumption from a previous job is better.`);
  if (profileUm === 0) warnings.push('No surface-profile allowance: on freshly blasted steel the first coat fills the profile (allow 25–40 µm for a 50–75 µm profile).');
  warnings.push('The 80/20 acceptance rule (ISO 19840) means the applied average DFT typically exceeds the specification by 10–20 %, part of the loss factor.');
  warnings.push('Single product and DFT: run primer, intermediate and topcoat separately for a full system.');

  return {
    outputs: {
      effective_solids_pct: solids,
      tsr_m2_l: tsr,
      psr_m2_l: psr,
      loss_used_pct: loss,
      wft_um: wft * 1e-6,
      total_dft_um: dftUm * i.coats * 1e-6,
      first_coat_dft_um: firstCoatDft * 1e-6,
      theoretical_litres: theoreticalLitres,
      practical_litres: practicalLitres,
      litres_per_coat: practicalLitres / i.coats,
      containers,
      mass_kg: mass,
      cost,
      cost_per_m2: cost / i.area_m2,
      dry_mass_kg: theoreticalLitres * (solids / 100) * i.density_kg_l,
    },
    warnings,
  };
}
