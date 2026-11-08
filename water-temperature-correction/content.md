# Water temperature and density correction calculator

**Summary:** ISO 15016 Annex E resistance and power correction for sea water temperature and density against the 15 °C / 1026 kg/m³ reference.

## Introduction

Warm tropical water is lighter and less viscous than the 15 °C sea water that tank tests and performance baselines assume, so a ship measured in it looks slightly better than it is; cold water does the opposite. ISO 15016 Annex E removes the effect with two terms: the whole resistance scales with density, and the frictional part changes with the Reynolds number through viscosity. This calculator evaluates both at the actual and the reference condition, reports the resistance increase R_AS, its share of the total resistance, the power equivalent and, because the sign confuses everyone, says in words whether to add or subtract.

It is for trial engineers and performance analysts correcting speed-power data, for anyone comparing voyages in different climates, and for students of ship resistance.

## Formulas

    R_AS = R_Tref (ρ_act/ρ_ref − 1) − R_Fact [(C_Fref + ΔC_Fref)/(C_Fact + ΔC_Fact) − 1]     E.1
    R_Fact = ½ ρ_act S V_S² (C_Fact + ΔC_Fact)                                                E.2
    R_Tref = P_ref η_D / V_S                                                                   E.4
    C_F = 0.075/(log₁₀ Re − 2)²,  Re = V_S L_PP/ν                                              E.5–E.6
    ΔC_F = 0.044 [(k_s/L_PP)^(1/3) − 10 Re^(−1/3)] + 0.000125  (min 0, k_s 150 µm default)    E.7
    ΔP_AS = R_AS V_S/η_D,   P_ref = P_measured − ΔP_AS

Reference: 15 °C, ρ_ref 1026.0 kg/m³, ν_ref 1.1883 × 10⁻⁶ m²/s. Water properties from the ITTC 35 g/kg table.

## Assumptions and limitations

- Propulsive efficiency unchanged by the small resistance change; correction applied on speed through water.
- The reference power should be the tank prediction (trials) or the baseline curve (service) at the same speed.
- ITTC table for density and viscosity (not the Annex E viscosity polynomial, 0.17 % apart, second order).
- Effect scale about ±1 % of power between 5 and 30 °C for typical merchant ships.

## Worked example

L_PP 180 m, wetted surface 5 500 m², 12.6 kn (6.5 m/s), tank-predicted 8 000 kW with η_D 0.70, trial in 25 °C water, hull roughness 150 µm.

1. R_Tref = 8 000 kW × 0.70/6.5 = 861.5 kN.
2. ρ_act 1023.2, ν_act 0.9425 × 10⁻⁶ → Re_act 1.24 × 10⁹ against Re_ref 0.98 × 10⁹; C_F + ΔC_F 1.620 × 10⁻³ actual, 1.630 × 10⁻³ reference.
3. Density term 861.5 × (1023.2/1026 − 1) = −2.35 kN; friction term −1.23 kN; R_AS = −3.58 kN, −0.42 % of the total.
4. ΔP_AS = −3.58 kN × 6.5/0.70 = −33 kW: the warm water favoured the ship, so the reference-condition power is 33 kW higher than measured.

At 5 °C the same ship gets +2.68 kN and +25 kW, i.e. the measured power is reduced to reach the reference.

## FAQ

**Why is R_AS negative in warm water?**
Less dense and less viscous water lowers the resistance below the reference, so the "increase" is negative; correcting means adding that resistance back.

**Why is the result not exactly zero at 15 °C?**
The ITTC table gives 1025.9 kg/m³ at 15 °C while ISO fixes the reference at 1026.0; the −0.01 % residual is harmless and documented.

**Does salinity matter?**
Brackish water (Baltic, river estuaries) lowers the density by up to 2–3 % and dominates the density term; enter the salinity or the measured density.

**Can I apply this to service data?**
Yes, with the baseline power as R_Tref and the sea surface temperature along the voyage; the effect is ±1 % and systematic by season and route.

**What is the roughness allowance doing here?**
It is part of the frictional coefficient at both conditions; it changes little with temperature but is included because the standard includes it.

**Which speed, through water or over ground?**
Through water: the water temperature acts on the hull's motion relative to the water (ISO clause 13).

## Related calculators

- [Hull roughness and fouling penalty](../hull-roughness-penalty/index.html) — the roughness allowance and friction line.
- [Shallow water correction](../shallow-water-speed/index.html) — ISO 15016 Annex G.
- [Added resistance in waves (STAwave-1)](../stawave-added-resistance/index.html) — the wave correction.
- [Hydrostatics](../hydrostatics/index.html) — displacement in water of another density.
- [Draft survey](../draft-survey/index.html) — density corrections of displacement.
