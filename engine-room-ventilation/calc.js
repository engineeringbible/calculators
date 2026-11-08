/**
 * engine-room-ventilation/calc.js — ISO 8861:1998 engine-room ventilation: airflow for combustion of main engines,
 * generators and boilers, airflow for evacuation of the heat emission with the 0.4 recovery factor, the total airflow
 * (not less than 1.5 × combustion air), air changes and fan duties.
 *
 * q_dp = P_dp m_ad/ρ;  q_b = Q_b m_fs m_af/ρ;  q_h = Σφ/(ρ c ΔT) − 0.4 (q_dp + q_dg) − q_b;  Q = max(q_c + q_h, 1.5 q_c).
 * Schema units: kW, m³/s (display m³/h), m³, K.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const AIR_DENSITY_KG_M3 = 1.13;
export const AIR_SPECIFIC_HEAT_KJ_KGK = 1.01;
export const TEMPERATURE_RISE_K = 12.5;
export const M_AD = { two_stroke: 0.0023, four_stroke: 0.002 };
export const BOILER_FUEL_KG_PER_KWH = 0.11;
export const BOILER_AIR_KG_PER_KG_FUEL = 15.7;
export const HEAT_RECOVERY_FACTOR = 0.4;

export const schema = {
  id: 'engine-room-ventilation',
  name: 'Engine-room ventilation (ISO 8861)',
  category: 'maritime',
  summary: 'Combustion air and heat-removal airflow for an engine room from installed power and heat emissions, fan capacity and air changes.',
  related: ['generator-load', 'three-phase-power', 'pipe-insulation', 'heat-exchanger-lmtd'],
  assumptions: [
    'ISO 8861:1998 method: airflow for combustion q_c = q_dp + q_dg + q_b with m_ad = 0.0023 kg/(kW·s) for 2-stroke and 0.0020 for 4-stroke diesel engines (manufacturer data preferred), air density 1.13 kg/m³ (35 °C, 70 % RH, 101.3 kPa); boiler air from the fuel consumption (0.11 kg fuel per kWh of thermal capacity, 0.077 kg fuel per kg steam) and 15.7 kg air per kg fuel.',
    'Airflow for heat evacuation q_h = Σφ/(ρ c ΔT) − 0.4 (q_dp + q_dg) − q_b with c = 1.01 kJ/(kg·K) and ΔT = 12.5 K between the air inlet and the casing entrance; the 0.4 factor credits the heat carried away by the engines\' own combustion air with the usual duct arrangement — "in case of special arrangements the value of the factor should be considered".',
    'Heat emission of diesel engines φ = P × h_d/100 with h_d the maker\'s radiation/convection heat loss in % of MCR (large two-strokes about 1–1.5 %, medium-speed four-strokes 2–4 %; ISO 8861 clause 7.1 gives guidance curves when data are missing) — here an input; boiler heat emission as a percentage of capacity; electrical generator losses as P_el (1/η − 1); exhaust pipes, hot tanks, electrical installations and other components as entered kilowatts.',
    'Total airflow Q is the larger of q_c + q_h and 1.5 q_c (combustion air plus 50 %); calculations are for simultaneous maximum rating of all machinery at sea; stand-by generators are excluded; equipment inside the casing/funnel is excluded; separate spaces (purifier rooms, auxiliary engine rooms) are calculated separately.',
    'Air changes per hour and fan duties are derived quantities (room volume and number of supply fans entered); ISO 8861 does not set an air-change requirement, and the exhaust (natural through the casing or mechanical) is not sized here.',
    'No allowance for tropical over-temperature beyond 35 °C ambient, for inert-gas or cargo-area requirements, or for the SOLAS/class requirement that ventilation is independent of other spaces.',
  ],
  notes: [
    'Verification 2026-10-30: constants transcribed from the ISO 8861:1998 text (clauses 5.1–6.3): m_ad 0.0023/0.0020, ρ 1.13, c 1.01, ΔT 12.5, factor 0.4, m_fs 0.077 kg/kg steam, m_af 15.7; the boiler thermal-capacity fuel rate printed as "0,11 kg s⁻¹ kW⁻¹" in the sample is interpreted as 0.11 kg per kWh (the only physically consistent reading, ≈ 30 % boiler efficiency margin over 42.7 MJ/kg fuel).',
    'Design decision: heat-loss percentages are inputs with typical ranges rather than the clause 7.1 guidance curve, which is not reproducible from the standard\'s preview.',
    'Verification: 10 MW two-stroke + 3 MW generators + 2 MW boiler default gives q_c 26.5 m³/s and Q 61.7 m³/s (222 000 m³/h), 14.8 air changes per hour in 15 000 m³ — in the usual 15–30 range for merchant-ship engine rooms.',
  ],
  sources: [
    'ISO 8861:1998, Shipbuilding — Engine-room ventilation in diesel-engined ships — Design requirements and basis of calculations, clauses 4–6',
    'MAN Energy Solutions and Wärtsilä project guides — engine radiation heat and combustion air data (percentage heat loss, specific air consumption)',
    'Heinen & Hopman, "Engine room ventilation explained" (2022) — application notes on ISO 8861 constants',
    'SOLAS Ch. II-1 Reg. 35 and class rules — ventilation of machinery spaces (requirements, not calculation)',
  ],
  inputs: [
    { id: 'main_power_kw', label: 'Main engine(s) MCR P_dp', group: 'power', unit: 'kW', default: 10000, min: 0, max: 120000 },
    { id: 'main_type', label: 'Main engine type', type: 'select', default: 'two_stroke', options: [{ value: 'two_stroke', label: '2-stroke (m_ad 0.0023 kg/kWs)' }, { value: 'four_stroke', label: '4-stroke (m_ad 0.0020 kg/kWs)' }] },
    { id: 'main_heat_pct', label: 'Main engine heat loss to the room h_d', group: 'ratio', unit: 'pct', default: 1.5, min: 0, max: 15, help: 'Maker data; large 2-stroke ≈ 1–1.5 %, medium-speed 2–4 %.' },
    { id: 'gen_power_kw', label: 'Diesel generator engines running at sea (MCR, excluding stand-by) P_dg', group: 'power', unit: 'kW', default: 3000, min: 0, max: 50000 },
    { id: 'gen_type', label: 'Generator engine type', type: 'select', default: 'four_stroke', options: [{ value: 'two_stroke', label: '2-stroke (0.0023)' }, { value: 'four_stroke', label: '4-stroke (0.0020)' }] },
    { id: 'gen_heat_pct', label: 'Generator engine heat loss h_d', group: 'ratio', unit: 'pct', default: 3, min: 0, max: 15 },
    { id: 'alternator_eff', label: 'Alternator efficiency (electrical losses to the room)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.95, min: 0.8, max: 1 },
    { id: 'boiler_kw', label: 'Oil-fired boiler / thermal fluid heater capacity Q_b (0 = none)', group: 'power', unit: 'kW', default: 2000, min: 0, max: 50000 },
    { id: 'boiler_heat_pct', label: 'Boiler heat loss to the room', group: 'ratio', unit: 'pct', default: 1, min: 0, max: 10 },
    { id: 'exhaust_kw', label: 'Heat from exhaust pipes and exhaust-gas boilers φ_ep', group: 'power', unit: 'kW', default: 100, min: 0, max: 5000 },
    { id: 'pipes_kw', label: 'Heat from steam and condensate pipes φ_p', group: 'power', unit: 'kW', default: 30, min: 0, max: 5000 },
    { id: 'electrical_kw', label: 'Heat from electrical installations φ_el (switchboards, motors, lighting)', group: 'power', unit: 'kW', default: 50, min: 0, max: 5000 },
    { id: 'tanks_kw', label: 'Heat from hot tanks φ_t', group: 'power', unit: 'kW', default: 20, min: 0, max: 5000 },
    { id: 'other_kw', label: 'Other components φ_o (purifiers, compressors, hydraulics)', group: 'power', unit: 'kW', default: 30, min: 0, max: 5000 },
    { id: 'room_volume_m3', label: 'Engine room volume (for air changes)', group: 'volume', unit: 'm3', default: 15000, min: 10, max: 500000 },
    { id: 'fans', label: 'Number of supply fans', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 20, integer: true },
  ],
  outputs: [
    { id: 'q_main_m3_s', label: 'Combustion air, main engine(s) q_dp', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'q_gen_m3_s', label: 'Combustion air, generator engines q_dg', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'q_boiler_m3_s', label: 'Combustion air, boiler q_b', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'q_combustion_m3_s', label: 'Total combustion air q_c', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'heat_total_kw', label: 'Total heat emission Σφ', group: 'power', unit: 'kW' },
    { id: 'heat_main_kw', label: 'of which main engine(s)', group: 'power', unit: 'kW' },
    { id: 'heat_gen_kw', label: 'of which generator engines + alternators', group: 'power', unit: 'kW' },
    { id: 'q_heat_gross_m3_s', label: 'Airflow to remove Σφ at 12.5 K, before the 0.4 credit', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'q_heat_m3_s', label: 'Airflow for heat evacuation q_h (after credits)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'q_total_m3_s', label: 'Total supply airflow Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'governing', label: 'Governing criterion', type: 'text' },
    { id: 'q_min_m3_s', label: 'Minimum 1.5 × q_c', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'air_changes_h', label: 'Air changes per hour', group: 'dimensionless', unit: 'none' },
    { id: 'per_fan_m3_s', label: 'Duty per supply fan', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'exhaust_m3_s', label: 'Air leaving via casing/exhaust fans (Q − q_c)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'temperature_rise_k', label: 'Resulting temperature rise with Q (if Q > q_c + q_h)', group: 'temperature_difference', unit: 'K' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      q_main_m3_s: '20.35 m³/s',
      q_combustion_m3_s: '26.5 m³/s',
      heat_total_kw: '640 kW',
      heat_main_kw: '150 kW',
      q_heat_gross_m3_s: '44.9 m³/s',
      q_heat_m3_s: '33.7 m³/s',
      q_total_m3_s: '60.3 m³/s',
      air_changes_h: '14.5',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.main_type, Object.keys(M_AD), 'main_type', 'Main engine type');
  assertOneOf(i.gen_type, Object.keys(M_AD), 'gen_type', 'Generator engine type');
  for (const id of ['main_power_kw', 'gen_power_kw', 'boiler_kw', 'exhaust_kw', 'pipes_kw', 'electrical_kw', 'tanks_kw', 'other_kw']) assertNonNegative(i[id], id, id);
  assertRange(i.main_heat_pct, 0, 30, 'main_heat_pct', 'Main engine heat loss');
  assertRange(i.gen_heat_pct, 0, 30, 'gen_heat_pct', 'Generator heat loss');
  assertRange(i.boiler_heat_pct, 0, 30, 'boiler_heat_pct', 'Boiler heat loss');
  assertRange(i.alternator_eff, 0.5, 1, 'alternator_eff', 'Alternator efficiency');
  assertPositive(i.room_volume_m3, 'room_volume_m3', 'Room volume');
  assertInteger(i.fans, 'fans', 'Number of fans');
  assertRange(i.fans, 1, 50, 'fans', 'Number of fans');
  if (i.main_power_kw + i.gen_power_kw + i.boiler_kw <= 0) throw new Error('No machinery entered: give at least one engine or boiler power');

  const rho = AIR_DENSITY_KG_M3;
  const qMain = (i.main_power_kw * M_AD[i.main_type]) / rho;
  const qGen = (i.gen_power_kw * M_AD[i.gen_type]) / rho;
  const qBoiler = (i.boiler_kw * (BOILER_FUEL_KG_PER_KWH / 3600) * BOILER_AIR_KG_PER_KG_FUEL) / rho;
  const qC = qMain + qGen + qBoiler;

  const heatMain = (i.main_power_kw * i.main_heat_pct) / 100;
  const genElectrical = i.gen_power_kw * i.alternator_eff;
  const heatGen = (i.gen_power_kw * i.gen_heat_pct) / 100 + genElectrical * (1 / i.alternator_eff - 1);
  const heatBoiler = (i.boiler_kw * i.boiler_heat_pct) / 100;
  const heatTotal = heatMain + heatGen + heatBoiler + i.exhaust_kw + i.pipes_kw + i.electrical_kw + i.tanks_kw + i.other_kw;
  const qHeatGross = heatTotal / (rho * AIR_SPECIFIC_HEAT_KJ_KGK * TEMPERATURE_RISE_K);
  const qH = qHeatGross - HEAT_RECOVERY_FACTOR * (qMain + qGen) - qBoiler;
  const qA = qC + qH;
  const qB = 1.5 * qC;
  const Q = Math.max(qA, qB);
  const governing = qA >= qB ? `Combustion + heat evacuation: Q = q_c + q_h = ${Q.toFixed(2)} m³/s (1.5 q_c would be ${qB.toFixed(2)})` : `Minimum rule: Q = 1.5 q_c = ${Q.toFixed(2)} m³/s (q_c + q_h is only ${qA.toFixed(2)})`;
  const riseWithQ = heatTotal / (rho * AIR_SPECIFIC_HEAT_KJ_KGK * (Q - qBoiler + HEAT_RECOVERY_FACTOR * (qMain + qGen) - qC + qC - 0));
  // temperature rise if Q exceeds the heat-evacuation need: ΔT = Σφ / (ρ c (Q − q_c + 0.4(q_dp+q_dg) + q_b − q_b)) simplified below
  const effectiveHeatAir = Q - qC + HEAT_RECOVERY_FACTOR * (qMain + qGen) + qBoiler;
  const rise = heatTotal / (rho * AIR_SPECIFIC_HEAT_KJ_KGK * effectiveHeatAir);

  const warnings = [];
  if (qH < 0) warnings.push('Heat-evacuation airflow is negative: the combustion air alone carries away the heat; the 1.5 × q_c minimum governs.');
  if (i.main_heat_pct === 1.5 && i.gen_heat_pct === 3) warnings.push('Heat-loss percentages left at typical values: ISO 8861 requires the manufacturers\' data where available.');
  if (i.room_volume_m3 > 0 && (Q * 3600) / i.room_volume_m3 < 10) warnings.push('Fewer than 10 air changes per hour: check the heat emissions entered — engine rooms usually see 15–30.');
  if (i.gen_power_kw === 0) warnings.push('No generator engines: ISO 8861 counts all generators running at sea (not stand-by) — confirm the sea-going plant configuration.');
  warnings.push('Calculation at simultaneous MCR of all machinery, 35 °C ambient and 12.5 K rise (ISO 8861); separate spaces such as purifier rooms are calculated separately.');
  warnings.push('Fan duty is the supply side only; the exhaust via casing or extraction fans must pass Q − q_c and the space is to be kept at slight over-pressure.');

  return {
    outputs: {
      q_main_m3_s: qMain,
      q_gen_m3_s: qGen,
      q_boiler_m3_s: qBoiler,
      q_combustion_m3_s: qC,
      heat_total_kw: heatTotal,
      heat_main_kw: heatMain,
      heat_gen_kw: heatGen,
      q_heat_gross_m3_s: qHeatGross,
      q_heat_m3_s: qH,
      q_total_m3_s: Q,
      governing,
      q_min_m3_s: qB,
      air_changes_h: (Q * 3600) / i.room_volume_m3,
      per_fan_m3_s: Q / i.fans,
      exhaust_m3_s: Q - qC,
      temperature_rise_k: Number.isFinite(rise) && effectiveHeatAir > 0 ? rise : null,
    },
    warnings,
  };
}
