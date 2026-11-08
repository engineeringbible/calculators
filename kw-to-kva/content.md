# kW to kVA calculator

**Summary:** Apparent power in kVA for a load in kW at its power factor, with kvar and the line current, to size a generator, transformer or UPS.

## Introduction

Loads are listed in kilowatts, but generators, transformers and UPS units are sold in kVA. The link is the power factor. A plant drawing 400 kW at a power factor of 0.8 needs a 500 kVA source, not a 400 kVA one, because the source must carry the full current, including the part that does no work.

This calculator converts real power in kW to apparent power in kVA at the load's power factor. It also gives the reactive power in kvar and the line current at the supply voltage. It is for engineers sizing standby generators, transformers and UPS systems, and for electricians checking a supply.

## Formulas

The power triangle:

    S = P / cos φ
    Q = S × sin φ = √(S² − P²)

Line current:

    three-phase:   I = S / (√3 × V)
    single-phase:  I = S / V

- P — real power, kW
- S — apparent power, kVA
- Q — reactive power, kvar
- cos φ — power factor of the whole load

## Assumptions and limitations

- The power factor is that of the whole load. For a mix, divide the total kW by the total kVA; do not average the power factors.
- Generators are rated at a power factor of 0.8 by convention (ISO 8528-1). A 500 kVA generator delivers 400 kW, and loads below 0.8 are limited by its kVA.
- The result is the running load. Add margin for motor starting, inrush, growth and the generator's own derating for altitude and temperature.

## Worked example

A plant draws 400 kW at a power factor of 0.8 from a 400 V three-phase supply. What size of generator does it need?

1. Apparent power: S = 400 / 0.8 = 500 kVA.
2. Reactive power: Q = 500 × 0.6 = 300 kvar.
3. Line current: I = 500 000 / (1.732 × 400) = 722 A.

So the generator must be rated at least 500 kVA, before margins. Raising the power factor to 0.95 with capacitors would cut the requirement to 421 kVA.

## FAQ

**How do I convert kW to kVA?**
Divide the kW by the power factor. At 0.8, 100 kW is 125 kVA; at 0.9, 111 kVA.

**What power factor should I assume?**
0.8 is the usual planning value for mixed industrial loads and is how generators are rated. Resistive heating is close to 1. Lightly loaded motors can be 0.5 to 0.7.

**Why are generators rated in kVA?**
The alternator's limit is its current, set by kVA, while the engine's limit is kW. Both appear on the plate: 500 kVA and 400 kW at 0.8 power factor.

**Can I size a UPS from kW?**
Check both ratings. Modern UPS units are rated close to unity power factor, so their kW and kVA ratings are similar, and the load must fit within both.

**How does power-factor correction help?**
It supplies the kvar locally, so the source carries less kVA and current for the same kW, which can allow a smaller transformer or generator.

**What is the difference between kW, kVA and kvar?**
kW does the work, kvar is exchanged back and forth with inductive loads, and kVA is their combined effect on current.

## Related calculators

- [kVA to kW](../kva-to-kw/index.html) — the usable kW of a kVA rating.
- [kVA to amps](../kva-to-amps/index.html) — the current of a kVA rating.
- [Generator load, kVA and fuel](../generator-load/index.html) — loading and redundancy of generator sets.
- [Transformer sizing and voltage regulation](../transformer-sizing/index.html) — choosing a transformer for the kVA.
