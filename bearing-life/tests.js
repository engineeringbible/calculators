/**
 * bearing-life/tests.js — checks against ISO 281 formulas, Table 1 and catalogue illustrations.
 * Run: node run-tests.js bearing-life
 */
import { calculate, basicLifeMrev, hoursFromMrev, A1_TABLE, BEARING_TYPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const BASE = { bearing_type: 'ball', c_dynamic_n: 35000, c_static_n: 20000, load_mode: 'direct', p_direct_n: 8750, application_factor: 1, speed_rpm: 1500, reliability: '90', a_iso: 1, target_hours: 20000, hours_per_year: 6000 };

export const tests = [
  {
    name: 'Catalogue illustration: C/P = 4 at 1 500 rpm → ball bearing L10 = 4³ = 64 million revolutions = 711 h; roller bearing 4^(10/3) = 101.6 million = 1 129 h',
    source: 'ISO 281:2007 §5.1 L10 = (C/P)^p, p = 3 (ball) and 10/3 (roller); L10h = 10⁶ L10/(60 n)',
    run: () => {
      assertClose(basicLifeMrev(35000, 8750, 3), 64, { rel: 1e-12 }, 'ball Mrev');
      assertClose(hoursFromMrev(64, 1500), 711.1, { abs: 0.1 }, 'ball hours');
      const ball = calculate(BASE).outputs;
      assertClose(ball.l10_mrev, 64, { rel: 1e-12 }, 'in calculate');
      assertClose(ball.l10_h, 711.1, { abs: 0.1 }, 'hours');
      const roller = calculate({ ...BASE, bearing_type: 'roller' }).outputs;
      assertClose(roller.l10_mrev, 4 ** (10 / 3), { rel: 1e-12 }, 'roller Mrev');
      assertClose(roller.l10_h, 1129, { abs: 1 }, 'roller hours');
      assertEqual(BEARING_TYPES.roller.p, 10 / 3, 'p roller');
    },
  },
  {
    name: 'Reliability factors (ISO 281:2007 Table 1): 90 % 1.00, 95 % 0.64, 96 % 0.55, 97 % 0.47, 98 % 0.37, 99 % 0.25, 99.9 % 0.093, 99.95 % 0.077; 99 % life = 0.25 × 711 = 178 h',
    source: 'ISO 281:2007 Table 1 (three-parameter Weibull); 1990 edition 0.62/0.53/0.44/0.33/0.21 recorded in the register',
    run: () => {
      assertEqual([A1_TABLE[90], A1_TABLE[95], A1_TABLE[96], A1_TABLE[97], A1_TABLE[98], A1_TABLE[99]].join(','), '1,0.64,0.55,0.47,0.37,0.25', 'main rows');
      assertEqual(A1_TABLE[99.9] === 0.093 && A1_TABLE[99.95] === 0.077, true, 'tail rows');
      const r99 = calculate({ ...BASE, reliability: '99' }).outputs;
      assertEqual(r99.a1, 0.25, 'a1');
      assertClose(r99.lnm_h, 0.25 * r99.l10_h, { rel: 1e-12 }, 'Lnm');
      assertClose(r99.lnm_h, 177.8, { abs: 0.1 }, 'value');
    },
  },
  {
    name: 'Equivalent load: F_r 4 kN, F_a 1.5 kN, e 0.28 → F_a/F_r 0.375 > e → P = 0.56 × 4 + 1.55 × 1.5 = 4.565 kN; with F_a 1 kN (ratio 0.25 ≤ e) P = F_r = 4 kN; P never drops below F_r; application factor 1.3 multiplies P',
    source: 'ISO 281 §4.1 P = X F_r + Y F_a with the limiting ratio e (deep-groove ball bearing X 0.56, Y 1.55 at e 0.28)',
    run: () => {
      const xy = calculate({ ...BASE, load_mode: 'xy', radial_n: 4000, axial_n: 1500, e_limit: 0.28, x_factor: 0.56, y_factor: 1.55 }).outputs;
      assertClose(xy.ratio_fa_fr, 0.375, { rel: 1e-12 }, 'ratio');
      assertClose(xy.p_n, 4565, { rel: 1e-12 }, 'P');
      const low = calculate({ ...BASE, load_mode: 'xy', radial_n: 4000, axial_n: 1000, e_limit: 0.28, x_factor: 0.56, y_factor: 1.55 }).outputs;
      assertClose(low.p_n, 4000, { rel: 1e-12 }, 'P = F_r');
      const inconsistent = calculate({ ...BASE, load_mode: 'xy', radial_n: 4000, axial_n: 1000, e_limit: 0.22, x_factor: 0.56, y_factor: 1.5 }).outputs;
      assertClose(inconsistent.p_n, 4000, { rel: 1e-12 }, 'clamped to F_r when X F_r + Y F_a < F_r');
      const shock = calculate({ ...BASE, application_factor: 1.3 }).outputs;
      assertClose(shock.p_n, 8750 * 1.3, { rel: 1e-12 }, 'application factor');
      assertClose(shock.l10_mrev, (35000 / (8750 * 1.3)) ** 3, { rel: 1e-12 }, 'life with factor');
    },
  },
  {
    name: 'Required rating: for 20 000 h at 1 500 rpm (1 800 million revolutions) with P 8.75 kN a ball bearing needs C = 8.75 × 1800^(1/3) = 106.4 kN; the default 35 kN is SHORT; a_ISO 3 cuts the requirement by 3^(1/3)',
    source: 'Inversion of Lnm = a1 a_ISO (C/P)^p for C',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.c_required_n, 8750 * 1800 ** (1 / 3), { rel: 1e-9 }, 'C required');
      assertClose(outputs.c_required_n / 1000, 106.4, { abs: 0.1 }, 'value');
      assertEqual(outputs.target_check.startsWith('SHORT'), true, 'short');
      const lubricated = calculate({ ...BASE, a_iso: 3 }).outputs;
      assertClose(lubricated.c_required_n / outputs.c_required_n, 3 ** (-1 / 3), { rel: 1e-9 }, 'a_ISO effect');
      assertClose(lubricated.lnm_h, 3 * outputs.l10_h, { rel: 1e-12 }, 'life × 3');
      const ok = calculate({ ...BASE, c_dynamic_n: 110000 }).outputs;
      assertEqual(ok.target_check.startsWith('OK'), true, 'OK with 110 kN');
    },
  },
  {
    name: 'Static safety s0 = C0/P = 20/8.75 = 2.29; years = Lnmh / hours per year; P share of C 25 %',
    source: 'ISO 76 static safety factor; arithmetic',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.static_safety, 20000 / 8750, { rel: 1e-12 }, 's0');
      assertClose(outputs.life_years, outputs.lnm_h / 6000, { rel: 1e-12 }, 'years');
      assertClose(outputs.load_share_pct, 25, { rel: 1e-12 }, 'share');
      assertEqual(calculate({ ...BASE, c_static_n: 0 }).outputs.static_safety, null, 'skip static');
      const heavy = calculate({ ...BASE, p_direct_n: 25000 });
      assertEqual(heavy.warnings.some((w) => w.includes('above 0.5 C')), true, 'P > 0.5 C warning');
      assertEqual(heavy.warnings.some((w) => w.includes('Static safety')), true, 's0 < 1 warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero loads in X/Y mode, unknown reliability, zero speed',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BASE, load_mode: 'xy', radial_n: 0, axial_n: 0 }), 'Enter a radial or axial load', 'loads');
      assertThrows(() => calculate({ ...BASE, reliability: '93' }), 'must be one of', 'reliability');
      assertThrows(() => calculate({ ...BASE, speed_rpm: 0 }), 'greater than zero', 'speed');
    },
  },
];
