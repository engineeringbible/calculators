# Latitude/longitude to UTM converter (WGS84)

**Summary:** Convert WGS84 latitude and longitude to UTM zone, easting and northing and back, to well under a millimetre, with grid convergence and scale factor.

## Introduction

UTM (Universal Transverse Mercator) divides the world into 60 zones, each 6° of longitude wide. Inside a zone, a position is given in metres east and north on a flat grid instead of in degrees. The Eiffel Tower, at 48.8582° N and 2.2945° E, lies in zone 31U at easting 448 251.795 m and northing 5 411 932.678 m.

This calculator converts WGS84 latitude and longitude to UTM coordinates and back. It also gives the grid convergence and the point scale factor, which surveyors need to turn grid bearings and distances into true ones. It uses the sixth-order Krüger series of Karney (2011), the method NGA recommends, so it is good to a few nanometres in the zone. It is for surveyors, GIS users, engineers and anyone moving coordinates between a GPS and a site plan.

## Formulas

Ellipsoid and series constants (WGS84, a = 6 378 137 m, f = 1/298.257223563):

    n = f / (2 − f),    e² = f (2 − f)
    A = a / (1 + n) × (1 + n²/4 + n⁴/64 + n⁶/256)

Forward, with λ the longitude from the zone's central meridian:

    τ = tan φ,   σ = sinh(e atanh(e τ / √(1 + τ²)))
    τ′ = τ √(1 + σ²) − σ √(1 + τ²)
    ξ′ = atan2(τ′, cos λ),    η′ = asinh(sin λ / √(τ′² + cos² λ))
    ξ = ξ′ + Σ α_j sin(2jξ′) cosh(2jη′),    η = η′ + Σ α_j cos(2jξ′) sinh(2jη′)
    E = 500 000 + k₀ A η,    N = k₀ A ξ  (+ 10 000 000 south of the equator)

Inverse: the same series with the β_j coefficients, then φ from τ′ by Newton's method.

- φ — latitude; λ — longitude difference; k₀ = 0.9996 — scale on the central meridian
- α_j, β_j — Krüger coefficients, polynomials in n up to n⁶ (Karney 2011)
- Zone = floor((longitude + 180°) / 6°) + 1, with the Norway and Svalbard exceptions

## Assumptions and limitations

- The coordinates are on WGS84. A position from an old map datum such as NAD27 or ED50 must be transformed first, as the shift can exceed 100 m.
- The series is exact to a few nanometres within a zone. It stays far better than a millimetre when you force a neighbouring zone, up to 9° from the central meridian.
- UTM covers 80° S to 84° N. Polar positions use the Universal Polar Stereographic grid, which this page does not compute.
- Southern northings include the 10 000 000 m false northing, and every easting includes the 500 000 m false easting.

## Worked example

Convert the Eiffel Tower, 48.8582° N and 2.2945° E, to UTM.

1. Zone: floor((2.2945 + 180) / 6) + 1 = 31. Its central meridian is 3° E, so the point lies 0.7055° west of it.
2. Latitude band: 48.8582° falls in the 48° to 56° band, letter U. The zone is 31U, northern hemisphere.
3. The Krüger series gives easting 448 251.795 m and northing 5 411 932.678 m.
4. Grid convergence is −0.531°: grid north lies about half a degree west of true north here.
5. The point scale factor is 0.9996329. A 1 000 m ground distance measures 999.633 m on the grid.

Converting back from 31 N 448 251.795 5 411 932.678 gives 48°51′29.520″ N, 2°17′40.200″ E.

## FAQ

**What is a UTM zone?**
A strip of the Earth 6° of longitude wide, numbered 1 to 60 eastwards from 180° W. Each zone has its own central meridian and its own flat grid.

**What does the letter after the zone number mean?**
It is the latitude band, 8° tall, lettered C to X from 80° S northwards. It tells you the hemisphere: N and above is north.

**Why is the easting 500 000 m on the central meridian?**
The 500 000 m false easting keeps every easting positive. A point west of the central meridian has an easting below 500 000 m.

**What is the scale factor?**
The ratio of grid distance to ground distance on the ellipsoid. It is 0.9996 on the central meridian, 1 about 180 km either side, and about 1.0010 at the zone edge on the equator.

**What is grid convergence?**
The angle between grid north and true north at a point. It is zero on the central meridian and grows towards the zone edges and towards the poles.

**Can I use a coordinate in the wrong zone?**
Yes, for a site that straddles a zone boundary. Force the zone and the page computes up to 9° from its central meridian, with larger scale errors.

**Is WGS84 the same as NAD83 or ETRS89?**
They differ by about 1 to 2 m today. For work at that level, transform between them first.

## Related calculators

- [Closed traverse calculator](../traverse/index.html) — adjust a traverse on the grid.
- [Polygon area from coordinates](../area-coordinates/index.html) — area of a parcel from its UTM corners.
- [Great-circle and rhumb-line distance](../great-circle-distance/index.html) — distances between two latitude/longitude positions.
- [Unit converter](../unit-converter/index.html) — feet, metres and other units.
