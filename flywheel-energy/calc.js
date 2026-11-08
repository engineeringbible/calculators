/**
 * flywheel-energy/calc.js — flywheel kinetic energy, the energy released between two speeds and the coefficient of speed
 * fluctuation, or the moment of inertia needed to absorb an energy swing at a given fluctuation; with the mass of a solid
 * disc or thin rim of chosen radius, the disc thickness, the rim speed and the centrifugal stress.
 *
 * E = ½ I ω²;  ΔE = ½ I (ω₂² − ω₁²) = C_s I ω²;  C_s = (ω₂ − ω₁)/ω, ω = (ω₁ + ω₂)/2  (Shigley §16-12, eqs. 16-60 to 16-62).
 * Solid disc I = ½ m r², thin rim I = m r²; hoop stress of a thin rim ρ v², centre stress of a solid disc (3 + ν)/8 ρ v².
 * Schema units: SI — kg·m², rpm, J, m, kg, kg/m³, Pa.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

const RPM = (2 * Math.PI) / 60;
const NU = 0.3;

export const schema = {
  id: 'flywheel-energy',
  name: 'Flywheel energy calculator (inertia and speed fluctuation)',
  category: 'mechanical',
  summary: 'Flywheel kinetic energy, energy released between two speeds, coefficient of speed fluctuation, and the inertia, disc or rim mass for an energy swing.',
  related: ['mass-moment-of-inertia', 'torque-power-rpm', 'shaft-critical-speed', 'shaft-torsion'],
  assumptions: [
    'The flywheel is a rigid body on a fixed axis: E = ½ I ω². The energy it gives up or absorbs between two speeds is the difference of the kinetic energies (Shigley §16-12).',
    'The coefficient of speed fluctuation is C_s = (ω₂ − ω₁)/ω with the mean speed ω = (ω₁ + ω₂)/2, so ΔE = C_s I ω² exactly. Typical design values are given by the machine type; the user chooses C_s.',
    'The energy swing ΔE is the largest difference in the integrated torque–angle diagram over a cycle; this calculator takes it as an input.',
    'Mass from inertia uses a uniform solid disc (I = ½ m r²) or a thin rim with all the mass at radius r (I = m r²); the inertia of the hub, arms and shaft is neglected, which errs on the safe side for a rim.',
    'Stresses are elastic centrifugal stresses at the mean speed: ρ v² for a thin rim and (3 + ν)/8 ρ v² at the centre of a solid disc with ν = 0.3; they ignore keyways, bolt holes and overspeed, which the design must add.',
  ],
  notes: [
    'Verification 2026-11-08: an energy swing of 2 500 J at a mean 300 rpm with C_s = 0.05 needs I = 2 500 / (0.05 × 31.416²) = 50.66 kg·m²; as a solid steel disc of 0.4 m radius that is 633 kg, 160.5 mm thick, with a rim speed of 12.57 m/s and a centre stress of 0.51 MPa; the speed swings between 292.5 and 307.5 rpm. Checked by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §16-12 Flywheels, eqs. 16-59 to 16-62 (energy, coefficient of speed fluctuation)",
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §3-15 Stresses in rotating rings (solid disc and thin rim)",
    'Meriam and Kraige, Engineering Mechanics: Dynamics, 8th ed., ch. 6 (kinetic energy of rotation, moments of inertia of a disc and a ring)',
  ],
  inputs: [
    { id: 'mode', label: 'Solve for', type: 'select', default: 'size', options: [{ value: 'size', label: 'Inertia needed for an energy swing' }, { value: 'energy', label: 'Energy of a flywheel between two speeds' }] },
    { id: 'delta_e_j', label: 'Energy swing ΔE to absorb or supply', group: 'energy', unit: 'J', display: 'kJ', default: 2500, min: 1e-3, max: 1e10, visibleWhen: { mode: 'size' } },
    { id: 'n_mean_rpm', label: 'Mean speed n', group: 'rotational_speed', unit: 'rpm', default: 300, min: 0.1, max: 100000, visibleWhen: { mode: 'size' } },
    { id: 'cs', label: 'Coefficient of speed fluctuation C_s', group: 'dimensionless', unit: 'none', default: 0.05, min: 0.0005, max: 1.5, visibleWhen: { mode: 'size' } },
    { id: 'inertia_kg_m2', label: 'Moment of inertia I', group: 'mass_moment_of_inertia', unit: 'kg_m2', default: 50, min: 1e-9, max: 1e9, visibleWhen: { mode: 'energy' } },
    { id: 'n1_rpm', label: 'Lower speed n₁', group: 'rotational_speed', unit: 'rpm', default: 285, min: 0, max: 100000, visibleWhen: { mode: 'energy' } },
    { id: 'n2_rpm', label: 'Upper speed n₂', group: 'rotational_speed', unit: 'rpm', default: 315, min: 0.1, max: 100000, visibleWhen: { mode: 'energy' } },
    { id: 'shape', label: 'Flywheel shape (for the mass)', type: 'select', default: 'disc', options: [{ value: 'disc', label: 'Solid disc, I = ½ m r²' }, { value: 'rim', label: 'Thin rim, I = m r²' }] },
    { id: 'radius_m', label: 'Outer radius (mean radius of a rim) r', group: 'length', unit: 'm', display: 'mm', default: 0.4, min: 0.001, max: 50 },
    { id: 'density', label: 'Material density ρ', group: 'density', unit: 'kg_m3', default: 7850, min: 100, max: 25000 },
  ],
  outputs: [
    { id: 'inertia_out', label: 'Moment of inertia I', group: 'mass_moment_of_inertia', unit: 'kg_m2' },
    { id: 'delta_e_out_j', label: 'Energy released or absorbed between the speeds', group: 'energy', unit: 'J', display: 'kJ' },
    { id: 'e1_j', label: 'Kinetic energy at the lower speed', group: 'energy', unit: 'J', display: 'kJ' },
    { id: 'e2_j', label: 'Kinetic energy at the upper speed', group: 'energy', unit: 'J', display: 'kJ' },
    { id: 'cs_out', label: 'Coefficient of speed fluctuation C_s', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'n1_out_rpm', label: 'Lower speed n₁', group: 'rotational_speed', unit: 'rpm' },
    { id: 'n2_out_rpm', label: 'Upper speed n₂', group: 'rotational_speed', unit: 'rpm' },
    { id: 'mass_kg', label: 'Flywheel mass for the radius', group: 'mass', unit: 'kg' },
    { id: 'thickness_m', label: 'Disc thickness (solid disc)', group: 'length', unit: 'm', display: 'mm', visibleWhen: { shape: 'disc' } },
    { id: 'rim_speed_m_s', label: 'Rim speed at the mean speed', group: 'speed', unit: 'm_s' },
    { id: 'stress_pa', label: 'Centrifugal stress (rim hoop or disc centre)', group: 'pressure', unit: 'Pa', display: 'MPa' },
  ],
  example: {
    inputs: { mode: 'size', delta_e_j: [2500, 'J'], n_mean_rpm: [300, 'rpm'], cs: 0.05, shape: 'disc', radius_m: [400, 'mm'], density: [7850, 'kg_m3'] },
    results: { inertia_out: '50.66 kg·m²', mass_kg: '633 kg', thickness_m: '160.5 mm', n1_out_rpm: '292.5 rpm', n2_out_rpm: '307.5 rpm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['size', 'energy'], 'mode', 'Solve for');
  assertOneOf(x.shape, ['disc', 'rim'], 'shape', 'Flywheel shape');
  const r = assertPositive(x.radius_m, 'radius_m', 'Outer radius');
  const rho = assertRange(x.density, 100, 25000, 'density', 'Material density');
  let I; let w1; let w2;
  if (x.mode === 'size') {
    const dE = assertPositive(x.delta_e_j, 'delta_e_j', 'Energy swing');
    const w = assertPositive(x.n_mean_rpm, 'n_mean_rpm', 'Mean speed') * RPM;
    const cs = assertRange(x.cs, 0.0005, 1.5, 'cs', 'Coefficient of speed fluctuation');
    I = dE / (cs * w * w);
    w1 = w * (1 - cs / 2);
    w2 = w * (1 + cs / 2);
  } else {
    I = assertPositive(x.inertia_kg_m2, 'inertia_kg_m2', 'Moment of inertia');
    w1 = assertRange(x.n1_rpm, 0, 100000, 'n1_rpm', 'Lower speed') * RPM;
    w2 = assertPositive(x.n2_rpm, 'n2_rpm', 'Upper speed') * RPM;
    if (w2 <= w1) throw new Error('Upper speed: it must be higher than the lower speed.');
  }
  const w = (w1 + w2) / 2;
  const e1 = 0.5 * I * w1 * w1;
  const e2 = 0.5 * I * w2 * w2;
  const mass = x.shape === 'disc' ? (2 * I) / (r * r) : I / (r * r);
  const v = w * r;
  const warnings = [];
  const cs = (w2 - w1) / w;
  if (cs > 0.2) warnings.push('C_s above 0.2: a very large speed swing for a flywheel drive; check that the driver and the driven machine tolerate it.');
  const stress = x.shape === 'disc' ? ((3 + NU) / 8) * rho * v * v : rho * v * v;
  if (v > 50) warnings.push('Rim speed above 50 m/s: check the material, the bursting speed and the overspeed case carefully.');
  return {
    outputs: {
      inertia_out: I,
      delta_e_out_j: e2 - e1,
      e1_j: e1, e2_j: e2,
      cs_out: cs,
      n1_out_rpm: w1 / RPM, n2_out_rpm: w2 / RPM,
      mass_kg: mass,
      thickness_m: x.shape === 'disc' ? mass / (rho * Math.PI * r * r) : null,
      rim_speed_m_s: v,
      stress_pa: stress,
    },
    warnings,
  };
}
