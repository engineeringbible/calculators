/**
 * shared/awg.js — American Wire Gauge geometry (ASTM B258), conductor resistance from resistivity, and the IEC 60228
 * metric size series, used by the wire gauge and wire size calculators. DOM-free.
 *
 * d = 0.005 in × 92^((36 − n) / 39), with n = −1, −2, −3 for 00, 000, 0000.  1 circular mil = (π/4) × (0.001 in)².
 * R' = ρ(T) / A × k_s, with ρ(T) = ρ20 (1 + α (T − 20)) and k_s = 1.02 for concentric-lay stranding (ASTM B8).
 */

/** Gauges from the largest to the smallest, as labelled on wire. */
export const AWG_GAUGES = ['0000', '000', '00', '0', ...Array.from({ length: 40 }, (_, i) => String(i + 1))];

/** Usual written name: 0000 is 4/0, 000 is 3/0, 00 is 2/0, 0 is 1/0, then the number. */
export const awgName = (gauge) => (/^0+$/.test(gauge) ? `${gauge.length}/0` : gauge) + ' AWG';

export const awgOptions = () => AWG_GAUGES.map((g) => ({ value: g, label: awgName(g) }));

/** Gauge number n: 0000 → −3, 000 → −2, 00 → −1, 0 → 0, then 1 to 40. */
export function awgNumber(gauge) {
  const g = String(gauge);
  if (!AWG_GAUGES.includes(g)) throw new Error(`Unknown AWG gauge "${g}"`);
  return /^0+$/.test(g) ? 1 - g.length : Number(g);
}

const MM_PER_IN = 25.4;
/** Area of one circular mil in mm². */
export const CMIL_MM2 = (Math.PI / 4) * (MM_PER_IN / 1000) ** 2;

/** Diameter in mm (ASTM B258 defining formula). */
export const awgDiameterMm = (gauge) => 0.005 * MM_PER_IN * 92 ** ((36 - awgNumber(gauge)) / 39);

/** Cross-section of a solid round conductor in mm². */
export const awgAreaMm2 = (gauge) => (Math.PI / 4) * awgDiameterMm(gauge) ** 2;

/** Area in circular mils: the diameter in mils squared. */
export const awgCircularMils = (gauge) => (awgDiameterMm(gauge) / (MM_PER_IN / 1000)) ** 2;

/** Fractional gauge number for a diameter in mm (the inverse of the defining formula). */
export const gaugeNumberForDiameterMm = (dMm) => 36 - (39 * Math.log(dMm / (0.005 * MM_PER_IN))) / Math.log(92);

/** Gauges commonly made as insulated building and equipment wire (THHN, XHHW, MTW): 18 to 4/0 without the odd sizes below 3. */
export const BUILDING_GAUGES = ['0000', '000', '00', '0', '1', '2', '3', '4', '6', '8', '10', '12', '14', '16', '18'];

/** Smallest wire (highest gauge number) of the list whose area is at least the given mm²; null when 4/0 is not enough. */
export function smallestAwgForArea(areaMm2, gauges = AWG_GAUGES) {
  for (let i = gauges.length - 1; i >= 0; i -= 1) if (awgAreaMm2(gauges[i]) >= areaMm2 * (1 - 1e-12)) return gauges[i];
  return null;
}

/** IEC 60228 nominal cross-sections, mm². */
export const IEC_SIZES_MM2 = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000];

/** Smallest IEC size at least the given mm²; null above 1000 mm². */
export const smallestIecSize = (areaMm2) => IEC_SIZES_MM2.find((s) => s >= areaMm2 * (1 - 1e-12)) ?? null;

/** Resistivity at 20 °C (Ω·m) and temperature coefficient (1/K): IEC 60028 annealed copper, IEC 60889 aluminium 1350. */
export const CONDUCTORS = {
  copper: { label: 'Copper', rho20: 1.7241e-8, alpha: 0.00393 },
  aluminium: { label: 'Aluminium', rho20: 2.8264e-8, alpha: 0.00403 },
};

export const conductorOptions = () => Object.entries(CONDUCTORS).map(([value, c]) => ({ value, label: c.label }));

/** ASTM B8 standard increment of resistance for concentric-lay stranded conductors. */
export const STRANDING_FACTOR = 1.02;

/** Resistivity in Ω·m at a temperature in °C. */
export const resistivity = (material, tempC) => CONDUCTORS[material].rho20 * (1 + CONDUCTORS[material].alpha * (tempC - 20));

/** DC resistance per metre (Ω/m) of a conductor of the given area in mm². */
export const resistancePerMetre = (areaMm2, material, tempC, stranded = true) =>
  (resistivity(material, tempC) / (areaMm2 * 1e-6)) * (stranded ? STRANDING_FACTOR : 1);
