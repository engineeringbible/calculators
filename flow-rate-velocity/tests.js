/**
 * flow-rate-velocity/tests.js — checks against the continuity equation Q = V A.
 * Run: node run-tests.js flow-rate-velocity
 */
import { calculate, area } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '50 m³/h in a 100 mm bore: A = 78.54 cm², V = 1.768 m/s, within the 1–3 m/s water range',
    source: 'White, Fluid Mechanics, ch. 3: Q = V A; Crane TP-410 reasonable velocities',
    run: () => {
      const { outputs } = calculate({ solve_for: 'velocity', flow_m3_s: 50 / 3600, diameter_m: 0.1, service: 'water' });
      assertClose(outputs.area_m2, 0.0078540, { abs: 1e-7 }, 'A');
      assertClose(outputs.velocity_out_m_s, 1.76839, { abs: 1e-5 }, 'V');
      assertEqual(outputs.check.startsWith('Within'), true, 'check');
    },
  },
  {
    name: 'Bore for 50 m³/h at 2 m/s: D = √(4Q/πV) = 94.03 mm; 2 m/s in that bore gives back 50 m³/h',
    source: 'Continuity solved for D',
    run: () => {
      const d = calculate({ solve_for: 'diameter', flow_m3_s: 50 / 3600, velocity_m_s: 2, service: 'none' }).outputs.diameter_out_m;
      assertClose(d, 0.094031, { abs: 1e-6 }, 'D');
      const q = calculate({ solve_for: 'flow', velocity_m_s: 2, diameter_m: d, service: 'none' }).outputs.flow_out_m3_s;
      assertClose(q * 3600, 50, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: '1 m/s in a 50 mm bore carries 1.963 L/s (7.07 m³/h); halving the bore at the same flow quadruples the velocity',
    source: 'A = π D² / 4; V ∝ 1/D² at constant Q',
    run: () => {
      const { outputs } = calculate({ solve_for: 'flow', velocity_m_s: 1, diameter_m: 0.05, service: 'none' });
      assertClose(outputs.flow_l_s * 1000, 1.9635, { abs: 1e-4 }, 'L/s');
      assertClose(area(0.1) / area(0.05), 4, { rel: 1e-12 }, 'area ratio');
    },
  },
  {
    name: 'Pump suction at 2 m/s is flagged above 0.6–1.5 m/s with a warning; oil at 0.3 m/s is flagged below its range',
    source: 'Crane TP-410 and common practice for suction and oil lines',
    run: () => {
      const fast = calculate({ solve_for: 'velocity', flow_m3_s: 2 * area(0.1), diameter_m: 0.1, service: 'suction' });
      assertEqual(fast.outputs.check.startsWith('Above'), true, 'suction above');
      assertEqual(fast.warnings.length, 1, 'warning');
      const slow = calculate({ solve_for: 'velocity', flow_m3_s: 0.3 * area(0.1), diameter_m: 0.1, service: 'oil' });
      assertEqual(slow.outputs.check.startsWith('Below'), true, 'oil below');
    },
  },
  {
    name: 'Zero flow, zero bore and an unknown mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ solve_for: 'velocity', flow_m3_s: 0 }), 'Flow rate must be greater than zero');
      assertThrows(() => calculate({ solve_for: 'flow', diameter_m: 0 }), 'Inside diameter must be greater than zero');
      assertThrows(() => calculate({ solve_for: 'pressure' }), 'Find');
    },
  },
];
