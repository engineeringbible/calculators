# Spring rate calculator (helical compression spring)

**Summary:** Spring rate, deflection, shear stress with the Wahl factor, solid height and buckling check for round-wire compression springs.

## Introduction

A helical compression spring is a torsion bar wound into a coil: the wire twists as the spring compresses, and its rate, stress and strength follow from four numbers, wire diameter, coil diameter, active coils and the wire's shear modulus, plus the strength of the drawn wire, which rises as the wire gets thinner. Shigley's treatment, used in almost every machine-design course, adds the curvature correction, the end geometry that fixes solid height, a stability limit against buckling and the surge frequency. This calculator follows it, reproducing the textbook's own example, so that a valve spring, a relief-valve spring or a shock-absorbing spring on deck machinery can be checked in a minute.

It is for mechanical engineers and students; it covers static loading, with fatigue left to the designer.

## Formulas

Geometry and rate:

    D = OD − d,   C = D/d   (keep 4 ≤ C ≤ 12)
    N_t = N_a + 0 / 1 / 2 / 2   (plain, plain-ground, squared, squared-ground)
    L_s = d(N_t + 1), d N_t, d(N_t + 1), d N_t   (same order)
    k = d⁴ G / (8 D³ N_a),   y = F/k,   F_s = k (L₀ − L_s)

Stress and strength:

    τ = K 8 F D / (π d³),   K_B = (4C + 2)/(4C − 3)  or  K_W = (4C − 1)/(4C − 4) + 0.615/C
    S_ut = A / d^m   (music wire 2211 MPa·mm^m, m 0.145; hard-drawn 1783/0.190; oil-tempered 1855/0.187; Cr-V 2005/0.168; Cr-Si 1974/0.108; stainless 302 1867/0.146)
    S_sy = 0.45 S_ut (music wire, hard-drawn), 0.50 S_ut (hardened and tempered alloys), 0.35 S_ut (stainless)
    n_s = S_sy / τ   (≥ 1.2 at solid height recommended)

Stability and dynamics:

    stable if L₀ < 2.63 D / α   (α 0.5 fixed–fixed, 0.707, 1.0 hinged, 2.0 fixed–free)
    f = ½ √(k/m),   m = ρ (π d²/4) π D N_a

## Assumptions and limitations

- Static axial load, round wire, Shigley's formulas; the A/d^m fit is valid only inside each wire's diameter range.
- The static torsional yield fractions are for springs without set removal; preset springs may be allowed higher stress.
- No fatigue analysis: cyclic loading needs Zimmerli endurance data with a Goodman or Gerber criterion.
- No temperature, corrosion or relaxation effects; the small variation of G with wire size is ignored.

## Worked example

Shigley Example 10-1: a music-wire spring, wire 0.037 in (0.94 mm), outside diameter 7/16 in (11.11 mm), 12.5 total coils squared and ground, free length 1.25 in (31.75 mm), G = 11.75 Mpsi (81 GPa).

1. D = 0.4005 in (10.17 mm), C = 10.8, K_B = 1.124; N_a = 10.5, L_s = 0.4625 in (11.75 mm).
2. Rate k = d⁴G/(8D³N_a) = 4.08 lbf/in (714 N/m). Deflection to solid 0.7875 in → F_s = 3.21 lbf (14.3 N).
3. S_ut = 201/0.037^0.145 = 324 kpsi (2 231 MPa); S_sy = 0.45 × 324 = 146 kpsi.
4. Stress at solid: 1.124 × 8 × 3.21 × 0.4005/(π × 0.037³) = 72.6 kpsi (500 MPa); n_s = 2.0: the spring can be closed solid without setting.
5. Buckling: 2.63 × 0.4005/0.5 = 2.11 in > 1.25 in: stable between flat plates. Surge frequency about 260 Hz.

At a working force of 2 lbf the deflection is 0.49 in and the safety factor 3.2.

## FAQ

**Wahl or Bergsträsser?**
They differ by about 1 %; Shigley uses Bergsträsser for both static and fatigue. Either is acceptable, but be consistent with the strength data you compare against.

**Why does the wire get stronger as it gets thinner?**
Cold drawing work-hardens the wire; the thinner the wire, the more reduction it has seen. The A/d^m relation captures this and is why small springs tolerate very high stresses.

**What safety factor do I need?**
Shigley recommends at least 1.2 against yielding at solid height so that an over-travel does not set the spring; the working-point factor is then automatically higher.

**My spring buckles. What can I do?**
Shorten it, increase the coil diameter, or guide it on a rod or in a tube (which changes the end condition and the allowable length ratio).

**How many active coils does a squared-and-ground spring have?**
Total coils minus two; the dead coils at each end carry no deflection.

**What is the surge frequency for?**
If the spring is driven near its natural frequency (valve springs, reciprocating machinery) the coils resonate and the stresses multiply; keep the forcing frequency below about f/15.

**Can I use this for extension or torsion springs?**
No: extension springs have initial tension and hook stresses, torsion springs bend rather than twist; both need their own formulas.

## Related calculators

- [Bolt torque and preload](../bolt-torque/index.html) — the other common elastic element in a joint.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torsional stress in round bars.
- [Hydraulic cylinder force and speed](../hydraulic-cylinder/index.html) — actuators that often work against springs.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — spring-supported pipework.
