/**
 * pcb-trace-width/calc.js — PCB trace width for a current by the IPC-2221 curve fit, with the trace's resistance,
 * voltage drop and power loss.
 *
 * I = k ΔT^0.44 A^0.725 (I in A, ΔT in °C, A in mil²; k = 0.048 outer layers, 0.024 inner layers)
 * → A = (I / (k ΔT^0.44))^(1/0.725);  w = A / t, t = 1.378 mil per oz/ft² (35 µm).
 * R = ρ20 (1 + α (T − 20 °C)) L / (w t),  T = T_ambient + ΔT;  V = I R;  P = I² R.
 * Schema units: SI — A, K (temperature rise), °C, m, Ω, V, W; copper weight in oz/ft², area in mil².
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';

/** IPC-2221 curve-fit constants: k for outer and inner layers, exponents of ΔT and area. */
export const K_EXTERNAL = 0.048;
export const K_INTERNAL = 0.024;
export const B_DT = 0.44;
export const C_AREA = 0.725;
/** Nominal copper thickness per oz/ft² used with the IPC charts: 1.378 mil = 35 µm. */
export const MIL_PER_OZ = 1.378;
const MIL_M = 25.4e-6;
/** Annealed copper at 20 °C, IEC 60028: 1.7241e-8 Ω·m, temperature coefficient 0.00393 per K. */
export const RHO_CU = 1.7241e-8;
export const ALPHA_CU = 0.00393;
/** Extent of the IPC-2221 charts behind the fit. */
export const MAX_A = { external: 35, internal: 17.5 };
export const MAX_WIDTH_MIL = 400;

export const schema = {
  id: 'pcb-trace-width',
  name: 'PCB trace width calculator (IPC-2221)',
  category: 'electrical',
  summary: 'PCB trace width for a current by IPC-2221 from copper weight and allowed temperature rise, with the trace resistance, voltage drop and power loss.',
  related: ['wire-size', 'awg-wire-gauge', 'ohms-law', 'cable-sizing'],
  assumptions: [
    'The width comes from the curve fit to the IPC-2221 current charts, I = k ΔT^0.44 A^0.725, with k = 0.048 for outer layers and 0.024 for inner layers; the inner-layer chart is the outer one at half the current.',
    'The fit is used only within the charts it was drawn from: currents up to 35 A on outer and 17.5 A on inner layers, widths up to 400 mil (10.2 mm), temperature rises of 10 to 100 °C and copper of 0.5 to 3 oz/ft²; outside that range the calculator refuses rather than extrapolates.',
    'IPC-2221 is conservative. IPC-2152 (2009) is based on newer measurements and takes the board material, thickness and copper planes into account; it usually allows narrower traces, especially on inner layers.',
    'Copper thickness is the nominal 1.378 mil (35 µm) per oz/ft²; plating on outer layers adds thickness and etching removes some, so the real cross-section differs.',
    'Resistance uses annealed copper, 1.7241 × 10⁻⁸ Ω·m at 20 °C with 0.393 % per K, at the ambient temperature plus the temperature rise; electrodeposited PCB copper is a few per cent more resistive.',
  ],
  notes: [
    'Verification 2026-11-08: 2 A on an outer layer of 1 oz copper with a 10 °C rise needs 42.4 mil² and 30.8 mil (0.781 mm); 2 in of it at 35 °C has 33.9 mΩ, drops 67.8 mV and dissipates 0.136 W. 1 A gives 11.8 mil (0.30 mm), the commonly tabulated value. Checked by hand.',
  ],
  sources: [
    'IPC-2221B, Generic Standard on Printed Board Design (2012), §6.2 Conductive material requirements and Figure 6-4, conductor current-carrying capacity charts for internal and external conductors',
    'IPC-2152, Standard for Determining Current Carrying Capacity in Printed Board Design (2009), named for comparison',
    'IEC 60028:1925 International standard of resistance for copper (1/58 Ω·mm²/m at 20 °C, 0.00393 per K)',
  ],
  inputs: [
    { id: 'current_a', label: 'Current I', group: 'current', unit: 'A', default: 2, min: 0.01, max: 35 },
    { id: 'copper_oz', label: 'Copper weight, oz/ft² (1 oz = 35 µm)', group: 'dimensionless', unit: 'none', default: 1, min: 0.5, max: 3 },
    { id: 'rise_k', label: 'Allowed temperature rise ΔT', group: 'temperature_difference', unit: 'K', display: 'C', default: 10, min: 10, max: 100 },
    { id: 'layer', label: 'Layer', type: 'select', default: 'external', options: [{ value: 'external', label: 'Outer (external) layer, k = 0.048' }, { value: 'internal', label: 'Inner (internal) layer, k = 0.024' }] },
    { id: 'length_m', label: 'Trace length', group: 'length', unit: 'm', display: 'in', default: 0.0508, min: 1e-4, max: 10 },
    { id: 'ambient_c', label: 'Ambient temperature', group: 'temperature', unit: 'C', default: 25, min: -55, max: 125 },
  ],
  outputs: [
    { id: 'area_mil2', label: 'Copper cross-section, mil²', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'width_m', label: 'Minimum trace width', group: 'length', unit: 'm', display: 'mil' },
    { id: 'width_mm_m', label: 'Minimum trace width in mm', group: 'length', unit: 'm', display: 'mm' },
    { id: 'thickness_m', label: 'Copper thickness', group: 'length', unit: 'm', display: 'um' },
    { id: 'other_width_m', label: 'Width needed on the other layer type', group: 'length', unit: 'm', display: 'mil' },
    { id: 'trace_c', label: 'Trace temperature (ambient + rise)', group: 'temperature', unit: 'C' },
    { id: 'resistance_ohm', label: 'Trace resistance at that temperature', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'drop_v', label: 'Voltage drop I R', group: 'voltage', unit: 'V', display: 'mV' },
    { id: 'loss_w', label: 'Power loss I² R', group: 'power', unit: 'W' },
  ],
  example: {
    inputs: { current_a: [2, 'A'], copper_oz: 1, rise_k: [10, 'C'], layer: 'external', length_m: [2, 'in'], ambient_c: [25, 'C'] },
    results: { area_mil2: '42.4', width_m: '30.8 mil', width_mm_m: '0.781 mm', resistance_ohm: '33.9 mΩ', drop_v: '67.8 mV', loss_w: '0.136 W' },
  },
};

/** Cross-section in mil² for a current, a temperature rise in °C and the layer's k (IPC-2221 fit). */
export const areaMil2 = (current, rise, k) => (current / (k * rise ** B_DT)) ** (1 / C_AREA);

/** A number input checked against zero and its schema limits. */
function inRange(value, id, label) {
  const spec = schema.inputs.find((i) => i.id === id);
  assertPositive(value, id, label);
  return assertRange(value, spec.min, spec.max, id, label);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.layer, ['external', 'internal'], 'layer', 'Layer');
  const current = inRange(x.current_a, 'current_a', 'Current');
  const oz = assertRange(x.copper_oz, 0.5, 3, 'copper_oz', 'Copper weight (IPC-2221 charts cover 0.5 to 3 oz/ft²)');
  const rise = assertRange(x.rise_k, 10, 100, 'rise_k', 'Temperature rise (IPC-2221 charts cover 10 to 100 °C)');
  const length = inRange(x.length_m, 'length_m', 'Trace length');
  const ambient = assertRange(x.ambient_c, -55, 125, 'ambient_c', 'Ambient temperature');
  const external = x.layer === 'external';
  if (current > MAX_A[x.layer]) throw new Error(`Current: the IPC-2221 charts end at ${MAX_A[x.layer]} A on ${external ? 'outer' : 'inner'} layers (got ${current} A); use IPC-2152, several traces or a copper pour.`);
  const area = areaMil2(current, rise, external ? K_EXTERNAL : K_INTERNAL);
  const tMil = oz * MIL_PER_OZ;
  const wMil = area / tMil;
  if (wMil > MAX_WIDTH_MIL) throw new Error(`Current: the width comes out at ${Math.round(wMil)} mil, beyond the 400 mil the IPC-2221 charts cover; use heavier copper, a larger temperature rise, or IPC-2152.`);
  const otherMil = areaMil2(current, rise, external ? K_INTERNAL : K_EXTERNAL) / tMil;
  const traceC = ambient + rise;
  const rho = RHO_CU * (1 + ALPHA_CU * (traceC - 20));
  const r = (rho * length) / (wMil * MIL_M * tMil * MIL_M);
  const warnings = [];
  if (wMil < 4) warnings.push('Under about 4 mil (0.1 mm) the width is below what many board makers etch as standard; check the fabricator\'s minimum.');
  if (otherMil > MAX_WIDTH_MIL) warnings.push('On the other layer type the same current needs more than the 400 mil the charts cover.');
  if (traceC > 105) warnings.push('The trace runs above 105 °C: check the board material\'s maximum operating temperature (FR-4 glass transition is typically 130 to 180 °C).');
  return {
    outputs: {
      area_mil2: area,
      width_m: wMil * MIL_M,
      width_mm_m: wMil * MIL_M,
      thickness_m: tMil * MIL_M,
      other_width_m: otherMil * MIL_M,
      trace_c: traceC,
      resistance_ohm: r,
      drop_v: current * r,
      loss_w: current * current * r,
    },
    warnings,
  };
}
