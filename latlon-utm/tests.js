/**
 * latlon-utm/tests.js — checks against published conversions and Karney's exact transverse Mercator.
 * Run: node run-tests.js latlon-utm
 */
import { calculate, toUtm, fromUtm, utmZone } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** [lat, lon, zone, easting, northing (with false northing), convergence deg, scale]: exact TM (Karney's elliptic-function
 * method as implemented in pygeodesy 26.10 ExactTransverseMercator, WGS84, k0 0.9996), computed 2026-11-08. */
const EXACT = [
  [-33.8568, 151.2153, 56, 334900.56965, 6252288.75289, 0.994515432, 0.9999360325],
  [60.0, 5.0, 32, 276979.92640, 6658157.20241, -3.465515341, 1.0002095764],
  [78.2, 15.6, 33, 513696.94542, 8680760.05320, 0.587321332, 0.9996022926],
  [-79.5, -170, 2, 520343.22840, 1174046.40688, -0.983258225, 0.9996050568],
  [83.9, -30, 25, 535575.68019, 9317856.46615, 2.983044606, 0.9996154601],
  [40.0, -74.0, 18, 585360.46184, 4428236.06463, 0.642826368, 0.9996896989],
  [-45, -60.1, 19, 1201450.49448, 4978370.20052, -6.318875590, 1.0056556848],
  [51.5, -0.1278, 30, 699348.54082, 5709341.01130, 2.248542592, 1.0000879360],
];

export const tests = [
  {
    name: 'Eiffel Tower 48.8582° N, 2.2945° E: zone 31U, E 448 251.795 m, N 5 411 932.678 m; back to 48°51′29.52″ N, 2°17′40.20″ E',
    source: 'C. Veness, Geodesy functions library (utm.js) documented example: 31 N 448251.795 5411932.678 ↔ 48°51′29.52″N, 002°17′40.20″E',
    run: () => {
      const o = calculate({ lat_deg: 48.8582, lon_deg: 2.2945 }).outputs;
      assertEqual(o.zone_text, '31U (northern hemisphere)', 'zone');
      assertClose(o.easting_out_m, 448251.795, { abs: 0.0006 }, 'E');
      assertClose(o.northing_out_m, 5411932.678, { abs: 0.0006 }, 'N');
      const g = calculate({ direction: 'to_geo', zone: 31, hemisphere: 'N', easting_m: 448251.795, northing_m: 5411932.678 }).outputs;
      assertClose(g.lat_out_deg, 48 + 51 / 60 + 29.52 / 3600, { abs: 0.005 / 3600 }, 'lat');
      assertClose(g.lon_out_deg, 2 + 17 / 60 + 40.2 / 3600, { abs: 0.005 / 3600 }, 'lon');
    },
  },
  {
    name: 'GeoConvert manual: 38n 444500 3688500 is 33.33424° N, 44.40363° E (33°20′03.25″ N, 44°24′13.06″ E)',
    source: 'GeographicLib GeoConvert(1) manual page, EXAMPLES (echo 38SMB4488 | GeoConvert, -: -p 1 and -u)',
    run: () => {
      const g = calculate({ direction: 'to_geo', zone: 38, hemisphere: 'N', easting_m: 444500, northing_m: 3688500 }).outputs;
      assertClose(g.lat_out_deg, 33.33424, { abs: 0.000005 }, 'lat');
      assertClose(g.lon_out_deg, 44.40363, { abs: 0.000005 }, 'lon');
      assertEqual(g.dms_text, '33°20′03.246″ N, 44°24′13.060″ E', 'DMS');
    },
  },
  {
    name: 'Eight points in both hemispheres, in Svalbard, near 80° S and 84° N and 8.9° off the central meridian agree with the exact transverse Mercator within 0.05 mm, 1e-8° and 1e-9',
    source: 'Karney (2011), J. Geodesy 85: exact TM by elliptic functions (pygeodesy ExactTransverseMercator), WGS84, k0 = 0.9996',
    run: () => {
      for (const [lat, lon, zone, e, n, g, k] of EXACT) {
        const r = toUtm(lat, lon, zone);
        assertClose(r.easting, e, { abs: 5e-5 }, `E ${lat},${lon}`);
        assertClose(r.northing + (lat < 0 ? 1e7 : 0), n, { abs: 5e-5 }, `N ${lat},${lon}`);
        assertClose(r.convergenceDeg, g, { abs: 1e-8 }, `γ ${lat},${lon}`);
        assertClose(r.scale, k, { abs: 1e-9 }, `k ${lat},${lon}`);
      }
    },
  },
  {
    name: 'Round trip forward then inverse returns the position within 1e-9° (0.1 mm); scale on the central meridian at the equator is exactly k0 = 0.9996',
    source: 'Consistency of the α and β Krüger series (Karney 2011); UTM definition k0 = 0.9996',
    run: () => {
      for (const [lat, lon, zone] of EXACT) {
        const r = toUtm(lat, lon, zone);
        const b = fromUtm(r.easting, r.northing, zone);
        assertClose(b.latDeg, lat, { abs: 1e-9 }, `lat ${lat}`);
        assertClose(b.lonDeg, lon, { abs: 1e-9 }, `lon ${lon}`);
      }
      const c = toUtm(0, 3, 31);
      assertClose(c.scale, 0.9996, { abs: 1e-15 }, 'k0');
      assertClose(c.easting, 500000, { abs: 1e-9 }, 'E0');
    },
  },
  {
    name: 'Zones: London 30U, New York 18T, Bergen at 5° E is 32V (Norway), Longyearbyen at 15.6° E is 33X (Svalbard); 180° E is zone 60',
    source: 'NGA.SIG.0012 UTM zone and band definitions with the 32V and 31X–37X exceptions',
    run: () => {
      assertEqual(utmZone(51.5, -0.1278).zone, 30, 'London');
      assertEqual(utmZone(40.7, -74).zone, 18, 'New York');
      const b = utmZone(60.4, 5.3);
      assertEqual(`${b.zone}${b.band}`, '32V', 'Bergen');
      const s = utmZone(78.2, 15.6);
      assertEqual(`${s.zone}${s.band}`, '33X', 'Svalbard');
      assertEqual(utmZone(10, 180).zone, 60, '180°');
    },
  },
  {
    name: 'Outside UTM (above 84° N), a forced zone more than 9° away and an easting outside 100–900 km are refused; a forced neighbouring zone warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ lat_deg: 86, lon_deg: 0 }), 'Latitude');
      assertThrows(() => calculate({ lat_deg: 10, lon_deg: 20, force_zone: 31 }), 'Force a zone');
      assertThrows(() => calculate({ direction: 'to_geo', easting_m: 50000 }), 'Easting');
      assertEqual(calculate({ lat_deg: 48.8582, lon_deg: 2.2945, force_zone: 32 }).warnings.length > 0, true, 'forced');
    },
  },
];
