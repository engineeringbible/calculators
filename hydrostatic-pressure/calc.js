/**
 * hydrostatic-pressure/calc.js — pressure at a depth in a still liquid, gauge and absolute, its head in metres of
 * water, and the force on a horizontal surface at that depth.
 *
 * p_gauge = ρ g h;  p_abs = p_gauge + p_surface;  F = p_gauge A.
 * Schema units: SI — m, Pa, kg/m³, m², N.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertNonNegative } from '../shared/validate.js';
import { fluidOptions, densityOf } from '../shared/fluids.js';

// Standard atmosphere at sea level (ISO 2533).
export const P_ATM_PA = 101325;
// Density of water used to express a pressure as metres of water column (conventional, 1000 kg/m³ at g_n).
const WATER_HEAD_RHO = 1000;

export const schema = {
  id: 'hydrostatic-pressure',
  name: 'Hydrostatic pressure at depth',
  category: 'thermal',
  summary: 'Gauge and absolute pressure at a depth in water, sea water, fuel or any liquid, its head in metres of water, and the force on a flat surface.',
  related: ['bernoulli', 'tank-volume', 'pipe-volume', 'draft-survey'],
  assumptions: [
    'The liquid is at rest and of uniform density; a column with temperature or salinity layers needs an average density.',
    'Gravity is the standard 9.806 65 m/s²; local gravity varies by up to 0.3 % with latitude and height.',
    'The surface pressure is the standard atmosphere (101.325 kPa) unless another is entered, for example a pressurised tank or a different altitude.',
    'The force is on a horizontal surface at the given depth, where the pressure is uniform; a vertical or sloping wall needs the pressure at its centroid.',
  ],
  notes: [
    'Verification 2026-11-07: sea water at 30 m gives 301.8 kPa gauge and 403.1 kPa absolute; fresh water at 10 m gives 97.9 kPa, the familiar "one atmosphere per ten metres". Checked by hand.',
  ],
  sources: [
    'White, F. M., Fluid Mechanics, 7th ed., ch. 2.3 (hydrostatic pressure distribution p = p₀ + ρ g h) and ch. 2.5 (forces on plane surfaces)',
    'ISO 2533:1975 Standard Atmosphere (101 325 Pa at sea level); ISO 80000-3 standard gravity 9.806 65 m/s²',
    'ITTC 7.5-02-01-03 (2011), fresh and sea water density (shared/fluids.js)',
  ],
  inputs: [
    { id: 'depth_m', label: 'Depth below the surface h', group: 'length', unit: 'm', default: 30, min: 0, max: 12000 },
    { id: 'fluid', label: 'Liquid', type: 'select', default: 'seawater_15c', options: fluidOptions(['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom']) },
    { id: 'rho_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 1000, min: 1, max: 25000, visibleWhen: { fluid: 'custom' }, help: 'Mercury is 13 534 kg/m³ at 20 °C.' },
    { id: 'surface_pa', label: 'Pressure at the surface (absolute)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 0, max: 1e9, help: 'Atmosphere at sea level is 101.325 kPa.' },
    { id: 'area_m2', label: 'Horizontal surface area at that depth (0 to skip)', group: 'area', unit: 'm2', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'gauge_pa', label: 'Gauge pressure ρ g h', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'gauge_bar', label: 'Gauge pressure in bar', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'absolute_pa', label: 'Absolute pressure', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'head_water_m', label: 'Head in metres of water (1000 kg/m³)', group: 'length', unit: 'm' },
    { id: 'gradient_pa_m', label: 'Pressure rise per metre of depth (kPa/m)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'force_n', label: 'Force on the surface from the liquid', group: 'force', unit: 'N', display: 'kN' },
  ],
  example: {
    inputs: { depth_m: [30, 'm'], fluid: 'seawater_15c', surface_pa: [101.325, 'kPa'], area_m2: [0, 'm2'] },
    results: {
      gauge_pa: '301.8 kPa',
      absolute_pa: '403.1 kPa',
      gauge_bar: '3.02 bar',
    },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const depth = assertNonNegative(x.depth_m, 'depth_m', 'Depth');
  const rho = densityOf(x.fluid, x.rho_kg_m3);
  const surface = assertNonNegative(x.surface_pa, 'surface_pa', 'Pressure at the surface');
  const area = assertNonNegative(x.area_m2, 'area_m2', 'Surface area');
  const gauge = rho * GRAVITY_M_S2 * depth;
  const warnings = [];
  if (depth > 1000 && rho > 900) warnings.push('Below about 1000 m water compresses noticeably (about 0.5 % per 1000 m); the constant-density result slightly understates the pressure.');
  return {
    outputs: {
      gauge_pa: gauge,
      gauge_bar: gauge,
      absolute_pa: gauge + surface,
      head_water_m: gauge / (WATER_HEAD_RHO * GRAVITY_M_S2),
      gradient_pa_m: (rho * GRAVITY_M_S2) / 1000,
      force_n: area > 0 ? gauge * area : null,
    },
    warnings,
  };
}
