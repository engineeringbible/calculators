# Brick calculator: bricks and mortar for a wall

**Summary:** Number of bricks for a wall from its area less openings, for modular, standard, metric or custom bricks, one or two wythes, with waste and mortar.

## Introduction

How many bricks do you need? Divide the wall area by the face of one brick plus one mortar joint. A modular brick, 7⅝ × 2¼ in, laid with ⅜ in joints takes up 8 × 2⅝ in, so a square foot of wall holds 6.86 bricks. A wall of 148 ft² after deducting a window needs 1 015 bricks, or 1 066 with 5 % for cutting and breakage.

This calculator counts the bricks for a wall of any common US brick, the UK metric brick or a size you enter. It handles one or two wythes, deducts doors and windows and adds waste. It also gives the mortar volume in the joints and the bags of mortar mix. It is for masons, builders and homeowners pricing a wall, a veneer or a garden project.

## Formulas

Bricks:

    bricks per area = 1 / ((L + j) × (H + j))
    bricks = A_net × bricks per area × wythes × (1 + waste)

Mortar, the method of BIA Technical Note 10:

    mortar per brick = ((L + j) × (H + j) − L × H) × W
    collar joint = A_net × j   (double wythe only)

- L, H, W — specified length, height and width of the brick
- j — mortar joint thickness, ⅜ in in the US and 10 mm in metric brickwork
- A_net — wall area less doors and windows
- wythes — one or two thicknesses of brick

| Brick | Size, in | Bricks per ft² with ⅜ in joints |
|---|---|---|
| Modular | 7⅝ × 2¼ × 3⅝ | 6.86 |
| Standard | 8 × 2¼ × 3⅝ | 6.55 |
| Queen | 7⅝ × 2¾ × 2¾ | 5.76 |
| Norman | 11⅝ × 2¼ × 3⅝ | 4.57 |
| Utility | 11⅝ × 3⅝ × 3⅝ | 3.00 |

## Assumptions and limitations

- The wall is laid in running or stack bond with even joints. Bonds with header courses use more bricks; BIA TN 10 gives the correction factors.
- BIA TN 10 lists 675 modular bricks per 100 ft² because three modular courses fill exactly 8 in. With joints of exactly ⅜ in the count is 686.
- The mortar volume is the theoretical volume of full joints, with no waste. It reproduces the BIA figure of 8.1 ft³ per 1 000 modular bricks.
- Bags use the QUIKRETE rate of 37 standard bricks per 80 lb bag of mortar mix, scaled to the chosen brick. That rate includes normal droppings and waste.
- Load-bearing or tall brick walls need a design by an engineer.

## Worked example

A wall is 20 ft long and 8 ft high with a window of 12 ft². It is built of modular brick with ⅜ in joints, one wythe thick. How many bricks and how much mortar are needed with 5 % waste?

1. Net area: 20 × 8 − 12 = 148 ft².
2. Bricks per square foot: 144 / (8 × 2.625) = 6.857.
3. Bricks: 148 × 6.857 = 1 014.9, so 1 015 bricks without waste.
4. With 5 % waste: 1 015 × 1.05 = 1 066 bricks.
5. Mortar per brick: (8 × 2.625 − 7.625 × 2.25) × 3.625 = 13.93 in³, or 8.06 ft³ per 1 000 bricks.
6. Mortar for the wall: 1 014.9 × 13.93 in³ = 8.18 ft³.
7. Bags: at 37 standard bricks per bag, 27 bags of 80 lb mortar mix.

The theoretical mortar is close to the 8.1 ft³ per 1 000 bricks in BIA TN 10 Table 4.

## FAQ

**How many bricks are in a square foot?**
6.86 modular bricks with ⅜ in joints, or 6.75 by the BIA modular coursing. Standard bricks give 6.55 per square foot.

**How many bricks are in a square metre?**
59.3 UK bricks of 215 × 65 mm with 10 mm joints, usually rounded to 60.

**How many bricks for a double wythe wall?**
Twice the single-wythe count. The mortared collar joint between the wythes adds 3.13 ft³ of mortar per 100 ft² at ⅜ in thick.

**How much mortar do 1 000 bricks need?**
About 8.1 ft³ of joint mortar for modular brick with ⅜ in joints, and 10.3 ft³ with ½ in joints. Real use is higher because of droppings.

**How many bricks does a bag of mortar lay?**
QUIKRETE gives up to 37 standard bricks per 80 lb bag of Mortar Mix. Masons often reckon eight bags of masonry cement, mixed with sand, per 1 000 bricks.

**How much waste should I allow for bricks?**
About 5 % on plain walls. Allow more for many openings, corners and cut bricks.

## Related calculators

- [Concrete block calculator](../concrete-block/index.html) — concrete masonry units, mortar and grout.
- [Paint coverage and quantity](../paint-coverage/index.html) — wall areas less openings for coatings.
- [Concrete footing calculator](../concrete-footing/index.html) — the footing under a brick wall.
- [Retaining wall earth pressure calculator (Rankine)](../retaining-wall/index.html) — soil pressure on a garden retaining wall.
