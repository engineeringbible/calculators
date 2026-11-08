# Generator load sharing with droop calculator

**Summary:** Active load sharing and bus frequency of paralleled generating sets with speed droop, with an optional isochronous set taking the balance.

## Introduction

When generating sets run in parallel, something must decide how much load each one carries. With speed droop, each governor lowers its speed setting a little as the load rises, along a straight line. On a common bus every set must run at the same frequency, so each takes the load where its droop line crosses the bus frequency. This calculator finds that frequency and the load on each set, compares the shares with the sets' ratings, and models a system in which one isochronous set holds the frequency and takes the balance.

It is for electrical officers and engineers setting up governors, superintendents investigating uneven load sharing, and students of power systems.

## Formulas

    Droop line:          f = f_nl − D f_r P / P_r
    Load on a set:       P = P_r (f_nl − f) / (D f_r)
    Bus frequency:       f = (Σ c_i f_nl,i − P_load) / Σ c_i,   c_i = P_r,i / (D_i f_r)
    Proportional share:  P_load × P_r,i / Σ P_r

- f_nl — no-load frequency setting; D — droop as a fraction; f_r — rated frequency; P_r — rating.

## Assumptions and limitations

- Steady state on an isolated bus; governor dynamics are not modelled.
- Straight-line droop characteristics over the whole load range.
- At most one isochronous set, which holds its frequency between no load and its rating.
- Reactive load sharing (voltage droop) is not included.

## Worked example

Two 1000 kW sets and one 800 kW set, all with 4 % droop set to 62.4 Hz at no load on a 60 Hz system, carry 1800 kW.

1. Each set reaches 60 Hz at its full rating: 62.4 − 0.04 × 60 = 60.0 Hz.
2. The bus settles at 62.4 − 2.4 × 1800 / 2800 = 60.857 Hz.
3. Each set carries 64.3 % of its rating: 643, 643 and 514 kW, exactly in proportion.
4. Lowering all speed settings by 0.857 Hz brings the bus back to 60 Hz with the same sharing.

## FAQ

**Why droop and not isochronous on every set?**
Two isochronous governors on one bus would fight over the load, since any small difference in their settings sends the load to one of them. Droop gives each set a stable, unique load at any frequency.

**Why do my identical sets share unevenly?**
Their droop or no-load settings differ. The set with the higher speed setting, or the smaller droop, takes more of the load.

**What does the isochronous set do?**
It holds the frequency and takes whatever the droop sets leave. If the load drops below what the droop sets carry, it unloads and the frequency rises; if the load exceeds its rating, it stays at its limit and the frequency falls.

**How much droop is usual?**
Simple mechanical governors often have about 5 %, and 3 % to 10 % is not unusual; governors with adjustable droop are commonly set between 0 and 5 % (Woodward 01302).

**What is the deviation from the proportional share?**
The difference between a set's load and its share in proportion to its rating, as a percentage of the largest set's rating. Ship rules limit it for sets in parallel.

## Related calculators

- [Generator load, kVA and fuel](../generator-load/index.html) — the load and fuel of each set.
- [Three-phase power and motor current](../three-phase-power/index.html) — power from current, voltage and power factor.
- [Short-circuit current (IEC 60909)](../short-circuit-current/index.html) — the fault level with sets in parallel.
- [Power factor correction](../power-factor-correction/index.html) — reactive power on the bus.
