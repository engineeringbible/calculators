/**
 * solar-panel/calc.js — how many solar panels a grid-tied home needs: the system size in kW from the yearly use, the
 * share to cover, the peak sun hours and the system losses; the number of panels, the roof area, the yearly
 * production and an optional cost.
 *
 * P_dc = E_year × offset / (PSH × 365 × (1 − losses));  N = ceil(P_dc / P_panel);  E_out = N P_panel PSH 365 (1 − losses).
 * Schema units: SI-friendly — kWh, W, h, m², fraction, currency.
 */
import { withDefaults, assertPositive, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'solar-panel',
  name: 'Solar panel calculator: how many panels do I need?',
  category: 'electrical',
  summary: 'Solar system size in kW and the number of panels to cover your yearly electricity use, from peak sun hours and losses, with roof area, output and cost.',
  related: ['solar-pv-sizing', 'electricity-cost', 'battery-charge-time', 'mah-to-wh'],
  assumptions: [
    'The system is grid-tied: the panels cover a share of the yearly use on average, and the grid supplies the rest and takes the surplus. For off-grid systems with batteries use the solar PV array and storage calculator.',
    'Peak sun hours are the yearly average of the daily solar energy on the panels in kWh/m², which equals hours of 1 000 W/m² sun; look them up for your location and tilt in NREL PVWatts or the EU PVGIS tool.',
    'System losses cover temperature, soiling, wiring, inverter and mismatch; 14 % is the PVWatts default. Shading and a poor orientation lower production further.',
    'Panel size is the rated (STC) power; the area per panel is the module\'s outline, so the roof needs extra room for edges, walkways and fire setbacks.',
  ],
  notes: [
    'Verification 2026-11-07: 10 000 kWh a year at 4.5 peak sun hours and 14 % losses needs 7.08 kW, so 18 panels of 400 W (7.2 kW), producing 10 170 kWh a year on 34.2 m². Checked by hand.',
  ],
  sources: [
    'NREL PVWatts Calculator, version 8, technical reference (default system losses 14 %; production from solar resource and losses)',
    'European Commission JRC, Photovoltaic Geographical Information System (PVGIS) (peak sun hours and system loss for Europe and Africa)',
    'IEC 61215-1:2021 (module rating at standard test conditions, 1 000 W/m² and 25 °C)',
  ],
  inputs: [
    { id: 'annual_kwh', label: 'Electricity use per year (from 12 months of bills)', group: 'energy', unit: 'kWh', default: 10000, min: 1, max: 1e8 },
    { id: 'offset', label: 'Share of the use to cover with solar', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0.05, max: 2 },
    { id: 'psh_h', label: 'Peak sun hours per day, yearly average', group: 'time', unit: 'h', default: 4.5, min: 0.5, max: 9 },
    { id: 'losses', label: 'System losses', group: 'ratio', unit: 'frac', display: 'pct', default: 0.14, min: 0, max: 0.5 },
    { id: 'panel_w', label: 'Panel rating', group: 'power', unit: 'W', default: 400, min: 10, max: 1000 },
    { id: 'panel_area_m2', label: 'Area of one panel', group: 'area', unit: 'm2', default: 1.9, min: 0.05, max: 5 },
    { id: 'price_per_w', label: 'Installed price per watt (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 100 },
  ],
  outputs: [
    { id: 'system_w', label: 'System size needed', group: 'power', unit: 'W', display: 'kW' },
    { id: 'panels', label: 'Number of panels', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'installed_w', label: 'Installed size with whole panels', group: 'power', unit: 'W', display: 'kW' },
    { id: 'production_kwh', label: 'Expected production per year', group: 'energy', unit: 'kWh' },
    { id: 'coverage', label: 'Share of the yearly use covered', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'roof_m2', label: 'Panel area on the roof', group: 'area', unit: 'm2' },
    { id: 'yield_kwh_kw', label: 'Specific yield (kWh per kW per year)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'cost', label: 'Installed cost', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { annual_kwh: [10000, 'kWh'], offset: [100, 'pct'], psh_h: [4.5, 'h'], losses: [14, 'pct'], panel_w: [400, 'W'], panel_area_m2: [1.9, 'm2'], price_per_w: 0 },
    results: { system_w: '7.08 kW', panels: '18', installed_w: '7.2 kW', roof_m2: '34.2 m²' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const use = assertPositive(x.annual_kwh, 'annual_kwh', 'Electricity use per year');
  const offset = assertRange(x.offset, 0.05, 2, 'offset', 'Share of the use to cover');
  const psh = assertRange(x.psh_h, 0.5, 9, 'psh_h', 'Peak sun hours');
  const losses = assertRange(x.losses, 0, 0.5, 'losses', 'System losses');
  const panelW = assertPositive(x.panel_w, 'panel_w', 'Panel rating');
  const panelArea = assertPositive(x.panel_area_m2, 'panel_area_m2', 'Area of one panel');
  const price = assertNonNegative(x.price_per_w, 'price_per_w', 'Installed price per watt');

  const yieldPerKw = psh * 365 * (1 - losses); // kWh per kW per year
  const systemW = ((use * offset) / yieldPerKw) * 1000;
  const panels = Math.ceil(systemW / panelW - 1e-9);
  const installed = panels * panelW;
  const production = (installed / 1000) * yieldPerKw;
  const warnings = [];
  if (offset > 1) warnings.push('Covering more than 100 % of the use only pays where the utility buys the surplus at a fair rate; check your net-metering or export tariff.');
  if (panelW / panelArea > 260) warnings.push('More than 260 W per m² is above the efficiency of today\'s commercial panels; check the panel rating and area.');
  return {
    outputs: {
      system_w: systemW,
      panels,
      installed_w: installed,
      production_kwh: production,
      coverage: production / use,
      roof_m2: panels * panelArea,
      yield_kwh_kw: yieldPerKw,
      cost: price > 0 ? installed * price : null,
    },
    warnings,
  };
}
