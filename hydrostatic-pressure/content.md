# Hydrostatic pressure calculator

**Summary:** Gauge and absolute pressure at a depth in water, sea water, fuel or any liquid, its head in metres of water, and the force on a flat surface.

## Introduction

The pressure in a still liquid grows steadily with depth, because each layer carries the weight of all the liquid above it. That simple rule sets the load on a tank bottom, the test pressure of a vertical pipe, the reading of a level gauge, the pressure on a diver, the load on a hatch below the waterline, and the static head a pump must overcome.

This calculator gives the gauge pressure at any depth in fresh water, sea water, marine fuel, lubricating oil or a liquid of your own, and the absolute pressure with the atmosphere or a tank pressure added on top. It also shows the head in metres of water, the pressure rise per metre, and the force on a horizontal surface such as a tank bottom or a hatch. It is for marine, civil, mechanical and process engineers, and for divers and students.

## Formulas

Gauge and absolute pressure:

    p_gauge = ρ × g × h
    p_abs = p_surface + ρ × g × h

Head in metres of water, and the force on a horizontal surface:

    H = p_gauge / (1000 × g)
    F = p_gauge × A

- ρ — liquid density, kg/m³ (fresh water 998.2, sea water 1025.87)
- g — 9.806 65 m/s²
- h — depth below the free surface, m
- p_surface — pressure on the surface, Pa (101.325 kPa at sea level)
- A — horizontal area, m²

## Assumptions and limitations

- The liquid is still and of uniform density. A tank with layers of different temperature, or a mixture, needs an average density.
- Standard gravity is used. Local gravity differs by up to 0.3 % with latitude and altitude.
- The surface pressure defaults to the standard atmosphere at sea level. For a pressurised tank, enter its absolute pressure; at altitude, enter the local atmospheric pressure.
- The force is on a horizontal surface, where the pressure is the same everywhere. On a vertical wall the pressure rises with depth, and the average acts at the centroid of the wall.

## Worked example

What is the pressure on a hull plate 30 m below the sea surface?

1. Sea water density at 15 °C: ρ = 1025.87 kg/m³.
2. Gauge pressure: p = 1025.87 × 9.806 65 × 30 = 301 810 Pa = 301.8 kPa, which is 3.02 bar.
3. Absolute pressure: 301.8 + 101.3 = 403.1 kPa, about four atmospheres.
4. The pressure rises by 10.06 kPa for every metre of sea water.

In fresh water the same depth gives 293.7 kPa gauge, 2.7 % less, which is why draft and stability calculations must use the right water density.

## FAQ

**What is the difference between gauge and absolute pressure?**
Gauge pressure is measured above the surrounding atmosphere, which is what most pressure gauges show. Absolute pressure adds the atmosphere on top and is measured from a perfect vacuum.

**How much does pressure rise per metre of water?**
About 9.8 kPa per metre in fresh water and 10.1 kPa in sea water. That is roughly one bar, or one atmosphere, for every ten metres.

**Does the shape of the tank matter?**
No. The pressure at a given depth depends only on the depth and the density, not on the tank's shape or width. This is the hydrostatic paradox.

**What force acts on a tank bottom?**
The gauge pressure at the bottom times its area. A 2 m × 3 m bottom under 4 m of fuel oil carries about 195 kN, the weight of the oil above it.

**What is a metre of water column?**
A pressure unit equal to the pressure at the bottom of 1 m of water, 9.81 kPa. Pump heads and low pressures are often given this way.

**Does water compress at depth?**
Slightly, about 0.5 % per 1000 m. For engineering depths the constant-density result is accurate; in the deep ocean it understates the pressure a little.

## Related calculators

- [Bernoulli's equation and venturi](../bernoulli/index.html) — the same pressure balance for a moving fluid.
- [Tank volume and partial fill](../tank-volume/index.html) — how much liquid sits above the bottom.
- [Pipe volume and mass of contents](../pipe-volume/index.html) — the contents of a vertical pipe.
- [Draft survey](../draft-survey/index.html) — water density in ship displacement.
