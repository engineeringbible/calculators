/**
 * stawave-added-resistance/calc.js — STAwave-1 (ISO 15016:2025 D.5): mean added resistance in head waves from the
 * ship's beam, the length of the bow section on the waterline and the significant wave height, with the power
 * equivalent at the ship speed.
 *
 * R_AW = (1/16) ρ g H_{1/3}² B √(B / L_BWL),  valid for waves within ±45° of the bow and small heave and pitch.
 * Schema units: m, kn, °C, kW.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';
import { seawaterDensity } from '../shared/seawater.js';

const G = 9.80665;
const KN_TO_M_S = 1852 / 3600;

export const schema = {
  id: 'stawave-added-resistance',
  name: 'Added resistance in waves (STAwave-1)',
  category: 'maritime',
  summary: 'ISO 15016 STAwave-1 added resistance in head waves from beam, bow length and significant wave height, with the power increase at speed.',
  related: ['wave-properties', 'holtrop-mennen', 'shallow-water-speed', 'water-temperature-correction', 'beaufort-sea-state'],
  assumptions: [
    'STAwave-1 estimates the mean resistance increase in irregular head waves for speed-trial conditions: short waves relative to the ship, small heave and pitch, where the added resistance is dominated by wave reflection at the bow; R_AW = (1/16) ρ_act g H_{1/3}² B √(B/L_BWL) (ISO 15016:2025 Formula D.31), with B the moulded breadth and L_BWL the distance from the bow to the point where the waterline reaches 95 % of the maximum breadth.',
    'The method applies only to waves within ±45° of the bow; for other directions ISO applies no wave correction, and this page returns zero with a warning. It carries no speed, wave-period or spectrum dependence: the result is the same at 5 and 15 kn and for any wave period, which is adequate only where the wave length is short compared with the ship (speed-trial sea states).',
    'For long waves, large motions, following seas or ocean conditions the SNNM method (ISO 15016:2025 D.4, spectral) or model tests are required; STAwave-1 then underestimates (ship motions add resistance) or misattributes the effect.',
    'Power equivalent ΔP = R_AW V_S/η_D at constant speed with the propulsive efficiency unchanged (ISO uses η_Did from the tank tests); the percentage is relative to the delivered power entered.',
    'Water density from the ITTC 7.5-02-01-03 table at the temperature and salinity entered (shared/seawater.js).',
  ],
  notes: [
    'Verification 2026-10-31: B 32 m, L_BWL 40 m, H_{1/3} 2.0 m in 15 °C sea water → R_AW = 1/16 × 1025.9 × 9.80665 × 4 × 32 × √0.8 = 71.99 kN; at 12 kn with η_D 0.70 that is 635 kW, 12.7 % of 5 000 kW — the order of magnitude of a trial-condition wave correction for a Panamax hull.',
    'Design decision: the direction gate is implemented as ISO states it (zero outside ±45°) rather than a cosine taper, so the page reproduces the standard; L_BWL is an input because it must be read from the lines plan (typically 0.10–0.25 L_PP for full and fine hulls respectively).',
  ],
  sources: [
    'ISO 15016:2025 Ships and marine technology — Guidelines for the assessment of speed and power performance by analysis of speed trial data, D.5 STAWAVE-1 (Formula D.31, Figure D.2)',
    'STA-JIP (Sea Trial Analysis Joint Industry Project), Boom, H. van den, Huisman, H., Mennen, F., "New Guidelines for Speed/Power Trials", SWZ Maritime, 2013',
    'ITTC Recommended Procedure 7.5-04-01-01.1, Preparation, Conduct and Analysis of Speed/Power Trials (2017) — STAwave-1 validation 2014',
    'ITTC 7.5-02-01-03 Fresh Water and Seawater Properties (density)',
  ],
  inputs: [
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 32, min: 2, max: 80 },
    { id: 'lbwl_m', label: 'Bow length on the waterline L_BWL (bow to 95 % of max breadth)', group: 'length', unit: 'm', default: 40, min: 1, max: 200, help: 'From the lines plan; typically 0.10 L_PP (full hulls) to 0.25 L_PP (fine hulls).' },
    { id: 'hs_m', label: 'Significant wave height H_1/3', group: 'length', unit: 'm', default: 2.0, min: 0, max: 15 },
    { id: 'wave_dir_deg', label: 'Wave direction relative to the bow (0 = head, 180 = following)', group: 'angle', unit: 'deg', default: 0, min: 0, max: 180 },
    { id: 'water_temp_c', label: 'Sea water temperature', group: 'temperature', unit: 'C', default: 15, min: -2, max: 40 },
    { id: 'salinity_g_kg', label: 'Salinity (g/kg)', group: 'dimensionless', unit: 'none', default: 35, min: 0, max: 45 },
    { id: 'speed_kn', label: 'Ship speed through water', group: 'speed', unit: 'kn', default: 12, min: 0.5, max: 40 },
    { id: 'eta_d', label: 'Propulsive efficiency η_D', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.3, max: 0.9 },
    { id: 'delivered_power_kw', label: 'Delivered power at this speed (for the percentage)', group: 'power', unit: 'kW', default: 5000, min: 1, max: 200000 },
  ],
  outputs: [
    { id: 'rho', label: 'Water density ρ', group: 'density', unit: 'kg_m3' },
    { id: 'beam_ratio', label: '√(B / L_BWL)', group: 'dimensionless', unit: 'none' },
    { id: 'r_aw_n', label: 'Added resistance in waves R_AW', group: 'force', unit: 'N', display: 'kN' },
    { id: 'r_aw_per_hs2', label: 'R_AW per m² of H_1/3² (kN/m²)', group: 'dimensionless', unit: 'none' },
    { id: 'power_increase_w', label: 'Power equivalent R_AW V_S/η_D', group: 'power', unit: 'W', display: 'kW' },
    { id: 'power_increase_pct', label: 'Share of the delivered power', group: 'ratio', unit: 'pct' },
    { id: 'applicability', label: 'Applicability', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      rho: '1025.9 kg/m³',
      beam_ratio: '0.894',
      r_aw_n: '72.0 kN',
      power_increase_w: '635 kW',
      power_increase_pct: '12.7 %',
    },
  },
};

/** STAwave-1 added resistance, N. */
export function stawave1(rhoKgM3, hsM, beamM, lbwlM) {
  return (rhoKgM3 * G * hsM * hsM * beamM * Math.sqrt(beamM / lbwlM)) / 16;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.lbwl_m, 'lbwl_m', 'Bow length');
  assertNonNegative(i.hs_m, 'hs_m', 'Wave height');
  assertRange(i.wave_dir_deg, 0, 180, 'wave_dir_deg', 'Wave direction');
  assertRange(i.water_temp_c, -2, 40, 'water_temp_c', 'Water temperature');
  assertRange(i.salinity_g_kg, 0, 45, 'salinity_g_kg', 'Salinity');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');
  assertRange(i.eta_d, 0.2, 1, 'eta_d', 'Propulsive efficiency');
  assertPositive(i.delivered_power_kw, 'delivered_power_kw', 'Delivered power');

  const rho = seawaterDensity(i.water_temp_c, i.salinity_g_kg);
  const inSector = i.wave_dir_deg <= 45;
  const rAw = inSector ? stawave1(rho, i.hs_m, i.beam_m, i.lbwl_m) : 0;
  const V = i.speed_kn * KN_TO_M_S;
  const dP = (rAw * V) / i.eta_d;

  const warnings = [];
  if (!inSector) warnings.push(`Wave direction ${i.wave_dir_deg}° is outside the bow sector (≤ 45°): ISO 15016 applies no STAwave-1 correction — R_AW = 0. Use the SNNM method for beam and following seas.`);
  if (i.hs_m > 3) warnings.push('Significant wave height above 3 m: outside speed-trial sea states; heave and pitch are no longer small and STAwave-1 underestimates the added resistance.');
  if (i.lbwl_m > 0.3 * i.beam_m * 8) warnings.push('Bow length looks long for the breadth: check that L_BWL is measured to 95 % of the maximum breadth, not to midships.');
  if (i.lbwl_m < i.beam_m * 0.5) warnings.push('Bow length shorter than half the breadth: a very blunt bow; check the value from the lines plan.');
  warnings.push('No dependence on speed, wave period or spectrum: valid for short waves relative to the ship (speed-trial conditions); ocean conditions need the SNNM spectral method or model tests.');
  warnings.push('Propulsive efficiency assumed unchanged by the added load (ISO uses the tank-test η_Did).');

  return {
    outputs: {
      rho,
      beam_ratio: Math.sqrt(i.beam_m / i.lbwl_m),
      r_aw_n: rAw,
      r_aw_per_hs2: i.hs_m > 0 ? rAw / 1000 / (i.hs_m * i.hs_m) : stawave1(rho, 1, i.beam_m, i.lbwl_m) / 1000,
      power_increase_w: dP,
      power_increase_pct: (dP / (i.delivered_power_kw * 1000)) * 100,
      applicability: inSector
        ? `Within the STAwave-1 range: waves ${i.wave_dir_deg}° off the bow (≤ 45°), H_1/3 ${i.hs_m} m${i.hs_m > 3 ? ' (above trial sea states)' : ''}, small-motion assumption`
        : `Outside the bow sector (${i.wave_dir_deg}° > 45°): no correction per ISO 15016 — SNNM required`,
    },
    warnings,
  };
}
