# Soil compaction calculator (Proctor relative compaction)

**Summary:** Field dry density from wet density and moisture, relative compaction against the Proctor maximum, saturation, air voids and the zero-air-voids density.

## Introduction

Fill under roads, slabs and foundations is specified by relative compaction: the field dry density as a percentage of the laboratory Proctor maximum. A field test gives the wet density and the moisture content. Dividing the wet density by one plus the moisture content gives the dry density. Soil at 124.0 lb/ft³ wet and 12 % moisture has a dry density of 110.7 lb/ft³, which is 96.3 % of a 115.0 lb/ft³ Proctor maximum.

This calculator gives the field dry density and the relative compaction, and says whether it meets the specification. It adds the void ratio, porosity, degree of saturation, air voids and the zero-air-voids density, which show whether the test result is physically possible. It is for earthwork inspectors, geotechnical technicians, contractors and students.

## Formulas

Dry density and relative compaction:

    ρ_d = ρ / (1 + w)
    RC = ρ_d / ρ_d,max × 100 %

Weight–volume relations:

    e = G_s ρ_w / ρ_d − 1,    n = e / (1 + e)
    S = w G_s / e
    V_a = 1 − (ρ_d / ρ_w)(1/G_s + w)

Zero-air-voids density, the upper limit at moisture w:

    ρ_zav = G_s ρ_w / (1 + w G_s)

- ρ — wet (bulk) density; w — moisture content as a decimal
- ρ_d,max — maximum dry density from the Proctor test
- G_s — specific gravity of the soil solids; ρ_w = 1 000 kg/m³ = 62.43 lb/ft³

## Assumptions and limitations

- Field tests are the sand cone (ASTM D1556) or the nuclear gauge (ASTM D6938). Check gauge moisture against oven-dried samples.
- The Proctor test must be on the same soil and at the specified effort. Standard Proctor (ASTM D698) uses 12 400 ft·lbf/ft³ and modified Proctor (ASTM D1557) 56 000 ft·lbf/ft³.
- Gravel removed from the laboratory sample makes the field density look too high. Apply the oversize correction of ASTM D4718.
- G_s affects only the saturation, void ratio and zero-air-voids values, not the relative compaction. Use a measured value; 2.65 to 2.75 covers most soils.

## Worked example

A nuclear gauge on a compacted fill reads a wet density of 124.0 lb/ft³ and a moisture content of 12.0 %. The standard Proctor test gave 115.0 lb/ft³ at 11.5 % moisture. G_s is 2.70 and the specification asks for 95 %.

1. Dry density: 124.0 / 1.12 = 110.714, or 110.7 lb/ft³.
2. Relative compaction: 110.7 / 115.0 = 96.3 %. The fill passes; the lowest passing dry density is 0.95 × 115.0 = 109.3 lb/ft³.
3. Void ratio: 2.70 × 62.43 / 110.714 − 1 = 0.5224, or 0.522.
4. Saturation: 0.12 × 2.70 / 0.5224 = 62.0 %. The air voids are 13.0 % of the volume.
5. Zero-air-voids density at 12 %: 2.70 × 62.43 / (1 + 0.12 × 2.70) = 127.3 lb/ft³. The field point lies well below it, so the test is plausible.

The moisture is 0.5 % above optimum, which is within the usual range for good compaction.

## FAQ

**What is relative compaction?**
The field dry density divided by the maximum dry density from the laboratory Proctor test. Specifications typically ask for 90 to 100 %, depending on the use of the fill and the test effort.

**What is the difference between standard and modified Proctor?**
The compaction energy. Modified Proctor uses a heavier hammer, a longer drop and five layers, about 4.5 times the energy, so it gives a higher maximum and a lower optimum moisture.

**How do I convert wet density to dry density?**
Divide by one plus the moisture content as a decimal. At 15 % moisture, 2 000 kg/m³ wet is 2 000 / 1.15 = 1 739 kg/m³ dry.

**What is the zero-air-voids curve?**
The dry density a soil would have at a given moisture if all its voids were full of water. No compacted soil can lie above it.

**Why can relative compaction exceed 100 %?**
Field rollers can put in more energy than the laboratory test, or the field soil can be coarser than the tested sample. Values above about 105 % call for a check of the reference test.

**Why does moisture content matter?**
Below optimum the grains resist sliding into a dense packing. Above it, water fills the voids and the soil cannot be densified, so specifications often limit moisture to a band around optimum.

## Related calculators

- [Earthwork volume](../earthwork-volume/index.html) — cut and fill quantities to compact.
- [Consolidation settlement](../consolidation-settlement/index.html) — settlement of clay under the fill.
- [Soil bearing capacity](../soil-bearing/index.html) — capacity of footings on the compacted fill.
- [Footing size calculator](../footing-size/index.html) — size the footing for the allowable pressure.
