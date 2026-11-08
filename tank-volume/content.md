# Tank volume and partial fill calculator

**Summary:** Total and partial volume of cylinders, spheres and rectangular tanks at a liquid level, level for a target volume, mass from density and free-surface moment.

## Introduction

A sounding tells you how deep the liquid is, not how much there is. For a rectangular tank the two are proportional; for a horizontal cylinder or a sphere the relation is a curve that most people have to look up. This calculator computes the liquid volume at any level for horizontal cylinders (flat or hemispherical ends), vertical cylinders, spheres and rectangular tanks, inverts the relation to find the level that holds a target volume, converts to mass with the liquid density, and reports the free-surface breadth, area and moment of inertia that the stability calculation needs for a slack tank.

It is for engineers on board and ashore working with day tanks, hydrophore and air vessels, process drums and storage tanks where no calibrated tank table exists, and for students meeting the circular-segment geometry.

## Formulas

Horizontal cylinder (radius R, cylindrical length L, level h from the bottom):

    A(h) = R² acos((R − h)/R) − (R − h) √(2Rh − h²)       circular segment
    c(h) = 2 √(2Rh − h²)                                   chord (free-surface breadth)
    V = A L                                                flat ends
    V = A L + π h² (3R − h) / 3                            two hemispherical heads (the heads form a sphere)

Sphere (radius R):

    V = π h² (3R − h) / 3

Vertical cylinder and rectangular tank (length l, breadth b):

    V = π R² h,          V = l b h

Mass and free surface:

    m = ρ V
    i = L c³ / 12   (rectangular surface L × c),   i = π r⁴ / 4   (circular surface of radius r)
    Free surface moment = i ρ          (reduces GM by i ρ / Δ)

Level for a target volume: solved by bisection on V(h).

## Assumptions and limitations

- Ideal geometric shells: no stiffeners, pipes, coils or wells; real ship tanks hold 1–3 % less than the geometric volume. Use the certified tank tables where they exist.
- Horizontal cylinders have flat or hemispherical ends; torispherical and ellipsoidal heads hold less than hemispheres and need the manufacturer's head volume.
- Level tank: no trim or heel. Trim and heel shift the liquid and change the sounding-to-volume relation; ship tank tables include those corrections.
- Density at the liquid temperature; for bunkers use the Table 54B method in the bunker-quantity calculator.
- The free-surface inertia is about the longitudinal axis of a tank lying fore-and-aft (the transverse stability case). A horizontal cylinder placed athwartships has its long dimension as the breadth: swap the roles accordingly.

## Worked example

A horizontal cylindrical day tank, 2.0 m inside diameter, 10.0 m long, flat ends, with HFO at 0.99 t/m³ sounded at 0.50 m.

1. Total volume: π × 1² × 10 = 31.42 m³.
2. Segment at h = 0.5 m: A = 1² × acos(0.5) − 0.5 × √(1 − 0.25) = 1.047 − 0.433 = 0.614 m²; V = 0.614 × 10 = 6.14 m³ (19.55 % full, ullage 1.50 m).
3. Mass: 6.14 × 0.99 = 6.08 t.
4. Free surface: chord 2 √(2 × 0.5 − 0.25) = 1.73 m; area 17.3 m²; i = 10 × 1.73³ / 12 = 4.33 m⁴; free surface moment 4.33 × 0.99 = 4.29 t·m. On a 47 000 t ship that costs 0.1 mm of GM — negligible — but the same tank 10 m wide and 50 m long (a wing tank) would give 4 300 t·m and 9 cm of GM.
5. To transfer 6.0 m³ into an empty identical tank, fill to the level that holds 6.0 m³: 0.493 m.

With hemispherical heads the same tank holds 35.6 m³ and 6.80 m³ at the 0.5 m sounding.

## FAQ

**Why is a horizontal tank 19.6 % full at a quarter of its height?**
Because the cross-section is narrow at the bottom: the segment below a quarter depth is less than a quarter of the circle. At three-quarters depth it is 80.4 % full, by symmetry.

**Can I use this instead of the ship's tank tables?**
Only when none exist. Tank tables include internal structure, trim and heel corrections and the sounding-pipe position; the geometric value is a check, not a replacement.

**What does the free-surface output mean?**
Any tank that is slack (neither empty nor pressed up) lets its liquid move when the ship heels, reducing the effective GM by i ρ / Δ. The inertia i depends on the breadth cubed, which is why wide tanks are subdivided and why pressing tanks up matters.

**How accurate is the level-for-volume result?**
Exact for the geometric shape (bisection to a hundredth of a millimetre). The practical limit is the tank's true geometry and the sounding method.

**What density should I use?**
The density at the tank temperature: HFO 0.97–0.99 t/m³ when heated, MGO 0.84, fresh water 1.000, sea water 1.025, lube oil about 0.90. For custody transfer use the 15 °C density with the volume correction factor.

**Does the calculator handle a tilted tank?**
No. A trimmed horizontal cylinder is a more complex integral; use the tank tables or treat small trims as a level change at the sounding point.

**Why no torispherical heads?**
Their volume depends on the knuckle and crown radii chosen by the manufacturer; hemispherical heads bracket the maximum and flat ends the minimum.

## Related calculators

- [Bunker quantity and density correction](../bunker-quantity/index.html) — mass at 15 °C for fuel in the tank.
- [Initial stability GM and list](../initial-stability/index.html) — where the free surface moment goes.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — how the liquid volume changes with temperature.
- [Draft survey](../draft-survey/index.html) — tank quantities as deductibles.
