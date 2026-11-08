/**
 * proctor-compaction/tests.js — checks against the weight–volume relations of soil mechanics, by hand.
 * Run: node run-tests.js proctor-compaction
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const P = 16.01846337396; // kg/m³ per lb/ft³
const ex = { mode: 'wet', wet_density: 124 * P, moisture: 0.12, mdd: 115 * P, omc: 0.115, gs: 2.7, required: 0.95 };

export const tests = [
  {
    name: 'Wet 124.0 lb/ft³ at 12 %: dry 124/1.12 = 110.71 lb/ft³, 96.3 % of 115.0; e = 2.70 × 62.43/110.71 − 1 = 0.522; S = 0.12 × 2.70/0.522 = 62.0 %',
    source: 'Hand calculation: ρ_d = ρ/(1 + w), e = G_s ρ_w/ρ_d − 1, S e = w G_s (Das & Sobhan, Principles of Geotechnical Engineering, ch. 3)',
    run: () => {
      const o = calculate(ex).outputs;
      assertClose(o.dry_density_out / P, 124 / 1.12, { rel: 1e-12 }, 'dry density');
      assertClose(o.rc, 124 / 1.12 / 115, { rel: 1e-12 }, 'RC');
      assertClose(o.void_ratio, (2.7 * 1000) / ((124 * P) / 1.12) - 1, { rel: 1e-12 }, 'e');
      assertClose(o.saturation, 0.62017, { abs: 1e-5 }, 'S');
      assertEqual(o.verdict.startsWith('Passes'), true, 'verdict');
      assertClose(o.target_density / P, 109.25, { abs: 1e-9 }, '95 % of MDD');
    },
  },
  {
    name: 'Zero-air-voids density: G_s 2.68 at w 20 % is 2 680/1.536 = 1 744.8 kg/m³ (17.12 kN/m³); G_s 2.72 at 10 % is 133.5 lb/ft³',
    source: 'Das & Sobhan, ch. 6: γ_zav = G_s γ_w / (1 + w G_s); hand calculation',
    run: () => {
      assertClose(calculate({ ...ex, moisture: 0.2, gs: 2.68 }).outputs.zav, 2680 / 1.536, { rel: 1e-12 }, 'SI');
      assertClose((calculate({ ...ex, moisture: 0.2, gs: 2.68 }).outputs.zav * 9.81) / 1000, 17.12, { abs: 0.005 }, 'kN/m³');
      assertClose(calculate({ ...ex, moisture: 0.1, gs: 2.72 }).outputs.zav / P, 133.49, { abs: 0.01 }, 'pcf');
    },
  },
  {
    name: 'A soil compacted to the zero-air-voids density is 100 % saturated with no air voids; air voids equal n (1 − S) in general',
    source: 'Definition of the zero-air-voids curve; V_a = n (1 − S)',
    run: () => {
      const zav = calculate({ ...ex, moisture: 0.15 }).outputs.zav;
      const o = calculate({ ...ex, mode: 'dry', dry_density: zav, moisture: 0.15 }).outputs;
      assertClose(o.saturation, 1, { abs: 1e-12 }, 'S');
      assertClose(o.air_voids, 0, { abs: 1e-12 }, 'Va');
      const d = calculate(ex).outputs;
      assertClose(d.air_voids, d.porosity * (1 - d.saturation), { abs: 1e-12 }, 'Va = n(1 − S)');
    },
  },
  {
    name: 'Dry-density input gives the same results as the wet density ρ_d (1 + w); saturation at the Proctor optimum 115.0 lb/ft³ and 11.5 % is 66.7 %',
    source: 'Consistency; hand calculation S = w G_s / (G_s ρ_w/ρ_d,max − 1)',
    run: () => {
      const a = calculate(ex).outputs;
      const b = calculate({ ...ex, mode: 'dry', dry_density: (124 * P) / 1.12 }).outputs;
      assertClose(b.rc, a.rc, { rel: 1e-12 }, 'RC');
      assertClose(a.sat_at_opt, (0.115 * 2.7) / ((2700) / (115 * P) - 1), { rel: 1e-12 }, 'S opt');
      assertClose(a.sat_at_opt, 0.667, { abs: 0.001 }, 'S opt value');
    },
  },
  {
    name: 'Low compaction fails; a dry density above G_s ρ_w is refused; a point above the zero-air-voids curve warns',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ ...ex, wet_density: 115 * P }).outputs.verdict.startsWith('Fails'), true, 'fails');
      assertThrows(() => calculate({ ...ex, mode: 'dry', dry_density: 2800 }), 'impossible');
      assertEqual(calculate({ ...ex, moisture: 0.3 }).warnings.length > 0, true, 'above ZAV');
    },
  },
];
