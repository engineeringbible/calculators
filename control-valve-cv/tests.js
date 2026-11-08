/**
 * control-valve-cv/tests.js — checks of the IEC 60534-2-1 liquid sizing equations and the choked-flow logic.
 * Run: node run-tests.js control-valve-cv
 */
import { calculate, requiredKv, CV_PER_KV, VALVE_TYPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const WATER = { flow_m3_h: 100, density_kg_m3: 998, p1_bar_a: 6, p2_bar_a: 4, pv_bar_a: 0.023, pc_bar_a: 221.2, valve_type: 'globe_single', fl_custom: 0.8, rated_kv: 100, pipe_diameter_mm: 100 };

export const tests = [
  {
    name: 'Basic sizing: 100 m³/h of water (ρ 998) across 2 bar → Kv = 100 √(0.998/2) = 70.64, Cv = 1.156 Kv = 81.7; opening 70.6 % of a Kv 100 valve → OK',
    source: 'IEC 60534-2-1 eq. 1 (Kv = Q √(ρ/ρ₀/Δp)); Cv/Kv = 1.156',
    run: () => {
      const { outputs } = calculate(WATER);
      assertClose(outputs.dp_actual_bar, 2, { rel: 1e-12 }, 'Δp');
      assertClose(outputs.kv, 100 * Math.sqrt(0.998 / 2), { rel: 1e-12 }, 'Kv formula');
      assertClose(outputs.kv, 70.64, { abs: 0.01 }, 'Kv value');
      assertClose(outputs.cv, outputs.kv * 1.156, { rel: 1e-12 }, 'Cv');
      assertClose(outputs.cv, 81.66, { abs: 0.02 }, 'Cv value');
      assertClose(outputs.opening_pct, 70.64, { abs: 0.01 }, 'opening');
      assertEqual(outputs.opening_check.startsWith('OK'), true, 'OK');
      assertClose(requiredKv(100, 1000, 1), 100, { rel: 1e-12 }, 'definition: 100 m³/h water at 1 bar = Kv 100');
      assertEqual(CV_PER_KV, 1.156, 'ratio');
    },
  },
  {
    name: 'Choked-flow limit: F_F = 0.96 − 0.28 √(0.023/221.2) = 0.9571; Δp_max = 0.9² × (6 − 0.9571 × 0.023) = 4.842 bar; the 2 bar drop is 41 % of it → non-cavitating',
    source: 'IEC 60534-2-1 eqs. for F_F and Δp_max (choked flow)',
    run: () => {
      const { outputs } = calculate(WATER);
      assertClose(outputs.ff, 0.96 - 0.28 * Math.sqrt(0.023 / 221.2), { rel: 1e-12 }, 'F_F');
      assertClose(outputs.ff, 0.9571, { abs: 1e-4 }, 'F_F value');
      assertClose(outputs.dp_max_bar, 0.81 * (6 - outputs.ff * 0.023), { rel: 1e-12 }, 'Δp_max');
      assertClose(outputs.dp_max_bar, 4.842, { abs: 1e-3 }, 'Δp_max value');
      assertClose(outputs.dp_sizing_bar, 2, { rel: 1e-12 }, 'sizing Δp = actual');
      assertEqual(outputs.flow_regime.startsWith('Turbulent, non-cavitating'), true, 'regime');
      assertClose(outputs.cavitation_ratio, 2 / (6 - 0.023), { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'Choked case: p₂ 0.5 bar abs gives Δp 5.5 bar > 4.84 → sized on Δp_max: Kv = 100 √(0.998/4.842) = 45.4 (not 42.6 on the actual drop); maximum flow through a Kv 100 valve = 100 √(4.842/0.998) = 220 m³/h; warning',
    source: 'IEC 60534-2-1 choked liquid flow; Fisher Control Valve Handbook ch. 5',
    run: () => {
      const r = calculate({ ...WATER, p2_bar_a: 0.5 });
      assertClose(r.outputs.dp_sizing_bar, r.outputs.dp_max_bar, { rel: 1e-12 }, 'sizing on Δp_max');
      assertClose(r.outputs.kv, 100 * Math.sqrt(0.998 / r.outputs.dp_max_bar), { rel: 1e-12 }, 'Kv choked');
      assertClose(r.outputs.kv, 45.4, { abs: 0.05 }, 'Kv value');
      assertClose(100 * Math.sqrt(0.998 / 5.5), 42.6, { abs: 0.05 }, 'actual-drop Kv for reference');
      assertClose(r.outputs.max_flow_choked_m3_h, 100 * Math.sqrt(r.outputs.dp_max_bar / 0.998), { rel: 1e-12 }, 'max flow');
      assertClose(r.outputs.max_flow_choked_m3_h, 220.3, { abs: 0.2 }, 'max flow value');
      assertEqual(r.outputs.flow_regime.startsWith('CHOKED') && r.warnings.some((w) => w.includes('Choked flow')), true, 'flagged');
    },
  },
  {
    name: 'Valve styles and incipient cavitation: a butterfly at 90° (F_L 0.55) has Δp_max 0.55² × 5.978 = 1.81 bar, so the 2 bar drop is choked; a globe valve with p₂ 2.2 bar (Δp 3.8 = 78 % of Δp_max) is flagged as near cavitation',
    source: 'Typical F_L values (Fisher handbook); 70 % incipient-cavitation rule',
    run: () => {
      const bf = calculate({ ...WATER, valve_type: 'butterfly_90' });
      assertClose(bf.outputs.dp_max_bar, 0.55 ** 2 * (6 - bf.outputs.ff * 0.023), { rel: 1e-12 }, 'butterfly Δp_max');
      assertEqual(bf.outputs.flow_regime.startsWith('CHOKED'), true, 'butterfly choked');
      const near = calculate({ ...WATER, p2_bar_a: 2.2 });
      assertEqual(near.outputs.flow_regime.startsWith('Turbulent, near cavitation') && near.warnings.some((w) => w.includes('incipient cavitation')), true, 'near cavitation');
      assertEqual(VALVE_TYPES.globe_single.fl === 0.9 && VALVE_TYPES.butterfly_90.fl === 0.55, true, 'F_L table');
      const custom = calculate({ ...WATER, valve_type: 'custom', fl_custom: 0.7 }).outputs;
      assertClose(custom.fl, 0.7, { rel: 1e-12 }, 'custom F_L');
    },
  },
  {
    name: 'Selection and velocity: a Kv 75 valve puts the duty at 94 % → UNDERSIZED; Kv 500 → 14 % OVERSIZED; no valve (0) gives guidance; 100 m³/h in a 100 mm pipe is 3.54 m/s, in 80 mm 5.5 m/s with a velocity warning',
    source: 'Sizing practice (60–80 % at maximum flow); liquid velocity limits 3–4 m/s',
    run: () => {
      assertEqual(calculate({ ...WATER, rated_kv: 75 }).outputs.opening_check.startsWith('UNDERSIZED'), true, 'undersized');
      assertEqual(calculate({ ...WATER, rated_kv: 500 }).outputs.opening_check.startsWith('OVERSIZED'), true, 'oversized');
      const none = calculate({ ...WATER, rated_kv: 0 }).outputs;
      assertEqual(none.opening_pct === null && none.opening_check.startsWith('No valve selected'), true, 'no valve');
      assertClose(calculate(WATER).outputs.pipe_velocity_m_s, (100 / 3600) / (Math.PI * 0.05 ** 2), { rel: 1e-12 }, 'velocity');
      assertClose(calculate(WATER).outputs.pipe_velocity_m_s, 3.54, { abs: 0.01 }, 'velocity value');
      const fast = calculate({ ...WATER, pipe_diameter_mm: 80 });
      assertEqual(fast.outputs.pipe_velocity_m_s > 4 && fast.warnings.some((w) => w.includes('above 4 m/s')), true, 'velocity warning');
    },
  },
  {
    name: 'Validation: outlet pressure not below inlet, vapour pressure at the inlet pressure (flashing) and an unknown valve type are rejected',
    source: 'Validation contract; flashing excluded',
    run: () => {
      assertThrows(() => calculate({ ...WATER, p2_bar_a: 6 }), 'below the inlet', 'p₂');
      assertThrows(() => calculate({ ...WATER, pv_bar_a: 6.5 }), 'flashes', 'flashing');
      assertThrows(() => calculate({ ...WATER, valve_type: 'gate' }), 'must be one of', 'type');
    },
  },
];
