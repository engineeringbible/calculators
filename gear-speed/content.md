# Gear ratio and vehicle speed calculator

**Summary:** Vehicle speed from rpm, gear ratio, final drive and tire diameter, the rpm at a speed, and speedometer error after changing tire size.

## Introduction

How fast is a car going at a given rpm? Divide the engine speed by the overall gear ratio to get the wheel speed, then multiply by the tire circumference. In US units the shortcut is mph = rpm × tire diameter in inches / (gear ratio × axle ratio × 336). At 3 000 rpm in direct drive with 3.73 gears and 28 in tires, a car does 67.0 mph.

This calculator gives the road speed at an rpm or the rpm at a road speed, from the transmission gear, the final drive and the tire diameter. It also shows how far off the speedometer reads after fitting taller or shorter tires. It is for enthusiasts choosing axle gears and tires, and for anyone checking highway cruise rpm.

## Formulas

Road speed and engine speed:

    v = N × π D / (60 × i_g × i_f)
    mph = rpm × D[in] / (i_g × i_f × 336.13)

Tire revolutions and speedometer error:

    revs per mile = 63 360 / (π D[in])
    reading = true speed × D_cal / D
    error = D_cal / D − 1

- N — engine speed in rpm
- D — tire overall diameter; D_cal — the diameter the speedometer was set for
- i_g — transmission gear ratio; i_f — final drive (axle) ratio
- 336.13 = 63 360 / (60 π)

## Assumptions and limitations

- There is no slip in the clutch, the torque converter or the tires. With an unlocked torque converter the engine turns faster than the result shows.
- The diameter is the unloaded tire diameter. Under load the rolling radius is a little smaller, so the true speed is slightly lower.
- The speedometer counts revolutions. A larger tire makes it read low, and a smaller one makes it read high.
- The odometer has the same percentage error as the speedometer.

## Worked example

A pickup turns 3 000 rpm in fourth gear, a direct 1.00 ratio, with 3.73 axle gears. The owner has fitted 28 in tires in place of the 26 in tires the speedometer was set for. What is the true speed and what does the speedometer show?

1. Overall ratio: 1.00 × 3.73 = 3.730.
2. True speed: 3 000 × 28 / (3.730 × 336.13) = 67.0 mph.
3. Tire revolutions: 63 360 / (π × 28) = 720.3 per mile.
4. Speedometer reading: 67.0 × 26 / 28 = 62.2 mph.
5. Error: 26 / 28 − 1 = −7.1 %.

The speedometer reads about 5 mph slow at this speed, so the driver is going faster than the dial shows.

## FAQ

**How do I calculate mph from rpm?**
Multiply rpm by the tire diameter in inches and divide by the overall ratio times 336. Use the gear ratio times the axle ratio as the overall ratio.

**What rpm will I turn at 70 mph?**
With a 0.70 overdrive, 3.73 gears and 28 in tires, about 2 194 rpm. Multiply mph by the overall ratio and by 336, then divide by the tire diameter.

**Do bigger tires make the speedometer read slower?**
Yes. A larger tire covers more ground per turn, so the car goes faster than the speedometer shows.

**How do I correct the speedometer after a tire change?**
Recalibrate the speedometer, or for older cars change the speedometer drive gear. The correction factor is the new diameter divided by the old.

**What does a higher numerical axle ratio do?**
It turns the engine faster at a given road speed. A 4.10 axle gives quicker acceleration and higher cruise rpm than a 3.73.

**How many revolutions per mile does my tire make?**
Divide 63 360 by π times the diameter in inches. A 28 in tire makes about 720.

## Related calculators

- [Tire size calculator](../tire-size/index.html) — diameter from a size code like 225/45R17.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — generic gear trains from tooth counts.
- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — trap speed to check gearing against.
- [Horsepower calculator](../horsepower/index.html) — power from torque and rpm.
