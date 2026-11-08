# Bilged compartment (lost buoyancy) calculator

**Summary:** Sinkage, end drafts, trim, freeboard and the new GM of a box-shaped vessel after a compartment is bilged, by the lost buoyancy method.

## Introduction

When a compartment is holed below the waterline, the sea floods it and the buoyancy it provided is lost. The vessel sinks until the intact hull makes up the lost volume, trims towards the damage if the compartment is not amidships, and its stability changes because part of the waterplane is gone. The lost buoyancy method treats the flooded space as no longer part of the ship: displacement and KG stay the same while KB, BM and the waterplane change. This calculator applies it to a box-shaped vessel, the standard case of examinations and a useful first estimate for barges and pontoons.

It is for deck officers and cadets studying damage stability, and for anyone making a quick estimate for a barge or pontoon.

## Formulas

    Lost volume:            v = μ l b d
    Intact waterplane:      A' = L B − μ l b
    Parallel sinkage:       s = v / A'
    New KB:                 KB' = d/2 + v (d + s) / (2 V)
    Transverse inertia:     I_T' = L B³/12 − μ l b³/12,   BM' = I_T' / V
    GM after bilging:       GM' = KB' + BM' − KG
    Centre of flotation:    x_F = −μ l b x / A'
    Longitudinal inertia:   I_L' = B L³/12 − μ b l³/12 − μ l b x² − A' x_F²
    Trim:                   tan τ = v (x − x_F) / I_L'
    End drafts:             T_F = d + s + tan τ (L/2 − x_F),   T_A = d + s − tan τ (L/2 + x_F)

- μ — permeability; l, b — compartment length and breadth; x — compartment centre from amidships, positive forward; V = L B d.

## Assumptions and limitations

- Box-shaped vessel; the compartment is centred on the centreline and open from the keel to above the final waterline.
- Small trims; a wing compartment that also causes list is not covered.
- Initial GM only; damage stability rules assess the whole GZ curve and intermediate flooding.

## Worked example

A box-shaped vessel 75 m long and 10 m wide floats at 6 m draft with KG 4 m. A midship compartment 15 m long is bilged, permeability 1.

1. Lost volume 15 × 10 × 6 = 900 m³; intact waterplane 60 × 10 = 600 m²; sinkage 1.5 m, new draft 7.5 m.
2. KB rises from 3.0 m to 3.75 m.
3. BM falls from 1.389 m to (60 × 10³/12)/4500 = 1.111 m.
4. GM rises from 0.389 m to 0.861 m: for a box, the rise of KB outweighs the lost waterplane.

## FAQ

**Lost buoyancy or added weight?**
Both give the same final waterline. Lost buoyancy keeps displacement and KG fixed, so the GM it gives is directly comparable with the intact one; added weight treats the water as cargo and changes both.

**What is permeability?**
The fraction of a compartment's volume that water can occupy. An empty void is close to 1; machinery spaces about 0.85; stores about 0.60.

**Why can GM increase after bilging?**
In a box, KB rises by half the sinkage while BM falls only by the lost waterplane share. For real hull forms, and especially for wing compartments, the result can be the opposite.

**Why does an end compartment trim the ship so much?**
The lost buoyancy is far from the centre of flotation, and the intact waterplane's centre moves away from the damage, so the trimming lever is long.

**Is this a damage stability assessment?**
No. It gives the floating position and initial GM. Rules require the whole GZ curve, heel limits and the margin line to be checked for each damage case.

## Related calculators

- [Initial stability](../initial-stability/index.html) — GM, free surface and list.
- [Hydrostatics](../hydrostatics/index.html) — drafts and trim of the intact ship.
- [Dry-docking critical instant](../drydock-critical-instant/index.html) — another case of a force at the keel.
- [GZ curve and intact stability criteria](../gz-criteria/index.html) — the intact stability standard.
