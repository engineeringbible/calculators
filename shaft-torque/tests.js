/**
 * shaft-torque/tests.js — checks against the torsion formulas (Shigley, Hibbeler) and the IACS UR M68 rule.
 * Run: node run-tests.js shaft-torque
 */
import { calculate, torqueFromPowerNm, shearStressPa, requiredOuterDiameterM, iacsRuleDiameterMm } from './calc.js';
import { polarMomentCircle } from '../shared/sections.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Torque from power: 8 000 kW at 90 rpm = 9 549.3 × 8 000 / 90 = 848.8 kN·m; 1 kW at 1 rpm = 9 549.3 N·m',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eq. 3-42: T = 9.55 P/n (P in W, n in rpm)",
    run: () => {
      assertClose(torqueFromPowerNm(1000, 1), 9549.3, { abs: 0.1 }, '9 549.3 constant');
      assertClose(torqueFromPowerNm(8e6, 90), 848826, { abs: 1 }, '8 MW at 90 rpm');
      const { outputs } = calculate({});
      assertClose(outputs.torque_nm, 848826, { abs: 1 }, 'in calculate()');
    },
  },
  {
    name: 'Solid 450 mm shaft: J = π d⁴/32 = 402 590 cm⁴, τ = 16 T/(π d³) = 47.4 MPa, twist 1.51° over 10 m at G = 80 GPa',
    source: 'Hibbeler, Mechanics of Materials, ch. 5: τ_max = T c / J, φ = T L / (J G)',
    run: () => {
      assertClose(polarMomentCircle(0.45), (Math.PI * 0.45 ** 4) / 32, { rel: 1e-12 }, 'J');
      assertClose(shearStressPa(848826, 0.45), (16 * 848826) / (Math.PI * 0.45 ** 3), { rel: 1e-12 }, 'τ formula');
      const { outputs } = calculate({});
      assertClose(outputs.polar_moment_m4 * 1e8, 402590, { abs: 20 }, 'J value');
      assertClose(outputs.shear_stress_pa, 47.44e6, { abs: 0.02e6 }, 'τ value');
      assertClose(outputs.twist_deg, 1.510, { abs: 2e-3 }, 'twist');
      assertClose(outputs.twist_deg_per_m, 0.1510, { abs: 2e-4 }, 'twist per metre');
    },
  },
  {
    name: 'Hollow shaft 450/150 mm: J reduced by (1 − (1/3)⁴) = 98.8 %, stress up 1.25 %; a 450/315 mm tube (ratio 0.7) has 76 % of the solid J',
    source: 'J = π (d_o⁴ − d_i⁴)/32 (Hibbeler ch. 5)',
    run: () => {
      const solid = polarMomentCircle(0.45);
      assertClose(polarMomentCircle(0.45, 0.15) / solid, 1 - (1 / 3) ** 4, { rel: 1e-12 }, 'J ratio 150 bore');
      assertClose(polarMomentCircle(0.45, 0.315) / solid, 1 - 0.7 ** 4, { rel: 1e-12 }, 'J ratio 315 bore');
      const hollow = calculate({ shaft_type: 'hollow', inner_diameter_m: 0.15 }).outputs;
      assertClose(hollow.shear_stress_pa / 47.44e6, 1 / (1 - (1 / 3) ** 4), { rel: 1e-3 }, 'stress ratio');
    },
  },
  {
    name: 'Required diameter for 55 MPa allowable: solid d = (16 T / π τ)^(1/3) = 428 mm; with bore ratio 0.5 the outer diameter is 438 mm',
    source: 'Inversion of τ = 16 T / (π d³ (1 − q⁴)) (Reeds Vol. 2, Applied Mechanics, "Torsion")',
    run: () => {
      assertClose(requiredOuterDiameterM(848826, 55e6), ((16 * 848826) / (Math.PI * 55e6)) ** (1 / 3), { rel: 1e-12 }, 'formula');
      assertClose(requiredOuterDiameterM(848826, 55e6) * 1000, 428.4, { abs: 0.2 }, 'solid value');
      assertClose(requiredOuterDiameterM(848826, 55e6, 0.5) * 1000, 428.4 / (1 - 0.5 ** 4) ** (1 / 3), { rel: 1e-3 }, 'hollow value');
      const { outputs } = calculate({});
      assertClose(outputs.required_diameter_m * 1000, 428.4, { abs: 0.2 }, 'in calculate()');
      assertClose(outputs.stress_utilisation_pct, (47.44 / 55) * 100, { abs: 0.1 }, 'utilisation');
    },
  },
  {
    name: 'Combined loading with M = 200 kN·m: T_e = √(200² + 848.8²) = 872.1 kN·m, M_e = 536.0 kN·m, τ_max 48.7 MPa, σ_max 59.9 MPa',
    source: 'Reeds Vol. 2, Applied Mechanics, equivalent torque (Tresca) and equivalent bending moment (Rankine); Shigley §5-4',
    run: () => {
      const { outputs } = calculate({ bending_moment_nm: 200000 });
      assertClose(outputs.equivalent_torque_nm, Math.sqrt(200000 ** 2 + 848826 ** 2), { rel: 1e-6 }, 'T_e');
      assertClose(outputs.equivalent_torque_nm, 872070, { abs: 20 }, 'T_e value');
      assertClose(outputs.equivalent_moment_nm, (200000 + 872070) / 2, { abs: 20 }, 'M_e');
      assertClose(outputs.combined_shear_pa, (16 * 872070) / (Math.PI * 0.45 ** 3), { rel: 1e-4 }, 'τ combined');
      assertClose(outputs.combined_principal_pa, (32 * 536035) / (Math.PI * 0.45 ** 3), { rel: 1e-4 }, 'σ combined');
      assertEqual(calculate({}).outputs.equivalent_torque_nm, null, 'null without bending');
    },
  },
  {
    name: 'IACS UR M68: 8 000 kW, 90 rpm, solid, σ_B 600, F 100, k 1.0 → d = 100 × (88.89 × 560/760)^(1/3) = 403 mm; k 1.26 propeller shaft → 508 mm',
    source: 'IACS UR M68 Rev. 2 (2015), §2.1: d = F k [P/(n(1 − Q⁴)) × 560/(σ_B + 160)]^(1/3)',
    run: () => {
      assertClose(iacsRuleDiameterMm(8000, 90, 0, 600, 100, 1.0), 100 * ((8000 / 90) * (560 / 760)) ** (1 / 3), { rel: 1e-12 }, 'formula');
      assertClose(iacsRuleDiameterMm(8000, 90, 0, 600, 100, 1.0), 403.1, { abs: 0.2 }, 'value');
      const { outputs } = calculate({});
      assertClose(outputs.rule_diameter_m * 1000, 403.1, { abs: 0.2 }, 'in calculate()');
      assertClose(outputs.rule_margin_pct, ((450 - 403.1) / 403.1) * 100, { abs: 0.1 }, 'margin');
      const propeller = calculate({ rule_k: 'propeller_keyed' }).outputs;
      assertClose(propeller.rule_diameter_m * 1000, 403.1 * 1.26, { abs: 0.3 }, 'k = 1.26');
      const hollow = iacsRuleDiameterMm(8000, 90, 0.5, 600, 100, 1.0);
      assertClose(hollow / 403.1, (1 / (1 - 0.5 ** 4)) ** (1 / 3), { rel: 1e-3 }, 'bore ratio effect');
    },
  },
  {
    name: 'Warnings: undersized shaft (300 mm) exceeds both the allowable stress and the rule minimum; excessive twist is flagged',
    source: 'Behaviour specification; 0.25°/m stiffness rule of thumb for machine shafting',
    run: () => {
      const small = calculate({ outer_diameter_m: 0.3 });
      assertEqual(small.warnings.some((w) => w.includes('exceeds the allowable')), true, 'stress warning');
      assertEqual(small.warnings.some((w) => w.includes('below the IACS UR M68 minimum')), true, 'rule warning');
      assertEqual(small.warnings.some((w) => w.includes('Twist exceeds 0.25°')), true, 'twist warning');
    },
  },
  {
    name: 'Unit layer: 848.8 kN·m = 626 100 lbf·ft; 8 000 kW = 10 728 hp; 90 rpm = 9.425 rad/s',
    source: 'NIST SP 811: 1 lbf·ft = 1.355818 N·m, 1 hp = 745.6999 W',
    run: () => {
      assertClose(convert(848826, 'N_m', 'lbf_ft', 'torque'), 626060, { abs: 20 }, 'torque');
      assertClose(convert(8e6, 'W', 'hp', 'power'), 10728, { abs: 1 }, 'power');
      assertClose(convert(90, 'rpm', 'rad_s', 'rotational_speed'), 9.4248, { abs: 1e-4 }, 'speed');
    },
  },
  {
    name: 'Invalid inputs fail fast: bore not smaller than the outer diameter, zero speed, tensile strength outside the rule range',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ shaft_type: 'hollow', inner_diameter_m: 0.5 }), 'less than the outer diameter', 'bore');
      assertThrows(() => calculate({ speed_rpm: 0 }), 'greater than zero', 'speed');
      assertThrows(() => calculate({ tensile_strength_pa: 900e6 }), 'between', 'σ_B');
    },
  },
];
