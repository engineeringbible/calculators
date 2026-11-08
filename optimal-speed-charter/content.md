# Optimal speed under charter calculator

**Summary:** Cost-minimising speed on time charter and profit-maximising speed on a voyage charter from the fuel-speed law, prices, hire or freight and port time.

## Introduction

Fuel consumption rises roughly with the cube of speed while hire and operating costs run by the day, so every ship has an economic speed: slow enough to save fuel, fast enough not to waste days. Who pays what decides the answer. A time charterer pays hire and fuel and wants the cheapest voyage; an owner on a voyage charter earns a fixed freight and wants the most profit per day, which makes port time matter. This calculator solves both cases from the ship's fuel curve, the prices, the hire or freight and the port days, shows Ronen's closed-form result next to the numeric optimum, and compares the result with sailing at the reference speed.

It is for operators and chartering managers, performance engineers advising on slow steaming, and students of maritime economics.

## Formulas

    F(v) = F₀ (v/v₀)ⁿ,   sea days = D/(24 v),   p_eff = p + s C_F e_EUA
    Time charter:    C(v) = H (D/24v + T_p) + p_eff F(v) D/24v
                     v* = v₀ [H / ((n − 1) p_eff F₀)]^(1/n)                       (Ronen)
    Voyage charter:  Π(v) = [R − p_eff F(v) D/24v − c_op (D/24v + T_p)] / (D/24v + T_p)
                     numeric maximum within [v_min, v_max];
                     T_p = 0, c_op = 0:  v* = [24 R v₀ⁿ / (n p_eff F₀ D)]^(1/(n−1))

## Assumptions and limitations

- Power-law fuel curve valid near the reference speed; below about 60 % of design speed fuel per mile rises again.
- Time charter: charterer pays hire and fuel. Voyage charter: owner earns a fixed freight and pays fuel and daily operating cost.
- Laycan, weather, canal dues, cargo inventory cost, FuelEU and CII are outside the model.
- Port fuel is a constant per port day and does not move the optimum.

## Worked example

A tanker burning 35 t/day at 14 kn, voyage 5 000 nmi with 4 port days, fuel 550 per tonne.

*Time charter at 18 000 per day.* v* = 14 × (18 000/(2 × 550 × 35))^(1/3) = 10.87 kn. Sea days 19.2, fuel 16.4 t/day → 314 t at sea plus 12 t in port; voyage cost 417 000 hire + 179 000 fuel = 596 000, against 633 000 at 14 kn: 5.8 % cheaper, at the price of 4.3 more days.

*Voyage charter earning 1.2 million per voyage, operating cost 7 000 per day.* Without port time the closed form gives 16.5 kn; with 4 port days the profit-per-day optimum drops to 15.1 kn, because the fixed freight is now spread over more days and each sea day saved is worth less. If the ship cannot exceed 16 kn and there is no port time, the answer is the bound, and the page says so.

Adding ETS allowances at 70 per tonne of CO₂ with a 50 % share raises the effective fuel price to 659 and lowers the time-charter optimum to 10.2 kn.

## FAQ

**Why does the time-charter optimum not depend on distance?**
Both hire and fuel are proportional to sea days times a function of speed; distance cancels. Only the hire-to-fuel-price ratio and the fuel curve matter.

**Why does port time lower the voyage-charter optimum?**
Profit per day is the fixed freight divided by the whole cycle; port days dilute it, so a sea day saved raises the profit rate by less than it would on a port-free voyage, and the fuel saved by slowing down weighs relatively more.

**Where does the exponent come from?**
Fit it to the ship's speed-consumption curve (noon reports or the Admiralty-coefficient calculator); 3 is the textbook value, 3.5–4 for container ships near design speed.

**How does the ETS enter?**
As an addition to the fuel price: share × carbon factor × allowance price per tonne of fuel. Dearer fuel means slower optimum.

**What if the freight depends on speed (demurrage, laycan)?**
Then this model does not apply directly; use the time-charter form with the hire replaced by the daily value of time, or run the voyage model for the feasible speed window only.

**Is slow steaming always profitable?**
Only when the saving in fuel outweighs the extra days; at high hire rates and cheap fuel the optimum moves back toward design speed.

## Related calculators

- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — the consumption and cost of one voyage at a given speed.
- [Admiralty coefficient](../admiralty-coefficient/index.html) — fit the fuel-speed exponent.
- [Energy-saving device payback](../esd-payback/index.html) — the capital alternative to slowing down.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — the allowance cost in the effective price.
- [Great-circle distance](../great-circle-distance/index.html) — the voyage distance.
