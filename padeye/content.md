# Padeye design check calculator

**Summary:** Plate geometry around the hole, bearing, and shear and bending of the shackle pin of a lifting padeye to EN 1993-1-8 pin connections.

## Introduction

A padeye is a plate with a hole welded to a structure, so that a shackle can lift it. Under load the plate can tear out beyond the hole or split at its sides, the pin can crush the plate or be crushed itself, and the shackle pin can bend or shear. This calculator checks the padeye and pin as a pin connection to Eurocode 3 Part 1-8: the minimum material around the hole, bearing, shear and bending of the pin in double shear, and, because a shackle pin is meant to be removed, the serviceability checks that keep the pin replaceable.

It is for engineers designing lifting points for equipment and modules, surveyors checking padeye drawings, and anyone who needs a quick, traceable check of a lifting lug.

## Formulas

    Geometry (Table 3.9, type A):  a ≥ F γM0 / (2 t fy) + 2 d0/3,   c ≥ F γM0 / (2 t fy) + d0/3
    Bearing:                       Fb,Rd = 1.5 t d fy / γM0
    Pin shear (each plane):        Fv,Rd = 0.6 A fup / γM2
    Pin bending (Figure 3.11):     MEd = F (b + 4c + 2a) / 8,   MRd = 1.5 Wel fyp / γM0
    Combined:                      (MEd/MRd)² + (Fv,Ed/Fv,Rd)² ≤ 1
    Replaceable pin:               σh,Ed = 0.591 √(E Fser (d0 − d) / (d² t)) ≤ 2.5 fy / γM6,ser

- a, c — material beyond the hole in the load direction and at the sides; t — plate thickness; d0, d — hole and pin diameters; in the pin moment, b is the padeye thickness, a the jaw thickness and c the gap.

## Assumptions and limitations

- EN 1993-1-8:2005 with its corrigenda; recommended partial factors, which a National Annex may change.
- The design force already includes the factors of the lifting standard used.
- The load acts in the plane of the padeye along its axis.
- Welds, cheek plate connections, out-of-plane loads and the supporting structure are checked separately.

## Worked example

A 30 mm padeye with a 53 mm hole carries a factored 250 kN through a 50 mm shackle pin (yield 640 MPa, ultimate 800 MPa) between 25 mm jaws with 5 mm gaps. The plate is S355.

1. Required material: a ≥ 11.7 + 35.3 = 47.1 mm beyond the hole and c ≥ 29.4 mm at the sides; 73.5 mm is provided.
2. Bearing: 1.5 × 30 × 50 × 355 = 798.8 kN against 250 kN.
3. Pin shear: 754.0 kN per plane against 125 kN; pin bending 3.13 kN·m against 11.78 kN·m.
4. With the shackle pin replaceable, the contact stress under the 170 kN service load is 706 MPa against 887.5 MPa: utilisation 0.80, which governs.

## FAQ

**Why is a replaceable pin checked separately?**
A pin that must come out after the lift should not deform the hole or itself. Eurocode 3 limits the bearing force, the pin moment and the contact stress under the characteristic load more strictly than the ultimate checks.

**What force should I enter?**
The design force from the lifting standard you work to, including dynamic amplification, skew load and consequence factors, and any load factor of the Eurocode design. The serviceability force is the characteristic load without the partial factors.

**Do cheek plates count?**
Welded cheek plates add to the thickness at the hole if their welds can carry their share of the load. If they are smaller than the main plate, check the main plate alone for the edge distances.

**Why does the gap between padeye and shackle matter?**
The pin bends between the jaws of the shackle. A wider gap or thicker jaws increase the lever arm and the bending moment in the pin.

**What about the shackle itself?**
Shackles are rated by their maker for a working load limit; choose one with a WLL above the sling load and a pin that fits the hole closely.

## Related calculators

- [Lifting sling and wire rope load](../lifting-sling/index.html) — the sling force that reaches the padeye.
- [Fillet weld strength](../fillet-weld/index.html) — the weld between the padeye and the structure.
- [Stiffener with attached plating](../stiffener-section/index.html) — the structure under the padeye.
- [Weld fatigue damage (DNV-RP-C203)](../weld-fatigue/index.html) — padeyes used for repeated lifts.
