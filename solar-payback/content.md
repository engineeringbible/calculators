# Solar panel payback calculator

**Summary:** Payback year, 25-year savings, ROI, NPV and IRR of a solar PV system from cost, incentives, production, self-consumption, tariffs, price rises and degradation.

## Introduction

How long do solar panels take to pay for themselves? Divide the net cost by the yearly saving. The saving is the energy you use yourself at the price you would have paid, plus the energy you export at the export price. A 6 kW system costing 15 000 that saves 1 287 in its first year pays back in 11.7 years on that simple measure. Rising electricity prices shorten this, and the slow decline of the panels lengthens it.

This calculator follows the savings year by year with price escalation and panel degradation. It gives the payback year, the savings and return over 25 years, the net present value at a discount rate, the internal rate of return and the levelised cost of the energy. It is for homeowners, installers and small businesses comparing a solar quote with its alternatives.

## Formulas

Production and saving in year n:

    E_n = E_1 (1 − d)^(n−1),    E_1 = P_kW × Y
    S_n = E_n [s p_imp + (1 − s) p_exp] (1 + e)^(n−1) − O&M

Payback and value:

    payback: the year in which Σ S_n reaches C_net
    NPV = −C_net + Σ S_n / (1 + r)^n
    ROI = (Σ S_n − C_net) / C_net
    LCOE = (C_net + Σ O&M / (1 + r)^n) / Σ E_n / (1 + r)^n

- C_net — installed cost less tax credits, rebates and grants
- P_kW — system size; Y — specific yield in kWh per kW per year
- d — degradation per year; e — electricity price rise per year
- s — share of the production used on site; p_imp, p_exp — import and export prices
- r — discount rate; the IRR is the rate at which the NPV is zero

## Assumptions and limitations

- Both prices rise by the same rate each year. The running cost stays flat.
- The default degradation is 0.5 % a year, the median that Jordan and Kurtz found in their 2013 review of field data.
- The self-consumption share depends on when you use electricity. A battery, an electric car or a heat pump raises it.
- Inverter replacement, financing and taxes are not included unless you enter them as a yearly running cost.
- The specific yield depends on the site, tilt and shading. PVWatts or PVGIS gives it for your address.

## Worked example

A 6 kW system costs 15 000 with no incentives. The site yields 1 300 kWh per kW per year. Half the energy is used at home, saving 0.25 per kWh, and half is exported at 0.08. Prices rise 3 % a year, the panels lose 0.5 % a year, and money is discounted at 4 %. What is the payback over 25 years?

1. First-year production: 6 × 1 300 = 7 800 kWh.
2. First-year saving: 7 800 × (0.5 × 0.25 + 0.5 × 0.08) = 1 287.
3. Simple payback: 15 000 / 1 287 = 11.66 years.
4. With price rises and degradation, the cumulative saving reaches 15 000 after 10.4 years.
5. Total savings over 25 years: 43 876, a net gain of 28 876 and a return of 193 %.
6. Net present value at 4 %: 11 088. The internal rate of return is 9.4 %.

Discounted at 4 %, the payback stretches to 13.2 years. The energy costs 0.129 per kWh over the life, about half the import price.

## FAQ

**How do I calculate solar panel payback?**
Divide the net cost after incentives by the first-year saving for the simple payback. Price rises shorten it and degradation lengthens it.

**What is a good payback period for solar panels?**
Shorter than the life of the system by a wide margin. Panels are usually warranted for about 25 years, so a payback of 10 years leaves 15 years of savings.

**Does self-consumption matter?**
Yes, when the export price is below the import price. In the example, raising self-consumption from 50 to 100 % raises the first-year saving from 1 287 to 1 950.

**How much do solar panels degrade per year?**
About 0.5 % a year at the median, from Jordan and Kurtz's review of field measurements. After 25 years a panel still makes about 89 % of its first-year output.

**What is the difference between ROI and NPV?**
ROI compares the total savings with the cost, without regard to when they arrive. NPV discounts each year's saving to today, so it shows whether solar beats investing the money at the discount rate.

**What is the levelised cost of solar energy?**
The cost of each kWh produced over the life, with the cost and the energy both discounted. In the example it is 0.129 per kWh.

## Related calculators

- [Solar panel calculator: how many panels do I need?](../solar-panel/index.html) — the system size for your yearly use.
- [Solar battery bank calculator](../solar-battery-bank/index.html) — storage to raise self-consumption.
- [Electricity cost and energy use](../electricity-cost/index.html) — the value of the energy at your tariff.
- [Heat pump vs gas boiler running cost calculator](../heat-pump-cost/index.html) — another use for the energy.
