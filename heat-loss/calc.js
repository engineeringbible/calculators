/**
 * heat-loss/calc.js — design heat loss of a room or building: fabric loss Σ U A ΔT through walls, windows, roof and
 * floor, plus ventilation and infiltration loss, in W, kW and Btu/h, with the heat loss coefficient and an optional
 * yearly heating energy from degree-days.
 *
 * Φ_T = Σ U_i A_i (θ_int − θ_ext);  Φ_V = ρ c_p n V (θ_int − θ_ext) / 3600 (EN 12831-1 simplified; ASHRAE Ch. 18).
 * E_year = H × HDD × 24 / 1000 kWh.  Schema units: SI — m³, °C, K, W.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const FT2_M2 = 0.09290304;
/** 1 Btu/(h·ft²·°F) in W/(m²·K). */
const U_IP_SI = 5.678263;
/** ρ c_p of standard air, J/(m³·K): 1.204 kg/m³ × 1 006 J/(kg·K). */
const RHO_CP = 1.204 * 1006;

const DEFAULT_SI = ['Walls; 100; 0.30', 'Windows; 20; 1.4', 'Roof; 60; 0.18', 'Floor; 60; 0.25', 'Door; 2; 1.8'].join('\n');

/** Parses "name; area; U" or "name; area; R…" lines in the chosen unit system; returns U in W/(m²K) and A in m². */
export function parseElements(text, units) {
  const out = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length !== 3) throw new Error(`Building elements, line ${k + 1}: write "name; area; U-value" or "name; area; R-value" such as R13.`);
    const area = Number(parts[1].replace(/\s/g, ''));
    if (!Number.isFinite(area) || area <= 0) throw new Error(`Building elements, line ${k + 1}: the area "${parts[1]}" must be a number above zero.`);
    const isR = /^r/i.test(parts[2]);
    const value = Number(parts[2].replace(/^r[- ]?/i, '').replace(/\s/g, ''));
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Building elements, line ${k + 1}: the ${isR ? 'R' : 'U'}-value "${parts[2]}" must be a number above zero.`);
    let u = isR ? 1 / value : value;
    let a = area;
    if (units === 'ip') { u *= U_IP_SI; a *= FT2_M2; }
    out.push({ name: parts[0] || `Element ${k + 1}`, area: a, u });
  });
  if (!out.length) throw new Error('Building elements: enter at least one wall, window, roof or floor.');
  return out;
}

export const schema = {
  id: 'heat-loss',
  name: 'Building heat loss calculator (U-values)',
  category: 'hvac',
  summary: 'Heat loss of a room or house through walls, windows, roof and floor from U- or R-values, plus ventilation, in W, kW and Btu/h, with yearly heating energy.',
  related: ['btu-ac-size', 'air-changes', 'pipe-insulation', 'electricity-cost'],
  assumptions: [
    'Fabric loss is U × A × ΔT for each element at the design indoor and outdoor temperatures (EN 12831-1, ASHRAE Fundamentals Ch. 18); thermal bridges can add 10 to 20 % to older buildings and are not included unless entered as an element.',
    'Floors on the ground and walls to unheated spaces lose heat to a temperature above the outdoor one; using the outdoor temperature for them errs on the safe side. Enter a reduced U-value or area to account for this.',
    'Ventilation and infiltration loss uses standard air (1.204 kg/m³, 1 006 J/(kg·K)), i.e. 0.336 W per m³/h per K or 1.08 Btu/h per cfm per °F. Heat recovery reduces it by its efficiency.',
    'R-values are entered with an R prefix (R13, R-4.5) in the same unit system as the areas; U = 1/R. Imperial U-values are Btu/(h·ft²·°F).',
    'The yearly energy from heating degree-days assumes the same heat loss coefficient all season and ignores solar and internal gains, so it overestimates the bill for well-glazed or busy buildings.',
  ],
  notes: [
    'Verification 2026-11-07: the default house (walls 100 m² at 0.30, windows 20 m² at 1.4, roof 60 m² at 0.18, floor 60 m² at 0.25, door 2 m² at 1.8, 150 m³ at 0.5 ACH, 21 °C inside and −3 °C outside) loses 2 098 W through the fabric and 606 W by ventilation, 2 703 W in total. Checked by hand.',
  ],
  sources: [
    'EN 12831-1:2017 Energy performance of buildings — Method for calculation of the design heat load (transmission and ventilation heat loss)',
    'ASHRAE Handbook — Fundamentals, Chapter 18 Nonresidential Cooling and Heating Load Calculations, and Chapter 26 (U-factor = 1/ΣR)',
    'CIBSE Guide A: Environmental design (degree-day method for yearly heating energy)',
  ],
  inputs: [
    { id: 'units', label: 'Units of the element list', type: 'select', default: 'si', options: [{ value: 'si', label: 'Metric: m² and W/(m²·K)' }, { value: 'ip', label: 'US: ft² and Btu/(h·ft²·°F)' }] },
    { id: 'elements', label: 'Building elements (one per line: name; area; U-value or R-value)', type: 'textarea', rows: 7, default: DEFAULT_SI, help: 'Write R-values with an R: "Wall; 400; R13". Windows usually have a U-value.' },
    { id: 'inside_c', label: 'Indoor design temperature', group: 'temperature', unit: 'C', default: 21, min: -10, max: 40 },
    { id: 'outside_c', label: 'Outdoor design temperature', group: 'temperature', unit: 'C', default: -3, min: -60, max: 30 },
    { id: 'volume_m3', label: 'Heated volume', group: 'volume', unit: 'm3', default: 150, min: 0, max: 1e7 },
    { id: 'ach', label: 'Air changes per hour (ventilation and infiltration)', group: 'dimensionless', unit: 'none', default: 0.5, min: 0, max: 50 },
    { id: 'recovery', label: 'Heat recovery efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 0.95 },
    { id: 'hdd', label: 'Heating degree-days per year (optional, K·day)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 15000 },
  ],
  outputs: [
    { id: 'fabric_w', label: 'Heat loss through the fabric', group: 'power', unit: 'W' },
    { id: 'vent_w', label: 'Heat loss by ventilation and infiltration', group: 'power', unit: 'W' },
    { id: 'total_w', label: 'Total design heat loss', group: 'power', unit: 'W' },
    { id: 'total_btu_w', label: 'Total in Btu/h', group: 'power', unit: 'W', display: 'btu_h' },
    { id: 'h_w_k', label: 'Heat loss coefficient H (W per K)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'largest', label: 'Largest heat loss', type: 'text' },
    { id: 'annual_kwh', label: 'Heat needed per year (degree-day estimate)', group: 'energy', unit: 'kWh' },
  ],
  example: {
    inputs: {},
    results: { fabric_w: '2 098 W', vent_w: '606 W', total_w: '2 703 W' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.units, ['si', 'ip'], 'units', 'Units of the element list');
  const ti = assertRange(x.inside_c, -10, 40, 'inside_c', 'Indoor design temperature');
  const te = assertRange(x.outside_c, -60, 30, 'outside_c', 'Outdoor design temperature');
  if (te >= ti) throw new Error('Outdoor design temperature: it must be below the indoor temperature for a heat loss.');
  const v = assertNonNegative(x.volume_m3, 'volume_m3', 'Heated volume');
  const n = assertNonNegative(x.ach, 'ach', 'Air changes per hour');
  const eta = assertRange(x.recovery, 0, 0.95, 'recovery', 'Heat recovery efficiency');
  const hdd = assertNonNegative(x.hdd, 'hdd', 'Heating degree-days');
  const els = parseElements(x.elements, x.units);
  const dT = ti - te;
  const ua = els.map((e) => e.u * e.area);
  const hT = ua.reduce((s, u) => s + u, 0);
  const hV = (RHO_CP * n * v * (1 - eta)) / 3600;
  const h = hT + hV;
  const parts = els.map((e, i) => [e.name, ua[i] * dT]).concat([['Ventilation', hV * dT]]);
  const top = parts.reduce((a, b) => (b[1] > a[1] ? b : a));
  const warnings = [];
  const hiU = els.filter((e) => e.u > 3 && !/window|glaz|door/i.test(e.name));
  if (hiU.length) warnings.push(`U-values above 3 W/(m²·K) on ${hiU.map((e) => e.name).join(', ')}: that is uninsulated single-skin construction; check the value and its units.`);
  return {
    outputs: {
      fabric_w: hT * dT,
      vent_w: hV * dT,
      total_w: h * dT,
      total_btu_w: h * dT,
      h_w_k: h,
      largest: `${top[0]}: ${Math.round(top[1])} W (${Math.round((100 * top[1]) / (h * dT))} % of the total)`,
      annual_kwh: hdd > 0 ? (h * hdd * 24) / 1000 : null,
    },
    warnings,
  };
}
