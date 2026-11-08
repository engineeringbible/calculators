/**
 * area-coordinates/tests.js — checks against exact geometric areas and centroids and the unit definitions.
 * Run: node run-tests.js area-coordinates
 */
import { calculate, polygon, parsePoints, selfIntersects } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'A square of 208.7103 ft sides is 43 560 ft² = 1 acre = 0.404686 ha; a 100 m square is 1 ha = 2.471054 acres',
    source: 'NIST Handbook 44, Appendix C: 1 acre = 43 560 ft² = 4 046.856 422 4 m²; 1 ha = 10 000 m²',
    run: () => {
      const s = Math.sqrt(43560);
      const a = calculate({ points: `0,0\n${s},0\n${s},${s}\n0,${s}`, unit: 'ft' }).outputs;
      assertClose(a.area_acres, 1, { rel: 1e-12 }, 'acre');
      assertClose(a.area_ha, 0.40468564224, { rel: 1e-10 }, 'ha');
      const h = calculate({ points: '0 0\n100 0\n100 100\n0 100', unit: 'm' }).outputs;
      assertClose(h.area_ha, 1, { rel: 1e-12 }, 'hectare');
      assertClose(h.area_acres, 2.4710538, { abs: 1e-6 }, 'acres');
    },
  },
  {
    name: 'Triangle (0,0), (6,0), (0,3): area 9, centroid (2, 1); L-shape 0–4 × 0–1 plus 0–1 × 1–4: area 7, centroid (1.5, 1.5)',
    source: 'Geometry: triangle area ½ b h and centroid at the mean of the corners; composite centroid by moments (4 × (2, 0.5) + 3 × (0.5, 2.5)) / 7',
    run: () => {
      const t = polygon([[0, 0], [6, 0], [0, 3]]);
      assertClose(t.signedArea, 9, { abs: 1e-12 }, 'area');
      assertClose(t.cx, 2, { abs: 1e-12 }, 'cx');
      assertClose(t.cy, 1, { abs: 1e-12 }, 'cy');
      const l = polygon([[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]]);
      assertClose(l.signedArea, 7, { abs: 1e-12 }, 'L area');
      assertClose(l.cx, (4 * 2 + 3 * 0.5) / 7, { abs: 1e-12 }, 'L cx');
      assertClose(l.cy, (4 * 0.5 + 3 * 2.5) / 7, { abs: 1e-12 }, 'L cy');
    },
  },
  {
    name: 'Default lot (the adjusted traverse): shoelace sum −422 643.8 ft², so 211 322 ft², 4.851 acres, clockwise; the same in northing-easting order and with a closing repeat of the first point',
    source: 'Hand calculation with the origin moved to the first corner: cross products 0, −162 725.27, −259 918.55, 0',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.area_m2 / 0.09290304, 211321.909, { abs: 0.01 }, 'ft²');
      assertClose(o.area_acres, 4.851284, { abs: 1e-6 }, 'acres');
      assertEqual(o.direction.startsWith('Clockwise'), true, 'direction');
      const swapped = '5000.000, 5000.000\n5256.247, 5125.709\n5110.519, 5689.251\n4705.143, 5512.926\n5000.000, 5000.000';
      const s = calculate({ points: swapped, order: 'ne' }).outputs;
      assertClose(s.area_m2, o.area_m2, { rel: 1e-12 }, 'N,E order');
      assertClose(s.centroid_e, o.centroid_e, { rel: 1e-12 }, 'centroid');
      assertEqual(s.corners, 4, 'closing point dropped');
    },
  },
  {
    name: 'US survey foot: a 1 000 × 1 000 survey-ft square is 92 903.41 m², 4 ppm more than in international feet (92 903.04 m²)',
    source: 'NIST Handbook 44, Appendix C: US survey foot = 1200/3937 m; international foot = 0.3048 m',
    run: () => {
      const pts = '0 0\n1000 0\n1000 1000\n0 1000';
      assertClose(calculate({ points: pts, unit: 'usft' }).outputs.area_m2, (1200 / 3937) ** 2 * 1e6, { rel: 1e-12 }, 'usft');
      assertClose(calculate({ points: pts, unit: 'usft' }).outputs.area_m2, 92903.41, { abs: 0.005 }, 'value');
      assertClose(calculate({ points: pts, unit: 'ft' }).outputs.area_m2, 92903.04, { abs: 0.001 }, 'ft');
    },
  },
  {
    name: 'A bow-tie (crossing edges) warns; collinear corners, two points, a decimal comma and a lone number are refused; names before the coordinates are read',
    source: 'Validation contract',
    run: () => {
      assertEqual(selfIntersects([[0, 0], [1, 1], [1, 0], [0, 1]]), true, 'bow-tie');
      assertEqual(calculate({ points: '0 0\n10 10\n10 0\n0 4', unit: 'm' }).warnings.length, 1, 'warning');
      assertThrows(() => calculate({ points: '0 0\n1 1\n2 2' }), 'one line');
      assertThrows(() => calculate({ points: '0 0\n1 1' }), 'at least three');
      assertThrows(() => calculate({ points: '0;0\n1,5;2\n3;0' }), 'line 2');
      assertThrows(() => calculate({ points: '0 0\n5\n3 0' }), 'line 2');
      assertEqual(parsePoints('A, 0, 0\nB, 10, 0\nC, 0, 10').length, 3, 'names');
    },
  },
];
