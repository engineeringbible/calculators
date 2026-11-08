/**
 * latent-sensible-heat/calc.js — sensible, latent and total heat of an airstream between two states (exact by
 * psychrometric enthalpy, and by the 1.08 / 4840 / 4.5 rules), sensible heat ratio, coil load and condensate; and the
 * heat to warm, melt, boil or cool water through its phase changes at atmospheric pressure.
 *
 * Air: ṁ = Q / v1;  Q_t = ṁ (h1 − h2);  Q_l = ṁ (W1 − W2)(2501 + 1.86 t1);  Q_s = ṁ (1.006 + 1.86 W2)(t1 − t2);
 * coil load = ṁ [(h1 − h2) − (W1 − W2) h_w2] (ASHRAE Fundamentals Ch. 1).  Rules: Q_s = 1.08 (or 1.10) cfm ΔT,
 * Q_l = 4840 cfm ΔW, Q_t = 4.5 cfm Δh (ASHRAE Fundamentals Ch. 18).
 * Water: H(solid, T) = c_ice T;  H(liquid, T) = L_f + c_w T;  H(vapour, T) = L_f + 100 c_w + L_v + c_s (T − 100).
 * Schema units: SI — m³/s, °C, W, kg, J, J/kg, J/(kg·K).
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';
import { saturationPressure, humidityRatio, specificVolume, enthalpy, standardPressure } from '../shared/psychro.js';

const CFM = 0.028316846592 / 60;
const BTU_H = 0.29307107017;
const KJKG_BTULB = 2.326;

/** Humidity ratio (kg/kg) from dry bulb and wet bulb, ASHRAE Fundamentals Ch. 1 eqs. 33 and 35. */
function wFromWetBulb(t, tw, p) {
  const ws = humidityRatio(saturationPressure(tw), p);
  return tw >= 0
    ? ((2501 - 2.326 * tw) * ws - 1.006 * (t - tw)) / (2501 + 1.86 * t - 4.186 * tw)
    : ((2830 - 0.24 * tw) * ws - 1.006 * (t - tw)) / (2830 + 1.86 * t - 2.1 * tw);
}

function airState(t, hum, rh, tw, p, name) {
  if (hum === 'rh') {
    const pw = rh * saturationPressure(t);
    if (pw >= p) throw new Error(`${name} relative humidity: the vapour pressure reaches the total pressure.`);
    return humidityRatio(pw, p);
  }
  if (tw > t + 1e-9) throw new Error(`${name} wet bulb: it cannot be above the dry bulb temperature.`);
  const w = wFromWetBulb(t, tw, p);
  if (w < 0) throw new Error(`${name} wet bulb: too low for this dry bulb; the air would have negative moisture.`);
  return w;
}

/** Enthalpy of water (J/kg) relative to ice at 0 °C, in the given phase at T (°C), at atmospheric pressure. */
export function waterEnthalpy(phase, t, c) {
  if (phase === 'solid') return c.ice * t;
  if (phase === 'liquid') return c.lf + c.water * t;
  return c.lf + 100 * c.water + c.lv + c.steam * (t - 100);
}

const PHASES = { solid: 'ice', liquid: 'water', vapour: 'steam' };

export const schema = {
  id: 'latent-sensible-heat',
  name: 'Latent and sensible heat calculator (air and water)',
  category: 'hvac',
  summary: 'Sensible, latent and total heat of an airstream by psychrometrics and the 1.08 and 4840 rules, SHR and coil load; and the heat to melt or boil water.',
  related: ['mixed-air-temperature', 'dew-point', 'btu-ac-size', 'specific-heat'],
  assumptions: [
    'The airflow is the volume at the entering condition; it is converted to dry air mass with the moist-air specific volume (ASHRAE Fundamentals Ch. 1) at the standard pressure of the altitude entered.',
    'The exact split takes the latent heat as the enthalpy change of removing the moisture at the entering temperature, (W1 − W2)(2 501 + 1.86 t1), and the sensible heat as the cooling of the drier air; the two add up to the total enthalpy change.',
    'The rules use standard air (0.075 lb/ft³): 1.08 Btu/h per cfm per °F with c_p = 0.24, or 1.10 with the moist-air c_p of ASHRAE Fundamentals Ch. 18, 4 840 per cfm per lb/lb of humidity ratio and 4.5 per cfm per Btu/lb of enthalpy; SI equivalents 1.21 or 1.23 W per L/s per K, 3 010 and 1.20.',
    'Positive heat is removed from the air (cooling); a negative value means heat or moisture is added. The coil load subtracts the enthalpy of the condensate leaving at the air outlet temperature.',
    'Water phase changes are at atmospheric pressure: melting at 0 °C and boiling at 100 °C, with constant specific heats; the latent heats default to 334 kJ/kg for fusion and 2 257 kJ/kg for vaporisation and can be changed.',
  ],
  notes: [
    'Verification 2026-11-08: 1 000 cfm cooled from 80 °F db / 67 °F wb to 55 °F db / 54 °F wb at sea level: sensible 26 440 Btu/h, latent 12 040 Btu/h, total 38 480 Btu/h, SHR 0.69, coil load 3.19 tons, condensate 11.0 lb/h; the 1.08 rule gives 27 000 Btu/h sensible (standard air is denser than air at 80 °F). Checked by hand.',
  ],
  sources: [
    'ASHRAE Handbook — Fundamentals (2017), Ch. 1 Psychrometrics (enthalpy eq. 30, wet bulb eqs. 33/35, moist-air cooling and dehumidification) and Ch. 18 (q_s = 1.10 Q Δt, q_l = 4 840 Q ΔW, q_t = 4.5 Q Δh; SI 1.23, 3 010, 1.20)',
    'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers, 9th ed., Ch. 20 (specific and latent heats of water; heating 1 g of ice at −30 °C to steam at 120 °C needs 3.11 kJ)',
    'IAPWS-IF97: enthalpy of vaporisation of water at 1 atm, 2 256.5 kJ/kg (the 2 257 kJ/kg default)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'air', options: [{ value: 'air', label: 'Sensible and latent heat of an airstream' }, { value: 'water', label: 'Heat to warm, melt or boil water (phase change)' }] },
    { id: 'flow_m3s', label: 'Airflow (at the entering condition)', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 1000 * CFM, min: 1e-6, max: 1000, visibleWhen: { mode: 'air' } },
    { id: 'altitude_m', label: 'Altitude (sets the air pressure)', group: 'length', unit: 'm', display: 'ft', default: 0, min: -400, max: 6000, visibleWhen: { mode: 'air' } },
    { id: 'hum', label: 'Humidity given as', type: 'select', default: 'wb', options: [{ value: 'rh', label: 'Relative humidity' }, { value: 'wb', label: 'Wet bulb temperature' }], visibleWhen: { mode: 'air' } },
    { id: 't1_c', label: 'Entering air dry bulb', group: 'temperature', unit: 'C', display: 'F', default: 26.666666666667, min: -40, max: 60, visibleWhen: { mode: 'air' } },
    { id: 'rh1', label: 'Entering air relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0, max: 1, visibleWhen: { mode: 'air', hum: 'rh' } },
    { id: 'wb1_c', label: 'Entering air wet bulb', group: 'temperature', unit: 'C', display: 'F', default: 19.444444444444, min: -40, max: 60, visibleWhen: { mode: 'air', hum: 'wb' } },
    { id: 't2_c', label: 'Leaving air dry bulb', group: 'temperature', unit: 'C', display: 'F', default: 12.777777777778, min: -40, max: 60, visibleWhen: { mode: 'air' } },
    { id: 'rh2', label: 'Leaving air relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0, max: 1, visibleWhen: { mode: 'air', hum: 'rh' } },
    { id: 'wb2_c', label: 'Leaving air wet bulb', group: 'temperature', unit: 'C', display: 'F', default: 12.222222222222, min: -40, max: 60, visibleWhen: { mode: 'air', hum: 'wb' } },
    { id: 'rule', label: 'Rule-of-thumb sensible constant', type: 'select', default: 'classic', options: [{ value: 'classic', label: '1.08 (c_p 0.24, the classic rule)' }, { value: 'ashrae', label: '1.10 (ASHRAE Fundamentals Ch. 18)' }], visibleWhen: { mode: 'air' } },
    { id: 'mass_kg', label: 'Mass of water or ice', group: 'mass', unit: 'kg', display: 'kg', default: 1, min: 1e-6, max: 1e7, visibleWhen: { mode: 'water' } },
    { id: 'phase1', label: 'Starting state', type: 'select', default: 'solid', options: [{ value: 'solid', label: 'Ice' }, { value: 'liquid', label: 'Liquid water' }, { value: 'vapour', label: 'Steam' }], visibleWhen: { mode: 'water' } },
    { id: 'tw1_c', label: 'Starting temperature', group: 'temperature', unit: 'C', default: -10, min: -100, max: 500, visibleWhen: { mode: 'water' } },
    { id: 'phase2', label: 'Final state', type: 'select', default: 'liquid', options: [{ value: 'solid', label: 'Ice' }, { value: 'liquid', label: 'Liquid water' }, { value: 'vapour', label: 'Steam' }], visibleWhen: { mode: 'water' } },
    { id: 'tw2_c', label: 'Final temperature', group: 'temperature', unit: 'C', default: 20, min: -100, max: 500, visibleWhen: { mode: 'water' } },
    { id: 'c_ice', label: 'Specific heat of ice', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 2090, min: 1000, max: 3000, visibleWhen: { mode: 'water' } },
    { id: 'c_water', label: 'Specific heat of water', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 4190, min: 3500, max: 4500, visibleWhen: { mode: 'water' } },
    { id: 'c_steam', label: 'Specific heat of steam', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 2010, min: 1500, max: 3000, visibleWhen: { mode: 'water' } },
    { id: 'lf', label: 'Latent heat of fusion', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', default: 334000, min: 300000, max: 350000, visibleWhen: { mode: 'water' } },
    { id: 'lv', label: 'Latent heat of vaporisation', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', default: 2257000, min: 2000000, max: 2600000, visibleWhen: { mode: 'water' } },
    { id: 'power_w', label: 'Heater or cooler power (optional, for the time)', group: 'power', unit: 'W', display: 'kW', default: 0, min: 0, max: 1e8, visibleWhen: { mode: 'water' } },
  ],
  outputs: [
    { id: 'qs_w', label: 'Sensible heat (positive: removed from the air)', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'ql_w', label: 'Latent heat', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'qt_w', label: 'Total heat ṁ Δh', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'shr', label: 'Sensible heat ratio SHR', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'air' } },
    { id: 'coil_w', label: 'Coil load (net of condensate enthalpy)', group: 'power', unit: 'W', display: 'ton_r', visibleWhen: { mode: 'air' } },
    { id: 'condensate_kg_s', label: 'Condensate (water removed)', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', visibleWhen: { mode: 'air' } },
    { id: 'rule_qs_w', label: 'Sensible heat by the rule 1.08 (1.10) × cfm × ΔT', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'rule_ql_w', label: 'Latent heat by the rule 4 840 × cfm × ΔW', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'rule_qt_w', label: 'Total heat by the rule 4.5 × cfm × Δh', group: 'power', unit: 'W', display: 'btu_h', visibleWhen: { mode: 'air' } },
    { id: 'q_water_j', label: 'Heat to add (negative: to remove)', group: 'energy', unit: 'J', display: 'kJ', visibleWhen: { mode: 'water' } },
    { id: 'q_sens_j', label: 'Sensible part', group: 'energy', unit: 'J', display: 'kJ', visibleWhen: { mode: 'water' } },
    { id: 'q_lat_j', label: 'Latent part (melting, boiling)', group: 'energy', unit: 'J', display: 'kJ', visibleWhen: { mode: 'water' } },
    { id: 'steps', label: 'Steps', type: 'text', visibleWhen: { mode: 'water' } },
    { id: 'time_s', label: 'Time at the power entered', group: 'time', unit: 's', display: 'min', visibleWhen: { mode: 'water' } },
  ],
  example: {
    inputs: { mode: 'air', flow_m3s: [1000, 'cfm'], altitude_m: [0, 'ft'], hum: 'wb', t1_c: [80, 'F'], wb1_c: [67, 'F'], t2_c: [55, 'F'], wb2_c: [54, 'F'], rule: 'classic' },
    results: { qs_w: '26 440 Btu/h', ql_w: '12 040 Btu/h', qt_w: '38 480 Btu/h', shr: '0.69', coil_w: '3.19 TR', rule_qs_w: '27 000 Btu/h' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['air', 'water'], 'mode', 'Calculate');
  assertOneOf(x.hum, ['rh', 'wb'], 'hum', 'Humidity given as');
  assertOneOf(x.rule, ['classic', 'ashrae'], 'rule', 'Rule-of-thumb sensible constant');
  assertOneOf(x.phase1, Object.keys(PHASES), 'phase1', 'Starting state');
  assertOneOf(x.phase2, Object.keys(PHASES), 'phase2', 'Final state');
  const out = {
    qs_w: null, ql_w: null, qt_w: null, shr: null, coil_w: null, condensate_kg_s: null, rule_qs_w: null, rule_ql_w: null, rule_qt_w: null,
    q_water_j: null, q_sens_j: null, q_lat_j: null, steps: null, time_s: null,
  };
  const warnings = [];
  if (x.mode === 'air') {
    const q = assertPositive(x.flow_m3s, 'flow_m3s', 'Airflow');
    const p = standardPressure(assertRange(x.altitude_m, -400, 6000, 'altitude_m', 'Altitude'));
    const t1 = assertRange(x.t1_c, -40, 60, 't1_c', 'Entering air dry bulb');
    const t2 = assertRange(x.t2_c, -40, 60, 't2_c', 'Leaving air dry bulb');
    const w1 = airState(t1, x.hum, assertRange(x.rh1, 0, 1, 'rh1', 'Entering air relative humidity'), assertRange(x.wb1_c, -40, 60, 'wb1_c', 'Entering air wet bulb'), p, 'Entering air');
    const w2 = airState(t2, x.hum, assertRange(x.rh2, 0, 1, 'rh2', 'Leaving air relative humidity'), assertRange(x.wb2_c, -40, 60, 'wb2_c', 'Leaving air wet bulb'), p, 'Leaving air');
    const m = q / specificVolume(t1, w1, p);
    const dh = enthalpy(t1, w1) - enthalpy(t2, w2); // kJ/kg
    out.qt_w = m * dh * 1000;
    out.ql_w = m * (w1 - w2) * (2501 + 1.86 * t1) * 1000;
    out.qs_w = m * (1.006 + 1.86 * w2) * (t1 - t2) * 1000;
    out.shr = Math.abs(out.qt_w) > 1e-9 ? out.qs_w / out.qt_w : null;
    out.condensate_kg_s = m * (w1 - w2);
    out.coil_w = m * (dh - (w1 - w2) * 4.186 * t2) * 1000;
    const cfm = q / CFM;
    out.rule_qs_w = (x.rule === 'ashrae' ? 1.1 : 1.08) * cfm * (t1 - t2) * 1.8 * BTU_H;
    out.rule_ql_w = 4840 * cfm * (w1 - w2) * BTU_H;
    out.rule_qt_w = 4.5 * cfm * (dh / KJKG_BTULB) * BTU_H;
    if (w2 > w1 + 1e-12 && t2 < t1) warnings.push('The leaving air is cooler but more humid than the entering air: this is evaporative cooling or humidification, not a cooling coil; check the states.');
    if (out.shr !== null && (out.shr > 1.5 || out.shr < -0.5)) warnings.push('The sensible and latent heats have opposite signs, so the sensible heat ratio is outside 0 to 1.');
    if (x.altitude_m > 600) warnings.push('Above about 2 000 ft (600 m) the rule constants overstate the heat: they assume sea-level air density. Use the exact values.');
  } else {
    const mass = assertPositive(x.mass_kg, 'mass_kg', 'Mass');
    const ta = assertRange(x.tw1_c, -100, 500, 'tw1_c', 'Starting temperature');
    const tb = assertRange(x.tw2_c, -100, 500, 'tw2_c', 'Final temperature');
    const c = {
      ice: assertRange(x.c_ice, 1000, 3000, 'c_ice', 'Specific heat of ice'),
      water: assertRange(x.c_water, 3500, 4500, 'c_water', 'Specific heat of water'),
      steam: assertRange(x.c_steam, 1500, 3000, 'c_steam', 'Specific heat of steam'),
      lf: assertRange(x.lf, 300000, 350000, 'lf', 'Latent heat of fusion'),
      lv: assertRange(x.lv, 2000000, 2600000, 'lv', 'Latent heat of vaporisation'),
    };
    const power = assertNonNegative(x.power_w, 'power_w', 'Heater or cooler power');
    const check = (phase, t, label) => {
      if (phase === 'solid' && t > 0) throw new Error(`${label}: ice must be at or below 0 °C at atmospheric pressure.`);
      if (phase === 'liquid' && (t < 0 || t > 100)) throw new Error(`${label}: liquid water must be between 0 and 100 °C at atmospheric pressure.`);
      if (phase === 'vapour' && t < 100) throw new Error(`${label}: steam must be at or above 100 °C at atmospheric pressure.`);
    };
    check(x.phase1, ta, 'Starting temperature');
    check(x.phase2, tb, 'Final temperature');
    const q = mass * (waterEnthalpy(x.phase2, tb, c) - waterEnthalpy(x.phase1, ta, c));
    const rank = { solid: 0, liquid: 1, vapour: 2 };
    const r1 = rank[x.phase1]; const r2 = rank[x.phase2];
    const level = (r) => (r >= 1 ? c.lf : 0) + (r >= 2 ? c.lv : 0);
    const lat = mass * (level(r2) - level(r1));
    // the steps, in the order the water passes through them
    const steps = [];
    const up = q >= 0 || r2 > r1;
    const fmt = (j) => `${Math.abs(j / 1000) >= 100 ? Math.round(j / 1000) : Number((j / 1000).toPrecision(3))} kJ`;
    const sens = (from, to, cp, name) => { if (Math.abs(to - from) > 1e-12) steps.push(`${name} ${from} → ${to} °C: ${fmt(mass * cp * (to - from))}`); };
    if (r1 === r2) sens(ta, tb, [c.ice, c.water, c.steam][r1], ['ice', 'water', 'steam'][r1]);
    else if (up) {
      if (r1 === 0) { sens(ta, 0, c.ice, 'ice'); steps.push(`melting: ${fmt(mass * c.lf)}`); }
      if (r1 <= 1 && r2 >= 1) sens(r1 === 1 ? ta : 0, r2 === 1 ? tb : 100, c.water, 'water');
      if (r2 === 2) { steps.push(`boiling: ${fmt(mass * c.lv)}`); sens(100, tb, c.steam, 'steam'); }
    } else {
      if (r1 === 2) { sens(ta, 100, c.steam, 'steam'); steps.push(`condensing: ${fmt(-mass * c.lv)}`); }
      if (r1 >= 1 && r2 <= 1) sens(r1 === 1 ? ta : 100, r2 === 1 ? tb : 0, c.water, 'water');
      if (r2 === 0) { steps.push(`freezing: ${fmt(-mass * c.lf)}`); sens(0, tb, c.ice, 'ice'); }
    }
    out.q_water_j = q;
    out.q_lat_j = lat;
    out.q_sens_j = q - lat;
    out.steps = steps.length ? steps.join('; ') : 'No change of state or temperature';
    out.time_s = power > 0 ? Math.abs(q) / power : null;
    if (r1 > r2 && q > 0) warnings.push('The final state has less latent heat but the total is positive: check the states and temperatures.');
  }
  return { outputs: out, warnings };
}
