# Polygon area from coordinates (shoelace method)

**Summary:** Area, perimeter and centroid of a lot or any polygon from its corner coordinates by the shoelace method, in m², ft², acres and hectares.

## Introduction

The area of a lot or any straight-sided figure follows directly from the coordinates of its corners. Multiply each x by the next y, subtract the next x times this y, add the results round the figure and halve the sum. This is the coordinate or shoelace method. A rectangle with corners at (0, 0), (100, 0), (100, 50) and (0, 50) ft gives 5 000 ft², or 0.115 acres.

This calculator takes a list of corner coordinates in feet, US survey feet or metres. It returns the area in m², ft², acres and hectares, the perimeter, the centroid and the direction of the corners. It warns when two edges cross. It is for surveyors, engineers, planners and landowners checking a plot from a survey plan, a traverse or GPS readings.

## Formulas

Shoelace (Gauss) formula for n corners, with corner n + 1 equal to corner 1:

    2A = Σ (x_i y_i+1 − x_i+1 y_i)
    A = |2A| / 2

Perimeter and centroid:

    P = Σ √( (x_i+1 − x_i)² + (y_i+1 − y_i)² )
    C_x = Σ (x_i + x_i+1)(x_i y_i+1 − x_i+1 y_i) / (6 A_signed)
    C_y = Σ (y_i + y_i+1)(x_i y_i+1 − x_i+1 y_i) / (6 A_signed)

- x, y — easting and northing of each corner, in order round the boundary
- A positive sum means counter-clockwise corners, a negative one clockwise
- 1 acre = 43 560 ft² = 4 046.856 m²; 1 hectare = 10 000 m²

## Assumptions and limitations

- List the corners in order round the boundary. Corners out of order make the edges cross, and the page then warns that the area is wrong.
- Edges are straight. Approximate a curved boundary by short chords, or add the segment areas of the arcs separately.
- Grid coordinates such as UTM or state plane give a grid area. For the ground area, divide by the square of the combined scale factor.
- The US survey foot is 1200/3937 m, about 2 parts per million longer than the international foot. Use it only for coordinates that were defined in it.

## Worked example

A four-sided lot has these corners in feet, as easting and northing: (5 000.000, 5 000.000), (5 125.709, 5 256.247), (5 689.251, 5 110.519) and (5 512.926, 4 705.143). They are the adjusted points of the traverse example.

1. Move the origin to the first corner to keep the numbers small; the area does not change. The corners become (0, 0), (125.709, 256.247), (689.251, 110.519) and (512.926, −294.857).
2. Cross products round the figure: 0, then 125.709 × 110.519 − 689.251 × 256.247 = −162 725.27, then −259 918.55, then 0.
3. Sum: −422 643.82. It is negative, so the corners run clockwise.
4. Area: 422 643.82 / 2 = 211 322 ft².
5. In other units: 211 322 / 43 560 = 4.851 acres, or 1.963 hectares.

The perimeter is 1 901.20 ft and the centroid lies at easting 5 351.03, northing 5 009.28 ft.

## FAQ

**How do I calculate the area of an irregular lot?**
Get the coordinates of its corners from the survey plan or a GPS. Then apply the shoelace formula, as this page does, instead of splitting the lot into triangles.

**Does it matter which corner I start with?**
No. Any starting corner and either direction give the same area. Only the sign of the sum changes with direction.

**Why is it called the shoelace formula?**
Writing the x and y columns side by side and drawing the cross-multiplications between rows looks like the lacing of a shoe.

**How many square feet are in an acre?**
43 560 ft², which is 4 046.856 m². A hectare is 10 000 m², or 2.471 acres.

**Can I use latitude and longitude?**
Not directly, because degrees are not equal lengths. Convert the points to UTM first, then use the eastings and northings in metres.

**What is the centroid used for?**
It is the centre of area of the lot. Engineers use it for the resultant of a uniform load on a slab or the label point of a parcel on a map.

## Related calculators

- [Closed traverse calculator](../traverse/index.html) — adjust the survey that gives the corners.
- [Latitude/longitude to UTM converter](../latlon-utm/index.html) — turn GPS positions into grid coordinates.
- [Earthwork volume](../earthwork-volume/index.html) — cut and fill over the lot.
- [Unit converter](../unit-converter/index.html) — other area units.
