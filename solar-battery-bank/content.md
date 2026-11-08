# Solar battery bank calculator

**Summary:** Battery bank for solar or backup power from daily energy, autonomy, depth of discharge and temperature: Ah needed, batteries in series and parallel.

## Introduction

How big a battery bank do you need? Start with the energy you use per day and the number of days the bank must last without sun. Divide by the inverter efficiency and by the depth of discharge, and allow for cold, which cuts the capacity of lead-acid batteries. A cabin using 3 kWh a day for 3 days needs a 24 kWh lead-acid bank at 10 °C, eight times its daily use.

This calculator sizes the bank in kWh and in Ah at your system voltage. It then counts how many of a chosen battery go in series and in parallel, and what the finished bank delivers. It is for off-grid and backup solar owners, installers and students. The solar PV sizing calculator sizes the array that charges the bank.

## Formulas

Energy the bank must deliver, and the nominal capacity:

    E_bank = E_day × N_days / η_inv
    C_nom = E_bank × k_T × (1 + m) / DoD
    Ah = C_nom / V_sys

Batteries:

    N_series = V_sys / V_bat
    N_parallel = ceil(Ah / Ah_bat)
    usable energy = N_parallel × Ah_bat × V_sys × DoD / k_T

- E_day — energy used per day; N_days — days of autonomy
- η_inv — inverter efficiency, 1 for DC loads
- DoD — depth of discharge: 50 % for lead-acid, 80 % for LiFePO4 by default
- k_T — temperature correction factor of IEEE 485, 1.00 at 25 °C (77 °F)
- m — ageing and design margin
- V_sys, V_bat — bank voltage and the voltage of one battery; Ah_bat — capacity of one battery

Selected IEEE 485 temperature correction factors for vented lead-acid cells:

| Temperature | Factor |
|---|---|
| −3.9 °C (25 °F) | 1.52 |
| 4.4 °C (40 °F) | 1.30 |
| 10 °C (50 °F) | 1.19 |
| 15.6 °C (60 °F) | 1.11 |
| 21.1 °C (70 °F) | 1.04 |
| 25 °C (77 °F) | 1.00 |

## Assumptions and limitations

- The bank carries the load for the days of autonomy with no charging at all. Shorter cloudy spells with some sun need less.
- The default depths of discharge favour a long life. Manufacturer data show about 600 cycles at 50 % for AGM batteries and about 2 500 cycles at 80 % for LiFePO4.
- The IEEE 485 table is for vented lead-acid cells. The page uses it for AGM and gel batteries as an estimate. For LiFePO4, enter the capacity factor from the data sheet instead.
- No credit is taken for batteries warmer than 25 °C. Heat raises the capacity a little but shortens the life.
- Capacity is the rating at the battery's standard discharge rate, often 20 hours for lead-acid. Heavy loads draw it down faster.

## Worked example

A cabin uses 3 kWh a day and must run for 3 days without sun. The inverter is 90 % efficient. The bank is flooded lead-acid at 24 V in a shed that falls to 10 °C (50 °F). How many 12 V 200 Ah batteries are needed?

1. Energy from the bank: 3 × 3 / 0.90 = 10.0 kWh.
2. Temperature correction factor at 50 °F: 1.19.
3. Nominal capacity at 50 % depth of discharge: 10.0 × 1.19 / 0.50 = 23.8 kWh.
4. At 24 V: 23 800 / 24 = 992 Ah.
5. Two 12 V batteries make one 24 V string. Five strings give 1 000 Ah, so 10 batteries in total.
6. The bank holds 24.0 kWh. At 10 °C and 50 % depth of discharge, 10.1 kWh of it is usable, a little over 3 days.

Five parallel strings are a lot. The page warns about it, because the strings share current unevenly. Twelve 2 V cells of 1 000 Ah in a single string avoid parallel strings altogether.

## FAQ

**How many batteries do I need for my solar system?**
Multiply your daily use by the days of autonomy and divide by the depth of discharge and the inverter efficiency. Then divide by the energy of one battery, its volts times its amp-hours.

**What depth of discharge should I use?**
About 50 % for lead-acid and 80 % for LiFePO4 if you cycle the bank daily. Deeper discharges are possible but cost cycle life.

**How many days of autonomy should a battery bank have?**
Enough to cover the longest cloudy spell you expect in the darkest month. A backup generator lets you choose fewer days.

**Does cold weather affect battery capacity?**
Yes. A lead-acid battery at 10 °C needs a bank 19 % larger than one at 25 °C, and at 4.4 °C the factor is 1.30.

**Should batteries be wired in series or parallel?**
In series to reach the system voltage, and in parallel only to add capacity. Fewer parallel strings are better, so choose larger batteries where you can.

**What is the ageing factor?**
IEEE 485 sizes lead-acid batteries 25 % larger so they still carry the load when worn down to 80 % of their rated capacity. Enter it as a margin of 25 %.

## Related calculators

- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — the array that recharges the bank.
- [Inverter size calculator](../inverter-size/index.html) — the inverter and its battery current.
- [Battery capacity and runtime](../battery-runtime/index.html) — runtime at a given load with Peukert's correction.
- [Battery charge time](../battery-charge-time/index.html) — how long a charger takes to refill the bank.
