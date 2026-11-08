# kVA to kW calculator

**Summary:** Real power in kW from a kVA rating at the power factor, with the kvar and the rated line current of a generator, transformer or UPS.

## Introduction

A generator plate says 500 kVA. How many kilowatts of load can it actually run? The answer depends on the power factor of what is connected. At the usual 0.8 the answer is 400 kW; at a lower power factor it is less, and at a higher one the engine, not the alternator, becomes the limit.

This calculator converts an apparent power rating in kVA into the real power in kW at a given power factor. It also gives the reactive power in kvar and the rated line current at the supply voltage. It is for engineers and electricians matching loads to generators, transformers and UPS units.

## Formulas

Real and reactive power from apparent power:

    P = S × cos φ
    Q = S × sin φ = S × √(1 − cos² φ)

Rated line current:

    three-phase:   I = S / (√3 × V)
    single-phase:  I = S / V

- S — apparent power, kVA
- P — real power, kW
- cos φ — power factor of the load

## Assumptions and limitations

- The kW available depend on the load's power factor, not on the equipment. A transformer of 1000 kVA delivers 1000 kW to a resistive load and 700 kW at a power factor of 0.7.
- A generator's engine is rated at the kW for a power factor of 0.8 (ISO 8528-1). Even at unity power factor, a 500 kVA set delivers no more than its 400 kW engine rating.
- Non-linear loads draw harmonic current, which uses up kVA without adding kW.

## Worked example

A standby generator is rated 500 kVA, and the site load has a power factor of 0.8. How much real load can it take, and what is its full-load current at 400 V?

1. Real power: P = 500 × 0.8 = 400 kW.
2. Reactive power: Q = 500 × 0.6 = 300 kvar.
3. Rated current: I = 500 000 / (1.732 × 400) = 722 A.

So the site's running load must stay below 400 kW, and the generator's circuit breaker and cables are sized for 722 A.

## FAQ

**How do I convert kVA to kW?**
Multiply the kVA by the power factor. At 0.8, 100 kVA is 80 kW; at 0.9, 90 kW.

**Is 1 kVA equal to 1 kW?**
Only at a power factor of 1. For motors and mixed loads it is less, typically 0.8 kW per kVA.

**How many kW is a 1000 kVA transformer?**
At a power factor of 0.8, 800 kW; at 0.9, 900 kW. The transformer's limit is its current, so the kW depend on the load.

**Why can't a generator give more kW at unity power factor?**
The engine limits the real power. Its rating matches the alternator's kVA at 0.8 power factor, so above that the engine is the bottleneck.

**What is the current of a 500 kVA generator?**
At 400 V three-phase, 722 A; at 480 V, 601 A.

**How do I find the power factor of my load?**
Read it from a power analyser or the energy meter, or estimate it: about 0.8 for mixed industrial loads, close to 1 for heaters, 0.95 or more for modern electronics with correction.

## Related calculators

- [kW to kVA](../kw-to-kva/index.html) — the kVA needed for a load in kW.
- [kVA to amps](../kva-to-amps/index.html) — the current of a kVA rating at any voltage.
- [Generator load, kVA and fuel](../generator-load/index.html) — loading of one or several generator sets.
- [Transformer sizing and voltage regulation](../transformer-sizing/index.html) — choosing and checking a transformer.
