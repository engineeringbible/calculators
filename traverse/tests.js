/**
 * traverse/tests.js — checks of the bearing parser, the compass rule and the coordinates against hand calculations.
 * Run: node run-tests.js traverse
 */
import { calculate, parseDirection, adjustTraverse, parseLegs, bearingText } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Bearings to azimuths: N45°30′E = 45.5°, S45°30′E = 134.5°, S 12 15 30 W = 192.2583°, N10W = 350°, 135°30′ = 135.5°; N95E and 45°70′ are rejected',
    source: 'Ghilani & Wolf, Elementary Surveying, ch. 7: bearing quadrants and azimuths from north',
    run: () => {
      assertClose(parseDirection("N45°30'E"), 45.5, { abs: 1e-12 }, 'NE');
      assertClose(parseDirection("S45°30'E"), 134.5, { abs: 1e-12 }, 'SE');
      assertClose(parseDirection('S 12 15 30 W'), 192 + 15 / 60 + 30 / 3600, { abs: 1e-12 }, 'SW');
      assertClose(parseDirection('N10W'), 350, { abs: 1e-12 }, 'NW');
      assertClose(parseDirection("135°30'"), 135.5, { abs: 1e-12 }, 'azimuth');
      assertEqual(parseDirection('N95E'), null, 'over 90');
      assertEqual(parseDirection("45°70'"), null, 'minutes');
      assertEqual(bearingText(104.5), 'S 75°30′00″ E', 'back to text');
    },
  },
  {
    name: 'Square 100 × 100 with the west leg 100.04: misclosure 0.04, precision 1 : 10 001; compass correction of departure 0.04 × 100/400.04 per 100 leg; point 3 at E 100.019998',
    source: 'Hand calculation by the compass rule, C_dep = −ΣDep × L / ΣL (Ghilani & Wolf, ch. 10)',
    run: () => {
      const t = adjustTraverse(parseLegs('0; 100\n90; 100\n180; 100\n270; 100.04'), 0, 0);
      assertClose(t.misclosure, 0.04, { abs: 1e-9 }, 'misclosure');
      assertClose(t.perimeter / t.misclosure, 10001, { abs: 1e-5 }, 'precision');
      assertClose(t.rows[0].cDep, 0.04 * 100 / 400.04, { abs: 1e-12 }, 'correction 1');
      assertClose(t.rows[3].cDep, 0.04 * 100.04 / 400.04, { abs: 1e-12 }, 'correction 4');
      assertClose(t.rows[1].e, 100.019998, { abs: 1e-6 }, 'point 3 E');
      assertClose(t.rows[1].n, 100, { abs: 1e-9 }, 'point 3 N');
    },
  },
  {
    name: 'Compass rule on the default traverse: corrections sum to −ΣLat and −ΣDep and the adjusted traverse closes; 1 901.20 ft, misclosure 0.083 ft, 1 : 22 818',
    source: 'Ghilani & Wolf, ch. 10: the corrections equal the misclosure with opposite sign; hand calculation',
    run: () => {
      const t = adjustTraverse(parseLegs(`N26°08'E; 285.43\nS75°30'10"E; 582.10\nS23°30'20"W; 442.05\nN60°06'20"W; 591.62`), 0, 0);
      assertClose(t.rows.reduce((s, r) => s + r.cLat, 0), -t.eLat, { abs: 1e-12 }, 'Σ corr lat');
      assertClose(t.rows.reduce((s, r) => s + r.cDep, 0), -t.eDep, { abs: 1e-12 }, 'Σ corr dep');
      assertClose(t.rows.reduce((s, r) => s + r.aLat, 0), 0, { abs: 1e-9 }, 'Σ adj lat');
      assertClose(t.rows.reduce((s, r) => s + r.aDep, 0), 0, { abs: 1e-9 }, 'Σ adj dep');
      assertClose(t.rows[0].lat, 285.43 * Math.cos((26 + 8 / 60) * Math.PI / 180), { abs: 1e-9 }, 'latitude leg 1');
      const o = calculate({}).outputs;
      assertClose(o.perimeter, 1901.20, { abs: 1e-9 }, 'perimeter');
      assertClose(o.misclosure, 0.0833, { abs: 0.0001 }, 'misclosure');
      assertEqual(o.precision_text, '1 : 22 818', 'precision');
    },
  },
  {
    name: 'A 3-4-5 right triangle 400 north, 300 east, closing leg 500 at azimuth 216.8699° closes exactly; area 60 000 by coordinates',
    source: 'Geometry: area = ½ × 400 × 300; azimuth 180° + atan(300/400)',
    run: () => {
      const az = 180 + (Math.atan2(300, 400) * 180) / Math.PI;
      const o = calculate({ legs: `0; 400\n90; 300\n${az.toFixed(12)}; 500`, start_n: 0, start_e: 0 }).outputs;
      assertClose(o.misclosure, 0, { abs: 1e-9 }, 'misclosure');
      assertClose(o.area, 60000, { abs: 1e-6 }, 'area');
      assertEqual(o.precision_n === null || o.precision_n > 1e10, true, 'precision');
    },
  },
  {
    name: 'Fewer than three legs, an unreadable bearing, a zero distance and a gross misclosure (a reversed leg) are refused; a poor closure warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ legs: 'N10E; 100\nS10W; 100' }), 'at least three');
      assertThrows(() => calculate({ legs: 'N10E; 100\nX12; 100\nS10W; 100' }), 'line 2');
      assertThrows(() => calculate({ legs: 'N10E; 0\n90; 100\nS10W; 100' }), 'line 1');
      assertThrows(() => calculate({ legs: '0; 100\n90; 100\n0; 100\n270; 100' }), 'more than 1 %');
      assertEqual(calculate({ legs: '0; 100\n90; 100\n180; 100\n270; 100.2' }).warnings.length, 1, 'precision warning');
    },
  },
];
