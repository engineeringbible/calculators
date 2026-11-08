# PCB trace width calculator (IPC-2221)

**Summary:** PCB trace width for a current by IPC-2221 from copper weight and allowed temperature rise, with the trace resistance, voltage drop and power loss.

## Introduction

How wide must a PCB trace be for a given current? The trace heats up as current flows, and the width sets how much. IPC-2221 gives charts of current against copper cross-section for a chosen temperature rise. On an outer layer of 1 oz copper, 1 A with a 10 °C rise needs a trace about 12 mil (0.30 mm) wide.

This calculator applies the curve fit of the IPC-2221 charts to give the minimum trace width for your current, copper weight, temperature rise and layer. It also gives the trace's resistance, voltage drop and power loss over its length. It is for electronics designers, students and hobbyists laying out power and signal traces.

## Formulas

IPC-2221 curve fit, solved for the copper cross-section:

    I = k × ΔT^0.44 × A^0.725
    A = (I / (k × ΔT^0.44))^(1/0.725)
    w = A / t,   t = 1.378 mil × copper weight in oz/ft²

Resistance, voltage drop and loss of the trace:

    R = ρ20 × (1 + α (T − 20)) × L / (w × t)
    V = I × R,   P = I² × R

- I — current, A; ΔT — temperature rise above ambient, °C
- A — copper cross-section, mil² (1 mil = 0.001 in = 25.4 µm)
- k — 0.048 for outer layers, 0.024 for inner layers
- w — trace width; t — copper thickness; L — trace length
- ρ20 = 1.7241 × 10⁻⁸ Ω·m, α = 0.00393 per °C; T — ambient plus rise

## Assumptions and limitations

- The fit is only used inside the IPC-2221 charts: up to 35 A on outer and 17.5 A on inner layers, widths up to 400 mil, rises of 10 to 100 °C, and 0.5 to 3 oz copper. Outside that range the calculator gives an error.
- IPC-2221 is conservative. The newer IPC-2152 allows for the board material, its thickness and nearby copper planes. It usually permits narrower traces, especially on inner layers.
- Inner layers get half the current of outer layers in IPC-2221, because the surrounding laminate traps the heat.
- One ounce of copper is taken as 35 µm thick. Plating adds copper on outer layers and etching removes some, so the real section differs.
- Several hot traces close together, or a trace over a heat source, run hotter than a single trace.

## Worked example

A 2 A supply trace on an outer layer of 1 oz copper may rise 10 °C above an ambient of 25 °C. It is 2 in long. How wide must it be, and what does it lose?

1. Cross-section: A = (2 / (0.048 × 10^0.44))^(1/0.725) = (2 / 0.1322)^1.379 = 42.4 mil².
2. Copper thickness: 1 × 1.378 = 1.378 mil, or 35 µm.
3. Width: 42.4 / 1.378 = 30.8 mil, which is 0.781 mm.
4. Resistance at 35 °C: 1.7241 × 10⁻⁸ × 1.059 × 0.0508 / (2.735 × 10⁻⁸ m²) = 33.9 mΩ.
5. Voltage drop: 2 × 0.0339 = 67.8 mV, and power loss: 2² × 0.0339 = 0.136 W.

The same current on an inner layer needs 80.0 mil, about 2.6 times as wide.

## FAQ

**How wide should a PCB trace be for 1 A?**
About 12 mil (0.30 mm) on an outer layer of 1 oz copper for a 10 °C rise. Allowing a 20 °C rise brings it down to about 8 mil.

**How wide should a trace be for 3 A or 5 A?**
On 1 oz outer copper with a 10 °C rise, 3 A needs about 54 mil (1.37 mm) and 5 A about 109 mil (2.77 mm).

**Does 2 oz copper halve the trace width?**
Yes, for the same current and rise. The cross-section stays the same, so twice the thickness needs half the width.

**Why do inner layers need wider traces?**
The laminate around them holds the heat in. IPC-2221 gives them half the current of an outer trace with the same section, so they need about 2.6 times the width.

**What temperature rise should I allow?**
10 °C is a common, cautious choice. 20 to 30 °C is often accepted for power traces, provided the board stays well below the laminate's temperature limit.

**Should I use IPC-2221 or IPC-2152?**
IPC-2152 is based on newer and wider measurements and gives more accurate results. IPC-2221 errs on the safe side, so a trace sized by it is rarely too narrow.

## Related calculators

- [Wire size calculator](../wire-size/index.html) — sizing the wires that feed the board.
- [AWG wire gauge chart](../awg-wire-gauge/index.html) — wire areas to compare with trace sections.
- [Ohm's law](../ohms-law/index.html) — voltage drop and power from the resistance.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the same checks for cables.
