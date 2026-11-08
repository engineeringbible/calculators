/**
 * engine-displacement/calc.js — engine displacement from bore, stroke and number of cylinders in cc, litres and cubic
 * inches; or the bore or the stroke that gives a displacement; with the bore/stroke ratio and the mean piston speed.
 *
 * V = π/4 b² s n;  b = √(4 V / (π s n));  s = 4 V / (π b² n);  mean piston speed = 2 s N / 60
 * (Heywood, Internal Combustion Engine Fundamentals, Section 2.2). Schema units: SI — m, m³, rpm, m/s.
 */
import { withDefaults, assertOneOf, assertRange, assertInteger, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;

export const schema = {
  id: 'engine-displacement',
  name: 'Engine displacement calculator',
  category: 'automotive',
  summary: 'Engine displacement in cc, litres and cubic inches from bore, stroke and cylinders, or the bore or stroke for a target size, with mean piston speed.',
  related: ['compression-ratio', 'horsepower', 'engine-bmep', 'fuel-injector-size'],
  assumptions: [
    'Displacement is the swept volume of all cylinders, π/4 × bore² × stroke × cylinders, for a four-stroke or a two-stroke piston engine alike; it does not apply to rotary (Wankel) engines.',
    'Bore and stroke are the finished dimensions; an overbore of 0.030 in or 0.5 mm is added to the bore before calculating.',
    'Manufacturers round displacement to the nearest 0.1 L for the badge (5 733 cc is sold as a 5.7) and sometimes to whole cubic inches.',
    'The mean piston speed is 2 × stroke × rpm; it is the average over a revolution, and the peak speed near mid-stroke is about 1.6 times higher for usual connecting-rod lengths.',
  ],
  notes: [
    'Verification 2026-11-08: GM LS3, bore 4.065 in, stroke 3.622 in, 8 cylinders: 376.1 in³, 6.16 L (GM rates it 6.2 L, 376 cu in); mean piston speed at 6 600 rpm 3 984 ft/min. Checked by hand.',
  ],
  sources: [
    'J.B. Heywood, Internal Combustion Engine Fundamentals, McGraw-Hill 1988, Section 2.2 (displaced volume V_d = π B² L / 4 and mean piston speed 2 L N)',
    'Manufacturer data for the test engines: GM small-block 350 (4.00 × 3.48 in), GM LS3 (4.065 × 3.622 in, 6.2 L), Honda K20 (86 × 86 mm, 1 998 cc), Toyota 2JZ-GTE (86 × 86 mm, 2 997 cc)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'displacement', options: [
      { value: 'displacement', label: 'Displacement from bore and stroke' },
      { value: 'bore', label: 'Bore for a displacement and stroke' },
      { value: 'stroke', label: 'Stroke for a displacement and bore' },
    ] },
    { id: 'bore_m', label: 'Cylinder bore', group: 'length', unit: 'm', display: 'in', default: 4.065 * IN, min: 0.01, max: 1, visibleWhen: { mode: ['displacement', 'stroke'] } },
    { id: 'stroke_m', label: 'Stroke', group: 'length', unit: 'm', display: 'in', default: 3.622 * IN, min: 0.005, max: 3, visibleWhen: { mode: ['displacement', 'bore'] } },
    { id: 'volume_m3', label: 'Target displacement', group: 'volume', unit: 'm3', display: 'in3', default: 0.00616, min: 1e-6, max: 2, visibleWhen: { mode: ['bore', 'stroke'] } },
    { id: 'cylinders', label: 'Number of cylinders', group: 'dimensionless', unit: 'none', default: 8, min: 1, max: 24, integer: true },
    { id: 'rpm', label: 'Engine speed for the piston speed (optional)', group: 'rotational_speed', unit: 'rpm', default: 6600, min: 0, max: 30000 },
  ],
  outputs: [
    { id: 'displacement_m3', label: 'Displacement', group: 'volume', unit: 'm3', display: 'in3' },
    { id: 'displacement_l_m3', label: 'Displacement in litres', group: 'volume', unit: 'm3', display: 'L', decimals: 3 },
    { id: 'displacement_cc_m3', label: 'Displacement in cc', group: 'volume', unit: 'm3', display: 'mL', decimals: 0 },
    { id: 'per_cyl_m3', label: 'Swept volume per cylinder', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'bore_out_m', label: 'Bore', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'stroke_out_m', label: 'Stroke', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'bore_stroke', label: 'Bore/stroke ratio', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'design', label: 'Layout', type: 'text' },
    { id: 'piston_speed_m_s', label: 'Mean piston speed', group: 'speed', unit: 'm_s', display: 'fpm' },
  ],
  example: {
    inputs: { mode: 'displacement', bore_m: [4.065, 'in'], stroke_m: [3.622, 'in'], cylinders: 8, rpm: [6600, 'rpm'] },
    results: { displacement_m3: '376.1 in³', displacement_l_m3: '6.16 L', per_cyl_m3: '770.3 mL', bore_stroke: '1.122', piston_speed_m_s: '3 984 ft/min' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['displacement', 'bore', 'stroke'], 'mode', 'Calculate');
  const n = assertInteger(assertRange(x.cylinders, 1, 24, 'cylinders', 'Number of cylinders'), 'cylinders', 'Number of cylinders');
  const rpm = assertNonNegative(x.rpm, 'rpm', 'Engine speed');
  let bore;
  let stroke;
  if (x.mode === 'displacement') {
    bore = assertRange(x.bore_m, 0.01, 1, 'bore_m', 'Cylinder bore');
    stroke = assertRange(x.stroke_m, 0.005, 3, 'stroke_m', 'Stroke');
  } else {
    const v = assertRange(x.volume_m3, 1e-6, 2, 'volume_m3', 'Target displacement');
    if (x.mode === 'bore') {
      stroke = assertRange(x.stroke_m, 0.005, 3, 'stroke_m', 'Stroke');
      bore = Math.sqrt((4 * v) / (Math.PI * stroke * n));
    } else {
      bore = assertRange(x.bore_m, 0.01, 1, 'bore_m', 'Cylinder bore');
      stroke = (4 * v) / (Math.PI * bore ** 2 * n);
    }
  }
  const perCyl = (Math.PI / 4) * bore ** 2 * stroke;
  const total = perCyl * n;
  const ratio = bore / stroke;
  const design = Math.abs(ratio - 1) <= 0.02 ? 'Square (bore ≈ stroke)' : ratio > 1 ? 'Oversquare (short stroke): favours high rpm' : 'Undersquare (long stroke): favours low-speed torque';
  const speed = rpm > 0 ? (2 * stroke * rpm) / 60 : null;
  const warnings = [];
  if (ratio > 2.5 || ratio < 0.4) warnings.push('The bore/stroke ratio is far outside the 0.6 to 1.6 of car and motorcycle engines; check the bore and stroke.');
  if (speed !== null && speed > 25) warnings.push('Mean piston speed above 25 m/s (4 900 ft/min) is in the range of top racing engines; check the stroke and the rpm.');
  return {
    outputs: {
      displacement_m3: total, displacement_l_m3: total, displacement_cc_m3: total, per_cyl_m3: perCyl,
      bore_out_m: bore, stroke_out_m: stroke, bore_stroke: ratio, design, piston_speed_m_s: speed,
    },
    warnings,
  };
}
