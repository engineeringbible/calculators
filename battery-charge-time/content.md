# Battery charge time calculator

**Summary:** Time to charge a battery from any state of charge with a given charger, allowing for the chemistry's charge efficiency, with the charge rate in C.

## Introduction

How long will this battery take to charge? Dividing the capacity by the charger current gives a first answer, but a real charge takes longer. Part of the charge put in is lost as heat and, in lead-acid batteries, as gas, and the last part of the charge goes slowly as the charger tapers its current. Charging too fast also shortens a battery's life, so the charge rate matters as much as the time.

This calculator estimates the charge time from the battery's rated capacity, its present state of charge, the level you want to reach and the charger current. It applies the typical charge efficiency of flooded or sealed lead-acid, lithium-ion, LiFePO4 or NiMH batteries, or a value of your own. It also gives the charge rate in C, compared with the usual limit for the chemistry. It is for boat and vehicle owners, solar and backup-power installers, and engineers sizing chargers.

## Formulas

Charge to put back, and charge the charger must supply:

    Q_back = Q_rated × (SoC_target − SoC_now)
    Q_in = Q_back / η

Charge time and charge rate:

    t = Q_in / I
    C-rate = I / Q_rated   (I in A, Q in Ah)

Typical charge efficiency η: flooded lead-acid 85 %, AGM or gel 90 %, lithium-ion 95 %, LiFePO4 97 %, NiMH 70 %.

## Assumptions and limitations

- The charger delivers its full rated current throughout. Lithium batteries switch to constant voltage near full, and lead-acid batteries need an absorption stage of several hours above about 80 %, so a full charge takes longer than the estimate.
- The efficiencies are typical values. They fall when a battery is cold, hot, old or charged fast.
- The state of charge refers to the rated capacity. An aged battery holds less, so it fills sooner but also stores less.
- Charger losses and loads running from the battery during charging are not included. A load draws current that never reaches the battery.

## Worked example

A 100 Ah flooded lead-acid battery is at 50 % and charged to full with a 10 A charger. How long does it take?

1. Charge to put back: 100 × (1.00 − 0.50) = 50 Ah.
2. With 85 % efficiency the charger must supply 50 / 0.85 = 58.8 Ah.
3. Charge time: 58.8 / 10 = 5.88 h.
4. Charge rate: 10 / 100 = 0.10 C, well within the 0.2 C usual for flooded batteries.

The last stretch from 80 to 100 % runs at a falling current in the absorption stage, so in practice allow 2 to 4 hours more for a truly full battery.

## FAQ

**How do I calculate battery charge time?**
Divide the amp-hours to put back by the charger current, then divide by the charge efficiency. For a lead-acid battery that is roughly the amp-hours divided by the current, times 1.2.

**What does charge rate in C mean?**
The current as a fraction of the capacity. For a 100 Ah battery, 0.1 C is 10 A and 1 C is 100 A.

**What charger size do I need?**
For lead-acid, about 10 to 20 % of the capacity in amps; a 100 Ah battery suits a 10 to 20 A charger. Lithium batteries accept up to 0.5 to 1 C if the maker allows it.

**Why does the last 20 % take so long?**
To avoid overcharging, the charger holds the voltage constant and lets the current fall as the battery fills. Lead-acid batteries need this most.

**Should I charge lithium batteries to 100 %?**
For a long life, many makers suggest 80 to 90 % for daily use and 100 % only when the full range is needed.

**Why is NiMH so inefficient?**
Near full charge NiMH turns much of the input into heat, which is why its chargers terminate on temperature rise or a voltage dip.

## Related calculators

- [mAh to Wh battery capacity](../mah-to-wh/index.html) — the battery's energy in watt-hours.
- [Battery capacity and runtime](../battery-runtime/index.html) — how long the charge lasts under a load.
- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — charging from solar panels.
- [Electricity cost and energy use](../electricity-cost/index.html) — what a charge costs from the grid.
