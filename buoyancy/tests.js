/**
 * buoyancy/tests.js — checks against Archimedes' principle F = ρ g V and the floating draught of boxes and cylinders.
 * Run: node run-tests.js buoyancy
 */
import { calculate, segmentArea, cylinderDraft } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;

export const tests = [
  {
    name: 'A 0.2 m³ body of 150 kg in sea water: buoyancy 1 025 × 9.80665 × 0.2 = 2 010.4 N, net +539.4 N, floats 73.2 % immersed',
    source: 'Archimedes\' principle (White, Fluid Mechanics §2.8); hand calculation',
    run: () => {
      const o = calculate({ shape: 'volume', volume_m3: 0.2, count: 1, mass_kg: 150, water: 'sea' }).outputs;
      assertClose(o.max_buoyancy_n, 2010.363, { abs: 1e-3 }, 'buoyancy');
      assertClose(o.net_n, 2010.363 - 150 * G, { abs: 1e-3 }, 'net');
      assertClose(o.submerged_frac, 150 / 205, { rel: 1e-12 }, 'fraction');
      assertEqual(o.floats.startsWith('Floats'), true, 'floats');
    },
  },
  {
    name: 'Box 6 × 2 × 1 m carrying 2 000 kg in sea water floats at 2 000 / (1 025 × 12) = 0.163 m',
    source: 'T = m / (ρ L B) (Derrett & Barrass, box-shaped vessels); hand calculation',
    run: () => {
      const o = calculate({ shape: 'box', length_m: 6, width_m: 2, height_m: 1, count: 1, mass_kg: 2000, water: 'sea', freeboard_m: 0.2 }).outputs;
      assertClose(o.draft_m, 2000 / (1025 * 12), { rel: 1e-12 }, 'draught');
      assertClose(o.capacity_kg, 1025 * 12 * 0.8, { rel: 1e-12 }, 'capacity at 0.2 m freeboard');
    },
  },
  {
    name: 'Horizontal cylinder: half immersed carries half its volume; two 0.6 m × 6 m tubes with 1 500 kg float at 0.273 m',
    source: 'Circular segment area r² acos((r − h)/r) − (r − h)√(2rh − h²); hand calculation',
    run: () => {
      assertClose(segmentArea(0.3, 0.3), (Math.PI * 0.09) / 2, { rel: 1e-12 }, 'half');
      assertClose(cylinderDraft(0.3, (Math.PI * 0.09) / 2), 0.3, { abs: 1e-9 }, 'inverse');
      const o = calculate({ shape: 'hcyl', diameter_m: 0.6, length_m: 6, count: 2, mass_kg: 1500, water: 'fresh', freeboard_m: 0.15 }).outputs;
      assertClose(segmentArea(0.3, o.draft_m), 0.125, { rel: 1e-9 }, 'segment for 1 500 kg');
      assertClose(o.draft_m, 0.27268, { abs: 1e-5 }, 'draught');
      assertClose(o.capacity_kg, 2729.6, { abs: 0.1 }, 'capacity');
    },
  },
  {
    name: 'Upright drum 0.57 m diameter: 100 kg in fresh water sinks 100 / (1 000 × 0.2552) = 0.392 m',
    source: 'T = m / (ρ π D²/4); hand calculation',
    run: () => {
      const o = calculate({ shape: 'vcyl', diameter_m: 0.57, height_m: 0.88, count: 1, mass_kg: 100, water: 'fresh', freeboard_m: 0 }).outputs;
      assertClose(o.draft_m, 100 / (1000 * Math.PI * 0.57 ** 2 / 4), { rel: 1e-12 }, 'draught');
    },
  },
  {
    name: 'Too heavy sinks with a warning; a freeboard taller than the float and a fractional count are rejected',
    source: 'Validation contract',
    run: () => {
      const r = calculate({ shape: 'volume', volume_m3: 0.1, count: 1, mass_kg: 200, water: 'fresh' });
      assertEqual(r.outputs.floats.startsWith('Sinks'), true, 'sinks');
      assertEqual(r.warnings.length, 1, 'warning');
      assertThrows(() => calculate({ shape: 'box', height_m: 1, freeboard_m: 1.2 }), 'Freeboard to keep');
      assertThrows(() => calculate({ count: 1.5 }), 'whole number');
    },
  },
];
