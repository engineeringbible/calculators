/**
 * beaufort-sea-state/tests.js — checks against the WMO Beaufort and Douglas sea-state code tables.
 * Run: node run-tests.js beaufort-sea-state
 */
import { calculate, beaufortFromWindSpeed, seaStateFromWaveHeight, typicalWindSpeedMS, BEAUFORT_TABLE, SEA_STATE_TABLE } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KN = 1852 / 3600;

export const tests = [
  {
    name: 'Beaufort 6 is "Strong breeze", 22–27 kn, probable wave 3.0 m, maximum 4.0 m, sea state 5 "Rough"',
    source: 'WMO Manual on Codes, WMO-No. 306, code table 1100 (Beaufort) and code table 3700 (Douglas sea state); UK Met Office Beaufort scale table',
    run: () => {
      const { outputs } = calculate({ mode: 'beaufort', beaufort: 6 });
      assertEqual(outputs.beaufort_description, 'Strong breeze', 'description');
      assertClose(convert(outputs.wind_lower_m_s, 'm_s', 'kn', 'speed'), 22, { rel: 1e-12 }, 'lower kn');
      assertClose(convert(outputs.wind_upper_m_s, 'm_s', 'kn', 'speed'), 27, { rel: 1e-12 }, 'upper kn');
      assertEqual(outputs.wave_probable_m, 3.0, 'probable wave');
      assertEqual(outputs.wave_max_m, 4.0, 'max wave');
      assertEqual(outputs.sea_state_out, 5, 'sea state');
      assertEqual(outputs.sea_state_description, 'Rough', 'sea description');
    },
  },
  {
    name: 'Full table spot checks: force 0 calm <1 kn, force 8 gale 34–40 kn, force 12 hurricane ≥ 64 kn',
    source: 'WMO-No. 306 code table 1100',
    run: () => {
      assertEqual(BEAUFORT_TABLE[0].description, 'Calm', 'force 0');
      assertEqual(BEAUFORT_TABLE[8].lowerKn, 34, 'force 8 lower');
      assertEqual(BEAUFORT_TABLE[8].upperKn, 40, 'force 8 upper');
      assertEqual(BEAUFORT_TABLE[12].lowerKn, 64, 'force 12 lower');
      assertEqual(BEAUFORT_TABLE[12].upperKn, null, 'force 12 open-ended');
      assertEqual(BEAUFORT_TABLE.length, 13, '13 forces');
      for (let force = 1; force < 12; force += 1) {
        assertEqual(BEAUFORT_TABLE[force].lowerKn, BEAUFORT_TABLE[force - 1].upperKn + 1, `force ${force} contiguous with ${force - 1}`);
      }
    },
  },
  {
    name: 'Wind 24 kn (12.35 m/s) → force 6; 10 m/s (19.4 kn) → force 5; 70 kn → force 12',
    source: 'WMO-No. 306 code table 1100 knot bounds; 1 kn = 1852/3600 m/s',
    run: () => {
      assertEqual(calculate({ mode: 'wind', wind_speed_m_s: 24 * KN }).outputs.beaufort_out, 6, '24 kn');
      assertEqual(calculate({ mode: 'wind', wind_speed_m_s: 10 }).outputs.beaufort_out, 5, '10 m/s');
      assertEqual(calculate({ mode: 'wind', wind_speed_m_s: 70 * KN }).outputs.beaufort_description, 'Hurricane force', '70 kn');
      assertEqual(beaufortFromWindSpeed(0.2).force, 0, '0.2 m/s is calm');
      assertEqual(beaufortFromWindSpeed(0.4).force, 1, '0.4 m/s is light air (WMO m/s bound 0.3)');
    },
  },
  {
    name: 'WMO empirical speed 0.836 × B^1.5: force 6 → 12.29 m/s (23.9 kn), force 12 → 34.75 m/s',
    source: 'WMO Guide to Meteorological Instruments and Methods of Observation (WMO-No. 8), Beaufort equivalent speeds; relation v = 0.836 B^(3/2)',
    run: () => {
      assertClose(typicalWindSpeedMS(6), 12.287, { abs: 5e-3 }, 'B6');
      assertClose(typicalWindSpeedMS(12), 34.75, { abs: 5e-3 }, 'B12');
      const typicalKn = convert(calculate({ mode: 'beaufort', beaufort: 6 }).outputs.wind_typical_m_s, 'm_s', 'kn', 'speed');
      assertEqual(typicalKn >= 22 && typicalKn <= 27, true, 'typical speed lies inside the force 6 band');
    },
  },
  {
    name: 'Wave 7 m → sea state 7 "High" (6–9 m) and nearest Beaufort 9; 0.3 m → sea state 2 "Smooth"',
    source: 'WMO-No. 306 code table 3700 (state of the sea)',
    run: () => {
      const high = calculate({ mode: 'wave', wave_height_m: 7 }).outputs;
      assertEqual(high.sea_state_out, 7, 'sea state');
      assertEqual(high.sea_state_description, 'High', 'description');
      assertEqual(high.sea_wave_lower_m, 6, 'lower');
      assertEqual(high.sea_wave_upper_m, 9, 'upper');
      assertEqual(high.beaufort_out, 9, 'nearest Beaufort');
      assertEqual(seaStateFromWaveHeight(0.3).description, 'Smooth (wavelets)', '0.3 m');
      assertEqual(seaStateFromWaveHeight(0).code, 0, 'glassy calm');
      assertEqual(seaStateFromWaveHeight(20).code, 9, 'phenomenal');
    },
  },
  {
    name: 'Sea state 4 "Moderate" is 1.25–2.5 m; table has 10 codes with contiguous bounds',
    source: 'WMO-No. 306 code table 3700',
    run: () => {
      const { outputs } = calculate({ mode: 'sea_state', sea_state: 4 });
      assertEqual(outputs.sea_state_description, 'Moderate', 'description');
      assertEqual(outputs.sea_wave_lower_m, 1.25, 'lower');
      assertEqual(outputs.sea_wave_upper_m, 2.5, 'upper');
      assertEqual(SEA_STATE_TABLE.length, 10, '10 codes');
      for (let code = 2; code < 10; code += 1) {
        assertEqual(SEA_STATE_TABLE[code].lowerM, SEA_STATE_TABLE[code - 1].upperM, `code ${code} contiguous`);
      }
    },
  },
  {
    name: 'Force 12 has no upper wind bound and no maximum wave height (reported as null)',
    source: 'WMO-No. 306 code table 1100: force 12 is open-ended',
    run: () => {
      const { outputs, warnings } = calculate({ mode: 'beaufort', beaufort: 12 });
      assertEqual(outputs.wind_upper_m_s, null, 'upper wind');
      assertEqual(outputs.wave_max_m, null, 'max wave');
      assertEqual(outputs.wave_probable_m, 14, 'probable wave');
      assertEqual(warnings.length > 0, true, 'storm warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: Beaufort 13, sea state 10, fractional Beaufort, negative wind',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ mode: 'beaufort', beaufort: 13 }), 'between 0 and 12', 'Beaufort 13');
      assertThrows(() => calculate({ mode: 'sea_state', sea_state: 10 }), 'between 0 and 9', 'sea state 10');
      assertThrows(() => calculate({ mode: 'beaufort', beaufort: 6.5 }), 'whole number', 'fractional');
      assertThrows(() => calculate({ mode: 'wind', wind_speed_m_s: -1 }), 'must not be negative', 'negative wind');
    },
  },
];
