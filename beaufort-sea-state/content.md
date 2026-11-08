# Beaufort, wind speed and sea state converter

**Summary:** Convert between Beaufort force, wind speed, probable wave height and Douglas sea state using the WMO tables.

## Introduction

Weather reaches a ship in three languages: the Beaufort force in the deck log and the forecast, the wind speed in knots or metres per second from the anemometer and the routing service, and the Douglas sea state or significant wave height in the hindcast and the charter party. This converter moves between all four from whichever one you have, using the World Meteorological Organization code tables rather than anyone's rule of thumb.

It is for watch officers filling in the log, cadets learning the scale, performance analysts matching noon reports to weather data, and charterers and owners checking "good weather" clauses that are written in Beaufort and Douglas numbers.

## Formulas and tables

Beaufort force from wind speed (WMO code table 1100, 10-minute mean at 10 m height):

| Force | Description | Wind, kn | Probable wave, m | Max wave, m |
|---|---|---|---|---|
| 0 | Calm | < 1 | 0 | 0 |
| 1 | Light air | 1–3 | 0.1 | 0.1 |
| 2 | Light breeze | 4–6 | 0.2 | 0.3 |
| 3 | Gentle breeze | 7–10 | 0.6 | 1.0 |
| 4 | Moderate breeze | 11–16 | 1.0 | 1.5 |
| 5 | Fresh breeze | 17–21 | 2.0 | 2.5 |
| 6 | Strong breeze | 22–27 | 3.0 | 4.0 |
| 7 | Near gale | 28–33 | 4.0 | 5.5 |
| 8 | Gale | 34–40 | 5.5 | 7.5 |
| 9 | Strong gale | 41–47 | 7.0 | 10.0 |
| 10 | Storm | 48–55 | 9.0 | 12.5 |
| 11 | Violent storm | 56–63 | 11.5 | 16.0 |
| 12 | Hurricane force | ≥ 64 | 14+ | – |

A wind speed is classified by rounding it to the nearest knot and reading the row. The "typical" speed of a force is the WMO empirical relation

    v [m/s] = 0.836 × B^1.5

- B — Beaufort force
- v — equivalent mean wind speed at 10 m

Douglas sea state from significant wave height (WMO code table 3700):

| Code | Description | H_s, m |
|---|---|---|
| 0 | Calm (glassy) | 0 |
| 1 | Calm (rippled) | 0–0.1 |
| 2 | Smooth (wavelets) | 0.1–0.5 |
| 3 | Slight | 0.5–1.25 |
| 4 | Moderate | 1.25–2.5 |
| 5 | Rough | 2.5–4 |
| 6 | Very rough | 4–6 |
| 7 | High | 6–9 |
| 8 | Very high | 9–14 |
| 9 | Phenomenal | > 14 |

Unit relations: 1 kn = 1852/3600 m/s = 0.5144 m/s; 1 m/s = 3.6 km/h = 1.944 kn.

## Assumptions and limitations

- The Beaufort knot bounds are the official definition. The WMO m/s column (0.3–1.5, 1.6–3.3, …) is a rounded equivalent and does not match the knot bounds exactly at every boundary; this converter classifies on knots.
- Wave heights against Beaufort assume a fully developed sea in open water, far from land, with no swell. Short fetch, limited duration or a cross swell change the real wave height by a factor of two either way. Treat the wave outputs as indicative.
- Going from wave height or sea state back to wind picks the Beaufort row with the nearest probable height. It is a plausibility check, not a measurement.
- Sea state is defined on significant wave height H_s (mean of the highest third). Individual waves reach about 1.9 × H_s in a long record; the "maximum" column is the WMO guidance figure, not a statistical extreme.
- Ship anemometers read at 30–50 m above the sea and include the ship's own motion. Correct to 10 m height and true wind before comparing with the scale.

## Worked example

The forecast gives Beaufort 6.

1. Row 6: "Strong breeze", 22–27 knots.
2. Typical speed: 0.836 × 6^1.5 = 0.836 × 14.70 = 12.3 m/s = 23.9 knots, inside the band.
3. Probable wave height 3.0 m, maximum about 4.0 m.
4. 3.0 m falls in the Douglas range 2.5–4 m: sea state 5, "Rough".

Working the other way, the anemometer shows 12.35 m/s true wind at 10 m: 12.35 / 0.5144 = 24.0 knots, which lies in 22–27, so force 6 again.

## FAQ

**Which wind speed does the scale refer to?**
The 10-minute mean true wind at 10 m above the surface. Gusts are typically 1.3–1.5 times the mean and must not be used to pick the force.

**Why do different tables give slightly different m/s ranges?**
The scale was defined in knots. Metre-per-second tables round the converted bounds, and some national services round differently. The knot column is the reference.

**Is sea state the same as Beaufort force?**
No. Beaufort describes the wind; Douglas describes the sea. They are often correlated at sea but differ with fetch, duration and swell. Charter parties should name which one they mean.

**What is significant wave height?**
The average height of the highest one-third of waves in a record, which matches what an experienced observer reports by eye. Forecasts and hindcasts give H_s; the Douglas code is defined on it.

**How do I report wind in the log?**
Most companies log Beaufort force and true direction. Use the force from the mean wind, not from the gusts, and note the sea and swell separately.

**Does the scale go above 12?**
Some services use 13–17 for tropical cyclones, but the WMO scale and most logs stop at 12 ("hurricane force", ≥ 64 kn). Hurricane categories are a different scale based on 1-minute sustained winds.

**Can I convert to km/h or mph?**
Yes. Every wind-speed output has a unit menu; the conversion factors are exact definitions.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — add a weather margin for the forecast sea state.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — wave allowance in shallow water.
- [Anchor cable catenary and scope](../anchor-catenary/index.html) — wind force on the anchored ship.
- [Engineering unit converter](../unit-converter/index.html) — knots, m/s, km/h and mph.
