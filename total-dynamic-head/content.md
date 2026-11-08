# Total dynamic head (TDH) calculator

**Summary:** Total dynamic head for pump selection from static lift, tank pressures, pipe friction and fitting losses, with the system curve and hydraulic power.

## Introduction

To choose a pump you need two numbers: the flow, and the head the pump must add at that flow, the total dynamic head (TDH). The head has three parts: lifting the liquid from one level to another, any pressure difference between the vessels, and the losses to friction in the pipe and its fittings. The lift is fixed; the losses grow with the square of the flow, which gives the rising system curve that the pump curve must cross.

This calculator adds up the three parts for a single pipe size. It gives the velocity, Reynolds number and friction factor, each head component, the total dynamic head and the hydraulic power, and the system curve as a simple equation. It is for engineers and contractors selecting centrifugal pumps for water and other liquids.

## Formulas

Total dynamic head:

    TDH = (z_d − z_s) + (p_d − p_s) / (ρ g) + (f L / D + ΣK) × v² / (2g)

Friction factor (Darcy–Weisbach with Colebrook):

    Re = v D / ν
    1/√f = −2 log10( ε/(3.7 D) + 2.51/(Re √f) ),   f = 64/Re if laminar

System curve:

    H(Q) ≈ H_static + C Q²,   C = (f L/D + ΣK) / (2 g A²)

- z_d − z_s — static lift from the suction surface to the discharge surface
- p_d − p_s — difference in gauge pressure between the two vessels
- f — Darcy friction factor; L — pipe length; D — inside diameter; ΣK — fittings
- ν — kinematic viscosity; ε — pipe roughness

## Assumptions and limitations

- The liquid moves between two vessels whose surfaces are the reference points, so the velocity there is zero and the exit loss belongs in ΣK.
- The pipe is one size throughout. For a system with several sizes, calculate each section's losses separately and add them.
- The Colebrook equation covers turbulent flow; between Re 2 300 and 4 000 the flow is transitional and the friction factor uncertain.
- The system curve assumes the friction factor stays close to its design value as the flow changes, which is accurate in fully turbulent flow.

## Worked example

A pump moves 20 m³/h of water at 20 °C from a sump to a tank 15 m higher, through 100 m of 3 in steel pipe (77.9 mm bore) with fittings totalling K = 8. What head must the pump deliver?

1. Velocity: (20 / 3 600) / (π × 0.0779² / 4) = 1.166 m/s; velocity head 0.0693 m.
2. Reynolds number: 1.166 × 0.0779 / 1.004 × 10⁻⁶ = 90 440, turbulent.
3. Friction factor from Colebrook with ε = 0.046 mm: f = 0.0210.
4. Pipe friction: 0.0210 × 100 / 0.0779 × 0.0693 = 1.86 m. Fittings: 8 × 0.0693 = 0.55 m.
5. Total dynamic head: 15 + 1.86 + 0.55 = 17.42 m.

Choose a pump whose curve passes through 20 m³/h at about 17.5 m, near its best efficiency point.

## FAQ

**What is total dynamic head?**
The total head a pump adds to the liquid: the static lift, the pressure difference between the vessels, and all friction and fitting losses, in metres or feet of the liquid pumped.

**How do I calculate TDH?**
Add the vertical lift, the pressure difference converted to head, and the friction and fitting losses. Friction is f L / D × v² / 2g and fittings are ΣK × v² / 2g.

**What is the difference between static head and dynamic head?**
Static head is the lift and pressure difference, which exist even at zero flow. Dynamic head adds the losses that appear when liquid flows.

**What is a system curve?**
The head the system needs at each flow. The pump operates where its own curve crosses the system curve.

**Does suction lift add to TDH?**
Yes. If the pump lifts from a sump below it, the static lift is measured from the sump surface to the discharge surface, which includes the suction lift. Check NPSH too.

**Why does head matter more than pressure for pumps?**
A pump adds the same head whatever the liquid's density, but the pressure it produces scales with density. Pump curves are therefore drawn in head.

## Related calculators

- [Pump power](../pump-power/index.html) — the power for the flow and head.
- [Minor losses](../minor-losses/index.html) — add up K for the fittings.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — friction in pipes in detail.
- [Pump NPSH](../pump-npsh/index.html) — checking the suction side.
