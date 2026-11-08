/**
 * compression-ratio/calc.js — static compression ratio of a piston engine from bore, stroke, combustion chamber volume,
 * head gasket bore and thickness, deck clearance and piston dome or dish volume, with the swept and clearance volumes.
 *
 * V_s = π/4 b² s;  V_gasket = π/4 b_g² t;  V_deck = π/4 b² d;  V_c = V_chamber + V_gasket + V_deck + V_piston;
 * CR = (V_s + V_c) / V_c  (Heywood, Internal Combustion Engine Fundamentals, Section 2.2).
 * Schema units: SI — m, m³ (in, cc = mL and in³ as display units).
 */
import { withDefaults, assertPositive, assertRange, assertInteger, assertFinite } from '../shared/validate.js';

const IN = 0.0254;
const CC = 1e-6;

export const schema = {
  id: 'compression-ratio',
  name: 'Compression ratio calculator',
  category: 'automotive',
  summary: 'Static compression ratio from bore, stroke, chamber volume, head gasket, deck clearance and piston dome or dish, with swept and clearance volumes.',
  related: ['engine-displacement', 'horsepower', 'fuel-injector-size', 'engine-bmep'],
  assumptions: [
    'The static compression ratio is the cylinder volume at bottom dead centre divided by the volume at top dead centre, CR = (V_s + V_c) / V_c; it ignores valve timing, so the dynamic (effective) ratio with a late-closing intake valve is lower.',
    'The head gasket is treated as a cylinder of its compressed thickness and its bore diameter; use the compressed thickness from the gasket maker, not the free thickness.',
    'The deck volume is a cylinder of the bore diameter and the deck clearance: positive when the piston crown stops below the block deck at top dead centre, negative when it rises above it.',
    'The piston volume is positive for a dish and valve reliefs (they add clearance volume) and negative for a dome (it fills the chamber); the small volume beside the top ring land is not included.',
    'Chamber and piston volumes are entered in cc (1 cc = 1 mL); measure them with a burette for an accurate ratio.',
  ],
  notes: [
    'Verification 2026-11-08: bore 4.030 in, stroke 3.480 in, 64 cc chamber, 0.041 in gasket of 4.100 in bore, 0.025 in deck clearance and 5 cc of valve reliefs: swept 727.4 cc, gasket 8.87 cc, deck 5.23 cc, clearance 83.1 cc, CR 9.75:1, eight cylinders 355.1 in³. Checked by hand.',
  ],
  sources: [
    'J.B. Heywood, Internal Combustion Engine Fundamentals, McGraw-Hill 1988, Section 2.2 Geometrical properties of reciprocating engines (V_d = π B² L / 4, r_c = (V_d + V_c) / V_c)',
    'W.W. Pulkrabek, Engineering Fundamentals of the Internal Combustion Engine, 2nd ed., Pearson Prentice Hall 2004, Chapter 2 Operating characteristics (engine geometry and compression ratio)',
  ],
  inputs: [
    { id: 'bore_m', label: 'Cylinder bore', group: 'length', unit: 'm', display: 'in', default: 4.03 * IN, min: 0.01, max: 0.5 },
    { id: 'stroke_m', label: 'Stroke', group: 'length', unit: 'm', display: 'in', default: 3.48 * IN, min: 0.005, max: 0.6 },
    { id: 'chamber_m3', label: 'Combustion chamber volume (cc = mL)', group: 'volume', unit: 'm3', display: 'mL', default: 64 * CC, min: 0.5 * CC, max: 5000 * CC },
    { id: 'gasket_bore_m', label: 'Head gasket bore', group: 'length', unit: 'm', display: 'in', default: 4.1 * IN, min: 0.01, max: 0.5 },
    { id: 'gasket_t_m', label: 'Head gasket compressed thickness', group: 'length', unit: 'm', display: 'in', default: 0.041 * IN, min: 0, max: 0.01 },
    { id: 'deck_m', label: 'Deck clearance (+ piston below deck, − above)', group: 'length', unit: 'm', display: 'in', default: 0.025 * IN, min: -0.005, max: 0.01 },
    { id: 'piston_m3', label: 'Piston dish and valve reliefs (+) or dome (−), cc', group: 'volume', unit: 'm3', display: 'mL', default: 5 * CC, min: -500 * CC, max: 500 * CC },
    { id: 'cylinders', label: 'Number of cylinders', group: 'dimensionless', unit: 'none', default: 8, min: 1, max: 16, integer: true },
  ],
  outputs: [
    { id: 'cr', label: 'Static compression ratio (… : 1)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'swept_m3', label: 'Swept volume per cylinder', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'gasket_m3', label: 'Head gasket volume', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'deck_m3', label: 'Deck clearance volume', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'clearance_m3', label: 'Total clearance volume at TDC', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'quench_m', label: 'Piston-to-head distance (gasket + deck)', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'displacement_m3', label: 'Engine displacement', group: 'volume', unit: 'm3', display: 'in3' },
    { id: 'displacement_l_m3', label: 'Engine displacement in litres', group: 'volume', unit: 'm3', display: 'L', decimals: 2 },
  ],
  example: {
    inputs: { bore_m: [4.03, 'in'], stroke_m: [3.48, 'in'], chamber_m3: [64, 'mL'], gasket_bore_m: [4.1, 'in'], gasket_t_m: [0.041, 'in'], deck_m: [0.025, 'in'], piston_m3: [5, 'mL'], cylinders: 8 },
    results: { swept_m3: '727.4 mL', gasket_m3: '8.87 mL', deck_m3: '5.23 mL', clearance_m3: '83.1 mL', cr: '9.75', displacement_m3: '355.1 in³' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const bore = assertRange(x.bore_m, 0.01, 0.5, 'bore_m', 'Cylinder bore');
  const stroke = assertRange(x.stroke_m, 0.005, 0.6, 'stroke_m', 'Stroke');
  const chamber = assertPositive(x.chamber_m3, 'chamber_m3', 'Combustion chamber volume');
  const gBore = assertRange(x.gasket_bore_m, 0.01, 0.5, 'gasket_bore_m', 'Head gasket bore');
  const gT = assertRange(x.gasket_t_m, 0, 0.01, 'gasket_t_m', 'Head gasket thickness');
  const deck = assertRange(x.deck_m, -0.005, 0.01, 'deck_m', 'Deck clearance');
  const piston = assertFinite(x.piston_m3, 'piston_m3', 'Piston dish or dome volume');
  const n = assertInteger(assertRange(x.cylinders, 1, 16, 'cylinders', 'Number of cylinders'), 'cylinders', 'Number of cylinders');
  const quench = gT + deck;
  if (quench < 0) throw new Error('Deck clearance: the piston would rise above the deck by more than the gasket thickness and hit the head.');
  const area = (Math.PI / 4) * bore ** 2;
  const swept = area * stroke;
  const gasket = (Math.PI / 4) * gBore ** 2 * gT;
  const deckV = area * deck;
  const clearance = chamber + gasket + deckV + piston;
  if (!(clearance > 0)) throw new Error('Piston dish or dome volume: the dome fills the whole clearance volume; check the dome volume and its sign (a dome is negative).');
  const cr = (swept + clearance) / clearance;
  const warnings = [];
  if (gBore < bore) warnings.push('The head gasket bore is smaller than the cylinder bore: the gasket would overhang the bore. Check both values.');
  if (cr > 14) warnings.push('A static compression ratio above 14:1 is beyond what pump gasoline tolerates in a spark-ignition engine; it suits diesels, race fuel or methanol.');
  if (cr < 6) warnings.push('A static compression ratio below 6:1 is unusually low; check the chamber and dish volumes.');
  return {
    outputs: {
      cr, swept_m3: swept, gasket_m3: gasket, deck_m3: deckV, clearance_m3: clearance, quench_m: quench,
      displacement_m3: swept * n, displacement_l_m3: swept * n,
    },
    warnings,
  };
}
