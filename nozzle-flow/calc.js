/**
 * nozzle-flow/calc.js — water flow from a nozzle, hydrant outlet, spray tip or sprinkler: flow, pressure or size from
 * the orifice equation or a K-factor, with the jet velocity and the nozzle reaction force.
 *
 * Q = C_d A √(2 Δp / ρ);  fire service (NFPA 291): Q[gpm] = 29.84 c d²[in] √p[psi];  sprinkler (NFPA 13): Q = K √p.
 * Jet momentum F = ρ Q v = Q √(2 ρ Δp) (= 1.57 d² p for a smooth bore, IFSTA); IFSTA fog rule NR = 0.0505 Q √p.
 * Schema units: SI — m, m³/s, Pa, kg/m³, m/s, N.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

const IN = 0.0254;
const PSI = 6894.757293168;
const GPM = 0.003785411784 / 60;
const LBF = 4.4482216152605;
/** 1 gpm/psi^½ in L/min/bar^½: 3.785411784 × √(100000 / 6894.757) = 14.416. */
export const K_US_SI = 3.785411784 * Math.sqrt(1e5 / PSI);
/** NFPA 291 (Freeman) constant: Q[gpm] = 29.84 c d²[in] √p[psi]. */
const FREEMAN = 29.84;
/** IFSTA fog-nozzle reaction: NR[lbf] = 0.0505 Q[gpm] √NP[psi]. */
const IFSTA_FOG = 0.0505;

export const schema = {
  id: 'nozzle-flow',
  name: 'Nozzle flow calculator (orifice, fire nozzle and K-factor)',
  category: 'mechanical',
  summary: 'Water flow, pressure or orifice size of a nozzle, hydrant outlet or sprinkler from Q = Cd A √(2Δp/ρ), 29.84 c d² √p or Q = K√p, with nozzle reaction.',
  related: ['orifice-flow', 'pump-power', 'total-dynamic-head', 'minor-losses'],
  assumptions: [
    'The nozzle discharges a liquid to the atmosphere; the pressure is the gauge pressure at the nozzle inlet (or the pitot pressure in the jet), and the velocity of approach in the hose or pipe is neglected.',
    'The discharge coefficient Cd takes account of jet contraction and friction: about 0.97 to 1.0 for a smooth-bore fire nozzle, 0.90 for a smooth rounded hydrant outlet, 0.80 for a square sharp one and 0.70 for one projecting into the barrel (NFPA 291), and about 0.6 for a sharp-edged hole.',
    'A K-factor already contains the orifice area and discharge coefficient; it is converted between US units (gpm/psi^½) and metric units (L/min/bar^½) with the factor 14.42.',
    'The reaction force is the jet momentum ρ Q v with the ideal jet velocity √(2Δp/ρ); for a smooth bore with Cd = 1 it equals the IFSTA formula 1.57 d² p. The IFSTA fog-nozzle formula 0.0505 Q √p is shown as well and gives about 4 % less.',
  ],
  notes: [
    'Verification 2026-11-08: NFPA 291 hydrant outlet 2.5 in, c = 0.90, pitot 23 psi: Freeman formula 805 gpm (Temecula fire flow examples print 804 gpm), orifice equation at 999 kg/m³ also 805 gpm, K-factor 167.8 gpm/psi½, ideal jet velocity 58.5 ft/s, reaction 203 lbf. Checked by hand.',
  ],
  sources: [
    'NFPA 291, Recommended Practice for Water Flow Testing and Marking of Hydrants (2022): Q = 29.84 c d² √p and outlet coefficients 0.90 / 0.80 / 0.70',
    'NFPA 13, Standard for the Installation of Sprinkler Systems (2022), hydraulic calculations: sprinkler discharge Q = K √p, minimum operating pressure 7 psi (0.5 bar)',
    'IFSTA, Pumping and Aerial Apparatus Driver/Operator Handbook, fire-stream hydraulics: smooth-bore flow 29.7 d² √NP, nozzle reaction 1.57 d² NP and 0.0505 Q √NP',
    'F. M. White, Fluid Mechanics, 7th ed., Ch. 3 (momentum of a free jet) and Ch. 6 (orifice discharge coefficient)',
  ],
  inputs: [
    { id: 'solve', label: 'Solve for', type: 'select', default: 'flow', options: [{ value: 'flow', label: 'Flow from size and pressure' }, { value: 'pressure', label: 'Pressure for a flow' }, { value: 'size', label: 'Orifice size or K-factor for a flow and pressure' }] },
    { id: 'spec', label: 'Nozzle described by', type: 'select', default: 'orifice', options: [{ value: 'orifice', label: 'Orifice diameter and discharge coefficient' }, { value: 'k', label: 'K-factor (sprinklers, spray nozzles)' }] },
    { id: 'diameter_m', label: 'Orifice or tip diameter d', group: 'length', unit: 'm', display: 'in', default: 0.0635, min: 0.0001, max: 1, visibleWhen: { spec: 'orifice', solve: ['flow', 'pressure'] } },
    { id: 'cd', label: 'Discharge coefficient Cd (c)', group: 'ratio', unit: 'frac', default: 0.9, min: 0.3, max: 1, visibleWhen: { spec: 'orifice' }, help: 'Smooth-bore nozzle 0.97–1.0; hydrant outlet 0.90 rounded, 0.80 square, 0.70 projecting; sharp-edged hole about 0.6.' },
    { id: 'k_units', label: 'K-factor units', type: 'select', default: 'us', options: [{ value: 'us', label: 'US: gpm/psi½ (K 5.6, 8.0, 11.2 …)' }, { value: 'si', label: 'Metric: L/min/bar½ (K80, K115, K160 …)' }], visibleWhen: { spec: 'k' } },
    { id: 'k_factor', label: 'K-factor', group: 'dimensionless', unit: 'none', default: 5.6, min: 0.01, max: 2000, visibleWhen: { spec: 'k', solve: ['flow', 'pressure'] } },
    { id: 'pressure_pa', label: 'Nozzle pressure p (gauge)', group: 'pressure', unit: 'Pa', display: 'psi', default: 23 * PSI, min: 1, max: 1e8, visibleWhen: { solve: ['flow', 'size'] } },
    { id: 'flow_m3s', label: 'Flow Q', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us', default: 250 * GPM, min: 1e-8, max: 100, visibleWhen: { solve: ['pressure', 'size'] } },
    { id: 'density', label: 'Liquid density ρ', group: 'density', unit: 'kg_m3', default: 999, min: 500, max: 2000, help: 'Fresh water 999 kg/m³ (62.4 lb/ft³), the basis of the 29.84 constant; sea water 1 025.' },
  ],
  outputs: [
    { id: 'flow_out_m3s', label: 'Flow Q', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us' },
    { id: 'pressure_out_pa', label: 'Nozzle pressure p', group: 'pressure', unit: 'Pa', display: 'psi' },
    { id: 'diameter_out_m', label: 'Orifice diameter d', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'freeman_m3s', label: 'Flow by the fire-service formula 29.84 c d² √p', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us' },
    { id: 'k_us', label: 'K-factor, gpm/psi½', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'k_si', label: 'K-factor, L/min/bar½', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'velocity_m_s', label: 'Jet velocity √(2Δp/ρ)', group: 'speed', unit: 'm_s', display: 'ft_s' },
    { id: 'reaction_n', label: 'Nozzle reaction (jet momentum ρ Q v)', group: 'force', unit: 'N', display: 'lbf' },
    { id: 'reaction_fog_n', label: 'Nozzle reaction, IFSTA fog formula 0.0505 Q √p', group: 'force', unit: 'N', display: 'lbf' },
  ],
  example: {
    inputs: { solve: 'flow', spec: 'orifice', diameter_m: [2.5, 'in'], cd: 0.9, pressure_pa: [23, 'psi'], density: [999, 'kg_m3'] },
    results: { flow_out_m3s: '805 US gpm', freeman_m3s: '805 US gpm', k_us: '167.8', velocity_m_s: '58.5 ft/s', reaction_n: '203 lbf' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['flow', 'pressure', 'size'], 'solve', 'Solve for');
  assertOneOf(x.spec, ['orifice', 'k'], 'spec', 'Nozzle described by');
  assertOneOf(x.k_units, ['us', 'si'], 'k_units', 'K-factor units');
  const rho = assertRange(x.density, 500, 2000, 'density', 'Liquid density');
  const orifice = x.spec === 'orifice';
  const cd = orifice ? assertRange(x.cd, 0.3, 1, 'cd', 'Discharge coefficient Cd') : null;
  let q; let p; let d = null; let kUs;
  if (x.solve !== 'size') {
    if (orifice) d = assertRange(x.diameter_m, 0.0001, 1, 'diameter_m', 'Orifice or tip diameter');
    else {
      const k = assertPositive(x.k_factor, 'k_factor', 'K-factor');
      kUs = x.k_units === 'us' ? k : k / K_US_SI;
    }
  }
  if (x.solve === 'flow' || x.solve === 'size') p = assertPositive(x.pressure_pa, 'pressure_pa', 'Nozzle pressure');
  if (x.solve === 'pressure' || x.solve === 'size') q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow');
  const area = (dd) => (Math.PI / 4) * dd * dd;
  if (x.solve === 'flow') {
    q = orifice ? cd * area(d) * Math.sqrt((2 * p) / rho) : kUs * Math.sqrt(p / PSI) * GPM;
  } else if (x.solve === 'pressure') {
    p = orifice ? (rho / 2) * (q / (cd * area(d))) ** 2 : (q / GPM / kUs) ** 2 * PSI;
  } else if (orifice) {
    d = Math.sqrt((4 * q) / (Math.PI * cd * Math.sqrt((2 * p) / rho)));
  }
  if (kUs === undefined) kUs = q / GPM / Math.sqrt(p / PSI);
  const v = Math.sqrt((2 * p) / rho);
  const warnings = [];
  if (x.spec === 'k' && p < 7 * PSI - 1e-6) warnings.push('Pressure below 7 psi (0.5 bar): NFPA 13 requires at least 7 psi at any operating sprinkler.');
  if (orifice && d > 0.2) warnings.push('Orifice above 200 mm (8 in): check that the velocity of approach in the supply pipe is still small compared with the jet velocity.');
  if (p > 2e7) warnings.push('Pressure above 200 bar (2 900 psi): this is a jetting or cleaning nozzle; check the discharge coefficient with the maker.');
  return {
    outputs: {
      flow_out_m3s: q,
      pressure_out_pa: p,
      diameter_out_m: d,
      freeman_m3s: orifice ? FREEMAN * cd * (d / IN) ** 2 * Math.sqrt(p / PSI) * GPM : null,
      k_us: kUs,
      k_si: kUs * K_US_SI,
      velocity_m_s: v,
      reaction_n: rho * q * v,
      reaction_fog_n: IFSTA_FOG * (q / GPM) * Math.sqrt(p / PSI) * LBF,
    },
    warnings,
  };
}
