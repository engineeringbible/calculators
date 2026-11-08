/**
 * rational-runoff/tests.js — checks against the rational method's unit forms, Kirpich and a published worked case.
 * Run: node run-tests.js rational-runoff
 */
import { calculate, kirpichMinutes, rationalFlow, SURFACES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SITE = { area1_m2: 20000, surface1: 'asphalt', area2_m2: 10000, surface2: 'roof', area3_m2: 30000, surface3: 'lawn_flat', flow_length_m: 500, slope: 0.02, tc_min_floor: 5, intensity_mode: 'direct', intensity_mm_h: 100, return_period: '10' };

export const tests = [
  {
    name: 'Published case (Houston): C 0.57, i 4.2 in/h (106.68 mm/h), A 15 acres (6.070 ha) → Q = 0.57 × 106.68 × 6.070/360 = 1.025 m³/s = 36.2 cfs (US form 35.9 cfs; the 1.008 factor explains the difference)',
    source: 'Guilford County / HEC-22 rational method example (Q = C i A = 35.9 cfs); SI form Q = C i A/360 (CPHEEO)',
    run: () => {
      const areaHa = (15 * 4046.8564224) / 1e4;
      const q = rationalFlow(0.57, 4.2 * 25.4, areaHa);
      assertClose(q, 1.025, { abs: 2e-3 }, 'm³/s');
      assertClose(q / 0.028316846592, 36.2, { abs: 0.1 }, 'cfs');
      assertClose((q / 0.028316846592) / 35.9, 1.008, { abs: 3e-3 }, 'unit factor');
      const r = calculate({ ...SITE, area1_m2: 15 * 4046.8564224, surface1: 'custom', c1_custom: 0.57, area2_m2: 0, area3_m2: 0, intensity_mm_h: 4.2 * 25.4 }).outputs;
      assertClose(r.peak_flow_m3_s, q, { rel: 1e-9 }, 'in calculate');
    },
  },
  {
    name: 'Composite C: 2 ha asphalt (0.85) + 1 ha roofs (0.90) + 3 ha lawn (0.10) → C = (1.7 + 0.9 + 0.3)/6 = 0.483; impervious share 50 %; 100 mm/h → Q = 0.483 × 100 × 6/360 = 0.806 m³/s = 134 L/s/ha',
    source: 'Area-weighted runoff coefficient (ASCE MOP 77); SI rational formula',
    run: () => {
      const { outputs } = calculate(SITE);
      assertClose(outputs.composite_c, 2.9 / 6, { rel: 1e-12 }, 'C');
      assertClose(outputs.impervious_pct, 50, { rel: 1e-12 }, 'impervious');
      assertClose(outputs.total_area_ha, 6, { rel: 1e-12 }, 'ha');
      assertClose(outputs.peak_flow_m3_s, (2.9 / 6) * 100 * 6 / 360, { rel: 1e-12 }, 'Q');
      assertClose(outputs.peak_flow_m3_s, 0.806, { abs: 1e-3 }, 'Q value');
      assertClose(outputs.peak_flow_per_ha, (outputs.peak_flow_m3_s * 1000) / 6, { rel: 1e-12 }, 'L/s/ha');
      assertEqual(SURFACES.roof.c === 0.9 && SURFACES.asphalt.c === 0.85 && SURFACES.lawn_flat.c === 0.1, true, 'coefficients');
    },
  },
  {
    name: 'Kirpich: 500 m at 2 % → t_c = 0.0195 × 500^0.77 × 0.02^−0.385 = 10.5 min; the US constant 0.0078 with feet gives the same (0.0078 × 3.2808^0.77 = 0.0195); 100 m at 0.5 % → 5.2 min',
    source: 'Kirpich (1940); Iowa DOT 4A-5 (SI constant 0.0195, L in m) and Guilford County manual (0.0078, L in ft)',
    run: () => {
      assertClose(kirpichMinutes(500, 0.02), 0.0195 * 500 ** 0.77 * 0.02 ** -0.385, { rel: 1e-12 }, 'formula');
      assertClose(kirpichMinutes(500, 0.02), 10.5, { abs: 0.1 }, 'value');
      assertClose(0.0078 * 3.28084 ** 0.77, 0.0195, { abs: 1e-4 }, 'US ↔ SI constant');
      assertClose(0.0078 * (500 * 3.28084) ** 0.77 * 0.02 ** -0.385, kirpichMinutes(500, 0.02), { rel: 2e-3 }, 'same t_c');
      assertClose(kirpichMinutes(100, 0.005), 5.2, { abs: 0.05 }, 'flat short path');
      assertClose(calculate(SITE).outputs.tc_kirpich_min, kirpichMinutes(500, 0.02), { rel: 1e-12 }, 'output in minutes');
    },
  },
  {
    name: 'Minimum t_c: a 50 m path at 5 % gives Kirpich 1.6 min, floored to 5 min with a warning; IDF mode i = 2000/(t_c + 10)^0.8 at t_c 10.5 min → 177 mm/h',
    source: 'Common 5–10 min minimum (HEC-22); IDF fit form i = a/(t + b)^n',
    run: () => {
      const short = calculate({ ...SITE, flow_length_m: 50, slope: 0.05 });
      assertEqual(short.outputs.tc_kirpich_min < 2, true, 'Kirpich short');
      assertClose(short.outputs.tc_design_min, 5, { rel: 1e-12 }, 'floored');
      assertEqual(short.warnings.some((w) => w.includes('minimum is used')), true, 'warning');
      const idf = calculate({ ...SITE, intensity_mode: 'idf', idf_a: 2000, idf_b: 10, idf_n: 0.8 }).outputs;
      const tc = kirpichMinutes(500, 0.02);
      assertClose(idf.intensity_out_mm_h, 2000 / (tc + 10) ** 0.8, { rel: 1e-12 }, 'IDF');
      assertClose(idf.intensity_out_mm_h, 177, { abs: 2 }, 'value');
    },
  },
  {
    name: 'Frequency factor: 100-year storm multiplies C by 1.25 (0.483 → 0.604); a fully paved site at C 0.85 × 1.25 is capped at 1.0 with a warning; runoff depth and volume follow C i t_c',
    source: 'ASCE MOP 77 / state drainage manuals (C_f 1.0 / 1.1 / 1.2 / 1.25, C C_f ≤ 1)',
    run: () => {
      const r100 = calculate({ ...SITE, return_period: '100' }).outputs;
      assertClose(r100.frequency_factor, 1.25, { rel: 1e-12 }, 'C_f');
      assertClose(r100.c_design, (2.9 / 6) * 1.25, { rel: 1e-12 }, 'C design');
      const paved = calculate({ ...SITE, area2_m2: 0, area3_m2: 0, return_period: '100' });
      assertEqual(paved.outputs.c_design, 1, 'capped');
      assertEqual(paved.warnings.some((w) => w.includes('capped at 1.0')), true, 'cap warning');
      const base = calculate(SITE).outputs;
      assertClose(base.runoff_depth_mm, base.c_design * 100 * (base.tc_design_min / 60), { rel: 1e-12 }, 'depth');
      assertClose(base.runoff_volume_m3, (base.runoff_depth_mm / 1000) * 60000, { rel: 1e-12 }, 'volume');
    },
  },
  {
    name: 'Applicability: 6 ha within range; 30 ha "acceptable with care"; 100 ha flagged (> 80 ha); invalid inputs fail fast (no area, zero slope, unknown surface)',
    source: 'HEC-22 / ASCE MOP 77 area limits for the rational method; validation contract',
    run: () => {
      assertEqual(calculate(SITE).outputs.applicability.startsWith('Within'), true, 'small');
      assertEqual(calculate({ ...SITE, area3_m2: 270000 }).outputs.applicability.startsWith('Acceptable'), true, 'medium');
      assertEqual(calculate({ ...SITE, area3_m2: 970000 }).outputs.applicability.startsWith('CAUTION'), true, 'large');
      assertThrows(() => calculate({ ...SITE, area1_m2: 0, area2_m2: 0, area3_m2: 0 }), 'at least one sub-area', 'no area');
      assertThrows(() => calculate({ ...SITE, slope: 0 }), 'greater than zero', 'slope');
      assertThrows(() => calculate({ ...SITE, surface1: 'glass' }), 'must be one of', 'surface');
    },
  },
];
