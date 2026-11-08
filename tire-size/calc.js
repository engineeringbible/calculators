/**
 * tire-size/calc.js — tire dimensions from a size code (metric 225/45R17, P225/45R17, LT265/75R16, or flotation
 * 33x12.50R15) and the comparison of two sizes: diameter difference, speedometer error and true speed.
 *
 * Metric: section height H = W × aspect / 100; overall diameter D = rim + 2 H (ISO 4000-1, ETRTO).
 * Flotation: D and W are given in inches; H = (D − rim) / 2. Circumference π D; revolutions per mile 63 360 / (π D[in]).
 * Speedometer set for tire A with tire B fitted: true speed = reading × D_B / D_A.
 * Schema units: SI — m, m/s.
 */
import { withDefaults, assertRange } from '../shared/validate.js';

const IN = 0.0254;
const MM = 0.001;
const MILE = 1609.344;
const MPH = 0.44704;

const METRIC = /^(P|LT|ST|T)?\s*(\d{3})\s*[/ ]\s*(\d{2,3})\s*(ZR|RF|R|D|B|-)?\s*(\d{2}(?:\.\d)?)(?![\d.])/;
const FLOTATION = /^(\d{2}(?:\.\d{1,2})?)\s*[X×*]\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:LT)?\s*(R|D|B|-)?\s*(\d{2}(?:\.\d)?)(?![\d.])/;

/**
 * Reads a tire size code; returns { kind, width_m, sidewall_m, rim_m, diameter_m, text } or throws a plain message.
 * Accepts upper or lower case, spaces, a P/LT/ST/T prefix, ZR/R/D/B/- construction and trailing load and speed indexes.
 */
export function parseTire(text, name) {
  const s = String(text ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  const hint = 'write it like 225/45R17, P225/45ZR17 94W, LT265/75R16 or 33x12.50R15';
  if (!s) throw new Error(`${name}: enter a size code; ${hint}.`);
  let m = s.match(METRIC);
  if (m) {
    const width = Number(m[2]);
    const aspect = Number(m[3]);
    const rim = Number(m[5]);
    if (width < 100 || width > 500) throw new Error(`${name}: the section width ${width} mm is outside 100 to 500 mm; ${hint}.`);
    if (aspect < 20 || aspect > 100) throw new Error(`${name}: the aspect ratio ${aspect} is outside 20 to 100; ${hint}.`);
    if (rim < 8 || rim > 30) throw new Error(`${name}: the rim diameter ${rim} in is outside 8 to 30 in; ${hint}.`);
    const sidewall = width * MM * (aspect / 100);
    return {
      kind: 'metric', width_m: width * MM, sidewall_m: sidewall, rim_m: rim * IN, diameter_m: rim * IN + 2 * sidewall,
      text: `${m[1] ? `${m[1]} ` : ''}${width} mm wide, ${aspect} % aspect ratio, ${rim} in rim`,
    };
  }
  m = s.match(FLOTATION);
  if (m) {
    const dia = Number(m[1]);
    const width = Number(m[2]);
    const rim = Number(m[4]);
    if (dia < 20 || dia > 60) throw new Error(`${name}: the overall diameter ${dia} in is outside 20 to 60 in; ${hint}.`);
    if (width < 5 || width > 25) throw new Error(`${name}: the section width ${width} in is outside 5 to 25 in; ${hint}.`);
    if (rim < 12 || rim > 30) throw new Error(`${name}: the rim diameter ${rim} in is outside 12 to 30 in; ${hint}.`);
    if (dia - rim < 4) throw new Error(`${name}: the overall diameter ${dia} in leaves less than 2 in of sidewall on a ${rim} in rim; check the code.`);
    return {
      kind: 'flotation', width_m: width * IN, sidewall_m: ((dia - rim) / 2) * IN, rim_m: rim * IN, diameter_m: dia * IN,
      text: `${dia} in tall, ${width} in wide, ${rim} in rim (flotation size)`,
    };
  }
  if (/^\d{3}\s*(R|-)\s*\d{2}/.test(s)) throw new Error(`${name}: "${String(text).trim()}" has no aspect ratio; enter the full metric size with the ratio, such as 195/80R14.`);
  throw new Error(`${name}: "${String(text).trim()}" is not a tire size code; ${hint}.`);
}

export const schema = {
  id: 'tire-size',
  name: 'Tire size calculator and comparison',
  category: 'automotive',
  summary: 'Tire diameter, sidewall, circumference and revs per mile from size codes like 225/45R17, comparing two sizes for speedometer error and true speed.',
  related: ['gear-speed', 'quarter-mile', 'stopping-distance', 'horsepower'],
  assumptions: [
    'Dimensions are the nominal design values from the size code: sidewall = section width × aspect ratio, overall diameter = rim diameter + 2 × sidewall (ISO 4000-1, ETRTO); a real tire differs by up to a few percent by brand, tread depth and inflation.',
    'Revolutions per mile and per km are geometric (π × unloaded diameter); tire makers measure them rolling under load, so their published figures are a little higher.',
    'Flotation sizes such as 33x12.50R15 give the overall diameter and section width in inches directly; the sidewall is half the difference between the diameter and the rim.',
    'The speedometer is assumed correct with tire A; with tire B fitted the true speed is the reading × D_B / D_A and the odometer is off by the same percentage.',
    'The section width is the nominal width on the measuring rim; a wider or narrower rim changes the actual width slightly.',
  ],
  notes: [
    'Verification 2026-11-08: 225/45R17 is 101.25 mm of sidewall and 634.3 mm (24.97 in) overall; 245/40R18 is 98.0 mm and 653.2 mm (25.72 in): 2.98 % taller, so a speedometer reading 60 mph means 61.8 mph true. Checked by hand.',
  ],
  sources: [
    'ISO 4000-1:2021 Passenger car tyres and rims — Part 1: Tyres (metric series): size designation and design overall diameter D = d + 2 H, H = S × nominal aspect ratio / 100',
    'ETRTO Standards Manual (European Tyre and Rim Technical Organisation), passenger car tyres, and The Tire and Rim Association Year Book (P-metric, LT-metric and flotation designations)',
  ],
  inputs: [
    { id: 'tire_a', label: 'Tire A size (original)', type: 'textarea', rows: 1, default: '225/45R17', help: 'Metric 225/45R17, P225/45ZR17 94W, LT265/75R16, or flotation 33x12.50R15.' },
    { id: 'tire_b', label: 'Tire B size (new, to compare)', type: 'textarea', rows: 1, default: '245/40R18' },
    { id: 'reading_m_s', label: 'Speedometer reading (set for tire A)', group: 'speed', unit: 'm_s', display: 'mph', default: 60 * MPH, min: 0.1, max: 200 },
  ],
  outputs: [
    { id: 'read_a', label: 'Tire A read as', type: 'text' },
    { id: 'width_a_m', label: 'A: section width', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'sidewall_a_m', label: 'A: sidewall height', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'dia_a_m', label: 'A: overall diameter', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'circ_a_m', label: 'A: circumference', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'revs_mile_a', label: 'A: revolutions per mile', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'revs_km_a', label: 'A: revolutions per km', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'read_b', label: 'Tire B read as', type: 'text' },
    { id: 'width_b_m', label: 'B: section width', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'sidewall_b_m', label: 'B: sidewall height', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'dia_b_m', label: 'B: overall diameter', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'circ_b_m', label: 'B: circumference', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'revs_mile_b', label: 'B: revolutions per mile', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'revs_km_b', label: 'B: revolutions per km', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'dia_diff', label: 'Diameter difference, B against A', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'true_speed_m_s', label: 'True speed with tire B at the speedometer reading', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'speedo_error', label: 'Speedometer error with tire B (reading − true) / true', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
  ],
  example: {
    inputs: { tire_a: '225/45R17', tire_b: '245/40R18', reading_m_s: [60, 'mph'] },
    results: { sidewall_a_m: '3.99 in', dia_a_m: '24.97 in', dia_b_m: '25.72 in', revs_mile_a: '807.6', revs_mile_b: '784.2', dia_diff: '2.98 %', true_speed_m_s: '61.8 mph' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const a = parseTire(x.tire_a, 'Tire A size');
  const b = parseTire(x.tire_b, 'Tire B size');
  const reading = assertRange(x.reading_m_s, 0.1, 200, 'reading_m_s', 'Speedometer reading');
  const ratio = b.diameter_m / a.diameter_m;
  const warnings = [];
  if (Math.abs(ratio - 1) > 0.03) warnings.push('The diameters differ by more than 3 %: the speedometer, odometer, gearing and ABS and stability control may need recalibration, and the tire may not clear the body.');
  const dims = (t) => ({ w: t.width_m, s: t.sidewall_m, d: t.diameter_m, c: Math.PI * t.diameter_m, rm: MILE / (Math.PI * t.diameter_m), rk: 1000 / (Math.PI * t.diameter_m) });
  const A = dims(a);
  const B = dims(b);
  return {
    outputs: {
      read_a: a.text, width_a_m: A.w, sidewall_a_m: A.s, dia_a_m: A.d, circ_a_m: A.c, revs_mile_a: A.rm, revs_km_a: A.rk,
      read_b: b.text, width_b_m: B.w, sidewall_b_m: B.s, dia_b_m: B.d, circ_b_m: B.c, revs_mile_b: B.rm, revs_km_b: B.rk,
      dia_diff: ratio - 1, true_speed_m_s: reading * ratio, speedo_error: 1 / ratio - 1,
    },
    warnings,
  };
}
