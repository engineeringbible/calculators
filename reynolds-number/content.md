# Reynolds number calculator

**Summary:** Reynolds number for a pipe, a non-circular duct, a flat plate or any length, from velocity or flow, with the regime: laminar, transitional or turbulent.

## Introduction

The Reynolds number compares the inertia of a moving fluid with its viscosity. It is the single number that tells you whether a flow is smooth and layered (laminar) or chaotic and mixing (turbulent), and that decides which friction factor, heat-transfer correlation or drag coefficient applies. Every pipe pressure-drop, heat-exchanger and boundary-layer calculation starts by finding it.

This calculator works it out for a circular pipe from its bore, for a rectangular or other non-circular duct from its hydraulic diameter, for a flat plate from the distance along it, or for any characteristic length you choose. You can give the velocity or, for pipes and ducts, the volume flow rate. Fluid properties for water, sea water, fuels, lubricating oil and air are built in, or you can enter your own. It is for mechanical, process, HVAC and marine engineers, and for students meeting the Moody chart.

## Formulas

The Reynolds number:

    Re = V L / ν = ρ V L / μ

The characteristic length L depends on the geometry:

    circular pipe:      L = D
    non-circular duct:  L = D_h = 4 A / P
    flat plate:         L = x, the distance from the leading edge

From a volume flow rate:

    V = Q / A,   A = π D² / 4 for a pipe

Regime limits:

    pipe or duct:  laminar Re < 2300,  transitional 2300 to 4000,  turbulent Re > 4000
    flat plate:    laminar Re_x < 5 × 10⁵,  turbulent beyond

- V — mean velocity, m/s
- L — characteristic length, m
- ν — kinematic viscosity, m²/s (1 cSt = 10⁻⁶ m²/s)
- μ — dynamic viscosity, Pa·s; ρ — density, kg/m³
- A — flow area, m²; P — wetted perimeter, m

## Assumptions and limitations

- The fluid is Newtonian, with uniform density and viscosity. For a heated or cooled flow, take the properties at the mean temperature; oil viscosity can halve with a 15 °C rise.
- The internal-flow limits assume fully developed flow in a pipe running full. A very smooth, vibration-free pipe can stay laminar well above 2300, but design practice treats 2300 to 4000 as uncertain.
- The hydraulic diameter is a good stand-in for turbulent flow in a duct. In laminar flow, the friction factor depends on the duct's shape, and the hydraulic diameter is only approximate.
- The flat-plate transition at 5 × 10⁵ is for a smooth plate in a quiet stream. Surface roughness and free-stream turbulence can trigger transition much earlier, as on a ship's hull.
- The built-in fuels and oils are typical grades. Use the custom fluid with the data-sheet density and viscosity for a specific product.

## Worked example

Fresh water at 20 °C flows at 1.5 m/s through a pipe with a 50 mm bore. Is the flow laminar or turbulent?

1. Characteristic length: the bore, D = 0.05 m.
2. Kinematic viscosity of water at 20 °C: ν = 1.004 × 10⁻⁶ m²/s, which is 1.004 cSt.
3. Reynolds number: Re = V D / ν = 1.5 × 0.05 / 1.004 × 10⁻⁶ = 74 700.
4. That is far above 4000, so the flow is fully turbulent, and the Colebrook friction factor applies.
5. The flow would turn laminar below Re = 2300, which needs V = 2300 × 1.004 × 10⁻⁶ / 0.05 = 0.046 m/s. Water pipes almost never run that slowly, which is why turbulent flow is the normal case for water.

For comparison, heavy fuel oil of 380 cSt at 1 m/s in a 100 mm pipe gives Re = 1 × 0.1 / 380 × 10⁻⁶ = 263, firmly laminar. Viscous fuels and lubricating oils are the usual exception to turbulent pipe flow.

## FAQ

**What Reynolds number is turbulent?**
In pipes, above about 4000. Below 2300 the flow is laminar, and between the two it is transitional and can switch back and forth. On a flat plate, the boundary layer turns turbulent near 5 × 10⁵.

**Which viscosity do I use, kinematic or dynamic?**
Either, as long as it matches: Re = V L / ν with the kinematic viscosity, or ρ V L / μ with the dynamic viscosity. Kinematic viscosity in cSt is what fuel and oil data sheets give.

**How do I find the hydraulic diameter of a rectangular duct?**
Four times the area divided by the wetted perimeter. For a duct a by b, that is 2 a b / (a + b). A 300 × 200 mm duct has a hydraulic diameter of 240 mm.

**Why does it matter whether the flow is laminar or turbulent?**
Friction, heat transfer and mixing all change. A turbulent flow loses more pressure but transfers heat far better. Laminar friction is f = 64 / Re, while turbulent friction also depends on the pipe's roughness.

**Does pipe roughness change the Reynolds number?**
No. Roughness changes the friction factor at a given Reynolds number, and can trigger earlier transition on a plate, but it does not enter Re itself.

**What is the Reynolds number of a ship's hull?**
Very high: a 200 m ship at 14 knots in sea water reaches about 1.2 × 10⁹, so its boundary layer is turbulent over almost the whole hull.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the friction factor and pressure drop at this Reynolds number.
- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — discharge coefficients that depend on the Reynolds number.
- [Control valve Cv / Kv sizing](../control-valve-cv/index.html) — valve sizing for the same flow.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — where the regime sets the heat-transfer coefficient.
