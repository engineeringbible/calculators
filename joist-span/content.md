# Joist span calculator (bending and deflection)

**Summary:** Maximum span of a wood floor joist or rafter from its size, spacing, grade and loads, by bending and deflection mechanics with NDS adjustment factors.

## Introduction

How far can a joist span? Far enough that its bending stress stays below the allowable value and its sag stays within the deflection limits. Both follow from simple beam theory once the load per joist, the section properties and the wood's strength and stiffness are known. A Douglas Fir-Larch No. 2 2×10 at 16 in centres, with 10 psf dead and 40 psf live load, can span 15.61 ft, limited by bending.

This calculator computes the maximum span of a rectangular joist or rafter from mechanics, not from code span tables. It applies the NDS load duration, size and repetitive member factors, checks bending and the live and total load deflection limits, and says which one governs. It also checks a span you enter. It is for builders, designers, engineers and students sizing floor joists, ceiling joists and rafters.

## Formulas

Load per joist and section properties:

    w = q × s,    S = b d² / 6,    I = b d³ / 12

Span limited by bending, with F'b = Fb × C_D × C_F × C_r:

    M = w L² / 8 ≤ F'b S    →    L_b = √( 8 F'b S / w )

Span limited by deflection, with the limit L/n:

    Δ = 5 w L⁴ / (384 E I) ≤ L / n    →    L_Δ = ( 384 E I / (5 w n) )^(1/3)

- q — load per unit floor area; s — joist spacing; b, d — actual width and depth
- C_D — load duration, 1.0 for occupancy live load; C_F — size factor; C_r = 1.15 for joists at 24 in or less
- Live load deflection uses the live load only; total load deflection uses dead plus live

## Assumptions and limitations

- The joist is simply supported and uniformly loaded. Continuous joists, point loads and openings need a full analysis.
- The compression edge is held by the floor or roof sheathing, the wood is dry in service and at normal temperature.
- Shear, bearing, notches and floor vibration are not checked. Long, shallow joists can feel bouncy even when they meet L/360.
- The spans come from mechanics with the NDS factors. Code span tables are built in a similar way but may round or add checks, so small differences are normal.

## Worked example

A floor has Douglas Fir-Larch No. 2 2×10 joists (1.5 × 9.25 in) at 16 in centres. The dead load is 10 psf and the live load 40 psf. Use L/360 for live and L/240 for total load deflection.

1. Load per joist: 50 psf × 16/12 ft = 66.67 lb/ft, or 5.556 lb/in. The live part is 4.444 lb/in.
2. Section: S = 1.5 × 9.25² / 6 = 21.39 in³ and I = 1.5 × 9.25³ / 12 = 98.93 in⁴.
3. Allowable stress: F'b = 900 × 1.0 × 1.1 × 1.15 = 1 139 psi.
4. Bending: L = √(8 × 1 138.5 × 21.39 / 5.556) = 187.3 in, or 15.61 ft.
5. Live load deflection: L = (384 × 1 600 000 × 98.93 / (5 × 4.444 × 360))^(1/3) = 196.6 in, or 16.38 ft.
6. Total load deflection at L/240: 17.41 ft.

Bending governs, so the maximum span is 15.61 ft, or 15 ft 7 in.

## FAQ

**How far can a 2×10 joist span?**
It depends on the species, grade, spacing and loads. A Douglas Fir-Larch No. 2 2×10 at 16 in with 40 psf live and 10 psf dead load spans about 15.6 ft by this method.

**What is the difference between L/360 and L/240?**
L/360 limits the live load deflection of floors so finishes do not crack. L/240 limits the total deflection under dead plus live load.

**Why does the size factor change with depth?**
Deeper lumber has a lower bending strength per unit area, because large members contain more and larger defects. The NDS raises Fb for small sizes, by 1.1 for a 2×10 and 1.5 for a 2×4.

**What is the repetitive member factor?**
A 15 % increase in bending stress for joists, rafters and studs spaced 24 in or less, when three or more share the load through sheathing. A weak joist is helped by its neighbours.

**Does this work for rafters?**
Yes, using the horizontal span and loads per horizontal area. Use C_D = 1.15 when snow is the live load.

**Can I use metric timber grades such as C24?**
Choose "Other" and enter the bending stress and modulus. Eurocode 5 designs with partial factors and different load factors, so the result is only an estimate for EN 338 grades.

## Related calculators

- [Deflection limits](../deflection-limits/index.html) — which L/n applies to your member.
- [Beam deflection and bending stress](../beam-deflection/index.html) — other load cases and supports.
- [Load combinations](../load-combinations/index.html) — dead, live and snow loads together.
- [Snow load](../snow-load/index.html) — the roof load for rafters.
