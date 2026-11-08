/**
 * rocket-equation/tests.js — checks against Δv = Isp g0 ln(m0/mf), its inverse and the staging sum.
 * Run: node run-tests.js rocket-equation
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Isp 300 s, 1 000 kg to 400 kg: v_e = 2 942.0 m/s, Δv = 2 942.0 × ln 2.5 = 2 695.7 m/s, 60 % propellant',
    source: 'Sutton and Biblarz, Rocket Propulsion Elements, Ch. 4 (ideal Δv) and Ch. 2 (v_e = Isp g0, g0 = 9.806 65 m/s²)',
    run: () => {
      const o = calculate({ mode: 'dv', exhaust: 'isp', isp_s: 300, m0_kg: 1000, mf_kg: 400 }).outputs;
      assertClose(o.ve_out_m_s, 2941.995, { abs: 1e-9 }, 'v_e');
      assertClose(o.dv_m_s, 2941.995 * Math.log(2.5), { rel: 1e-12 }, 'Δv');
      assertClose(o.dv_m_s, 2695.72, { abs: 0.01 }, 'Δv value');
      assertClose(o.prop_fraction, 0.6, { rel: 1e-12 }, 'fraction');
    },
  },
  {
    name: 'A mass ratio of e gives a delta-v equal to the exhaust velocity (4 400 m/s); no burn gives zero',
    source: 'Δv = v_e ln(m0/mf), limiting cases',
    run: () => {
      const o = calculate({ mode: 'dv', exhaust: 've', ve_m_s: 4400, m0_kg: 1000 * Math.E, mf_kg: 1000 }).outputs;
      assertClose(o.dv_m_s, 4400, { rel: 1e-12 }, 'Δv = v_e');
      assertEqual(calculate({ mode: 'dv', m0_kg: 500, mf_kg: 500 }).outputs.dv_m_s, 0, 'no burn');
    },
  },
  {
    name: 'Propellant for 3 000 m/s at Isp 300 s with 400 kg final mass: 400 × (e^(3 000/2 942.0) − 1) = 709.0 kg, and back to 3 000 m/s',
    source: 'Inverse of the rocket equation, m_p = mf (e^(Δv/v_e) − 1); consistency with the forward calculation',
    run: () => {
      const p = calculate({ mode: 'prop', isp_s: 300, mf_kg: 400, dv_target_m_s: 3000 }).outputs;
      assertClose(p.prop_kg, 708.963, { abs: 0.001 }, 'propellant');
      const back = calculate({ mode: 'dv', isp_s: 300, m0_kg: p.m0_out_kg, mf_kg: 400 }).outputs;
      assertClose(back.dv_m_s, 3000, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Two stages (payload 1 000 kg; 20 000 + 2 000 kg at 280 s; 4 000 + 500 kg at 320 s): 3 567.7 + 4 077.3 = 7 645.0 m/s',
    source: 'Staged rocket equation, each stage’s m0 carries the stages above and the payload (Curtis, Ch. 11)',
    run: () => {
      const o = calculate({ mode: 'stages', stages: '2', payload_kg: 1000, isp1_s: 280, prop1_kg: 20000, dry1_kg: 2000, isp2_s: 320, prop2_kg: 4000, dry2_kg: 500 }).outputs;
      assertClose(o.stage1_dv_m_s, 280 * 9.80665 * Math.log(27500 / 7500), { rel: 1e-12 }, 'stage 1');
      assertClose(o.stage2_dv_m_s, 320 * 9.80665 * Math.log(5500 / 1500), { rel: 1e-12 }, 'stage 2');
      assertClose(o.dv_m_s, 7644.97, { abs: 0.01 }, 'total');
      assertClose(o.m0_out_kg, 27500, { rel: 1e-12 }, 'lift-off mass');
      assertEqual(o.stage3_dv_m_s, null, 'no third stage');
    },
  },
  {
    name: 'Staging pays: the same 24 000 kg of propellant and 2 500 kg of structure at 300 s in one stage gives only 6 065 m/s',
    source: 'Rocket equation, single stage 27 500 → 3 500 kg',
    run: () => {
      const one = calculate({ mode: 'stages', stages: '1', payload_kg: 1000, isp1_s: 300, prop1_kg: 24000, dry1_kg: 2500 }).outputs;
      assertClose(one.dv_m_s, 300 * 9.80665 * Math.log(27500 / 3500), { rel: 1e-12 }, 'single stage');
      assertClose(one.dv_m_s, 6064.7, { abs: 0.1 }, 'value');
    },
  },
  {
    name: 'An initial mass below the final mass, zero final mass and an empty stage with no payload are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'dv', m0_kg: 300, mf_kg: 400 }), 'Initial mass');
      assertThrows(() => calculate({ mode: 'dv', mf_kg: 0 }), 'Final mass');
      assertThrows(() => calculate({ mode: 'stages', stages: '1', payload_kg: 0, dry1_kg: 0 }), 'Stage 1');
    },
  },
];
