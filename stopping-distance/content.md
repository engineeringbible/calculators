# Stopping distance calculator

**Summary:** Car stopping distance from speed as reaction plus braking distance, with AASHTO design values, road friction for dry, wet, snow or ice, and grade.

## Introduction

Stopping distance is the distance a vehicle covers from the moment a driver sees a hazard until it stops. It has two parts. The reaction distance is covered at full speed while the driver perceives and reacts. The braking distance follows, while the brakes slow the car. With the US highway design values of 2.5 s and 11.2 ft/s², a car at 60 mph needs about 570 ft to stop.

This calculator adds the reaction distance and the braking distance, in feet and metres. Braking uses either a deceleration rate, such as the AASHTO design value, or the tire-road friction of a surface from dry asphalt to ice. It allows for an uphill or downhill grade. It is for drivers, driving instructors, students and road designers.

## Formulas

Stopping distance:

    d = v × t + v² / (2 × (a + g G))

With a friction coefficient:

    a = μ × g

AASHTO form in US units, V in mph:

    SSD = 1.47 V t + V² / (30 × (a/32.2 + G))     ft

- v — speed; t — perception-reaction time, 2.5 s in AASHTO design
- a — deceleration on a level road, 3.4 m/s² (11.2 ft/s²) in AASHTO design
- G — grade as a decimal, positive uphill
- μ — tire-road friction coefficient; g = 9.81 m/s²

Average sliding friction coefficients (Wong):

| Surface | μ |
|---|---|
| Asphalt or concrete, dry | 0.75 |
| Concrete, wet | 0.70 |
| Earth road, dry | 0.65 |
| Gravel | 0.55 |
| Asphalt, wet | 0.45 to 0.60 |
| Earth road, wet | 0.40 to 0.50 |
| Snow, hard-packed | 0.15 |
| Ice | 0.07 |

## Assumptions and limitations

- The deceleration is constant from the end of the reaction time until the car stops. Brake build-up and air drag are ignored.
- The AASHTO deceleration of 3.4 m/s² is a comfortable rate that most drivers reach on wet pavement while keeping steering control. Hard emergency braking on dry pavement is stronger.
- The friction values are sliding values for locked wheels. With ABS the peak values, 0.8 to 0.9 on dry asphalt, apply.
- Worn tires, standing water and loose surfaces give less friction than the table.
- The results are estimates for one vehicle. They are not an accident reconstruction.

## Worked example

A car travels at 60 mph on a level road. Using the AASHTO design values of 2.5 s and 3.4 m/s², how far does it travel before it stops?

1. Speed: 60 mph = 88 ft/s = 26.82 m/s.
2. Reaction distance: 88 × 2.5 = 220.0 ft.
3. Braking distance: 26.82² / (2 × 3.4) = 105.8 m = 347.1 ft.
4. Total stopping distance: 220.0 + 347.1 = 567.1 ft, or 172.9 m.
5. Time to stop: 2.5 + 26.82 / 3.4 = 10.39 s.

On a 5 % downgrade the braking distance grows to 405.6 ft. The AASHTO table, which rounds the deceleration to 11.2 ft/s², gives a design stopping sight distance of 570 ft at this speed.

## FAQ

**How do I calculate stopping distance?**
Add the reaction distance, speed × reaction time, to the braking distance, speed² / (2 × deceleration). Use consistent units, such as ft/s and ft/s².

**What is the stopping distance at 60 mph?**
About 567 ft with the AASHTO design values. A driver braking hard on dry asphalt with locked wheels needs 220 ft to react and 160 ft to brake.

**What reaction time should I use?**
AASHTO designs roads for 2.5 s, which covers nearly all drivers in a surprise situation. An alert driver who expects to brake reacts faster.

**How much does speed affect stopping distance?**
The braking distance grows with the square of speed. Going from 60 to 70 mph adds 36 % to the braking distance.

**How much longer is stopping on a wet road?**
With Wong's sliding values, braking on wet asphalt (0.45) takes 1.67 times as far as on dry asphalt (0.75).

**Does a downhill slope increase stopping distance?**
Yes. Gravity works against the brakes, so a 5 % downgrade cuts the effective deceleration by 0.49 m/s².

## Related calculators

- [Tire size calculator](../tire-size/index.html) — tire dimensions and speedometer error.
- [Gear ratio and vehicle speed](../gear-speed/index.html) — road speed from rpm.
- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — acceleration performance.
- [Slope calculator](../slope/index.html) — grade as a percentage, an angle or a ratio.
