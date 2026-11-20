# Wire rope weight calculator

**Summary:** Steel wire rope weight per metre and per foot for 6×19, 6×36, 8-strand and rotation-resistant rope, the length on a reel from its weight, and the breaking load.

## Introduction

The weight of steel wire rope goes up with the square of its diameter. EN 12385-4 gives each rope construction a length mass factor W, so the mass per metre is W × d² / 100 kg with d in mm. A 20 mm 6×36 rope with a steel core has W = 0.409 and weighs 1.636 kg per metre, so 100 m of it weighs 163.6 kg. A 10 mm 6×19 rope weighs between 0.36 and 0.40 kg per metre, depending on whether its core is fibre or steel.

This calculator gives the weight per metre, per foot and per 100 m for twelve common constructions, from 6×7 to 35×7 rotation-resistant rope, or for factors taken from a rope maker's data sheet. It finds the weight of a given length, or the length of rope on a reel from its net weight. It also gives the weight in water, the minimum breaking load and how much of that load the hanging rope's own weight takes up. It is for riggers, crane and winch crews, deck officers and anyone ordering, shipping or spooling rope.

## Formulas

Mass per length (EN 12385-4):

    m' = W × d² / 100          kg/m, d in mm

Weight of a length, or the length from a weight:

    M = m' × L        L = M / m'

Mass in water:

    m'_w = m' × (1 − ρ_w / 7 850)

Minimum breaking force and the share taken by the hanging rope:

    MBL = K × d² × R_r / 1 000          kN, R_r in N/mm²
    share = m' × g × L / MBL

- W — nominal length mass factor, kg per 100 m per mm²: 0.359 for 6×19 fibre core, 0.400 for 6×19 steel core, 0.409 for 6×36 steel core
- K — minimum breaking force factor: 0.330 fibre core, 0.356 steel core for the 6×19 and 6×36 classes
- ρ_w — 1 025 kg/m³ for seawater, 1 000 kg/m³ for fresh water
- R_r — rope grade, 1770, 1960 or 2160 N/mm²

## Assumptions and limitations

- The W and K factors are those a rope maker tabulates according to EN 12385-4. For every construction here they reproduce that maker's printed weight and breaking load at 20 mm. A rope's own data sheet or certificate takes precedence.
- The mass is for new, lubricated rope at its nominal diameter. EN 12385-4 allows most sizes to measure up to 5 % over nominal, so a real rope may weigh a few per cent more.
- US tables (ASTM A1023 and the Wire Rope Users Manual) list slightly heavier figures for the same nominal size. Use the maker's figure when the weight matters, as for a crane's load chart or a shipping limit.
- The weight in water treats the whole rope as steel. The fibre core and the lubricant are close to the density of water, so a fibre-core rope weighs a little less in water than shown.
- The share of the breaking load is for the rope hanging straight down. Sheaves, drums, wave motion and the load on the hook are not included.

## Worked example

How much do 100 m of 20 mm 6×36 IWRC wire rope weigh, and how much does the rope take from its own breaking load when it hangs from a crane?

1. Mass per metre: 0.409 × 20² / 100 = 1.636 kg/m, which is 1.099 lb/ft.
2. Weight of 100 m: 1.636 × 100 = 163.6 kg.
3. In seawater: 1.636 × (1 − 1 025 / 7 850) = 1.422 kg/m.
4. Minimum breaking load in grade 1770: 0.356 × 20² × 1 770 / 1 000 = 252.0 kN.
5. The hanging 100 m weighs 163.6 × 9.81 = 1.60 kN, which is 0.64 % of the breaking load.

To find what is left on a reel instead, weigh it and subtract the empty reel. A net 500 kg of 16 mm 6×19 IWRC rope, which weighs 0.400 × 16² / 100 = 1.024 kg/m, is 500 / 1.024 = 488 m of rope.

## Common mistakes

- **Using one weight for every rope of the same diameter.** At 20 mm a 6×36 rope with a steel core weighs 1.64 kg/m and an 8×19 rope with a fibre core 1.36 kg/m, about a sixth less. Pick the construction on the rope's certificate.
- **Forgetting the steel core.** A steel core (IWRC) rope weighs about 11 % more than the same rope with a fibre core, and a deep-water winch or crane jib feels that extra weight.
- **Weighing the reel with the rope.** A wooden or steel reel can weigh several hundred kilograms. Subtract its stamped tare mass before dividing by the mass per metre, or the length comes out far too long.
- **Mixing kg per 100 m and kg per metre.** Rope tables print the weight per 100 m, and W is in kg per 100 m per mm². A W of 0.409 means 0.409 kg per metre for a 10 mm rope, not 0.409 kg per metre for every size.

## FAQ

**How much does wire rope weigh per metre?**
W × d² / 100 kg, with d in mm. For a 6×19 or 6×36 rope that is about 0.36 to 0.41 kg/m at 10 mm, 0.92 to 1.05 kg/m at 16 mm and 1.44 to 1.64 kg/m at 20 mm.

**How much does 1/2 inch wire rope weigh per foot?**
About 0.43 lb/ft for 6×19 rope with a steel core by the EN factor: 0.400 × 12.7² / 100 = 0.645 kg/m. US tables list about 0.46 lb/ft. Fibre-core rope is about a tenth lighter.

**How do I work out how much rope is left on a reel?**
Weigh the full reel, subtract the empty reel's mass, and divide by the mass per metre. Choose "The net weight on a reel" above to do it here.

**How much does wire rope weigh in water?**
About 87 % of its weight in air for seawater, because steel is 7.85 times denser than water. A 20 mm 6×36 IWRC rope goes from 1.64 kg/m in air to 1.42 kg/m in seawater.

**Why does a steel core rope weigh more?**
The independent wire rope core (IWRC) is a small steel rope in the centre. It replaces a fibre core that is nearly as light as water, so the rope is heavier and about 8 % stronger, and it crushes less on a drum.

**How long can a wire rope hang before it breaks under its own weight?**
For 6×36 IWRC rope of grade 1770 it is about 15.7 km, whatever the diameter, because weight and strength both rise with d². With a safety factor of 5, a hanging length of a fifth of that, about 3.1 km, would use the whole working load.

## Related calculators

- [Wire rope and chain safe working load](../wire-rope-swl/index.html) — the SWL from the breaking load and a safety factor.
- [Lifting sling and wire rope load](../lifting-sling/index.html) — leg tension at sling angles.
- [Steel and metal weight](../metal-weight/index.html) — plate, bar and section weights.
- [Mooring line and winch brake](../mooring-line-meg4/index.html) — MEG4 line strengths.
