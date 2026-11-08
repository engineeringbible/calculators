# Stair calculator: risers, treads and stringer

**Summary:** Number of risers and treads, riser height, total run, stringer length and stair angle from the total rise, checked against IRC or IBC stair limits.

## Introduction

How do you calculate stairs? Divide the total rise by the tallest riser you allow and round up to get the number of risers. Divide the rise by that number to get the equal riser height. A rise of 108 in with risers of at most 7.5 in needs 15 risers of 7.2 in and 14 treads. With 10 in treads the stair runs 140 in and the stringer is 176.8 in long.

This calculator lays out a straight flight from the total rise, the maximum riser and the tread depth. It gives the risers and treads, the total run, the stringer length, the angle and the 2R + T comfort figure. It then checks the result against the International Residential Code for homes or the International Building Code for other buildings. It is for carpenters, builders, designers and homeowners planning a deck, basement or porch stair.

## Formulas

Risers, treads and run:

    n = H / R_max, rounded up
    R = H / n
    treads = n − 1
    run = treads × T

Stringer, angle and comfort:

    stringer = √(H² + run²)
    θ = atan(R / T)
    comfort = 2R + T

- H — total rise from finished floor to finished floor
- R_max — the tallest riser you allow; R — the actual, equal riser height
- T — tread depth, nosing to nosing
- n — number of risers; the top riser lands on the upper floor, so there is one tread fewer

Code limits checked:

| Item | IRC R311.7 (dwellings) | IBC §1011 (other buildings) |
|---|---|---|
| Riser height | 7¾ in maximum | 4 to 7 in |
| Tread depth | 10 in minimum | 11 in minimum |
| Headroom | 6 ft 8 in | 80 in |
| Rise of one flight | 151 in | 12 ft |

## Assumptions and limitations

- The stair is a straight flight. Winders, spiral stairs and landings are not designed here.
- All risers are equal. The IRC allows them to differ by no more than ⅜ in, so measure the rise between finished floor surfaces.
- The stringer length runs along the nosing line. Cut the board longer to allow for the seat cut at the bottom and the hanger at the top.
- The checks cover risers, treads, headroom and the rise of a flight. Width, handrails, guards and nosings also have code rules, and local amendments may change them.

## Worked example

A basement stair climbs 108 in from floor to floor. The builder wants risers of at most 7.5 in and treads of 10 in. Lay out the stair and check it against the IRC.

1. Risers: 108 / 7.5 = 14.4, so 15 risers.
2. Riser height: 108 / 15 = 7.2 in, below the IRC maximum of 7¾ in.
3. Treads: 15 − 1 = 14 treads of 10 in, meeting the 10 in minimum.
4. Total run: 14 × 10 = 140 in, or 11 ft 8 in.
5. Stringer length: √(108² + 140²) = 176.8 in, or 14.7 ft.
6. Comfort: 2 × 7.2 + 10 = 24.4 in, inside the 24 to 25 in range.

The stair angle is 35.8°. With 14 risers instead, each would be 7.71 in and 2R + T would be 25.4 in, steeper than comfortable.

## FAQ

**What is the maximum riser height for stairs?**
7¾ in for homes under the IRC and 7 in for other buildings under the IBC. The IBC also sets a minimum riser of 4 in.

**What is the minimum tread depth?**
10 in in homes under the IRC and 11 in under the IBC, measured horizontally from nosing to nosing.

**How many steps do I need for an 8 ft rise?**
96 in divided by 7¾ in is 12.4, so 13 risers of 7.38 in and 12 treads under the IRC.

**What is the 2R + T rule?**
Two risers plus one tread should equal one comfortable stride, 24 to 25 in. It goes back to François Blondel in 1675.

**How long should a stair stringer be?**
At least the length along the nosing line, √(rise² + run²), plus extra for the cuts at the top and bottom.

**How much headroom does a stair need?**
6 ft 8 in clear above the nosing line under the IRC, and 80 in under the IBC.

**What angle should a stair have?**
The codes set it through the riser and tread limits. The steepest IRC stair, 7¾ in on 10 in, is 37.8°; the IBC limit of 7 in on 11 in is 32.5°.

## Related calculators

- [Roof pitch calculator](../roof-pitch/index.html) — rise and run of a roof, laid out the same way.
- [Slope calculator](../slope/index.html) — ramps, percent grade and angle.
- [Concrete slab calculator](../concrete-slab/index.html) — the landing pad at the foot of the stair.
- [Concrete block calculator](../concrete-block/index.html) — block walls that support a stair or landing.
