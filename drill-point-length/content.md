# Drill point length calculator

**Summary:** Length of a drill point from diameter and point angle (118°, 135°, 140°), and the depth to drill for a full-diameter blind hole or a through hole.

## Introduction

A twist drill ends in a cone. The length of that cone, the point length, is half the diameter divided by the tangent of half the point angle. For the standard 118° point it is 0.3 × the diameter, so a 1/2 in drill has a point 0.150 in long. A blind hole that must be full diameter to 1 in deep needs the drill tip to go to 1.150 in.

This calculator gives the point length for any point angle, the ratio to the diameter, and the depth to program. For a blind hole it adds the point to the full-diameter depth. For a through hole it adds the point and a breakthrough allowance to the thickness. It also lists the point length at the common angles of 90° to 140°. It is for CNC programmers, machinists and designers dimensioning drilled holes.

## Formulas

Point length:

    L_p = (D / 2) / tan(θ / 2)

Common point angles:

    118°:  L_p = 0.3004 D
    135°:  L_p = 0.2071 D
    140°:  L_p = 0.1820 D

Depth to drill:

    blind hole:    tip depth = full-diameter depth + L_p
    through hole:  travel = thickness + L_p + breakthrough

- D — drill diameter; θ — included point angle
- A 180° flat-bottom drill has no point

## Assumptions and limitations

- The point is treated as a sharp cone. The chisel edge at the centre and any point thinning make the real point slightly shorter.
- In a blind hole, the cone of the drill point stays at the bottom. Drawings often give the full-diameter depth and show the 118° cone below it.
- A through hole needs the whole point out of the part, plus an allowance so the corners of the drill clear the exit edge cleanly.
- For a tapped blind hole, the drilled full-diameter depth must also leave room for the tap's chamfer below the last full thread.
- Deep holes may need peck drilling or a deep-hole drill to clear the chips. The page warns above 10 diameters.

## Worked example

A 1/2 in drill with a 118° point must give a blind hole that is full diameter to 1 in deep. How deep should the tip go?

1. Half the point angle: 59°, tan 59° = 1.6643.
2. Point length: 0.25 / 1.6643 = 0.1502 in.
3. As a ratio: 0.1502 / 0.5 = 0.3004 of the diameter.
4. Tip depth: 1 + 0.1502 = 1.1502 in.

With a 135° point, the same drill needs only 0.1036 in more, so the tip goes to 1.1036 in.

## FAQ

**How do I calculate drill point length?**
Divide half the drill diameter by the tangent of half the point angle. For 118°, multiply the diameter by 0.3.

**What is the drill point length factor for 135°?**
0.207 × the diameter. A 10 mm drill with a 135° point has a point 2.07 mm long.

**Why do drills have 118° points?**
It is the general-purpose point for twist drills in mild steel and many other materials. Flatter points, such as 135°, suit tough steels, and many solid carbide drills have 140° points.

**Should drawing depths include the drill point?**
Usually the depth given is the full-diameter depth. The machinist adds the point length to program the tip depth.

**How far must the drill go past a through hole?**
At least one point length beyond the far face, plus a small allowance so the outer corners clear the edge.

**What is a flat-bottom drill?**
A drill with a 180° point that leaves a flat bottom. It has no point length to add.

## Related calculators

- [Tap drill calculator](../tap-drill/index.html) — the drill size for a tapped hole.
- [Machining time calculator](../machining-time/index.html) — drilling time including the point.
- [Speeds and feeds calculator](../speeds-feeds/index.html) — rpm and feed for the drill.
- [Chip load calculator](../chip-load/index.html) — feed per tooth for milling cutters.
