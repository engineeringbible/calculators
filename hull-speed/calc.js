/**
 * hull-speed/calc.js — displacement hull speed from the waterline length, speed–length ratio and Froude number at a
 * given speed, the speed regime, the bow-wave length, and Gerr's maximum speed–length ratio from the
 * displacement–length ratio.
 *
 * V_hull = 1.34 √LWL[ft] kn = 2.43 √LWL[m] kn;  S/L = V[kn] / √LWL[ft];  Fn = V / √(g LWL) = 0.2976 S/L.
 * Wave length λ = 2π V² / g (λ = LWL at S/L 1.34).  D/L = Δ[long tons] / (0.01 LWL[ft])³;  S/L_max = 8.26 / (D/L)^0.311 (Gerr).
 * Schema units: m, kn, kg.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative } from '../shared/validate.js';

const FT = 0.3048;
const KN = 1852 / 3600;
const LONG_TON_KG = 1016.0469088;
/** Classic displacement hull-speed constant, knots per √ft. */
export const HULL_SPEED_SL = 1.34;
/** Gerr: semi-displacement hulls reach S/L 1.45 or more; planing hulls run above S/L 3.0. */
export const SEMI_SL = 1.45;
export const PLANING_SL = 3.0;

/** Displacement hull speed in knots for a waterline length in metres. */
export function hullSpeedKn(lwlM) {
  return HULL_SPEED_SL * Math.sqrt(lwlM / FT);
}

/** Gerr's maximum speed–length ratio from the displacement–length ratio. */
export function gerrMaxSl(dlRatio) {
  return 8.26 / dlRatio ** 0.311;
}

export const schema = {
  id: 'hull-speed',
  name: 'Hull speed calculator',
  category: 'maritime',
  summary: 'Displacement hull speed from waterline length (1.34 √LWL), speed–length ratio, Froude number, speed regime and Gerr\'s top speed for light hulls.',
  related: ['planing-speed', 'froude-number', 'prop-pitch-speed', 'boat-fuel'],
  assumptions: [
    'Hull speed is the speed at which the bow wave is as long as the waterline: S/L = 1.34, Froude number 0.40. It is a practical limit for heavy displacement hulls, not a physical barrier.',
    'LWL is the waterline length in the loaded condition; overhangs that immerse as the boat heels or squats lengthen the effective waterline a little.',
    'Speed regimes follow Gerr: displacement up to S/L 1.34, semi-displacement from about 1.45 to 3.0 with enough power and a light hull, planing above S/L 3.0.',
    'Gerr\'s formula S/L = 8.26 / (D/L)^0.311 estimates the top speed a hull of that displacement–length ratio can reach without planing; it is an empirical fit, not a resistance calculation.',
  ],
  notes: [
    'Verification 2026-11-08: LWL 30 ft gives 1.34 × √30 = 7.34 kn (2.43 × √9.144 m gives the same); at 6 kn S/L = 1.10 and Fn = 0.326; 10 000 lb gives D/L = 165 and Gerr S/L 1.69, 9.24 kn. Checked by hand.',
  ],
  sources: [
    'D. Gerr, The Propeller Handbook (International Marine, 1989), ch. 2: speed–length ratio, displacement–length ratio and the maximum S/L of semi-displacement hulls',
    'E.V. Lewis (ed.), Principles of Naval Architecture, 2nd rev. (SNAME, 1988), Vol. II ch. 5: Froude number and ship-generated waves (λ = 2π V²/g)',
    'L. Larsson and H.C. Raven, Ship Resistance and Flow (SNAME PNA series, 2010): wave resistance',
  ],
  inputs: [
    { id: 'lwl_m', label: 'Waterline length LWL', group: 'length', unit: 'm', display: 'ft', default: 9.144, min: 0.5, max: 500 },
    { id: 'speed_kn', label: 'Boat speed (to find S/L and Froude number)', group: 'speed', unit: 'kn', default: 6, min: 0, max: 80 },
    { id: 'displacement_kg', label: 'Displacement (optional, 0 = skip Gerr\'s estimate)', group: 'mass', unit: 'kg', display: 'lb', default: 4535.9237, min: 0, max: 5e8 },
  ],
  outputs: [
    { id: 'hull_speed_kn', label: 'Hull speed 1.34 √LWL', group: 'speed', unit: 'kn', decimals: 2 },
    { id: 'sl_ratio', label: 'Speed–length ratio S/L (knots / √ft)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'froude', label: 'Froude number Fn = V / √(g LWL)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'regime', label: 'Speed regime', type: 'text' },
    { id: 'wave_length_m', label: 'Length of the bow wave at this speed', group: 'length', unit: 'm', display: 'ft' },
    { id: 'semi_speed_kn', label: 'Start of the semi-displacement range (S/L 1.45)', group: 'speed', unit: 'kn', decimals: 2 },
    { id: 'planing_speed_kn', label: 'Start of planing (S/L 3.0)', group: 'speed', unit: 'kn', decimals: 2 },
    { id: 'dl_ratio', label: 'Displacement–length ratio D/L', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'gerr_sl', label: 'Gerr maximum S/L = 8.26 / (D/L)^0.311', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'gerr_speed_kn', label: 'Gerr top speed without planing', group: 'speed', unit: 'kn', decimals: 2 },
  ],
  example: {
    inputs: { lwl_m: [30, 'ft'], speed_kn: [6, 'kn'], displacement_kg: [10000, 'lb'] },
    results: { hull_speed_kn: '7.34 kn', sl_ratio: '1.10', froude: '0.326', dl_ratio: '165', gerr_sl: '1.69', gerr_speed_kn: '9.24 kn' },
  },
};

function describeRegime(sl) {
  if (sl === 0) return 'At rest';
  if (sl <= HULL_SPEED_SL) return `Displacement speed (S/L ${sl.toFixed(2)}, at or below 1.34)`;
  if (sl < SEMI_SL) return `Just above hull speed (S/L ${sl.toFixed(2)}): a displacement hull needs steeply more power here`;
  if (sl <= PLANING_SL) return `Semi-displacement range (S/L ${sl.toFixed(2)}, 1.45 to 3.0): needs a light hull and plenty of power`;
  return `Planing (S/L ${sl.toFixed(2)}, above 3.0)`;
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const L = assertPositive(x.lwl_m, 'lwl_m', 'Waterline length');
  const V = assertNonNegative(x.speed_kn, 'speed_kn', 'Boat speed');
  const mass = assertNonNegative(x.displacement_kg, 'displacement_kg', 'Displacement');
  const rootFt = Math.sqrt(L / FT);
  const sl = V / rootFt;
  const vMs = V * KN;
  const fn = vMs / Math.sqrt(GRAVITY_M_S2 * L);
  const dl = mass > 0 ? mass / LONG_TON_KG / (0.01 * (L / FT)) ** 3 : null;
  const gerr = dl ? gerrMaxSl(dl) : null;
  const warnings = [];
  if (gerr !== null && gerr < HULL_SPEED_SL) warnings.push('Gerr\'s formula gives less than S/L 1.34 for this heavy hull: in practice it is limited to about hull speed.');
  if (gerr !== null && gerr > PLANING_SL) warnings.push('Gerr\'s formula gives more than S/L 3.0: a hull this light can plane, so use the planing speed calculator instead.');
  if (dl !== null && (dl < 20 || dl > 800)) warnings.push('The displacement–length ratio is outside the usual range for boats (about 50 to 500): check the displacement and its unit.');
  return {
    outputs: {
      hull_speed_kn: hullSpeedKn(L),
      sl_ratio: sl,
      froude: fn,
      regime: describeRegime(sl),
      wave_length_m: V > 0 ? (2 * Math.PI * vMs * vMs) / GRAVITY_M_S2 : null,
      semi_speed_kn: SEMI_SL * rootFt,
      planing_speed_kn: PLANING_SL * rootFt,
      dl_ratio: dl,
      gerr_sl: gerr,
      gerr_speed_kn: gerr !== null ? gerr * rootFt : null,
    },
    warnings,
  };
}
