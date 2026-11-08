# Concrete block calculator: CMU, mortar and grout

**Summary:** Concrete blocks for a wall (8 × 16 in or 440 × 215 mm), with openings and waste, bags of mortar and the grout volume to fill the cores.

## Introduction

How many concrete blocks do you need? Divide the wall area by the face of one block plus its joint. A standard 8 × 16 in block covers 0.889 ft², so each square foot of wall takes 1.125 blocks. A wall 40 ft long and 8 ft high has 320 ft² and needs 360 blocks, or 378 with 5 % for breakage.

This calculator counts the blocks for a wall after deducting doors and windows, and adds the waste allowance. It estimates the bags of mortar mix and, for US hollow blocks, the grout to fill the cores at the spacing you choose. It is for masons, contractors and homeowners planning a garden wall, foundation wall or retaining wall.

## Formulas

Blocks:

    A_net = L × H − openings
    blocks = A_net / (face length × face height) × (1 + waste)

Mortar and grout:

    bags = blocks / 16
    grout = A_net × g / 100

- L, H — wall length and height; openings — area of doors and windows
- face — nominal block face including one joint: 16 × 8 in (0.889 ft²) or 450 × 225 mm (0.101 m²)
- 16 — blocks laid per 80 lb bag of preblended mortar with face-shell bedding (NCMA TEK 4-2A Table 2)
- g — grout in ft³ per 100 ft² of wall from NCMA TEK 4-2A Table 3

Grout per 100 ft² of wall, two-core hollow units, 3 % waste included:

| Cores grouted | 6 in wall | 8 in wall | 10 in wall | 12 in wall |
|---|---|---|---|---|
| Every core | 25.6 ft³ | 36.1 ft³ | 47.0 ft³ | 58.9 ft³ |
| 16 in on centre | 12.8 ft³ | 18.1 ft³ | 23.5 ft³ | 29.5 ft³ |
| 24 in on centre | 8.6 ft³ | 12.1 ft³ | 15.7 ft³ | 19.7 ft³ |
| 32 in on centre | 6.4 ft³ | 9.1 ft³ | 11.8 ft³ | 14.8 ft³ |
| 48 in on centre | 4.3 ft³ | 6.1 ft³ | 7.9 ft³ | 9.9 ft³ |

## Assumptions and limitations

- The wall is a single wythe in running bond. Corner, lintel and bond-beam units are counted as ordinary blocks.
- A US block is 15⅝ × 7⅝ in actual, laid with ⅜ in joints to an 8 × 16 in module. A metric block of 440 × 215 mm with 10 mm joints fills 450 × 225 mm.
- The mortar rate of 16 blocks per bag is the NCMA figure and includes normal waste. The QUIKRETE Mortar Mix data sheet gives 13 blocks per 80 lb bag, so enter 13 for a cautious estimate.
- Grout volumes come from NCMA tables for two-core units. Bond beams and larger cells need more. Grout is not estimated for metric blocks.
- A wall that retains soil or carries a building needs reinforcement and an engineer's design.

## Worked example

A wall is 40 ft long and 8 ft high, built of 8 in hollow blocks with no openings. The cores are grouted at 48 in on centre. How many blocks, bags of mortar and how much grout are needed with 5 % waste on the blocks?

1. Wall area: 40 × 8 = 320 ft².
2. Blocks: 320 / 0.889 = 360 blocks, in 12 courses of 8 in.
3. With 5 % waste: 360 × 1.05 = 378 blocks.
4. Mortar: 360 / 16 = 22.5, so 23 bags of 80 lb mortar mix.
5. Grout: 320 × 6.1 / 100 = 19.5 ft³, which is 0.723 yd³.

At the QUIKRETE rate of 13 blocks per bag the mortar would be 28 bags. Order the grout as about three-quarters of a cubic yard of ready-mix grout, or mix it on site.

## FAQ

**How many blocks are in a square foot?**
1.125 standard 8 × 16 in blocks per square foot, or 112.5 per 100 ft² before waste.

**How many blocks per square metre?**
9.88 metric blocks of 440 × 215 mm with 10 mm joints, before waste.

**How many bags of mortar for 100 blocks?**
About 6.3 bags of 80 lb preblended mortar at the NCMA rate of 16 blocks per bag, or 7.7 at the QUIKRETE rate of 13.

**How much grout fills an 8 in block wall?**
36.1 ft³ per 100 ft² when every core is filled, about 0.32 ft³ per block. Grouting every third core at 24 in takes 12.1 ft³ per 100 ft².

**What are the actual dimensions of an 8 × 8 × 16 block?**
7⅝ × 7⅝ × 15⅝ in. The ⅜ in mortar joint brings it to the 8 × 16 in module.

**How much waste should I allow?**
About 5 % for breakage and cutting on a plain wall. Allow more for many corners, piers and openings.

## Related calculators

- [Brick calculator](../brick-count/index.html) — clay brick walls and veneers.
- [Concrete footing calculator](../concrete-footing/index.html) — the footing under the block wall.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — concrete and reinforcing steel quantities.
- [Retaining wall earth pressure calculator (Rankine)](../retaining-wall/index.html) — soil pressure on a block retaining wall.
