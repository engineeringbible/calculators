/**
 * short-circuit-current/calc.js — three-phase short-circuit currents at a low-voltage switchboard by the IEC 60909-0
 * equivalent-voltage-source method: upstream network, transformer (with the K_T impedance correction) and feeder cable
 * impedances in series; initial symmetrical current I_k'', peak current i_p with the κ factor, thermal equivalent
 * current, the minimum current for protection settings and the breaker rating check.
 *
 * I_k'' = c U_n/(√3 Z_k);  κ = 1.02 + 0.98 e^(−3R/X);  i_p = κ √2 I_k'';  Z_T = u_kr U²/S_rT;  K_T = 0.95 c_max/(1 + 0.6 x_T).
 * Schema units: V, VA (display kVA/MVA), %, W, Ω (display mΩ), A (display kA), s.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const VOLTAGE_FACTORS = {
  lv_6: { label: 'Low voltage, +6 % tolerance (c_max 1.05, c_min 0.95)', cmax: 1.05, cmin: 0.95 },
  lv_10: { label: 'Low voltage, +10 % tolerance (c_max 1.10, c_min 0.95)', cmax: 1.1, cmin: 0.95 },
  mv: { label: 'Medium / high voltage (c_max 1.10, c_min 1.00)', cmax: 1.1, cmin: 1.0 },
};

export const schema = {
  id: 'short-circuit-current',
  name: 'Short-circuit current (IEC 60909)',
  category: 'electrical',
  summary: 'Three-phase short-circuit current at a switchboard from source, transformer and cable impedances; peak current and breaker check.',
  related: ['transformer-sizing', 'cable-sizing', 'generator-load', 'three-phase-power'],
  assumptions: [
    'IEC 60909-0 equivalent voltage source at the fault: I_k\'\' = c U_n/(√3 Z_k) with the voltage factor c (Table 1: low voltage c_max 1.05 for +6 % systems or 1.10 for +10 %, c_min 0.95; medium/high voltage 1.10/1.00), balanced three-phase fault far from generators (I_b = I_k = I_k\'\'), no motor contribution, no fault impedance.',
    'Upstream network as an impedance Z_Q = c U_nQ²/S_kQ\'\' referred to the low-voltage side by the transformer ratio, with R_Q/X_Q = 0.1 (X_Q = 0.995 Z_Q) as IEC 60909-0 §6.2.2 allows when nothing better is known; the MV voltage factor 1.10 is used for the network impedance.',
    'Two-winding transformer: Z_T = u_kr U_rT²/S_rT, R_T = P_krT U_rT²/S_rT², X_T = √(Z_T² − R_T²), corrected by K_T = 0.95 c_max/(1 + 0.6 x_T) (IEC 60909-0 eq. 12a, c_max of the LV side) when enabled; tap position and no-load losses are ignored.',
    'Feeder cable: resistance and reactance per unit length at 20 °C for the maximum current; for the minimum current the conductor resistance is taken at the end-of-fault temperature θ_e with the factor 1 + 0.004 (θ_e − 20) (IEC 60909-0 §2.3.2.4, 160 °C for PVC-insulated copper), parallel cables divide the impedance.',
    'Peak current i_p = κ √2 I_k\'\' with κ = 1.02 + 0.98 e^(−3R/X) from the resulting R/X at the fault (method A/C of IEC 60909-0 §4.3.1.1 for radial networks); the thermal equivalent current I_th = I_k\'\' √(m + n) uses the DC-decay factor m from eq. 103 and n = 1 for far-from-generator faults.',
    'Protective device check compares the rated ultimate breaking capacity I_cu with I_k\'\' and the rated short-circuit making capacity with i_p; the let-through energy, cable withstand (k² S² ≥ I² t) and selectivity are separate checks.',
  ],
  notes: [
    'Verification 2026-10-31: 1 000 kVA, 6 %, 10.5 kW, 400 V transformer on an infinite source gives Z_T 9.60 mΩ, R_T 1.68 mΩ, K_T 0.963, I_k\'\' 26.2 kA (the textbook I_r/u_k = 24.1 kA times c_max and K_T), R/X 0.178, κ 1.595, i_p 59 kA; voltage factors, κ and K_T formulas checked against secondary reproductions of IEC 60909-0 (DIgSILENT FAQ, eng-tips thread, myCableEngineering).',
    'Design decision: the LV default voltage factor is 1.05 (+6 % systems, IEC 60909-0:2001 Table 1); the 1.10 option covers +10 % systems as the 2016 edition allows. Note that with K_T = 0.95 c_max/(1 + 0.6 x_T) applied, c_max cancels out of the transformer-only current (I_k″ ∝ c_max/K_T); the choice of c only matters through the network and cable impedances.',
    'Design decision: the minimum current is evaluated at the cable end with c_min and the heated conductor, which is what protection coordination needs; the maximum at the switchboard with cold cable.',
  ],
  sources: [
    'IEC 60909-0:2016 Short-circuit currents in three-phase a.c. systems — Part 0: Calculation of currents (Table 1 voltage factor, §6.2 network feeder, §6.3 transformers with eq. 12a, §4.3 peak factor κ, eq. 103 factor m)',
    'IEC TR 60909-1:2002 Factors for the calculation of short-circuit currents; IEC TR 60909-4:2021 Examples for the calculation of short-circuit currents',
    'Schneider Electric Cahier Technique 158, "Calculation of short-circuit currents" (worked examples of the impedance method)',
    'IEC 60947-2 low-voltage circuit-breakers (I_cu, I_cm definitions); IEC 60364-4-43 overcurrent protection',
  ],
  inputs: [
    { id: 'voltage_v', label: 'Nominal voltage at the fault U_n (line-to-line)', group: 'voltage', unit: 'V', default: 400, min: 100, max: 36000 },
    { id: 'c_select', label: 'Voltage factor c (IEC 60909-0 Table 1)', type: 'select', default: 'lv_6', options: Object.entries(VOLTAGE_FACTORS).map(([value, v]) => ({ value, label: v.label })) },
    { id: 'source_mode', label: 'Upstream source', type: 'select', default: 'network', options: [{ value: 'network', label: 'Utility network with short-circuit power S_k″ (R/X 0.1)' }, { value: 'infinite', label: 'Infinite source (Z_Q = 0)' }] },
    { id: 'network_mva', label: 'Network short-circuit power S_kQ″ at the transformer HV side', group: 'apparent_power', unit: 'VA', display: 'MVA', default: 250e6, min: 1e6, max: 1e11, visibleWhen: { source_mode: 'network' } },
    { id: 'hv_voltage_v', label: 'Transformer HV voltage (for the ratio)', group: 'voltage', unit: 'V', display: 'kV', default: 11000, min: 400, max: 400000 },
    { id: 'transformer_va', label: 'Transformer rating S_rT', group: 'apparent_power', unit: 'VA', display: 'kVA', default: 1000e3, min: 10e3, max: 1e8 },
    { id: 'ukr_pct', label: 'Transformer impedance voltage u_kr', group: 'ratio', unit: 'pct', default: 6, min: 1, max: 30 },
    { id: 'pkr_w', label: 'Transformer load losses P_krT (copper losses)', group: 'power', unit: 'W', display: 'kW', default: 10500, min: 0, max: 1e6 },
    { id: 'apply_kt', label: 'Transformer impedance correction K_T (eq. 12a)', type: 'select', default: 'yes', options: [{ value: 'yes', label: 'Apply K_T = 0.95 c_max/(1 + 0.6 x_T)' }, { value: 'no', label: 'Do not apply' }] },
    { id: 'cable_length_m', label: 'Cable length from transformer to the fault (0 = fault at the transformer terminals)', group: 'length', unit: 'm', default: 50, min: 0, max: 5000 },
    { id: 'cable_r_ohm_km', label: 'Cable conductor resistance at 20 °C (per cable)', group: 'resistance_per_length', unit: 'ohm_km', display: 'mohm_m', default: 0.1, min: 0.001, max: 50, help: '240 mm² Cu ≈ 0.075, 120 mm² ≈ 0.15, 70 mm² ≈ 0.27 Ω/km.' },
    { id: 'cable_x_ohm_km', label: 'Cable reactance (per cable)', group: 'resistance_per_length', unit: 'ohm_km', display: 'mohm_m', default: 0.08, min: 0, max: 1, help: 'Single-core trefoil 0.08–0.1, multicore 0.07–0.08 Ω/km.' },
    { id: 'cables_parallel', label: 'Cables in parallel per phase', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 12, integer: true },
    { id: 'theta_e_c', label: 'Conductor temperature at the end of the fault for the minimum current', group: 'temperature', unit: 'C', default: 160, min: 20, max: 250, help: 'PVC 160 °C, XLPE 250 °C (IEC 60909-0 §2.3.2.4).' },
    { id: 'frequency_hz', label: 'System frequency', group: 'frequency', unit: 'Hz', default: 50, min: 16.7, max: 60 },
    { id: 'duration_s', label: 'Short-circuit duration T_k (thermal equivalent)', group: 'time', unit: 's', default: 1, min: 0.01, max: 5 },
    { id: 'breaker_icu_a', label: 'Breaker rated ultimate breaking capacity I_cu (0 = skip)', group: 'current', unit: 'A', display: 'kA', default: 36000, min: 0, max: 1e6 },
    { id: 'breaker_icm_a', label: 'Breaker rated making capacity I_cm (0 = skip)', group: 'current', unit: 'A', display: 'kA', default: 75600, min: 0, max: 1e7 },
  ],
  outputs: [
    { id: 'c_max', label: 'Voltage factor c_max used', group: 'dimensionless', unit: 'none' },
    { id: 'z_network_ohm', label: 'Network impedance referred to the LV side Z_Qt', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'z_transformer_ohm', label: 'Transformer impedance Z_T (uncorrected)', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'r_transformer_ohm', label: 'Transformer resistance R_T', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'kt', label: 'Transformer correction factor K_T', group: 'dimensionless', unit: 'none' },
    { id: 'z_cable_ohm', label: 'Cable impedance (parallel cables combined, 20 °C)', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'r_total_ohm', label: 'Resulting R_k at the fault', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'x_total_ohm', label: 'Resulting X_k at the fault', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'z_total_ohm', label: 'Resulting Z_k at the fault', group: 'resistance', unit: 'ohm', display: 'mohm' },
    { id: 'rx_ratio', label: 'R_k / X_k', group: 'dimensionless', unit: 'none' },
    { id: 'ik_terminals_a', label: 'I_k″ at the transformer LV terminals (no cable)', group: 'current', unit: 'A', display: 'kA' },
    { id: 'ik_max_a', label: 'Maximum initial symmetrical current I_k″ at the fault', group: 'current', unit: 'A', display: 'kA' },
    { id: 'kappa', label: 'Peak factor κ = 1.02 + 0.98 e^(−3R/X)', group: 'dimensionless', unit: 'none' },
    { id: 'ip_a', label: 'Peak short-circuit current i_p = κ √2 I_k″', group: 'current', unit: 'A', display: 'kA' },
    { id: 'm_factor', label: 'DC decay factor m (eq. 103)', group: 'dimensionless', unit: 'none' },
    { id: 'ith_a', label: 'Thermal equivalent current I_th = I_k″ √(m + n)', group: 'current', unit: 'A', display: 'kA' },
    { id: 'ik_min_a', label: 'Minimum I_k″ at the fault (c_min, heated conductor)', group: 'current', unit: 'A', display: 'kA' },
    { id: 'breaker_check', label: 'Breaker rating check', type: 'text' },
    { id: 'transformer_rated_a', label: 'Transformer rated LV current I_rT', group: 'current', unit: 'A' },
    { id: 'ik_over_ir', label: 'I_k″ / I_rT at the terminals', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      c_max: '1.05',
      z_network_ohm: '0.704 mΩ',
      z_transformer_ohm: '9.60 mΩ',
      r_transformer_ohm: '1.68 mΩ',
      kt: '0.963',
      z_total_ohm: '15.3 mΩ',
      ik_terminals_a: '24.4 kA',
      ik_max_a: '15.8 kA',
    },
  },
};

/** Peak factor κ for R/X. */
export function peakFactor(rx) {
  return 1.02 + 0.98 * Math.exp(-3 * rx);
}

/** DC decay factor m (IEC 60909-0 eq. 103). */
export function thermalFactorM(kappa, frequencyHz, durationS) {
  const lnk = Math.log(kappa - 1);
  return (1 / (2 * frequencyHz * durationS * lnk)) * (Math.exp(4 * frequencyHz * durationS * lnk) - 1);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.c_select, Object.keys(VOLTAGE_FACTORS), 'c_select', 'Voltage factor');
  assertOneOf(i.source_mode, ['network', 'infinite'], 'source_mode', 'Source');
  assertOneOf(i.apply_kt, ['yes', 'no'], 'apply_kt', 'K_T option');
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  assertPositive(i.hv_voltage_v, 'hv_voltage_v', 'HV voltage');
  assertPositive(i.transformer_va, 'transformer_va', 'Transformer rating');
  assertRange(i.ukr_pct, 0.5, 50, 'ukr_pct', 'Impedance voltage');
  assertNonNegative(i.pkr_w, 'pkr_w', 'Load losses');
  assertNonNegative(i.cable_length_m, 'cable_length_m', 'Cable length');
  assertPositive(i.cable_r_ohm_km, 'cable_r_ohm_km', 'Cable resistance');
  assertNonNegative(i.cable_x_ohm_km, 'cable_x_ohm_km', 'Cable reactance');
  assertInteger(i.cables_parallel, 'cables_parallel', 'Parallel cables');
  assertRange(i.cables_parallel, 1, 50, 'cables_parallel', 'Parallel cables');
  assertRange(i.theta_e_c, 20, 300, 'theta_e_c', 'Conductor temperature');
  assertPositive(i.frequency_hz, 'frequency_hz', 'Frequency');
  assertPositive(i.duration_s, 'duration_s', 'Duration');
  assertNonNegative(i.breaker_icu_a, 'breaker_icu_a', 'Breaking capacity');
  assertNonNegative(i.breaker_icm_a, 'breaker_icm_a', 'Making capacity');

  const { cmax, cmin } = VOLTAGE_FACTORS[i.c_select];
  const U = i.voltage_v;
  // network feeder referred to LV (IEC 60909-0 §6.2.2 with c_Q 1.10 for the MV network)
  let zQ = 0;
  if (i.source_mode === 'network') {
    assertPositive(i.network_mva, 'network_mva', 'Network short-circuit power');
    zQ = (1.1 * U * U) / i.network_mva;
  }
  const xQ = 0.995 * zQ;
  const rQ = 0.1 * xQ;
  // transformer
  const zT = ((i.ukr_pct / 100) * U * U) / i.transformer_va;
  const rT = (i.pkr_w * U * U) / (i.transformer_va * i.transformer_va);
  if (rT >= zT) throw new Error(`Transformer load losses ${i.pkr_w} W imply R_T ≥ Z_T: check P_krT and u_kr`);
  const xTraw = Math.sqrt(zT * zT - rT * rT);
  const xTpu = (xTraw * i.transformer_va) / (U * U);
  const kT = i.apply_kt === 'yes' ? (0.95 * cmax) / (1 + 0.6 * xTpu) : 1;
  const rTk = kT * rT;
  const xTk = kT * xTraw;
  // cable
  const rC = ((i.cable_r_ohm_km / 1000) * i.cable_length_m) / i.cables_parallel;
  const xC = ((i.cable_x_ohm_km / 1000) * i.cable_length_m) / i.cables_parallel;
  const rCmin = rC * (1 + 0.004 * (i.theta_e_c - 20));

  const rTerm = rQ + rTk;
  const xTerm = xQ + xTk;
  const zTerm = Math.hypot(rTerm, xTerm);
  const ikTerm = (cmax * U) / (Math.sqrt(3) * zTerm);
  const rK = rTerm + rC;
  const xK = xTerm + xC;
  const zK = Math.hypot(rK, xK);
  const ikMax = (cmax * U) / (Math.sqrt(3) * zK);
  const rx = rK / xK;
  const kappa = peakFactor(rx);
  const ip = kappa * Math.SQRT2 * ikMax;
  const m = thermalFactorM(kappa, i.frequency_hz, i.duration_s);
  const ith = ikMax * Math.sqrt(m + 1);
  const zKmin = Math.hypot(rTerm + rCmin, xK);
  const ikMin = (cmin * U) / (Math.sqrt(3) * zKmin);
  const irT = i.transformer_va / (Math.sqrt(3) * U);

  let breakerCheck = 'Not checked (enter I_cu / I_cm)';
  if (i.breaker_icu_a > 0 || i.breaker_icm_a > 0) {
    const parts = [];
    if (i.breaker_icu_a > 0) parts.push(i.breaker_icu_a >= ikMax ? `I_cu ${(i.breaker_icu_a / 1000).toFixed(0)} kA ≥ I_k″ ${(ikMax / 1000).toFixed(1)} kA OK` : `I_cu ${(i.breaker_icu_a / 1000).toFixed(0)} kA < I_k″ ${(ikMax / 1000).toFixed(1)} kA — INSUFFICIENT`);
    if (i.breaker_icm_a > 0) parts.push(i.breaker_icm_a >= ip ? `I_cm ${(i.breaker_icm_a / 1000).toFixed(0)} kA ≥ i_p ${(ip / 1000).toFixed(1)} kA OK` : `I_cm ${(i.breaker_icm_a / 1000).toFixed(0)} kA < i_p ${(ip / 1000).toFixed(1)} kA — INSUFFICIENT`);
    breakerCheck = parts.join('; ');
  }

  const warnings = [];
  if (i.source_mode === 'infinite') warnings.push('Infinite source: the real network impedance lowers I_k″ by a few per cent for strong grids and much more for weak ones.');
  if (i.cable_length_m === 0) warnings.push('Fault at the transformer terminals: the minimum current equals the maximum scaled by c_min/c_max (no heated cable).');
  if (ikMin < 0.5 * ikMax) warnings.push('Minimum fault current at the cable end is below half the maximum: check that the protective device trips within the required time at I_k,min (IEC 60364-4-41).');
  if (rx > 1) warnings.push('R/X above 1 (long cable): κ is close to 1.02 and the DC component negligible; the thermal factor m is ≈ 0.');
  warnings.push('Far-from-generator fault without motor contribution: large motor loads (> 1 % of I_k″ each, IEC 60909-0 §6.6) add to the initial and peak currents.');
  warnings.push('Single-phase and phase-to-earth faults, arc impedance, selectivity and cable withstand (k² S² ≥ I² t) are separate checks.');

  return {
    outputs: {
      c_max: cmax,
      z_network_ohm: zQ,
      z_transformer_ohm: zT,
      r_transformer_ohm: rT,
      kt: kT,
      z_cable_ohm: Math.hypot(rC, xC),
      r_total_ohm: rK,
      x_total_ohm: xK,
      z_total_ohm: zK,
      rx_ratio: rx,
      ik_terminals_a: ikTerm,
      ik_max_a: ikMax,
      kappa,
      ip_a: ip,
      m_factor: m,
      ith_a: ith,
      ik_min_a: ikMin,
      breaker_check: breakerCheck,
      transformer_rated_a: irT,
      ik_over_ir: ikTerm / irT,
    },
    warnings,
  };
}
