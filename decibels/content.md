# Decibel calculator (dB, dBm, dBV, dBu)

**Summary:** Decibels from power or voltage ratios and back, dBm, dBW, dBV, dBµV and dBu converted to watts and volts, and the sum of several decibel levels.

## Introduction

A decibel is a tenth of a bel, the logarithm of a power ratio. For power, dB = 10 log10(P2 / P1). For voltage or current, dB = 20 log10(V2 / V1), because power goes with the square of the voltage. Doubling the power adds 3.01 dB, and doubling the voltage adds 6.02 dB. With a fixed reference the decibel becomes an absolute level: 0 dBm is 1 mW, and 0 dBV is 1 V.

This calculator converts ratios to decibels and back, and converts absolute levels between dBm, dBW, dBV, dBµV, dBu, watts and volts across an impedance you choose. It also adds the levels of several uncorrelated sources. It is for radio, audio and electronics engineers, technicians and students working with gains, losses, signal levels and noise.

## Formulas

Ratios:

    L = 10 log10(P2 / P1) dB = 20 log10(V2 / V1) dB
    P2 / P1 = 10^(L/10),   V2 / V1 = 10^(L/20)

Absolute levels:

    dBm = 10 log10(P / 1 mW),   dBW = 10 log10(P / 1 W) = dBm − 30
    dBV = 20 log10(V / 1 V),   dBµV = 20 log10(V / 1 µV) = dBV + 120
    dBu = 20 log10(V / 0.7746 V) = dBV + 2.218
    P = V² / R

Adding uncorrelated levels:

    L_total = 10 log10(10^(L1/10) + 10^(L2/10) + …)

- P — power, W; V — r.m.s. voltage, V; R — impedance, Ω
- 0.7746 V — the voltage of 1 mW in 600 Ω, √(0.001 × 600)

## Assumptions and limitations

- The 20 log form gives the same number as the power ratio only when both voltages act across the same impedance.
- Voltages are r.m.s. values. A peak or peak-to-peak value must be converted first.
- dBm and dBW are power levels. dBV, dBµV and dBu are voltage levels, related to power through the impedance entered.
- The dBu is a voltage level and needs no 600 Ω load. It equals dBm only across 600 Ω.
- The sum assumes uncorrelated sources such as separate machines or noise, whose powers add. Identical signals in phase add their voltages and can give up to 6 dB more.

## Worked example

A signal generator delivers 10 dBm into a 50 Ω load. What is that in watts, volts and the other level units?

1. Power: P = 1 mW × 10^(10/10) = 10 mW, which is 0.0100 W.
2. In dBW: 10 − 30 = −20.00 dBW.
3. Voltage across 50 Ω: V = √(0.0100 × 50) = 0.707 V r.m.s.
4. In dBV: 20 log10(0.707) = −3.01 dBV.
5. In dBµV: −3.01 + 120 = 117.0 dBµV.
6. In dBu: 20 log10(0.707 / 0.7746) = −0.79 dBu.

The same 10 dBm across 600 Ω would be 2.45 V and 10 dBu, which shows why the impedance matters.

## FAQ

**How do I convert dBm to watts?**
Divide the dBm value by 10, raise 10 to that power, and multiply by 1 mW. 30 dBm is 1 W and 20 dBm is 100 mW.

**What is the difference between 10 log and 20 log?**
10 log is for power ratios. 20 log is for voltage and current ratios, because power is proportional to the voltage squared.

**What is the difference between dBu and dBV?**
dBV is referred to 1 V and dBu to 0.7746 V. A level in dBu is 2.22 dB higher than the same level in dBV.

**What does adding 3 dB mean?**
Doubling the power. Two equal uncorrelated sources together are 3 dB louder than one, and ten of them are 10 dB louder.

**How do I add decibel levels?**
Convert each to a power ratio with 10^(L/10), add them, and take 10 log10 of the sum. 85, 82 and 79 dB make 87.4 dB.

**How do I convert dBµV to dBm in a 50 Ω system?**
Subtract 107. In 50 Ω, 0 dBm is 0.2236 V, which is 107.0 dBµV.

## Related calculators

- [Filter cutoff frequency](../filter-cutoff/index.html) — attenuation of RC, RL and LC filters in dB.
- [Ohm's law](../ohms-law/index.html) — the power and voltage behind each level.
- [LC resonant frequency](../lc-resonance/index.html) — Q and bandwidth at the −3 dB points.
- [Voltage divider](../voltage-divider/index.html) — an attenuator and its loss in dB.
