# Mohr's circle calculator (principal stress, von Mises)

**Summary:** Plane-stress Mohr's circle: principal stresses and angle, maximum shear, stresses on a rotated plane, von Mises and Tresca stress and safety factor.

## Introduction

The stresses on a small element depend on how the element is turned. Mohr's circle shows every combination at once: its centre is the average normal stress and its radius the maximum in-plane shear. Where the circle crosses the axis lie the principal stresses, the largest and smallest normal stresses, on planes with no shear. An element with σx = 80 MPa and a shear of 50 MPa has principal stresses of 104 and −24 MPa.

This calculator turns a plane stress state into its principal stresses and their direction, the maximum shear, and the stresses on a plane at any angle. It also gives the von Mises and Tresca equivalent stresses and the factor of safety against yield. It is for students and engineers checking shafts, brackets, welds and pressure parts.

## Formulas

    C = (σx + σy) / 2,    R = √( ((σx − σy)/2)² + τxy² )
    σ1, σ2 = C ± R,    θp = ½ atan2(2 τxy, σx − σy)

Stresses on a plane rotated by θ:

    σx' = C + (σx − σy)/2 · cos 2θ + τxy sin 2θ
    τx'y' = −(σx − σy)/2 · sin 2θ + τxy cos 2θ
    σy' = σx + σy − σx'

Equivalent stresses and factors of safety, with σ3 = 0:

    σ' = √(σx² − σx σy + σy² + 3 τxy²)    (von Mises)
    σ_T = max(|σ1 − σ2|, |σ1|, |σ2|)      (Tresca)
    n = S_y / σ'   or   n = S_y / σ_T

- σx, σy — normal stresses, tension positive; τxy — shear stress
- θ, θp — angles from the x axis, counter-clockwise positive
- R — maximum in-plane shear; S_y — yield strength

## Assumptions and limitations

- Plane stress: the stress normal to the plane is zero. When σ1 and σ2 have the same sign, the largest shear acts out of the plane and equals half the larger principal stress.
- τxy is positive when it acts in the +y direction on the face whose normal points in +x. A shear that Shigley's Mohr-circle convention marks clockwise (cw) is negative here.
- The yield criteria are for ductile metals that yield equally in tension and compression. Brittle materials such as cast iron need the Coulomb–Mohr or modified Mohr theory.
- The factors of safety are static. A fluctuating stress needs a fatigue check.

## Worked example

A point on a part carries σx = 80 MPa, σy = 0 and a shear of 50 MPa that turns the element clockwise, so τxy = −50 MPa. The steel yields at 250 MPa. These are the stresses of Shigley Example 3-4.

1. Centre: C = 40 MPa. Radius: R = √(40² + 50²) = 64.0 MPa, the maximum in-plane shear.
2. Principal stresses: σ1 = 40 + 64.0 = 104.0 MPa and σ2 = 40 − 64.0 = −24.0 MPa.
3. Direction: θp = ½ atan2(−100, 80) = −25.7°, so σ1 acts 25.7 degrees clockwise from x.
4. von Mises: √(80² + 3 × 50²) = 117.9 MPa, so n = 250 / 117.9 = 2.12.
5. Tresca: 104.0 − (−24.0) = 128.1 MPa, so n = 250 / 128.1 = 1.95.

Tresca is the more cautious of the two criteria. Test results for ductile metals fall mostly between the two, closer to von Mises.

## FAQ

**What are principal stresses?**
The largest and smallest normal stresses at a point. They act on two perpendicular planes that carry no shear.

**How do I find the principal angle?**
θp = ½ atan2(2τxy, σx − σy) gives the angle from the x axis to the plane of σ1. On Mohr's circle the angle is doubled.

**What is the difference between von Mises and Tresca?**
Both predict yield in ductile metals. Tresca uses the largest shear stress and gives safety factors up to about 13 % lower; von Mises uses distortion energy and matches tests more closely.

**Why is the maximum shear sometimes larger than the circle radius?**
When both principal stresses are tensile or both compressive, the third principal stress of zero lies outside them. The largest shear then acts on a plane tilted out of the page.

**What is the von Mises stress for pure shear?**
√3 times the shear stress. A material therefore yields in shear at about 58 % of its tensile yield strength.

**Which sign should the shear stress have?**
Positive when it points in +y on the +x face. If your textbook draws clockwise shear as positive on the circle, enter it with a minus sign here.

## Related calculators

- [Stress and strain](../stress-strain/index.html) — normal stress from an axial force.
- [Shaft torsion](../shaft-torsion/index.html) — shear stress from torque.
- [Fatigue safety factor](../fatigue-goodman/index.html) — fluctuating stresses.
- [Elastic constants](../elastic-constants/index.html) — E, G and Poisson's ratio.
