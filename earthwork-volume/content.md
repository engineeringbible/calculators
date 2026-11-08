# Earthwork cut and fill volumes calculator

**Summary:** Volumes by the average end area and prismoidal methods from cross-sections, with swell, shrinkage and haul mass.

## Introduction

Earthwork is measured in three different cubic metres: the bank volume in the ground (what the survey cross-sections give), the loose volume in the trucks (larger, because excavation breaks the soil up) and the compacted volume in the fill (smaller than bank for soils, larger for rock). Getting from cross-sections to those quantities is two steps: the volume between sections by the average end area or, more accurately, the prismoidal formula, and the conversion factors for the material. This calculator does both, for a cut to be hauled away or a fill to be built, and adds the mass and the number of truck loads.

It is for site and port engineers estimating dredge-spoil reclamation, quay backfill, channel and foundation excavations and road or yard earthworks, and for surveying students.

## Formulas

    V_AEA = L (A₁ + A₂)/2
    V_prismoidal = L (A₁ + 4 A_m + A₂)/6,   A_m measured or ≈ ((√A₁ + √A₂)/2)² for similar sections
    correction = V_AEA − V_prismoidal
    cut:   V_bank = V,   V_loose = V_bank (1 + swell),   V_compacted = V_bank (1 − shrinkage)
    fill:  V_compacted = V,   V_bank = V/(1 − shrinkage),   V_loose = V_bank (1 + swell)
    mass = V_bank ρ_bank,   ρ_loose = ρ_bank/(1 + swell),   loads = V_loose / truck capacity

Typical factors: sand and gravel swell 12 % / shrinkage 12 %; loam 25 % / 10 %; clay 33 % / 10 %; topsoil 25 % / 15 %; blasted rock swell 50 % and bulking 30 % when placed.

## Assumptions and limitations

- Parallel cross-sections of net cut or fill area; cut and fill between the same stations are separate runs; no curvature correction.
- The average end area over-estimates for dissimilar sections (50 % for a pyramid); the prismoidal formula is exact for prismoids but needs the true mid-section.
- Swell and shrinkage factors vary by ±30 % with moisture and compaction; use project tests for payment.
- Topsoil strip, over-excavation, unsuitable material, settlement and compaction control are not included.

## Worked example

Two road cross-sections 20 m apart with cut areas 150.25 m² and 259.375 m², mid-section 201.375 m², in clay; 12 m³ trucks.

1. Average end area: 20 × (150.25 + 259.375)/2 = 4 096.25 m³. Prismoidal: 20 × (150.25 + 4 × 201.375 + 259.375)/6 = 4 050.42 m³ (the published textbook figures); the correction is 45.8 m³, 1.1 %.
2. Clay swells 33 %: 4 050 m³ bank becomes 5 387 m³ loose, 449 truck loads, 7 290 t at 1 800 kg/m³ (loose density 1 353 kg/m³).
3. If placed as fill it compacts to 3 645 m³ (90 % of bank).
4. Conversely, a 4 050 m³ compacted clay embankment needs 4 500 m³ of bank excavation and 5 986 m³ of haul.

Blasted rock behaves the other way: 1 000 m³ in the quarry face becomes 1 500 m³ loose and still 1 300 m³ when placed.

## FAQ

**Why do bank, loose and compacted volumes differ?**
Excavation breaks the soil structure and adds voids (swell); compaction removes them and more (shrinkage), so the same mass of soil occupies three different volumes.

**When is the average end area good enough?**
When consecutive sections are similar in size and shape (within a factor of about 1.5); otherwise shorten the interval or use the prismoidal formula with a measured mid-section.

**How do I get the mid-section area?**
Survey a cross-section halfway, or accept the estimate from the end areas (exact when the sections are geometrically similar).

**Do these factors apply to dredged material?**
Dredged silts and clays bulk much more (bulking factors 1.3–2.0 in the hopper) and settle for months in reclamation; use dredging-specific factors.

**How many trucks per day?**
Divide the loads by the cycle time; the loose density and truck payload (not just volume) may govern for dense material.

**What about rock?**
Blasted rock swells about 50 % and never compacts back: a rock fill occupies around 1.3 times the bank volume, hence the negative "shrinkage".

**Is this a payment quantity?**
Only if the contract specifies the method and the sections are surveyed; otherwise it is an estimate for planning and mass haul.

## Related calculators

- [Concrete volume and rebar weight](../concrete-volume/index.html) — the structures built in the excavation.
- [Rational-method runoff](../rational-runoff/index.html) — drainage of the finished earthwork.
- [Open-channel flow (Manning)](../manning-channel-flow/index.html) — cut channels and ditches.
- [Tank volume and partial fill](../tank-volume/index.html) — volumes of other shapes.
