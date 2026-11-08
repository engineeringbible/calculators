# Quarter-mile ET and trap speed calculator

**Summary:** Estimated quarter-mile elapsed time and trap speed from weight and horsepower, with eighth-mile time and speed and the weight-to-power ratio.

## Introduction

How fast will a car run the quarter mile? Drag racers estimate the elapsed time and the trap speed from the race weight and the horsepower, using formulas fitted to drag-strip results. Both depend only on the weight per horsepower. A 3 500 lb car with 400 hp carries 8.75 lb per hp and should run about 12.0 seconds at about 114 mph.

This calculator gives the estimated quarter-mile ET and trap speed with three published sets of constants, and the matching eighth-mile figures. It accepts crank or wheel horsepower. It is for enthusiasts planning a build, comparing cars, or checking whether a time slip matches the claimed power.

## Formulas

Quarter-mile estimates:

    ET = K_t × (W / hp)^(1/3)
    mph = K_v × (hp / W)^(1/3)

Eighth mile, from the constant-power model behind the formulas:

    ET_1/8 = ET_1/4 / 2^(2/3) = ET_1/4 / 1.587
    mph_1/8 = mph_1/4 / 2^(1/3) = mph_1/4 / 1.260

- W — race weight in lb, with driver and fuel
- hp — flywheel horsepower; wheel hp is divided by (1 − loss) first
- K_t, K_v — Hale 5.825 and 234; Fox 6.050 and 225; Huntington 6.290 and 224

## Assumptions and limitations

- The formulas are estimates. They assume good traction, a prepared track and a clean launch.
- A car that spins its tyres or launches softly runs a slower ET than predicted, while its trap speed stays close to the estimate.
- Altitude and hot weather reduce engine power and slow the car. Correct the horsepower first.
- The eighth-mile ratios come from a car accelerating at constant power with no drag. Real cars differ from 1.587 by a few percent.
- The constants differ because they were fitted to different cars. Hale's suit modern performance cars.

## Worked example

A street car weighs 3 500 lb with the driver and has 400 hp at the flywheel. What are its quarter-mile and eighth-mile estimates with the Hale constants?

1. Weight to power: 3 500 / 400 = 8.75 lb per hp.
2. Cube root: 8.75^(1/3) = 2.061.
3. Elapsed time: 5.825 × 2.061 = 12.00 s.
4. Trap speed: 234 / 2.061 = 113.6 mph.
5. Eighth mile: 12.00 / 1.587 = 7.56 s at 113.6 / 1.260 = 90.1 mph.

A real time slip of 12.4 s at 113 mph would point to a weak launch rather than missing power.

## FAQ

**How do I estimate my quarter-mile time?**
Divide the race weight in lb by the flywheel horsepower, take the cube root and multiply by 5.825. That gives the ET in seconds.

**How much horsepower do I need for a 10-second quarter mile?**
With the Hale constant, a 3 500 lb car needs 3 500 × (5.825 / 10)³ = 692 hp at the flywheel.

**How do I convert an eighth-mile time to a quarter mile?**
Multiply the eighth-mile ET by about 1.59. A 7.56 s eighth corresponds to about a 12.0 s quarter.

**Why is my ET slower than predicted?**
Usually traction and the launch. The trap speed shows the power more reliably than the elapsed time.

**Does weight or horsepower matter more?**
Only their ratio matters in these formulas. Taking 100 lb out of a 3 500 lb car has the same effect as adding about 12 hp to 400 hp.

**What weight should I use?**
The race weight: the car as it sits on the start line with the driver and fuel.

## Related calculators

- [Horsepower calculator](../horsepower/index.html) — power from a time slip or a dyno reading.
- [Gear and vehicle speed](../gear-speed/index.html) — rpm at the trap speed in top gear.
- [Tire size calculator](../tire-size/index.html) — tyre diameter for gearing.
- [Drag and lift force](../drag-lift/index.html) — aerodynamic drag at the trap speed.
