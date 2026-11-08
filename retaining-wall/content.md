# Retaining wall earth pressure calculator (Rankine)

**Summary:** Active, at-rest and passive earth pressure on a retaining wall by Rankine, with surcharge and sloping backfill, the thrust, and sliding and overturning checks.

## Introduction

A retaining wall holds back soil that would otherwise slump to its natural slope. The soil pushes on the wall with a pressure that grows with depth, like water but smaller, and the ratio between the horizontal and vertical pressure is the earth pressure coefficient. If the wall can lean out slightly, the soil settles into the lower active state; if it cannot move, the pressure stays at the higher at-rest value.

This calculator gives the Rankine active and passive coefficients and Jaky's at-rest coefficient, the pressure at the base, the total thrust per metre of wall and its height, including a uniform surcharge and sloping backfill. For a simple gravity wall it also checks sliding and overturning. It is for engineers, students and builders checking garden, landscape and site walls.

## Formulas

Earth pressure coefficients:

    K_a = tan²(45° − φ/2)                         active, level backfill
    K_a = cos β (cos β − √(cos²β − cos²φ)) / (cos β + √(cos²β − cos²φ))   sloping backfill
    K_p = tan²(45° + φ/2)                         passive
    K_0 = 1 − sin φ                                at rest (Jaky)

Thrust per metre of wall and its height above the base:

    P = ½ K γ H² + K q H
    ȳ = ( ½ K γ H² × H/3 + K q H × H/2 ) / P

Gravity wall of width b and weight W = γ_w b H:

    FS_sliding = μ W / P_h,   FS_overturning = (W b / 2) / (P_h ȳ)

- φ — friction angle of the backfill; γ — its unit weight; H — retained height
- q — uniform surcharge; β — slope of the backfill; μ — friction between base and soil

## Assumptions and limitations

- Rankine theory assumes a vertical, smooth wall and a cohesionless backfill. Wall friction, used in Coulomb's theory, reduces the active thrust slightly.
- The backfill must be drained. Water trapped behind a wall adds its full hydrostatic pressure, often more than the soil pressure, and is the most common cause of wall failure. Provide drainage.
- The active state needs a small movement of the wall, about 0.1 to 0.2 % of its height for sand. Basement walls and propped walls must carry the at-rest pressure.
- The stability check is for a plain rectangular block on soil. Cantilever walls with a heel and toe, and walls with keys or passive resistance, need a full design that also checks bearing pressure and overall slope stability.

## Worked example

A 3 m high wall retains sand with φ = 30° and γ = 18 kN/m³, with a 10 kPa surcharge on top. The wall is a 1.8 m wide concrete block (24 kN/m³) on soil with μ = 0.5.

1. Active coefficient: tan²(45° − 15°) = 1/3.
2. Thrust from the soil: ½ × 1/3 × 18 × 3² = 27 kN/m, acting 1.0 m above the base.
3. Thrust from the surcharge: 1/3 × 10 × 3 = 10 kN/m, acting 1.5 m up. Total P = 37.00 kN/m at ȳ = 42 / 37 = 1.135 m.
4. Wall weight: 24 × 1.8 × 3 = 129.6 kN/m.
5. Sliding: 0.5 × 129.6 / 37 = 1.75. Overturning: 129.6 × 0.9 / 42 = 2.78.

Both exceed the usual minimums of 1.5 and 2.0. A 1.2 m wide block would fail both checks.

## FAQ

**What is active earth pressure?**
The lowest lateral pressure the soil exerts, reached when the wall moves slightly away from it. For sand with φ = 30° it is one third of the vertical pressure.

**When should I use at-rest pressure?**
For walls that cannot move: basement walls, walls braced at the top, and walls on rock. At φ = 30° it is 50 % higher than the active pressure.

**What is passive earth pressure?**
The resistance of soil pushed by the wall, for example in front of the toe. It is much larger, three times the vertical pressure at φ = 30°, but needs large movement to develop and is often ignored or reduced.

**How does a slope above the wall change the pressure?**
It increases it. A 10° backfill slope raises K_a from 0.333 to 0.350 for φ = 30°, and the increase grows quickly as the slope approaches φ.

**What factor of safety is needed?**
Commonly 1.5 against sliding and 2.0 against overturning, with the resultant inside the middle third of the base. Eurocode 7 uses partial factors instead.

**Why do retaining walls fail?**
Most often because water builds up behind them. Weep holes, a drain at the base and free-draining backfill prevent it.

## Related calculators

- [Soil bearing capacity](../soil-bearing/index.html) — bearing under the wall base.
- [Footing size calculator](../footing-size/index.html) — sizing the wall's footing.
- [Trench and excavation volume](../trench-volume/index.html) — digging for the wall.
- [Slope calculator](../slope/index.html) — backfill slope in degrees and percent.
