# Footing size calculator

**Summary:** Plan size of a square, rectangular, round or strip footing from the column or wall load and the allowable soil bearing pressure, with the actual pressure.

## Introduction

How big must a footing be? Big enough that the column load, spread over its area, stays below the pressure the soil can safely carry. The footing itself and the soil backfilled over it also press on the ground, so they use up part of that allowable pressure first. A column carrying 800 kN on soil allowing 200 kPa needs a footing about 2.15 m square once its own weight is counted.

This calculator sizes square, rectangular, round and strip footings from the service load, the allowable bearing pressure, the footing thickness and the soil above it. It rounds the size up to a practical dimension and gives the actual bearing pressure. It is for engineers, builders and students doing the first step of footing design.

## Formulas

Net allowable pressure and required area:

    q_net = q_all − γ_c t − γ_s h_s
    A = P / q_net

Plan dimensions:

    square:     B = √A
    round:      D = √(4A / π)
    rectangle:  B = √(A / r),  L = r B
    strip:      B = w / q_net

Actual pressure with the rounded size:

    q = P / A_rounded + γ_c t + γ_s h_s

- P — service (unfactored) column load; w — load per length of wall
- q_all — allowable bearing pressure; t — footing thickness; h_s — soil above the footing
- γ_c, γ_s — unit weights of concrete and soil; r — length to width ratio

## Assumptions and limitations

- Footing area is sized from service loads, as ACI 318 requires. Factored loads are then used for the thickness, shear and reinforcement, which this page does not design.
- The load is centred. A moment or an offset column makes the pressure uneven, and the edge pressure must stay below the allowable value.
- The allowable bearing pressure comes from a geotechnical report or the building code's presumptive values. Without either, use a conservative value for the soil type.
- Settlement, frost depth and minimum footing sizes in the code also apply.

## Worked example

A column carries 800 kN of dead and live load. The soil allows 200 kPa. The footing will be 0.5 m thick with 0.5 m of soil on top. What size is needed?

1. Weight of footing and soil: 24 × 0.5 + 18 × 0.5 = 21 kPa.
2. Net allowable pressure: 200 − 21 = 179 kPa.
3. Required area: 800 / 179 = 4.469 m².
4. Square side: √4.469 = 2.114 m, rounded up to 2.15 m.
5. Actual pressure: 800 / 2.15² + 21 = 194.1 kPa, below 200 kPa.

A 2.15 × 2.15 m footing works; its thickness and reinforcement then come from the factored loads.

## FAQ

**How do I calculate footing size?**
Divide the column load by the net allowable soil pressure to get the area, then take the square root for a square footing.

**What is a typical allowable bearing pressure?**
Building codes give presumptive values such as 1 500 psf (72 kPa) for clay and 2 000 to 3 000 psf (96 to 144 kPa) for sand and gravel. A geotechnical report usually allows more.

**Why subtract the footing's weight?**
The soil carries the footing and the backfill as well as the column. Only what is left of the allowable pressure is available for the column load.

**Should I use factored or unfactored loads?**
Unfactored service loads for the footing area. Factored loads for the concrete design of the footing.

**How thick should a footing be?**
At least 6 in (150 mm) above the bottom reinforcement under ACI 318, and usually much more for shear. Thickness comes from punching and beam shear checks.

**How deep should a footing be?**
Below the frost line and on undisturbed soil of adequate strength. Local codes set minimum depths.

## Related calculators

- [Soil bearing capacity](../soil-bearing/index.html) — bearing capacity from soil strength.
- [Concrete footing calculator](../concrete-footing/index.html) — the concrete for the footing.
- [Concrete column and post hole calculator](../concrete-column/index.html) — the column above it.
- [Rebar weight and quantity](../rebar-weight/index.html) — the reinforcement.
