# Tolerance stack-up calculator

**Summary:** Worst-case, root-sum-square and Monte Carlo results of a dimension chain, with the share of each dimension and the yield against limits.

## Introduction

When parts are assembled, their tolerances add up in the gap, clearance or overall length that matters for the assembly. The worst-case sum guarantees that every assembly fits but often demands tolerances that are needlessly tight. Statistical methods recognise that the extremes rarely coincide. This calculator adds up a chain of dimensions by the worst case and by the root sum of squares, runs a seeded Monte Carlo simulation with normal or uniform parts, and gives the yield against the limits and each dimension's share of the variation.

It is for mechanical designers checking fits and clearances, manufacturing engineers setting tolerances, and anyone deciding how tight a tolerance really needs to be.

## Formulas

    Mid-tolerance value:   mean = nominal + (plus − minus)/2,   half-width h = (plus + minus)/2
    Gap:                   Σ sign × mean
    Worst case:            ± Σ h
    Root sum of squares:   ± √(Σ h²)
    Standard deviation:    σ = √(Σ σ_i²),   σ_i = h/z (normal) or h/√3 (uniform)
    Capability:            Cpk = min(USL − μ, μ − LSL) / 3σ

## Assumptions and limitations

- One-dimensional chain of independent dimensions, each centred in its tolerance.
- Normal parts are spread over ±z σ; uniform parts evenly over the tolerance.
- The Monte Carlo uses a fixed seed, so a rerun repeats exactly.
- Mean shifts, correlated dimensions and geometric tolerances are not included.

## Worked example

A housing of 120 ± 0.10 mm holds a bearing of 25 ± 0.05, a spacer of 70 ± 0.08 and a shaft shoulder of 24.5 ± 0.06. The gap must be between 0.35 and 0.65 mm.

1. Gap: 120 − 25 − 70 − 24.5 = 0.50 mm.
2. Worst case: ±(0.10 + 0.05 + 0.08 + 0.06) = ±0.29 mm, from 0.21 to 0.79 mm, outside the limits.
3. RSS: ±√(0.01 + 0.0025 + 0.0064 + 0.0036) = ±0.15 mm, exactly at the limits.
4. With normal parts at ±3σ the gap has σ = 0.05 mm, so 99.73 % of assemblies fit (Cpk 1.0). The housing contributes 44 % of the variation.

## FAQ

**Which method should I use?**
Worst case when every assembly must fit or the quantity is small; statistical methods for larger quantities from capable processes, accepting a small, known reject rate.

**Why is the RSS result smaller?**
It is unlikely that all parts come out at the same extreme. Adding the squares reflects how independent variations combine.

**When is the Monte Carlo worth it?**
When the parts are not normal (for example uniform, or with unequal tolerances), when there are few dimensions, or when the yield against limits matters more than a single ± figure.

**What does the variance share tell me?**
Where to tighten a tolerance to the most effect. Halving the tolerance of the largest contributor reduces the variation far more than tightening a small one.

**What about asymmetric tolerances?**
They are converted to a mid-tolerance value with a symmetric half-width; the gap shifts accordingly.

## Related calculators

- [Quick statistics of a series](../quick-stats/index.html) — measured dimensions from production.
- [Measurement uncertainty (GUM)](../gum-uncertainty/index.html) — uncertainty of the measured gap.
- [Interference fit](../interference-fit/index.html) — fits where the stack sets the interference.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — dimensions that change with temperature.
