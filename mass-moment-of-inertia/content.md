# Mass moment of inertia calculator

**Summary:** Mass moment of inertia of cylinders, discs, tubes, spheres, rods and blocks, with radius of gyration, parallel-axis shift and flywheel energy.

## Introduction

The mass moment of inertia measures how hard it is to change a body's rotation, just as mass measures how hard it is to change its speed in a straight line. It depends on where the mass sits: a rim with the mass on the outside has twice the inertia of a solid disc of the same mass and diameter. It sets the torque needed to accelerate a rotor, the energy a flywheel stores and the natural frequency of a shaft system.

This calculator gives the moment of inertia of the common homogeneous solids about their usual axes, from a known mass or from the dimensions and density. It also gives the radius of gyration, the inertia about a parallel axis, and the kinetic energy at a given speed. It is for engineers sizing motors, flywheels, pulleys and couplings, and for students of dynamics.

## Formulas

Moments of inertia of homogeneous solids of mass m:

    solid cylinder or disc, about its axis:      I = m r² / 2
    solid cylinder, transverse axis at centre:  I = m (3 r² + L²) / 12
    hollow cylinder, about its axis:            I = m (r_o² + r_i²) / 2
    solid sphere:                               I = 2/5 m r²
    thin spherical shell:                       I = 2/3 m r²
    slender rod, about centre / end:            I = m L² / 12,  m L² / 3
    rectangular block, normal to face a × b:    I = m (a² + b²) / 12

Parallel axis, radius of gyration and kinetic energy:

    I_O = I_G + m d²,   k = √(I / m),   E = ½ I ω²,   ω = 2π n / 60

- r — radius; L — length; d — distance between the parallel axes
- n — speed in rpm; ω — angular speed in rad/s

## Assumptions and limitations

- The density is uniform, so the mass centre is at the geometric centre. For assemblies, add the inertia of each part about the same axis using the parallel-axis theorem.
- The slender-rod formulas ignore the rod's thickness. A thick rod is a cylinder about a transverse axis.
- The parallel-axis theorem applies only from the axis through the centre of mass. Shifting from one off-centre axis to another needs two steps.
- For gears and pulleys, the hubs, spokes and holes change the inertia. Treat them as separate rings and discs, subtracting the holes.

## Worked example

A steel flywheel is a solid disc 300 mm across and 50 mm thick. What is its moment of inertia, and how much energy does it store at 1 500 rpm?

1. Volume: π × 0.15² × 0.05 = 0.003534 m³; mass: 7 850 × 0.003534 = 27.74 kg.
2. Moment of inertia: 27.74 × 0.15² / 2 = 0.3121 kg·m².
3. Angular speed: 2π × 1 500 / 60 = 157.1 rad/s.
4. Energy: ½ × 0.3121 × 157.1² = 3 851 J, or 3.851 kJ.

A rim of the same mass and outside diameter would store almost twice as much.

## FAQ

**What is the moment of inertia of a disc?**
m r² / 2 about its axis. A 10 kg disc 0.4 m across has I = 10 × 0.2² / 2 = 0.2 kg·m².

**What is the difference between mass and area moment of inertia?**
The mass moment of inertia, in kg·m², resists angular acceleration. The area moment of inertia, in m⁴, is a property of a cross-section that resists bending.

**How do I find the inertia of a motor and load?**
Add the rotor inertia from the motor data sheet to the load's inertia. A load behind a gearbox counts as its inertia divided by the gear ratio squared.

**What is the radius of gyration?**
The radius at which all the mass could be concentrated to give the same inertia: k = √(I / m). For a solid disc it is r / √2.

**Why does a ring have more inertia than a disc?**
Inertia grows with the square of distance from the axis. A ring keeps all its mass at the outside radius.

**What is WR² or GD²?**
Older names for inertia in non-SI units. WR² is weight × radius of gyration², in lb·ft², and GD² equals 4 × I in kg·m².

## Related calculators

- [Moment of inertia (section properties)](../moment-of-inertia/index.html) — area moment of inertia of beam sections.
- [Shaft torque](../shaft-torque/index.html) — the torque to drive the rotor.
- [Torque, power and rpm](../torque-power-rpm/index.html) — power at speed.
- [Gear ratio](../gear-ratio/index.html) — reflecting inertia through a gearbox.
