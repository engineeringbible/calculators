/**
 * roll-period/tests.js — checks against the IS Code 2008 rolling-period formula and MSC.1/Circ.1228.
 * Run: node run-tests.js roll-period
 */
import { calculate, isCodeC, rollPeriodS, encounterPeriodS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SHIP = { mode: 'gm', beam_m: 32, draft_m: 10, lwl_m: 205, lpp_m: 200, gm_m: 1.5, speed_kn: 15, heading_deg: 0, wave_input: 'period', wave_period_s: 10, hs_m: 4 };

export const tests = [
  {
    name: 'IS Code roll period: B 32 m, d 10 m, L_WL 205 m → C = 0.373 + 0.023·3.2 − 0.043·2.05 = 0.3585; GM 1.5 m → T_R = 2·0.3585·32/√1.5 = 18.73 s',
    source: 'IMO 2008 IS Code (MSC.267(85)) Part A §2.3.4',
    run: () => {
      assertClose(isCodeC(32, 10, 205), 0.35845, { abs: 1e-5 }, 'C');
      assertClose(rollPeriodS(32, 10, 205, 1.5), 18.733, { abs: 5e-3 }, 'T_R');
      const { outputs } = calculate(SHIP);
      assertClose(outputs.roll_period_s, 18.733, { abs: 5e-3 }, 'output');
      assertClose(outputs.gm_out_m, 1.5, { rel: 1e-12 }, 'GM echoed');
    },
  },
  {
    name: 'Observed period 18.73 s returns GM 1.5 m (inverse of the same formula); a stiffer ship (GM 3 m) rolls in 13.2 s',
    source: 'Rolling-period test inversion GM = (2 C B / T_R)²',
    run: () => {
      const { outputs } = calculate({ ...SHIP, mode: 'observed', observed_period_s: 18.733 });
      assertClose(outputs.gm_out_m, 1.5, { rel: 1e-3 }, 'GM');
      assertClose(calculate({ ...SHIP, gm_m: 3 }).outputs.roll_period_s, 18.733 / Math.sqrt(2), { rel: 1e-3 }, 'GM 3 m');
    },
  },
  {
    name: 'Encounter period (Circ.1228 §1.6): T_W 10 s, V 15 kn → head seas 6.67 s, beam seas 10 s, following seas 20 s; λ = 156 m (§1.5); wave celerity 30.3 kn',
    source: 'MSC.1/Circ.1228 §1.5–1.6: λ = 1.56 T_W², T_E = 3 T_W²/(3 T_W + V cos α)',
    run: () => {
      assertClose(encounterPeriodS(10, 15, 0), 300 / 45, { rel: 1e-12 }, 'head');
      assertClose(encounterPeriodS(10, 15, 90), 10, { rel: 1e-9 }, 'beam');
      assertClose(encounterPeriodS(10, 15, 180), 300 / 15, { rel: 1e-9 }, 'following');
      const { outputs } = calculate(SHIP);
      assertClose(outputs.wave_length_m_out, 156, { rel: 1e-12 }, 'λ');
      assertClose(outputs.encounter_period_s, 6.667, { abs: 1e-3 }, 'T_E head');
      assertClose(outputs.wave_speed_kn, 15.6 / (1852 / 3600), { rel: 1e-9 }, 'celerity');
      const byLength = calculate({ ...SHIP, wave_input: 'length', wave_length_m: 156 }).outputs;
      assertClose(byLength.wave_period_s_out, 10, { rel: 1e-9 }, 'period from length');
    },
  },
  {
    name: 'Synchronous rolling: stern-quartering seas (α 135°) at 15 kn in 14 s waves give T_E = 18.7 s = T_R → DANGER; beam seas of 18.73 s period also; 10 s head seas are clear',
    source: 'MSC.1/Circ.1228 §3.2 and §4.2.3.1 (T_E nearly equal to T_R)',
    run: () => {
      const quartering = calculate({ ...SHIP, heading_deg: 135, wave_period_s: 14 });
      assertClose(quartering.outputs.encounter_period_s, 18.73, { abs: 0.1 }, 'T_E');
      assertEqual(quartering.outputs.synchronous_status.startsWith('DANGER'), true, 'danger');
      const beam = calculate({ ...SHIP, heading_deg: 90, wave_period_s: 18.733 });
      assertEqual(beam.outputs.synchronous_status.startsWith('DANGER'), true, 'beam danger');
      assertEqual(calculate(SHIP).outputs.synchronous_status.startsWith('Clear'), true, 'clear');
    },
  },
  {
    name: 'Parametric rolling 1:0.5: head seas at 15 kn with T_W = 12.98 s give T_E = 9.37 s = T_R/2 and λ/L = 1.31 → DANGER; the same ratio with a 400 m ship (λ/L 0.66) is still in band, with a 100 m ship (λ/L 2.6) only caution',
    source: 'MSC.1/Circ.1228 §3.3 and §4.2.3.2 (T_E ≈ 0.5 T_R), §3.1.2 (stability variation for λ 0.6–2.3 L)',
    run: () => {
      const r = calculate({ ...SHIP, wave_period_s: 12.98 });
      assertClose(r.outputs.encounter_ratio, 0.5, { abs: 0.01 }, 'ratio 0.5');
      assertEqual(r.outputs.parametric_status.startsWith('DANGER'), true, 'danger');
      const big = calculate({ ...SHIP, wave_period_s: 12.98, lpp_m: 400 });
      assertEqual(big.outputs.parametric_status.startsWith('DANGER'), true, 'λ/L 0.66 still in band');
      const small = calculate({ ...SHIP, wave_period_s: 12.98, lpp_m: 100 });
      assertEqual(small.outputs.parametric_status.startsWith('Caution'), true, 'λ/L 2.6 outside band');
    },
  },
  {
    name: 'Surf-riding (§4.2.1): L 200 m following seas → limit 1.8 √200 = 25.5 kn, marginal from 19.8 kn; 26 kn DANGER, 22 kn marginal, 15 kn clear; at α = 150° the limit is 29.4 kn; head seas and exactly 135° not applicable (strict 135° < α < 225°)',
    source: 'MSC.1/Circ.1228 §4.2.1 and figure 2',
    run: () => {
      const danger = calculate({ ...SHIP, heading_deg: 180, speed_kn: 26 });
      assertClose(danger.outputs.surf_speed_limit_kn, 1.8 * Math.sqrt(200), { rel: 1e-9 }, 'limit');
      assertEqual(danger.outputs.surf_status.startsWith('DANGER'), true, 'danger');
      assertEqual(calculate({ ...SHIP, heading_deg: 180, speed_kn: 22 }).outputs.surf_status.startsWith('Marginal'), true, 'marginal');
      assertEqual(calculate({ ...SHIP, heading_deg: 180, speed_kn: 15 }).outputs.surf_status.startsWith('Clear'), true, 'clear');
      assertClose(calculate({ ...SHIP, heading_deg: 150 }).outputs.surf_speed_limit_kn, (1.8 * Math.sqrt(200)) / Math.cos(Math.PI / 6), { rel: 1e-9 }, 'quartering limit');
      assertEqual(calculate({ ...SHIP, heading_deg: 135 }).outputs.surf_speed_limit_kn, null, 'boundary excluded');
      assertEqual(calculate(SHIP).outputs.surf_status.startsWith('Not applicable'), true, 'head seas');
      assertEqual(calculate(SHIP).outputs.surf_speed_limit_kn, null, 'no limit in head seas');
    },
  },
  {
    name: 'Successive high-wave attack (§4.2.2): λ 180 m (> 0.8 L), H_s 9 m (> 0.04 L), following seas 15 kn → T_W 10.74 s, T_E 20.1 s, T_E/T_W 1.87 in 1.8–3.0 → DANGER; with H_s 4 m not critical',
    source: 'MSC.1/Circ.1228 §4.2.2.1–4.2.2.2',
    run: () => {
      const r = calculate({ ...SHIP, heading_deg: 180, wave_input: 'length', wave_length_m: 180, hs_m: 9 });
      assertClose(r.outputs.wave_period_s_out, Math.sqrt(180 / 1.56), { rel: 1e-9 }, 'T_W');
      assertClose(r.outputs.encounter_period_s / r.outputs.wave_period_s_out, 1.87, { abs: 0.02 }, 'T_E/T_W');
      assertEqual(r.outputs.high_wave_status.startsWith('DANGER'), true, 'danger');
      const low = calculate({ ...SHIP, heading_deg: 180, wave_input: 'length', wave_length_m: 180, hs_m: 4 });
      assertEqual(low.outputs.high_wave_status.startsWith('Not critical'), true, 'not critical');
    },
  },
  {
    name: 'Overtaking waves and riding with them: 25 kn in 6 s following seas gives a negative formula value reported as 15.4 s with a warning; V cos α = −3 T_W gives T_E → ∞',
    source: 'Behaviour of the §1.6 formula when the denominator is zero or negative',
    run: () => {
      const r = calculate({ ...SHIP, heading_deg: 180, speed_kn: 25, wave_period_s: 6 });
      assertClose(r.outputs.encounter_period_s, 108 / 7, { rel: 1e-9 }, '|T_E|');
      assertEqual(r.warnings.some((w) => w.includes('faster than the waves')), true, 'warning');
      assertEqual(encounterPeriodS(6, 18, 180), Infinity, 'infinite');
      const riding = calculate({ ...SHIP, heading_deg: 180, speed_kn: 18, wave_period_s: 6 });
      assertEqual(riding.outputs.encounter_period_s, null, 'null T_E');
      assertEqual(riding.outputs.synchronous_status.includes('running with the waves'), true, 'text');
    },
  },
  {
    name: 'Critical speed: on a 135° heading in 14 s waves T_E = T_R at 15 kn (the synchronous case above); invalid inputs fail fast (GM ≤ 0, heading > 360)',
    source: 'Inversion of the encounter formula; validation contract',
    run: () => {
      const r = calculate({ ...SHIP, heading_deg: 135, wave_period_s: 14 });
      assertClose(r.outputs.te_critical_speed_kn, 15, { abs: 0.3 }, 'critical speed');
      assertThrows(() => calculate({ ...SHIP, gm_m: 0 }), 'greater than zero', 'GM');
      assertThrows(() => calculate({ ...SHIP, heading_deg: 400 }), 'between', 'heading');
    },
  },
];
