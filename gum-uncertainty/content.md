# Measurement uncertainty (GUM) calculator

**Summary:** GUM uncertainty budget: Type A/B components, sensitivity coefficients, combined and expanded uncertainty with Welch–Satterthwaite degrees of freedom.

## Introduction

Every measurement result needs an uncertainty, and the internationally agreed way to get one is the GUM: list every source of doubt, turn each into a standard uncertainty (from repeated readings, Type A, or from certificates, specifications and judgement, Type B), weight it by how strongly it affects the result, combine them in quadrature, and expand the result to a stated coverage probability. This calculator does the bookkeeping: paste or type the components, choose the coverage probability, and get the combined and expanded uncertainty, the effective degrees of freedom, the coverage factor, a properly rounded result statement and the budget table showing which component dominates.

It is for calibration and test engineers, surveyors (draft and bunker surveys), metrologists and students preparing an uncertainty budget.

## Formulas

    u(xᵢ) = value / divisor:  normal 1,  expanded k = 2 → 2,  rectangular √3,  triangular √6,  U-shaped √2,  Type A √n
    u_c(y) = √ Σ (cᵢ u(xᵢ))²                                          (uncorrelated inputs)
    ν_eff = u_c⁴ / Σ ( (cᵢ u(xᵢ))⁴ / νᵢ )                             Welch–Satterthwaite
    k = t_p(⌊ν_eff⌋)   (95.45 % → 2.00 for large ν),   U = k u_c
    report U with two significant digits and y to the same decimal place

## Assumptions and limitations

- Uncorrelated inputs and a linear model; correlation and strong non-linearity need GUM 5.2 or the Monte Carlo method of JCGM 101.
- The output quantity is assumed approximately normal; a dominant rectangular component is flagged.
- All values in one unit (or all relative).

## Worked example

EA-4/02 example S2, calibration of a 10 kg weight against a reference standard (values in mg):

| Component | Type | Value | u(xᵢ) |
|---|---|---|---|
| Reference standard | expanded, k = 2 | 45 | 22.5 |
| Drift of the standard | rectangular | ±15 | 8.66 |
| Observed difference | Type A, s_p = 25, n = 3 | 25 | 14.43 |
| Comparator | rectangular | ±10 | 5.77 |
| Air buoyancy | rectangular | ±10 | 5.77 |

1. u_c = √(22.5² + 8.66² + 14.43² + 5.77² + 5.77²) = 29.3 mg.
2. All components have many degrees of freedom: ν_eff = ∞, k = 2.
3. U = 2 × 29.3 = 59 mg: the weight is 10 000.025 g ± 59 mg (10 000 025 ± 59 in mg).
4. The reference standard contributes 59 % of the variance.

EA-4/02 prints 8.95 mg for the drift row although ±15 mg rectangular gives 8.66 mg; the combined value rounds to 29.3 mg either way.

With the GUM's own example (relative uncertainties 0.25 %, 0.57 % and 0.82 % from 10, 5 and 15 readings) the effective degrees of freedom are 19, k = 2.09 at 95 % and U = 2.2 %.

## FAQ

**Type A or Type B?**
Type A comes from a statistical analysis of repeated readings; Type B from everything else (certificates, specifications, resolution, experience). Both become standard uncertainties and combine the same way.

**What divisor for a manufacturer's ±tolerance?**
Without more information, rectangular (√3). If values near the centre are more likely, triangular (√6); for a sinusoidal quantity such as temperature cycling, U-shaped (√2).

**What are sensitivity coefficients?**
The partial derivatives of the result with respect to each input (∂y/∂xᵢ), converting the input's uncertainty into the unit of the result; 1 when the input enters additively.

**Why is k not exactly 2?**
With few effective degrees of freedom the Student distribution is wider than the normal; ν_eff = 4 gives k = 2.87 at 95.45 %.

**Can I handle correlated inputs?**
Not here; add the covariance terms 2 cᵢ cⱼ u(xᵢ, xⱼ) by hand or use a Monte Carlo evaluation.

**Why round to two significant digits?**
The uncertainty is itself uncertain; GUM 7.2.6 recommends at most two significant digits and rounding the result to match.

## Related calculators

- [Quick statistics of a series](../quick-stats/index.html) — the standard deviation for a Type A component.
- [Unit converter](../unit-converter/index.html) — bringing all components to one unit.
- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — a measurement with a published uncertainty.
- [Draft survey](../draft-survey/index.html) — a measurement whose budget follows the same rules.
