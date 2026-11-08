/**
 * pump-power/calc.js — pump power from flow and head (or pressure): hydraulic power, shaft power at the pump
 * efficiency, electrical input at the motor efficiency, the next standard motor size and the energy cost.
 *
 * P_h = ρ g Q H = Q Δp;  P_shaft = P_h / η_p;  P_in = P_shaft / η_m;  E = P_in × hours.
 * Schema units: SI — m³/s, m, Pa, kg/m³, W.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const G = 9.80665;

/** IEC 60072-1 standard rated outputs of motors, kW. */
export const MOTOR_KW = [0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400, 450, 500];

export const schema = {
  id: 'pump-power',
  name: 'Pump power calculator',
  category: 'mechanical',
  summary: 'Hydraulic, shaft and electrical power of a pump from flow and head or pressure, with efficiencies, the next standard motor size and the energy cost.',
  related: ['total-dynamic-head', 'pump-affinity', 'pump-npsh', 'electricity-cost'],
  assumptions: [
    'Head is the total dynamic head the pump adds (static lift plus friction and minor losses plus any pressure difference), in metres of the pumped liquid; a pressure rise converts with H = Δp / (ρ g).',
    'Pump efficiency comes from the pump curve at the duty point: roughly 40–60 % for small centrifugal pumps, 70–85 % for large ones. Motor efficiency follows the IEC 60034-30-1 class: about 85–96 % from 1 to 100 kW (IE3).',
    'The motor is the next IEC 60072 rated output at or above the shaft power plus the chosen margin; a margin of 10–20 % covers operation away from the duty point and viscosity changes.',
    'Viscous liquids lower the pump efficiency below its water rating (ANSI/HI 9.6.7); correct the efficiency for oils.',
  ],
  notes: [
    'Verification 2026-11-07: 50 m³/h of water against 30 m at 70 % pump and 90 % motor efficiency: at 998 kg/m³ hydraulic 4.08 kW, shaft 5.83 kW, input 6.47 kW, motor 7.5 kW with 10 % margin. Checked by hand.',
  ],
  sources: [
    'ANSI/HI 14.6 and Europump/Hydraulic Institute, Pump Life Cycle Costs (P = ρ g Q H / η)',
    'IEC 60072-1:2022 (standard motor outputs) and IEC 60034-30-1:2014 (efficiency classes)',
  ],
  inputs: [
    { id: 'flow_m3s', label: 'Flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 50 / 3600, min: 1e-7, max: 100 },
    { id: 'mode', label: 'Pump duty given as', type: 'select', default: 'head', options: [{ value: 'head', label: 'Total head H' }, { value: 'pressure', label: 'Pressure rise Δp' }] },
    { id: 'head_m', label: 'Total head H', group: 'length', unit: 'm', default: 30, min: 0.01, max: 5000, visibleWhen: { mode: 'head' } },
    { id: 'dp_pa', label: 'Pressure rise Δp', group: 'pressure', unit: 'Pa', display: 'bar', default: 300000, min: 1, max: 1e8, visibleWhen: { mode: 'pressure' } },
    { id: 'density', label: 'Liquid density', group: 'density', unit: 'kg_m3', default: 998, min: 500, max: 2500 },
    { id: 'eta_pump', label: 'Pump efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.7, min: 0.05, max: 0.95 },
    { id: 'eta_motor', label: 'Motor efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.3, max: 0.99 },
    { id: 'margin', label: 'Motor sizing margin', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 1 },
    { id: 'hours', label: 'Running hours per year (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 8784 },
    { id: 'price_kwh', label: 'Electricity price per kWh (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 100 },
  ],
  outputs: [
    { id: 'hydraulic_w', label: 'Hydraulic power ρ g Q H', group: 'power', unit: 'W', display: 'kW' },
    { id: 'shaft_w', label: 'Shaft power (brake horsepower)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'input_w', label: 'Electrical input power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'motor', label: 'Motor size (IEC 60072, with margin)', type: 'text' },
    { id: 'head_out_m', label: 'Head', group: 'length', unit: 'm' },
    { id: 'energy_j', label: 'Energy per year', group: 'energy', unit: 'J', display: 'MWh' },
    { id: 'cost', label: 'Energy cost per year', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { flow_m3s: [50, 'm3_h'], mode: 'head', head_m: [30, 'm'], density: [998, 'kg_m3'], eta_pump: [70, 'pct'], eta_motor: [90, 'pct'], margin: [10, 'pct'], hours: 0, price_kwh: 0 },
    results: { hydraulic_w: '4.08 kW', shaft_w: '5.83 kW', input_w: '6.47 kW' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['head', 'pressure'], 'mode', 'Pump duty given as');
  const Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow rate');
  const rho = assertRange(x.density, 500, 2500, 'density', 'Liquid density');
  const H = x.mode === 'head' ? assertPositive(x.head_m, 'head_m', 'Total head') : assertPositive(x.dp_pa, 'dp_pa', 'Pressure rise') / (rho * G);
  const ep = assertRange(x.eta_pump, 0.05, 0.95, 'eta_pump', 'Pump efficiency');
  const em = assertRange(x.eta_motor, 0.3, 0.99, 'eta_motor', 'Motor efficiency');
  const margin = assertRange(x.margin, 0, 1, 'margin', 'Motor sizing margin');
  const hours = assertNonNegative(x.hours, 'hours', 'Running hours');
  const price = assertNonNegative(x.price_kwh, 'price_kwh', 'Electricity price');
  const Ph = rho * G * Q * H;
  const Ps = Ph / ep;
  const Pin = Ps / em;
  const need = (Ps * (1 + margin)) / 1000;
  const motor = MOTOR_KW.find((k) => k >= need - 1e-9);
  const energy = hours > 0 ? Pin * hours * 3600 : null;
  const warnings = [];
  if (ep < 0.4) warnings.push('Pump efficiency below 40 %: check the duty point on the pump curve; a better-matched pump may save a lot of energy.');
  return {
    outputs: {
      hydraulic_w: Ph, shaft_w: Ps, input_w: Pin,
      motor: motor ? `${motor} kW (${(motor / 0.746).toFixed(motor < 1 ? 2 : 1)} hp)` : 'Above 500 kW: specify individually',
      head_out_m: H,
      energy_j: energy,
      cost: energy && price > 0 ? (energy / 3.6e6) * price : null,
    },
    warnings,
  };
}
