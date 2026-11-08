/**
 * boiler-efficiency/calc.js — steam boiler efficiency by the direct method (heat to steam over fuel heat input, on
 * HHV and LHV basis) and by the indirect method (flue gas loss by the Siegert formula, radiation and blowdown losses).
 *
 * Direct: η = ṁ_s (h_s − h_fw) / (ṁ_f × CV), steam and feedwater enthalpies by IAPWS-IF97.
 * Indirect: q_A = (t_A − t_L) (A2 / (21 − O2) + B) (1. BImSchV Anlage 2, LHV basis); η0 = 1 − q_A − q_rad;
 * blowdown share r = b/(1−b) (h_f − h_fw) / [(h_s − h_fw) + b/(1−b) (h_f − h_fw)]; η_LHV = η0 (1 − r); η_HHV = η_LHV × LHV/HHV.
 * Schema units: SI — Pa, °C, kg/s, J/kg, W, fractions.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';
import { tsat, region1, region2, regionOf } from '../shared/iapws97.js';

const P_ATM = 101325;

/**
 * Fuels: [label, LHV MJ/kg, HHV MJ/kg, Siegert A2, Siegert B]. Heating values from GREET 1.8d.1 (ORNL Biomass Energy
 * Data Book 2011, Appendix A); Siegert constants from the 1. BImSchV Anlage 2 (heating oil, natural gas, LPG) or null.
 */
export const FUELS = {
  natural_gas: ['Natural gas', 47.141, 52.225, 0.66, 0.009],
  lpg: ['LPG', 46.607, 50.152, 0.63, 0.008],
  propane: ['Propane', 46.296, 50.235, 0.63, 0.008],
  heating_oil: ['Heating oil / diesel (No. 2)', 42.791, 45.766, 0.68, 0.007],
  residual_oil: ['Residual (heavy) fuel oil', 39.466, 42.210, null, null],
  coal: ['Bituminous coal (as received)', 26.122, 27.267, null, null],
  wood: ['Wood, dry', 19.551, 20.589, null, null],
  custom: ['Other: enter the heating values', null, null, null, null],
};

/** Steam, saturated liquid at the boiler pressure and feedwater enthalpies in kJ/kg. */
export function enthalpies(pAbsPa, state, dryness, tSteamC, tFeedC) {
  const p = pAbsPa / 1e6;
  const ts = tsat(p);
  const hf = region1(p, ts).h;
  const hg = region2(p, ts).h;
  let hs;
  if (state === 'saturated') hs = hf + dryness * (hg - hf);
  else {
    const T = tSteamC + 273.15;
    if (T <= ts + 1e-6) throw new Error(`Steam temperature: superheated steam must be above the saturation temperature, ${(ts - 273.15).toFixed(1)} °C at this pressure.`);
    if (regionOf(p, T) !== 2) throw new Error('Steam temperature: this state is near the critical point (IAPWS-IF97 region 3), outside the range covered.');
    hs = region2(p, T).h;
  }
  const tfw = tFeedC + 273.15;
  if (tfw >= ts) throw new Error(`Feedwater temperature: it must be below the saturation temperature, ${(ts - 273.15).toFixed(1)} °C at this pressure.`);
  return { hs, hf, hfw: region1(p, tfw).h, tsC: ts - 273.15 };
}

export const schema = {
  id: 'boiler-efficiency',
  name: 'Boiler efficiency calculator (direct and indirect method)',
  category: 'thermal',
  summary: 'Steam boiler efficiency by the direct method, steam heat over fuel input on HHV and LHV basis, or the indirect method with Siegert flue gas loss.',
  related: ['steam-table', 'specific-heat', 'heat-loss', 'fuel-lcv-co2'],
  assumptions: [
    'Steam and feedwater enthalpies come from IAPWS-IF97 at the boiler pressure (atmospheric pressure 1.01325 bar added to the gauge pressure); the feedwater is compressed liquid at that pressure.',
    'The direct method counts only the heat in the steam as output, so blowdown, flue gas and casing losses all appear as losses. Fuel heating values are the GREET values (ORNL Biomass Energy Data Book); enter measured values from a fuel analysis where available, especially for coal and wood.',
    'The Siegert formula gives the sensible flue gas loss on the lower heating value basis for oil and gas firing (1. BImSchV); it assumes complete combustion and a flue gas above its dew point, and does not include unburnt fuel (CO) losses.',
    'Efficiency on the HHV basis is the LHV efficiency times LHV/HHV: the latent heat of the water vapour in the flue gas is then a loss. US practice and ASME PTC 4 use HHV; European practice and EN 12952-15 often use LHV.',
    'The radiation and convection loss is entered as a percentage of the fuel input at full load: about 0.5 to 2 %, higher at part load. Blowdown leaves as saturated water at the boiler pressure.',
  ],
  notes: [
    'Verification 2026-11-08: BEE direct-method example, 8 t/h of saturated steam at 10 kg/cm² g, feedwater 85 °C, 1.6 t/h of coal with GCV 4 000 kcal/kg: h_s = 2 780 kJ/kg, h_fw = 356.7 kJ/kg, heat to steam 5 385 kW, fuel input 7 443 kW, efficiency 72.3 % (BEE prints 72.5 % with 665 kcal/kg steam). Checked by hand.',
  ],
  sources: [
    'Bureau of Energy Efficiency (India), Energy Performance Assessment for Equipment and Utility Systems, Book 4 Ch. 1 Boilers: direct and indirect methods (worked direct-method example)',
    'IAPWS R7-97(2012) Revised Release on the IAPWS Industrial Formulation 1997 (regions 1, 2 and 4) for steam and feedwater enthalpy',
    'Erste Verordnung zur Durchführung des Bundes-Immissionsschutzgesetzes (1. BImSchV, 2010), Anlage 2 Nr. 3.4: Siegert formula q_A = (t_A − t_L)(A2/(21 − O2) + B) with A2 and B for heating oil, natural gas and LPG',
    'ORNL Biomass Energy Data Book (2011), Appendix A: Lower and Higher Heating Values of Gas, Liquid and Solid Fuels (GREET 1.8d.1, Argonne National Laboratory)',
  ],
  inputs: [
    { id: 'method', label: 'Method', type: 'select', default: 'direct', options: [{ value: 'direct', label: 'Direct: steam output over fuel input' }, { value: 'indirect', label: 'Indirect: 100 % minus losses (flue gas analysis)' }] },
    { id: 'fuel', label: 'Fuel', type: 'select', default: 'natural_gas', options: Object.entries(FUELS).map(([value, [label]]) => ({ value, label })) },
    { id: 'lhv_j_kg', label: 'Lower heating value LHV (net calorific value)', group: 'specific_energy', unit: 'J_kg', display: 'MJ_kg', default: 0, min: 0, max: 1.5e8, visibleWhen: { fuel: 'custom' }, help: 'Leave at 0 if only the gross value is known; the LHV results are then not shown.' },
    { id: 'hhv_j_kg', label: 'Higher heating value HHV (gross calorific value)', group: 'specific_energy', unit: 'J_kg', display: 'MJ_kg', default: 2e7, min: 1e6, max: 1.5e8, visibleWhen: { fuel: 'custom' } },
    { id: 'p_steam_pa', label: 'Steam pressure, gauge', group: 'pressure', unit: 'Pa', display: 'bar', default: 1e6, min: 0, max: 1.6e7 },
    { id: 'steam_state', label: 'Steam leaving the boiler', type: 'select', default: 'saturated', options: [{ value: 'saturated', label: 'Saturated (with dryness fraction)' }, { value: 'superheated', label: 'Superheated (temperature)' }] },
    { id: 'dryness', label: 'Dryness fraction of the steam', group: 'ratio', unit: 'frac', default: 1, min: 0.5, max: 1, visibleWhen: { steam_state: 'saturated' } },
    { id: 't_steam_c', label: 'Steam temperature', group: 'temperature', unit: 'C', default: 250, min: 0, max: 800, visibleWhen: { steam_state: 'superheated' } },
    { id: 't_feed_c', label: 'Feedwater temperature', group: 'temperature', unit: 'C', default: 80, min: 0, max: 350 },
    { id: 'steam_kg_s', label: 'Steam flow', group: 'mass_flow', unit: 'kg_s', display: 'kg_h', default: 5000 / 3600, min: 1e-5, max: 1000, visibleWhen: { method: 'direct' } },
    { id: 'fuel_kg_s', label: 'Fuel flow', group: 'mass_flow', unit: 'kg_s', display: 'kg_h', default: 290 / 3600, min: 1e-6, max: 1000, visibleWhen: { method: 'direct' }, help: 'Natural gas: 1 m³ at 0 °C and 1 atm weighs about 0.78 kg.' },
    { id: 't_flue_c', label: 'Flue gas temperature', group: 'temperature', unit: 'C', default: 180, min: 20, max: 600, visibleWhen: { method: 'indirect' } },
    { id: 't_air_c', label: 'Combustion air temperature', group: 'temperature', unit: 'C', default: 20, min: -30, max: 300, visibleWhen: { method: 'indirect' } },
    { id: 'o2', label: 'Oxygen in the dry flue gas', group: 'ratio', unit: 'frac', display: 'pct', default: 0.03, min: 0, max: 0.18, visibleWhen: { method: 'indirect' } },
    { id: 'siegert', label: 'Siegert constants', type: 'select', default: 'table', options: [{ value: 'table', label: 'From the 1. BImSchV for the fuel (oil, gas, LPG)' }, { value: 'custom', label: 'Enter A2 and B' }], visibleWhen: { method: 'indirect' } },
    { id: 'a2', label: 'Siegert constant A2', group: 'dimensionless', unit: 'none', default: 0.66, min: 0.1, max: 2, visibleWhen: { method: 'indirect', siegert: 'custom' } },
    { id: 'b', label: 'Siegert constant B', group: 'dimensionless', unit: 'none', default: 0.009, min: 0, max: 0.1, visibleWhen: { method: 'indirect', siegert: 'custom' } },
    { id: 'radiation', label: 'Radiation and convection loss', group: 'ratio', unit: 'frac', display: 'pct', default: 0.01, min: 0, max: 0.1, visibleWhen: { method: 'indirect' } },
    { id: 'blowdown', label: 'Blowdown, share of feedwater', group: 'ratio', unit: 'frac', display: 'pct', default: 0.03, min: 0, max: 0.3, visibleWhen: { method: 'indirect' } },
  ],
  outputs: [
    { id: 'h_steam', label: 'Steam enthalpy h_s', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
    { id: 'h_feed', label: 'Feedwater enthalpy h_fw', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
    { id: 'heat_out_w', label: 'Heat to the steam', group: 'power', unit: 'W', display: 'kW', visibleWhen: { method: 'direct' } },
    { id: 'fuel_in_w', label: 'Fuel heat input (HHV)', group: 'power', unit: 'W', display: 'kW', visibleWhen: { method: 'direct' } },
    { id: 'evaporation', label: 'Evaporation ratio, kg steam per kg fuel', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { method: 'direct' } },
    { id: 'excess_air', label: 'Excess air (from O2)', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { method: 'indirect' } },
    { id: 'flue_loss', label: 'Flue gas loss (Siegert, LHV basis)', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { method: 'indirect' } },
    { id: 'blowdown_loss', label: 'Blowdown loss', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { method: 'indirect' } },
    { id: 'eff_hhv', label: 'Boiler efficiency, HHV (gross) basis', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'eff_lhv', label: 'Boiler efficiency, LHV (net) basis', group: 'ratio', unit: 'frac', display: 'pct' },
  ],
  example: {
    inputs: { method: 'direct', fuel: 'custom', lhv_j_kg: 0, hhv_j_kg: [4000 * 4.1868, 'kJ_kg'], p_steam_pa: [10, 'kgf_cm2'], steam_state: 'saturated', dryness: 1, t_feed_c: [85, 'C'], steam_kg_s: [8, 't_h'], fuel_kg_s: [1.6, 't_h'] },
    results: { h_steam: '2 780 kJ/kg', h_feed: '356.7 kJ/kg', heat_out_w: '5 385 kW', fuel_in_w: '7 443 kW', eff_hhv: '72.3 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.method, ['direct', 'indirect'], 'method', 'Method');
  assertOneOf(x.fuel, Object.keys(FUELS), 'fuel', 'Fuel');
  assertOneOf(x.steam_state, ['saturated', 'superheated'], 'steam_state', 'Steam leaving the boiler');
  assertOneOf(x.siegert, ['table', 'custom'], 'siegert', 'Siegert constants');
  const [, lhvTab, hhvTab, a2Tab, bTab] = FUELS[x.fuel];
  let lhv; let hhv;
  if (x.fuel === 'custom') {
    hhv = assertRange(x.hhv_j_kg, 1e6, 1.5e8, 'hhv_j_kg', 'Higher heating value');
    lhv = assertNonNegative(x.lhv_j_kg, 'lhv_j_kg', 'Lower heating value') || null;
    if (lhv !== null && lhv > hhv) throw new Error('Lower heating value: it cannot exceed the higher heating value.');
  } else { lhv = lhvTab * 1e6; hhv = hhvTab * 1e6; }
  const pg = assertRange(x.p_steam_pa, 0, 1.6e7, 'p_steam_pa', 'Steam pressure');
  const dry = assertRange(x.dryness, 0.5, 1, 'dryness', 'Dryness fraction');
  const tSteam = assertRange(x.t_steam_c, 0, 800, 't_steam_c', 'Steam temperature');
  const tFeed = assertRange(x.t_feed_c, 0, 350, 't_feed_c', 'Feedwater temperature');
  const { hs, hf, hfw } = enthalpies(pg + P_ATM, x.steam_state, dry, tSteam, tFeed);
  const out = {
    h_steam: hs * 1000, h_feed: hfw * 1000,
    heat_out_w: null, fuel_in_w: null, evaporation: null, excess_air: null, flue_loss: null, blowdown_loss: null, eff_hhv: null, eff_lhv: null,
  };
  const warnings = [];
  if (x.method === 'direct') {
    const ms = assertPositive(x.steam_kg_s, 'steam_kg_s', 'Steam flow');
    const mf = assertPositive(x.fuel_kg_s, 'fuel_kg_s', 'Fuel flow');
    const q = ms * (hs - hfw) * 1000;
    out.heat_out_w = q;
    out.fuel_in_w = mf * hhv;
    out.evaporation = ms / mf;
    out.eff_hhv = q / (mf * hhv);
    out.eff_lhv = lhv ? q / (mf * lhv) : null;
    if (out.eff_hhv > 1) throw new Error('Fuel flow: the steam carries more heat than the fuel supplies on the gross basis; check the flows and units.');
    if (out.eff_hhv < 0.4) warnings.push('Efficiency below 40 %: check the steam and fuel flow measurements before trusting this result.');
  } else {
    const ta = assertRange(x.t_flue_c, 20, 600, 't_flue_c', 'Flue gas temperature');
    const tl = assertRange(x.t_air_c, -30, 300, 't_air_c', 'Combustion air temperature');
    const o2 = assertRange(x.o2, 0, 0.18, 'o2', 'Oxygen in the dry flue gas') * 100;
    const rad = assertRange(x.radiation, 0, 0.1, 'radiation', 'Radiation and convection loss');
    const b = assertRange(x.blowdown, 0, 0.3, 'blowdown', 'Blowdown');
    let a2; let bb;
    if (x.siegert === 'custom') {
      a2 = assertRange(x.a2, 0.1, 2, 'a2', 'Siegert constant A2');
      bb = assertRange(x.b, 0, 0.1, 'b', 'Siegert constant B');
    } else {
      if (a2Tab === null) throw new Error('Siegert constants: the 1. BImSchV gives them only for heating oil, natural gas and LPG; choose "Enter A2 and B" for this fuel.');
      a2 = a2Tab; bb = bTab;
    }
    if (ta <= tl) throw new Error('Flue gas temperature: it must be above the combustion air temperature.');
    if (!lhv) throw new Error('Lower heating value: the Siegert flue gas loss is on the LHV basis; enter the lower heating value of the fuel.');
    const qa = ((ta - tl) * (a2 / (21 - o2) + bb)) / 100;
    const eta0 = 1 - qa - rad;
    if (eta0 <= 0) throw new Error('Flue gas temperature: the flue gas and radiation losses exceed 100 %; check the readings.');
    const bdPerSteam = (b / (1 - b)) * (hf - hfw);
    const r = bdPerSteam / (hs - hfw + bdPerSteam);
    out.excess_air = o2 / (21 - o2);
    out.flue_loss = qa;
    out.blowdown_loss = eta0 * r;
    out.eff_lhv = eta0 * (1 - r);
    out.eff_hhv = out.eff_lhv * (lhv / hhv);
    if (ta < 60) warnings.push('Flue gas below 60 °C: the water vapour condenses and the Siegert formula no longer applies; a condensing boiler needs the latent heat recovered added to its efficiency.');
    if (o2 > 8) warnings.push('Oxygen above 8 %: a lot of excess air; tuning the burner would reduce the flue gas loss.');
  }
  return { outputs: out, warnings };
}
