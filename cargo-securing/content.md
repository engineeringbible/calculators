# Cargo securing (CSS Code Annex 13) calculator

**Summary:** Design accelerations, forces and the sliding and tipping balance of a lashed cargo unit by the CSS Code Annex 13 advanced calculation method.

## Introduction

Heavy and awkward cargo units, such as machinery, transformers, boats, steel structures and project cargo, have no standard securing system. Annex 13 of the IMO Code of Safe Practice for Cargo Stowage and Securing gives a method to check a lashing arrangement: take design accelerations for the stowage position, correct them for the ship's length, speed and stiffness, add wind and sea sloshing for deck cargo, and show that friction and lashings can resist the forces without the unit sliding or tipping. This calculator applies the advanced method with the Code's own tables and reproduces its worked example.

It is for cargo officers, superintendents and surveyors planning or approving the securing of non-standardized cargo.

## Formulas

    Accelerations:   a_x, a_y, a_z from Table 2 (stowage level, x/L) × Table 3 (length, speed); a_y × Table 4 (B/GM < 13)
    Forces:          F_x = m a_x + F_wx + F_sx,   F_y = m a_y + F_wy + F_sy,   F_z = m a_z
    Wind, sloshing:  1 kN/m² each on deck; sloshing up to 2 m above the deck
    Lashings:        CS = MSL / 1.5,   f = μ sin α + cos α
    Sliding:         F_y ≤ μ m g + Σ CS f
    Tipping:         F_y a ≤ b m g + Σ CS c
    Longitudinal:    F_x ≤ μ (m g − F_z) + Σ CS f
    Rule of thumb:   Σ MSL on each side ≥ m g

- μ — friction coefficient (0.3 steel on timber or rubber, 0.1 steel on dry steel, 0 steel on wet steel); α — vertical lashing angle; a — height of the centre of gravity above the tipping edge; b — lever of stableness; c — lever of a lashing about the tipping edge.

## Assumptions and limitations

- Table values are for unrestricted service all year; they may be exceeded in roll resonance, quartering seas with marginal stability, or slamming.
- The MSL of a lashing is the weakest component's MSL, from the Cargo Securing Manual.
- Lashings steeper than 60° do not count against sliding.
- Containers and other standardized cargo follow their own securing rules.

## Worked example

The Code's example: a 62 t unit, 6 m long, 4 m wide and 4 m high, stowed low on deck at 0.7 L of a 120 m ship at 15 kn, on dunnage (μ = 0.3). Lashings have an MSL of 90 kN, so CS = 60 kN.

1. Table 3 gives 0.89 for 120 m and 15 kn; Table 2 gives a_x 2.9, a_y 6.3 and a_z 6.2 m/s² for this position.
2. F_x = 2.9 × 0.89 × 62 + 16 (wind) + 8 (sloshing) = 184 kN; F_y = 6.3 × 0.89 × 62 + 24 + 12 = 384 kN; F_z = 342 kN.
3. Starboard: four lashings at 40° (f = 0.96) give 0.3 × 62 × 9.81 + 4 × 60 × 0.96 = 412 kN ≥ 384 kN.
4. Port: two at 40° and two at 10° (f = 1.04) give 422 kN ≥ 384 kN. The unit is secured against transverse sliding; the calculator also checks tipping and longitudinal sliding.

## FAQ

**Why is MSL divided by 1.5?**
Forces are not shared evenly between lashings, and assembly is never perfect. The Code reduces each lashing to a calculated strength of MSL/1.5 for the balance.

**Why does friction count less in the longitudinal check?**
The vertical acceleration lifts the unit, reducing the normal force. The Code subtracts F_z from the weight for the longitudinal balance.

**What if the cargo stands on steel?**
Dry steel on steel gives μ = 0.1 and wet steel almost none; use timber dunnage or rubber mats to raise friction to 0.3.

**Do I need longitudinal lashings?**
Transverse lashings usually provide some longitudinal restraint, up to 0.5 CS each by the Code. If in doubt, fit lashings forward and aft and enter them as F and A.

**What is the rule of thumb?**
A quick check that the MSL on each side adds up to the unit's weight in kN, equivalent to a 1 g transverse acceleration. It ignores angles and friction, so the advanced method is the one that decides.

## Related calculators

- [Lifting slings](../lifting-sling/index.html) — the load on slings and shackles when lifting the unit.
- [Mooring line (MEG4)](../mooring-line-meg4/index.html) — line strengths and safety factors.
- [Loading condition](../loading-condition/index.html) — the GM that sets the B/GM correction.
- [Roll period](../roll-period/index.html) — how stiffness drives the accelerations.
