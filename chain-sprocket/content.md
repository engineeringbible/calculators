# Chain and sprocket calculator (roller chain length)

**Summary:** Roller chain drive: ratio, output rpm, chain speed, chain length in pitches (even), actual centre distance and sprocket pitch diameters.

## Introduction

A roller chain drive changes speed in the ratio of the sprocket tooth counts. A 17-tooth sprocket at 900 rpm driving a 51-tooth sprocket turns it at 300 rpm. The chain must have a whole number of links, and an even number avoids a weak offset link. So the chain length is rounded up, and the centre distance moves slightly to suit.

This calculator gives the ratio, the output speed and the chain speed, the chain length in pitches for the centre distance you want, the even length to buy, and the actual centre distance with that chain. It also gives the pitch diameter of each sprocket and the chordal speed variation. It is for designers and maintenance staff laying out or replacing chain drives on conveyors, machines and motorcycles.

## Formulas

Sprocket pitch diameter and chain speed:

    D = p / sin(180° / N)
    V = N₁ p n₁

Chain length in pitches for a centre distance C (Shigley eq. 17-27):

    L/p = 2C/p + (N₁ + N₂)/2 + (N₂ − N₁)² / (4π² C/p)

Centre distance for a chain of L/p pitches (eq. 17-28):

    A = (N₁ + N₂)/2 − L/p
    C = (p/4) [−A + √(A² − 8 ((N₂ − N₁) / (2π))²)]

Chordal speed variation:

    ΔV/V = (π/N) [1/sin(180°/N) − 1/tan(180°/N)]

- p — chain pitch; N₁, N₂ — teeth on the driver and driven sprockets
- n₁ — driver speed; L — chain length; C — centre distance

## Assumptions and limitations

- ANSI chain numbers give the pitch in eighths of an inch: No. 40 is 1/2 in (12.7 mm), No. 60 is 3/4 in. ISO B-series chains of the same pitch use the same geometry.
- The chain length is rounded up to an even number of pitches, so no offset link is needed.
- The centre distance is nominal, with the chain just taut. Provide adjustment or a tensioner, because chains elongate as their joints wear.
- Power rating, lubrication and the number of strands are not checked. Use the chain maker's rating tables.

## Worked example

A No. 40 chain (12.7 mm pitch) drives from a 17-tooth sprocket at 900 rpm to a 51-tooth sprocket. The centres are to be about 500 mm.

1. Ratio: 51 / 17 = 3, so the output turns at 300 rpm.
2. Chain speed: 17 × 0.0127 × 900 / 60 = 3.24 m/s.
3. C/p = 500 / 12.7 = 39.37. L/p = 78.74 + 34 + 34² / (4π² × 39.37) = 78.74 + 34 + 0.74 = 113.48.
4. Round up to an even number: 114 pitches, 1 447.8 mm of chain.
5. Actual centres: A = 34 − 114 = −80, C = (12.7/4) × [80 + √(80² − 8 × 5.411²)] = 503.3 mm.
6. Pitch diameters: 12.7 / sin(10.59°) = 69.12 mm and 12.7 / sin(3.53°) = 206.30 mm.

Setting the sprocket centres at 503.3 mm fits the 114-link chain without an offset link.

## FAQ

**How do I calculate chain length?**
Use L/p = 2C/p + (N₁ + N₂)/2 + (N₂ − N₁)²/(4π² C/p), then round up to an even whole number of pitches.

**Why should a chain have an even number of links?**
An odd number needs an offset (cranked) link, which is weaker than a standard link. An even count joins with a standard connecting link.

**How many teeth should the small sprocket have?**
Seventeen or more is the usual rule for smooth running. With 17 teeth the chain speed varies by 1.7 % as each link seats; with 25 teeth by 0.8 %.

**What is the pitch diameter of a sprocket?**
The diameter of the circle through the centres of the chain rollers when the chain is seated. It is p / sin(180°/N).

**What does the chain number mean?**
In ANSI sizes, the first digits give the pitch in eighths of an inch. No. 50 is 5/8 in pitch, and a suffix such as -2 means a double-strand chain.

**How fast can a roller chain run?**
It depends on the pitch, the sprocket size and the lubrication. The chain maker's rating tables give the limits.

## Related calculators

- [Belt and pulley calculator](../belt-pulley/index.html) — speeds and length for a belt drive.
- [V-belt length and centre distance](../v-belt-length/index.html) — standard belt lengths.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — speed ratios with gears.
- [Torque, power and speed](../torque-power-rpm/index.html) — torque on each sprocket shaft.
