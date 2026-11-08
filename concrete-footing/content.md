# Concrete footing calculator

**Summary:** Concrete for strip footings under walls or square pad footings under posts, in cubic yards or m³ with waste, premix bags, weight and cost.

## Introduction

Footings spread the weight of a building into the ground. Walls sit on continuous strip footings, and posts or columns sit on square pad footings. Both are simple boxes of concrete, so the volume is length times width times depth, but two mistakes are common: counting the corners of a strip footing twice, and forgetting that trenches are never dug exactly to size.

This calculator gives the concrete for a strip footing or a set of identical pads, in cubic yards, cubic feet or cubic metres, with a waste allowance. It also gives the number of premix bags, the weight, and the cost at your local prices. It is for builders and homeowners ordering concrete for a garage, an extension, a deck or a garden wall.

## Formulas

Strip footing, measured along its centreline:

    V = L_c × B × D

Pad footings, n of them:

    V = n × L × B × D

Order volume and bags:

    V_order = V × (1 + waste)
    bags = V_order / bag yield, rounded up

- L_c — centreline length; for a rectangle of outside size a × b, 2 × (a + b) − 4 × B
- B — width of the footing; D — depth of concrete; L — length of one pad
- waste — 10 % is usual when pouring into an earth trench
- bag yield — 0.60 ft³ per 80 lb bag, 0.45 ft³ per 60 lb, 11.7 L per 25 kg

## Assumptions and limitations

- Measure a strip footing along its centreline. The outside perimeter counts each corner twice and overstates the volume.
- The trench is assumed to be dug to the drawn size. Over-dig, stepped footings and stem walls are not included; raise the waste allowance for rough trenches.
- The size of a footing comes from the loads and the soil bearing capacity, and its depth from the local frost line. This page only estimates quantities. The International Residential Code sets 12 in wide and 6 in thick as the minimum for light-frame buildings.
- Premix bag yields are those printed on US bags. The weight uses 2 400 kg/m³.

## Worked example

A garage has walls that form a 24 × 24 ft square on their centrelines. The strip footing under them is 16 in wide and 8 in deep. How much concrete is needed with 10 % waste?

1. Centreline length: 4 × 24 = 96 ft.
2. Section: 16/12 × 8/12 = 0.889 ft².
3. Volume: 96 × 0.889 = 85.3 ft³, which is 85.3 / 27 = 3.16 yd³.
4. With 10 % waste: 93.9 ft³, or 3.48 yd³.
5. In 80 lb bags: 93.9 / 0.60 = 156.4, so 157 bags.

At almost 3.5 yd³, this is a job for a ready-mix truck: order 3.5 yd³.

## FAQ

**How do I calculate concrete for a footing?**
Multiply the length by the width by the depth, all in feet, and divide by 27 for cubic yards. Add 10 % for waste.

**How big should a footing be?**
The engineer or the building code sets it from the load and the soil. For light-frame houses, the IRC minimum is 12 in wide and 6 in thick, and wider for two-storey buildings or weak soil.

**How deep should footings be?**
Below the frost line, which ranges from about 12 in in mild climates to 48 in or more in cold ones. The local building department publishes the depth.

**How much concrete do I need for a deck footing?**
A 24 × 24 × 12 in pad takes 4 ft³, about 7 bags of 80 lb. For round piers use the column and post hole calculator.

**Why measure along the centreline?**
At each corner the two outside lengths overlap by one footing width. Using the centreline counts that corner block exactly once.

**Should footings have rebar?**
Most codes require reinforcement in footings under walls in seismic areas and for wide footings. Follow the drawings or the local code.

## Related calculators

- [Concrete slab calculator](../concrete-slab/index.html) — the floor slab on top of the footings.
- [Concrete column and post hole calculator](../concrete-column/index.html) — round piers and post holes.
- [Concrete bag calculator](../concrete-bags/index.html) — bags of each size for any volume.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — mix materials and reinforcement weight.
