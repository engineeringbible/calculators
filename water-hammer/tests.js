/**
 * water-hammer/tests.js — checks of the Korteweg wave speed, Joukowsky and Michaud surges and the classification.
 * Run: node run-tests.js water-hammer
 */
import { calculate, waveSpeed, MATERIALS, FLUIDS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LINE = { diameter_mm: 300, wall_mm: 8, material: 'steel', restraint: 'expansion_joints', fluid: 'fresh_water', velocity_change_m_s: 2, length_m: 200, closure_time_s: 1, steady_pressure_bar: 5, pipe_rating_bar: 16 };

export const tests = [
  {
    name: 'Wave speed: water √(2.19e9/998) = 1 481 m/s; 300 mm steel pipe with 8 mm wall → 1 481/√(1 + (2.19/207) × 37.5) = 1 254 m/s; rigid pipe gives the liquid value; HDPE (0.9 GPa) gives 154 m/s with the same 8 mm wall and 281 m/s as SDR 11 (27.3 mm wall)',
    source: 'Korteweg formula (Wylie & Streeter eq. 1-24); textbook 1 200–1 300 m/s for water in steel',
    run: () => {
      const { outputs } = calculate(LINE);
      assertClose(outputs.wave_speed_fluid_m_s, Math.sqrt(2.19e9 / 998), { rel: 1e-12 }, 'a₀');
      assertClose(outputs.wave_speed_fluid_m_s, 1481, { abs: 1 }, 'a₀ value');
      assertClose(outputs.wave_speed_m_s, Math.sqrt(2.19e9 / 998) / Math.sqrt(1 + (2.19 / 207) * 37.5), { rel: 1e-12 }, 'Korteweg');
      assertClose(outputs.wave_speed_m_s, 1254, { abs: 1 }, 'a value');
      assertClose(calculate({ ...LINE, material: 'rigid' }).outputs.wave_speed_m_s, outputs.wave_speed_fluid_m_s, { rel: 1e-12 }, 'rigid');
      assertClose(calculate({ ...LINE, material: 'hdpe' }).outputs.wave_speed_m_s, 154.2, { abs: 0.2 }, 'HDPE same wall');
      assertClose(calculate({ ...LINE, material: 'hdpe', wall_mm: 300 / 11 }).outputs.wave_speed_m_s, 281.1, { abs: 0.2 }, 'HDPE SDR 11');
      assertClose(waveSpeed(998, 2.19e9, 207e9, 0.3, 0.008, 0.91), outputs.wave_speed_m_s * Math.sqrt((1 + (2.19 / 207) * 37.5) / (1 + (2.19 / 207) * 37.5 * 0.91)), { rel: 1e-12 }, 'restraint factor');
    },
  },
  {
    name: 'Joukowsky: ρ a Δv = 998 × 1 254 × 2 = 25.0 bar; proportional to Δv (1 m/s → 12.5 bar); sea water (ρ 1 025, K 2.34) gives a slightly higher surge',
    source: 'Joukowsky (1898) Δp = ρ a Δv',
    run: () => {
      const { outputs } = calculate(LINE);
      assertClose(outputs.joukowsky_pa, 998 * outputs.wave_speed_m_s * 2, { rel: 1e-12 }, 'formula');
      assertClose(outputs.joukowsky_pa / 1e5, 25.0, { abs: 0.05 }, 'value');
      assertClose(calculate({ ...LINE, velocity_change_m_s: 1 }).outputs.joukowsky_pa, outputs.joukowsky_pa / 2, { rel: 1e-12 }, 'linear in Δv');
      assertEqual(calculate({ ...LINE, fluid: 'sea_water' }).outputs.joukowsky_pa > outputs.joukowsky_pa, true, 'sea water');
      assertEqual(FLUIDS.sea_water.kGpa === 2.34 && MATERIALS.steel.eGpa === 207, true, 'properties');
    },
  },
  {
    name: 'Critical time and classification: 2L/a = 400/1 254 = 0.319 s; a 1 s closure is SLOW → Michaud 2 × 998 × 200 × 2/1 = 7.98 bar; a 0.2 s closure is RAPID → full 25.0 bar; period 4L/a = 0.638 s',
    source: 'Critical time 2L/a (Chaudhry ch. 2); Michaud slow-closure estimate',
    run: () => {
      const slow = calculate(LINE).outputs;
      assertClose(slow.critical_time_s, 400 / slow.wave_speed_m_s, { rel: 1e-12 }, '2L/a');
      assertClose(slow.critical_time_s, 0.319, { abs: 1e-3 }, 'value');
      assertEqual(slow.closure_class.startsWith('SLOW'), true, 'slow');
      assertClose(slow.michaud_pa, 2 * 998 * 200 * 2 / 1, { rel: 1e-12 }, 'Michaud');
      assertClose(slow.design_surge_pa, slow.michaud_pa, { rel: 1e-12 }, 'design = Michaud');
      assertClose(slow.period_s, 2 * slow.critical_time_s, { rel: 1e-12 }, 'period');
      const fast = calculate({ ...LINE, closure_time_s: 0.2 }).outputs;
      assertEqual(fast.closure_class.startsWith('RAPID'), true, 'rapid');
      assertClose(fast.design_surge_pa, fast.joukowsky_pa, { rel: 1e-12 }, 'design = Joukowsky');
      const veryShort = calculate({ ...LINE, length_m: 20, closure_time_s: 1 }).outputs;
      assertEqual(veryShort.design_surge_pa <= veryShort.joukowsky_pa, true, 'Michaud capped at Joukowsky');
    },
  },
  {
    name: 'Line pressures and rating: 5 + 7.98 = 12.98 bar ≤ PN16 OK (81 %); rapid closure gives 30.0 bar → EXCEEDED and a negative minimum (−20 bar) → column separation warning; closure time for a 10 % surge = 2 ρ L Δv/(0.1 × 16 bar) = 4.99 s',
    source: 'Pressure envelope; column separation criterion (Chaudhry ch. 9)',
    run: () => {
      const slow = calculate(LINE);
      assertClose(slow.outputs.max_pressure_pa / 1e5, 12.98, { abs: 0.01 }, 'max');
      assertEqual(slow.outputs.rating_check.startsWith('OK'), true, 'OK');
      assertClose(slow.outputs.safe_closure_time_s, (2 * 998 * 200 * 2) / (0.1 * 16e5), { rel: 1e-12 }, 'safe time');
      assertClose(slow.outputs.safe_closure_time_s, 4.99, { abs: 0.01 }, 'safe time value');
      const fast = calculate({ ...LINE, closure_time_s: 0.2 });
      assertEqual(fast.outputs.rating_check.startsWith('EXCEEDED'), true, 'exceeded');
      assertEqual(fast.outputs.min_pressure_pa < 0 && fast.warnings.some((w) => w.includes('column separation')), true, 'separation');
    },
  },
  {
    name: 'Validation: zero closure time, zero diameter and an unknown material are rejected; thick-walled pipe (D/e < 25) is flagged',
    source: 'Validation contract; thin-wall validity',
    run: () => {
      assertThrows(() => calculate({ ...LINE, closure_time_s: 0 }), 'greater than zero', 'closure');
      assertThrows(() => calculate({ ...LINE, diameter_mm: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ ...LINE, material: 'lead' }), 'must be one of', 'material');
      assertEqual(calculate({ ...LINE, wall_mm: 20 }).warnings.some((w) => w.includes('D/e below 25')), true, 'thick wall');
    },
  },
];
