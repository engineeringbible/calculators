# Lifting sling and wire rope load calculator

**Summary:** Leg tension from load, legs and sling angle or geometry, with dynamic and hitch factors; chain, wire-rope or rated sling WLL; utilisation and the maximum load for the sling.

## Introduction

A sling leg carries more than its share of the load as soon as it leans: at 30° from the vertical each of two legs carries 58 % of the load, at 60° the full load. Most sling failures trace back to that angle factor, to assuming four legs share equally, or to a choke hitch used at its straight-pull rating. This calculator computes the tension in each leg from the load, the number of legs assumed to carry it, the angle (entered directly or from the spread and leg length), a dynamic factor and the hitch, then compares it with the working load limit of a Grade 8 chain sling, a 6×36 wire rope sling or any tag-rated sling, and gives the maximum load the arrangement may lift.

It is for riggers, deck and engine officers planning lifts with ship's cranes and chain blocks, superintendents checking a lift plan, and students learning the sling-angle rule.

## Formulas

Leg angle from geometry (two legs, or the diagonal of four):

    sin β = (spread / 2) / leg length

Loads:

    Hook load   F = W g × DAF
    Leg tension T = F / (n_eff cos β)
    Compression on the load per leg = T sin β
    Angle factor = 1 / cos β

Working load limits (single leg, straight pull):

    Grade 8 chain:  WLL ≈ 0.0314 d² tonnes (d in mm)                           EN 818-4
    Wire rope 6×36 IWRC 1770 MPa: MBL = 0.356 d² × 1770 / 1000 kN;  WLL = MBL × 0.9 / 5   EN 12385-4, EN 13414-1
    Rated sling: tag value

Capacity and utilisation:

    Leg capacity = WLL × hitch factor   (straight 1.0, choke 0.8, basket with vertical legs 2.0)
    Utilisation  = T / (leg capacity × g)
    Maximum load W_max = leg capacity × g × n_eff cos β / (g × DAF)

- W — load mass; DAF — dynamic amplification factor; n_eff — legs assumed to carry the load (all for 1–2 legs, 3 for 3–4 legs by default); β — angle of each leg to the vertical

## Assumptions and limitations

- Equal sharing between the effective legs and equal angles. Four-leg slings are rated on three legs unless the legs are adjustable or the load is rigid with exact geometry.
- The centre of gravity is under the hook. An offset CoG overloads the near legs; use a moment balance for the actual leg loads.
- β ≤ 60° by EN 13414-1 and ASME B30.9, 45° or less recommended; the calculator warns above both limits.
- WLL formulas are for Grade 8 chain and 6×36 IWRC 1770 MPa rope with ferrule-secured eyes; other grades, constructions and terminations differ. The sling tag governs.
- Hitch factors are the standard ones; bending over small diameters (D/d below about 20 for wire rope), sharp edges and knots reduce capacity further and are not covered.
- Shackles, hooks, master links, lifting lugs and the crane hook block need their own checks against the leg tension or total load.
- The dynamic factor is an input; the calculator does not derive it from crane speed or sea state.

## Worked example

A 10 t engine part is lifted with a two-leg Grade 8 chain sling of 16 mm chain, leg length 4 m, lift points 4 m apart, straight hitch, in the engine room with the overhead crane (DAF 1.1).

1. Angle: sin β = 2 / 4 → β = 30°, included angle 60°.
2. Hook load: 10 000 × 9.81 × 1.1 = 107.9 kN.
3. Leg tension: 107.9 / (2 × cos 30°) = 62.3 kN = 6.35 t per leg (angle factor 1.155). Each leg also pushes 31.1 kN horizontally into the part.
4. Chain WLL: 0.0314 × 16² = 8.04 t per leg (EN 818-4 table 8.0 t); straight hitch factor 1.0.
5. Utilisation: 6.35 / 8.04 = 79 % — acceptable. Maximum load for this arrangement: 8.04 × 2 × cos 30° / 1.1 = 12.7 t.

Shortening the legs to 2.5 m would make β = 53°, tension 8.9 t per leg and the lift not permitted with this sling; a choke hitch at 30° would reduce the capacity to 6.4 t per leg and also fail.

## FAQ

**Why does the leg angle matter so much?**
The vertical components of the leg tensions must add up to the load, so each leg's tension is its share divided by cos β. At 60° cos β = 0.5 and each leg carries the whole load; beyond that the tension rises faster than the load.

**My sling tag shows several WLLs. Which one applies?**
Tags give the straight single-leg WLL and the multi-leg WLL at 0–45° and 45–60°; those already include the angle factor and the three-leg rule. Enter the straight single-leg value here and let the calculator apply the angle.

**Why only three legs for a four-leg sling?**
Unless the legs are adjustable or the load is perfectly rigid and the lift points level, one leg goes slack and the load is carried by three. Standards therefore rate four-leg slings as three-leg.

**What dynamic factor should I use?**
Workshop and engine-room cranes 1.1–1.25; ship's cranes in port 1.2–1.3; offshore lifts per DNV-ST-N001 1.3 and more depending on the sea state and the lift. Snatching a load can exceed all of these.

**Can I use the compression output for a spreader beam?**
Yes. The horizontal components of the leg tensions compress a spreader beam between the lift points; check it as a column with the column-buckling calculator.

**Does a choke hitch really lose 20 %?**
Yes, the standard factor is 0.8, and more is lost if the choke angle is tight or the sling bends over a sharp edge. A basket hitch with vertical legs gains a factor of 2 because two parts of the sling share the load.

**What about the shackles?**
Each shackle must have a WLL at least equal to the leg tension when loaded in line, with reductions for side loading per the manufacturer; the master link must carry the total hook load.

## Related calculators

- [Anchor cable catenary and scope](../anchor-catenary/index.html) — chain weights and cable loads.
- [Hydraulic cylinder force and speed](../hydraulic-cylinder/index.html) — crane and winch drives.
- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — spreader beams in compression.
- [Beam deflection and bending stress](../beam-deflection/index.html) — lifting beams in bending.
