/**
 * sight-reduction/tests.js — altitude corrections against the Nautical Almanac and the navigational triangle.
 * Run: node run-tests.js sight-reduction
 */
import { calculate, refractionArcmin, computedAltitude, toDegMin } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const BASE = { body: 'sun_ll', index_error_arcmin: 0, eye_height_m: 16, temperature_c: 10, pressure_hpa: 1010, semi_diameter_arcmin: 16.0, latitude_deg: 40, longitude_deg: -30, gha_deg: 60, declination_deg: 20 };

export const tests = [
  {
    name: 'Refraction in the standard atmosphere (10 °C, 1010 hPa): 9.9′ at 5°, 5.3′ at 10°, 1.7′ at 30°; at −10 °C and 1030 hPa it is (1030/1010)(283/263) = 1.097 times larger',
    source: 'Nautical Almanac refraction (standard conditions and the additional correction table); Bennett (1982)',
    run: () => {
      assertClose(refractionArcmin(5), 9.9, { abs: 0.05 }, '5°');
      assertClose(refractionArcmin(10), 5.3, { abs: 0.1 }, '10°');
      assertClose(refractionArcmin(30), 1.7, { abs: 0.05 }, '30°');
      assertClose(refractionArcmin(10, 1030, -10) / refractionArcmin(10), (1030 / 1010) * (283 / 263), { rel: 1e-12 }, 'non-standard factor');
    },
  },
  {
    name: 'Sun lower limb at Hs 30°, no index error, eye 16 m, SD 16.0′: dip 7.04′, refraction about 1.7′, parallax 0.13′, total correction ≈ −7.04 − 1.72 + 0.13 + 16.0 = +7.4′',
    source: 'Nautical Almanac altitude corrections: dip 1.76′√h(m), sun HP 0.15′, lower limb + SD',
    run: () => {
      const { outputs } = calculate({ ...BASE, hs_deg: 30, hs_min: 0 });
      assertClose(outputs.dip_arcmin, 1.76 * 4, { rel: 1e-12 }, 'dip');
      assertClose(outputs.ha_deg, 30 - 7.04 / 60, { rel: 1e-12 }, 'apparent altitude');
      assertClose(outputs.parallax_arcmin, 0.15 * Math.cos(outputs.ha_deg * DEG), { rel: 1e-12 }, 'parallax');
      assertClose(outputs.semi_diameter_used_arcmin, 16, { rel: 1e-12 }, 'lower limb adds SD');
      assertClose(outputs.total_correction_arcmin, -7.04 - outputs.refraction_arcmin + outputs.parallax_arcmin + 16, { rel: 1e-12 }, 'sum');
      assertClose(outputs.total_correction_arcmin, 7.37, { abs: 0.05 }, 'total');
      const upper = calculate({ ...BASE, body: 'sun_ul', hs_deg: 30, hs_min: 0 }).outputs;
      assertClose(outputs.total_correction_arcmin - upper.total_correction_arcmin, 32, { rel: 1e-12 }, 'upper limb subtracts SD');
    },
  },
  {
    name: 'Navigational triangle: latitude 40° N, declination 20° N, LHA 30° gives Hc = 57.485° (57° 29.1′) and Zn = 240.9°; LHA = GHA + longitude (east positive)',
    source: 'Bowditch, "Sight Reduction": sin Hc = sin L sin d + cos L cos d cos LHA, azimuth formula',
    run: () => {
      const { hc, zn } = computedAltitude(40, 20, 30);
      const s = Math.sin(40 * DEG) * Math.sin(20 * DEG) + Math.cos(40 * DEG) * Math.cos(20 * DEG) * Math.cos(30 * DEG);
      assertClose(hc, Math.asin(s) / DEG, { rel: 1e-12 }, 'Hc');
      assertClose(hc, 57.485, { abs: 0.001 }, 'Hc value');
      assertClose(zn, 240.94, { abs: 0.01 }, 'Zn value');
      const page = calculate({ ...BASE, hs_deg: 57, hs_min: 0, gha_deg: 60, longitude_deg: -30 }).outputs;
      assertClose(page.lha_deg, 30, { abs: 1e-9 }, 'LHA');
      assertClose(page.hc_deg, hc, { rel: 1e-12 }, 'page Hc');
      assertEqual(toDegMin(hc), '57° 29.1′', 'degrees and minutes');
      assertEqual(toDegMin(29.99999), '30° 00.0′', 'carry into degrees');
    },
  },
  {
    name: 'Intercept: a star observed 5′ above the computed altitude gives an intercept of +5 nmi towards the body, and the intercept terminal point lies 5 nmi from the assumed position along the azimuth',
    source: 'Marcq St Hilaire method: intercept = Ho − Hc, 1′ = 1 nmi',
    run: () => {
      const star = { ...BASE, body: 'star', eye_height_m: 0, latitude_deg: 40, longitude_deg: -30, gha_deg: 60, declination_deg: 20 };
      const { hc } = computedAltitude(40, 20, 30);
      const target = hc + 5 / 60;
      let hsGuess = target;
      for (let k = 0; k < 20; k += 1) hsGuess = target + refractionArcmin(hsGuess) / 60;
      const deg = Math.floor(hsGuess);
      const { outputs } = calculate({ ...star, hs_deg: deg, hs_min: (hsGuess - deg) * 60 });
      assertClose(outputs.intercept_nmi, 5, { abs: 1e-6 }, 'intercept');
      const dLatNmi = (outputs.itp_latitude_deg - 40) * 60;
      const dLonNmi = (outputs.itp_longitude_deg + 30) * 60 * Math.cos(40 * DEG);
      assertClose(Math.hypot(dLatNmi, dLonNmi), 5, { rel: 1e-6 }, 'distance to ITP');
      assertEqual(outputs.position_line.includes('towards'), true, 'towards');
    },
  },
  {
    name: 'Moon lower limb at Ha about 40° with HP 57.0′: parallax 57.0 cos Ha ≈ 43.7′ dominates the correction; index error on the arc is subtracted',
    source: 'Nautical Almanac moon correction (parallax in altitude = HP cos Ha)',
    run: () => {
      const { outputs } = calculate({ ...BASE, body: 'moon_ll', hs_deg: 40, hs_min: 7.0, index_error_arcmin: 2.0, moon_hp_arcmin: 57.0, semi_diameter_arcmin: 15.5 });
      assertClose(outputs.index_correction_arcmin, -2, { rel: 1e-12 }, 'IC');
      assertClose(outputs.parallax_arcmin, 57 * Math.cos(outputs.ha_deg * DEG), { rel: 1e-12 }, 'parallax');
      assertClose(outputs.parallax_arcmin, 43.7, { abs: 0.1 }, 'parallax value');
      assertClose(outputs.total_correction_arcmin, -2 - outputs.dip_arcmin - outputs.refraction_arcmin + outputs.parallax_arcmin + 15.5, { rel: 1e-12 }, 'total');
    },
  },
  {
    name: 'Invalid inputs fail fast: 60 minutes, fractional degrees, a negative height of eye and a sight below the horizon',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ hs_min: 60 }), 'must be between', 'minutes');
      assertThrows(() => calculate({ hs_deg: 30.5 }), 'whole number', 'degrees');
      assertThrows(() => calculate({ eye_height_m: -1 }), 'must not be negative', 'eye');
      assertThrows(() => calculate({ hs_deg: 0, hs_min: 2, eye_height_m: 16, index_error_arcmin: 0 }), 'not above the horizon', 'below horizon');
    },
  },
];
