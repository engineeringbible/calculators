# Pipe volume calculator

**Summary:** Volume and mass of the liquid in a pipe from its bore and length, the litres per metre, and the time to fill or flush it at a given flow.

## Introduction

How much liquid does a pipe hold? The question comes up when filling or draining a system, dosing a chemical or an inhibitor, calculating a flush, sizing an expansion tank, estimating the weight a pipe rack must carry, or working out how long a line takes to fill before a pump sees liquid.

This calculator gives the volume of a full pipe from its inside diameter and length, the litres per metre, and the mass of the contents for water, sea water, fuels, lubricating oil or a liquid of your own. With a flow rate it also gives the time to fill the line once, which is the time for one flush. It is for plumbers, pipefitters, process and marine engineers, and anyone commissioning a piping system.

## Formulas

Bore area and volume:

    A = π × D² / 4
    V = A × L

Volume per metre, mass, and fill time:

    V per metre = A × 1000   (litres per metre)
    m = ρ × V
    t = V / Q

- D — inside diameter (bore), m
- L — pipe length, m
- ρ — density of the contents, kg/m³
- Q — flow rate, m³/s

## Assumptions and limitations

- The pipe is a straight cylinder of constant bore running full. Fittings and valves add a little volume, which can be entered as extra length.
- Use the inside diameter, not the nominal size. DN 100 steel pipe has a bore of about 102 mm in Schedule 40 and 97 mm in Schedule 80.
- The density is a reference value. Water expands by about 1 % between 4 °C and 45 °C, and fuels by about 0.07 % per kelvin.
- The fill time assumes a steady flow filling the whole bore. Venting air out of high points and filling uphill make it longer in practice.

## Worked example

A cooling-water line has a 150 mm bore and is 120 m long. How much water does it hold, and how long does it take to fill at 30 m³/h?

1. Bore area: A = π × 0.15² / 4 = 0.01767 m², which is 17.67 litres per metre of pipe.
2. Volume: V = 0.01767 × 120 = 2.121 m³ = 2 121 L.
3. Mass of fresh water at 20 °C: m = 998.2 × 2.121 = 2 117 kg, over two tonnes for the pipe supports to carry.
4. Fill time at 30 m³/h: t = 2.121 / 30 = 0.0707 h = 4.24 min.

To flush the line with three volumes of water, allow about 13 minutes at that flow.

## FAQ

**Should I use the nominal or the inside diameter?**
The inside diameter. Nominal sizes are labels, and the bore depends on the wall thickness: a 4-inch Schedule 40 pipe has a 102.3 mm bore, Schedule 80 only 97.2 mm.

**How many litres per metre is a pipe?**
The bore in millimetres squared, times π/4, divided by 1000. A 25 mm bore holds 0.49 L/m, 50 mm 1.96 L/m, 100 mm 7.85 L/m and 200 mm 31.4 L/m.

**How do I include the fittings?**
Add their equivalent length, or simply add 5 to 10 % to the pipe length for a typical run. Large valves and strainers can be added from their data-sheet volumes.

**How much does the water in a pipe weigh?**
About one kilogram per litre, so the litres per metre are also roughly the kilograms per metre. Add the weight of the pipe itself for support loads.

**How long does a flush take?**
One pipe volume divided by the flow rate, multiplied by the number of volumes the procedure asks for, often three to five.

**Does this work for a partly filled pipe?**
No, it assumes a full bore. For a partly filled pipe or a horizontal tank, use the tank volume calculator.

## Related calculators

- [Flow rate and pipe velocity](../flow-rate-velocity/index.html) — the velocity in the same pipe at the fill flow.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the pressure needed to push that flow.
- [Tank volume and partial fill](../tank-volume/index.html) — partly filled pipes and tanks.
- [Hydrostatic pressure at depth](../hydrostatic-pressure/index.html) — the pressure a full vertical pipe exerts.
