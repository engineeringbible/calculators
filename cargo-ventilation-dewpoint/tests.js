/**
 * cargo-ventilation-dewpoint/tests.js — checks against psychrometric reference values and the P&I ventilation rules.
 * Run: node run-tests.js cargo-ventilation-dewpoint
 */
import { calculate, saturationVapourPressureHpa, dewPointC, vapourPressureFromWetBulbHpa, humidityRatioGkg, PSYCHROMETER_A } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const BASE = { pressure_hpa: 1013.25, psychrometer: 'aspirated', out_dry_c: 25, out_wet_c: 20, hold_input: 'wet_bulb', hold_dry_c: 22, hold_wet_c: 20, cargo_type: 'hygroscopic', cargo_temp_c: 18, steel_temp_c: 16 };

export const tests = [
  {
    name: 'Magnus (Alduchov–Eskridge): e_s(0 °C) = 6.109 hPa, e_s(20 °C) = 23.33 hPa (reference 23.39), e_s(30 °C) = 42.4 hPa (reference 42.47); dew point of 20 °C / 50 % RH = 9.3 °C',
    source: 'Alduchov & Eskridge (1996) coefficients 17.625 / 243.04 / 6.1094; WMO/Buck reference saturation pressures; psychrometric tables',
    run: () => {
      assertClose(saturationVapourPressureHpa(0), 6.1094, { rel: 1e-12 }, '0 °C');
      assertClose(saturationVapourPressureHpa(20), 23.39, { rel: 4e-3 }, '20 °C');
      assertClose(saturationVapourPressureHpa(30), 42.47, { rel: 4e-3 }, '30 °C');
      assertClose(dewPointC(0.5 * saturationVapourPressureHpa(20)), 9.3, { abs: 0.1 }, 'dew point 20/50 %');
      assertClose(dewPointC(saturationVapourPressureHpa(15)), 15, { abs: 1e-9 }, 'saturated air: dew point = temperature');
    },
  },
  {
    name: 'Psychrometer: dry 25 °C, wet 20 °C, 1013.25 hPa, aspirated → e = 23.33 − 0.000662 × 1013.25 × 5 = 19.98 hPa, RH 63 %, dew point 17.5 °C, humidity ratio 12.5 g/kg (ASHRAE chart 63 %, 17.5 °C, 12.5 g/kg)',
    source: 'Sprung psychrometric equation (ISO 4677-1, A = 6.62·10⁻⁴ K⁻¹); ASHRAE Fundamentals psychrometric chart',
    run: () => {
      const e = vapourPressureFromWetBulbHpa(25, 20, 1013.25, PSYCHROMETER_A.aspirated);
      assertClose(e, saturationVapourPressureHpa(20) - 0.000662 * 1013.25 * 5, { rel: 1e-12 }, 'formula');
      assertClose(e, 19.98, { abs: 0.03 }, 'e');
      const { outputs } = calculate(BASE);
      assertClose(outputs.out_rh_pct, 63, { abs: 0.6 }, 'RH');
      assertClose(outputs.out_dewpoint_c, 17.5, { abs: 0.1 }, 'dew point');
      assertClose(outputs.out_humidity_ratio, humidityRatioGkg(e, 1013.25), { rel: 1e-12 }, 'W helper');
      assertClose(outputs.out_humidity_ratio, 12.5, { abs: 0.1 }, 'W value');
    },
  },
  {
    name: 'Hold air 22 / 20 °C: RH 83 %, dew point 19.0 °C; given instead as 22 °C and 80 % RH the dew point is 18.4 °C; screen psychrometer coefficient lowers the computed humidity',
    source: 'Same psychrometric relations; e = RH × e_s(T)',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.hold_rh_out_pct, 83, { abs: 0.7 }, 'hold RH');
      assertClose(outputs.hold_dewpoint_c, 19.0, { abs: 0.1 }, 'hold dew point');
      const rh = calculate({ ...BASE, hold_input: 'rh', hold_rh_pct: 80 }).outputs;
      assertClose(rh.hold_dewpoint_c, dewPointC(0.8 * saturationVapourPressureHpa(22)), { rel: 1e-12 }, 'from RH');
      assertClose(rh.hold_dewpoint_c, 18.4, { abs: 0.1 }, 'value');
      const screen = calculate({ ...BASE, psychrometer: 'screen' }).outputs;
      assertEqual(screen.out_dewpoint_c < outputs.out_dewpoint_c, true, 'screen → drier');
    },
  },
  {
    name: 'Dew-point rule: outside 17.5 °C vs hold 19.0 °C → VENTILATE (margin 1.5 K); outside 27/25 °C (dew point 24 °C) → DO NOT VENTILATE; equal dew points → MARGINAL',
    source: 'Britannia P&I / Gard: ventilate only when the outside dew point is lower than the hold dew point',
    run: () => {
      const r = calculate(BASE).outputs;
      assertClose(r.dewpoint_margin_k, r.hold_dewpoint_c - r.out_dewpoint_c, { rel: 1e-12 }, 'margin');
      assertEqual(r.dewpoint_rule.startsWith('VENTILATE'), true, 'ventilate');
      const humid = calculate({ ...BASE, out_dry_c: 27, out_wet_c: 25 }).outputs;
      assertEqual(humid.out_dewpoint_c > 23.5, true, 'humid dew point');
      assertEqual(humid.dewpoint_rule.startsWith('DO NOT'), true, 'do not');
      const equal = calculate({ ...BASE, hold_dry_c: 25, hold_wet_c: 20 }).outputs;
      assertEqual(equal.dewpoint_rule.startsWith('MARGINAL'), true, 'marginal');
    },
  },
  {
    name: 'Three-degree rule: cargo 18 °C, outside 25 °C → DO NOT (margin −7 K); outside 14 °C → VENTILATE (margin 4 K); hygroscopic advice needs both rules, non-hygroscopic follows the dew point only',
    source: 'Britannia P&I / Steamship Mutual: ventilate hygroscopic cargo when the outside dry bulb is at least 3 °C below the cargo temperature at loading',
    run: () => {
      const warm = calculate(BASE).outputs;
      assertClose(warm.three_degree_margin_k, -7, { rel: 1e-12 }, 'margin');
      assertEqual(warm.three_degree_rule.startsWith('DO NOT'), true, 'do not');
      assertEqual(warm.advice.includes('three-degree rule does not'), true, 'hygroscopic: dew point yes, 3° no');
      const cool = calculate({ ...BASE, out_dry_c: 14, out_wet_c: 11 }).outputs;
      assertEqual(cool.three_degree_rule.startsWith('VENTILATE'), true, 'ventilate');
      assertEqual(cool.advice.startsWith('Ventilate'), true, 'both satisfied');
      const steel = calculate({ ...BASE, cargo_type: 'non_hygroscopic' }).outputs;
      assertEqual(steel.advice.startsWith('Ventilate'), true, 'non-hygroscopic follows dew point');
      assertEqual(steel.three_degree_rule.includes('not applicable'), true, 'rule not applicable');
    },
  },
  {
    name: 'Sweat: hold dew point 19 °C above steel 16 °C → ship sweat RISK; outside dew point 17.5 °C below cargo 18 °C → no cargo sweat; cargo at 10 °C → cargo sweat RISK; steel at 22 °C → no ship sweat',
    source: 'Steamship Mutual "The problem of sweat": ship sweat when the hold dew point exceeds the steel temperature, cargo sweat when admitted air\'s dew point exceeds the cargo temperature',
    run: () => {
      const r = calculate(BASE).outputs;
      assertEqual(r.ship_sweat.startsWith('RISK'), true, 'ship sweat');
      assertEqual(r.cargo_sweat.startsWith('No cargo sweat'), true, 'no cargo sweat');
      assertEqual(calculate({ ...BASE, cargo_temp_c: 10 }).outputs.cargo_sweat.startsWith('RISK'), true, 'cold cargo');
      assertEqual(calculate({ ...BASE, steel_temp_c: 22 }).outputs.ship_sweat.startsWith('No ship sweat'), true, 'warm steel');
    },
  },
  {
    name: 'Pressure dependence: at 950 hPa the same readings give a slightly higher vapour pressure and humidity ratio; the Sprung term scales with p',
    source: 'Psychrometric equation e = e_s(T_w) − A p (T − T_w); W = 622 e/(p − e)',
    run: () => {
      const low = calculate({ ...BASE, pressure_hpa: 950 }).outputs;
      const std = calculate(BASE).outputs;
      assertEqual(low.out_vapour_hpa > std.out_vapour_hpa, true, 'higher e at lower p');
      assertEqual(low.out_humidity_ratio > std.out_humidity_ratio, true, 'higher W');
      assertClose(std.out_vapour_hpa - low.out_vapour_hpa, -0.000662 * (1013.25 - 950) * 5, { rel: 1e-9 }, 'Δe = −A Δp ΔT');
    },
  },
  {
    name: 'Invalid inputs fail fast: wet bulb above dry bulb, unknown cargo type, implausible wet-bulb depression',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BASE, out_wet_c: 26 }), 'cannot exceed', 'wet > dry');
      assertThrows(() => calculate({ ...BASE, cargo_type: 'liquid' }), 'must be one of', 'cargo');
      assertThrows(() => calculate({ ...BASE, out_dry_c: 40, out_wet_c: 0 }), 'too large', 'depression');
    },
  },
];
