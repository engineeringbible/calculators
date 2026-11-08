# Load combinations calculator (ASCE 7 LRFD/ASD and Eurocode)

**Summary:** Factored load combinations from dead, live, roof, snow, rain, wind and seismic loads by ASCE 7-16 LRFD or ASD, or EN 1990 6.10, with the governing case.

## Introduction

A structure must be designed for loads acting together, not one at a time. Codes set out load combinations: sums of the dead, live, snow, wind and seismic loads, each with its own factor. The largest result governs the design, and the smallest shows any uplift. A beam with a dead load of 10 kN, live 8, roof live 2, snow 5 and wind 6 needs 28.5 kN by ASCE 7-16 LRFD, from 1.2D + W + L + 0.5S.

This calculator evaluates every combination of ASCE 7-16 for strength design (LRFD) or allowable stress design (ASD), or of EN 1990 with expression 6.10 or 6.10a and 6.10b. It expands the "or" choices, takes wind and seismic in both directions, and reports the governing maximum and minimum. It is for structural engineers, students and anyone checking a reaction, moment or force under code combinations.

## Formulas

ASCE 7-16 LRFD (section 2.3.1):

    1. 1.4D
    2. 1.2D + 1.6L + 0.5(Lr or S or R)
    3. 1.2D + 1.6(Lr or S or R) + (L or 0.5W)
    4. 1.2D + 1.0W + L + 0.5(Lr or S or R)
    5. 1.2D + 1.0E + L + 0.2S
    6. 0.9D + 1.0W
    7. 0.9D + 1.0E

ASCE 7-16 ASD (section 2.4.1):

    D;  D + L;  D + (Lr or S or R);  D + 0.75L + 0.75(Lr or S or R)
    D + (0.6W or 0.7E);  D + 0.75L + 0.75(0.6W) + 0.75(Lr or S or R)
    D + 0.75L + 0.75(0.7E) + 0.75S;  0.6D + 0.6W;  0.6D + 0.7E

EN 1990 (STR, persistent and transient):

    6.10:   1.35 G + 1.5 Q_1 + Σ 1.5 ψ0,i Q_i
    6.10a:  1.35 G + Σ 1.5 ψ0,i Q_i
    6.10b:  0.85 × 1.35 G + 1.5 Q_1 + Σ 1.5 ψ0,i Q_i
    6.12b:  G + A_Ed + Σ ψ2,i Q_i   (seismic)

- D or G — dead load; L — live load; Lr — roof live load; S — snow; R — rain; W — wind; E — earthquake
- ψ0: 0.7 for categories A to D, F and G, 1.0 for storage, 0.5 or 0.7 for snow, 0.6 for wind, 0 for roofs
- Favourable dead load takes γ = 1.0, and favourable variable loads are left out

## Assumptions and limitations

- Every load is the same kind of effect, such as a reaction or a moment, in one unit. Gravity is positive.
- Wind and seismic effects are taken in both directions. A negative minimum means uplift or a reversal of force.
- ASCE 7 allows 0.5 on L in combinations 3 to 5 where the live load is 100 psf or less, except garages and assembly areas. E is the seismic load effect of section 12.4.
- The Eurocode values are the recommended ones. National annexes can change them. Roof imposed loads are not combined with snow or wind, and rain is not a separate action.

## Worked example

A beam reaction has these unfactored parts: D = 10, L = 8, Lr = 2, S = 5 and W = 6 kN, with no rain or seismic load. Find the governing LRFD combinations.

1. Combination 1: 1.4 × 10 = 14.0 kN.
2. Combination 2 with snow: 1.2 × 10 + 1.6 × 8 + 0.5 × 5 = 27.3 kN.
3. Combination 3 with snow and L: 12 + 1.6 × 5 + 8 = 28.0 kN.
4. Combination 4 with wind downward and snow: 12 + 6 + 8 + 0.5 × 5 = 28.5 kN. This is the largest.
5. Combination 6 with wind upward: 0.9 × 10 − 6 = 3.0 kN. This is the smallest, so there is no uplift.

By ASD the same reaction is 22.45 kN, and by EN 1990 expression 6.10 it is 34.8 kN with snow leading.

## FAQ

**What is the difference between LRFD and ASD combinations?**
LRFD factors the loads up and compares them with a reduced strength. ASD uses smaller factors, often 1.0, and compares with an allowable stress. Each needs its own design values.

**Why is 0.9D used in some combinations?**
Dead load resists uplift and overturning. Taking only 90 % of it is conservative where it helps.

**What does "Lr or S or R" mean?**
Use whichever of the three gives the worst effect. The page evaluates all three and keeps the governing one.

**Which Eurocode expression should I use, 6.10 or 6.10a/b?**
The national annex decides. The larger of 6.10a and 6.10b never exceeds 6.10, so the pair is more economical where it is allowed.

**What are ψ factors?**
Combination factors that reduce accompanying variable loads, because they rarely reach their full values at the same time as the leading load.

**Do I need to consider wind in both directions?**
Yes. Wind on a roof can press down or lift up, and lateral wind or seismic loads can come from either side.

## Related calculators

- [Snow load](../snow-load/index.html) — the snow load S.
- [Wind load](../wind-load/index.html) — the wind pressure W.
- [Deflection limits](../deflection-limits/index.html) — serviceability checks with unfactored loads.
- [Column base plate](../base-plate/index.html) — design for the factored axial load.
