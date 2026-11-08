/**
 * cathodic-protection/calc.js — sacrificial (galvanic) anode design by the DNV-RP-B401 method: current demand with
 * coating breakdown, anode mass from charge capacity and utilisation, anode count, current output from the anode
 * resistance, and a simplified ship-hull mode with user current densities per area.
 *
 * I_c = A i_c f_c;  f_c = a + b t;  M = I_cm t_f 8760/(u ε);  I_a = (E_c − E_a)/R_a;  life = M u ε/(I_cm 8760).
 * Schema units: m², years, A/m² (display mA/m²), kg, A, Ω, Ω·m.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** DNV-RP-B401 (2021) Table 8-1 initial/final and Table 8-2 mean design current densities, A/m², bare steel. */
export const CURRENT_DENSITY = {
  tropical: { label: 'Tropical (> 20 °C)', bands: { '0_30': [0.15, 0.07, 0.1], '30_100': [0.12, 0.06, 0.08], '100_300': [0.14, 0.07, 0.09], '300': [0.18, 0.09, 0.13] } },
  subtropical: { label: 'Sub-tropical (12–20 °C)', bands: { '0_30': [0.17, 0.08, 0.11], '30_100': [0.14, 0.07, 0.09], '100_300': [0.16, 0.08, 0.11], '300': [0.2, 0.1, 0.15] } },
  temperate: { label: 'Temperate (7–12 °C)', bands: { '0_30': [0.2, 0.1, 0.13], '30_100': [0.17, 0.08, 0.11], '100_300': [0.19, 0.09, 0.14], '300': [0.22, 0.11, 0.17] } },
  arctic: { label: 'Arctic (< 7 °C)', bands: { '0_30': [0.25, 0.12, 0.17], '30_100': [0.2, 0.1, 0.13], '100_300': [0.22, 0.11, 0.17], '300': [0.22, 0.11, 0.17] } },
};
export const DEPTH_BANDS = { '0_30': '0–30 m', '30_100': '> 30–100 m', '100_300': '> 100–300 m', '300': '> 300 m' };

/** Table 8-4 coating breakdown constants a, b (per year) for 0–30 m and > 30 m. */
export const COATING = {
  bare: { label: 'Bare steel (no coating, f_c = 1)', a: null, b: null },
  I: { label: 'Category I — one layer epoxy, ≥ 20 µm (shop primer)', a: 0.1, b: { shallow: 0.1, deep: 0.05 } },
  II: { label: 'Category II — one or more layers marine paint, ≥ 250 µm', a: 0.05, b: { shallow: 0.025, deep: 0.015 } },
  III: { label: 'Category III — two or more layers epoxy, ≥ 350 µm', a: 0.02, b: { shallow: 0.012, deep: 0.008 } },
  IV: { label: 'Category IV — NORSOK M-501 system 3B/7, ≥ 350 µm', a: 0.02, b: { shallow: 0.008, deep: 0.005 } },
};

/** Table 8-6 anode materials in seawater ≤ 30 °C. */
export const ANODE_MATERIALS = {
  al: { label: 'Al-Zn-In alloy (2 000 Ah/kg, −1.05 V)', capacity: 2000, potential: -1.05, density: 2750 },
  zn: { label: 'Zinc (780 Ah/kg, −1.03 V)', capacity: 780, potential: -1.03, density: 7130 },
};

/** Tables 8-7 and 8-8 anode types: utilisation factor and resistance formula. */
export const ANODE_TYPES = {
  long_standoff: { label: 'Long slender stand-off (L ≥ 4r): u 0.90', u: 0.9 },
  short_standoff: { label: 'Short slender stand-off (L < 4r): u 0.85', u: 0.85 },
  long_flush: { label: 'Long flush-mounted (L ≥ 4 × width and thickness): u 0.85', u: 0.85 },
  bracelet_flush: { label: 'Short flush-mounted, bracelet, hull anodes: u 0.80', u: 0.8 },
};

export const PROTECTIVE_POTENTIAL_V = -0.8;

export const schema = {
  id: 'cathodic-protection',
  name: 'Cathodic protection anodes',
  category: 'maritime',
  summary: 'Sacrificial anode mass, number and life for a hull or tank from surface area, coating breakdown and current density (DNV-RP-B401).',
  related: ['paint-coverage', 'hydrostatics', 'tank-volume', 'pressure-vessel'],
  assumptions: [
    'Galvanic (sacrificial) anode design following DNV-RP-B401 (2021): the mean current demand I_cm = A i_cm f_cm sets the anode mass through the charge capacity, M = I_cm t_f 8760/(u ε); the initial and final demands I_ci = A i_ci f_ci and I_cf = A i_cf f_cf must be met by the total anode current output N (E_c − E_a)/R_a, where E_c = −0.80 V is the protective potential, E_a the closed-circuit anode potential and R_a the anode resistance from the Table 8-7 formulas.',
    'Design current densities are the RP-B401 Tables 8-1 and 8-2 values for bare steel by climatic region and depth band (open sea, uncoated, average flow); coating breakdown f_c = a + b t uses the Table 8-4 constants for categories I–IV with mean f_cm = a + b t_f/2 and final f_cf = a + b t_f (capped at 1); the initial breakdown is f_ci = a.',
    'Ship-hull mode replaces the offshore tables by user current densities per area — coated hull 10–20 mA/m² (+5 mA/m² for dockings beyond 30 months or high coating wear, as class guidance recommends), propeller ≈ 500 mA/m² when bonded, uncoated appendages 100–150 mA/m² — and takes initial = mean = final; the design life is the docking interval. Class rules (DNV-CG-0288, ABS) and ICCP interaction are not reproduced.',
    'Anode material data from Table 8-6 for seawater ≤ 30 °C: Al-Zn-In 2 000 Ah/kg at −1.05 V, zinc 780 Ah/kg at −1.03 V; capacities fall at higher temperature and in sediments (Al 1 500 Ah/kg in sediments), and zinc above 50 °C needs qualification. Utilisation factors from Table 8-8 by anode type.',
    'Anode resistance: long slender stand-off R_a = ρ/(2πL)(ln(4L/r) − 1) with r the equivalent radius from the cross-section periphery; short stand-off and flush/bracelet formulas as in Table 8-7; seawater resistivity is an input (about 0.20 Ω·m tropical, 0.30 Ω·m temperate). The final current output is estimated with the same resistance (RP-B401 asks for the consumed anode dimensions), so the final check is approximate.',
    'Current drain to other structures (chains, wells, reinforcing steel), stray currents, electrical continuity and anode distribution are outside the calculation; the result is the required inventory, not a layout.',
  ],
  notes: [
    'Verification 2026-10-30: table values transcribed from the DNV-RP-B401 May 2021 PDF (Tables 8-1, 8-2, 8-4, 8-6, 8-7, 8-8); temperate 0–30 m category II at 25 years gives f_cm 0.3625, f_cf 0.675, I_cm 36.25 A for 1 000 m² and 4 410 kg of Al anodes at u 0.90; a 2 m × r 0.1 m stand-off anode in 0.30 Ω·m water has R_a 0.0807 Ω and 3.10 A initial output.',
    'Design decision: two modes (offshore structure with the RP-B401 tables; ship hull with per-area densities) because class hull tables are not public and hull practice works in mA/m² per area.',
    'Design decision: the final current check is reported with the warning that RP-B401 requires the resistance of the consumed anode; typical practice uses the utilisation-reduced length and mass.',
  ],
  sources: [
    'DNV-RP-B401, Cathodic protection design, edition May 2021, Sec. 3 (design parameters), Sec. 4 (calculation procedures) and Sec. 8 Tables 8-1 to 8-8',
    'ISO 12473:2017 General principles of cathodic protection in seawater; ISO 15589-2 (offshore pipelines)',
    'DNV-CG-0288 Corrosion protection of ships (2021) and Cathwell design notes — hull current density practice (+5 mA/m² beyond 30 months, 500 mA/m² for propellers)',
    'NACE SP0176 / Peabody\'s Control of Pipeline Corrosion — Dwight anode resistance formula',
  ],
  inputs: [
    { id: 'mode', label: 'Structure', type: 'select', default: 'hull', options: [{ value: 'hull', label: 'Ship hull / appendages (current densities per area)' }, { value: 'offshore', label: 'Offshore structure or tank (DNV-RP-B401 tables and coating breakdown)' }] },
    { id: 'area_m2', label: 'Coated hull wetted area / structure surface area', group: 'area', unit: 'm2', default: 6000, min: 1, max: 1e6 },
    { id: 'design_life_y', label: 'Design life (docking interval for hulls)', group: 'dimensionless', unit: 'none', default: 2.5, min: 0.1, max: 60, help: 'Years.' },
    { id: 'hull_density_a_m2', label: 'Coated hull mean current density', group: 'current_density', unit: 'A_m2', display: 'mA_m2', default: 0.015, min: 0.001, max: 1, visibleWhen: { mode: 'hull' }, help: 'Coated hull 10–20 mA/m²; +5 mA/m² beyond 30 months.' },
    { id: 'extend_30_months', label: 'Add 5 mA/m² for docking interval > 30 months or high coating wear', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Automatic (when design life > 2.5 years)' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], visibleWhen: { mode: 'hull' } },
    { id: 'propeller_area_m2', label: 'Propeller area (0 if not bonded / not protected)', group: 'area', unit: 'm2', default: 40, min: 0, max: 1000, visibleWhen: { mode: 'hull' } },
    { id: 'propeller_density_a_m2', label: 'Propeller current density', group: 'current_density', unit: 'A_m2', display: 'mA_m2', default: 0.5, min: 0, max: 2, visibleWhen: { mode: 'hull' } },
    { id: 'bare_area_m2', label: 'Uncoated or damaged steel area (rudder, sea chests, appendages)', group: 'area', unit: 'm2', default: 50, min: 0, max: 1e5, visibleWhen: { mode: 'hull' } },
    { id: 'bare_density_a_m2', label: 'Uncoated steel current density', group: 'current_density', unit: 'A_m2', display: 'mA_m2', default: 0.12, min: 0, max: 1, visibleWhen: { mode: 'hull' } },
    { id: 'region', label: 'Climatic region (surface water temperature)', type: 'select', default: 'temperate', options: Object.entries(CURRENT_DENSITY).map(([value, r]) => ({ value, label: r.label })), visibleWhen: { mode: 'offshore' } },
    { id: 'depth_band', label: 'Depth band', type: 'select', default: '0_30', options: Object.entries(DEPTH_BANDS).map(([value, label]) => ({ value, label })), visibleWhen: { mode: 'offshore' } },
    { id: 'coating', label: 'Coating category (RP-B401 §3.4.6)', type: 'select', default: 'II', options: Object.entries(COATING).map(([value, c]) => ({ value, label: c.label })), visibleWhen: { mode: 'offshore' } },
    { id: 'material', label: 'Anode material', type: 'select', default: 'zn', options: Object.entries(ANODE_MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'anode_type', label: 'Anode type (utilisation and resistance formula)', type: 'select', default: 'bracelet_flush', options: Object.entries(ANODE_TYPES).map(([value, t]) => ({ value, label: t.label })) },
    { id: 'anode_mass_kg', label: 'Net mass of one anode', group: 'mass', unit: 'kg', default: 20, min: 0.1, max: 2000 },
    { id: 'anode_length_m', label: 'Anode length L', group: 'length', unit: 'm', default: 0.6, min: 0.05, max: 5 },
    { id: 'anode_width_m', label: 'Anode width (flush: exposed face width)', group: 'length', unit: 'm', default: 0.15, min: 0.01, max: 1 },
    { id: 'anode_thickness_m', label: 'Anode thickness', group: 'length', unit: 'm', default: 0.05, min: 0.005, max: 0.5 },
    { id: 'resistivity_ohm_m', label: 'Seawater resistivity ρ', group: 'dimensionless', unit: 'none', default: 0.25, min: 0.1, max: 5, help: 'Ω·m: ≈ 0.20 tropical, 0.30 temperate, 0.35+ cold or brackish.' },
  ],
  outputs: [
    { id: 'fc_initial', label: 'Coating breakdown f_c initial / mean / final — initial', group: 'dimensionless', unit: 'none' },
    { id: 'fc_mean', label: 'Coating breakdown — mean', group: 'dimensionless', unit: 'none' },
    { id: 'fc_final', label: 'Coating breakdown — final', group: 'dimensionless', unit: 'none' },
    { id: 'density_used_a_m2', label: 'Mean design current density used (hull) / bare-steel mean (offshore)', group: 'current_density', unit: 'A_m2', display: 'mA_m2' },
    { id: 'current_initial_a', label: 'Initial current demand I_ci', group: 'current', unit: 'A' },
    { id: 'current_mean_a', label: 'Mean current demand I_cm', group: 'current', unit: 'A' },
    { id: 'current_final_a', label: 'Final current demand I_cf', group: 'current', unit: 'A' },
    { id: 'charge_ah', label: 'Total charge over the design life I_cm × t_f × 8760 (Ah)', group: 'dimensionless', unit: 'none' },
    { id: 'mass_required_kg', label: 'Net anode mass required M = Q/(u ε)', group: 'mass', unit: 'kg' },
    { id: 'anode_count', label: 'Number of anodes (rounded up)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mass_installed_kg', label: 'Installed net anode mass', group: 'mass', unit: 'kg' },
    { id: 'life_installed_y', label: 'Life of the installed anodes at the mean demand (years)', group: 'dimensionless', unit: 'none' },
    { id: 'anode_resistance_ohm', label: 'Anode resistance R_a (new anode)', group: 'resistance', unit: 'ohm' },
    { id: 'anode_output_a', label: 'Current output per anode (E_c − E_a)/R_a', group: 'current', unit: 'A' },
    { id: 'total_output_a', label: 'Total initial output N × I_a', group: 'current', unit: 'A' },
    { id: 'output_check', label: 'Current output check (initial and final demand)', type: 'text' },
    { id: 'anodes_per_100m2', label: 'Anodes per 100 m² of protected area', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      current_initial_a: '116 A',
      current_mean_a: '116 A',
      current_final_a: '116 A',
      mass_required_kg: '4 070 kg',
      anode_count: '204',
      anode_resistance_ohm: '0.26 Ω',
      anode_output_a: '0.88 A',
      total_output_a: '179 A',
    },
  },
};

/** Anode resistance (Ω) by RP-B401 Table 8-7. */
export function anodeResistance(type, rho, L, width, thickness) {
  if (type === 'long_standoff' || type === 'short_standoff') {
    const r = (2 * (width + thickness)) / (2 * Math.PI);
    if (type === 'long_standoff') return (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / r) - 1);
    const q = r / (2 * L);
    return (rho / (2 * Math.PI * L)) * (Math.log((2 * L) / r * (1 + Math.sqrt(1 + q * q))) + q - Math.sqrt(1 + q * q));
  }
  if (type === 'long_flush') return rho / (2 * ((L + width) / 2));
  return (0.315 * rho) / Math.sqrt(L * width);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['hull', 'offshore'], 'mode', 'Structure');
  assertOneOf(i.material, Object.keys(ANODE_MATERIALS), 'material', 'Anode material');
  assertOneOf(i.anode_type, Object.keys(ANODE_TYPES), 'anode_type', 'Anode type');
  assertPositive(i.area_m2, 'area_m2', 'Area');
  assertPositive(i.design_life_y, 'design_life_y', 'Design life');
  assertPositive(i.anode_mass_kg, 'anode_mass_kg', 'Anode mass');
  assertPositive(i.anode_length_m, 'anode_length_m', 'Anode length');
  assertPositive(i.anode_width_m, 'anode_width_m', 'Anode width');
  assertPositive(i.anode_thickness_m, 'anode_thickness_m', 'Anode thickness');
  assertPositive(i.resistivity_ohm_m, 'resistivity_ohm_m', 'Resistivity');

  let fci;
  let fcm;
  let fcf;
  let Ici;
  let Icm;
  let Icf;
  let densityUsed;
  const warnings = [];
  if (i.mode === 'offshore') {
    assertOneOf(i.region, Object.keys(CURRENT_DENSITY), 'region', 'Region');
    assertOneOf(i.depth_band, Object.keys(DEPTH_BANDS), 'depth_band', 'Depth band');
    assertOneOf(i.coating, Object.keys(COATING), 'coating', 'Coating');
    const [iInit, iMean, iFinal] = CURRENT_DENSITY[i.region].bands[i.depth_band];
    const c = COATING[i.coating];
    if (c.a === null) {
      fci = 1; fcm = 1; fcf = 1;
    } else {
      const b = i.depth_band === '0_30' ? c.b.shallow : c.b.deep;
      fci = c.a;
      fcm = Math.min(1, c.a + (b * i.design_life_y) / 2);
      fcf = Math.min(1, c.a + b * i.design_life_y);
      if (c.a + b * i.design_life_y > 1) warnings.push('Coating breakdown reaches 100 % before the end of the design life: the mean factor is computed with f_c capped at 1 (RP-B401 §3.4.8 — recalculate the mean when f_cf > 1).');
    }
    densityUsed = iMean;
    Ici = i.area_m2 * iInit * fci;
    Icm = i.area_m2 * iMean * fcm;
    Icf = i.area_m2 * iFinal * fcf;
  } else {
    assertOneOf(i.extend_30_months, ['auto', 'yes', 'no'], 'extend_30_months', 'Extension');
    assertPositive(i.hull_density_a_m2, 'hull_density_a_m2', 'Hull current density');
    assertNonNegative(i.propeller_area_m2, 'propeller_area_m2', 'Propeller area');
    assertNonNegative(i.propeller_density_a_m2, 'propeller_density_a_m2', 'Propeller current density');
    assertNonNegative(i.bare_area_m2, 'bare_area_m2', 'Bare area');
    assertNonNegative(i.bare_density_a_m2, 'bare_density_a_m2', 'Bare current density');
    const extend = i.extend_30_months === 'yes' || (i.extend_30_months === 'auto' && i.design_life_y > 2.5);
    densityUsed = i.hull_density_a_m2 + (extend ? 0.005 : 0);
    if (extend) warnings.push('5 mA/m² added to the coated-hull current density for a docking interval beyond 30 months (class guidance).');
    Icm = i.area_m2 * densityUsed + i.propeller_area_m2 * i.propeller_density_a_m2 + i.bare_area_m2 * i.bare_density_a_m2;
    Ici = Icm;
    Icf = Icm;
    fci = null; fcm = null; fcf = null;
  }

  const mat = ANODE_MATERIALS[i.material];
  const type = ANODE_TYPES[i.anode_type];
  const chargeAh = Icm * i.design_life_y * 8760;
  const massRequired = chargeAh / (type.u * mat.capacity);
  const count = Math.max(1, Math.ceil(massRequired / i.anode_mass_kg));
  const installed = count * i.anode_mass_kg;
  const life = (installed * type.u * mat.capacity) / (Icm * 8760);
  const Ra = anodeResistance(i.anode_type, i.resistivity_ohm_m, i.anode_length_m, i.anode_width_m, i.anode_thickness_m);
  const Ia = (PROTECTIVE_POTENTIAL_V - mat.potential) / Ra;
  const totalOutput = count * Ia;

  let check;
  if (totalOutput >= Ici && totalOutput >= Icf) check = `OK — ${count} anodes deliver ${totalOutput.toFixed(1)} A ≥ initial ${Ici.toFixed(1)} A and final ${Icf.toFixed(1)} A (final checked with new-anode resistance)`;
  else {
    const needed = Math.ceil(Math.max(Ici, Icf) / Ia);
    check = `INSUFFICIENT OUTPUT — ${count} anodes deliver ${totalOutput.toFixed(1)} A against ${Math.max(Ici, Icf).toFixed(1)} A demand: use ${needed} anodes or a longer/thinner anode shape (lower R_a)`;
    warnings.push('Mass is sufficient but the anodes cannot deliver the peak current: the number is governed by current output, not by mass — increase the count or choose a slender stand-off shape.');
  }

  if (i.mode === 'hull' && i.propeller_area_m2 > 0) warnings.push('Propeller protected through the shaft earthing: the 500 mA/m² drain assumes a bonded (slip-ring) propeller; without bonding the propeller is unprotected and the drain vanishes.');
  if (i.anode_type.includes('standoff') && i.anode_length_m < 4 * ((2 * (i.anode_width_m + i.anode_thickness_m)) / (2 * Math.PI)) && i.anode_type === 'long_standoff') warnings.push('L < 4r: the long slender stand-off formula is outside its range; choose the short stand-off type.');
  if (i.material === 'zn' && i.mode === 'offshore' && i.depth_band === '300') warnings.push('Zinc at depth/low temperature: check the anode potential and capacity for the ambient conditions (Table 8-6 notes).');
  warnings.push('Final current output is estimated with the new-anode resistance; RP-B401 requires the resistance of the anode consumed to its utilisation factor for the final check.');
  warnings.push('Inventory only: anode distribution, current drain to other structures, ICCP interaction and class-specific hull tables (DNV-CG-0288, ABS) are not covered.');

  return {
    outputs: {
      fc_initial: fci,
      fc_mean: fcm,
      fc_final: fcf,
      density_used_a_m2: densityUsed,
      current_initial_a: Ici,
      current_mean_a: Icm,
      current_final_a: Icf,
      charge_ah: chargeAh,
      mass_required_kg: massRequired,
      anode_count: count,
      mass_installed_kg: installed,
      life_installed_y: life,
      anode_resistance_ohm: Ra,
      anode_output_a: Ia,
      total_output_a: totalOutput,
      output_check: check,
      anodes_per_100m2: (count / i.area_m2) * 100,
    },
    warnings,
  };
}
