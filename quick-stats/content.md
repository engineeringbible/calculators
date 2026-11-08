# Quick statistics of a series calculator

**Summary:** Mean, standard deviation, confidence interval, quartiles, trend with significance and outliers (Tukey, Chauvenet, Grubbs) of a pasted series.

## Introduction

Engineers constantly look at short columns of numbers: daily fuel figures, repeated readings of a gauge, test results, a month of noon-report speeds. The first questions are always the same. What is the typical value and how much does it scatter? How sure are we of the average? Is there a trend? Is that one odd value an outlier? This page answers them from a paste: descriptive statistics, the Student-t confidence interval of the mean, quartiles and shape, a least-squares trend with its significance, and three outlier tests side by side.

It is for engineers, surveyors, analysts and students who need a fast, transparent check without opening a statistics package.

## Formulas

    x̄ = Σx/n,   s = √(Σ(x − x̄)²/(n − 1)),   SE = s/√n
    CI = x̄ ± t(1 − α/2, n − 1) SE
    Q1, Q3: linear interpolation between order statistics (type 7),   IQR = Q3 − Q1
    G1 = √(n(n−1))/(n−2) · m₃/m₂^1.5,   G2 = [(n+1) g₂ + 6](n−1)/((n−2)(n−3)),  g₂ = m₄/m₂² − 3
    trend: y = a + b x (least squares),  t = b/SE(b),  p = 2[1 − F_t(|t|, n − 2)]
    Tukey: x < Q1 − 1.5 IQR or x > Q3 + 1.5 IQR
    Chauvenet: n · P(|Z| > |x − x̄|/s) < 0.5
    Grubbs: G = max|x − x̄|/s > ((n − 1)/√n) √(t²/(n − 2 + t²)),  t = t(1 − α/(2n), n − 2)

## Assumptions and limitations

- Independent values from one population; serial correlation makes intervals too narrow.
- Normal-theory interval, Chauvenet and Grubbs; skewed data are better described by median and quartiles.
- Outlier tests flag, they do not delete; Grubbs is applied once.
- Decimal point, at most 100 000 values.

## Worked example

Ten days of fuel consumption (t/day): 31.2, 30.8, 31.5, 30.9, 31.1, 31.4, 30.7, 31.0, 31.3, 34.2.

1. Mean 31.41, median 31.15, s 1.014, standard error 0.321.
2. 95 % interval of the mean: 31.41 ± 2.262 × 0.321 = 30.69 … 32.13.
3. Quartiles 30.93 and 31.38, IQR 0.45, fences 30.25 and 32.05.
4. 34.2 lies above the upper fence; its z = 2.75 gives n·P = 0.06 (Chauvenet) and exceeds the Grubbs critical value 2.290 for n = 10: flagged by all three tests.
5. Without it the mean is 31.10 t/day and s 0.27 t/day — the day with 34.2 deserves a look in the log (bad weather, a different fuel, a meter fault).

## FAQ

**Sample or population standard deviation?**
The sample value (n − 1) estimates the spread of the process the data come from; the population value (n) describes only these numbers.

**Why is the confidence interval narrower than the scatter?**
It describes the uncertainty of the mean, which shrinks with √n; the scatter of single values is s.

**Which outlier test should I believe?**
Grubbs is the ISO 5725-2 test for laboratory data, Tukey needs no distribution, Chauvenet is the classic of error analysis. When all three agree, investigate; when only one flags, be cautious.

**Can I paste from Excel?**
Yes: a column, a row or two columns (choose x y pairs) pasted directly; convert decimal commas first.

**What does a significant trend mean?**
That a straight line explains more than random scatter would at the chosen level; it does not prove the cause, and a step change can look like a trend.

**Why warn about serial correlation?**
Consecutive readings are often similar; the effective number of independent values is smaller than n, so the true uncertainty of the mean is larger than shown.

## Related calculators

- [Measurement uncertainty (GUM)](../gum-uncertainty/index.html) — combining uncertainty components.
- [Admiralty coefficient](../admiralty-coefficient/index.html) — speed-power data that this page can screen.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — consumption figures in context.
- [Unit converter](../unit-converter/index.html) — converting the data before pasting.
