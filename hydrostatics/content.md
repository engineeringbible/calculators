# Hydrostatics basics calculator

**Summary:** Displacement from draft and block coefficient, TPC, fresh and dock water allowance, trim and end drafts from LCG, LCB and MCTC.

## Introduction

Before any loading, stability or draft-survey work, you need four numbers for the ship at its present draft: the displacement, the tonnes per centimetre immersion (TPC), the moment to change trim one centimetre (MCTC) and the longitudinal centres (LCB, LCF). Hydrostatic tables give them for a specific ship; this calculator rebuilds them from first principles using the main dimensions and form coefficients, then applies them to the classic questions: how much does the ship weigh, how much will she sink per tonne, how much extra draft is allowed in fresh or dock water, and how will she trim for a given centre of gravity.

It is written for deck officers and cadets working through stability syllabus problems, naval architecture students checking a design, and anyone who needs a quick order-of-magnitude displacement when the tables are not to hand.

## Formulas

Volume and displacement:

    ∇ = L × B × T × C_B                [m³]
    Δ = ∇ × ρ                          [t]

- L — length between perpendiculars, m
- B — moulded breadth, m
- T — draft at the longitudinal centre of flotation (even-keel mean draft), m
- C_B — block coefficient at this draft
- ρ — water density, t/m³ (sea water 1.025, fresh water 1.000)

Waterplane area and TPC:

    A_W = L × B × C_W                  [m²]
    TPC = A_W × ρ / 100                [t/cm]

- C_W — waterplane-area coefficient

Fresh water allowance and dock water allowance:

    FWA = Δ / (4 × TPC_SW)             [mm]
    DWA = FWA × (1025 − ρ_DW × 1000) / 25   [mm]

- TPC_SW — TPC in sea water of 1.025 t/m³
- ρ_DW — dock water density, t/m³

Trim:

    Trimming moment = Δ × (LCB − LCG)  [t·m]   (positive = by the stern)
    Trim = Trimming moment / MCTC      [cm]
    Draft aft     = T + Trim/100 × LCF / L
    Draft forward = T − Trim/100 × (L − LCF) / L

- LCB, LCG, LCF — longitudinal centres of buoyancy, gravity and flotation, measured from the aft perpendicular, positive forward, m
- MCTC — moment to change trim 1 cm, t·m/cm, from the hydrostatic tables, or estimated with Barrass's rule MCTC ≈ 7.31 × TPC² / B

## Assumptions and limitations

- C_B and C_W are the coefficients at the draft entered, not the design values. Both fall as the draft decreases; using summer-load values at ballast draft overstates displacement.
- The waterplane coefficient is only needed for TPC and the allowances. If unknown, (1 + 2 C_B) / 3 is a reasonable merchant-ship estimate.
- The FWA formula assumes the ship is in sea water of 1.025 t/m³ and the TPC is constant over the small change of draft. It is a Load Line convention, not an exact result.
- Trim is treated as small: TPC, MCTC and LCF are taken as constant and the draft at the LCF is unchanged by the trim. For trims above about 1 % of the length, use the hydrostatic tables iteratively.
- Barrass's MCTC estimate is an empirical shortcut for merchant hull forms in salt water. Expect ±15 % or worse; the calculator warns when it is used.
- All drafts are moulded. Add the keel thickness for extreme drafts, and apply hog or sag corrections separately if needed.

## Worked example

A box-shaped barge 100 m × 16 m, floating at 5.00 m even keel in fresh water (ρ = 1.000). C_B = C_W = 1. LCB is at 50.0 m from AP, LCG at 49.0 m, LCF at 50.0 m, MCTC 100 t·m/cm.

1. Volume: 100 × 16 × 5 × 1 = 8 000 m³. Displacement: 8 000 × 1.000 = 8 000 t.
2. Waterplane area: 1 600 m². TPC = 1 600 × 1.000 / 100 = 16.0 t/cm.
3. Trimming moment: 8 000 × (50 − 49) = 8 000 t·m by the stern (LCG is aft of LCB).
4. Trim: 8 000 / 100 = 80 cm by the stern.
5. End drafts with LCF amidships: aft 5.00 + 0.80 × 50/100 = 5.40 m; forward 5.00 − 0.80 × 50/100 = 4.60 m.

Move the LCF to 40 m from AP and the same trim splits unevenly: aft 5.00 + 0.80 × 40/100 = 5.32 m, forward 5.00 − 0.80 × 60/100 = 4.52 m. The difference is still 0.80 m.

For the same barge in sea water (ρ = 1.025): Δ = 8 200 t, TPC = 16.4 t/cm, FWA = 8 200 / (4 × 16.4) = 125 mm, and in dock water of 1.010 the DWA is 125 × 15 / 25 = 75 mm.

## FAQ

**Why is the draft measured at the LCF and not amidships?**
When a ship trims, she rotates about the centre of flotation; the draft there does not change. Hydrostatic tables are entered with this draft. For small trims the midship draft is close to it.

**My tables give LCB from midships. What do I enter?**
Convert to the AP reference: LCB from AP = L/2 + (distance forward of midships). A value 2 m aft of midships on a 180 m ship is 88 m from AP.

**What does a negative trim mean here?**
Trim by the head: the forward draft is larger than the aft draft. The text output says "by the head" explicitly.

**How do I use the FWA?**
When loading in fresh water to a sea-water load line, the ship may submerge the mark by the FWA, because she will rise by that amount when she reaches sea water. In dock water of intermediate density use the DWA.

**Is the Barrass MCTC estimate good enough for a loading plan?**
No. It is for checking the order of magnitude when tables are missing. Real trim and stress calculations need the ship's hydrostatic data.

**What is the difference between TPC and displacement per centimetre in the tables?**
They are the same quantity. Tables list TPC at each draft; it increases with draft as the waterplane widens.

**Can I use this for a loaded ship with a known displacement?**
Yes — adjust C_B until the displacement matches the tables at the actual draft, then the trim part uses that displacement.

## Related calculators

- [Draft survey](../draft-survey/index.html) — displacement from six observed drafts with corrections.
- [Initial stability GM and list](../initial-stability/index.html) — the transverse counterpart of this trim calculation.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — uses C_B and the drafts from here.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — the bunkers that change the displacement.
