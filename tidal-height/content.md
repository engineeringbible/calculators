# Tidal height (rule of twelfths) calculator

**Summary:** Height of tide and depth at any time between high and low water by the rule of twelfths or the cosine curve, and the time a required depth becomes available.

## Introduction

Tide tables give the times and heights of high and low water; the navigator needs the height in between, and more often the time at which a required depth becomes available over a bar, a berth or a shoal. The rule of twelfths is the classic mental method: in the six hours between low and high water the tide rises one, two, three, three, two and one twelfths of the range per hour. The cosine curve is the continuous version the rule approximates. This calculator applies both, reports the height and depth at the time of interest, and inverts the curve to find when a required depth is reached on a rising tide or lost on a falling one.

It is for watchkeepers planning arrivals and departures over tidal constraints, for pilots and port planners doing quick checks, and for cadets learning tidal calculations before the Admiralty tidal-curve method.

## Formulas

Interval between two turning points (first height h₁ at time t₁, second h₂ at t₂; R = |h₂ − h₁|; D = t₂ − t₁; f = (t − t₁)/D):

Rule of twelfths (cumulative fraction of the range at the end of each sixth):

    sixth:      1      2      3      4      5      6
    cumulative: 1/12   3/12   6/12   9/12   11/12  12/12
    p(f) linear within each sixth;  h(t) = h₁ ± R p(f)

Cosine curve:

    p(f) = (1 − cos πf) / 2,          h(t) = h₁ ± R p(f)
    rate = ± π R sin(πf) / (2D)       (maximum π R / 2D at mid-tide)

Inverse (time at which a given height is reached): p = (h_req − h₁)/(±R), then f from the piecewise-linear inverse (twelfths) or f = acos(1 − 2p)/π (cosine), t = t₁ + f D.

Depth:

    depth = charted depth + height of tide
    height needed = required depth − charted depth

## Assumptions and limitations

- Regular, symmetric semidiurnal tide with a duration near 6 hours. For ports with double high waters, stands or strongly distorted curves (Southampton, Poole, many estuaries) use the Admiralty tidal curve for the standard port; the rule of twelfths can be wrong by a metre there.
- Both methods are approximations of each other and of reality: they differ from each other by up to about 1/60 of the range near the first and fifth hours; the real curve can differ more.
- No meteorological effects: a deep depression or an onshore gale can raise the sea level by several decimetres; high pressure lowers it.
- Heights are above chart datum as in the tide tables; the charted depth must be from the same datum. Negative heights (below datum) are permitted.
- Times are decimal hours in one time zone; the interval may pass midnight.
- The calculator does not read tide tables: enter the turning points from the tables (with secondary-port corrections already applied).

## Worked example

Low water 1.0 m at 02:00, high water 5.0 m at 08:18, so the range is 4.0 m over 6.3 h. A berth has 8.0 m charted depth and the ship needs 10.5 m (draft plus clearance). What is the depth at 04:30 and from when is the berth usable?

1. Elapsed at 04:30: 2.5 h of 6.3 h, f = 0.397 — in the third sixth (0.333–0.5).
2. Rule of twelfths: cumulative at the end of the second sixth 3/12; within the third sixth (3/12 → 6/12) at (0.397 − 0.333)/0.167 = 0.38 of the way → p = 0.250 + 0.38 × 0.25 = 0.345. Height 1.0 + 4 × 0.345 = 2.38 m. Cosine gives 2.36 m.
3. Depth at 04:30: 8.0 + 2.38 = 10.38 m, 0.12 m short.
4. Height needed: 10.5 − 8.0 = 2.5 m, i.e. a rise of 1.5 m = 0.375 of the range. Twelfths inverse: 0.375 lies in the third sixth, (0.375 − 0.25)/0.25 = 0.5 → f = (2 + 0.5)/6 = 0.417 → 2.63 h after LW → 04:38. Cosine: acos(1 − 0.75)/π = 0.420 → 04:39.
5. The berth is usable from about 04:38 until the ebb falls back through 2.5 m in the afternoon.

Falling tide the same afternoon (HW 5.0 m 08:18 → LW 1.0 m 14:36): the required 2.5 m height is lost at 0.625 of the fall, 3.5/6 of 6.3 h = 3.68 h after HW, about 11:59.

## FAQ

**Which method should I use?**
The cosine curve is slightly closer to a pure semidiurnal tide; the rule of twelfths is easier to do in your head and is what most examiners expect. Both are shown. Where the port has an Admiralty tidal curve, use it instead.

**Why does the calculator want decimal hours?**
To keep the arithmetic unambiguous: 14:30 is 14.5, 08:18 is 8.3. Results are also given as HH:MM.

**Can I use it for a spring or neap range directly?**
Yes, enter the actual predicted heights for the day. The rule applies to any range; what matters is that the duration is close to six hours.

**What about secondary ports?**
Apply the time and height differences from the tide tables to the standard-port predictions first, then enter the corrected turning points here.

**How accurate is the result?**
For a regular tide, within 0.1–0.2 m and 10–15 minutes. The weather and the port's true curve shape are the dominant errors, so keep a margin.

**What is a stand?**
A period around high or low water when the level hardly changes; some ports have long stands or double high waters. The rule of twelfths does not model them.

**How do I combine this with squat?**
Add the squat and allowances to the draft to get the required depth, then use this calculator for the time window; the ship squat calculator gives the squat for the planned speed.

## Related calculators

- [Ship squat and under-keel clearance](../ship-squat/index.html) — the depth you actually need under way.
- [Great-circle and rhumb-line distance](../great-circle-distance/index.html) — passage time to the tidal gate.
- [Hydrostatics basics](../hydrostatics/index.html) — draft changes with loading and water density.
- [Draft survey](../draft-survey/index.html) — the actual drafts for the tidal window.
