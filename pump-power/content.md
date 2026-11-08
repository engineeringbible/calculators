# Pump power calculator

**Summary:** Hydraulic, shaft and electrical power of a pump from flow and head or pressure, with efficiencies, the next standard motor size and the energy cost.

## Introduction

A pump lifts a flow of liquid against a head. The power that ends up in the liquid, the hydraulic power, is density × gravity × flow × head. The pump wastes part of the shaft power it receives, and the motor wastes part of the electricity, so the power drawn from the grid is noticeably more. Pumping 50 m³/h of water against 30 m puts 4.08 kW into the water but draws about 6.5 kW of electricity.

This calculator gives the hydraulic, shaft and electrical input power of a pump from the flow and either the head or the pressure rise, the next standard motor size with a margin, and the yearly energy and cost. It is for engineers and technicians selecting pumps and motors, and checking running costs.

## Formulas

Power at each stage:

    P_h = ρ g Q H = Q Δp
    P_shaft = P_h / η_pump
    P_in = P_shaft / η_motor

US units (brake horsepower):

    BHP = Q[gpm] × H[ft] × SG / (3 960 × η_pump)

- ρ — liquid density; g = 9.81 m/s²; Q — flow; H — total head
- Δp — pressure rise, with H = Δp / (ρ g)
- η_pump, η_motor — pump and motor efficiencies at the duty point

## Assumptions and limitations

- The head is the total dynamic head: static lift, friction and fitting losses, and any pressure difference between the tanks. The total dynamic head calculator works it out.
- Pump efficiency must be read from the pump curve at the duty point. Small pumps reach 40 to 60 %, large ones 75 to 85 %. Running far from the best efficiency point wastes energy and wears the pump.
- Viscous liquids reduce the pump's efficiency and head. Correct them with the Hydraulic Institute viscosity method before using this page.
- The motor size uses IEC rated outputs in kW. North American NEMA motors are rated in hp: 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20 hp and so on.

## Worked example

A centrifugal pump delivers 50 m³/h of water (998 kg/m³) against a total head of 30 m. Its efficiency is 70 % and the motor's 90 %. What power is needed?

1. Flow: 50 / 3 600 = 0.01389 m³/s.
2. Hydraulic power: 998 × 9.81 × 0.01389 × 30 = 4.08 kW.
3. Shaft power: 4.08 / 0.70 = 5.83 kW.
4. Electrical input: 5.83 / 0.90 = 6.47 kW.
5. Motor with 10 % margin: 5.83 × 1.1 = 6.41 kW, so a 7.5 kW motor.

Running 4 000 hours a year, the pump uses about 26 MWh of electricity.

## FAQ

**How do I calculate pump power?**
Multiply density, gravity, flow and head for the hydraulic power, then divide by the pump efficiency for the shaft power. For water, kW = m³/h × m / 367 / efficiency.

**What is brake horsepower?**
The power the pump needs at its shaft. In US units it is gpm × feet × specific gravity / (3 960 × efficiency).

**What size motor do I need for my pump?**
At least the shaft power at the worst operating point, plus a margin of 10 to 20 %. Then choose the next standard motor rating.

**How do I convert pressure to head?**
Divide the pressure by density × gravity. For water, 1 bar is 10.2 m and 1 psi is 2.31 ft.

**What is a typical pump efficiency?**
40 to 60 % for small domestic and circulator pumps, 70 to 85 % for large process and water-supply pumps at their best efficiency point.

**How can I cut a pump's energy use?**
Run near the best efficiency point, reduce pipe losses, and use a variable-speed drive where the flow varies: power falls with the cube of speed.

## Related calculators

- [Total dynamic head](../total-dynamic-head/index.html) — the head the pump must deliver.
- [Pump affinity laws](../pump-affinity/index.html) — flow, head and power at another speed.
- [Pump NPSH](../pump-npsh/index.html) — checking for cavitation.
- [Electricity cost](../electricity-cost/index.html) — the cost of the energy.
