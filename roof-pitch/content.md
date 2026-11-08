# Roof pitch calculator: rafters, area and shingles

**Summary:** Roof pitch in x/12, degrees and percent, gable rafter length, ridge height, roof area from the footprint, and shingle squares and bundles.

## Introduction

What is roof pitch? It is the rise of the roof in inches for every 12 in of horizontal run. A 6/12 roof rises 6 in per foot, which is 26.6° or a 50 % grade. Multiply any plan length by the pitch multiplier, √(1 + (pitch/12)²), to get the length along the slope. For 6/12 that multiplier is 1.118, so a 24 × 40 ft house with 1 ft overhangs has 1 221 ft² of roof.

This calculator converts pitch, angle and percent, and works out a gable roof from its footprint: rafter length, ridge height, roof area, roofing squares and shingle bundles. It is for roofers, framers and homeowners pricing a new roof. For general slopes, ramps and grades, use the slope calculator.

## Formulas

Pitch, angle and multiplier:

    s = pitch / 12 = tan θ
    k = √(1 + s²)

Gable roof:

    rafter = (span / 2 + eave overhang) × k
    ridge height = (span / 2) × s
    area = (span + 2 × eave) × (length + 2 × rake) × k
    squares = area × (1 + waste) / 100 ft²
    bundles = squares × 3, rounded up

- pitch — rise in inches per 12 in of run; θ — roof angle; s — slope as a fraction
- span — building width from wall to wall; length — along the ridge
- eave, rake — horizontal overhangs at the eaves and at the gable ends
- k — pitch multiplier, slope length per unit of horizontal run

| Pitch | Angle | Multiplier |
|---|---|---|
| 4/12 | 18.4° | 1.054 |
| 6/12 | 26.6° | 1.118 |
| 8/12 | 33.7° | 1.202 |
| 12/12 | 45.0° | 1.414 |

## Assumptions and limitations

- The roof is a simple gable with two equal planes over a rectangle. Hips, valleys and dormers need each plane added on its own.
- The rafter length runs from the ridge centre line to the end of the overhang. Deduct half the ridge board thickness when you cut it.
- A square is 100 ft² of roof. Most three-tab and laminated shingles come three bundles to the square, but check your product.
- The waste allowance covers starter rows, ridge caps and cutting. A plain gable needs about 10 %; cut-up roofs need more.
- Asphalt shingles need a slope of at least 2/12. From 2/12 up to 4/12 the IRC requires two layers of underlayment.

## Worked example

A house is 24 ft wide and 40 ft long with a 6/12 gable roof and 1 ft overhangs at the eaves and the gables. Find the rafter length, the roof area and the shingles with 10 % waste.

1. Multiplier: √(1 + 0.5²) = 1.118.
2. Rafter: (24 / 2 + 1) × 1.118 = 14.53 ft.
3. Ridge height above the wall plate: 12 × 0.5 = 6 ft.
4. Plan area with overhangs: 26 × 42 = 1 092 ft².
5. Roof area: 1 092 × 1.118 = 1 221 ft².
6. Squares with waste: 1 221 × 1.10 / 100 = 13.43.
7. Bundles: 13.43 × 3 = 40.3, so buy 41 bundles.

The roof angle is 26.6°. Rafters are usually bought in 2 ft steps, so a 16 ft board covers the 14.53 ft rafter with room for the cuts.

## FAQ

**How do I convert roof pitch to degrees?**
Take the arctangent of the pitch divided by 12. A 4/12 roof is 18.4°, 6/12 is 26.6°, 8/12 is 33.7° and 12/12 is 45°.

**What is a pitch multiplier?**
The length along the roof for each unit of horizontal run, √(1 + (pitch/12)²). Multiply the plan area by it to get the roof area.

**How many bundles of shingles are in a square?**
Most standard shingles come three bundles to a square of 100 ft². Some heavier products take more bundles per square, so check the wrapper.

**How many squares is a 2 000 ft² roof?**
20 squares, or 22 with 10 % waste, which is 66 bundles at three per square.

**What is the minimum pitch for asphalt shingles?**
2/12 under IRC R905.2.2. Slopes from 2/12 up to 4/12 need a double layer of underlayment.

**How do I find the pitch of an existing roof?**
Hold a level 12 in long against the roof, horizontal, and measure the vertical distance from its end down to the roof. That distance in inches is the pitch.

## Related calculators

- [Slope calculator](../slope/index.html) — percent grade, degrees, ratio and pitch for any slope.
- [Stair calculator](../stair-stringer/index.html) — rise and run of a stair.
- [Snow load calculator](../snow-load/index.html) — snow on the roof, which depends on its slope.
- [Wind load calculator](../wind-load/index.html) — wind pressure on the roof and walls.
