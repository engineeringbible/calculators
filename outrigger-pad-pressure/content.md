# Crane outrigger pad bearing pressure calculator

**Summary:** Outrigger load, float and mat bearing pressure, effective mat area by load spread, ground utilisation and required mat size for a mobile crane.

## Introduction

Most mobile crane overturns start at the ground: an outrigger punches through soft ground, a void or a buried service, and the crane tips. The check is simple in principle: the outrigger load divided by the area that carries it must stay below what the ground can bear. The difficulty is the area, because a float of a few tenths of a square metre puts megapascals on the ground and a mat only helps if it is stiff enough to spread the load. This calculator takes the outrigger load (from the crane maker or a planning estimate), the float and mat sizes, treats the mat either as rigid (with a bending check) or as spreading the load through its thickness, and compares the result with BS 8004 presumed values or a tested allowable pressure.

It is for lift planners, appointed persons, port and site engineers, and students of temporary works.

## Formulas

    F = manufacturer value,  or ≈ 0.65 × (crane + load + rigging) g,  or (crane + load + rigging) g
    q_float = F / A_float
    rigid mat:  q = (F + W_mat) / (L_mat B_mat),   bending σ = 3 q c² / t²,  c = largest overhang beyond the float
    spread:     L_eff = min(L_mat, L_float + 2 t tan θ),  q = F / (L_eff B_eff) + W_mat / A_mat
    required area = F / q_allow,   square side = √(F / q_allow)

BS 8004 presumed allowable values (lower bounds): rock 4 000, dense gravel 600, compact sand 300, very stiff clay 300, medium dense gravel 200, stiff clay 150, medium dense sand 100, firm clay 75 kPa; soft or loose ground must be tested.

## Assumptions and limitations

- Uniform pressure under float and mat; the rigid-mat case is only as good as the mat's stiffness and strength.
- Presumed values guard against shear failure, not settlement; they need foundation widths of about 1 m and a low water table.
- No voids, services, slopes, excavations or dynamic effects; marginal cases need a temporary works design.

## Worked example

A 60 t crane lifting 10 t: the manufacturer's outrigger load for the lift is 400 kN on a 0.6 × 0.6 m float; 2 × 2 m timber mat 150 mm thick weighing 0.5 t; stiff clay.

1. Under the float: 400/0.36 = 1 111 kPa, far beyond any soil.
2. Rigid mat: (400 + 4.9)/4 = 101 kPa, 67 % of the 150 kPa presumed for stiff clay: acceptable.
3. Bending: overhang 0.7 m, σ = 3 × 101 × 0.49/0.0225 = 6.6 MPa, within 10 MPa for hardwood: the rigid assumption holds.
4. If the mat only spread the load at 45° through its 150 mm thickness, the effective area would be 0.9 × 0.9 m and the pressure 495 kPa: a flexible mat this size would fail the check.
5. Fully effective, the ground needs at least 2.67 m², a 1.63 m square mat.

The planning estimate 0.65 × 70.5 t × g = 449 kN would have given 114 kPa; the upper bound of all weight on one outrigger 691 kN.

## FAQ

**Where do I get the outrigger load?**
From the crane manufacturer's lift-planning software or outrigger load chart for the configuration, radius and slew angle; the estimates are for early planning only.

**Rigid or spread?**
Steel and engineered composite mats sized for the load act close to rigid; thin timber mats or plates do not, and their effective area grows only with their thickness. The bending check tells you whether the rigid assumption is plausible.

**Are BS 8004 values still valid?**
They are presumed values for preliminary design from a withdrawn standard; Eurocode 7 governs design, and a site investigation or plate bearing test should confirm marginal ground.

**Why is the mat weight added?**
It is part of the load on the ground; on large steel mats it is not negligible.

**What about concrete slabs and hardstanding?**
Use the slab's designed capacity (punching shear and bending) as the allowable value; the soil table does not apply.

**What margin should I keep?**
Dynamic effects, wind and uneven ground are not in the calculation; many planners keep utilisation well below 100 % or apply a factor to the allowable value.

## Related calculators

- [Lifting sling loads](../lifting-sling/index.html) — the rigging between hook and load.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — permanent crane bases.
- [Earthwork cut and fill volumes](../earthwork-volume/index.html) — preparing a crane platform.
- [Beam deflection](../beam-deflection/index.html) — mat and grillage bending.
- [Column buckling](../column-buckling/index.html) — outrigger beams and props.
