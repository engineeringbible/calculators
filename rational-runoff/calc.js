/**
 * rational-runoff/calc.js — design peak runoff by the rational method with a composite runoff coefficient over up to
 * three sub-areas, the Kirpich time of concentration, an optional IDF relation for the rainfall intensity, a frequency
 * factor for rare storms and the resulting runoff volume and depth.
 *
 * Q = C i A/360 (m³/s; i mm/h, A ha);  t_c = 0.0195 L^0.77 S^−0.385 (min; L m, S m/m);  i = a/(t_c + b)^n.
 * Schema units: m², m, mm/h, m³/s.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Typical rational-method runoff coefficients (2–10 year storms). */
export const SURFACES = {
  roof: { label: 'Roofs (0.90)', c: 0.9 },
  asphalt: { label: 'Asphalt / concrete pavement (0.85)', c: 0.85 },
  gravel: { label: 'Gravel roads, compacted (0.50)', c: 0.5 },
  lawn_flat: { label: 'Lawns, sandy soil, flat (0.10)', c: 0.1 },
  lawn_steep: { label: 'Lawns, heavy soil, steep (0.30)', c: 0.3 },
  industrial: { label: 'Industrial / port area, mostly paved (0.75)', c: 0.75 },
  residential: { label: 'Residential, detached (0.40)', c: 0.4 },
  woodland: { label: 'Woodland / forest (0.15)', c: 0.15 },
  water: { label: 'Open water / wetland (1.00)', c: 1.0 },
  custom: { label: 'Custom coefficient', c: null },
};

export const schema = {
  id: 'rational-runoff',
  name: 'Rational-method runoff',
  category: 'civil',
  summary: 'Design peak runoff from catchment area, runoff coefficient and rainfall intensity, with time of concentration (Kirpich).',
  related: ['manning-channel-flow', 'earthwork-volume', 'concrete-volume', 'tidal-height'],
  sendTo: [
    {
      target: 'manning-channel-flow',
      label: 'Channel or pipe depth for the peak flow (Manning)',
      note: 'Finds the normal depth that carries the design peak flow; set the channel shape, slope and lining there.',
      links: [
        { to: 'mode', value: 'depth' },
        { to: 'discharge_m3_s', from: 'peak_flow_m3_s' },
      ],
    },
  ],
  assumptions: [
    'Rational method Q = C i A: the peak discharge of a small catchment (under about 80 ha / 200 acres) when rainfall of uniform intensity i, lasting at least the time of concentration, falls on the whole area; C is the fraction of rainfall that runs off, composite over sub-areas by area weighting; the SI form Q [m³/s] = C i [mm/h] A [ha]/360.',
    'Time of concentration by Kirpich (1940): t_c [min] = 0.0195 L^0.77 S^−0.385 with the flow-path length L in metres and the average slope S in m/m (the US form 0.0078 L_ft^0.77 S^−0.385 is the same equation); it was derived for small agricultural catchments with defined channels and underestimates t_c on flat paved areas (a minimum of 5–10 minutes is usual); other methods (FAA, NRCS velocity, Bransby-Williams) give different values.',
    'Rainfall intensity: entered directly from the local IDF curve at duration = t_c, or from a fitted IDF relation i = a/(t_c + b)^n whose coefficients the user supplies for the chosen return period; the frequency factor C_f (1.0 up to 10 years, 1.1 for 25, 1.2 for 50, 1.25 for 100 years, C C_f ≤ 1) follows common US drainage manuals.',
    'Runoff coefficients are typical values for 2–10 year storms (roofs 0.90, pavement 0.85, gravel 0.50, lawns 0.10–0.30, industrial 0.75, woodland 0.15); they rise with slope, soil saturation and storm rarity, and local manuals govern.',
    'The method gives a peak, not a hydrograph: storage, routing, infiltration during the storm, snowmelt and tidal backwater at outfalls are outside it; the runoff volume reported assumes the design intensity over the duration t_c (a triangular hydrograph of base 2 t_c would hold the same volume).',
  ],
  notes: [
    'Verification 2026-10-31: the published Houston case (C 0.57, i 4.2 in/h, A 15 acres → 35.9 cfs in US units) converts to 106.7 mm/h and 6.07 ha → 1.025 m³/s = 36.2 cfs, the 1.008 unit-factor difference the US form ignores; Kirpich 500 m at 2 % gives 10.5 min; the two Kirpich constants agree (0.0078 × 3.2808^0.77 = 0.0195).',
    'Design decision: composite C over three sub-areas because real sites mix roofs, pavement and grass; the IDF fit is optional so users with a tabulated curve enter the intensity directly.',
  ],
  sources: [
    'Z. P. Kirpich, "Time of concentration of small agricultural watersheds", Civil Engineering 10(6), 1940; Iowa DOT Design Manual 4A-5 and Guilford County stormwater manual (Kirpich forms)',
    'ASCE Manual of Practice 77 / WEF MOP FD-20, Design and Construction of Urban Stormwater Management Systems (rational method, runoff coefficients, frequency factors)',
    'CPHEEO Manual on Storm Water Drainage Systems (2019) — SI rational method Q = C i A/360',
    'FHWA HEC-22 Urban Drainage Design Manual, 4th ed. (2024) — rational method limits and composite C',
  ],
  inputs: [
    { id: 'area1_m2', label: 'Sub-area 1', group: 'area', unit: 'm2', default: 20000, min: 0, max: 5e6 },
    { id: 'surface1', label: 'Sub-area 1 surface', type: 'select', default: 'asphalt', options: Object.entries(SURFACES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'c1_custom', label: 'Sub-area 1 custom C', group: 'dimensionless', unit: 'none', default: 0.6, min: 0.05, max: 1, visibleWhen: { surface1: 'custom' } },
    { id: 'area2_m2', label: 'Sub-area 2', group: 'area', unit: 'm2', default: 10000, min: 0, max: 5e6 },
    { id: 'surface2', label: 'Sub-area 2 surface', type: 'select', default: 'roof', options: Object.entries(SURFACES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'c2_custom', label: 'Sub-area 2 custom C', group: 'dimensionless', unit: 'none', default: 0.6, min: 0.05, max: 1, visibleWhen: { surface2: 'custom' } },
    { id: 'area3_m2', label: 'Sub-area 3 (0 = none)', group: 'area', unit: 'm2', default: 30000, min: 0, max: 5e6 },
    { id: 'surface3', label: 'Sub-area 3 surface', type: 'select', default: 'lawn_flat', options: Object.entries(SURFACES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'c3_custom', label: 'Sub-area 3 custom C', group: 'dimensionless', unit: 'none', default: 0.6, min: 0.05, max: 1, visibleWhen: { surface3: 'custom' } },
    { id: 'flow_length_m', label: 'Longest flow path L', group: 'length', unit: 'm', default: 500, min: 10, max: 20000 },
    { id: 'slope', label: 'Average slope of the flow path S (m/m)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.02, min: 0.0005, max: 0.5 },
    { id: 'tc_min_floor', label: 'Minimum time of concentration', group: 'time', unit: 'min', default: 5, min: 0, max: 60 },
    { id: 'intensity_mode', label: 'Rainfall intensity', type: 'select', default: 'direct', options: [{ value: 'direct', label: 'Enter the intensity for duration = t_c from the IDF curve' }, { value: 'idf', label: 'IDF relation i = a/(t_c + b)^n' }] },
    { id: 'intensity_mm_h', label: 'Rainfall intensity i (mm/h)', group: 'dimensionless', unit: 'none', default: 100, min: 1, max: 500, visibleWhen: { intensity_mode: 'direct' } },
    { id: 'idf_a', label: 'IDF coefficient a (mm/h · min^n)', group: 'dimensionless', unit: 'none', default: 2000, min: 1, max: 1e5, visibleWhen: { intensity_mode: 'idf' } },
    { id: 'idf_b', label: 'IDF coefficient b (min)', group: 'dimensionless', unit: 'none', default: 10, min: 0, max: 60, visibleWhen: { intensity_mode: 'idf' } },
    { id: 'idf_n', label: 'IDF exponent n', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.3, max: 1.2, visibleWhen: { intensity_mode: 'idf' } },
    { id: 'return_period', label: 'Return period (frequency factor C_f)', type: 'select', default: '10', options: [{ value: '2', label: '2–10 years (C_f 1.0)' }, { value: '10', label: '10 years (C_f 1.0)' }, { value: '25', label: '25 years (C_f 1.1)' }, { value: '50', label: '50 years (C_f 1.2)' }, { value: '100', label: '100 years (C_f 1.25)' }] },
  ],
  outputs: [
    { id: 'total_area_m2', label: 'Total catchment area', group: 'area', unit: 'm2' },
    { id: 'total_area_ha', label: 'Total catchment area (ha)', group: 'dimensionless', unit: 'none' },
    { id: 'composite_c', label: 'Composite runoff coefficient C', group: 'dimensionless', unit: 'none' },
    { id: 'frequency_factor', label: 'Frequency factor C_f', group: 'dimensionless', unit: 'none' },
    { id: 'c_design', label: 'Design coefficient C × C_f (≤ 1)', group: 'dimensionless', unit: 'none' },
    { id: 'tc_kirpich_min', label: 'Kirpich time of concentration', group: 'time', unit: 'min' },
    { id: 'tc_design_min', label: 'Design duration (t_c with the minimum applied)', group: 'time', unit: 'min' },
    { id: 'intensity_out_mm_h', label: 'Design rainfall intensity (mm/h)', group: 'dimensionless', unit: 'none' },
    { id: 'peak_flow_m3_s', label: 'Peak runoff Q = C i A/360', group: 'volume_flow', unit: 'm3_s' },
    { id: 'peak_flow_per_ha', label: 'Peak runoff per hectare (L/s/ha)', group: 'dimensionless', unit: 'none' },
    { id: 'runoff_depth_mm', label: 'Runoff depth over the storm C i t_c (mm)', group: 'dimensionless', unit: 'none' },
    { id: 'runoff_volume_m3', label: 'Runoff volume over the duration t_c', group: 'volume', unit: 'm3' },
    { id: 'impervious_pct', label: 'Share of area with C ≥ 0.75 (impervious)', group: 'ratio', unit: 'pct' },
    { id: 'applicability', label: 'Method applicability', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      composite_c: '0.483',
      c_design: '0.483',
      tc_kirpich_min: '10.5 min',
      tc_design_min: '10.5 min',
      peak_flow_m3_s: '0.81 m³/s',
      peak_flow_per_ha: '134',
      impervious_pct: '50 %',
    },
  },
};

/** Kirpich time of concentration, minutes (L m, S m/m). */
export function kirpichMinutes(lengthM, slope) {
  return 0.0195 * lengthM ** 0.77 * slope ** -0.385;
}

/** Rational-method peak flow, m³/s (i mm/h, A ha). */
export function rationalFlow(C, intensityMmH, areaHa) {
  return (C * intensityMmH * areaHa) / 360;
}

const FREQUENCY_FACTOR = { 2: 1.0, 10: 1.0, 25: 1.1, 50: 1.2, 100: 1.25 };

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  const areas = [i.area1_m2, i.area2_m2, i.area3_m2];
  const surfaces = [i.surface1, i.surface2, i.surface3];
  const customs = [i.c1_custom, i.c2_custom, i.c3_custom];
  areas.forEach((a, k) => assertNonNegative(a, `area${k + 1}_m2`, `Sub-area ${k + 1}`));
  surfaces.forEach((s, k) => assertOneOf(s, Object.keys(SURFACES), `surface${k + 1}`, `Surface ${k + 1}`));
  assertPositive(i.flow_length_m, 'flow_length_m', 'Flow length');
  assertPositive(i.slope, 'slope', 'Slope');
  assertNonNegative(i.tc_min_floor, 'tc_min_floor', 'Minimum t_c');
  assertOneOf(i.intensity_mode, ['direct', 'idf'], 'intensity_mode', 'Intensity mode');
  assertOneOf(String(i.return_period), Object.keys(FREQUENCY_FACTOR), 'return_period', 'Return period');
  const totalArea = areas.reduce((s, a) => s + a, 0);
  if (totalArea <= 0) throw new Error('Enter at least one sub-area');

  let weighted = 0;
  let impervious = 0;
  areas.forEach((a, k) => {
    if (a <= 0) return;
    const c = surfaces[k] === 'custom' ? assertRange(customs[k], 0.01, 1, `c${k + 1}_custom`, `Custom C ${k + 1}`) : SURFACES[surfaces[k]].c;
    weighted += a * c;
    if (c >= 0.75) impervious += a;
  });
  const C = weighted / totalArea;
  const cf = FREQUENCY_FACTOR[i.return_period];
  const cDesign = Math.min(1, C * cf);
  const tcKirpich = kirpichMinutes(i.flow_length_m, i.slope);
  const tc = Math.max(tcKirpich, i.tc_min_floor);
  let intensity;
  if (i.intensity_mode === 'direct') intensity = assertPositive(i.intensity_mm_h, 'intensity_mm_h', 'Intensity');
  else {
    assertPositive(i.idf_a, 'idf_a', 'IDF a');
    assertNonNegative(i.idf_b, 'idf_b', 'IDF b');
    assertPositive(i.idf_n, 'idf_n', 'IDF n');
    intensity = i.idf_a / (tc + i.idf_b) ** i.idf_n;
  }
  const areaHa = totalArea / 1e4;
  const Q = rationalFlow(cDesign, intensity, areaHa);
  const depth = cDesign * intensity * (tc / 60);
  const volume = (depth / 1000) * totalArea;

  let applicability;
  if (areaHa > 80) applicability = `CAUTION — ${areaHa.toFixed(0)} ha exceeds the usual 80 ha limit of the rational method; use a hydrograph method (SCS/NRCS, kinematic wave)`;
  else if (areaHa > 20) applicability = `Acceptable with care — ${areaHa.toFixed(1)} ha (20–80 ha): check t_c and consider a hydrograph method for storage design`;
  else applicability = `Within the method's range — ${areaHa.toFixed(2)} ha, t_c ${tc.toFixed(1)} min`;

  const warnings = [];
  if (tcKirpich < i.tc_min_floor) warnings.push(`Kirpich t_c ${tcKirpich.toFixed(1)} min below the ${i.tc_min_floor} min minimum: the minimum is used (Kirpich underestimates on short paved paths).`);
  if (C * cf > 1) warnings.push('C × C_f capped at 1.0: runoff cannot exceed rainfall.');
  if (i.intensity_mode === 'direct') warnings.push(`Intensity ${intensity} mm/h must be read from the local IDF curve at a duration equal to t_c = ${tc.toFixed(1)} min and the chosen return period.`);
  if (i.slope < 0.005) warnings.push('Very flat flow path: Kirpich gives long t_c and low intensity; ponding and backwater may govern instead.');
  warnings.push('Peak flow only (no hydrograph): detention storage, routing, infiltration and outfall tide levels need a separate analysis.');
  warnings.push('Runoff coefficients are typical 2–10 year values; local drainage manuals and soil conditions govern.');

  return {
    outputs: {
      total_area_m2: totalArea,
      total_area_ha: areaHa,
      composite_c: C,
      frequency_factor: cf,
      c_design: cDesign,
      tc_kirpich_min: tcKirpich,
      tc_design_min: tc,
      intensity_out_mm_h: intensity,
      peak_flow_m3_s: Q,
      peak_flow_per_ha: (Q * 1000) / areaHa,
      runoff_depth_mm: depth,
      runoff_volume_m3: volume,
      impervious_pct: (impervious / totalArea) * 100,
      applicability,
    },
    warnings,
  };
}
