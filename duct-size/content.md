# Duct size calculator

**Summary:** Round and rectangular duct size for an airflow by friction rate or velocity, with the velocity, pressure loss per 100 ft or per metre, and standard sizes.

## Introduction

A duct that is too small makes the fan work harder, the air noisy and the far rooms starved. One that is too big costs more and is hard to fit. The usual way to size ducts in homes and low-pressure systems is the equal-friction method: choose a friction loss per length, typically 0.08 to 0.10 inches of water per 100 ft, and size every duct for it. At 0.10, a 1 000 cfm main needs a 14 in round duct.

This calculator finds the round diameter for an airflow at a chosen friction rate or velocity, rounds it to standard inch and metric sizes, and gives the equivalent rectangular duct for one fixed side. It reports the velocity, the friction and the velocity pressure, and works in cfm, ft/min and in. w.c. or in m³/h, m/s and Pa/m. It replaces the cardboard duct calculator (ductulator) for HVAC designers and installers.

## Formulas

Friction loss in a round duct (Darcy–Weisbach) with the Colebrook friction factor:

    Δp/L = f × ρ V² / (2 D)
    1/√f = −2 log10( ε/(3.7 D) + 2.51/(Re √f) ),   Re = ρ V D / μ

Velocity and the rectangular equivalent (Huebscher):

    V = Q / (π D² / 4)
    D_e = 1.30 × (a b)^0.625 / (a + b)^0.25

- Q — airflow; V — velocity; D — round diameter
- ρ = 1.204 kg/m³ and μ = 1.81 × 10⁻⁵ Pa·s, standard air at 20 °C
- ε — roughness: 0.09 mm for galvanized steel duct
- a, b — sides of the rectangular duct with the same friction as diameter D_e

## Assumptions and limitations

- The friction calculation is the one behind the ASHRAE duct friction chart and gives the same sizes within the chart's reading accuracy.
- Galvanized steel is assumed by default. Flexible duct is much rougher, and compressed or sagging flex can double the loss; size it larger or use the manufacturer's chart.
- Only the straight duct is sized. Elbows, takeoffs, registers and filters add losses, so the total effective length, not the measured length, sets the fan pressure.
- Air at other temperatures or altitudes has a different density. The friction changes in proportion to the density, so correct with the air density calculator for hot air or high sites.

## Worked example

A 2.5-ton air handler moves 1 000 cfm through a round supply main sized at 0.10 in. w.c. per 100 ft. What diameter is needed?

1. Try diameters until the Darcy–Weisbach friction equals 0.10 in. w.c./100 ft (0.817 Pa/m).
2. The exact diameter is 13.65 in, with a velocity of 983 ft/min.
3. The next standard round size is 14 in, or 400 mm in metric sizes.
4. With an 8 in fixed height, the equivalent rectangular duct is about 8 × 20.6 in.

A 14 in round main, or a 21 × 8 in rectangular one, carries the airflow at the chosen friction rate.

## FAQ

**What size duct do I need for 400 cfm?**
At 0.10 in. w.c. per 100 ft, a 10 in round duct (9.7 in exact), with a velocity of about 780 ft/min.

**What friction rate should I use?**
0.08 to 0.10 in. w.c. per 100 ft is typical for residential supply ducts and 0.05 to 0.08 for returns. ACCA Manual D derives it from the fan pressure available and the total effective length.

**How many cfm does a 6 inch duct carry?**
About 100 cfm at 0.10 in. w.c. per 100 ft in rigid metal duct, and less in flexible duct.

**What velocity is acceptable in a duct?**
In homes, about 700 to 900 ft/min in supply mains and 600 or less in branches, to keep noise down. Commercial mains can run at 1 500 to 2 000 ft/min.

**How do I convert a round duct to rectangular?**
Use the equivalent diameter: a 12 × 12 in duct has the same friction as a 13.1 in round one. Enter one side and the calculator gives the other.

**Why does the result differ slightly from my ductulator?**
Ductulators are read by eye from a chart drawn for a particular roughness and air density. Differences of a few percent in diameter are normal.

## Related calculators

- [Air changes per hour and CFM](../air-changes/index.html) — the airflow each room needs.
- [Air density calculator](../air-density/index.html) — correct for altitude and temperature.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the same method for liquids in pipes.
- [Reynolds number](../reynolds-number/index.html) — laminar or turbulent flow.
