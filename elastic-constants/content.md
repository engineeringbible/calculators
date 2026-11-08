# Elastic constants calculator (E, G, K, Poisson's ratio)

**Summary:** Young's modulus, shear modulus, bulk modulus and Poisson's ratio of an isotropic material from any two of them, with Lamé's constant.

## Introduction

An isotropic elastic material has only two independent elastic constants. Once you know any two of Young's modulus E, the shear modulus G, the bulk modulus K and Poisson's ratio ν, the others follow. Steel with E = 210 GPa and ν = 0.3 has G = 80.8 GPa and K = 175 GPa.

This calculator takes any pair and returns all four constants, plus Lamé's first parameter λ and the constrained modulus M used in wave and soil problems. It refuses pairs that no stable material can have. It is for engineers and students who have E and ν from a data sheet but need G for torsion or K for pressure.

## Formulas

From E and ν:

    G = E / (2 (1 + ν))
    K = E / (3 (1 − 2ν))
    λ = E ν / ((1 + ν)(1 − 2ν)),    M = K + 4G/3

From the other pairs:

    E and G:  ν = E / (2G) − 1
    E and K:  ν = (3K − E) / (6K)
    G and K:  E = 9KG / (3K + G),   ν = (3K − 2G) / (2 (3K + G))
    G and ν:  E = 2G (1 + ν)
    K and ν:  E = 3K (1 − 2ν)

- E — Young's modulus, tension or compression; G — shear modulus (modulus of rigidity)
- K — bulk modulus, pressure over volume strain; ν — Poisson's ratio, lateral over axial strain

Typical values from standards and data sheets:

| Material | E (GPa) | G (GPa) | ν | Source |
|---|---|---|---|---|
| Structural steel | 210 | 81 | 0.3 | EN 1993-1-1 |
| Aluminium alloys | 70 | 27 | 0.3 | EN 1999-1-1 |
| Stainless steel 304 | 193 | 78 | — | Cleveland-Cliffs |
| Copper C11000 | 117 | 44.1 | — | National Bronze |
| Brass C26000 | 110 | 41.4 | — | National Bronze |
| Ti-6Al-4V | 113.8 | 44 | 0.342 | ASM data sheet |
| Float glass | 70 | — | 0.2 | AGC Planibel |
| Concrete C30/37 | 33 | — | 0.2 | EN 1992-1-1 |

## Assumptions and limitations

- The relations hold only for isotropic, linear-elastic materials. Timber, fibre composites and many moulded plastics have different stiffness in different directions.
- Poisson's ratio must lie between −1 and 0.5. At 0.5 the material cannot change volume and K is infinite, so the calculator stops just below it.
- Published E, G and ν for an alloy often disagree slightly, because each comes from a different test. EN 1999-1-1 lists 70, 27 and 0.3 for aluminium, but 70 and 27 imply ν = 0.296.
- For rubber and other nearly incompressible materials, K is very sensitive to the third decimal of ν. Measure K directly instead.

## Worked example

A steel shaft has E = 210 GPa and ν = 0.3. What are its shear and bulk moduli?

1. Shear modulus: G = 210 / (2 × 1.3) = 80.77 GPa.
2. Bulk modulus: K = 210 / (3 × 0.4) = 175.0 GPa.
3. Lamé's parameter: λ = 210 × 0.3 / (1.3 × 0.4) = 121.2 GPa.
4. Constrained modulus: M = 175.0 + 4 × 80.77 / 3 = 282.7 GPa.

Eurocode 3 rounds the shear modulus of steel to 81 GPa, within 0.3 % of this result.

## FAQ

**What is the relation between E and G?**
G = E / (2 (1 + ν)). For metals with ν near 0.3, the shear modulus is about 38 % of Young's modulus.

**What is a typical Poisson's ratio?**
About 0.3 for steel and aluminium, 0.2 for glass and concrete, and close to 0.5 for rubber.

**Can Poisson's ratio be negative?**
Yes, for some foams and lattice structures that get fatter when stretched. No common engineering metal does this.

**What is the bulk modulus used for?**
It relates a pressure to the change in volume. Hydraulic and pressure-vessel calculations use it, and so does the speed of sound in solids.

**Why does my data sheet's G not match E and ν?**
The three values come from separate tests and products, and each is rounded. A difference of a few per cent is normal.

**What is the shear modulus of steel?**
Eurocode 3 uses 81 GPa for structural steel. The Cleveland-Cliffs data sheets give 77 to 78 GPa for stainless steels 316 and 304.

## Related calculators

- [Stress and strain](../stress-strain/index.html) — elongation of a bar from Young's modulus.
- [Material properties](../material-properties/index.html) — moduli and strengths of common materials.
- [Shaft torsion](../shaft-torsion/index.html) — twist of a shaft from the shear modulus.
- [Mohr's circle](../mohr-circle/index.html) — principal stresses in plane stress.
