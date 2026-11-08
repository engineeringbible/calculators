# Water hammer (Joukowsky) calculator

**Summary:** Pressure surge from valve closure or pump trip: Korteweg wave speed with pipe elasticity, Joukowsky and Michaud surges, critical time, line pressure check.

## Introduction

Stop a column of moving liquid suddenly and its momentum turns into pressure: a wave of Δp = ρ a Δv runs back along the pipe at the speed of sound in the pipe-and-liquid system, which for water in steel is about 1 250 m/s. Two metres per second stopped instantly is 25 bar, enough to burst a PN16 line. Whether the closure counts as "instant" depends on how long the wave takes to travel to the reservoir and back, 2L/a, and slower closures produce proportionally smaller surges. This calculator gives the wave speed for the pipe material and restraint, the critical time, the Joukowsky and Michaud surges, the pressure envelope against the rating and the closure time that would keep the surge harmless.

It is for marine and plant engineers checking ballast, cooling, cargo and fuel lines after a valve or pump change, for anyone specifying valve actuator speeds, and for students of fluid transients.

## Formulas

    a₀ = √(K/ρ),   a = a₀ / √(1 + (K/E)(D/e) c₁)          Korteweg (thin wall)
    t_crit = 2L/a,   period = 4L/a
    rapid (t_c ≤ t_crit):   Δp = ρ a Δv                      Joukowsky
    slow  (t_c > t_crit):   Δp = 2 ρ L Δv / t_c              Michaud (≤ Joukowsky)
    p_max = p_steady + Δp,   p_min = p_steady − Δp   (vapour pressure → column separation)

c₁: 1.0 with expansion joints, 0.85 anchored upstream, 0.91 anchored throughout. K: water 2.19 GPa, sea water 2.34, oils 1.5–1.7. E: steel 207 GPa, ductile iron 170, copper 117, GRP 20, PVC 3, HDPE 0.9.

## Assumptions and limitations

- Single straight pipe from a constant-head reservoir to the valve; no friction, branches, surge vessels or pump inertia.
- Thin-wall elasticity (D/e > 25); no entrained air (1 % of free air can halve the wave speed).
- Michaud is a conservative first estimate; design needs a method-of-characteristics transient analysis.
- Column separation and cavity collapse are flagged, not computed.

## Worked example

A 300 mm steel line with 8 mm wall, 200 m from the sea chest to a valve, fresh water at 2 m/s and 5 bar, valve closing in 1 s, PN16.

1. a₀ = 1 481 m/s; a = 1 481/√(1 + (2.19/207) × 37.5) = 1 254 m/s.
2. Critical time 2 × 200/1 254 = 0.32 s: the 1 s closure is slow.
3. Joukowsky (if instantaneous) 998 × 1 254 × 2 = 25.0 bar; Michaud for 1 s: 2 × 998 × 200 × 2/1 = 8.0 bar.
4. Maximum pressure 13.0 bar, 81 % of PN16 — but the reflected wave then pulls the valve end down to 5 − 8 = −3 bar gauge, below vacuum: the column separates and its collapse can exceed the first surge. A 1 s closure is not acceptable here; closing in 0.2 s would be worse still (full 25 bar, 30 bar in the line).
5. To keep the surge at a tenth of the rating (1.6 bar) the valve must take at least 5 s; the line then swings between 3.4 and 6.6 bar.

An HDPE line of the same bore (SDR 11, 27 mm wall) has a wave speed of about 280 m/s and an instantaneous surge of 5.6 bar: flexible pipe is its own surge protection.

## FAQ

**Why does a short pipe give a smaller surge for the same valve?**
The critical time scales with length; a short pipe reflects the wave back before the valve has fully closed, so the pressure never builds to the Joukowsky value.

**What is c₁?**
The restraint factor accounts for how axial stress in the pipe wall adds to or relieves the hoop strain; it changes the wave speed by a few per cent.

**Why is column separation dangerous?**
When the pressure drops to the vapour pressure a cavity forms; when it collapses the two columns meet and the resulting surge can exceed the first.

**Does pump trip behave like valve closure?**
Yes, with the steady velocity as Δv and the time for the flow to stop (check-valve closure or pump run-down) as t_c; pump inertia and the check valve type matter a lot.

**How accurate is Michaud?**
It is conservative for most valves closing uniformly; gate valves that cut most of the flow in the last part of travel can produce a higher surge than Michaud, which is why transient software is used for design.

**What surge protection exists?**
Slow-closing actuators, surge vessels (air chambers), air inlet valves, flywheels on pumps, bypass lines and flexible pipe.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the steady velocity and pressure.
- [Pump and fan affinity laws](../pump-affinity/index.html) — pump run-down speeds.
- [Pump NPSH](../pump-npsh/index.html) — suction-side pressure margins.
- [Pipe wall thickness (ASME B31.3)](../pipe-wall-thickness/index.html) — the pipe's pressure capacity.
- [Pressure vessel thickness](../pressure-vessel/index.html) — surge vessels.
