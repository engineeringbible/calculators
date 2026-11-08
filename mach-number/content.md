# Speed of sound and Mach number calculator

**Summary:** Speed of sound from temperature or altitude, Mach number from a speed, and the speed for a given Mach, in mph, knots, km/h and m/s.

## Introduction

The Mach number is a speed divided by the local speed of sound. The speed of sound in air depends only on the temperature: a = √(γ R T). At 15 °C it is 340.3 m/s, or 761.2 mph. High up the air is colder, so sound is slower and the same speed is a higher Mach number. At 35 000 ft in the standard atmosphere, 500 mph is Mach 0.754.

This calculator gives the speed of sound from a measured temperature or a standard-atmosphere altitude. It then finds the Mach number for a speed, or the speed for a Mach number, with the flow regime and the total temperature. It is for pilots, students, model-rocket fliers and anyone asking how fast Mach 1 is.

## Formulas

Speed of sound and Mach number:

    a = √(γ R T)
    M = V / a
    V = M × a

Total (stagnation) temperature:

    T_total = T × (1 + (γ − 1) / 2 × M²)

Standard atmosphere temperature:

    T = 288.15 K − 6.5 K/km × h      up to 11 km (36 089 ft)
    T = 216.65 K                      from 11 to 20 km

- γ — ratio of specific heats, 1.4 for air
- R — specific gas constant, 287.05 J/(kg·K) for air
- T — static air temperature in kelvin; V — speed

## Assumptions and limitations

- Air is treated as an ideal gas. Pressure does not change the speed of sound, only temperature does.
- The altitude option uses the standard atmosphere. On a real day the temperature can differ by many degrees, so enter the measured temperature when you know it.
- Humid air carries sound slightly faster than dry air. The calculator uses dry air.
- Above about Mach 5 the air gets so hot that γ falls below 1.4. The total temperature shown is then too high.
- For other gases, enter their own γ and R.

## Worked example

An airliner flies at 500 mph true airspeed at 35 000 ft on a standard day. What is its Mach number?

1. Standard temperature at 35 000 ft (10 668 m): 288.15 − 0.0065 × 10 668 = 218.81 K, or −54.34 °C.
2. Speed of sound: √(1.4 × 287.05 × 218.81) = 296.5 m/s, or 663.3 mph.
3. Mach number: 500 / 663.3 = 0.754.
4. Total temperature: 218.81 × (1 + 0.2 × 0.754²) = 243.7 K, or −29.5 °C.

The flight is subsonic. A probe on the aircraft would read close to the total temperature, about 25 °C warmer than the outside air.

## FAQ

**How fast is Mach 1?**
761.2 mph, 661.5 kn or 1 225 km/h at sea level on a standard 15 °C day. At 36 089 ft and above, where the standard temperature is −56.5 °C, it is 660.1 mph.

**Does the speed of sound change with altitude?**
Only because the temperature changes. In the stratosphere, where the temperature is constant, the speed of sound is constant too.

**How do I calculate Mach number?**
Divide the true airspeed by the speed of sound at the outside air temperature. Use true airspeed, not indicated airspeed.

**What is the speed of sound at 20 °C?**
343.2 m/s, or 767.8 mph.

**What is transonic flight?**
Flight between about Mach 0.8 and 1.2, where part of the flow over the aircraft is supersonic and shock waves form.

**What is total temperature?**
The temperature air reaches when brought to rest without heat loss. It is the temperature a probe measures at high speed.

## Related calculators

- [True airspeed](../true-airspeed/index.html) — TAS and Mach from calibrated airspeed.
- [Density altitude](../density-altitude/index.html) — pressure and density altitude.
- [Drag and lift force](../drag-lift/index.html) — forces at a given speed.
- [Rocket equation](../rocket-equation/index.html) — delta-v from exhaust velocity and mass.
