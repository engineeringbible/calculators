# Change of trim and new drafts calculator

**Summary:** New forward and aft drafts after shifting, loading or discharging a weight, from MCTC, TPC and LCF: bodily sinkage, change of trim and draft changes.

## Introduction

When a weight is moved along a ship, the ship trims about its centre of flotation. The change of trim in centimetres is the weight times the distance moved, divided by the moment to change trim one centimetre (MCTC). Shifting 120 t forward by 45 m on a ship with an MCTC of 240 t·m/cm trims it 22.5 cm by the head. A weight loaded or discharged also sinks or lifts the ship bodily by the weight divided by the tonnes per centimetre (TPC).

This calculator gives the bodily sinkage, the change of trim, the change at each end and the new forward and aft drafts after loading, discharging or shifting a weight. It also gives the positions where a weight can be loaded without changing the aft or forward draft. It is for deck officers and cadets planning cargo, ballast and bunker operations, and for students of ship stability.

## Formulas

Bodily sinkage and change of trim:

    sinkage = w / TPC                         cm
    change of trim = w × d / MCTC             cm

Share of the trim at each end (LCF measured from the aft perpendicular):

    change aft = change of trim × LCF / L
    change forward = change of trim × (L − LCF) / L

Loading position for an unchanged aft draft:

    d = MCTC × L / (TPC × LCF)     forward of the LCF

- w — weight in tonnes; d — its lever about the LCF in metres (for a shift, the distance moved)
- TPC — tonnes per centimetre immersion; MCTC — moment to change trim 1 cm, t·m/cm
- L — length between perpendiculars; trim is positive by the stern

## Assumptions and limitations

- The weight is small compared with the displacement, so TPC, MCTC and the LCF read at the initial draught stay valid. For large weights read them at the mean of the initial and final draughts.
- Positions are measured from the aft perpendicular, positive forward. If your hydrostatic tables give the LCF from midships, add half the length to the value forward of midships.
- Drafts are at the perpendiculars. Readings at the draught marks need correcting for the marks' positions.
- A weight off the centreline also lists the ship, and a vertical shift changes GM. Use the initial stability calculator for those effects.

## Worked example

A ship 150 m between perpendiculars floats at 7.20 m forward and 8.00 m aft. The LCF is 72 m from the aft perpendicular, TPC is 25 t/cm and MCTC is 180 t·m/cm. 300 t of cargo are loaded with their centre 110 m from the aft perpendicular.

1. Bodily sinkage: 300 / 25 = 12.0 cm.
2. Lever about the LCF: 110 − 72 = 38 m forward, so the trimming moment is 300 × 38 = 11 400 t·m by the head.
3. Change of trim: 11 400 / 180 = 63.3 cm by the head, written −63.3 cm.
4. Change aft: −63.3 × 72 / 150 = −30.4 cm. Change forward: +63.3 × 78 / 150 = +32.9 cm.
5. New draft aft: 8.00 + 0.120 − 0.304 = 7.816 m. New draft forward: 7.20 + 0.120 + 0.329 = 7.649 m.
6. To keep the aft draft unchanged, the cargo would go 180 × 150 / (25 × 72) = 15 m forward of the LCF, at 87.00 m from the aft perpendicular.

## FAQ

**How do I calculate the change of trim?**
Multiply the weight by its distance from the centre of flotation, or by the distance it is shifted, and divide by MCTC. The answer is in centimetres.

**What is MCTC?**
The moment to change trim one centimetre: the trimming moment in tonne-metres that changes the trim by 1 cm. It comes from the ship's hydrostatic tables at the current draught.

**Why is the trim shared unequally between the ends?**
The ship trims about the centre of flotation, which is rarely amidships. The end farther from the LCF moves more.

**What is bodily sinkage?**
The parallel rise or fall when weight is loaded or discharged at the LCF: the weight divided by TPC, in centimetres.

**Where should I load a weight to keep the stern draft the same?**
At MCTC × L / (TPC × LCF) forward of the centre of flotation. There the trim by the head exactly cancels the sinkage aft.

**Can I use this for a large cargo operation?**
For a few percent of the displacement it is accurate. For larger loadings use the loading condition calculator with the full hydrostatic table.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — TPC, MCTC and trim from LCG and LCB.
- [Draft survey](../draft-survey/index.html) — corrected drafts and displacement.
- [Loading condition](../loading-condition/index.html) — drafts and stability for a full item list.
- [Initial stability GM and list](../initial-stability/index.html) — list and GM from the same weights.
