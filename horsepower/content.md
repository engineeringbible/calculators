# Horsepower calculator

**Summary:** Horsepower from torque and rpm, or estimated from quarter-mile time or trap speed and weight, in hp, kW and PS, at the crank and the wheels.

## Introduction

Horsepower is the rate at which an engine does work. To calculate it from a dyno reading, multiply the torque in lbf·ft by the rpm and divide by 5 252. An engine making 400 lbf·ft at 5 000 rpm produces 380.8 hp. Without a dyno, drag racers estimate power from the car's weight and its quarter-mile time or trap speed.

This calculator gives the crank horsepower from torque and rpm, or estimates it from a time slip with three published sets of constants. It shows the result in hp, kW and PS, and the wheel horsepower after a drivetrain loss. It is for car enthusiasts reading dyno sheets and time slips, and for anyone converting between horsepower units.

## Formulas

Power from torque, exact:

    P = T × 2π × N / 60
    hp = T[lbf·ft] × N[rpm] / 5 252

Estimates from a quarter-mile run:

    hp = W × (K_t / ET)³
    hp = W × (mph / K_v)³

Wheel and crank power:

    hp_wheel = hp_crank × (1 − loss)

- T — torque; N — engine speed
- W — race weight in lb, with driver and fuel
- ET — elapsed time in s; mph — trap speed
- K_t, K_v — Hale 5.825 and 234; Fox 6.050 and 225; Huntington 6.290 and 224
- 1 hp = 745.7 W; 1 PS = 735.5 W

## Assumptions and limitations

- Power from torque and rpm is exact. Torque and horsepower curves always cross at 5 252 rpm when plotted in lbf·ft and hp.
- The time-slip formulas are estimates fitted to drag-strip results. They give flywheel horsepower for a car with good traction on a prepared track.
- Trap speed is the better guide. A poor launch or wheelspin adds tenths to the elapsed time but changes the trap speed much less.
- The drivetrain loss is an assumption. 15 % is a common figure for a manual rear-drive car, and automatics and all-wheel drive lose more.
- The constants differ because they were fitted to different cars. Hale's suit modern performance cars; Huntington's came from 1960s muscle cars.

## Worked example

An engine dyno shows 400 lbf·ft at 5 000 rpm. What is the power at that point, and at the wheels with a 15 % drivetrain loss?

1. Power: 400 × 5 000 / 5 252 = 380.8 hp.
2. In kilowatts: 380.8 × 0.7457 = 284.0 kW.
3. In metric horsepower: 284 000 / 735.5 = 386.1 PS.
4. At the wheels: 380.8 × (1 − 0.15) = 323.7 hp.

In a 3 500 lb car with good traction, the Hale formula predicts a trap speed of 234 × (380.8 / 3 500)^(1/3) = 111.7 mph. Working backwards from a time slip, 111.7 mph gives back about 381 hp.

## FAQ

**How do I calculate horsepower from torque?**
Multiply torque in lbf·ft by rpm and divide by 5 252. In SI units, kW = N·m × rpm / 9 549.

**Why do torque and horsepower cross at 5 252 rpm?**
Because 5 252 is the constant in hp = lbf·ft × rpm / 5 252. At that speed the two numbers are equal.

**How accurate is horsepower from a quarter-mile time?**
It is an estimate. For the same elapsed time, Huntington's constant gives 26 % more power than Hale's, so the choice of constants matters. Trap speed gives a more reliable figure than elapsed time.

**What is the difference between hp and PS?**
PS is metric horsepower, 735.5 W. One mechanical horsepower is 745.7 W, so 100 hp is 101.4 PS.

**What is wheel horsepower?**
The power a chassis dyno measures at the driven wheels. It is lower than crank power because the gearbox, driveshaft and differential absorb some of it.

**How do I convert hp to kW?**
Multiply by 0.7457. A 300 hp engine is 224 kW.

## Related calculators

- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — the time slip from weight and power.
- [Torque, power and speed](../torque-power-rpm/index.html) — any one of the three from the other two.
- [Engine displacement](../engine-displacement/index.html) — cubic inches and litres from bore and stroke.
- [Fuel injector size](../fuel-injector-size/index.html) — injector flow for the power.
