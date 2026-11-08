# Reliability and redundancy calculator

**Summary:** Availability and mission reliability of series, parallel and k-out-of-n systems, and a Weibull fit of failure times by median-rank regression.

## Introduction

How often will a system be down, and how much does a standby unit help? A reliability block diagram answers this by combining blocks in series, where every block must work, with redundant blocks in which k of n identical units are enough. From each unit's mean time between failures and mean time to repair, this calculator gives the availability of each block and of the system, the expected downtime per year, and the probability of completing a mission without repair. A second part fits a Weibull distribution to observed failure times, to tell early failures from wear-out and to estimate the B10 life.

It is for marine and reliability engineers assessing redundancy of essential systems, maintenance planners, and anyone analysing failure records.

## Formulas

    Unit availability:     A = MTBF / (MTBF + MTTR)
    Mission reliability:   R(t) = e^(−t / MTBF)
    k-out-of-n block:      P = Σ_{j=k..n} C(n, j) p^j (1 − p)^(n−j)
    System (series):       Π P_block
    Median ranks:          F_i = (i − 0.3)/(n + 0.4)
    Weibull line:          ln t = ln η + (1/β) ln(−ln(1 − F))
    B10 life and mean:     η (−ln 0.9)^(1/β),   η Γ(1 + 1/β)

## Assumptions and limitations

- Independent failures and repairs; each unit has its own repair; switching to a standby unit is perfect.
- A constant failure rate for the mission reliability.
- Complete (uncensored) failure times for the Weibull fit, two parameters.
- No confidence bounds; small samples give very uncertain parameters.

## Worked example

A propulsion system has one main engine (MTBF 5000 h, MTTR 24 h), three generating sets of which two are needed (4000 h, 12 h), and two steering gear pumps and two fuel supply pumps, one of each needed.

1. The main engine alone is available 5000/5024 = 99.522 % of the time.
2. The 2-out-of-3 generating sets reach 99.9973 %, and each pair of pumps more than 99.9999 %.
3. The system is available 99.5195 % of the time, about 42 h of downtime a year; the main engine dominates.
4. Seven failure times from 1200 to 5100 h give β = 2.17 and η = 3464 h: wear-out, with a B10 life of about 1230 h.

## FAQ

**Why does redundancy help so much?**
With two units of which one is needed, the block fails only when both are down at once. With availabilities of 99.9 %, that is 0.1 % × 0.1 % = 0.0001 %, a thousand times less likely than either unit alone being down.

**What is the difference between availability and reliability?**
Availability is the fraction of time the system works, counting repairs. Reliability is the probability that it works throughout a mission without repair.

**What does β tell me?**
β below 1 means early failures, for example from poor installation; β about 1 means random failures; β above 1 means wear-out, where replacing parts before they fail pays off.

**Why rank regression?**
With few failures it gives sensible estimates and a plot that shows whether the data follow a straight line. Maximum likelihood is preferred for large samples or many suspended items.

**What if some units have not failed yet?**
Those suspended items carry information but need adjusted ranks, which this calculator does not apply; ignoring them biases the life downwards.

## Related calculators

- [Quick statistics of a series](../quick-stats/index.html) — summary statistics of failure data.
- [Measurement uncertainty (GUM)](../gum-uncertainty/index.html) — uncertainty of measured quantities.
- [Rolling bearing L10 life (ISO 281)](../bearing-life/index.html) — bearing life, itself a Weibull B10 life.
- [Generator load, kVA and fuel](../generator-load/index.html) — sizing the generating sets in the redundancy.
