/**
 * mooring-line-meg4/calc.js — OCIMF MEG4 mooring line, tail, fitting and winch brake values from the ship design MBL:
 * line LDBF range and certificate check, working load limit, tail design break force, fitting SWL, winch brake design
 * holding capacity and rendering set point, and the rendering load on the drum layer in use.
 *
 * LDBF = 100–105 % SDMBL;  WLL = 50 % SDMBL;  tail LDBF ≥ 125–130 % SDMBL;  brake holding (design) = 80 % SDMBL;  brake rendering = 60 % SDMBL
 * rendering load on layer k = set point × r₁/r_k,  r_k = D_drum/2 + (k − 0.5) d_rope
 * Schema units: kN, mm.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const MEG4 = {
  ldbfMin: 1.0,
  ldbfMax: 1.05,
  wll: 0.5,
  brakeDesign: 0.8,
  brakeRender: 0.6,
  fittingSwl: 1.25,
};

export const TAIL_FACTORS = {
  synthetic: { label: 'Tail on a synthetic / HMSF line — 125 % of SDMBL', factor: 1.25 },
  wire: { label: 'Tail on a steel wire line — 130 % of SDMBL', factor: 1.3 },
};

export const schema = {
  id: 'mooring-line-meg4',
  name: 'Mooring line and winch brake (MEG4)',
  category: 'maritime',
  summary: 'OCIMF MEG4 values from the ship design MBL: line LDBF range, WLL, tail strength, fitting SWL, brake holding and rendering, and the drum-layer derating.',
  related: ['anchor-catenary', 'lifting-sling', 'bollard-pull', 'berthing-energy', 'beaufort-sea-state'],
  assumptions: [
    'OCIMF Mooring Equipment Guidelines 4th edition (MEG4, 2018) terminology: the Ship Design Minimum Breaking Load (SDMBL) is the strength the mooring system is designed around (from the environmental criteria, typically 60 kn wind and 3 kn current); mooring lines are specified with a Line Design Break Force (LDBF) of 100–105 % of the SDMBL (synthetic lines tested wet and spliced), with the Working Load Limit (WLL) 50 % of the SDMBL as the maximum load in normal operation; the ranges are MEG4 recommendations, and the ship\'s Mooring System Management Plan (MSMP) governs.',
    'Tails: the Tail Design Break Force should be 125–130 % of the SDMBL (the higher figure for tails on steel wire lines) so that the tail, which fatigues fastest, never governs the system; the line-to-tail connection and the replacement criteria are in the Line Management Plan.',
    'Winch brakes: the brake design holding capacity is 80 % of the SDMBL and the brake is set in service to render (slip) at 60 % of the SDMBL, so that the line slips before it breaks; the rendering load is verified by the annual brake test with a jack on the first layer. Mooring fittings (bollards, fairleads, chocks) are rated by their Safe Working Load not less than 1.25 × the SDMBL (MSC.1/Circ.1175 / IACS UR A2, as referenced by MEG4) and marked accordingly.',
    'Drum layers: the brake acts on the drum, so the torque at rendering is constant and the line load at rendering falls with the effective radius: load on layer k = set point × r₁/r_k with r_k = D_drum/2 + (k − 0.5) d_rope; with more than one layer under tension the outer layers can also crush the inner ones — MEG4 recommends mooring on the first layer or de-rating the brake setting for the layer in use.',
    'Loads are compared statically; dynamic loads from passing ships, surge and long-period waves, line elasticity and the sharing between lines are in the mooring analysis (OPTIMOOR or equivalent), not here.',
  ],
  notes: [
    'Verification 2026-10-31: SDMBL 1 000 kN → LDBF 1 000–1 050 kN, WLL 500 kN, tail ≥ 1 250 kN, brake design 800 kN, rendering 600 kN, fitting SWL ≥ 1 250 kN; a 600 mm drum with 44 mm rope on the third layer renders at 600 × 322/410 = 471 kN (47 % SDMBL), which is why MEG4 asks for first-layer mooring or a layer-adjusted setting.',
    'Design decision: the percentages are editable constants (MEG4 object) with the MEG4 defaults; the tail factor is a select so the steel-wire case is explicit.',
  ],
  sources: [
    'OCIMF, Mooring Equipment Guidelines, 4th edition (MEG4), 2018 — sections 4 (mooring system design), 5 (mooring lines: SDMBL, LDBF, WLL, tails) and 6 (winches: brake holding capacity, rendering)',
    'IMO MSC.1/Circ.1175 Guidance on shipboard towing and mooring equipment; IACS Unified Requirement A2 — fitting SWL ≥ 1.25 × line MBL',
    'Wärtsilä Encyclopedia of Marine Technology — "Mooring winch brake design capacity / brake holding capacity" (80 % / 60 %)',
    'Steamship Mutual Risk Alert 50 — mooring winch brake holding capacity and rendering tests',
  ],
  inputs: [
    { id: 'sdmbl_kn', label: 'Ship Design MBL (SDMBL)', group: 'force', unit: 'kN', default: 1000, min: 10, max: 10000 },
    { id: 'line_mbl_kn', label: 'Mooring line certificate break force (LDBF)', group: 'force', unit: 'kN', default: 1030, min: 1, max: 20000 },
    { id: 'tail_type', label: 'Tail arrangement', type: 'select', default: 'synthetic', options: Object.entries(TAIL_FACTORS).map(([value, t]) => ({ value, label: t.label })) },
    { id: 'tail_mbl_kn', label: 'Tail certificate break force', group: 'force', unit: 'kN', default: 1300, min: 1, max: 30000 },
    { id: 'expected_line_load_kn', label: 'Expected line load (mooring analysis or observed)', group: 'force', unit: 'kN', default: 350, min: 0, max: 20000 },
    { id: 'drum_diameter_mm', label: 'Winch drum barrel diameter', group: 'length', unit: 'mm', default: 600, min: 100, max: 3000 },
    { id: 'rope_diameter_mm', label: 'Rope diameter', group: 'length', unit: 'mm', default: 44, min: 5, max: 200 },
    { id: 'layer', label: 'Drum layer under tension when moored', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 12, integer: true },
    { id: 'brake_test_kn', label: 'Brake rendering load measured at the last test (first layer)', group: 'force', unit: 'kN', default: 600, min: 0, max: 20000 },
  ],
  outputs: [
    { id: 'ldbf_min_kn', label: 'Line LDBF minimum (100 % SDMBL)', group: 'force', unit: 'kN' },
    { id: 'ldbf_max_kn', label: 'Line LDBF maximum (105 % SDMBL)', group: 'force', unit: 'kN' },
    { id: 'line_check', label: 'Line certificate against the LDBF range', type: 'text' },
    { id: 'wll_kn', label: 'Working load limit WLL (50 % SDMBL)', group: 'force', unit: 'kN' },
    { id: 'load_vs_wll_pct', label: 'Expected load as share of the WLL', group: 'ratio', unit: 'pct' },
    { id: 'tail_min_kn', label: 'Tail design break force minimum', group: 'force', unit: 'kN' },
    { id: 'tail_check', label: 'Tail certificate against the minimum', type: 'text' },
    { id: 'fitting_swl_kn', label: 'Fitting SWL minimum (1.25 × SDMBL)', group: 'force', unit: 'kN' },
    { id: 'brake_design_kn', label: 'Brake design holding capacity (80 % SDMBL)', group: 'force', unit: 'kN' },
    { id: 'brake_render_kn', label: 'Brake rendering set point (60 % SDMBL, first layer)', group: 'force', unit: 'kN' },
    { id: 'layer_factor', label: 'Layer factor r₁/r_k', group: 'dimensionless', unit: 'none' },
    { id: 'render_on_layer_kn', label: 'Rendering load on the layer in use', group: 'force', unit: 'kN' },
    { id: 'render_on_layer_pct', label: 'Rendering load on the layer as share of SDMBL', group: 'ratio', unit: 'pct' },
    { id: 'brake_test_check', label: 'Last brake test against the set point', type: 'text' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      ldbf_max_kn: '1 050 kN',
      wll_kn: '500 kN',
      load_vs_wll_pct: '70 %',
      tail_min_kn: '1 250 kN',
      fitting_swl_kn: '1 250 kN',
      brake_design_kn: '800 kN',
      render_on_layer_kn: '471 kN',
      render_on_layer_pct: '47 %',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.sdmbl_kn, 'sdmbl_kn', 'SDMBL');
  assertPositive(i.line_mbl_kn, 'line_mbl_kn', 'Line break force');
  assertOneOf(i.tail_type, Object.keys(TAIL_FACTORS), 'tail_type', 'Tail type');
  assertPositive(i.tail_mbl_kn, 'tail_mbl_kn', 'Tail break force');
  assertRange(i.expected_line_load_kn, 0, 1e6, 'expected_line_load_kn', 'Expected load');
  assertPositive(i.drum_diameter_mm, 'drum_diameter_mm', 'Drum diameter');
  assertPositive(i.rope_diameter_mm, 'rope_diameter_mm', 'Rope diameter');
  assertInteger(i.layer, 'layer', 'Layer');
  assertRange(i.layer, 1, 20, 'layer', 'Layer');
  assertRange(i.brake_test_kn, 0, 1e6, 'brake_test_kn', 'Brake test load');

  const S = i.sdmbl_kn;
  const ldbfMin = MEG4.ldbfMin * S;
  const ldbfMax = MEG4.ldbfMax * S;
  const wll = MEG4.wll * S;
  const tailMin = TAIL_FACTORS[i.tail_type].factor * S;
  const brakeDesign = MEG4.brakeDesign * S;
  const render = MEG4.brakeRender * S;
  const r1 = i.drum_diameter_mm / 2 + i.rope_diameter_mm / 2;
  const rk = i.drum_diameter_mm / 2 + (i.layer - 0.5) * i.rope_diameter_mm;
  const layerFactor = r1 / rk;
  const renderLayer = render * layerFactor;
  const lineOk = i.line_mbl_kn >= ldbfMin - 1e-9 && i.line_mbl_kn <= ldbfMax + 1e-9;
  const tailOk = i.tail_mbl_kn >= tailMin - 1e-9;
  const testDev = i.brake_test_kn > 0 ? ((i.brake_test_kn - render) / render) * 100 : null;

  const warnings = [];
  if (i.line_mbl_kn < ldbfMin) warnings.push('Line break force below the SDMBL: the line is weaker than the system design — it will govern and may part before the brake renders.');
  if (i.line_mbl_kn > ldbfMax) warnings.push('Line break force above 105 % of the SDMBL: a line stronger than the design overloads fittings and winch before it parts — MEG4 limits the LDBF to 105 %.');
  if (!tailOk) warnings.push('Tail weaker than the MEG4 minimum: the tail will fail first; fit tails of 125–130 % of the SDMBL.');
  if (i.expected_line_load_kn > wll) warnings.push('Expected line load exceeds the WLL (50 % SDMBL): add lines, re-arrange the pattern or restrict the operating conditions.');
  if (i.layer > 1) warnings.push(`Mooring on layer ${i.layer}: the brake renders at ${renderLayer.toFixed(0)} kN (${((renderLayer / S) * 100).toFixed(0)} % SDMBL) instead of 60 % — moor on the first layer or adjust the brake setting for the layer in use (MEG4).`);
  if (testDev !== null && Math.abs(testDev) > 10) warnings.push(`Last brake test ${testDev > 0 ? 'above' : 'below'} the 60 % set point by ${Math.abs(testDev).toFixed(0)} %: ${testDev > 0 ? 'the line may part before the brake renders' : 'the brake will render early and the ship may range'} — re-adjust and re-test.`);
  warnings.push('MEG4 recommendations; the ship\'s Mooring System Management Plan and Line Management Plan govern, and terminal requirements (e.g. OCIMF SIRE questions) may be stricter.');
  warnings.push('Static comparison only: dynamic loads, line sharing, elasticity and fatigue are in the mooring analysis.');

  return {
    outputs: {
      ldbf_min_kn: ldbfMin,
      ldbf_max_kn: ldbfMax,
      line_check: lineOk ? `OK — ${i.line_mbl_kn} kN is within 100–105 % of SDMBL (${((i.line_mbl_kn / S) * 100).toFixed(1)} %)` : `${i.line_mbl_kn < ldbfMin ? 'TOO WEAK' : 'TOO STRONG'} — ${((i.line_mbl_kn / S) * 100).toFixed(1)} % of SDMBL, outside 100–105 %`,
      wll_kn: wll,
      load_vs_wll_pct: (i.expected_line_load_kn / wll) * 100,
      tail_min_kn: tailMin,
      tail_check: tailOk ? `OK — ${i.tail_mbl_kn} kN ≥ ${tailMin.toFixed(0)} kN (${((i.tail_mbl_kn / S) * 100).toFixed(0)} % SDMBL)` : `TOO WEAK — ${i.tail_mbl_kn} kN < ${tailMin.toFixed(0)} kN`,
      fitting_swl_kn: MEG4.fittingSwl * S,
      brake_design_kn: brakeDesign,
      brake_render_kn: render,
      layer_factor: layerFactor,
      render_on_layer_kn: renderLayer,
      render_on_layer_pct: (renderLayer / S) * 100,
      brake_test_check: testDev === null ? 'No brake test entered' : Math.abs(testDev) <= 10 ? `OK — ${i.brake_test_kn} kN is within ±10 % of the ${render.toFixed(0)} kN set point (${testDev >= 0 ? '+' : ''}${testDev.toFixed(1)} %)` : `RE-ADJUST — ${i.brake_test_kn} kN is ${testDev >= 0 ? '+' : ''}${testDev.toFixed(1)} % from the ${render.toFixed(0)} kN set point`,
      summary: `SDMBL ${S} kN: lines ${ldbfMin.toFixed(0)}–${ldbfMax.toFixed(0)} kN, WLL ${wll.toFixed(0)} kN, tails ≥ ${tailMin.toFixed(0)} kN, fittings SWL ≥ ${(MEG4.fittingSwl * S).toFixed(0)} kN, brake holds ${brakeDesign.toFixed(0)} and renders at ${render.toFixed(0)} kN (layer ${i.layer}: ${renderLayer.toFixed(0)} kN)`,
    },
    warnings,
  };
}
