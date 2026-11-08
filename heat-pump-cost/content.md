# Heat pump vs gas boiler running cost calculator

**Summary:** Heat pump running cost and CO₂ against a gas or oil boiler from the yearly heat demand, SCOP, boiler efficiency and prices, with the saving and break-even COP.

## Introduction

Is a heat pump cheaper to run than a gas boiler? It depends on two ratios. The heat pump turns each kWh of electricity into SCOP kWh of heat, while the boiler turns each kWh of gas into about 0.9 kWh of heat. With electricity at 0.20 and gas at 0.07 per kWh, a heat pump with an SCOP of 3.2 saves about 20 % on a 12 000 kWh heating bill.

This calculator compares the yearly running cost and CO₂ of a heat pump and a gas or oil boiler for the same heat demand. It gives the saving and the break-even COP, the seasonal COP at which both cost the same. Gas and oil prices can be entered per kWh, therm, ccf, gallon or litre. It is for homeowners, installers and energy advisers.

## Formulas

Energy and cost for the same heat Q:

    E_hp = Q / SCOP,          cost_hp = E_hp × p_elec
    E_fuel = Q / η,           cost_boiler = E_fuel × p_fuel
    saving = cost_boiler − cost_hp

Break-even COP for cost and for CO₂:

    COP_cost = p_elec × η / p_fuel
    COP_CO₂ = f_elec × η / f_fuel

- Q — heat needed per year for space heating and hot water
- SCOP — seasonal coefficient of performance of the heat pump
- η — seasonal efficiency of the boiler, gross basis
- p_elec, p_fuel — prices per kWh of electricity and of fuel
- f_elec, f_fuel — CO₂ per kWh of electricity and of fuel

Fuel units, EPA heat contents:

    1 therm = 100 000 Btu = 29.31 kWh
    1 ccf of natural gas = 102 600 Btu = 30.07 kWh
    1 US gal of No. 2 heating oil = 138 000 Btu = 40.44 kWh

## Assumptions and limitations

- The SCOP must suit your climate and flow temperature. A heat pump feeding radiators at 55 °C has a lower SCOP than one feeding underfloor heating at 35 °C.
- Boiler efficiency and fuel energy are both on the gross basis, like US AFUE ratings and UK SEDBUK figures.
- The CO₂ factors are examples. Gas and oil use the EPA factors of 0.181 and 0.252 kg per kWh. The electricity factor depends on your grid and changes every year.
- Standing charges, servicing and time-of-use tariffs are not included. Dropping the gas connection removes its standing charge too.

## Worked example

A house needs 12 000 kWh of heat a year. The gas boiler is 90 % efficient and gas costs 0.07 per kWh. A heat pump with an SCOP of 3.2 would run on electricity at 0.20 per kWh. Which is cheaper?

1. Heat pump electricity: 12 000 / 3.2 = 3 750 kWh, costing 3 750 × 0.20 = 750.00.
2. Boiler gas: 12 000 / 0.90 = 13 333 kWh, costing 13 333 × 0.07 = 933.33.
3. Saving with the heat pump: 933.33 − 750.00 = 183.33 a year.
4. Break-even COP: 0.20 × 0.90 / 0.07 = 2.57. Any SCOP above this saves money.

With an electricity factor of 0.25 kg per kWh, the heat pump emits 938 kg of CO₂ a year. The boiler emits 13 333 × 0.181 = 2 413 kg.

## FAQ

**Is a heat pump cheaper to run than a gas boiler?**
Yes, when its SCOP is above the break-even COP, the electricity price times the boiler efficiency divided by the gas price. At 0.20 and 0.07 per kWh that is 2.57.

**What is SCOP?**
The seasonal coefficient of performance: the heat delivered over a year divided by the electricity used, under the conditions of EN 14825.

**What COP does a heat pump need to beat gas?**
It depends on the price ratio. At 0.25 for electricity and 0.07 for gas with a 90 % boiler, it needs 3.21.

**How do I convert a gas price per therm to per kWh?**
Divide by 29.31. A price of 1.50 per therm is 0.0512 per kWh.

**How do I convert a heating oil price per gallon to per kWh?**
Divide by 40.44 for No. 2 heating oil. At 3.50 per gallon that is 0.0865 per kWh.

**Does a heat pump always cut CO₂?**
It does when its SCOP is above the break-even COP for CO₂. With a 90 % gas boiler, gas at 0.181 kg and electricity at 0.25 kg per kWh, that is only 1.24.

## Related calculators

- [Building heat loss calculator (U-values)](../heat-loss/index.html) — the yearly heat demand from U-values and degree-days.
- [Electricity cost and energy use](../electricity-cost/index.html) — the cost of any electrical load.
- [Solar panel payback calculator](../solar-payback/index.html) — solar panels to run the heat pump.
- [Carnot efficiency and COP calculator](../carnot-cop/index.html) — the theoretical limit of a heat pump's COP.
