/**
 * initial-stability/tests.js — checks against the Derrett formulas and the IMO IS Code rolling-period relation.
 * Run: node run-tests.js initial-stability
 */
import { calculate, freeSurfaceMomentTM, listAngleDeg, rollingPeriodS, IMO_MIN_GM_M } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const BASE = { displacement_t: 47232, km_m: 12.5, kg_solid_m: 11.0, fsm_basis: 'given', fsm_given_t_m: 1500, operation: 'none', beam_m: 32, length_wl_m: 180, draft_m: 10 };

export const tests = [
  {
    name: 'GM = KM − KG = 1.500 m; FSC = 1 500 / 47 232 = 0.0318 m; fluid GM 1.468 m',
    source: 'Derrett & Barrass, Ship Stability for Masters and Mates, 7th ed., ch. 5 and ch. 21 (free surface correction = FSM / Δ)',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.gm_solid_m, 1.5, { rel: 1e-12 }, 'solid GM');
      assertClose(outputs.fsc_initial_m, 1500 / 47232, { rel: 1e-12 }, 'FSC');
      assertClose(outputs.gm_fluid_initial_m, 1.5 - 1500 / 47232, { rel: 1e-12 }, 'fluid GM');
      assertClose(outputs.gm_fluid_final_m, outputs.gm_fluid_initial_m, { rel: 1e-12 }, 'no operation');
      assertEqual(outputs.list_text, 'Upright', 'upright');
    },
  },
  {
    name: 'Free surface moment of a 20 × 10 m fresh-water tank = l b³/12 × ρ = 1 666.7 t·m; two equal compartments reduce it to a quarter (416.7 t·m)',
    source: 'Derrett & Barrass ch. 21: i = l b³/12, FSM = i × ρ, subdivision into n equal parts divides the moment by n²',
    run: () => {
      assertClose(freeSurfaceMomentTM(20, 10, 1.0, 1), 1666.667, { abs: 1e-3 }, 'single tank');
      assertClose(freeSurfaceMomentTM(20, 10, 1.0, 2), 416.667, { abs: 1e-3 }, 'two compartments');
      assertClose(freeSurfaceMomentTM(20, 10, 1.025, 1), 1708.333, { abs: 1e-3 }, 'sea water');
      const { outputs } = calculate({ ...BASE, fsm_basis: 'tank', tank_length_m: 20, tank_breadth_m: 10, tank_density_t_m3: 1.0, tank_divisions: 1 });
      assertClose(outputs.fsm_t_m, 1666.667, { abs: 1e-3 }, 'in calculate()');
    },
  },
  {
    name: 'List from shifting 200 t by 10 m to starboard: tan θ = 2 000 / (47 232 × 1.468) → 1.65° to starboard',
    source: 'Derrett & Barrass ch. 17 "List": tan θ = w d / (W × GM)',
    run: () => {
      const gmFluid = 1.5 - 1500 / 47232;
      assertClose(listAngleDeg(2000, 47232, gmFluid), 1.652, { abs: 2e-3 }, 'helper');
      const { outputs } = calculate({ ...BASE, operation: 'shift', weight_t: 200, transverse_m: 10, vertical_shift_m: 0 });
      assertClose(outputs.heeling_moment_t_m, 2000, { rel: 1e-12 }, 'heeling moment');
      assertClose(outputs.list_deg, 1.652, { abs: 2e-3 }, 'list');
      assertEqual(outputs.list_text.endsWith('to starboard'), true, 'direction');
      const port = calculate({ ...BASE, operation: 'shift', weight_t: 200, transverse_m: -10 }).outputs;
      assertEqual(port.list_text.endsWith('to port'), true, 'port when shifted to port');
    },
  },
  {
    name: 'Loading 500 t at Kg 15 m, 8 m to starboard: Δ 47 732 t, KG 11.042 m, fluid GM 1.427 m, list 3.36°; discharging the same weight lists to port',
    source: 'Derrett & Barrass ch. 7 (final KG by moments about the keel) and ch. 17',
    run: () => {
      const load = calculate({ ...BASE, operation: 'load', weight_t: 500, weight_kg_m: 15, transverse_m: 8 }).outputs;
      assertClose(load.displacement_final_t, 47732, { rel: 1e-12 }, 'Δ');
      assertClose(load.kg_final_m, (47232 * 11 + 500 * 15) / 47732, { rel: 1e-12 }, 'KG');
      assertClose(load.kg_final_m, 11.0419, { abs: 1e-4 }, 'KG value');
      assertClose(load.gm_fluid_final_m, 12.5 - load.kg_final_m - 1500 / 47732, { rel: 1e-12 }, 'GM');
      assertClose(load.list_deg, 3.362, { abs: 3e-3 }, 'list');
      const discharge = calculate({ ...BASE, operation: 'discharge', weight_t: 500, weight_kg_m: 15, transverse_m: 8 }).outputs;
      assertClose(discharge.displacement_final_t, 46732, { rel: 1e-12 }, 'Δ discharge');
      assertEqual(discharge.list_deg < 0, true, 'lists to port');
      assertClose(discharge.kg_final_m, (47232 * 11 - 500 * 15) / 46732, { rel: 1e-12 }, 'KG discharge');
    },
  },
  {
    name: 'Vertical shift of 200 t by 5 m upwards raises KG by w d / Δ = 0.0212 m',
    source: 'Derrett & Barrass ch. 7: GG₁ = w × d / W',
    run: () => {
      const { outputs } = calculate({ ...BASE, operation: 'shift', weight_t: 200, transverse_m: 0, vertical_shift_m: 5 });
      assertClose(outputs.kg_final_m, 11 + 1000 / 47232, { rel: 1e-12 }, 'KG');
      assertClose(outputs.list_deg, 0, { abs: 1e-12 }, 'no list');
    },
  },
  {
    name: 'Rolling period: C = 0.373 + 0.023 × 3.2 − 0.043 × 1.8 = 0.369; T = 2 × 0.369 × 32 / √1.468 = 19.5 s',
    source: 'IMO 2008 IS Code (MSC.267(85)) Part A 2.3.4: T = 2 C B / √GM, C = 0.373 + 0.023 (B/d) − 0.043 (L_wl/100)',
    run: () => {
      const roll = rollingPeriodS(32, 10, 180, 1.5 - 1500 / 47232);
      assertClose(roll.c, 0.3692, { abs: 1e-4 }, 'C');
      assertClose(roll.periodS, 19.50, { abs: 0.02 }, 'T');
      const { outputs } = calculate(BASE);
      assertClose(outputs.roll_period_s, 19.50, { abs: 0.02 }, 'in calculate()');
      assertEqual(outputs.stiffness.startsWith('Moderate'), true, 'classification');
      const stiff = calculate({ ...BASE, kg_solid_m: 6 }).outputs;
      assertEqual(stiff.stiffness.startsWith('Stiff'), true, 'stiff with GM 6.5 m');
    },
  },
  {
    name: 'IMO check: fluid GM 0.12 m fails the 0.15 m minimum and raises a warning; 1.47 m passes',
    source: 'IMO 2008 IS Code Part A 2.2.4',
    run: () => {
      assertEqual(IMO_MIN_GM_M, 0.15, 'constant');
      assertEqual(calculate(BASE).outputs.imo_check.startsWith('OK'), true, 'passes');
      const low = calculate({ ...BASE, kg_solid_m: 12.35 });
      assertEqual(low.outputs.imo_check.startsWith('FAIL'), true, 'fails');
      assertEqual(low.warnings.some((w) => w.includes('below the IMO')), true, 'warning');
    },
  },
  {
    name: 'Large list (> 10°) and negative GM are handled: 2 000 t shifted 10 m gives 15.3° with a warning; KG above KM throws',
    source: 'Small-angle validity of the GM method (Derrett ch. 17); angle of loll when GM < 0 (ch. 6)',
    run: () => {
      const big = calculate({ ...BASE, operation: 'shift', weight_t: 2000, transverse_m: 10 });
      assertClose(big.outputs.list_deg, (Math.atan(20000 / (47232 * (1.5 - 1500 / 47232))) * 180) / Math.PI, { rel: 1e-12 }, 'angle');
      assertEqual(big.warnings.some((w) => w.includes('exceeds 10°')), true, 'warning');
      assertThrows(() => calculate({ ...BASE, kg_solid_m: 12.6 }), 'would loll', 'negative GM');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero displacement, discharging more than the displacement, fractional subdivisions',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BASE, displacement_t: 0 }), 'greater than zero', 'displacement');
      assertThrows(() => calculate({ ...BASE, operation: 'discharge', weight_t: 50000, weight_kg_m: 10 }), 'less than the displacement', 'discharge');
      assertThrows(() => calculate({ ...BASE, fsm_basis: 'tank', tank_divisions: 1.5 }), 'whole number', 'divisions');
    },
  },
];
