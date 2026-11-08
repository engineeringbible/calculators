# Thrust-to-weight, wing loading and stall speed calculator

**Summary:** Thrust-to-weight ratio, wing loading, power loading and stall speed for aircraft, drones and rockets, with the vertical acceleration at full thrust.

## Introduction

The thrust-to-weight ratio compares the push of the engines with the weight they must move. Above 1, a rocket or drone can climb straight up. Wing loading is the weight carried by each square foot of wing, and it sets the stall speed. A four-seat trainer of 2 550 lb with 174 ft² of wing carries 14.66 lb/ft² and stalls at about 54 kn with a maximum lift coefficient of 1.5.

This calculator gives the thrust-to-weight ratio and the net vertical acceleration, the wing loading, the power loading and the stall speed at an altitude. Each part is optional, so it serves aircraft, drones and rockets. It is for pilots, students, drone builders and model-rocket fliers.

## Formulas

Ratios and loadings:

    W = m × g
    T/W = thrust / W
    a_vertical = g × (T/W − 1)
    wing loading = W / S
    power loading = W / P

Stall speed:

    V_s = √(2 W / (ρ S CL_max))

- m — mass; g = 9.81 m/s²; S — wing area; P — engine power
- ρ — air density from the standard atmosphere at the altitude
- CL_max — maximum lift coefficient of the wing, from the aircraft data
- In US units 1 lb of mass weighs 1 lbf, so wing loading in lb/ft² is the same number in lbf/ft²

## Assumptions and limitations

- Thrust is the static thrust. Propeller thrust falls as the aircraft speeds up, and jet thrust changes with speed and altitude.
- The vertical acceleration ignores drag and the mass burned off. It is the value at lift-off or the start of a climb.
- The stall speed is for level flight at the weight entered. In a banked turn the load factor raises it by the square root of the load factor.
- CL_max depends on the wing, the flaps and the Reynolds number. Use the value from the aircraft or wing-section data.
- The stall speed shown is a true airspeed. The indicated stall speed stays about the same at every altitude.

## Worked example

A four-seat trainer weighs 2 550 lb at gross weight, has 174 ft² of wing and a 180 hp engine. Its wing reaches a CL_max of 1.5 without flaps. What are its loadings and its stall speed at sea level?

1. Wing loading: 2 550 / 174 = 14.66 psf, or 1 156.7 kg / 16.17 m² = 71.6 kg/m².
2. Power loading: 2 550 / 180 = 14.17 lb per hp.
3. Wing loading in SI: 11 343 N / 16.17 m² = 701.7 Pa.
4. Stall speed: √(2 × 701.7 / (1.225 × 1.5)) = 27.64 m/s = 53.7 kn.

At a density altitude of 5 000 ft the same aircraft stalls at 57.9 kn true airspeed, at about the same indicated airspeed.

## FAQ

**What is a good thrust-to-weight ratio?**
Above 1 for anything that must climb vertically, such as a rocket or a multirotor drone. Airliners and light aircraft fly with ratios well below 1 because the wing carries the weight.

**How do I calculate wing loading?**
Divide the weight by the wing area. A 2 550 lb aircraft with 174 ft² of wing carries 14.66 lb/ft².

**How do I calculate stall speed?**
Take the square root of 2 × weight / (air density × wing area × CL_max). Use consistent units, such as N, kg/m³ and m².

**Why does stall speed increase with altitude?**
The air is thinner, so the wing must move faster through it to make the same lift. The indicated stall speed stays about the same.

**What is power loading?**
The weight per unit of engine power, in lb/hp or kg/kW. A lower number means better climb and take-off performance.

**How does weight change the stall speed?**
It grows with the square root of the weight. Ten percent more weight raises the stall speed by about 4.9 %.

## Related calculators

- [Drag and lift force](../drag-lift/index.html) — lift and drag at any speed.
- [Rocket equation](../rocket-equation/index.html) — delta-v from the propellant load.
- [Density altitude](../density-altitude/index.html) — the altitude to use on a hot or high day.
- [True airspeed](../true-airspeed/index.html) — TAS from calibrated airspeed.
