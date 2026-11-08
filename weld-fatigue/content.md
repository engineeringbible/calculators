# Weld fatigue damage (DNV-RP-C203) calculator

**Summary:** Miner damage and fatigue life of a welded detail from a stress-range histogram on the DNV-RP-C203 S-N curves, with thickness effect and DFF.

## Introduction

Welded joints in ships and offshore structures crack under repeated loading long before the stress reaches yield. The usual check classifies the detail on an S-N curve, which gives the number of cycles to failure at each stress range, and adds up the damage of all the cycles in a stress histogram by the Palmgren–Miner rule. This calculator uses the S-N curves of DNV-RP-C203 for air, for seawater with cathodic protection and for free corrosion, applies the thickness effect and a stress concentration factor, and compares the damage over the design life with the limit set by the design fatigue factor.

It is for structural engineers checking fatigue of hull and offshore details, inspection engineers judging remaining life, and students learning the S-N method.

## Formulas

    S-N curve (air, CP):   log N = log a1 − m1 log Δσ   above the slope change (10^7 cycles in air, 10^6 with CP)
                           log N = log a2 − 5 log Δσ    below it
    Free corrosion:        log N = log a − 3 log Δσ
    Effective range:       Δσ_eff = Δσ · SCF · (t / t_ref)^k   for t > t_ref
    Miner sum:             D = Σ n_i / N_i ≤ η = 1 / DFF
    Fatigue life:          period / D

## Assumptions and limitations

- S-N curves of the October 2011 edition of DNV-RP-C203; later editions revised some details.
- t_ref = 25 mm for welded connections other than tubular joints, 32 mm for tubular joints in this edition.
- Linear damage accumulation; the histogram should have at least 20 blocks when it represents a long-term distribution.
- Mean stress, post-weld improvement and low-cycle fatigue are not included.

## Worked example

A detail on curve D in air, 25 mm thick, sees in one year the histogram of the default input: from 50 cycles at 120 MPa to a million at 5 MPa, 5.86 million cycles in all. The design life is 20 years with DFF 2.

1. At 120 MPa, above the slope change at 52.63 MPa, N = 10^(12.164 − 3 log 120) = 844 000 cycles; 50 cycles give a damage of 5.9 × 10⁻⁵.
2. At 40 MPa, below it, N = 10^(15.606 − 5 log 40) = 3.94 × 10⁷; 200 000 cycles give 5.1 × 10⁻³, the largest share.
3. The Miner sum for the year is 0.0167, so the fatigue life is 60 years.
4. Over 20 years D = 0.333 against 1/DFF = 0.5: utilisation 0.67, acceptable.

## FAQ

**Which S-N curve applies to my detail?**
DNV-RP-C203 Appendix A classifies details by geometry, weld type and direction of loading; for hot-spot stresses from a finite element model, curve D is used for plated structures and curve T for tubular joints.

**Why does the slope change?**
Below a certain stress range, cycles do much less damage. With variable loading the larger cycles keep the cracks growing, so the RP uses a second, flatter slope (m = 5) rather than a fatigue limit.

**Why is free corrosion so much worse?**
Corrosion attacks the weld toe and removes the benefit of the slope change: the curve keeps the steep slope for all cycles and lies lower, so the life can drop severalfold.

**What does the thickness effect do?**
Thicker plates have a less favourable stress gradient at the weld toe, so their fatigue strength is lower. The stress range is increased by (t/t_ref)^k for plates thicker than the reference.

**What design fatigue factor should I use?**
DNV-OS-C101 sets it from 1 to 10 depending on whether the detail can be inspected and repaired and how serious a failure would be.

**When can a detailed fatigue analysis be skipped?**
When the largest stress range is below the fatigue limit at 10^7 cycles reduced by DFF^−0.33, section 2.11 of the RP allows the detailed analysis to be omitted.

## Related calculators

- [Fillet weld strength](../fillet-weld/index.html) — the static strength of the weld.
- [Stiffener with attached plating](../stiffener-section/index.html) — the section modulus that turns moments into stresses.
- [Padeye design check](../padeye/index.html) — the static check of a lifting point.
- [Measurement uncertainty (GUM)](../gum-uncertainty/index.html) — the uncertainty of measured stress ranges.
