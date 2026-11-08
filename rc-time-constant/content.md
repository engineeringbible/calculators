# RC time constant and filter calculator

**Summary:** Time constant τ = RC, capacitor voltage while charging or discharging, time to 99 %, and the −3 dB cutoff frequency of an RC filter.

## Introduction

A resistor and a capacitor in series are the most common timing and filtering circuit in electronics. When a voltage is switched on, the capacitor does not charge instantly. It follows an exponential curve whose pace is set by a single number, the time constant τ = R × C. The same two parts used as a filter pass slow signals and block fast ones, with a cutoff frequency set by the same product.

This calculator gives the time constant, the capacitor voltage at any moment after the step for both charging and discharging, the time to reach 99 %, the current at the first instant, the energy stored, and the −3 dB cutoff frequency of the RC low-pass or high-pass filter. It is for students, hobbyists and engineers designing delays, debounce circuits, power-on resets and simple filters.

## Formulas

Time constant:

    τ = R × C

Charging from 0 towards V_s, and discharging from V_s:

    V_C(t) = V_s × (1 − e^(−t/τ))
    V_C(t) = V_s × e^(−t/τ)

Milestones: 63.2 % at t = τ, 86.5 % at 2τ, 95.0 % at 3τ, 99 % at 4.6τ, and 99.3 % at 5τ.

Cutoff (−3 dB) frequency of a first-order RC filter:

    f_c = 1 / (2π × R × C)

Current at the first instant and stored energy:

    I₀ = V_s / R,    E = ½ × C × V_s²

## Assumptions and limitations

- One resistor in series with one capacitor, driven by an ideal voltage step. If the source has its own resistance, add it to R.
- The capacitor is ideal. Electrolytic capacitors leak, so timing periods of minutes or more drift, and their −20 % / +80 % tolerance moves τ just as much.
- The filter result is the −3 dB point of a first-order filter into a high-impedance load. A load across the output lowers the effective resistance and shifts the cutoff.
- An RC filter rolls off at only 20 dB per decade. Sharper filtering needs more stages or an active filter.

## Worked example

A 10 kΩ resistor charges a 100 µF capacitor from a 5 V supply. How fast does it charge, and what is the voltage after one second?

1. Time constant: τ = R × C = 10 000 × 100 × 10⁻⁶ = 1.00 s.
2. After t = 1 s, that is one time constant: V_C = 5 × (1 − e^(−1)) = 5 × 0.632 = 3.16 V.
3. Practically full, at 99.3 %, after five time constants: 5 × 1.00 = 5.00 s.
4. Used as a filter, the same pair has a cutoff of f_c = 1 / (2π × 10 000 × 100 × 10⁻⁶) = 0.159 Hz. It passes only very slow changes, which makes it a smoothing filter.

For an audio low-pass filter with 1 kΩ and 100 nF, τ = 100 µs and f_c = 1.59 kHz.

## FAQ

**What does the time constant mean?**
The time to reach 63.2 % of the final voltage when charging, or to fall to 36.8 % when discharging. Each further τ closes 63.2 % of the remaining gap.

**When is a capacitor fully charged?**
Never exactly, in theory. In practice, 5τ (99.3 %) is taken as full; 3τ (95 %) is often good enough for timing.

**How do I choose R and C for a delay?**
Pick the delay, then τ = R C. A logic input that switches at half the supply needs t = 0.69 τ, so for a 1 s delay use τ = 1.44 s, for example 1 MΩ and 1.5 µF.

**What is the cutoff frequency of an RC filter?**
The frequency where the output is down 3 dB, or 70.7 % of the input. For a low-pass filter, the output is taken across the capacitor; for a high-pass filter, across the resistor. Both have the same f_c.

**Why does my RC timer drift?**
Capacitor tolerance and leakage, especially with electrolytics, and the threshold of whatever reads the voltage. For accurate or long delays, use a timer IC or a microcontroller.

**How much current flows at switch-on?**
At the first instant the capacitor acts like a short circuit, so the current is V_s / R. A small R with a large C gives a heavy inrush.

## Related calculators

- [Series and parallel capacitors](../capacitors-series-parallel/index.html) — making up the capacitance C.
- [Series and parallel resistors](../resistors-series-parallel/index.html) — making up the resistance R.
- [Ohm's law and electrical power](../ohms-law/index.html) — the switch-on current V / R.
- [Voltage divider](../voltage-divider/index.html) — the divider's source resistance adds to R.
