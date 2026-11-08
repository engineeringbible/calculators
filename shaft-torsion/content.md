# Shaft torsion calculator (shear stress, twist, diameter)

**Summary:** Shear stress and angle of twist of solid and hollow round shafts, the torque they can carry, the diameter for an allowable stress or twist, and power to torque.

## Introduction

A shaft that transmits torque twists, and the shear stress in it grows from zero at the centre to a maximum at the surface. For a solid round shaft the surface stress is 16 T / (π d³). A 40 mm steel bar carrying 340 N·m sees 27 MPa and twists 1.26 degrees over 1.3 m.

This calculator checks a solid or hollow shaft for shear stress and angle of twist, and gives the largest torque it can carry within your limits. It can also size the shaft: the diameter needed for an allowable stress, an allowable twist, or both. Torque can be entered directly or from power and speed. It is for engineers and students designing drive shafts, couplings, spindles and torsion bars.

## Formulas

    J = π (d_o⁴ − d_i⁴) / 32
    τ = T r / J = 16 T / (π d_o³ (1 − k⁴)),    k = d_i / d_o
    θ = T L / (G J)
    T = P / ω = 9 549 P[kW] / n[rpm]    N·m

Allowable torque and required diameter:

    T_τ = τ_allow J / r,    T_θ = θ_allow G J / L
    d_τ = [16 T / (π τ_allow (1 − k⁴))]^(1/3)
    d_θ = [32 T L / (π G θ_allow (1 − k⁴))]^(1/4)

- T — torque; d_o, d_i — outside and inside diameters; r = d_o/2
- L — length between the torques; G — shear modulus (81 GPa for steel, 27 GPa for aluminium)
- θ — angle of twist in radians; τ_allow, θ_allow — the limits you set

## Assumptions and limitations

- The shaft is straight, round and uniform, and stays elastic. Plane sections remain plane and the stress grows linearly with radius.
- Keyways, splines, shoulders and holes raise the local stress. Apply a stress-concentration factor or a code allowable that includes one.
- Only torsion is checked. Most shafts also bend, which needs a combined stress check, and varying torque needs a fatigue check.
- Torque from power assumes steady running. Starting torque, shock loads and torsional vibration can be much higher.
- A twist limit per metre is entered as the allowable angle with a length of 1 m.

## Worked example

A solid steel bar 40 mm in diameter and 1.3 m long carries a torque of 340 N·m. Take G = 80 GPa. The allowable shear stress is 42 MPa and the twist may not exceed 2.5 degrees. These are the data of Gere and Goodno Example 3-1.

1. Polar moment: J = π × 40⁴ / 32 = 251 327 mm⁴.
2. Shear stress: τ = 16 × 340 / (π × 0.040³) = 27.1 MPa.
3. Twist: θ = 340 × 1.3 / (80 × 10⁹ × 2.513 × 10⁻⁷) = 0.0220 rad, or 1.26 degrees.
4. Torque allowed by the stress: 42 × 10⁶ × 2.513 × 10⁻⁷ / 0.020 = 528 N·m.
5. Torque allowed by the twist: 80 × 10⁹ × 2.513 × 10⁻⁷ × 0.04363 / 1.3 = 675 N·m.

The stress limit governs, so the bar can carry 528 N·m. At 340 N·m it uses 64 % of that.

## FAQ

**How do I calculate the shear stress in a shaft?**
τ = 16 T / (π d³) for a solid shaft. For a hollow one, divide by (1 − k⁴), where k is the ratio of inside to outside diameter.

**How do I calculate the angle of twist?**
θ = T L / (G J) in radians. Multiply by 57.3 for degrees.

**What diameter shaft do I need for a given power?**
Find the torque with T = 9 549 P / n, then the diameter for your allowable stress. A 15 kW motor at 1 450 rpm gives 98.8 N·m and needs 23.3 mm of steel at 40 MPa.

**Why are hollow shafts used?**
The core of a solid shaft carries little stress. A tube with a bore of 60 % of its diameter needs a diameter only 4.7 % larger for the same stress and weighs about 30 % less.

**What is a typical twist limit?**
There is no single value. It depends on the accuracy and stiffness the drive needs, so take it from the governing standard or the customer.

**What is the shear modulus of steel?**
Eurocode 3 uses 81 GPa for structural steel; the worked example uses 80 GPa. Stainless steels are lower, about 77 GPa.

## Related calculators

- [Shaft torque, power and diameter](../shaft-torque/index.html) — combined bending and torsion and the marine rule diameter.
- [Torque, power and speed](../torque-power-rpm/index.html) — converting power and speed to torque.
- [Mohr's circle](../mohr-circle/index.html) — combining torsion with bending stresses.
- [Shaft critical speed](../shaft-critical-speed/index.html) — whirling of the shaft.
