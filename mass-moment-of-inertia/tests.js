/**
 * mass-moment-of-inertia/tests.js — checks against the standard formulas for homogeneous solids.
 * Run: node run-tests.js mass-moment-of-inertia
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Steel disc 300 mm × 50 mm: m = 7 850 × π × 0.15² × 0.05 = 27.74 kg, I = m r²/2 = 0.3121 kg·m², k = r/√2 = 106.1 mm, 3 851 J at 1 500 rpm',
    source: 'Meriam and Kraige, Dynamics, Appendix D (solid cylinder about its axis); E = ½ I ω²',
    run: () => {
      const o = calculate({ body: 'cylinder', diameter_m: 0.3, length_m: 0.05, mass_mode: 'density', density_kg_m3: 7850, offset_m: 0, speed_rpm: 1500 }).outputs;
      assertClose(o.mass_out_kg, 27.744, { abs: 0.001 }, 'm');
      assertClose(o.i_kg_m2, 0.31212, { abs: 1e-5 }, 'I');
      assertClose(o.k_m * 1000, 106.066, { abs: 0.001 }, 'k');
      assertClose(o.energy_j, 3850.65, { abs: 0.01 }, 'E');
    },
  },
  {
    name: 'Slender rod 3 kg, 1 m: m L²/12 = 0.25 about the centre and m L²/3 = 1.0 about the end; the parallel-axis shift of L/2 links them',
    source: 'Beer et al., Dynamics (slender rod); parallel-axis theorem I = I_G + m d²',
    run: () => {
      const c = calculate({ body: 'rod_c', mass_mode: 'mass', mass_kg: 3, length_m: 1, offset_m: 0.5 }).outputs;
      assertClose(c.i_kg_m2, 0.25, { rel: 1e-12 }, 'centre');
      assertClose(c.i_offset_kg_m2, 1, { rel: 1e-12 }, 'shifted');
      assertClose(calculate({ body: 'rod_e', mass_mode: 'mass', mass_kg: 3, length_m: 1 }).outputs.i_kg_m2, 1, { rel: 1e-12 }, 'end');
    },
  },
  {
    name: 'Sphere and shell of 5 kg, 200 mm diameter: 2/5 m r² = 0.020 and 2/3 m r² = 0.0333 kg·m²',
    source: 'Meriam and Kraige, Dynamics, Appendix D',
    run: () => {
      assertClose(calculate({ body: 'sphere', diameter_m: 0.2, mass_mode: 'mass', mass_kg: 5 }).outputs.i_kg_m2, 0.02, { rel: 1e-12 }, 'sphere');
      assertClose(calculate({ body: 'shell', diameter_m: 0.2, mass_mode: 'mass', mass_kg: 5 }).outputs.i_kg_m2, 0.033333, { abs: 1e-6 }, 'shell');
    },
  },
  {
    name: 'Tube 300/200 mm × 50 mm steel: m = 15.41 kg, I = m (r_o² + r_i²)/2 = 0.2505 kg·m²; block 200 × 100 × 50 mm: m (a² + b²)/12',
    source: 'Thick-walled cylinder and rectangular prism formulas',
    run: () => {
      const t = calculate({ body: 'tube', diameter_m: 0.3, inner_m: 0.2, length_m: 0.05, density_kg_m3: 7850 }).outputs;
      assertClose(t.mass_out_kg, 15.413, { abs: 0.001 }, 'm');
      assertClose(t.i_kg_m2, 15.413 * (0.0225 + 0.01) / 2, { rel: 1e-4 }, 'I');
      const b = calculate({ body: 'block', a_m: 0.2, b_m: 0.1, c_m: 0.05, density_kg_m3: 7850 }).outputs;
      assertClose(b.i_kg_m2, (7.85 * (0.04 + 0.01)) / 12, { rel: 1e-12 }, 'block');
    },
  },
  {
    name: 'Inside diameter at least the outside, a density for a thin shell or rod, and zero mass are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ body: 'tube', diameter_m: 0.2, inner_m: 0.2 }), 'Inside diameter');
      assertThrows(() => calculate({ body: 'shell', mass_mode: 'density' }), 'enter its mass');
      assertThrows(() => calculate({ body: 'rod_c', mass_mode: 'density' }), 'enter its mass');
      assertThrows(() => calculate({ mass_mode: 'mass', mass_kg: 0 }), 'Mass must be greater than zero');
    },
  },
];
