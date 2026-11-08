# Filter cutoff frequency calculator (RC, RL, LC)

**Summary:** Cutoff frequency of RC, RL, LC and RLC low-pass and high-pass filters, with Q, attenuation in dB and phase at a frequency, or the component for a target cutoff.

## Introduction

The cutoff frequency of a filter is where its output falls to 0.707 of the input, which is −3 dB or half the power. For a first-order RC filter it is f_c = 1 / (2π R C). A 1 kΩ resistor with a 100 nF capacitor gives 1.59 kHz. Beyond the cutoff, a first-order filter loses 20 dB per decade, and a second-order LC filter 40 dB.

This calculator gives the cutoff frequency of RC and RL filters, and the natural frequency, Q and −3 dB frequency of series RLC and loaded LC filters, both low-pass and high-pass. It also gives the gain in dB and the phase at any frequency, and finds the capacitor or inductor for a target frequency. It is for students, hobbyists and engineers designing audio, sensor, power-supply and radio filters.

## Formulas

First-order RC and RL filters, with x = f / f_c:

    f_c = 1 / (2π R C)   or   f_c = R / (2π L)
    low-pass:   |H| = 1 / √(1 + x²),   φ = −arctan x
    high-pass:  |H| = x / √(1 + x²),   φ = 90° − arctan x

Second-order filters, with x = f / f0:

    f0 = 1 / (2π √(L C))
    Q = √(L / C) / R  (series RLC),   Q = R √(C / L)  (LC with load R)
    low-pass:   H = 1 / (1 − x² + j x / Q)
    high-pass:  H = −x² / (1 − x² + j x / Q)

The −3 dB frequency of a second-order filter:

    u = [(2 − 1/Q²) + √((2 − 1/Q²)² + 4)] / 2
    f_3dB = f0 √u  (low-pass),   f0 / √u  (high-pass)

- R — resistance, Ω; C — capacitance, F; L — inductance, H (entered in µH)
- |H| — output over input voltage; gain in dB = 20 log10 |H|; φ — phase
- Q — quality factor; 0.707 gives the flattest passband

## Assumptions and limitations

- The components are ideal. A real coil has resistance, which can be added to R in the series RLC circuit.
- The source has zero impedance and the output feeds an open circuit. A load across the output of an RC or RL filter lowers the effective resistance and moves the cutoff.
- In the loaded LC filter, the load resistor sits across the output component. Its value sets the Q, so the filter must be designed for the load it drives.
- A second-order filter has its −3 dB point at f0 only when Q = 0.707. Above that it peaks near f0, below that it rolls off early.
- For a target frequency, the second-order component is chosen so that f0 equals the target.

## Worked example

An RC low-pass filter has R = 1 kΩ and C = 100 nF. What is its cutoff frequency, and how much does it attenuate a 10 kHz signal?

1. f_c = 1 / (2π × 1 000 × 100 × 10⁻⁹) = 1 / 6.283 × 10⁻⁴ = 1.59 kHz.
2. Frequency ratio: x = 10 000 / 1 591.5 = 6.283.
3. Output ratio: |H| = 1 / √(1 + 6.283²) = 1 / 6.362 = 0.157.
4. Gain: 20 × log10(0.157) = −16.1 dB.
5. Phase: −arctan(6.283) = −81.0°.

So a 10 kHz signal comes out at about one sixth of its input amplitude.

## FAQ

**How do I calculate the cutoff frequency of an RC filter?**
Use f_c = 1 / (2π R C) with ohms and farads. For 10 kΩ and 10 nF the cutoff is 1.59 kHz.

**Why is the cutoff called the −3 dB point?**
At the cutoff the output voltage is 1/√2 = 0.707 of the input. That is half the power, and 10 log10(0.5) = −3.01 dB.

**How fast does a filter roll off?**
A first-order filter falls 20 dB per decade, or 6 dB per octave. A second-order filter falls 40 dB per decade, or 12 dB per octave.

**What Q should a second-order filter have?**
Q = 0.707 gives the flattest passband, the Butterworth response. Higher Q gives a peak near f0, and Q = 1 already peaks by 1.25 dB.

**What is the phase shift at the cutoff?**
45° for a first-order filter, lagging for low-pass and leading for high-pass. A second-order filter shifts 90° at its natural frequency f0.

**How do I choose a capacitor for a given cutoff?**
For an RC filter, C = 1 / (2π f_c R). With 10 kΩ, a 1 kHz cutoff needs 15.9 nF, so the nearest standard value is 15 nF or 16 nF.

## Related calculators

- [RC time constant](../rc-time-constant/index.html) — the step response of the same RC circuit.
- [LC resonant frequency](../lc-resonance/index.html) — resonance, Q and bandwidth of the LC pair.
- [Decibel calculator](../decibels/index.html) — converting the gain to ratios and absolute levels.
- [Air-core coil inductance](../coil-inductance/index.html) — winding the inductor.
