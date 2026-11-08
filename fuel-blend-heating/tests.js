/**
 * fuel-blend-heating/tests.js — checks of the Refutas blending index and the ASTM D341 (Walther) relation.
 * Run: node run-tests.js fuel-blend-heating
 */
import { calculate, blendingIndex, viscosityFromIndex, waltherFit, waltherViscosity, waltherTemperature } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const BLEND = { mode: 'blend', visc_a_cst: 380, density_a: 991, sulphur_a_pct: 0.5, visc_b_cst: 2.5, density_b: 860, sulphur_b_pct: 0.1, fraction_a: 0.8, heating_fuel: 'a', ref_temp_c: 50, second_visc_cst: 35, second_temp_c: 100, target_inj_cst: 13, pumping_cst: 1000 };

export const tests = [
  {
    name: 'Refutas indices: VBI(10 cSt) = 23.58, VBI(100 cSt) = 33.20; a 50/50 mass blend gives 26.7 cSt, far below the 55 cSt arithmetic mean; the index inverts exactly',
    source: 'Refutas blending index VBI = 14.534 ln(ln(ν + 0.8)) + 10.975 (ASTM D7152 family; Maples 2000)',
    run: () => {
      assertClose(blendingIndex(10), 23.576, { abs: 5e-3 }, 'VBI 10');
      assertClose(blendingIndex(100), 33.196, { abs: 5e-3 }, 'VBI 100');
      assertClose(viscosityFromIndex(0.5 * blendingIndex(10) + 0.5 * blendingIndex(100)), 26.7, { abs: 0.1 }, '50/50');
      for (const v of [1, 2.5, 12, 180, 380, 700]) assertClose(viscosityFromIndex(blendingIndex(v)), v, { rel: 1e-10 }, `round trip ${v}`);
      const same = calculate({ ...BLEND, visc_b_cst: 380, fraction_a: 0.3 }).outputs;
      assertClose(same.blend_visc_cst, 380, { rel: 1e-9 }, 'identical fuels');
    },
  },
  {
    name: '80/20 blend of 380 cSt VLSFO (991 kg/m³, 0.50 % S) with 2.5 cSt MGO (860, 0.10 %): 73.7 cSt, 961.8 kg/m³, 0.42 % S, volume fraction of A 77.6 %',
    source: 'Refutas (viscosity), ideal mixing by mass (sulphur) and volume (density)',
    run: () => {
      const { outputs } = calculate(BLEND);
      const expected = viscosityFromIndex(0.8 * blendingIndex(380) + 0.2 * blendingIndex(2.5));
      assertClose(outputs.blend_visc_cst, expected, { rel: 1e-12 }, 'viscosity formula');
      assertClose(outputs.blend_visc_cst, 73.7, { abs: 0.3 }, 'viscosity value');
      assertClose(outputs.blend_density, 1 / (0.8 / 991 + 0.2 / 860), { rel: 1e-12 }, 'density');
      assertClose(outputs.blend_density, 961.8, { abs: 0.1 }, 'density value');
      assertClose(outputs.blend_sulphur_pct, 0.42, { rel: 1e-12 }, 'sulphur');
      assertClose(outputs.volume_fraction_a, (0.8 / 991) * outputs.blend_density, { rel: 1e-12 }, 'volume fraction');
    },
  },
  {
    name: 'Target viscosity 180 cSt needs 91.7 % of fuel A (8.3 % MGO); feeding that fraction back gives 180 cSt; target outside the two fuels is rejected',
    source: 'Linear blending of the Refutas index: w_A = (VBI_target − VBI_B)/(VBI_A − VBI_B)',
    run: () => {
      const r = calculate({ ...BLEND, mode: 'target_viscosity', target_visc_cst: 180 }).outputs;
      assertClose(r.fraction_a_out, (blendingIndex(180) - blendingIndex(2.5)) / (blendingIndex(380) - blendingIndex(2.5)), { rel: 1e-12 }, 'fraction formula');
      assertClose(r.fraction_a_out, 0.917, { abs: 2e-3 }, 'fraction value');
      assertClose(r.blend_visc_cst, 180, { rel: 1e-9 }, 'round trip');
      assertThrows(() => calculate({ ...BLEND, mode: 'target_viscosity', target_visc_cst: 500 }), 'outside the range', 'out of range');
    },
  },
  {
    name: 'Target sulphur 0.40 % from 0.50 % and 0.10 % fuels needs 75 % of fuel A; same-sulphur fuels are rejected',
    source: 'Mass-fraction sulphur blending',
    run: () => {
      const r = calculate({ ...BLEND, mode: 'target_sulphur', target_sulphur_pct: 0.4 }).outputs;
      assertClose(r.fraction_a_out, 0.75, { rel: 1e-12 }, 'fraction');
      assertClose(r.blend_sulphur_pct, 0.4, { rel: 1e-12 }, 'sulphur');
      assertThrows(() => calculate({ ...BLEND, mode: 'target_sulphur', sulphur_b_pct: 0.5 }), 'same sulphur', 'same');
    },
  },
  {
    name: 'Walther (ASTM D341) through 380 cSt @ 50 °C and 35 cSt @ 100 °C: B = 3.53, A = 9.27; 15 cSt at 128 °C, 12 cSt at 138 °C, 13 cSt at 134 °C; the fit returns both reference points; 1 000 cSt at 36–38 °C',
    source: 'ASTM D341 Walther equation log log(ν + 0.7) = A − B log T; typical HFO injection temperatures 125–140 °C (CIMAC)',
    run: () => {
      const fit = waltherFit(50, 380, 100, 35);
      assertClose(fit.B, 3.532, { abs: 5e-3 }, 'B');
      assertClose(fit.A, 9.274, { abs: 0.01 }, 'A');
      assertClose(waltherViscosity(fit, 50), 380, { rel: 1e-9 }, 'point 1');
      assertClose(waltherViscosity(fit, 100), 35, { rel: 1e-9 }, 'point 2');
      assertClose(waltherTemperature(fit, 15), 128.5, { abs: 0.7 }, '15 cSt');
      assertClose(waltherTemperature(fit, 12), 137.7, { abs: 0.7 }, '12 cSt');
      const { outputs } = calculate(BLEND);
      assertClose(outputs.injection_temp_c, 134.3, { abs: 0.7 }, '13 cSt');
      assertEqual(outputs.pumping_temp_c > 35 && outputs.pumping_temp_c < 39, true, '1 000 cSt pumping temperature');
      assertClose(outputs.visc_at_50_cst, 380, { rel: 1e-9 }, 'ν50 echoed');
      assertClose(outputs.visc_at_100_cst, 35, { rel: 1e-9 }, 'ν100 echoed');
      assertEqual(outputs.visc_at_40_cst > 380, true, 'thicker at 40 °C');
    },
  },
  {
    name: 'Heating the blend (73.7 cSt at 50 °C with the slope of fuel A) needs a lower temperature than fuel A for the same 13 cSt; an MGO (3 cSt at 40 °C) reaching 3.5 cSt below 40 °C gets the distillate remark',
    source: 'Walther slope assumption documented in the register',
    run: () => {
      const a = calculate(BLEND).outputs;
      const blend = calculate({ ...BLEND, heating_fuel: 'blend' }).outputs;
      assertEqual(blend.injection_temp_c < a.injection_temp_c, true, 'cooler');
      assertEqual(blend.walther_b === a.walther_b, true, 'same slope');
      assertClose(waltherViscosity({ A: blend.walther_a, B: blend.walther_b }, 50), a.blend_visc_cst, { rel: 1e-9 }, 'passes through the blend viscosity');
      const mgo = calculate({ ...BLEND, visc_a_cst: 3, second_visc_cst: 1.5, ref_temp_c: 40, second_temp_c: 100, target_inj_cst: 3.5 }).outputs;
      assertEqual(mgo.heating_note.includes('distillate-like'), true, 'distillate remark');
    },
  },
  {
    name: 'Warnings: residual cut with distillate → compatibility warning; blend above 0.50 % S → MARPOL warning; above 0.10 % → ECA warning only',
    source: 'ASTM D4740 compatibility practice; MARPOL Annex VI Reg. 14 sulphur limits (0.50 % global, 0.10 % ECA)',
    run: () => {
      const r = calculate(BLEND);
      assertEqual(r.warnings.some((w) => w.includes('compatibility')), true, 'compatibility');
      assertEqual(r.warnings.some((w) => w.includes('Emission Control Areas')), true, 'ECA');
      const high = calculate({ ...BLEND, sulphur_a_pct: 3.5 });
      assertEqual(high.warnings.some((w) => w.includes('0.50 % global cap')), true, 'global cap');
    },
  },
  {
    name: 'Invalid inputs fail fast: reference temperatures too close, viscosity increasing with temperature, unknown mode',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BLEND, second_temp_c: 52 }), 'at least 5 °C', 'temperatures');
      assertThrows(() => calculate({ ...BLEND, second_visc_cst: 500 }), 'must decrease', 'slope');
      assertThrows(() => calculate({ ...BLEND, mode: 'magic' }), 'must be one of', 'mode');
    },
  },
  {
    name: 'A viscosity line too steep to extrapolate gives no 40 and 50 °C values and a warning instead of infinite viscosities',
    source: 'Range fuzzing (fuzz.js): 10^(10^y) overflows for extreme Walther slopes',
    run: () => {
      const { outputs, warnings } = calculate({ second_visc_cst: 1.1, second_temp_c: 177, ref_temp_c: 126, visc_a_cst: 5700 });
      assertEqual(outputs.visc_at_40_cst, null, '40 °C');
      assertEqual(warnings.some((w) => w.includes('too steep to extrapolate')), true, 'warning');
    },
  },
];
