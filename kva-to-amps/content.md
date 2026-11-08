# kVA to amps calculator

**Summary:** Line current from kVA and voltage for single-phase and three-phase supplies, kVA from amps, and the kW at a given power factor.

## Introduction

Transformers, generators and UPS units are rated in kVA, while cables, breakers and busbars are chosen in amps. Converting between the two is one of the most common sums in power engineering, and getting the √3 wrong on a three-phase system gives an answer off by 73 %.

This calculator converts apparent power in kVA to line current for single-phase and three-phase supplies at any voltage, and current back to kVA. With a power factor it also gives the active power in kW and the reactive power in kvar. It is for electricians, electrical engineers, and anyone sizing cables and protection for a transformer, generator or supply.

## Formulas

Three-phase, with the line-to-line voltage:

    I = S / (√3 × V)
    S = √3 × V × I

Single-phase:

    I = S / V
    S = V × I

Active and reactive power at a power factor cos φ:

    P = S × cos φ
    Q = S × sin φ = S × √(1 − cos² φ)

- S — apparent power, VA (1 kVA = 1000 VA)
- V — voltage, V (line-to-line for three-phase)
- I — line current, A

## Assumptions and limitations

- The supply is balanced and sinusoidal. For three-phase the voltage is line-to-line and the current is the line current, whether the load is connected in star or delta.
- The kVA set the current. The power factor only converts them to kW, which is why kVA-rated equipment carries its full current at any power factor.
- For a transformer, enter the voltage of the winding whose current you want. The secondary current at 400 V is far higher than the primary current at 11 kV.
- Harmonics from drives and rectifiers raise the RMS current above the fundamental value given here.

## Worked example

What is the full-load current of a 1000 kVA transformer secondary at 400 V three-phase?

1. Three-phase formula: I = S / (√3 × V).
2. I = 1 000 000 / (1.732 × 400) = 1 443 A.
3. At a power factor of 0.8, the transformer supplies 1000 × 0.8 = 800 kW.

The cables or busbar from this transformer must carry 1 443 A, before any derating for grouping or temperature.

## FAQ

**How do I convert kVA to amps?**
For three-phase, divide the VA by √3 times the line voltage. For single-phase, divide the VA by the voltage. 1 kVA at 400 V three-phase is 1.443 A.

**Why √3 for three-phase?**
Three phases each carry the line current at the phase voltage, which is the line voltage divided by √3. Adding up the three phases gives √3 × V × I.

**What is the difference between kVA and kW?**
kVA is apparent power, voltage times current. kW is the real power doing work, kVA times the power factor. At 0.8 power factor, 100 kVA is 80 kW.

**How many amps is a 500 kVA generator?**
At 400 V three-phase, 722 A; at 480 V, 601 A; at 690 V, 418 A.

**Why are generators rated in kVA?**
Their windings are limited by current, whatever the power factor of the load. The engine is limited by kW, which is why both ratings appear on the plate.

**Do I use phase or line voltage?**
Line-to-line voltage with the √3 formula, for example 400 V in Europe or 480 V in North America. Using phase voltage needs a factor of 3 instead.

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — motor currents from the nameplate.
- [Transformer sizing and voltage regulation](../transformer-sizing/index.html) — choosing the transformer kVA.
- [Generator load, kVA and fuel](../generator-load/index.html) — loading generators in kW and kVA.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable for the current found here.
