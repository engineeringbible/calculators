# Solar panel calculator: how many panels do I need?

**Summary:** Solar system size in kW and the number of panels to cover your yearly electricity use, from peak sun hours and losses, with roof area, output and cost.

## Introduction

How many solar panels does a home need? Divide the electricity you use in a year by what one kilowatt of panels produces in a year where you live, and you have the system size. Divide that by the rating of one panel and round up. A home using 10 000 kWh a year, with 4.5 peak sun hours a day, needs about 7.1 kW of panels: eighteen 400 W panels.

This calculator does that for a grid-tied system, the usual rooftop setup where the grid covers the gaps. It gives the system size, the number of panels, the yearly production, the share of your use covered, the roof area and the installed cost at your price per watt. For off-grid systems with batteries, use the solar PV array and storage calculator.

## Formulas

What one kilowatt of panels produces in a year, the specific yield:

    Y = PSH × 365 × (1 − losses)        kWh per kW per year

System size and number of panels:

    P = E × offset / Y
    N = P / P_panel, rounded up

Yearly production of the installed panels:

    E_out = N × P_panel × Y

- E — yearly electricity use, from 12 months of bills
- offset — the share of that use the panels should cover
- PSH — peak sun hours: the daily solar energy on the panels in kWh/m², averaged over the year
- losses — temperature, dirt, wiring, inverter and mismatch, about 14 %
- P_panel — the rated power of one panel at standard test conditions

## Assumptions and limitations

- The system is tied to the grid, which supplies power at night and absorbs the surplus at midday. The calculation balances the year, not each day or season.
- Peak sun hours depend on the location, tilt and orientation. NREL's PVWatts tool gives them for the US and many other countries, and the EU's PVGIS tool covers Europe and Africa.
- 14 % losses is the PVWatts default for a well-built system. Shading from trees, chimneys or neighbouring buildings can cost far more and needs a site survey.
- The panel area is the module outline. Roofs also need room for edges, walkways and the fire setbacks some codes require.

## Worked example

A home uses 10 000 kWh a year and wants to cover all of it. The site gets 4.5 peak sun hours a day on average, and the installer offers 400 W panels of 1.9 m² each.

1. Yield per kW: 4.5 × 365 × (1 − 0.14) = 1 412.6 kWh per kW per year.
2. System size: 10 000 / 1 412.6 = 7.08 kW.
3. Panels: 7 080 / 400 = 17.7, so 18 panels, which is 7.2 kW installed.
4. Production: 7.2 × 1 412.6 = 10 170 kWh a year, 102 % of the use.
5. Roof area: 18 × 1.9 = 34.2 m², about 368 ft².

## FAQ

**How many solar panels do I need for my house?**
Divide your yearly kWh by 365, by your peak sun hours and by 0.86 for losses, then by the panel rating in kW. For 10 000 kWh a year in a 4.5-hour location, that is 18 panels of 400 W.

**How much does one solar panel produce?**
A 400 W panel produces about 1.4 to 1.7 kWh a day in a sunny climate, and 500 to 630 kWh a year in a 4 to 5 peak-sun-hour location.

**What are peak sun hours?**
The day's solar energy expressed as hours of full 1 000 W/m² sunshine. Southern Europe and much of the US get 4 to 6; northern Europe gets 2.5 to 3.5 averaged over the year.

**How much roof space do I need?**
About 1.7 to 2 m² per panel, or 4.5 to 5 m² per kW with today's 400 to 450 W panels, plus room around the edges.

**Should I cover 100 % of my use?**
It depends on what the utility pays for the surplus. Where exported power earns much less than imported power costs, a smaller system matched to daytime use often pays back faster.

**Do panels lose output over time?**
Yes, slowly: typical warranties guarantee 80 to 90 % of the rated output after 25 years.

## Related calculators

- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — off-grid systems with batteries.
- [Electricity cost](../electricity-cost/index.html) — what the energy you produce is worth.
- [Battery charge time](../battery-charge-time/index.html) — charging from the panels.
- [mAh to Wh](../mah-to-wh/index.html) — battery capacity conversions.
