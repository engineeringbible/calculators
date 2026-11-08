# Hull roughness and fouling penalty calculator

**Summary:** Added resistance, power, fuel and speed loss from hull roughness or fouling via the ITTC-57 line and the ISO 15016 roughness allowance.

## Introduction

A hull that has grown slime, weed or barnacles drags more water with it. The classic way to put a number on that is the roughness allowance: an addition to the frictional resistance coefficient that depends on the equivalent sand roughness of the surface and on the ship's Reynolds number. This calculator takes the ship's length, wetted surface and speed, the water temperature, the roughness of the clean hull and the present condition, and returns the added resistance, the power needed to hold the speed, the speed lost at constant power, and the fuel, money and CO₂ it costs over a year. The condition presets are the Schultz (2007) equivalents, from a fresh coating at 150 µm to heavy calcareous fouling at 10 mm.

It is for performance engineers, superintendents deciding on a hull cleaning, and naval architecture students; the companion hull-cleaning-interval calculator turns the penalty rate into an optimal cleaning schedule.

## Formulas

    Re = V L_PP / ν,   C_F = 0.075 / (log₁₀ Re − 2)²                       ITTC-57
    ΔC_F = 0.044 [(k_s/L)^(1/3) − 10 Re^(−1/3)] + 0.000125   (min 0)       ISO 15016:2025 E.7 / G.8
    ΔC_F = [105 (k_s/L)^(1/3) − 0.64] × 10⁻³                 (min 0)       1978 ITTC form
    R_V,clean = (1 + k) C_F ½ρSV²,   ΔR = ½ρSV² [ΔC_F(k_s,present) − ΔC_F(k_s,clean)]
    R_T = P_D η_D / V   (or R_V,clean / viscous share),   ΔP/P = ΔR / R_T
    ΔV/V = 1 − (1 + ΔP/P)^(−1/3),   fuel = ΔP × SFOC × 24 h

Schultz (2007) equivalent roughness: as-applied coating 150 µm, deteriorated coating or light slime 300, heavy slime 600, small calcareous fouling or weed 1 000, medium calcareous 3 000, heavy calcareous 10 000 µm.

## Assumptions and limitations

- Roughness changes only the frictional resistance; the form factor applies to the smooth friction, not to ΔC_F (ITTC-78 / ISO 15016).
- Propulsive efficiency is held constant, so the real power penalty is 5–10 % larger than computed; propeller fouling is separate.
- The equivalent sand roughness of fouling is an approximation (±30 %); a roughness survey (Rt50) should replace the presets when available.
- Water properties from the ITTC 35 g/kg table, held at the ends outside 0–35 °C.

## Worked example

A 180 m tanker, wetted surface 5 500 m², 12.6 kn in 15 °C sea water, form factor 1.20, 3 200 kW delivered with η_D 0.68, SFOC 175 g/kWh, fuel 550 per tonne, 250 days at sea. Clean hull 150 µm, present condition heavy slime (600 µm).

1. V = 12.6 × 1852/3600 = 6.482 m/s; Re = 6.482 × 180/1.1883e-6 = 9.82 × 10⁸, C_F = 1.534 × 10⁻³.
2. ΔC_F: 0.964 × 10⁻⁴ clean, 3.396 × 10⁻⁴ heavy slime, increase 2.432 × 10⁻⁴.
3. ½ρSV² = 118.5 MN → ΔR = 28.8 kN; clean viscous resistance 218 kN; total resistance from the power 336 kN.
4. ΔP/P = 28.8/335.7 = 8.59 %, 275 kW more; speed loss at constant power 2.7 %.
5. Fuel 1.15 t/day, 289 t/year, about 159 000 per year and 899 t CO₂.

With the 1978 ITTC form the clean allowance is 3.48 × 10⁻⁴ and heavy slime 9.29 × 10⁻⁴; the increase (5.80 × 10⁻⁴) is more than twice what the ISO form gives, because the older formula has no Reynolds term and was calibrated on rougher hulls.

## FAQ

**Why compare against 150 µm and not against zero?**
A newly coated hull is already rough; 150 µm is the ISO 15016 default when no survey exists, so the penalty is the increase over the as-docked condition the sea trial or baseline represents.

**Where do the condition values come from?**
Schultz (2007) assigned equivalent sand roughness heights to coating and fouling states and predicted the resulting frictional resistance of a frigate; they are widely used as order-of-magnitude presets.

**Why is the speed loss roughly a third of the power increase?**
Power rises with roughly the cube of speed, so at constant power a 9 % resistance increase costs about 3 % of speed.

**Should I use the power or the share mode?**
Use the delivered power at the speed if you have it (trials, baseline curve); the viscous-share mode is for a quick estimate when only the hull dimensions are known.

**Does this include the propeller?**
No. Propeller roughness and fouling typically add 2–6 % of power on top of the hull figures.

**Can the penalty be negative?**
Only if the present roughness entered is smaller than the clean reference, which the page flags; after a fresh coating the reference itself should be updated.

**How does this relate to ISO 19030?**
ISO 19030 measures the speed loss from service data; this page predicts what a given fouling state should produce, useful for sanity-checking the measured trend.

## Related calculators

- [Optimal hull cleaning interval](../hull-cleaning-interval/index.html) — turns the penalty growth into a cleaning schedule.
- [Holtrop–Mennen resistance](../holtrop-mennen/index.html) — total resistance and power of the clean hull.
- [Admiralty coefficient](../admiralty-coefficient/index.html) — speed-power scaling.
- [Water temperature and density correction](../water-temperature-correction/index.html) — the other ISO 15016 friction-based correction.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — the voyage-level consequence.
