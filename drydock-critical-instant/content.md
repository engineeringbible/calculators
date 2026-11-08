# Dry-docking critical instant calculator

**Summary:** Upthrust on the keel blocks and the virtual loss of GM at the critical instant of dry-docking, the draft then, and the largest safe trim.

## Introduction

A ship usually enters a dry dock trimmed slightly by the stern. As the water is pumped out, the after end of the keel lands on the blocks first and carries a growing upthrust, which lifts the stern and takes the trim off. The upthrust acts at the keel, so it reduces the ship's stability as if a weight had been removed from the bottom. The most dangerous moment is the critical instant, just before the keel lands along its whole length and the side blocks can take load. This calculator finds the upthrust, the loss of GM by both textbook methods, the draft at that instant and the largest trim that keeps a required GM.

It is for chief officers and masters preparing a docking, dock masters checking the arrival condition, and students of ship stability.

## Formulas

    Trim:              t = (T_aft − T_fwd) × 100   (cm)
    Upthrust:          P = MCTC × t / l
    Method 1:          loss of GM = P × KM / W
    Method 2:          loss of GM = P × KG / (W − P),  with KM at the critical-instant draft
    Draft at the LCF:  T_LCF = T_aft + (T_fwd − T_aft) × LCF / L_BP
    Critical instant:  even-keel draft = T_LCF − P / TPC
    Largest trim:      P_max = W (GM − GM_required) / KM,   t_max = P_max × l / MCTC

- l — distance from the first point of contact (aft end of the keel) to the LCF; W — displacement.

## Assumptions and limitations

- Hydrostatic values are those before docking and held constant.
- The free-surface effect of slack tanks is included in GM.
- Side blocks and shores carry no load before the critical instant.
- The docking plan and the dock master's requirements govern.

## Worked example

A ship of 6000 t floats at 4.15 m forward and 4.45 m aft, 30 cm by the stern. MCTC is 90 t·m/cm, the LCF is 45 m forward of the after end of the keel, KM is 7.5 m and KG 6.0 m.

1. Upthrust at the critical instant: P = 90 × 30 / 45 = 60 t.
2. GM before docking: 7.5 − 6.0 = 1.50 m.
3. Method 1: loss 60 × 7.5 / 6000 = 0.075 m, GM 1.425 m. Method 2: loss 60 × 6.0 / 5940 = 0.061 m, GM 1.439 m.
4. The draft at the LCF is 4.34 m; the ship rises 60/15 = 4 cm, so it sits on the blocks at 4.30 m even keel.

## FAQ

**Why does the upthrust reduce GM?**
It acts at the keel, below the centre of gravity. Removing support from the water and replacing it with a force at the keel has the same effect as removing a weight from the keel: G rises, or equivalently M falls.

**Which method is right?**
Both are standard. Method 1 keeps the displacement and reduces the buoyancy; method 2 reduces the displacement and raises G. They differ slightly, and the smaller GM is the safe one to use.

**Why dock trimmed by the stern at all?**
So that the ship lands at a known point and settles progressively, and so that the stern can be checked against the blocks before the bow lands.

**How can the GM at the critical instant be improved?**
Reduce the trim, empty high tanks, fill low ballast tanks, and press up or empty slack tanks to remove free surface.

**What about grounding?**
Grounding at one end produces the same upthrust and loss of GM; the same formulas apply with the grounding point as the point of contact.

## Related calculators

- [Initial stability](../initial-stability/index.html) — GM, free surface and list.
- [Hydrostatics](../hydrostatics/index.html) — MCTC, TPC and LCF at the arrival draft.
- [Bilged compartment](../bilged-compartment/index.html) — stability after flooding.
- [Draft survey](../draft-survey/index.html) — the displacement from the drafts.
