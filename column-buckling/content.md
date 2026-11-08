# Column buckling (Euler and Johnson) calculator

**Summary:** Critical buckling load and stress of a compression member by Euler or the Johnson parabola, with end-condition factors, slenderness, allowable load and utilisation.

## Introduction

A slender member in compression fails not by crushing but by bowing sideways at a load that can be a small fraction of its squash load. Pillars under decks, pipe supports, jack-up legs, crane booms, connecting rods and restrained pipelines all have to be checked for buckling. Euler's formula gives the elastic critical load of a perfect column from its stiffness and effective length; for stockier columns the Johnson parabola bridges the gap between Euler and yielding. This calculator computes both, names the governing one, applies the end-condition factor and a factor of safety, and reports the slenderness ratio and utilisation.

It is for marine and mechanical engineers sizing struts and supports, for naval architecture students checking pillars, and for anyone who needs to know how far a column is from its critical load.

## Formulas

Section and slenderness:

    r = √(I_min / A)            radius of gyration about the weak axis
    L_e = K L                   effective length; K from the end conditions
    λ = K L / r                 slenderness ratio

Euler (long columns):

    P_cr = π² E I_min / (K L)²,    σ_cr = π² E / λ²

Transition slenderness and Johnson parabola (intermediate columns, λ < λ₁):

    λ₁ = π √(2 E / σ_y)
    σ_cr = σ_y − (σ_y² / (4 π² E)) λ²,    P_cr = σ_cr A

Allowable load and utilisation:

    P_allow = P_cr / FS,    utilisation = P / P_allow

Effective-length factors K (theoretical / recommended): pinned–pinned 1.0 / 1.0; fixed–fixed 0.5 / 0.65; fixed–pinned 0.7 / 0.8; fixed–free 2.0 / 2.1; fixed–guided 1.0 / 1.2.

- E — Young's modulus; σ_y — yield strength (compressive strength parallel to grain for timber); I_min — second moment of area about the weak axis; A — cross-section area

## Assumptions and limitations

- Ideal column: straight, concentric load, homogeneous material. Real members have initial bow and eccentricity, which is why design codes (EN 1993-1-1 §6.3, AISC E3) use buckling curves that fall below Euler and Johnson. Treat the result as the theoretical capacity and apply the factor of safety or the code check.
- Flexural buckling about the weak axis over the full unbraced length. Intermediate bracing of the weak axis changes the governing axis and length; enter the braced length or the strong-axis I as a custom section.
- The Johnson parabola is the classical machine-design treatment of inelastic buckling; codes use different inelastic curves, but the trend is the same.
- Local buckling of thin walls and flanges, torsional and flexural-torsional buckling of open sections, and lateral-torsional buckling are outside the scope; the calculator warns for thin tubes and I-sections.
- Material presets are nominal; the I-section formula omits root fillets (about 1 % low on the weak axis, 5 % on the strong axis).
- Most codes limit compression members to λ ≤ 200; beyond that, imperfections dominate and the calculator warns.

## Worked example

A 4 m pillar of hot-finished CHS 139.7 × 6 mm, S235 steel (E = 210 GPa), pinned at both ends, carrying 200 kN; factor of safety 1.92.

1. Section: A = 25.2 cm², I = 564 cm⁴, r = √(564/25.2) = 4.73 cm (matching the section tables).
2. Slenderness: K = 1.0, λ = 4 000 / 47.3 = 84.5. Transition for S235: π √(2 × 210 000 / 235) = 132.8, so this is an intermediate column.
3. Euler would give σ_cr = π² × 210 000 / 84.5² = 290 MPa, above yield, so it cannot govern; P_Euler = 731 kN.
4. Johnson: σ_cr = 235 − (235² / (4 π² × 210 000)) × 84.5² = 235 − 47.6 = 187.4 MPa; P_cr = 187.4 × 2 520 = 472 kN.
5. Allowable: 472 / 1.92 = 246 kN; the 200 kN load uses 81 % of it. The squash load A σ_y = 592 kN is never reached.

A 3 m pinned 50 mm solid rod in A36 steel, by contrast, has λ = 240 and buckles at the Euler load of 67 kN, only 34 MPa of stress against a yield of 250 MPa: a long column where stiffness, not strength, decides.

## FAQ

**Which K should I use?**
The recommended design values unless the connections are truly rigid. Welded base plates on a stiff foundation rarely achieve full fixity; the AISC values (0.65, 0.8, 2.1, 1.2) allow for that.

**Why does the result not depend on the yield strength for long columns?**
Above the transition slenderness the Euler load depends only on E, I and length: a high-strength steel column buckles at the same load as a mild-steel one of the same size. Stronger steel only helps short and intermediate columns.

**What factor of safety is appropriate?**
AISC allowable-stress design uses 1.67 for stocky to 1.92 for slender members; machine design commonly uses 2–3 because loads and end conditions are less certain. Codes using partial factors handle this differently.

**Is the Johnson parabola a code method?**
No, it is the classical machine-design formula (Shigley). Structural codes use their own inelastic buckling curves with imperfection factors; the Johnson value is a good estimate of the ideal inelastic capacity.

**How do I handle a pipe between anchors heated up?**
Compute the thermal compressive force with the thermal-expansion calculator and compare it with the critical load here using the span between guides as the length; restrained pipelines almost always buckle before they yield.

**My column is braced at mid-height. What length do I enter?**
The length between bracing points for buckling about the braced axis, and the full length for the other axis; check both, using a custom section with the corresponding I.

**Does this cover plate buckling of a bulkhead or deck?**
No. Plates buckle differently (critical stress depends on the width-to-thickness ratio and edge restraint); use the plate buckling formulas of the classification rules.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — the same sections in bending.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — the compressive force on a restrained pipe.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torsion of circular members.
- [Lifting sling and wire rope load](../lifting-sling/index.html) — compression in spreader beams.
