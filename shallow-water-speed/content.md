# Shallow water correction (Raven / Lackenby) calculator

**Summary:** ISO 15016:2025 Annex G (Raven) shallow-water power correction — viscous increase and sinkage — plus the legacy Lackenby speed correction.

## Introduction

A ship in shallow water sinks deeper, pushes its return flow through a smaller cross-section and feels more friction, so a speed trial run in 30 m of water needs more power than the same run in the open ocean. ISO 15016:2025 replaced the old Lackenby speed correction by Raven's method, which splits the effect into a viscous resistance increase that scales with (T/h)^1.79 and a sinkage term treated as extra displacement. This calculator checks the run against the minimum trial depth, evaluates every step of Annex G from the depth Froude numbers to the deep-water power, and shows the Lackenby result beside it for anyone still working to the 2015 edition.

It is for trial engineers, naval architects verifying a sea-trial report, performance analysts correcting service data in coastal waters, and students of ship hydrodynamics.

## Formulas

    h_min = max(2.5 T_M, 2.4 V_S²/g)                                     Formula (7)
    Fr_h = V_S/√(g h),   Fr_hd = V_S/√(0.3 g L_PP)                        G.13
    d = 1.46 ∇/L_PP² [Fr_h²/√(1−Fr_h²) − Fr_hd²/√(1−Fr_hd²)] ≥ 0        G.12
    δ = d A_W/∇ (≤ 0.05),   r_sink = (1 + δ)^(2/3)                        G.10–G.11
    (1+k) = 1.017 + 20 C_B (B/L_PP)² (T_M/B)^0.5                           G.9
    C_V' = 1.06 C_F (1+k) + ΔC_F,   R_Vdeep = C_V' ½ρV_S²S                 G.4–G.8
    R_SHV = R_Vdeep × 0.57 (T_M/h)^1.79                                    G.3
    P_Ddeep = (P_Dmsc − R_SHV V_S/η_Did)/r_sink,   P_SH = P_Dmsc − P_Ddeep  G.1–G.2
    Lackenby: ΔV/V = 0.1242 (A_M/h² − 0.05) + 1 − √tanh(g h/V²),  V_deep = V (1 + ΔV/V)

## Assumptions and limitations

- The trial power must already be corrected for wind, waves and water temperature; the propulsive efficiency is assumed unchanged in shallow water.
- Valid above the minimum trial depth and for sub-critical depth Froude numbers; the sinkage term vanishes at and beyond 0.3 L_PP depth by construction.
- Displacement and waterplane area from the block and waterplane coefficients unless hydrostatics are entered.
- Lackenby applies for A_M/h² ≥ 0.05 and is a speed correction, not a power one.

## Worked example

A 180 × 32 × 11 m bulk carrier (C_B 0.80, C_WP 0.88, S 7 000 m²) running 12 kn in 30 m of 15 °C water, 5 000 kW delivered, η_Did 0.70.

1. Minimum depth max(27.5, 9.3) = 27.5 m: the run is acceptable.
2. Fr_h = 0.360, Fr_hd = 0.268 → d = 1.46 × 50 688/180² × (0.1388 − 0.0747) = 0.146 m; δ = 0.0146; r_sink = 1.0097.
3. Re 9.35 × 10⁸, C_F 1.543 × 10⁻³, ΔC_F 0.89 × 10⁻⁴, (1+k) 1.313 → C_V' 2.238 × 10⁻³, R_Vdeep 306 kN.
4. R_SHV = 306 × 0.57 × (11/30)^1.79 = 29.0 kN → P_Ddeep = (5 000 − 29.0 × 6.17/0.70)/1.0097 = 4 699 kW; P_SH = 301 kW, 6.0 % of the trial power.
5. Lackenby: A_M/h² = 0.383 → ΔV/V = 4.1 %, deep-water speed 12.50 kn at the same power.

Six per cent of power is roughly two per cent of speed by the cubic law, so the two methods differ by a factor of two in the speed they imply: Raven's method was calibrated on modern CFD and full-scale data and is the normative one.

## FAQ

**Why was Lackenby replaced?**
It was derived from 1960s model data for a limited hull range and applies one speed correction regardless of hull form; Raven's method separates the physical causes and uses the actual ship coefficients.

**Why 0.3 L_PP as the reference depth?**
Raven defines "deep water" for sinkage as h = 0.3 L_PP; the additional sinkage is measured relative to that depth, which is why the term is zero when the water is that deep.

**What does the exponent 1.79 mean?**
The viscous resistance increase rises steeply as the gap under the keel closes; at h = 2 T the increase is 17 % of the deep-water viscous resistance, at h = 1.5 T 28 %.

**Is this the same as squat?**
The sinkage term is squat, but handled as extra displacement; the ship-squat calculator gives the under-keel clearance consequences instead.

**Can I use it for service data in coastal waters?**
In principle, with the same caveats: the power must be corrected for weather first, and the depth along the track must be known.

**What if the depth Froude number is near 1?**
The formula diverges at the critical speed; trials must not be run there and the page refuses supercritical cases.

## Related calculators

- [Ship squat](../ship-squat/index.html) — under-keel clearance in shallow water.
- [Added resistance in waves (STAwave-1)](../stawave-added-resistance/index.html) — the wave correction applied before this one.
- [Water temperature and density correction](../water-temperature-correction/index.html) — ISO 15016 Annex E.
- [Hull roughness and fouling penalty](../hull-roughness-penalty/index.html) — the roughness allowance used here.
- [Holtrop–Mennen resistance](../holtrop-mennen/index.html) — deep-water resistance estimate.
