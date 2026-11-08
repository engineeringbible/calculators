/**
 * compressed-air/calc.js — compressed air system calculations: leak flow through a hole and its yearly cost, receiver
 * size for a demand event, pressure drop in an air main, and compressor power (isothermal and adiabatic).
 *
 * Leak (choked when p0/pa ≥ 1.893): ṁ = Cd A p0 √(γ/(R T)) (2/(γ+1))^((γ+1)/(2(γ−1))); free air Q = ṁ / ρ_atm.
 * Receiver (US DOE MEASUR / Compressed Air Challenge): V = t (Q_demand − Q_supply) p_atm / (p1 − p2).
 * Pipe: isothermal Darcy p1² − p2² = (ṁ/A)² R T [f L/D + 2 ln(p1/p2)];  Atlas Copco / BCAS Δp = 450 qc^1.85 l / (d⁵ p).
 * Power: W_iso = p1 V1 ln r;  W_ad = n γ/(γ−1) p1 V1 [r^((γ−1)/(nγ)) − 1];  shaft = W_ad / η_isen.
 * Schema units: SI — Pa, °C, m³/s of free air, m, W, J.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative, assertInteger } from '../shared/validate.js';
import { frictionFactor } from '../shared/pipes.js';

/** Gas constant and ratio of specific heats of dry air. */
const R_AIR = 287.05;
const GAMMA = 1.4;
const CFM = 0.028316846592 / 60;
const PSI = 6894.757293168;
/** Critical pressure ratio p0/pb for choking of air: ((γ+1)/2)^(γ/(γ−1)) = 1.893. */
const CHOKE = ((GAMMA + 1) / 2) ** (GAMMA / (GAMMA - 1));

/** Dynamic viscosity of air, Pa·s, by Sutherland's law (μ0 = 1.716e-5 at 273.15 K, S = 110.4 K). */
export const airViscosity = (tK) => 1.716e-5 * (tK / 273.15) ** 1.5 * (273.15 + 110.4) / (tK + 110.4);

/** Mass flow of air (kg/s) through an orifice from p0 (Pa abs, T0 in K) to pb (Pa abs); choked or subsonic. */
export function orificeMassFlow(cd, area, p0, t0, pb) {
  if (p0 / pb >= CHOKE) {
    return cd * area * p0 * Math.sqrt(GAMMA / (R_AIR * t0)) * (2 / (GAMMA + 1)) ** ((GAMMA + 1) / (2 * (GAMMA - 1)));
  }
  const r = pb / p0;
  return cd * area * p0 * Math.sqrt(((2 * GAMMA) / ((GAMMA - 1) * R_AIR * t0)) * (r ** (2 / GAMMA) - r ** ((GAMMA + 1) / GAMMA)));
}

/** Outlet pressure (Pa abs) of isothermal flow with friction, or null when the flow cannot pass the pipe. */
export function isothermalOutlet(p1, mdot, area, tK, fLD) {
  const g2RT = (mdot / area) ** 2 * R_AIR * tK;
  let p2 = p1;
  for (let k = 0; k < 200; k += 1) {
    const rhs = p1 * p1 - g2RT * (fLD + 2 * Math.log(p1 / p2));
    if (!(rhs > 0)) return null;
    const next = Math.sqrt(rhs);
    if (Math.abs(next - p2) < 1e-9 * p1) { p2 = next; break; }
    p2 = next;
  }
  // isothermal choking: the outlet velocity may not exceed √(R T) (Mach 1/√γ)
  if ((mdot / area) / (p2 / (R_AIR * tK)) > Math.sqrt(R_AIR * tK)) return null;
  return p2;
}

export const schema = {
  id: 'compressed-air',
  name: 'Compressed air calculator: leaks, receiver, pipe drop and power',
  category: 'mechanical',
  summary: 'Compressed air leak flow and yearly cost, receiver tank size, air main pressure drop and compressor power, isothermal and adiabatic.',
  related: ['ideal-gas-law', 'pipe-flow', 'electricity-cost', 'nozzle-flow'],
  assumptions: [
    'Air is an ideal gas with R = 287.05 J/(kg·K) and γ = 1.4. Flows are free air delivery (FAD): volume at the atmospheric pressure and air temperature entered, the way compressors are rated (ISO 1217).',
    'A leak is a round hole of diameter d with a coefficient of flow Cd; Cd = 1 reproduces the published leakage tables (104 cfm through 1/4 in at 100 psig), and the US DOE multiplies by 0.61 for sharp-edged holes. Above 13 psig the flow through a hole to the atmosphere is choked (sonic) and grows linearly with the absolute pressure.',
    'The leak cost uses a compressor specific power: about 18 kW per 100 cfm of free air for a typical plant (US DOE), 15 to 16 for an efficient one; the power is assumed to fall in proportion when the leaks are fixed, which needs good compressor control.',
    'The receiver size is the volume that supplies the demand minus any compressor or metered supply during the event while the pressure falls from the line pressure to the lowest acceptable pressure, at constant temperature.',
    'Pipe pressure drop is isothermal flow with the Darcy friction factor (Colebrook, roughness 0.046 mm for steel) and Sutherland viscosity; the Atlas Copco/BCAS empirical formula is shown for comparison. Fittings must be added as equivalent length.',
  ],
  notes: [
    'Verification 2026-11-08: a 1/4 in hole at 100 psig, 14.7 psia and 68 °F leaks 104 cfm of free air (0.0591 kg/s), the published table value; at 18.4 kW per 100 cfm, 8 760 h and 0.10 per kWh it costs 16 764 a year, the CAGI fact sheet figure. Checked by hand.',
  ],
  sources: [
    'US DOE, Compressed Air Tip Sheet #3 "Minimize Compressed Air Leaks" (leakage table at coefficient 1, ×0.61 sharp-edged, 18 kW/100 cfm) and CAGI / Compressed Air Challenge Fact Sheet #7 "Compressed Air System Leaks" (rev. 2026)',
    'US DOE / ORNL MEASUR Tools Suite, Receiver Tank Calculator: dedicated and metered storage V = t (Q − Q_metered) p_atm / (p_in − p_out)',
    'Atlas Copco, Compressed Air Manual, 8th ed.: pipe dimensioning d⁵ = 450 qc^1.85 l / (Δp p) (BCAS form 1.6 × 10⁸ L Q^1.85 / (d⁵ p)) and the 0.1 bar network guideline',
    'F. M. White, Fluid Mechanics, 7th ed., Ch. 9 (choked flow through an orifice, isothermal flow with friction); Y. A. Çengel & M. A. Boles, Thermodynamics, Ch. 7 (isothermal, isentropic and multistage compressor work)',
  ],
  inputs: [
    { id: 'task', label: 'Calculate', type: 'select', default: 'leak', options: [{ value: 'leak', label: 'Leak flow and yearly cost' }, { value: 'receiver', label: 'Receiver (air tank) size' }, { value: 'pipe', label: 'Pressure drop in an air pipe' }, { value: 'power', label: 'Compressor power' }] },
    { id: 'p_line_pa', label: 'Line (discharge) pressure, gauge', group: 'pressure', unit: 'Pa', display: 'psi', default: 100 * PSI, min: 1000, max: 5e6 },
    { id: 'p_atm_pa', label: 'Atmospheric pressure', group: 'pressure', unit: 'Pa', display: 'psi', default: 101325, min: 50000, max: 110000 },
    { id: 't_air_c', label: 'Air temperature (inlet and line)', group: 'temperature', unit: 'C', display: 'F', default: 20, min: -40, max: 80 },
    { id: 'hole_d_m', label: 'Leak hole diameter', group: 'length', unit: 'm', display: 'in', default: 0.00635, min: 1e-5, max: 0.1, visibleWhen: { task: 'leak' } },
    { id: 'cd_leak', label: 'Coefficient of flow of the hole', group: 'ratio', unit: 'frac', default: 1, min: 0.3, max: 1, visibleWhen: { task: 'leak' }, help: '1 matches the published leak tables; 0.97 well-rounded, 0.61 sharp-edged.' },
    { id: 'n_leaks', label: 'Number of such leaks', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 100000, integer: true, visibleWhen: { task: 'leak' } },
    { id: 'spec_power', label: 'Compressor specific power, kW per 100 cfm', group: 'dimensionless', unit: 'none', default: 18, min: 5, max: 60, visibleWhen: { task: 'leak' }, help: '18 typical (US DOE), 15–16 efficient. 1 kW per m³/min = 2.83 kW per 100 cfm.' },
    { id: 'hours', label: 'Pressurised hours per year', group: 'dimensionless', unit: 'none', default: 8760, min: 0, max: 8784, visibleWhen: { task: 'leak' } },
    { id: 'price_kwh', label: 'Electricity price per kWh', group: 'dimensionless', unit: 'none', default: 0.1, min: 0, max: 10, visibleWhen: { task: 'leak' } },
    { id: 'flow_m3s', label: 'Air demand, free air (FAD)', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 100 * CFM, min: 1e-6, max: 100, visibleWhen: { task: ['receiver', 'pipe', 'power'] } },
    { id: 'supply_m3s', label: 'Supply during the event (compressor or metering valve)', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 0, min: 0, max: 100, visibleWhen: { task: 'receiver' } },
    { id: 'event_s', label: 'Duration of the demand event', group: 'time', unit: 's', display: 'min', default: 60, min: 0.1, max: 86400, visibleWhen: { task: 'receiver' } },
    { id: 'p_min_pa', label: 'Lowest acceptable pressure, gauge', group: 'pressure', unit: 'Pa', display: 'psi', default: 90 * PSI, min: 0, max: 5e6, visibleWhen: { task: 'receiver' } },
    { id: 'pipe_d_m', label: 'Pipe inside diameter', group: 'length', unit: 'm', display: 'in', default: 1.049 * 0.0254, min: 0.002, max: 2, visibleWhen: { task: 'pipe' } },
    { id: 'pipe_l_m', label: 'Pipe length (including fittings as equivalent length)', group: 'length', unit: 'm', display: 'ft', default: 30.48, min: 0.1, max: 100000, visibleWhen: { task: 'pipe' } },
    { id: 'rough_m', label: 'Pipe roughness', group: 'length', unit: 'm', display: 'mm', default: 0.000046, min: 0, max: 0.005, visibleWhen: { task: 'pipe' }, help: 'Steel 0.046 mm, galvanised 0.15 mm, aluminium or plastic 0.0015 mm.' },
    { id: 'stages', label: 'Compression stages (intercooled to inlet temperature)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 4, integer: true, visibleWhen: { task: 'power' } },
    { id: 'eta_isen', label: 'Isentropic (adiabatic) efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.75, min: 0.3, max: 1, visibleWhen: { task: 'power' } },
    { id: 'eta_motor', label: 'Motor efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.93, min: 0.5, max: 1, visibleWhen: { task: 'power' } },
  ],
  outputs: [
    { id: 'leak_flow_m3s', label: 'Leak flow, free air', group: 'volume_flow', unit: 'm3_s', display: 'cfm', visibleWhen: { task: 'leak' } },
    { id: 'leak_mass_kg_s', label: 'Leak mass flow', group: 'mass_flow', unit: 'kg_s', display: 'kg_h', visibleWhen: { task: 'leak' } },
    { id: 'leak_regime', label: 'Flow through the hole', type: 'text', visibleWhen: { task: 'leak' } },
    { id: 'leak_power_w', label: 'Compressor power wasted', group: 'power', unit: 'W', display: 'kW', visibleWhen: { task: 'leak' } },
    { id: 'leak_energy_j', label: 'Energy wasted per year', group: 'energy', unit: 'J', display: 'kWh', visibleWhen: { task: 'leak' } },
    { id: 'leak_cost', label: 'Cost per year', group: 'money', unit: 'cur', visibleWhen: { task: 'leak' } },
    { id: 'receiver_m3', label: 'Receiver volume needed', group: 'volume', unit: 'm3', display: 'gal_us', visibleWhen: { task: 'receiver' } },
    { id: 'usable_m3', label: 'Air drawn from storage, free air', group: 'volume', unit: 'm3', display: 'ft3', visibleWhen: { task: 'receiver' } },
    { id: 'dp_darcy_pa', label: 'Pressure drop (isothermal Darcy)', group: 'pressure', unit: 'Pa', display: 'psi', visibleWhen: { task: 'pipe' } },
    { id: 'dp_empirical_pa', label: 'Pressure drop (Atlas Copco / BCAS formula)', group: 'pressure', unit: 'Pa', display: 'psi', visibleWhen: { task: 'pipe' } },
    { id: 'p_out_pa', label: 'Pressure at the pipe end, gauge', group: 'pressure', unit: 'Pa', display: 'psi', visibleWhen: { task: 'pipe' } },
    { id: 'velocity_m_s', label: 'Air velocity at line pressure', group: 'speed', unit: 'm_s', display: 'ft_s', visibleWhen: { task: 'pipe' } },
    { id: 'reynolds', label: 'Reynolds number', group: 'dimensionless', unit: 'none', decimals: 0, visibleWhen: { task: 'pipe' } },
    { id: 'friction', label: 'Darcy friction factor', group: 'dimensionless', unit: 'none', decimals: 4, visibleWhen: { task: 'pipe' } },
    { id: 'w_iso_w', label: 'Isothermal power (ideal minimum)', group: 'power', unit: 'W', display: 'kW', visibleWhen: { task: 'power' } },
    { id: 'w_ad_w', label: 'Adiabatic (isentropic) power', group: 'power', unit: 'W', display: 'kW', visibleWhen: { task: 'power' } },
    { id: 'shaft_w', label: 'Shaft power', group: 'power', unit: 'W', display: 'kW', visibleWhen: { task: 'power' } },
    { id: 'input_w', label: 'Electrical input power', group: 'power', unit: 'W', display: 'kW', visibleWhen: { task: 'power' } },
    { id: 'specific_kw', label: 'Specific power at the motor input, kW per 100 cfm', group: 'dimensionless', unit: 'none', decimals: 1, visibleWhen: { task: 'power' } },
    { id: 't_discharge_c', label: 'Discharge temperature of each stage (isentropic, without oil cooling)', group: 'temperature', unit: 'C', display: 'F', visibleWhen: { task: 'power' } },
  ],
  example: {
    inputs: { task: 'leak', p_line_pa: [100, 'psi'], p_atm_pa: [14.696, 'psi'], t_air_c: [68, 'F'], hole_d_m: [0.25, 'in'], cd_leak: 1, n_leaks: 1, spec_power: 18.4, hours: 8760, price_kwh: 0.1 },
    results: { leak_flow_m3s: '104.0 cfm', leak_power_w: '19.1 kW', leak_energy_j: '167 700 kWh', leak_cost: '16 767' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.task, ['leak', 'receiver', 'pipe', 'power'], 'task', 'Calculate');
  const pg = assertRange(x.p_line_pa, 1000, 5e6, 'p_line_pa', 'Line pressure');
  const pa = assertRange(x.p_atm_pa, 50000, 110000, 'p_atm_pa', 'Atmospheric pressure');
  const tK = assertRange(x.t_air_c, -40, 80, 't_air_c', 'Air temperature') + 273.15;
  const p1 = pg + pa;
  const rhoFree = pa / (R_AIR * tK);
  const out = {
    leak_flow_m3s: null, leak_mass_kg_s: null, leak_regime: null, leak_power_w: null, leak_energy_j: null, leak_cost: null,
    receiver_m3: null, usable_m3: null,
    dp_darcy_pa: null, dp_empirical_pa: null, p_out_pa: null, velocity_m_s: null, reynolds: null, friction: null,
    w_iso_w: null, w_ad_w: null, shaft_w: null, input_w: null, specific_kw: null, t_discharge_c: null,
  };
  const warnings = [];
  if (x.task === 'leak') {
    const d = assertRange(x.hole_d_m, 1e-5, 0.1, 'hole_d_m', 'Leak hole diameter');
    const cd = assertRange(x.cd_leak, 0.3, 1, 'cd_leak', 'Coefficient of flow');
    const n = assertInteger(assertRange(x.n_leaks, 1, 100000, 'n_leaks', 'Number of leaks'), 'n_leaks', 'Number of leaks');
    const spec = assertRange(x.spec_power, 5, 60, 'spec_power', 'Compressor specific power');
    const hours = assertRange(x.hours, 0, 8784, 'hours', 'Pressurised hours per year');
    const price = assertNonNegative(x.price_kwh, 'price_kwh', 'Electricity price');
    const mdot = n * orificeMassFlow(cd, (Math.PI / 4) * d * d, p1, tK, pa);
    const q = mdot / rhoFree;
    const power = (q / CFM / 100) * spec * 1000;
    out.leak_flow_m3s = q;
    out.leak_mass_kg_s = mdot;
    out.leak_regime = p1 / pa >= CHOKE ? 'Choked (sonic): flow proportional to the absolute pressure' : 'Subsonic: pressure below about 13 psig (0.9 bar g)';
    out.leak_power_w = power;
    out.leak_energy_j = power * hours * 3600;
    out.leak_cost = (power / 1000) * hours * price;
  } else if (x.task === 'receiver') {
    const q = assertPositive(x.flow_m3s, 'flow_m3s', 'Air demand');
    const s = assertNonNegative(x.supply_m3s, 'supply_m3s', 'Supply during the event');
    const t = assertPositive(x.event_s, 'event_s', 'Duration of the demand event');
    const pmin = assertNonNegative(x.p_min_pa, 'p_min_pa', 'Lowest acceptable pressure');
    if (pmin >= pg) throw new Error('Lowest acceptable pressure: it must be below the line pressure, or the receiver cannot release any air.');
    if (s >= q) throw new Error('Supply during the event: it covers the whole demand, so no storage is needed; enter a supply below the demand.');
    const usable = t * (q - s);
    out.usable_m3 = usable;
    out.receiver_m3 = (usable * pa) / (pg - pmin);
    if (pg - pmin < 0.2e5) warnings.push('A pressure band under 0.2 bar (3 psi) needs a very large receiver: check whether the lowest acceptable pressure can be lower.');
  } else if (x.task === 'pipe') {
    const q = assertPositive(x.flow_m3s, 'flow_m3s', 'Air demand');
    const d = assertRange(x.pipe_d_m, 0.002, 2, 'pipe_d_m', 'Pipe inside diameter');
    const l = assertRange(x.pipe_l_m, 0.1, 100000, 'pipe_l_m', 'Pipe length');
    const eps = assertRange(x.rough_m, 0, 0.005, 'rough_m', 'Pipe roughness');
    const mdot = q * rhoFree;
    const area = (Math.PI / 4) * d * d;
    const re = (4 * mdot) / (Math.PI * d * airViscosity(tK));
    const f = frictionFactor(re, eps / d);
    const p2 = isothermalOutlet(p1, mdot, area, tK, (f * l) / d);
    if (p2 === null) throw new Error('Pipe inside diameter: the pipe is far too small for this flow; the pressure would fall to nothing (the flow chokes). Choose a larger pipe or a shorter run.');
    out.dp_darcy_pa = p1 - p2;
    out.p_out_pa = p2 - pa;
    out.dp_empirical_pa = 1e5 * (450 * (q * 1000) ** 1.85 * l) / ((d * 1000) ** 5 * (p1 / 1e5));
    out.velocity_m_s = mdot / ((p1 / (R_AIR * tK)) * area);
    out.reynolds = re;
    out.friction = f;
    if (out.dp_darcy_pa > 0.1e5) warnings.push('Pressure drop above 0.1 bar (1.5 psi): Atlas Copco recommends no more than 0.1 bar from the compressor to the farthest user in a fixed network.');
    if (out.dp_darcy_pa > 0.1 * p1) warnings.push('Pressure drop above 10 % of the line pressure: the pipe is undersized and the empirical formula is no longer reliable.');
  } else {
    const q = assertPositive(x.flow_m3s, 'flow_m3s', 'Air demand');
    const n = assertInteger(assertRange(x.stages, 1, 4, 'stages', 'Compression stages'), 'stages', 'Compression stages');
    const eta = assertRange(x.eta_isen, 0.3, 1, 'eta_isen', 'Isentropic efficiency');
    const em = assertRange(x.eta_motor, 0.5, 1, 'eta_motor', 'Motor efficiency');
    const r = p1 / pa;
    const k = (GAMMA - 1) / (n * GAMMA);
    const p1v1 = pa * q;
    out.w_iso_w = p1v1 * Math.log(r);
    out.w_ad_w = (n * GAMMA / (GAMMA - 1)) * p1v1 * (r ** k - 1);
    out.shaft_w = out.w_ad_w / eta;
    out.input_w = out.shaft_w / em;
    out.specific_kw = (out.input_w / 1000) / (q / CFM / 100);
    out.t_discharge_c = tK * r ** k - 273.15;
    if (n === 1 && r > 11) warnings.push('Pressure ratio above 11 in one stage: oil-free compressors need two stages; oil-injected screws handle up to about 13 bar.');
  }
  return { outputs: out, warnings };
}
