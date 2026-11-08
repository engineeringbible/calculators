# Wire size calculator (AWG and mm²)

**Summary:** Smallest AWG and metric wire size that keeps the voltage drop within your limit for a DC, single-phase or three-phase circuit, with the drop and the loss.

## Introduction

Wire that is too thin for its length wastes power as heat and delivers a low voltage at the load. Motors then run hot, LED drivers flicker and a 12 V pump stalls. Voltage drop grows with the current and the length of the run, so long circuits often need a larger wire than the current alone would suggest.

This calculator finds the smallest wire size, in AWG and in metric mm², that keeps the voltage drop within your limit. It works for DC, single-phase AC and balanced three-phase circuits in copper or aluminium. It also gives the actual drop, the voltage at the load and the power lost in the wire. It is for electricians, installers of solar, marine and RV systems, and engineers checking a circuit before choosing the cable.

## Formulas

Voltage drop of a circuit of one-way length L:

    DC and single-phase:   ΔV = 2 × I × L × R′
    three-phase:           ΔV = √3 × I × L × R′

Resistance per metre of a conductor of area A at temperature T:

    R′ = ρ20 × (1 + α (T − 20)) / A × k_s

Minimum area for an allowed drop ΔV_max = p × V:

    A_min = b × I × L × ρ(T) × k_s / (p × V)

- b — 2 for DC and single-phase, √3 for three-phase
- I — load current; L — one-way length; V — supply voltage; p — allowed drop as a fraction
- ρ20, α — copper 1.7241 × 10⁻⁸ Ω·m and 0.00393 /K; aluminium 2.8264 × 10⁻⁸ Ω·m and 0.00403 /K
- k_s — 1.02 for stranded wire (ASTM B8), 1 for solid

The result is the smallest AWG size and the smallest IEC 60228 metric size with at least A_min.

## Assumptions and limitations

- This sizes the wire for voltage drop only. The wire must also carry the current safely, which the wiring code sets from the insulation and installation: NEC Table 310.16 and 240.4(D) in the US, IEC 60364-5-52 elsewhere. Use the larger of the two sizes.
- Reactance is neglected. That is conservative for wire up to about 1/0 AWG or 50 mm². For larger AC feeders at a low power factor, use the cable sizing calculator, which includes reactance.
- The length is one way, from the supply to the load. The formula adds the return path.
- 75 °C is the default conductor temperature because the NEC resistance table uses it. A lightly loaded wire runs cooler, so the real drop is a little smaller.
- By default only the common building wire sizes are offered: 18 to 4 AWG in even numbers, then 3, 2, 1 and 1/0 to 4/0. Odd sizes such as 5 or 7 AWG exist but are rarely stocked.

## Worked example

A 20 A, 120 V single-phase circuit feeds a workshop 100 ft from the panel. The drop must stay within 3 %. What copper wire is needed?

1. Allowed drop: 3 % × 120 V = 3.6 V.
2. Resistivity at 75 °C: ρ = 1.7241 × 10⁻⁸ × (1 + 0.00393 × 55) = 2.0968 × 10⁻⁸ Ω·m, or 2.1387 × 10⁻⁸ with the stranding increment.
3. Minimum area: A = 2 × 20 × 30.48 × 2.1387 × 10⁻⁸ / 3.6 = 7.24 mm².
4. 10 AWG has only 5.26 mm², so the smallest AWG is 8 AWG with 8.37 mm². Its drop is 2 × 20 × 30.48 × 2.556 × 10⁻³ = 3.12 V, which is 2.60 %.
5. In metric sizes, 6 mm² is too small, so 10 mm² is needed, with a drop of 2.17 %.

So the run needs 8 AWG copper, two sizes up from the 12 AWG that the 20 A breaker alone would allow. The wire wastes about 62 W at full load.

## FAQ

**What wire size do I need for 20 amps?**
For a short run, 12 AWG copper, the size NEC 240.4(D) allows on a 20 A breaker. Over about 50 ft at 120 V the drop exceeds 3 % and 10 AWG or larger is needed.

**How much voltage drop is acceptable?**
The NEC informational notes suggest 3 % for a branch circuit and 5 % for the feeder and branch together. IEC 60364-5-52 suggests 3 % for lighting and 5 % for other loads. Low-voltage DC systems often use 3 % or less.

**Is the length one way or round trip?**
Enter the one-way distance from the supply to the load. The calculator doubles it for the return conductor, or uses √3 for three-phase.

**Why does three-phase need a smaller wire?**
Three-phase carries the same power with less current per conductor, and the line-to-line drop has a factor of √3 instead of 2. For the same current and voltage, the wire area falls by about 13 %.

**Can I use aluminium wire?**
Yes, but it needs about 1.64 times the copper area for the same drop, typically two AWG sizes larger. Use connectors rated for aluminium.

**Why does the calculator suggest 10 mm² when 8 AWG is only 8.4 mm²?**
Metric sizes jump from 6 to 10 mm², and 6 mm² is below the 7.24 mm² needed. The next size up is the only one that meets the limit.

## Related calculators

- [AWG wire gauge chart and converter](../awg-wire-gauge/index.html) — diameter, area and resistance of every gauge.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — IEC cable sizes with reactance and power factor.
- [Watts to amps](../watts-to-amps/index.html) — the current from the load power.
- [Ohm's law](../ohms-law/index.html) — voltage, current and resistance of the wire.
