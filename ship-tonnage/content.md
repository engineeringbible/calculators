# Gross and net tonnage calculator (ITC 1969)

**Summary:** Gross tonnage GT = K1 V and net tonnage NT by the 1969 Tonnage Convention (Annex I, regulations 3 and 4), with the convention's limits applied.

## Introduction

Gross tonnage is a measure of a ship's overall size, worked out from the volume of all its enclosed spaces. The 1969 Tonnage Convention defines it as GT = K1 V, where V is the total enclosed volume in cubic metres and K1 = 0.2 + 0.02 log10 V. A ship with 30 000 m³ of enclosed space has K1 = 0.28954 and a gross tonnage of 8 686. Net tonnage measures the useful capacity: the cargo spaces, corrected for draught, plus a term for passengers.

This calculator applies regulations 3 and 4 of Annex I of the convention to volumes you already have: the total enclosed volume, the cargo space volume, the moulded depth and draught, and the passenger numbers. It applies the convention's limits and says which ones bite. It is for superintendents, ship registrars, students and anyone checking tonnage-based fees or rule thresholds.

## Formulas

Gross tonnage (regulation 3):

    GT = K1 V,      K1 = 0.2 + 0.02 log10 V

Net tonnage (regulation 4):

    NT = K2 Vc (4d / 3D)² + K3 (N1 + N2 / 10)
    K2 = 0.2 + 0.02 log10 Vc,      K3 = 1.25 (GT + 10 000) / 10 000

Limits of regulation 4(1):

    (4d / 3D)² ≤ 1,      K2 Vc (4d / 3D)² ≥ 0.25 GT,      NT ≥ 0.30 GT
    N1 = N2 = 0 when N1 + N2 < 13

- V — total volume of all enclosed spaces, m³; Vc — total volume of cargo spaces, m³
- D — moulded depth amidships; d — moulded draught amidships as regulation 4(2) defines it
- N1 — passengers in cabins with not more than 8 berths; N2 — other passengers

## Assumptions and limitations

- The volumes must be measured as the convention requires, to the inside of the shell and including every enclosed space. That measurement is the work of the flag Administration or a recognised organisation; this page only applies the formulas.
- The draught d is the summer load line draught for cargo ships, the deepest subdivision load line for passenger ships, and 75 % of D for ships with neither.
- Appendix 2 of the convention tabulates K1 and K2 and allows linear interpolation between its rows. The formula gives the same values at the rows and can differ slightly in the fourth decimal between them.
- Tonnages are shown to the nearest whole number. The figures on the International Tonnage Certificate are those the Administration determines.

## Worked example

A cargo ship has 30 000 m³ of enclosed spaces, of which 16 000 m³ are cargo spaces. Its moulded depth is 12 m and its summer draught 8.5 m. It carries no passengers.

1. K1 = 0.2 + 0.02 × log10 30 000 = 0.2 + 0.02 × 4.4771 = 0.28954.
2. GT = 0.28954 × 30 000 = 8 686.
3. K2 = 0.2 + 0.02 × log10 16 000 = 0.28408.
4. Draught factor: (4 × 8.5 / (3 × 12))² = (34 / 36)² = 0.8920, below the limit of 1.
5. Cargo term: 0.28408 × 16 000 × 0.8920 = 4 054, above 0.25 GT = 2 172.
6. NT = 4 054, above 0.30 GT = 2 606, so no limit applies.

## FAQ

**Is gross tonnage a weight?**
No. It is a dimensionless number derived from volume. A ship's weight is its displacement, and its carrying capacity in tonnes is its deadweight.

**What is the difference between gross and net tonnage?**
Gross tonnage measures the whole ship. Net tonnage measures the earning spaces: the cargo volume corrected for draught, plus passengers. NT can never be less than 30 % of GT.

**How is gross tonnage different from the old gross register tonnage?**
Gross register tonnage was a volume in register tons of 100 cubic feet under the older national rules. The 1969 convention, in force since 1982, replaced it with the dimensionless GT.

**What is gross tonnage used for?**
Many rules and fees depend on it: SOLAS cargo-ship requirements start at 500 GT, and port dues, pilotage and canal fees are often charged per GT or NT.

**Why does the draught appear in the net tonnage formula?**
A ship that cannot load deep uses less of its cargo volume, so the factor (4d / 3D)² reduces the cargo term when the draught is small compared with the depth.

**When do passengers count in net tonnage?**
Only when there are 13 or more. Passengers in cabins of up to 8 berths count fully, others one tenth.

## Related calculators

- [Block coefficient and hull form](../block-coefficient/index.html) — hull volume from main dimensions.
- [Hydrostatics basics](../hydrostatics/index.html) — displacement and TPC.
- [CII rating](../cii-rating/index.html) — carbon intensity, which uses GT for some ship types.
- [Loading condition](../loading-condition/index.html) — deadweight and displacement of a loading.
