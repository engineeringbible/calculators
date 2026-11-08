/**
 * heat-pump-cost/calc.js — running cost and CO₂ of a heat pump against a gas or oil boiler for the same yearly heat:
 * electricity = heat / SCOP, fuel = heat / boiler efficiency, the annual costs and saving, and the break-even COP
 * at which both cost the same (and emit the same CO₂).
 *
 * E_hp = Q / SCOP;  E_fuel = Q / η;  cost = E × price;  COP_break-even = p_elec × η / p_fuel;
 * COP_CO₂ = f_elec × η / f_fuel.  Fuel energy on the higher heating value (EPA heat contents).
 * Schema units: kWh, currency per kWh (or per therm, ccf, gallon, litre), kg CO₂ per kWh, kg.
 */
import { withDefaults, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';

const KWH_PER_MMBTU = 293.07107017; // 1 MMBtu = 10⁶ Btu(IT) = 1 055.05585262 MJ
/** EPA Emission Factors for Greenhouse Gas Inventories (GHG Emission Factors Hub), higher heating values. */
const GAS_MMBTU_PER_SCF = 0.001026;
const OIL_MMBTU_PER_GAL = 0.138;
const GAL_L = 3.785411784;
export const CO2_GAS_KG_KWH = 53.06 / KWH_PER_MMBTU; // 0.1810
export const CO2_OIL_KG_KWH = 73.96 / KWH_PER_MMBTU; // 0.2524

/** Boiler fuel and the unit its price is quoted in: kWh of fuel (HHV) per price unit. */
export const FUELS = {
  gas_kwh: { label: 'Natural gas, price per kWh', fuel: 'gas', kwh: 1, unit: 'kWh' },
  gas_therm: { label: 'Natural gas, price per therm (100 000 Btu)', fuel: 'gas', kwh: 0.1 * KWH_PER_MMBTU, unit: 'therm' },
  gas_ccf: { label: 'Natural gas, price per ccf (100 ft³, 1 026 Btu/ft³)', fuel: 'gas', kwh: 100 * GAS_MMBTU_PER_SCF * KWH_PER_MMBTU, unit: 'ccf' },
  oil_kwh: { label: 'Heating oil, price per kWh', fuel: 'oil', kwh: 1, unit: 'kWh' },
  oil_gal: { label: 'Heating oil No. 2, price per US gallon (138 000 Btu)', fuel: 'oil', kwh: OIL_MMBTU_PER_GAL * KWH_PER_MMBTU, unit: 'US gal' },
  oil_l: { label: 'Heating oil No. 2, price per litre', fuel: 'oil', kwh: (OIL_MMBTU_PER_GAL * KWH_PER_MMBTU) / GAL_L, unit: 'L' },
};

export const schema = {
  id: 'heat-pump-cost',
  name: 'Heat pump vs gas boiler running cost calculator',
  category: 'electrical',
  summary: 'Heat pump running cost and CO₂ against a gas or oil boiler from the yearly heat demand, SCOP, boiler efficiency and prices, with the saving and break-even COP.',
  related: ['heat-loss', 'electricity-cost', 'solar-payback', 'carnot-cop'],
  assumptions: [
    'Both systems deliver the same yearly heat to the home. The heat pump uses heat / SCOP of electricity, where the SCOP is the seasonal coefficient of performance for the climate and flow temperature (EN 14825); the boiler uses heat / efficiency of fuel.',
    'Fuel energy and boiler efficiency are both on the gross (higher heating value) basis, as US AFUE ratings and UK SEDBUK figures are. Gas and oil price units convert with the EPA heat contents: 1 026 Btu per cubic foot of natural gas and 138 000 Btu per US gallon of No. 2 heating oil; a therm is 100 000 Btu.',
    'Default CO₂ factors are examples: natural gas 0.181 and heating oil 0.252 kg CO₂ per kWh of fuel from the EPA factors (53.06 and 73.96 kg per MMBtu); the electricity factor depends on the grid and the year, so enter your supplier\'s or country\'s figure.',
    'Standing charges, maintenance, boiler servicing, time-of-use tariffs and the electricity a boiler\'s pump and fan use are not included; a gas standing charge you no longer pay after removing the boiler adds to the heat pump\'s saving.',
    'The break-even COP is the seasonal COP at which the two running costs are equal; a heat pump with a higher SCOP is cheaper to run.',
  ],
  notes: [
    'Verification 2026-11-08: 12 000 kWh of heat at SCOP 3.2 takes 3 750 kWh of electricity, 750.00 at 0.20; a 90 % gas boiler burns 13 333 kWh, 933.33 at 0.07, so the heat pump saves 183.33 a year; break-even COP 2.57. CO₂: 938 kg at 0.25 kg/kWh against 2 413 kg at 0.181 kg/kWh. Checked by hand.',
  ],
  sources: [
    'U.S. EPA, Emission Factors for Greenhouse Gas Inventories (GHG Emission Factors Hub), Table 1: natural gas 1 026 Btu/scf and 53.06 kg CO₂/MMBtu; distillate fuel oil No. 2 0.138 MMBtu/gal and 73.96 kg CO₂/MMBtu',
    'EN 14825:2022 Air conditioners, liquid chilling packages and heat pumps — Testing and rating at part load conditions and calculation of seasonal performance (SCOP)',
    'U.S. DOE, 10 CFR Part 430 Subpart B Appendix N (AFUE of furnaces and boilers, higher heating value basis)',
  ],
  inputs: [
    { id: 'heat_kwh', label: 'Heat needed per year (space heating and hot water)', group: 'energy', unit: 'kWh', default: 12000, min: 100, max: 1e7 },
    { id: 'scop', label: 'Heat pump seasonal COP (SCOP)', group: 'dimensionless', unit: 'none', default: 3.2, min: 1, max: 7 },
    { id: 'elec_price', label: 'Electricity price per kWh', group: 'dimensionless', unit: 'none', default: 0.2, min: 0.001, max: 5 },
    { id: 'fuel', label: 'Boiler fuel and price unit', type: 'select', default: 'gas_kwh', options: Object.entries(FUELS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'fuel_price', label: 'Fuel price per unit chosen above', group: 'dimensionless', unit: 'none', default: 0.07, min: 0.0001, max: 100 },
    { id: 'boiler_eff', label: 'Boiler seasonal efficiency (gross, AFUE)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.4, max: 1 },
    { id: 'co2_elec', label: 'CO₂ factor of electricity, kg per kWh (example value)', group: 'dimensionless', unit: 'none', default: 0.25, min: 0, max: 1.5 },
    { id: 'co2_gas', label: 'CO₂ factor of natural gas, kg per kWh (EPA)', group: 'dimensionless', unit: 'none', default: 0.181, min: 0, max: 0.5, visibleWhen: { fuel: ['gas_kwh', 'gas_therm', 'gas_ccf'] } },
    { id: 'co2_oil', label: 'CO₂ factor of heating oil, kg per kWh (EPA)', group: 'dimensionless', unit: 'none', default: 0.252, min: 0, max: 0.5, visibleWhen: { fuel: ['oil_kwh', 'oil_gal', 'oil_l'] } },
  ],
  outputs: [
    { id: 'hp_kwh', label: 'Electricity used by the heat pump', group: 'energy', unit: 'kWh' },
    { id: 'hp_cost', label: 'Heat pump running cost per year', group: 'money', unit: 'cur', decimals: 2 },
    { id: 'fuel_kwh', label: 'Fuel burned by the boiler', group: 'energy', unit: 'kWh' },
    { id: 'fuel_qty', label: 'Fuel in the price unit', type: 'text' },
    { id: 'boiler_cost', label: 'Boiler running cost per year', group: 'money', unit: 'cur', decimals: 2 },
    { id: 'saving', label: 'Yearly saving with the heat pump (negative: it costs more)', group: 'money', unit: 'cur', decimals: 2 },
    { id: 'saving_frac', label: 'Saving as a share of the boiler cost', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'breakeven_cop', label: 'Break-even COP for running cost', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'hp_heat_price', label: 'Cost of 1 kWh of heat from the heat pump', group: 'money', unit: 'cur', decimals: 4 },
    { id: 'boiler_heat_price', label: 'Cost of 1 kWh of heat from the boiler', group: 'money', unit: 'cur', decimals: 4 },
    { id: 'hp_co2_kg', label: 'CO₂ of the heat pump per year', group: 'mass', unit: 'kg' },
    { id: 'boiler_co2_kg', label: 'CO₂ of the boiler per year', group: 'mass', unit: 'kg' },
    { id: 'co2_saving_kg', label: 'CO₂ saved per year', group: 'mass', unit: 'kg' },
    { id: 'breakeven_cop_co2', label: 'Break-even COP for CO₂', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { heat_kwh: [12000, 'kWh'], scop: 3.2, elec_price: 0.2, fuel: 'gas_kwh', fuel_price: 0.07, boiler_eff: [90, 'pct'], co2_elec: 0.25, co2_gas: 0.181 },
    results: { hp_kwh: '3 750 kWh', hp_cost: '750.00', fuel_kwh: '13 333 kWh', boiler_cost: '933.33', saving: '183.33', breakeven_cop: '2.57', boiler_co2_kg: '2 413 kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.fuel, Object.keys(FUELS), 'fuel', 'Boiler fuel and price unit');
  const q = assertRange(x.heat_kwh, 100, 1e7, 'heat_kwh', 'Heat needed per year');
  const scop = assertRange(x.scop, 1, 7, 'scop', 'Heat pump SCOP');
  const pe = assertPositive(x.elec_price, 'elec_price', 'Electricity price');
  const fuel = FUELS[x.fuel];
  const priceUnit = assertPositive(x.fuel_price, 'fuel_price', 'Fuel price');
  const eta = assertRange(x.boiler_eff, 0.4, 1, 'boiler_eff', 'Boiler efficiency');
  const fe = assertRange(x.co2_elec, 0, 1.5, 'co2_elec', 'CO₂ factor of electricity');
  const ff = fuel.fuel === 'gas' ? assertRange(x.co2_gas, 0, 0.5, 'co2_gas', 'CO₂ factor of natural gas') : assertRange(x.co2_oil, 0, 0.5, 'co2_oil', 'CO₂ factor of heating oil');
  const pf = priceUnit / fuel.kwh; // price per kWh of fuel
  const hpKwh = q / scop;
  const fuelKwh = q / eta;
  const hpCost = hpKwh * pe;
  const boilerCost = fuelKwh * pf;
  const hpCo2 = hpKwh * fe;
  const boilerCo2 = fuelKwh * ff;
  const qty = fuelKwh / fuel.kwh;
  const warnings = [];
  if (scop < 2.5) warnings.push('An SCOP below 2.5 is low for a modern heat pump; a lower flow temperature, with larger radiators or underfloor heating, usually raises it.');
  if (scop > 5) warnings.push('An SCOP above 5 is unusually high; check that it is a seasonal figure for your climate and flow temperature.');
  return {
    outputs: {
      hp_kwh: hpKwh,
      hp_cost: hpCost,
      fuel_kwh: fuelKwh,
      fuel_qty: fuel.unit === 'kWh' ? `${Math.round(fuelKwh).toLocaleString('en-US').replace(/,/g, ' ')} kWh of fuel` : `${Number(qty.toPrecision(4)).toLocaleString('en-US').replace(/,/g, ' ')} ${fuel.unit}`,
      boiler_cost: boilerCost,
      saving: boilerCost - hpCost,
      saving_frac: (boilerCost - hpCost) / boilerCost,
      breakeven_cop: (pe * eta) / pf,
      hp_heat_price: pe / scop,
      boiler_heat_price: pf / eta,
      hp_co2_kg: hpCo2,
      boiler_co2_kg: boilerCo2,
      co2_saving_kg: boilerCo2 - hpCo2,
      breakeven_cop_co2: ff > 0 ? (fe * eta) / ff : null,
    },
    warnings,
  };
}
