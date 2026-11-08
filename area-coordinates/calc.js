/**
 * area-coordinates/calc.js — area, perimeter and centroid of a polygon from the coordinates of its corners by the
 * coordinate (shoelace, Gauss) method, in m², ft², acres and hectares.
 *
 * 2A = Σ (x_i y_{i+1} − x_{i+1} y_i);  C_x = Σ (x_i + x_{i+1})(x_i y_{i+1} − x_{i+1} y_i) / (6A), likewise C_y.
 * Schema units: area in m², perimeter in m; the coordinate unit is chosen with a select (m, ft, US survey ft);
 * the centroid is returned in the coordinate unit.
 */
import { withDefaults, assertOneOf } from '../shared/validate.js';

/** Metres per coordinate unit: international foot (exact) and US survey foot 1200/3937 m (NIST). */
export const UNIT_M = { m: 1, ft: 0.3048, usft: 1200 / 3937 };
const ACRE_M2 = 4046.8564224; // 43 560 international ft²
const HECTARE_M2 = 10000;

const DEFAULT_POINTS = ['5000.000, 5000.000', '5125.709, 5256.247', '5689.251, 5110.519', '5512.926, 4705.143'].join('\n');

/** Parse "x, y" lines (or "name, x, y"); comma, semicolon, tab or spaces separate the fields. */
export function parsePoints(text) {
  const pts = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    let parts = line.split(/[,;\t]/).map((p) => p.trim()).filter((p) => p !== '');
    if (parts.length === 1) parts = line.split(/\s+/);
    if (parts.length === 3 && !Number.isFinite(Number(parts[0]))) parts = parts.slice(1);
    if (parts.length !== 2) throw new Error(`Points, line ${k + 1}: write two coordinates such as "1250.40, 860.15".`);
    const v = parts.map((p) => Number(p));
    if (!v.every(Number.isFinite)) throw new Error(`Points, line ${k + 1}: "${line}" holds something that is not a number; use a decimal point, not a comma.`);
    pts.push(v);
  });
  if (pts.length > 1) {
    const [a, b] = [pts[0], pts[pts.length - 1]];
    if (a[0] === b[0] && a[1] === b[1]) pts.pop();
  }
  if (pts.length < 3) throw new Error('Points: a polygon needs at least three different corners.');
  return pts;
}

/** Signed area (positive counter-clockwise in x–y), perimeter and centroid of a polygon [[x, y], …]. */
export function polygon(pts) {
  let a2 = 0; let cx = 0; let cy = 0; let per = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const [x0, y0] = pts[i]; const [x1, y1] = pts[(i + 1) % pts.length];
    const cross = x0 * y1 - x1 * y0;
    a2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
    per += Math.hypot(x1 - x0, y1 - y0);
  }
  const area = a2 / 2;
  return { signedArea: area, perimeter: per, cx: area ? cx / (6 * area) : null, cy: area ? cy / (6 * area) : null };
}

/** True when two edges that do not share a corner cross each other. */
export function selfIntersects(pts) {
  const n = pts.length;
  const orient = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      const [a, b] = [pts[i], pts[(i + 1) % n]]; const [c, d] = [pts[j], pts[(j + 1) % n]];
      if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) return true;
    }
  }
  return false;
}

export const schema = {
  id: 'area-coordinates',
  name: 'Polygon area from coordinates (shoelace method)',
  category: 'civil',
  summary: 'Area, perimeter and centroid of a lot or any polygon from its corner coordinates by the shoelace method, in m², ft², acres and hectares.',
  related: ['traverse', 'latlon-utm', 'earthwork-volume', 'unit-converter'],
  assumptions: [
    'The corners are listed in order around the boundary, either clockwise or counter-clockwise, and the edges are straight lines that do not cross.',
    'Coordinates are plane (grid) coordinates. On a map projection such as UTM or a state plane grid, the area is a grid area; divide it by the square of the combined scale factor for the ground area.',
    'Curved boundaries must be broken into short chords or have their segment areas added separately.',
    'An acre is 43 560 international square feet (4 046.856 m²). The US survey foot, 1200/3937 m, can be chosen for older US state plane coordinates.',
  ],
  notes: [
    'Verification 2026-11-08: the default four corners (the adjusted traverse of the traverse calculator, in feet) give 211 322 ft², 4.851 acres, 1.963 ha, perimeter 1 901.20 ft and centroid E 5 351.03, N 5 009.28. Checked by hand.',
  ],
  sources: [
    'Ghilani, C.D. and Wolf, P.R., Elementary Surveying: An Introduction to Geomatics, 13th ed., Pearson, ch. 12 Area (area by coordinates)',
    'Bourke, P. (1988), Calculating the area and centroid of a polygon (signed area and centroid formulas)',
    'NIST Handbook 44, Appendix C (1959 international foot 0.3048 m, US survey foot 1200/3937 m, acre 43 560 ft²)',
  ],
  inputs: [
    { id: 'points', label: 'Corner coordinates (one per line, in order round the boundary)', type: 'textarea', rows: 8, default: DEFAULT_POINTS, help: 'Two numbers per line, separated by a comma, semicolon, tab or space. An optional point name may come first.' },
    { id: 'order', label: 'Order of the two numbers', type: 'select', default: 'en', options: [{ value: 'en', label: 'x, y (easting, northing)' }, { value: 'ne', label: 'northing, easting' }] },
    { id: 'unit', label: 'Unit of the coordinates', type: 'select', default: 'ft', options: [{ value: 'ft', label: 'Feet (international)' }, { value: 'usft', label: 'US survey feet' }, { value: 'm', label: 'Metres' }] },
  ],
  outputs: [
    { id: 'area_m2', label: 'Area', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'area_acres', label: 'Area in acres', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'area_ha', label: 'Area in hectares', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'perimeter_m', label: 'Perimeter', group: 'length', unit: 'm', display: 'ft' },
    { id: 'centroid_e', label: 'Centroid easting (x), coordinate units', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'centroid_n', label: 'Centroid northing (y), coordinate units', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'corners', label: 'Number of corners', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'direction', label: 'Order of the corners', type: 'text' },
  ],
  example: {
    inputs: {},
    results: { area_m2: '211 322 ft²', area_acres: '4.851', area_ha: '1.963', perimeter_m: '1 901.20 ft', centroid_e: '5 351.03' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.order, ['en', 'ne'], 'order', 'Order of the two numbers');
  assertOneOf(x.unit, Object.keys(UNIT_M), 'unit', 'Unit of the coordinates');
  const raw = parsePoints(x.points);
  const pts = x.order === 'en' ? raw : raw.map(([n, e]) => [e, n]);
  const p = polygon(pts);
  const k = UNIT_M[x.unit];
  const areaM2 = Math.abs(p.signedArea) * k * k;
  if (!(areaM2 > 0)) throw new Error('Points: the corners lie on one line, so the polygon has no area.');
  const warnings = [];
  if (selfIntersects(pts)) warnings.push('Two edges of the polygon cross each other: the corners are probably out of order, and the area is not the area of the lot.');
  return {
    outputs: {
      area_m2: areaM2,
      area_acres: areaM2 / ACRE_M2,
      area_ha: areaM2 / HECTARE_M2,
      perimeter_m: p.perimeter * k,
      centroid_e: p.cx,
      centroid_n: p.cy,
      corners: pts.length,
      direction: p.signedArea > 0 ? 'Counter-clockwise (positive shoelace sum)' : 'Clockwise (negative shoelace sum)',
    },
    warnings,
  };
}
