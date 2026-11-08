# Trench and excavation volume calculator

**Summary:** Volume of a trench or excavation with vertical or OSHA sloped sides, the loose volume and truck loads after swell, and backfill around a pipe.

## Introduction

How much soil comes out of a trench? For vertical sides it is length × width × depth. Deeper trenches in soil must have sloped sides or shoring for safety, and sloped sides add a lot of volume: a 6 ft deep trench in Type B soil is 14 ft wide at the top instead of 2. Once dug, the soil also swells, so a truck carries less bank volume than its capacity suggests.

This calculator gives the excavated volume of a trench or long excavation with vertical sides, the OSHA sloping for each soil type, or any slope you enter. It adds the swell to get the loose volume and the number of truck loads, and gives the backfill around a pipe. It is for contractors, estimators and anyone planning utility, drainage or foundation trenches.

## Formulas

Trench cross-section with side slopes n H : 1 V, and volumes:

    A = (b + n d) × d
    V_bank = A × L
    V_loose = V_bank × (1 + swell)
    loads = V_loose / truck capacity, rounded up
    V_backfill = V_bank − π D² L / 4

- b — bottom width; d — depth; L — length; n — horizontal run per unit of depth
- OSHA maximum slopes: stable rock vertical, Type A ¾ : 1, Type B 1 : 1, Type C 1½ : 1
- D — outside diameter of the pipe laid in the trench

## Assumptions and limitations

- The bottom is flat and the depth constant. For a trench that gets deeper along its length, split it into sections of similar depth, or use the average depth for a steady grade.
- The OSHA slopes are the maximum allowed for excavations up to 20 ft deep, after a competent person has classified the soil. Shoring or a trench box allows vertical sides at any depth it is designed for.
- Swell depends on the material: about 10 to 20 % for sand and gravel, 25 to 35 % for common earth and clay, and 50 % or more for blasted rock.
- Backfill needs compaction. Allow 10 to 25 % more loose material than the bank volume it replaces, and subtract any bedding or select fill brought in separately.

## Worked example

A trench for a drain is 100 ft long, 2 ft wide and 4 ft deep, with vertical sides. The soil swells by 25 % when dug and goes away in 10 yd³ trucks. How much soil is removed?

1. Volume in the ground: 100 × 2 × 4 = 800 ft³, which is 800 / 27 = 29.63 yd³.
2. Loose volume: 29.63 × 1.25 = 37.04 yd³.
3. Truck loads: 37.04 / 10 = 3.7, so 4 loads.

At 4 ft deep the trench is just under the 5 ft depth at which OSHA requires protection, if a competent person finds no sign of possible cave-in.

## FAQ

**How do I calculate trench volume in cubic yards?**
Multiply length, width and depth in feet and divide by 27. A trench 50 ft long, 1.5 ft wide and 3 ft deep is 225 ft³, or 8.3 yd³.

**When does a trench need shoring or sloping?**
Under OSHA, at 5 ft deep or more, unless it is entirely in stable rock. Below 5 ft a competent person must still check for cave-in hazards.

**What is the OSHA slope for Type B soil?**
1 horizontal to 1 vertical, or 45°. Type A soil may be sloped at ¾ : 1 and Type C at 1½ : 1.

**What is the swell factor?**
The increase in volume when soil is dug and loosened. Common earth swells about 25 %, so 10 yd³ of bank soil fills 12.5 yd³ of truck.

**How much backfill do I need around a pipe?**
The trench volume minus the pipe's outside volume, plus extra for compaction. A 12 in pipe takes up 0.785 ft³ per foot of trench.

**How deep should a utility trench be?**
It depends on the utility and local rules: water lines below the frost line, sewer lines to their design grade, and electrical cables at the cover depths of the electrical code.

## Related calculators

- [Earthwork volume](../earthwork-volume/index.html) — cut and fill over an area.
- [Slope calculator](../slope/index.html) — side slopes in degrees and percent.
- [Pipe volume](../pipe-volume/index.html) — the volume inside a pipe.
- [Concrete footing calculator](../concrete-footing/index.html) — concrete in foundation trenches.
