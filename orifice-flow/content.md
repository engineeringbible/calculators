# Orifice and venturi flow (ISO 5167) calculator

**Summary:** Flow from differential pressure for orifice plates and venturis with the Reader-Harris/Gallagher discharge coefficient and expansibility.

## Introduction

A plate with a hole, two pressure tappings and a transmitter is still the most common flowmeter in industry, and ISO 5167 is the rulebook that makes it a measurement rather than an indication. The flow follows from the differential pressure through a discharge coefficient that depends on the diameter ratio, the tapping arrangement and the Reynolds number (the Reader-Harris/Gallagher equation), with an expansibility factor for gases. Because the Reynolds number depends on the flow being sought, the calculation iterates. This calculator does that for the three standard orifice tappings and for classical Venturi tubes, in both directions (flow from Δp, or Δp for a flow when ranging a transmitter), and reports the permanent pressure loss and whether the operating point is inside the standard's limits.

It is for instrument and process engineers, marine engineers checking fuel-oil or cooling-water flow elements, and students of flow measurement.

## Formulas

    β = d/D,   E = 1/√(1 − β⁴)
    q_m = C E ε (π/4) d² √(2 Δp ρ₁),   q_v = q_m/ρ₁,   Re_D = 4 q_m/(π D μ)

Orifice discharge coefficient (ISO 5167-2 eq. 4, Reader-Harris/Gallagher):

    C = 0.5961 + 0.0261 β² − 0.216 β⁸ + 0.000521 (10⁶ β/Re_D)^0.7 + (0.0188 + 0.0063 A) β^3.5 (10⁶/Re_D)^0.3
        + (0.043 + 0.080 e^(−10 L₁) − 0.123 e^(−7 L₁)) (1 − 0.11 A) β⁴/(1 − β⁴) − 0.031 (M′₂ − 0.8 M′₂^1.1) β^1.3
        [+ 0.011 (0.75 − β)(2.8 − D/25.4)  for D < 71.12 mm]
    A = (19 000 β/Re_D)^0.8,  M′₂ = 2 L′₂/(1 − β);  corner taps L₁ = L′₂ = 0; D–D/2 taps L₁ = 1, L′₂ = 0.47; flange taps L₁ = L′₂ = 25.4/D(mm)

Venturi (ISO 5167-4): C = 0.995 machined, 0.984 as-cast, 0.985 rough-welded.

Expansibility (gases): orifice ε = 1 − (0.351 + 0.256 β⁴ + 0.93 β⁸)[1 − (p₂/p₁)^(1/κ)]; Venturi: isentropic expression of ISO 5167-4 eq. 3. Liquids ε = 1.

Permanent pressure loss (orifice): Δϖ = [√(1 − β⁴(1 − C²)) − C β²]/[√(1 − β⁴(1 − C²)) + C β²] Δp; Venturi about 10 % of Δp.

## Assumptions and limitations

- Steady single-phase flow, pipe running full, geometry and straight lengths per the standard. Limits (orifice): d ≥ 12.5 mm, 50 ≤ D ≤ 1 000 mm, 0.10 ≤ β ≤ 0.75, Re_D ≥ 5 000 (plus tapping-specific limits); Venturi limits by type. The page reports when a point is outside.
- Uncertainty of C: 0.5–0.75 % for orifice plates, 1–1.5 % for Venturis, before the Δp, density and diameter uncertainties.
- Gas density and volume flow refer to upstream conditions; the expansibility formula needs p₂/p₁ ≥ 0.75.
- Nozzles (ISO 5167-3), wet gas, pulsating flow and drain holes are not covered.

## Worked example

A 4-inch schedule 40 water line (D = 102.26 mm) with a β = 0.5 orifice plate (d = 51.13 mm), flange taps, water at 20 °C (998.2 kg/m³, 1.002 mPa·s), transmitter reading 250 mbar.

1. β = 0.5, E = 1/√(1 − 0.0625) = 1.033.
2. Start with C = 0.6: q_m = 0.6 × 1.033 × 1 × 0.002053 × √(2 × 25 000 × 998.2) = 8.99 kg/s → Re_D = 4 × 8.99/(π × 0.10226 × 0.001002) = 111 700. Recompute C from the equation (flange taps, L₁ = L′₂ = 0.248): C = 0.6059. One more pass converges.
3. Result: q_m = 9.08 kg/s = 32.7 m³/h, pipe velocity 1.11 m/s, throat velocity 4.43 m/s. Permanent loss 0.737 × 250 = 184 mbar.
4. Ranging check: for 32.7 m³/h the Δp mode returns 250 mbar; at half flow the Δp is a quarter (62.5 mbar).
5. For air at 5 bar absolute (6 kg/m³, κ 1.4) with 500 mbar Δp: p₂/p₁ = 0.9, ε = 0.973, so the flow is 2.7 % less than the incompressible value.

## FAQ

**Why does the coefficient depend on the Reynolds number?**
At lower Reynolds numbers the velocity profile and the contraction at the plate change; the RHG equation captures this with the (10⁶/Re_D) terms, which is why the standard's tables (or this page) iterate.

**Which tapping should I choose?**
Flange taps are the North American standard for pipes above 50 mm; corner taps are common in Europe and for small pipes; D and D/2 taps are the "radius" taps. They differ by a fraction of a per cent in C; what matters is using the one actually installed.

**Orifice or Venturi?**
Orifice plates are cheap and short but lose most of the differential pressure permanently (74 % at β = 0.5); Venturis recover 80–95 % of it and tolerate dirty fluids, at ten times the cost and length.

**What is expansibility?**
The correction for the gas expanding as it accelerates through the bore; it is 1 for liquids and falls as Δp/p₁ grows, and the standard restricts the formula to p₂/p₁ ≥ 0.75.

**How accurate is the measurement?**
With the standard's geometry and straight lengths, about 1–2 % of flow for an orifice after combining C, Δp (transmitter), density and diameter uncertainties; worse at low Δp (square-root compression).

**Can I use this for steam?**
Yes, as a gas with the steam density at the upstream pressure and temperature and κ ≈ 1.3 (saturated 1.135); keep the wet steam out of the standard.

**My point is flagged outside ISO 5167. Is the result wrong?**
Not necessarily, but the equation is extrapolated and the standard's uncertainty statement no longer applies; calibration would be needed.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — line losses upstream and downstream of the element.
- [Pump NPSH and suction lift](../pump-npsh/index.html) — flow and loss for the suction side.
- [Tank volume and partial fill](../tank-volume/index.html) — reconciling flow totals with tank soundings.
- [Engineering unit converter](../unit-converter/index.html) — inches of water, psi and gpm.
