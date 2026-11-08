/**
 * propeller-curve/calc.js — engine layout for a fixed pitch propeller: the specified MCR from the propeller design
 * point with the sea, engine and light running margins (Everllence eqs 2.01.01–02), the light and heavy propeller
 * curves P = c n³, and the heavy running of a measured service point.
 *
 * SMCR power = PD power × (1 + SM) / (1 − EM);  SMCR rpm = PD rpm × (SMCR power / PD power)^(1/3) × (1 − LRM)
 * light curve (clean hull, calm weather, line 6) through PD;  layout curve (heavy, lines 1 and 2) through SMCR
 * heavy running of a point = 1 − n / n_light(P);  margin to the layout curve = n / n_layout(P) − 1
 * Schema units: kilowatts, revolutions per minute, percent.
 */
import { withDefaults, assertPositive, assertRange } from '../shared/validate.js';

const RPM_STEPS_PCT = [50, 60, 70, 80, 85, 90, 95, 100, 105, 110];
const TRIAL_RPM_LIMIT = 1.1;

export const schema = {
  id: 'propeller-curve',
  name: 'Propeller curve and light running margin',
  category: 'maritime',
  summary: 'Engine SMCR from the propeller design point with sea, engine and light running margins, the propeller curves, and the heavy running of a measured point.',
  related: ['propeller-slip', 'shaft-torque', 'engine-bmep', 'speed-power-fit', 'propeller-bseries'],
  assumptions: [
    'Fixed pitch propeller on the propeller law P = c n³: at a constant advance ratio the torque coefficient is constant and power varies with the cube of the rpm (Everllence project guide 2.03).',
    'The propeller design point PD (design speed, clean hull, calm weather, design draft) lies on the light propeller curve (line 6); the specified MCR follows Everllence eqs 2.01.01 and 2.01.02: SMCR power = PD power × (100 + SM)/(100 − EM), SMCR rpm = PD rpm × (SMCR power/PD power)^(1/3) × (1 − LRM/100). The engine layout curve (lines 1 and 2, heavy running) passes through the SMCR.',
    'Light running margin as in eq. 2.01.02: at a given power the layout curve rpm is (1 − LRM) times the light curve rpm. Everllence recommends 4–7 %, up to 10 % in special cases (adverse weather, blunt bows, shaft generators, ice class); sea margin traditionally about 15 % of the PD power; engine margin 10–15 % (service at 90 or 85 % load).',
    'Heavy running of a measured point = 1 − n/n_light(P): the rpm deficit against the light curve at the same power, from fouling, weather or a deeper draft; the margin left to the layout curve = n/n_layout(P) − 1, negative when the point is heavier than the engine layout allows for.',
    'Sea-trial check: the light curve rpm at SMCR power should not exceed 110 % of the SMCR rpm (line 9; also at most 107 % of the L1 rpm, which needs the engine rating table). Torsional vibration, barred speed ranges and the torque/speed limit (line 4) need the engine data.',
  ],
  notes: [
    'Verification 2026-10-31: PD 7000 kW at 80 rpm with 15 % sea margin, 10 % engine margin and 5 % LRM gives SMCR 8944.4 kW at 82.47 rpm, a service point of 8050 kW at 79.62 rpm and a light curve rpm of 86.81 (105.3 % of SMCR rpm) at full power.',
    'Design decision: the exponent is fixed at 3 (the propeller law); the steeper P ∝ V⁴ relation at elevated speeds concerns ship speed, not rpm, and is not used here.',
  ],
  sources: [
    'Everllence (formerly MAN Energy Solutions), Project guide 199 06 13-4.1 (2025): 2.01 Propeller layout and engine matching with margins — eqs 2.01.01 and 2.01.02, sea, engine and light running margins',
    'Everllence, Project guide 199 06 11-0.1 (2025): 2.03 Engine layout and load diagram — propeller law, lines 1, 2, 6 and 9, heavy running in service',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion — propeller curves, light and heavy running',
  ],
  inputs: [
    { id: 'pd_power_kw', label: 'Propeller design point power (clean hull, calm weather)', group: 'power', unit: 'kW', default: 7000, min: 10, max: 120000 },
    { id: 'pd_rpm', label: 'Propeller design point speed', group: 'rotational_speed', unit: 'rpm', default: 80, min: 10, max: 3000 },
    { id: 'sea_margin_pct', label: 'Sea margin', group: 'ratio', unit: 'pct', default: 15, min: 0, max: 50 },
    { id: 'engine_margin_pct', label: 'Engine margin', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 30 },
    { id: 'lrm_pct', label: 'Light running margin', group: 'ratio', unit: 'pct', default: 5, min: 0, max: 15 },
    { id: 'measured_power_kw', label: 'Measured service point: power', group: 'power', unit: 'kW', default: 7500, min: 1, max: 120000 },
    { id: 'measured_rpm', label: 'Measured service point: speed', group: 'rotational_speed', unit: 'rpm', default: 80, min: 1, max: 3000 },
  ],
  outputs: [
    { id: 'smcr_power_kw', label: 'Specified MCR power', group: 'power', unit: 'kW' },
    { id: 'smcr_rpm', label: 'Specified MCR speed', group: 'rotational_speed', unit: 'rpm' },
    { id: 'sp_power_kw', label: 'Service propulsion point power', group: 'power', unit: 'kW' },
    { id: 'sp_rpm', label: 'Service propulsion point speed (layout curve)', group: 'rotational_speed', unit: 'rpm' },
    { id: 'trial_rpm', label: 'Light curve speed at SMCR power (sea trial)', group: 'rotational_speed', unit: 'rpm' },
    { id: 'trial_rpm_pct', label: 'Light curve speed at SMCR power, of SMCR speed', group: 'ratio', unit: 'pct' },
    { id: 'measured_load_pct', label: 'Measured point: engine load (of SMCR power)', group: 'ratio', unit: 'pct' },
    { id: 'heavy_running_pct', label: 'Measured point: heavy running against the light curve', group: 'ratio', unit: 'pct' },
    { id: 'margin_left_pct', label: 'Measured point: margin left to the layout curve', group: 'ratio', unit: 'pct' },
    { id: 'curve_table', label: 'Propeller curves', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      smcr_power_kw: '8944 kW',
      smcr_rpm: '82.47 rpm',
      sp_power_kw: '8050 kW',
      sp_rpm: '79.62 rpm',
      trial_rpm: '86.81 rpm',
      trial_rpm_pct: '105.3 %',
      heavy_running_pct: '2.3 %',
      margin_left_pct: '2.9 %',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.pd_power_kw, 'pd_power_kw', 'Propeller design point power');
  assertPositive(i.pd_rpm, 'pd_rpm', 'Propeller design point speed');
  assertRange(i.sea_margin_pct, 0, 100, 'sea_margin_pct', 'Sea margin');
  assertRange(i.engine_margin_pct, 0, 50, 'engine_margin_pct', 'Engine margin');
  assertRange(i.lrm_pct, 0, 30, 'lrm_pct', 'Light running margin');
  assertPositive(i.measured_power_kw, 'measured_power_kw', 'Measured power');
  assertPositive(i.measured_rpm, 'measured_rpm', 'Measured speed');

  const smcrPower = (i.pd_power_kw * (100 + i.sea_margin_pct)) / (100 - i.engine_margin_pct);
  const smcrRpm = i.pd_rpm * Math.cbrt(smcrPower / i.pd_power_kw) * (1 - i.lrm_pct / 100);
  const lightRpm = (p) => i.pd_rpm * Math.cbrt(p / i.pd_power_kw);
  const layoutRpm = (p) => smcrRpm * Math.cbrt(p / smcrPower);
  const lightPower = (n) => i.pd_power_kw * (n / i.pd_rpm) ** 3;
  const layoutPower = (n) => smcrPower * (n / smcrRpm) ** 3;
  const spPower = smcrPower * (1 - i.engine_margin_pct / 100);
  const spRpm = layoutRpm(spPower);
  const trialRpm = lightRpm(smcrPower);
  const heavy = (1 - i.measured_rpm / lightRpm(i.measured_power_kw)) * 100;
  const marginLeft = (i.measured_rpm / layoutRpm(i.measured_power_kw) - 1) * 100;
  const load = (i.measured_power_kw / smcrPower) * 100;

  const warnings = [];
  if (i.lrm_pct < 4 || i.lrm_pct > 10) warnings.push(`A light running margin of ${i.lrm_pct} % is outside the Everllence recommendation of 4–7 %, up to 10 % in special cases.`);
  if (trialRpm > TRIAL_RPM_LIMIT * smcrRpm) warnings.push(`The light curve reaches ${((trialRpm / smcrRpm) * 100).toFixed(1)} % of the SMCR speed at full power, above the 110 % sea-trial limit of the standard load diagram (line 9): a lower light running margin, or an extended load diagram on a speed-derated engine, is needed.`);
  if (marginLeft < 0) warnings.push('The measured point is heavier than the engine layout curve: the light running margin is used up by fouling, weather or draft; check the torque/speed limit (line 4) and plan a hull and propeller cleaning.');
  else if (heavy > 0.75 * i.lrm_pct) warnings.push(`The measured point has used ${((heavy / i.lrm_pct) * 100).toFixed(0)} % of the light running margin.`);
  if (heavy < 0) warnings.push('The measured point is lighter than the design light curve: likely a lighter draft than the design point (ballast) or a measurement error.');
  if (load < 50) warnings.push('Below 50 % load the light running margin recommendation no longer applies; compare heavy running between 50 and 100 % load.');

  return {
    outputs: {
      smcr_power_kw: smcrPower,
      smcr_rpm: smcrRpm,
      sp_power_kw: spPower,
      sp_rpm: spRpm,
      trial_rpm: trialRpm,
      trial_rpm_pct: (trialRpm / smcrRpm) * 100,
      measured_load_pct: load,
      heavy_running_pct: heavy,
      margin_left_pct: marginLeft,
      curve_table: {
        columns: ['Speed (% SMCR)', 'Speed (rpm)', 'Light curve (kW)', 'Light curve (% SMCR)', 'Layout curve (kW)', 'Layout curve (% SMCR)'],
        rows: RPM_STEPS_PCT.map((pct) => {
          const n = (smcrRpm * pct) / 100;
          return [pct, n, lightPower(n), (lightPower(n) / smcrPower) * 100, layoutPower(n), (layoutPower(n) / smcrPower) * 100];
        }),
      },
      summary: `SMCR ${smcrPower.toFixed(0)} kW at ${smcrRpm.toFixed(2)} rpm; service point ${spPower.toFixed(0)} kW at ${spRpm.toFixed(2)} rpm; on sea trial the clean ship reaches ${trialRpm.toFixed(2)} rpm at full power. The measured point runs ${heavy.toFixed(1)} % heavy, ${marginLeft >= 0 ? `${marginLeft.toFixed(1)} % from` : `${(-marginLeft).toFixed(1)} % beyond`} the layout curve.`,
    },
    warnings,
  };
}
