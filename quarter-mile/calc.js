/**
 * quarter-mile/calc.js — estimated quarter-mile elapsed time and trap speed from the race weight and the horsepower
 * (empirical cube-root formulas), with eighth-mile figures from the constant-power model behind them.
 *
 * ET = K_t (W / hp)^(1/3);  mph = K_v (hp / W)^(1/3)  (W in lb, flywheel hp; K_t, K_v from McCaul 2014, Table 2).
 * Eighth mile at constant power: distance ∝ t^1.5 and speed ∝ t^0.5, so ET_1/8 = ET_1/4 / 2^(2/3), mph_1/8 = mph_1/4 / 2^(1/3).
 * Schema units: SI — kg, W, s, m/s.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const LB = 0.45359237;
const HP = 745.69987158227;
const MPH = 0.44704;

/** Published ET and trap-speed constants [K_t, K_v] (E.L. McCaul, The ET & MPH Equations, 2014, Table 2). */
export const FORMULAS = {
  hale: { kt: 5.825, kv: 234.0, label: 'Hale (Quarter Jr.): 5.825 / 234' },
  fox: { kt: 6.05, kv: 225.0, label: 'Fox: 6.050 / 225' },
  huntington: { kt: 6.29, kv: 224.0, label: 'Huntington (1960s): 6.290 / 224' },
};

export const schema = {
  id: 'quarter-mile',
  name: 'Quarter-mile ET and trap speed calculator',
  category: 'automotive',
  summary: 'Estimated quarter-mile elapsed time and trap speed from weight and horsepower, with eighth-mile time and speed and the weight-to-power ratio.',
  related: ['horsepower', 'gear-speed', 'tire-size', 'drag-lift'],
  assumptions: [
    'ET = K_t (W / hp)^(1/3) and mph = K_v (hp / W)^(1/3) are empirical fits to drag-strip results, with W the race weight in lb (car, driver and fuel) and hp the flywheel horsepower; they assume good traction, a prepared track and a competent launch.',
    'Real results scatter around the estimate: launch, tyres, gearing, aerodynamics, altitude and weather can move the ET by several tenths.',
    'Eighth-mile figures follow from the constant-power model behind the cube-root formulas: distance grows with t^1.5, so ET_1/8 = ET_1/4 / 1.587 and the eighth-mile speed is the quarter-mile speed / 1.260; real ratios differ slightly with traction and drag.',
    'Wheel horsepower is converted to flywheel horsepower with hp_crank = hp_wheel / (1 − loss) before the formulas are applied.',
  ],
  notes: [
    'Verification 2026-11-08: 3 500 lb and 400 hp with the Hale constants: 8.75 lb/hp, ET 12.00 s, 113.6 mph; eighth mile 7.56 s and 90.1 mph. Checked by hand.',
    'The ideal constant-power quarter mile (no drag, no wheelspin) has K_t = 4.803 (McCaul 2014, from 1 320 ft, g and 550 ft·lbf/s); the empirical constants are higher because real cars lose time at the launch.',
  ],
  sources: [
    'E.L. McCaul, The ET & MPH Equations, June 2014, Table 2 Some published empirical ET and MPH equations (Hale 5.825/234.0; G. Fox 6.050/225.0; Huntington 6.290/224.0), and paragraph 4 (K_T = 4.803 from constant power)',
    'Wallace Racing, ET-MPH-HP calculator (wallaceracing.com/et-hp-mph.php): weight as the car sits on the line with driver and fuel, horsepower at the flywheel',
  ],
  inputs: [
    { id: 'weight_kg', label: 'Race weight with driver and fuel', group: 'mass', unit: 'kg', display: 'lb', default: 3500 * LB, min: 50, max: 10000 },
    { id: 'power_w', label: 'Horsepower', group: 'power', unit: 'W', display: 'hp', default: 400 * HP, min: 1000, max: 1e7 },
    { id: 'power_at', label: 'Horsepower measured at', type: 'select', default: 'crank', options: [{ value: 'crank', label: 'Crank (flywheel, advertised)' }, { value: 'wheel', label: 'Wheels (chassis dyno)' }] },
    { id: 'loss', label: 'Drivetrain loss, crank to wheels', group: 'ratio', unit: 'frac', display: 'pct', default: 0.15, min: 0, max: 0.5, visibleWhen: { power_at: 'wheel' } },
    { id: 'formula', label: 'Empirical constants K_t / K_v', type: 'select', default: 'hale', options: Object.entries(FORMULAS).map(([value, f]) => ({ value, label: f.label })) },
  ],
  outputs: [
    { id: 'et_s', label: 'Quarter-mile elapsed time', group: 'time', unit: 's', decimals: 2 },
    { id: 'trap_m_s', label: 'Quarter-mile trap speed', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'et8_s', label: 'Eighth-mile elapsed time', group: 'time', unit: 's', decimals: 2 },
    { id: 'trap8_m_s', label: 'Eighth-mile speed', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'lb_per_hp', label: 'Weight to power, lb per flywheel hp', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'crank_w', label: 'Flywheel horsepower used', group: 'power', unit: 'W', display: 'hp' },
  ],
  example: {
    inputs: { weight_kg: [3500, 'lb'], power_w: [400, 'hp'], power_at: 'crank', formula: 'hale' },
    results: { lb_per_hp: '8.75', et_s: '12.00 s', trap_m_s: '113.6 mph', et8_s: '7.56 s', trap8_m_s: '90.1 mph' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.power_at, ['crank', 'wheel'], 'power_at', 'Horsepower measured at');
  assertOneOf(x.formula, Object.keys(FORMULAS), 'formula', 'Empirical constants');
  const wLb = assertRange(x.weight_kg, 50, 10000, 'weight_kg', 'Race weight') / LB;
  const p = assertRange(x.power_w, 1000, 1e7, 'power_w', 'Horsepower');
  const loss = x.power_at === 'wheel' ? assertRange(x.loss, 0, 0.5, 'loss', 'Drivetrain loss') : 0;
  const crank = p / (1 - loss);
  const hp = crank / HP;
  const f = FORMULAS[x.formula];
  const ratio = wLb / hp;
  const et = f.kt * Math.cbrt(ratio);
  const mph = f.kv / Math.cbrt(ratio);
  const warnings = [];
  if (ratio < 1.5) warnings.push('Below 1.5 lb per hp the car is in pro drag-racing territory, where traction limits the run and the empirical formulas were not fitted.');
  if (ratio > 40) warnings.push('Above 40 lb per hp the estimate is rough; the formulas were fitted to performance cars.');
  return {
    outputs: {
      et_s: et, trap_m_s: mph * MPH, et8_s: et / 2 ** (2 / 3), trap8_m_s: (mph / 2 ** (1 / 3)) * MPH,
      lb_per_hp: ratio, crank_w: crank,
    },
    warnings,
  };
}
