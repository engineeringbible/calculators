# Rebar weight and quantity calculator

**Summary:** Rebar weight per foot or metre for US #3–#18 and metric bars, and the number, length and weight of bars in a slab grid at any spacing.

## Introduction

Reinforcing bar is ordered by weight but placed by count and spacing. A #4 bar, half an inch across, weighs 0.668 lb per foot; a 12 mm metric bar weighs 0.888 kg per metre. A 20 × 20 ft slab with #4 bars at 12 in each way needs 40 bars, 780 ft of bar and about 520 lb of steel before laps.

This calculator gives the weight per length of US bars #3 to #18 and metric bars 6 to 50 mm, and counts the bars, total length and weight either from a number of pieces or from a slab or wall grid at a given spacing. It also gives the steel area per foot or metre of width, the figure a designer checks against the required reinforcement.

## Formulas

Metric bar mass per metre (the d²/162 rule):

    m' = 7 850 × π d² / 4 = 0.006165 d²    kg/m, d in mm

Bars in a grid, each way:

    N = floor( (S − 2c) / s ) + 1,   each of length L − 2c
    total length = Σ N × (L − 2c) × layers × (1 + allowance)

Steel area per width:

    A_s = A_bar / s        in² per ft or mm² per m

- S — the span across which the bars are spaced; L — the length they run
- s — spacing; c — edge cover
- US bars: area and unit weight from ASTM A615 Table 1 (#4: 0.20 in², 0.668 lb/ft)

## Assumptions and limitations

- US unit weights are the ASTM A615 nominal values. Metric bars use 7 850 kg/m³ on the nominal diameter.
- Grid bars run the full length less the cover at each end. Hooks, bends, laps and chairs go into the allowance percentage. A lap is typically 40 to 60 bar diameters.
- The bar size and spacing come from the structural design and the code (ACI 318, EN 1992-1-1). This page estimates quantities for ordering.
- The bar count rounds down the spaces and adds one bar, so the edge bars sit at the cover. Some detailers add an extra bar where the last space is short.

## Worked example

A 20 × 20 ft slab has a single mat of #4 bars at 12 in each way, with 3 in of cover at the edges. How much steel is needed?

1. Bars across 20 ft: (240 − 2 × 3) / 12 = 19.5, so floor 19 + 1 = 20 bars.
2. Each bar is 240 − 6 = 234 in, or 19.5 ft long. The other direction is the same.
3. Total: 40 bars, 40 × 19.5 = 780 ft.
4. Weight: 780 × 0.668 = 521.0 lb.

With a 10 % allowance for laps and waste, order about 575 lb, which is 43 bars of 20 ft.

## FAQ

**How much does #4 rebar weigh?**
0.668 lb per foot, so a 20 ft bar weighs 13.4 lb. #3 is 0.376 and #5 is 1.043 lb per foot.

**How much does 12 mm rebar weigh per metre?**
0.888 kg/m. A 12 m bar weighs 10.7 kg.

**What does the rebar number mean?**
The US bar number is the diameter in eighths of an inch up to #8: #4 is 4/8 = 0.5 in. Larger bars are rounded equivalents.

**How do I calculate the number of bars in a slab?**
Subtract twice the cover from the width, divide by the spacing, round down and add one. Do the same in the other direction.

**What is the d²/162 rule?**
The weight of a metric bar in kg/m is about its diameter in mm squared divided by 162: 16² / 162 = 1.58 kg/m.

**How much rebar per cubic yard of concrete?**
It varies with the element: slabs on grade often 50 to 100 lb per cubic yard, structural slabs and beams 150 to 300 lb. The design sets it.

## Related calculators

- [Steel and metal weight](../metal-weight/index.html) — plate, bar and section weights.
- [Concrete slab calculator](../concrete-slab/index.html) — the concrete for the slab.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — mix materials and steel ratios.
- [Concrete footing calculator](../concrete-footing/index.html) — footing quantities.
