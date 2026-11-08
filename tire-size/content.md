# Tire size calculator and comparison

**Summary:** Tire diameter, sidewall, circumference and revs per mile from size codes like 225/45R17, comparing two sizes for speedometer error and true speed.

## Introduction

A tire size such as 225/45R17 gives the section width in millimetres, the sidewall height as a percentage of the width, and the rim diameter in inches. To find the overall diameter, multiply the width by the aspect ratio to get the sidewall height. Then add two sidewalls to the rim diameter. For 225/45R17 the sidewall is 101.25 mm and the tire stands 634.3 mm, or 24.97 in, tall.

This calculator reads two size codes and gives the width, sidewall, diameter, circumference and revolutions per mile of each. It then compares them: the diameter difference, and the true speed when the speedometer was set for the original tire. It is for drivers choosing new wheels and tires, and for anyone checking a plus-size fitment.

## Formulas

Metric sizes, width W in mm, aspect ratio AR in %, rim d in inches:

    H = W × AR / 100
    D = d × 25.4 + 2 H        mm

Flotation sizes such as 33x12.50R15 give D and W in inches:

    H = (D − d) / 2

Circumference, revolutions and speedometer:

    C = π D
    revs per mile = 63 360 / (π D[in])
    true speed = reading × D_B / D_A

- H — sidewall height; D — overall diameter
- D_A — the original tire the speedometer was set for; D_B — the new tire
- P, LT and ST prefixes, ZR and R construction letters and the load and speed index do not change the size

## Assumptions and limitations

- The dimensions are the nominal design values of the size code. Real tires of the same size differ slightly between brands and with tread wear.
- Revolutions per mile are geometric. Tire makers measure them rolling under load, so their figures are a little higher.
- A change in diameter alters the speedometer, the odometer and the inputs to the traction and stability systems. Check the clearance to the body and suspension too.
- Codes without an aspect ratio, such as 195R14, are not accepted. Enter the full size.

## Worked example

A car on 225/45R17 tires is moving to 245/40R18. How much taller is the new tire, and what is the true speed when the speedometer shows 60 mph?

1. Old sidewall: 225 × 0.45 = 101.25 mm, or 3.99 in.
2. Old diameter: 17 × 25.4 + 2 × 101.25 = 634.3 mm, or 24.97 in, and 807.6 revolutions per mile.
3. New sidewall: 245 × 0.40 = 98.0 mm.
4. New diameter: 18 × 25.4 + 2 × 98.0 = 653.2 mm, or 25.72 in, and 784.2 revolutions per mile.
5. Difference: 653.2 / 634.3 − 1 = 2.98 %.
6. True speed at an indicated 60 mph: 60 × 653.2 / 634.3 = 61.8 mph.

A closer match is 245/40R17 or 225/40R18, depending on the wheel chosen.

## FAQ

**What do the numbers on a tire mean?**
In 225/45R17, 225 is the section width in mm, 45 is the sidewall height as a percentage of the width, R means radial and 17 is the rim diameter in inches.

**How do I calculate tire diameter?**
Multiply the width by the aspect ratio for the sidewall height. Add twice that to the rim diameter, converting inches to millimetres with 25.4.

**How much bigger can I go without affecting the speedometer?**
Every change affects it in proportion to the diameter. Keep the new diameter as close to the original as you can; this calculator warns above 3 %.

**Will bigger tires make my speedometer read faster or slower?**
Slower. With a larger tire the car travels further per turn, so the true speed is higher than the reading.

**What does a 33x12.50R15 tire size mean?**
It is a flotation size: 33 in tall, 12.5 in wide, for a 15 in rim. The sidewall is (33 − 15) / 2 = 9 in.

**What is the difference between P and LT sizes?**
P-metric tires are for passenger cars and LT-metric tires for light trucks with heavier loads. The dimensions follow the same formula.

## Related calculators

- [Gear ratio and vehicle speed](../gear-speed/index.html) — rpm and speed with the new tire diameter.
- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — performance estimates.
- [Stopping distance](../stopping-distance/index.html) — braking distance on different surfaces.
- [Horsepower calculator](../horsepower/index.html) — power from torque and rpm.
