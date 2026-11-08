# Deflection limits calculator (L/360, L/240)

**Summary:** Allowable deflection of floors, roofs, walls and cantilevers (L/360, L/240, L/180) by IBC Table 1604.3 and Eurocode, checked against your deflection.

## Introduction

Building codes limit how far beams, joists and roof members may sag, so that ceilings do not crack and floors do not feel soft. The limit is a fraction of the span, written L/360 or L/240. A floor joist spanning 14 ft may deflect 168 / 360 = 0.47 in under live load and 168 / 240 = 0.70 in under dead plus live load, by IBC Table 1604.3.

This calculator lists every deflection limit for a member under the IBC, the UK National Annex for steel, Eurocode 2 for concrete or Eurocode 5 for timber. It handles cantilevers and compares your computed deflections with each limit. It is for engineers, builders and students checking a beam or joist after computing its deflection.

## Formulas

Allowable deflection and utilisation:

    Δ_allow = l / n
    utilisation = Δ_actual / Δ_allow
    span ratio = l / Δ_actual

IBC Table 1604.3, main rows (live L, snow or wind S or W, dead plus live D + L):

    floor members                     L/360          —        L/240
    roof, plaster or stucco ceiling   L/360        L/360      L/240
    roof, non-plaster ceiling         L/240        L/240      L/180
    roof, no ceiling                  L/180        L/180      L/120

- l — span; for IBC cantilevers, twice the cantilever length
- UK NA steel: span/360 with brittle finishes, span/200 for other beams, length/180 for cantilevers
- EN 1992 concrete: span/250 for sag, span/500 after the finishes are built
- EN 1995 timber: w_inst l/300 to l/500, w_net,fin l/250 to l/350, w_fin l/150 to l/300

## Assumptions and limitations

- Each limit applies to the deflection under the loads its column names. Compute those deflections first, for example with the beam deflection calculator.
- Under the IBC, the D + L check may use half the dead load for dry wood, and zero dead load for steel members. Wind for these checks may be taken as 0.42 times the component and cladding loads.
- The UK steel limits apply to variable actions alone. Eurocode 5 gives ranges, and the national annex picks the value; choose the lenient or strict end.
- Deflection limits do not ensure a floor will not bounce or a flat roof will not pond. Those need vibration and ponding checks.

## Worked example

A floor joist spans 14 ft. Its computed deflections are 0.35 in under live load and 0.55 in under dead plus live load. Check it to IBC Table 1604.3.

1. Span in inches: 14 × 12 = 168 in.
2. Live-load limit: 168 / 360 = 0.47 in. The joist uses 0.35 / 0.467 = 75.0 % of it.
3. Total-load limit: 168 / 240 = 0.70 in. The joist uses 0.55 / 0.70 = 78.6 % of it.
4. The live-load deflection is span / 480, better than the required span / 360.

The joist passes both checks. As a 6 ft roof cantilever with no ceiling, the same member would be checked over 12 ft, at L/180 = 0.80 in.

## FAQ

**What does L/360 mean?**
The deflection may not exceed the span divided by 360. For a 20 ft span that is 240 / 360 = 0.67 in.

**When is L/240 used instead of L/360?**
L/360 limits live-load deflection of floors and of roofs with plaster ceilings. L/240 limits total dead plus live deflection of floors, and live-load deflection of roofs with other ceilings.

**How are cantilevers treated?**
The IBC checks a cantilever as if its span were twice its length. The UK steel annex uses length/180, and Eurocode 5 has its own cantilever limits.

**Is L/360 enough for tile or stone floors?**
Not always. Tile and stone floors often need a stiffer limit than the code minimum. Check the setting standard and the finish manufacturer's requirement.

**Do deflection limits include creep?**
The IBC D + L limit applies to the long-term deflection. For wood it may use half the dead load when the wood is dry at installation. Eurocodes 2 and 5 include creep in their final deflections.

**Are deflection limits a safety requirement?**
They are serviceability limits. Exceeding them cracks finishes and alarms occupants, but strength is checked separately.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — compute the actual deflection.
- [Joist span calculator](../joist-span/index.html) — the longest joist that meets the limits.
- [Load combinations](../load-combinations/index.html) — which loads act together.
- [Snow load](../snow-load/index.html) — the S load for roof members.
