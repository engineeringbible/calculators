# Minor losses calculator (pipe fittings and valves)

**Summary:** Head and pressure loss through elbows, tees, valves, entrances and exits by the Crane K method, with total K and the equivalent pipe length.

## Introduction

Every elbow, tee and valve in a pipe disturbs the flow and costs some pressure. These "minor" losses are often far from minor: in a short pump system with many fittings they can exceed the friction in the straight pipe. Each fitting has a resistance coefficient K, the number of velocity heads it loses, so the total loss is simply the sum of the K values times v² / 2g.

This calculator adds up the K values of common fittings by the method of the Crane Technical Paper 410, the standard reference for valves and fittings. It gives the total K, the head and pressure lost, and the equivalent length of straight pipe. It is for engineers sizing pumps and checking pipe systems.

## Formulas

Head loss and pressure loss through fittings:

    h = ΣK × v² / (2g)
    Δp = ρ g h

Resistance coefficient of a fitting (Crane method):

    K = f_T × (L/D)
    f_T = [ −2 log10( ε / (3.7 D) ) ]⁻²

Equivalent length of straight pipe:

    L_eq = ΣK × D / f_T

- v — mean velocity in the pipe; D — inside diameter; ε = 0.046 mm for clean steel
- L/D — equivalent length in diameters: standard elbow 30, gate valve 8, globe valve 340, swing check 100, tee branch 60
- Entrance K = 0.5 (sharp-edged); exit into a tank K = 1.0

## Assumptions and limitations

- The Crane method applies to turbulent flow, the normal case in water and process piping. In laminar flow fitting losses are higher than these values.
- Valves are fully open. Partly closed valves, and valves of particular makes, have their own K or C_v from the manufacturer.
- Fittings close together interact and lose more than the sum of their K values.
- The velocity is that in the pipe bore. For reducers and expansions use the K and velocity of the smaller bore.

## Worked example

Water flows at 10 m³/h through a 2 in Schedule 40 pipe (52.5 mm bore). The line has four standard elbows, a gate valve, a swing check valve, an entrance from a tank and an exit into another. What is the loss in the fittings?

1. Velocity: (10 / 3 600) / (π × 0.0525² / 4) = 1.28 m/s; velocity head 0.0840 m.
2. Friction factor: f_T = 0.0190 for this bore.
3. K: 0.0190 × (4 × 30 + 8 + 100) + 0.5 + 1.0 = 4.34 + 1.5 = 5.836.
4. Head loss: 5.836 × 0.0840 = 0.490 m.
5. Pressure loss: 998 × 9.81 × 0.490 = 4.80 kPa.

The fittings lose as much as about 16 m of straight 2 in pipe.

## FAQ

**What are minor losses in pipes?**
Losses in fittings, valves, entrances and exits, as opposed to friction along the straight pipe. Each is K velocity heads.

**What is the K value of a 90° elbow?**
For a standard threaded or welded elbow, 30 f_T: about 0.57 in a 2 in pipe and 0.42 in an 8 in pipe. A long-radius bend is about half that.

**What is the equivalent length of a fitting?**
The length of straight pipe with the same loss. A standard elbow equals about 30 pipe diameters.

**Why is the exit loss 1.0?**
Fluid leaving a pipe into a large tank loses all its velocity, one full velocity head.

**Are minor losses really small?**
Not always. In short systems with many fittings and valves, they often exceed the straight-pipe friction.

**How do I combine minor and friction losses?**
Add them: total loss = (f L / D + ΣK) × v² / 2g. The total dynamic head calculator does this with the static lift.

## Related calculators

- [Total dynamic head](../total-dynamic-head/index.html) — friction, fittings and lift together.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — friction in straight pipe.
- [Pump power](../pump-power/index.html) — the power to overcome the loss.
- [Flow rate and velocity](../flow-rate-velocity/index.html) — velocity from flow and bore.
