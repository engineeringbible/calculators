# Mercator (rhumb-line) sailing calculator

**Summary:** Rhumb-line course and distance from meridional parts (sphere or WGS84), departure, great-circle comparison and passage time.

## Introduction

A rhumb line crosses every meridian at the same angle, which is why it is the course a ship actually steers and a straight line on a Mercator chart. Finding it between two positions is the oldest problem of navigation: stretch the latitude scale into meridional parts, take the longitude difference over the difference of meridional parts for the course, and the latitude difference over the cosine of the course for the distance. This calculator does that on the sphere or the WGS84 ellipsoid, reports the course in true and quadrantal form, the departure and distance, and sets the great-circle distance beside it so the saving of a great-circle or composite route is visible.

It is for navigators and voyage planners, performance analysts computing noon-to-noon distances and courses made good, and students of navigation.

## Formulas

    MP(φ) = (10800/π) [ln tan(45° + φ/2) − e² sin φ − e⁴ sin³φ/3 − e⁶ sin⁵φ/5]    minutes; e = 0 on the sphere
    DMP = MP₂ − MP₁,   DLo = λ₂ − λ₁ (shorter way, in minutes),   DLat = φ₂ − φ₁ (minutes)
    tan C = DLo / DMP
    departure = DLo × DLat/DMP  (parallel: DLo cos φ),   D = √(DLat² + departure²) = DLat / cos C
    great circle (haversine, same 1′ = 1 nmi basis) for comparison

Sphere: MP = 7915.7045 log₁₀ tan(45° + φ/2). WGS84: leading correction 23.0134 sin φ.

## Assumptions and limitations

- One minute of latitude = one nautical mile for the distance (±0.5 % against the ellipsoidal meridian); the ellipsoidal course is exact.
- No pole crossing (positions within 0.1° of a pole rejected); parallel-sailing form near east–west courses.
- Positions only: current, leeway and compass error are handled by the course-to-steer calculator.

## Worked example

Piraeus (37° 56.25′ N, 23° 38.25′ E) to Port Said (31° 15′ N, 32° 18′ E), spherical meridional parts, 12 kn.

1. DLat = −401.25′ (south), DLo = +519.75′ (east).
2. MP₁ = 2 463.5′, MP₂ = 1 975.5′ → DMP = −488.0′.
3. tan C = 519.75/−488.0 → C = 133.2° true (S 46.8° E).
4. Departure 427.4 nmi; distance √(401.25² + 427.4²) = 586.2 nmi; great circle 586.0 nmi (saving 0.03 %, negligible on a Mediterranean leg); 48.9 h at 12 kn.

With WGS84 meridional parts the course moves by 0.13°. New York to the Lizard (40 N 74 W → 50 N 5 W) is 2 977 nmi by rhumb line at 078.4° against 2 881 by great circle: there the 3.2 % saving is worth the course changes.

## FAQ

**Why meridional parts?**
On a Mercator chart the meridians are parallel, so latitude must be stretched by the same factor as longitude at each latitude (sec φ); the meridional part is that stretched latitude integrated from the equator.

**Sphere or WGS84?**
WGS84 matches chart-plotting tables and GPS; the sphere is what most hand formulas use. The difference is about a tenth of a degree in course on a diagonal leg, nil on meridians and parallels.

**Why does the distance use 1′ = 1 nmi?**
By definition of the nautical mile in navigation practice; the true meridian minute varies 1 843–1 862 m on the ellipsoid, within half a per cent.

**When should I use a great circle instead?**
On long east–west legs in high latitudes; the comparison output shows the saving. Below about 1 % the rhumb line's single course is usually preferred.

**How does this relate to noon reports?**
The course and distance made good between consecutive noon positions are exactly this calculation; the production navigation module uses the spherical form with a 3 440.065 nmi radius, 0.07 % longer than the 1′ = 1 nmi convention.

**What about crossing the dateline?**
The longitude difference is taken the shorter way round, so 170° E to 170° W is 20°, not 340°.

## Related calculators

- [Great-circle distance and initial course](../great-circle-distance/index.html) — the shortest route.
- [Course to steer with set and drift](../course-to-steer/index.html) — allowing for current and leeway on the leg.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — fuel for the distance.
- [Optimal speed under charter](../optimal-speed-charter/index.html) — the speed to run the leg.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — port arrival windows.
