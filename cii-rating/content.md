# CII rating estimator

**Summary:** Attained and required operational CII with the A–E rating, from ship type, capacity, annual fuel or CO₂ and distance.

## Introduction

Since 2023 every cargo, ro-ro and cruise ship of 5 000 GT and above receives an annual Carbon Intensity Indicator rating from A to E under MARPOL Annex VI regulation 28. The attained CII is the year's CO₂ divided by capacity and distance; the required CII is a reference line for the ship type, tightened every year by a reduction factor; the rating depends on where the attained value falls between four boundaries around the required value.

This calculator reproduces that chain with the parameters from the IMO guidelines themselves: the 2019 reference lines (MEPC.353(78)), the reduction factors for 2023–2030 (MEPC.338(76) and MEPC.400(83)), the rating boundaries (MEPC.354(78)) and the carbon factors (MEPC.364(79)). Technical superintendents and performance analysts use it to check where a ship stands mid-year and how much CO₂ is left before the rating slips; charterers and students use it to understand what a required value actually means for a given ship.

## Formulas

Attained CII (g CO₂ per capacity unit and nautical mile):

    CII_attained = Σ(FC_j × C_F,j) × 10⁶ / (Capacity × D_t)

- FC_j — mass of fuel j consumed in the calendar year, t
- C_F,j — carbon factor of fuel j, t CO₂ / t fuel: HFO 3.114, LFO/VLSFO 3.151, MGO/MDO 3.206, LNG 2.750, LPG propane 3.000, methanol 1.375
- Capacity — DWT for bulk carriers, gas and LNG carriers, tankers, container, general cargo, refrigerated and combination carriers; GT for ro-ro and passenger ships
- D_t — distance travelled over ground in the year, nmi

Reference line (median 2019 performance of the ship type):

    CII_ref = a × Capacity_ref^(−c)

with a and c from the table below. Capacity_ref is the ship's capacity except where the table caps or floors it.

| Ship type | Capacity_ref | a | c |
|---|---|---|---|
| Bulk carrier | DWT, capped at 279 000 | 4745 | 0.622 |
| Gas carrier ≥ 65 000 DWT | DWT | 14405 × 10⁷ | 2.071 |
| Gas carrier < 65 000 DWT | DWT | 8104 | 0.639 |
| Tanker | DWT | 5247 | 0.610 |
| Container ship | DWT | 1984 | 0.489 |
| General cargo ≥ 20 000 DWT | DWT | 31948 | 0.792 |
| General cargo < 20 000 DWT | DWT | 588 | 0.3885 |
| Refrigerated cargo carrier | DWT | 4600 | 0.557 |
| Combination carrier | DWT | 5119 | 0.622 |
| LNG carrier ≥ 100 000 DWT | DWT | 9.827 | 0 |
| LNG carrier 65 000–100 000 DWT | DWT | 14479 × 10¹⁰ | 2.673 |
| LNG carrier < 65 000 DWT | 65 000 | 14779 × 10¹⁰ | 2.673 |
| Ro-ro vehicle carrier ≥ 57 700 GT | 57 700 | 3627 | 0.590 |
| Ro-ro vehicle carrier 30 000–57 700 GT | GT | 3627 | 0.590 |
| Ro-ro vehicle carrier < 30 000 GT | GT | 330 | 0.329 |
| Ro-ro cargo ship | GT | 1967 | 0.485 |
| Ro-ro passenger ship | GT | 2023 | 0.460 |
| Ro-ro passenger high-speed craft | GT | 4196 | 0.460 |
| Cruise passenger ship | GT | 930 | 0.383 |

Required CII:

    CII_required = (1 − Z/100) × CII_ref

| Year | 2023 | 2024 | 2025 | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|---|---|---|
| Z, % | 5 | 7 | 9 | 11 | 13.625 | 16.25 | 18.875 | 21.5 |

Rating boundaries and rating:

    A/B = exp(d1) × CII_required,  B/C = exp(d2) × …,  C/D = exp(d3) × …,  D/E = exp(d4) × …

Rating A below A/B, B up to B/C, C up to C/D, D up to D/E, E above. The exp(d) vectors are ship-type specific (bulk carrier 0.86 / 0.94 / 1.06 / 1.18; tanker 0.82 / 0.93 / 1.08 / 1.28; container 0.83 / 0.94 / 1.07 / 1.19; full table in calc.js).

Derived quantities:

    CO₂ allowed for C = (C/D boundary) × Capacity × D_t / 10⁶
    Margin to D [%] = (C/D boundary − CII_attained) / (C/D boundary) × 100

## Assumptions and limitations

- This is an estimate of the regulatory calculation, not the verified statement of compliance. The Administration or recognised organisation verifies the DCS data and issues the rating.
- No voyage adjustments or correction factors (MEPC.355(78), G5: ice class, shuttle tankers, STS operations, electrical cargo consumers, excluded voyage segments) are applied. They can only lower the attained value, so this calculator is conservative for ships entitled to them.
- All fuel is assumed consumed on board for propulsion and auxiliaries; fuel delivered as cargo or used for cargo heating in port counts unless a correction applies.
- Distance is the total distance over ground reported to the DCS, including ballast and waiting time at anchor (zero distance but non-zero fuel: this is why port and anchorage time hurts the rating).
- The LNG carrier reference line is discontinuous at 65 000 DWT because the guideline prints different a parameters for the two rows; the values are reproduced as printed.
- Reduction factors beyond 2030 do not exist yet; the IMO will decide them in the next review.
- The rating thresholds use strict comparisons; a value exactly on a boundary is rated in the better band, which is immaterial at realistic precision.

## Worked example

Bulk carrier, 80 000 DWT, reporting year 2026, 60 000 nmi sailed, 5 000 t HFO consumed, no other fuel.

1. CO₂: 5 000 × 3.114 = 15 570 t.
2. Attained CII: 15 570 × 10⁶ / (80 000 × 60 000) = 3.244 g/(DWT·nmi).
3. Reference: 4745 × 80 000^−0.622 = 4.232 g/(DWT·nmi).
4. Required 2026 (Z = 11 %): 0.89 × 4.232 = 3.766.
5. Boundaries: 0.86 × 3.766 = 3.239 (A/B); 0.94 × 3.766 = 3.540 (B/C); 1.06 × 3.766 = 3.992 (C/D); 1.18 × 3.766 = 4.444 (D/E).
6. Attained 3.244 lies just above 3.239 → rating B. With 4 800 t HFO the attained value is 3.114 and the rating is A.
7. Maximum CO₂ for a C: 3.992 × 80 000 × 60 000 / 10⁶ = 19 162 t, so the margin to D is 3 592 t of CO₂, about 1 150 t of HFO.

## FAQ

**Which capacity do I use?**
DWT for cargo ships and gas/LNG carriers, GT for ro-ro and passenger ships. Use the DWT at summer load line from the tonnage and load line certificates, not the actual cargo carried.

**Why does a ship rate worse in a year with a lot of waiting time?**
Waiting adds CO₂ (auxiliaries, boilers) without adding distance. The attained CII only counts distance travelled, so idle time is pure penalty unless a G5 correction applies.

**How much does slow steaming help?**
Fuel per mile falls roughly with the square of speed, so a 10 % speed cut lowers the attained CII by about 19 % at sea; auxiliary fuel per mile rises, so the net gain is somewhat less.

**Does a D or E rating stop the ship from trading?**
Not directly. Three consecutive D ratings or a single E require a corrective action plan in SEEMP Part III, verified by the Administration. Charterers increasingly set rating clauses, which is the commercial effect.

**Are the 2027–2030 factors final?**
Yes. MEPC 83 adopted them in April 2025 through resolution MEPC.400(83): 13.625 % in 2027 rising by 2.625 % per year to 21.5 % in 2030. Factors after 2030 are not yet set.

**What about EEXI?**
EEXI is a one-off design-efficiency certificate verified at the first survey after 1 January 2023; it does not change year to year and is not part of this estimate.

**Can I enter CO₂ instead of fuel?**
Yes, switch "Emissions from" to total CO₂, for example with the output of the fuel consumption calculator scaled to a year.

**Why is my attained value different from my class society's tool?**
Check the capacity (DWT vs GT, and the caps for very large bulk carriers and vehicle carriers), the distance definition, and whether the class tool applies G5 corrections or voyage exclusions.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — CO₂ per passage with the same carbon factors.
- [Admiralty coefficient and speed–power scaling](../admiralty-coefficient/index.html) — how a speed change moves fuel per mile.
- [Propeller slip and speed through water](../propeller-slip/index.html) — checking the speed assumptions behind a voyage plan.
- [Engineering unit converter](../unit-converter/index.html) — tonnes, nautical miles.
