# Belt and pulley calculator (ratio, rpm, belt length)

**Summary:** Pulley ratio, driven rpm, belt speed, exact open or crossed belt length and wrap angle from the two pulley diameters and the centre distance.

## Introduction

A belt drive changes speed in the ratio of its pulley diameters. A 100 mm pulley on a 1 450 rpm motor driving a 250 mm pulley turns it at 1 450 × 100 / 250 = 580 rpm, a ratio of 2.5. The torque rises by nearly the same ratio, less the small belt losses.

This calculator gives the speed ratio, the driven speed with optional slip, the belt speed, and the exact length of an open or crossed belt from the pulley diameters and the centre distance. It also gives the wrap angle on each pulley and the free span. It is for anyone designing or replacing a belt drive on a fan, pump, machine tool or workshop machine.

## Formulas

Speeds:

    i = d₂ / d₁,    n₂ = n₁ d₁ / d₂ × (1 − s),    v = π d₁ n₁

Open belt, with D the larger and d the smaller diameter:

    φ = asin((D − d) / (2C))
    θ_d = π − 2φ,    θ_D = π + 2φ
    L = √(4C² − (D − d)²) + ½ (D θ_D + d θ_d)

Crossed belt:

    θ = π + 2 asin((D + d) / (2C))
    L = √(4C² − (D + d)²) + ½ (D + d) θ

- d₁, n₁ — driver diameter and speed; d₂, n₂ — driven diameter and speed
- C — centre distance; s — slip; v — belt speed
- θ — wrap angle in radians; L — belt length on the pitch line

## Assumptions and limitations

- Use the diameter on which the belt actually runs. For V-belts and timing belts this is the pitch diameter, for flat belts the outside diameter plus the belt thickness.
- The length is exact for straight spans and circular arcs. It ignores sag, stretch and the take-up allowance needed to fit the belt.
- Friction belts creep slightly, typically 1 to 2 %. Enter that as slip if the exact driven speed matters. Timing belts and chains do not slip.
- A wrap angle below about 120° on the small pulley lets a friction belt slip. The calculator warns below that value.

## Worked example

A motor at 1 450 rpm drives a fan with a 100 mm pulley on the motor and a 250 mm pulley on the fan. The centre distance is 600 mm. Find the fan speed and the belt length.

1. Ratio: 250 / 100 = 2.500.
2. Fan speed: 1 450 / 2.5 = 580 rpm.
3. Belt speed: π × 0.100 × 1 450 / 60 = 7.59 m/s.
4. Angle φ = asin(150 / 1 200) = 0.1253 rad, so the motor pulley has a wrap of π − 0.2507 = 2.891 rad, or 165.6 degrees.
5. Length: √(4 × 600² − 150²) + ½ (250 × 3.392 + 100 × 2.891) = 1 190.6 + 568.6 = 1 759 mm.

A crossed belt on the same pulleys would be 1 801 mm long and turn the fan the other way.

## FAQ

**How do I calculate pulley rpm?**
Multiply the driver speed by the driver diameter and divide by the driven diameter. A 1 750 rpm motor with a 3 in pulley driving a 6 in pulley gives 875 rpm.

**How do I work out the belt length?**
Use the exact formula above, or measure around both pulleys with a tape on the belt's running line. For V-belts, use the pitch length the belt maker lists.

**Does a bigger pulley make the driven shaft faster?**
A bigger pulley on the driver does. A bigger pulley on the driven shaft makes it slower and increases its torque.

**What is the minimum wrap angle?**
About 120° on the small pulley for flat and V-belts. Below that, increase the centre distance, reduce the ratio, or add an idler.

**What is the difference between an open and a crossed belt?**
An open belt turns both pulleys the same way. A crossed belt reverses the driven pulley and wraps more of each pulley, but it rubs where it crosses.

**How fast does the belt run?**
v = π d n. The example belt runs at 7.59 m/s, about 1 500 ft/min.

## Related calculators

- [V-belt length and centre distance](../v-belt-length/index.html) — pitch length and the centre distance for a standard belt.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — the same ratio with gears.
- [Chain and sprocket drive](../chain-sprocket/index.html) — roller chain length and speed.
- [Torque, power and speed](../torque-power-rpm/index.html) — torque on each shaft.
