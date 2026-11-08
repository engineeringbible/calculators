# Thin-wall pressure vessel calculator

**Summary:** Hoop and longitudinal stress in cylinders and spheres, Lamé thick-wall check, ASME VIII-1 required thickness and MAWP with joint efficiency and corrosion allowance.

## Introduction

Air receivers, hydrophore tanks, boilers, heat-exchanger shells, CO₂ bottles and pipelines are all pressure vessels, and their walls work mostly in membrane tension. The thin-wall formulas give that tension directly from pressure, radius and thickness; the ASME Boiler and Pressure Vessel Code turns the same physics into a required thickness with the material's allowable stress, the weld quality and a corrosion allowance. This calculator does both: the textbook hoop and longitudinal stresses with the Lamé thick-wall value for comparison, and the ASME Section VIII Division 1 required thickness and maximum allowable working pressure for cylinders and spheres, plus the axial load the heads must carry.

It is for engineers checking an existing receiver after a thickness measurement, for designers pre-sizing a shell before the full code calculation, and for students meeting pressure-vessel stresses.

## Formulas

Thin-wall membrane stresses (inside radius R, wall t, gauge pressure p):

    Cylinder:  σ_hoop = p R / t,     σ_long = p R / (2 t)
    Sphere:    σ = p R / (2 t)
    Valid for t ≤ R/10 (error ≈ t/2R)

Lamé thick-wall maximum hoop stress at the inner surface (r_i = R, r_o = R + t):

    Cylinder:  σ_max = p (r_o² + r_i²) / (r_o² − r_i²)
    Sphere:    σ_max = p (r_o³ + 2 r_i³) / (2 (r_o³ − r_i³))

ASME Section VIII Division 1, UG-27 (S allowable stress, E joint efficiency, c corrosion allowance):

    Cylinder:  t_req = p R / (S E − 0.6 p) + c,      MAWP = S E (t − c) / (R + 0.6 (t − c))
    Sphere:    t_req = p R / (2 S E − 0.2 p) + c,    MAWP = 2 S E (t − c) / (R + 0.2 (t − c))
    Limits:    t ≤ R/2;  p ≤ 0.385 S E (cylinder), p ≤ 0.665 S E (sphere)

Axial load on each head:

    F = p π R²

Joint efficiencies (UW-12): 1.00 full radiography or seamless, 0.85 spot radiography, 0.70 no radiography.

## Assumptions and limitations

- Membrane stresses in the shell away from discontinuities: heads, nozzles, supports and welds concentrate stress and need the code's local rules (UG-37 reinforcement, Appendix 1 heads, Division 2 analysis).
- Internal pressure only; external pressure and vacuum are buckling problems (UG-28).
- The allowable stress S is the code value for the material at the design temperature; the calculator does not contain the ASME II-D tables.
- Static pressure; fatigue, thermal gradients and creep above about 370 °C for carbon steel are not covered.
- Mill undertolerance and forming allowances are not added; the corrosion allowance is the only thickness addition.
- The ASME formulas are reproduced for pre-sizing and checking; the code stamp requires the full design by a qualified engineer.

## Worked example

Air receiver, cylindrical, 2.0 m inside diameter, 10 mm wall, design pressure 10 bar (1.0 MPa), SA-516 Grade 70 with S = 138 MPa, full radiography (E = 1.0), no corrosion allowance.

1. Thin-wall: t/R = 0.01, well within the thin-wall range. Hoop stress 1.0 × 1 000 / 10 = 100 MPa; longitudinal 50 MPa.
2. Lamé: 1.0 × (1.01² + 1²) / (1.01² − 1²) = 100.5 MPa — thin-wall theory is 0.5 % low, as expected.
3. ASME required thickness: 1.0 × 1 000 / (138 × 1.0 − 0.6 × 1.0) = 7.28 mm; the 10 mm wall has 2.7 mm in hand. With spot radiography (E = 0.85) the requirement rises to 8.57 mm.
4. MAWP of the 10 mm wall: 138 × 10 / (1 000 + 6) = 1.37 MPa = 13.7 bar.
5. End-cap force: 1.0 × 10⁶ × π × 1² = 3.14 MN — the load the dished heads and any flange bolts must carry.

With a 2 mm corrosion allowance the required thickness becomes 9.28 mm and the MAWP of the corroded 8 mm wall 11.0 bar: still above the 10 bar design pressure.

## FAQ

**Why is the hoop stress twice the longitudinal stress?**
Pressure acting on the projected area of the cylinder is resisted by two walls over the length (hoop), while the end load is carried by the whole circumference (longitudinal). That is why cylinders split lengthwise and why longitudinal welds get the higher joint-efficiency requirement.

**When is a wall "thick"?**
Beyond t/R of about 0.1 the thin-wall formulas understate the inner-surface stress by more than 5 %; use the Lamé values. ASME UG-27 itself is valid up to t = R/2 because of its 0.6 p correction term.

**What is the 0.6 p term in the ASME formula?**
A correction that makes the simple formula match thick-wall theory more closely for cylinders, so that it can be used up to t = R/2 instead of the thin-wall limit.

**Which allowable stress do I use?**
The ASME Section II Part D value for the exact material specification and the design temperature. 138 MPa (20.0 ksi) is SA-516 Grade 70 at moderate temperature in Division 1; stainless steels and higher temperatures have lower values.

**Does the calculator design the heads?**
No. Torispherical, ellipsoidal and hemispherical heads have their own formulas (UG-32); the end force output tells you the load they carry.

**What about a hydrostatic test?**
Division 1 tests at 1.3 times the MAWP corrected for temperature; the stress during test may approach 90 % of yield, which is a separate check.

**Can I use this for a pipe?**
For the hoop stress, yes. Piping codes (ASME B31.1/B31.3) use a slightly different thickness formula with the outside diameter and a Y factor; the result is close for thin pipes.

## Related calculators

- [Bolt torque and preload](../bolt-torque/index.html) — flange bolts for the end-cap load.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the pressures in the connected piping.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — thermal stresses added to the pressure stresses.
- [Beam deflection and bending stress](../beam-deflection/index.html) — saddle supports and lifting of horizontal vessels.
