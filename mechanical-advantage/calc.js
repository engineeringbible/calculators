/**
 * mechanical-advantage/calc.js — ideal and actual mechanical advantage and the effort force of the simple machines:
 * levers of the three classes, pulley systems, the inclined plane, the screw jack with thread and collar friction, and
 * the wheel and axle.
 *
 * Lever: IMA = a_e / a_l.  Pulleys: IMA = n, AMA = η n.  Incline (push along the slope): IMA = 1/sin θ,
 * F = W (sin θ + μ cos θ).  Screw jack (Shigley eqs. 8-1, 8-5, 8-6): T_R = (W d_m/2)(l + π μ d_m sec α)/(π d_m − μ l sec α)
 * + W μ_c d_c/2, F = T_R / R, IMA = 2π R / l.  Wheel and axle: IMA = R / r, AMA = η IMA.
 * Schema units: SI — N, m, rad, N·m.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertInteger, assertNonNegative } from '../shared/validate.js';

/** Thread flank half-angle α for the screw jack (square 0°, Acme 14.5°, ISO trapezoidal 15°). */
export const THREAD_ALPHA_DEG = { square: 0, acme: 14.5, trapezoidal: 15 };

/** Raising and lowering torques of a power screw with collar friction (Shigley eqs. 8-1, 8-5, 8-6). */
export function screwTorques({ W, dm, lead, mu, alphaDeg, muC, dc }) {
  const sec = 1 / Math.cos((alphaDeg * Math.PI) / 180);
  const threadR = ((W * dm) / 2) * ((lead + Math.PI * mu * dm * sec) / (Math.PI * dm - mu * lead * sec));
  const threadL = ((W * dm) / 2) * ((Math.PI * mu * dm * sec - lead) / (Math.PI * dm + mu * lead * sec));
  const collar = (W * muC * dc) / 2;
  return { threadR, threadL, collar, raise: threadR + collar, lower: threadL + collar };
}

export const schema = {
  id: 'mechanical-advantage',
  name: 'Mechanical advantage calculator (lever, pulley, screw jack)',
  category: 'mechanical',
  summary: 'Ideal and actual mechanical advantage and effort for levers, pulley blocks, inclined planes, screw jacks with friction, and wheel and axle.',
  related: ['torque-power-rpm', 'gear-ratio', 'bolt-torque', 'lifting-sling'],
  assumptions: [
    'Loads are static or move slowly at constant speed, so inertia is neglected; the effort is the force that just keeps the load moving (raising for the incline and the screw jack).',
    'Levers are rigid and turn on a frictionless fulcrum, so their actual and ideal mechanical advantage are equal; arm lengths are measured perpendicular to the forces from the fulcrum.',
    'A pulley system with n rope parts supporting the moving block has IMA = n; the overall efficiency entered covers sheave friction and rope stiffness and falls as parts are added; take it from the block maker.',
    'The incline effort acts parallel to the slope with Coulomb friction μ; the screw jack uses the power-screw equations of Shigley §8-2 with thread friction μ, flank half-angle α and a thrust collar of mean diameter d_c and friction μ_c.',
    'A screw is self-locking when the thread alone needs a positive torque to lower the load (π μ d_m sec α > l); the collar friction adds to the holding torque.',
  ],
  notes: [
    'Verification 2026-11-08: Shigley Example 8-1 (square thread, d_m 30 mm, double-start 4 mm pitch so l = 8 mm, W = 6.4 kN, μ = μ_c = 0.08, d_c = 40 mm) gives T_R = 15.94 + 10.24 = 26.18 N·m, T_L = −0.466 + 10.24 = 9.77 N·m and efficiency 0.311, reproduced here; with a 300 mm handle the effort is 87.3 N and the AMA 73.3 against an IMA of 235.6.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §8-2 The mechanics of power screws, eqs. 8-1 to 8-6 and Example 8-1",
    'Meriam and Kraige, Engineering Mechanics: Statics, 8th ed., ch. 6 Friction (wedges, screws, flexible belts) and ch. 4 (levers and pulleys)',
    'Hibbeler, Engineering Mechanics: Statics, 14th ed., §8.2 (frictional forces on an inclined plane) and §8.4 (frictional forces on screws)',
  ],
  inputs: [
    {
      id: 'system', label: 'Machine', type: 'select', default: 'lever',
      options: [
        { value: 'lever', label: 'Lever' }, { value: 'pulley', label: 'Pulley block (n supporting rope parts)' },
        { value: 'incline', label: 'Inclined plane' }, { value: 'screw', label: 'Screw jack (power screw)' },
        { value: 'wheel', label: 'Wheel and axle (winch, capstan)' },
      ],
    },
    { id: 'load_n', label: 'Load W', group: 'force', unit: 'N', display: 'kN', default: 6400, min: 1e-6, max: 1e9 },
    { id: 'lever_class', label: 'Lever class', type: 'select', default: '1', options: [{ value: '1', label: 'Class 1: fulcrum between load and effort (crowbar, seesaw)' }, { value: '2', label: 'Class 2: load between fulcrum and effort (wheelbarrow)' }, { value: '3', label: 'Class 3: effort between fulcrum and load (tweezers, forearm)' }], visibleWhen: { system: 'lever' } },
    { id: 'effort_arm_m', label: 'Effort arm (fulcrum to effort)', group: 'length', unit: 'm', default: 1.5, min: 1e-6, max: 1000, visibleWhen: { system: 'lever' } },
    { id: 'load_arm_m', label: 'Load arm (fulcrum to load)', group: 'length', unit: 'm', default: 0.3, min: 1e-6, max: 1000, visibleWhen: { system: 'lever' } },
    { id: 'parts', label: 'Rope parts supporting the moving block n', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 24, integer: true, visibleWhen: { system: 'pulley' } },
    { id: 'eff', label: 'Overall efficiency η', group: 'ratio', unit: 'frac', display: 'pct', default: 0.85, min: 0.05, max: 1, visibleWhen: { system: ['pulley', 'wheel'] } },
    { id: 'angle_rad', label: 'Slope angle θ', group: 'angle', unit: 'rad', display: 'deg', default: (20 * Math.PI) / 180, min: 1e-4, max: 1.5, visibleWhen: { system: 'incline' } },
    { id: 'mu', label: 'Friction coefficient μ (slope or thread)', group: 'dimensionless', unit: 'none', default: 0.08, min: 0, max: 1, visibleWhen: { system: ['incline', 'screw'] } },
    { id: 'thread', label: 'Thread form', type: 'select', default: 'square', options: [{ value: 'square', label: 'Square (α = 0°)' }, { value: 'acme', label: 'Acme (α = 14.5°)' }, { value: 'trapezoidal', label: 'ISO trapezoidal (α = 15°)' }], visibleWhen: { system: 'screw' } },
    { id: 'dm_m', label: 'Mean thread diameter d_m', group: 'length', unit: 'm', display: 'mm', default: 0.03, min: 1e-4, max: 2, visibleWhen: { system: 'screw' } },
    { id: 'lead_m', label: 'Lead l (pitch × number of starts)', group: 'length', unit: 'm', display: 'mm', default: 0.008, min: 1e-5, max: 0.5, visibleWhen: { system: 'screw' } },
    { id: 'handle_m', label: 'Handle radius R (centre to hand)', group: 'length', unit: 'm', display: 'mm', default: 0.3, min: 1e-3, max: 20, visibleWhen: { system: 'screw' } },
    { id: 'mu_collar', label: 'Collar friction coefficient μ_c (0 for a ball thrust bearing)', group: 'dimensionless', unit: 'none', default: 0.08, min: 0, max: 1, visibleWhen: { system: 'screw' } },
    { id: 'dc_m', label: 'Collar mean diameter d_c', group: 'length', unit: 'm', display: 'mm', default: 0.04, min: 0, max: 2, visibleWhen: { system: 'screw' } },
    { id: 'wheel_m', label: 'Wheel (or crank) radius R', group: 'length', unit: 'm', display: 'mm', default: 0.4, min: 1e-4, max: 100, visibleWhen: { system: 'wheel' } },
    { id: 'axle_m', label: 'Axle (drum) radius r', group: 'length', unit: 'm', display: 'mm', default: 0.05, min: 1e-4, max: 100, visibleWhen: { system: 'wheel' } },
  ],
  outputs: [
    { id: 'ima', label: 'Ideal mechanical advantage (distance ratio)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'ama', label: 'Actual mechanical advantage W/F', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'effort_n', label: 'Effort force F', group: 'force', unit: 'N' },
    { id: 'efficiency', label: 'Efficiency AMA/IMA', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'torque_raise_nm', label: 'Torque to raise the load', group: 'torque', unit: 'N_m', visibleWhen: { system: 'screw' } },
    { id: 'torque_lower_nm', label: 'Torque to lower the load', group: 'torque', unit: 'N_m', visibleWhen: { system: 'screw' } },
    { id: 'note', label: 'Notes', type: 'text' },
  ],
  example: {
    inputs: { system: 'screw', load_n: [6.4, 'kN'], mu: 0.08, thread: 'square', dm_m: [30, 'mm'], lead_m: [8, 'mm'], handle_m: [300, 'mm'], mu_collar: 0.08, dc_m: [40, 'mm'] },
    results: { torque_raise_nm: '26.18 N·m', torque_lower_nm: '9.77 N·m', effort_n: '87.3 N', ima: '235.6', ama: '73.3', efficiency: '31.1 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, ['lever', 'pulley', 'incline', 'screw', 'wheel'], 'system', 'Machine');
  const W = assertPositive(x.load_n, 'load_n', 'Load W');
  const warnings = [];
  let ima; let F; let note = '';
  let tR = null; let tL = null;
  if (x.system === 'lever') {
    assertOneOf(String(x.lever_class), ['1', '2', '3'], 'lever_class', 'Lever class');
    const ae = assertPositive(x.effort_arm_m, 'effort_arm_m', 'Effort arm');
    const al = assertPositive(x.load_arm_m, 'load_arm_m', 'Load arm');
    if (String(x.lever_class) === '2' && al >= ae) throw new Error('Load arm: in a class 2 lever the load sits between the fulcrum and the effort, so the load arm must be shorter than the effort arm.');
    if (String(x.lever_class) === '3' && ae >= al) throw new Error('Effort arm: in a class 3 lever the effort sits between the fulcrum and the load, so the effort arm must be shorter than the load arm.');
    ima = ae / al;
    F = W / ima;
    note = `The effort moves ${ima.toFixed(3)} times as far as the load; the fulcrum carries ${String(x.lever_class) === '1' ? 'W + F' : 'the difference W − F'} = ${Math.abs(String(x.lever_class) === '1' ? W + F : W - F).toFixed(1)} N.`;
  } else if (x.system === 'pulley') {
    const n = assertInteger(assertRange(x.parts, 1, 24, 'parts', 'Rope parts'), 'parts', 'Rope parts');
    const eta = assertRange(x.eff, 0.05, 1, 'eff', 'Overall efficiency');
    ima = n;
    F = W / (n * eta);
    note = `The hauling line moves ${n} times as far as the load.`;
  } else if (x.system === 'incline') {
    const th = assertRange(x.angle_rad, 1e-4, 1.5, 'angle_rad', 'Slope angle');
    const mu = assertRange(x.mu, 0, 1, 'mu', 'Friction coefficient');
    ima = 1 / Math.sin(th);
    F = W * (Math.sin(th) + mu * Math.cos(th));
    const holds = mu >= Math.tan(th);
    note = holds ? 'Friction alone holds the load on the slope (μ ≥ tan θ).' : `The load slides back unless held by ${(W * (Math.sin(th) - mu * Math.cos(th))).toFixed(1)} N along the slope.`;
  } else if (x.system === 'screw') {
    assertOneOf(x.thread, Object.keys(THREAD_ALPHA_DEG), 'thread', 'Thread form');
    const dm = assertPositive(x.dm_m, 'dm_m', 'Mean thread diameter');
    const lead = assertPositive(x.lead_m, 'lead_m', 'Lead');
    const R = assertPositive(x.handle_m, 'handle_m', 'Handle radius');
    const mu = assertRange(x.mu, 0, 1, 'mu', 'Friction coefficient');
    const muC = assertRange(x.mu_collar, 0, 1, 'mu_collar', 'Collar friction coefficient');
    const dc = assertNonNegative(x.dc_m, 'dc_m', 'Collar mean diameter');
    const alpha = THREAD_ALPHA_DEG[x.thread];
    const sec = 1 / Math.cos((alpha * Math.PI) / 180);
    if (mu * lead * sec >= Math.PI * dm) throw new Error('Friction coefficient: with this lead and friction the screw locks solid and no torque can raise the load.');
    if (lead > Math.PI * dm) throw new Error('Lead: a lead larger than the mean circumference is not a practical power screw.');
    const t = screwTorques({ W, dm, lead, mu, alphaDeg: alpha, muC, dc });
    tR = t.raise; tL = t.lower;
    ima = (2 * Math.PI * R) / lead;
    F = t.raise / R;
    note = t.threadL > 0
      ? 'The thread is self-locking: the load cannot turn the screw by itself.'
      : `The thread alone is not self-locking (${t.threadL.toFixed(3)} N·m); ${t.lower > 0 ? 'the collar friction holds the load' : 'the load would run down: add a brake or a self-locking thread'}.`;
    if (t.lower <= 0) warnings.push('The screw jack is not self-locking: the load lowers itself unless the screw is held.');
  } else {
    const R = assertPositive(x.wheel_m, 'wheel_m', 'Wheel radius');
    const r = assertPositive(x.axle_m, 'axle_m', 'Axle radius');
    const eta = assertRange(x.eff, 0.05, 1, 'eff', 'Overall efficiency');
    ima = R / r;
    F = W / (ima * eta);
    note = `The rim moves ${ima.toFixed(3)} times as far as the rope on the axle.`;
  }
  const ama = W / F;
  return {
    outputs: { ima, ama, effort_n: F, efficiency: ama / ima, torque_raise_nm: tR, torque_lower_nm: tL, note },
    warnings,
  };
}
