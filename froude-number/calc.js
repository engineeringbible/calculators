/**
 * froude-number/calc.js — length Froude number of a ship or boat, depth Froude number in shallow water with the
 * critical speed, the volumetric Froude number of fast craft, the speeds of the main wave-making points and the regimes.
 *
 * Fn = V / √(g L);  Fn_h = V / √(g h), critical speed V_crit = √(g h);  Fn_∇ = V / √(g ∇^(1/3)).
 * Hull speed at Fn 0.40 (wave length λ = 2π V²/g = L), main resistance hump near Fn 0.5.
 * Schema units: m, kn, m³.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative } from '../shared/validate.js';

const KN = 1852 / 3600;
/** Fn at which the transverse wave is as long as the hull: 1/√(2π). */
export const FN_HULL_SPEED = 1 / Math.sqrt(2 * Math.PI);
/** Main resistance hump (Lewis, PNA Vol. II; Larsson & Raven). */
export const FN_MAIN_HUMP = 0.5;
/** Depth Froude number bands (SVA Potsdam): subcritical < 0.9, critical 0.9–1.1, supercritical > 1.1; most squat formulas are fitted below about 0.7. */
export const FNH_SQUAT_LIMIT = 0.7;
export const FNH_CRITICAL_LOW = 0.9;
export const FNH_CRITICAL_HIGH = 1.1;

export const schema = {
  id: 'froude-number',
  name: 'Froude number calculator for ships and boats',
  category: 'maritime',
  summary: 'Length and depth Froude numbers of a ship or boat, the critical speed in shallow water, the hull-speed and hump speeds, and the wave-making regime.',
  related: ['hull-speed', 'shallow-water-speed', 'ship-squat', 'wave-properties'],
  assumptions: [
    'L is the waterline length (or the length between perpendiculars for a ship) and V the speed through the water; the length Froude number compares the speed with the speed of a water wave as long as the hull.',
    'The depth Froude number uses the undisturbed water depth h. At Fn_h = 1 the ship moves at the speed of the longest shallow-water wave, √(g h): resistance, wash and squat peak just below it.',
    'Depth regimes follow the Schiffbau-Versuchsanstalt Potsdam: subcritical below 0.9, critical 0.9 to 1.1, supercritical above 1.1. Most empirical squat formulas are fitted only up to about Fn_h 0.7.',
    'Length regimes are indicative: hull speed at Fn 0.40, the main resistance hump near Fn 0.5. For fast craft the volumetric Froude number Fn_∇ separates displacement (below 1), semi-planing (1 to 3) and planing (above 3) after Savitsky.',
  ],
  notes: [
    'Verification 2026-11-08: a ship 180 m long at 14 kn has Fn = 7.202 / √(9.80665 × 180) = 0.171; in 20 m of water Fn_h = 0.514 and the critical speed √(9.80665 × 20) = 14.00 m/s = 27.2 kn. Checked by hand.',
  ],
  sources: [
    'E.V. Lewis (ed.), Principles of Naval Architecture, 2nd rev. (SNAME, 1988), Vol. II ch. 5: Froude number, wave-making resistance, humps and hollows, and shallow-water effects',
    'L. Larsson and H.C. Raven, Ship Resistance and Flow (SNAME PNA series, 2010): wave resistance and shallow-water effects',
    'Schiffbau-Versuchsanstalt Potsdam (SVA), Shallow water: subcritical (Fn_h < 0.9), critical (0.9–1.1) and supercritical (> 1.1) ranges',
    'D. Savitsky, On the subject of high-speed monohulls, SNAME Greek Section (2003): displacement, semi-planing and planing ranges of the volumetric Froude number',
  ],
  inputs: [
    { id: 'length_m', label: 'Waterline length L', group: 'length', unit: 'm', default: 180, min: 0.5, max: 500 },
    { id: 'speed_kn', label: 'Speed through the water', group: 'speed', unit: 'kn', default: 14, min: 0, max: 100 },
    { id: 'depth_m', label: 'Water depth h (0 = deep water)', group: 'length', unit: 'm', default: 20, min: 0, max: 11000 },
    { id: 'volume_m3', label: 'Displacement volume ∇ (optional, for fast craft; 0 = skip)', group: 'volume', unit: 'm3', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'fn', label: 'Froude number Fn = V / √(g L)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'length_regime', label: 'Wave-making regime', type: 'text' },
    { id: 'hull_speed_kn', label: 'Hull speed (Fn 0.40, bow wave as long as the hull)', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'hump_speed_kn', label: 'Main resistance hump (Fn 0.5)', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'wave_length_m', label: 'Length of the ship\'s transverse wave (deep water)', group: 'length', unit: 'm' },
    { id: 'fnh', label: 'Depth Froude number Fn_h = V / √(g h)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'depth_regime', label: 'Shallow-water regime', type: 'text' },
    { id: 'critical_kn', label: 'Critical speed √(g h) (Fn_h = 1)', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'squat_limit_kn', label: 'Speed at Fn_h 0.7 (limit of most squat formulas)', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'fn_vol', label: 'Volumetric Froude number Fn_∇ = V / √(g ∇^(1/3))', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'vol_regime', label: 'Fast-craft regime (Savitsky)', type: 'text' },
  ],
  example: {
    inputs: { length_m: [180, 'm'], speed_kn: [14, 'kn'], depth_m: [20, 'm'], volume_m3: [0, 'm3'] },
    results: { fn: '0.171', fnh: '0.514', critical_kn: '27.2 kn', squat_limit_kn: '19.1 kn', hull_speed_kn: '32.6 kn' },
  },
};

function lengthRegime(fn) {
  if (fn === 0) return 'At rest';
  if (fn < 0.15) return 'Slow: friction makes up most of the resistance';
  if (fn < 0.3) return 'Normal ship speeds: wave resistance grows, with humps and hollows';
  if (fn < FN_HULL_SPEED) return 'Approaching hull speed: wave resistance rises steeply';
  if (fn < 0.6) return 'Hump region: the hull rides its own bow wave (main hump near Fn 0.5)';
  return 'Beyond the main hump: only light semi-planing or planing hulls get here';
}

function depthRegime(fnh) {
  if (fnh < FNH_SQUAT_LIMIT) return 'Subcritical: shallow-water effects grow with speed but stay moderate';
  if (fnh < FNH_CRITICAL_LOW) return 'Subcritical, approaching critical: squat and resistance rise steeply';
  if (fnh <= FNH_CRITICAL_HIGH) return 'Critical: maximum resistance, wash and squat — avoid';
  return 'Supercritical: the ship outruns its own wave system (only fast craft)';
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const L = assertPositive(x.length_m, 'length_m', 'Waterline length');
  const Vkn = assertNonNegative(x.speed_kn, 'speed_kn', 'Speed');
  const h = assertNonNegative(x.depth_m, 'depth_m', 'Water depth');
  const vol = assertNonNegative(x.volume_m3, 'volume_m3', 'Displacement volume');
  const g = GRAVITY_M_S2;
  const V = Vkn * KN;
  const fn = V / Math.sqrt(g * L);
  const fnh = h > 0 ? V / Math.sqrt(g * h) : null;
  const fnVol = vol > 0 ? V / Math.sqrt(g * Math.cbrt(vol)) : null;
  const warnings = [];
  if (fnh !== null && fnh >= FNH_CRITICAL_LOW && fnh <= FNH_CRITICAL_HIGH) warnings.push('Near the critical speed √(g h): resistance, wash and squat peak. Displacement ships should slow down well before this.');
  else if (fnh !== null && fnh >= FNH_SQUAT_LIMIT && fnh < FNH_CRITICAL_LOW) warnings.push('Depth Froude number above 0.7: squat rises steeply and most squat formulas are outside their range.');
  return {
    outputs: {
      fn,
      length_regime: lengthRegime(fn),
      hull_speed_kn: (FN_HULL_SPEED * Math.sqrt(g * L)) / KN,
      hump_speed_kn: (FN_MAIN_HUMP * Math.sqrt(g * L)) / KN,
      wave_length_m: V > 0 ? (2 * Math.PI * V * V) / g : null,
      fnh,
      depth_regime: fnh === null ? 'Deep water (no depth given)' : depthRegime(fnh),
      critical_kn: h > 0 ? Math.sqrt(g * h) / KN : null,
      squat_limit_kn: h > 0 ? (FNH_SQUAT_LIMIT * Math.sqrt(g * h)) / KN : null,
      fn_vol: fnVol,
      vol_regime: fnVol === null ? 'Not calculated (no displacement volume given)' : fnVol < 1 ? 'Displacement (Fn_∇ below 1): buoyancy carries the weight' : fnVol <= 3 ? 'Semi-planing (Fn_∇ 1 to 3): buoyancy and dynamic lift share the weight' : 'Planing (Fn_∇ above 3): dynamic lift carries most of the weight',
    },
    warnings,
  };
}
