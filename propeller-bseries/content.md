# Wageningen B-series propeller calculator

**Summary:** Wageningen B-series KT, KQ and efficiency from the 1975 polynomials at a given J, or the optimum pitch ratio and rpm for a thrust and diameter; Keller check.

## Introduction

The Wageningen B-series is the standard reference propeller family: 120 models tested at the Netherlands Ship Model Basin between 1940 and 1970, with 2 to 7 blades, blade area ratios 0.30 to 1.05 and pitch ratios 0.5 to 1.4. In 1975 Oosterveld and van Oossanen fitted the open-water thrust and torque coefficients with polynomials in advance coefficient, pitch ratio, blade area ratio and blade number, and those polynomials are what every preliminary propeller design still starts from. This calculator evaluates them, applies the ITTC-1978 section-drag correction to full scale, and either reads the open-water point for a given pitch and rpm or finds the pitch ratio and rpm that maximise efficiency for a required thrust at a given diameter, with Keller's blade-area rule as a cavitation screen.

It is for naval architects matching a propeller to the hull resistance (from the Holtrop–Mennen calculator), engineers checking an existing propeller, and students.

## Formulas

Open-water coefficients (Rn = 2·10⁶):

    KT = Σ C_s,t,u,v J^s (P/D)^t (A_E/A_0)^u Z^v   (39 terms)
    KQ = Σ C_s,t,u,v J^s (P/D)^t (A_E/A_0)^u Z^v   (47 terms)
    J = V_A / (n D),   η_O = J KT / (2π KQ)
    T = KT ρ n² D⁴,   Q = KQ ρ n² D⁵,   P_D = 2π n Q,   P_T = T V_A

Full-scale correction (ITTC-1978, as in Holtrop & Mennen 1982):

    c_0.75 = 2.073 (A_E/A_0) D / Z,   t/c = (0.0185 − 0.00125 Z) D / c_0.75
    ΔC_D = (2 + 4 t/c) [0.003605 − (1.89 + 1.62 log10(c_0.75 / k_p))^−2.5],   k_p = 30 µm
    KT_ship = KT + 0.3 ΔC_D (P/D) c Z / D,   KQ_ship = KQ − 0.25 ΔC_D c Z / D

Design for a required thrust T at diameter D and speed of advance V_A:

    K = T / (ρ V_A² D²),   operating point: KT(J) = K J²   (solved for J at each P/D)
    choose the P/D with the highest η_O;   n = V_A / (J D)

Keller cavitation screen:

    A_E/A_0 ≥ K_keller + (1.3 + 0.3 Z) T / (D² (p_0 − p_v + ρ g h)),   p_0 − p_v = 99 047 Pa (15 °C sea water)

## Assumptions and limitations

- Validity of the polynomials: Z 2–7, A_E/A_0 0.30–1.05, P/D 0.5–1.4, J ≥ 0 (first quadrant only). Helma (2019) documents unphysical behaviour at high pitch ratios with few blades; the page warns there.
- Open-water values. Behind the hull use V_A = V(1 − w), the thrust T = R_T/(1 − t) and multiply by the relative-rotative efficiency, all available from the Holtrop–Mennen calculator.
- The ITTC-1978 correction is the only scale effect modelled; the 1975 paper's own Reynolds-number polynomials are not used.
- The diameter is not optimised: generally the largest diameter the aperture allows, with its own optimum rpm, is best.
- Keller's formula is a first screen only; a Burrill chart or a lifting-line calculation is needed for a real cavitation assessment.
- Standard B-series geometry (15° rake, series blade outline). Skewed or tip-unloaded modern propellers differ by a few per cent.

## Worked example

The Holtrop & Mennen example ship needs a thrust of 2 173 kN at a speed of advance of 9.54 m/s (25 knots, wake fraction 0.258) with an 8.0 m four-bladed propeller whose shaft centreline is 5.8 m below the surface.

1. Keller: 0.2 + (1.3 + 1.2) × 2 172 750 / (64 × (99 047 + 1025 × 9.81 × 5.8)) = 0.739. Take A_E/A_0 = 0.7393.
2. Full-scale correction: c_0.75 = 3.065 m, t/c = 0.0352, ΔC_D = 0.000956.
3. Thrust loading K = 2 172 750 / (1025 × 9.54² × 64) = 0.364. For each pitch ratio the operating J solves KT(J) = 0.364 J²; the efficiency peaks at P/D ≈ 1.0.
4. Result: J = 0.718, n = 1.659 rev/s = 99.6 rpm, KT = 0.188, KQ = 0.0333, η_O = 0.646, torque 2 795 kN·m, delivered power 29.1 MW. With the hull efficiency 1.113 and η_R 0.993 of the Holtrop calculator the shaft power is 32.6 MW.

In point mode the same propeller at 110 rpm and the same V_A gives J = 0.650, KT = 0.223 and a thrust of 3 150 kN with η_O = 0.62.

## FAQ

**Why do the model and full-scale KT and KQ differ?**
The full-scale blade sections have a lower drag coefficient (higher Reynolds number, relatively smoother surface), which raises thrust slightly and lowers torque; the ITTC-1978 method expresses this through ΔC_D.

**Can I use this for a controllable-pitch or skewed propeller?**
As a first estimate. CPP hubs and skew change KQ by a few per cent; the series polynomials do not know about them.

**Why is my optimum at P/D = 1.4?**
The thrust loading is light for the diameter: either the ship is fast and lightly loaded or the diameter is too large for the thrust. Consider a smaller diameter or higher rpm. At P/D = 0.5 the opposite applies.

**How many blades?**
More blades reduce pressure pulses and vibration at some efficiency cost; four or five is normal for merchant ships. Blade number affects KT and KQ directly in the polynomials.

**What is J?**
The advance coefficient V_A/(nD): the distance advanced per revolution in diameters. Zero thrust occurs near J ≈ P/D (less the hydrodynamic pitch effect).

**Is the Keller check enough?**
No. It gives the blade area at which back cavitation is unlikely for a conventional single-screw ship; it says nothing about tip-vortex, sheet or face cavitation under off-design conditions.

**Where do V_A and the thrust come from?**
From the hull: the Holtrop–Mennen calculator gives the resistance, wake fraction and thrust deduction; measured trial data are better still.

## Related calculators

- [Holtrop–Mennen resistance and power](../holtrop-mennen/index.html) — the thrust, speed of advance and η_R this propeller needs.
- [Propeller slip and speed through water](../propeller-slip/index.html) — operating point from the log and rpm.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — the shafting for the torque found here.
- [Admiralty coefficient and speed–power scaling](../admiralty-coefficient/index.html) — quick re-scaling of the power.
