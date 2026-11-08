/**
 * fatigue-goodman/tests.js — checks against Shigley's Mechanical Engineering Design, 10th ed., chapter 6 examples and tables.
 * Run: node run-tests.js fatigue-goodman
 */
import { calculate, surfaceFactor, sizeFactor, temperatureFactor, safetyFactors } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KSI = 6894757.293168;
const EX610 = { sut_pa: 100 * KSI, sy_pa: 84 * KSI, surface: 'machined', load: 'axial', temp_c: 20, reliability: '50', kf_misc: 1, sa_pa: (8 / 1.767146) * KSI, sm_pa: (8 / 1.767146) * KSI, kf_conc: 1.85 };

export const tests = [
  {
    name: 'Shigley Example 6-10: S_e = 33.9 kpsi, σa = σm = 8.38 kpsi, Gerber n_f = 3.66, ASME-elliptic 3.75, Langer n_y = 5.01',
    source: "Shigley's Mechanical Engineering Design, 10th ed., Example 6-10 (1.5 in AISI 1050 CD bar, 0 to 16 kip, K_f 1.85)",
    run: () => {
      const o = calculate(EX610).outputs;
      assertClose(o.se_pa / KSI, 33.9, { abs: 0.05 }, 'Se');
      assertClose(o.sa_eff_pa / KSI, 8.38, { abs: 0.01 }, 'σa');
      assertClose(o.n_gerber, 3.66, { abs: 0.01 }, 'Gerber (3.667 unrounded)');
      assertClose(o.n_asme, 3.75, { abs: 0.01 }, 'ASME');
      assertClose(o.n_yield, 5.01, { abs: 0.01 }, 'Langer');
    },
  },
  {
    name: 'Marin factors: Example 6-3 k_a = 4.51 × 520^−0.265 = 0.860; Example 6-4 k_b = (32/7.62)^−0.107 = 0.858; k_b at 100 mm = 1.51 × 100^−0.157 = 0.733',
    source: "Shigley 10th ed., Examples 6-3 and 6-4, Table 6-2, eq. 6-20",
    run: () => {
      assertClose(surfaceFactor('machined', 520), 0.860, { abs: 0.0005 }, 'ka');
      assertClose(sizeFactor(32), 0.858, { abs: 0.0005 }, 'kb 32');
      assertClose(sizeFactor(100), 0.7328, { abs: 0.0001 }, 'kb 100');
      assertEqual(sizeFactor(300), null, 'beyond 254 mm');
    },
  },
  {
    name: 'Temperature factor eq. 6-27 against Table 6-4: 1.000 at 20 °C, 0.975 at 300 °C, 0.768 at 500 °C (within 0.005)',
    source: "Shigley 10th ed., Table 6-4 and eq. 6-27",
    run: () => {
      assertClose(temperatureFactor(20), 1, { abs: 1e-12 }, '20');
      assertClose(temperatureFactor(300), 0.975, { abs: 0.005 }, '300');
      assertClose(temperatureFactor(500), 0.768, { abs: 0.005 }, '500');
    },
  },
  {
    name: 'Criteria by hand: Goodman 1/(0.2470 + 0.0838) = 3.02, Soderberg 2.88; Gerber ≥ ASME-elliptic ≥ Goodman ≥ Soderberg ordering for this case',
    source: "Shigley 10th ed., Tables 6-6 to 6-8 (hand calculation)",
    run: () => {
      const o = calculate(EX610).outputs;
      assertClose(o.n_goodman, 3.02, { abs: 0.005 }, 'Goodman');
      assertClose(o.n_soderberg, 2.88, { abs: 0.005 }, 'Soderberg');
      assertEqual(o.n_asme > o.n_goodman && o.n_goodman > o.n_soderberg && o.n_gerber > o.n_goodman, true, 'order');
    },
  },
  {
    name: 'Limits: zero mean stress gives n = S_e/σ_a for every criterion; S_e\' = 0.5 S_ut, capped at 700 MPa above 1 400 MPa; reliability 99 % gives k_e = 0.814',
    source: "Shigley 10th ed., eq. 6-8 and Table 6-5",
    run: () => {
      const f = safetyFactors(100, 0, 250, 600, 400);
      assertClose(f.goodman, 2.5, { rel: 1e-12 }, 'Goodman');
      assertClose(f.asme, 2.5, { rel: 1e-12 }, 'ASME');
      assertClose(calculate({ ...EX610, sut_pa: 1600e6, sy_pa: 1400e6 }).outputs.se_prime_pa, 700e6, { rel: 1e-12 }, 'cap');
      assertClose(calculate({ ...EX610, sut_pa: 600e6, sy_pa: 400e6 }).outputs.se_prime_pa, 300e6, { rel: 1e-12 }, 'half');
      assertClose(calculate({ ...EX610, reliability: '99' }).outputs.ke, 0.814, { abs: 1e-12 }, 'ke');
    },
  },
  {
    name: 'Rotating bending of a 32 mm machined shaft uses k_c = 1 and k_b = 0.858; Sy above Sut, a 300 mm shaft and 600 °C are rejected',
    source: 'Validation contract; Shigley eq. 6-20 validity range',
    run: () => {
      const o = calculate({ ...EX610, load: 'bending', motion: 'rotating', d_m: 0.032 }).outputs;
      assertEqual(o.kc, 1, 'kc');
      assertClose(o.kb, 0.858, { abs: 0.0005 }, 'kb');
      assertThrows(() => calculate({ ...EX610, sy_pa: 120 * KSI }), 'Yield strength');
      assertThrows(() => calculate({ ...EX610, load: 'bending', d_m: 0.3 }), 'Diameter');
      assertThrows(() => calculate({ ...EX610, temp_c: 600 }), 'Operating temperature');
    },
  },
];
