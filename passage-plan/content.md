# Passage plan from waypoints calculator

**Summary:** Leg courses, distances, times and ETAs from a pasted waypoint list, by rhumb line or great circle, with the passage totals.

## Introduction

The waypoint list is the backbone of every passage plan: from it come the courses to steer, the distances, the time on each leg and the ETAs that the port, the charterer and the crew depend on. This calculator reads a pasted list in the formats used in ECDIS route tables and pilot books and returns a leg table with course, distance, speed, time and ETA, plus the totals by rhumb line or great circle and the distance by the other method for comparison.

It is for navigating officers preparing a passage, superintendents checking a route and cadets learning sailings.

## Formulas

    Rhumb line (Mercator sailing):
        Δψ = ln[tan(π/4 + φ₂/2) / tan(π/4 + φ₁/2)]
        q  = Δφ / Δψ   (cos φ on an east–west leg)
        d  = R √(Δφ² + q² Δλ²),   course = atan2(Δλ, Δψ)
    Great circle:
        d  = 2R asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2))
        initial course = atan2(sin Δλ cos φ₂, cos φ₁ sin φ₂ − sin φ₁ cos φ₂ cos Δλ)
    Time = d / speed;  ETA = departure + Σ time

- φ — latitude, λ — longitude in radians; R = 10 800/π nmi, so one minute of arc is one nautical mile.

## Assumptions and limitations

- Spherical earth; ellipsoidal rhumb-line distances differ by up to about 0.5 %.
- Great-circle legs show the initial course; they are steered as a series of rhumb lines.
- Speeds are over the ground; current, weather and traffic are not allowed for.
- ETAs are in a single time zone from the departure time on day 1.

## Worked example

Piraeus pilot station to the Dardanelles entrance through Kafireas Strait, five waypoints, 12 kn on the first leg and 14 kn after, departure 06:00.

1. Piraeus to Cape Sounion: 132.4°, 28.9 nmi, 2.4 h, at Sounion at 08:25.
2. Cape Sounion to Kafireas Strait: 046.0°, 41.7 nmi, 3.0 h.
3. Kafireas Strait to the south of Lemnos: 016.0°, 98.8 nmi; then 063.8°, 45.4 nmi to the Dardanelles entrance.
4. In total 214.8 nmi in 15.7 h, arriving on Day 1 at 21:41. The great-circle total differs by less than 0.01 nmi on legs this short.

## FAQ

**Which coordinate formats can I paste?**
Decimal degrees with a sign, or degrees and minutes with optional seconds, with N, S, E or W before or after: 37 55.5 N, 37°55.5′N, 37 55 30 N or 37.925.

**Where does the speed go?**
On the line of the waypoint where the leg starts. Lines without a speed use the default.

**Rhumb line or great circle?**
Rhumb lines are easier to steer and plot on a Mercator chart; great circles are shorter on long ocean legs. The page gives both totals so you can see what the choice is worth.

**Why does my ECDIS show slightly different distances?**
ECDIS works on the WGS-84 ellipsoid. On a sphere with one minute of arc equal to one nautical mile the difference is a fraction of a percent.

**Can it handle the date line?**
Yes: a leg always goes the short way round in longitude.

## Related calculators

- [Mercator sailing](../mercator-sailing/index.html) — a single rhumb-line leg on the ellipsoid.
- [Great-circle distance](../great-circle-distance/index.html) — vertex and waypoints of a great circle.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — fuel for the passage.
- [Course to steer with set and drift](../course-to-steer/index.html) — allowing for current on each leg.
