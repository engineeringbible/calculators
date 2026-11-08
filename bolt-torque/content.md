# Bolt torque and preload calculator

**Summary:** Preload and tightening torque for ISO metric bolts by the VDI 2230 method, with property class, friction, proof load and preload scatter.

## Introduction

A bolted joint works because of preload, not torque: the clamp force holds the parts together and carries the external load. Torque is only the means of producing that preload, and most of it, typically 85–90 %, is spent overcoming friction in the thread and under the head. This calculator follows the VDI 2230 method used throughout European mechanical engineering: it determines the preload a bolt can take (90 % of yield under the combined tension and thread torsion of tightening, or a fraction of the ISO 898-1 proof load, or a value you give) and converts it to a tightening torque for the actual friction condition and bearing diameter. It reports the thread and under-head shares of the torque, the equivalent nut factor K, the stresses, and the minimum preload after torque-wrench scatter.

Marine and mechanical engineers use it for flange, foundation and coupling bolts when no manufacturer table applies; students use it to see why "T = 0.2 F d" is only a rough rule.

## Formulas

Thread geometry (ISO 68-1, coarse pitch P, nominal diameter d):

    d₂ = d − 0.6495 P        pitch diameter
    d₃ = d − 1.2269 P        minor diameter
    d_s = (d₂ + d₃) / 2
    A_s = π d_s² / 4          tensile stress area

Proof load (ISO 898-1):

    F_p = S_p × A_s

Assembly preload at 90 % yield under combined stress (VDI 2230 eq. R8/1):

    F_M = A_s × 0.9 R_p0.2 / √( 1 + 3 [ (3/2)(d₂/d_s)( P/(π d₂) + 1.155 μ_G ) ]² )

Tightening torque (VDI 2230 eq. R8/4):

    M_G = F_M (0.16 P + 0.58 d₂ μ_G)          thread torque
    M_K = F_M μ_K D_Km / 2                     under-head friction torque
    M_A = M_G + M_K
    D_Km = (d_w + d_h) / 2                     mean bearing diameter: head bearing OD and hole diameter

Stresses during tightening:

    σ = F_M / A_s,   τ = M_G / (π d_s³ / 12),   σ_red = √(σ² + 3 τ²)

Equivalent nut factor and the rule of thumb:

    K = M_A / (F_M d)        (≈ 0.20 for μ_G = μ_K = 0.15, Shigley)
    T₀.₂ = 0.2 F_M d

Minimum preload after scatter:

    F_M,min = F_M / α_A      α_A 1.6–2.0 for a standard torque wrench

- μ_G, μ_K — thread and under-head friction coefficients; R_p0.2 — yield or 0.2 % proof strength; S_p — ISO 898-1 proof stress

## Assumptions and limitations

- The VDI torque formula uses the standard approximations 0.16 ≈ 1/(2π) and 0.58 ≈ 1/(2 cos 30°) for 60° threads and treats friction as Coulomb friction with a constant coefficient.
- Friction is the dominant uncertainty. The presets are mid-values of the VDI 2230 friction classes; the real coefficient of a given bolt, nut, coating and lubricant can lie anywhere in the class range, which changes the torque for a given preload by ±30 %.
- The default bearing diameter is for an ISO 4014/4017 hex head on an ISO 273 medium clearance hole. Washers, flange bolts, socket-head cap screws and nuts have different bearing areas; enter D_Km when it matters.
- Strength values are ISO 898-1 minimums (8.8 is 660/600 MPa above M16). Stainless A2-70 and A4-80 use R_p0.2 as proof stress and are specified up to M24.
- The 90 %-yield preload uses the plastic torsion modulus π d_s³/12 as in VDI 2230, which is why it reproduces the VDI tables; a purely elastic von Mises check would give about 8 % less.
- Torque control gives preload scatter; the minimum preload F_M/α_A is what the joint can rely on. Angle- or yield-controlled tightening is more accurate but outside this calculator.
- No joint analysis: embedding losses, external load sharing (load factor), thread engagement and stripping, fatigue, gaskets and temperature effects require the full VDI 2230 procedure or an equivalent.
- Coarse ISO threads only.

## Worked example

M12 × 1.75, property class 8.8, dry zinc-plated (μ_G = μ_K = 0.14), hex head on a 13.5 mm hole.

1. Geometry: d₂ = 12 − 0.6495 × 1.75 = 10.863 mm, d₃ = 9.853 mm, d_s = 10.358 mm, A_s = 84.3 mm².
2. Strength: R_p0.2 = 640 MPa, S_p = 580 MPa → proof load 580 × 84.3 = 48.9 kN.
3. Preload at 90 % yield: the bracket term is 1.5 × (10.863/10.358) × (1.75/(π × 10.863) + 1.155 × 0.14) = 0.335; √(1 + 3 × 0.335²) = 1.156; F_M = 84.3 × 576 / 1.156 = 42.0 kN. VDI 2230 Table A1 lists 41.9 kN.
4. Torque: D_Km = (16.63 + 13.5)/2 = 15.07 mm. M_G = 42.0 × (0.16 × 1.75 + 0.58 × 10.863 × 0.14) = 42.0 × 1.162 = 48.8 N·m; M_K = 42.0 × 0.14 × 15.07/2 = 44.3 N·m; M_A = 93 N·m, the VDI table value.
5. Nut factor: K = 93 / (42.0 × 12) = 0.185. The 0.2 rule would give 101 N·m, 8 % high.
6. Scatter: with α_A = 1.7 the minimum preload is 42.0 / 1.7 = 24.7 kN.

With MoS₂ paste (μ = 0.08) the same bolt reaches 44.9 kN preload at only 61 N·m. Using the dry torque on a lubricated bolt would overload it: that is why the friction condition must match the torque table.

## FAQ

**Why not just use T = 0.2 F d?**
Because K ranges from about 0.10 (well lubricated) to 0.30 (dry, rough). For a given torque the preload can vary by a factor of three. K = 0.2 happens to match μ ≈ 0.15.

**Should the preload be 90 % of yield? That sounds high.**
During tightening, yes: VDI 2230 and most European tables use 90 % of yield including the torsion. The torsional stress largely relaxes after tightening, leaving a safe tensile stress. US practice quotes 75 % of proof load for reusable and 90 % for permanent joints; both options are available.

**What is the difference between yield and proof load?**
Proof stress S_p (ISO 898-1) is about 90 % of the minimum yield; a bolt loaded to its proof load must show no permanent set. Preloads are usually set relative to proof or yield, never to ultimate strength.

**Do I need a washer?**
A hardened washer increases D_Km (more under-head torque) and protects the surface. Enter the washer outside diameter and the hole diameter via the "given" bearing option.

**How accurate is torque tightening?**
±17 % to ±43 % on preload for a torque wrench depending on how well the friction is known (VDI α_A 1.4–2.0); impact wrenches are far worse. If the joint is critical, use angle control or ultrasonic length measurement.

**Can I use the result for fine threads or UNC/UNF bolts?**
Not directly. Fine threads have a larger stress area and smaller pitch; inch threads have different geometry and SAE grades. The formula structure is the same if you compute d₂, d₃ and A_s for that thread.

**Does the bolt loosen if I lubricate it?**
Lubrication lowers the torque needed for a given preload; it does not reduce the clamp force. Loosening is governed by preload, joint stiffness and transverse movement, not by lubrication as such.

## Related calculators

- [Shaft torque, power and diameter](../shaft-torque/index.html) — torque capacity of the shaft the coupling bolts serve.
- [Beam deflection and bending stress](../beam-deflection/index.html) — bending of the flange or bracket being bolted.
- [Thin-wall pressure vessel](../pressure-vessel/index.html) — flange loads from internal pressure.
- [Engineering unit converter](../unit-converter/index.html) — N·m to lbf·ft, kN to lbf.
