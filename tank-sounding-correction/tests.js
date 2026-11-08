/**
 * tank-sounding-correction/tests.js — checks of the trim and heel corrections, the wedge check and the sign conventions.
 * Run: node run-tests.js tank-sounding-correction
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const TANK = { length_m: 20, breadth_m: 15, height_m: 12, pipe_x_m: 1, pipe_y_m: 6, lbp_m: 180, trim_m: 1.0, heel_deg: 1.0, reading_mode: 'sounding', reading_m: 6.0, density_t_m3: 0.98 };

export const tests = [
  {
    name: 'Worked case: pipe 1 m from the aft bulkhead of a 20 m tank, 1.0 m trim by the stern on 180 m → trim correction (10 − 1) × 1/180 = 0.050 m; pipe 6 m to starboard, 1° heel → 6 tan 1° = 0.1047 m; mean depth 5.845 m',
    source: 'Sounding-table trim/heel correction (Derrett & Barrass; Reed\'s)',
    run: () => {
      const { outputs } = calculate(TANK);
      assertClose(outputs.trim_correction_m, 9 / 180, { rel: 1e-12 }, 'trim');
      assertClose(outputs.heel_correction_m, 6 * Math.tan(Math.PI / 180), { rel: 1e-12 }, 'heel');
      assertClose(outputs.heel_correction_m, 0.1047, { abs: 1e-4 }, 'heel value');
      assertClose(outputs.mean_depth_m, 6 - 9 / 180 - 6 * Math.tan(Math.PI / 180), { rel: 1e-12 }, 'mean');
      assertClose(outputs.mean_depth_m, 5.845, { abs: 1e-3 }, 'mean value');
      assertClose(outputs.trim_angle_deg, Math.atan(1 / 180) * 180 / Math.PI, { rel: 1e-12 }, 'trim angle');
    },
  },
  {
    name: 'Volume and mass: 300 m² × 5.845 = 1 753.6 m³ against 1 800 m³ uncorrected (−2.58 %), 1 718.5 t at 0.98 t/m³, 48.7 % full; surface between 5.66 and 6.03 m — fully inside the tank',
    source: 'Box-tank volume; arithmetic',
    run: () => {
      const { outputs } = calculate(TANK);
      assertClose(outputs.volume_m3, 300 * outputs.mean_depth_m, { rel: 1e-12 }, 'volume');
      assertClose(outputs.volume_m3, 1753.6, { abs: 0.1 }, 'volume value');
      assertClose(outputs.volume_uncorrected_m3, 1800, { rel: 1e-12 }, 'uncorrected');
      assertClose(outputs.correction_pct, ((outputs.volume_m3 - 1800) / 1800) * 100, { rel: 1e-12 }, '%');
      assertClose(outputs.mass_t, outputs.volume_m3 * 0.98, { rel: 1e-12 }, 'mass');
      assertClose(outputs.fill_pct, (outputs.mean_depth_m / 12) * 100, { rel: 1e-12 }, 'fill');
      assertClose(outputs.surface_min_depth_m, outputs.mean_depth_m - 10 / 180 - 7.5 * Math.tan(Math.PI / 180), { rel: 1e-12 }, 'min depth');
      assertEqual(outputs.validity.startsWith('OK'), true, 'inside');
    },
  },
  {
    name: 'Sign conventions: even keel and upright give zero corrections; a pipe at the tank centre has no trim correction; trim by the head (−1 m) reverses the sign; heel to port (−1°) with a starboard pipe adds to the depth',
    source: 'Geometry of the inclined box tank',
    run: () => {
      const even = calculate({ ...TANK, trim_m: 0, heel_deg: 0 }).outputs;
      assertEqual(even.trim_correction_m === 0 && even.heel_correction_m === 0 && even.mean_depth_m === 6, true, 'no correction');
      assertClose(calculate({ ...TANK, pipe_x_m: 10 }).outputs.trim_correction_m, 0, { abs: 1e-12 }, 'centre pipe');
      assertClose(calculate({ ...TANK, trim_m: -1 }).outputs.trim_correction_m, -9 / 180, { rel: 1e-12 }, 'by the head');
      assertClose(calculate({ ...TANK, heel_deg: -1 }).outputs.heel_correction_m, -6 * Math.tan(Math.PI / 180), { rel: 1e-12 }, 'port heel');
      const port = calculate({ ...TANK, heel_deg: -1, trim_m: 0 }).outputs;
      assertEqual(port.mean_depth_m > 6, true, 'pipe on the high side reads less than the mean');
    },
  },
  {
    name: 'Ullage mode: an ullage of 6.0 m in a 12 m tank is a 6.0 m sounding and gives the same result; an ullage above the tank height is rejected',
    source: 'reading = H − ullage',
    run: () => {
      const ull = calculate({ ...TANK, reading_mode: 'ullage', reading_m: 6.0 }).outputs;
      assertClose(ull.depth_at_pipe_m, 6, { rel: 1e-12 }, 'depth');
      assertClose(ull.volume_m3, calculate(TANK).outputs.volume_m3, { rel: 1e-12 }, 'same volume');
      assertThrows(() => calculate({ ...TANK, reading_mode: 'ullage', reading_m: 13 }), 'exceeds the tank height', 'ullage too large');
    },
  },
  {
    name: 'Wedge check: a 0.4 m sounding with 5 m trim gives a surface that meets the bottom (WEDGE, warning); a 12.0 m sounding (full at the pipe) with 2° heel meets the top; large corrections (> 0.5 m) are flagged',
    source: 'Validity of the box formula; sounding-table wedge corrections',
    run: () => {
      const low = calculate({ ...TANK, reading_m: 0.4, trim_m: 5, heel_deg: 0 });
      assertEqual(low.outputs.validity.startsWith('WEDGE') && low.warnings.some((w) => w.includes('meets the tank bottom')), true, 'bottom');
      const high = calculate({ ...TANK, reading_m: 12.0, heel_deg: 2 });
      assertEqual(high.warnings.some((w) => w.includes('meets the tank top')), true, 'top');
      assertEqual(calculate({ ...TANK, heel_deg: 5 }).warnings.some((w) => w.includes('Corrections above 0.5 m')), true, 'large');
    },
  },
  {
    name: 'Validation: pipe outside the tank (x_p > L or |y_p| > B/2), zero tank height and an unknown reading mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...TANK, pipe_x_m: 25 }), 'between', 'x_p');
      assertThrows(() => calculate({ ...TANK, pipe_y_m: 9 }), 'between', 'y_p');
      assertThrows(() => calculate({ ...TANK, height_m: 0 }), 'greater than zero', 'height');
      assertThrows(() => calculate({ ...TANK, reading_mode: 'dip' }), 'must be one of', 'mode');
    },
  },
];
