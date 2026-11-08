/**
 * fillet-weld/tests.js — checks against EN 1993-1-8 §4.5 and published worked values.
 * Run: node run-tests.js fillet-weld
 */
import { calculate, weldShearStrength, STEEL_GRADES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const JOINT = { grade: 'S355', gamma_m2: 1.25, size_basis: 'throat', size_m: 0.005, length_m: 0.2, welds: 2, plate_t_m: 0.01, force_transverse_n: 300e3, force_longitudinal_n: 100e3, moment_n_m: 0, spacing_m: 0.2 };

export const tests = [
  {
    name: 'Design shear strength f_vw,d = f_u/(√3 β_w γ_M2): S235 207.8 MPa, S275 233.6, S355 251.5, S460 249.4; the UTM example with f_u 340 MPa and β_w 0.8 gives 196.3 MPa',
    source: 'EN 1993-1-8 §4.5.3.3 eq. 4.4 and Table 4.1; UTM OCW connections lecture worked example (196.3 N/mm²)',
    run: () => {
      assertClose(weldShearStrength(360e6, 0.8, 1.25) / 1e6, 207.8, { abs: 0.1 }, 'S235');
      assertClose(weldShearStrength(430e6, 0.85, 1.25) / 1e6, 233.6, { abs: 0.1 }, 'S275');
      assertClose(weldShearStrength(490e6, 0.9, 1.25) / 1e6, 251.5, { abs: 0.1 }, 'S355');
      assertClose(weldShearStrength(540e6, 1.0, 1.25) / 1e6, 249.4, { abs: 0.1 }, 'S460');
      assertClose(weldShearStrength(340e6, 0.8, 1.25) / 1e6, 196.3, { abs: 0.1 }, 'UTM example');
      assertEqual(STEEL_GRADES.S235.bw === 0.8 && STEEL_GRADES.S275.bw === 0.85 && STEEL_GRADES.S355.bw === 0.9 && STEEL_GRADES.S420.bw === 1 && STEEL_GRADES.S460.bw === 1, true, 'β_w table');
    },
  },
  {
    name: 'Two S355 welds a 5 mm × 200 mm carrying 300 kN transverse + 100 kN longitudinal: per weld 150 kN and 50 kN → 750 and 250 kN/m, resultant 790.6 kN/m vs F_w,Rd = 251.5 × 5 = 1 257 kN/m → 63 % (simplified)',
    source: 'EN 1993-1-8 §4.5.3.3 simplified method F_w,Ed ≤ F_w,Rd = f_vw,d a',
    run: () => {
      const { outputs } = calculate(JOINT);
      assertClose(outputs.fwrd_n_m / 1000, 251.5 * 5, { rel: 2e-4 }, 'F_w,Rd');
      assertClose(outputs.resultant_n_m / 1000, Math.hypot(750, 250), { rel: 1e-9 }, 'resultant');
      assertClose(outputs.utilisation_simplified, (Math.hypot(750, 250) / (251.47 * 5)) * 100, { rel: 2e-4 }, 'utilisation');
      assertClose(outputs.utilisation_simplified, 62.9, { abs: 0.1 }, 'value');
      assertClose(outputs.throat_area_m2 * 1e6, 2000, { rel: 1e-12 }, 'Σ a L');
    },
  },
  {
    name: 'Directional method on the same joint: σ⊥ = τ⊥ = 750/(√2 × 5) = 106.1 MPa, τ∥ = 250/5 = 50 MPa, comparison stress √(σ⊥² + 3(τ⊥² + τ∥²)) = √52 500 = 229.1 MPa vs f_u/(β_w γ_M2) = 435.6 MPa → 52.6 %; σ⊥ ≤ 0.9 f_u/γ_M2 = 352.8 MPa',
    source: 'EN 1993-1-8 §4.5.3.2 eqs. 4.1 (directional method) with σ⊥ = τ⊥ for a transverse fillet',
    run: () => {
      const { outputs } = calculate(JOINT);
      assertClose(outputs.sigma_perp_pa / 1e6, 750 / (Math.SQRT2 * 5), { rel: 1e-9 }, 'σ⊥');
      assertClose(outputs.tau_perp_pa, outputs.sigma_perp_pa, { rel: 1e-12 }, 'τ⊥ = σ⊥');
      assertClose(outputs.tau_par_pa / 1e6, 50, { rel: 1e-9 }, 'τ∥');
      assertClose(outputs.comparison_stress_pa / 1e6, Math.sqrt(106.07 ** 2 + 3 * (106.07 ** 2 + 50 ** 2)), { rel: 1e-3 }, 'comparison');
      assertClose(outputs.limit_stress_pa / 1e6, 490 / (0.9 * 1.25), { rel: 1e-9 }, 'limit');
      assertClose(outputs.comparison_stress_pa / 1e6, 229.13, { abs: 0.05 }, 'comparison value');
      assertClose(outputs.utilisation_directional, 52.6, { abs: 0.1 }, 'utilisation');
      assertEqual(outputs.verdict.startsWith('OK'), true, 'OK');
    },
  },
  {
    name: 'Transverse-only load: directional resistance is √3/√2 = 1.225 × the simplified resistance (classic Eurocode result); longitudinal-only load: both methods coincide',
    source: 'EN 1993-1-8 §4.5.3.2 vs §4.5.3.3 for pure transverse and pure longitudinal shear',
    run: () => {
      const transverse = calculate({ ...JOINT, force_longitudinal_n: 0 }).outputs;
      assertClose(transverse.utilisation_simplified / transverse.utilisation_directional, Math.sqrt(3) / Math.SQRT2, { rel: 1e-9 }, 'ratio 1.225');
      const longitudinal = calculate({ ...JOINT, force_transverse_n: 0 }).outputs;
      assertClose(longitudinal.utilisation_simplified, longitudinal.utilisation_directional, { rel: 1e-9 }, 'coincide');
    },
  },
  {
    name: 'Moment couple: 20 kN·m on two welds 200 mm apart adds 100 kN transverse per weld; required throats scale with utilisation (simplified: resultant/f_vw,d); leg input z = 7.07 mm equals a = 5 mm',
    source: 'Force couple M/h; a = z/√2',
    run: () => {
      const base = calculate(JOINT).outputs;
      const withMoment = calculate({ ...JOINT, moment_n_m: 20e3, spacing_m: 0.2 }).outputs;
      assertClose(withMoment.sigma_perp_pa / base.sigma_perp_pa, (150 + 100) / 150, { rel: 1e-9 }, 'moment adds 100 kN per weld');
      assertClose(base.required_throat_simplified_m, base.resultant_n_m / base.fvwd_pa, { rel: 1e-12 }, 'required a (simplified)');
      assertClose(base.required_throat_directional_m, 0.005 * (base.utilisation_directional / 100), { rel: 1e-12 }, 'required a (directional)');
      const leg = calculate({ ...JOINT, size_basis: 'leg', size_m: 0.005 * Math.SQRT2 }).outputs;
      assertClose(leg.throat_m, 0.005, { rel: 1e-12 }, 'a from z');
      assertClose(leg.leg_m, 0.005 * Math.SQRT2, { rel: 1e-12 }, 'z');
    },
  },
  {
    name: 'Geometric limits: a 2.5 mm flagged (< 3 mm); a 8 mm on 10 mm plate flagged (> 0.7 t); 20 mm weld flagged (< 30 mm and 6a); 1.2 m weld on a 5 mm throat flagged (> 150 a) with the β_Lw warning',
    source: 'EN 1993-1-8 §4.5.1–4.5.2 and §4.11',
    run: () => {
      assertEqual(calculate({ ...JOINT, size_m: 0.0025 }).outputs.geometry_check.includes('a < 3 mm'), true, 'min throat');
      assertEqual(calculate({ ...JOINT, size_m: 0.008 }).outputs.geometry_check.includes('0.7 t_min'), true, 'max throat');
      assertEqual(calculate({ ...JOINT, length_m: 0.02 }).outputs.geometry_check.includes('L_eff < max'), true, 'short weld');
      const long = calculate({ ...JOINT, length_m: 1.2 });
      assertEqual(long.outputs.geometry_check.includes('150 a'), true, 'long weld');
      assertEqual(long.warnings.some((w) => w.includes('β_Lw')), true, 'β_Lw warning');
      assertEqual(calculate(JOINT).outputs.geometry_check.startsWith('OK'), true, 'default OK');
    },
  },
  {
    name: 'Overload: 900 kN transverse on the same welds → FAIL with the required throat quoted; invalid inputs fail fast (no load, moment with one weld, unknown grade)',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const fail = calculate({ ...JOINT, force_transverse_n: 900e3 }).outputs;
      assertEqual(fail.verdict.startsWith('FAIL'), true, 'fail');
      assertEqual(fail.utilisation_directional > 100, true, 'over 100 %');
      assertThrows(() => calculate({ ...JOINT, force_transverse_n: 0, force_longitudinal_n: 0 }), 'at least one force', 'no load');
      assertThrows(() => calculate({ ...JOINT, moment_n_m: 1000, welds: 1 }), 'at least two parallel welds', 'moment');
      assertThrows(() => calculate({ ...JOINT, grade: 'S690' }), 'must be one of', 'grade');
    },
  },
];
