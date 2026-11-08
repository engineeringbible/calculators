/**
 * wind-turbine-power/calc.js — power of a wind turbine from the rotor diameter, wind speed, air density and power
 * coefficient (Betz limit 16/27), and the yearly energy from a mean wind speed with a Rayleigh distribution and the
 * cut-in, rated and cut-out speeds, or from a capacity factor.
 *
 * P = ½ ρ A v³ Cp,  Cp ≤ 16/27;  ρ from the ISO 2533 standard atmosphere at the altitude (optionally the actual
 * temperature);  Rayleigh f(v) = (π v / 2 v̄²) exp(−π v² / 4 v̄²);  E = 8 760 h × ∫ P(v) f(v) dv.
 * Schema units: SI — m, m², kg/m³, m/s, W, J (display kWh), °C.
 */
import { withDefaults, assertRange, assertOneOf } from '../shared/validate.js';

export const BETZ = 16 / 27;
const HOURS_YEAR = 8760;
const R_AIR = 287.05287; // J/(kg K), ISO 2533
const T0 = 288.15;
const P0 = 101325;
const LAPSE = 0.0065; // K/m, troposphere
const G0 = 9.80665;

const R_EARTH = 6356766; // m, ISO 2533 radius for geopotential height

/** ISO 2533 standard atmosphere (troposphere): pressure Pa and temperature K at a geometric altitude above sea level. */
export function isaAt(altitudeM) {
  const hGeo = (R_EARTH * altitudeM) / (R_EARTH + altitudeM);
  const t = T0 - LAPSE * hGeo;
  const p = P0 * (t / T0) ** (G0 / (R_AIR * LAPSE));
  return { p, t };
}

/** Rayleigh probability density of wind speed v for a mean speed vm (k = 2). */
export const rayleighPdf = (v, vm) => ((Math.PI * v) / (2 * vm * vm)) * Math.exp((-Math.PI * v * v) / (4 * vm * vm));

/** Rayleigh probability that the speed exceeds v. */
export const rayleighExceed = (v, vm) => Math.exp((-Math.PI * v * v) / (4 * vm * vm));

/**
 * Mean power, W, of an idealised turbine: P = k v³ between cut-in and rated, k v_r³ from rated to cut-out, 0 elsewhere,
 * with k = ½ ρ A Cp, averaged over a Rayleigh distribution (Simpson's rule on the cubic part, exact on the flat part).
 */
export function rayleighMeanPower(k, vm, vIn, vRated, vOut) {
  const n = 2000;
  const h = (vRated - vIn) / n;
  let s = 0;
  for (let i = 0; i <= n; i += 1) {
    const v = vIn + i * h;
    const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    s += w * k * v ** 3 * rayleighPdf(v, vm);
  }
  const cubic = (s * h) / 3;
  const flat = k * vRated ** 3 * (rayleighExceed(vRated, vm) - rayleighExceed(vOut, vm));
  return cubic + flat;
}

export const schema = {
  id: 'wind-turbine-power',
  name: 'Wind turbine power calculator',
  category: 'electrical',
  summary: 'Wind turbine power from rotor diameter, wind speed, air density and power coefficient (Betz limit), and yearly energy from the mean wind speed by Rayleigh.',
  related: ['air-density', 'solar-payback', 'micro-hydro', 'solar-battery-bank'],
  assumptions: [
    'The power is ½ ρ A v³ Cp: the kinetic energy flux through the swept area times the power coefficient. No turbine can exceed the Betz limit Cp = 16/27 = 0.593; small turbines reach about 0.25 to 0.35 from wind to electricity, large ones about 0.45 at their best.',
    'Air density comes from the ISO 2533 standard atmosphere at the hub altitude, optionally with the actual air temperature at the standard pressure of that altitude; humidity is neglected (it lowers the density by under 1 %).',
    'The yearly energy uses an idealised power curve: zero below the cut-in speed, P = ½ ρ A v³ Cp with a constant Cp up to the rated speed, the rated power up to the cut-out speed, and zero above it. A real power curve from the manufacturer gives a better estimate.',
    'Wind speeds follow a Rayleigh distribution (Weibull with k = 2) about the mean speed at hub height, as in the IEC 61400-12-1 annual energy estimate; sites with steadier or gustier winds have other shape factors. The mean speed must be at hub height: wind speed rises with height above the ground.',
    'Availability, wake and electrical losses beyond those in Cp are not deducted; the year has 8 760 hours.',
  ],
  notes: [
    'Verification 2026-11-08: a 3 m rotor sweeps 7.07 m²; at 6 m/s, 1.225 kg/m³ and Cp 0.35 it gives 327 W, rated 2 017 W at 11 m/s; with a 5 m/s Rayleigh mean, cut-in 3 and cut-out 25 m/s the mean power is 338 W, 2 962 kWh a year, capacity factor 16.8 %. The Rayleigh integral was checked against (6/π) v̄³ and the ISA density against 1.1117 kg/m³ at 1 000 m.',
  ],
  sources: [
    'Manwell, McGowan and Rogers, Wind Energy Explained: Theory, Design and Application, 2nd ed., Wiley 2009: ch. 2 (wind power density, Rayleigh distribution) and ch. 3 (Betz limit 16/27)',
    'IEC 61400-12-1:2017 Wind energy generation systems — Power performance measurements of electricity producing wind turbines (annual energy production from a power curve and a Rayleigh wind speed distribution)',
    'ISO 2533:1975 Standard Atmosphere (ρ0 = 1.225 kg/m³, lapse rate 6.5 K/km)',
  ],
  inputs: [
    { id: 'diameter_m', label: 'Rotor diameter', group: 'length', unit: 'm', default: 3, min: 0.2, max: 300 },
    { id: 'speed_m_s', label: 'Wind speed (for the power at one speed)', group: 'speed', unit: 'm_s', default: 6, min: 0, max: 70 },
    { id: 'cp', label: 'Power coefficient Cp (wind to electricity)', group: 'dimensionless', unit: 'none', default: 0.35, min: 0.01, max: 0.593 },
    { id: 'density_mode', label: 'Air density', type: 'select', default: 'isa', options: [{ value: 'isa', label: 'Standard atmosphere at the altitude' }, { value: 'temp', label: 'Altitude and actual air temperature' }, { value: 'entered', label: 'Enter the density' }] },
    { id: 'altitude_m', label: 'Site altitude above sea level', group: 'length', unit: 'm', default: 0, min: -400, max: 5000, visibleWhen: { density_mode: ['isa', 'temp'] } },
    { id: 'temp_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 15, min: -50, max: 50, visibleWhen: { density_mode: 'temp' } },
    { id: 'density', label: 'Air density', group: 'density', unit: 'kg_m3', default: 1.225, min: 0.5, max: 1.6, visibleWhen: { density_mode: 'entered' } },
    { id: 'energy_mode', label: 'Yearly energy from', type: 'select', default: 'rayleigh', options: [{ value: 'rayleigh', label: 'Mean wind speed (Rayleigh distribution)' }, { value: 'cf', label: 'A capacity factor' }] },
    { id: 'mean_m_s', label: 'Mean wind speed at hub height', group: 'speed', unit: 'm_s', default: 5, min: 0.5, max: 20, visibleWhen: { energy_mode: 'rayleigh' } },
    { id: 'cut_in_m_s', label: 'Cut-in speed', group: 'speed', unit: 'm_s', default: 3, min: 0, max: 15, visibleWhen: { energy_mode: 'rayleigh' } },
    { id: 'rated_m_s', label: 'Rated wind speed', group: 'speed', unit: 'm_s', default: 11, min: 2, max: 30 },
    { id: 'cut_out_m_s', label: 'Cut-out speed', group: 'speed', unit: 'm_s', default: 25, min: 5, max: 70, visibleWhen: { energy_mode: 'rayleigh' } },
    { id: 'capacity_factor', label: 'Capacity factor', group: 'ratio', unit: 'frac', display: 'pct', default: 0.2, min: 0.01, max: 0.7, visibleWhen: { energy_mode: 'cf' } },
  ],
  outputs: [
    { id: 'area_m2', label: 'Swept area A = π D² / 4', group: 'area', unit: 'm2' },
    { id: 'density_out', label: 'Air density used', group: 'density', unit: 'kg_m3', decimals: 4 },
    { id: 'power_w', label: 'Power at the wind speed (held at the rated power above the rated speed)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'wind_power_w', label: 'Power in the wind ½ ρ A v³', group: 'power', unit: 'W', display: 'kW' },
    { id: 'betz_w', label: 'Betz limit at the wind speed (Cp = 16/27)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'rated_w', label: 'Rated power at the rated wind speed', group: 'power', unit: 'W', display: 'kW' },
    { id: 'mean_power_w', label: 'Mean power over the year', group: 'power', unit: 'W', display: 'kW' },
    { id: 'energy_j', label: 'Energy per year', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'cf_out', label: 'Capacity factor', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'resource_w_m2', label: 'Mean wind power density, Rayleigh (6/π) ½ ρ v̄³ (W/m²)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'hours_running', label: 'Share of the year between cut-in and cut-out', group: 'ratio', unit: 'frac', display: 'pct' },
  ],
  example: {
    inputs: { diameter_m: [3, 'm'], speed_m_s: [6, 'm_s'], cp: 0.35, density_mode: 'isa', altitude_m: [0, 'm'], energy_mode: 'rayleigh', mean_m_s: [5, 'm_s'], cut_in_m_s: [3, 'm_s'], rated_m_s: [11, 'm_s'], cut_out_m_s: [25, 'm_s'] },
    results: { area_m2: '7.07 m²', power_w: '327 W', rated_w: '2 017 W', mean_power_w: '338 W', energy_j: '2 962 kWh', cf_out: '16.8 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.density_mode, ['isa', 'temp', 'entered'], 'density_mode', 'Air density');
  assertOneOf(x.energy_mode, ['rayleigh', 'cf'], 'energy_mode', 'Yearly energy from');
  const d = assertRange(x.diameter_m, 0.2, 300, 'diameter_m', 'Rotor diameter');
  const v = assertRange(x.speed_m_s, 0, 70, 'speed_m_s', 'Wind speed');
  const cp = assertRange(x.cp, 0.01, 1, 'cp', 'Power coefficient');
  if (cp > BETZ + 1e-9) throw new Error('Power coefficient: no turbine can exceed the Betz limit 16/27 = 0.593.');
  let rho;
  if (x.density_mode === 'entered') rho = assertRange(x.density, 0.5, 1.6, 'density', 'Air density');
  else {
    const h = assertRange(x.altitude_m, -400, 5000, 'altitude_m', 'Site altitude');
    const { p, t } = isaAt(h);
    const tK = x.density_mode === 'temp' ? assertRange(x.temp_c, -50, 50, 'temp_c', 'Air temperature') + 273.15 : t;
    rho = p / (R_AIR * tK);
  }
  const vr = assertRange(x.rated_m_s, 2, 30, 'rated_m_s', 'Rated wind speed');
  const area = (Math.PI * d * d) / 4;
  const k = 0.5 * rho * area * cp;
  const rated = k * vr ** 3;
  let mean;
  let running = null;
  let resource = null;
  if (x.energy_mode === 'rayleigh') {
    const vm = assertRange(x.mean_m_s, 0.5, 20, 'mean_m_s', 'Mean wind speed');
    const vin = assertRange(x.cut_in_m_s, 0, 15, 'cut_in_m_s', 'Cut-in speed');
    const vout = assertRange(x.cut_out_m_s, 5, 70, 'cut_out_m_s', 'Cut-out speed');
    if (vin >= vr) throw new Error('Cut-in speed: it must be below the rated wind speed.');
    if (vout < vr) throw new Error('Cut-out speed: it must be at or above the rated wind speed.');
    mean = rayleighMeanPower(k, vm, vin, vr, vout);
    running = rayleighExceed(vin, vm) - rayleighExceed(vout, vm);
    resource = (6 / Math.PI) * 0.5 * rho * vm ** 3;
  } else {
    mean = rated * assertRange(x.capacity_factor, 0.01, 0.7, 'capacity_factor', 'Capacity factor');
  }
  const warnings = [];
  if (x.energy_mode === 'rayleigh' && x.mean_m_s < 4) warnings.push('A mean wind speed below about 4 m/s at hub height gives little energy; check the site with measurements before buying a turbine.');
  if (x.energy_mode === 'cf' && x.capacity_factor > 0.5) warnings.push('Capacity factors above 50 % are rare even offshore; check the value.');
  return {
    outputs: {
      area_m2: area,
      density_out: rho,
      power_w: v <= vr ? k * v ** 3 : rated,
      wind_power_w: 0.5 * rho * area * v ** 3,
      betz_w: 0.5 * rho * area * v ** 3 * BETZ,
      rated_w: rated,
      mean_power_w: mean,
      energy_j: mean * HOURS_YEAR * 3600,
      cf_out: mean / rated,
      resource_w_m2: resource,
      hours_running: running,
    },
    warnings,
  };
}
