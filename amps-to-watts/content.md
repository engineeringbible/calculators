# Amps to watts calculator

**Summary:** Watts from amps and voltage for DC, single-phase and three-phase circuits, with the power factor: what a circuit, fuse or socket can supply.

## Introduction

A socket, fuse, breaker or extension lead is rated in amps. Whether it can run a given appliance depends on the watts that current carries, and that depends on the voltage. The same 13 A that powers a 3 kW heater in a British home would run less than half that from a North American 120 V outlet.

This calculator turns amps into watts for DC, single-phase and three-phase circuits. For AC it includes the power factor, because motors and some electronic loads draw more current than their real power alone would need. It is for homeowners, electricians, event and site power planners, and engineers.

## Formulas

Power from current:

    DC:            P = V × I
    single-phase:  P = V × I × cos φ
    three-phase:   P = √3 × V × I × cos φ

Apparent power:

    S = P / cos φ

- I — current, A
- V — voltage, V (line-to-line for three-phase)
- cos φ — power factor (1 for resistive loads)

## Assumptions and limitations

- The current is the RMS current in each line. For three-phase the load is balanced, and the voltage is line-to-line.
- With a power factor below 1, the circuit carries more volt-amperes than real watts. The circuit's limit is set by the current, not the watts.
- A circuit's rated current is its maximum. Breakers in North America are normally loaded continuously to no more than 80 % of their rating.

## Worked example

How much power can a 13 A socket supply on a 230 V supply?

1. A heater or kettle has a power factor of 1.
2. Power: P = V × I = 230 × 13 = 2 990 W, about 3 kW.
3. So two 2 kW heaters on one socket, 4 kW in all, would overload it.

On a 15 A, 120 V circuit, the most is 120 × 15 = 1 800 W, and 1 440 W for a continuous load at 80 %.

## FAQ

**How many watts is 10 amps?**
At 230 V, 2 300 W; at 120 V, 1 200 W; at 12 V DC, 120 W.

**How many watts can a 16 A circuit supply?**
At 230 V single-phase, 3 680 W. At 400 V three-phase with unity power factor, 11.1 kW.

**Why does the power factor reduce the watts?**
With a power factor below 1, part of the current flows back and forth without doing work. The circuit still carries that current, so the useful watts are lower for the same amps.

**How do I convert amps to watts for three-phase?**
Multiply √3 by the line voltage, the current and the power factor. 32 A at 400 V and 0.9 is 19.95 kW.

**Is a VA the same as a watt?**
Only at a power factor of 1. UPS units and generators are rated in VA, because their limit is the current.

**How many amps can a household circuit take?**
That depends on the local rules and the cable. Common values are 13 A or 16 A per socket in Europe, and 15 A or 20 A per circuit in North America.

## Related calculators

- [Watts to amps](../watts-to-amps/index.html) — the conversion the other way.
- [Amps to kW](../amps-to-kw/index.html) — larger three-phase loads in kilowatts.
- [Ohm's law and electrical power](../ohms-law/index.html) — voltage, current, resistance and power together.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable that carries this current.
