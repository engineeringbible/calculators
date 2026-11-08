# Series and parallel capacitor calculator

**Summary:** Equivalent capacitance of capacitors in series or parallel, with the charge, the stored energy and the voltage across each capacitor in a series stack.

## Introduction

Capacitors combine the opposite way to resistors. In parallel their capacitances simply add, which is how banks of capacitors reach large values. In series the total falls below the smallest one, but the stack withstands a higher voltage, which is how high-voltage banks and supercapacitor modules are built.

This calculator takes any number of capacitors, typed as plain microfarads or as marked on parts (100n, 4u7, 22p), and returns the equivalent capacitance for the connection you choose, plus the value the other connection would give. At a given voltage it also gives the charge, the stored energy, and, for each capacitor, its voltage, charge and energy. That shows at once whether any capacitor in a series stack is over its voltage rating. It is for electronics students, technicians and engineers sizing filter, timing and energy-storage banks.

## Formulas

Parallel, with the same voltage across each capacitor:

    C = C₁ + C₂ + … + Cₙ

Series, with the same charge on each capacitor:

    1 / C = 1 / C₁ + 1 / C₂ + … + 1 / Cₙ
    two capacitors:  C = C₁ C₂ / (C₁ + C₂)

Charge, energy and the voltage on each capacitor in series:

    Q = C × V
    E = ½ × C × V²
    V_i = Q / C_i

- C — capacitance, farads (1 µF = 10⁻⁶ F)
- Q — charge, coulombs (shown in µC)
- E — energy, joules (shown in mJ)

## Assumptions and limitations

- The capacitors are ideal, with their nominal values. Ceramic capacitors lose capacitance under DC bias, and electrolytics can be −20 % to +80 % of their marking.
- In series, the ideal voltage split follows capacitance. Over time on DC, leakage currents decide the split instead, so electrolytic and supercapacitor stacks need balancing resistors.
- The voltage is DC, or the peak value for an AC voltage when the stored energy is wanted.
- Each capacitor's voltage rating must exceed the voltage it actually sees. In series, the smallest capacitor sees the most.

## Worked example

Three capacitors, 10 µF, 22 µF and 47 µF, are connected in series across 12 V. What is the total capacitance, and how is the voltage shared?

1. 1 / C = 1/10 + 1/22 + 1/47 = 0.1 + 0.0455 + 0.0213 = 0.1667 per µF, so C = 6.00 µF, below the smallest capacitor.
2. Charge on each capacitor: Q = C × V = 6.00 × 12 = 72.0 µC.
3. Voltages: 72.0 / 10 = 7.20 V on the 10 µF, 72.0 / 22 = 3.27 V on the 22 µF and 72.0 / 47 = 1.53 V on the 47 µF. They add up to 12 V.
4. Stored energy: E = ½ × 6.00 × 10⁻⁶ × 12² = 0.432 mJ.

So the 10 µF capacitor carries 7.20 V, more than half the supply. A 6.3 V part would be overstressed there. In parallel the same three would make 79 µF and store 5.69 mJ.

## FAQ

**Why do capacitors in series give a smaller value?**
In series, the plates are effectively further apart, because the same charge has to pass through every capacitor. That is the opposite of resistors, which add in series.

**Why put capacitors in series at all?**
For voltage. Two 400 V capacitors in series withstand about 800 V, at half the capacitance of one. That is how high-voltage banks and supercapacitor modules are made.

**Do capacitors in series share the voltage equally?**
Only if they are equal. Otherwise the smallest takes the most. On DC, leakage differences shift the split over time, so balancing resistors are fitted across each one.

**How much energy does a capacitor store?**
E = ½ C V². A 1000 µF capacitor at 50 V holds 1.25 J, enough to give a sharp shock or weld a screwdriver tip, so discharge large capacitors before working on them.

**How do I enter 4.7 nF or 100 pF?**
As 4n7 or 4.7n, and 100p. Plain numbers are taken as microfarads.

**Does it matter whether the capacitors are electrolytic?**
The formulas are the same, but polarised capacitors must be connected the right way round. Their wide tolerance and leakage make the real result less exact.

## Related calculators

- [Series and parallel resistors](../resistors-series-parallel/index.html) — the same exercise for resistors, with the opposite rules.
- [RC time constant and filter](../rc-time-constant/index.html) — what the capacitance does with a resistor.
- [Ohm's law and electrical power](../ohms-law/index.html) — the circuit around the capacitors.
- [Power factor correction](../power-factor-correction/index.html) — capacitor banks on AC power systems.
