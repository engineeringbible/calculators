# Ideal gas law calculator (PV = nRT)

**Summary:** Pressure, volume, temperature or amount of a gas from PV = nRT, with its mass, density and specific gas constant for air, N₂, CO₂, H₂ and more.

## Introduction

The ideal gas law links the four things that describe a gas in a container: its pressure, its volume, its temperature and how much of it there is. Know three and the fourth follows. With the gas's molar mass, the same equation gives its mass and its density, which is how engineers find the air in a room, the gas in a cylinder, the pressure rise in a closed vessel that heats up, or the density of a gas in a duct.

This calculator solves for whichever variable you need and converts the amount into kilograms for air, nitrogen, oxygen, carbon dioxide, methane, hydrogen, helium, argon, ammonia or a gas of your own. It is for mechanical, process and marine engineers, and for students of thermodynamics and chemistry.

## Formulas

The ideal gas law:

    P V = n R T

Rearranged for each unknown:

    n = P V / (R T),   P = n R T / V,   V = n R T / P,   T = P V / (n R)

Mass, density and the specific gas constant:

    m = n M
    ρ = P M / (R T)
    R_specific = R / M

- P — absolute pressure, Pa
- V — volume, m³
- n — amount of gas, mol
- T — absolute temperature, K (T = t + 273.15 for t in °C)
- R — molar gas constant, 8.314 462 618 J/(mol·K), exact
- M — molar mass, kg/mol (air 0.028 965, N₂ 0.028 013, CO₂ 0.044 010)

## Assumptions and limitations

- The gas is ideal. Real gases follow the law to within about 1 % at pressures of a few bar and temperatures well above their boiling point. At high pressure, multiply n R T by the compressibility factor Z from a chart or an equation of state.
- Pressure must be absolute. A gauge reading of 7 bar is 8.01 bar absolute at sea level, and entering the gauge value gives an answer about 13 % low.
- Temperature must be absolute. The calculator converts °C and °F for you, but a ratio of temperatures in °C is meaningless.
- Molar masses are for the pure gas. Humid air is slightly lighter than dry air, and natural gas is heavier than pure methane.
- Near condensation, such as carbon dioxide below 31 °C under pressure or any gas close to its boiling point, the ideal gas law does not apply.

## Worked example

How much air is in a room 5 m × 4 m × 2.5 m at normal atmospheric pressure and 20 °C?

1. Volume: V = 5 × 4 × 2.5 = 50 m³.
2. Absolute pressure: P = 101.325 kPa = 101 325 Pa. Absolute temperature: T = 20 + 273.15 = 293.15 K.
3. Amount of air: n = P V / (R T) = 101 325 × 50 / (8.314 × 293.15) = 2 079 mol.
4. Mass: m = n M = 2 079 × 0.028 965 = 60.2 kg.
5. Density: ρ = P M / (R T) = 1.204 kg/m³, the textbook density of air at 20 °C.
6. The specific gas constant of air is R / M = 8.314 / 0.028 965 = 287.1 J/(kg·K).

So an ordinary room holds about 60 kg of air. Heated to 30 °C in a sealed space, its pressure would rise in proportion to the absolute temperature, by 10 / 293 = 3.4 %, which is why a sealed, sunlit enclosure builds up pressure.

## FAQ

**Why must I use absolute pressure and temperature?**
The law describes gas molecules from zero pressure and zero temperature upward. Gauge pressure and °C have arbitrary zeros, so they give wrong answers unless converted first.

**What is the value of R?**
8.314 462 618 J/(mol·K), exact by definition since 2019. In other units it is 0.083 145 L·bar/(mol·K) or 0.082 057 L·atm/(mol·K).

**When does the ideal gas law fail?**
At high pressure, near condensation, and at very low temperature. A 200 bar nitrogen cylinder holds a few per cent less gas than the ideal law predicts; steam near saturation needs steam tables instead.

**How do I find the density of air at another altitude or temperature?**
Enter the local absolute pressure and temperature. At 35 °C and 101.3 kPa, air is 1.145 kg/m³, about 5 % lighter than at 20 °C, which matters for fan and engine performance.

**What is the specific gas constant?**
The molar constant divided by the gas's molar mass: 287 J/(kg·K) for air, 297 for nitrogen, 189 for carbon dioxide. It lets you write the law per kilogram as P = ρ R_specific T.

**How do I use it for a gas mixture?**
Use the mixture's mean molar mass, the mole-fraction average of its components, as a custom gas. Dry air is itself such a mixture of 78 % nitrogen, 21 % oxygen and 1 % argon.

## Related calculators

- [Starting air receivers and compressors](../starting-air/index.html) — compressed air stored in receivers.
- [Tank volume and partial fill](../tank-volume/index.html) — the volume of a vessel to enter here.
- [Pipe and tank insulation heat loss](../pipe-insulation/index.html) — heat lost from a gas-filled vessel.
- [Engineering unit converter](../unit-converter/index.html) — pressure and temperature in other units.
