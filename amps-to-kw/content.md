# Amps to kW calculator

**Summary:** Real power in kW from current and voltage for three-phase, single-phase and DC circuits, with kVA and kvar at the power factor.

## Introduction

A clamp meter on a feeder reads amps, while energy bills, generator loading and efficiency checks are in kilowatts. Turning a current reading into real power needs the voltage, the number of phases and the power factor. Without the power factor, the current only gives the apparent power in kVA.

This calculator converts a measured or rated current into real power in kW for three-phase, single-phase and DC circuits. It also gives the apparent power in kVA and the reactive power in kvar, the full power triangle. It is for electricians taking readings, engineers checking generator and transformer loading, and energy auditors.

## Formulas

Real, apparent and reactive power:

    three-phase:   P = √3 × V × I × cos φ,   S = √3 × V × I
    single-phase:  P = V × I × cos φ,        S = V × I
    DC:            P = V × I

    Q = S × sin φ = √(S² − P²)

- I — line current, A
- V — voltage, V (line-to-line for three-phase)
- cos φ — power factor

## Assumptions and limitations

- The current is the RMS line current, and the three phases are balanced. For unbalanced phases, the average of the three currents gives an estimate.
- The power factor must be known or measured. A current reading alone cannot separate real power from reactive power.
- Drives and rectifiers draw harmonic currents that raise the RMS amps without real power. For those loads, this result overstates the kW; use a power analyser.

## Worked example

A clamp meter reads 100 A on each phase of a 400 V three-phase feeder supplying a motor load at a power factor of 0.8. What power is flowing?

1. Apparent power: S = 1.732 × 400 × 100 = 69.3 kVA.
2. Real power: P = 69.3 × 0.8 = 55.4 kW.
3. Reactive power: Q = 69.3 × 0.6 = 41.6 kvar.

The supply transformer and cables carry the full 69.3 kVA, while only 55.4 kW does useful work. Correcting the power factor to 0.95 would bring the current down to about 84 A for the same kW.

## FAQ

**How many kW is 100 amps?**
At 400 V three-phase and power factor 0.8, 55.4 kW. At 230 V single-phase and unity power factor, 23 kW. At 480 V three-phase and 0.8, 66.5 kW.

**Can I find kW from a clamp meter reading?**
Only with the power factor. Current alone gives the kVA; a power meter or a power-factor reading is needed for the kW.

**What is kvar?**
Reactive power: energy that flows back and forth between the supply and inductive loads such as motors without doing work. It still loads cables and transformers.

**Why are kVA and kW different?**
Because of the power factor. kVA is voltage times current; kW is the part that does work. At a power factor of 1 they are equal.

**How accurate is this for variable-speed drives?**
Less accurate. Drives draw harmonic currents, so a true-RMS current reading overstates the real power. A power analyser measures the kW directly.

**Should I use line or phase current for three-phase?**
Line current, with the line-to-line voltage, in the √3 formula. That holds for star and delta loads alike.

## Related calculators

- [kW to amps](../kw-to-amps/index.html) — the conversion the other way.
- [Amps to watts](../amps-to-watts/index.html) — small loads and single circuits.
- [kVA to amps](../kva-to-amps/index.html) — currents of transformers and generators.
- [Generator load, kVA and fuel](../generator-load/index.html) — checking a generator against this load.
