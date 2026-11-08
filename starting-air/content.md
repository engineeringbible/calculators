# Starting air receivers and compressors calculator

**Summary:** Receiver capacity for the consecutive engine starts of IACS UR M61 and the compressor capacity to charge the receivers from atmospheric pressure in one hour.

## Introduction

A main engine that starts on compressed air must be able to start many times in a row without the compressors running, for example during a long manoeuvre. IACS Unified Requirement M61, which the IACS class societies apply, sets that number: twelve starts alternately ahead and astern for each reversible engine and six for each non-reversible engine with a controllable pitch propeller. This calculator turns the air per start from the engine maker into the receiver volume between the maximum and the minimum starting pressure, checks the installed receivers, and sizes the compressors that must charge them from atmospheric pressure within one hour.

It is for marine engineers specifying or checking a starting air system, students of marine engineering, and surveyors verifying receiver and compressor capacity.

## Formulas

    Starts required:          engines × 12 (reversible) or × 6 (non-reversible)
    Free air required:        A = starts × air per start + other consumers
    Usable air per m³:        u = p1 (1 − (p2/p1)^(1/n)) / p_atm   (absolute pressures)
    Receiver volume:          V = A / u   (n = 1: V = A p_atm / (p1 − p2))
    Pressure for the starts:  p such that V_installed u(p) = A
    Compressor capacity:      V_installed (p − p_atm) / p_atm per hour

## Assumptions and limitations

- IACS UR M61 Rev.3: at least two receivers of about equal capacity, at least two compressors, one of them independent of the main engine with at least half the capacity.
- Air per start and minimum starting pressure from the engine maker; free air at atmospheric pressure.
- Isothermal expansion by default; n = 1.4 represents a rapid sequence of starts.
- Charging is isothermal; the capacity of the compressors is their free air delivery.
- Fewer starts per engine in multi-engine plants need the class society's agreement.

## Worked example

One reversible main engine uses 3 m³ of free air per start; the receivers work between 30 and 12 bar gauge; 2.5 m³ of receivers are installed and two compressors charge them.

1. 12 starts need 12 × 3 = 36 m³ of free air.
2. Receiver volume: 36 × 1.013 / 18 = 2.03 m³, two receivers of 1.01 m³.
3. The installed 2.5 m³ give 2.5 × 18 / 1.013 / 3 = 14.8 starts.
4. They hold the 12 starts when charged to 12 + 36 × 1.013 / 2.5 = 26.6 bar; from atmospheric pressure that is 2.5 × 26.6 / 1.013 = 65.6 m³ of free air, so 65.6 m³/h in one hour, 32.8 m³/h per compressor.

## FAQ

**Why twelve starts?**
A reversible two-stroke engine must stop and restart in the opposite direction for every change between ahead and astern. Twelve consecutive starts cover a demanding manoeuvre without relying on the compressors.

**Where does the air per start come from?**
From the engine maker's project guide, which gives the air consumption per start for each engine type. If it is given in normal cubic metres, convert it to free air at atmospheric pressure and the receiver temperature.

**Why does the expansion exponent matter?**
During rapid starts the air in the receivers expands and cools, so its pressure drops faster than the mass of air drawn off. Over a slow sequence it warms back to ambient. The isothermal case gives the most air; n = 1.4 is the conservative limit.

**Why is the compressor capacity given twice?**
UR M61 requires the compressors to supply, within one hour, the air needed for the required starts by charging the receivers from atmospheric pressure. That means reaching the pressure that holds those starts. Reaching the full working pressure in the same time needs more.

**Does the receiver air matter for fire fighting?**
Yes. The FSS Code adds the free air of the receivers to the engine room volume when sizing a CO₂ system, unless the receiver safety valves discharge to the open air.

## Related calculators

- [Fixed CO₂ fire-extinguishing system](../co2-fire-system/index.html) — the engine room CO₂ quantity including the receiver air.
- [Engine BMEP, torque and power](../engine-bmep/index.html) — the engine whose starts the receivers serve.
- [Thin-wall pressure vessel](../pressure-vessel/index.html) — the wall thickness of a receiver.
- [Tank volume and partial fill](../tank-volume/index.html) — the volume of a receiver from its dimensions.
