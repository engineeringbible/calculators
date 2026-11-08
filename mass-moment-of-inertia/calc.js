/**
 * mass-moment-of-inertia/calc.js — mass moment of inertia of common solids about their usual axes, with the mass from
 * a density, the radius of gyration, the parallel-axis shift and the kinetic energy at a speed.
 *
 * Cylinder (axis) m r²/2; cylinder (transverse, centre) m(3r² + L²)/12; tube m(r_o² + r_i²)/2; sphere 2/5 m r²;
 * spherical shell 2/3 m r²; rod m L²/12 (centre) or m L²/3 (end); block m(a² + b²)/12.  I_O = I_G + m d²;  E = ½ I ω².
 * Schema units: SI — m, kg, kg/m³, kg·m², rpm, J.
 */
import { withDefaults, assertPositive, assertOneOf, assertNonNegative } from '../shared/validate.js';

export const BODIES = {
  cylinder: 'Solid cylinder or disc, about its own axis',
  cylinder_x: 'Solid cylinder, about a transverse axis through its centre',
  tube: 'Hollow cylinder (tube, ring, rim), about its own axis',
  sphere: 'Solid sphere, about a diameter',
  shell: 'Thin spherical shell, about a diameter',
  rod_c: 'Slender rod, about its centre',
  rod_e: 'Slender rod, about one end',
  block: 'Rectangular block, about an axis through its centre normal to the a × b face',
};

const len = (id, label, def, bodies) => ({ id, label, group: 'length', unit: 'm', display: 'mm', default: def, min: 1e-6, max: 1000, visibleWhen: { body: bodies } });

export const schema = {
  id: 'mass-moment-of-inertia',
  name: 'Mass moment of inertia calculator',
  category: 'mechanical',
  summary: 'Mass moment of inertia of cylinders, discs, tubes, spheres, rods and blocks, with radius of gyration, parallel-axis shift and flywheel energy.',
  related: ['moment-of-inertia', 'shaft-torque', 'torque-power-rpm', 'gear-ratio'],
  assumptions: [
    'Bodies are homogeneous: the density is uniform, so the mass centre is at the geometric centre. For a body made of several parts, add the parts\' inertias about the same axis.',
    'The slender rod formulas neglect the rod\'s thickness; for a thick rod use the cylinder about a transverse axis.',
    'The thin shell has all its mass on the sphere\'s surface; the tube formula is exact for any wall thickness.',
    'The parallel-axis shift I = I_G + m d² applies only from the axis through the centre of mass to a parallel axis.',
  ],
  notes: [
    'Verification 2026-11-07: a steel disc 300 mm across and 50 mm thick weighs 27.74 kg and has I = 0.3121 kg·m²; at 1 500 rpm it stores 3 851 J. Checked by hand.',
  ],
  sources: [
    'Meriam, J.L. and Kraige, L.G., Engineering Mechanics: Dynamics, Appendix D (properties of homogeneous solids)',
    'Beer, F.P. et al., Vector Mechanics for Engineers: Dynamics, inside back cover (mass moments of inertia of common shapes)',
  ],
  inputs: [
    { id: 'body', label: 'Body and axis', type: 'select', default: 'cylinder', options: Object.entries(BODIES).map(([value, label]) => ({ value, label })) },
    len('diameter_m', 'Outside diameter D', 0.3, ['cylinder', 'cylinder_x', 'tube', 'sphere', 'shell']),
    len('inner_m', 'Inside diameter d', 0.2, ['tube']),
    len('length_m', 'Length L (thickness of a disc)', 0.05, ['cylinder', 'cylinder_x', 'tube', 'rod_c', 'rod_e']),
    len('a_m', 'Side a', 0.2, ['block']),
    len('b_m', 'Side b', 0.1, ['block']),
    len('c_m', 'Side c (along the axis)', 0.05, ['block']),
    { id: 'mass_mode', label: 'Mass from', type: 'select', default: 'density', options: [{ value: 'density', label: 'Density and dimensions' }, { value: 'mass', label: 'Known mass' }] },
    { id: 'density_kg_m3', label: 'Density (steel 7 850, aluminium 2 700, cast iron 7 200)', group: 'density', unit: 'kg_m3', default: 7850, min: 1, max: 25000, visibleWhen: { mass_mode: 'density' } },
    { id: 'mass_kg', label: 'Mass', group: 'mass', unit: 'kg', default: 10, min: 1e-9, max: 1e9, visibleWhen: { mass_mode: 'mass' } },
    { id: 'offset_m', label: 'Distance to a parallel axis (0 = through the centre)', group: 'length', unit: 'm', display: 'mm', default: 0, min: 0, max: 1000 },
    { id: 'speed_rpm', label: 'Speed, for the kinetic energy (optional)', group: 'rotational_speed', unit: 'rpm', default: 1500, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'mass_out_kg', label: 'Mass', group: 'mass', unit: 'kg' },
    { id: 'i_kg_m2', label: 'Moment of inertia about the centroidal axis', group: 'mass_moment_of_inertia', unit: 'kg_m2' },
    { id: 'i_offset_kg_m2', label: 'Moment of inertia about the offset axis', group: 'mass_moment_of_inertia', unit: 'kg_m2' },
    { id: 'k_m', label: 'Radius of gyration k = √(I / m)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'energy_j', label: 'Kinetic energy at the speed', group: 'energy', unit: 'J', display: 'kJ' },
  ],
  example: {
    inputs: { body: 'cylinder', diameter_m: [300, 'mm'], length_m: [50, 'mm'], mass_mode: 'density', density_kg_m3: [7850, 'kg_m3'], offset_m: [0, 'mm'], speed_rpm: [1500, 'rpm'] },
    results: { mass_out_kg: '27.74 kg', i_kg_m2: '0.3121 kg·m²', energy_j: '3.851 kJ' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.body, Object.keys(BODIES), 'body', 'Body and axis');
  assertOneOf(x.mass_mode, ['density', 'mass'], 'mass_mode', 'Mass from');
  const need = (id, label) => assertPositive(x[id], id, label);
  let volume; let shape;
  switch (x.body) {
    case 'cylinder': case 'cylinder_x': {
      const r = need('diameter_m', 'Outside diameter') / 2; const L = need('length_m', 'Length');
      volume = Math.PI * r * r * L;
      shape = x.body === 'cylinder' ? (m) => (m * r * r) / 2 : (m) => (m * (3 * r * r + L * L)) / 12;
      break;
    }
    case 'tube': {
      const ro = need('diameter_m', 'Outside diameter') / 2; const ri = need('inner_m', 'Inside diameter') / 2; const L = need('length_m', 'Length');
      if (ri >= ro) throw new Error('Inside diameter: it must be smaller than the outside diameter.');
      volume = Math.PI * (ro * ro - ri * ri) * L;
      shape = (m) => (m * (ro * ro + ri * ri)) / 2;
      break;
    }
    case 'sphere': case 'shell': {
      const r = need('diameter_m', 'Outside diameter') / 2;
      if (x.body === 'shell' && x.mass_mode === 'density') throw new Error('Mass from: a thin shell has no volume of its own; enter its mass.');
      volume = (4 / 3) * Math.PI * r ** 3;
      shape = x.body === 'sphere' ? (m) => 0.4 * m * r * r : (m) => (2 / 3) * m * r * r;
      break;
    }
    case 'rod_c': case 'rod_e': {
      const L = need('length_m', 'Length');
      if (x.mass_mode === 'density') throw new Error('Mass from: a slender rod is defined by its mass and length; enter its mass.');
      volume = null;
      shape = x.body === 'rod_c' ? (m) => (m * L * L) / 12 : (m) => (m * L * L) / 3;
      break;
    }
    default: {
      const a = need('a_m', 'Side a'); const b = need('b_m', 'Side b'); const c = need('c_m', 'Side c');
      volume = a * b * c;
      shape = (m) => (m * (a * a + b * b)) / 12;
    }
  }
  const m = x.mass_mode === 'mass' ? need('mass_kg', 'Mass') : need('density_kg_m3', 'Density') * volume;
  const I = shape(m);
  const d = assertNonNegative(x.offset_m, 'offset_m', 'Distance to a parallel axis');
  const rpm = assertNonNegative(x.speed_rpm, 'speed_rpm', 'Speed');
  const warnings = [];
  if (x.body === 'rod_e' && d > 0) warnings.push('The offset is measured from the axis through the centre of mass, not from the end axis of the rod.');
  const iOff = (x.body === 'rod_e' ? (m * x.length_m ** 2) / 12 : I) + m * d * d;
  const omega = (rpm * 2 * Math.PI) / 60;
  return {
    outputs: {
      mass_out_kg: m,
      i_kg_m2: I,
      i_offset_kg_m2: d > 0 ? iOff : I,
      k_m: Math.sqrt(I / m),
      energy_j: rpm > 0 ? 0.5 * I * omega * omega : null,
    },
    warnings,
  };
}
