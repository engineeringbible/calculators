/**
 * asphalt/tests.js — checks against hand calculations of tonnage = area × thickness × density and the
 * 110 lb per yd² per inch rule of thumb.
 * Run: node run-tests.js asphalt
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const YD3 = 0.764554857984;
const ST = 907.18474;
const LB_FT3 = 16.01846337396;

export const tests = [
  {
    name: '12 × 50 ft driveway, 3 in compacted at 145 lb/ft³: 150 ft³, 10.88 short ton, 11.42 with 5 % waste, $1 142 at $100 per ton',
    source: 'Hand calculation: 600 ft² × 0.25 ft = 150 ft³ × 145 lb/ft³ = 21 750 lb = 10.875 short ton; × 1.05 = 11.419',
    run: () => {
      const o = calculate({ length_m: 50 * FT, width_m: 12 * FT, thickness_m: 3 * IN, density_kg_m3: 145 * LB_FT3, waste: 0.05, price_t: 100 }).outputs;
      assertClose(o.volume_m3 / YD3, 5.5556, { abs: 1e-4 }, 'yd³');
      assertClose(o.mass_kg / ST, 10.875, { abs: 1e-6 }, 'net tons');
      assertClose(o.order_kg / ST, 11.41875, { abs: 1e-6 }, 'order tons');
      assertClose(o.cost, 1141.875, { abs: 1e-6 }, 'cost');
    },
  },
  {
    name: 'Spread rate: 145 lb/ft³ is 108.75 lb per yd² per inch; the 110 lb rule corresponds to 146.7 lb/ft³',
    source: 'NAPA/Penn State checklist booklet: 108 to 120 lb/yd²/in for 144 to 160 lb/ft³; 145 × 9 / 12 = 108.75',
    run: () => {
      assertClose(calculate({}).outputs.spread_lb_yd2_in, 108.75, { abs: 1e-9 }, '145');
      assertClose(calculate({ density_kg_m3: (110 * 12 / 9) * LB_FT3 }).outputs.spread_lb_yd2_in, 110, { abs: 1e-9 }, '110 rule');
      assertClose(calculate({ density_kg_m3: 160 * LB_FT3 }).outputs.spread_lb_yd2_in, 120, { abs: 1e-9 }, '160');
    },
  },
  {
    name: 'Rule of thumb check: 100 yd² at 2 in with 110 lb/yd²/in is 11 short ton',
    source: 'tons = yd² × in × 110 / 2 000 = 100 × 2 × 110 / 2 000 = 11',
    run: () => {
      const o = calculate({ shape: 'area', area_m2: 100 * 9 * FT * FT, thickness_m: 2 * IN, density_kg_m3: (110 * 12 / 9) * LB_FT3, waste: 0 }).outputs;
      assertClose(o.order_kg / ST, 11, { rel: 1e-9 }, 'tons');
    },
  },
  {
    name: 'Metric patch: 10 m² at 50 mm and 2 400 kg/m³ is 1.2 t, 1.32 t with 10 % waste, 132 at 100 per tonne',
    source: 'Hand calculation: 10 × 0.05 × 2 400 = 1 200 kg',
    run: () => {
      const o = calculate({ shape: 'area', area_m2: 10, thickness_m: 0.05, density_kg_m3: 2400, waste: 0.1, price_t: 100, price_basis: 'tonne' }).outputs;
      assertClose(o.mass_kg, 1200, { rel: 1e-12 }, 'net');
      assertClose(o.order_t_kg, 1320, { rel: 1e-12 }, 'order');
      assertClose(o.cost, 132, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'A 1 in course warns; no price gives no cost; zero thickness and a density of 1 000 kg/m³ are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertEqual(calculate({ thickness_m: IN }).warnings.length, 1, 'thin');
      assertEqual(calculate({}).outputs.cost, null, 'no price');
      assertThrows(() => calculate({ thickness_m: 0 }), 'Compacted thickness must be greater than zero');
      assertThrows(() => calculate({ density_kg_m3: 1000 }), 'Compacted density');
    },
  },
];
