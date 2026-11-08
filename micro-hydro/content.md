# Micro-hydro power calculator

**Summary:** Hydro power from flow and head: penstock friction by Darcy or Hazen–Williams, net head, electrical power, yearly energy and turbine types for the head.

## Introduction

How much power can a stream make? Hydro power is water density × gravity × flow × head × efficiency. A stream that sends 50 L/s down a 40 m drop carries 19.6 kW. After the losses in the pipe and a turbine and generator that are 60 % efficient together, it gives about 11 kW of electricity, around the clock.

This calculator works out the friction loss in the penstock, the net head, the hydraulic and electrical power and the yearly energy. It lists the turbine types whose head range covers your net head. It is for landowners, small hydro developers and students making a first assessment of a site.

## Formulas

Power and net head:

    P = ρ g Q H_n η
    H_n = H_g − h_f − K v² / (2g)

Friction loss in the penstock:

    Darcy–Weisbach:  h_f = f (L / D) v² / (2g),  f from Colebrook
    Hazen–Williams:  h_f = 10.67 L Q^1.852 / (C^1.852 D^4.8704)

- ρ — water density, 1 000 kg/m³; g = 9.81 m/s²; Q — design flow
- H_g — gross head; H_n — net head at the turbine
- η — overall efficiency from water to wire
- L, D — penstock length and inside diameter; v — water velocity; f — Darcy friction factor
- K — sum of the fitting loss coefficients; C — Hazen–Williams coefficient

Turbine types by net head, from ESHA Table 6.3:

| Turbine | Net head range |
|---|---|
| Kaplan and propeller | 2 to 40 m |
| Crossflow | 5 to 200 m |
| Francis | 25 to 350 m |
| Turgo | 50 to 250 m |
| Pelton | 50 to 1 300 m |

## Assumptions and limitations

- The gross head is the vertical drop from the intake water level to the turbine. Measure it with a level survey or GPS, not a map.
- The overall efficiency covers the turbine, the drive and the generator. ESHA gives best turbine efficiencies of 85 % for Turgo to 94 % for Francis. The generator, the drive and running at part flow lower the overall figure, and the page defaults to 60 %.
- The yearly energy assumes the design flow for the share of the year you enter. A real stream varies with the season, and some water must stay in the stream.
- The turbine list uses head only. Flow, speed and cost narrow the choice, and manufacturers' charts use head and flow together.

## Worked example

A stream supplies 50 L/s to a 200 m penstock of 200 mm plastic pipe, with a roughness of 0.0015 mm. The gross head is 40 m and the water is at 10 °C, 1.307 mm²/s. The turbine and generator are 60 % efficient and run 80 % of the year. What does the plant deliver?

1. Velocity: 0.05 / (π × 0.2² / 4) = 1.59 m/s.
2. Reynolds number: 1.59 × 0.2 / 1.307 × 10⁻⁶ = 243 500, so f = 0.0151 from Colebrook.
3. Friction loss: 0.0151 × (200 / 0.2) × 1.59² / (2 × 9.81) = 1.95 m.
4. Net head: 40 − 1.95 = 38.05 m.
5. Hydraulic power: 1 000 × 9.81 × 0.05 × 38.05 = 18.66 kW.
6. Electrical output: 18.66 × 0.60 = 11.19 kW.
7. Energy per year: 11.19 × 8 760 × 0.80 = 78 400 kWh.

At 38 m net head, ESHA lists Kaplan, crossflow and Francis turbines. The flow, the speed and the cost then decide between them.

## FAQ

**How do you calculate hydro power?**
Multiply 9.81 by the flow in m³/s, the net head in metres and the efficiency to get kW. 50 L/s at 38 m and 60 % gives 11.2 kW.

**What is the difference between gross head and net head?**
Gross head is the vertical drop. Net head is what remains at the turbine after the friction and fitting losses in the pipe.

**How big should the penstock be?**
Large enough to keep the friction loss a small share of the gross head, which the page shows. Beyond a loss of one third of the gross head, more flow gives less power.

**Which turbine should I use?**
Pelton and Turgo turbines suit high heads, Francis and crossflow medium heads, and Kaplan or propeller turbines low heads. The table above gives ESHA's ranges.

**How much power do I get from 1 L/s?**
About 0.0098 kW per metre of net head before efficiency. At 60 % overall, 1 L/s over 100 m gives about 0.59 kW.

**Is Hazen–Williams or Darcy–Weisbach better?**
Darcy–Weisbach works for any fluid, pipe and temperature. Hazen–Williams is a simpler formula for water at ordinary temperatures, and the two agree closely for this example.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — friction in any pipe, with fittings.
- [Wind turbine power calculator](../wind-turbine-power/index.html) — power from the wind instead.
- [Solar panel payback calculator](../solar-payback/index.html) — the payback of a renewable system.
- [Pump power calculator](../pump-power/index.html) — the same equation run backwards for a pump.
