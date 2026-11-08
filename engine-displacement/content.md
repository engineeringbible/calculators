# Engine displacement calculator

**Summary:** Engine displacement in cc, litres and cubic inches from bore, stroke and cylinders, or the bore or stroke for a target size, with mean piston speed.

## Introduction

Engine displacement is the volume all the pistons sweep in one revolution of the crank, from bottom to top of their stroke. To calculate it, multiply the area of one bore by the stroke and by the number of cylinders. A GM LS3 V8 has a 4.065 in bore and a 3.622 in stroke, which gives 376 cubic inches or 6.2 litres.

This calculator gives the displacement in cubic inches, litres and cc from the bore, stroke and cylinder count. It also works backwards to the bore or stroke for a target size, and gives the bore/stroke ratio and the mean piston speed. It is for engine builders planning a stroker or an overbore, and for anyone converting between cubic inches and litres.

## Formulas

Displacement and its inverses:

    V = π/4 × b² × s × n
    b = √(4 V / (π s n))
    s = 4 V / (π b² n)

Mean piston speed:

    S_p = 2 × s × N

- b — bore; s — stroke; n — number of cylinders
- N — engine speed in revolutions per minute
- 1 in³ = 16.387 cc; 1 L = 61.02 in³

## Assumptions and limitations

- The formula holds for any piston engine, four-stroke or two-stroke. It does not apply to rotary engines.
- Add any overbore to the bore before calculating. A 0.030 in overbore on a 350 adds about 5 in³.
- Badge sizes are rounded. GM sells the 5 733 cc small-block as a 5.7.
- The mean piston speed is an average over a revolution. The piston moves about 1.6 times faster near mid-stroke.

## Worked example

A GM LS3 has a 4.065 in bore, a 3.622 in stroke and eight cylinders. It revs to 6 600 rpm.

1. Bore area: π/4 × 4.065² = 12.978 in².
2. One cylinder: 12.978 × 3.622 = 47.01 in³, or 770.3 mL (cc).
3. Eight cylinders: 8 × 47.007 = 376.1 in³.
4. In litres: 376.05 × 16.387 / 1 000 = 6.16 L.
5. Bore/stroke ratio: 4.065 / 3.622 = 1.122, an oversquare engine.
6. Mean piston speed: 2 × 3.622 / 12 × 6 600 = 3 984 ft/min.

GM rounds this to 6.2 L and quotes 376 cu in, in line with the result.

## FAQ

**How do I calculate engine displacement?**
Multiply π/4 by the bore squared, by the stroke and by the number of cylinders. With the bore and stroke in inches the result is in cubic inches.

**How many cubic inches is a litre?**
One litre is 61.02 cubic inches. A 5.0 L engine is about 305 in³, and a 350 is 5.7 L.

**What is a stroker engine?**
An engine fitted with a longer-stroke crankshaft. A 350 with a 3.75 in stroke and a 4.030 in bore becomes about 383 in³.

**What does oversquare mean?**
The bore is larger than the stroke. A short stroke keeps piston speed down, so oversquare engines can rev higher for the same piston speed.

**How much does a 0.030 in overbore add?**
On a 4.00 in bore and 3.48 in stroke V8 it adds 5.3 in³, from 349.9 to 355.1 in³.

**Is displacement the same as cc?**
Yes, cc is cubic centimetres of swept volume. 1 000 cc is one litre.

## Related calculators

- [Compression ratio](../compression-ratio/index.html) — static ratio from the chamber, gasket and piston volumes.
- [Horsepower calculator](../horsepower/index.html) — power from torque and rpm.
- [Engine BMEP](../engine-bmep/index.html) — mean effective pressure from power and displacement.
- [Fuel injector size](../fuel-injector-size/index.html) — injector flow for the power target.
