# Energy-saving device payback calculator

**Summary:** Payback, NPV, IRR and levelized cost of a fuel-saving retrofit from the saving, fuel and ETS prices, life and discount rate.

## Introduction

A pre-swirl duct, a propeller boss cap fin, an air lubrication system or a premium coating is sold on a percentage of fuel saved. Whether that percentage is worth the price depends on how much fuel the ship burns, what it pays for it and for its CO₂ allowances, how long the device lasts and what return the owner expects on capital. This calculator turns the claimed saving into fuel and CO₂ tonnes per year, prices them with the ETS share, subtracts maintenance and returns the simple and discounted payback, the net present value, the internal rate of return, the benefit-cost ratio and the levelized cost of each saved tonne, which can be compared directly with the fuel price.

It is for technical and commercial managers screening retrofits, for owners comparing vendor claims, and for students of engineering economics with a maritime example.

## Formulas

    I = capex + off-hire days × hire
    S = saving % × F × sea days                        fuel saved, t/yr
    benefit_t = [S p (1 + e)^(t−1) + S C_F e_EUA s] (1 − δ)^(t−1) − M
    NPV = −I + Σ benefit_t / (1 + i)^t,   IRR: NPV(IRR) = 0
    simple payback = I / benefit_1,   discounted payback: Σ PV reaches I (interpolated)
    CRF = i (1 + i)ⁿ / ((1 + i)ⁿ − 1),   levelized cost of saved fuel = (CRF × I + M) / S

p fuel price, e fuel escalation, C_F carbon factor, e_EUA allowance price, s ETS share, δ saving degradation, M maintenance, i discount rate, n life.

## Assumptions and limitations

- The saving is a fixed share of the consumption entered, declining only by the degradation rate; measured savings carry ±1–3 % absolute uncertainty.
- Benefits are fuel and ETS allowances only; FuelEU, CII, charter premiums, residual value, financing and tax are not priced.
- Annual year-end cash flows, nominal prices and rate; one currency.

## Worked example

A pre-swirl device: 400 000 installed plus 3 days off-hire at 20 000, maintenance 5 000 per year, claimed saving 5 % of 30 t/day over 250 sea days, HFO at 550 per tonne escalating 2 % per year, allowances 70 per t CO₂ with 50 % of emissions in the ETS, 10-year life, 8 % discount rate.

1. Investment 460 000. Fuel saved 375 t/yr, CO₂ saved 1 168 t/yr.
2. Year 1: fuel 206 250 + allowances 40 871 − maintenance 5 000 = 242 121.
3. Simple payback 1.9 years; discounted payback about 2.1 years.
4. NPV about 1.28 million at 8 %, IRR above 50 %, benefit-cost ratio 3.8.
5. Levelized cost of saved fuel: CRF(8 %, 10) = 0.149 → (0.149 × 460 000 + 5 000)/375 = 196 per tonne against a 550 price.

Run it again at a 2.5 % saving (the low end of what monitoring usually confirms): payback 3.9 years, NPV still positive. That is the robustness test that matters.

## FAQ

**Which consumption do I enter?**
The one the device acts on: main-engine fuel at sea for hull and propeller devices, total fuel for waste-heat recovery, auxiliary fuel for shaft generators.

**Simple or discounted payback?**
Simple payback ignores the time value of money and is what vendors quote; discounted payback and NPV are what the finance department uses.

**What is the levelized cost of saved fuel?**
The annualised investment and maintenance per tonne saved; if it is below the fuel price (plus the ETS cost per tonne), the device is cheaper than buying the fuel.

**How do I treat the ETS share?**
100 % for ships trading only within the EU/EEA, 50 % for voyages between the EU and third countries, 0 outside; from 2026 all of those emissions are surrendered (40 % and 70 % in 2024 and 2025).

**Why is IRR sometimes blank?**
When the cash flows never turn positive there is no rate at which the NPV is zero.

**Can I include a residual value?**
Not directly; reduce the capex by its present value, or extend the project life.

**What about CII?**
A saving of x % of fuel lowers the attained CII by about x % at the same distance; the CII rating calculator shows whether that changes the rating band.

## Related calculators

- [Optimal hull cleaning interval](../hull-cleaning-interval/index.html) — the recurring-cost version of the same economics.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — allowance costs and phase-in.
- [CII rating](../cii-rating/index.html) — what the saving does to the rating.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — the baseline consumption.
- [Optimal speed under charter](../optimal-speed-charter/index.html) — the other lever on fuel cost.
