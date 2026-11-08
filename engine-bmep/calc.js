/**
 * engine-bmep/calc.js — reciprocating engine fundamentals: swept volume, brake mean effective pressure, torque,
 * mean piston speed, specific power and the indicated / friction split from the mechanical efficiency, from power
 * (BMEP unknown) or from BMEP (power unknown).
 *
 * V_d = (π/4) D² S per cylinder;  P = p_me V_d,total N / (60 n_R)  with n_R = 2 (four-stroke) or 1 (two-stroke);  T = 60 P/(2π N);  c_m = 2 S N/60
 * Schema units: mm, rpm, kW, bar.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const CYCLES = {
  four_stroke: { label: 'Four-stroke (one power stroke per two revolutions)', nR: 2 },
  two_stroke: { label: 'Two-stroke (one power stroke per revolution)', nR: 1 },
};

export const schema = {
  id: 'engine-bmep',
  name: 'Engine BMEP, torque and power',
  category: 'mechanical',
  summary: 'Swept volume, brake mean effective pressure, torque, mean piston speed and specific power of a reciprocating engine from bore, stroke, cylinders and rpm.',
  related: ['sfoc-iso3046-correction', 'shaft-torque', 'generator-load', 'fuel-lcv-co2', 'propeller-slip'],
  sendTo: [
    {
      target: 'sfoc-iso3046-correction',
      label: 'SFOC at site conditions (ISO 3046-1)',
      note: 'Declared power and mechanical efficiency; enter the reference SFOC and the site conditions there.',
      links: [
        { to: 'declared_power_kw', from: 'power_w' },
        { to: 'eta_m', from: 'input:eta_m' },
      ],
    },
    {
      target: 'shaft-torque',
      label: 'Crankshaft or intermediate shaft torque',
      note: 'Brake power and engine speed; enter the shaft dimensions there.',
      links: [
        { to: 'power_w', from: 'power_w' },
        { to: 'speed_rpm', from: 'input:rpm' },
      ],
    },
  ],
  assumptions: [
    'Brake mean effective pressure is the work per cycle per unit swept volume: P = p_me V_d N/(60 n_R), with n_R = 2 revolutions per power stroke for a four-stroke engine and 1 for a two-stroke (Heywood eq. 2.5); it is a measure of how hard the engine is loaded independent of its size, not a pressure that exists in the cylinder.',
    'Swept volume per cylinder V_d = (π/4) D² S from bore and stroke; the compression volume and any valve or port timing effects are irrelevant to the mean-effective-pressure definition.',
    'Indicated mean effective pressure IMEP = BMEP/η_m and friction mean effective pressure FMEP = IMEP − BMEP follow from the mechanical efficiency entered (0.85–0.92 at rated load for marine diesels, falling at part load); auxiliary drives are counted as friction.',
    'Torque T = 60 P/(2π N) is the mean brake torque at the crankshaft; the propeller-law relation (P ∝ N³, so T ∝ N²) is used only for the optional part-load note and is not a property of the engine.',
    'Mean piston speed c_m = 2 S N/60 and typical ranges (low-speed two-stroke 8–9 m/s, medium-speed 9–11 m/s, high-speed up to 14 m/s; BMEP 18–21 bar for large two-strokes, 22–28 bar for medium-speed four-strokes) are indicative design limits, not regulations.',
  ],
  notes: [
    'Verification 2026-10-31: a 6-cylinder 320 × 400 mm four-stroke at 750 rpm delivering 3 000 kW → V_d 32.17 L per cylinder, 193.0 L total, BMEP 24.87 bar, torque 38.2 kN·m, c_m 10.0 m/s, 15.5 kW/L — typical of a modern medium-speed marine diesel; a two-stroke 500 × 2 214 mm cylinder at 127 rpm with 1 780 kW gives 19.3 bar, the catalogue order of magnitude (about 20 bar) for that engine class.',
    'Design decision: both directions (power → BMEP and BMEP → power) are offered because catalogue work goes one way and performance analysis the other; the mechanical-efficiency split is kept simple (no friction model).',
  ],
  sources: [
    'J. B. Heywood, Internal Combustion Engine Fundamentals, 2nd ed., McGraw-Hill 2018, ch. 2 (eqs. 2.5–2.12: power, torque, mean effective pressure, mean piston speed)',
    'D. Woodyard (ed.), Pounder\'s Marine Diesel Engines and Gas Turbines, 9th ed., Butterworth-Heinemann 2009 — typical BMEP and piston speed ranges',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018) — engine layout diagram, propeller law',
    'ISO 3046-1:2002 — declared power definitions',
  ],
  inputs: [
    { id: 'cylinders', label: 'Number of cylinders', group: 'dimensionless', unit: 'none', default: 6, min: 1, max: 24, integer: true },
    { id: 'bore_mm', label: 'Cylinder bore D', group: 'length', unit: 'mm', default: 320, min: 20, max: 1200 },
    { id: 'stroke_mm', label: 'Stroke S', group: 'length', unit: 'mm', default: 400, min: 20, max: 4000 },
    { id: 'cycle', label: 'Working cycle', type: 'select', default: 'four_stroke', options: Object.entries(CYCLES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'rpm', label: 'Engine speed N', group: 'rotational_speed', unit: 'rpm', default: 750, min: 10, max: 10000 },
    { id: 'mode', label: 'Known quantity', type: 'select', default: 'power', options: [{ value: 'power', label: 'Brake power known → BMEP' }, { value: 'bmep', label: 'BMEP known → brake power' }] },
    { id: 'power_kw', label: 'Brake power P', group: 'power', unit: 'kW', default: 3000, min: 0.1, max: 120000, visibleWhen: { mode: 'power' } },
    { id: 'bmep_bar', label: 'Brake mean effective pressure p_me', group: 'pressure', unit: 'bar', default: 20, min: 0.1, max: 40, visibleWhen: { mode: 'bmep' } },
    { id: 'eta_m', label: 'Mechanical efficiency η_m (IMEP split)', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.5, max: 0.99 },
  ],
  outputs: [
    { id: 'swept_cylinder_m3', label: 'Swept volume per cylinder V_d', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'swept_total_m3', label: 'Total swept volume', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'bmep_pa', label: 'Brake mean effective pressure', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'power_w', label: 'Brake power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'power_per_cylinder_w', label: 'Power per cylinder', group: 'power', unit: 'W', display: 'kW' },
    { id: 'torque_nm', label: 'Brake torque T = 60 P/(2π N)', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'piston_speed_m_s', label: 'Mean piston speed c_m = 2 S N/60', group: 'speed', unit: 'm_s' },
    { id: 'specific_power_kw_l', label: 'Specific power (kW per litre swept)', group: 'dimensionless', unit: 'none' },
    { id: 'imep_pa', label: 'Indicated mean effective pressure BMEP/η_m', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'fmep_pa', label: 'Friction mean effective pressure IMEP − BMEP', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'work_per_cycle_j', label: 'Brake work per cylinder per cycle', group: 'energy', unit: 'J', display: 'kJ' },
    { id: 'stroke_bore_ratio', label: 'Stroke / bore ratio', group: 'dimensionless', unit: 'none' },
    { id: 'classification', label: 'Loading assessment', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      swept_cylinder_m3: '32.2 L',
      swept_total_m3: '0.193 m³',
      bmep_pa: '24.9 bar',
      power_w: '3 000 kW',
      torque_nm: '38.2 kN·m',
      piston_speed_m_s: '10.0 m/s',
      specific_power_kw_l: '15.5',
      imep_pa: '27.6 bar',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertInteger(i.cylinders, 'cylinders', 'Cylinders');
  assertRange(i.cylinders, 1, 32, 'cylinders', 'Cylinders');
  assertPositive(i.bore_mm, 'bore_mm', 'Bore');
  assertPositive(i.stroke_mm, 'stroke_mm', 'Stroke');
  assertOneOf(i.cycle, Object.keys(CYCLES), 'cycle', 'Cycle');
  assertPositive(i.rpm, 'rpm', 'Speed');
  assertOneOf(i.mode, ['power', 'bmep'], 'mode', 'Mode');
  assertRange(i.eta_m, 0.3, 1, 'eta_m', 'Mechanical efficiency');

  const nR = CYCLES[i.cycle].nR;
  const D = i.bore_mm / 1000;
  const S = i.stroke_mm / 1000;
  const vCyl = (Math.PI / 4) * D * D * S;
  const vTot = vCyl * i.cylinders;
  const cyclesPerSecond = i.rpm / (60 * nR);
  let powerW;
  let bmepPa;
  if (i.mode === 'power') {
    powerW = assertPositive(i.power_kw, 'power_kw', 'Power') * 1000;
    bmepPa = powerW / (vTot * cyclesPerSecond);
  } else {
    bmepPa = assertPositive(i.bmep_bar, 'bmep_bar', 'BMEP') * 1e5;
    powerW = bmepPa * vTot * cyclesPerSecond;
  }
  const torque = (60 * powerW) / (2 * Math.PI * i.rpm);
  const pistonSpeed = (2 * S * i.rpm) / 60;
  const imep = bmepPa / i.eta_m;

  const bmepBar = bmepPa / 1e5;
  const slow = i.cycle === 'two_stroke';
  let cls;
  if (slow) cls = bmepBar > 22 ? 'BMEP above 22 bar: beyond current large two-stroke practice (18–21 bar)' : bmepBar < 10 ? 'Lightly loaded two-stroke (below 10 bar): part load or derated' : 'Within the large two-stroke range (18–21 bar at MCR, lower at part load)';
  else cls = bmepBar > 30 ? 'BMEP above 30 bar: beyond medium-speed diesel practice (22–28 bar)' : bmepBar < 12 ? 'Lightly loaded four-stroke (below 12 bar): part load or a naturally aspirated engine' : 'Within the turbocharged four-stroke range (12–28 bar)';

  const warnings = [];
  if (pistonSpeed > 12) warnings.push(`Mean piston speed ${pistonSpeed.toFixed(1)} m/s is high: above the usual 9–11 m/s of medium-speed and 8–9 m/s of low-speed marine engines (high-speed engines reach 12–14 m/s).`);
  if (slow && i.rpm > 300) warnings.push('A two-stroke above 300 rpm is unusual for marine propulsion (large two-strokes run 60–250 rpm).');
  if (!slow && S / D > 1.6) warnings.push('Stroke/bore above 1.6 on a four-stroke is unusual; check bore and stroke are not swapped.');
  if (i.eta_m < 0.75) warnings.push('Mechanical efficiency below 0.75: part load or heavy auxiliary drives; the IMEP/FMEP split is only as good as this input.');
  warnings.push('Mean effective pressures are load measures, not cylinder pressures; peak firing pressure is 5–8 × BMEP and comes from the indicator diagram.');
  warnings.push('Torque and power are mean brake values at the crankshaft; shaft losses to the propeller (gearbox, bearings) are separate.');

  return {
    outputs: {
      swept_cylinder_m3: vCyl,
      swept_total_m3: vTot,
      bmep_pa: bmepPa,
      power_w: powerW,
      power_per_cylinder_w: powerW / i.cylinders,
      torque_nm: torque,
      piston_speed_m_s: pistonSpeed,
      specific_power_kw_l: powerW / 1000 / (vTot * 1000),
      imep_pa: imep,
      fmep_pa: imep - bmepPa,
      work_per_cycle_j: bmepPa * vCyl,
      stroke_bore_ratio: S / D,
      classification: cls,
    },
    warnings,
  };
}
