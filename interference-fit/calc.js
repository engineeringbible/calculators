/**
 * interference-fit/calc.js — shrink or press fit of a hub on a shaft by the thick-walled cylinder (Lamé) solution:
 * contact pressure from the diametral interference, torque and axial force the fit can transmit, hoop and
 * equivalent stresses at the bore, and the hub temperature for shrink assembly.
 *
 * p = δ / (d [ (1/E_o)((D_o² + d²)/(D_o² − d²) + ν_o) + (1/E_i)((d² + d_i²)/(d² − d_i²) − ν_i) ])
 * T = μ p π d² L / 2;  F = μ p π d L;  σ_t,hub = p (D_o² + d²)/(D_o² − d²);  σ_t,shaft = −p (d² + d_i²)/(d² − d_i²)
 * ΔT = (δ + clearance) / (α d)
 * Schema units: mm, MPa, N·m, kN, °C.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';

export const schema = {
  id: 'interference-fit',
  name: 'Interference fit',
  category: 'mechanical',
  summary: 'Contact pressure, torque and axial force capacity, bore stresses and shrink-fit temperature of a hub on a solid or hollow shaft.',
  related: ['shaft-torque', 'thermal-expansion', 'bolt-torque', 'bearing-life'],
  assumptions: [
    'Thick-walled cylinders in plane stress (Lamé): a hub of outer diameter D_o on a shaft of bore d_i with the diametral interference δ at the nominal fit diameter d; the contact pressure is uniform over the fit length and the parts stay elastic (Shigley, press and shrink fits).',
    'Torque and axial force are carried by friction, T = μ p π d² L/2 and F = μ p π d L; combined torque and axial load share the same friction, and the friction coefficient for a shrink fit differs from that for pressing in or out.',
    'The interference is the effective one: surface smoothing on assembly reduces the measured interference, and DIN 7190-1 gives the allowance; centrifugal expansion and differences in operating temperature are not included.',
    'Stresses at the bore: hoop stress σ_t = p (D_o² + d²)/(D_o² − d²) and radial stress −p in the hub; the von Mises stress from them is compared with the hub yield strength. Stress concentrations at the hub ends are not included.',
    'Shrink assembly: the hub is heated by ΔT = (δ + clearance)/(α d) above the shaft temperature so that it slides on with the chosen clearance.',
  ],
  notes: [
    'Verification 2026-10-31: equal steel hub and solid shaft (E = 210 GPa), d = 100 mm, D_o = 200 mm, δ = 0.08 mm give p = E δ (D_o² − d²)/(2 d D_o²) = 63.0 MPa, the same-material closed form; with μ = 0.14 and L = 120 mm the fit carries 16.6 kN·m.',
    'Design decision: the assembly clearance and the ambient temperature are inputs; the heating temperature is the ambient plus ΔT and should stay below the temperature that would change the heat treatment of the hub.',
  ],
  sources: [
    'R. G. Budynas, J. K. Nisbett, Shigley\'s Mechanical Engineering Design, 10th ed., McGraw-Hill 2015, 3-16 Press and shrink fits — contact pressure for different materials and for equal materials',
    'DIN 7190-1:2017, Interference fits — calculation and design rules (smoothing of the interference, friction coefficients)',
  ],
  inputs: [
    { id: 'fit_diameter_mm', label: 'Fit diameter d', group: 'length', unit: 'mm', default: 100, min: 1, max: 5000 },
    { id: 'hub_outer_mm', label: 'Hub outer diameter D_o', group: 'length', unit: 'mm', default: 200, min: 1, max: 10000 },
    { id: 'shaft_bore_mm', label: 'Shaft bore d_i (0 for a solid shaft)', group: 'length', unit: 'mm', default: 0, min: 0, max: 5000 },
    { id: 'interference_mm', label: 'Diametral interference δ', group: 'length', unit: 'mm', default: 0.08, min: 0, max: 10 },
    { id: 'fit_length_mm', label: 'Fit length L', group: 'length', unit: 'mm', default: 120, min: 1, max: 5000 },
    { id: 'e_hub_mpa', label: 'Hub Young\'s modulus', group: 'pressure', unit: 'MPa', default: 210000, min: 1000, max: 500000 },
    { id: 'nu_hub', label: 'Hub Poisson\'s ratio', group: 'dimensionless', unit: 'none', default: 0.3, min: 0, max: 0.5 },
    { id: 'e_shaft_mpa', label: 'Shaft Young\'s modulus', group: 'pressure', unit: 'MPa', default: 210000, min: 1000, max: 500000 },
    { id: 'nu_shaft', label: 'Shaft Poisson\'s ratio', group: 'dimensionless', unit: 'none', default: 0.3, min: 0, max: 0.5 },
    { id: 'friction', label: 'Friction coefficient', group: 'dimensionless', unit: 'none', default: 0.14, min: 0.01, max: 1 },
    { id: 'fy_hub_mpa', label: 'Hub yield strength', group: 'pressure', unit: 'MPa', default: 355, min: 10, max: 3000 },
    { id: 'alpha_hub', label: 'Hub thermal expansion coefficient', group: 'thermal_expansion', unit: 'ppm_K', default: 12, min: 0.1, max: 50 },
    { id: 'clearance_mm', label: 'Assembly clearance when hot', group: 'length', unit: 'mm', default: 0.05, min: 0, max: 5 },
    { id: 'ambient_c', label: 'Shaft (ambient) temperature', group: 'temperature', unit: 'C', default: 20, min: -50, max: 100 },
  ],
  outputs: [
    { id: 'pressure_mpa', label: 'Contact pressure p', group: 'pressure', unit: 'MPa' },
    { id: 'torque_knm', label: 'Torque capacity', group: 'torque', unit: 'kN_m' },
    { id: 'axial_kn', label: 'Axial force capacity', group: 'force', unit: 'kN' },
    { id: 'hub_hoop_mpa', label: 'Hub hoop stress at the bore', group: 'pressure', unit: 'MPa' },
    { id: 'hub_vm_mpa', label: 'Hub von Mises stress at the bore', group: 'pressure', unit: 'MPa' },
    { id: 'hub_safety', label: 'Hub safety factor against yield', group: 'dimensionless', unit: 'none' },
    { id: 'shaft_hoop_mpa', label: 'Shaft hoop stress at the fit', group: 'pressure', unit: 'MPa' },
    { id: 'heating_dt_c', label: 'Hub heating above the shaft', group: 'temperature_difference', unit: 'C' },
    { id: 'hub_temperature_c', label: 'Hub temperature for assembly', group: 'temperature', unit: 'C' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      pressure_mpa: '63.0 MPa',
      torque_knm: '16.6 kN·m',
      axial_kn: '333 kN',
      hub_hoop_mpa: '105 MPa',
      hub_vm_mpa: '147 MPa',
      heating_dt_c: '108 °C',
      hub_temperature_c: '128 °C',
    },
  },
};

/** Contact pressure (MPa) of the fit; diameters and interference in mm, moduli in MPa. */
export function contactPressure({ d, outer, bore, interference, eHub, nuHub, eShaft, nuShaft }) {
  const hub = ((outer ** 2 + d ** 2) / (outer ** 2 - d ** 2) + nuHub) / eHub;
  const shaft = ((d ** 2 + bore ** 2) / (d ** 2 - bore ** 2) - nuShaft) / eShaft;
  return interference / (d * (hub + shaft));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.fit_diameter_mm, 'fit_diameter_mm', 'Fit diameter');
  assertPositive(i.hub_outer_mm, 'hub_outer_mm', 'Hub outer diameter');
  assertNonNegative(i.shaft_bore_mm, 'shaft_bore_mm', 'Shaft bore');
  if (i.hub_outer_mm <= i.fit_diameter_mm) throw new Error('The hub outer diameter must be larger than the fit diameter');
  if (i.shaft_bore_mm >= i.fit_diameter_mm) throw new Error('The shaft bore must be smaller than the fit diameter');
  assertNonNegative(i.interference_mm, 'interference_mm', 'Interference');
  assertPositive(i.fit_length_mm, 'fit_length_mm', 'Fit length');
  assertPositive(i.e_hub_mpa, 'e_hub_mpa', 'Hub modulus');
  assertRange(i.nu_hub, 0, 0.5, 'nu_hub', 'Hub Poisson\'s ratio');
  assertPositive(i.e_shaft_mpa, 'e_shaft_mpa', 'Shaft modulus');
  assertRange(i.nu_shaft, 0, 0.5, 'nu_shaft', 'Shaft Poisson\'s ratio');
  assertPositive(i.friction, 'friction', 'Friction coefficient');
  assertPositive(i.fy_hub_mpa, 'fy_hub_mpa', 'Hub yield strength');
  assertPositive(i.alpha_hub, 'alpha_hub', 'Thermal expansion coefficient');
  assertNonNegative(i.clearance_mm, 'clearance_mm', 'Assembly clearance');

  const d = i.fit_diameter_mm;
  const outer = i.hub_outer_mm;
  const bore = i.shaft_bore_mm;
  const p = contactPressure({ d, outer, bore, interference: i.interference_mm, eHub: i.e_hub_mpa, nuHub: i.nu_hub, eShaft: i.e_shaft_mpa, nuShaft: i.nu_shaft });
  const torque = (i.friction * p * Math.PI * d ** 2 * i.fit_length_mm) / 2;
  const axial = i.friction * p * Math.PI * d * i.fit_length_mm;
  const hoop = (p * (outer ** 2 + d ** 2)) / (outer ** 2 - d ** 2);
  const radial = -p;
  const vonMises = Math.sqrt(hoop ** 2 - hoop * radial + radial ** 2);
  const shaftHoop = (-p * (d ** 2 + bore ** 2)) / (d ** 2 - bore ** 2);
  const heating = (i.interference_mm + i.clearance_mm) / (i.alpha_hub * 1e-6 * d);

  const warnings = [];
  if (vonMises >= i.fy_hub_mpa) warnings.push(`The hub yields at the bore: von Mises ${vonMises.toFixed(0)} MPa against ${i.fy_hub_mpa} MPa; the elastic solution no longer holds.`);
  if (i.ambient_c + heating > 250) warnings.push(`Heating the hub to ${(i.ambient_c + heating).toFixed(0)} °C may affect its heat treatment; consider cooling the shaft or a hydraulic fit.`);
  if (i.fit_length_mm / d > 2) warnings.push('A fit longer than twice its diameter has pressure peaks at the hub ends that the uniform-pressure solution does not show.');
  if (i.interference_mm === 0) warnings.push('No interference: the fit carries no torque by friction.');

  return {
    outputs: {
      pressure_mpa: p,
      torque_knm: torque / 1e6,
      axial_kn: axial / 1000,
      hub_hoop_mpa: hoop,
      hub_vm_mpa: vonMises,
      hub_safety: vonMises > 0 ? i.fy_hub_mpa / vonMises : Infinity,
      shaft_hoop_mpa: shaftHoop,
      heating_dt_c: heating,
      hub_temperature_c: i.ambient_c + heating,
      summary: `δ = ${i.interference_mm} mm on d = ${d} mm gives p = ${p.toFixed(1)} MPa: ${(torque / 1e6).toFixed(2)} kN·m or ${(axial / 1000).toFixed(0)} kN by friction (μ = ${i.friction}); hub von Mises ${vonMises.toFixed(0)} MPa at the bore; heat the hub by ${heating.toFixed(0)} °C to assemble.`,
    },
    warnings,
  };
}
