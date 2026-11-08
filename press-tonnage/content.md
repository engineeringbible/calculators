# Press tonnage calculator (punching and press brake)

**Summary:** Punching and blanking force from perimeter, thickness and shear strength, with stripping force and press margin, and press brake air-bending tonnage.

## Introduction

A punch shears the sheet all around the edge of the hole. The force is the length of that edge times the thickness times the shear strength of the material. Punching a 20 mm hole in 3 mm steel with a shear strength of 300 MPa takes 56.55 kN, about 5.8 tonnes-force. A press brake bends instead of shearing, and its force depends on the thickness squared divided by the die opening.

This calculator gives the punching or blanking force, the stripping force and the press capacity with a margin. For press brakes, it gives the air-bending force per foot or metre and in total. It is for tool designers, press operators and sheet metal shops choosing a press or checking a job.

## Formulas

Punching and blanking:

    F = L × t × τ
    τ ≈ k × UTS     (k ≈ 0.75 for steel, 0.65 for aluminium)
    press load = F × (1 + s)
    press capacity = press load × (1 + margin)

Press brake air bending (US units):

    tons per foot = 575 × t² / V × UTS / 60 000 psi

- L — cut perimeter (π d for a round hole); t — thickness; τ — ultimate shear strength
- UTS — ultimate tensile strength; s — stripping force as a share of F
- V — V-die opening in inches; t in inches; tons are US tons of 2 000 lbf

## Assumptions and limitations

- The punch and die have flat faces and normal clearance. A shear angle on the punch spreads the cut and lowers the peak force. Dull tools raise it.
- The shear strength ratio is a rough rule: about 0.75 of the tensile strength for steel and 0.65 for aluminium. A measured shear strength is better.
- Stripping force is added to the press load because spring strippers push back during the stroke. Enter your own share of the punching force.
- The press brake formula is for air bending only. It is based on steel with a tensile strength of 60 000 psi and scales with the tensile strength. Bottoming and coining need several times more force.
- The margin covers tool wear, harder material and thickness tolerance. The press maker's rating and its limits for off-centre loads still apply.

## Worked example

A 20 mm hole is punched in 3 mm mild steel with a shear strength of 300 MPa. Stripping takes 10 % of the punching force, and the press should have a 20 % margin.

1. Perimeter: π × 20 = 62.83 mm.
2. Punching force: 62.83 × 3 × 300 = 56 549 N, or 56.55 kN.
3. With stripping: 56.55 × 1.1 = 62.20 kN.
4. Press capacity: 62.20 × 1.2 = 74.64 kN, about 7.6 tonnes-force.

For a press brake: 1/4 in mild steel on a 2 in V-die needs 575 × 0.25² / 2 = 17.97 US tons per foot. A 10 ft bend takes 180 US tons before any margin.

## FAQ

**How do I calculate punching tonnage?**
Multiply the cut perimeter by the thickness and the shear strength. In US units, inches × inches × psi gives lbf. Divide by 2 000 for US tons.

**What is the shear strength of mild steel?**
It varies with the grade. A rough estimate is 0.75 × the tensile strength, so steel of 60 000 psi tensile strength shears at about 45 000 psi.

**What is stripping force?**
The force needed to pull the punch back out of the sheet, which grips it. Spring strippers also press on the sheet during the stroke.

**How do I reduce punching force?**
Grind a shear angle on the punch, stagger the punch lengths so not all holes cut at once, or punch fewer holes per stroke.

**What does the 575 in the press brake formula mean?**
It is the makers' constant for air bending steel of 60 000 psi tensile strength. It gives US tons per foot with thickness and die opening in inches.

**Why does a wider V-die need less force?**
The sheet bends over a longer lever arm. Doubling the die opening halves the force, but it also makes the inside radius larger.

## Related calculators

- [Bend allowance calculator](../bend-allowance/index.html) — flat lengths for the bent part.
- [Injection molding clamp tonnage calculator](../injection-clamp-tonnage/index.html) — the clamp force of a moulding press.
- [Hydraulic cylinder force and speed](../hydraulic-cylinder/index.html) — force of the press cylinder.
- [Tap drill calculator](../tap-drill/index.html) — holes to be threaded after punching.
