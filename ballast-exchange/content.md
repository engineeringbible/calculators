# Ballast water exchange time calculator

**Summary:** D-1 ballast exchange: sequential, flow-through and dilution times and distance, the 3-volume / 95 % rule from perfect mixing, and the location criteria.

## Introduction

Exchanging ballast at sea replaces coastal water and its organisms with open-ocean water. The BWM Convention's D-1 standard asks for 95 % by volume, and accepts pumping three tank volumes through as equivalent, a number that comes straight from the dilution of a well-mixed tank: after n volumes a fraction e^(−n) of the original water remains, and e^(−3) is 5 %. This calculator plans the operation for the three recognised methods: how much water must be pumped, how long it takes with the pumps available, how many miles the ship runs meanwhile, what exchange it achieves and whether the chosen area satisfies the distance-from-land and depth rules.

It is for chief officers planning a contingency exchange, superintendents reviewing a Ballast Water Management Plan, and students of marine environmental regulation. Since September 2024 treatment (D-2) is the rule and exchange the fallback; the planning arithmetic is the same.

## Formulas

    Q = pumps × rated capacity
    sequential:   pumped = N × 2V (1 + s),   efficiency = 1 − residual
    flow-through / dilution:   pumped = N × n V,   efficiency = 1 − e^(−n)    (n = 3 → 95.0 %)
    total time = pumped / Q,   time per tank = pumped / (N Q),   distance = time × speed
    location: ≥ 200 nmi from land and ≥ 200 m deep (B-4.1.1); else ≥ 50 nmi and ≥ 200 m (B-4.1.2)

## Assumptions and limitations

- Pumps at rated capacity throughout; valve line-up and stripping inside the allowance (sequential only).
- Perfect mixing for the pumping-through efficiency; real tanks mix imperfectly, hence the fixed three volumes.
- Stability, hull girder loads, sloshing and tank overpressure are checked in the ship's plan, not here.
- D-2 applies to all ships since 8 September 2024; exchange is a contingency or exemption measure.

## Worked example

Ten double-bottom and wing tanks of 1 500 m³, two 1 000 m³/h ballast pumps, 12 kn, area 220 nmi offshore in 1 500 m of water.

1. Flow-through, three volumes: 45 000 m³ pumped at 2 000 m³/h → 22.5 h, 2.25 h per tank, 270 nmi of sea room; 95.0 % exchanged, meets D-1; location meets B-4.1.1.
2. Sequential with 10 % stripping allowance: 33 000 m³ in 16.5 h; with 2 % unpumpable residual the exchange is 98 %, but every intermediate condition needs the stability and strength check.
3. Dilution: same water and time as flow-through, with the overflow replaced by a controlled bottom discharge.

Pumping only two volumes would give 86.5 % and fail the standard; 99 % would need 4.6 volumes.

## FAQ

**Why three volumes?**
Because a well-mixed tank retains e^(−3) = 5 % of its original water after three volumes have passed through, matching the 95 % requirement.

**Which method is faster?**
Sequential, by roughly a factor of 1.4 at the same pump capacity, but it empties tanks and so needs the stability and longitudinal strength checks; flow-through keeps the ship in its loaded ballast condition.

**What if I cannot reach 200 nmi from land?**
Regulation B-4 allows exchange as far from land as practicable but at least 50 nmi off in 200 m depth, or in an area designated by the port State; record the reason.

**Is exchange still allowed?**
As a contingency when the treatment system fails, under an exemption, or combined with treatment where the port State requires it; routine compliance is D-2.

**Why check the venting capacity?**
Flow-through pushes the full pump rate out through the air pipes or manholes; if they cannot pass it, the tank is over-pressurised.

**Does the ship have to slow down?**
Not for the exchange itself, but weather and the hours needed often dictate the plan; the page gives the miles run so the window can be checked against the route.

## Related calculators

- [Tank volume and partial fill](../tank-volume/index.html) — tank capacities.
- [Pump and fan affinity laws](../pump-affinity/index.html) — pump capacity at another speed.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — ballast line losses.
- [Initial stability (GM)](../initial-stability/index.html) — the intermediate conditions of a sequential exchange.
- [Course to steer with set and drift](../course-to-steer/index.html) — the exchange leg.
