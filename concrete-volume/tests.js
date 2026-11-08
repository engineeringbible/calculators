/**
 * concrete-volume/tests.js — checks against standard estimating rules (dry-volume factor, bags per m³, d²/162) and geometry.
 * Run: node run-tests.js concrete-volume
 */
import { calculate, barMassPerM, elementVolume, meshBarLength, MIXES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SLAB = { element: 'slab', length_m: 10, width_m: 5, thickness_m: 0.2, count: 1, waste_pct: 10, concrete_density_kg_m3: 2400, mix: 'm15', bag_kg: 50, rebar_layout: 'mesh', bar_diameter_m: 0.012, spacing_m: 0.2, layers: 2, lap_pct: 10 };

export const tests = [
  {
    name: 'Slab 10 × 5 × 0.2 m: 10 m³ net, 11 m³ to order with 10 % waste, 24.0 t at 2 400 kg/m³; three slabs triple everything',
    source: 'Geometry; EN 1991-1-1 Table A.1 concrete density 24 kN/m³',
    run: () => {
      assertClose(elementVolume(SLAB), 10, { rel: 1e-12 }, 'volume');
      const { outputs } = calculate(SLAB);
      assertClose(outputs.volume_net_m3, 10, { rel: 1e-12 }, 'net');
      assertClose(outputs.volume_order_m3, 11, { rel: 1e-12 }, 'order');
      assertClose(outputs.mass_t, 24, { rel: 1e-12 }, 'mass');
      const three = calculate({ ...SLAB, count: 3 }).outputs;
      assertClose(three.volume_net_m3, 30, { rel: 1e-12 }, 'count');
    },
  },
  {
    name: 'Nominal mix 1 : 2 : 4 with dry-volume factor 1.54: cement 316.8 kg/m³ = 6.3 bags of 50 kg, sand 0.44 m³, aggregate 0.88 m³ per m³ of concrete',
    source: 'Standard estimating rule (IS 456 nominal mixes; 1.54 dry volume; cement 1 440 kg/m³ → 6.3 bags/m³ for 1:2:4)',
    run: () => {
      const perM3 = calculate({ ...SLAB, waste_pct: 0, thickness_m: 0.02, length_m: 10, width_m: 5 }).outputs; // 1 m³
      assertClose(perM3.volume_order_m3, 1, { rel: 1e-12 }, '1 m³');
      assertClose(perM3.cement_kg, (1.54 / 7) * 1440, { rel: 1e-12 }, 'cement formula');
      assertClose(perM3.cement_kg, 316.8, { abs: 0.1 }, 'cement kg');
      assertClose(perM3.cement_bags, 6.336, { abs: 1e-3 }, 'bags');
      assertClose(perM3.sand_m3, (1.54 * 2) / 7, { rel: 1e-12 }, 'sand');
      assertClose(perM3.aggregate_m3, (1.54 * 4) / 7, { rel: 1e-12 }, 'aggregate');
      assertClose(perM3.cement_per_m3_kg, 316.8, { abs: 0.1 }, 'cement per m³');
      const m20 = calculate({ ...SLAB, waste_pct: 0, thickness_m: 0.02, mix: 'm20' }).outputs;
      assertClose(m20.cement_kg, (1.54 / 5.5) * 1440, { rel: 1e-12 }, 'M20 cement (403 kg/m³)');
      assertEqual(calculate({ ...SLAB, mix: 'readymix' }).outputs.cement_kg, null, 'ready-mix: no split');
      assertEqual(Object.keys(MIXES).length, 5, 'five mixes');
    },
  },
  {
    name: 'Bar mass per metre d²/162: 8 mm 0.395, 12 mm 0.888, 16 mm 1.578, 20 mm 2.466, 25 mm 3.853 kg/m',
    source: 'ρ_steel π d²/4 with 7 850 kg/m³ (EN 1992-1-1 Annex C); d²/162 rule from detailing handbooks',
    run: () => {
      const expected = { 8: 0.395, 12: 0.888, 16: 1.578, 20: 2.466, 25: 3.853 };
      for (const [d, m] of Object.entries(expected)) assertClose(barMassPerM(Number(d) / 1000), m, { abs: 1.5e-3 }, `${d} mm`);
      assertClose(barMassPerM(0.012), 144 / 162, { rel: 2e-3 }, 'd²/162 rule within 0.2 %');
    },
  },
  {
    name: 'Mesh in the slab: 12 mm at 200 mm both ways, two layers → 26 bars × 10 m + 51 bars × 5 m per layer = 515 m, 1 030 m total, 1 133 m with 10 % laps, 1 006 kg, 101 kg/m³ (typical slab 80–120)',
    source: 'Bar count = floor(span / spacing) + 1 per direction; typical steel ratios (Reynolds, Reinforced Concrete Designer\'s Handbook)',
    run: () => {
      assertClose(meshBarLength(10, 5, 0.2, 1), 26 * 10 + 51 * 5, { rel: 1e-12 }, 'one layer');
      const { outputs } = calculate(SLAB);
      assertClose(outputs.rebar_length_m, 1030 * 1.1, { rel: 1e-9 }, 'length with laps');
      assertClose(outputs.rebar_mass_kg, 1030 * 1.1 * barMassPerM(0.012), { rel: 1e-9 }, 'mass');
      assertClose(outputs.rebar_mass_kg, 1006, { abs: 2 }, 'mass value');
      assertClose(outputs.steel_ratio_kg_m3, 100.6, { abs: 0.2 }, 'ratio');
      assertEqual(outputs.steel_ratio_check.includes('within the typical'), true, 'in range');
      assertClose(outputs.reinforced_mass_t, 24 + outputs.rebar_mass_kg / 1000, { rel: 1e-12 }, 'reinforced mass');
    },
  },
  {
    name: 'Rectangular column 400 × 400 × 3 m with 8 × 20 mm bars and 8 mm ties at 200 mm, 40 mm cover: 0.48 m³, 59.2 kg main steel, 16 ties of 1.44 m, ≈ 142 kg/m³ with no lap allowance',
    source: 'Bar layout arithmetic; tie length = 2 (a + b − 4c) + 20 d (perimeter inside cover plus hooks); typical column ratios 150–300 kg/m³',
    run: () => {
      const col = { element: 'column_rect', width_m: 0.4, thickness_m: 0.4, height_m: 3, count: 1, waste_pct: 0, mix: 'readymix', rebar_layout: 'bars', bar_diameter_m: 0.02, bar_count: 8, link_diameter_m: 0.008, link_spacing_m: 0.2, cover_m: 0.04, lap_pct: 0 };
      const { outputs } = calculate(col);
      assertClose(outputs.volume_net_m3, 0.48, { rel: 1e-12 }, 'volume');
      const mainMass = 8 * 3 * barMassPerM(0.02);
      assertClose(mainMass, 59.2, { abs: 0.1 }, 'main steel');
      const tieLength = 2 * (0.32 + 0.32) + 20 * 0.008;
      assertClose(tieLength, 1.44, { rel: 1e-12 }, 'tie length');
      const tieMass = 16 * tieLength * barMassPerM(0.008);
      assertClose(outputs.rebar_mass_kg, mainMass + tieMass, { rel: 1e-9 }, 'total steel');
      assertClose(outputs.rebar_length_m, 24 + 16 * 1.44, { rel: 1e-9 }, 'total length');
      assertClose(outputs.steel_ratio_kg_m3, (mainMass + tieMass) / 0.48, { rel: 1e-9 }, 'ratio');
      assertEqual(outputs.steel_ratio_check.includes('below the typical'), true, 'ratio below 150 without laps');
    },
  },
  {
    name: 'Round column Ø400 × 3 m: 0.377 m³; wall 10 × 3 × 0.25 m: 7.5 m³; footing 2 × 2 × 0.6 m: 2.4 m³',
    source: 'Geometry',
    run: () => {
      assertClose(elementVolume({ element: 'column_round', diameter_m: 0.4, height_m: 3 }), (Math.PI * 0.16 * 3) / 4, { rel: 1e-12 }, 'round column');
      assertClose(elementVolume({ element: 'wall', length_m: 10, height_m: 3, thickness_m: 0.25 }), 7.5, { rel: 1e-12 }, 'wall');
      assertClose(elementVolume({ element: 'footing', length_m: 2, width_m: 2, thickness_m: 0.6 }), 2.4, { rel: 1e-12 }, 'footing');
      const round = calculate({ element: 'column_round', diameter_m: 0.4, height_m: 3, mix: 'readymix', rebar_layout: 'bars', bar_diameter_m: 0.02, bar_count: 8, link_diameter_m: 0.008, link_spacing_m: 0.2, cover_m: 0.04, lap_pct: 0 }).outputs;
      assertClose(round.rebar_length_m, 24 + 16 * (Math.PI * 0.32 + 0.16), { rel: 1e-9 }, 'round ties use the perimeter inside cover');
    },
  },
  {
    name: 'Plain concrete: no reinforcement outputs; zero waste raises a warning',
    source: 'Behaviour specification',
    run: () => {
      const plain = calculate({ ...SLAB, rebar_layout: 'none', waste_pct: 0 });
      assertEqual(plain.outputs.rebar_mass_kg, null, 'no steel');
      assertEqual(plain.outputs.steel_ratio_check, 'No reinforcement', 'text');
      assertClose(plain.outputs.reinforced_mass_t, 24, { rel: 1e-12 }, 'mass without steel');
      assertEqual(plain.warnings.some((w) => w.includes('No waste allowance')), true, 'waste warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: fractional element count, cover larger than the section, unknown mix',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...SLAB, count: 2.5 }), 'whole number', 'count');
      assertThrows(() => calculate({ element: 'column_rect', width_m: 0.2, thickness_m: 0.2, height_m: 3, rebar_layout: 'bars', cover_m: 0.12 }), 'Cover is too large', 'cover');
      assertThrows(() => calculate({ ...SLAB, mix: 'm99' }), 'must be one of', 'mix');
    },
  },
];
