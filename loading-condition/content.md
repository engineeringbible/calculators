# Loading condition from an item list calculator

**Summary:** Displacement, deadweight, KG with free surface, GM, trim, end drafts and list from a pasted list of weights and centres and a hydrostatic table.

## Introduction

A loading condition is a table of weights and their centres: lightship, cargo, fuel, water, ballast and stores. Summing their moments gives the displacement and the centre of gravity; the hydrostatic table at that displacement gives KM, the centre of buoyancy and the moment to change trim; from those follow GM, trim, the end drafts and any list. This calculator does that arithmetic from two pasted lists, the items and the hydrostatic table from the stability booklet, the way it is done by hand before trusting a loading computer.

It is for chief officers checking a loading computer, cadets learning loading calculations, and planners building conditions for small craft without a loading instrument.

## Formulas

    Displacement:        Δ = Σ w
    Centres:             KG = Σ w·VCG / Δ,  LCG = Σ w·LCG / Δ,  TCG = Σ w·TCG / Δ
    Free surface:        FSC = Σ FSM / Δ,   KG_fluid = KG + FSC
    Metacentric height:  GM = KM − KG_fluid
    Trim (by the stern): t = Δ (LCB − LCG) / (100 MCTC)
    Drafts:              T_aft = T + t · x_F / L,   T_fwd = T − t · (L − x_F) / L
    List:                tan φ = TCG / GM

- KM, LCB, LCF (x_F), MCTC and the draft T at the LCF are interpolated in the hydrostatic table by displacement.

## Assumptions and limitations

- The first item is the lightship; deadweight is everything else.
- Even-keel hydrostatics with the small-trim method; large trims need trimmed hydrostatics.
- The list formula is for small angles and positive GM.
- Longitudinal strength and the stability criteria are checked elsewhere.

## Worked example

The default condition is a 140 m general cargo ship: 4200 t lightship, 8200 t of cargo in four holds, fuel, water, fore peak ballast and stores.

1. Displacement 13 690 t, deadweight 9490 t; KG 7.102 m; free surface of the fuel and water tanks 420 t·m, a correction of 0.031 m.
2. At 13 690 t the table gives a draft of 6.79 m at the LCF, KM 8.43 m, LCB 71.26 m, LCF 68.13 m and MCTC 182.9 t·m/cm.
3. GM = 8.43 − 7.13 = 1.30 m.
4. LCG is 69.93 m, 1.34 m aft of the LCB: trim 13 690 × 1.34 / 18 289 = 1.00 m by the stern, drafts 6.28 m forward and 7.28 m aft.
5. The 20 t difference between the port and starboard fuel tanks lists the ship 0.26° to port.

## FAQ

**Where do the free-surface moments come from?**
From the tank tables in the stability booklet: FSM = ρ × i, the moment of inertia of the liquid surface times the liquid density. Pressed-up and empty tanks have none.

**Why is the draft read at the LCF?**
A ship trims about its centre of flotation, so the draft there is unchanged by trim and equals the even-keel draft of the table.

**Can I use a table in fresh water?**
Yes: give the table density and the actual water density. The displacement is converted before interpolation, and MCTC and TPC are scaled.

**What if the list is large?**
The small-angle formula holds for a few degrees. With small GM, a list may also be an angle of loll, which must never be corrected by moving weights to the high side first.

**Does this replace the loading computer?**
No. It is an independent check of displacement, centre of gravity, GM and drafts.

## Related calculators

- [Hydrostatics](../hydrostatics/index.html) — displacement, TPC and trim from the form coefficients.
- [Initial stability](../initial-stability/index.html) — GM, free surface and list from a single weight shift.
- [GZ curve and intact stability criteria](../gz-criteria/index.html) — the stability criteria for this condition.
- [Dry-docking critical instant](../drydock-critical-instant/index.html) — this condition arriving at a dry dock.
