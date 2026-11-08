# Pile capacity calculator (driven and bored piles)

**Summary:** Axial capacity of a single driven or bored pile in layered clay and sand: shaft friction by the α and β methods plus end bearing, with a factor of safety.

## Introduction

A pile carries its load in two ways: friction along its shaft and bearing under its tip. In clay the shaft friction is a fraction α of the undrained shear strength. In sand it is a fraction β of the effective vertical stress. The tip bears a multiple of the soil strength or stress. A 610 mm steel pipe pile driven 20 m through soft and firm clay into dense sand has an ultimate capacity of about 3 729 kN.

This calculator adds up the shaft friction layer by layer and the end bearing at the tip, then divides by a factor of safety. Driven piles use the API RP 2GEO method, and bored piles the FHWA method of O'Neill and Reese. It is for geotechnical and structural engineers making a first estimate, and for students checking hand calculations.

## Formulas

Ultimate and allowable capacity:

    Q_ult = Q_s + Q_b = Σ f_i P Δz_i + q_b A_b
    Q_all = Q_ult / FS

Driven piles (API RP 2GEO):

    clay:  f = α s_u,  α = 0.5 ψ^−0.5 (ψ ≤ 1) or 0.5 ψ^−0.25 (ψ > 1),  α ≤ 1,  ψ = s_u / σ'v
           q_b = 9 s_u
    sand:  f = β σ'v ≤ f_lim,   q_b = N_q σ'v ≤ q_lim   (dense sand: β 0.46, 96 kPa, N_q 40, 10 MPa)

Bored piles (O'Neill and Reese, FHWA 1999):

    clay:  f = 0.55 s_u, none in the top 1.5 m and the bottom D;  q_b = 6 (1 + 0.2 L/D) s_u ≤ 9 s_u
    sand:  f = β σ'v ≤ 200 kPa,  β = 1.5 − 0.245 √z  (0.25 to 1.2, z in m);  q_b = 57.5 N60 kPa

- P — pile perimeter; A_b — base area; D — diameter; L — embedded length
- s_u — undrained shear strength; σ'v — effective vertical stress; N60 — SPT blow count

## Assumptions and limitations

- API RP 2GEO is written for open- and closed-end pipe piles driven offshore. The page assumes the pile acts plugged, with end bearing on its full area.
- Sand layers take an SPT N60. Its relative density sets the API β and N_q. API gives no values for loose sand, so such layers are refused for driven piles.
- Only the soil's capacity is computed. Pile weight, downdrag, group effects, settlement and the structural strength of the pile need separate checks.
- These are design methods for a first estimate. Load tests or dynamic monitoring usually confirm the capacity on a real project.

## Worked example

A closed-end steel pipe pile of 610 mm diameter is driven 20 m. The soil is 6 m of soft clay (s_u 40 kPa, γ' 8 kN/m³), 8 m of firm clay (s_u 80 kPa, γ' 9 kN/m³) and then dense sand with N60 = 35 (γ' 10 kN/m³). Use FS = 2.5.

1. Effective stress: 48 kPa at 6 m, 120 kPa at 14 m and 180 kPa at the tip.
2. Soft clay: ψ = 40/σ'v, so α rises from 0 at the surface to 0.55 at 6 m. Integrating f = α s_u gives 100.97 kN per metre of perimeter.
3. Firm clay: in the same way, 332.67 kN per metre.
4. Dense sand: f = 0.46 × σ'v, with an average stress of 150 kPa over 6 m, gives 414.0 kN per metre.
5. Shaft friction: 847.6 × π × 0.61 = 1 624 kN.
6. End bearing: q_b = 40 × 180 = 7 200 kPa on 0.2922 m², so 2 104 kN.
7. Ultimate capacity: 1 624 + 2 104 = 3 729 kN. Allowable load: 3 729 / 2.5 = 1 491 kN.

Bored instead, the same pile would carry about 1 701 kN in shaft friction but only 588 kN at the base.

## FAQ

**How do you calculate pile capacity?**
Add the shaft friction of every layer the pile passes through to the end bearing at the tip. Divide the sum by a factor of safety, usually 2 to 3, for the allowable load.

**What is the α method?**
A total-stress method for clay. The unit shaft friction is α times the undrained shear strength; α falls from 1 in soft clay to about 0.3 to 0.5 in stiff clay.

**What is the β method?**
An effective-stress method. The unit shaft friction is β times the effective vertical stress, with β combining the earth pressure coefficient and the friction angle at the pile wall.

**Why do driven and bored piles have different capacities?**
Driving displaces and densifies the soil around the pile. Boring removes soil and loosens the walls, so a bored pile has lower base resistance for the same size.

**Why is there no shaft friction near the top of a bored pile in clay?**
The clay there shrinks, cracks and may be disturbed by construction. O'Neill and Reese ignore the top 1.5 m and the bottom one diameter.

**What factor of safety should I use?**
Traditional practice uses 2 to 3, the lower values only when load tests confirm the capacity. Follow the governing code; LRFD codes use resistance factors instead.

## Related calculators

- [Soil bearing capacity](../soil-bearing/index.html) — shallow footings instead of piles.
- [Consolidation settlement](../consolidation-settlement/index.html) — settlement of clay that may call for piles.
- [Footing size calculator](../footing-size/index.html) — size the cap or footing above the piles.
- [Retaining wall earth pressure](../retaining-wall/index.html) — lateral soil pressure on walls.
