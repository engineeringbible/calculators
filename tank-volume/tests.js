/**
 * tank-volume/tests.js — checks against exact mensuration formulas and standard partial-volume fractions.
 * Run: node run-tests.js tank-volume
 */
import { calculate, circularSegmentArea, chordWidth, sphericalCapVolume, levelForVolume } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HORIZONTAL = { shape: 'horizontal_cylinder', diameter_m: 2, length_m: 10, heads: 'flat', mode: 'volume', density_t_m3: 0.99 };

export const tests = [
  {
    name: 'Horizontal cylinder Ø2 × 10 m: full 31.416 m³, half full at 1.0 m, and 6.142 m³ (19.55 %) at 0.5 m — the standard quarter-depth fraction',
    source: 'Circular segment A = R² acos((R−h)/R) − (R−h)√(2Rh−h²) (CRC Standard Mathematical Tables); partial-volume tables give 19.6 % at h/D = 0.25',
    run: () => {
      assertClose(circularSegmentArea(1, 1), Math.PI / 2, { rel: 1e-12 }, 'half circle');
      assertClose(circularSegmentArea(1, 2), Math.PI, { rel: 1e-12 }, 'full circle');
      assertClose(circularSegmentArea(1, 0.5), Math.acos(0.5) - 0.5 * Math.sqrt(0.75), { rel: 1e-12 }, 'quarter depth');
      const full = calculate({ ...HORIZONTAL, level_m: 2 }).outputs;
      assertClose(full.total_volume_m3, 10 * Math.PI, { rel: 1e-12 }, 'total');
      assertClose(full.fill_pct, 100, { rel: 1e-12 }, 'full');
      const half = calculate({ ...HORIZONTAL, level_m: 1 }).outputs;
      assertClose(half.liquid_volume_m3, 5 * Math.PI, { rel: 1e-12 }, 'half');
      const quarter = calculate({ ...HORIZONTAL, level_m: 0.5 }).outputs;
      assertClose(quarter.liquid_volume_m3, 6.1418, { abs: 1e-3 }, 'quarter-depth volume');
      assertClose(quarter.fill_pct, 19.55, { abs: 0.01 }, 'quarter-depth %');
      assertClose(quarter.ullage_m, 1.5, { rel: 1e-12 }, 'ullage');
      assertClose(quarter.mass_t, 6.1418 * 0.99, { abs: 1e-3 }, 'mass');
    },
  },
  {
    name: 'Sphere Ø2: full 4.189 m³, half at the centre 2.094 m³, cap at 0.5 m = π h² (3R − h)/3 = 0.6545 m³',
    source: 'Spherical cap volume (CRC Standard Mathematical Tables)',
    run: () => {
      assertClose(sphericalCapVolume(1, 2), (4 / 3) * Math.PI, { rel: 1e-12 }, 'full sphere');
      assertClose(sphericalCapVolume(1, 1), (2 / 3) * Math.PI, { rel: 1e-12 }, 'hemisphere');
      assertClose(sphericalCapVolume(1, 0.5), (Math.PI * 0.25 * 2.5) / 3, { rel: 1e-12 }, 'cap');
      const { outputs } = calculate({ shape: 'sphere', diameter_m: 2, mode: 'volume', level_m: 0.5 });
      assertClose(outputs.liquid_volume_m3, 0.654498, { abs: 1e-6 }, 'in calculate()');
      assertClose(outputs.total_volume_m3, 4.18879, { abs: 1e-5 }, 'total');
      assertClose(outputs.surface_width_m, chordWidth(1, 0.5), { rel: 1e-12 }, 'surface chord');
    },
  },
  {
    name: 'Hemispherical heads add a full sphere: Ø2 × 10 m cylinder with heads holds 35.605 m³ and is exactly half full at the centreline',
    source: 'Segment × length plus spherical cap (CRC tables)',
    run: () => {
      const { outputs } = calculate({ ...HORIZONTAL, heads: 'hemispherical', level_m: 1 });
      assertClose(outputs.total_volume_m3, 10 * Math.PI + (4 / 3) * Math.PI, { rel: 1e-12 }, 'total');
      assertClose(outputs.fill_pct, 50, { rel: 1e-9 }, 'half at centreline');
      const low = calculate({ ...HORIZONTAL, heads: 'hemispherical', level_m: 0.5 }).outputs;
      assertClose(low.liquid_volume_m3, 6.1418 + 0.654498, { abs: 1e-3 }, 'segment + cap');
    },
  },
  {
    name: 'Rectangular tank 10 × 5 × 4 m at 2 m: 100 m³ (50 %), free-surface inertia L b³/12 = 104.17 m⁴, free surface moment 103.1 t·m at 0.99 t/m³; vertical cylinder Ø2 × 4 m at 1 m: 3.14 m³',
    source: 'Derrett & Barrass ch. 21: i = l b³/12 for a rectangular free surface; circular surface π r⁴/4',
    run: () => {
      const box = calculate({ shape: 'rectangular', length_m: 10, width_m: 5, height_m: 4, mode: 'volume', level_m: 2, density_t_m3: 0.99 }).outputs;
      assertClose(box.liquid_volume_m3, 100, { rel: 1e-12 }, 'volume');
      assertClose(box.fill_pct, 50, { rel: 1e-12 }, 'fill');
      assertClose(box.surface_inertia_m4, (10 * 125) / 12, { rel: 1e-12 }, 'i');
      assertClose(box.free_surface_moment_t_m, (10 * 125 * 0.99) / 12, { rel: 1e-12 }, 'FSM');
      const fullBox = calculate({ shape: 'rectangular', length_m: 10, width_m: 5, height_m: 4, mode: 'volume', level_m: 4 }).outputs;
      assertClose(fullBox.surface_inertia_m4, 0, { abs: 1e-12 }, 'no free surface when pressed up');
      const vertical = calculate({ shape: 'vertical_cylinder', diameter_m: 2, height_m: 4, mode: 'volume', level_m: 1 }).outputs;
      assertClose(vertical.liquid_volume_m3, Math.PI, { rel: 1e-12 }, 'vertical volume');
      assertClose(vertical.surface_inertia_m4, Math.PI / 4, { rel: 1e-12 }, 'circular i = π r⁴/4');
    },
  },
  {
    name: 'Free surface of the horizontal cylinder at 0.5 m: chord 1.732 m, area 17.32 m², i = L c³/12 = 4.330 m⁴',
    source: 'Chord c = 2√(2Rh − h²); rectangular free surface L × c (Derrett ch. 21)',
    run: () => {
      assertClose(chordWidth(1, 0.5), Math.sqrt(3), { rel: 1e-12 }, 'chord');
      const { outputs } = calculate({ ...HORIZONTAL, level_m: 0.5 });
      assertClose(outputs.surface_width_m, 1.7321, { abs: 1e-4 }, 'chord in calculate()');
      assertClose(outputs.surface_area_m2, 17.321, { abs: 1e-3 }, 'area');
      assertClose(outputs.surface_inertia_m4, (10 * Math.sqrt(3) ** 3) / 12, { rel: 1e-12 }, 'i');
      assertClose(outputs.surface_inertia_m4, 4.330, { abs: 1e-3 }, 'i value');
    },
  },
  {
    name: 'Level for a target volume: 6.1418 m³ in the Ø2 × 10 m cylinder is at 0.500 m; 15.708 m³ at 1.000 m; round trip for a sphere',
    source: 'Bisection inverse of the segment volume (internal consistency)',
    run: () => {
      const { outputs } = calculate({ ...HORIZONTAL, mode: 'level', target_volume_m3: 6.1418 });
      assertClose(outputs.level_out_m, 0.5, { abs: 1e-4 }, 'level');
      assertClose(calculate({ ...HORIZONTAL, mode: 'level', target_volume_m3: 5 * Math.PI }).outputs.level_out_m, 1.0, { abs: 1e-9 }, 'half');
      const sphere = { shape: 'sphere', diameter_m: 3 };
      assertClose(levelForVolume(sphere, sphericalCapVolume(1.5, 0.7)), 0.7, { abs: 1e-9 }, 'sphere round trip');
    },
  },
  {
    name: 'Warnings: a slack tank reports the free-surface effect; 99 % fill warns about expansion space; geometric-volume note always present',
    source: 'Behaviour specification; fuel-tank filling limits 95–98 % (common practice)',
    run: () => {
      const slack = calculate({ ...HORIZONTAL, level_m: 0.5 });
      assertEqual(slack.warnings.some((w) => w.includes('Slack tank')), true, 'slack warning');
      const nearlyFull = calculate({ ...HORIZONTAL, level_m: 1.99 });
      assertEqual(nearlyFull.warnings.some((w) => w.includes('above 98 % full')), true, 'full warning');
      assertEqual(nearlyFull.warnings.some((w) => w.includes('Geometric volume')), true, 'note');
    },
  },
  {
    name: 'Unit layer: 31.416 m³ = 31 416 L = 197.6 bbl = 8 300 US gal',
    source: 'NIST SP 811: 1 bbl = 158.987 L, 1 US gal = 3.785 L',
    run: () => {
      assertClose(convert(10 * Math.PI, 'm3', 'L', 'volume'), 31415.9, { abs: 0.1 }, 'L');
      assertClose(convert(10 * Math.PI, 'm3', 'bbl', 'volume'), 197.6, { abs: 0.05 }, 'bbl');
      assertClose(convert(10 * Math.PI, 'm3', 'gal_us', 'volume'), 8299.3, { abs: 0.5 }, 'gal');
    },
  },
  {
    name: 'Invalid inputs fail fast: level above the tank, target volume above capacity, zero diameter',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...HORIZONTAL, level_m: 2.5 }), 'exceeds the tank height', 'level');
      assertThrows(() => calculate({ ...HORIZONTAL, mode: 'level', target_volume_m3: 40 }), 'exceeds the tank volume', 'target');
      assertThrows(() => calculate({ ...HORIZONTAL, diameter_m: 0 }), 'greater than zero', 'diameter');
    },
  },
];
