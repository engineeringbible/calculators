/**
 * shared/fuels.js — marine fuel constants shared by the fuel, CII and (later) bunker calculators.
 *
 * Carbon conversion factors CF in t CO₂ per t fuel — IMO Resolution MEPC.364(79), 2022 Guidelines on the method
 * of calculation of the attained EEDI, Table 1; the same factors are used for CII (MEPC.352(78), G1).
 */
export const CO2_FACTOR_T_PER_T = {
  hfo: 3.114,
  vlsfo: 3.151,
  mgo: 3.206,
  lng: 2.750,
  lpg_propane: 3.000,
  lpg_butane: 3.030,
  methanol: 1.375,
  ethanol: 1.913,
};

export const FUEL_LABELS = {
  hfo: 'HFO (heavy fuel oil, CF 3.114)',
  vlsfo: 'VLSFO / LFO (light fuel oil, CF 3.151)',
  mgo: 'MGO / MDO (distillate, CF 3.206)',
  lng: 'LNG (CF 2.750)',
  lpg_propane: 'LPG propane (CF 3.000)',
  lpg_butane: 'LPG butane (CF 3.030)',
  methanol: 'Methanol (CF 1.375)',
  ethanol: 'Ethanol (CF 1.913)',
};

/** Select options in the order fuels are usually listed on a bunker delivery note. */
export const FUEL_OPTIONS = Object.keys(CO2_FACTOR_T_PER_T).map((value) => ({ value, label: FUEL_LABELS[value] }));
