# Stress and strain calculator (Young's modulus)

**Summary:** Axial stress, strain and elongation of a bar from force, area, length and Young's modulus, or solve for the force, modulus, area or length.

## Introduction

Stress is force divided by the area that carries it. Strain is the change in length divided by the original length. In the elastic range the two are proportional, and the constant is Young's modulus: σ = E ε. A 20 mm steel rod 2 m long, pulled with 50 kN, carries 159 MPa and stretches 1.5 mm.

This calculator applies these three relations to a bar in tension or compression. It finds the stress, strain and elongation from the force, or works backwards to the force, the modulus, the area needed for an allowable stress, or the original length. It holds Young's modulus for common materials from standards and data sheets. It is for students, technicians and engineers sizing rods, ties, bolts and test pieces.

## Formulas

    σ = F / A
    ε = ΔL / L
    σ = E ε
    ΔL = F L / (A E)
    k = E A / L

- F — axial force; A — cross-section area, π d²/4 for a round bar
- L — original length; ΔL — elongation (shortening in compression)
- E — Young's modulus; σ — normal stress; ε — strain
- k — axial stiffness of the bar, force per unit of elongation

Each solve mode rearranges the same relations. For an allowable stress, A = F / σ_allow.

## Assumptions and limitations

- The load acts along the axis of a straight bar of constant section, so the stress is uniform. Holes, threads and shoulders raise the local stress.
- The material stays elastic. The calculator warns when the stress passes the yield strength held for the material, because Hooke's law no longer holds there.
- Strain is engineering strain on the original length. The small change in area from Poisson's ratio is ignored.
- A slender bar in compression buckles at a lower load. Check buckling separately.
- Moduli are code or data-sheet values. Eurocode uses 210 GPa for steel and AISC uses 200 GPa, and real values scatter by a few per cent.

## Worked example

A 20 mm diameter steel tie rod, 2 m long, carries a tension of 50 kN. Take E = 210 GPa. What are the stress and the stretch?

1. Area: π × 20² / 4 = 314.16 mm².
2. Stress: 50 000 N / 314.16 mm² = 159.2 MPa.
3. Strain: 159.2 / 210 000 = 0.000758, or 0.0758 %.
4. Elongation: 0.000758 × 2 000 mm = 1.516 mm.

The stress is well below the 235 MPa yield strength of S235, so the rod stays elastic. Its axial stiffness is 210 000 × 314.16 / 2 000 = 33.0 kN/mm.

## FAQ

**What is the difference between stress and strain?**
Stress is the internal force per unit area, in pascals or psi. Strain is the relative change in length and has no unit.

**How do I calculate Young's modulus from a test?**
Divide the stress by the strain in the straight, elastic part of the curve. Use the force and elongation of two points to avoid errors from slack at the start.

**What is Young's modulus of steel?**
About 200 to 210 GPa, or 29 000 to 30 500 ksi. Aluminium alloys are about 70 GPa, so they stretch three times as much under the same stress.

**Does the formula work in compression?**
Yes, with the force taken as compressive and ΔL as a shortening. Slender members buckle long before they reach the yield stress, so check buckling.

**What is microstrain?**
One millionth of a strain, the unit strain gauges read. The rod in the example sees 758 microstrain.

**Why does the calculator warn about yield?**
Above the yield strength, steel stretches plastically and the elongation becomes far larger than Hooke's law predicts.

## Related calculators

- [Elastic constants](../elastic-constants/index.html) — shear and bulk modulus from E and Poisson's ratio.
- [Material properties](../material-properties/index.html) — yield strength, density and modulus of common materials.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — strain and stress from temperature change.
- [Mohr's circle](../mohr-circle/index.html) — combined stresses and principal stresses.
