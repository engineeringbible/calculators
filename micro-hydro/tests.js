/**
 * micro-hydro/tests.js — checks against P = ρ g Q H η, Darcy–Weisbach and Hazen–Williams losses and ESHA Table 6.3.
 * Run: node run-tests.js micro-hydro
 */
import { calculate, turbinesForHead, hazenWilliamsLoss } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const names = (h) => turbinesForHead(h).map((t) => t.name.split(' ')[0]);

export const tests = [
  {
    name: '1 m³/s over a 10 m net head is 98.07 kW of hydraulic power; at 80 % it delivers 78.45 kW',
    source: 'ESHA 2004, eq. 6.1: P = ρ Q g H η with ρ = 1 000 kg/m³, g = 9.80665 m/s²',
    run: () => {
      const o = calculate({ flow_m3s: 1, gross_head_m: 10, loss_mode: 'pct', loss_frac: 0, efficiency: 0.8, density: 1000 }).outputs;
      assertClose(o.hydraulic_w, 98066.5, { rel: 1e-12 }, 'P_h');
      assertClose(o.electric_w, 78453.2, { rel: 1e-12 }, 'P_e');
    },
  },
  {
    name: '50 L/s, 200 m of 200 mm plastic pipe: v 1.592 m/s, Re 243 500, f 0.0151, loss 1.95 m, net 38.05 m, 11.19 kW at 60 %',
    source: 'Hand calculation: Darcy–Weisbach with the Colebrook friction factor (Haaland gives 0.0150, within 1 %)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.velocity_m_s, 1.59155, { abs: 1e-5 }, 'v');
      assertClose(o.reynolds, 243542, { abs: 1 }, 'Re');
      assertClose(o.friction_factor, 0.01512, { abs: 0.0001 }, 'f');
      assertClose(o.friction_loss_m, 1.9527, { abs: 0.001 }, 'h_f');
      assertClose(o.electric_w, 11193.5, { abs: 0.5 }, 'P_e');
      assertClose(o.energy_j / 3.6e6, 11.1935 * 8760 * 0.8, { rel: 1e-4 }, 'kWh');
    },
  },
  {
    name: 'Hazen–Williams with C = 150 gives 1.97 m for the same pipe, within 1 % of Darcy–Weisbach; 100 L/s in 300 mm, 1 km, C 130 loses 6.42 m',
    source: 'Hazen–Williams SI form h_f = 10.67 L Q^1.852 / (C^1.852 D^4.8704), hand calculation',
    run: () => {
      const hw = calculate({ loss_mode: 'hw', hw_c: 150 }).outputs.friction_loss_m;
      assertClose(hw, 1.9671, { abs: 0.001 }, 'HW');
      assertClose(hw, calculate({}).outputs.friction_loss_m, { rel: 0.01 }, 'agrees with Darcy');
      assertClose(hazenWilliamsLoss(0.1, 0.3, 1000, 130), 10.67 * 1000 * 0.1 ** 1.852 / (130 ** 1.852 * 0.3 ** 4.8704), { rel: 1e-12 }, 'formula');
      assertClose(hazenWilliamsLoss(0.1, 0.3, 1000, 130), 6.42, { abs: 0.01 }, '6.42 m');
    },
  },
  {
    name: 'ESHA Table 6.3: 3 m Kaplan only; 38 m Kaplan, crossflow, Francis; 100 m crossflow, Francis, Turgo, Pelton; 500 m Pelton only',
    source: 'ESHA, Guide on How to Develop a Small Hydropower Plant (2004), Table 6.3 Range of heads',
    run: () => {
      assertEqual(names(3).join(','), 'Kaplan', '3 m');
      assertEqual(names(38).join(','), 'Kaplan,Crossflow,Francis', '38 m');
      assertEqual(names(100).join(','), 'Crossflow,Francis,Turgo,Pelton', '100 m');
      assertEqual(names(500).join(','), 'Pelton', '500 m');
      assertEqual(names(1.5).length, 0, 'below 2 m');
    },
  },
  {
    name: 'Fitting losses add K v²/2g: K = 2 at 1.59 m/s adds 0.258 m; a loss above a third of the gross head warns',
    source: 'Minor loss definition; maximum of Q (H_g − c Q²) at h_f = H_g/3',
    run: () => {
      const o = calculate({ minor_k: 2 }).outputs;
      assertClose(o.minor_loss_m, 2 * 1.5915494 ** 2 / (2 * 9.80665), { rel: 1e-6 }, 'K v²/2g');
      assertClose(o.net_head_m, 40 - o.friction_loss_m - o.minor_loss_m, { rel: 1e-12 }, 'net');
      assertEqual(calculate({ loss_mode: 'pct', loss_frac: 0.4 }).warnings.some((w) => w.includes('third')), true, 'warning');
    },
  },
  {
    name: 'Losses that use up the gross head, a zero flow and an efficiency above 95 % are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ flow_m3s: 1, diameter_m: 0.1 }), 'whole gross head');
      assertThrows(() => calculate({ flow_m3s: 0 }), 'Design flow');
      assertThrows(() => calculate({ efficiency: 0.99 }), 'Overall efficiency');
    },
  },
];
