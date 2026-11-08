# Voltage divider calculator

**Summary:** Output voltage of a two-resistor divider, or the R2 for a target voltage with the nearest E24 or E96 value, plus current, power and the effect of a load.

## Introduction

A voltage divider is two resistors in series across a supply, with the output taken from the point between them. It is the simplest way to scale a voltage down: to bring a 12 V signal into a 3.3 V microcontroller input, to set the reference of a regulator or comparator, or to bias a transistor. The output is a fixed fraction of the input, set only by the ratio of the two resistors.

This calculator works in both directions. Give it the input and both resistors and it returns the output; give it the input, the target output and the top resistor and it finds the bottom resistor, picks the nearest standard E12, E24 or E96 value, and shows the output that value actually gives. It also shows the current and power in each resistor, the drop when a load is connected, and the source resistance the next stage sees. It is for electronics students, hobbyists and engineers designing sensor and reference circuits.

## Formulas

Unloaded output:

    V_out = V_in × R2 / (R1 + R2)

Bottom resistor for a target output:

    R2 = R1 × V_out / (V_in − V_out)

Current and power:

    I = V_in / (R1 + R2),   P_R1 = I² R1,   P_R2 = I² R2

With a load R_L on the output, R2 is replaced by R2 in parallel with R_L:

    R2 ∥ R_L = R2 R_L / (R2 + R_L)

Source resistance seen from the output (Thévenin):

    R_th = R1 ∥ R2 = R1 R2 / (R1 + R2)

## Assumptions and limitations

- The resistors are taken at their nominal values. With 5 % parts, the ratio can be off by up to about 10 % in the worst case; use 1 % parts where the output matters.
- An unloaded divider assumes nothing draws current from the output. Any load in parallel with R2 lowers the output, and the loaded result shows by how much.
- The supply is ideal. A source with its own resistance adds to R1.
- A divider is for setting and sensing voltages, not for powering a circuit. Its output moves as soon as the load current changes, so use a regulator to supply power.

## Worked example

A 12 V signal must be brought down to 3.3 V for a microcontroller input. The top resistor is R1 = 10 kΩ. Which bottom resistor is needed?

1. Exact value: R2 = R1 × V_out / (V_in − V_out) = 10 000 × 3.3 / (12 − 3.3) = 3 793 Ω.
2. The nearest E24 value is 3.9 kΩ.
3. With 3.9 kΩ the output is V_out = 12 × 3 900 / (10 000 + 3 900) = 3.37 V, slightly above the target but within a typical input's tolerance.
4. Divider current: I = 12 / 13 900 = 0.863 mA, so each resistor dissipates only a few milliwatts.
5. The source resistance at the output is 10 kΩ ∥ 3.9 kΩ = 2.8 kΩ. A microcontroller input of several megohms barely loads it.

For an output closer to 3.3 V, the E96 value 3.83 kΩ gives 3.32 V.

## FAQ

**How do I choose the resistor values?**
The ratio sets the output, while the size sets the current. Low values waste power, and very high values are disturbed by the load and by noise. For logic-level sensing, 10 kΩ to 100 kΩ in total is a common choice.

**Why does my output drop when I connect something?**
The load sits in parallel with R2 and lowers the bottom resistance. Keep the load at least ten times larger than R2, or buffer the output with an op-amp follower.

**Can I power a circuit from a voltage divider?**
Not reliably. The output changes with the load current, so a microcontroller or relay would see its supply move. Use a linear regulator or a DC-DC converter.

**What about resistor tolerance?**
Two 5 % resistors can shift the ratio by up to about 10 % in the worst case, and 1 % parts by about 2 %. For a precise reference, use 0.1 % resistors or a trimmer.

**Does a voltage divider work with AC?**
Yes, for resistors at audio and low radio frequencies. At high frequencies, stray capacitance turns it into a frequency-dependent network.

**What is the source resistance for?**
It is what the next stage sees as the divider's internal resistance. It matters for timing with capacitors and for the input current of analogue-to-digital converters.

## Related calculators

- [Ohm's law and electrical power](../ohms-law/index.html) — current and power in each resistor.
- [Series and parallel resistors](../resistors-series-parallel/index.html) — combining resistors to reach the R2 you need.
- [LED series resistor](../led-resistor/index.html) — another series-resistor design.
- [Resistor colour code](../resistor-color-code/index.html) — reading and marking the chosen values.
