# Engineering unit converter

**Summary:** Convert pressure, torque, power, flow, length, mass, speed, temperature, energy and marine units (knots, nautical miles, tonnes, long tons) from one shared table.

## Introduction

Every calculator in this library converts units through one shared table; this page exposes that table directly. Choose a quantity, enter a value, pick the units, and the converted value appears together with the factor and the same value in every unit of the quantity. Because the factors are the same ones the other calculators use, a number converted here agrees exactly with what the pipe-flow or fuel calculator would show.

It is for engineers moving between SI and imperial data sheets, for seafarers working in knots, nautical miles and long tons, and for students who want exact definitions rather than rounded rules of thumb.

## Formulas

Every unit has a factor to the base unit of its quantity, and temperature units also have an offset:

    base  = (value + offset) × factor
    value = base / factor − offset
    converted = fromBase(toBase(value, from), to)

Key exact definitions used (base units SI):

| Unit | Definition |
|---|---|
| nautical mile | 1852 m |
| knot | 1 nmi/h = 0.514444 m/s |
| inch, foot, yard, mile | 25.4 mm, 0.3048 m, 0.9144 m, 1609.344 m |
| pound, long ton, short ton | 0.45359237 kg, 2240 lb = 1016.0469 kg, 2000 lb = 907.18474 kg |
| tonne | 1000 kg |
| pound-force, kilogram-force | 4.4482216 N, 9.80665 N |
| psi, bar, atm, mmHg | 6894.757 Pa, 10⁵ Pa, 101 325 Pa, 133.3224 Pa |
| horsepower, metric horsepower (PS) | 550 ft·lbf/s = 745.69987 W, 75 kgf·m/s = 735.49875 W |
| Btu (IT), calorie (thermochemical), kWh, toe | 1055.05585 J, 4.184 J, 3.6 MJ, 41.868 GJ |
| US gallon, imperial gallon, oil barrel | 3.785411784 L, 4.54609 L, 158.987295 L |
| °F to K | (°F + 459.67) × 5/9; °C to K: °C + 273.15 |

Quantities covered: length, area, volume, mass, time, speed, angle, force, pressure and stress, torque, power, energy, volume flow, mass flow, density, temperature, temperature difference, specific fuel consumption, rotational speed, ratio, price per mass, cost per distance, mass per distance, TPC, MCTC, mass moment, kinematic and dynamic viscosity, heat transfer coefficient, thermal conductivity, specific heat, second moment of area, section modulus, distributed load, voltage, current, resistance, resistivity, resistance per length, acceleration, frequency, fouling resistance.

## Assumptions and limitations

- Horsepower is mechanical horsepower; metric horsepower is listed separately as PS. Electrical (746 W) and boiler horsepower are not included.
- Btu is the International Table Btu; the calorie is thermochemical (4.184 J). Other definitions differ in the fourth significant figure.
- Gallons and tons must be chosen explicitly: US or imperial gallon; tonne, long ton or short ton.
- Temperature levels convert with offsets; use the "temperature difference" quantity for intervals and tolerances (10 K = 18 °F, not 50 °F).
- Currency units carry no exchange rate and are not offered for conversion.
- Results show seven significant digits. Factors that are themselves exact give exact results; chained non-exact factors may differ in the last digit from a direct table.

## Worked example

A pump curve gives 440 US gpm at 150 ft head with a 25 hp motor, and the ship's documentation wants m³/h, metres and kW.

1. Flow: 440 US gpm × 3.785411784 L/gal × 60 min/h = 99 935 L/h = 99.9 m³/h.
2. Head: 150 ft × 0.3048 = 45.72 m.
3. Power: 25 hp × 0.74569987 = 18.64 kW.
4. Cross-check through energy: 1 kWh = 3 412.14 Btu, so a 500 kW auxiliary engine load for 24 h is 12 000 kWh = 40.9 million Btu.

Marine example: a ship logs 324 nmi in 24 h; 324 nmi = 600.0 km, average 13.5 kn = 6.94 m/s = 25.0 km/h.

## FAQ

**Why are there two horsepowers?**
Mechanical horsepower (hp, 745.7 W) is the British/US unit; metric horsepower (PS, CV, ch, 735.5 W) is used in continental Europe and in some engine ratings. They differ by 1.4 %.

**Is a knot exactly 0.5144 m/s?**
A knot is exactly 1852/3600 m/s = 0.514444… m/s because the nautical mile is defined as exactly 1852 m.

**Which ton does a bunker delivery note mean?**
Metric tonnes (1000 kg) almost always; long tons (1016 kg) survive in some older contracts and in US displacement figures. The 1.6 % difference is worth checking on a large stem.

**Why does 10 °C not equal 50 °F in the difference group?**
Because an interval has no offset: a rise of 10 °C is a rise of 18 °F. Only temperature levels use the +32 offset.

**How do I convert fuel consumption units?**
Specific fuel consumption (g/kWh, lb/hp·h, g/MJ) is its own quantity in the list. Daily consumption in t/day and kg/h is under mass flow.

**Can I add a unit?**
Yes: add it to the group in shared/units.js with its exact factor and it appears here and in every calculator automatically. Run `node run-tests.js unit-converter` to confirm the round-trip test still passes.

**Why is pressure the same group as stress?**
Both are force per area; MPa = N/mm² is the usual stress unit and is listed alongside bar, psi and atm.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — tonnes, long tons, knots, nautical miles in use.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — bar, psi, m³/h, gpm, cSt.
- [Beam deflection and bending stress](../beam-deflection/index.html) — cm⁴, in⁴, MPa, ksi.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — Ω/km and Ω/kft.
