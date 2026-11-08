# Moment of inertia calculator (section properties)

**Summary:** Area moment of inertia, section modulus, plastic modulus, centroid and radius of gyration of rectangles, tubes, I-beams, T and channel sections.

## Introduction

The area moment of inertia, or second moment of area, measures how a cross-section resists bending. It grows with the cube of the depth: a plank on edge is far stiffer than the same plank laid flat. Beam deflection, bending stress and column buckling all depend on it, together with the section modulus for stress and the radius of gyration for buckling.

This calculator gives the area, centroid, moments of inertia about both axes, elastic and plastic section moduli, radii of gyration and polar moment of the common shapes: solid and hollow rectangles, round bars and tubes, I-beams, T-sections, channels and triangles. It is for engineers and students checking a beam or column, or a section not listed in a catalogue.

## Formulas

Solid rectangle b × h and round bar of diameter d:

    I_x = b h³ / 12,   S_x = b h² / 6,   Z_x = b h² / 4
    I = π d⁴ / 64,     S = π d³ / 32,     Z = d³ / 6,   J = π d⁴ / 32

Composite sections (I, T, channel, box), from their rectangles:

    ȳ = Σ A_i y_i / Σ A_i
    I_x = Σ ( b_i h_i³ / 12 + A_i (y_i − ȳ)² )       parallel-axis theorem
    S_x = I_x / c_max,   r_x = √(I_x / A)
    Z_x = Σ A_i |y_i − y_p|,   y_p splits the area in half

- c_max — distance from the centroid to the farthest fibre
- S — elastic section modulus, for the stress at first yield: σ = M / S
- Z — plastic section modulus, for the fully plastic moment: M_p = f_y Z
- r — radius of gyration, used for column slenderness L / r

## Assumptions and limitations

- Shapes have straight sides and sharp corners. Rolled steel sections have root fillets and sometimes tapered flanges, so catalogue values are a few percent higher. Use the catalogue for standard sections and this calculator for built-up or non-standard ones.
- Ix is about the horizontal centroidal axis and Iy about the vertical one. For unsymmetric sections such as the T and channel, the centroid position is given.
- For thin-walled sections, local buckling can govern before the plastic moment is reached. The section classes of EN 1993-1-1 or AISC 360 decide whether Z can be used.
- The polar moment is the torsion constant only for circular sections. Open sections such as I-beams are much weaker in torsion than Ix + Iy suggests.

## Worked example

What are the section properties of a 100 mm wide, 200 mm deep rectangular timber beam bending about its strong axis?

1. Area: 100 × 200 = 20 000 mm².
2. Moment of inertia: 100 × 200³ / 12 = 66.67 × 10⁶ mm⁴ = 6 667 cm⁴.
3. Elastic section modulus: 100 × 200² / 6 = 666 667 mm³ = 666.7 cm³.
4. Plastic section modulus: 100 × 200² / 4 = 1 000 cm³.
5. Radius of gyration: √(6 667 × 10⁴ / 20 000) = 57.7 mm.

Laid flat, the same beam has Iy = 1 667 cm⁴, a quarter of the stiffness.

## FAQ

**What is the moment of inertia of a rectangle?**
b h³ / 12 about its centroid, with h the dimension in the direction of bending. Doubling the depth makes it eight times stiffer.

**What is the difference between moment of inertia and section modulus?**
The moment of inertia sets stiffness and deflection. The section modulus, I divided by the distance to the outer fibre, sets the bending stress: σ = M / S.

**What is the plastic section modulus?**
The first moment of area about the axis that splits the section into equal halves. Multiplied by the yield stress it gives the plastic moment, used in limit-state design of compact steel sections.

**Why are I-beams shaped like that?**
Material far from the neutral axis adds to I with the square of its distance. Putting most steel in the flanges gives a high I for little weight.

**Is this the same as mass moment of inertia?**
No. The area moment of inertia is a property of a cross-section, in mm⁴ or in⁴, used for bending. The mass moment of inertia, in kg·m², measures resistance to rotation and is used in dynamics.

**How do I use the radius of gyration?**
It sets column slenderness: the buckling load falls with (L / r)². Columns buckle about the axis with the smaller r.

## Related calculators

- [Beam deflection](../beam-deflection/index.html) — deflection and stress from the moment of inertia.
- [Column buckling](../column-buckling/index.html) — Euler buckling from I and r.
- [Stiffener section properties](../stiffener-section/index.html) — stiffeners with attached plating.
- [Mass moment of inertia](../mass-moment-of-inertia/index.html) — rotating bodies.
