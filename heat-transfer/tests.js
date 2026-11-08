/**
 * heat-transfer/tests.js — checks against Fourier, Newton and Stefan–Boltzmann by hand.
 * Run: node run-tests.js heat-transfer
 */
import { calculate, SIGMA } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Conduction: 200 mm brick (0.72 W/m·K), 10 m², 20 K: Q = 0.72 × 10 × 20 / 0.2 = 720 W, 72 W/m², R = 0.0278 K/W',
    source: 'Fourier\'s law, Incropera eq. 1.2; k_brick = 0.72 W/(m·K) (Table A.3)',
    run: () => {
      const o = calculate({ mode: 'conduction', area_m2: 10, material: 'brick', thickness_m: 0.2, t_hot_c: 20, t_cold_c: 0 }).outputs;
      assertClose(o.q_w, 720, { rel: 1e-12 }, 'Q');
      assertClose(o.flux_w_m2, 72, { rel: 1e-12 }, 'flux');
      assertClose(o.r_k_w, 20 / 720, { rel: 1e-12 }, 'R');
    },
  },
  {
    name: 'Convection: h = 25 W/(m²·K), 2 m², surface 80 °C in 20 °C air: 3 000 W',
    source: 'Newton\'s law of cooling, Incropera eq. 1.3a',
    run: () => {
      assertClose(calculate({ mode: 'convection', area_m2: 2, h: 25, t_hot_c: 80, t_cold_c: 20 }).outputs.q_w, 3000, { rel: 1e-12 }, 'Q');
    },
  },
  {
    name: 'Radiation: a black surface at 100 °C to 20 °C surroundings emits σ (373.15⁴ − 293.15⁴) = 680.6 W/m² net; ε = 0.9 gives 612.5 W/m²',
    source: 'Stefan–Boltzmann, Incropera eq. 1.7; σ = 5.670374419e−8 (CODATA 2018)',
    run: () => {
      const black = calculate({ mode: 'radiation', area_m2: 1, emissivity: 1, t_hot_c: 100, t_cold_c: 20 }).outputs.q_w;
      assertClose(black, SIGMA * (373.15 ** 4 - 293.15 ** 4), { rel: 1e-12 }, 'black');
      assertClose(black, 680.6, { abs: 0.1 }, 'value');
      assertClose(calculate({ mode: 'radiation', area_m2: 1, emissivity: 0.9, t_hot_c: 100, t_cold_c: 20 }).outputs.q_w, 0.9 * black, { rel: 1e-12 }, 'grey');
    },
  },
  {
    name: 'Insulation: 100 mm extruded polystyrene (0.027) lets through 1/26.7 of what 200 mm brick does for the same ΔT and area',
    source: 'Q ∝ k / L',
    run: () => {
      const brick = calculate({ material: 'brick', thickness_m: 0.2 }).outputs.q_w;
      const xps = calculate({ material: 'xps', thickness_m: 0.1 }).outputs.q_w;
      assertClose(brick / xps, (0.72 / 0.2) / (0.027 / 0.1), { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'Equal temperatures and zero thickness are rejected; heat flows backwards with a negative sign when the cold side is warmer',
    source: 'Validation contract; sign convention',
    run: () => {
      assertThrows(() => calculate({ t_hot_c: 10, t_cold_c: 10 }), 'must differ');
      assertThrows(() => calculate({ thickness_m: 0 }), 'Wall thickness must be greater than zero');
      assertClose(calculate({ t_hot_c: 0, t_cold_c: 20 }).outputs.q_w, -720, { rel: 1e-12 }, 'reverse');
    },
  },
];
