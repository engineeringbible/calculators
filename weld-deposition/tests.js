/**
 * weld-deposition/tests.js — checks against the Kobe Steel consumption formula and hand calculations of weld areas.
 * Run: node run-tests.js weld-deposition
 */
import { calculate, weldArea, EFFICIENCY } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const LB = 0.45359237;
const V10 = { joint: 'single_v', thickness_m: 0.01, angle_deg: 60, gap_m: 0.002, face_m: 0.002, reinforcement: 0.1, length_m: 1, process: 'gmaw', wire_d_m: 0.0012, rate_kg_s: 3 / 3600 };

export const tests = [
  {
    name: 'Single V, 10 mm, 60°, gap 2, face 2: 20 + 64 tan 30° = 56.95 mm²; +10 % = 62.65 mm²; 0.4918 kg per metre; GMAW 95 % needs 0.5176 kg',
    source: 'Kobe Steel ABC\'s of Arc Welding: C = (A1 + A2) × L × G / E / 10 (A in mm², L in m, G = 7.85 g/cm³, E in %)',
    run: () => {
      const o = calculate(V10).outputs;
      assertClose(o.area_m2 * 1e6, 62.645, { abs: 0.001 }, 'area');
      assertClose(o.weld_kg, 0.49177, { abs: 0.00001 }, 'deposit');
      assertClose(o.filler_kg, (62.645459 * 1 * 7.85) / 95 / 10, { rel: 1e-6 }, 'Kobelco C');
    },
  },
  {
    name: 'Wire and arc time: 0.5176 kg of 1.2 mm wire (8.878 g/m) is 58.3 m; 0.4918 kg at 3 kg/h is 9.84 min of arc',
    source: 'Wire mass per length ρ π d²/4; arc time = deposit / deposition rate (hand calculation)',
    run: () => {
      const o = calculate(V10).outputs;
      assertClose(o.wire_m, 58.306, { abs: 0.001 }, 'wire');
      assertClose(o.arc_s / 60, 9.8353, { abs: 0.0001 }, 'arc minutes');
    },
  },
  {
    name: 'Fillet: 1/4 in leg is 0.03125 in², 0.106 lb per foot of steel (0.2836 lb/in³); SMAW at 55 % with 0.03 kg rods needs 30 rods for 10 ft',
    source: 'A = z²/2 (hand calculation); Kobe Steel E = 55 % for covered electrodes',
    run: () => {
      const o = calculate({ joint: 'fillet', leg_m: 0.25 * IN, reinforcement: 0, length_m: 3.048, process: 'smaw', electrode_kg: 0.03 }).outputs;
      assertClose(o.area_m2 / (IN * IN), 0.03125, { rel: 1e-9 }, 'area');
      assertClose(o.mass_per_m * 0.3048 / LB, 0.10635, { abs: 0.00002 }, 'lb/ft');
      assertEqual(o.electrodes, Math.ceil((o.weld_kg / 0.55) / 0.03), 'electrodes');
      assertEqual(o.electrodes, 30, 'rods (no allowance)');
    },
  },
  {
    name: 'Double V needs half the bevel metal of a single V of the same plate; a square butt (0° angle) is gap × thickness; efficiencies 55/95/90/100 %',
    source: 'Groove geometry (limiting cases); Kobe Steel efficiency list',
    run: () => {
      const g = { t: 0.02, gap: 0, face: 0, angleRad: Math.PI / 3 };
      assertClose(weldArea('double_v', g), weldArea('single_v', g) / 2, { rel: 1e-12 }, 'X vs V');
      assertClose(weldArea('single_v', { t: 0.01, gap: 0.003, face: 0.01, angleRad: 0 }), 0.00003, { rel: 1e-12 }, 'square butt');
      assertEqual([EFFICIENCY.smaw, EFFICIENCY.gmaw, EFFICIENCY.fcaw, EFFICIENCY.saw].join(','), '0.55,0.95,0.9,1', 'efficiencies');
    },
  },
  {
    name: 'FCAW warns about wire length; a root face thicker than the plate and a joint with no cross-section are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ process: 'fcaw' }).warnings.length, 1, 'FCAW');
      assertThrows(() => calculate({ joint: 'single_v', thickness_m: 0.01, face_m: 0.012 }), 'Root face');
      assertThrows(() => calculate({ joint: 'single_v', angle_deg: 0, gap_m: 0 }), 'no cross-section');
    },
  },
];
