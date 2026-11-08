/**
 * unit-converter/tests.js — checks against NIST SP 811 Appendix B factors and round-trip identity for every unit.
 * Run: node run-tests.js unit-converter
 */
import { calculate, convertValue, CONVERTIBLE_GROUPS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Marine units: 1 kn = 0.5144444 m/s = 1.852 km/h; 1 nmi = 1.150779 mi = 6 076.12 ft; 1 long ton = 1.016047 t; 1 fathom = 6 ft',
    source: 'NIST SP 811 Appendix B.8 (knot, nautical mile, long ton); 1 nmi = 1852 m exactly',
    run: () => {
      assertClose(convertValue('speed', 1, 'kn', 'm_s'), 0.5144444, { abs: 5e-8 }, 'kn → m/s');
      assertClose(convertValue('speed', 1, 'kn', 'km_h'), 1.852, { rel: 1e-12 }, 'kn → km/h');
      assertClose(convertValue('length', 1, 'nmi', 'mi'), 1.150779, { abs: 1e-6 }, 'nmi → mi');
      assertClose(convertValue('length', 1, 'nmi', 'ft'), 6076.12, { abs: 0.01 }, 'nmi → ft');
      assertClose(convertValue('mass', 1, 'lt', 't'), 1.016047, { abs: 1e-6 }, 'long ton → t');
      assertClose(convertValue('length', 1, 'fathom', 'ft'), 6, { rel: 1e-12 }, 'fathom → ft');
    },
  },
  {
    name: 'Pressure: 1 bar = 14.50377 psi = 0.9869233 atm = 750.0617 mmHg; 1 psi = 6.894757 kPa; 1 mH₂O = 9.80665 kPa',
    source: 'NIST SP 811 Appendix B.8 (psi 6.894757 kPa, atm 101.325 kPa, mmHg 133.3224 Pa)',
    run: () => {
      assertClose(convertValue('pressure', 1, 'bar', 'psi'), 14.50377, { abs: 1e-5 }, 'bar → psi');
      assertClose(convertValue('pressure', 1, 'bar', 'atm'), 0.9869233, { abs: 1e-7 }, 'bar → atm');
      assertClose(convertValue('pressure', 1, 'bar', 'mmHg'), 750.0617, { abs: 1e-3 }, 'bar → mmHg');
      assertClose(convertValue('pressure', 1, 'psi', 'kPa'), 6.894757, { abs: 1e-6 }, 'psi → kPa');
      assertClose(convertValue('pressure', 1, 'mH2O', 'kPa'), 9.80665, { rel: 1e-12 }, 'mH₂O → kPa');
    },
  },
  {
    name: 'Power and energy: 1 hp = 745.6999 W, 1 PS = 735.4988 W, 1 Btu = 1 055.056 J, 1 kWh = 3 412.14 Btu, 1 toe = 41.868 GJ, 1 kcal = 4 184 J',
    source: 'NIST SP 811 Appendix B.8/B.9 (horsepower 550 ft·lbf/s, metric horsepower, Btu_IT, calorie_th); IEA (toe = 41.868 GJ)',
    run: () => {
      assertClose(convertValue('power', 1, 'hp', 'W'), 745.6999, { abs: 1e-4 }, 'hp');
      assertClose(convertValue('power', 1, 'PS', 'W'), 735.4988, { abs: 1e-4 }, 'PS');
      assertClose(convertValue('energy', 1, 'Btu', 'J'), 1055.056, { abs: 1e-3 }, 'Btu');
      assertClose(convertValue('energy', 1, 'kWh', 'Btu'), 3412.14, { abs: 0.01 }, 'kWh → Btu');
      assertClose(convertValue('energy', 1, 'toe', 'GJ'), 41.868, { rel: 1e-12 }, 'toe');
      assertClose(convertValue('energy', 1, 'kcal', 'J'), 4184, { rel: 1e-12 }, 'kcal');
    },
  },
  {
    name: 'Torque, force, volume, flow: 1 kgf·m = 9.80665 N·m, 1 lbf·ft = 1.355818 N·m, 1 kip = 4.448222 kN, 1 US gal = 3.785412 L, 1 bbl = 158.9873 L, 1 cfm = 1.699011 m³/h',
    source: 'NIST SP 811 Appendix B.8 (kilogram-force, pound-force foot, gallon US, barrel petroleum, cubic foot per minute)',
    run: () => {
      assertClose(convertValue('torque', 1, 'kgf_m', 'N_m'), 9.80665, { rel: 1e-12 }, 'kgf·m');
      assertClose(convertValue('torque', 1, 'lbf_ft', 'N_m'), 1.355818, { abs: 1e-6 }, 'lbf·ft');
      assertClose(convertValue('force', 1, 'kip', 'kN'), 4.448222, { abs: 1e-6 }, 'kip');
      assertClose(convertValue('volume', 1, 'gal_us', 'L'), 3.785412, { abs: 1e-6 }, 'US gal');
      assertClose(convertValue('volume', 1, 'bbl', 'L'), 158.9873, { abs: 1e-4 }, 'bbl');
      assertClose(convertValue('volume_flow', 1, 'cfm', 'm3_h'), 1.699011, { abs: 1e-6 }, 'cfm → m³/h');
    },
  },
  {
    name: 'Temperature with offsets: 100 °C = 212 °F = 373.15 K, −40 °C = −40 °F, 0 K = −459.67 °F; difference 10 K = 18 °F',
    source: 'BIPM SI Brochure 9th ed. (kelvin/Celsius); NIST SP 811 §B.9 (Fahrenheit)',
    run: () => {
      assertClose(convertValue('temperature', 100, 'C', 'F'), 212, { rel: 1e-12 }, '100 °C');
      assertClose(convertValue('temperature', 100, 'C', 'K'), 373.15, { rel: 1e-12 }, 'K');
      assertClose(convertValue('temperature', -40, 'C', 'F'), -40, { abs: 1e-9 }, '−40');
      assertClose(convertValue('temperature', 0, 'K', 'F'), -459.67, { abs: 1e-9 }, 'absolute zero');
      assertClose(convertValue('temperature_difference', 10, 'K', 'F'), 18, { rel: 1e-12 }, 'ΔT');
      const { outputs } = calculate({ quantity: 'temperature', value: 100, from_unit: 'C', to_unit: 'F' });
      assertEqual(outputs.factor, null, 'no factor for offset units');
      assertEqual(outputs.result_text, '100 °C = 212 °F', 'text');
    },
  },
  {
    name: 'Round trip is the identity for every unit of every convertible group (to base and back, and between every pair)',
    source: 'Internal consistency of shared/units.js',
    run: () => {
      for (const [groupId, group] of Object.entries(CONVERTIBLE_GROUPS)) {
        const unitIds = Object.keys(group.units);
        for (const from of unitIds) {
          for (const to of unitIds) {
            const there = convert(123.456, from, to, groupId);
            const back = convert(there, to, from, groupId);
            assertClose(back, 123.456, { rel: 1e-10 }, `${groupId}: ${from} → ${to} → ${from}`);
          }
        }
      }
      assertEqual(Object.keys(CONVERTIBLE_GROUPS).includes('dimensionless'), false, 'single-unit groups excluded');
      assertEqual(Object.keys(CONVERTIBLE_GROUPS).includes('money'), false, 'money excluded');
    },
  },
  {
    name: 'Default conversion 1 kn → m/s and the all-units listing contains every speed unit',
    source: 'Schema defaults; 1 kn = 0.5144444 m/s',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.result_value, 0.5144444, { abs: 5e-8 }, 'default result');
      assertClose(outputs.factor, 0.5144444, { abs: 5e-8 }, 'factor');
      const lines = outputs.all_units.split('\n');
      assertEqual(lines.length, Object.keys(CONVERTIBLE_GROUPS.speed.units).length, 'one line per unit');
      assertEqual(lines.some((line) => line.endsWith(' km/h')), true, 'km/h present');
    },
  },
  {
    name: 'Invalid inputs fail fast: unknown quantity, unit from another group, non-numeric value',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ quantity: 'flavour' }), 'must be one of', 'quantity');
      assertThrows(() => calculate({ quantity: 'speed', from_unit: 'psi' }), 'must be one of', 'wrong unit');
      assertThrows(() => calculate({ value: 'abc' }), 'must be a number', 'value');
    },
  },
];
