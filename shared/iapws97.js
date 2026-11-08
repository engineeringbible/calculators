/**
 * shared/iapws97.js — properties of water and steam by IAPWS-IF97 (Revised Release R7-97(2012)): region 1 (compressed
 * liquid), region 2 (superheated vapour), region 4 (saturation line) and the B23 boundary. Region 3 (near the critical
 * point, above 623.15 K and the B23 pressure) and region 5 (above 1 073.15 K) are not included. DOM-free.
 *
 * Units here: T in K, p in MPa, v in m³/kg, h, u in kJ/kg, s, cp in kJ/(kg·K), w in m/s.
 */

const R = 0.461526; // kJ/(kg·K), specific gas constant of water in IF97

/** Table 2: region 1, [I, J, n]. */
const R1 = [
  [0, -2, 0.14632971213167], [0, -1, -0.84548187169114], [0, 0, -0.37563603672040e1], [0, 1, 0.33855169168385e1],
  [0, 2, -0.95791963387872], [0, 3, 0.15772038513228], [0, 4, -0.16616417199501e-1], [0, 5, 0.81214629983568e-3],
  [1, -9, 0.28319080123804e-3], [1, -7, -0.60706301565874e-3], [1, -1, -0.18990068218419e-1], [1, 0, -0.32529748770505e-1],
  [1, 1, -0.21841717175414e-1], [1, 3, -0.52838357969930e-4], [2, -3, -0.47184321073267e-3], [2, 0, -0.30001780793026e-3],
  [2, 1, 0.47661393906987e-4], [2, 3, -0.44141845330846e-5], [2, 17, -0.72694996297594e-15], [3, -4, -0.31679644845054e-4],
  [3, 0, -0.28270797985312e-5], [3, 6, -0.85205128120103e-9], [4, -5, -0.22425281908000e-5], [4, -2, -0.65171222895601e-6],
  [4, 10, -0.14341729937924e-12], [5, -8, -0.40516996860117e-6], [8, -11, -0.12734301741641e-8], [8, -6, -0.17424871230634e-9],
  [21, -29, -0.68762131295531e-18], [23, -31, 0.14478307828521e-19], [29, -38, 0.26335781662795e-22], [30, -39, -0.11947622640071e-22],
  [31, -40, 0.18228094581404e-23], [32, -41, -0.93537087292458e-25],
];

/** Table 10: region 2 ideal-gas part, [J°, n°]. */
const R2_0 = [
  [0, -0.96927686500217e1], [1, 0.10086655968018e2], [-5, -0.56087911283020e-2], [-4, 0.71452738081455e-1], [-3, -0.40710498223928],
  [-2, 0.14240819171444e1], [-1, -0.43839511319450e1], [2, -0.28408632460772], [3, 0.21268463753307e-1],
];

/** Table 11: region 2 residual part, [I, J, n]. */
const R2_R = [
  [1, 0, -0.17731742473213e-2], [1, 1, -0.17834862292358e-1], [1, 2, -0.45996013696365e-1], [1, 3, -0.57581259083432e-1],
  [1, 6, -0.50325278727930e-1], [2, 1, -0.33032641670203e-4], [2, 2, -0.18948987516315e-3], [2, 4, -0.39392777243355e-2],
  [2, 7, -0.43797295650573e-1], [2, 36, -0.26674547914087e-4], [3, 0, 0.20481737692309e-7], [3, 1, 0.43870667284435e-6],
  [3, 3, -0.32277677238570e-4], [3, 6, -0.15033924542148e-2], [3, 35, -0.40668253562649e-1], [4, 1, -0.78847309559367e-9],
  [4, 2, 0.12790717852285e-7], [4, 3, 0.48225372718507e-6], [5, 7, 0.22922076337661e-5], [6, 3, -0.16714766451061e-10],
  [6, 16, -0.21171472321355e-2], [6, 35, -0.23895741934104e2], [7, 0, -0.59059564324270e-17], [7, 11, -0.12621808899101e-5],
  [7, 25, -0.38946842435739e-1], [8, 8, 0.11256211360459e-10], [8, 36, -0.82311340897998e1], [9, 13, 0.19809712802088e-7],
  [10, 4, 0.10406965210174e-18], [10, 10, -0.10234747095929e-12], [10, 14, -0.10018179379511e-8], [16, 29, -0.80882908646985e-10],
  [16, 50, 0.10693031879409], [18, 57, -0.33662250574171], [20, 20, 0.89185845355421e-24], [20, 35, 0.30629316876232e-12],
  [20, 48, -0.42002467698208e-5], [21, 21, -0.59056029685639e-25], [22, 53, 0.37826947613457e-5], [23, 39, -0.12768608934681e-14],
  [24, 26, 0.73087610595061e-28], [24, 40, 0.55414715350778e-16], [24, 58, -0.94369707241210e-6],
];

/** Table 34: region 4. */
const N4 = [0, 0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7,
  0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];

/** Table 1: B23 boundary. */
const NB = [0, 0.34805185628969e3, -0.11671859879975e1, 0.10192970039326e-2, 0.57254459862746e3, 0.13918839778870e2];

export const T_CRIT = 647.096;
export const P_CRIT = 22.064;

/** Saturation pressure (MPa) at T (K), eq. 30; 273.15–647.096 K. */
export function psat(T) {
  const th = T + N4[9] / (T - N4[10]);
  const A = th * th + N4[1] * th + N4[2];
  const B = N4[3] * th * th + N4[4] * th + N4[5];
  const C = N4[6] * th * th + N4[7] * th + N4[8];
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4;
}

/** Saturation temperature (K) at p (MPa), eq. 31; 611.213 Pa–22.064 MPa. */
export function tsat(p) {
  const b = p ** 0.25;
  const E = b * b + N4[3] * b + N4[6];
  const F = N4[1] * b * b + N4[4] * b + N4[7];
  const G = N4[2] * b * b + N4[5] * b + N4[8];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  return (N4[10] + D - Math.sqrt((N4[10] + D) ** 2 - 4 * (N4[9] + N4[10] * D))) / 2;
}

/** B23 boundary pressure (MPa) at T (K), eq. 5. */
export const pB23 = (T) => NB[1] + NB[2] * T + NB[3] * T * T;
/** B23 boundary temperature (K) at p (MPa), eq. 6. */
export const tB23 = (p) => NB[4] + Math.sqrt((p - NB[5]) / NB[3]);

/** Region 1 properties at p (MPa), T (K). */
export function region1(p, T) {
  const pi = p / 16.53; const tau = 1386 / T;
  const a = 7.1 - pi; const b = tau - 1.222;
  let g = 0; let gp = 0; let gpp = 0; let gt = 0; let gtt = 0; let gpt = 0;
  for (const [I, J, n] of R1) {
    g += n * a ** I * b ** J;
    gp += -n * I * a ** (I - 1) * b ** J;
    gpp += n * I * (I - 1) * a ** (I - 2) * b ** J;
    gt += n * a ** I * J * b ** (J - 1);
    gtt += n * a ** I * J * (J - 1) * b ** (J - 2);
    gpt += -n * I * a ** (I - 1) * J * b ** (J - 1);
  }
  const RT = R * T;
  return {
    v: (RT / p) * pi * gp / 1000,
    h: RT * tau * gt,
    u: RT * (tau * gt - pi * gp),
    s: R * (tau * gt - g),
    cp: -R * tau * tau * gtt,
    w: Math.sqrt(1000 * RT * gp * gp / ((gp - tau * gpt) ** 2 / (tau * tau * gtt) - gpp)),
  };
}

/** Region 2 properties at p (MPa), T (K). */
export function region2(p, T) {
  const pi = p; const tau = 540 / T;
  let g0 = Math.log(pi); let g0t = 0; let g0tt = 0;
  for (const [J, n] of R2_0) { g0 += n * tau ** J; g0t += n * J * tau ** (J - 1); g0tt += n * J * (J - 1) * tau ** (J - 2); }
  const b = tau - 0.5;
  let gr = 0; let grp = 0; let grpp = 0; let grt = 0; let grtt = 0; let grpt = 0;
  for (const [I, J, n] of R2_R) {
    gr += n * pi ** I * b ** J;
    grp += n * I * pi ** (I - 1) * b ** J;
    grpp += n * I * (I - 1) * pi ** (I - 2) * b ** J;
    grt += n * pi ** I * J * b ** (J - 1);
    grtt += n * pi ** I * J * (J - 1) * b ** (J - 2);
    grpt += n * I * pi ** (I - 1) * J * b ** (J - 1);
  }
  const g0p = 1 / pi;
  const RT = R * T;
  const w2 = (1 + 2 * pi * grp + pi * pi * grp * grp) / ((1 - pi * pi * grpp) + (1 + pi * grp - tau * pi * grpt) ** 2 / (tau * tau * (g0tt + grtt)));
  return {
    v: (RT / p) * pi * (g0p + grp) / 1000,
    h: RT * tau * (g0t + grt),
    u: RT * (tau * (g0t + grt) - pi * (g0p + grp)),
    s: R * (tau * (g0t + grt) - (g0 + gr)),
    cp: -R * tau * tau * (g0tt + grtt),
    w: Math.sqrt(1000 * RT * w2),
  };
}

/** Region of a single-phase state; 1, 2 or 3 (3 = near-critical, not covered); throws outside 273.15–1 073.15 K, 0–100 MPa. */
export function regionOf(p, T) {
  if (!(T >= 273.15 && T <= 1073.15)) throw new Error('Temperature: IAPWS-IF97 regions 1 and 2 cover 0 to 800 °C.');
  if (!(p > 0 && p <= 100)) throw new Error('Pressure: IAPWS-IF97 regions 1 and 2 cover pressures up to 100 MPa.');
  if (T <= 623.15) return p >= psat(T) ? 1 : 2;
  if (T <= 863.15 && p > pB23(T)) return 3;
  return 2;
}

/** Saturated liquid and vapour at temperature T (K), 273.15–623.15 K. */
export function saturationAtT(T) {
  if (!(T >= 273.15 && T <= 623.15)) throw new Error('Temperature: saturation properties are covered from 0 to 350 °C (above that the near-critical region 3 applies).');
  const p = psat(T);
  return { T, p, liquid: region1(p, T), vapour: region2(p, T) };
}
