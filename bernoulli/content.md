# Bernoulli's equation calculator

**Summary:** Pressure at a second point from Bernoulli's equation, with velocity from the bores (venturi, reducer, nozzle), height change and head loss.

## Introduction

Bernoulli's equation says that along a flowing stream, pressure, velocity and height trade off against each other. Where a pipe narrows, the fluid speeds up and its pressure falls. Where it rises, pressure is spent lifting it. Friction takes a share along the way. This single balance explains venturi meters, nozzles, siphons, the pressure at the top of a riser and the suction at a pump inlet.

This calculator finds the pressure at a second point from the pressure, velocity and height at the first. The velocity at the second point can be entered directly or worked out from the two bores, as for a venturi, reducer or nozzle. Head loss from friction can be added to turn it into the full energy equation. It shows the dynamic pressures, the total head and the flow, and warns when the pressure falls low enough for cavitation. It is for mechanical, process and marine engineers, and for students of fluid mechanics.

## Formulas

Bernoulli's equation with a head loss (the energy equation):

    p₁ + ½ ρ V₁² + ρ g z₁ = p₂ + ½ ρ V₂² + ρ g z₂ + ρ g h_L

Solved for the pressure at point 2:

    p₂ = p₁ + ½ ρ (V₁² − V₂²) + ρ g (z₁ − z₂ − h_L)

Continuity, for the velocity from the two bores:

    V₂ = V₁ × (D₁ / D₂)²

Total head:

    H = p / (ρ g) + V² / (2 g) + z

- p — pressure, Pa (both gauge or both absolute)
- V — mean velocity, m/s
- z — height above a common datum, m
- h_L — head loss between the points, m
- g = 9.806 65 m/s²

## Assumptions and limitations

- The flow is steady and incompressible. That covers liquids, and gases only while the pressure changes by less than about 10 %.
- Without a head loss the flow is frictionless, which gives an upper bound on the recovered pressure. Real pipes and fittings lose energy; take the loss from the pipe flow calculator.
- Both pressures must use the same reference. Cavitation is judged on absolute pressure, so gauge readings are converted with a standard atmosphere for that check.
- The velocities are mean values with a uniform profile. In laminar flow the kinetic energy is about twice what the mean velocity suggests.

## Worked example

Water at 20 °C flows at 1 m/s in a 100 mm pipe at 200 kPa gauge, then through a venturi throat of 50 mm at the same height. What is the pressure in the throat?

1. Continuity: V₂ = 1 × (100 / 50)² = 4 m/s, because the area falls to a quarter.
2. Dynamic pressures: ½ × 998.2 × 1² = 0.50 kPa upstream and ½ × 998.2 × 4² = 7.99 kPa in the throat.
3. Pressure change: p₁ − p₂ = 7.99 − 0.50 = 7.49 kPa.
4. Throat pressure: p₂ = 200 − 7.49 = 192.5 kPa gauge.

That pressure difference is what a venturi meter measures to find the flow. In a frictionless venturi the pressure recovers fully downstream; a real one loses 10 to 20 % of the difference.

## FAQ

**Why does pressure drop where the pipe narrows?**
The same flow must pass a smaller area, so the fluid speeds up. The extra kinetic energy comes out of the pressure.

**Can I use gauge pressure?**
Yes, if both points use it. Only cavitation needs absolute pressure, and the calculator adds an atmosphere for that check.

**Where do I get the head loss?**
From the pipe flow and pressure drop calculator for straight pipe and fittings, or from a fitting's loss coefficient: h_L = K V² / 2g.

**When does Bernoulli's equation not apply?**
Across pumps and turbines, which add or remove energy; in flows with large heat transfer; and for gases with large pressure changes. It also cannot describe flow through a shock or a hydraulic jump.

**What is cavitation?**
Where the absolute pressure falls to the liquid's vapour pressure, the liquid boils locally. The bubbles collapse as the pressure recovers, which damages pumps, valves and propellers.

**How does a venturi meter work?**
It measures the pressure drop between the inlet and the throat. With Bernoulli and continuity that drop gives the velocity, and the flow follows; a calibrated discharge coefficient corrects for friction.

## Related calculators

- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — flow meters with standard discharge coefficients.
- [Flow rate and pipe velocity](../flow-rate-velocity/index.html) — velocities from flow and bore.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the head loss between the points.
- [Hydrostatic pressure at depth](../hydrostatic-pressure/index.html) — the pressure of a still liquid column.
