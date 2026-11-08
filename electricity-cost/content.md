# Electricity cost calculator

**Summary:** Energy use and running cost of any appliance or load per hour, day, month and year, from its power, hours of use and the price per kWh.

## Introduction

What does it cost to run a heater, a pump, a compressor or a server for a year? The answer needs only three numbers: the power the load draws, how long it runs, and the price of a kilowatt-hour. Multiplying them out by hand is easy to get wrong, especially for loads that run only part of the time or only on working days.

This calculator gives the energy and the cost per hour of running, per day of use, per month and per year. A duty cycle covers loads that switch on and off under a thermostat, such as fridges, freezers and heaters. The days-per-week setting covers loads that run only on working days. It works in any currency, because the price is yours. It is for homeowners checking appliances, facility and energy managers, and engineers comparing equipment.

## Formulas

Energy per day of use:

    E_day = P × duty × hours per day

Monthly and yearly energy, with the average month of 30.44 days:

    E_month = E_day × (days per week / 7) × 30.44
    E_year  = E_day × (days per week / 7) × 365.25

Cost:

    cost = E [kWh] × price per kWh
    1 kWh = 1000 W for one hour = 3.6 MJ

- P — power while running, W or kW
- duty — share of the time the load actually draws that power, 0 to 100 %

## Assumptions and limitations

- The power is the real power while the load runs, from its rating plate or a plug-in meter. Rating plates often show the maximum, so measured values give a better estimate.
- The price is a flat rate per kWh. Standing charges, time-of-use rates, demand charges and taxes are not included.
- Months and years are averages of 30.44 and 365.25 days.
- Standby power adds up over a year. Enter it as a separate small load running 24 hours a day.

## Worked example

A 2 kW electric heater runs 4 hours a day, every day, and electricity costs 0.25 per kWh. What does it cost?

1. Energy per day: 2 kW × 4 h = 8 kWh.
2. Cost per day: 8 × 0.25 = 2.00.
3. Energy per year: 8 × 365.25 = 2 922 kWh.
4. Cost per year: 2 922 × 0.25 = 730.50.
5. Per hour of running it costs 2 × 0.25 = 0.50.

If a thermostat keeps it on only 60 % of the time, enter a 60 % duty cycle and every figure falls to 60 %.

## FAQ

**How do I calculate the electricity cost of an appliance?**
Multiply its power in kW by the hours it runs to get kWh, then by your price per kWh. A 100 W bulb for 10 hours uses 1 kWh.

**Where do I find an appliance's power?**
On the rating plate or in the manual, in watts. For loads that cycle, a plug-in energy meter gives the real average, which is usually much lower than the plate value.

**What is a duty cycle?**
The share of time a cycling load actually draws power. A fridge compressor runs about 30 to 50 % of the time, so its yearly energy is far below its rated power times 8 766 hours.

**How much does standby power cost?**
A 5 W standby load running all year uses about 44 kWh, around 13 at 0.30 per kWh. Many such loads in a building add up.

**Why does my bill not match?**
Bills add standing charges, taxes and sometimes time-of-use rates, and real use varies with season and behaviour. This calculator gives the energy part at a flat rate.

**How do I convert watts to kWh?**
Watts are a rate and kWh an amount. Multiply the watts by the hours of use and divide by 1000.

## Related calculators

- [Ohm's law and electrical power](../ohms-law/index.html) — power from voltage and current.
- [Three-phase power and motor current](../three-phase-power/index.html) — the real power of motors and three-phase loads.
- [Generator load, kVA and fuel](../generator-load/index.html) — the cost of generating the power yourself.
- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — producing the energy on site.
