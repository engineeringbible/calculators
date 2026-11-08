/**
 * compass-error/tests.js — amplitude and time azimuth against the spherical-triangle formulas, and the error rules.
 * Run: node run-tests.js compass-error
 */
import { calculate, azimuthAtAltitude, timeAzimuth, refractionArcmin } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;

export const tests = [
  {
    name: 'Amplitude at latitude 40° N, declination 20° N: sin A = sin 20°/cos 40° → A = 26.5°, rising bearing 063.5° (E 26.5° N), setting 296.5°',
    source: 'Bowditch, "Azimuths and Amplitudes": sin A = sin Dec / cos Lat',
    run: () => {
      const rising = calculate({ method: 'amplitude', latitude_deg: 40, declination_deg: 20, event: 'rising', horizon: 'celestial' }).outputs;
      const a = Math.asin(Math.sin(20 * DEG) / Math.cos(40 * DEG)) / DEG;
      assertClose(rising.amplitude_deg, a, { rel: 1e-12 }, 'amplitude');
      assertClose(rising.amplitude_deg, 26.52, { abs: 0.01 }, 'amplitude value');
      assertClose(rising.true_bearing_deg, 90 - a, { rel: 1e-12 }, 'rising bearing');
      assertEqual(rising.amplitude_text, 'E 26.5° N', 'notation');
      const setting = calculate({ method: 'amplitude', latitude_deg: 40, declination_deg: 20, event: 'setting', horizon: 'celestial' }).outputs;
      assertClose(setting.true_bearing_deg, 270 + a, { rel: 1e-12 }, 'setting bearing');
    },
  },
  {
    name: 'Special cases: at the equator the amplitude equals the declination (23.44° → bearing 066.56°); a southern declination sets south of west (Lat 50° N, Dec 20° S → W 32.1° S, 237.8°)',
    source: 'Amplitude formula with cos Lat = 1 and with negative declination',
    run: () => {
      const eq = calculate({ latitude_deg: 0, declination_deg: 23.44, horizon: 'celestial' }).outputs;
      assertClose(eq.amplitude_deg, 23.44, { rel: 1e-9 }, 'equator');
      assertClose(eq.true_bearing_deg, 66.56, { abs: 1e-9 }, 'bearing');
      const south = calculate({ latitude_deg: 50, declination_deg: -20, event: 'setting', horizon: 'celestial' }).outputs;
      assertClose(south.amplitude_deg, Math.asin(Math.sin(-20 * DEG) / Math.cos(50 * DEG)) / DEG, { rel: 1e-12 }, 'amplitude');
      assertEqual(south.amplitude_text, 'W 32.1° S', 'notation');
      assertClose(south.true_bearing_deg, 237.85, { abs: 0.01 }, 'bearing');
    },
  },
  {
    name: 'Time azimuth: Lat 0°, Dec 0°, LHA 90° is due west (270°); on the meridian (LHA 0) at Lat 50° N the sun bears 180°; at the LHA of theoretical sunset the time azimuth equals the amplitude bearing',
    source: 'Bowditch time-azimuth formula; cos LHA_set = −tan Lat tan Dec at altitude 0',
    run: () => {
      assertClose(timeAzimuth(0, 0, 90).zn, 270, { abs: 1e-9 }, 'due west');
      assertClose(timeAzimuth(50, 0, 0).zn, 180, { abs: 1e-9 }, 'meridian');
      const lhaSet = Math.acos(-Math.tan(40 * DEG) * Math.tan(20 * DEG)) / DEG;
      const t = timeAzimuth(40, 20, lhaSet);
      assertClose(t.alt, 0, { abs: 1e-9 }, 'altitude zero at sunset');
      const amp = calculate({ latitude_deg: 40, declination_deg: 20, event: 'setting', horizon: 'celestial' }).outputs;
      assertClose(t.zn, amp.true_bearing_deg, { abs: 1e-9 }, 'same bearing');
      const page = calculate({ method: 'azimuth', latitude_deg: 40, declination_deg: 20, gha_deg: lhaSet - 20, longitude_deg: 20 }).outputs;
      assertClose(page.lha_deg, lhaSet, { abs: 1e-9 }, 'LHA = GHA + E longitude');
      assertClose(page.true_bearing_deg, amp.true_bearing_deg, { abs: 1e-9 }, 'page agrees');
    },
  },
  {
    name: 'Compass error and deviation: true 063.5° read as 061.0° is 2.5° E error ("compass least, error east"); with variation 4° W the deviation is 6.5° E',
    source: 'Error rules: error = true − compass, deviation = error − variation (east positive)',
    run: () => {
      const { outputs } = calculate({ latitude_deg: 40, declination_deg: 20, horizon: 'celestial', compass_bearing_deg: 61, variation_deg: -4 });
      assertClose(outputs.compass_error_deg, outputs.true_bearing_deg - 61, { rel: 1e-12 }, 'error');
      assertClose(outputs.compass_error_deg, 2.48, { abs: 0.01 }, 'error value');
      assertClose(outputs.deviation_deg, outputs.compass_error_deg + 4, { rel: 1e-12 }, 'deviation');
      assertEqual(outputs.error_text.includes('2.5° E') && outputs.error_text.includes('6.5° E'), true, 'text');
      const wrap = calculate({ latitude_deg: 0, declination_deg: -2, event: 'rising', horizon: 'celestial', compass_bearing_deg: 359, variation_deg: 0 }).outputs;
      assertClose(wrap.compass_error_deg, 92 - 359 + 360, { abs: 1e-9 }, 'wraps through north');
    },
  },
  {
    name: 'Visible horizon: with a 16 m height of eye the dip is 1.76√16 = 7.04′ and the refraction about 36′, so the true altitude is about −43′ and the bearing is computed at that altitude; refraction at 0° is 34.5′ (Bennett)',
    source: 'Nautical Almanac dip formula; Bennett (1982) refraction; Bowditch visible-horizon amplitude correction',
    run: () => {
      assertClose(refractionArcmin(0), 34.5, { abs: 0.1 }, 'horizontal refraction');
      const { outputs } = calculate({ latitude_deg: 40, declination_deg: 20, horizon: 'visible', eye_height_m: 16 });
      const h = -(7.04 + refractionArcmin(-7.04 / 60)) / 60;
      assertClose(outputs.altitude_deg, h, { rel: 1e-9 }, 'altitude');
      assertClose(outputs.altitude_deg * 60, -43.1, { abs: 0.2 }, 'altitude in arcminutes');
      assertClose(outputs.true_bearing_deg, azimuthAtAltitude(40, 20, h), { rel: 1e-12 }, 'bearing at that altitude');
      const celestial = calculate({ latitude_deg: 40, declination_deg: 20, horizon: 'celestial' }).outputs;
      assertEqual(Math.abs(outputs.true_bearing_deg - celestial.true_bearing_deg) < 1, true, 'correction under 1° at 40° N');
    },
  },
  {
    name: 'Invalid inputs fail fast: a body that never sets (Lat 80° N, Dec 20° N), a latitude of 90°, an unknown method',
    source: 'Validation contract (README, "Conventions"); |sin Dec / cos Lat| > 1 has no amplitude',
    run: () => {
      assertThrows(() => calculate({ latitude_deg: 80, declination_deg: 20, horizon: 'celestial' }), 'does not rise or set', 'circumpolar');
      assertThrows(() => calculate({ latitude_deg: 90 }), 'must be between', 'pole');
      assertThrows(() => calculate({ method: 'sextant' }), 'must be one of', 'method');
    },
  },
];
