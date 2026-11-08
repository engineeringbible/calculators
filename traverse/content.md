# Closed traverse calculator (compass rule)

**Summary:** Latitudes and departures of a closed traverse from bearings and distances, misclosure, precision ratio, Bowditch adjustment and adjusted coordinates.

## Introduction

A closed traverse is a chain of survey lines that returns to its starting point. Each line has a direction and a length, so it moves north or south by its latitude and east or west by its departure. On a perfect loop both sums are zero. In the field they never are: a four-leg traverse of 1 901 ft might miss closing by 0.08 ft, a precision of about 1 : 23 000.

This calculator takes the legs as bearings or azimuths with distances. It computes the latitudes and departures, the misclosure and the precision ratio. It then distributes the error by the compass rule and lists the adjusted coordinates and the enclosed area. It is for land surveyors, engineering students and anyone checking a boundary or control traverse.

## Formulas

Latitude and departure of each leg, with the azimuth Az measured clockwise from north:

    Lat = L × cos Az,    Dep = L × sin Az

Misclosure and precision:

    e = √( (ΣLat)² + (ΣDep)² )
    precision = 1 : (ΣL / e)

Compass (Bowditch) rule corrections for leg i:

    C_lat,i = −ΣLat × L_i / ΣL,    C_dep,i = −ΣDep × L_i / ΣL
    N_i+1 = N_i + Lat_i + C_lat,i,    E_i+1 = E_i + Dep_i + C_dep,i

- L — horizontal length of a leg; ΣL — total length of the traverse
- A bearing such as S 75°30′ E is the azimuth 180° − 75°30′ = 104°30′
- The area of the adjusted polygon comes from the coordinate (shoelace) formula

## Assumptions and limitations

- The loop must return to its starting point, and the angles must already be balanced. Distribute the angular misclosure before you enter the bearings.
- The compass rule spreads the error in proportion to leg length. It suits work where angles and distances have similar precision. Least squares is the rigorous method.
- All distances must be horizontal and in the same unit. The coordinates and the area come out in that unit.
- A misclosure above 1 % of the length is refused. That size of error means a missing, reversed or mistyped leg, not field error.

## Worked example

A four-sided lot is traversed from point 1 at N 5 000.00, E 5 000.00 ft. The legs are N 26°08′ E 285.43 ft, S 75°30′10″ E 582.10 ft, S 23°30′20″ W 442.05 ft and N 60°06′20″ W 591.62 ft.

1. Total length: 285.43 + 582.10 + 442.05 + 591.62 = 1 901.20 ft.
2. Leg 1: latitude 285.43 × cos 26°08′ = 256.251 ft, departure 285.43 × sin 26°08′ = 125.721 ft. The other legs follow the same way.
3. Sums: ΣLat = +0.028 ft and ΣDep = +0.078 ft.
4. Linear misclosure: √(0.028² + 0.078²) = 0.083 ft. Precision: 1 901.20 / 0.08332 = 22 818, so 1 : 22 818.
5. Compass rule for leg 1: latitude correction −0.028 × 285.43 / 1 901.20 = −0.004 ft, departure correction −0.012 ft.
6. Adjusted point 2: N 5 256.247, E 5 125.709 ft. The last leg lands exactly on point 1.

The adjusted lot encloses 211 322 ft², or 4.851 acres.

## FAQ

**What are latitude and departure?**
The north–south and east–west components of a survey line. North and east are positive, south and west negative.

**What is the precision of a traverse?**
The total length divided by the linear misclosure, written as 1 : N. A larger N means a better survey. The value required comes from the survey standard or the contract.

**What is the compass rule?**
A way to distribute a traverse's misclosure. Each leg's latitude and departure are corrected in proportion to its length, so long legs take more of the error.

**What is the difference between the compass rule and the transit rule?**
The transit rule distributes the error in proportion to each latitude and departure rather than each length. It assumes the angles are more precise than the distances.

**How do I enter an azimuth instead of a bearing?**
Type the angle from north, clockwise, with no letters, such as 104.5 or 104°30′. Bearings need N or S in front and E or W at the end.

**Why must the angles be balanced first?**
The sum of the interior angles of a closed traverse must equal (n − 2) × 180°. Distribute that angular error first, then compute the bearings.

## Related calculators

- [Polygon area from coordinates](../area-coordinates/index.html) — area, perimeter and centroid of the adjusted points.
- [Latitude/longitude to UTM converter](../latlon-utm/index.html) — put the traverse on a map grid.
- [Slope calculator](../slope/index.html) — grades between surveyed points.
- [Earthwork volume](../earthwork-volume/index.html) — cut and fill on the surveyed site.
