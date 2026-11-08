# Truss calculator (Pratt, Howe, Warren)

**Summary:** Member forces, reactions and the largest tension and compression in a Pratt, Howe or Warren truss under a uniform roof or bridge load, by the method of joints.

## Introduction

A truss carries load through members that are only pulled or pushed, never bent, which makes it light and stiff for long spans. The top chord is squeezed, the bottom chord stretched, and the web members between them carry the shear. Which web members are in tension and which in compression depends on the pattern: in a Pratt truss the diagonals pull and the verticals push; in a Howe truss it is the other way round.

This calculator solves Pratt, Howe and Warren trusses with parallel chords under a uniform load on the top chord. It gives every member force, the support reactions, and the members with the largest tension and compression. It is for students learning the method of joints and for engineers checking roof trusses, footbridges and frames.

## Formulas

Every joint is in equilibrium:

    Σ F_x = 0,   Σ F_y = 0      at each of the j joints

A plane truss is statically determinate when:

    m + r = 2j

Method of sections, for a chord member opposite a joint at distance x:

    F_chord = M(x) / H

- m — number of members; r — reactions (3 for a pin and a roller); j — joints
- M(x) — bending moment of the equivalent beam at x; H — truss depth
- Panel loads: W/n at interior top joints, W/(2n) at the end joints

## Assumptions and limitations

- Joints are pinned and loads act only at joints, so members carry axial force only. Real welded or bolted joints add small secondary bending.
- The truss is simply supported, with a pin at one end and a roller at the other.
- The load is uniform and on the top chord. Snow, roofing and wind loads should be combined first, and the self-weight of the truss added.
- Compression members must be checked for buckling over their length, and every member and connection designed for its force.

## Worked example

A Pratt roof truss spans 18 m, is 3 m deep and has 6 panels of 3 m. It carries 60 kN in total on its top chord. What are the main forces?

1. Joint loads: 10 kN at each of the five interior top joints and 5 kN at each end joint.
2. Reactions: 60 / 2 = 30.0 kN at each support.
3. Top chord at midspan: moment about the middle bottom joint is 30 × 9 − 5 × 9 − 10 × (6 + 3) = 135 kN·m, so 135 / 3 = 45.0 kN compression.
4. Bottom chord in the middle panels: moment about the top joint 6 m in is 120 kN·m, so 40.0 kN tension.
5. End diagonal: the shear in the end panel is 25 kN, so the 4.24 m diagonal carries 25 × 4.24 / 3 = 35.4 kN tension.

In the Howe truss of the same size the diagonals are in compression and the bottom chord peaks at 45 kN.

## FAQ

**What is the method of joints?**
Writing the two equilibrium equations at every joint and solving for the member forces. This page solves them all together, which works for any determinate truss.

**What is the difference between a Pratt and a Howe truss?**
The direction of the diagonals. Pratt diagonals slope down towards the middle and are in tension under gravity loads; Howe diagonals slope up towards the middle and are in compression.

**Which truss is best?**
Pratt suits steel, because the long diagonals are in tension and the short verticals in compression. Howe suited timber with steel rods. Warren uses fewer members and is common for bridges and floor trusses.

**How deep should a truss be?**
Typically a tenth to a twelfth of the span for roofs. Deeper trusses have smaller chord forces and deflect less.

**Why are some members zero force?**
At some joints the geometry leaves a member with nothing to resist, such as the first bottom chord panel of this Pratt truss. Zero-force members still brace other members.

**How do I check a member's strength?**
Tension members need enough net area; compression members must be checked for buckling over their length with the column buckling calculator.

## Related calculators

- [Beam deflection](../beam-deflection/index.html) — the equivalent beam behind the chord forces.
- [Column buckling](../column-buckling/index.html) — checking compression members.
- [Moment of inertia (section properties)](../moment-of-inertia/index.html) — properties of the member sections.
- [Snow load calculator](../snow-load/index.html) — the roof load the truss carries.
