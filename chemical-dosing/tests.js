/**
 * chemical-dosing/tests.js — checks against the water-treatment pounds formula and hand calculations.
 * Run: node run-tests.js chemical-dosing
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MGD = (1e6 * 0.003785411784) / 86400; // m³/s
const LB = 0.45359237;

export const tests = [
  {
    name: '100 m³/h at 5 mg/L with 12.5 % w/v hypochlorite (1 200 kg/m³): 12.0 kg/day active, 4.00 L/h, 25.36 US gal/day, 115.2 kg/day',
    source: 'Hand calculation: active = Q × dose; product volume = active / (125 g/L)',
    run: () => {
      const o = calculate({ flow_m3_s: 100 / 3600, dose_mg_l: 5, basis: 'wv', strength: 0.125, product_density_kg_m3: 1200, hours: 24 }).outputs;
      assertClose(o.active_day_kg, 12, { rel: 1e-12 }, 'active');
      assertClose(o.pump_l_h, 4, { rel: 1e-12 }, 'L/h');
      assertClose(o.pump_gpd, 25.3605, { abs: 1e-4 }, 'gpd');
      assertClose(o.product_day_kg, 115.2, { rel: 1e-12 }, 'product');
      assertClose(o.strength_ww, 0.104167, { abs: 1e-6 }, '% w/w = % w/v / SG');
    },
  },
  {
    name: 'Pounds formula: 1 MGD at 1 mg/L needs 8.34 lb/day; 2.5 MGD at 3 mg/L needs 62.6 lb/day of chlorine',
    source: 'CSU Sacramento, Water Treatment Plant Operation Vol. I: lb/day = MGD × mg/L × 8.34',
    run: () => {
      assertClose(calculate({ flow_m3_s: MGD, dose_mg_l: 1 }).outputs.active_day_lb / LB, 8.345, { abs: 0.001 }, '1 MGD');
      assertClose(calculate({ flow_m3_s: 2.5 * MGD, dose_mg_l: 3 }).outputs.active_day_lb / LB, 62.59, { abs: 0.01 }, '2.5 MGD');
    },
  },
  {
    name: 'Chlorine: demand 1.5 + residual 0.5 = dose 2.0 mg/L; a 3.0 mg/L dose with 0.6 mg/L residual has 2.4 mg/L demand',
    source: 'Chlorine dose = demand + residual (CSU Sacramento; Metcalf & Eddy ch. 12)',
    run: () => {
      assertClose(calculate({ mode: 'chlorine', cl_solve: 'dose', demand_mg_l: 1.5, residual_mg_l: 0.5 }).outputs.dose_out, 2, { rel: 1e-12 }, 'dose');
      assertClose(calculate({ mode: 'chlorine', cl_solve: 'demand', cl_dose_mg_l: 3, residual_mg_l: 0.6 }).outputs.demand_out, 2.4, { rel: 1e-12 }, 'demand');
      assertClose(calculate({ mode: 'chlorine', cl_solve: 'residual', cl_dose_mg_l: 3, demand_mg_l: 2.2 }).outputs.residual_out, 0.8, { rel: 1e-12 }, 'residual');
    },
  },
  {
    name: 'Calcium hypochlorite at 65 % w/w: 100 lb of chlorine needs 153.8 lb of product; the % w/w and % w/v routes agree',
    source: 'CSU Sacramento: lb of hypochlorite = lb of chlorine / (% available chlorine / 100); consistency of the two bases',
    run: () => {
      const q = (100 * LB) / 86400 / 1e-3; // m³/s giving 100 lb/day at 1 mg/L
      const o = calculate({ flow_m3_s: q, dose_mg_l: 1, basis: 'ww', strength: 0.65 }).outputs;
      assertClose(o.product_day_kg / LB, 153.85, { abs: 0.01 }, 'lb product');
      const a = calculate({ basis: 'ww', strength: 0.10 }).outputs.pump_l_h;
      const b = calculate({ basis: 'wv', strength: 0.12, product_density_kg_m3: 1200 }).outputs.pump_l_h;
      assertClose(a, b, { rel: 1e-12 }, 'w/w vs w/v');
    },
  },
  {
    name: 'Fewer dosing hours scale the daily use but not the pump rate; 1 L/h is 6.34 US gal/day',
    source: 'Hand calculation (24 h / 3.785 L per gal)',
    run: () => {
      const full = calculate({ hours: 24 }).outputs;
      const half = calculate({ hours: 12 }).outputs;
      assertClose(half.product_day_m3, full.product_day_m3 / 2, { rel: 1e-12 }, 'daily');
      assertClose(half.pump_l_h, full.pump_l_h, { rel: 1e-12 }, 'rate');
      assertClose(full.pump_gpd / full.pump_l_h, 6.340, { abs: 0.001 }, 'gal/day per L/h');
    },
  },
  {
    name: 'A residual above the dose, zero flow and an impossible strength are rejected; a high residual warns',
    source: 'Validation contract; US EPA MRDL for chlorine 4.0 mg/L',
    run: () => {
      assertThrows(() => calculate({ mode: 'chlorine', cl_solve: 'demand', cl_dose_mg_l: 1, residual_mg_l: 2 }), 'cannot exceed the dose');
      assertThrows(() => calculate({ flow_m3_s: 0 }), 'Water flow rate Q must be greater than zero');
      assertThrows(() => calculate({ basis: 'wv', strength: 0.9, product_density_kg_m3: 800 }), 'more than 100 %');
      assertEqual(calculate({ mode: 'chlorine', cl_solve: 'dose', demand_mg_l: 1, residual_mg_l: 5 }).warnings.length, 1, 'MRDL');
    },
  },
];
