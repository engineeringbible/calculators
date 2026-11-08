/**
 * true-wind/tests.js — checks of the ISO 15016 Annex C.2 wind triangle and height profile.
 * Run: node run-tests.js true-wind
 */
import { calculate, relativeToTrue, trueToRelative } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const SAME_HEIGHT = { anemometer_height_m: 10, reference_height_m: 10 };

export const tests = [
  {
    name: 'Wind on the bow: 20 kn relative from ahead at 10 kn over the ground is a 10 kn true wind from the heading; 10 kn relative from ahead at 10 kn is calm',
    source: 'ISO 15016:2025 formulas C.3 and C.4',
    run: () => {
      const half = calculate({ ...SAME_HEIGHT, heading_deg: 0, sog_kn: 10, relative_dir_deg: 0, relative_speed_kn: 20 }).outputs;
      assertClose(half.true_speed_za_kn, 10, { rel: 1e-12 }, 'true speed');
      assertClose(half.true_dir_out_deg, 0, { abs: 1e-9 }, 'from ahead');
      const calm = calculate({ ...SAME_HEIGHT, heading_deg: 0, sog_kn: 10, relative_dir_deg: 0, relative_speed_kn: 10 });
      assertClose(calm.outputs.true_speed_za_kn, 0, { abs: 1e-9 }, 'calm');
      assertEqual(calm.outputs.true_dir_out_deg, null, 'no direction in a calm');
      assertEqual(calm.warnings.some((w) => w.includes('calm')), true, 'calm warning');
    },
  },
  {
    name: 'Beam relative wind: 25 kn from the starboard beam on heading 090° at 15 kn is √(25² + 15²) = 29.15 kn true from 211.0°; 330° and −30° are the same relative direction',
    source: 'ISO 15016:2025 C.3–C.4 worked by hand (relative wind = true wind − ship motion)',
    run: () => {
      const beam = calculate({ ...SAME_HEIGHT, heading_deg: 90, sog_kn: 15, relative_dir_deg: 90, relative_speed_kn: 25 }).outputs;
      assertClose(beam.true_speed_za_kn, Math.sqrt(850), { rel: 1e-12 }, 'speed');
      assertClose(beam.true_dir_out_deg, 90 + 180 - Math.atan2(25, 15) / DEG, { rel: 1e-12 }, 'direction');
      assertClose(beam.true_dir_out_deg, 210.96, { abs: 0.01 }, 'direction value');
      const a = relativeToTrue(30, 330, 45, 12);
      const b = relativeToTrue(30, -30, 45, 12);
      assertClose(a.speed, b.speed, { rel: 1e-12 }, 'same speed');
      assertClose(a.dirDeg, b.dirDeg, { rel: 1e-12 }, 'same direction');
    },
  },
  {
    name: 'Round trip: a true wind from 060° at 20 kn on heading 000° at 15 kn gives the relative wind of C.10–C.11, and converting it back returns 20 kn from 060°',
    source: 'ISO 15016:2025 C.10–C.11 are the inverse of C.3–C.4',
    run: () => {
      const rel = trueToRelative(20, 60, 0, 15);
      assertClose(rel.speed, Math.sqrt(400 + 225 + 2 * 20 * 15 * Math.cos(60 * DEG)), { rel: 1e-12 }, 'C.10');
      assertClose(rel.dirDeg, Math.atan2(20 * Math.sin(60 * DEG), 15 + 20 * Math.cos(60 * DEG)) / DEG, { rel: 1e-12 }, 'C.11');
      const back = relativeToTrue(rel.speed, rel.dirDeg, 0, 15);
      assertClose(back.speed, 20, { rel: 1e-9 }, 'speed back');
      assertClose(back.dirDeg, 60, { abs: 1e-9 }, 'direction back');
      const page = calculate({ ...SAME_HEIGHT, mode: 'true_to_relative', heading_deg: 0, sog_kn: 15, true_dir_deg: 60, true_speed_kn: 20 }).outputs;
      assertClose(page.relative_speed_ref_kn, rel.speed, { rel: 1e-12 }, 'page relative speed');
    },
  },
  {
    name: 'Height profile: from a 40 m anemometer to 10 m the 1/9 profile gives 20 × 0.25^(1/9) = 17.14 kn and the 1/7 profile 16.41 kn; the reference wind is what goes to the Beaufort scale',
    source: 'ISO 15016:2025 formula C.9 (exponent 1/9); ITTC 7.5-04-01-01.1 (2017) exponent 1/7',
    run: () => {
      const base = { heading_deg: 0, sog_kn: 0, relative_dir_deg: 0, relative_speed_kn: 20, anemometer_height_m: 40, reference_height_m: 10 };
      const nine = calculate(base).outputs;
      assertClose(nine.profile_factor, 0.25 ** (1 / 9), { rel: 1e-12 }, '1/9 factor');
      assertClose(nine.true_speed_ref_kn, 17.145, { abs: 1e-3 }, '1/9 speed');
      const seven = calculate({ ...base, profile: 'iso2015' }).outputs;
      assertClose(seven.true_speed_ref_kn, 16.407, { abs: 1e-3 }, '1/7 speed');
    },
  },
  {
    name: 'Following wind at the ship\'s speed: a true wind from astern at 12 kn on a ship making 12 kn feels calm on board, and a relative calm means a 12 kn true wind from astern',
    source: 'ISO 15016:2025 C.3 and C.10 with α = 180°',
    run: () => {
      const rel = calculate({ ...SAME_HEIGHT, mode: 'true_to_relative', heading_deg: 0, sog_kn: 12, true_dir_deg: 180, true_speed_kn: 12 }).outputs;
      assertClose(rel.relative_speed_ref_kn, 0, { abs: 1e-9 }, 'calm on board');
      const back = calculate({ ...SAME_HEIGHT, heading_deg: 0, sog_kn: 12, relative_dir_deg: 0, relative_speed_kn: 0 }).outputs;
      assertClose(back.true_speed_za_kn, 12, { rel: 1e-12 }, 'true speed');
      assertClose(back.true_dir_out_deg, 180, { abs: 1e-9 }, 'from astern');
    },
  },
  {
    name: 'Invalid inputs fail fast: negative speed over ground, a zero anemometer height, an unknown profile and a relative direction outside −180…360',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ sog_kn: -1 }), 'must not be negative', 'speed');
      assertThrows(() => calculate({ anemometer_height_m: 0 }), 'greater than zero', 'height');
      assertThrows(() => calculate({ profile: 'log' }), 'must be one of', 'profile');
      assertThrows(() => calculate({ relative_dir_deg: 400 }), 'must be between', 'direction');
    },
  },
];
