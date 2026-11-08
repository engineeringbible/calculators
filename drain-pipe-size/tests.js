/**
 * drain-pipe-size/tests.js — checks against Manning's equation by hand, the Ten States Standards minimum slopes and the
 * partially full circular section.
 * Run: node run-tests.js drain-pipe-size
 */
import { calculate, fullFlow } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const FT = 0.3048;
const CFS = 0.028316846592;
const GPM = 0.003785411784 / 60;

export const tests = [
  {
    name: '8 in at 0.40 %, n 0.013: 0.764 ft³/s (343 US gpm) at 2.19 ft/s flowing full',
    source: 'Hand calculation, US Manning: Q = 1.486/0.013 × 0.3491 ft² × (0.1667)^(2/3) × 0.004^0.5 = 0.764 ft³/s',
    run: () => {
      const o = calculate({ diameter_m: 8 * IN, slope: 0.004, roughness: 'concrete', flow_m3s: 150 * GPM }).outputs;
      assertClose(o.q_full_m3s / CFS, 0.7642, { abs: 2e-4 }, 'ft³/s');
      assertClose(o.q_full_m3s / GPM, 343.0, { abs: 0.1 }, 'gpm');
      assertClose(o.v_full_m_s / FT, 2.1893, { abs: 2e-4 }, 'ft/s');
    },
  },
  {
    name: 'Ten States §33.41 minimum slopes give at least 2.0 ft/s flowing full with n 0.013: 8 in 0.40 %, 10 in 0.28 %, 12 in 0.22 %, 15 in 0.15 %',
    source: 'Recommended Standards for Wastewater Facilities (2014), §33.41 table of minimum slopes',
    run: () => {
      [[8, 0.004], [10, 0.0028], [12, 0.0022], [15, 0.0015]].forEach(([d, s]) => {
        const o = calculate({ diameter_m: d * IN, slope: s, roughness: 'concrete' }).outputs;
        assertEqual(o.v_full_m_s >= 2 * FT, true, `${d} in`);
        assertEqual(o.self_cleansing.startsWith('Meets'), true, `${d} in text`);
      });
      const flat = calculate({ diameter_m: 8 * IN, slope: 0.003, roughness: 'concrete' }).outputs;
      assertEqual(flat.self_cleansing.startsWith('Below'), true, '0.30 % fails');
      assertClose(flat.min_slope, 0.003338, { abs: 2e-6 }, 'minimum slope 0.334 %');
    },
  },
  {
    name: 'Partial flow: half the full flow runs at y/D = 0.500 with the full-pipe velocity; 150 gpm in 8 in at 0.40 % is 0.46 deep at 2.12 ft/s',
    source: 'Circular section geometry: at half depth R = D/4, so V equals the full-pipe value and Q is half (Chow, partially full circular sections)',
    run: () => {
      const D = 8 * IN;
      const half = calculate({ diameter_m: D, slope: 0.004, roughness: 'concrete', flow_m3s: fullFlow(D, 0.013, 0.004) / 2 }).outputs;
      assertClose(half.depth_ratio, 0.5, { abs: 1e-6 }, 'y/D');
      assertClose(half.v_design_m_s, half.v_full_m_s, { rel: 1e-6 }, 'V');
      const o = calculate({ diameter_m: D, slope: 0.004, roughness: 'concrete', flow_m3s: 150 * GPM }).outputs;
      assertClose(o.depth_ratio, 0.4626, { abs: 1e-3 }, 'design depth');
      assertClose(o.v_design_m_s / FT, 2.116, { abs: 1e-3 }, 'design V');
    },
  },
  {
    name: 'Smallest standard size: 150 gpm at 0.40 % needs 6 in (n 0.013); 2 ft³/s needs 12 in; DN series gives 150 mm for 150 gpm',
    source: 'Full-flow Manning capacities: 6 in 159 gpm, 10 in 1.39 ft³/s, 12 in 2.26 ft³/s at 0.40 %',
    run: () => {
      assertEqual(calculate({ slope: 0.004, flow_m3s: 150 * GPM }).outputs.smallest.startsWith('6 in'), true, '6 in');
      assertEqual(calculate({ slope: 0.004, flow_m3s: 2 * CFS }).outputs.smallest.startsWith('12 in'), true, '12 in');
      assertEqual(calculate({ slope: 0.004, flow_m3s: 150 * GPM, series: 'metric' }).outputs.smallest.startsWith('150 mm'), true, '150 mm');
    },
  },
  {
    name: 'PVC n 0.009 carries 13/9 of the concrete flow; a flow beyond the free-surface capacity gives no depth; bad inputs are rejected',
    source: 'Manning: Q ∝ 1/n; validation contract',
    run: () => {
      const c = calculate({ roughness: 'concrete' }).outputs.q_full_m3s;
      const p = calculate({ roughness: 'pvc' }).outputs.q_full_m3s;
      assertClose(p / c, 13 / 9, { rel: 1e-12 }, 'ratio');
      const r = calculate({ diameter_m: 4 * IN, slope: 0.01, flow_m3s: 1 * CFS });
      assertEqual(r.outputs.depth_ratio, null, 'surcharged');
      assertEqual(r.warnings.some((w) => w.includes('surcharged')), true, 'warning');
      assertThrows(() => calculate({ slope: 0 }), 'Pipe slope');
      assertThrows(() => calculate({ roughness: 'custom', manning_n: 0.05 }), "Manning's n");
    },
  },
];
