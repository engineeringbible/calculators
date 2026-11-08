# Flow rate and pipe velocity calculator

**Summary:** Velocity from flow rate and pipe bore, flow from velocity, or the bore needed for a flow at a target velocity, checked against usual design velocities.

## Introduction

Flow rate, velocity and pipe size are tied together by the simplest equation in fluid mechanics: the flow equals the velocity times the bore area. Engineers use it every day, to check the velocity in an existing line, to see how much a pipe can carry at a sensible velocity, or to pick a pipe size for a new flow.

This calculator works it in all three directions. Give it the flow and the bore to get the velocity, the velocity and the bore to get the flow, or the flow and a target velocity to get the bore you need. It then compares the velocity with the usual ranges for general water lines, pump suctions and oil lines, because too high a velocity means noise, erosion and pressure drop, and too low a velocity means an oversized, expensive pipe. It is for mechanical, process, building-services and marine engineers.

## Formulas

Continuity for a full pipe:

    Q = V × A,   A = π × D² / 4

Each unknown in turn:

    V = Q / A = 4 Q / (π D²)
    Q = V × π D² / 4
    D = √(4 Q / (π V))

Usual design velocities for liquids, in m/s:

    general water and pump discharge  1.0 to 3.0
    pump suction                      0.6 to 1.5
    fuel and lubricating oil          0.5 to 2.0

- Q — volume flow rate, m³/s (1 m³/h = 1/3600 m³/s)
- V — mean velocity, m/s
- D — inside diameter, m

## Assumptions and limitations

- The pipe runs full and the fluid is incompressible. For gases, use the flow at the actual pressure and temperature in the pipe.
- V is the mean velocity over the cross-section. The velocity at the centre is higher, by about 20 % in turbulent flow and twice the mean in laminar flow.
- The design ranges are common practice, not code limits. The allowable pressure drop, noise, water hammer and erosion of the pipe material decide the final size.
- The bore mode returns the exact diameter. Choose the next standard pipe whose bore is at least this large; bores depend on the pipe standard and the wall thickness.

## Worked example

A pump delivers 50 m³/h into a pipe with a 100 mm bore. What is the velocity, and is it reasonable?

1. Flow in SI units: Q = 50 / 3600 = 0.01389 m³/s.
2. Bore area: A = π × 0.1² / 4 = 0.007854 m² = 78.5 cm².
3. Velocity: V = 0.01389 / 0.007854 = 1.77 m/s.
4. That is within the usual 1 to 3 m/s for a water discharge line.

If the same flow should run at 2 m/s, the bore would need to be D = √(4 × 0.01389 / (π × 2)) = 94.0 mm, so a DN 100 pipe of about 100 mm bore suits it.

## FAQ

**What velocity should water flow at in a pipe?**
Typically 1 to 3 m/s for discharge lines, lower in small and quiet domestic pipes, and 0.6 to 1.5 m/s at a pump suction to protect against cavitation.

**How do I convert m³/h to m/s in a pipe?**
Divide the flow by 3600 to get m³/s, then divide by the bore area in m². The calculator does both steps.

**Why is the suction velocity lower than the discharge?**
Pressure is lowest at the pump inlet, and a lower velocity there keeps the friction loss small, leaving more NPSH available against cavitation.

**How do I size a pipe for a given flow?**
Choose a target velocity for the service, find the bore with D = √(4Q/πV), then take the next standard pipe size up. Check the pressure drop over the whole run with the pipe flow calculator.

**Does doubling the pipe diameter halve the velocity?**
No, it quarters it, because the area grows with the square of the diameter.

**Is this valid for gases?**
Yes, at the actual flow, the volume flow at the pipe's own pressure and temperature, not at standard conditions. Gas lines run at much higher velocities, often 10 to 20 m/s.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the pressure drop at this velocity.
- [Pipe volume and mass of contents](../pipe-volume/index.html) — the volume of the same pipe.
- [Reynolds number and flow regime](../reynolds-number/index.html) — whether the flow is laminar or turbulent.
- [Pump and fan affinity laws](../pump-affinity/index.html) — how the flow changes with pump speed.
