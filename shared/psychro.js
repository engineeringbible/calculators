/**
 * shared/psychro.js — moist-air properties after ASHRAE Handbook — Fundamentals, Chapter 1 (Psychrometrics), used by
 * the dew point, air density and HVAC calculators. DOM-free. Temperatures in °C, pressures in Pa.
 *
 * Saturation pressure: Hyland–Wexler, eq. (5) over ice (−100 to 0 °C) and eq. (6) over water (0 to 200 °C).
 * Humidity ratio W = 0.621945 p_w / (p − p_w) (eq. 20); specific volume v = 287.042 T (1 + 1.607858 W) / p (eq. 26);
 * wet bulb from eq. (33)/(35) by bisection; standard pressure p = 101 325 (1 − 2.25577e−5 Z)^5.2559 (eq. 3).
 */

const C = [-5.6745359e3, 6.3925247, -9.677843e-3, 6.2215701e-7, 2.0747825e-9, -9.484024e-13, 4.1635019];
const W_ = [-5.8002206e3, 1.3914993, -4.8640239e-2, 4.1764768e-5, -1.4452093e-8, 6.5459673];

/** Saturation pressure of water vapour, Pa, over ice below 0 °C and over liquid water at and above 0 °C. */
export function saturationPressure(tC) {
  const T = tC + 273.15;
  if (tC < 0) return Math.exp(C[0] / T + C[1] + C[2] * T + C[3] * T ** 2 + C[4] * T ** 3 + C[5] * T ** 4 + C[6] * Math.log(T));
  return Math.exp(W_[0] / T + W_[1] + W_[2] * T + W_[3] * T ** 2 + W_[4] * T ** 3 + W_[5] * Math.log(T));
}

/** Temperature (°C) at which the saturation pressure equals p_w (Pa): the dew point (frost point below 0 °C). */
export function dewPointFromVapourPressure(pw) {
  if (!(pw > 0)) throw new Error('Vapour pressure must be greater than zero.');
  let lo = -100;
  let hi = 200;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (saturationPressure(mid) < pw) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Humidity ratio, kg water per kg dry air. */
export const humidityRatio = (pw, p) => (0.621945 * pw) / (p - pw);

/** Vapour pressure from the humidity ratio. */
export const vapourPressureFromW = (w, p) => (p * w) / (0.621945 + w);

/** Specific volume of moist air, m³ per kg of dry air. */
export const specificVolume = (tC, w, p) => (287.042 * (tC + 273.15) * (1 + 1.607858 * w)) / p;

/** Density of moist air, kg/m³ (total mass per volume). */
export const moistAirDensity = (tC, w, p) => (1 + w) / specificVolume(tC, w, p);

/** Specific enthalpy of moist air, kJ per kg of dry air (eq. 30). */
export const enthalpy = (tC, w) => 1.006 * tC + w * (2501 + 1.86 * tC);

/** Wet-bulb temperature (°C) from dry bulb, humidity ratio and pressure, by bisection on eq. (33) / (35). */
export function wetBulb(tC, w, p) {
  const f = (tw) => {
    const ws = humidityRatio(saturationPressure(tw), p);
    const wCalc = tw >= 0
      ? ((2501 - 2.326 * tw) * ws - 1.006 * (tC - tw)) / (2501 + 1.86 * tC - 4.186 * tw)
      : ((2830 - 0.24 * tw) * ws - 1.006 * (tC - tw)) / (2830 + 1.86 * tC - 2.1 * tw);
    return wCalc - w;
  };
  let lo = w > 0 ? dewPointFromVapourPressure(vapourPressureFromW(w, p)) - 1 : -100;
  let hi = tC + 1e-9;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Standard atmospheric pressure at an altitude in m, Pa. */
export const standardPressure = (zM) => 101325 * (1 - 2.25577e-5 * zM) ** 5.2559;

/** All properties from dry bulb (°C), relative humidity (fraction) and pressure (Pa). */
export function stateFromRh(tC, rh, p) {
  const pws = saturationPressure(tC);
  const pw = rh * pws;
  if (pw >= p) throw new Error('The vapour pressure reaches the total pressure: check the temperature and pressure.');
  const w = humidityRatio(pw, p);
  return {
    pws, pw, w,
    dewPoint: rh > 0 ? dewPointFromVapourPressure(pw) : null,
    wetBulb: wetBulb(tC, w, p),
    density: moistAirDensity(tC, w, p),
    volume: specificVolume(tC, w, p),
    enthalpy: enthalpy(tC, w),
    absoluteHumidity: pw / (461.5 * (tC + 273.15)),
  };
}
