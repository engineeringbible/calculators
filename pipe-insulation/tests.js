/**
 * pipe-insulation/tests.js — analytical checks of the thermal resistance network (Incropera §3.3, Çengel ch. 3).
 * Run: node run-tests.js pipe-insulation
 */
import { calculate, cylinderResistance } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PIPE = { geometry: 'pipe', pipe_od_m: 0.1143, wall_m: 0.006, k_wall: 50, ins1_m: 0.05, k1: 0.04, ins2_m: 0, k2: 0.03, t_inside_c: 150, h_inside: 1000, t_ambient_c: 25, h_outside: 10, length_m: 10, hours_per_year: 6000 };

export const tests = [
  {
    name: '4-inch pipe, 6 mm wall, 50 mm mineral wool, 150 °C inside, 25 °C ambient, h_i 1000, h_o 10: R = 0.00311 + 0.00035 + 2.501 + 0.1485 = 2.653 K·m/W → 47.1 W/m, 471 W for 10 m',
    source: 'Incropera & DeWitt §3.3.1 radial systems: R_cyl = ln(r₂/r₁)/(2πkL), R_film = 1/(h 2πrL)',
    run: () => {
      const { outputs } = calculate(PIPE);
      const r1 = 0.05115;
      const r2 = 0.05715;
      const r3 = 0.10715;
      assertClose(outputs.r_inside, 1 / (1000 * 2 * Math.PI * r1), { rel: 1e-12 }, 'R_i');
      assertClose(outputs.r_wall, Math.log(r2 / r1) / (2 * Math.PI * 50), { rel: 1e-12 }, 'R_wall');
      assertClose(outputs.r_ins1, Math.log(r3 / r2) / (2 * Math.PI * 0.04), { rel: 1e-12 }, 'R_ins');
      assertClose(outputs.r_ins1, 2.501, { abs: 2e-3 }, 'R_ins value');
      assertClose(outputs.r_outside, 1 / (10 * 2 * Math.PI * r3), { rel: 1e-12 }, 'R_o');
      assertClose(outputs.r_total, 2.653, { abs: 2e-3 }, 'R total');
      assertClose(outputs.q_per_unit, 125 / outputs.r_total, { rel: 1e-12 }, 'q = ΔT/R');
      assertClose(outputs.q_per_unit, 47.1, { abs: 0.1 }, 'W/m');
      assertClose(outputs.q_total_w, outputs.q_per_unit * 10, { rel: 1e-12 }, 'total');
      assertEqual(outputs.r_ins2, 0, 'no layer 2');
      assertClose(cylinderResistance(r2, r3, 0.04), outputs.r_ins1, { rel: 1e-12 }, 'helper');
    },
  },
  {
    name: 'Surface and interface temperatures: cladding 25 + 47.1 × 0.1485 = 32.0 °C (OK ≤ 60 °C); steel/insulation interface 150 − 47.1 × 0.00346 = 149.8 °C',
    source: 'Temperature drop proportional to resistance in a series network',
    run: () => {
      const { outputs } = calculate(PIPE);
      assertClose(outputs.surface_temp_c, 25 + outputs.q_per_unit * outputs.r_outside, { rel: 1e-12 }, 'surface');
      assertClose(outputs.surface_temp_c, 32.0, { abs: 0.1 }, 'value');
      assertClose(outputs.interface_temp_c, 150 - outputs.q_per_unit * (outputs.r_inside + outputs.r_wall), { rel: 1e-12 }, 'interface');
      assertEqual(outputs.surface_check.startsWith('OK'), true, 'personnel OK');
      const thin = calculate({ ...PIPE, ins1_m: 0.005, t_inside_c: 300 }).outputs;
      assertEqual(thin.surface_check.startsWith('HOT'), true, 'hot cladding flagged');
    },
  },
  {
    name: 'Bare pipe with the same coefficients: R = 0.00311 + 0.00035 + 0.2785 = 0.282 K·m/W → 443 W/m; the 50 mm insulation saves 89 %; critical radius k/h_o = 4 mm',
    source: 'Incropera Example 3.6 / §3.3.2 critical insulation radius r_cr = k/h',
    run: () => {
      const { outputs } = calculate(PIPE);
      assertClose(outputs.q_bare_per_unit, 125 / (outputs.r_inside + outputs.r_wall + 1 / (10 * 2 * Math.PI * 0.05715)), { rel: 1e-12 }, 'bare');
      assertClose(outputs.q_bare_per_unit, 443, { abs: 1 }, 'bare value');
      assertClose(outputs.saving_pct, (1 - outputs.q_per_unit / outputs.q_bare_per_unit) * 100, { rel: 1e-12 }, 'saving');
      assertClose(outputs.saving_pct, 89.4, { abs: 0.2 }, 'saving value');
      assertClose(outputs.critical_radius_m, 0.004, { rel: 1e-12 }, 'r_cr');
      assertClose(outputs.outer_diameter_m, 0.2143, { rel: 1e-12 }, 'OD over insulation');
    },
  },
  {
    name: 'Two layers: adding 25 mm of k 0.03 outside the mineral wool adds ln(132.15/107.15)/(2π·0.03) = 1.113 K·m/W (the outside film falls to 0.120) and cuts the loss to 33.4 W/m',
    source: 'Series resistances of concentric cylinders',
    run: () => {
      const { outputs } = calculate({ ...PIPE, ins2_m: 0.025 });
      assertClose(outputs.r_ins2, Math.log(0.13215 / 0.10715) / (2 * Math.PI * 0.03), { rel: 1e-12 }, 'R_2');
      assertClose(outputs.r_ins2, 1.113, { abs: 2e-3 }, 'R_2 value');
      assertClose(outputs.r_outside, 1 / (10 * 2 * Math.PI * 0.13215), { rel: 1e-12 }, 'R_o with the larger radius');
      assertClose(outputs.q_per_unit, 33.4, { abs: 0.1 }, 'q');
    },
  },
  {
    name: 'Flat wall (tank side): 6 mm steel + 100 mm of k 0.04 with h_i 1000 and h_o 10 at ΔT 125 K → R = 0.001 + 0.00012 + 2.5 + 0.1 = 2.601 K·m²/W → 48.0 W/m², 4.8 kW for 100 m², 28.8 MWh/year at 6 000 h',
    source: 'Çengel ch. 3 plane-wall resistance network R = L/(kA) + 1/(hA)',
    run: () => {
      const { outputs } = calculate({ ...PIPE, geometry: 'flat', ins1_m: 0.1, length_m: 100 });
      assertClose(outputs.r_total, 1 / 1000 + 0.006 / 50 + 0.1 / 0.04 + 1 / 10, { rel: 1e-12 }, 'R');
      assertClose(outputs.q_per_unit, 125 / 2.60112, { rel: 1e-4 }, 'q per m²');
      assertClose(outputs.q_per_unit, 48.06, { abs: 0.05 }, 'value');
      assertClose(outputs.q_total_w, outputs.q_per_unit * 100, { rel: 1e-12 }, 'total');
      assertClose(outputs.annual_energy_wh, outputs.q_total_w * 6000, { rel: 1e-12 }, 'annual');
      assertClose(outputs.annual_energy_wh / 1e6, 28.8, { abs: 0.1 }, 'MWh');
      assertEqual(outputs.critical_radius_m, null, 'no critical radius for flat');
    },
  },
  {
    name: 'Critical radius effect: a 10 mm cable (k_ins 0.15, h_o 10 → r_cr 15 mm) loses MORE heat with 3 mm of insulation than bare, and the page warns',
    source: 'Incropera §3.3.2: for r < r_cr adding insulation increases the heat loss',
    run: () => {
      const bare = calculate({ ...PIPE, pipe_od_m: 0.01, wall_m: 0, ins1_m: 0, k1: 0.15, h_inside: 10000 }).outputs;
      const insulated = calculate({ ...PIPE, pipe_od_m: 0.01, wall_m: 0, ins1_m: 0.003, k1: 0.15, h_inside: 10000 });
      assertEqual(insulated.outputs.q_per_unit > bare.q_per_unit, true, 'loss increases');
      assertEqual(insulated.warnings.some((w) => w.includes('INCREASES')), true, 'warning');
      assertClose(insulated.outputs.critical_radius_m, 0.015, { rel: 1e-12 }, 'r_cr');
    },
  },
  {
    name: 'Cold service: −20 °C brine pipe in 25 °C air gives a negative loss (heat gain) and a cold-surface condensation remark; invalid inputs fail fast (equal temperatures, wall thicker than the radius)',
    source: 'Sign convention and validation contract',
    run: () => {
      const cold = calculate({ ...PIPE, t_inside_c: -20 }).outputs;
      assertEqual(cold.q_per_unit < 0, true, 'heat gain');
      assertEqual(cold.surface_check.startsWith('Cold surface'), true, 'condensation remark');
      assertThrows(() => calculate({ ...PIPE, t_inside_c: 25 }), 'no heat flow', 'ΔT = 0');
      assertThrows(() => calculate({ ...PIPE, wall_m: 0.06 }), 'less than the pipe radius', 'wall');
    },
  },
];
