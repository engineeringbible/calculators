/**
 * horsepower/calc.js — engine horsepower from torque and rpm (hp = T·rpm/5252 with T in lbf·ft), or estimated from the
 * quarter-mile elapsed time or trap speed and the race weight (empirical cube-root formulas), in hp, kW and PS, at the
 * crank and at the wheels with a drivetrain loss.
 *
 * P = T ω;  from ET: hp = W (K_t / ET)³;  from trap speed: hp = W (mph / K_v)³  (W in lb; K_t, K_v from McCaul 2014,
 * Table 2: Hale 5.825/234, Fox 6.050/225, Huntington 6.290/224). Wheel = crank × (1 − loss).
 * Schema units: SI — N·m, rpm, kg, s, m/s, W.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';

const LB = 0.45359237;
const MPH = 0.44704;
const HP = 745.69987158227;

/** Published ET and trap-speed constants [K_t, K_v] (E.L. McCaul, The ET & MPH Equations, 2014, Table 2). */
export const FORMULAS = {
  hale: { kt: 5.825, kv: 234.0, label: 'Hale (Quarter Jr.): 5.825 / 234' },
  fox: { kt: 6.05, kv: 225.0, label: 'Fox: 6.050 / 225' },
  huntington: { kt: 6.29, kv: 224.0, label: 'Huntington (1960s): 6.290 / 224' },
};

export const schema = {
  id: 'horsepower',
  name: 'Horsepower calculator',
  category: 'automotive',
  summary: 'Horsepower from torque and rpm, or estimated from quarter-mile time or trap speed and weight, in hp, kW and PS, at the crank and the wheels.',
  related: ['quarter-mile', 'torque-power-rpm', 'engine-displacement', 'fuel-injector-size'],
  assumptions: [
    'Power from torque is exact: P = T × 2π × rpm / 60, which is hp = lbf·ft × rpm / 5 252 with 1 hp = 550 ft·lbf/s; torque and horsepower curves therefore cross at 5 252 rpm.',
    'The elapsed-time and trap-speed formulas are empirical estimates from drag-strip data: hp = W (K_t / ET)³ and hp = W (mph / K_v)³ with the race weight W in lb (car, driver and fuel). They give engine (flywheel) horsepower, as the Wallace Racing calculator that uses the same form states.',
    'Trap speed estimates power better than elapsed time, because the launch, traction and shifting affect the ET far more than the speed at the end of the run.',
    'Wheel horsepower is crank horsepower times (1 − drivetrain loss); the loss is an assumption, often taken as 15 % for a manual rear-drive car and higher for automatics and all-wheel drive.',
    'kW and PS (metric horsepower, 75 kgf·m/s = 735.5 W) are the same power in other units; 1 hp (mechanical) = 745.7 W.',
  ],
  notes: [
    'Verification 2026-11-08: 400 lbf·ft at 5 000 rpm is 380.8 hp, 284.0 kW, 386.1 PS at the crank and 323.7 hp at the wheels with a 15 % loss. A 3 500 lb car trapping 113.6 mph gives 400.5 hp by the Hale constants (3 500 × (113.6 / 234)³). Checked by hand.',
    'The constants are those tabulated by McCaul (2014, Table 2) for Patrick Hale (Quarter Jr.), Geoffrey Fox and Roger Huntington; ET × mph is the same constant for every car with one set of constants (5.825 × 234 = 1 363).',
  ],
  sources: [
    'SAE J1349 (2011) Engine Power Test Code — Spark Ignition and Compression Ignition — As Installed Net Power Rating (power from measured torque and speed)',
    'E.L. McCaul, The ET & MPH Equations, June 2014, Table 2 Some published empirical ET and MPH equations (Hale 5.825/234.0; G. Fox 6.050/225.0; Huntington 6.290/224.0)',
    'Wallace Racing, ET-MPH-HP calculator (wallaceracing.com/et-hp-mph.php): weight as the car sits on the line with driver and fuel, horsepower at the flywheel',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate horsepower from', type: 'select', default: 'torque', options: [
      { value: 'torque', label: 'Torque and rpm' },
      { value: 'trap', label: 'Quarter-mile trap speed and weight (estimate)' },
      { value: 'et', label: 'Quarter-mile elapsed time and weight (estimate)' },
    ] },
    { id: 'torque_nm', label: 'Torque', group: 'torque', unit: 'N_m', display: 'lbf_ft', default: 400 * 1.3558179483314004, min: 0.01, max: 1e6, visibleWhen: { mode: 'torque' } },
    { id: 'rpm', label: 'Engine speed at that torque', group: 'rotational_speed', unit: 'rpm', default: 5000, min: 1, max: 30000, visibleWhen: { mode: 'torque' } },
    { id: 'measured_at', label: 'Torque measured at', type: 'select', default: 'crank', options: [{ value: 'crank', label: 'Crank (engine dyno)' }, { value: 'wheel', label: 'Wheels (chassis dyno, engine rpm)' }], visibleWhen: { mode: 'torque' } },
    { id: 'weight_kg', label: 'Race weight with driver and fuel', group: 'mass', unit: 'kg', display: 'lb', default: 3500 * LB, min: 50, max: 10000, visibleWhen: { mode: ['et', 'trap'] } },
    { id: 'trap_m_s', label: 'Quarter-mile trap speed', group: 'speed', unit: 'm_s', display: 'mph', default: 113.6 * MPH, min: 5, max: 200, visibleWhen: { mode: 'trap' } },
    { id: 'et_s', label: 'Quarter-mile elapsed time', group: 'time', unit: 's', default: 12, min: 3, max: 60, visibleWhen: { mode: 'et' } },
    { id: 'formula', label: 'Empirical constants K_t / K_v', type: 'select', default: 'hale', options: Object.entries(FORMULAS).map(([value, f]) => ({ value, label: f.label })), visibleWhen: { mode: ['et', 'trap'] } },
    { id: 'loss', label: 'Drivetrain loss, crank to wheels', group: 'ratio', unit: 'frac', display: 'pct', default: 0.15, min: 0, max: 0.5 },
  ],
  outputs: [
    { id: 'crank_w', label: 'Crank (flywheel) horsepower', group: 'power', unit: 'W', display: 'hp' },
    { id: 'crank_kw_w', label: 'Crank power in kW', group: 'power', unit: 'W', display: 'kW' },
    { id: 'crank_ps_w', label: 'Crank power in PS (metric hp)', group: 'power', unit: 'W', display: 'PS' },
    { id: 'wheel_w', label: 'Wheel horsepower', group: 'power', unit: 'W', display: 'hp' },
    { id: 'lb_per_hp', label: 'Weight to power, lb per crank hp', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'basis', label: 'Basis', type: 'text' },
  ],
  example: {
    inputs: { mode: 'torque', torque_nm: [400, 'lbf_ft'], rpm: [5000, 'rpm'], measured_at: 'crank', loss: [15, 'pct'] },
    results: { crank_w: '380.8 hp', crank_kw_w: '284.0 kW', crank_ps_w: '386.1 PS', wheel_w: '323.7 hp' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['torque', 'et', 'trap'], 'mode', 'Calculate horsepower from');
  const loss = assertRange(x.loss, 0, 0.5, 'loss', 'Drivetrain loss');
  const warnings = [];
  let crank;
  let wLb = null;
  let basis;
  if (x.mode === 'torque') {
    assertOneOf(x.measured_at, ['crank', 'wheel'], 'measured_at', 'Torque measured at');
    const t = assertPositive(x.torque_nm, 'torque_nm', 'Torque');
    const rpm = assertRange(x.rpm, 1, 30000, 'rpm', 'Engine speed');
    const p = t * (2 * Math.PI * rpm) / 60;
    crank = x.measured_at === 'crank' ? p : p / (1 - loss);
    basis = x.measured_at === 'crank' ? 'Exact: P = T × 2π × rpm / 60 at the crank' : 'Exact power at the wheels; crank power = wheel power / (1 − loss)';
  } else {
    assertOneOf(x.formula, Object.keys(FORMULAS), 'formula', 'Empirical constants');
    const f = FORMULAS[x.formula];
    wLb = assertRange(x.weight_kg, 50, 10000, 'weight_kg', 'Race weight') / LB;
    let hp;
    if (x.mode === 'et') {
      const et = assertRange(x.et_s, 3, 60, 'et_s', 'Elapsed time');
      hp = wLb * (f.kt / et) ** 3;
      basis = `Estimate: hp = W (${f.kt} / ET)³, flywheel horsepower`;
      warnings.push('Elapsed time depends heavily on launch, traction and shifting; the trap-speed estimate is usually closer to the real power.');
    } else {
      const mph = assertRange(x.trap_m_s, 5, 200, 'trap_m_s', 'Trap speed') / MPH;
      hp = wLb * (mph / f.kv) ** 3;
      basis = `Estimate: hp = W (mph / ${f.kv})³, flywheel horsepower`;
    }
    crank = hp * HP;
    if (wLb / hp < 1.5) warnings.push('Below 1.5 lb per hp the car is in pro drag-racing territory, where the empirical formulas were not fitted; treat the estimate as rough.');
  }
  return {
    outputs: {
      crank_w: crank, crank_kw_w: crank, crank_ps_w: crank, wheel_w: crank * (1 - loss),
      lb_per_hp: wLb === null ? null : wLb / (crank / HP),
      basis,
    },
    warnings,
  };
}
