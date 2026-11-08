/**
 * cargo-tank-heating/calc.js — heating a cargo or fuel oil tank: sensible heat to raise the cargo, heat losses through
 * deck, shell and bulkheads at the mean and the final temperature, the heating power or heating time, the steam
 * consumption from the saturated steam latent heat and the heating coil area for the steam-to-cargo temperature
 * difference.
 *
 * E = m c_p ΔT;  Q_loss = Σ U_i A_i (T_cargo − T_i);  P = E/t + Q_loss,mean;  ṁ_steam = P / h_fg;  A_coil = P / (U_coil (T_steam − T_cargo,mean))
 * Schema units: t, kJ/(kg·K), °C, h, m², W/(m²·K).
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Saturated steam at common heating pressures: saturation temperature °C and latent heat kJ/kg (IAPWS-IF97). */
export const STEAM = {
  bar5g: { label: '5 bar g (6 bar abs): 158.8 °C, h_fg 2 085 kJ/kg', tSatC: 158.8, hfgKjKg: 2085 },
  bar7g: { label: '7 bar g (8 bar abs): 170.4 °C, h_fg 2 047 kJ/kg', tSatC: 170.4, hfgKjKg: 2047 },
  bar10g: { label: '10 bar g (11 bar abs): 184.1 °C, h_fg 1 999 kJ/kg', tSatC: 184.1, hfgKjKg: 1999 },
  bar16g: { label: '16 bar g (17 bar abs): 204.3 °C, h_fg 1 919 kJ/kg', tSatC: 204.3, hfgKjKg: 1919 },
};

export const schema = {
  id: 'cargo-tank-heating',
  name: 'Cargo tank heating time and steam',
  category: 'thermal',
  summary: 'Heat-up energy, heat losses through deck, shell and bulkheads, heating power or time, steam consumption and heating coil area for a cargo or fuel tank.',
  related: ['heat-exchanger-lmtd', 'pipe-insulation', 'fuel-blend-heating', 'tank-volume', 'thermal-expansion'],
  assumptions: [
    'Lumped (well-mixed) cargo: the whole mass is at one temperature that rises linearly from the initial to the target value, so the sensible heat is m c_p ΔT and the losses during heating are evaluated at the mean cargo temperature; stratification (cold bottom layers in unagitated heavy oils) makes the real heat-up slower and the coil surface temperature-limited.',
    'Heat loss through three surface groups — deck to air, shell to sea water, bulkheads to adjacent spaces — as U × A × ΔT with the overall coefficients entered: typical values for uninsulated steel are 6–8 W/(m²·K) from the shell to sea water, 5–7 from the deck to air at moderate wind (higher in strong wind), 2–4 to adjacent empty or ballast tanks, and 0 to adjacent heated cargo tanks; insulated surfaces 0.5–1.5. The coefficients, not the arithmetic, dominate the uncertainty (±30 %).',
    'Steam heating with saturated steam fully condensed at the coil pressure and no sub-cooling of the condensate: steam rate = heat / latent heat (h_fg at the saturation pressure selected, IAPWS-IF97 values); flashing and heat recovered from condensate are not credited; a thermal-oil system is treated by entering the equivalent power.',
    'Coil area from the overall coil coefficient (steam to cargo) and the mean temperature difference between the saturation temperature and the mean cargo temperature; U_coil 100–150 W/(m²·K) for crude and light products, 60–90 for heavy fuel oil and bitumen (viscosity), lower when the coil is fouled; the coil area is a sizing indication, the maintained-at-temperature case needs much less.',
    'No phase change, no cargo circulation or heat exchanger (deck heater) losses, no solar gain, constant ambient temperatures; heating above the flash-point-related or cargo-specification limits (e.g. 65 °C for most heavy fuel oil storage, carriage temperatures of the charter party) is the user\'s check.',
  ],
  notes: [
    'Verification 2026-10-31: 5 000 t of heavy fuel oil (c_p 1.9 kJ/kg·K) from 30 to 55 °C in 48 h with 400 m² deck (U 6, air 15 °C), 600 m² shell (U 6, sea 18 °C) and 500 m² bulkheads (U 3, 30 °C): sensible heat 237.5 GJ (1 374 kW), mean losses 173 kW → 1 547 kW, 2 720 kg/h of 7 bar g steam (65 t/day, 131 t in total), coil area 121 m² at U 100; maintaining 55 °C needs 267 kW = 469 kg/h — numbers consistent with tanker heating-coil design practice (1–2 m² of coil per 100 m³ of heavy cargo).',
    'Design decision: three surface groups with editable U values rather than a wind-speed model, because the overall coefficients in cargo-heating practice are tabulated by the classification societies and oil majors, and the user knows which apply.',
  ],
  sources: [
    'ISGOTT (International Safety Guide for Oil Tankers and Terminals), 6th ed., 2020 — cargo heating practice and temperature limits',
    'Lloyd\'s Register / OCIMF guidance on cargo heating systems; typical overall heat transfer coefficients for uninsulated steel to sea and air (Intertanko "Guide to the Vetting Process" cargo heating section)',
    'IAPWS-IF97 steam tables — saturation temperature and latent heat at 6, 8, 11 and 17 bar abs',
    'F. P. Incropera, D. P. DeWitt, Fundamentals of Heat and Mass Transfer, 7th ed. — lumped capacitance and overall heat transfer coefficients',
  ],
  inputs: [
    { id: 'cargo_mass_t', label: 'Cargo mass in the tank', group: 'mass', unit: 't', default: 5000, min: 1, max: 200000 },
    { id: 'specific_heat_kj_kgk', label: 'Specific heat of the cargo c_p', group: 'specific_heat', unit: 'kJ_kgK', default: 1.9, min: 0.5, max: 5, help: 'Heavy fuel oil 1.8–2.0, crude 1.9–2.1, bitumen 1.7, water 4.19.' },
    { id: 't_initial_c', label: 'Initial cargo temperature', group: 'temperature', unit: 'C', default: 30, min: -30, max: 200 },
    { id: 't_target_c', label: 'Target cargo temperature', group: 'temperature', unit: 'C', default: 55, min: -30, max: 250 },
    { id: 'mode', label: 'Known quantity', type: 'select', default: 'time', options: [{ value: 'time', label: 'Heating time known → required power' }, { value: 'power', label: 'Available heating power known → heating time' }] },
    { id: 'heating_time_h', label: 'Heating time', group: 'time', unit: 'h', default: 48, min: 0.1, max: 2000, visibleWhen: { mode: 'time' } },
    { id: 'available_power_kw', label: 'Available heating power (steam or thermal oil)', group: 'power', unit: 'kW', default: 1500, min: 1, max: 100000, visibleWhen: { mode: 'power' } },
    { id: 'deck_area_m2', label: 'Deck area exposed to air', group: 'area', unit: 'm2', default: 400, min: 0, max: 20000 },
    { id: 'deck_u', label: 'Deck overall U (to air)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 6, min: 0, max: 50 },
    { id: 'air_temp_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 15, min: -40, max: 50 },
    { id: 'shell_area_m2', label: 'Shell / bottom area to sea water', group: 'area', unit: 'm2', default: 600, min: 0, max: 20000 },
    { id: 'shell_u', label: 'Shell overall U (to sea)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 6, min: 0, max: 50 },
    { id: 'sea_temp_c', label: 'Sea water temperature', group: 'temperature', unit: 'C', default: 18, min: -2, max: 40 },
    { id: 'bulkhead_area_m2', label: 'Bulkhead area to adjacent spaces', group: 'area', unit: 'm2', default: 500, min: 0, max: 20000 },
    { id: 'bulkhead_u', label: 'Bulkhead overall U (to adjacent spaces)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 3, min: 0, max: 50 },
    { id: 'adjacent_temp_c', label: 'Adjacent space temperature', group: 'temperature', unit: 'C', default: 30, min: -40, max: 150 },
    { id: 'steam', label: 'Heating steam', type: 'select', default: 'bar7g', options: Object.entries(STEAM).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'coil_u', label: 'Coil overall U (steam to cargo)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 100, min: 5, max: 1000 },
  ],
  outputs: [
    { id: 'sensible_heat_j', label: 'Sensible heat m c_p ΔT', group: 'energy', unit: 'J', display: 'GJ' },
    { id: 'loss_mean_w', label: 'Heat loss at the mean cargo temperature', group: 'power', unit: 'W', display: 'kW' },
    { id: 'loss_target_w', label: 'Heat loss at the target temperature (maintaining)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'heating_power_w', label: 'Heating power during heat-up', group: 'power', unit: 'W', display: 'kW' },
    { id: 'heating_time_h_out', label: 'Heating time', group: 'time', unit: 'h' },
    { id: 'heat_rate_k_per_day', label: 'Temperature rise rate (K per day)', group: 'dimensionless', unit: 'none' },
    { id: 'steam_rate_kg_h', label: 'Steam consumption during heat-up', group: 'mass_flow', unit: 'kg_h' },
    { id: 'steam_total_t', label: 'Total steam for the heat-up', group: 'mass', unit: 't' },
    { id: 'steam_maintain_kg_h', label: 'Steam to maintain the target temperature', group: 'mass_flow', unit: 'kg_h' },
    { id: 'coil_area_m2', label: 'Heating coil area required (heat-up)', group: 'area', unit: 'm2' },
    { id: 'coil_area_maintain_m2', label: 'Heating coil area required (maintaining only)', group: 'area', unit: 'm2' },
    { id: 'energy_total_j', label: 'Total heat supplied during heat-up (sensible + losses)', group: 'energy', unit: 'J', display: 'GJ' },
    { id: 'loss_share_pct', label: 'Share of the heat lost during heat-up', group: 'ratio', unit: 'pct' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      sensible_heat_j: '237.5 GJ',
      loss_mean_w: '173 kW',
      loss_target_w: '267 kW',
      heating_power_w: '1 547 kW',
      heat_rate_k_per_day: '12.5',
      steam_rate_kg_h: '2 721 kg/h',
      steam_total_t: '131 t',
      steam_maintain_kg_h: '469 kg/h',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.cargo_mass_t, 'cargo_mass_t', 'Cargo mass');
  assertPositive(i.specific_heat_kj_kgk, 'specific_heat_kj_kgk', 'Specific heat');
  assertRange(i.t_initial_c, -50, 300, 't_initial_c', 'Initial temperature');
  assertRange(i.t_target_c, -50, 300, 't_target_c', 'Target temperature');
  if (i.t_target_c <= i.t_initial_c) throw new Error('Target temperature must be above the initial temperature');
  assertOneOf(i.mode, ['time', 'power'], 'mode', 'Mode');
  for (const key of ['deck_area_m2', 'shell_area_m2', 'bulkhead_area_m2', 'deck_u', 'shell_u', 'bulkhead_u']) assertNonNegative(i[key], key, key);
  assertOneOf(i.steam, Object.keys(STEAM), 'steam', 'Steam');
  assertPositive(i.coil_u, 'coil_u', 'Coil U');

  const dT = i.t_target_c - i.t_initial_c;
  const tMean = (i.t_initial_c + i.t_target_c) / 2;
  const sensible = i.cargo_mass_t * 1000 * i.specific_heat_kj_kgk * 1000 * dT;
  const loss = (tCargo) => i.deck_area_m2 * i.deck_u * (tCargo - i.air_temp_c) + i.shell_area_m2 * i.shell_u * (tCargo - i.sea_temp_c) + i.bulkhead_area_m2 * i.bulkhead_u * (tCargo - i.adjacent_temp_c);
  const lossMean = loss(tMean);
  const lossTarget = loss(i.t_target_c);
  let power;
  let timeH;
  if (i.mode === 'time') {
    timeH = assertPositive(i.heating_time_h, 'heating_time_h', 'Heating time');
    power = sensible / (timeH * 3600) + lossMean;
  } else {
    power = assertPositive(i.available_power_kw, 'available_power_kw', 'Available power') * 1000;
    if (power <= lossMean) throw new Error('Available power does not exceed the heat loss: the cargo cannot be heated to the target');
    timeH = sensible / ((power - lossMean) * 3600);
  }
  const st = STEAM[i.steam];
  const hfg = st.hfgKjKg * 1000;
  const steamRate = (power / hfg) * 3600;
  const steamMaintain = (Math.max(0, lossTarget) / hfg) * 3600;
  const coilArea = power / (i.coil_u * (st.tSatC - tMean));
  const coilMaintain = Math.max(0, lossTarget) / (i.coil_u * (st.tSatC - i.t_target_c));
  const totalEnergy = power * timeH * 3600;

  const warnings = [];
  if (st.tSatC - i.t_target_c < 30) warnings.push('Steam temperature less than 30 K above the target: the coil area becomes very large — use higher-pressure steam.');
  if (i.t_target_c > 65 && i.specific_heat_kj_kgk < 2.2) warnings.push('Target above 65 °C: check the cargo specification, flash point margin and the tank coating temperature limit.');
  if (dT / timeH > 1) warnings.push(`Heating rate ${(dT / timeH * 24).toFixed(0)} K per day: above the usual 10–15 K/day for heavy cargoes — thermal stress on the structure and coil surface temperatures may limit it.`);
  if (lossMean < 0) warnings.push('Negative heat loss: the surroundings are warmer than the cargo and heat flows in.');
  if (lossTarget > 0 && lossTarget / power > 0.5) warnings.push('More than half of the heating power is lost to the surroundings: consider insulation or heating only before discharge.');
  warnings.push('Overall heat transfer coefficients (U) dominate the result (±30 %); use the values from the heating system design or measured heating curves where available.');
  warnings.push('Well-mixed cargo assumed: heavy oils stratify, so the real heat-up is slower and a cold bottom layer may remain.');

  return {
    outputs: {
      sensible_heat_j: sensible,
      loss_mean_w: lossMean,
      loss_target_w: lossTarget,
      heating_power_w: power,
      heating_time_h_out: timeH,
      heat_rate_k_per_day: (dT / timeH) * 24,
      steam_rate_kg_h: steamRate,
      steam_total_t: (steamRate * timeH) / 1000,
      steam_maintain_kg_h: steamMaintain,
      coil_area_m2: coilArea,
      coil_area_maintain_m2: coilMaintain,
      energy_total_j: totalEnergy,
      loss_share_pct: ((totalEnergy - sensible) / totalEnergy) * 100,
      summary: `${i.cargo_mass_t} t from ${i.t_initial_c} to ${i.t_target_c} °C in ${timeH.toFixed(1)} h needs ${(power / 1000).toFixed(0)} kW (${(sensible / 1e9).toFixed(1)} GJ sensible + ${(lossMean / 1000).toFixed(0)} kW losses) = ${steamRate.toFixed(0)} kg/h of ${st.label.split(':')[0]} steam, ${((steamRate * timeH) / 1000).toFixed(1)} t in total; maintaining ${i.t_target_c} °C takes ${steamMaintain.toFixed(0)} kg/h`,
    },
    warnings,
  };
}
