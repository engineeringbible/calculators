# Inclining experiment calculator

**Summary:** GM and lightship KG from an inclining test: weight-movement moments against pendulum tangents by least squares, free surface and the lightweight survey.

## Introduction

The lightship centre of gravity of every new ship, and of every ship after major conversion, is found by an inclining experiment. Known weights are moved across the deck in steps, the heel is measured on two or three long pendulums, and the ratio of heeling moment to the tangent of the heel gives the metacentric height. With KM from the hydrostatics, that gives KG. A lightweight survey then removes everything on board that is not part of the lightship and adds what is missing. This calculator performs the analysis the 2008 IS Code describes: the least-squares line through all readings, the quality checks, the free-surface correction and the survey.

It is for naval architects and surveyors conducting or reviewing inclining tests, and for students of ship stability.

## Formulas

    Tangent of heel:     tan θ = deflection / pendulum length   (mean of the pendulums)
    Fit:                 tan θ = a + b · W·x   (least squares, not forced through the origin)
    Metacentric height:  GM = 1 / (Δ · b)
    Centre of gravity:   KG_fluid = KM − GM;   KG = KG_fluid − FSM / Δ
    Lightship:           Δ_L = Δ + Σ w;   KG_L = (Δ · KG + Σ w · VCG) / Δ_L

- W·x — cumulative heeling moment of the weight movements; Δ — displacement at the test; FSM — free-surface moment of slack tanks; w — survey items, positive to add and negative to remove.

## Assumptions and limitations

- Small angles: heel between 1° and 4°, where tan θ is proportional to the heeling moment.
- Displacement and KM come from the drafts and hydrostatics at the actual trim.
- Only the vertical centre is computed; LCG and hull deflection corrections are separate.
- Readings must be taken with no wind, slack mooring lines and no liquids or people moving.

## Worked example

A ship of 9000 t displacement at the test has KM 9.50 m. Two pendulums of 6.0 m and 5.5 m record the default readings for moments of 0, ±160 and ±320 t·m. Slack tanks have a free-surface moment of 150 t·m.

1. The largest moment, 320 t·m, deflects the 6 m pendulum 178 mm: tan θ = 0.0297, a heel of 1.7°.
2. The least-squares slope gives GM = 1.201 m with R² = 0.99999; no reading is off the line.
3. KG including free surface = 9.50 − 1.201 = 8.299 m; free-surface correction 150/9000 = 0.017 m; solid KG 8.282 m.
4. Removing the 40 t of test weights, people and settling-tank fuel and adding the missing davit gives a lightship of 8948.5 t at KG 8.27 m.

## FAQ

**Why not force the line through the origin?**
Every reading carries the same small errors in the zero position. The IS Code guidance says no single point is more significant than another, and a free line absorbs a constant zero error.

**How long should the pendulums be?**
Long enough for 15 cm of deflection each side, usually at least 3 m and preferably 4–6 m. Different lengths on each pendulum help detect copying between recorders.

**How many weight movements are needed?**
The standard test uses eight: four to each side, with the zero point checked again at the end. Six movements with a good straight line are acceptable.

**What does a poor R² mean?**
Something other than the weights was heeling the ship: wind, mooring lines, a hose, moving liquid or people. Find the cause and repeat those movements.

**Why remove the free-surface effect?**
The test measures the fluid GM of the test condition. The lightship KG must be the solid one, because the tanks will be in a different state in service.

## Related calculators

- [Initial stability](../initial-stability/index.html) — GM, free surface and list in service.
- [GZ curve and intact stability criteria](../gz-criteria/index.html) — checking loading conditions with the new lightship.
- [Loading condition from an item list](../loading-condition/index.html) — building conditions from the lightship.
- [Hydrostatics](../hydrostatics/index.html) — displacement and KM for the test draft.
