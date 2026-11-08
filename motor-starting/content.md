# Motor starting current and voltage dip calculator

**Summary:** Starting current and kVA by method (DOL, star-delta, autotransformer, soft starter, VFD), voltage dip on a generator or network, torque at reduced voltage.

## Introduction

An induction motor started direct-on-line draws six to eight times its rated current at a poor power factor until it gets up to speed. On a strong grid that is a brief flicker; on a ship or a site generator it can pull the voltage down far enough to drop contactors, trip drives and stall the motor itself, because torque falls with the square of the voltage. This calculator estimates the starting current and kVA for the common starting methods, the voltage dip with a simple and conservative voltage-divider model, the torque left at the reduced voltage, and whether the dip and the torque are acceptable.

It is for marine and plant electrical engineers adding a large pump, compressor or thruster to a generator set, for anyone choosing between DOL, star-delta, soft starter and drive, and for students of electrical machines.

## Formulas

    I_n = P / (√3 V η cos φ),   S_start = √3 V I_n × m
    m: DOL = LRC,  star-delta = LRC/3,  autotransformer = LRC a²,  soft starter = current limit,  drive ≈ 1.0–1.5
    generator:  dip = X s / (1 + X s),   s = S_start / S_gen,   X = X'd (conservative) or X''d
    network:    dip = S_start / (S_sc + S_start)
    T_start / T_n = LRT × (1, 1/3, a², (limit/LRC)²) × (1 − dip)²      (drive: ≈ current multiple)

Dip limits: ISO 8528-5 G1 −25 %, G2 −20 %, G3 −15 % (standard load steps); IACS UR E5 a.c. transient ±20 % with recovery in 1.5 s.

## Assumptions and limitations

- Magnitudes only (locked-rotor power factor 0.2–0.4 ignored) and no pre-existing load: conservative by a few per cent.
- No AVR or governor dynamics; the generator maker's motor-starting curve is the final check.
- Torque at reduced voltage scales with V²; the acceleration time is not computed.

## Worked example

A 200 kW, 440 V seawater pump motor (η 0.94, cos φ 0.85, locked-rotor current 7 × I_n, locked-rotor torque 2 × T_n) started on a 1 500 kVA generator with X'd 0.25, dip limit 15 %, pump breakaway torque 30 %.

1. I_n = 328 A; DOL start 2 299 A = 1 752 kVA, 1.17 times the generator rating.
2. Dip = 0.25 × 1.168/(1 + 0.25 × 1.168) = 22.6 %: exceeds 15 %.
3. Star-delta: 584 kVA, dip 8.9 %; torque 2/3 × 0.911² = 0.55 × rated, well above the pump's 0.33 with margin.
4. A soft starter at 3.5 × I_n gives a 12.7 % dip but only 0.38 × rated torque; a drive at 1.2 × I_n dips 4.7 % with 1.2 × rated torque.

On a 20 MVA shore network the same DOL start dips only 8 %.

## FAQ

**Why X'd and not X''d?**
The subtransient reactance sets the very first dip; the transient reactance governs the following cycles before the regulator responds and gives the larger, conservative figure. Enter either.

**Why does the motor's power factor not matter?**
At locked rotor the current is mostly reactive like the generator's reactance, so adding magnitudes is close to the phasor sum and slightly conservative.

**What limits apply on ships?**
IACS UR E5 requires consumers to tolerate ±20 % transient voltage for 1.5 s; generator sets are commonly specified to a 15 % dip for the largest motor start (ISO 8528-5 class G3).

**Can star-delta start any load?**
Only light starting loads: torque drops to a third, so fans and centrifugal pumps on a closed valve start well, loaded compressors and conveyors do not.

**Is a soft starter better than star-delta?**
It gives a smooth start without the changeover peak, but torque still falls with the square of the current limit; a drive is the only method that gives full torque at low current.

**What about the generator engine?**
The step load is mostly reactive, but losses and the load torque add real power; check the engine's load-acceptance class as well.

## Related calculators

- [Three-phase power and current](../three-phase-power/index.html) — running current and power.
- [Generator load, kVA and fuel](../generator-load/index.html) — the generator's capacity.
- [Transformer sizing](../transformer-sizing/index.html) — transformer-fed starts.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable's share of the dip.
- [Short-circuit current (IEC 60909)](../short-circuit-current/index.html) — the network short-circuit power.
