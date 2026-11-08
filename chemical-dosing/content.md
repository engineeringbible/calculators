# Chemical dosing calculator (feed rate, pump setting, chlorine dose)

**Summary:** Chemical feed rate and dosing pump setting in L/h and gal/day from flow, dose in mg/L, product strength and density, with chlorine dose, demand and residual.

## Introduction

How much chemical does a water treatment dose need? Multiply the water flow by the dose to get the active chemical, then divide by the product strength to get the product. A dose of 1 mg/L puts 1 g of chemical into every cubic metre, or 8.34 lb into every million US gallons. Dosing 100 m³/h at 5 mg/L takes 0.5 kg/h of active chemical. With trade-strength sodium hypochlorite at 12.5 % that is 4 L/h of product.

This calculator gives the active chemical feed, the product feed by mass and volume, the dosing pump setting in L/h, mL/min and US gal/day, and the daily product use. It accepts product strength as % w/w or as % w/v. It also solves the chlorine relation dose = demand + residual for any one term. It is for water and wastewater operators, process engineers and students sizing dosing pumps and chemical storage.

## Formulas

Active chemical and product feed:

    active [g/h] = Q [m³/h] × dose [mg/L]
    product mass = active / w
    product volume = product mass / ρ_product = active / c

US pounds formula:

    lb/day = flow [MGD] × dose [mg/L] × 8.34

Chlorine:

    dose = demand + residual

- Q — water flow; dose — active chemical per litre of water, mg/L = g/m³
- w — product strength as a mass fraction (% w/w / 100)
- c — product strength as mass per volume: % w/v × 10 = g/L, and % w/v = % w/w × SG
- ρ_product — product density; SG — its specific gravity
- 8.34 — pounds per US gallon of water, which turns MGD × mg/L into lb/day

## Assumptions and limitations

- The dose applies to the whole flow and mixes completely. Dose rates for disinfection, coagulation or pH control come from jar tests, regulations or the supplier.
- Trade-strength hypochlorite is sold by available chlorine in % w/v. At SG 1.2, 12.5 % w/v is 10.4 % w/w. Choose the basis that matches the product data sheet.
- The pump setting is the product rate while water flows. Pump ratings in gal/day are the same rate over 24 hours.
- Hypochlorite loses strength in storage, faster when warm or exposed to light. Check the strength and adjust the pump.
- Chlorine demand varies with water quality and contact time. Measure the residual and adjust the dose to hold it.

## Worked example

A plant treats 100 m³/h of water and wants a chlorine dose of 5 mg/L. It uses sodium hypochlorite with 12.5 % w/v available chlorine and a density of 1 200 kg/m³. What pump setting is needed?

1. Active chlorine: 100 m³/h × 5 g/m³ = 500 g/h, or 12.0 kg per day.
2. Product strength: 12.5 % w/v = 125 g/L of product.
3. Pump setting: 500 / 125 = 4.00 L/h, which is 4.00 × 24 / 3.785 = 25.4 US gal/day.
4. Product used: 4.00 L/h × 24 h = 96 L a day, or 96 × 1.2 = 115.2 kg.

A 1 000 L tank of product lasts about 10 days at this rate.

## FAQ

**How do I calculate a chemical dosing rate?**
Multiply the flow by the dose, then divide by the product strength. For 50 m³/h at 10 mg/L with a 40 % w/w product of density 1 400 kg/m³, the feed is 0.5 kg/h of active, 1.25 kg/h of product, or 0.89 L/h.

**What is the pounds formula?**
Pounds per day equals flow in million gallons per day times dose in mg/L times 8.34. A 2.5 MGD plant dosing 3 mg/L uses 62.6 lb of chlorine a day.

**What is the difference between chlorine dose, demand and residual?**
The dose is what you add. The demand is what reacts with the water's impurities. The residual is what is left, and it keeps disinfecting in the network.

**What chlorine residual should drinking water have?**
Many utilities aim for at least 0.2 mg/L of free chlorine at the far end of the network. The US EPA caps the residual at 4.0 mg/L.

**What does 12.5 % sodium hypochlorite mean?**
12.5 g of available chlorine per 100 mL, which is 125 g/L. At SG 1.2 it is about 10.4 % by weight.

**How do I convert L/h to gallons per day?**
Multiply by 24 and divide by 3.785. A pump delivering 1 L/h moves 6.34 US gal/day.

## Related calculators

- [PPM concentration converter](../ppm-concentration/index.html) — mg/L, ppm and molarity of the dose.
- [Dilution C1V1 = C2V2](../dilution/index.html) — diluting the product for a small pump.
- [Mass balance mixing](../mass-balance/index.html) — concentration after streams combine.
- [Flow rate and velocity](../flow-rate-velocity/index.html) — the water flow in the pipe.
