# Rocket equation calculator (delta-v)

**Summary:** Tsiolkovsky rocket equation: delta-v from Isp or exhaust velocity and the mass ratio, the propellant for a delta-v, and staging for up to three stages.

## Introduction

The rocket equation gives the change in speed, delta-v, a rocket can reach by burning its propellant. Multiply the exhaust velocity by the natural logarithm of the mass ratio, the fuelled mass divided by the empty mass. An engine with a specific impulse of 300 s has an exhaust velocity of 2 942 m/s. A rocket that burns 60 % of its mass with it gains 2 696 m/s.

This calculator gives the delta-v from the specific impulse or exhaust velocity and the two masses. It also finds the propellant needed for a delta-v, and adds up the delta-v of a rocket with up to three stages. It is for students, model-rocket fliers, game players and anyone checking a mission budget.

## Formulas

Rocket equation and its inverse:

    Δv = v_e × ln(m0 / mf)
    v_e = Isp × g0
    m_p = mf × (e^(Δv / v_e) − 1)

Staging:

    Δv_total = Σ v_e,i × ln(m0,i / mf,i)

- m0 — initial (fuelled) mass; mf — final mass, dry structure plus payload
- m_p — propellant mass, m0 − mf
- Isp — specific impulse in seconds; g0 = 9.806 65 m/s²
- m0,i — mass at ignition of stage i, including all stages above it and the payload

## Assumptions and limitations

- The equation is ideal. Gravity, air drag and steering cost extra delta-v during a launch, so reaching low Earth orbit takes well over the 7.8 km/s orbital speed.
- Specific impulse always converts with standard gravity, 9.806 65 m/s², even for a rocket flying from the Moon or Mars.
- Isp is taken as constant. For a first stage, use a value between the sea-level and vacuum figures.
- Each stage drops its dry mass at burnout. Interstages and fairings belong to the dry mass of the part they leave with.

## Worked example

A small rocket has a lift-off mass of 1 000 kg. Its engine has a specific impulse of 300 s, and after the burn 400 kg remain. What delta-v does it achieve?

1. Exhaust velocity: 300 × 9.806 65 = 2 942.0 m/s.
2. Mass ratio: 1 000 / 400 = 2.5.
3. Delta-v: 2 942.0 × ln 2.5 = 2 942.0 × 0.9163 = 2 695.7 m/s.
4. Propellant burned: 1 000 − 400 = 600 kg, or 60 % of the lift-off mass.

To reach 3 000 m/s with the same 400 kg final mass, it would need 709.0 kg of propellant.

## FAQ

**What is the rocket equation?**
Δv = v_e × ln(m0 / mf). It links the speed a rocket can gain with its exhaust velocity and how much of its mass is propellant.

**How do I convert specific impulse to exhaust velocity?**
Multiply by standard gravity, 9.806 65 m/s². An Isp of 450 s is an exhaust velocity of 4 413 m/s.

**Why do rockets use stages?**
Dropping empty tanks and engines means the next stage does not carry dead weight. The two-stage rocket of the staging defaults reaches 7 645 m/s. One stage with the same propellant and structure and a 300 s engine reaches 6 065 m/s.

**How much delta-v does it take to reach orbit?**
Low Earth orbit is about 7.8 km/s of orbital speed, and gravity and drag add more on the way up. The calculator gives the ideal value only.

**What is the mass ratio?**
The fuelled mass divided by the empty mass. A mass ratio of 2.718, the number e, gives a delta-v equal to the exhaust velocity.

**Does the rocket equation include gravity?**
No. It assumes free space. Gravity and drag losses must be added to the mission budget separately.

## Related calculators

- [Thrust-to-weight ratio](../thrust-weight/index.html) — whether the rocket can lift off.
- [Speed of sound and Mach number](../mach-number/index.html) — Mach number during the ascent.
- [Drag and lift force](../drag-lift/index.html) — aerodynamic drag in the atmosphere.
- [True airspeed](../true-airspeed/index.html) — speed through the air at altitude.
