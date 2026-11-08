# Steel beam size calculator

**Summary:** Lightest W-shape (AISC 360, ASD or LRFD) or IPE beam (Eurocode 3) for a simply supported span: bending, shear and live-load deflection with self-weight.

## Introduction

What size steel beam do you need? For a simply supported beam, find the largest bending moment, w L²/8 for a uniform load, and choose a section whose bending strength exceeds it. Then check shear at the supports and the deflection under live load. A 20 ft floor beam carrying 400 lb/ft of dead load and 800 lb/ft of live load needs a W14x22 in A992 steel: it uses 72 % of its bending strength and 75 % of the L/360 deflection allowance.

This calculator searches a table of standard rolled beams and returns the lightest one that passes all three checks, with the beam's own weight included. It offers US W-shapes designed to AISC 360 (LRFD or ASD) and European IPE beams designed to Eurocode 3. It is for engineers, builders and students making a first selection for a floor, roof or lintel beam.

## Formulas

Moment and shear for a uniform load w and a point load P at midspan, span L:

    M = w L² / 8 + P L / 4
    V = w L / 2 + P / 2

Load combinations, with the self-weight in the dead load D (or G):

    AISC LRFD:  w_u = max(1.2 D + 1.6 L, 1.4 D)
    AISC ASD:   w_a = D + L
    Eurocode:   w_Ed = 1.35 G + 1.5 Q

Bending strength of a compact, continuously braced section:

    AISC 360 F2.1:     M_n = F_y Z_x,   LRFD φ_b M_n with φ_b = 0.90,   ASD M_n / Ω_b with Ω_b = 1.67
    EN 1993-1-1 6.2.5: M_c,Rd = W_pl,y f_y / γ_M0,   γ_M0 = 1.0

Shear strength of the web:

    AISC 360 G2.1:     V_n = 0.6 F_y d t_w C_v1,   φ_v = 1.00 and Ω_v = 1.50 when h/t_w ≤ 2.24 √(E/F_y)
    EN 1993-1-1 6.2.6: V_pl,Rd = A_v (f_y / √3) / γ_M0

Live-load deflection, checked against L divided by the chosen limit:

    δ = 5 w L⁴ / (384 E I) + P L³ / (48 E I)

- Z_x, W_pl,y — plastic section modulus; I — moment of inertia about the strong axis
- F_y, f_y — yield strength: 50 ksi (A992), 36 ksi (A36), 235, 275 or 355 MPa
- E — 29 000 ksi for AISC, 210 000 MPa for Eurocode 3
- A_v — shear area of the IPE from the catalogue; d t_w — web area of the W-shape

## Assumptions and limitations

- The compression flange must be braced along its length, for example by a floor deck fixed to it. An unbraced beam can fail by lateral-torsional buckling at a much lower load, and this page does not check it.
- Only compact sections are used. A W-shape whose flange is not compact at the chosen grade, such as W8x10 in A992 steel, is skipped rather than checked for local buckling.
- Web bearing and crippling at the supports, floor vibration, fire resistance and the connections are not checked.
- Only the live-load deflection is checked. The total deflection is shown, and long spans may need a precamber.
- The table holds the light and medium W6 to W24 shapes and IPE 80 to IPE 600. Section properties come from the AISC Shapes Database v16.0 and the ArcelorMittal catalogue.

## Worked example

A floor beam spans 20 ft between girders. It carries 400 lb/ft of dead load and 800 lb/ft of live load. Use A992 steel, LRFD and a live-load deflection limit of L/360.

1. The deflection limit needs I ≥ 5 × 800 × 20⁴ × 1 728 / (384 × 29 000 000 × 240/360) = 149 in⁴, so W12x19 (130 in⁴) is too flexible.
2. Try W14x22, which weighs 22 lb/ft: w_u = 1.2 × (400 + 22) + 1.6 × 800 = 1 786.4 lb/ft.
3. Design moment: M_u = 1 786.4 × 20² / 8 = 89 320 lbf·ft.
4. Bending strength: φM_n = 0.9 × 50 × 33.2 / 12 = 124.5 kip·ft, or 124 500 lbf·ft. Utilisation 72 %.
5. Shear: V_u = 17.9 kip against φV_n = 0.6 × 50 × 13.7 × 0.23 = 94.5 kip. Utilisation 19 %.
6. Live-load deflection: 0.50 in against 20 × 12 / 360 = 0.67 in. Utilisation 75 %, which governs.

W12x22 weighs the same and also works. The calculator prefers W14x22 because it has the larger plastic modulus.

## FAQ

**How do I size a steel beam?**
Find the design moment and choose a section whose plastic modulus gives enough strength. Then check shear and the live-load deflection, and repeat with the beam's own weight added.

**What does W14x22 mean?**
A wide-flange beam about 14 in deep that weighs 22 lb per foot. Its actual depth is 13.7 in.

**What is the difference between LRFD and ASD?**
LRFD multiplies the loads by factors and the strength by φ less than 1. ASD uses unfactored loads and divides the strength by a safety factor Ω. For typical floors they give similar beams.

**Which deflection limit should I use?**
IBC Table 1604.3 sets L/360 under live load for floors and for roofs with plaster ceilings, L/240 for roofs with other ceilings and L/180 for roofs without one. Stone finishes and sensitive equipment often call for L/480.

**Does a deeper beam always weigh less?**
Often, because depth raises the moment of inertia quickly. Headroom usually limits the depth, so enter a maximum nominal depth to keep the beam shallow enough.

**Why is my beam's own weight added?**
The beam must carry itself. Switch the option to "Already in the dead load" if your dead load includes it.

**Is lateral-torsional buckling checked?**
No. The beam must be braced continuously, for example by a fixed deck. Unbraced beams need the full AISC Chapter F or Eurocode 6.3.2 check.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — other supports and load cases.
- [Moment of inertia calculator](../moment-of-inertia/index.html) — properties of built-up sections.
- [Column buckling calculator](../column-buckling/index.html) — the columns that carry the beam.
- [Metal weight calculator](../metal-weight/index.html) — the weight of the steel to order.
