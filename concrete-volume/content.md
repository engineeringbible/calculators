# Concrete volume and rebar weight calculator

**Summary:** Concrete volume and mass for slabs, walls, footings and columns with waste, cement/sand/aggregate for nominal mixes, and rebar length, mass and steel ratio.

## Introduction

Before a pour you need three numbers: how much concrete to order, how much cement, sand and aggregate if you batch on site, and how much reinforcement to buy. This calculator gives them for the common elements (slabs and rafts, walls, footings and beams, rectangular and round columns), multiplied by the number of identical elements, with a waste allowance on the concrete, the classic nominal-mix material split, and the reinforcement from either a bar mesh at a spacing or a set of longitudinal bars with links. It also reports the steel ratio in kg/m³ against typical ranges as a sanity check on the layout.

It is for site engineers and quantity surveyors doing take-offs, for marine and port works where plinths, foundations and quay elements are cast, and for students learning estimating.

## Formulas

Volumes:

    Slab / footing:  V = L × W × t,    Wall:  V = L × H × t
    Rectangular column:  V = b × d × H,    Round column:  V = π D² H / 4
    V_net = V × count,    V_order = V_net (1 + waste),    m = ρ_concrete V_net

Nominal mix 1 : a : b by volume (dry-volume factor 1.54, cement bulk density 1 440 kg/m³):

    dry volume = 1.54 V_order
    cement volume = dry volume / (1 + a + b),    cement mass = cement volume × 1 440,    bags = mass / bag size
    sand = a × cement volume,    aggregate = b × cement volume

Reinforcement:

    bar mass per metre = 7 850 × π d²/4 ≈ d² / 162   (kg/m, d in mm)
    Mesh: bars along A = floor(B / s) + 1, bars along B = floor(A / s) + 1, length per layer = (bars along A) A + (bars along B) B
    Bars + links: main length = n × member length; link length = (floor(member length / s_link) + 1) × [2 (a − 2c) + 2 (b − 2c) + 20 d_link]
    total = (main + links) × count × (1 + lap allowance)
    steel ratio = steel mass / V_net

Typical steel ratios: slabs 80–120, walls 80–150, foundations 60–150, columns 150–300 kg/m³.

## Assumptions and limitations

- Gross geometric volumes; openings, chamfers and embedded items are not deducted. The waste factor (5–10 %) is for over-break, spillage and formwork deflection.
- Concrete density 2 400 kg/m³ (EN 1991-1-1); reinforced concrete is about 2 500 kg/m³, which the separately computed steel mass makes up.
- The nominal-mix split is the traditional estimating rule and gives the loose material volumes to batch; a designed mix or ready-mixed concrete follows the supplier's mix design and cement content.
- Reinforcement layouts are simplified: full-length bars at the spacing in each direction per layer, or longitudinal bars with perimeter links; cover, bends, hooks, chairs, starter bars and trimming bars are only covered by the lap/wastage percentage (10–15 % typical).
- Steel ratios are an estimating check against typical ranges, not a structural verification; bar sizes, spacing and cover come from the design.
- Bag sizes vary (25, 40, 50 kg); enter yours.

## Worked example

Ground slab 10 m × 5 m × 200 mm, one pour, 10 % waste, nominal 1 : 2 : 4 mix batched on site with 50 kg bags, reinforced with 12 mm bars at 200 mm both ways in two layers, 10 % lap allowance.

1. Volume: 10 × 5 × 0.2 = 10.0 m³ net; order 11.0 m³; mass 24.0 t.
2. Materials for 11 m³: dry volume 16.9 m³; cement 16.9/7 = 2.42 m³ = 3 485 kg = 69.7 bags; sand 4.84 m³; aggregate 9.68 m³. Per m³ of concrete that is 317 kg of cement, the familiar 6.3 bags.
3. Reinforcement: along the 10 m direction floor(5/0.2) + 1 = 26 bars × 10 m = 260 m; along the 5 m direction 51 bars × 5 m = 255 m; 515 m per layer, 1 030 m for two layers, 1 133 m with laps. At 0.888 kg/m (12 mm) that is 1 006 kg.
4. Steel ratio: 1 006 / 10 = 101 kg/m³ — within the 80–120 kg/m³ typical of slabs. Total reinforced mass 25.0 t.

A 400 × 400 mm column 3 m high with 8 × 20 mm bars and 8 mm ties at 200 mm (40 mm cover) holds 0.48 m³ of concrete and about 68 kg of steel: 142 kg/m³ before laps, at the low end of the column range.

## FAQ

**Why order more than the net volume?**
Over-excavation, formwork deflection, spillage and the pump line all take concrete; 5–10 % extra is normal for in-situ work, more for irregular excavations.

**Where does the 1.54 factor come from?**
Loose dry cement, sand and aggregate occupy about 54 % more volume than the compacted concrete they produce, because the fine materials fill the voids between the coarse ones and the mix consolidates.

**How many bags for a cubic metre?**
With 1 : 2 : 4 about 6.3 bags of 50 kg (317 kg); with 1 : 1.5 : 3 about 8 bags (403 kg); with 1 : 3 : 6 about 4.4 bags (222 kg). Designed mixes for marine exposure typically specify 350–400 kg/m³ regardless of these ratios.

**What is the d²/162 rule?**
The mass of a steel bar in kg per metre is d² (mm) divided by 162 — 0.888 kg/m for 12 mm, 2.47 kg/m for 20 mm — from 7 850 kg/m³ and the bar area.

**My steel ratio is outside the typical range. Is the design wrong?**
Not necessarily: the ranges are averages over whole elements. Check the layout inputs first (spacing, layers, bar count) and then the design; heavily loaded transfer beams can exceed 300 kg/m³.

**Does the calculator handle mesh fabric (A142, A393)?**
Enter the equivalent bar diameter and spacing (A142: 6 mm at 200 mm; A393: 10 mm at 200 mm) as a single layer; the mass agrees with the fabric tables to within the lap allowance.

**Which mix for marine structures?**
Exposure classes XS1–XS3 (EN 206) call for designed mixes with low water/cement ratio, high cement content and often blended cements; the nominal mixes here are for estimating the materials, not for specifying durability.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — the beams these quantities build.
- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — slender columns.
- [Open-channel flow (Manning)](../manning-channel-flow/index.html) — concrete-lined channels.
- [Engineering unit converter](../unit-converter/index.html) — cubic yards, pounds and tons for imperial take-offs.
