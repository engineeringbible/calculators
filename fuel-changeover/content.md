# Fuel changeover before an ECA calculator

**Summary:** Time and distance before an emission control area to start the changeover so that the fuel at the engines meets the sulphur limit, within the temperature rate.

## Introduction

A ship entering an emission control area must be burning fuel with no more than 0.10 % sulphur by the time it crosses the boundary. Switching the changeover valve does not change the fuel at the engines at once: the new fuel first runs through the line to the mixing tank, then gradually dilutes the fuel already circulating in the booster circuit. Hot heavy fuel and cool gas oil must also mix slowly enough to protect the fuel pumps from thermal shock. This calculator models the circuit as a stirred volume, finds the time for the fuel at the engines to reach the limit, blends the new fuel in more slowly when the temperature would change too fast, and gives the time and distance before the boundary at which to start.

It is for chief engineers writing or checking the changeover procedure MARPOL requires, superintendents planning ECA transits, and anyone explaining why a changeover takes hours rather than minutes.

## Formulas

    Volume flow:               Q = consumption / density
    Residence time:            τ = V_circuit / Q
    Line delay:                V_line / Q
    New fuel at the engines:   y = 1 − e^(−t/τ)   (switch at once)
    Sulphur and temperature:   S = S_old − (S_old − S_new) y,   T = T_old − (T_old − T_new) y
    Time to the limit:         delay + τ ln((S_old − S_new) / (S_limit − S_new))
    Largest temperature rate:  (T_old − T_new) / τ   (switch at once)

- With a linear blend over t_r, the new-fuel fraction follows the ramp response of the stirred volume and the largest rate is (T_old − T_new)(1 − e^(−t_r/τ)) / t_r.

## Assumptions and limitations

- The booster circuit is one well-mixed volume; the line to it is plug flow.
- The engines burn at a constant rate during the changeover.
- Sulphur and temperature mix linearly; the heater, cooler and heat losses are ignored.
- The rate limit of 2 °C/min and the 2–20 cSt viscosity window are MAN's guidance; follow your engine maker's procedure.
- The circuit volume must include the mixing tank, pipes, heaters, filters and the engine's fuel system.

## Worked example

A ship burns 2 t/h of 0.50 % fuel (900 kg/m³) from a 3 m³ booster circuit, with 0.2 m³ of line before the mixing tank, and changes to 0.05 % gas oil for a 0.10 % limit. The fuel is at 110 °C and the gas oil at 40 °C; the ship makes 14 kn.

1. Volume flow 2000 / 900 = 2.22 m³/h, residence time 3 / 2.22 = 1.35 h, line delay 0.09 h.
2. Switching at once would cool the fuel at 70 / 1.35 = 52 °C/h, i.e. 0.86 °C/min, within 2 °C/min, so no blending is needed.
3. Time to the limit: 0.09 + 1.35 × ln(0.45 / 0.05) = 0.09 + 2.97 = 3.06 h.
4. With 15 min of margin, start 3.31 h before the boundary, 46.3 nmi out at 14 kn.

## FAQ

**Why does the changeover take so long?**
The new fuel never replaces the old fuel in one go. It mixes into the circulating fuel and only replaces what the engines burn, so the old fuel decays exponentially. Reaching the last few hundredths of a per cent takes the longest.

**What volume should I enter for the circuit?**
Everything between the mixing tank and the engines and back: the mixing or venting tank, booster pumps, heaters, filters, viscosimeter, pipes and the engine's fuel rail. The ship's changeover procedure or the fuel system drawings give it.

**Why blend gradually?**
Engine makers limit how fast the fuel temperature at the pumps may change, typically 2 °C per minute, to prevent the plungers from sticking. In a small circuit with hot heavy fuel an instant switch would exceed that, so the new fuel is blended in more slowly.

**Does the engine load matter?**
Yes. At low load the engines burn less, the circuit is flushed more slowly, and the changeover takes longer. Use the consumption expected during the changeover.

**What does MARPOL require?**
Regulation 14.6 of Annex VI requires a written changeover procedure that allows enough time to flush the system before entering the ECA, and log-book entries of the tank volumes, date, time and position when the changeover is completed.

**Can the sulphur of the new fuel be the limit itself?**
No. The mixture only approaches the new fuel's sulphur, so it must be below the limit, and the closer it is, the longer the changeover.

## Related calculators

- [Fuel blending and heating viscosity](../fuel-blend-heating/index.html) — the viscosity of the mixture during the changeover.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — the consumption during the passage.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — the compliant fuel on board.
- [Passage plan from waypoints](../passage-plan/index.html) — the time and distance to the ECA boundary.
