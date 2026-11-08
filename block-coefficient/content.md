# Block coefficient and hull form coefficients

**Summary:** Block, midship, prismatic and waterplane coefficients of a hull from its dimensions, and the displacement Δ = C_B L B T ρ in salt or fresh water.

## Introduction

The block coefficient says how much of the box around the underwater hull the hull actually fills. It is the displacement volume divided by length × breadth × draught. A ship 100 m long, 16 m wide and 6 m deep in the water that displaces 7 200 m³ fills 7 200 of the 9 600 m³ box, so C_B = 0.750. A barge comes close to 1, a fast yacht can be below 0.4.

This calculator gives the block coefficient and the other hull form coefficients: midship, prismatic, waterplane and vertical prismatic. It takes the underwater volume directly, from the displacement in tonnes, or from a known C_B, and gives the displacement in salt and fresh water and the TPC. It is for deck officers, cadets and naval architecture students working with hydrostatics.

## Formulas

Form coefficients:

    C_B = ∇ / (L B T)
    C_M = A_M / (B T)
    C_P = ∇ / (A_M L) = C_B / C_M
    C_WP = A_WP / (L B)
    C_VP = ∇ / (A_WP T) = C_B / C_WP

Displacement and tonnes per centimetre:

    Δ = C_B L B T ρ,     TPC = A_WP ρ / 100

- L — length between perpendiculars or on the waterline; B — moulded breadth; T — moulded draught
- ∇ — displacement volume; A_M — midship section area below the waterline; A_WP — waterplane area
- ρ — water density: 1.025 t/m³ for salt water, 1.000 t/m³ for fresh water

## Assumptions and limitations

- All coefficients belong to one draught. They fall as the ship rises, so design-draught values overstate the displacement at ballast draught.
- Coefficients based on L_PP and on L_WL differ. Compare like with like.
- The volume is moulded, inside the plating and without appendages. Shell plating, rudder and propeller add a little to a steel ship's displacement.
- The hull-type hint uses the typical block coefficients MAN Energy Solutions lists for merchant ships.

## Worked example

A coaster is 100 m long, 16 m in breadth and floats at 6 m draught. Its displacement volume is 7 200 m³, the midship section area 92 m² and the waterplane area 1 300 m².

1. Block coefficient: 7 200 / (100 × 16 × 6) = 7 200 / 9 600 = 0.750.
2. Midship coefficient: 92 / (16 × 6) = 0.958.
3. Prismatic coefficient: 0.750 / 0.958 = 0.783.
4. Waterplane coefficient: 1 300 / (100 × 16) = 0.813.
5. Vertical prismatic coefficient: 0.750 / 0.813 = 0.923.
6. Displacement: 7 200 × 1.025 = 7 380 t in salt water, or 7 200 t in fresh water. TPC in salt water is 1 300 × 1.025 / 100 = 13.3 t/cm.

## FAQ

**What is a typical block coefficient?**
MAN lists about 0.80 to 0.85 for tankers and bulk carriers, 0.55 to 0.75 for general cargo ships, 0.50 to 0.70 for container ships and ferries, and 0.90 for lighters.

**How do I calculate displacement from the block coefficient?**
Multiply C_B by length, breadth, draught and water density. A ship 180 m × 32 m × 10 m with C_B 0.80 displaces 0.80 × 57 600 × 1.025 = 47 232 t in salt water.

**What is the difference between the block and the prismatic coefficient?**
The block coefficient compares the hull with a box. The prismatic coefficient compares it with a prism of the midship section, so it shows how the volume is spread along the length, which matters for wave resistance.

**What is the waterplane coefficient used for?**
It gives the waterplane area, and from that the TPC: the tonnes needed to sink the ship one centimetre.

**Why is the displacement less in fresh water?**
It is the same underwater volume filled with lighter water: 1.000 t/m³ against 1.025 t/m³. The same ship, with the same mass, floats deeper in fresh water instead.

**Can the block coefficient be more than 1?**
No. If the calculator says so, the volume or a dimension is wrong, often a draught entered in feet as metres.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — displacement, TPC, FWA and trim from C_B.
- [Buoyancy calculator](../buoyancy/index.html) — Archimedes for any floating body.
- [Change of trim and new drafts](../trim-change/index.html) — drafts after loading a weight.
- [Shallow water correction](../shallow-water-speed/index.html) — uses C_B, C_M and C_WP.
