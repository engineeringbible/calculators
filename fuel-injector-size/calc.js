/**
 * fuel-injector-size/calc.js — fuel injector size in lb/hr and cc/min from engine horsepower, brake specific fuel
 * consumption, number of injectors and maximum duty cycle; or the horsepower a set of injectors supports; with the
 * correction for fuel pressure.
 *
 * Flow per injector = hp × BSFC / (n × DC);  hp = flow × n × DC / BSFC;  flow ∝ √Δp (flow at p2 = flow at p1 × √(p2/p1));
 * cc/min = lb/hr × 453.592 / 60 / ρ[g/cm³].  Schema units: SI — W, g/kWh, kg/s, kg/m³, Pa.
 */
import { withDefaults, assertOneOf, assertRange, assertInteger } from '../shared/validate.js';

const HP = 745.69987158227;
const LB_H = 0.45359237 / 3600; // kg/s per lb/h
const LB_HPH = 453.59237 / 0.74569987158227; // g/kWh per lb/(hp·h)
const PSI = 6894.757293168;
/** Stoichiometric air-fuel ratios: gasoline 14.7, E85 9.8 (85 % ethanol by volume); E85 needs 14.7 / 9.8 = 1.5 times the fuel mass. */
const E85_FACTOR = 14.7 / 9.8;

/** Presets: BSFC in lb/(hp·h) and fuel density in kg/m³. Gasoline BSFC within the EngineLabs ranges (NA 0.45–0.50, boosted 0.55–0.75). */
export const PRESETS = {
  gas_na: { bsfc: 0.5, rho: 720, label: 'Gasoline, naturally aspirated (BSFC 0.50)' },
  gas_sc: { bsfc: 0.6, rho: 720, label: 'Gasoline, supercharged (BSFC 0.60)' },
  gas_turbo: { bsfc: 0.65, rho: 720, label: 'Gasoline, turbocharged (BSFC 0.65)' },
  e85_na: { bsfc: 0.5 * E85_FACTOR, rho: 780, label: 'E85, naturally aspirated (BSFC 0.75)' },
  e85_sc: { bsfc: 0.6 * E85_FACTOR, rho: 780, label: 'E85, supercharged (BSFC 0.90)' },
  e85_turbo: { bsfc: 0.65 * E85_FACTOR, rho: 780, label: 'E85, turbocharged (BSFC 0.975)' },
  custom: { bsfc: null, rho: null, label: 'Enter BSFC and fuel density' },
};

export const schema = {
  id: 'fuel-injector-size',
  name: 'Fuel injector size calculator',
  category: 'automotive',
  summary: 'Fuel injector size in lb/hr and cc/min from horsepower, BSFC, injector count and duty cycle, or the horsepower injectors support, with fuel pressure.',
  related: ['horsepower', 'engine-displacement', 'compression-ratio', 'quarter-mile'],
  assumptions: [
    'Fuel flow is the flywheel horsepower times the brake specific fuel consumption (BSFC); each injector delivers its share at no more than the maximum duty cycle, the fraction of each engine cycle it is open.',
    'Typical gasoline BSFC: 0.45 to 0.50 lb/(hp·h) naturally aspirated and 0.55 to 0.75 with a supercharger or turbo, which run richer to control knock (EngineLabs); the presets use 0.50, 0.60 and 0.65.',
    'E85 needs about 1.5 times the fuel mass of gasoline for the same air (stoichiometric air-fuel ratio 9.8 against 14.7), so its presets are the gasoline values × 1.5; methanol, diesel or other fuels need a BSFC from the engine builder.',
    'Injector flow rises with the square root of the pressure across the injector (fuel pressure minus manifold pressure), as for any orifice; on a boosted engine with a 1:1 regulator the difference stays at the base pressure.',
    'lb/hr converts to cc/min with the fuel density: 720 kg/m³ for gasoline, which gives the usual 10.5 cc/min per lb/hr (EN 228 allows 720 to 775 kg/m³), and 780 kg/m³ for E85.',
  ],
  notes: [
    'Verification 2026-11-08: 450 hp naturally aspirated on gasoline (BSFC 0.50), 8 injectors at 80 % duty: total 225 lb/hr, 35.2 lb/hr per injector, 369.1 cc/min at 720 kg/m³; 42 lb/hr injectors support 537.6 hp, or 620.8 hp at 58 psi instead of 43.5 psi. Checked by hand.',
  ],
  sources: [
    'G. Acosta, How To Calculate What Size Fuel Injectors Your Engine Needs, EngineLabs, 21 June 2024 (lb/hr = hp × BSFC / (injectors × duty cycle); BSFC 0.45–0.50 NA, 0.55–0.75 forced induction; maximum duty cycle about 85 %)',
    'J.B. Heywood, Internal Combustion Engine Fundamentals, McGraw-Hill 1988, Section 2.9 (brake specific fuel consumption) and Appendix D (stoichiometric air-fuel ratios)',
    'EN 228 Automotive fuels — Unleaded petrol — Requirements and test methods (density at 15 °C 720.0 to 775.0 kg/m³)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'size', options: [{ value: 'size', label: 'Injector size for a horsepower' }, { value: 'hp', label: 'Horsepower a set of injectors supports' }] },
    { id: 'power_w', label: 'Target flywheel horsepower', group: 'power', unit: 'W', display: 'hp', default: 450 * HP, min: 1000, max: 1e7, visibleWhen: { mode: 'size' } },
    { id: 'flow_kg_s', label: 'Injector rated flow (at the rated pressure)', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', default: 42 * LB_H, min: 1e-5, max: 0.1, visibleWhen: { mode: 'hp' } },
    { id: 'fuel', label: 'Fuel and engine', type: 'select', default: 'gas_na', options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })) },
    { id: 'bsfc_g_kwh', label: 'Brake specific fuel consumption BSFC', group: 'specific_fuel', unit: 'g_kWh', display: 'lb_hph', default: 0.5 * LB_HPH, min: 100, max: 2000, visibleWhen: { fuel: 'custom' } },
    { id: 'density_kg_m3', label: 'Fuel density', group: 'density', unit: 'kg_m3', display: 'g_cm3', default: 720, min: 500, max: 1100, visibleWhen: { fuel: 'custom' } },
    { id: 'injectors', label: 'Number of injectors', group: 'dimensionless', unit: 'none', default: 8, min: 1, max: 32, integer: true },
    { id: 'duty', label: 'Maximum injector duty cycle', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.1, max: 1 },
    { id: 'rated_pa', label: 'Pressure the injector is rated at', group: 'pressure', unit: 'Pa', display: 'psi', default: 300000, min: 50000, max: 1e7 },
    { id: 'operating_pa', label: 'Operating pressure across the injector', group: 'pressure', unit: 'Pa', display: 'psi', default: 300000, min: 50000, max: 1e7 },
  ],
  outputs: [
    { id: 'injector_rated_kg_s', label: 'Injector size at the rated pressure', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', decimals: 1 },
    { id: 'injector_cc_min', label: 'Injector size at the rated pressure, cc/min', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'injector_op_kg_s', label: 'Flow per injector at the operating pressure', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', decimals: 1 },
    { id: 'total_kg_s', label: 'Total fuel flow at full power', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', decimals: 1 },
    { id: 'hp_supported_w', label: 'Horsepower supported', group: 'power', unit: 'W', display: 'hp', decimals: 0 },
    { id: 'bsfc_used_g_kwh', label: 'BSFC used', group: 'specific_fuel', unit: 'g_kWh', display: 'lb_hph', decimals: 3 },
  ],
  example: {
    inputs: { mode: 'size', power_w: [450, 'hp'], fuel: 'gas_na', injectors: 8, duty: [80, 'pct'], rated_pa: [43.5, 'psi'], operating_pa: [43.5, 'psi'] },
    results: { total_kg_s: '225.0 lb/h', injector_rated_kg_s: '35.2 lb/h', injector_cc_min: '369.1' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['size', 'hp'], 'mode', 'Calculate');
  assertOneOf(x.fuel, Object.keys(PRESETS), 'fuel', 'Fuel and engine');
  const preset = PRESETS[x.fuel];
  const bsfc = x.fuel === 'custom' ? assertRange(x.bsfc_g_kwh, 100, 2000, 'bsfc_g_kwh', 'BSFC') : preset.bsfc * LB_HPH;
  const rho = x.fuel === 'custom' ? assertRange(x.density_kg_m3, 500, 1100, 'density_kg_m3', 'Fuel density') : preset.rho;
  const n = assertInteger(assertRange(x.injectors, 1, 32, 'injectors', 'Number of injectors'), 'injectors', 'Number of injectors');
  const dc = assertRange(x.duty, 0.1, 1, 'duty', 'Maximum duty cycle');
  const pr = assertRange(x.rated_pa, 50000, 1e7, 'rated_pa', 'Rated pressure');
  const po = assertRange(x.operating_pa, 50000, 1e7, 'operating_pa', 'Operating pressure');
  const pf = Math.sqrt(po / pr); // operating flow / rated flow
  let power;
  let opFlow;
  let ratedFlow;
  if (x.mode === 'size') {
    power = assertRange(x.power_w, 1000, 1e7, 'power_w', 'Target horsepower');
    const total = (power * bsfc) / 3.6e9; // kg/s
    opFlow = total / (n * dc);
    ratedFlow = opFlow / pf;
  } else {
    ratedFlow = assertRange(x.flow_kg_s, 1e-5, 0.1, 'flow_kg_s', 'Injector rated flow');
    opFlow = ratedFlow * pf;
    power = (opFlow * n * dc * 3.6e9) / bsfc;
  }
  const warnings = [];
  if (dc > 0.85) warnings.push('A duty cycle above 85 % leaves the injector little time to close and open; injector makers generally suggest 85 % at most (EngineLabs).');
  if (x.fuel === 'custom' && bsfc / LB_HPH < 0.35) warnings.push('A BSFC below 0.35 lb/(hp·h) is better than spark-ignition engines achieve on gasoline; check the value.');
  return {
    outputs: {
      injector_rated_kg_s: ratedFlow,
      injector_cc_min: (ratedFlow * 60 * 1e6) / rho, // kg/s → cm³/min
      injector_op_kg_s: opFlow,
      total_kg_s: opFlow * n * dc,
      hp_supported_w: power,
      bsfc_used_g_kwh: bsfc,
    },
    warnings,
  };
}
