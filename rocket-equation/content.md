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

## Common mistakes

- **Taking the propellant mass as the final mass.** The final mass is what is left after the burn: structure, engines and payload. A 1 000 kg rocket burning 600 kg at 300 s gains 2 695.7 m/s; entering 600 kg as the final mass gives 1 502.8 m/s.
- **Converting Isp with the local gravity.** Specific impulse always converts with standard gravity, 9.806 65 m/s², even on Mars. Using 3.71 m/s² turns a 300 s engine into a 1 113 m/s exhaust and cuts the delta-v at a mass ratio of 2.5 from 2 695.7 to 1 019.8 m/s.
- **Leaving the upper stages out of a lower stage's mass.** Each stage pushes everything above it. In the staging defaults, stage 1 gives 3 567.7 m/s with the upper stage and payload on top. Taken alone, its 22 000 kg falling to 2 000 kg would claim 6 584.3 m/s.
- **Using the vacuum Isp for a stage that fires at sea level.** Air pressure at the nozzle exit lowers the Isp near the ground. For 3 000 m/s, a 300 s engine needs 63.9 % of the lift-off mass as propellant against 59.3 % at 340 s, so the vacuum figure undersizes the tanks.
- **Comparing the ideal delta-v with orbital speed.** The equation leaves out gravity, drag and steering losses. A rocket whose ideal delta-v only equals the orbital speed will not reach orbit; add the losses to the budget.

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
