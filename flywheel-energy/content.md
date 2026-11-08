# Flywheel energy calculator (inertia and speed fluctuation)

**Summary:** Flywheel kinetic energy, energy released between two speeds, coefficient of speed fluctuation, and the inertia, disc or rim mass for an energy swing.

## Introduction

A flywheel stores energy as rotation, E = ½ I ω², and evens out machines whose torque comes in pulses: presses, punches, piston engines and compressors. It gives up energy when it slows and takes it back when it speeds up. A 50 kg·m² flywheel that slows from 315 to 285 rpm releases about 4.9 kJ.

This calculator works both ways. It gives the energy a flywheel stores and releases between two speeds, with the coefficient of speed fluctuation. Or, from the energy swing a machine needs and the speed fluctuation it can accept, it gives the moment of inertia, the mass of a solid disc or rim of chosen radius, the disc thickness, the rim speed and the centrifugal stress. It is for machine designers and students following Shigley chapter 16.

## Formulas

    E = ½ I ω²
    ΔE = E₂ − E₁ = ½ I (ω₂² − ω₁²)
    C_s = (ω₂ − ω₁) / ω,    ω = (ω₁ + ω₂) / 2
    ΔE = C_s I ω²    so    I = ΔE / (C_s ω²)

Mass for a radius r, and stress at the mean speed (v = ω r):

    solid disc:  m = 2 I / r²,   t = m / (ρ π r²),   σ_centre = (3 + ν)/8 · ρ v²
    thin rim:    m = I / r²,     σ_hoop = ρ v²

- I — moment of inertia; ω₁, ω₂ — lowest and highest speed in the cycle; ω — mean speed
- ΔE — energy swing, the largest change of energy over a cycle from the torque–angle diagram
- C_s — coefficient of speed fluctuation; ρ — density; ν = 0.3; t — disc thickness

## Assumptions and limitations

- The flywheel is rigid and turns about a fixed axis. The energy swing is an input; it comes from integrating the torque–angle diagram of the machine.
- The mass ignores the hub, arms and shaft. For a rim this errs on the safe side, because the arms add inertia.
- The stresses are elastic centrifugal stresses at the mean speed. Keyways, bolt holes and the overspeed case add to them and must be checked separately.
- The disc is of uniform thickness. Webbed or tapered flywheels need their own inertia, which the mass moment of inertia calculator can give.

## Worked example

A punch press needs 2 500 J from its flywheel during each stroke. The flywheel turns at a mean 300 rpm, and the speed may vary by 5 %, so C_s = 0.05. Size a solid steel disc of 400 mm radius.

1. Mean speed: ω = 300 × 2π / 60 = 31.42 rad/s.
2. Inertia: I = 2 500 / (0.05 × 31.42²) = 50.66 kg·m².
3. Mass of the disc: m = 2 × 50.66 / 0.4² = 633 kg.
4. Thickness: 633 / (7 850 × π × 0.4²) = 0.1605 m, or 160.5 mm.
5. Speeds: 300 × (1 ∓ 0.025) gives 292.5 rpm and 307.5 rpm.
6. Rim speed: 31.42 × 0.4 = 12.57 m/s; centre stress 0.4125 × 7 850 × 12.57² = 0.51 MPa, far below the strength of steel.

A rim of the same radius would need only half the mass, 317 kg, because all its mass sits at the outside.

## FAQ

**How much energy does a flywheel store?**
E = ½ I ω². A 50 kg·m² flywheel at 300 rpm stores 24.7 kJ, but only the difference between its highest and lowest speed is usable in each cycle.

**What is the coefficient of speed fluctuation?**
The speed range over a cycle divided by the mean speed. A smaller C_s means smoother running and a heavier flywheel.

**Why is a rim better than a solid disc?**
Inertia grows with the square of the radius. A rim puts its mass at the outside, so it gives the same inertia for half the mass of a disc.

**How do I find the energy swing?**
Plot the torque the machine needs against crank angle, subtract the mean torque, and integrate. The largest area between two crossings is the energy swing.

**What limits the size of a flywheel?**
The centrifugal stress, which grows with the square of the rim speed. Cast iron flywheels are limited to lower rim speeds than steel ones.

**Does a bigger flywheel need a bigger motor?**
No. The motor supplies the mean power; the flywheel only evens out the peaks. A larger flywheel takes longer to reach speed at start-up.

## Related calculators

- [Mass moment of inertia](../mass-moment-of-inertia/index.html) — inertia of other shapes.
- [Torque, power and speed](../torque-power-rpm/index.html) — motor torque and power.
- [Shaft critical speed](../shaft-critical-speed/index.html) — whirling of the flywheel shaft.
- [Shaft torsion](../shaft-torsion/index.html) — torque the shaft must carry.
