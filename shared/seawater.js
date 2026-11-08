/**
 * shared/seawater.js — sea water density and kinematic viscosity (ITTC RP 7.5-02-01-03 standard sea water, 35 g/kg),
 * the ITTC-1957 flat-plate friction line and the hull roughness allowance (ISO 15016:2025 E.7 / G.8, ITTC-78).
 *
 * Shared by the hull roughness, water temperature correction, shallow water and added-wave-resistance calculators so
 * that every page uses ONE set of water properties.
 */

/** ITTC 7.5-02-01-03 standard sea water (salinity 35 g/kg): temperature °C, density kg/m³, kinematic viscosity m²/s. */
export const SEAWATER_TABLE = {
  tempC: [0, 5, 10, 15, 20, 25, 30, 35],
  rhoKgM3: [1028.0, 1027.6, 1026.9, 1025.9, 1024.7, 1023.2, 1021.7, 1019.9],
  nuM2S: [1.8284e-6, 1.5614e-6, 1.3538e-6, 1.1883e-6, 1.0537e-6, 0.9425e-6, 0.8493e-6, 0.7716e-6],
};

export const SALINITY_REF_G_KG = 35;
/** Haline slopes around 35 g/kg (EOS-80, 5–30 °C): density +0.77 kg/m³ per g/kg, viscosity +0.13 % per g/kg. */
export const DRHO_DSAL_KG_M3_PER_G_KG = 0.77;
export const DNU_DSAL_FRAC_PER_G_KG = 0.0013;
/** ISO 15016:2025 reference condition (Annex E): 15 °C, 1026.0 kg/m³. */
export const RHO_REF_ISO_KG_M3 = 1026.0;
export const NU_REF_ISO_M2_S = 1.1883e-6;
/** Default hull roughness when no measurement exists (ISO 15016:2025 E.7 / G.8). */
export const KS_DEFAULT_M = 150e-6;

/** Piecewise-linear interpolation clamped to the table ends. */
export function interpolate(x, xs, ys) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let k = 1;
  while (xs[k] < x) k += 1;
  const t = (x - xs[k - 1]) / (xs[k] - xs[k - 1]);
  return ys[k - 1] + t * (ys[k] - ys[k - 1]);
}

/** Sea water density, kg/m³. */
export function seawaterDensity(tempC, salinityGKg = SALINITY_REF_G_KG) {
  return interpolate(tempC, SEAWATER_TABLE.tempC, SEAWATER_TABLE.rhoKgM3) + DRHO_DSAL_KG_M3_PER_G_KG * (salinityGKg - SALINITY_REF_G_KG);
}

/** Sea water kinematic viscosity, m²/s. */
export function seawaterKinematicViscosity(tempC, salinityGKg = SALINITY_REF_G_KG) {
  return interpolate(tempC, SEAWATER_TABLE.tempC, SEAWATER_TABLE.nuM2S) * (1 + DNU_DSAL_FRAC_PER_G_KG * (salinityGKg - SALINITY_REF_G_KG));
}

/** ITTC-1957 flat-plate friction coefficient. */
export function cfIttc57(reynolds) {
  return 0.075 / (Math.log10(reynolds) - 2) ** 2;
}

/**
 * Hull roughness allowance ΔC_F.
 * 'iso15016' (Townsin form adopted by ISO 15016:2025 E.7/G.8): 0.044[(ks/L)^(1/3) − 10 Re^(−1/3)] + 0.000125, min 0.
 * 'ittc78' (1978 ITTC performance prediction method): [105 (ks/L)^(1/3) − 0.64] × 10⁻³, min 0.
 */
export function roughnessAllowance(reynolds, lppM, ksM, method = 'iso15016') {
  if (method === 'ittc78') return Math.max(0, (105 * (ksM / lppM) ** (1 / 3) - 0.64) * 1e-3);
  return Math.max(0, 0.044 * ((ksM / lppM) ** (1 / 3) - 10 * reynolds ** (-1 / 3)) + 0.000125);
}
