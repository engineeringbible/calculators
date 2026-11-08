/**
 * speeds-feeds/calc.js — spindle speed, feed rate and material removal rate for milling, turning and drilling, with a
 * table of starting cutting speeds for common work materials with HSS and carbide tools.
 *
 * n = v_c / (π D);  milling f_rev = f_z z, v_f = f_z z n;  turning and drilling v_f = f n.
 * MRR: milling a_p a_e v_f; turning v_c f a_p (Machinery's Handbook Q = 12 V f d); drilling (π D²/4) f n.
 * Schema units: SI — m, m/s, rpm; feed rates and removal rates are returned as in/min, mm/min, in³/min and cm³/min.
 */
import { withDefaults, assertOneOf, assertRange, assertInteger, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;
const FPM = 0.00508;
const IN3 = 1.6387064e-5;

/**
 * Starting cutting speeds. HSS: traditional HSS turning speeds of Machinery's Handbook, 31st ed., Tables 1, 3, 4a, 6
 * and 8 (feed 0.012 in/rev, depth 0.125 in). Carbide: Harvey Tool's published SFM ranges for solid carbide end mills.
 * [id, label, HSS fpm, carbide low sfm, carbide high sfm]
 */
export const SPEEDS = [
  ['al', 'Wrought aluminium 6061-T6, 7075-T6', 500, 800, 1500],
  ['brass', 'Free-cutting brass C36000, cold drawn', 350, 800, 1500],
  ['fm_steel', 'Free-machining steel 1117, 1118 (100–150 HB)', 130, 100, 300],
  ['low_c', 'Low-carbon steel 1018, 1020 (125–175 HB)', 110, 100, 300],
  ['med_c', 'Medium-carbon steel 1045 (175–225 HB)', 85, 100, 300],
  ['ss304', 'Stainless steel 304, annealed (135–185 HB)', 75, 100, 250],
  ['ss316', 'Stainless steel 316, annealed (135–185 HB)', 70, 100, 250],
  ['gray_ci', 'Grey cast iron ASTM Class 30–40 (190–220 HB)', 80, 100, 400],
];

/** Starting cutting speed in m/s: the HSS value, or the middle of the carbide range. */
export function tableSpeed(material, tool) {
  const row = SPEEDS.find((r) => r[0] === material);
  if (!row) throw new Error(`Work material: unknown material "${material}"`);
  return (tool === 'hss' ? row[2] : (row[3] + row[4]) / 2) * FPM;
}

export const schema = {
  id: 'speeds-feeds',
  name: 'Speeds and feeds calculator (milling, turning, drilling)',
  category: 'manufacturing',
  summary: 'Spindle rpm, feed rate and metal removal rate for milling, turning and drilling, with starting cutting speeds for common materials in HSS and carbide.',
  related: ['chip-load', 'machining-time', 'surface-finish', 'drill-point-length'],
  assumptions: [
    'Spindle speed is n = v_c / (π D), with D the cutter diameter for milling and drilling and the work diameter for turning.',
    'The table speeds are starting values for sharp tools, rigid set-ups and coolant: HSS speeds are the traditional turning speeds of Machinery\'s Handbook (31st ed.), carbide speeds are the middle of Harvey Tool\'s ranges for solid carbide end mills. Indexable carbide inserts are rated by their maker.',
    'Milling feed is chip load × teeth × rpm at full chip thickness; at a radial engagement below half the diameter the chip thins, which the chip load calculator corrects.',
    'Turning removal rate is v_c × f × a_p at the starting diameter; drilling removal rate is the drill area × feed rate.',
    'A machine speed limit caps the spindle speed and lowers the actual cutting speed; the feed per tooth or per revolution is kept.',
  ],
  notes: [
    'Verification 2026-11-08: a 1/2 in four-flute carbide end mill in 1018 steel at 200 sfm runs 1 528 rpm; at 0.003 in per tooth it feeds 18.33 in/min, and a 0.25 in by 0.25 in cut removes 1.146 in³/min. Checked by hand.',
    'Table provenance: HSS speeds read from Machinery\'s Handbook 31st ed. Table 1 (1117 at 100–150 HB 130 fpm; 1018 at 125–175 HB 110 fpm; 1045 at 175–225 HB 85 fpm), Table 3 (304 75 fpm, 316 70 fpm at 135–185 HB), Table 4a (Class 30–40 80 fpm), Table 6 (copper alloys group 1, cold drawn, 350 fpm) and Table 8 (wrought aluminium, solution treated and aged, 500 fpm); carbide ranges from harveytool.com General Machining Guidelines (aluminium 2024/6061/7075 800–1500, yellow and high-lead brass 800–1500, 10XX/11XX 100–300, austenitic 304/316 100–250, grey cast iron 100–400 sfm).',
  ],
  sources: [
    'Machinery\'s Handbook, 31st ed. (Industrial Press, 2020), Speeds and Feeds for Turning, Tables 1, 3, 4a, 6 and 8 (HSS speeds); N = 12 V / (π D) and Q = 12 V f d',
    'Harvey Tool, General Machining Guidelines: carbide end mill SFM and chip load tables, RPM = 3.82 × SFM / D, IPM = RPM × IPT × T',
  ],
  inputs: [
    { id: 'operation', label: 'Operation', type: 'select', default: 'milling', options: [{ value: 'milling', label: 'Milling (end mill or face mill)' }, { value: 'turning', label: 'Turning (lathe)' }, { value: 'drilling', label: 'Drilling' }] },
    { id: 'speed_source', label: 'Cutting speed', type: 'select', default: 'table', options: [{ value: 'table', label: 'Starting value from the table' }, { value: 'custom', label: 'Enter my own' }] },
    { id: 'material', label: 'Work material', type: 'select', default: 'low_c', options: SPEEDS.map(([value, label]) => ({ value, label })), visibleWhen: { speed_source: 'table' } },
    { id: 'tool', label: 'Tool material', type: 'select', default: 'carbide', options: [{ value: 'hss', label: 'High-speed steel (HSS)' }, { value: 'carbide', label: 'Solid carbide' }], visibleWhen: { speed_source: 'table' } },
    { id: 'vc_m_s', label: 'Cutting speed v_c', group: 'speed', unit: 'm_s', display: 'fpm', default: 200 * FPM, min: 0.01, max: 50, visibleWhen: { speed_source: 'custom' } },
    { id: 'diameter_m', label: 'Diameter D (cutter, drill or workpiece)', group: 'length', unit: 'm', display: 'in', default: 0.5 * IN, min: 0.0001, max: 2 },
    { id: 'teeth', label: 'Number of teeth (flutes) z', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 100, integer: true, visibleWhen: { operation: 'milling' } },
    { id: 'fz_m', label: 'Chip load per tooth f_z', group: 'length', unit: 'm', display: 'in', default: 0.003 * IN, min: 1e-7, max: 0.005, visibleWhen: { operation: 'milling' } },
    { id: 'f_rev_m', label: 'Feed per revolution f', group: 'length', unit: 'm', display: 'in', default: 0.006 * IN, min: 1e-6, max: 0.01, visibleWhen: { operation: ['turning', 'drilling'] } },
    { id: 'ap_m', label: 'Depth of cut a_p (axial for milling, radial for turning)', group: 'length', unit: 'm', display: 'in', default: 0.25 * IN, min: 0, max: 1, visibleWhen: { operation: ['milling', 'turning'] } },
    { id: 'ae_m', label: 'Width of cut a_e (radial engagement)', group: 'length', unit: 'm', display: 'in', default: 0.25 * IN, min: 0, max: 2, visibleWhen: { operation: 'milling' } },
    { id: 'max_rpm', label: 'Machine spindle limit (0 = none)', group: 'rotational_speed', unit: 'rpm', default: 0, min: 0, max: 200000 },
  ],
  outputs: [
    { id: 'vc_used_m_s', label: 'Cutting speed used', group: 'speed', unit: 'm_s', display: 'fpm' },
    { id: 'rpm', label: 'Spindle speed', group: 'rotational_speed', unit: 'rpm', decimals: 0 },
    { id: 'f_rev_used_m', label: 'Feed per revolution', group: 'length', unit: 'm', display: 'in' },
    { id: 'feed_ipm', label: 'Feed rate, in/min (ipm)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'feed_mm_min', label: 'Feed rate, mm/min', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mrr_in3_min', label: 'Metal removal rate, in³/min', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'mrr_cm3_min', label: 'Metal removal rate, cm³/min', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'speed_note', label: 'Cutting speed source', type: 'text' },
    { id: 'speed_table', label: 'Starting cutting speeds', type: 'table' },
  ],
  example: {
    inputs: { operation: 'milling', speed_source: 'table', material: 'low_c', tool: 'carbide', diameter_m: [0.5, 'in'], teeth: 4, fz_m: [0.003, 'in'], ap_m: [0.25, 'in'], ae_m: [0.25, 'in'], max_rpm: [0, 'rpm'] },
    results: { rpm: '1 528 rpm', feed_ipm: '18.33', mrr_in3_min: '1.146' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.operation, ['milling', 'turning', 'drilling'], 'operation', 'Operation');
  assertOneOf(x.speed_source, ['table', 'custom'], 'speed_source', 'Cutting speed');
  assertOneOf(x.tool, ['hss', 'carbide'], 'tool', 'Tool material');
  const D = assertRange(x.diameter_m, 0.0001, 2, 'diameter_m', 'Diameter D');
  const vcSet = x.speed_source === 'table' ? tableSpeed(x.material, x.tool) : assertRange(x.vc_m_s, 0.01, 50, 'vc_m_s', 'Cutting speed v_c');
  const maxRpm = assertNonNegative(x.max_rpm, 'max_rpm', 'Machine spindle limit');
  const warnings = [];
  let rpm = (vcSet / (Math.PI * D)) * 60;
  if (maxRpm > 0 && rpm > maxRpm) {
    rpm = maxRpm;
    warnings.push('The spindle limit caps the speed: the tool runs below the chosen cutting speed, so feed rate and removal rate drop with it.');
  }
  const vc = (Math.PI * D * rpm) / 60;
  let fRev;
  let mrr;
  if (x.operation === 'milling') {
    const z = assertInteger(assertRange(x.teeth, 1, 100, 'teeth', 'Number of teeth'), 'teeth', 'Number of teeth');
    const fz = assertRange(x.fz_m, 1e-7, 0.005, 'fz_m', 'Chip load per tooth');
    const ap = assertNonNegative(x.ap_m, 'ap_m', 'Depth of cut a_p');
    const ae = assertNonNegative(x.ae_m, 'ae_m', 'Width of cut a_e');
    if (ae > D) throw new Error('Width of cut a_e: it cannot exceed the cutter diameter.');
    fRev = fz * z;
    mrr = (ap * ae * fRev * rpm) / 60;
    if (ae > 0 && ae < D / 2) warnings.push('Radial engagement below half the diameter thins the chip: raise the feed per tooth with the chip load calculator to keep the chip thickness.');
  } else {
    fRev = assertRange(x.f_rev_m, 1e-6, 0.01, 'f_rev_m', 'Feed per revolution');
    if (x.operation === 'turning') {
      const ap = assertNonNegative(x.ap_m, 'ap_m', 'Depth of cut a_p');
      if (ap > D / 2) throw new Error('Depth of cut a_p: on a lathe it cannot exceed the work radius D/2.');
      mrr = vc * fRev * ap;
    } else {
      mrr = (((Math.PI * D * D) / 4) * fRev * rpm) / 60;
    }
  }
  const vf = (fRev * rpm) / 60;
  const row = SPEEDS.find((r) => r[0] === x.material);
  let note = 'Your cutting speed';
  if (x.speed_source === 'table') {
    note = x.tool === 'hss'
      ? `${row[1]}, HSS: ${row[2]} fpm (${Math.round(row[2] * 0.3048)} m/min), Machinery's Handbook starting value`
      : `${row[1]}, carbide: ${(row[3] + row[4]) / 2} sfm, the middle of the ${row[3]}–${row[4]} sfm range (Harvey Tool)`;
  }
  return {
    outputs: {
      vc_used_m_s: vc,
      rpm,
      f_rev_used_m: fRev,
      feed_ipm: (vf / IN) * 60,
      feed_mm_min: vf * 60000,
      mrr_in3_min: (mrr / IN3) * 60,
      mrr_cm3_min: mrr * 60e6,
      speed_note: note,
      speed_table: {
        columns: ['Work material', 'HSS (fpm)', 'HSS (m/min)', 'Carbide (sfm)', 'Carbide (m/min)'],
        rows: SPEEDS.map(([, label, hss, lo, hi]) => [label, hss, Math.round(hss * 0.3048), `${lo}–${hi}`, `${Math.round(lo * 0.3048)}–${Math.round(hi * 0.3048)}`]),
      },
    },
    warnings,
  };
}
