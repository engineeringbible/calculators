# NOx tier limit by engine speed calculator

**Summary:** MARPOL Annex VI Reg. 13 Tier I/II/III NOx limits from rated speed, the applicable tier, the margin of the certified value and annual NOx mass.

## Introduction

Nitrogen oxide limits for marine diesel engines depend on how fast the engine turns: slow engines have long combustion residence times and form more NOx, so the regulation allows them more. MARPOL Annex VI Regulation 13 sets three tiers, each a plateau below 130 rpm, a falling curve to 2 000 rpm and a plateau above, with Tier III (about 75 % below Tier II) applying only inside the NOx Emission Control Areas and only to ships built after the area's date. This calculator evaluates the three curves at the rated speed, determines which tier applies from the construction year and the area, compares a certified value with the limit and converts it to tonnes per year.

It is for superintendents and newbuilding engineers checking an engine's EIAPP against the trade, for compliance and emissions reporting, and for students of marine environmental regulation.

## Formulas

    Tier I   (built 2000–2010):          17.0 (n < 130) · 45 n^−0.2 (130 ≤ n < 2000) · 9.8 (n ≥ 2000)   g/kWh
    Tier II  (built ≥ 2011, global):     14.4 · 44 n^−0.23 · 7.7
    Tier III (in a NECA, built ≥ 2016 North America / ≥ 2021 Baltic & North Sea):  3.4 · 9 n^−0.2 · 2.0
    margin = (limit − certified)/limit,   annual NOx [t] = P × load factor × hours × (g/kWh) / 10⁶

## Assumptions and limitations

- Values are NOx Technical Code test-cycle weighted averages, not instantaneous or in-service emissions.
- Engines above 130 kW; exemptions (emergency, lifeboats, national-waters alternatives) and major-conversion rules are not evaluated.
- Pre-2000 ships are covered only through Regulation 13.7 (large engines with an approved method).

## Worked example

A 4 000 kW medium-speed generator engine rated at 500 rpm on a ship built in 2018 trading in the North Sea, certified at 2.2 g/kWh, average load 75 % for 6 000 h a year.

1. Limits at 500 rpm: Tier I 12.98, Tier II 10.54, Tier III 2.60 g/kWh.
2. Built 2018, before the 2021 Baltic/North Sea NECA date: Tier II applies even inside the area; the engine complies with a wide margin.
3. Had the ship been built in 2022, Tier III would apply in the area: 2.2 against 2.60 g/kWh, a 15 % margin, 46.7 t/year at the limit and 39.6 t at the certified value.
4. The same 2018 ship in the North American NECA (date 2016) is a Tier III ship there.

## FAQ

**Why do slow engines get a higher limit?**
Longer time at high temperature in each cycle forms more thermal NOx; the n^−0.2 curve reflects that physics rather than favouring any engine type.

**What is the difference between construction date and installation date?**
Regulation 13 goes by the ship's construction (keel-laying) date; an engine installed later on an older ship follows the ship unless the installation is a major conversion.

**Does a Tier III ship always run at Tier III?**
No, only inside a NECA; outside it the engine may switch the SCR or EGR off and meet Tier II, which is why both values are shown.

**Which areas are NECAs?**
North American and United States Caribbean Sea (from 2016 for Tier III) and the Baltic Sea and North Sea (from 2021); others may follow.

**How is the certified value obtained?**
From the parent-engine test on the NOx Technical Code cycle (E2, E3, D2 or C1), recorded in the EIAPP certificate and Technical File.

**Can I estimate real emissions from this?**
Only roughly; the certified value is a certification figure at test conditions. Load, ambient temperature, fuel and engine condition change in-service NOx.

## Related calculators

- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — the CO₂ and GHG side of emissions compliance.
- [CII rating](../cii-rating/index.html) — operational carbon intensity.
- [Engine BMEP, torque and power](../engine-bmep/index.html) — the engine's rating.
- [Generator load, kVA and fuel](../generator-load/index.html) — running hours and load factor.
- [Engine power and SFOC to ISO 3046 conditions](../sfoc-iso3046-correction/index.html) — ambient effects on the same engine.
