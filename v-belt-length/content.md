# V-belt length and centre distance calculator

**Summary:** V-belt pitch length from sheave pitch diameters and centre distance, or the centre distance for a standard belt, with the exact formula as a check.

## Introduction

V-belts are sold in standard pitch lengths, so a drive design has two questions: what length fits a given centre distance, and what centre distance a standard belt gives. Shigley's approximate formula answers the first. Sheaves of 100 and 250 mm pitch diameter on 600 mm centres need a pitch length of about 1 759 mm.

This calculator gives the pitch length from the centre distance, or the centre distance for a belt length you choose from a catalogue. It shows the standard approximate result next to the exact geometry, so you can see how close the approximation is. It also gives the wrap angle on the small sheave. It is for engineers and maintenance staff selecting or replacing V-belts.

## Formulas

Approximate pitch length (Shigley eq. 17-16a):

    L_p = 2C + π (D + d) / 2 + (D − d)² / (4C)

Centre distance for a pitch length (eq. 17-16b):

    C = ¼ { [L_p − π (D + d)/2] + √( [L_p − π (D + d)/2]² − 2 (D − d)² ) }

Exact open-belt length (eq. 17-1), used as the check:

    φ = asin((D − d) / (2C))
    L = √(4C² − (D − d)²) + ½ [D (π + 2φ) + d (π − 2φ)]

- D, d — pitch diameters of the large and small sheaves
- C — centre distance; L_p — belt pitch length
- Wrap on the small sheave: θ = π − 2φ

## Assumptions and limitations

- Use pitch diameters and pitch lengths. Catalogues may also list inside or outside lengths, which differ from the pitch length by an amount that depends on the belt section.
- The approximate formula keeps only the first terms of a series. For normal drives it is within a fraction of a millimetre; for large ratios on short centres the error reaches millimetres.
- The centre distance is the nominal value with the belt fitted. Allow adjustment below it to fit the belt and above it for take-up as the belt stretches.
- The drive has two sheaves and no idler. Below about 120° of wrap on the small sheave, the belt's power rating must be reduced.

## Worked example

A drive has sheaves of 100 and 250 mm pitch diameter. The nearest standard belt has a pitch length of 1 800 mm. What centre distance does it give?

1. Term in brackets: 1 800 − π × 350 / 2 = 1 800 − 549.78 = 1 250.22 mm.
2. Square root: √(1 250.22² − 2 × 150²) = √(1 563 050 − 45 000) = 1 232.09 mm.
3. Centre distance: ¼ × (1 250.22 + 1 232.09) = 620.58 mm.
4. Exact geometry, solved for the same 1 800 mm: 620.57 mm.

The two answers differ by less than 0.01 mm. Set the motor base to give about 621 mm, with adjustment either side for fitting and take-up.

## FAQ

**How do I measure a V-belt's length?**
Read the size code printed on the belt and look it up in the maker's table. A tape round the outside of a used belt gives the outside length, which is longer than the pitch length.

**What is the pitch diameter of a sheave?**
The diameter at the belt's neutral layer, where it neither stretches nor shortens. It is smaller than the outside diameter of the sheave.

**How accurate is the approximate formula?**
For the example drive it is 0.012 mm short of the exact length. It becomes less accurate when the sheaves differ a lot and the centres are close.

**What centre distance should a V-belt drive have?**
Shigley suggests at least the large sheave diameter and at most three times the sum of the diameters. Longer drives can whip; shorter ones lose wrap.

**What wrap angle is acceptable?**
180° on equal sheaves. Below about 120° on the small sheave, the power a belt can carry falls and slip becomes likely.

**How do I find the belt length for a new drive?**
Choose the centre distance, calculate the pitch length, pick the nearest standard length, then recalculate the centre distance for that belt.

## Related calculators

- [Belt and pulley calculator](../belt-pulley/index.html) — speeds, belt speed and crossed belts.
- [Chain and sprocket drive](../chain-sprocket/index.html) — the same problem with roller chain.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — speed ratios with gears.
- [Torque, power and speed](../torque-power-rpm/index.html) — torque on each shaft.
