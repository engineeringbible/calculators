/**
 * mooring-line-meg4/tests.js — checks of the MEG4 percentages, the drum-layer derating and the checks.
 * Run: node run-tests.js mooring-line-meg4
 */
import { calculate, MEG4, TAIL_FACTORS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SHIP = { sdmbl_kn: 1000, line_mbl_kn: 1030, tail_type: 'synthetic', tail_mbl_kn: 1300, expected_line_load_kn: 350, drum_diameter_mm: 600, rope_diameter_mm: 44, layer: 3, brake_test_kn: 600 };

export const tests = [
  {
    name: 'MEG4 values for SDMBL 1 000 kN: LDBF 1 000–1 050 kN, WLL 500 kN, tail ≥ 1 250 kN (synthetic) / 1 300 kN (wire), fitting SWL ≥ 1 250 kN, brake design 800 kN, rendering 600 kN',
    source: 'OCIMF MEG4 (2018) sections 5 and 6; MSC.1/Circ.1175 (fittings 1.25 × MBL)',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.ldbf_min_kn, 1000, { rel: 1e-12 }, 'LDBF min');
      assertClose(outputs.ldbf_max_kn, 1050, { rel: 1e-12 }, 'LDBF max');
      assertClose(outputs.wll_kn, 500, { rel: 1e-12 }, 'WLL');
      assertClose(outputs.tail_min_kn, 1250, { rel: 1e-12 }, 'tail synthetic');
      assertClose(calculate({ ...SHIP, tail_type: 'wire' }).outputs.tail_min_kn, 1300, { rel: 1e-12 }, 'tail wire');
      assertClose(outputs.fitting_swl_kn, 1250, { rel: 1e-12 }, 'fitting SWL');
      assertClose(outputs.brake_design_kn, 800, { rel: 1e-12 }, 'brake design');
      assertClose(outputs.brake_render_kn, 600, { rel: 1e-12 }, 'rendering');
      assertEqual(MEG4.wll === 0.5 && MEG4.brakeDesign === 0.8 && MEG4.brakeRender === 0.6 && TAIL_FACTORS.synthetic.factor === 1.25, true, 'constants');
    },
  },
  {
    name: 'Drum layers: 600 mm drum, 44 mm rope → r₁ 322 mm, r₃ 410 mm, factor 0.785 → rendering 471 kN (47.1 % SDMBL) on the third layer; first layer factor 1',
    source: 'Constant brake torque: load ∝ 1/effective radius (MEG4 section 6)',
    run: () => {
      const { outputs, warnings } = calculate(SHIP);
      assertClose(outputs.layer_factor, 322 / 410, { rel: 1e-12 }, 'factor');
      assertClose(outputs.render_on_layer_kn, 600 * 322 / 410, { rel: 1e-12 }, 'rendering on layer 3');
      assertClose(outputs.render_on_layer_kn, 471.2, { abs: 0.1 }, 'value');
      assertClose(outputs.render_on_layer_pct, 47.12, { abs: 0.01 }, '%');
      assertEqual(warnings.some((w) => w.includes('Mooring on layer 3')), true, 'layer warning');
      const first = calculate({ ...SHIP, layer: 1 }).outputs;
      assertClose(first.layer_factor, 1, { rel: 1e-12 }, 'first layer');
      assertClose(first.render_on_layer_kn, 600, { rel: 1e-12 }, 'first layer load');
    },
  },
  {
    name: 'Line checks: 1 030 kN is within range (103 %); 950 kN too weak; 1 100 kN too strong (overloads fittings); expected load 350 kN = 70 % of WLL; 600 kN exceeds the WLL with a warning',
    source: 'MEG4 LDBF 100–105 % and WLL 50 % of SDMBL',
    run: () => {
      assertEqual(calculate(SHIP).outputs.line_check.startsWith('OK'), true, 'in range');
      const weak = calculate({ ...SHIP, line_mbl_kn: 950 });
      assertEqual(weak.outputs.line_check.startsWith('TOO WEAK') && weak.warnings.some((w) => w.includes('weaker than the system design')), true, 'weak');
      const strong = calculate({ ...SHIP, line_mbl_kn: 1100 });
      assertEqual(strong.outputs.line_check.startsWith('TOO STRONG') && strong.warnings.some((w) => w.includes('above 105 %')), true, 'strong');
      assertClose(calculate(SHIP).outputs.load_vs_wll_pct, 70, { rel: 1e-12 }, 'load/WLL');
      assertEqual(calculate({ ...SHIP, expected_line_load_kn: 600 }).warnings.some((w) => w.includes('exceeds the WLL')), true, 'WLL warning');
    },
  },
  {
    name: 'Tail and brake test: a 1 200 kN tail is too weak for a 1 000 kN SDMBL; a brake test at 700 kN (+16.7 %) or 500 kN (−16.7 %) calls for re-adjustment, 630 kN (+5 %) is OK',
    source: 'MEG4 tails 125–130 %; brake test tolerance (±10 % practice)',
    run: () => {
      const tail = calculate({ ...SHIP, tail_mbl_kn: 1200 });
      assertEqual(tail.outputs.tail_check.startsWith('TOO WEAK') && tail.warnings.some((w) => w.includes('Tail weaker')), true, 'tail');
      assertEqual(calculate({ ...SHIP, brake_test_kn: 700 }).outputs.brake_test_check.startsWith('RE-ADJUST'), true, 'high');
      assertEqual(calculate({ ...SHIP, brake_test_kn: 500 }).outputs.brake_test_check.startsWith('RE-ADJUST'), true, 'low');
      assertEqual(calculate({ ...SHIP, brake_test_kn: 630 }).outputs.brake_test_check.startsWith('OK'), true, 'ok');
      assertEqual(calculate({ ...SHIP, brake_test_kn: 0 }).outputs.brake_test_check, 'No brake test entered', 'none');
    },
  },
  {
    name: 'Scaling and validation: all values scale linearly with the SDMBL (2 000 kN doubles them); zero SDMBL, a fractional layer and an unknown tail type are rejected',
    source: 'Linearity of the MEG4 percentages; validation contract',
    run: () => {
      const big = calculate({ ...SHIP, sdmbl_kn: 2000, line_mbl_kn: 2060, tail_mbl_kn: 2600 }).outputs;
      assertClose(big.wll_kn, 1000, { rel: 1e-12 }, 'WLL ×2');
      assertClose(big.brake_render_kn, 1200, { rel: 1e-12 }, 'render ×2');
      assertThrows(() => calculate({ ...SHIP, sdmbl_kn: 0 }), 'greater than zero', 'SDMBL');
      assertThrows(() => calculate({ ...SHIP, layer: 2.5 }), 'whole number', 'layer');
      assertThrows(() => calculate({ ...SHIP, tail_type: 'chain' }), 'must be one of', 'tail');
    },
  },
];
