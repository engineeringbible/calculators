# Fatigue safety factor calculator (Goodman, Gerber, Soderberg)

**Summary:** Endurance limit of a steel part with the Marin factors and the fatigue safety factor by modified Goodman, Gerber, Soderberg and ASME-elliptic criteria.

## Introduction

A part that sees a fluctuating stress can fail far below its tensile strength. For steel, a polished test bar in rotating bending survives indefinitely below its endurance limit, about half the tensile strength. A real part is rougher, larger and loaded differently, so the limit is cut by the Marin factors. A mean stress on top of the alternating stress cuts the allowable stress further, and the Goodman diagram measures by how much.

This calculator follows the stress-life method of Shigley's Mechanical Engineering Design. It estimates the endurance limit from the tensile strength, applies the factors for surface, size, loading, temperature and reliability, and gives the fatigue factor of safety by four criteria, plus the factor against yield on the first cycle. It is for mechanical engineers and students designing shafts, bolts, springs and brackets for infinite life.

## Formulas

Endurance limit (Shigley eqs. 6-8 and 6-18):

    S_e' = 0.5 S_ut  (S_ut ≤ 1 400 MPa),  700 MPa above
    S_e = k_a k_b k_c k_d k_e k_f S_e'

Marin factors:

    k_a = a S_ut^b: ground 1.58, −0.085; machined or cold-drawn 4.51, −0.265; hot-rolled 57.7, −0.718; as-forged 272, −0.995 (S_ut in MPa)
    k_b = (d/7.62)^−0.107 (2.79 to 51 mm),  1.51 d^−0.157 (51 to 254 mm),  1 for axial load
    k_c = 1 bending, 0.85 axial, 0.59 torsion
    k_d = 0.975 + 0.432e-3 T − 0.115e-5 T² + 0.104e-8 T³ − 0.595e-12 T⁴  (T in °F)
    k_e = 1, 0.897, 0.868, 0.814, 0.753 for 50, 90, 95, 99, 99.9 % reliability

Factors of safety for alternating stress σ_a and mean stress σ_m:

    Goodman:       1/n = σ_a/S_e + σ_m/S_ut
    Soderberg:     1/n = σ_a/S_e + σ_m/S_y
    Gerber:        n = ½ (S_ut/σ_m)² (σ_a/S_e) [−1 + √(1 + (2 σ_m S_e / (S_ut σ_a))²)]
    ASME-elliptic: n = 1 / √((σ_a/S_e)² + (σ_m/S_y)²)
    Langer yield:  n_y = S_y / (σ_a + σ_m)

- σ_a, σ_m — alternating and mean stresses, each multiplied by K_f
- S_ut, S_y — ultimate and yield strength; d — diameter of a round section

## Assumptions and limitations

- The method is for steel and infinite life, a million cycles and more. Finite-life and other metals need an S-N curve.
- The size factor holds for round sections in rotating bending or torsion. A non-rotating round uses an effective diameter of 0.370 d.
- K_f multiplies both stresses, as for a ductile part that does not yield at the notch.
- For torsion, enter shear stresses. The ultimate and yield strengths become 0.67 S_ut and 0.577 S_y.
- Combined loads should be turned into von Mises alternating and mean stresses first and entered as bending.

## Worked example

This is Shigley Example 6-10. A 1.5 in bar of cold-drawn AISI 1050 steel (S_ut = 100 ksi, S_y = 84 ksi) carries an axial load from 0 to 16 kip. A fillet gives K_f = 1.85.

1. Surface: k_a = 4.51 × 689.5^−0.265 = 0.798. Axial loading: k_b = 1, k_c = 0.85.
2. Endurance limit: S_e = 0.798 × 0.85 × 50 = 33.9 ksi.
3. Stresses: area 1.767 in², so σ_a = σ_m = 1.85 × 8 / 1.767 = 8.375 ksi. Shigley rounds this to 8.38.
4. Goodman: 1 / (8.375/33.9 + 8.375/100) = 3.02. Soderberg: 2.88.
5. Gerber: 3.67, which Shigley prints as 3.66 from rounded values. ASME-elliptic: 3.75.
6. First-cycle yield: 84 / (2 × 8.375) = 5.01.

All factors are well above 1, so the bar has infinite life and does not yield.

## FAQ

**What is the endurance limit of steel?**
About half the tensile strength for a polished test bar, up to 700 MPa (100 ksi). A real part reaches only a fraction of that after the Marin factors.

**Which criterion should I use, Goodman or Gerber?**
Goodman is simple and slightly conservative, and common in design. Gerber follows test data more closely for ductile steels. Soderberg is the most conservative.

**Why does a mean stress reduce fatigue strength?**
A tensile mean stress holds cracks open, so they grow faster under the same alternating stress. A compressive mean stress helps.

**What is the surface factor for a machined part?**
k_a = 4.51 S_ut^−0.265 with S_ut in MPa. For a 520 MPa steel it is 0.860.

**Do I apply the stress concentration factor to the mean stress?**
For ductile materials Shigley applies K_f to both, as in Example 6-10. If the notch yields on the first cycle, the mean stress at the notch is lower.

**What safety factor is enough?**
It depends on how well the loads, the material and the stresses are known. The governing code or company practice sets the value.

## Related calculators

- [Mohr's circle](../mohr-circle/index.html) — von Mises stress from combined stresses.
- [Hardness conversion](../hardness-conversion/index.html) — tensile strength estimated from hardness.
- [Shaft torsion](../shaft-torsion/index.html) — shear stress in a shaft.
- [Weld fatigue damage](../weld-fatigue/index.html) — welded details, which follow S-N curves instead.
