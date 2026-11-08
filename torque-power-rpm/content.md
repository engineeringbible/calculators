# Torque, power and speed calculator

**Summary:** Shaft power from torque and rpm, torque from power and rpm, or speed from power and torque, in kW, hp, N·m and lbf·ft.

## Introduction

Every rotating machine trades torque against speed. A motor's nameplate gives its power and speed, but the coupling, shaft and gearbox are sized on torque. An engine's dynamometer measures torque at each speed, while the brochure quotes power. One relation converts between them: power equals torque times angular velocity.

This calculator solves that relation for whichever quantity is missing. Enter power and speed to get the torque a shaft must carry, torque and speed to get the power, or power and torque to get the speed. Results come in kilowatts and horsepower, newton-metres and pound-force feet, and rpm and radians per second. It is for mechanical, marine and automotive engineers, technicians and students.

## Formulas

Power, torque and angular velocity:

    P = T × ω,   ω = 2π × n / 60

Solved for each quantity:

    T = 60 P / (2π n)
    P = 2π n T / 60
    n = 60 P / (2π T)

In imperial units, with T in lbf·ft and n in rpm:

    hp = T × n / 5252

- P — power, W (1 kW = 1.341 hp)
- T — torque, N·m (1 N·m = 0.7376 lbf·ft)
- n — speed, rpm; ω — angular velocity, rad/s

## Assumptions and limitations

- Power, torque and speed belong to the same shaft at the same moment. A gearbox changes torque and speed but, apart from its losses, not power.
- For a piston engine the torque pulsates with every firing; the formula gives the mean torque, and the peak can be several times higher.
- Horsepower here is mechanical horsepower, 745.7 W. Metric horsepower (PS or CV) is 735.5 W and appears in the unit list.
- A motor's rated torque is its continuous torque at rated speed. Starting and breakdown torque are higher and come from the data sheet.

## Worked example

A 15 kW, 4-pole electric motor runs at 1460 rpm. What torque does its shaft and coupling carry at full load?

1. Angular velocity: ω = 2π × 1460 / 60 = 152.9 rad/s.
2. Torque: T = P / ω = 15 000 / 152.9 = 98.1 N·m.
3. In imperial units, that is 72.4 lbf·ft.

A coupling chosen for this motor should have a rated torque above 98.1 N·m times the service factor for the driven machine, typically 1.5 to 2 for a pump or fan.

## FAQ

**How do I convert kW to N·m?**
Torque in N·m = 9549 × power in kW / speed in rpm. 9549 is 60 000 / 2π.

**Why is torque in lbf·ft equal to horsepower at 5252 rpm?**
Because 5252 is 33 000 / 2π, which comes from the definition of horsepower as 33 000 ft·lbf per minute. On a dynamometer chart the torque and power curves always cross there.

**Does a gearbox change the power?**
Not apart from its losses. It multiplies torque by the gear ratio and divides speed by it, so their product, the power, stays the same less 1 to 3 % per stage.

**What torque does a diesel engine produce?**
Large, slow engines produce enormous torque. A 10 MW ship engine at 80 rpm turns about 1.2 MN·m, which is why propeller shafts are so thick.

**Can I use this for a motor's starting torque?**
Not directly. Starting torque comes from the motor data sheet, typically 1.5 to 2.5 times rated torque for an induction motor.

**What are radians per second?**
The SI unit of angular velocity. One revolution is 2π radians, so 1 rpm is 0.1047 rad/s.

## Related calculators

- [Shaft torque, power and diameter](../shaft-torque/index.html) — the shaft diameter for this torque.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — speed and torque through a gearbox.
- [Three-phase power and motor current](../three-phase-power/index.html) — the electrical side of the motor.
- [Engine BMEP, torque and power](../engine-bmep/index.html) — torque from an engine's cylinder pressure.
