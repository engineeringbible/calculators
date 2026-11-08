# Stiffener with attached plating calculator

**Summary:** Neutral axis, moment of inertia and section moduli at the plate and the flange of a stiffener with its effective plate flange.

## Introduction

A stiffener welded to a plate does not bend on its own: a strip of the plate works with it as a flange. The strength of the combination is set by its moment of inertia and its section modulus at the plate and at the free flange, which classification rules compare with their required values. This calculator builds the section from the plate strip, the web and the flange, or takes a bulb flat or rolled profile from its table values, and gives the neutral axis, the moment of inertia and both section moduli, with and without the plating.

It is for naval architects and structural engineers checking stiffeners against class rules, superintendents assessing renewals, and students learning section properties.

## Formulas

    Neutral axis:       z̄ = Σ A_i z_i / Σ A_i
    Moment of inertia:  I = Σ (I_i + A_i (z_i − z̄)²)
    Section moduli:     Z_plate = I / z̄,   Z_flange = I / (h_total − z̄)
    Rectangle:          I_i = b h³ / 12

- z — height above the outer surface of the plate; h_total — plate thickness plus profile height.

## Assumptions and limitations

- Bending about the axis parallel to the plate.
- The effective breadth of plating is an input from the rules.
- An angle has the same properties about this axis as a tee; its lateral bending and twist are not covered.
- Corrosion additions and net thickness rules are applied by the user.

## Worked example

A tee of a 300 × 10 mm web and a 100 × 15 mm flange stands on a 12 mm plate with an effective breadth of 600 mm.

1. Areas: plate 72 cm², web 30 cm², flange 15 cm², total 117 cm².
2. Neutral axis: (7200 × 6 + 3000 × 162 + 1500 × 319.5) / 11 700 = 86.2 mm above the plate surface.
3. Moment of inertia: 2261 cm⁴ of own inertia plus 14 519 cm⁴ of parallel-axis terms = 16 781 cm⁴.
4. Section moduli: 16 781 / 8.62 = 1947 cm³ at the plate and 16 781 / 24.08 = 697 cm³ at the flange.

## FAQ

**Why are there two section moduli?**
The neutral axis lies close to the plate, so the free flange is much further from it and carries the higher bending stress. The smaller modulus, at the flange, usually governs.

**What effective breadth should I use?**
The classification rules define it, often as the stiffener spacing for local strength, and less where shear lag or plate buckling reduce the plate's contribution.

**How do I enter a bulb flat?**
Choose the profile table option and enter the area, the height of the centroid, the moment of inertia about that centroid and the height, from the maker's or the standard's table.

**Does the neutral axis have to be inside the web?**
No. With a wide, thick plate and a small stiffener it can fall inside the plate; the calculator says so.

**Is the profile alone ever needed?**
Some rules give the required section modulus of the stiffener without its plating, and it is a useful check of a profile table.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — deflection and stress of the stiffener as a beam.
- [Weld fatigue damage (DNV-RP-C203)](../weld-fatigue/index.html) — fatigue of the stiffener connections.
- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — stiffeners under axial compression.
- [Padeye design check](../padeye/index.html) — lifting points welded to stiffened plating.
