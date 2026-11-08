# Enclosed space purge time calculator

**Summary:** Ventilation time for a tank or enclosed space to reach the entry criteria for oxygen, flammable and toxic gas, by dilution with a mixing factor.

## Introduction

Enclosed spaces on ships — tanks, cofferdams, holds, void spaces — can lack oxygen or hold flammable or toxic gas, and entering them unprepared continues to cost lives. Before anyone goes in, the space is ventilated with fresh air and the atmosphere is tested. This calculator estimates how long the ventilation must run. It treats the space as a mixed volume diluted by the fan, with a mixing factor for real spaces where the air does not reach every corner, and tracks oxygen, flammable gas and a toxic gas against the entry criteria of the IMO recommendations.

It is for officers and crew planning an entry, safety officers writing entry procedures, and superintendents checking whether a portable fan is big enough. The result is an estimate: only the gas test decides whether the space is safe.

## Formulas

    Time constant:      K V / Q
    Concentration:      C(t) = C_fresh + (C_0 − C_fresh) e^(−Q t / (K V))
    Time to target:     t = (K V / Q) ln((C_0 − C_fresh) / (C_target − C_fresh))
    Air changes:        Q t / V

- V — volume of the space; Q — fresh air supplied; K — mixing factor (1 = perfect mixing).

## Assumptions and limitations

- The space is a mixed volume; no new gas is released while ventilating.
- The mixing factor is a judgement, from 1 for perfect mixing to about 10 for poorly ventilated spaces.
- Oxygen approaches 20.9 % only gradually, so its target is entered just below.
- Displacement of stratified gas by a well-placed duct can be faster and is not modelled.
- Entry criteria (MSC.581(110)): 20.9 % oxygen, less than 0.5 % CO₂, less than 1 % LFL, less than 50 % of the OEL of any toxic gas.

## Worked example

A 1200 m³ tank is ventilated with 5000 m³/h of fresh air; the mixing factor is 3. The tank holds 18 % oxygen, 10 % LFL of flammable gas and 50 ppm of a toxic gas with a 25 ppm exposure limit.

1. Time constant: 3 × 1200 / 5000 h = 43.2 min.
2. Oxygen to 20.8 %: 43.2 × ln(2.9 / 0.1) = 145.5 min.
3. Flammable gas to 1 % LFL: 43.2 × ln(10) = 99.5 min; toxic gas to 12.5 ppm: 43.2 × ln(4) = 59.9 min.
4. Oxygen governs: ventilate for about 145 min, 10.1 air changes, then stop the fan and test at several levels.

## FAQ

**Why does oxygen take longest?**
The last few tenths of a per cent are the slowest: dilution only approaches the 20.9 % of fresh air. Contaminants that must fall to a fraction of their value need fewer air changes.

**What mixing factor should I use?**
A factor of 1 assumes the fresh air mixes perfectly with the whole space, which rarely happens. Tanks with webs, stringers and a single duct need more air; factors of 3 to 10 are used in practice, the higher values where the airflow cannot reach all parts, and the choice remains a judgement.

**Why stop the ventilation before testing?**
With the fan running, the meter reads the fresh air near the duct. The IMO recommendations ask for testing with the ventilation stopped and conditions settled, at several levels and as far into the space as possible.

**Can the atmosphere change after ventilation?**
Yes. Rusting steel, some cargoes and residues keep consuming oxygen or releasing gas. Ventilation should continue while people are inside, and the atmosphere should be tested again at intervals.

**Where should the fan duct go?**
Heavy gases such as hydrogen sulphide, carbon dioxide and hydrocarbon vapour collect low; light gases such as methane collect high. Supply the fresh air to where the gas collects and exhaust from the opposite end.

## Related calculators

- [Engine-room ventilation (ISO 8861)](../engine-room-ventilation/index.html) — airflow for combustion and heat removal.
- [Cargo ventilation and dew point](../cargo-ventilation-dewpoint/index.html) — ventilating a hold without sweat.
- [Fixed CO₂ fire-extinguishing system](../co2-fire-system/index.html) — the gas a released system leaves in the space.
- [Tank volume and partial fill](../tank-volume/index.html) — the volume of the space.
