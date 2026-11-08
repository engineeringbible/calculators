# Consolidation settlement calculator (clay layer)

**Summary:** Primary consolidation settlement of a normally or over-consolidated clay layer, and the time to reach a degree of consolidation by Terzaghi's theory.

## Introduction

A saturated clay loaded by a fill or a building settles slowly as water is squeezed out of its pores. This is primary consolidation. Its size depends on how compressible the clay is and on how far the new stress goes past the highest stress the clay has carried before. A 3 m clay layer loaded from 80 to 140 kPa, with a preconsolidation pressure of 120 kPa, settles about 46 mm.

This calculator gives the primary consolidation settlement of a clay layer for normally and over-consolidated clays. It also gives the time to reach a chosen degree of consolidation, the time for 50 %, and the settlement after a given time, from Terzaghi's one-dimensional theory. It is for geotechnical engineers, students and designers of embankments and shallow foundations on clay.

## Formulas

Settlement, with σ'1 = σ'0 + Δσ:

    normally consolidated:            S = Cc H/(1 + e0) log(σ'1/σ'0)
    over-consolidated, σ'1 ≤ σ'p:     S = Cr H/(1 + e0) log(σ'1/σ'0)
    over-consolidated, σ'1 > σ'p:     S = Cr H/(1 + e0) log(σ'p/σ'0) + Cc H/(1 + e0) log(σ'1/σ'p)

Rate of consolidation (Terzaghi):

    T_v = c_v t / H_dr²
    U = 1 − Σ (2/M²) exp(−M² T_v),   M = π(2m + 1)/2,  m = 0, 1, 2 …
    T_v ≈ (π/4) U²  for U ≤ 60 %;    T_v ≈ 1.781 − 0.933 log(100 − U%)  for U > 60 %

- H — layer thickness; e0 — initial void ratio; Cc, Cr — compression and recompression indices
- σ'0 — present effective stress at mid-layer; σ'p — preconsolidation pressure; Δσ — stress increase
- c_v — coefficient of consolidation; H_dr — drainage path, H/2 when both faces drain

## Assumptions and limitations

- The clay is saturated and laterally confined, and the stresses are taken at mid-layer. Divide thick layers into sublayers and add their settlements.
- The parameters come from an oedometer test (ASTM D2435) on undisturbed samples. Sample disturbance lowers the apparent σ'p and raises the settlement.
- Terzaghi's theory assumes a constant c_v and a load applied at once. Field consolidation is often faster than predicted, because of thin sand layers in the clay.
- Immediate settlement and secondary compression are not included. Secondary compression can be large in organic and very soft clays.

## Worked example

A 3 m clay layer lies between sand layers. At mid-layer σ'0 = 80 kPa, the oedometer gives σ'p = 120 kPa, e0 = 0.9, Cc = 0.30 and Cr = 0.05. A fill adds Δσ = 60 kPa. c_v is 2 m²/year.

1. OCR = 120 / 80 = 1.50. The final stress, 140 kPa, is above σ'p, so both branches apply.
2. Recompression: 0.05 × 3 / 1.9 × log(120/80) = 0.0139 m.
3. Virgin compression: 0.30 × 3 / 1.9 × log(140/120) = 0.0317 m.
4. Settlement: 13.9 + 31.7 = 45.6 mm.
5. Double drainage: H_dr = 1.5 m. For 90 % consolidation T_v = 0.848, so t = 0.848 × 1.5² / 2 = 0.954 year.

After six months T_v = 0.444, the layer is 72.9 % consolidated and has settled 33.3 mm.

## FAQ

**What is consolidation settlement?**
The slow settlement of a saturated clay as pore water drains out under a new load. It can take months to decades, unlike the immediate settlement of sand.

**What is the difference between normally and over-consolidated clay?**
A normally consolidated clay has never carried more than its present effective stress. An over-consolidated clay has, so it is much stiffer until the load passes its preconsolidation pressure.

**How do I estimate the compression index?**
From an oedometer test. Without one, Cc ≈ 0.009 (LL − 10) for normally consolidated clays of low sensitivity, with LL the liquid limit in percent.

**What is a typical recompression index?**
About one fifth to one tenth of Cc. It applies to reloading below the preconsolidation pressure.

**What does double drainage mean?**
Water can leave through both the top and the bottom of the layer, so the longest drainage path is half the thickness. Since time grows with the square of the path, double drainage is four times faster.

**How can consolidation be speeded up?**
Preloading with a surcharge and installing vertical wick drains, which shorten the drainage path to half the drain spacing.

## Related calculators

- [Soil bearing capacity](../soil-bearing/index.html) — bearing failure of footings on the clay.
- [Footing size calculator](../footing-size/index.html) — size of the footing that loads the layer.
- [Soil compaction calculator](../proctor-compaction/index.html) — compaction of the fill placed on top.
- [Pile capacity calculator](../pile-capacity/index.html) — piles through the clay when settlement is too large.
