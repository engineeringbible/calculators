/**
 * micro-hydro/calc.js — micro and small hydro power from the flow and the net head: penstock friction by
 * Darcy–Weisbach (Colebrook) or Hazen–Williams, or as a share of the gross head; hydraulic and electrical power,
 * yearly energy, and the turbine types whose head range covers the net head (ESHA 2004, Table 6.3).
 *
 * P = ρ g Q H_n η;  H_n = H_g − h_f − K v²/2g;  Darcy h_f = f (L/D) v²/2g;  Hazen–Williams (SI)
 * h_f = 10.67 L Q^1.852 / (C^1.852 D^4.8704).  Schema units: SI — m³/s, m, m²/s, kg/m³, W, J (display kWh).
 */
import { withDefaults, assertRange, assertOneOf } from '../shared/validate.js';
import { frictionFactor, G } from '../shared/pipes.js';

/** ESHA, Guide on How to Develop a Small Hydropower Plant (2004), Table 6.3 Range of heads (net head, m). */
export const TURBINE_HEADS = [
  { name: 'Kaplan or propeller', min: 2, max: 40 },
  { name: 'Crossflow (Banki-Michell)', min: 5, max: 200 },
  { name: 'Francis', min: 25, max: 350 },
  { name: 'Turgo', min: 50, max: 250 },
  { name: 'Pelton', min: 50, max: 1300 },
];

/** Turbine types whose ESHA head range contains the net head. */
export function turbinesForHead(h) {
  return TURBINE_HEADS.filter((t) => h > t.min && h < t.max);
}

/** Hazen–Williams head loss, m, SI form: Q m³/s, D m, L m. */
export const hazenWilliamsLoss = (q, d, l, c) => (10.67 * l * q ** 1.852) / (c ** 1.852 * d ** 4.8704);

export const schema = {
  id: 'micro-hydro',
  name: 'Micro-hydro power calculator',
  category: 'electrical',
  summary: 'Hydro power from flow and head: penstock friction by Darcy or Hazen–Williams, net head, electrical power, yearly energy and turbine types for the head.',
  related: ['pipe-flow', 'wind-turbine-power', 'solar-payback', 'pump-power'],
  assumptions: [
    'Power is ρ g Q H_n η, where H_n is the net head: the gross head between intake and turbine minus the friction and fitting losses in the penstock at the design flow (ESHA 2004, eq. 6.1).',
    'Friction by Darcy–Weisbach uses the Colebrook friction factor with the pipe roughness and the water viscosity (1.307 mm²/s at 10 °C by default); Hazen–Williams is an empirical formula for water at ordinary temperatures in pipes above about 50 mm; the third option takes the loss as a share of the gross head, for a first estimate.',
    'The efficiency is from water to wire: turbine, drive and generator together. ESHA gives best turbine efficiencies of 0.85 (Turgo) to 0.94 (Francis); the generator, the drive and part-flow running lower the overall figure, so the default is 0.6.',
    'Yearly energy assumes the design flow for the chosen share of the year; a real stream varies, so the energy should come from the flow duration curve less the residual flow left in the stream.',
    'Turbine types are suggested from the net head ranges of ESHA Table 6.3 only; flow, speed, cavitation and cost narrow the choice, and manufacturers\' selection charts use head and flow together.',
  ],
  notes: [
    'Verification 2026-11-08: 50 L/s through 200 m of 200 mm plastic pipe (0.0015 mm) at 1.59 m/s, Re 243 500, f 0.0151, loses 1.95 m of a 40 m gross head; net head 38.05 m gives 18.66 kW hydraulic and 11.19 kW at 60 % water to wire, 78 400 kWh a year at 80 % running. Checked by hand.',
  ],
  sources: [
    'ESHA (European Small Hydropower Association), Guide on How to Develop a Small Hydropower Plant, 2004: ch. 6, eq. 6.1 (P = ρ Q g H η), Table 6.3 (range of heads) and Table 6.7 (typical turbine efficiencies)',
    'Colebrook, C. F., Turbulent flow in pipes, with particular reference to the transition region between the smooth and rough pipe laws, J. Inst. Civil Engineers 11 (1939) 133–156',
    'Williams, G. S. and Hazen, A., Hydraulic Tables, 3rd ed., Wiley 1920 (Hazen–Williams formula; SI form h_f = 10.67 L Q^1.852 / (C^1.852 D^4.87))',
  ],
  inputs: [
    { id: 'flow_m3s', label: 'Design flow through the turbine Q', group: 'volume_flow', unit: 'm3_s', display: 'L_s', default: 0.05, min: 1e-4, max: 100 },
    { id: 'gross_head_m', label: 'Gross head (intake water level to turbine)', group: 'length', unit: 'm', default: 40, min: 0.5, max: 2000 },
    { id: 'loss_mode', label: 'Penstock losses', type: 'select', default: 'darcy', options: [{ value: 'darcy', label: 'Darcy–Weisbach with Colebrook friction factor' }, { value: 'hw', label: 'Hazen–Williams' }, { value: 'pct', label: 'Share of the gross head' }] },
    { id: 'length_m', label: 'Penstock length', group: 'length', unit: 'm', default: 200, min: 0.1, max: 20000, visibleWhen: { loss_mode: ['darcy', 'hw'] } },
    { id: 'diameter_m', label: 'Penstock inside diameter', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.01, max: 5, visibleWhen: { loss_mode: ['darcy', 'hw'] } },
    { id: 'roughness_m', label: 'Pipe roughness ε', group: 'length', unit: 'm', display: 'mm', default: 0.0000015, min: 0, max: 0.01, visibleWhen: { loss_mode: 'darcy' }, help: 'PVC and PE about 0.0015 mm, commercial steel 0.045 mm, cast iron 0.26 mm.' },
    { id: 'viscosity', label: 'Kinematic viscosity of the water', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 1.307e-6, min: 2e-7, max: 2e-6, visibleWhen: { loss_mode: 'darcy' } },
    { id: 'hw_c', label: 'Hazen–Williams coefficient C', group: 'dimensionless', unit: 'none', default: 150, min: 60, max: 160, visibleWhen: { loss_mode: 'hw' }, help: 'PVC and PE about 150, new steel about 140, old cast iron 100 or less.' },
    { id: 'minor_k', label: 'Sum of fitting loss coefficients K (intake, bends, valve)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 100, visibleWhen: { loss_mode: ['darcy', 'hw'] } },
    { id: 'loss_frac', label: 'Penstock loss as a share of the gross head', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 0.9, visibleWhen: { loss_mode: 'pct' } },
    { id: 'efficiency', label: 'Overall efficiency, water to wire', group: 'ratio', unit: 'frac', display: 'pct', default: 0.6, min: 0.1, max: 0.95 },
    { id: 'density', label: 'Water density', group: 'density', unit: 'kg_m3', default: 1000, min: 990, max: 1030 },
    { id: 'running', label: 'Share of the year at the design flow', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0, max: 1 },
  ],
  outputs: [
    { id: 'velocity_m_s', label: 'Water velocity in the penstock', group: 'speed', unit: 'm_s' },
    { id: 'reynolds', label: 'Reynolds number', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'friction_factor', label: 'Darcy friction factor f', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'friction_loss_m', label: 'Friction loss in the penstock', group: 'length', unit: 'm' },
    { id: 'minor_loss_m', label: 'Fitting losses K v²/2g', group: 'length', unit: 'm' },
    { id: 'net_head_m', label: 'Net head', group: 'length', unit: 'm' },
    { id: 'loss_share', label: 'Head lost in the penstock', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'hydraulic_w', label: 'Hydraulic power ρ g Q H_n', group: 'power', unit: 'W', display: 'kW' },
    { id: 'electric_w', label: 'Electrical output', group: 'power', unit: 'W', display: 'kW' },
    { id: 'gross_w', label: 'Power of the gross head, before losses', group: 'power', unit: 'W', display: 'kW' },
    { id: 'energy_j', label: 'Energy per year', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'turbines', label: 'Turbine types for this net head (ESHA Table 6.3)', type: 'text' },
  ],
  example: {
    inputs: { flow_m3s: [50, 'L_s'], gross_head_m: [40, 'm'], loss_mode: 'darcy', length_m: [200, 'm'], diameter_m: [200, 'mm'], roughness_m: [0.0015, 'mm'], viscosity: [1.307, 'cSt'], minor_k: 0, efficiency: [60, 'pct'], density: [1000, 'kg_m3'], running: [80, 'pct'] },
    results: { velocity_m_s: '1.59 m/s', friction_loss_m: '1.95 m', net_head_m: '38.05 m', hydraulic_w: '18.66 kW', electric_w: '11.19 kW', energy_j: '78 400 kWh' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.loss_mode, ['darcy', 'hw', 'pct'], 'loss_mode', 'Penstock losses');
  const q = assertRange(x.flow_m3s, 1e-4, 100, 'flow_m3s', 'Design flow');
  const hg = assertRange(x.gross_head_m, 0.5, 2000, 'gross_head_m', 'Gross head');
  const eta = assertRange(x.efficiency, 0.1, 0.95, 'efficiency', 'Overall efficiency');
  const rho = assertRange(x.density, 990, 1030, 'density', 'Water density');
  const run = assertRange(x.running, 0, 1, 'running', 'Share of the year');
  let v = null;
  let re = null;
  let f = null;
  let hf;
  let hm = null;
  if (x.loss_mode === 'pct') {
    hf = hg * assertRange(x.loss_frac, 0, 0.9, 'loss_frac', 'Penstock loss share');
  } else {
    const l = assertRange(x.length_m, 0.1, 20000, 'length_m', 'Penstock length');
    const d = assertRange(x.diameter_m, 0.01, 5, 'diameter_m', 'Penstock inside diameter');
    const k = assertRange(x.minor_k, 0, 100, 'minor_k', 'Sum of fitting loss coefficients');
    v = q / ((Math.PI * d * d) / 4);
    const dyn = (v * v) / (2 * G);
    if (x.loss_mode === 'darcy') {
      const eps = assertRange(x.roughness_m, 0, 0.01, 'roughness_m', 'Pipe roughness');
      const nu = assertRange(x.viscosity, 2e-7, 2e-6, 'viscosity', 'Kinematic viscosity');
      re = (v * d) / nu;
      f = frictionFactor(re, eps / d);
      hf = f * (l / d) * dyn;
    } else {
      const c = assertRange(x.hw_c, 60, 160, 'hw_c', 'Hazen–Williams coefficient');
      hf = hazenWilliamsLoss(q, d, l, c);
    }
    hm = k * dyn;
  }
  const loss = hf + (hm ?? 0);
  const hn = hg - loss;
  if (hn <= 0) throw new Error('Penstock: the losses at this flow use up the whole gross head; choose a larger pipe or a smaller flow.');
  const ph = rho * G * q * hn;
  const pe = ph * eta;
  const types = turbinesForHead(hn);
  const warnings = [];
  if (loss > hg / 3) warnings.push('The penstock loses more than a third of the gross head: beyond this point more flow gives less power. A larger pipe pays for itself.');
  if (v !== null && v > 5) warnings.push('Water velocity above 5 m/s in the penstock: high friction, wear and severe water hammer if a valve closes quickly.');
  if (x.loss_mode === 'darcy' && re < 4000) warnings.push('Laminar or transitional flow in the penstock: check the flow and diameter.');
  if (!types.length) warnings.push('No turbine type in ESHA Table 6.3 covers this net head (2 to 1 300 m).');
  return {
    outputs: {
      velocity_m_s: v,
      reynolds: re,
      friction_factor: f,
      friction_loss_m: hf,
      minor_loss_m: hm,
      net_head_m: hn,
      loss_share: loss / hg,
      hydraulic_w: ph,
      electric_w: pe,
      gross_w: rho * G * q * hg,
      energy_j: pe * 8760 * run * 3600,
      turbines: types.length ? types.map((t) => `${t.name} (${t.min}–${t.max} m)`).join(', ') : 'None in the ESHA head ranges',
    },
    warnings,
  };
}
