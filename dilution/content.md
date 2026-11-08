# Dilution calculator (C1V1 = C2V2 and serial dilution)

**Summary:** Solve C1V1 = C2V2 for any one term, with the dilution factor, diluent volume and ratio, plus serial dilution steps and their concentrations.

## Introduction

When you dilute a solution, the amount of solute stays the same and only the volume grows. That gives the dilution formula C1V1 = C2V2: stock concentration times stock volume equals final concentration times final volume. To make 500 mL of 1 M hydrochloric acid from a 12 M stock, take 1 × 500 / 12 = 41.67 mL of stock and make it up to 500 mL. The dilution factor is C1 / C2, here 12.

This calculator solves C1V1 = C2V2 for any one of the four terms. It gives the dilution factor, the volume of diluent to add and the stock-to-diluent ratio. It also plans a serial dilution of equal steps, with the total factor and the concentration after each step. It is for laboratory staff, microbiologists, students and process operators making working solutions and standards.

## Formulas

Dilution formula and its rearrangements:

    C1 V1 = C2 V2
    V1 = C2 V2 / C1,   C2 = C1 V1 / V2

Dilution factor, diluent and ratio:

    DF = C1 / C2 = V2 / V1
    diluent = V2 − V1
    ratio = 1 : (DF − 1)    stock : diluent

Serial dilution of n equal steps of factor f:

    DF_total = f^n
    C_k = C1 / f^k
    diluent per tube = (f − 1) × v_transfer

- C1, V1 — concentration and volume of the stock
- C2, V2 — concentration and final volume of the diluted solution
- f — factor per step; n — number of steps; v_transfer — volume moved from tube to tube

## Assumptions and limitations

- C1 and C2 must be in the same unit: mol/L, mg/L, % w/v, ppm or cells/mL all work.
- V2 is the final volume after making up. Adding V2 − V1 of diluent gives the same result only when volumes add, which is close for dilute aqueous solutions.
- Concentrated acids, alcohols and other mixtures that shrink or swell on mixing should be made up to the mark in a volumetric flask.
- Concentrations by mass, such as % w/w, dilute by mass. Use masses instead of volumes for them.
- Large single-step dilutions need tiny stock volumes that are hard to measure. Beyond about 1 : 1 000, a serial dilution is more accurate.

## Worked example

A technician needs 500 mL of 1 M hydrochloric acid and has a 12 M stock.

1. Stock volume: V1 = 1 × 500 / 12 = 41.67 mL.
2. Diluent: 500 − 41.67 = 458.3 mL of water.
3. Dilution factor: 12 / 1 = 12.0, a ratio of 1 : 11.

Put about 400 mL of water in the flask, add the acid slowly, then make up to 500 mL once it has cooled.

## FAQ

**How do you use C1V1 = C2V2?**
Fill in the three values you know and solve for the fourth. To dilute 10 mL of 0.5 M stock to 250 mL, C2 = 0.5 × 10 / 250 = 0.02 M.

**What is a dilution factor?**
The ratio of the stock concentration to the final concentration, or of the final volume to the stock volume. A 1 mL sample made up to 100 mL has a dilution factor of 100.

**What is the difference between 1 : 10 and 1 in 10?**
"1 in 10" usually means 1 part in a total of 10 parts, a factor of 10. "1 : 10" often means 1 part stock to 10 parts diluent, a factor of 11. State which you mean.

**How do I make a serial dilution?**
Transfer a fixed volume into a tube holding (f − 1) times that volume of diluent, mix, and repeat. Six 1 : 10 steps with 1 mL transfers and 9 mL of diluent give a factor of one million.

**Why use a serial dilution instead of one big dilution?**
Making 100 mL of a millionfold dilution in one step needs 0.1 µL of stock, which cannot be measured accurately. Several moderate steps keep every volume measurable and accurate.

**Does C1V1 = C2V2 work for mass concentrations?**
Use masses instead of volumes for % w/w or mg/kg. With volumes it is exact only when the density does not change on dilution.

## Related calculators

- [Molarity](../molarity/index.html) — preparing the stock solution from a solid.
- [PPM concentration converter](../ppm-concentration/index.html) — changing the concentration unit.
- [Mass balance mixing](../mass-balance/index.html) — dilution by mass with flows and temperatures.
- [Chemical dosing](../chemical-dosing/index.html) — feeding a diluted product into a flow.
