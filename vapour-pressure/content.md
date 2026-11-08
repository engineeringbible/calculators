# Vapour pressure calculator (Antoine equation)

**Summary:** Vapour pressure at a temperature, or boiling point at a pressure, of water, alcohols, acetone, aromatics, alkanes, ammonia and more by the Antoine equation.

## Introduction

Vapour pressure is the pressure at which a liquid and its vapour are in balance at a given temperature. It rises steeply as the liquid warms, and the liquid boils when its vapour pressure reaches the surrounding pressure. The Antoine equation, log10 P = A − B / (T + C), describes this rise with three constants per liquid. With the NIST constants, ethanol has a vapour pressure of 29.5 kPa at 50 °C and boils at 78.3 °C at sea level.

This calculator gives the vapour pressure of a pure liquid at a temperature, or its boiling point at a pressure, for 14 common fluids. It uses the published constants only inside their temperature range and shows which set it used. For water it also shows the IAPWS-IF97 value for comparison. It is for process engineers, chemists and students checking evaporation, distillation, pump suction and storage conditions.

## Formulas

Antoine equation, with the NIST convention of P in bar and T in kelvin:

    log10(P / bar) = A − B / (T / K + C)

Boiling point at a pressure, from the same constants:

    T = B / (A − log10 P) − C

- P — vapour pressure, bar (1 bar = 100 kPa = 14.504 psi)
- T — temperature, K (°C + 273.15)
- A, B, C — Antoine constants of the liquid, valid over a stated temperature range

Water above 100 °C uses the Dortmund Data Bank constants A = 8.14019, B = 1810.94, C = 244.485 for P in mmHg and T in °C. The calculator converts them to bar and kelvin.

## Assumptions and limitations

- Antoine constants are fits to measurements. Each set is valid only over its stated temperature range, so the calculator refuses temperatures and pressures outside it.
- Most fluids agree with the NIST reference equations of state within 0.3 %. Water above 100 °C is within 1.3 % of IAPWS-IF97, n-butane within 2.6 %, propane within 3 % and ammonia within 5 %.
- Where a fluid has two or three ranges, the curve can step by up to 3 % where they meet.
- The liquid must be pure. Mixtures need Raoult's law with activity coefficients, and dissolved salts lower the vapour pressure.

## Worked example

What is the vapour pressure of ethanol at 50 °C?

1. Temperature: 50 + 273.15 = 323.15 K, inside the NIST range of 292.77 to 366.63 K.
2. Constants for that range: A = 5.24677, B = 1598.673, C = −46.424.
3. log10 P = 5.24677 − 1598.673 / (323.15 − 46.424) = −0.5303.
4. P = 10^−0.5303 = 0.2949 bar = 29.49 kPa.

The same constants put the normal boiling point at 351.45 K, against the measured 351.44 K.

## FAQ

**What is the Antoine equation?**
An empirical relation between the vapour pressure and temperature of a pure liquid: log10 P = A − B / (T + C). It fits measured data closely, but only over the temperature range its constants were fitted to.

**What is the vapour pressure of water at 25 °C?**
3.17 kPa, or 23.8 mmHg. At 100 °C it reaches 101.3 kPa, which is why water boils at that temperature at sea level.

**How do I find the boiling point at a lower pressure?**
Solve the Antoine equation for T at that pressure. Water at 70 kPa, about 3 000 m above sea level, boils at about 90 °C.

**Why do Antoine constants come in different units?**
Older tables give P in mmHg and T in °C, while NIST uses bar and kelvin. Mixing them gives nonsense, so always check the units with the constants.

**Can I use the Antoine equation outside its range?**
Not safely. The error grows quickly beyond the fitted range, especially towards the critical point. Use another set of constants or a reference equation of state.

**Why does vapour pressure matter for pumps?**
A pump cavitates when the suction pressure falls to the liquid's vapour pressure. The NPSH available is the margin above it.

## Related calculators

- [Steam table](../steam-table/index.html) — exact saturation properties of water by IAPWS-IF97.
- [Gas compressibility factor Z](../gas-compressibility/index.html) — real-gas behaviour of the vapour.
- [Pump NPSH](../pump-npsh/index.html) — cavitation margin over the vapour pressure.
- [PPM concentration converter](../ppm-concentration/index.html) — vapour concentrations in ppmv and mg/m³.
