# Gear ratio calculator

**Summary:** Gear ratio from tooth counts for one or two stages, with output speed, torque and power after the losses of each stage.

## Introduction

A gear train trades speed for torque. A small gear driving a large one turns the output more slowly but with more force, which is how a fast electric motor drives a slow conveyor, winch or mixer. The ratio comes straight from the tooth counts, and the power passes through, less a little loss in each mesh.

This calculator finds the ratio of a one- or two-stage gear train from its tooth counts, or takes a known overall ratio. From the input speed and torque it gives the output speed, the output torque after the losses of each stage, the power in and out, and the heat the gearbox must shed. It is for mechanical and maintenance engineers, designers choosing a gearbox, and students of machine design.

## Formulas

Ratio, as input speed over output speed:

    one stage:   i = z₂ / z₁
    two stages:  i = (z₂ / z₁) × (z₄ / z₃)

Output speed, torque and power, with efficiency η per stage and k stages:

    n_out = n_in / i
    T_out = T_in × i × ηᵏ
    P_out = P_in × ηᵏ,   P_in = 2π n_in T_in / 60

- z₁, z₃ — teeth on the driving gears; z₂, z₄ — teeth on the driven gears
- n — speed, rpm; T — torque, N·m
- η — efficiency per stage (spur or helical 0.97 to 0.99, worm 0.5 to 0.9)

## Assumptions and limitations

- Gears do not slip, so the speed ratio is exactly the tooth ratio. Belt drives slip by 1 to 2 %.
- Each stage loses the same fraction of the power through it. A real gearbox also has churning and seal losses that do not scale with load, so it is less efficient at light load.
- Idler gears are left out: they change the direction of rotation, not the ratio.
- The torque is the steady running value. Gearboxes are chosen with a service factor for starting, shock and duty, often 1.25 to 2.

## Worked example

An electric motor at 1450 rpm and 20 N·m drives a 12-tooth pinion meshing with a 48-tooth gear. The stage is 98 % efficient. What comes out?

1. Ratio: i = 48 / 12 = 4.00.
2. Output speed: 1450 / 4 = 362.5 rpm.
3. Output torque: 20 × 4 × 0.98 = 78.4 N·m.
4. Input power: 2π × 1450 × 20 / 60 = 3.04 kW, of which 2 % or 61 W becomes heat in the mesh.

A 12-tooth pinion is below the 17 teeth needed to avoid undercut with a standard 20° tooth form, so this one would be made with a shifted profile.

## FAQ

**How do I calculate a gear ratio?**
Divide the number of teeth on the driven gear by the number on the driving gear. For several stages, multiply the stage ratios together.

**Does a bigger output gear give more torque?**
Yes. Torque rises by the ratio, less the losses, and speed falls by the same ratio. Power stays the same apart from the losses.

**What does an idler gear do?**
It reverses the direction of rotation and bridges a gap between shafts, but it does not change the overall ratio.

**How efficient are gears?**
A spur or helical mesh loses about 1 to 3 %, a bevel mesh 2 to 5 %. Worm gears can lose half their input power at high ratios, which is why they run hot.

**Why use two stages instead of one?**
One stage much beyond 6:1 to 8:1 needs a very large wheel. Two smaller stages make a more compact, lighter gearbox.

**What is the minimum number of teeth on a pinion?**
About 17 for a standard 20° pressure-angle tooth form. Fewer teeth undercut the tooth root unless the profile is shifted.

## Related calculators

- [Torque, power and speed](../torque-power-rpm/index.html) — torque and power on either shaft.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — sizing the output shaft for the higher torque.
- [Rolling bearing L10 life (ISO 281)](../bearing-life/index.html) — the bearings carrying the gear loads.
- [Three-phase power and motor current](../three-phase-power/index.html) — the motor driving the gearbox.
