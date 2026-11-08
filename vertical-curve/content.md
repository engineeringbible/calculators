# Vertical curve calculator (crest and sag)

**Summary:** Parabolic vertical curve: PVC, PVI and PVT stations and elevations, elevation at any station, high or low point, K value and AASHTO sight distance.

## Introduction

A vertical curve joins two road grades with a parabola so the change of slope is smooth. It starts at the PVC, bends about the PVI where the two grades meet, and ends at the PVT. The elevation at any point is the tangent elevation plus a parabolic offset. A 600 ft crest curve from a +3 % grade to a −2 % grade, with its PVI at 25+00 and elevation 500.00 ft, peaks at station 25+60 at 496.40 ft.

This calculator gives the PVC and PVT stations and elevations, the elevation and grade at any station, the high or low point and the K value. It also checks the stopping sight distance the curve provides against the AASHTO value for a design speed, and lists the elevations at regular stations. It is for highway and site engineers, surveyors setting out grades, and students of route design.

## Formulas

Elevation at a distance x from the PVC on a curve of length L:

    y = y_PVC + g1 x + (g2 − g1) x² / (2L)
    y_PVC = y_PVI − g1 L/2,    y_PVT = y_PVI + g2 L/2

High or low point and the K value:

    x_turn = −g1 L / (g2 − g1)
    A = |g2 − g1| in %,    K = L / A

AASHTO sight distance S provided, in feet (metric constants in brackets):

    crest, S < L:  L = A S² / 2158  [658]       S > L:  L = 2S − 2158/A  [658]
    sag,   S < L:  L = A S² / (400 + 3.5 S)  [120 + 3.5 S]
    stopping sight distance needed = 1.47 V t + 1.075 V²/a,  t = 2.5 s, a = 11.2 ft/s²

- g1, g2 — grades in and out, as decimals in the elevation formula
- Stations increase in the direction of travel; 25+60 means 2 560 ft
- V — design speed in mph; the metric form is 0.278 V t + 0.039 V²/a with V in km/h and a = 3.4 m/s²

## Assumptions and limitations

- The curve is an equal-tangent parabola with half its length each side of the PVI. Unsymmetrical curves are not covered.
- The crest check uses AASHTO's 3.5 ft eye height and 2.0 ft object. The sag check uses the headlight criterion, a 2.0 ft headlight with a 1° upward beam.
- The stopping sight distance is for level ground. Steep downgrades need longer distances. Sag curves also get a warning when they are shorter than the comfort length A V²/46.5.
- Elevations outside the curve are on the tangents.

## Worked example

A crest curve joins a +3 % grade to a −2 % grade. The PVI is at station 25+00, elevation 500.00 ft, and the curve is 600 ft long. The design speed is 50 mph.

1. PVC: 25+00 − 300 = 22+00, at 500 − 0.03 × 300 = 491.00 ft. PVT: 28+00, at 500 − 0.02 × 300 = 494.00 ft.
2. At station 24+00, x = 200 ft: y = 491 + 0.03 × 200 − 0.05 × 200² / 1 200 = 495.33 ft.
3. High point: x = 0.03 × 600 / 0.05 = 360 ft, station 25+60, elevation 491 + 10.8 − 5.4 = 496.40 ft.
4. A = 5 %, so K = 600 / 5 = 120.0 ft.
5. Sight distance: 2158 / 5 = 431.6 ft is less than L, so S < L and S = √(600 × 2158 / 5) = 508.9 ft.
6. Needed at 50 mph: 1.47 × 50 × 2.5 + 1.075 × 50² / 11.2 = 423.7 ft. The curve is adequate.

## FAQ

**What are PVC, PVI and PVT?**
The point of vertical curvature where the curve starts, the point of vertical intersection where the two grades meet, and the point of vertical tangency where it ends.

**What is the K value of a vertical curve?**
The horizontal length needed for a 1 % change of grade, K = L / A. AASHTO tabulates minimum K values by design speed, for example 84 for a crest and 96 for a sag at 50 mph.

**Why use a parabola instead of a circular arc?**
A parabola changes grade at a constant rate per station. Its offsets from the tangent are easy to compute and set out.

**How do I find the high point of a crest curve?**
It lies where the grade is zero, at x = −g1 L / (g2 − g1) from the PVC. It exists only when the grades have opposite signs.

**What is the difference between crest and sag curves?**
On a crest the grade decreases and sight distance is limited by the hill. On a sag the grade increases and, at night, by how far the headlights reach.

**How is station 25+60 read?**
25 full stations of 100 ft plus 60 ft, so 2 560 ft from the start of the project. Metric stations count kilometres, such as 1+250.000.

## Related calculators

- [Slope calculator](../slope/index.html) — grade between two points in percent and degrees.
- [Earthwork volume](../earthwork-volume/index.html) — cut and fill along the road.
- [Closed traverse calculator](../traverse/index.html) — horizontal control for the alignment.
- [Latitude/longitude to UTM converter](../latlon-utm/index.html) — grid coordinates for the survey.
