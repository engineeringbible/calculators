/**
 * true-airspeed/tests.js — checks against the ICAO standard atmosphere and the subsonic pitot-static relations.
 * Run: node run-tests.js true-airspeed
 */
import { calculate, isa, machFromCas } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KN = 1852 / 3600;
const FT = 0.3048;

export const tests = [
  {
    name: 'Sea-level standard day: TAS = EAS = CAS (150 kn), speed of sound 661.48 kn (340.294 m/s)',
    source: 'Definition of calibrated airspeed; ICAO Doc 7488/3 a0 = 340.294 m/s',
    run: () => {
      const o = calculate({ airspeed_m_s: 150 * KN, pressure_alt_m: 0, oat_c: 15, headwind_m_s: 0 }).outputs;
      assertClose(o.tas_m_s / KN, 150, { rel: 1e-9 }, 'TAS');
      assertClose(o.eas_m_s / KN, 150, { rel: 1e-9 }, 'EAS');
      assertClose(o.sound_m_s, 340.294, { abs: 0.001 }, 'a0');
    },
  },
  {
    name: 'ISA tables: 11 000 m is 22 632 Pa and 216.65 K (speed of sound 573.6 kn); 8 000 ft is 752.6 hPa',
    source: 'ICAO Doc 7488/3 standard atmosphere tables',
    run: () => {
      assertClose(isa(11000).p, 22632.06, { abs: 0.1 }, 'p11');
      assertClose(isa(15000).T, 216.65, { abs: 1e-9 }, 'isothermal layer');
      assertClose(isa(8000 * FT).p / 100, 752.6, { abs: 0.1 }, '8 000 ft');
      const o = calculate({ pressure_alt_m: 11000, oat_c: -56.5, airspeed_m_s: 250 * KN }).outputs;
      assertClose(o.sound_m_s / KN, 573.57, { abs: 0.01 }, 'a at the tropopause');
    },
  },
  {
    name: 'CAS 150 kn at 8 000 ft and 0 °C: Mach 0.2625, TAS 169.1 kn, EAS 149.7 kn, ground speed 149.1 kn into 20 kn',
    source: 'Hand calculation with q_c = p0[(1 + 0.2(Vc/a0)²)^3.5 − 1], M = √(5[(q_c/p + 1)^(2/7) − 1]) (Anderson, Ch. 3)',
    run: () => {
      const o = calculate({}).outputs;
      const p = isa(8000 * FT).p;
      const qc = 101325 * ((1 + 0.2 * ((150 * KN) / 340.294) ** 2) ** 3.5 - 1);
      const m = Math.sqrt(5 * ((qc / p + 1) ** (2 / 7) - 1));
      assertClose(o.mach, m, { rel: 1e-6 }, 'Mach');
      assertClose(o.tas_m_s / KN, 169.08, { abs: 0.01 }, 'TAS');
      assertClose(o.eas_m_s / KN, 149.67, { abs: 0.01 }, 'EAS');
      assertClose(o.gs_m_s / KN, 149.08, { abs: 0.01 }, 'GS');
      assertClose(o.rule_tas_m_s / KN, 174, { abs: 1e-9 }, 'rule of thumb');
    },
  },
  {
    name: 'Airliner: 280 kn CAS at FL350 on a standard day is Mach 0.821, TAS 473 kn; EAS is below CAS',
    source: 'Same relations at ISA 35 000 ft (−54.34 °C); compressibility makes EAS < CAS',
    run: () => {
      const o = calculate({ airspeed_m_s: 280 * KN, pressure_alt_m: 35000 * FT, oat_c: -54.34, headwind_m_s: 0 }).outputs;
      assertClose(o.mach, 0.8213, { abs: 1e-4 }, 'Mach');
      assertClose(o.tas_m_s / KN, 473.4, { abs: 0.1 }, 'TAS');
      assertEqual(o.eas_m_s < o.cas_m_s, true, 'EAS < CAS');
      assertClose(machFromCas(340.294, 101325), 1, { abs: 1e-5 }, 'Mach 1 at sea level for CAS = a0');
    },
  },
  {
    name: 'IAS with a +2 kn correction equals CAS 2 kn higher; a 25 kn tail wind adds to the ground speed',
    source: 'CAS = IAS + correction (POH calibration table); GS = TAS − head wind',
    run: () => {
      const a = calculate({ speed_type: 'ias', airspeed_m_s: 148 * KN, correction_m_s: 2 * KN }).outputs;
      const b = calculate({ speed_type: 'cas', airspeed_m_s: 150 * KN }).outputs;
      assertClose(a.tas_m_s, b.tas_m_s, { rel: 1e-12 }, 'TAS');
      const t = calculate({ headwind_m_s: -25 * KN }).outputs;
      assertClose(t.gs_m_s - t.tas_m_s, 25 * KN, { rel: 1e-9 }, 'tail wind');
    },
  },
  {
    name: 'A supersonic CAS and a pressure altitude above 20 km are rejected; a head wind above TAS gives no ground speed',
    source: 'Validation contract (subsonic relations, ISA to 20 km)',
    run: () => {
      assertThrows(() => calculate({ airspeed_m_s: 345 }), 'Airspeed');
      assertThrows(() => calculate({ pressure_alt_m: 21000 }), 'Pressure altitude');
      const o = calculate({ airspeed_m_s: 60 * KN, pressure_alt_m: 0, oat_c: 15, headwind_m_s: 70 * KN });
      assertEqual(o.outputs.gs_m_s, null, 'no ground speed');
      assertEqual(o.warnings.length, 1, 'warning');
    },
  },
];
