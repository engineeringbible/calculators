/**
 * water-heating-time/tests.js — checks against the US recovery-rate rule (kW × 3 412 / (8.34 × ΔT)), the energy
 * balance m c ΔT / P and the exponential solution with standing loss.
 * Run: node run-tests.js water-heating-time
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const GAL = 0.003785411784;
const F = (f) => (f - 32) / 1.8;

export const tests = [
  {
    name: 'Recovery at 90 °F rise: 4.5 kW element 20.5 gal/h; 40 000 Btu/h gas at 76 % 40.5 gal/h',
    source: 'Water heater recovery rule gph = Btu/h × η / (8.34 lb/gal × 1 Btu/(lb·°F) × ΔT) (ASHRAE HVAC Applications, Service Water Heating); hand calculation',
    run: () => {
      const e = calculate({ heater: 'electric', power_w: 4500, eff_electric: 1, rise_k: 50 }).outputs;
      assertClose(e.recovery_gph, (4500 * 3.412142) / (8.337 * 90), { rel: 0.001 }, 'electric gph');
      assertClose(e.recovery_gph, 20.5, { abs: 0.05 }, 'electric 20.5');
      const g = calculate({ heater: 'gas', power_w: 40000 * 0.29307107017, eff_gas: 0.76, rise_k: 50 }).outputs;
      assertClose(g.recovery_gph, 40.5, { abs: 0.05 }, 'gas 40.5');
      assertClose(g.recovery_lph, g.recovery_gph * GAL * 1000, { rel: 1e-12 }, 'L/h');
    },
  },
  {
    name: 'No standing loss: 50 US gal from 50 to 120 °F with 4.5 kW takes m c ΔT / P = 30.78 MJ / 4.5 kW = 114.0 min',
    source: 'Q = m c ΔT; t = Q / P (hand calculation)',
    run: () => {
      const o = calculate({ volume_m3: 50 * GAL, t_start_c: F(50), t_target_c: F(120), power_w: 4500, eff_electric: 1, ua_w_k: 0 }).outputs;
      const q = 999 * 50 * GAL * 4186 * (70 / 1.8);
      assertClose(o.heat_water_j, q, { rel: 1e-12 }, 'heat');
      assertClose(o.time_s, q / 4500, { rel: 1e-12 }, 'time');
      assertClose(o.time_s / 60, 114.0, { abs: 0.05 }, 'minutes');
      assertEqual(o.loss_j, 0, 'no loss');
      assertEqual(o.t_max_c, null, 'no limit');
    },
  },
  {
    name: 'With UA the exponential solution matches a step-by-step integration of m c dT/dt = P − UA (T − T_room)',
    source: 'Lumped energy balance (Incropera Section 5.3) integrated numerically with 1 s steps',
    run: () => {
      const inp = { volume_m3: 0.2, t_start_c: 15, t_target_c: 60, t_room_c: 20, power_w: 3000, eff_electric: 1, ua_w_k: 20 };
      const o = calculate(inp).outputs;
      const mc = 999 * 0.2 * 4186;
      let t = 15; let s = 0;
      while (t < 60) { t += (3000 - 20 * (t - 20)) / mc; s += 1; }
      assertClose(o.time_s, s, { abs: 2 }, 'time');
      assertEqual(o.t_max_c, null, 'T_eq = 170 °C is above boiling, not shown');
      assertClose(o.tau_s, mc / 20, { rel: 1e-12 }, 'time constant');
      assertClose(o.loss_j, 3000 * o.time_s - mc * 45, { rel: 1e-9 }, 'loss');
    },
  },
  {
    name: 'A heat pump with COP 3 heats three times as fast and draws a third of the energy of the same electrical input as an element',
    source: 'P_heat = COP × P_electric (hand calculation)',
    run: () => {
      const base = { power_w: 1500, ua_w_k: 0, volume_m3: 0.2 };
      const el = calculate({ ...base, heater: 'electric', eff_electric: 1 }).outputs;
      const hp = calculate({ ...base, heater: 'heatpump', cop: 3 }).outputs;
      assertClose(hp.time_s, el.time_s / 3, { rel: 1e-12 }, 'time');
      assertClose(hp.input_j, el.input_j / 3, { rel: 1e-12 }, 'energy');
      assertClose(el.cost, (el.input_j / 3.6e6) * 0.15, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'A target above T_room + P/UA is never reached (null time and a warning); a target below the start is rejected',
    source: 'Validation contract; equilibrium of the energy balance',
    run: () => {
      const r = calculate({ power_w: 100, ua_w_k: 5, t_room_c: 20, t_target_c: 45 });
      assertEqual(r.outputs.time_s, null, 'never');
      assertEqual(r.warnings.length, 1, 'warning');
      assertClose(r.outputs.t_max_c, 40, { rel: 1e-12 }, 'limit');
      assertThrows(() => calculate({ t_start_c: 50, t_target_c: 40 }), 'Target temperature');
      assertThrows(() => calculate({ volume_m3: 0 }), 'Tank volume');
    },
  },
];
