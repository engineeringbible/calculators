/**
 * pipe-insulation/calc.js — steady heat loss through a pipe wall and up to two insulation layers (cylindrical
 * conduction with inside and outside film resistances) or through a flat multi-layer wall; surface temperature,
 * bare-surface comparison, critical radius, heating power and annual energy.
 *
 * q = ΔT / ΣR;  R_cyl = ln(r_o/r_i)/(2πkL);  R_film = 1/(h A);  r_cr = k/h_o.
 * Schema units: m, W/(m·K), W/(m²·K), °C, W.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'pipe-insulation',
  name: 'Pipe and tank insulation heat loss',
  category: 'thermal',
  summary: 'Heat loss through multi-layer cylindrical or flat insulation, surface temperature and the heating power to hold a fuel tank or line warm.',
  related: ['heat-exchanger-lmtd', 'engine-room-ventilation', 'fuel-blend-heating', 'thermal-expansion'],
  assumptions: [
    'One-dimensional steady conduction through concentric cylindrical layers (pipe wall, up to two insulation layers) or a flat wall, in series with the inside film coefficient and a combined outside convection-plus-radiation coefficient h_o; axial conduction, supports, flanges, valves and thermal bridges are not included — add 10–20 % for a real line.',
    'Thermal conductivities are constant at their mean temperature (mineral wool 0.035–0.045 W/(m·K) at 50 °C rising to 0.06–0.08 at 200 °C; the user should enter the value at the mean insulation temperature, iterating once if needed).',
    'The outside coefficient includes radiation: still air indoors 8–10 W/(m²·K) for cladded insulation at near-ambient surface temperature, 20–30 in wind; the surface temperature result allows the user to check the personnel-protection limit (60 °C for metal cladding per CINI/ASTM C1055).',
    'Bare-surface comparison uses the same inside film and outside coefficient on the uninsulated pipe wall; in reality the bare hot pipe has a higher h_o (radiation grows with temperature), so the saving is slightly understated.',
    'The critical radius of insulation r_cr = k/h_o (cylinder) marks where adding insulation stops increasing the loss; it is only relevant for small pipes or cables with poor insulation (a few millimetres for k 0.04 and h 10).',
    'Heating power equals the steady loss at the design ambient; heat-up from cold, wind chill on exposed decks and tank contents stratification are outside the calculation.',
  ],
  notes: [
    'Verification 2026-10-30: 4-inch steel pipe (114.3 mm OD, 6 mm wall, k 50) at 150 °C with 50 mm mineral wool (k 0.04) in 25 °C air (h_i 1 000, h_o 10): resistances 0.00311 + 0.00035 + 2.501 + 0.1485 = 2.653 K·m/W → 47.1 W/m, surface 32.0 °C; bare pipe 443 W/m (R 0.282) → 89 % saving; critical radius 4 mm. Flat-wall check: 100 mm of k 0.04 with h_o 10 and h_i 1 000 at ΔT 125 K → 48.0 W/m².',
    'Design decision: the outside coefficient is a single input rather than computed from wind and emissivity, because the free-convection and radiation correlations would add a dozen inputs for a 10–20 % effect; the register records the typical values.',
  ],
  sources: [
    'F. P. Incropera, D. P. DeWitt et al., Fundamentals of Heat and Mass Transfer, 7th ed. (Wiley 2011) §3.3 radial systems, critical insulation radius',
    'Y. A. Çengel & A. J. Ghajar, Heat and Mass Transfer, 5th ed. (McGraw-Hill 2015) ch. 3 steady conduction, thermal resistance networks',
    'ISO 12241:2008 Thermal insulation for building equipment and industrial installations — Calculation rules (surface coefficients, layered pipes)',
    'CINI Manual / ASTM C1055 — personnel protection surface temperature 60 °C; VDI 2055 Thermal insulation of heated and refrigerated operational installations',
  ],
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'select', default: 'pipe', options: [{ value: 'pipe', label: 'Pipe (cylindrical layers), results per metre' }, { value: 'flat', label: 'Flat wall (tank side, bulkhead), results per m²' }] },
    { id: 'pipe_od_m', label: 'Pipe outside diameter', group: 'length', unit: 'm', display: 'mm', default: 0.1143, min: 0.005, max: 5, visibleWhen: { geometry: 'pipe' } },
    { id: 'wall_m', label: 'Pipe wall thickness', group: 'length', unit: 'm', display: 'mm', default: 0.006, min: 0, max: 0.1 },
    { id: 'k_wall', label: 'Pipe / tank wall conductivity', group: 'thermal_conductivity', unit: 'W_mK', default: 50, min: 0.1, max: 500, help: 'Carbon steel ≈ 50, stainless 16, copper 390.' },
    { id: 'ins1_m', label: 'Insulation layer 1 thickness', group: 'length', unit: 'm', display: 'mm', default: 0.05, min: 0, max: 1 },
    { id: 'k1', label: 'Layer 1 conductivity (at mean temperature)', group: 'thermal_conductivity', unit: 'W_mK', default: 0.04, min: 0.01, max: 5, help: 'Mineral wool 0.035–0.045 at 50 °C; calcium silicate 0.06; PUR 0.025.' },
    { id: 'ins2_m', label: 'Insulation layer 2 thickness (0 = none)', group: 'length', unit: 'm', display: 'mm', default: 0, min: 0, max: 1 },
    { id: 'k2', label: 'Layer 2 conductivity', group: 'thermal_conductivity', unit: 'W_mK', default: 0.03, min: 0.01, max: 5 },
    { id: 't_inside_c', label: 'Fluid / contents temperature', group: 'temperature', unit: 'C', default: 150, min: -200, max: 800 },
    { id: 'h_inside', label: 'Inside film coefficient h_i (large for liquids/steam)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 1000, min: 1, max: 50000 },
    { id: 't_ambient_c', label: 'Ambient temperature', group: 'temperature', unit: 'C', default: 25, min: -60, max: 60 },
    { id: 'h_outside', label: 'Outside coefficient h_o (convection + radiation)', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 10, min: 1, max: 200, help: 'Still air 8–10; wind 20–30 W/(m²·K).' },
    { id: 'length_m', label: 'Pipe length (pipe) or wall area (flat)', group: 'length', unit: 'm', default: 10, min: 0.01, max: 10000 },
    { id: 'hours_per_year', label: 'Operating hours per year', group: 'dimensionless', unit: 'none', default: 6000, min: 0, max: 8760 },
  ],
  outputs: [
    { id: 'r_inside', label: 'Inside film resistance (per m or per m²)', group: 'dimensionless', unit: 'none' },
    { id: 'r_wall', label: 'Pipe / tank wall resistance', group: 'dimensionless', unit: 'none' },
    { id: 'r_ins1', label: 'Insulation layer 1 resistance', group: 'dimensionless', unit: 'none' },
    { id: 'r_ins2', label: 'Insulation layer 2 resistance', group: 'dimensionless', unit: 'none' },
    { id: 'r_outside', label: 'Outside film resistance', group: 'dimensionless', unit: 'none' },
    { id: 'r_total', label: 'Total resistance (K·m/W pipe, K·m²/W flat)', group: 'dimensionless', unit: 'none' },
    { id: 'q_per_unit', label: 'Heat loss per metre (pipe) or per m² (flat)', group: 'power', unit: 'W' },
    { id: 'q_total_w', label: 'Total heat loss for the length / area', group: 'power', unit: 'W', display: 'kW' },
    { id: 'surface_temp_c', label: 'Outer surface (cladding) temperature', group: 'temperature', unit: 'C' },
    { id: 'interface_temp_c', label: 'Temperature at the wall / insulation interface', group: 'temperature', unit: 'C' },
    { id: 'q_bare_per_unit', label: 'Bare surface loss per metre / m² (same h_o)', group: 'power', unit: 'W' },
    { id: 'saving_pct', label: 'Reduction of heat loss by the insulation', group: 'ratio', unit: 'pct' },
    { id: 'critical_radius_m', label: 'Critical insulation radius k₁/h_o (pipe)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'outer_diameter_m', label: 'Outer diameter over insulation (pipe)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'annual_energy_wh', label: 'Annual heat loss (heating energy to hold temperature)', group: 'energy', unit: 'Wh', display: 'MWh' },
    { id: 'surface_check', label: 'Personnel protection (60 °C cladding limit)', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      r_ins1: '2.501',
      r_outside: '0.1485',
      r_total: '2.653',
      q_total_w: '471 W',
      surface_temp_c: '32 °C',
      interface_temp_c: '149.8 °C',
      saving_pct: '89 %',
    },
  },
};

/** Cylindrical layer resistance per metre, K·m/W. */
export function cylinderResistance(rInner, rOuter, k) {
  return rOuter > rInner ? Math.log(rOuter / rInner) / (2 * Math.PI * k) : 0;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.geometry, ['pipe', 'flat'], 'geometry', 'Geometry');
  assertNonNegative(i.wall_m, 'wall_m', 'Wall thickness');
  assertPositive(i.k_wall, 'k_wall', 'Wall conductivity');
  assertNonNegative(i.ins1_m, 'ins1_m', 'Layer 1 thickness');
  assertPositive(i.k1, 'k1', 'Layer 1 conductivity');
  assertNonNegative(i.ins2_m, 'ins2_m', 'Layer 2 thickness');
  assertPositive(i.k2, 'k2', 'Layer 2 conductivity');
  assertPositive(i.h_inside, 'h_inside', 'Inside coefficient');
  assertPositive(i.h_outside, 'h_outside', 'Outside coefficient');
  assertPositive(i.length_m, 'length_m', 'Length / area');
  assertRange(i.hours_per_year, 0, 8760, 'hours_per_year', 'Hours per year');
  const dT = i.t_inside_c - i.t_ambient_c;
  if (dT === 0) throw new Error('Inside and ambient temperatures are equal: no heat flow');

  let rIn;
  let rWall;
  let r1;
  let r2;
  let rOut;
  let rBare;
  let criticalRadius = null;
  let outerDiameter = null;
  if (i.geometry === 'pipe') {
    assertPositive(i.pipe_od_m, 'pipe_od_m', 'Pipe outside diameter');
    const rOuterWall = i.pipe_od_m / 2;
    const rInnerWall = rOuterWall - i.wall_m;
    if (rInnerWall <= 0) throw new Error('Wall thickness must be less than the pipe radius');
    const rIns1 = rOuterWall + i.ins1_m;
    const rIns2 = rIns1 + i.ins2_m;
    rIn = 1 / (i.h_inside * 2 * Math.PI * rInnerWall);
    rWall = cylinderResistance(rInnerWall, rOuterWall, i.k_wall);
    r1 = cylinderResistance(rOuterWall, rIns1, i.k1);
    r2 = cylinderResistance(rIns1, rIns2, i.k2);
    rOut = 1 / (i.h_outside * 2 * Math.PI * rIns2);
    rBare = rIn + rWall + 1 / (i.h_outside * 2 * Math.PI * rOuterWall);
    criticalRadius = i.k1 / i.h_outside;
    outerDiameter = 2 * rIns2;
  } else {
    rIn = 1 / i.h_inside;
    rWall = i.wall_m / i.k_wall;
    r1 = i.ins1_m / i.k1;
    r2 = i.ins2_m / i.k2;
    rOut = 1 / i.h_outside;
    rBare = rIn + rWall + 1 / i.h_outside;
  }
  const rTotal = rIn + rWall + r1 + r2 + rOut;
  const q = dT / rTotal;
  const qBare = dT / rBare;
  const surfaceTemp = i.t_ambient_c + q * rOut;
  const interfaceTemp = i.t_inside_c - q * (rIn + rWall);
  const total = q * i.length_m;

  let surfaceCheck;
  if (i.t_inside_c > i.t_ambient_c) surfaceCheck = surfaceTemp <= 60 ? `OK — cladding ${surfaceTemp.toFixed(1)} °C ≤ 60 °C` : `HOT — cladding ${surfaceTemp.toFixed(1)} °C exceeds the 60 °C personnel-protection limit: add insulation or guards`;
  else surfaceCheck = surfaceTemp < i.t_ambient_c ? `Cold surface ${surfaceTemp.toFixed(1)} °C: check against the ambient dew point for condensation` : 'Not applicable';

  const warnings = [];
  if (i.ins1_m + i.ins2_m === 0) warnings.push('No insulation entered: the result is the bare-surface loss.');
  if (i.geometry === 'pipe' && i.ins1_m > 0 && i.pipe_od_m / 2 + i.ins1_m < criticalRadius) warnings.push('Outer radius below the critical radius k/h_o: this insulation INCREASES the heat loss (small pipe, poor insulation).');
  if (interfaceTemp - i.t_ambient_c > 100 && i.k1 <= 0.045) warnings.push('Mean insulation temperature is high: mineral-wool conductivity rises with temperature (≈ 0.06–0.08 W/(m·K) at 200 °C) — enter k at the mean layer temperature.');
  if (i.h_outside <= 10) warnings.push('Outside coefficient for still air; on an open deck or in wind use 20–30 W/(m²·K), which raises the loss slightly and lowers the surface temperature.');
  warnings.push('Thermal bridges (supports, flanges, valves, uninsulated fittings) add 10–20 % to a real line; axial conduction and heat-up transients are not included.');

  return {
    outputs: {
      r_inside: rIn,
      r_wall: rWall,
      r_ins1: r1,
      r_ins2: r2,
      r_outside: rOut,
      r_total: rTotal,
      q_per_unit: q,
      q_total_w: total,
      surface_temp_c: surfaceTemp,
      interface_temp_c: interfaceTemp,
      q_bare_per_unit: qBare,
      saving_pct: (1 - q / qBare) * 100,
      critical_radius_m: criticalRadius,
      outer_diameter_m: outerDiameter,
      annual_energy_wh: total * i.hours_per_year,
      surface_check: surfaceCheck,
    },
    warnings,
  };
}
