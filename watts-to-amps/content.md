# Watts to amps calculator

**Summary:** Amps drawn by a load from its watts and the voltage, for DC, single-phase and three-phase circuits, with the power factor for AC loads.

## Introduction

Appliances and equipment are labelled in watts, but fuses, breakers, cables and extension leads are rated in amps. To know whether a heater can share a socket with a kettle, which fuse a plug needs, or how much current a battery inverter must supply, the watts have to be turned into amps, and that depends on the voltage.

This calculator converts watts to amps for DC, single-phase AC and three-phase AC supplies. For AC loads it includes the power factor, which raises the current of motors and electronic equipment above what the watts alone suggest. It is for homeowners, electricians, caravan and boat owners, and engineers.

## Formulas

Current from power:

    DC:            I = P / V
    single-phase:  I = P / (V × cos φ)
    three-phase:   I = P / (√3 × V × cos φ)

Apparent power:

    S = P / cos φ

- P — real power, W
- V — voltage, V (line-to-line for three-phase)
- cos φ — power factor: 1 for heaters and kettles, about 0.8 to 0.9 for motors

## Assumptions and limitations

- The watts are the power the load takes from the supply. A motor's nameplate kW is its shaft output, so the input is higher by its efficiency.
- AC values are RMS at a constant power factor. Loads with poor power-factor correction, such as some LED drivers and chargers, draw more current than their watts suggest.
- For three-phase the load is balanced, and the voltage is the line-to-line voltage, for example 400 V or 480 V.
- Inrush and starting currents are not included. Motors start at 5 to 8 times their running current, and lamps and power supplies have a brief inrush.

## Worked example

A 1500 W electric kettle runs on a 230 V supply. How many amps does it draw?

1. A kettle is a resistive heater, so its power factor is 1.
2. Current: I = P / V = 1500 / 230 = 6.52 A.
3. On a 120 V North American supply the same kettle would draw 1500 / 120 = 12.5 A.

So in Europe the kettle can share a 16 A circuit with other small loads. On a 15 A circuit at 120 V it uses most of the capacity by itself.

## FAQ

**How many amps is 1000 watts?**
At 230 V, 4.35 A; at 120 V, 8.33 A; at 12 V DC, 83 A. The lower the voltage, the higher the current for the same power.

**Why do I need the voltage?**
Watts are volts times amps, so the same power can mean very different currents. A 12 V camping appliance draws nearly twenty times the current of a 230 V one of the same power.

**What power factor should I use?**
Use 1 for heaters, kettles, toasters and incandescent lamps. Use about 0.85 for motors and compressors, and 0.9 to 0.99 for electronics with power-factor correction. Check the label or data sheet if it matters.

**How do I convert watts to amps for three-phase?**
Divide the watts by √3 times the line voltage times the power factor. 11 kW at 400 V and 0.85 is 18.7 A per line.

**Which fuse does my plug need?**
At least the running current found here, rounded up to the next fuse size. A 2 kW heater at 230 V draws 8.7 A, so it needs a 13 A fuse in a UK plug, not a 5 A one.

**Does a higher wattage always mean more amps?**
At the same voltage and power factor, yes, in direct proportion.

## Related calculators

- [Amps to watts](../amps-to-watts/index.html) — the conversion the other way.
- [kW to amps](../kw-to-amps/index.html) — larger loads in kilowatts, and motors.
- [Ohm's law and electrical power](../ohms-law/index.html) — voltage, current, resistance and power together.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable for the current found here.
