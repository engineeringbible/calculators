# Series and parallel resistor calculator

**Summary:** Equivalent resistance of any number of resistors in series and in parallel, how the voltage or current divides, and the totals at a given voltage.

## Introduction

Resistors in series add up; resistors in parallel combine into something smaller than the smallest of them. These two rules are how a circuit is reduced to a single equivalent resistance, and how designers reach a value they do not have in the drawer, such as two 10 kΩ parts in parallel for 5 kΩ.

This calculator takes any number of resistors, typed as plain numbers or as they are marked on parts and drawings (4k7, 2R2, 1M), and returns both the series and the parallel equivalent at once. A table shows how the voltage divides between them in series and how the current divides in parallel. Enter the applied voltage to see the currents and the power as well. It is for students, technicians and engineers working with resistor networks.

## Formulas

Series, with the same current through every resistor:

    R = R₁ + R₂ + … + Rₙ

Parallel, with the same voltage across every resistor:

    1 / R = 1 / R₁ + 1 / R₂ + … + 1 / Rₙ
    two resistors:  R = R₁ R₂ / (R₁ + R₂)
    n equal resistors:  R = R₁ / n

Voltage division in series and current division in parallel:

    V_i = V × R_i / R_series
    I_i = I × (1 / R_i) / (1 / R_parallel)

## Assumptions and limitations

- The resistors are ideal, at their nominal values. Tolerances add in series in the worst case; in parallel the largest relative error still shows.
- Each list is treated as all series or all parallel. For a mixed network, reduce each parallel group first, then put the groups in series.
- The applied voltage is across the whole series chain or across the parallel group. In a real circuit, the source's own resistance adds in series.
- The power rating of each part is not checked. In parallel, the smallest resistor takes the largest share of the current and the most heat.

## Worked example

Three resistors, 100 Ω, 220 Ω and 470 Ω, are connected first in series and then in parallel. What is the equivalent resistance in each case?

1. Series: R = 100 + 220 + 470 = 790 Ω.
2. Parallel: 1 / R = 1/100 + 1/220 + 1/470 = 0.01 + 0.004545 + 0.002128 = 0.016673 S.
3. So the parallel equivalent is R = 1 / 0.016673 = 60.0 Ω, below the smallest resistor, as it must be.
4. In series, the 470 Ω resistor takes 470 / 790 = 59.5 % of the voltage. In parallel, the 100 Ω resistor takes 60.0 % of the current.

## FAQ

**Why is the parallel resistance smaller than any of the resistors?**
Each extra resistor in parallel adds another path for the current. More paths mean less opposition overall, so the total always falls below the smallest single value.

**How do I make a value I don't have?**
Combine standard parts. Two equal resistors in parallel give half the value, and in series twice. For 5 kΩ, use two 10 kΩ in parallel; for 15 kΩ, use 10 kΩ and 4.7 kΩ in series, which gives 14.7 kΩ.

**How do I solve a mixed series-parallel circuit?**
Reduce it in steps. Replace each group of parallel resistors with its equivalent, add up whatever is now in series, and repeat until one resistance is left.

**Which resistor gets hottest?**
In series, the largest one, because it has the largest voltage across it at the same current. In parallel, the smallest one, because it carries the most current at the same voltage.

**How do I enter values like 4.7 kΩ?**
As 4.7k or 4k7. The letter stands in for the decimal point on markings: 2R2 is 2.2 Ω, 1M5 is 1.5 MΩ.

**Does this work for impedances?**
For resistors only. Inductors combine like resistors, while capacitors combine the opposite way; see the capacitor calculator.

## Related calculators

- [Ohm's law and electrical power](../ohms-law/index.html) — current and power in each resistor.
- [Voltage divider](../voltage-divider/index.html) — two resistors in series used to scale a voltage.
- [Resistor colour code](../resistor-color-code/index.html) — reading the values off the parts.
- [Series and parallel capacitors](../capacitors-series-parallel/index.html) — the same exercise for capacitors.
