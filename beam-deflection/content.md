# Beam deflection and bending stress calculator

**Summary:** Maximum bending moment, bending stress, deflection and reactions for simply supported, cantilever and fixed beams with standard sections.

## Introduction

Most structural checks on a ship or in a workshop reduce to a beam: a deck girder, a pipe support, a lifting beam, a shaft between bearings, a cantilevered platform. Given the support conditions, the load and the cross-section, you need the maximum bending moment, the resulting stress compared with the material's yield strength, and the deflection compared with a serviceability limit. This calculator covers the eight classic cases from the beam tables with rectangular, circular, tubular, I and user-defined sections and reports moment, stress, deflection, reactions, utilisation and factor of safety. It also draws the shear force diagram, the bending moment diagram and the deflected shape along the span.

It is for mechanical and marine engineers doing first-pass sizing, for students checking homework against the formulas, and for anyone who needs a quick, traceable answer before opening a full analysis tool.

## Formulas

Section properties:

    Rectangle b × h:        I = b h³ / 12,                   c = h / 2
    Hollow rectangle:       I = [b h³ − (b−2t)(h−2t)³] / 12,  c = h / 2
    Solid circle d:         I = π d⁴ / 64,                   c = d / 2
    Tube D, wall t:         I = π [D⁴ − (D−2t)⁴] / 64,       c = D / 2
    I-section:              I = [b h³ − (b − t_w)(h − 2t_f)³] / 12,  c = h / 2
    Z = I / c

Bending stress at the extreme fibre:

    σ = M_max × c / I = M_max / Z

Load cases (L span, P point load, w load per unit length, a distance of the point load, b = L − a, E Young's modulus):

| Case | M_max | δ_max | Location of δ_max |
|---|---|---|---|
| Simply supported, P at midspan | P L / 4 | P L³ / (48 E I) | midspan |
| Simply supported, P at a | P a b / L | P s (L² − s²)^{3/2} / (9√3 E I L), s = min(a, b) | √((L² − s²)/3) from the far support |
| Simply supported, UDL w | w L² / 8 | 5 w L⁴ / (384 E I) | midspan |
| Cantilever, P at free end | P L | P L³ / (3 E I) | free end |
| Cantilever, P at a from fixed end | P a | P a² (3L − a) / (6 E I) | free end |
| Cantilever, UDL w | w L² / 2 | w L⁴ / (8 E I) | free end |
| Fixed–fixed, P at midspan | P L / 8 | P L³ / (192 E I) | midspan |
| Fixed–fixed, UDL w | w L² / 12 (ends) | w L⁴ / (384 E I) | midspan |

Utilisation and safety factor:

    Utilisation = σ / f_y,   FoS = f_y / σ

- f_y — yield strength of the material

## Assumptions and limitations

- Euler–Bernoulli theory: shear deformation is neglected. For span-to-depth ratios below about 10 the true deflection is 10 % or more higher.
- Linear elastic, small deflections, prismatic section, load in the plane of symmetry. No torsion and no lateral-torsional buckling check: an unrestrained I-beam can fail by buckling well before the bending stress reaches yield.
- Stress is bending only; shear stress, stress concentrations, fatigue and local buckling are not covered.
- Supports are ideal pins or ideally fixed ends. Real end connections lie between the two.
- Self-weight is not added; include it in w.
- The I-section formula ignores root fillets and gives about 5 % less I than rolled-section tables (IPE 200: 1846 vs 1943 cm⁴). Enter the tabulated I and h/2 as a custom section for exact values.
- Utilisation against yield is an elastic check without partial factors; design codes add load and material factors and may allow plastic section moduli.

## Worked example

A 4 m simply supported IPE 200 (I = 1943 cm⁴, h = 200 mm, S235 steel, E = 210 GPa) carries a 10 kN point load at midspan.

1. Moment: M = P L / 4 = 10 × 4 / 4 = 10 kN·m at midspan. Reactions 5 kN each.
2. Section modulus: Z = I / c = 1943 / 10 = 194.3 cm³ (matches the tables).
3. Stress: σ = 10 × 10⁶ N·mm / 194.3 × 10³ mm³ = 51.5 MPa. Utilisation 51.5 / 235 = 21.9 %, factor of safety 4.57.
4. Deflection: δ = P L³ / (48 E I) = 10 000 × 4³ / (48 × 210 × 10⁹ × 1943 × 10⁻⁸) = 3.27 mm, span / 1224.

Change to a uniformly distributed 5 kN/m: M = w L² / 8 = 10 kN·m again, but δ = 5 w L⁴ / (384 E I) = 4.08 mm. Fix both ends and the midspan deflection drops to a quarter (point load) or a fifth (UDL) of the simply supported value.

## FAQ

**Which deflection limit should I use?**
Common serviceability limits: span/250 for general structures, span/360 for floors and beams carrying plaster or equipment, span/180 for cantilevers (measured from the fixed end). Shipbuilding rules use their own limits; check the class rules.

**The stress is fine but the deflection is large. Is that a problem?**
Often yes: deflection limits govern long spans and slender sections. Deflection scales with L³ or L⁴, stress only with L or L², so doubling a span roughly doubles the stress but increases deflection eight to sixteen times.

**Why is my I lower than the catalogue value for the same I-beam?**
The formula ignores the fillets between web and flange. Enter the catalogue I and c = h/2 as a custom section.

**Do fixed ends always help?**
They reduce midspan moment and deflection, but they introduce end moments of the same order and require connections that can carry them. A bolted web cleat is not a fixed end.

**Can I use this for a shaft between bearings?**
For static bending yes, with the circle section. Rotating shafts also need a fatigue check and a deflection/slope check at the bearings and seals.

**What about combined loads?**
Superimpose: run each load separately and add moments and deflections at the same location (valid in the linear elastic range). Point and distributed loads at different locations do not necessarily peak at the same point.

**How do I enter a hollow section from a catalogue?**
Use the hollow rectangle or tube with the nominal outside dimensions and wall thickness, or enter the catalogue I and h/2 as a custom section, which also captures corner radii.

## Related calculators

- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — the compression counterpart.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torsion of shafts that also bend.
- [Thin-wall pressure vessel](../pressure-vessel/index.html) — membrane stresses in shells.
- [Engineering unit converter](../unit-converter/index.html) — cm⁴, in⁴, kN·m, kip·ft.
