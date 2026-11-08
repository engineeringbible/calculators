# Speed–power curve fit calculator

**Summary:** Fit P = aVⁿ to speed and power data and compare it with a reference curve: power increase, speed loss and the ISO 19030 performance value.

## Introduction

How much has a ship's performance changed since its sea trials? The usual answer compares the power needed today with the power a reference curve gives for the same speed, or the speed achieved with the power that the reference would need. ISO 19030 calls the speed difference the performance value. This calculator fits a power law to speed and power data, compares it with a reference curve given as coefficients or as trial points, and reports the power increase at a chosen speed, the speed loss at a chosen power, and the performance value of every data point.

It is for performance analysts, superintendents tracking hull fouling and the effect of cleanings, and anyone building a quick speed–power curve from trial data.

## Formulas

    Power law:             P = a Vⁿ
    Fit:                   ln P = ln a + n ln V   (least squares)
    Inverse:               V(P) = (P / a)^(1/n)
    Power increase:        (P_fit(V) − P_ref(V)) / P_ref(V)
    Speed difference:      (V_fit(P) − V_ref(P)) / V_ref(P)
    Performance value:     PV = (V_measured − V_ref(P_measured)) / V_ref(P_measured)   (ISO 19030-2)

## Assumptions and limitations

- Data at one draft and trim, corrected for wind, waves, current, temperature and depth.
- Speed through the water and shaft power, consistently for data and reference.
- A power law is a local description; extrapolation outside the data is flagged.
- Least squares in log space weights percentage errors equally.

## Worked example

Eight service points between 11.0 and 15.3 kn, with power from 3573 to 10 776 kW, against sea trial points of the clean hull from 11 to 15 kn.

1. The reference points fit P = 0.95 V^3.40 exactly.
2. The service data fit P = 1.058 V^3.385 with R² = 0.9995.
3. At 14 kn the service curve needs 8013 kW against 7491 kW on trial, an increase of 7.0 %.
4. The mean performance value of the points is −2.0 %: the ship is about 2 % slower than on trials for the same power.

## FAQ

**Why fit in logarithms?**
A power law is a straight line in log–log coordinates, and the fit then weights each point by its percentage error, which suits measurements spread over a wide range of power.

**What exponent should I expect?**
About 3 to 4.5 for most merchant ships in their service range. Much higher or lower values usually mean mixed drafts, uncorrected weather or a data error.

**Power increase or speed loss?**
Both describe the same change. A 7 % power increase at constant speed corresponds to roughly 2 % speed loss at constant power when n ≈ 3.4.

**Which reference should I use?**
The sea trial curve at the same draft, or a model test curve corrected to full scale. ISO 19030 also allows a reference period of the ship's own service data.

**Can I use noon reports?**
Yes, after filtering for steady conditions and correcting for weather; the scatter will be larger than with continuous monitoring data.

## Related calculators

- [Admiralty coefficient](../admiralty-coefficient/index.html) — scaling between speeds and displacements.
- [Propeller curve and light running margin](../propeller-curve/index.html) — power and rpm along the propeller law.
- [Wind resistance](../wind-resistance/index.html) — part of the weather correction of the data.
- [Hull roughness and fouling penalty](../hull-roughness-penalty/index.html) — the physical cause of the speed loss.
