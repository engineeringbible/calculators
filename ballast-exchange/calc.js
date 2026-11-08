/**
 * ballast-exchange/calc.js — ballast water exchange under the BWM Convention D-1 standard: time and distance for the
 * sequential (empty–refill), flow-through and dilution methods, the exchange efficiency of pumping-through n volumes
 * (perfect-mixing model, 3 volumes ≈ 95 %), and the D-1 location rule.
 *
 * sequential: t = N × 2V (1 + s) / Q;  flow-through / dilution: t = N × n V / Q;  η_mix = 1 − e^(−n)
 * Schema units: m³, m³/h, knots, nautical miles.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const METHODS = {
  sequential: { label: 'Sequential — empty each tank, then refill (≥ 95 % by volume)' },
  flow_through: { label: 'Flow-through — pump in with overflow through vents/manholes (3 volumes)' },
  dilution: { label: 'Dilution — fill from the top, discharge from the bottom at the same rate (3 volumes)' },
};

export const schema = {
  id: 'ballast-exchange',
  name: 'Ballast water exchange time',
  category: 'maritime',
  summary: 'D-1 ballast exchange: sequential, flow-through and dilution times and distance, the 3-volume / 95 % rule from perfect mixing, and the location criteria.',
  related: ['tank-volume', 'pump-affinity', 'pipe-flow', 'initial-stability', 'course-to-steer'],
  assumptions: [
    'BWM Convention Regulation D-1: ballast water exchange must achieve at least 95 % volumetric exchange; for the pumping-through (flow-through and dilution) methods, pumping three times the volume of each tank is deemed to meet the standard (Reg. D-1.2). The sequential method empties each tank to the stripping limit and refills it; the residual that cannot be stripped stays on board and is entered as a percentage.',
    'Times assume the pumps deliver the rated capacity continuously (Q = pumps in use × rated capacity), shared equally between the tanks exchanged at the same time, so the total time is N × 2V(1 + s)/Q for the sequential method (s the stripping time allowance as a fraction of the pumping time) and N × nV/Q for pumping-through with n volumes; valve operations, line-up and the reduced head during flow-through overflow are inside the allowance entered.',
    'Exchange efficiency of pumping-through: with perfect mixing in the tank the fraction of original water remaining after n volumes is e^(−n), so 3 volumes give 95.0 % exchange — the physical origin of the D-1 three-volume rule; real tanks mix imperfectly (short-circuiting lowers, plug flow raises the efficiency), which is why the Convention fixes the volume rather than requiring a measurement.',
    'Location (Reg. B-4): exchange at least 200 nautical miles from the nearest land in water at least 200 m deep; where that is not possible, as far from land as practicable and at least 50 nmi off in 200 m depth, or in an area designated by the port State; the distance the ship covers during the exchange at the speed entered shows how much sea room the operation needs.',
    'Since 8 September 2024 all ships must meet the D-2 performance standard with an approved treatment system (Reg. B-3 as amended by MEPC.297(72)); D-1 exchange remains relevant as a contingency measure (BWM.2/Circ.62) when the system is inoperable, for exemptions, and for exchange-plus-treatment in low-salinity or challenging water quality. Stability, shear force and bending moment, sloshing and overpressure during flow-through must be checked against the ship\'s Ballast Water Management Plan — not evaluated here.',
  ],
  notes: [
    'Verification 2026-10-31: 1 − e^(−3) = 0.9502, the 95 % of D-1; ten 1 500 m³ tanks with two 1 000 m³/h pumps: flow-through 45 h (3 × 15 000/2 000), sequential with 10 % stripping allowance 16.5 h — the ratio 2.7 explains why sequential exchange is faster but needs the stability check between tanks.',
    'Design decision: the 2024 D-2 deadline is stated in the assumptions so the page is not read as current routine practice; the exchange calculation remains needed for contingency operations and for the many plans still carrying D-1 as a fallback.',
  ],
  sources: [
    'IMO International Convention for the Control and Management of Ships\' Ballast Water and Sediments (BWM Convention, 2004), Regulations B-4, D-1, D-2; amendments MEPC.297(72) (D-2 schedule)',
    'IMO Resolution MEPC.124(53), Guidelines for ballast water exchange (G6) — sequential, flow-through and dilution methods, safety',
    'IMO BWM.2/Circ.62 (2017) Guidance on contingency measures under the BWM Convention',
    'ABS Guide for Ballast Water Exchange (2010) — pumping-through efficiency, overflow arrangements',
  ],
  inputs: [
    { id: 'method', label: 'Exchange method', type: 'select', default: 'flow_through', options: Object.entries(METHODS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'tank_volume_m3', label: 'Volume per ballast tank', group: 'volume', unit: 'm3', default: 1500, min: 1, max: 50000 },
    { id: 'tanks', label: 'Number of tanks to exchange', group: 'dimensionless', unit: 'none', default: 10, min: 1, max: 60, integer: true },
    { id: 'pump_rate_m3_h', label: 'Rated capacity per ballast pump', group: 'volume_flow', unit: 'm3_h', default: 1000, min: 1, max: 20000 },
    { id: 'pumps', label: 'Pumps in use', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 6, integer: true },
    { id: 'volumes', label: 'Tank volumes pumped through (flow-through / dilution)', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 6, visibleWhen: { method: ['flow_through', 'dilution'] } },
    { id: 'stripping_allowance_pct', label: 'Stripping / line-up time allowance (sequential)', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 100, visibleWhen: { method: 'sequential' } },
    { id: 'residual_pct', label: 'Unpumpable residual after stripping (sequential)', group: 'ratio', unit: 'pct', default: 2, min: 0, max: 20, visibleWhen: { method: 'sequential' } },
    { id: 'speed_kn', label: 'Ship speed during the exchange', group: 'speed', unit: 'kn', default: 12, min: 0, max: 30 },
    { id: 'distance_from_land_nmi', label: 'Distance from the nearest land at the exchange area', group: 'length', unit: 'nmi', default: 220, min: 0, max: 5000 },
    { id: 'water_depth_m', label: 'Water depth at the exchange area', group: 'length', unit: 'm', default: 1500, min: 0, max: 12000 },
  ],
  outputs: [
    { id: 'total_pump_rate_m3_h', label: 'Total pumping capacity', group: 'volume_flow', unit: 'm3_h' },
    { id: 'total_ballast_m3', label: 'Total ballast to exchange', group: 'volume', unit: 'm3' },
    { id: 'water_pumped_m3', label: 'Total water pumped', group: 'volume', unit: 'm3' },
    { id: 'time_per_tank_h', label: 'Pumping time per tank (full capacity on one tank)', group: 'time', unit: 'h' },
    { id: 'total_time_h', label: 'Total exchange time', group: 'time', unit: 'h' },
    { id: 'distance_run_nmi', label: 'Distance run during the exchange', group: 'length', unit: 'nmi' },
    { id: 'exchange_efficiency_pct', label: 'Volumetric exchange achieved', group: 'ratio', unit: 'pct' },
    { id: 'd1_compliance', label: 'D-1 standard (≥ 95 %)', type: 'text' },
    { id: 'location_check', label: 'Location (Reg. B-4)', type: 'text' },
    { id: 'volumes_for_99_pct', label: 'Volumes needed for 99 % with perfect mixing (−ln 0.01)', group: 'dimensionless', unit: 'none' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      total_pump_rate_m3_h: '2 000 m³/h',
      water_pumped_m3: '45 000 m³',
      time_per_tank_h: '2.25 h',
      total_time_h: '22.5 h',
      distance_run_nmi: '270 nmi',
      exchange_efficiency_pct: '95.0 %',
    },
  },
};

/** Fraction exchanged after pumping n tank volumes through a perfectly mixed tank. */
export function mixingEfficiency(volumes) {
  return 1 - Math.exp(-volumes);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.method, Object.keys(METHODS), 'method', 'Method');
  assertPositive(i.tank_volume_m3, 'tank_volume_m3', 'Tank volume');
  assertInteger(i.tanks, 'tanks', 'Tanks');
  assertRange(i.tanks, 1, 200, 'tanks', 'Tanks');
  assertPositive(i.pump_rate_m3_h, 'pump_rate_m3_h', 'Pump rate');
  assertInteger(i.pumps, 'pumps', 'Pumps');
  assertRange(i.pumps, 1, 12, 'pumps', 'Pumps');
  assertNonNegative(i.speed_kn, 'speed_kn', 'Speed');
  assertNonNegative(i.distance_from_land_nmi, 'distance_from_land_nmi', 'Distance from land');
  assertNonNegative(i.water_depth_m, 'water_depth_m', 'Water depth');

  const Q = i.pumps * i.pump_rate_m3_h;
  const total = i.tanks * i.tank_volume_m3;
  let pumped;
  let efficiency;
  if (i.method === 'sequential') {
    assertRange(i.stripping_allowance_pct, 0, 200, 'stripping_allowance_pct', 'Stripping allowance');
    assertRange(i.residual_pct, 0, 50, 'residual_pct', 'Residual');
    pumped = 2 * total * (1 + i.stripping_allowance_pct / 100);
    efficiency = 1 - i.residual_pct / 100;
  } else {
    assertRange(i.volumes, 0.5, 10, 'volumes', 'Volumes');
    pumped = i.volumes * total;
    efficiency = mixingEfficiency(i.volumes);
  }
  const totalTime = pumped / Q;
  const perTank = pumped / i.tanks / Q;
  const distance = totalTime * i.speed_kn;
  const far = i.distance_from_land_nmi >= 200 && i.water_depth_m >= 200;
  const near = i.distance_from_land_nmi >= 50 && i.water_depth_m >= 200;
  const location = far
    ? `Meets Reg. B-4.1.1 — ${i.distance_from_land_nmi} nmi from land (≥ 200) in ${i.water_depth_m} m (≥ 200 m)`
    : near
      ? `Meets only the fallback Reg. B-4.1.2 — ≥ 50 nmi and ≥ 200 m: allowed where 200 nmi is not possible, as far from land as practicable`
      : `Does NOT meet Reg. B-4 — needs ≥ 50 nmi from land and ≥ 200 m depth (preferably ≥ 200 nmi), or a port-State designated area`;
  const d1 = efficiency >= 0.95 - 1e-9
    ? `Meets D-1 — ${(efficiency * 100).toFixed(1)} % volumetric exchange${i.method !== 'sequential' ? ` (${i.volumes} volumes pumped through; 3 volumes are deemed compliant)` : ''}`
    : `Below D-1 — ${(efficiency * 100).toFixed(1)} % < 95 %: ${i.method === 'sequential' ? 'reduce the residual by stripping' : 'pump at least 3 tank volumes'}`;

  const warnings = [];
  if (i.method === 'sequential') warnings.push('Sequential exchange empties tanks: check stability, shear forces, bending moments, propeller immersion and slamming for every intermediate condition in the Ballast Water Management Plan.');
  else warnings.push('Flow-through overflows ballast on deck through vents or manholes: check the venting capacity against the pumping rate to avoid over-pressurising the tank, and the deck arrangements for ice and freezing.');
  if (!far) warnings.push('Exchange location does not meet the preferred 200 nmi / 200 m criterion: record the reason in the Ballast Water Record Book.');
  if (totalTime > 48) warnings.push(`Exchange takes ${totalTime.toFixed(0)} h: plan the sea room (${distance.toFixed(0)} nmi at ${i.speed_kn} kn) and the weather window; exchange may be deferred for safety (Reg. B-4.4).`);
  warnings.push('Since 8 September 2024 the D-2 standard (treatment system) applies to all ships; exchange is a contingency or exemption measure, not routine compliance.');
  warnings.push('Pump capacity assumed constant at the rated value; flow-through at reduced head and valve line-up time are inside the allowance only for the sequential method.');

  return {
    outputs: {
      total_pump_rate_m3_h: Q,
      total_ballast_m3: total,
      water_pumped_m3: pumped,
      time_per_tank_h: perTank,
      total_time_h: totalTime,
      distance_run_nmi: distance,
      exchange_efficiency_pct: efficiency * 100,
      d1_compliance: d1,
      location_check: location,
      volumes_for_99_pct: -Math.log(0.01),
      summary: `${METHODS[i.method].label.split(' — ')[0]}: ${i.tanks} × ${i.tank_volume_m3} m³ with ${Q} m³/h → ${pumped.toFixed(0)} m³ pumped in ${totalTime.toFixed(1)} h (${distance.toFixed(0)} nmi), ${(efficiency * 100).toFixed(1)} % exchanged`,
    },
    warnings,
  };
}
