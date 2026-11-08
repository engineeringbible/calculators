# Concrete column and post hole calculator

**Summary:** Concrete for round columns, piers and tube forms, or for setting fence and deck posts, with premix bags per hole and in total, weight and cost.

## Introduction

Setting a fence post, pouring a deck pier in a cardboard tube form, or casting a round column all come down to the volume of a cylinder. For a post hole, the post itself takes up part of that cylinder, and a layer of gravel at the bottom takes up more. A 12 in hole 3 ft deep around a 4 × 4 post holds 2.1 cubic feet of concrete, three and a half bags of 80 lb.

This calculator gives the concrete per hole or column and for the whole job, in cubic feet, cubic yards or cubic metres. It counts bags per hole and in total, and gives the weight and the cost at your prices. It is for fence builders, deck builders and anyone pouring round piers or columns.

## Formulas

Round column or pier:

    V = n × π × D² / 4 × H

Post hole, with the post standing on gravel:

    V = n × (π × D² / 4 − A_post) × (h − h_gravel)
    A_post = s² for a square post, π × s² / 4 for a round one

Order and bags:

    V_order = V × (1 + waste)
    bags = V_order / bag yield, rounded up

- D — hole or column diameter; H — column height; h — hole depth
- s — actual post size: a 4 × 4 is 3.5 in, a 6 × 6 is 5.5 in
- n — number of holes or columns
- bag yield — 0.60 ft³ per 80 lb, 0.45 ft³ per 60 lb, 0.30 ft³ per 40 lb, 11.7 L per 25 kg

## Assumptions and limitations

- Holes and columns are straight cylinders. Augered holes are often wider at the top and bells at the bottom of piers add volume, so allow 10 % or more for waste.
- The post stands on the gravel and displaces concrete over the rest of the hole. The calculator checks that a square post fits, which needs a hole wider than the post's diagonal.
- Common fencing practice is a hole about three times the post width and about a third of the post's length in the ground, below the frost line in cold climates. Deck and building posts follow the local code and the drawings.
- Premix bag yields are those printed on US bags. The weight uses 2 400 kg/m³.

## Worked example

A fence has ten 4 × 4 posts, each set in a 12 in hole 36 in deep, with no gravel. How much concrete is needed with 10 % waste?

1. Hole area: π × 1² / 4 = 0.785 ft². Post area: 3.5 × 3.5 / 144 = 0.085 ft².
2. Concrete per hole: (0.785 − 0.085) × 3 = 2.10 ft³.
3. In 80 lb bags: 2.10 / 0.60 = 3.50 bags per hole.
4. Ten holes with 10 % waste: 2.10 × 10 × 1.10 = 23.1 ft³.
5. Bags: 23.1 / 0.60 = 38.5, so buy 39 bags of 80 lb.

With 4 in of gravel at the bottom of each hole for drainage, the same fence needs 35 bags.

## FAQ

**How many bags of concrete per fence post?**
For a 4 × 4 post in a 10 in hole 2 ft deep, about 1.5 bags of 80 lb, so 2 bags. In a 12 in hole 3 ft deep, 3.5 bags.

**How big should a post hole be?**
About three times the post width: 10 to 12 in for a 4 × 4 and 16 to 18 in for a 6 × 6. The depth is usually a third of the post's length, and below the frost line where the ground freezes.

**How much concrete is in a 12 in tube form?**
0.785 ft³ per foot of height, so a 4 ft tube takes 3.14 ft³, about 5.2 bags of 80 lb.

**Should I put gravel in the bottom of a post hole?**
Many builders add 4 to 6 in of gravel so water drains away from the end of the post. Enter its depth, and the calculator removes it from the concrete.

**Can I use fast-setting concrete for posts?**
Yes. Fast-setting mixes can yield a different volume per pound, so read the yield printed on the bag and scale the bag count to match.

**How much concrete for a round column?**
Multiply 0.785 by the diameter squared and by the height, all in feet. A 16 in column 10 ft tall needs 14.0 ft³, about 0.52 yd³.

## Related calculators

- [Concrete footing calculator](../concrete-footing/index.html) — square pads and strip footings.
- [Concrete bag calculator](../concrete-bags/index.html) — bags of each size for any volume.
- [Concrete slab calculator](../concrete-slab/index.html) — patios, driveways and floors.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — columns with reinforcement weight.
