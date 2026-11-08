# Planing boat speed calculator (Crouch formula)

**Summary:** Top speed of a planing boat from shaft horsepower and weight by Crouch's formula, with C by hull type, and the power needed for a target speed.

## Introduction

A planing boat's speed depends mainly on how many pounds of boat each horsepower has to push. Crouch's formula puts this in one line: speed in knots equals a constant C divided by the square root of the weight in pounds per shaft horsepower. A 5 000 lb runabout with 200 shp carries 25 lb per horsepower, so with C = 150 it makes 150 / √25 = 30 kn.

This calculator gives the speed of a planing boat from its loaded weight, shaft power and hull type, using the constants Dave Gerr tabulates in The Propeller Handbook. It also works the other way, giving the power for a target speed. It is for boat owners repowering or choosing an engine, and for anyone checking a dealer's speed claim.

## Formulas

Crouch's planing formula and its inverse:

    V = C / √(W / P)          V in kn, W in lb, P in shp
    P = W × (V / C)²

The same in metric units:

    V = 0.780 × C × √(P[kW] / W[kg])

Crouch constants C (Gerr):

- 150 — average runabouts, cruisers and passenger vessels
- 190 — high-speed runabouts and very light high-speed cruisers
- 210 — race boats
- 220 — three-point and stepped hydroplanes
- 230 — racing power catamarans and sea sleds

## Assumptions and limitations

- The formula applies to boats that are truly planing, above a speed–length ratio of about 3. Below that it overestimates the speed of displacement and semi-displacement hulls.
- W is the weight as the boat runs: hull, engines, fuel, water, crew and gear. Use a realistic load, not the brochure's dry weight.
- P is shaft horsepower at the propeller. Gearboxes and stern drives lose a few percent of the engine's rated power.
- C sums up hull form, propeller and trim. The table gives typical values. If you know the speed of a sister boat, work out its C and use that instead.

## Worked example

A runabout weighs 5 000 lb loaded and has 200 shaft horsepower. It is an average planing hull, C = 150. How fast will it go, and what power would give 35 kn?

1. Weight per horsepower: 5 000 / 200 = 25.0 lb/hp.
2. Speed: 150 / √25.0 = 150 / 5 = 30.0 kn, or about 34.5 mph.
3. Power for 35 kn: 5 000 × (35 / 150)² = 5 000 × 0.0544 = 272 shp.

So 36 % more power buys about 17 % more speed, because speed grows with the square root of power.

## FAQ

**How fast will my boat go with a given engine?**
Divide the loaded weight in pounds by the shaft horsepower, take the square root, and divide C by it. With C = 150 and 25 lb/hp the answer is 30 kn.

**How much horsepower do I need for 30 knots?**
Multiply the weight by (30 / C)². A 5 000 lb boat with C = 150 needs 5 000 × 0.04 = 200 shp.

**Which constant C should I use?**
Start with Gerr's value for your hull type. Better still, work out C from a similar boat whose speed and power you know: C = V × √(W / P).

**How much does extra weight slow a planing boat?**
Speed falls with the square root of weight. Adding 10 % to the weight cuts the speed by about 4.7 %, all else equal.

**Does the formula work in kilograms and kilowatts?**
Yes, with a conversion factor: V = 0.780 × C × √(kW / kg). The calculator converts units for you.

**Why does my boat not reach the predicted speed?**
Common causes are more weight than assumed, a fouled bottom, the wrong propeller pitch, or an engine that does not reach its rated rpm. Check the propeller with the pitch calculator.

## Related calculators

- [Hull speed calculator](../hull-speed/index.html) — speed limits of displacement hulls.
- [Propeller pitch and boat speed](../prop-pitch-speed/index.html) — the pitch for the predicted speed.
- [Boat fuel consumption](../boat-fuel/index.html) — the fuel that power burns.
- [Froude number calculator](../froude-number/index.html) — when a hull starts to plane.
