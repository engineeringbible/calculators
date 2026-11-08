/**
 * gravel/tests.js — checks against hand calculations of V = A × d, the Caterpillar loose densities and truck loads.
 * Run: node run-tests.js gravel
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const YD3 = 0.764554857984;
const FT3 = 0.028316846592;
const LB = 0.45359237;
const ST = 907.18474;

export const tests = [
  {
    name: '20 × 10 ft, 4 in of crushed stone: 2.47 yd³, 2.72 yd³ with 10 % compaction, 3.66 short ton, $146.50 at $40 per ton',
    source: 'Hand calculation: 20 × 10 × 4/12 = 66.67 ft³ / 27 = 2.469 yd³; × 1.1 = 2.716 yd³ × 1 600 kg/m³ = 3 322.5 kg = 3.662 short ton',
    run: () => {
      const o = calculate({ length_m: 20 * FT, width_m: 10 * FT, depth_m: 4 * IN, material: 'crushed_stone', compaction: 0.1, price_t: 40 }).outputs;
      assertClose(o.volume_m3 / YD3, 2.4691, { abs: 1e-4 }, 'yd³');
      assertClose(o.order_m3 / YD3, 2.7160, { abs: 1e-4 }, 'order yd³');
      assertClose(o.order_ft3_m3 / FT3, 73.333, { abs: 1e-3 }, 'ft³');
      assertClose(o.mass_kg / ST, 3.6624, { abs: 1e-4 }, 'short tons');
      assertClose(o.cost, 146.50, { abs: 0.01 }, 'cost');
      assertEqual(o.loads, 1, 'loads');
    },
  },
  {
    name: 'Caterpillar loose weights per cubic yard: crushed stone 2 700 lb, gravel 2 850, sand 2 400, sand and gravel 2 900, topsoil 1 600',
    source: 'Caterpillar Performance Handbook, weights of materials (loose kg/m³ and lb/yd³ columns, rounded)',
    run: () => {
      const base = { shape: 'area', area_m2: 27 * FT * FT, depth_m: FT, compaction: 0 };
      [['crushed_stone', 2700], ['gravel', 2850], ['sand', 2400], ['sand_gravel', 2900], ['topsoil', 1600]].forEach(([m, lb]) => {
        const o = calculate({ ...base, material: m }).outputs;
        assertClose(o.order_m3, YD3, { rel: 1e-9 }, `${m} volume`);
        assertClose(o.mass_kg / LB, lb, { rel: 0.005 }, m);
      });
    },
  },
  {
    name: 'Metric: 5 × 4 m of dry sand 100 mm deep, no allowance: 2.0 m³, 2 840 kg, 85.20 at 30 per tonne',
    source: 'Hand calculation: 5 × 4 × 0.1 = 2 m³ × 1 420 kg/m³ = 2 840 kg',
    run: () => {
      const o = calculate({ length_m: 5, width_m: 4, depth_m: 0.1, material: 'sand', compaction: 0, price_t: 30, price_basis: 'tonne' }).outputs;
      assertClose(o.volume_m3, 2, { rel: 1e-12 }, 'm³');
      assertClose(o.mass_t_kg, 2840, { rel: 1e-12 }, 'kg');
      assertClose(o.cost, 85.2, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'Truck loads take the tighter limit: 30 yd³ of crushed stone (40.5 short ton) is 2 loads of 20 yd³ by volume but 3 loads of 15 ton by weight',
    source: 'Hand calculation: 30 × 2 697 lb = 80 910 lb = 40.5 short ton; 40.5 / 15 = 2.7, rounded up to 3',
    run: () => {
      const o = calculate({ shape: 'area', area_m2: 30 * 27 * FT * FT, depth_m: FT, compaction: 0, material: 'crushed_stone', truck_m3: 20 * YD3, truck_kg: 15 * ST }).outputs;
      assertClose(o.mass_kg / ST, 40.45, { abs: 0.01 }, 'tons');
      assertEqual(o.loads, 3, 'loads');
      assertEqual(calculate({ shape: 'area', area_m2: 30 * 27 * FT * FT, depth_m: FT, compaction: 0, truck_m3: 20 * YD3, truck_kg: 50 * ST }).outputs.loads, 2, 'volume governs');
    },
  },
  {
    name: 'Custom density is used; a 1 in layer warns; zero depth, an unknown material and a density of 5 000 kg/m³ are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const o = calculate({ shape: 'area', area_m2: 10, depth_m: 0.1, material: 'custom', density_kg_m3: 2000, compaction: 0 }).outputs;
      assertClose(o.mass_kg, 2000, { rel: 1e-12 }, 'custom');
      assertEqual(calculate({ depth_m: IN }).warnings.length, 1, 'thin');
      assertThrows(() => calculate({ depth_m: 0 }), 'Depth must be greater than zero');
      assertThrows(() => calculate({ material: 'marble' }), 'Material');
      assertThrows(() => calculate({ material: 'custom', density_kg_m3: 5000 }), 'Bulk density');
    },
  },
];
