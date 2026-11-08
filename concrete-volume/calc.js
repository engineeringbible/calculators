/**
 * concrete-volume/calc.js — concrete volume and mass for slabs, walls, footings/beams and columns with a waste factor,
 * material quantities for nominal mixes, and reinforcement length, mass and steel ratio for mesh or bar layouts.
 *
 * Rebar mass per metre = 7 850 × π d²/4 ≈ d²/162 kg/m (d in mm). Nominal mix 1:a:b by volume with dry-volume factor 1.54.
 * Schema units: SI — m, m³, kg, t.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const STEEL_DENSITY_KG_M3 = 7850;
/** Bulk density of cement for converting mix volume to mass, kg/m³. */
export const CEMENT_BULK_DENSITY_KG_M3 = 1440;
/** Dry-volume factor: loose dry materials needed per m³ of compacted concrete (standard estimating practice). */
export const DRY_VOLUME_FACTOR = 1.54;

export const MIXES = {
  m10: { label: 'Nominal 1 : 3 : 6 (M10 / C8 — blinding, mass fill)', cement: 1, sand: 3, aggregate: 6 },
  m15: { label: 'Nominal 1 : 2 : 4 (M15 / C12 — footings, slabs on grade)', cement: 1, sand: 2, aggregate: 4 },
  m20: { label: 'Nominal 1 : 1.5 : 3 (M20 / C16 — structural, general RC)', cement: 1, sand: 1.5, aggregate: 3 },
  m25: { label: 'Nominal 1 : 1 : 2 (M25 / C20 — heavily loaded RC)', cement: 1, sand: 1, aggregate: 2 },
  readymix: { label: 'Ready-mixed (volume only, no material split)', cement: null, sand: null, aggregate: null },
};

export const ELEMENTS = {
  slab: { label: 'Slab or raft (length × width × thickness)' },
  wall: { label: 'Wall (length × height × thickness)' },
  footing: { label: 'Footing / beam / pad (length × width × depth)' },
  column_rect: { label: 'Rectangular column (width × depth × height)' },
  column_round: { label: 'Round column (diameter × height)' },
};

export const schema = {
  id: 'concrete-volume',
  name: 'Concrete volume and rebar weight',
  category: 'civil',
  summary: 'Concrete volume and mass for slabs, walls, footings and columns with waste, cement/sand/aggregate for nominal mixes, and rebar length, mass and steel ratio.',
  related: ['beam-deflection', 'column-buckling', 'manning-channel-flow', 'unit-converter'],
  assumptions: [
    'Volumes are the gross geometric volume of the element times the count; openings, chamfers and embedded items are not deducted, and the waste factor (5–10 % typical for in-situ work) covers over-excavation, spillage and formwork deflection.',
    'Concrete density 2 400 kg/m³ for the mass (EN 1991-1-1 Table A.1: 24 kN/m³ plain, 25 kN/m³ reinforced); the reinforcement mass computed separately can be added for the reinforced weight.',
    'Material quantities use the classic nominal-mix estimate: 1.54 m³ of loose dry materials per m³ of compacted concrete, split in the mix ratio by volume, with cement at a bulk density of 1 440 kg/m³ (one 50 kg bag ≈ 34.7 L). Designed mixes from a ready-mix supplier follow their mix design, not this rule.',
    'Reinforcement mass per metre = ρ_steel π d²/4 = 0.006165 d² kg/m with d in mm — the d²/162 rule — for plain or deformed bars of the same nominal diameter.',
    'Mesh layouts (slabs, walls): bars at the given spacing in both directions per layer, number of bars = floor(span/spacing) + 1 in each direction, each bar the full element dimension; cover, bends, hooks and chairs are covered only by the lap/waste percentage. Bar layouts (beams, columns): a given number of longitudinal bars over the element length plus links at a spacing with a perimeter from the cover.',
    'Steel ratios are reported in kg/m³ for comparison with typical ranges (slabs 80–120, beams 150–250, columns 150–300, foundations 60–100 kg/m³); they are an estimating check, not a structural design.',
  ],
  notes: [
    'Verification 2026-10-30: a 10 × 5 × 0.2 m slab gives 10 m³ (11 m³ with 10 % waste) and 24 t; the 1 : 2 : 4 mix gives 6.3 bags of 50 kg per m³ (316.8 kg), the figure quoted in estimating handbooks; 12 mm bars at 200 mm both ways in two layers give 1 030 m and 1 006 kg with 10 % laps, i.e. 101 kg/m³, inside the typical slab range.',
    'Design decision: the d²/162 rule is used instead of a bar-mass table so any diameter works; the exact 0.006165 d² is used (d²/162 = 0.006173 d², 0.1 % apart).',
    'Design decision: reinforcement geometry is deliberately simple (full-length bars, perimeter links) because detailing varies by code; the lap/waste percentage is the user\'s allowance for that.',
  ],
  sources: [
    'EN 1991-1-1:2002, Table A.1 (densities of concrete 24–25 kN/m³) and EN 1992-1-1 (reinforcement steel density 7 850 kg/m³, Annex C)',
    'IS 456:2000 Table 9 (nominal mix proportions M10–M20) and standard estimating practice (dry-volume factor 1.54, cement 1 440 kg/m³)',
    'BS 8500 / EN 206 (concrete classes C8/10 to C20/25 corresponding to the nominal mixes)',
    "Reinforced concrete detailing handbooks (the d²/162 bar-mass rule; typical steel ratios: Reynolds's Reinforced Concrete Designer's Handbook, 11th ed.)",
  ],
  inputs: [
    { id: 'element', label: 'Element', type: 'select', default: 'slab', options: Object.entries(ELEMENTS).map(([value, e]) => ({ value, label: e.label })) },
    { id: 'length_m', label: 'Length', group: 'length', unit: 'm', default: 10, min: 0.01, max: 1000, visibleWhen: { element: ['slab', 'wall', 'footing'] } },
    { id: 'width_m', label: 'Width (slab, footing) / column width', group: 'length', unit: 'm', default: 5, min: 0.01, max: 1000, visibleWhen: { element: ['slab', 'footing', 'column_rect'] } },
    { id: 'thickness_m', label: 'Thickness (slab, wall) / depth (footing, column)', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.01, max: 20, visibleWhen: { element: ['slab', 'wall', 'footing', 'column_rect'] } },
    { id: 'height_m', label: 'Height (wall, column)', group: 'length', unit: 'm', default: 3, min: 0.01, max: 200, visibleWhen: { element: ['wall', 'column_rect', 'column_round'] } },
    { id: 'diameter_m', label: 'Column diameter', group: 'length', unit: 'm', display: 'mm', default: 0.4, min: 0.05, max: 10, visibleWhen: { element: 'column_round' } },
    { id: 'count', label: 'Number of identical elements', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 10000, integer: true },
    { id: 'waste_pct', label: 'Waste and over-break allowance', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 50 },
    { id: 'concrete_density_kg_m3', label: 'Concrete density', group: 'density', unit: 'kg_m3', default: 2400, min: 1000, max: 4000 },
    { id: 'mix', label: 'Mix', type: 'select', default: 'm20', options: Object.entries(MIXES).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'bag_kg', label: 'Cement bag size', group: 'mass', unit: 'kg', default: 50, min: 1, max: 100, visibleWhen: { mix: ['m10', 'm15', 'm20', 'm25'] } },
    {
      id: 'rebar_layout',
      label: 'Reinforcement',
      type: 'select',
      default: 'mesh',
      options: [
        { value: 'none', label: 'None (plain concrete)' },
        { value: 'mesh', label: 'Bars at a spacing both ways, per layer (slabs, walls, rafts)' },
        { value: 'bars', label: 'Longitudinal bars with links/ties (beams, columns)' },
      ],
    },
    { id: 'bar_diameter_m', label: 'Main bar diameter', group: 'length', unit: 'm', display: 'mm', default: 0.012, min: 0.004, max: 0.06, visibleWhen: { rebar_layout: ['mesh', 'bars'] } },
    { id: 'spacing_m', label: 'Bar spacing (both ways)', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.05, max: 1, visibleWhen: { rebar_layout: 'mesh' } },
    { id: 'layers', label: 'Number of mesh layers (1 = single, 2 = top and bottom)', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 4, integer: true, visibleWhen: { rebar_layout: 'mesh' } },
    { id: 'bar_count', label: 'Number of longitudinal bars', group: 'dimensionless', unit: 'none', default: 8, min: 1, max: 200, integer: true, visibleWhen: { rebar_layout: 'bars' } },
    { id: 'link_diameter_m', label: 'Link / tie diameter', group: 'length', unit: 'm', display: 'mm', default: 0.008, min: 0.004, max: 0.03, visibleWhen: { rebar_layout: 'bars' } },
    { id: 'link_spacing_m', label: 'Link / tie spacing', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.05, max: 1, visibleWhen: { rebar_layout: 'bars' } },
    { id: 'cover_m', label: 'Concrete cover', group: 'length', unit: 'm', display: 'mm', default: 0.04, min: 0.01, max: 0.15, visibleWhen: { rebar_layout: 'bars' } },
    { id: 'lap_pct', label: 'Laps, bends and wastage allowance on steel', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 50, visibleWhen: { rebar_layout: ['mesh', 'bars'] } },
  ],
  outputs: [
    { id: 'volume_net_m3', label: 'Net concrete volume (all elements)', group: 'volume', unit: 'm3' },
    { id: 'volume_order_m3', label: 'Volume to order incl. waste', group: 'volume', unit: 'm3' },
    { id: 'mass_t', label: 'Concrete mass (net volume)', group: 'mass', unit: 't' },
    { id: 'cement_kg', label: 'Cement for the order volume', group: 'mass', unit: 'kg' },
    { id: 'cement_bags', label: 'Cement bags', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'sand_m3', label: 'Sand (fine aggregate), loose volume', group: 'volume', unit: 'm3' },
    { id: 'aggregate_m3', label: 'Coarse aggregate, loose volume', group: 'volume', unit: 'm3' },
    { id: 'cement_per_m3_kg', label: 'Cement content per m³ of concrete', group: 'density', unit: 'kg_m3' },
    { id: 'rebar_length_m', label: 'Reinforcement length incl. laps (all elements)', group: 'length', unit: 'm' },
    { id: 'rebar_mass_kg', label: 'Reinforcement mass', group: 'mass', unit: 'kg' },
    { id: 'bar_mass_per_m_kg_m', label: 'Main bar mass per metre (d²/162 rule)', group: 'linear_density', unit: 'kg_m' },
    { id: 'steel_ratio_kg_m3', label: 'Steel ratio (mass per m³ of net concrete)', group: 'density', unit: 'kg_m3' },
    { id: 'steel_ratio_check', label: 'Steel ratio against typical ranges', type: 'text' },
    { id: 'reinforced_mass_t', label: 'Concrete + reinforcement mass', group: 'mass', unit: 't' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      mix: 'm15',
    },
    results: {
      volume_net_m3: '10.0 m³',
      volume_order_m3: '11.0 m³',
      mass_t: '24.0 t',
      cement_kg: '3 485 kg',
      cement_bags: '69.7',
      sand_m3: '4.84 m³',
      aggregate_m3: '9.68 m³',
      rebar_length_m: '1 133 m',
      rebar_mass_kg: '1 006 kg',
      bar_mass_per_m_kg_m: '0.888 kg/m',
      steel_ratio_kg_m3: '101 kg/m³',
      reinforced_mass_t: '25.0 t',
    },
  },
};

/** Mass per metre of a round bar, kg/m, for a diameter in metres. */
export function barMassPerM(diameterM) {
  return (STEEL_DENSITY_KG_M3 * Math.PI * diameterM * diameterM) / 4;
}

/** Element volume, m³. */
export function elementVolume(i) {
  switch (i.element) {
    case 'slab':
      return i.length_m * i.width_m * i.thickness_m;
    case 'wall':
      return i.length_m * i.height_m * i.thickness_m;
    case 'footing':
      return i.length_m * i.width_m * i.thickness_m;
    case 'column_rect':
      return i.width_m * i.thickness_m * i.height_m;
    case 'column_round':
      return (Math.PI * i.diameter_m * i.diameter_m * i.height_m) / 4;
    default:
      throw new Error(`Unknown element "${i.element}"`);
  }
}

/** Plan dimensions used by a mesh layout: the two in-plane dimensions of the element. */
function meshPlan(i) {
  if (i.element === 'slab' || i.element === 'footing') return [i.length_m, i.width_m];
  if (i.element === 'wall') return [i.length_m, i.height_m];
  if (i.element === 'column_rect') return [i.width_m, i.height_m];
  return [Math.PI * i.diameter_m, i.height_m];
}

/** Length of main bars for a mesh layout in one element: bars along each direction, full length, per layer. */
export function meshBarLength(dimA, dimB, spacing, layers) {
  const barsAlongA = Math.floor(dimB / spacing) + 1;
  const barsAlongB = Math.floor(dimA / spacing) + 1;
  return layers * (barsAlongA * dimA + barsAlongB * dimB);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.element, Object.keys(ELEMENTS), 'element', 'Element');
  assertOneOf(i.mix, Object.keys(MIXES), 'mix', 'Mix');
  assertOneOf(i.rebar_layout, ['none', 'mesh', 'bars'], 'rebar_layout', 'Reinforcement');
  assertInteger(i.count, 'count', 'Number of elements');
  assertRange(i.count, 1, 1e6, 'count', 'Number of elements');
  assertRange(i.waste_pct, 0, 100, 'waste_pct', 'Waste');
  assertPositive(i.concrete_density_kg_m3, 'concrete_density_kg_m3', 'Concrete density');
  for (const id of ['length_m', 'width_m', 'thickness_m', 'height_m', 'diameter_m']) assertPositive(i[id], id, id);

  const volumeOne = elementVolume(i);
  const volumeNet = volumeOne * i.count;
  const volumeOrder = volumeNet * (1 + i.waste_pct / 100);
  const massT = (volumeNet * i.concrete_density_kg_m3) / 1000;

  let cementKg = null;
  let bags = null;
  let sand = null;
  let aggregate = null;
  let cementPerM3 = null;
  const mix = MIXES[i.mix];
  if (mix.cement !== null) {
    assertPositive(i.bag_kg, 'bag_kg', 'Bag size');
    const parts = mix.cement + mix.sand + mix.aggregate;
    const dryVolume = volumeOrder * DRY_VOLUME_FACTOR;
    const cementVolume = (dryVolume * mix.cement) / parts;
    cementKg = cementVolume * CEMENT_BULK_DENSITY_KG_M3;
    bags = cementKg / i.bag_kg;
    sand = (dryVolume * mix.sand) / parts;
    aggregate = (dryVolume * mix.aggregate) / parts;
    cementPerM3 = cementKg / volumeOrder;
  }

  let rebarLength = null;
  let rebarMass = null;
  let barMass = null;
  if (i.rebar_layout !== 'none') {
    assertPositive(i.bar_diameter_m, 'bar_diameter_m', 'Bar diameter');
    assertRange(i.lap_pct, 0, 100, 'lap_pct', 'Lap allowance');
    barMass = barMassPerM(i.bar_diameter_m);
    let lengthOne;
    let massOne;
    if (i.rebar_layout === 'mesh') {
      assertPositive(i.spacing_m, 'spacing_m', 'Bar spacing');
      assertInteger(i.layers, 'layers', 'Layers');
      const [a, b] = meshPlan(i);
      lengthOne = meshBarLength(a, b, i.spacing_m, i.layers);
      massOne = lengthOne * barMass;
    } else {
      assertInteger(i.bar_count, 'bar_count', 'Bar count');
      assertPositive(i.link_diameter_m, 'link_diameter_m', 'Link diameter');
      assertPositive(i.link_spacing_m, 'link_spacing_m', 'Link spacing');
      assertNonNegative(i.cover_m, 'cover_m', 'Cover');
      const memberLength = i.element === 'column_rect' || i.element === 'column_round' || i.element === 'wall' ? i.height_m : i.length_m;
      const mainLength = i.bar_count * memberLength;
      let linkPerimeter;
      if (i.element === 'column_round') linkPerimeter = Math.PI * (i.diameter_m - 2 * i.cover_m) + 20 * i.link_diameter_m;
      else {
        const sideA = (i.element === 'column_rect' ? i.width_m : i.width_m) - 2 * i.cover_m;
        const sideB = i.thickness_m - 2 * i.cover_m;
        if (sideA <= 0 || sideB <= 0) throw new Error('Cover is too large for the section — links would have no size');
        linkPerimeter = 2 * (sideA + sideB) + 20 * i.link_diameter_m;
      }
      const linkCount = Math.floor(memberLength / i.link_spacing_m) + 1;
      const linkLength = linkCount * linkPerimeter;
      lengthOne = mainLength + linkLength;
      massOne = mainLength * barMass + linkLength * barMassPerM(i.link_diameter_m);
    }
    rebarLength = lengthOne * i.count * (1 + i.lap_pct / 100);
    rebarMass = massOne * i.count * (1 + i.lap_pct / 100);
  }
  const steelRatio = rebarMass === null ? null : rebarMass / volumeNet;

  let ratioCheck = 'No reinforcement';
  if (steelRatio !== null) {
    const ranges = { slab: [80, 120], wall: [80, 150], footing: [60, 150], column_rect: [150, 300], column_round: [150, 300] };
    const [lo, hi] = ranges[i.element];
    if (steelRatio < lo) ratioCheck = `${steelRatio.toFixed(0)} kg/m³ — below the typical ${lo}–${hi} kg/m³ for this element (lightly reinforced or check the layout)`;
    else if (steelRatio > hi) ratioCheck = `${steelRatio.toFixed(0)} kg/m³ — above the typical ${lo}–${hi} kg/m³ (heavily reinforced or check the layout)`;
    else ratioCheck = `${steelRatio.toFixed(0)} kg/m³ — within the typical ${lo}–${hi} kg/m³`;
  }

  const warnings = [];
  if (i.waste_pct === 0) warnings.push('No waste allowance: in-situ concrete orders normally carry 5–10 % for over-break, spillage and formwork deflection.');
  if (mix.cement !== null) warnings.push('Material split uses the nominal-mix estimate (1.54 dry-volume factor); a designed or ready-mixed concrete follows the supplier\'s mix design.');
  if (i.rebar_layout === 'mesh') warnings.push('Mesh quantities assume full-length bars at the spacing in both directions per layer; cover, hooks and chairs are inside the lap allowance.');
  warnings.push('Quantities for estimating only; the structural design (bar sizes, spacing, cover) comes from the design code.');

  return {
    outputs: {
      volume_net_m3: volumeNet,
      volume_order_m3: volumeOrder,
      mass_t: massT,
      cement_kg: cementKg,
      cement_bags: bags,
      sand_m3: sand,
      aggregate_m3: aggregate,
      cement_per_m3_kg: cementPerM3,
      rebar_length_m: rebarLength,
      rebar_mass_kg: rebarMass,
      bar_mass_per_m_kg_m: barMass,
      steel_ratio_kg_m3: steelRatio,
      steel_ratio_check: ratioCheck,
      reinforced_mass_t: massT + (rebarMass || 0) / 1000,
    },
    warnings,
  };
}
