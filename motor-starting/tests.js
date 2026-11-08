/**
 * motor-starting/tests.js — checks of rated current, starting-method factors, the voltage-dip divider and torque.
 * Run: node run-tests.js motor-starting
 */
import { calculate, voltageDip } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PUMP = { motor_power_kw: 200, voltage_v: 440, efficiency: 0.94, power_factor: 0.85, lrc_multiple: 7, lrt_multiple: 2, method: 'dol', tap: 0.65, soft_limit: 3.5, vfd_multiple: 1.2, source: 'generator', generator_kva: 1500, reactance_pu: 0.25, short_circuit_mva: 20, dip_limit_pct: 15, load_torque_pct: 30 };

export const tests = [
  {
    name: 'Rated current: 200 kW at 440 V, η 0.94, cos φ 0.85 → input 250.3 kVA, I_n = 250 313/(√3 × 440) = 328.4 A; DOL 7 × I_n = 2 299 A, 1 752 kVA',
    source: 'I_n = P/(√3 V η cos φ); S = √3 V I',
    run: () => {
      const { outputs } = calculate(PUMP);
      assertClose(outputs.input_kva, 200 / (0.94 * 0.85), { rel: 1e-12 }, 'input kVA');
      assertClose(outputs.rated_current_a, 200000 / (Math.sqrt(3) * 440 * 0.94 * 0.85), { rel: 1e-12 }, 'I_n');
      assertClose(outputs.rated_current_a, 328.4, { abs: 0.1 }, 'I_n value');
      assertClose(outputs.start_current_a, 7 * outputs.rated_current_a, { rel: 1e-12 }, 'DOL current');
      assertClose(outputs.start_kva, 7 * outputs.input_kva, { rel: 1e-12 }, 'start kVA');
      assertClose(outputs.start_kva, 1752.2, { abs: 0.1 }, 'start kVA value');
    },
  },
  {
    name: 'Generator dip (divider, Cummins form): s = 1 752/1 500 = 1.168, X\'d 0.25 → dip = 0.292/1.292 = 22.6 % → EXCEEDED against 15 %; DOL torque 2 × (1 − 0.226)² = 1.20',
    source: 'Cummins motor-starting white paper: dip = S_start/(S_gen/X + S_start)',
    run: () => {
      const r = calculate(PUMP);
      const s = r.outputs.start_kva / 1500;
      assertClose(r.outputs.voltage_dip_pct, ((0.25 * s) / (1 + 0.25 * s)) * 100, { rel: 1e-12 }, 'formula');
      assertClose(r.outputs.voltage_dip_pct, 22.6, { abs: 0.05 }, 'value');
      assertClose(voltageDip('generator', 1752.2e3, { generatorVa: 1500e3, reactancePu: 0.25 }), 1752.2e3 / (1500e3 / 0.25 + 1752.2e3), { rel: 1e-12 }, 'equivalent short-circuit form');
      assertEqual(r.outputs.dip_check.startsWith('EXCEEDED') && r.warnings.some((w) => w.includes('exceeds the 15 % limit')), true, 'exceeded');
      assertClose(r.outputs.start_torque_pu, 2 * (1 - r.outputs.voltage_dip_pct / 100) ** 2, { rel: 1e-12 }, 'torque');
      assertClose(r.outputs.start_torque_pu, 1.20, { abs: 0.01 }, 'torque value');
    },
  },
  {
    name: 'Star-delta: 1/3 of DOL → 584.1 kVA, dip 8.87 % → OK; torque 2/3 × (1 − 0.0887)² = 0.554 ≥ 0.33 (30 % + 10 %) → OK; DOL dip still reported for comparison (22.6 %)',
    source: 'Star-delta current and torque factor 1/3',
    run: () => {
      const r = calculate({ ...PUMP, method: 'star_delta' }).outputs;
      assertClose(r.start_multiple, 7 / 3, { rel: 1e-12 }, 'multiple');
      assertClose(r.start_kva, 1752.2 / 3, { abs: 0.05 }, 'kVA');
      assertClose(r.voltage_dip_pct, 8.87, { abs: 0.02 }, 'dip');
      assertEqual(r.dip_check.startsWith('OK'), true, 'dip OK');
      assertClose(r.start_torque_pu, (2 / 3) * (1 - r.voltage_dip_pct / 100) ** 2, { rel: 1e-12 }, 'torque');
      assertEqual(r.torque_check.startsWith('OK'), true, 'torque OK');
      assertClose(r.dol_dip_pct, 22.6, { abs: 0.05 }, 'DOL comparison');
    },
  },
  {
    name: 'Autotransformer 65 % tap: current and torque × 0.4225; soft starter at 3.5 × I_n: torque factor (3.5/7)² = 0.25; drive at 1.2 × I_n gives 1.2 × rated torque and a dip of about 4.7 %',
    source: 'Reduced-voltage starting relations (IEC 60034-12 background; manufacturer practice)',
    run: () => {
      const at = calculate({ ...PUMP, method: 'autotransformer' }).outputs;
      assertClose(at.start_multiple, 7 * 0.65 ** 2, { rel: 1e-12 }, 'autotransformer current');
      assertClose(at.start_torque_pu, 2 * 0.4225 * (1 - at.voltage_dip_pct / 100) ** 2, { rel: 1e-12 }, 'autotransformer torque');
      const ss = calculate({ ...PUMP, method: 'soft_starter' }).outputs;
      assertClose(ss.start_multiple, 3.5, { rel: 1e-12 }, 'soft current');
      assertClose(ss.start_torque_pu, 2 * 0.25 * (1 - ss.voltage_dip_pct / 100) ** 2, { rel: 1e-12 }, 'soft torque');
      const vfd = calculate({ ...PUMP, method: 'vfd' }).outputs;
      assertClose(vfd.start_torque_pu, 1.2, { rel: 1e-12 }, 'VFD torque');
      assertClose(vfd.voltage_dip_pct, 4.7, { abs: 0.1 }, 'VFD dip');
    },
  },
  {
    name: 'Network supply: S_sc 20 MVA, DOL 1.752 MVA → dip = 1.752/(20 + 1.752) = 8.05 %; a weak 5 MVA supply gives 25.9 % with warnings',
    source: 'dip = S_start/(S_sc + S_start)',
    run: () => {
      const net = calculate({ ...PUMP, source: 'network' }).outputs;
      assertClose(net.voltage_dip_pct, (1.7522 / (20 + 1.7522)) * 100, { abs: 0.01 }, 'strong network');
      assertClose(net.start_to_source_ratio, net.start_kva / 20000, { rel: 1e-12 }, 'ratio');
      const weak = calculate({ ...PUMP, source: 'network', short_circuit_mva: 5 });
      assertClose(weak.outputs.voltage_dip_pct, 25.95, { abs: 0.05 }, 'weak network');
      assertEqual(weak.warnings.some((w) => w.includes('below 80 %')), true, 'contactor warning');
    },
  },
  {
    name: 'Torque shortfall and validation: a loaded conveyor (110 % load torque) cannot start on star-delta → INSUFFICIENT with warning; zero voltage and an unknown method are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const conveyor = calculate({ ...PUMP, method: 'star_delta', load_torque_pct: 110 });
      assertEqual(conveyor.outputs.torque_check.startsWith('INSUFFICIENT') && conveyor.warnings.some((w) => w.includes('may stall')), true, 'stall');
      assertThrows(() => calculate({ ...PUMP, voltage_v: 0 }), 'greater than zero', 'voltage');
      assertThrows(() => calculate({ ...PUMP, method: 'pony_motor' }), 'must be one of', 'method');
    },
  },
];
