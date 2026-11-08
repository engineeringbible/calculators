/**
 * gz-criteria/tests.js — areas against closed forms, the IS Code tables, the weather and grain criteria on a linear curve.
 * Run: node run-tests.js gz-criteria
 */
import { calculate, tableValue, parseCurve } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const curveText = (f, step, last) => {
  const lines = [];
  for (let a = 0; a <= last + 1e-9; a += step) lines.push(`${a}; ${f(a * DEG)}`);
  return lines.join('\n');
};
const WALL = (gm, bm) => (t) => Math.sin(t) * (gm + 0.5 * bm * Math.tan(t) ** 2);
const LINEAR = curveText((t) => t, 10, 60);

export const tests = [
  {
    name: 'Wall-sided curve GZ = sin θ (GM + ½BM tan²θ) with GM 0.6 m, BM 3 m given every 5°: areas 0–30° = 0.1115 and 0–40° = 0.2475 m·rad from the closed form GM(1 − cos θ) + ½BM(sec θ + cos θ − 2), within 0.3 %',
    source: 'Wall-sided formula (Rawson & Tupper, Basic Ship Theory, ch. 4) integrated analytically',
    run: () => {
      const area = (t) => 0.6 * (1 - Math.cos(t)) + 1.5 * (1 / Math.cos(t) + Math.cos(t) - 2);
      const { outputs } = calculate({ gz_curve: curveText(WALL(0.6, 3), 5, 50), gm0_m: 0.6, check_weather: 'no' });
      assertClose(outputs.area_0_30, area(30 * DEG), { rel: 3e-3 }, 'area 0–30');
      assertClose(outputs.area_0_40, area(40 * DEG), { rel: 3e-3 }, 'area 0–40');
      assertClose(outputs.area_30_40, area(40 * DEG) - area(30 * DEG), { rel: 3e-3 }, 'area 30–40');
      assertClose(area(30 * DEG), 0.1115, { abs: 1e-4 }, 'closed form');
    },
  },
  {
    name: 'IS Code tables with linear interpolation: X1(B/d 2.45) = 0.99, X2(CB 0.475) = 0.785, k(1.25) = 0.965, s(T 10 s) = 0.079; values beyond the tables are held (X1 at B/d 2.0 = 1.0, s at 25 s = 0.035)',
    source: '2008 IS Code (MSC.267(85)) Tables 2.3.4-1 to 2.3.4-4',
    run: () => {
      const X1 = [[2.4, 1.0], [2.5, 0.98], [2.6, 0.96]];
      assertClose(tableValue(X1, 2.45), 0.99, { abs: 1e-12 }, 'X1');
      assertClose(tableValue([[0.45, 0.75], [0.5, 0.82]], 0.475), 0.785, { abs: 1e-12 }, 'X2');
      assertClose(tableValue([[1.0, 0.98], [1.5, 0.95]], 1.25), 0.965, { abs: 1e-12 }, 'k');
      assertClose(tableValue([[8, 0.093], [12, 0.065]], 10), 0.079, { abs: 1e-12 }, 's');
      assertClose(tableValue(X1, 2.0), 1.0, { abs: 1e-12 }, 'held low');
      assertClose(tableValue([[18, 0.038], [20, 0.035]], 25), 0.035, { abs: 1e-12 }, 'held high');
    },
  },
  {
    name: 'Weather criterion on a linear curve GZ = 1.0·θ: lw1 = 504 × 1800 × 14/(1000 × 9.81 × 20 000) = 0.0647 m, θ0 = 3.71°, and areas a and b equal their closed forms with θ2 = 50°',
    source: '2008 IS Code 2.3.2–2.3.4 with ∫(lw2 − cθ)dθ and ∫(cθ − lw2)dθ evaluated exactly',
    run: () => {
      const { outputs } = calculate({ gz_curve: LINEAR, gm0_m: 1.0, flooding_angle_deg: 55, deck_edge_angle_deg: 24, displacement_t: 20000, lateral_area_m2: 1800, lever_z_m: 14 });
      const lw1 = (504 * 1800 * 14) / (1000 * 9.81 * 20000);
      const lw2 = 1.5 * lw1;
      assertClose(outputs.lw1_m, lw1, { rel: 1e-12 }, 'lw1');
      assertClose(outputs.theta0_deg, lw1 / DEG, { rel: 1e-6 }, 'θ0');
      const ts = (outputs.theta0_deg - outputs.theta1_deg) * DEG;
      const ti = lw2;
      const t2 = 50 * DEG;
      assertClose(outputs.theta2_deg, 50, { abs: 1e-9 }, 'θ2');
      assertClose(outputs.area_a, lw2 * (ti - ts) - 0.5 * (ti * ti - ts * ts), { rel: 1e-5 }, 'area a');
      assertClose(outputs.area_b, 0.5 * (t2 * t2 - ti * ti) - lw2 * (t2 - ti), { rel: 1e-5 }, 'area b');
    },
  },
  {
    name: 'Grain on the same linear curve: λ0 = 5000/(1.25 × 20 000) = 0.20 m, heel 10.84° and residual area to 40° = 0.137 m·rad from the closed form',
    source: 'International Grain Code A 7 (λ40 = 0.8 λ0, linear heeling arm) solved exactly for GZ = θ',
    run: () => {
      const { outputs } = calculate({ gz_curve: LINEAR, gm0_m: 1.0, check_weather: 'no', check_grain: 'yes', grain_moment_m4: 5000, stowage_factor_m3_t: 1.25, displacement_t: 20000, flooding_angle_deg: 55 });
      const slope = 0.2 * 0.2 / (40 * DEG);
      const heel = 0.2 / (1 + slope);
      assertClose(outputs.grain_heel_deg, heel / DEG, { rel: 1e-6 }, 'heel');
      const t40 = 40 * DEG;
      const residual = ((1 + slope) / 2) * (t40 * t40 - heel * heel) - 0.2 * (t40 - heel);
      assertClose(outputs.grain_residual_area, residual, { rel: 1e-5 }, 'residual area');
      assertClose(outputs.grain_residual_area, 0.137, { abs: 1e-3 }, 'value');
      assertEqual(outputs.overall.startsWith('Complies'), true, 'complies');
    },
  },
  {
    name: 'A poor curve fails: maximum GZ at 20°, 0.18 m at 30° and a small 30–40° area are each reported as FAIL',
    source: '2008 IS Code 2.2.1–2.2.3',
    run: () => {
      const poor = '0;0\n10;0.15\n20;0.22\n30;0.18\n40;0.10\n50;0';
      const { outputs } = calculate({ gz_curve: poor, gm0_m: 0.9, check_weather: 'no' });
      const failed = outputs.criteria_table.rows.filter((r) => r[3] === 'FAIL').map((r) => r[0]);
      assertEqual(failed.some((c) => c.startsWith('Angle of maximum GZ')), true, 'angle of maximum');
      assertEqual(failed.some((c) => c.startsWith('GZ at 30°')), true, 'GZ at 30°');
      assertEqual(failed.some((c) => c.startsWith('Area 30–40°')), true, 'area 30–40');
      assertEqual(outputs.overall.startsWith('Does NOT comply'), true, 'overall');
    },
  },
  {
    name: 'Invalid inputs fail fast: a curve not starting at 0°, decreasing angles, too few points, a curve that never reaches the wind lever, a curve that ends before 40°',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => parseCurve('5;0.1\n10;0.2\n20;0.3\n30;0.4'), 'first point must be at 0°', 'no zero');
      assertThrows(() => parseCurve('0;0\n10;0.2\n5;0.1\n30;0.4'), 'must increase', 'order');
      assertThrows(() => parseCurve('0;0\n10;0.2'), 'at least 4 points', 'short');
      assertThrows(() => calculate({ gz_curve: '0;0\n10;0.01\n20;0.02\n40;0.02\n60;0', lateral_area_m2: 5000 }), 'capsize', 'never reaches lw1');
      assertThrows(() => calculate({ gz_curve: '0;0\n10;0.2\n20;0.4\n30;0.5' }), 'must reach', 'ends at 30°');
    },
  },
];
