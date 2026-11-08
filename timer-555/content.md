# 555 timer calculator

**Summary:** 555 timer astable frequency, high and low times and duty cycle, monostable pulse width, or R1 and R2 for a target frequency and duty cycle.

## Introduction

The 555 timer sets its timing with resistors and a capacitor. In the astable circuit it oscillates at f = 1.44 / ((R1 + 2 R2) C). With R1 = 4.7 kΩ, R2 = 10 kΩ and C = 10 nF, it runs at about 5.84 kHz with the output high 59.5 % of the time. In the monostable circuit one trigger gives one pulse of 1.1 R1 C.

This calculator gives the frequency, period, high and low times and duty cycle of an astable 555, or the pulse width of a monostable one. A design mode works backwards from a target frequency and duty cycle to R1 and R2, then picks the nearest E24 resistors. Type values as they are marked on parts, such as 4k7 or 10n. It is for hobbyists, students and engineers building oscillators, flashers, tone generators and delays.

## Formulas

Astable, with R1 from the supply to the discharge pin and R2 from the discharge pin to the threshold and trigger pins:

    t_H = ln 2 × (R1 + R2) × C ≈ 0.693 (R1 + R2) C
    t_L = ln 2 × R2 × C ≈ 0.693 R2 C
    f = 1 / (t_H + t_L) ≈ 1.44 / ((R1 + 2 R2) C)
    D = t_H / (t_H + t_L) = (R1 + R2) / (R1 + 2 R2)

Monostable, with R1 from the supply to the discharge and threshold pins:

    t = ln 3 × R1 × C ≈ 1.1 R1 C

Design from a target frequency f and duty cycle D:

    S = R1 + 2 R2 = 1 / (ln 2 × f × C)
    R1 = (2D − 1) × S,   R2 = (1 − D) × S

- t_H, t_L — time the output is high and low, s
- f — frequency, Hz; D — duty cycle, the share of each period the output is high
- R1, R2 — timing resistors, Ω; C — timing capacitor, F

## Assumptions and limitations

- The capacitor swings between one third and two thirds of the supply. Both thresholds scale with the supply, so the timing does not depend on the supply voltage.
- The calculator uses ln 2 and ln 3 exactly. The datasheet rounds them to 0.693, 1.44 and 1.1, which shifts the results by less than 0.2 %.
- Real circuits differ by the component tolerances. A 10 % capacitor moves the frequency by up to 10 %.
- Electrolytic capacitors leak, which lengthens long delays. Use film or ceramic capacitors where accuracy matters.
- The basic astable circuit always gives a duty cycle above 50 %, because the capacitor charges through both resistors but discharges through R2 only.

## Worked example

An astable 555 has R1 = 4k7, R2 = 10k and C = 10n. What frequency and duty cycle does it give?

1. Values: R1 = 4.7 kΩ, R2 = 10 kΩ, C = 10 nF.
2. High time: 0.693 × (4 700 + 10 000) × 10 × 10⁻⁹ = 101.9 µs.
3. Low time: 0.693 × 10 000 × 10 × 10⁻⁹ = 69.3 µs.
4. Period: 101.9 + 69.3 = 171.2 µs, so the frequency is 1 / 171.2 µs = 5.84 kHz.
5. Duty cycle: 14 700 / 24 700 = 59.5 %.

The datasheet form 1.44 / ((R1 + 2 R2) C) gives 5.83 kHz. The small difference comes from rounding 1 / ln 2 = 1.4427 to 1.44.

## FAQ

**How do I calculate the frequency of a 555 timer?**
Use f = 1.44 / ((R1 + 2 R2) C) with ohms and farads. For 4.7 kΩ, 10 kΩ and 10 nF that is about 5.8 kHz.

**How do I get a 50 % duty cycle from a 555?**
The basic circuit cannot reach it. Put a diode across R2 so the capacitor charges through R1 only, then make R1 equal to R2.

**What is the pulse width of a 555 monostable?**
t = 1.1 R C. A 100 kΩ resistor and a 10 µF capacitor give a pulse of 1.1 s.

**Does the supply voltage change the 555 frequency?**
Hardly. The thresholds are fixed fractions of the supply, so the timing stays the same from 5 V to 15 V apart from small second-order effects.

**What do 4k7 and 10n mean?**
They are marking codes with the prefix as the decimal point. 4k7 is 4.7 kΩ, 10n is 10 nF and 4u7 is 4.7 µF.

**Which capacitor should I use for a 555 timer?**
Film or C0G ceramic capacitors keep the timing stable. Electrolytics suit long delays, but their tolerance and leakage make the time less exact.

## Related calculators

- [RC time constant](../rc-time-constant/index.html) — the charging curve behind the 555 timing.
- [Series and parallel resistors](../resistors-series-parallel/index.html) — making an exact R1 or R2 from standard parts.
- [Series and parallel capacitors](../capacitors-series-parallel/index.html) — combining capacitors for C.
- [LED resistor](../led-resistor/index.html) — driving an LED from the 555 output.
