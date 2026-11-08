/**
 * fuel-voyage-cost/calc.js — fuel consumption, voyage duration, bunker cost and CO₂ for a passage.
 *
 * Schema units (what calculate() receives and returns): nmi, kn, kW, g/kWh, t/day, %, day, $/t, t.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';
import { CO2_FACTOR_T_PER_T, FUEL_OPTIONS } from '../shared/fuels.js';

export { CO2_FACTOR_T_PER_T };

const HOURS_PER_DAY = 24;
const GRAMS_PER_TONNE = 1e6;

export const schema = {
  id: 'fuel-voyage-cost',
  name: 'Fuel consumption and voyage cost',
  category: 'maritime',
  summary: 'Fuel burned, time at sea, bunker cost and CO₂ for a passage from distance, speed and engine power or daily consumption.',
  related: ['cii-rating', 'propeller-slip', 'admiralty-coefficient', 'unit-converter'],
  sendTo: [
    {
      target: 'cii-rating',
      label: 'Carbon intensity (CII) of this voyage',
      note: 'Sends the CO₂ mass and the distance and treats the voyage as the whole reporting period, so the attained CII is the carbon intensity of this voyage; set the ship type, size and year there.',
      links: [
        { to: 'emissions_basis', value: 'co2' },
        { to: 'co2_t', from: 'co2_t' },
        { to: 'distance_nmi', from: 'input:distance_nmi' },
      ],
    },
    {
      target: 'eu-ets-fueleu',
      label: 'EU ETS allowances and FuelEU Maritime',
      when: { fuel_type: ['hfo', 'vlsfo', 'mgo', 'lng', 'lpg_propane', 'lpg_butane', 'methanol'] },
      whenNote: 'Not available for ethanol: the EU ETS / FuelEU calculator has no ethanol pathway.',
      note: 'The voyage fuel becomes fuel 1 and fuels 2 and 3 are cleared. VLSFO goes over as LFO and LNG as a medium-speed Otto dual-fuel engine; check the engine type, the intra-/extra-EU voyage shares and the year there.',
      links: [
        { to: 'fuel_1', from: 'input:fuel_type', map: { hfo: 'hfo', vlsfo: 'lfo', mgo: 'mgo', lng: 'lng_otto_ms', lpg_propane: 'lpg_propane', lpg_butane: 'lpg_butane', methanol: 'methanol_fossil' } },
        { to: 'mass_1_t', from: 'total_fuel_t' },
        { to: 'fuel_2', value: 'none' },
        { to: 'mass_2_t', value: 0 },
        { to: 'fuel_3', value: 'none' },
        { to: 'mass_3_t', value: 0 },
      ],
    },
    {
      target: 'hull-cleaning-interval',
      label: 'Hull cleaning interval',
      note: 'Main-engine fuel per sea day and the bunker price; set the fouling rate and the cleaning cost there.',
      links: [
        { to: 'fuel_t_per_day', from: 'me_daily_used_t', raw: true },
        { to: 'fuel_price', from: 'input:bunker_price' },
      ],
    },
    {
      target: 'esd-payback',
      label: 'Energy-saving device payback',
      note: 'Main-engine fuel per sea day, the fuel type and the bunker price; enter the device cost and saving there.',
      links: [
        { to: 'fuel_t_per_day', from: 'me_daily_used_t', raw: true },
        { to: 'fuel_type', from: 'input:fuel_type' },
        { to: 'fuel_price', from: 'input:bunker_price' },
      ],
    },
  ],
  notes: [
    'Verification 2026-10-30: the default passage was checked by hand (8 000 kW × 175 g/kWh = 33.6 t/day; × 8.9286 days = 300.0 t; cost 177 277 $) and the CO₂ factors against MEPC.364(79) Table 1.',
    'Design decision: the CO₂ factors live in shared/fuels.js so the fuel and CII calculators can never disagree.',
    'Design decision: the margin multiplies main-engine fuel only; auxiliary and port figures are taken as entered because they are usually measured, not modelled.',
  ],
  assumptions: [
    'Speed and power are constant over the passage; split the voyage into legs when they are not.',
    'SFOC must correspond to the power entered and to the fuel in use: shop-test SFOC is on 42 700 kJ/kg reference fuel (scale by 42 700 / LCV), and service SFOC is typically 3–6 % above shop test.',
    'The margin applies to main-engine fuel only and stands in for weather, fouling and manoeuvring: 10–15 % at the design stage, 0 when the daily figure already comes from recent noon reports.',
    'Auxiliary and port consumption are flat daily rates; reefers, cargo pumps, tank heating and inert gas generation can raise them substantially.',
    'CO₂ is tank-to-wake (combustion only) with the IMO MEPC.364(79) carbon factors; well-to-wake factors are larger.',
    'Cost covers bunkers only — no port dues, canal fees, lubricants or hire; a single currency with no exchange-rate conversion.',
  ],
  sources: [
    'ISO 3046-1:2002 — reciprocating internal combustion engines, performance (SFOC definition)',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018)',
    'IMO Resolution MEPC.364(79), 2022 EEDI calculation guidelines, Table 1 (CF factors)',
    'BIPM SI Brochure, 9th ed. (knot and nautical mile definitions)',
  ],
  inputs: [
    { id: 'distance_nmi', label: 'Voyage distance', group: 'length', unit: 'nmi', default: 3000, min: 0, max: 50000 },
    { id: 'speed_kn', label: 'Average speed over ground', group: 'speed', unit: 'kn', default: 14, min: 0.1, max: 60 },
    {
      id: 'basis',
      label: 'Main-engine consumption basis',
      type: 'select',
      default: 'power',
      options: [
        { value: 'power', label: 'Engine power × SFOC' },
        { value: 'daily', label: 'Daily consumption (from noon reports or tables)' },
      ],
    },
    {
      id: 'power_kw',
      label: 'Main-engine brake power on passage',
      group: 'power',
      unit: 'kW',
      default: 8000,
      min: 0,
      max: 120000,
      help: 'Power actually developed at the service speed, not the engine MCR.',
      visibleWhen: { basis: 'power' },
    },
    {
      id: 'sfoc_g_kwh',
      label: 'Specific fuel oil consumption (SFOC)',
      group: 'specific_fuel',
      unit: 'g_kWh',
      default: 175,
      min: 100,
      max: 400,
      help: 'Shop-test SFOC at the operating load, corrected for the fuel in use. Large two-stroke engines: 160–185 g/kWh.',
      visibleWhen: { basis: 'power' },
    },
    {
      id: 'me_daily_t',
      label: 'Main-engine daily consumption',
      group: 'mass_flow',
      unit: 't_day',
      default: 32,
      min: 0,
      max: 500,
      visibleWhen: { basis: 'daily' },
    },
    {
      id: 'margin_pct',
      label: 'Weather and fouling margin on main-engine fuel',
      group: 'ratio',
      unit: 'pct',
      default: 0,
      min: 0,
      max: 100,
      help: 'Added to the main-engine figure. Design practice uses a 10–15 % sea margin; set 0 when the input already reflects real conditions.',
    },
    { id: 'aux_daily_t', label: 'Auxiliary consumption at sea (generators, boiler)', group: 'mass_flow', unit: 't_day', default: 2.5, min: 0, max: 100 },
    { id: 'port_days', label: 'Time in port', group: 'time', unit: 'day', default: 0, min: 0, max: 365 },
    { id: 'port_daily_t', label: 'Daily consumption in port', group: 'mass_flow', unit: 't_day', default: 3, min: 0, max: 100 },
    { id: 'fuel_type', label: 'Fuel type (sets the CO₂ factor)', type: 'select', default: 'hfo', options: FUEL_OPTIONS },
    { id: 'bunker_price', label: 'Bunker price', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
  ],
  outputs: [
    { id: 'sea_days', label: 'Time at sea', group: 'time', unit: 'day' },
    { id: 'me_daily_used_t', label: 'Main-engine daily consumption (incl. margin)', group: 'mass_flow', unit: 't_day' },
    { id: 'me_fuel_t', label: 'Main-engine fuel for the passage', group: 'mass', unit: 't' },
    { id: 'aux_fuel_t', label: 'Auxiliary fuel at sea', group: 'mass', unit: 't' },
    { id: 'port_fuel_t', label: 'Fuel in port', group: 'mass', unit: 't' },
    { id: 'total_fuel_t', label: 'Total fuel', group: 'mass', unit: 't' },
    { id: 'fuel_per_nmi_kg', label: 'Fuel per nautical mile at sea', group: 'mass_per_distance', unit: 'kg_nmi' },
    { id: 'total_cost', label: 'Bunker cost', group: 'money', unit: 'cur' },
    { id: 'cost_per_nmi', label: 'Cost per nautical mile at sea', group: 'money_per_distance', unit: 'cur_nmi' },
    { id: 'co2_t', label: 'CO₂ emitted, tank-to-wake', group: 'mass', unit: 't' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      sea_days: '214.3 h',
      me_daily_used_t: '33.6 t/day',
      me_fuel_t: '300.0 t',
      aux_fuel_t: '22.3 t',
      total_fuel_t: '322.3 t',
      fuel_per_nmi_kg: '107.4 kg/nmi',
      total_cost: '177 277 $',
      cost_per_nmi: '59.1 $/nmi',
    },
  },
};

/**
 * Main-engine daily consumption (t/day) from brake power (kW) and SFOC (g/kWh).
 */
export function dailyConsumptionFromPower(powerKw, sfocGPerKwh) {
  return (powerKw * sfocGPerKwh * HOURS_PER_DAY) / GRAMS_PER_TONNE;
}

/**
 * Compute fuel, time, cost and CO₂ for the passage.
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.distance_nmi, 'distance_nmi', 'Voyage distance');
  assertPositive(i.speed_kn, 'speed_kn', 'Average speed');
  assertOneOf(i.basis, ['power', 'daily'], 'basis', 'Consumption basis');
  assertNonNegative(i.margin_pct, 'margin_pct', 'Margin');
  assertNonNegative(i.aux_daily_t, 'aux_daily_t', 'Auxiliary consumption');
  assertNonNegative(i.port_days, 'port_days', 'Time in port');
  assertNonNegative(i.port_daily_t, 'port_daily_t', 'Port consumption');
  assertNonNegative(i.bunker_price, 'bunker_price', 'Bunker price');
  assertOneOf(i.fuel_type, Object.keys(CO2_FACTOR_T_PER_T), 'fuel_type', 'Fuel type');

  let meDailyBase;
  if (i.basis === 'power') {
    assertNonNegative(i.power_kw, 'power_kw', 'Main-engine power');
    assertPositive(i.sfoc_g_kwh, 'sfoc_g_kwh', 'SFOC');
    meDailyBase = dailyConsumptionFromPower(i.power_kw, i.sfoc_g_kwh);
  } else {
    assertNonNegative(i.me_daily_t, 'me_daily_t', 'Main-engine daily consumption');
    meDailyBase = i.me_daily_t;
  }

  const seaDays = i.distance_nmi / i.speed_kn / HOURS_PER_DAY;
  const meDaily = meDailyBase * (1 + i.margin_pct / 100);
  const meFuel = meDaily * seaDays;
  const auxFuel = i.aux_daily_t * seaDays;
  const portFuel = i.port_daily_t * i.port_days;
  const totalFuel = meFuel + auxFuel + portFuel;
  const seaFuel = meFuel + auxFuel;
  const totalCost = totalFuel * i.bunker_price;
  const co2 = totalFuel * CO2_FACTOR_T_PER_T[i.fuel_type];

  const warnings = [];
  if (i.speed_kn > 25) warnings.push('Speed above 25 kn is unusual for a merchant ship — check the value.');
  if (i.basis === 'power' && i.sfoc_g_kwh < 155) warnings.push('SFOC below 155 g/kWh is better than the best large two-stroke engines — check the value.');
  if (i.basis === 'power' && i.margin_pct === 0) warnings.push('No margin applied: a shop-test SFOC and calm-water power understate real consumption by typically 10–15 %.');

  return {
    outputs: {
      sea_days: seaDays,
      me_daily_used_t: meDaily,
      me_fuel_t: meFuel,
      aux_fuel_t: auxFuel,
      port_fuel_t: portFuel,
      total_fuel_t: totalFuel,
      fuel_per_nmi_kg: i.distance_nmi > 0 ? (seaFuel * 1000) / i.distance_nmi : null,
      total_cost: totalCost,
      cost_per_nmi: i.distance_nmi > 0 ? (seaFuel * i.bunker_price) / i.distance_nmi : null,
      co2_t: co2,
    },
    warnings,
  };
}
