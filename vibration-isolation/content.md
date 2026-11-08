# Vibration isolation and severity calculator

**Summary:** Isolator natural frequency and transmissibility of a machine on resilient mounts, and the ISO 10816-3 evaluation zone of a measured vibration velocity.

## Introduction

Pumps, compressors and generating sets are often set on resilient mounts so that their vibration does not travel into the ship's structure. Mounts only isolate when the machine's natural frequency on them is well below the disturbing frequency; near resonance they make things worse. This calculator finds the natural frequency and static deflection on the mounts, the force transmissibility at the running frequency and the isolation it gives. It also places a measured vibration velocity in the evaluation zones of ISO 10816-3, the standard used to judge the condition of industrial machines.

It is for marine and mechanical engineers selecting mounts, condition-monitoring staff judging vibration readings, and superintendents checking a new installation.

## Formulas

    Natural frequency:   f_n = (1/2π) √(k/m) = (1/2π) √(g/δ_st)
    Frequency ratio:     r = f / f_n,   f = order × rpm / 60
    Transmissibility:    T = √((1 + (2ζr)²) / ((1 − r²)² + (2ζr)²))
    Isolation:           1 − T,   20 log10(1/T) dB

- k — total mount stiffness; m — mass on the mounts; ζ — damping ratio; δ_st — static deflection.

## Assumptions and limitations

- One degree of freedom: the machine is rigid and the mounts act together in one direction.
- Rocking modes, foundation flexibility and the frequency dependence of rubber stiffness are not included.
- ISO 10816-3 zones for machines above 15 kW, broadband velocity r.m.s. on the bearing housings; ISO 20816-3 keeps the same boundaries.
- The machine maker's vibration limits take precedence over the general zones.

## Worked example

A 2000 kg generating set runs at 1500 r/min on four mounts of 1500 N/mm each, with damping ratio 0.05.

1. Total stiffness 6000 N/mm: f_n = (1/2π) √(6 × 10⁶ / 2000) = 8.72 Hz, a static deflection of 3.27 mm.
2. The running frequency is 25 Hz, so r = 25 / 8.72 = 2.87.
3. T = √((1 + 0.287²) / ((1 − 2.87²)² + 0.287²)) = 0.144: the mounts pass 14 % of the force, 86 % isolation.
4. A measured 3.0 mm/s on this medium-sized machine on flexible mounts is in zone B, acceptable for long-term operation.

## FAQ

**Why must the natural frequency be low?**
Isolation starts only above r = √2. Below that the mounts amplify the force, and at r = 1 the machine resonates on them.

**What does damping do?**
It limits the amplitude when the machine passes through resonance on starting and stopping, but it slightly reduces the isolation at the running speed.

**What is the static deflection good for?**
It is the quickest field check: a mount that sinks 3 mm under the machine gives a natural frequency of about 9 Hz, whatever its stiffness rating says.

**What do the zones mean?**
Zone A is typical of newly commissioned machines, B is acceptable for unrestricted long-term operation, C is not satisfactory for long-term operation, and D is severe enough to cause damage.

**Why does the support type change the zone limits?**
Machines on flexible supports move more for the same condition, so their limits are higher. The standard calls the support rigid only if the lowest natural frequency is at least 25 % above the main excitation.

## Related calculators

- [Helical compression spring](../helical-spring/index.html) — stiffness of steel spring mounts.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — the machine's running data.
- [Engine-room ventilation (ISO 8861)](../engine-room-ventilation/index.html) — another engine-room design check.
- [Rolling bearing L10 life (ISO 281)](../bearing-life/index.html) — the bearings that vibration wears.
