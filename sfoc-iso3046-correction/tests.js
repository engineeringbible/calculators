/**
 * sfoc-iso3046-correction/tests.js — checks of the ISO 3046-1 formulae (1)–(3), Table 2 and the LCV scaling.
 * Run: node run-tests.js sfoc-iso3046-correction
 */
import { calculate, FORMULA_REFERENCES, saturationVapourPressureKpa, LCV_REF_KJ_KG } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SITE = { formula_ref: 'D', declared_power_kw: 10000, sfoc_ref_g_kwh: 175, eta_m: 0.8, jacket_cooled: 'no', p_r_kpa: 100, t_r_c: 25, rh_r_pct: 30, t_cr_c: 25, p_x_kpa: 100, t_x_c: 45, rh_x_pct: 60, t_cx_c: 36, lcv_kj_kg: 42700 };

export const tests = [
  {
    name: 'Reference D at 45 °C air / 36 °C coolant / 100 kPa: k = (298.15/318.15)^1.2 × (298.15/309.15)^1 = 0.8921, α = k − 0.7 (1 − k)(1/0.8 − 1) = 0.8733 → 8 733 kW (−12.7 %), β = k/α = 1.0216 → 178.8 g/kWh',
    source: 'ISO 3046-1:2002 formulae (1)–(3) with Table 2 reference D (a 0, m 0.7, n 1.2, s 1)',
    run: () => {
      const { outputs } = calculate(SITE);
      const k = (298.15 / 318.15) ** 1.2 * (298.15 / 309.15);
      assertClose(outputs.k, k, { rel: 1e-12 }, 'k formula');
      assertClose(outputs.k, 0.8921, { abs: 1e-4 }, 'k value');
      assertClose(outputs.pressure_ratio, 1, { rel: 1e-12 }, 'pressure term = 1');
      const alpha = k - 0.7 * (1 - k) * (1 / 0.8 - 1);
      assertClose(outputs.alpha, alpha, { rel: 1e-12 }, 'α formula');
      assertClose(outputs.alpha, 0.8733, { abs: 1e-4 }, 'α value');
      assertClose(outputs.site_power_w / 1000, 8733, { abs: 1 }, 'P_x');
      assertClose(outputs.power_change_pct, -12.67, { abs: 0.02 }, '%');
      assertClose(outputs.beta, k / alpha, { rel: 1e-12 }, 'β');
      assertClose(outputs.beta, 1.0216, { abs: 1e-4 }, 'β value');
      assertClose(outputs.sfoc_site_g_kwh, 175 * (k / alpha), { rel: 1e-12 }, 'SFOC');
    },
  },
  {
    name: 'At reference conditions every factor is 1: k = α = β = 1, power and SFOC unchanged, for all eight formula references',
    source: 'Identity of the method at the reference point',
    run: () => {
      for (const ref of Object.keys(FORMULA_REFERENCES)) {
        const r = calculate({ ...SITE, formula_ref: ref, t_x_c: 25, rh_x_pct: 30, t_cx_c: 25 }).outputs;
        assertClose(r.k, 1, { rel: 1e-12 }, `k ${ref}`);
        assertClose(r.alpha, 1, { rel: 1e-12 }, `α ${ref}`);
        assertClose(r.sfoc_site_g_kwh, 175, { rel: 1e-12 }, `SFOC ${ref}`);
      }
    },
  },
  {
    name: 'Humidity term for a = 1 (reference A): dry-air pressures p − φ p_s with Magnus p_s(25 °C) = 3.17 kPa and p_s(45 °C) = 9.59 kPa; k = [(100 − 0.6 × 9.59)/(100 − 0.3 × 3.17)]^1 × (298.15/318.15)^0.75; reference D ignores humidity',
    source: 'ISO 3046-1 formula (3); Alduchov & Eskridge (1996) Magnus coefficients',
    run: () => {
      assertClose(saturationVapourPressureKpa(25), 3.17, { abs: 0.01 }, 'p_s 25');
      assertClose(saturationVapourPressureKpa(45), 9.59, { abs: 0.02 }, 'p_s 45');
      const a = calculate({ ...SITE, formula_ref: 'A' }).outputs;
      const pSr = saturationVapourPressureKpa(25);
      const pSx = saturationVapourPressureKpa(45);
      assertClose(a.pressure_ratio, (100 - 0.6 * pSx) / (100 - 0.3 * pSr), { rel: 1e-12 }, 'pressure term');
      assertClose(a.k, a.pressure_ratio * (298.15 / 318.15) ** 0.75, { rel: 1e-12 }, 'k A');
      const dryD = calculate({ ...SITE, rh_x_pct: 10 }).outputs.k;
      assertClose(dryD, calculate(SITE).outputs.k, { rel: 1e-12 }, 'D ignores humidity');
    },
  },
  {
    name: 'Table 2 transcription: A (1, 1, 0.75, 0), B (0, 1, 1, 0), C (0, 0.7, 2, 0), D (0, 0.7, 1.2, 1), F and J (0, 0.57, 0.55, 1.75), G (0, 0.7, 1.2, 1), I (1, 0.86, 0.55, 0); jacket cooling sets s = 0 so the coolant term becomes 1',
    source: 'ISO 3046-1:2002 Table 2 (preview pages 5–6) and note 3',
    run: () => {
      const t = FORMULA_REFERENCES;
      assertEqual([t.A.a, t.A.m, t.A.n, t.A.s].join(), '1,1,0.75,0', 'A');
      assertEqual([t.B.a, t.B.m, t.B.n, t.B.s].join(), '0,1,1,0', 'B');
      assertEqual([t.C.a, t.C.m, t.C.n, t.C.s].join(), '0,0.7,2,0', 'C');
      assertEqual([t.D.a, t.D.m, t.D.n, t.D.s].join(), '0,0.7,1.2,1', 'D');
      assertEqual([t.F.a, t.F.m, t.F.n, t.F.s].join(), '0,0.57,0.55,1.75', 'F');
      assertEqual([t.J.a, t.J.m, t.J.n, t.J.s].join(), '0,0.57,0.55,1.75', 'J');
      assertEqual([t.G.a, t.G.m, t.G.n, t.G.s].join(), '0,0.7,1.2,1', 'G');
      assertEqual([t.I.a, t.I.m, t.I.n, t.I.s].join(), '1,0.86,0.55,0', 'I');
      const jacket = calculate({ ...SITE, jacket_cooled: 'yes' }).outputs;
      assertClose(jacket.coolant_ratio, 1, { rel: 1e-12 }, 's = 0');
      assertClose(jacket.k, (298.15 / 318.15) ** 1.2, { rel: 1e-12 }, 'k without coolant term');
    },
  },
  {
    name: 'Altitude and cold: 90 kPa at 10 °C for reference C gives k = 0.9^0.7 × (298.15/283.15)^2 = 1.034 → α > 1 with the "do not uprate" warning; fuel of 40 500 kJ/kg raises the mass SFOC by 42 700/40 500 = 5.4 %; fuel flow = SFOC × P/1e6 kg/h',
    source: 'ISO 3046-1 note 2 (power limited to the declared value); LCV scaling at equal energy',
    run: () => {
      const cold = calculate({ ...SITE, formula_ref: 'C', p_x_kpa: 90, t_x_c: 10 });
      assertClose(cold.outputs.k, 0.9 ** 0.7 * (298.15 / 283.15) ** 2, { rel: 1e-12 }, 'k C');
      assertEqual(cold.outputs.alpha > 1, true, 'α > 1');
      assertEqual(cold.warnings.some((w) => w.includes('do not uprate')), true, 'warning');
      const fuel = calculate({ ...SITE, lcv_kj_kg: 40500 }).outputs;
      assertClose(fuel.sfoc_site_fuel_g_kwh, fuel.sfoc_site_g_kwh * (42700 / 40500), { rel: 1e-12 }, 'LCV scaling');
      assertClose(fuel.fuel_flow_kg_h, (fuel.sfoc_site_fuel_g_kwh * fuel.site_power_w) / 1e6, { rel: 1e-12 }, 'fuel flow');
      assertEqual(LCV_REF_KJ_KG, 42700, 'reference LCV');
    },
  },
  {
    name: 'Validation: unknown formula reference, η_m above 1 and a zero declared power are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...SITE, formula_ref: 'E' }), 'must be one of', 'reference E (no values)');
      assertThrows(() => calculate({ ...SITE, eta_m: 1.2 }), 'between', 'η_m');
      assertThrows(() => calculate({ ...SITE, declared_power_kw: 0 }), 'greater than zero', 'power');
    },
  },
];
