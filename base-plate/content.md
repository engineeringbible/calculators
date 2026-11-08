# Column base plate calculator (AISC Design Guide 1)

**Summary:** Size a steel column base plate for a concentric axial load by AISC Design Guide 1 (LRFD): bearing area, plate N × B, cantilevers and required thickness.

## Introduction

A base plate spreads a steel column's load over the concrete below. It must be large enough for the concrete to take the bearing pressure, and thick enough not to bend where it overhangs the column. For a W12×96 column carrying 700 kips on 3 ksi concrete, AISC Design Guide 1 gives a 22 × 20 in plate, 1.60 in thick in A36 steel.

This calculator follows the Design Guide 1 procedure for a concentric axial load in LRFD. It finds the required bearing area, sizes the plate with the Guide's near-optimum rule, checks bearing with the confinement of a larger pedestal or footing, and computes the cantilevers m, n and λn' and the required thickness. It is for structural engineers, detailers and students designing column bases.

## Formulas

Bearing on concrete (AISC 360-16 J8), with φc = 0.65:

    φc Pp = φc × 0.85 f'c A1 √(A2/A1) ≤ φc × 1.7 f'c A1
    A1,req = Pu / (φc 0.85 f'c)        when A2 = A1

Plate dimensions:

    Δ = (0.95 d − 0.8 bf) / 2,   N ≈ √A1,req + Δ,   B = A1,req / N

Cantilevers and thickness, with φ = 0.90:

    m = (N − 0.95 d)/2,   n = (B − 0.8 bf)/2
    X = 4 d bf / (d + bf)² × Pu / (φc Pp),   λ = 2√X / (1 + √(1 − X)) ≤ 1
    λn' = λ √(d bf) / 4,   l = max(m, n, λn')
    t_min = l √( 2 Pu / (0.9 Fy B N) )

- Pu — factored axial load; d, bf — column depth and flange width
- A1 — plate area; A2 — the largest concrete area similar to and concentric with the plate
- f'c — concrete strength; Fy — plate yield strength

## Assumptions and limitations

- The load is a concentric compression on a wide-flange column. Moments, uplift, shear and anchor rods need the other parts of Design Guide 1.
- Pu must come from the LRFD load combinations. Allowable stress design uses different factors and is not covered.
- The plate is rounded up to whole inches or 10 mm, then checked again. A pedestal that is not the same shape as the plate can need a slightly larger plate, which the page finds.
- Grout, pedestal reinforcement and the weld between column and plate are not designed here.

## Worked example

This is Design Guide 1, Example 4.1. A W12×96 column (d = 12.7 in, bf = 12.2 in) carries Pu = 700 kips. The plate covers the whole concrete support, so A2 = A1. f'c = 3 ksi and the plate is A36.

1. Required area: 700 / (0.65 × 0.85 × 3) = 422 in².
2. Δ = (0.95 × 12.7 − 0.8 × 12.2) / 2 = 1.15 in, so N = √422 + 1.15 = 21.7, rounded up to 22.00 in.
3. B = 422 / 22 = 19.2, rounded up to 20.00 in.
4. Bearing strength: 0.65 × 0.85 × 3 × 440 = 729 kip, more than 700 kips.
5. Cantilevers: m = (22 − 12.07)/2 = 4.97 in, n = (20 − 9.76)/2 = 5.12 in, λn' = 3.11 in. n governs.
6. Thickness: 5.12 × √(2 × 700 / (0.9 × 36 × 22 × 20)) = 1.60 in.

On a large footing, where A2 is at least four times A1, the same column needs only a 16 × 14 in plate, 1.37 in thick.

## FAQ

**How do I size a base plate?**
Divide the factored load by the design bearing stress of the concrete for the plate area. Then choose N and B so the overhangs m and n are about equal, and compute the thickness from the largest overhang.

**What is A2 in base plate design?**
The area of the supporting concrete that is geometrically similar to the plate and centred on it. A larger area confines the concrete under the plate and raises its bearing strength, up to twice the unconfined value.

**What does λn' represent?**
The cantilever of the plate between the column flanges, from Thornton's yield-line analysis. It governs for small plates that barely extend past the column.

**Why 0.95 d and 0.8 bf?**
The plate is assumed to bend about lines just inside the column edges, at 95 % of the depth and 80 % of the flange width. These are the critical sections of Design Guide 1.

**What grade of steel is used for base plates?**
ASTM A36, with Fy = 36 ksi, is a common plate grade in the US, and S275 or S355 in Europe. Enter the yield strength of the plate actually used.

**Does this work for ASD?**
No. This page uses LRFD factors. Design Guide 1 gives the ASD equations, with Ω = 2.31 for bearing on concrete and 1.67 for plate bending.

## Related calculators

- [Load combinations](../load-combinations/index.html) — the factored load Pu.
- [Column buckling](../column-buckling/index.html) — capacity of the column above the plate.
- [Concrete column calculator](../concrete-column/index.html) — the concrete pedestal.
- [Footing size calculator](../footing-size/index.html) — the footing under the pedestal.
