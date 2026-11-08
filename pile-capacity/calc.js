/**
 * pile-capacity/calc.js — axial compression capacity of a single pile in layered clay and sand: shaft friction plus
 * end bearing, ultimate and allowable, for driven piles (API RP 2GEO) or bored piles (O'Neill & Reese, FHWA 1999).
 *
 * Driven, clay (API RP 2GEO 8.1): f = α s_u, α = 0.5 ψ^−0.5 (ψ ≤ 1), 0.5 ψ^−0.25 (ψ > 1), α ≤ 1, ψ = s_u/σ'v;
 *   q = 9 s_u.  Driven, sand (API RP 2GEO Table 1): f = β σ'v ≤ f_lim, q = N_q σ'v ≤ q_lim by relative density.
 * Bored, clay (O'Neill & Reese 1999): f = α s_u, α = 0.55 for s_u/p_a ≤ 1.5, 0.55 − 0.1 (s_u/p_a − 1.5) to 2.5;
 *   no friction in the top 1.5 m and the bottom one diameter; q = N_c s_u, N_c = 6 (1 + 0.2 L/D) ≤ 9, q ≤ 3.83 MPa.
 * Bored, sand: f = β σ'v ≤ 200 kPa, β = 1.5 − 0.245 √z (z in m), 0.25 ≤ β ≤ 1.2, × N60/15 when N60 < 15;
 *   q = 0.0575 N60 MPa (1.2 N60 ksf), N60 ≤ 50.
 * Shaft friction is integrated over thin slices with σ'v from the effective unit weights.
 * Schema units: m, N; the soil layers in SI (m, kPa, kN/m³) or US (ft, psf, pcf) units chosen by a select.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';

const PA_KPA = 101.325;
const FT = 0.3048;
const PSF_KPA = 0.04788025898;
const PCF_KNM3 = 0.157087463;

/** API RP 2GEO (2011) Table 1, cohesionless soils: β, f_lim (kPa), N_q, q_lim (kPa). */
export const API_SAND = {
  'sand:medium dense': { beta: 0.37, flim: 81, nq: 20, qlim: 5000 },
  'sand:dense': { beta: 0.46, flim: 96, nq: 40, qlim: 10000 },
  'sand:very dense': { beta: 0.56, flim: 115, nq: 50, qlim: 12000 },
  'silt:medium dense': { beta: 0.29, flim: 67, nq: 12, qlim: 3000 },
  'silt:dense': { beta: 0.37, flim: 81, nq: 20, qlim: 5000 },
  'silt:very dense': { beta: 0.46, flim: 96, nq: 40, qlim: 10000 },
};

/** Relative density from the SPT blow count (Terzaghi and Peck): 10–30 medium dense, 30–50 dense, over 50 very dense. */
export function densityFromN(n) {
  if (n < 4) return 'very loose';
  if (n < 10) return 'loose';
  if (n < 30) return 'medium dense';
  if (n <= 50) return 'dense';
  return 'very dense';
}

const DEFAULT_LAYERS = ['6; clay; 40; 8', '8; clay; 80; 9', '10; sand; 35; 10'].join('\n');

/** Parse "thickness; clay|sand|silt; s_u or N60 or density; γ'" lines into SI layers (m, kPa, kN/m³). */
export function parseLayers(text, units) {
  const layers = [];
  let top = 0;
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const p = line.split(/[;\t]/).map((s) => s.trim());
    if (p.length !== 4) throw new Error(`Soil layers, line ${k + 1}: write "thickness; clay or sand or silt; s_u or N60; effective unit weight".`);
    const t = Number(p[0]);
    if (!Number.isFinite(t) || t <= 0) throw new Error(`Soil layers, line ${k + 1}: the thickness "${p[0]}" must be a number above zero.`);
    const soil = p[1].toLowerCase();
    if (!['clay', 'sand', 'silt'].includes(soil)) throw new Error(`Soil layers, line ${k + 1}: the soil "${p[1]}" must be clay, sand or silt.`);
    const g = Number(p[3]);
    if (!Number.isFinite(g) || g <= 0 || g > (units === 'us' ? 160 : 25)) throw new Error(`Soil layers, line ${k + 1}: the effective unit weight "${p[3]}" must be above zero and at most ${units === 'us' ? '160 pcf' : '25 kN/m³'} (use the submerged weight below the water table).`);
    const layer = { soil, top: 0, bottom: 0, gamma: units === 'us' ? g * PCF_KNM3 : g };
    const th = units === 'us' ? t * FT : t;
    if (soil === 'clay') {
      const su = Number(p[2]);
      if (!Number.isFinite(su) || su <= 0) throw new Error(`Soil layers, line ${k + 1}: the undrained shear strength "${p[2]}" must be a number above zero.`);
      layer.su = units === 'us' ? su * PSF_KPA : su;
    } else {
      const n = Number(p[2]);
      if (Number.isFinite(n)) {
        if (n < 0 || n > 200) throw new Error(`Soil layers, line ${k + 1}: N60 "${p[2]}" must be between 0 and 200 blows per 300 mm.`);
        layer.n60 = n;
        layer.density = densityFromN(n);
      } else {
        const d = p[2].toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ');
        const map = { medium: 'medium dense', 'medium dense': 'medium dense', dense: 'dense', 'very dense': 'very dense', loose: 'loose', 'very loose': 'very loose' };
        if (!map[d]) throw new Error(`Soil layers, line ${k + 1}: give N60 as a number or the density as medium dense, dense or very dense.`);
        layer.density = map[d];
      }
    }
    layer.top = top; top += th; layer.bottom = top;
    layer.line = k + 1;
    layers.push(layer);
  });
  if (!layers.length) throw new Error('Soil layers: enter at least one layer.');
  return layers;
}

/** Effective vertical stress (kPa) at depth z (m). */
function sigmaV(layers, z) {
  let s = 0;
  for (const l of layers) {
    if (z <= l.top) break;
    s += l.gamma * (Math.min(z, l.bottom) - l.top);
  }
  return s;
}

/** Unit shaft friction (kPa) at depth z in a layer. */
function unitFriction(l, z, sv, install, L, D) {
  if (l.soil === 'clay') {
    if (install === 'driven') {
      const psi = l.su / Math.max(sv, 1e-9);
      const alpha = Math.min(1, psi <= 1 ? 0.5 * psi ** -0.5 : 0.5 * psi ** -0.25);
      return alpha * l.su;
    }
    if (z < 1.5 || z > L - D) return 0;
    const r = l.su / PA_KPA;
    return (r <= 1.5 ? 0.55 : 0.55 - 0.1 * (r - 1.5)) * l.su;
  }
  if (install === 'driven') {
    const a = API_SAND[`${l.soil}:${l.density}`];
    return Math.min(a.beta * sv, a.flim);
  }
  let beta = Math.min(1.2, Math.max(0.25, 1.5 - 0.245 * Math.sqrt(z)));
  if (l.n60 < 15) beta *= l.n60 / 15;
  return Math.min(beta * sv, 200);
}

/** Pile capacity in kN for SI layers; returns per-layer shaft resistance and the end bearing. */
export function pileCapacity(layers, { install, shape, D, L }) {
  const perim = shape === 'circle' ? Math.PI * D : 4 * D;
  const area = shape === 'circle' ? (Math.PI * D * D) / 4 : D * D;
  const parts = [];
  for (const l of layers) {
    if (l.top >= L) break;
    const z0 = l.top; const z1 = Math.min(l.bottom, L);
    const n = Math.min(40000, Math.max(400, Math.ceil((z1 - z0) / 0.002)));
    const dz = (z1 - z0) / n;
    let q = 0;
    for (let i = 0; i < n; i += 1) {
      const z = z0 + (i + 0.5) * dz;
      q += unitFriction(l, z, sigmaV(layers, z), install, L, D) * dz;
    }
    parts.push({ layer: l, z0, z1, perMetre: q, qs: q * perim, fAvg: q / (z1 - z0) });
  }
  const tip = layers.find((l) => L >= l.top && (L < l.bottom || l === layers[layers.length - 1]));
  const svTip = sigmaV(layers, L);
  let qb;
  if (tip.soil === 'clay') {
    if (install === 'driven') qb = 9 * tip.su;
    else qb = Math.min(Math.min(9, 6 * (1 + (0.2 * L) / D)) * tip.su, 3830);
  } else if (install === 'driven') {
    const a = API_SAND[`${tip.soil}:${tip.density}`];
    qb = Math.min(a.nq * svTip, a.qlim);
  } else {
    qb = 57.5 * Math.min(tip.n60, 50);
  }
  return { parts, tip, svTip, qb, area, perim, Qs: parts.reduce((s, p) => s + p.qs, 0), Qb: qb * area };
}

export const schema = {
  id: 'pile-capacity',
  name: 'Pile capacity calculator (driven and bored piles)',
  category: 'civil',
  summary: 'Axial capacity of a single driven or bored pile in layered clay and sand: shaft friction by the α and β methods plus end bearing, with a factor of safety.',
  related: ['soil-bearing', 'consolidation-settlement', 'footing-size', 'retaining-wall'],
  assumptions: [
    'Driven piles follow API RP 2GEO: the α method in clay and the β method with the Table 1 limits in sand and silt, by relative density. API gives no values for loose sand, so a loose layer is refused for driven piles. The pile is assumed plugged, with end bearing on its full area.',
    'Bored piles (drilled shafts) follow O\'Neill and Reese (FHWA, 1999): α = 0.55 in clay with no friction in the top 1.5 m and the bottom one diameter, β = 1.5 − 0.245 √z in sand, and end bearing from N60 in sand.',
    'Sand and silt layers take an SPT N60 value, from which the relative density follows Terzaghi and Peck; driven piles also accept the words medium dense, dense or very dense. Use effective (submerged) unit weights below the water table.',
    'The capacity is geotechnical only: the pile weight, negative skin friction, group effects, settlement and the strength of the pile itself are not checked.',
    'The allowable load is the ultimate capacity divided by one factor of safety, commonly 2 to 3; LRFD design uses resistance factors instead, and load tests can justify lower factors.',
  ],
  notes: [
    'Verification 2026-11-08: a driven 610 mm closed-end pipe pile 20 m long through 6 m of clay (s_u 40 kPa, γ\' 8), 8 m of clay (s_u 80 kPa, γ\' 9) and into dense sand (N60 35, γ\' 10) has shaft friction 100.97 + 332.67 + 414.0 = 847.6 kN per metre of perimeter, Q_s = 1 624 kN, end bearing 40 × 180 = 7 200 kPa, Q_b = 2 104 kN, Q_ult = 3 729 kN and 1 491 kN at FS 2.5 (integrals by hand).',
  ],
  sources: [
    'API RP 2GEO (2011, Addendum 1 2014), Geotechnical and Foundation Design Considerations, section 8.1 (α method for cohesive soils) and Table 1 (design parameters for cohesionless siliceous soil)',
    'O\'Neill, M.W. and Reese, L.C. (1999), Drilled Shafts: Construction Procedures and Design Methods, FHWA-IF-99-025 (side and base resistance in cohesive and cohesionless soils)',
    'Terzaghi, K., Peck, R.B. and Mesri, G. (1996), Soil Mechanics in Engineering Practice, 3rd ed., Wiley (relative density from the SPT N value)',
  ],
  inputs: [
    { id: 'install', label: 'Pile type', type: 'select', default: 'driven', options: [{ value: 'driven', label: 'Driven pile (API RP 2GEO)' }, { value: 'bored', label: 'Bored pile / drilled shaft (O\'Neill & Reese, FHWA)' }] },
    { id: 'shape', label: 'Cross-section', type: 'select', default: 'circle', options: [{ value: 'circle', label: 'Circular (D = diameter)' }, { value: 'square', label: 'Square (D = side)' }] },
    { id: 'diameter_m', label: 'Diameter or side D', group: 'length', unit: 'm', display: 'mm', default: 0.61, min: 0.1, max: 5 },
    { id: 'length_m', label: 'Embedded length L', group: 'length', unit: 'm', default: 20, min: 1, max: 200 },
    { id: 'units', label: 'Units of the soil layers', type: 'select', default: 'si', options: [{ value: 'si', label: 'SI: m, kPa, kN/m³' }, { value: 'us', label: 'US: ft, psf, pcf' }] },
    { id: 'layers', label: 'Soil layers from the ground down (thickness; clay, sand or silt; s_u for clay or N60 for sand; effective unit weight)', type: 'textarea', rows: 6, default: DEFAULT_LAYERS, help: 'Example: "6; clay; 40; 8" is 6 m of clay with s_u 40 kPa and γ\' 8 kN/m³. "10; sand; 35; 10" is sand with N60 = 35.' },
    { id: 'fs', label: 'Factor of safety', group: 'dimensionless', unit: 'none', default: 2.5, min: 1, max: 10 },
  ],
  outputs: [
    { id: 'qs_n', label: 'Shaft friction Q_s', group: 'force', unit: 'N', display: 'kN' },
    { id: 'qb_n', label: 'End bearing Q_b', group: 'force', unit: 'N', display: 'kN' },
    { id: 'qult_n', label: 'Ultimate capacity Q_ult', group: 'force', unit: 'N', display: 'kN' },
    { id: 'qall_n', label: 'Allowable load Q_ult / FS', group: 'force', unit: 'N', display: 'kN' },
    { id: 'q_tip_pa', label: 'Unit end bearing at the tip', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'sv_tip_pa', label: 'Effective vertical stress at the tip', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'tip_text', label: 'Tip layer', type: 'text' },
    { id: 'layers_table', label: 'Shaft friction by layer', type: 'table' },
  ],
  example: {
    inputs: { install: 'driven', shape: 'circle', diameter_m: [610, 'mm'], length_m: [20, 'm'], units: 'si', fs: 2.5 },
    results: { qs_n: '1 624 kN', qb_n: '2 104 kN', qult_n: '3 729 kN', qall_n: '1 491 kN' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.install, ['driven', 'bored'], 'install', 'Pile type');
  assertOneOf(x.shape, ['circle', 'square'], 'shape', 'Cross-section');
  assertOneOf(x.units, ['si', 'us'], 'units', 'Units of the soil layers');
  const D = assertRange(x.diameter_m, 0.1, 5, 'diameter_m', 'Diameter or side D');
  const L = assertRange(x.length_m, 1, 200, 'length_m', 'Embedded length L');
  const fs = assertRange(x.fs, 1, 10, 'fs', 'Factor of safety');
  const layers = parseLayers(x.layers, x.units);
  const bottom = layers[layers.length - 1].bottom;
  if (L > bottom + 1e-9) throw new Error(`Embedded length L: the soil layers end at ${x.units === 'us' ? `${(bottom / FT).toFixed(1)} ft` : `${bottom.toFixed(2)} m`}, above the pile tip; describe the soil down to the tip.`);
  const used = layers.filter((l) => l.top < L);
  for (const l of used) {
    if (l.soil === 'clay' && x.install === 'bored' && l.su / PA_KPA > 2.5) throw new Error(`Soil layers, line ${l.line}: s_u above 2.5 atmospheres (253 kPa) is outside O'Neill and Reese's clay method; treat it as an intermediate geomaterial.`);
    if (l.soil !== 'clay' && x.install === 'driven' && (l.density === 'loose' || l.density === 'very loose')) throw new Error(`Soil layers, line ${l.line}: API RP 2GEO gives no design values for ${l.density} ${l.soil}; use CPT-based methods or a geotechnical engineer.`);
    if (l.soil !== 'clay' && x.install === 'bored' && l.n60 === undefined) throw new Error(`Soil layers, line ${l.line}: bored piles in sand need the N60 blow count as a number.`);
  }
  const r = pileCapacity(layers, { install: x.install, shape: x.shape, D, L });
  if (r.tip.soil !== 'clay' && x.install === 'driven' && (r.tip.density === 'loose' || r.tip.density === 'very loose')) throw new Error(`Soil layers, line ${r.tip.line}: API RP 2GEO gives no design values for loose sand at the tip.`);
  if (r.tip.soil !== 'clay' && x.install === 'bored' && r.tip.n60 === undefined) throw new Error(`Soil layers, line ${r.tip.line}: bored piles in sand need the N60 blow count as a number.`);
  const warnings = [];
  if (r.tip.soil !== 'clay' && x.install === 'bored' && r.tip.n60 > 50) warnings.push('N60 above 50 at the tip is taken as 50; very dense soil may be treated as an intermediate geomaterial for a higher value.');
  if (r.tip.bottom - L < 3 * D && r.tip !== layers[layers.length - 1]) warnings.push('The tip is less than three diameters above the next layer; if that layer is weaker, it controls the end bearing.');
  if (x.install === 'bored' && r.tip.soil === 'clay' && r.tip.su < 96) warnings.push('Clay at the base has s_u below 96 kPa (2 ksf): O\'Neill and Reese reduce the base resistance there because settlement governs.');
  const us = x.units === 'us';
  const f = (kpa) => (us ? `${(kpa / PSF_KPA).toFixed(0)} psf` : `${kpa.toFixed(1)} kPa`);
  const len = (m) => (us ? (m / FT).toFixed(1) : m.toFixed(2));
  const force = (kn) => (us ? `${(kn / 4.4482216152605).toFixed(1)} kip` : `${kn.toFixed(1)} kN`);
  const rows = r.parts.map((p) => [String(p.layer.line), `${len(p.z0)}–${len(p.z1)} ${us ? 'ft' : 'm'}`,
    p.layer.soil === 'clay' ? `Clay, s_u ${f(p.layer.su)}` : `${p.layer.soil === 'sand' ? 'Sand' : 'Silt'}, ${p.layer.density}${p.layer.n60 !== undefined ? ` (N60 ${p.layer.n60})` : ''}`,
    f(p.fAvg), force(p.qs)]);
  const tipDesc = r.tip.soil === 'clay' ? `clay (s_u ${f(r.tip.su)})` : `${r.tip.density} ${r.tip.soil}`;
  return {
    outputs: {
      qs_n: r.Qs * 1000,
      qb_n: r.Qb * 1000,
      qult_n: (r.Qs + r.Qb) * 1000,
      qall_n: ((r.Qs + r.Qb) * 1000) / fs,
      q_tip_pa: r.qb * 1000,
      sv_tip_pa: r.svTip * 1000,
      tip_text: `Layer ${r.tip.line}: ${tipDesc}`,
      layers_table: { columns: ['Layer', 'Depth', 'Soil', 'Average unit friction', 'Shaft friction'], rows },
    },
    warnings,
  };
}
