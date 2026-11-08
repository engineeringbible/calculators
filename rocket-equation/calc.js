/**
 * rocket-equation/calc.js — Tsiolkovsky rocket equation: delta-v from specific impulse (or exhaust velocity) and the
 * initial and final mass; the propellant mass needed for a delta-v; and the delta-v of up to three stages.
 *
 * Δv = v_e ln(m0 / mf), v_e = Isp g0 (g0 = 9.806 65 m/s²);  m_p = mf (e^(Δv/v_e) − 1);
 * staged: Δv = Σ v_e,i ln(m0,i / mf,i), each stage's m0 including all upper stages and the payload.
 * Schema units: SI — kg, s, m/s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const G0 = 9.80665;

export const schema = {
  id: 'rocket-equation',
  name: 'Rocket equation calculator (delta-v)',
  category: 'automotive',
  summary: 'Tsiolkovsky rocket equation: delta-v from Isp or exhaust velocity and the mass ratio, the propellant for a delta-v, and staging for up to three stages.',
  related: ['thrust-weight', 'mach-number', 'drag-lift', 'true-airspeed'],
  assumptions: [
    'The ideal rocket equation Δv = v_e ln(m0/mf) holds with no gravity, drag or steering losses; a launch from Earth to low orbit needs well over the 7.8 km/s orbital speed to cover them.',
    'Specific impulse converts to effective exhaust velocity with standard gravity: v_e = Isp × 9.806 65 m/s², whatever planet the rocket flies from.',
    'Isp and exhaust velocity are taken as constant through the burn; for a first stage, a value between the sea-level and vacuum figures is a fair average.',
    'In staging, each stage drops its empty (dry) mass at burnout and the next stage starts with everything above it plus the payload; interstage hardware belongs in the dry mass of the stage it leaves with.',
  ],
  notes: [
    'Verification 2026-11-08: Isp 300 s (v_e 2 942.0 m/s), 1 000 kg initial and 400 kg final mass: mass ratio 2.5, Δv 2 695.7 m/s, propellant 600 kg (60 %); 3 000 m/s from 400 kg final mass needs 709.0 kg of propellant. Two stages (payload 1 000 kg; 20 000 + 2 000 kg at 280 s; 4 000 + 500 kg at 320 s): 3 567.7 + 4 077.3 = 7 645.0 m/s. Checked by hand.',
  ],
  sources: [
    'G.P. Sutton and O. Biblarz, Rocket Propulsion Elements, 9th ed., Wiley 2017, Chapter 4 Flight performance (ideal Δv = v_e ln(m0/mf), multistage vehicles) and Chapter 2 (Isp = v_e / g0)',
    'H.D. Curtis, Orbital Mechanics for Engineering Students, 4th ed., Butterworth-Heinemann 2020, Chapter 11 Rocket vehicle dynamics (rocket equation, staging, gravity and drag losses)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'dv', options: [
      { value: 'dv', label: 'Delta-v from initial and final mass' },
      { value: 'prop', label: 'Propellant mass for a delta-v' },
      { value: 'stages', label: 'Delta-v of a multistage rocket' },
    ] },
    { id: 'exhaust', label: 'Engine performance given as', type: 'select', default: 'isp', options: [{ value: 'isp', label: 'Specific impulse Isp (s)' }, { value: 've', label: 'Exhaust velocity' }], visibleWhen: { mode: ['dv', 'prop'] } },
    { id: 'isp_s', label: 'Specific impulse Isp', group: 'time', unit: 's', default: 300, min: 1, max: 20000, visibleWhen: { mode: ['dv', 'prop'], exhaust: 'isp' } },
    { id: 've_m_s', label: 'Effective exhaust velocity', group: 'speed', unit: 'm_s', default: 2942, min: 10, max: 200000, visibleWhen: { mode: ['dv', 'prop'], exhaust: 've' } },
    { id: 'm0_kg', label: 'Initial mass (fuelled)', group: 'mass', unit: 'kg', default: 1000, min: 1e-4, max: 1e8, visibleWhen: { mode: 'dv' } },
    { id: 'mf_kg', label: 'Final mass (dry structure + payload)', group: 'mass', unit: 'kg', default: 400, min: 1e-4, max: 1e8, visibleWhen: { mode: ['dv', 'prop'] } },
    { id: 'dv_target_m_s', label: 'Delta-v required', group: 'speed', unit: 'm_s', default: 3000, min: 0, max: 100000, visibleWhen: { mode: 'prop' } },
    { id: 'stages', label: 'Number of stages', type: 'select', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }], visibleWhen: { mode: 'stages' } },
    { id: 'payload_kg', label: 'Payload on top of the last stage', group: 'mass', unit: 'kg', default: 1000, min: 0, max: 1e8, visibleWhen: { mode: 'stages' } },
    { id: 'isp1_s', label: 'Stage 1: Isp', group: 'time', unit: 's', default: 280, min: 1, max: 20000, visibleWhen: { mode: 'stages' } },
    { id: 'prop1_kg', label: 'Stage 1: propellant mass', group: 'mass', unit: 'kg', default: 20000, min: 0, max: 1e8, visibleWhen: { mode: 'stages' } },
    { id: 'dry1_kg', label: 'Stage 1: dry (empty) mass', group: 'mass', unit: 'kg', default: 2000, min: 0, max: 1e8, visibleWhen: { mode: 'stages' } },
    { id: 'isp2_s', label: 'Stage 2: Isp', group: 'time', unit: 's', default: 320, min: 1, max: 20000, visibleWhen: { mode: 'stages', stages: ['2', '3'] } },
    { id: 'prop2_kg', label: 'Stage 2: propellant mass', group: 'mass', unit: 'kg', default: 4000, min: 0, max: 1e8, visibleWhen: { mode: 'stages', stages: ['2', '3'] } },
    { id: 'dry2_kg', label: 'Stage 2: dry (empty) mass', group: 'mass', unit: 'kg', default: 500, min: 0, max: 1e8, visibleWhen: { mode: 'stages', stages: ['2', '3'] } },
    { id: 'isp3_s', label: 'Stage 3: Isp', group: 'time', unit: 's', default: 340, min: 1, max: 20000, visibleWhen: { mode: 'stages', stages: '3' } },
    { id: 'prop3_kg', label: 'Stage 3: propellant mass', group: 'mass', unit: 'kg', default: 1000, min: 0, max: 1e8, visibleWhen: { mode: 'stages', stages: '3' } },
    { id: 'dry3_kg', label: 'Stage 3: dry (empty) mass', group: 'mass', unit: 'kg', default: 150, min: 0, max: 1e8, visibleWhen: { mode: 'stages', stages: '3' } },
  ],
  outputs: [
    { id: 'dv_m_s', label: 'Delta-v', group: 'speed', unit: 'm_s', decimals: 1 },
    { id: 've_out_m_s', label: 'Effective exhaust velocity', group: 'speed', unit: 'm_s', decimals: 1 },
    { id: 'mass_ratio', label: 'Mass ratio m0 / mf', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'prop_kg', label: 'Propellant mass', group: 'mass', unit: 'kg', decimals: 1 },
    { id: 'm0_out_kg', label: 'Initial (lift-off) mass', group: 'mass', unit: 'kg', decimals: 1 },
    { id: 'prop_fraction', label: 'Propellant fraction of the initial mass', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'stage1_dv_m_s', label: 'Stage 1 delta-v', group: 'speed', unit: 'm_s', decimals: 1, visibleWhen: { mode: 'stages' } },
    { id: 'stage2_dv_m_s', label: 'Stage 2 delta-v', group: 'speed', unit: 'm_s', decimals: 1, visibleWhen: { mode: 'stages', stages: ['2', '3'] } },
    { id: 'stage3_dv_m_s', label: 'Stage 3 delta-v', group: 'speed', unit: 'm_s', decimals: 1, visibleWhen: { mode: 'stages', stages: '3' } },
  ],
  example: {
    inputs: { mode: 'dv', exhaust: 'isp', isp_s: [300, 's'], m0_kg: [1000, 'kg'], mf_kg: [400, 'kg'] },
    results: { ve_out_m_s: '2 942.0 m/s', mass_ratio: '2.5', dv_m_s: '2 695.7 m/s', prop_kg: '600 kg', prop_fraction: '60 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['dv', 'prop', 'stages'], 'mode', 'Calculate');
  const warnings = [];
  if (x.mode === 'stages') {
    assertOneOf(x.stages, ['1', '2', '3'], 'stages', 'Number of stages');
    const n = Number(x.stages);
    const payload = assertNonNegative(x.payload_kg, 'payload_kg', 'Payload');
    const st = [];
    for (let k = 1; k <= n; k += 1) {
      st.push({
        isp: assertRange(x[`isp${k}_s`], 1, 20000, `isp${k}_s`, `Stage ${k}: Isp`),
        prop: assertNonNegative(x[`prop${k}_kg`], `prop${k}_kg`, `Stage ${k}: propellant mass`),
        dry: assertNonNegative(x[`dry${k}_kg`], `dry${k}_kg`, `Stage ${k}: dry mass`),
      });
    }
    // mass above stage k (upper stages and payload)
    let above = payload;
    const res = [];
    for (let k = n - 1; k >= 0; k -= 1) {
      const m0 = above + st[k].prop + st[k].dry;
      const mf = m0 - st[k].prop;
      if (!(mf > 0)) throw new Error(`Stage ${k + 1}: dry mass: the stage burns out with no mass left; give the dry mass or a payload.`);
      res[k] = { m0, mf, ve: st[k].isp * G0 };
      above = m0;
    }
    const dvs = res.map((r) => r.ve * Math.log(r.m0 / r.mf));
    const total = dvs.reduce((a, b) => a + b, 0);
    const m0 = res[0].m0;
    const propTotal = st.reduce((s, v) => s + v.prop, 0);
    if (st.some((s) => s.prop > 0 && s.dry === 0)) warnings.push('A stage with zero dry mass is not physical: tanks and engines always weigh something.');
    return {
      outputs: {
        dv_m_s: total, ve_out_m_s: null, mass_ratio: null, prop_kg: propTotal, m0_out_kg: m0, prop_fraction: propTotal / m0,
        stage1_dv_m_s: dvs[0], stage2_dv_m_s: dvs[1] ?? null, stage3_dv_m_s: dvs[2] ?? null,
      },
      warnings,
    };
  }
  assertOneOf(x.exhaust, ['isp', 've'], 'exhaust', 'Engine performance given as');
  const ve = x.exhaust === 'isp' ? assertRange(x.isp_s, 1, 20000, 'isp_s', 'Specific impulse') * G0 : assertRange(x.ve_m_s, 10, 200000, 've_m_s', 'Exhaust velocity');
  const mf = assertPositive(x.mf_kg, 'mf_kg', 'Final mass');
  let m0;
  let dv;
  if (x.mode === 'dv') {
    m0 = assertPositive(x.m0_kg, 'm0_kg', 'Initial mass');
    if (m0 < mf) throw new Error('Initial mass: it must be at least the final mass (the rocket cannot gain mass by burning).');
    dv = ve * Math.log(m0 / mf);
  } else {
    dv = assertRange(x.dv_target_m_s, 0, 100000, 'dv_target_m_s', 'Delta-v required');
    const ratio = Math.exp(dv / ve);
    if (ratio > 1e6) throw new Error('Delta-v required: it needs a mass ratio above one million with this exhaust velocity; use more stages or a better engine.');
    m0 = mf * ratio;
  }
  if (m0 / mf > 20) warnings.push('A mass ratio above 20 is beyond a single stage with real tanks and engines; split the delta-v over stages.');
  return {
    outputs: {
      dv_m_s: dv, ve_out_m_s: ve, mass_ratio: m0 / mf, prop_kg: m0 - mf, m0_out_kg: m0, prop_fraction: (m0 - mf) / m0,
      stage1_dv_m_s: null, stage2_dv_m_s: null, stage3_dv_m_s: null,
    },
    warnings,
  };
}
