/**
 * true-airspeed/calc.js — true airspeed and Mach number from calibrated (or indicated) airspeed, pressure altitude and
 * outside air temperature, with compressible-flow relations; equivalent airspeed; ground speed with a wind component.
 *
 * Impact pressure q_c = p0 [(1 + 0.2 (V_c/a0)²)^3.5 − 1];  M = √(5 [(q_c/p + 1)^(2/7) − 1]);  a = √(γ R T);
 * TAS = M a;  EAS = a0 M √(p/p0);  GS = TAS − head wind.  ISA (ICAO Doc 7488) gives p at the pressure altitude.
 * Schema units: SI — m/s, m, °C.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const T0 = 288.15;
const P0 = 101325;
const L = 0.0065;
const R = 287.05287;
const G0 = 9.80665;
const GAMMA = 1.4;
const N = G0 / (L * R);
const H11 = 11000;
const T11 = 216.65;
const P11 = P0 * (T11 / T0) ** N;
const A0 = Math.sqrt(GAMMA * R * T0);
const KN = 1852 / 3600;
const FT = 0.3048;

/** ISA static pressure (Pa) and temperature (K) at a pressure altitude h (m), troposphere and lower stratosphere to 20 km. */
export function isa(h) {
  if (h <= H11) { const T = T0 - L * h; return { T, p: P0 * (T / T0) ** N }; }
  return { T: T11, p: P11 * Math.exp((-G0 * (h - H11)) / (R * T11)) };
}

/** Mach number from calibrated airspeed (m/s) and static pressure (Pa), subsonic relations. */
export function machFromCas(vc, p) {
  const qc = P0 * ((1 + 0.2 * (vc / A0) ** 2) ** 3.5 - 1);
  return Math.sqrt(5 * ((qc / p + 1) ** (2 / 7) - 1));
}

export const schema = {
  id: 'true-airspeed',
  name: 'True airspeed calculator (TAS and Mach)',
  category: 'automotive',
  summary: 'True airspeed and Mach number from indicated or calibrated airspeed, pressure altitude and temperature, with equivalent airspeed and ground speed.',
  related: ['density-altitude', 'mach-number', 'thrust-weight', 'drag-lift'],
  assumptions: [
    'Calibrated airspeed is converted with the compressible (isentropic) pitot-static relations for subsonic flow, the same relations the airspeed indicator is calibrated to at sea-level standard conditions (a0 = 661.48 kn, p0 = 29.92 inHg).',
    'Indicated airspeed becomes calibrated airspeed by adding the position and instrument correction from the airspeed calibration table of the POH or AFM; with no correction entered, IAS is taken as CAS.',
    'The outside air temperature is the static air temperature; at jet speeds a probe reads a higher total temperature, which must be corrected first (the Mach number output gives T_total = T (1 + 0.2 M²) for that check).',
    'The static pressure comes from the pressure altitude through the ICAO standard atmosphere, valid to 65 617 ft (20 km).',
    'Ground speed is the true airspeed minus the head-wind component along the track (a tail wind is negative); the wind correction angle of a crosswind is not included.',
  ],
  notes: [
    'Verification 2026-11-08: CAS 150 kn at 8 000 ft pressure altitude and 0 °C: Mach 0.2625, TAS 169.1 kn, EAS 149.7 kn; with a 20 kn head wind ground speed 149.1 kn; the 2 % per 1 000 ft rule gives 174.0 kn. Checked by hand.',
  ],
  sources: [
    'ICAO Doc 7488/3, Manual of the ICAO Standard Atmosphere, 3rd ed. 1993 (p0 = 101 325 Pa, T0 = 288.15 K, a0 = 340.294 m/s, γ = 1.4, R = 287.05287 J/(kg·K))',
    'FAA-H-8083-25C, Pilot’s Handbook of Aeronautical Knowledge (2023), Chapter 8 Flight Instruments: indicated, calibrated, equivalent and true airspeed',
    'J.D. Anderson, Introduction to Flight, 8th ed., McGraw-Hill 2016, Chapter 3 (measurement of airspeed: compressible subsonic flow, calibrated airspeed)',
  ],
  inputs: [
    { id: 'speed_type', label: 'Airspeed entered', type: 'select', default: 'cas', options: [{ value: 'cas', label: 'Calibrated airspeed (CAS)' }, { value: 'ias', label: 'Indicated airspeed (IAS) with a correction' }] },
    { id: 'airspeed_m_s', label: 'Airspeed', group: 'speed', unit: 'm_s', display: 'kn', default: 150 * KN, min: 1, max: 330 },
    { id: 'correction_m_s', label: 'IAS to CAS correction from the POH (+ or −)', group: 'speed', unit: 'm_s', display: 'kn', default: 0, min: -25, max: 25, visibleWhen: { speed_type: 'ias' } },
    { id: 'pressure_alt_m', label: 'Pressure altitude', group: 'length', unit: 'm', display: 'ft', default: 8000 * FT, min: -600, max: 20000 },
    { id: 'oat_c', label: 'Outside air temperature (static)', group: 'temperature', unit: 'C', default: 0, min: -90, max: 60 },
    { id: 'headwind_m_s', label: 'Head-wind component (tail wind negative)', group: 'speed', unit: 'm_s', display: 'kn', default: 20 * KN, min: -150, max: 150 },
  ],
  outputs: [
    { id: 'cas_m_s', label: 'Calibrated airspeed', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'tas_m_s', label: 'True airspeed', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'mach', label: 'Mach number', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'eas_m_s', label: 'Equivalent airspeed', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'gs_m_s', label: 'Ground speed', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'rule_tas_m_s', label: 'TAS by the 2 % per 1 000 ft rule of thumb', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'sound_m_s', label: 'Speed of sound at the OAT', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'isa_dev_c', label: 'Temperature deviation from ISA', group: 'temperature_difference', unit: 'K', display: 'C', decimals: 1 },
  ],
  example: {
    inputs: { speed_type: 'cas', airspeed_m_s: [150, 'kn'], pressure_alt_m: [8000, 'ft'], oat_c: [0, 'C'], headwind_m_s: [20, 'kn'] },
    results: { mach: '0.2625', tas_m_s: '169.1 kn', eas_m_s: '149.7 kn', gs_m_s: '149.1 kn', rule_tas_m_s: '174.0 kn' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.speed_type, ['cas', 'ias'], 'speed_type', 'Airspeed entered');
  const v = assertRange(x.airspeed_m_s, 1, 330, 'airspeed_m_s', 'Airspeed');
  const corr = x.speed_type === 'ias' ? assertRange(x.correction_m_s, -25, 25, 'correction_m_s', 'IAS to CAS correction') : 0;
  const h = assertRange(x.pressure_alt_m, -600, 20000, 'pressure_alt_m', 'Pressure altitude');
  const oat = assertRange(x.oat_c, -90, 60, 'oat_c', 'Outside air temperature');
  const wind = assertRange(x.headwind_m_s, -150, 150, 'headwind_m_s', 'Head-wind component');
  const vc = v + corr;
  if (!(vc > 0)) throw new Error('IAS to CAS correction: the calibrated airspeed must be greater than zero.');
  if (vc >= A0) throw new Error('Airspeed: a calibrated airspeed at or above 661.5 kn needs the supersonic pitot relation, which this calculator does not cover.');
  const { p, T: Tisa } = isa(h);
  const M = machFromCas(vc, p);
  if (M >= 1) throw new Error('Airspeed: the flight Mach number would be 1 or more; the subsonic pitot relations no longer apply.');
  const T = oat + 273.15;
  const a = Math.sqrt(GAMMA * R * T);
  const tas = M * a;
  const gs = tas - wind;
  const warnings = [];
  if (gs <= 0) warnings.push('The head wind is at least the true airspeed: the aircraft makes no progress over the ground.');
  if (M > 0.3) warnings.push('Above Mach 0.3 compressibility matters: use CAS from the airspeed calibration, and correct a probe temperature reading for ram rise before entering it.');
  return {
    outputs: {
      cas_m_s: vc, tas_m_s: tas, mach: M, eas_m_s: A0 * M * Math.sqrt(p / P0), gs_m_s: gs > 0 ? gs : null,
      rule_tas_m_s: vc * (1 + 0.02 * (h / FT / 1000)), sound_m_s: a, isa_dev_c: T - Tisa,
    },
    warnings,
  };
}
