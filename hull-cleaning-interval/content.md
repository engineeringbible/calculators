# Optimal hull cleaning interval calculator

**Summary:** Cleaning interval that minimises fuel penalty plus cleaning cost, from the fouling growth rate, fuel and ETS prices and the cost per cleaning.

## Introduction

Fouling costs fuel every day and cleaning costs money every time; somewhere between "never" and "monthly" there is an interval that minimises the sum. If the penalty grows roughly linearly with time since the last cleaning, the problem is the classic replacement-interval optimisation and has a closed-form answer: the optimal interval is the square root of twice the cleaning cost divided by the cost growth rate. This calculator prices each percentage point of penalty from the ship's consumption, the fuel price and the CO₂ allowance cost, adds off-hire to the cleaning cost, and returns the optimal interval, the penalty it allows to build up, the fuel and CO₂ wasted and the saving against the interval in use.

It is for technical superintendents and performance managers planning in-water cleaning, charterers negotiating hull-performance clauses, and students of maritime economics.

## Formulas

    c₁ = F × d × (p + s C_F e) / 100          cost per month of a 1 % penalty
    C  = cleaning cost + off-hire days × hire
    A(T) = C/T + c₁ p₀ + c₁ r T/2              average monthly cost of a T-month cycle
    T*  = √( 2C / (c₁ r) ),   A(T*) = c₁ p₀ + √(2 C c₁ r)
    fuel wasted per year = F d 12 (p₀ + r T/2)/100

F clean consumption at sea (t/day), d sea days per month, p fuel price, e allowance price per t CO₂, C_F carbon factor, s ETS share, p₀ residual penalty after cleaning (%), r penalty growth (% per month).

## Assumptions and limitations

- Linear average fouling growth; real growth is seasonal and jumps during idle periods in warm water.
- Cleaning restores the hull to p₀ instantly and is feasible wherever the ship is; port rules, capture requirements and coating damage are outside the model.
- Fuel and allowance costs only; CII rating and FuelEU consequences are not priced.
- No discounting within the cycle; one currency.

## Worked example

A tanker burning 30 t/day at sea, 22 sea days a month, fuel 550 per tonne, allowances 70 per t CO₂ with half the emissions under the ETS, penalty growing 1 % per month after a full clean; cleaning costs 60 000 plus one day off-hire at 20 000; current policy: clean yearly.

1. c₁ = 30 × 22 × (550 + 0.5 × 3.114 × 70)/100 = 4 349 per percentage point per month; C = 80 000.
2. T* = √(2 × 80 000/4 349) = 6.1 months, about two cleanings a year, with the penalty reaching 6.1 % just before each.
3. Average cost 26 400 per month (317 000 per year), of which half is cleaning and half fuel penalty, as the optimum always balances them.
4. Yearly cleaning: 32 800 per month (393 000 per year), 475 t of fuel and 1 480 t of CO₂ wasted. Moving to the six-month interval saves about 76 600 per year.

If the growth rate were 0.05 % per month (a good coating on an active ship) the optimum would be 27 months, beyond a 24-month docking interval, and the answer is to clean only at docking.

## FAQ

**Why does the optimum balance cleaning and penalty costs?**
At the minimum of C/T + aT/2 the two terms are equal; cleaning more often than that spends more on divers than it saves in fuel.

**Where do I get the growth rate?**
From the performance monitoring trend (speed loss or power increase per month after a cleaning, ISO 19030-style), or from the hull-roughness-penalty calculator applied to the expected fouling states.

**What is the residual penalty?**
The part of the penalty a cleaning does not remove: coating damage, residual roughness, or a hull only partially cleaned. It raises the cost but does not change the interval.

**Should propeller polishing use the same model?**
Yes, with the propeller's own growth rate and polishing cost; propellers foul faster and are cheaper to polish, so the interval is shorter.

**Does the ETS matter?**
At 70 per tonne of CO₂ and a 50 % share it adds about 20 % to the effective fuel price, shortening the optimal interval by about 10 %.

**Why cap at the docking interval?**
Recoating in dock resets the roughness anyway, so an economic optimum longer than the docking cycle means "do not clean in water".

**Can I include CII?**
Not directly; if a rating band is at stake, treat the fuel saved as worth more than its price, or shorten the interval for that reason.

## Related calculators

- [Hull roughness and fouling penalty](../hull-roughness-penalty/index.html) — the penalty per fouling state that sets the growth rate.
- [Energy-saving device payback](../esd-payback/index.html) — the same economics for a one-off investment.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — the allowance cost.
- [CII rating](../cii-rating/index.html) — what the wasted fuel does to the rating.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — consumption at the clean-hull baseline.
