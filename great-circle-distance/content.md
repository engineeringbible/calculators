# Great-circle and rhumb-line distance calculator

**Summary:** Great-circle distance, initial and final courses, vertex and midpoint, rhumb-line distance and course, WGS-84 geodesic and passage time.

## Introduction

Between two positions on the Earth there are two tracks a navigator cares about. The great circle is the shortest path, but its true course changes continuously. The rhumb line (loxodrome) keeps a constant course, which is what a ship actually steers between waypoints, but it is longer, markedly so at high latitudes over long east–west distances. This calculator gives both: the great-circle distance with its initial and final courses, the vertex (highest latitude reached) and midpoint, the rhumb-line distance and course, and the saving. It also computes the true geodesic on the WGS-84 ellipsoid with Vincenty's method, the figure a GPS or ECDIS reports, and the passage time at a given speed.

It serves deck officers planning ocean passages, voyage estimators checking distances between ports, performance analysts converting noon positions to distance run, and cadets working the sailings for their certificates.

## Formulas

Great circle on a sphere of radius R (φ latitude, λ longitude, Δλ = λ₂ − λ₁ normalised to ±180°):

    haversine: a = sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2),   σ = 2 atan2(√a, √(1−a))
    D_gc = R σ
    Initial course  C₁ = atan2( sin Δλ cos φ₂ , cos φ₁ sin φ₂ − sin φ₁ cos φ₂ cos Δλ )
    Final course    C₂ = atan2( sin Δλ cos φ₁ , −cos φ₂ sin φ₁ + sin φ₂ cos φ₁ cos Δλ )

On the nautical sphere 1 minute of arc = 1 nautical mile, so D_gc [nmi] = 60 × σ [degrees]; R = 3 437.747 nmi. The IUGG mean radius (6 371.0088 km) gives distances 0.07 % longer.

Vertex and midpoint (vector method): with r₁, r₂ the unit position vectors, n = r₁ × r₂ is the pole of the great circle; the vertex is the unit vector in the direction of ẑ − (ẑ·n̂) n̂, and the midpoint is the direction of r₁ + r₂. The vertex lies on the passage when the arcs r₁→v and v→r₂ add up to r₁→r₂. Equivalent classical form: cos φ_vertex = cos φ₁ |sin C₁|.

Rhumb line (Mercator sailing):

    Δψ = ln[ tan(π/4 + φ₂/2) / tan(π/4 + φ₁/2) ]        meridional-parts difference (radians)
    q  = Δφ / Δψ   (q = cos φ₁ when Δψ ≈ 0, i.e. parallel sailing)
    D_rl = R √(Δφ² + q² Δλ²),     C_rl = atan2(Δλ, Δψ)

WGS-84 geodesic: Vincenty's inverse formulae (a = 6 378 137 m, f = 1/298.257223563), iterated to 10⁻¹² rad.

Passage time: t = D / V.

## Assumptions and limitations

- Spherical Earth for the sailings; the geodesic output shows the ellipsoidal difference (up to about 0.5 %). Use the nautical sphere to reproduce Bowditch and the sailing tables; use the geodesic to compare with GPS.
- Courses are true. Apply variation and deviation yourself, and remember that current and leeway make course to steer differ from course made good.
- The rhumb line is undefined at the poles and is computed only within ±89.9° latitude.
- Vincenty's inverse method may fail to converge for nearly antipodal points; the calculator then shows the spherical distance with a warning.
- No account is taken of land, traffic separation schemes, ice limits or weather. A real great-circle passage is sailed as a series of rhumb-line legs between waypoints along the great circle, slightly longer than the pure great circle.
- Distances are between the two positions only; for a multi-leg passage sum the legs.

## Worked example

From 60°N 000° to 60°N 090°E (an exaggerated east–west passage that shows the difference clearly).

1. Rhumb line: along the parallel, departure = 90° × 60 × cos 60° = 2 700 nmi on a constant course of 090°.
2. Great circle: cos D = sin 60° sin 60° + cos 60° cos 60° cos 90° = 0.75, so D = 41.41° = 2 484.6 nmi: a saving of 215 nmi (8 %).
3. Initial course: atan2(sin 90° cos 60°, cos 60° sin 60° − 0) = atan2(0.5, 0.433) = 049.1°; the final course is 130.9° by symmetry. The ship leaves heading north-east and arrives heading south-east.
4. Vertex: cos φ_v = cos 60° × sin 49.1° = 0.378 → φ_v = 67.8°N at 045°E, which is also the midpoint. Ice and weather at 68°N are the price of the shorter route, which is why real tracks are often "composite" great circles limited to a maximum latitude.
5. At 14 knots the great circle takes 177.5 h (7.4 days), the rhumb line 192.9 h.

New York to London (40.7°N 74.0°W → 51.5°N 0.1°W): great circle 3 007 nmi, initial course 051°, final 108°, vertex 53.8°N at 23.1°W; rhumb line 3 128 nmi at a constant 078°, 3.9 % longer; WGS-84 geodesic 3 017 nmi (5 588 km).

## FAQ

**Which distance should I use for voyage estimates?**
The rhumb-line distance between waypoints of the intended route, which is what the ship will sail. Great-circle distance is the theoretical minimum; port-to-port distance tables are based on practical routes and are longer than both.

**Why does the great-circle course change?**
Because the great circle crosses successive meridians at different angles. Only the equator and the meridians are great circles with constant course.

**What is the vertex and why does it matter?**
The point of highest latitude on the great circle. On a long east–west passage it tells you how far towards the pole the shortest route goes, and hence whether ice, weather or load-line zones make a composite track necessary.

**How different is the sphere from the real Earth?**
The WGS-84 ellipsoid is flattened by 1/298. Distances differ from the spherical ones by −0.3 % to +0.5 % depending on direction and latitude. Vincenty's method is accurate to a millimetre.

**Can I enter positions in degrees and minutes?**
Enter decimal degrees: 37°57.5′ = 37 + 57.5/60 = 37.958°. South and west are negative.

**What happens across the date line?**
Longitude differences are normalised to the shorter arc, so 170°E to 170°W is 20°, not 340°.

**Does the calculator give an ETA?**
It gives passage time. Add it to your departure time, taking time-zone changes along the route into account.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — turn the distance and speed into bunkers and cost.
- [Propeller slip and speed through water](../propeller-slip/index.html) — reconcile distance run with engine revolutions.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — arrival-window planning.
- [Engineering unit converter](../unit-converter/index.html) — nautical miles, kilometres and statute miles.
