# Fuel blending and heating viscosity calculator

**Summary:** Blend viscosity (Refutas), density and sulphur of two fuels, and the injection or preheating temperature from ASTM D341.

## Introduction

Marine fuel is managed by viscosity. A residual fuel of 380 cSt at 50 °C must be heated to around 130 °C before the injectors see the 10–15 cSt they need; a transfer pump wants it below 1 000 cSt; and when a parcel is cut with distillate to meet a sulphur limit or a viscosity, the result does not follow a simple average. Two long-established methods handle this: the Refutas blending index, which turns viscosities into numbers that blend linearly by mass, and the ASTM D341 (Walther) equation, which draws the straight line of viscosity against temperature on the chart every engineer has seen in the fuel-oil module. This calculator applies both: blend viscosity, density and sulphur for a given mixing ratio, the ratio needed for a target viscosity or sulphur, and the temperatures for injection and pumping.

It is for chief engineers and fuel managers planning blends and heating, superintendents checking bunker certificates, and students of marine fuel systems.

## Formulas

Refutas blending (all viscosities at the same temperature, fractions by mass):

    VBI_i = 14.534 ln(ln(ν_i + 0.8)) + 10.975
    VBI_blend = w_A VBI_A + w_B VBI_B
    ν_blend = exp(exp((VBI_blend − 10.975)/14.534)) − 0.8
    fraction for a target: w_A = (VBI_target − VBI_B) / (VBI_A − VBI_B)

Ideal mixing:

    1/ρ_blend = w_A/ρ_A + w_B/ρ_B        S_blend = w_A S_A + w_B S_B        volume fraction of A = (w_A/ρ_A) ρ_blend

Viscosity–temperature (ASTM D341, Walther, T in kelvin):

    log10 log10(ν + 0.7) = A − B log10 T
    A and B from two known points; T(ν_target) = 10^((A − log10 log10(ν_target + 0.7))/B)

Typical targets: injection 10–15 cSt (engine makers 12–14), transfer pumping ≤ 1 000 cSt, separator inlet ≈ 98 °C for residual fuels.

## Assumptions and limitations

- Refutas is accurate to a few per cent for miscible petroleum fuels; it says nothing about stability or compatibility. A paraffinic distillate added to an aromatic residual fuel can precipitate asphaltenes: run a spot test (ASTM D4740) or TSP before blending on board.
- Density and sulphur blend ideally; water, ash, CCAI, pour point and calorific value are not blended here.
- The Walther line needs two reliable points. With only the ISO 8217 value (50 °C for residual grades), the default second point (35 cSt at 100 °C, typical of a 380 cSt fuel) gives heating temperatures within about ±5 °C; enter the certificate value when you have it.
- The blend's heating uses the slope of fuel A through the blend viscosity; the true slope lies between the components.
- Heater outlet temperatures above about 150 °C are impractical; distillates are limited by minimum viscosity at the injection pump (about 2 cSt), not by heating.

## Worked example

Fuel A: VLSFO, 380 cSt at 50 °C, 991 kg/m³, 0.50 % S (35 cSt at 100 °C from the certificate). Fuel B: MGO, 2.5 cSt at 50 °C, 860 kg/m³, 0.10 % S.

1. Indices: VBI_A = 14.534 ln(ln 380.8) + 10.975 = 36.88; VBI_B = 14.534 ln(ln 3.3) + 10.975 = 13.55.
2. 80/20 by mass: VBI = 0.8 × 36.88 + 0.2 × 13.55 = 32.21 → ν = 73.7 cSt at 50 °C. The viscosity collapses with a fifth of distillate. Density 1/(0.8/991 + 0.2/860) = 962 kg/m³; sulphur 0.42 %; MGO is 22.4 % by volume.
3. To reach 180 cSt instead, w_A = (34.93 − 13.55)/(36.88 − 13.55) = 0.917: only 8.3 % MGO by mass.
4. Heating fuel A: Walther B = 3.53, A = 9.27. For 13 cSt at the engine: T = 10^((9.27 − log log 13.7)/3.53) = 407 K = 134 °C; 15 cSt at 128 °C, 12 cSt at 138 °C. Transfer pumping below 1 000 cSt needs about 37 °C.
5. The 80/20 blend, heated with the same slope from 73.7 cSt at 50 °C, reaches 13 cSt at about 100 °C.

## FAQ

**Why not average the viscosities?**
Viscosity blends on a double-logarithmic scale: a little distillate thins a residual fuel far more than its proportion suggests. The Refutas index linearises that.

**Mass or volume fractions?**
Refutas blends by mass; bunker quantities are in tonnes. The calculator reports the volume fraction too because tanks are gauged in cubic metres.

**Can I blend any two fuels?**
Only if they are compatible. Residual fuels with high asphaltene content are the risk when cut with paraffinic distillates; test before blending, and avoid blending across ISO 8217 categories without a compatibility test.

**What injection viscosity should I use?**
The engine maker's figure, usually 10–15 cSt (12–14 cSt common). Too thick gives poor atomisation and deposits; too thin loses lubricity and leaks past the pump plungers.

**Where does the second viscosity point come from?**
The bunker delivery note gives viscosity at 50 °C (residual) or 40 °C (distillate); a laboratory analysis often adds 100 °C. Without it the default typical slope applies, with a warning.

**Does sulphur blending work for compliance?**
Arithmetically yes, but the result must be verified by analysis of the blended sample; small dosing errors and tank residues shift the result, and the 0.50 % and 0.10 % limits leave little margin.

**What about blending to reduce density for a purifier?**
Density blends ideally here; keep the blend below the gravity-disc limit of the separator (usually 991 or 1 010 kg/m³ at 15 °C).

## Related calculators

- [Bunker quantity and density correction](../bunker-quantity/index.html) — the tonnes and temperatures of the parcels being blended.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — how much of the blend is burned.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — the regulatory cost of the fuel chosen.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — transfer-line losses at the pumping viscosity.
