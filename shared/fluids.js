/**
 * shared/fluids.js — reference density and kinematic viscosity of the fluids the fluid calculators offer. The
 * values are the same as pipe-flow's table, so every calculator gives the same answer for the same fluid. DOM-free.
 */

// Water: IAPWS-95 via ITTC 7.5-02-01-03 (20 °C). Sea water: ITTC 7.5-02-01-03 at 35 g/kg and 15 °C. Marine gas oil,
// heavy fuel oil and lubricating oil: typical values for ISO 8217 DMA, RMG 380 and SAE 30 grades at the stated
// temperature. Air: 20 °C and 101.325 kPa.
export const FLUIDS = {
  water_20c: { label: 'Fresh water, 20 °C', rho: 998.2, nu: 1.004e-6 },
  seawater_15c: { label: 'Sea water, 15 °C (ITTC)', rho: 1025.87, nu: 1.18831e-6 },
  mgo_40c: { label: 'Marine gas oil DMA, 40 °C (typical)', rho: 830, nu: 3.5e-6 },
  hfo_50c: { label: 'HFO RMG 380, 50 °C (typical)', rho: 970, nu: 380e-6 },
  lube_oil_40c: { label: 'Lubricating oil SAE 30, 40 °C (typical)', rho: 870, nu: 100e-6 },
  air_20c: { label: 'Air, 20 °C, 1 atm', rho: 1.204, nu: 1.516e-5 },
  custom: { label: 'Custom fluid', rho: null, nu: null },
};

/** Select options for a fluid input, optionally limited to some ids (custom always last). */
export function fluidOptions(ids = Object.keys(FLUIDS)) {
  return ids.map((value) => ({ value, label: FLUIDS[value].label }));
}

/** Density of the chosen fluid, or the custom value. Throws on an unknown fluid. */
export function densityOf(fluid, customRho) {
  if (!FLUIDS[fluid]) throw new Error(`Fluid must be one of ${Object.keys(FLUIDS).join(', ')} (got ${JSON.stringify(fluid)})`);
  if (fluid !== 'custom') return FLUIDS[fluid].rho;
  if (!(customRho > 0)) throw new Error(`Density must be greater than zero (got ${customRho})`);
  return customRho;
}
