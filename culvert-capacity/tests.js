/**
 * culvert-capacity/tests.js — checks against the FHWA HDS-5 equations by hand and the HDS-5 Chart 1 nomograph values.
 * Run: node run-tests.js culvert-capacity
 */
import { calculate, criticalDepth } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const CFS = 0.028316846592;

const pipe36 = { shape: 'circular', inlet_circ: 'circ_square', diameter_m: 36 * IN, length_m: 100 * FT, slope: 0.01, manning_n: 0.012, tailwater_m: 0, mode: 'headwater' };

export const tests = [
  {
    name: '36 in pipe, square edge with headwall, 50 ft³/s, S 1 %: Q/AD^0.5 = 4.084, submerged HW = 3 × (0.0398 × 4.084² + 0.67 − 0.005) = 3.99 ft',
    source: 'HDS-5 Appendix A, eq. A.3 with Table A.1 constants c = 0.0398, Y = 0.67, Ks = −0.5 (hand calculation)',
    run: () => {
      const o = calculate({ ...pipe36, flow_m3s: 50 * CFS }).outputs;
      assertClose(o.discharge_index, 4.0839, { abs: 1e-4 }, 'Q/AD^0.5');
      assertClose(o.hw_inlet_m / FT, 3 * (0.0398 * 4.08392 ** 2 + 0.67 - 0.005), { abs: 1e-4 }, 'HWi');
      assertClose(o.velocity_m_s / FT, 7.0736, { abs: 1e-4 }, 'V');
      assertEqual(o.control.startsWith('Inlet control'), true, 'inlet governs');
    },
  },
  {
    name: 'Outlet control, same pipe: H = (1 + 0.5 + 29 × 0.012² × 100 / 0.75^1.33) V²/2g = 1.64 ft, h_o = (d_c + D)/2 = 2.65 ft, HW = 3.29 ft',
    source: 'HDS-5 chapter 3 full-flow outlet control with ke = 0.5 (Table C.2, square-edged headwall) (hand calculation)',
    run: () => {
      const o = calculate({ ...pipe36, flow_m3s: 50 * CFS }).outputs;
      const V = 50 / (Math.PI * 9 / 4);
      const H = (1 + 0.5 + 29 * 0.012 ** 2 * 100 / 0.75 ** 1.33) * V * V / (2 * 9.80665 / FT);
      const dc = o.critical_depth_m / FT;
      assertClose(o.hw_outlet_m / FT, H + (dc + 3) / 2 - 1, { abs: 1e-9 }, 'HWo');
      assertClose(o.hw_outlet_m / FT, 3.293, { abs: 1e-3 }, 'value');
      assertClose(dc, 2.3015, { abs: 1e-3 }, 'critical depth');
    },
  },
  {
    name: 'HDS-5 Chart 1 (36 in, square edge, S 0): HW/D 0.695 at 20, 0.895 at 30, 1.12 at 40, 1.62 at 60, 2.33 at 80, 3.28 at 100 ft³/s, within 2.5 %',
    source: 'FHWA HDS-5 Chart 1 nomograph values as tabulated by V. M. Ponce, SDSU online culvert tables (Table 1, square edge with headwall)',
    run: () => {
      [[20, 0.695], [30, 0.895], [40, 1.12], [60, 1.62], [80, 2.33], [100, 3.28]].forEach(([Q, v]) => {
        const o = calculate({ ...pipe36, slope: 0, flow_m3s: Q * CFS }).outputs;
        assertClose(o.hw_inlet_m / FT / 3, v, { rel: 0.025 }, `${Q} ft³/s`);
      });
    },
  },
  {
    name: 'Box critical depth d_c = (q²/g)^(1/3): 6 × 4 ft box at 200 ft³/s gives 3.26 ft; capacity mode inverts headwater mode',
    source: 'Rectangular-section critical depth (Chow, ch. 3); consistency of the bisection',
    run: () => {
      assertClose(criticalDepth('box', 4, 6, 200).dc, ((200 / 6) ** 2 / (9.80665 / FT)) ** (1 / 3), { rel: 1e-12 }, 'dc');
      assertClose(criticalDepth('box', 4, 6, 200).dc, 3.2565, { abs: 1e-4 }, 'value');
      const hw = calculate({ ...pipe36, flow_m3s: 50 * CFS }).outputs.hw_m;
      assertClose(calculate({ ...pipe36, mode: 'capacity', hw_allow_m: hw }).outputs.flow_out_m3s / CFS, 50, { rel: 1e-6 }, 'Q back');
      const box = calculate({ shape: 'box', inlet_box: 'box_30_75', span_m: 6 * FT, rise_m: 4 * FT, length_m: 100 * FT, slope: 0.01, flow_m3s: 200 * CFS }).outputs;
      assertClose(box.discharge_index, 200 / (24 * 2), { rel: 1e-12 }, 'box Q/AD^0.5');
      assertClose(box.hw_inlet_m / FT, 4 * (0.0347 * (200 / 48) ** 2 + 0.81 - 0.005), { abs: 1e-9 }, 'box submerged HWi');
    },
  },
  {
    name: 'A better inlet lowers the inlet-control headwater; high tailwater moves control to the outlet; impossible inputs are rejected',
    source: 'HDS-5 Table A.1 (groove end c = 0.0292 < square edge 0.0398); behaviour specification; validation contract',
    run: () => {
      const sq = calculate({ ...pipe36, flow_m3s: 50 * CFS }).outputs.hw_inlet_m;
      const gr = calculate({ ...pipe36, inlet_circ: 'circ_groove', flow_m3s: 50 * CFS }).outputs.hw_inlet_m;
      assertEqual(gr < sq, true, 'groove end better');
      assertEqual(calculate({ ...pipe36, flow_m3s: 50 * CFS, tailwater_m: 4 * FT }).outputs.control.startsWith('Outlet control'), true, 'tailwater');
      assertThrows(() => calculate({ ...pipe36, mode: 'capacity', hw_allow_m: 0.5 * FT, tailwater_m: 2 * FT }), 'Allowable headwater');
      assertThrows(() => calculate({ ...pipe36, inlet_circ: 'box_0' }), 'Inlet');
      assertThrows(() => calculate({ ...pipe36, flow_m3s: 0 }), 'Flow must be greater than zero');
    },
  },
];
