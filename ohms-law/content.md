# Ohm's law and electrical power calculator

**Summary:** Voltage, current, resistance and power from any two of them, with Ohm's law V = I R and P = V I, for DC and resistive AC circuits.

## Introduction

Ohm's law is the first relation every electrician and engineer learns, and the one used most: the voltage across a resistor is the current through it times its resistance. Together with the power law P = V I it ties four quantities together, so any two of them fix the other two. This calculator takes whichever pair you know, voltage and current, voltage and resistance, current and resistance, or power with any one of the others, and returns the rest.

Typical uses are checking the current a heater or a solenoid coil will draw, the resistance a load must have to dissipate a given power, the voltage drop across a known resistance, or the power rating a resistor needs. It is for electricians, technicians, students and anyone sizing a simple DC or resistive AC circuit.

## Formulas

Ohm's law and the power law:

    V = I R
    P = V I = I² R = V² / R

From each pair of known values:

    V and I:  R = V / I,        P = V I
    V and R:  I = V / R,        P = V² / R
    I and R:  V = I R,          P = I² R
    P and V:  I = P / V,        R = V² / P
    P and I:  V = P / I,        R = P / I²
    P and R:  I = √(P / R),     V = √(P R)

Conductance is the inverse of resistance:

    G = 1 / R   (siemens)

- V — voltage across the element, volts (RMS for AC)
- I — current through it, amperes (RMS for AC)
- R — resistance, ohms
- P — power dissipated, watts

## Assumptions and limitations

- The element is a linear resistor. Lamps, diodes, heating elements at switch-on and semiconductors change their resistance with current, so a single value only describes one operating point.
- For AC the values are RMS and the load is purely resistive. Motors, transformers and electronic loads have a power factor below 1, and then P = V I cos φ; use the three-phase power calculator for those.
- The resistance is the value at operating temperature. A copper winding is about 4 % more resistive for every 10 K it warms up, so a cold measurement understates the running resistance.
- All four quantities belong to the same element. In a circuit with several resistors, apply the law to each one separately, or first reduce the network to its equivalent resistance.

## Worked example

A 24 V DC solenoid valve coil measures 48 Ω. What current does it draw, and how much heat does it produce?

1. Known values: voltage and resistance, V = 24 V and R = 48 Ω.
2. Current: I = V / R = 24 / 48 = 0.5 A.
3. Power: P = V² / R = 24² / 48 = 576 / 48 = 12 W, the same as V × I = 24 × 0.5 = 12 W.
4. Conductance: G = 1 / 48 = 0.0208 S.

So the coil draws 0.5 A and turns 12 W into heat. A supply for four such valves switched together needs at least 2 A, and the coil's 12 W is what its housing must shed when it is held energised for long periods.

## FAQ

**Does Ohm's law work for AC?**
Yes, with RMS values and a purely resistive load such as a heater. When the load has inductance or capacitance, the ratio of voltage to current is the impedance, and the power is V I cos φ rather than V I.

**Why do I get a different resistance when I measure a lamp cold?**
A tungsten filament's resistance rises roughly tenfold from cold to working temperature. Ohm's law still holds at each instant, but the resistance itself depends on the current, so use the hot value for running power.

**What power rating should a resistor have?**
At least the power from this calculator, and commonly twice it, so the resistor runs well below its maximum temperature. A resistor dissipating 0.25 W should be a 0.5 W part.

**How is power related to energy on a bill?**
Energy is power multiplied by time. A 1 kW heater running for 3 hours uses 3 kWh, whatever its voltage.

**Why does a thin cable get hot?**
Its resistance turns current into heat at a rate of I² R. Doubling the current quadruples the heating, which is why cable sizes rise quickly with load current.

**What is conductance?**
The inverse of resistance, in siemens. It is convenient when resistors are in parallel, because conductances in parallel simply add.

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — for loads with a power factor and for three-phase supplies.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable that carries the current found here.
- [Battery capacity and runtime](../battery-runtime/index.html) — how long a battery supplies this current.
- [Generator load, kVA and fuel](../generator-load/index.html) — adding loads up on a generator.
