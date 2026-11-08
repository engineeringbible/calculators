# Propeller pitch and boat speed calculator

**Summary:** Boat speed from propeller pitch, engine rpm, gear ratio and slip; the pitch for a target speed; or the propeller slip from your GPS speed.

## Introduction

Propeller pitch is the distance a propeller would move forward in one turn if it screwed through the water like a bolt through a nut. Multiply the pitch by the propeller rpm and you have the theoretical speed. A 19 in propeller turning 2 750 rpm would advance 52 250 in per minute, which is 43.0 kn. The boat goes slower than that because the water gives way: the shortfall is the slip.

This calculator gives the boat speed from pitch, engine rpm, gear ratio and slip. It also works backwards: the pitch you need for a target speed, or the slip you are getting from a speed measured with GPS. It is for boat owners choosing a propeller for an outboard, stern drive or inboard. The [propeller slip calculator](../propeller-slip/index.html) does the same job for ships, with current and wake fraction.

## Formulas

Propeller rpm and theoretical speed:

    n_prop = n_engine / gear ratio
    V_theory = pitch × n_prop × 60 / 1 852       kn, pitch in m
    V_theory = pitch[in] × n_prop / 1 215.2      kn
    V_theory = pitch[in] × n_prop / 1 056        mph

Speed, pitch and slip:

    V = V_theory × (1 − slip)
    pitch = V / ((1 − slip) × n_prop)
    slip = 1 − V_measured / V_theory

- pitch — the nominal pitch, the second number on the propeller (14 × 19 means 19 in of pitch)
- gear ratio — engine turns per propeller turn, from the engine manual (2.0:1 halves the rpm)
- slip — apparent slip, as a fraction or percentage

## Assumptions and limitations

- Slip here is apparent slip. It lumps together the real slip of the blades, the wake of the hull, any current and the error in your speed reading.
- Measure speed with GPS on runs in both directions and average them, in calm water and with a typical load.
- A bigger pitch only gives more speed if the engine can still reach its rated rpm range at wide-open throttle. Too much pitch overloads the engine and pulls the rpm down.
- Cupped and progressive-pitch propellers act as if their pitch were larger than the stamped value, so they show less apparent slip.

## Worked example

An outboard turns 5 500 rpm at wide-open throttle through a 2.0:1 gearcase. It has a 19 in pitch propeller, and the slip is 12 %. What speed should the boat make?

1. Propeller rpm: 5 500 / 2.0 = 2 750 rpm.
2. Theoretical speed: 19 × 2 750 / 1 215.2 = 43.0 kn.
3. Boat speed: 43.0 × (1 − 0.12) = 37.8 kn.

If the GPS shows 37 kn instead, the slip is 1 − 37 / 43.0 = 13.9 %. To reach 40 kn at the same rpm and 12 % slip, the propeller would need 20.1 in of pitch.

## FAQ

**How do I calculate boat speed from propeller pitch?**
Multiply the pitch in inches by the propeller rpm and divide by 1 215.2 for knots, or by 1 056 for mph. Then take off the slip.

**What is propeller slip?**
The difference between the theoretical speed, pitch × rpm, and the speed the boat actually makes, as a percentage of the theoretical speed.

**How do I measure slip on my boat?**
Choose the slip mode and enter the pitch, the rpm at wide-open throttle, the gear ratio and the average GPS speed of runs both ways.

**Does more pitch mean more speed?**
Only while the engine still reaches its rated rpm. More pitch loads the engine harder, so the rpm drops; if it falls below the rated range, the boat may get slower and the engine is overloaded.

**Where do I find the gear ratio?**
In the engine's manual or specification sheet. Outboards and stern drives list the lower-unit ratio; inboards list the gearbox reduction.

**What does negative slip mean?**
The boat went faster than pitch × rpm allows. Usually the gear ratio, pitch or rpm entered is wrong, or a following current pushed the boat.

## Related calculators

- [Propeller slip and speed through water](../propeller-slip/index.html) — the ship version with current and wake fraction.
- [Planing boat speed calculator](../planing-speed/index.html) — the speed the engine power can give.
- [Hull speed calculator](../hull-speed/index.html) — the speed limit of displacement hulls.
- [Boat fuel consumption](../boat-fuel/index.html) — fuel use at that speed.
