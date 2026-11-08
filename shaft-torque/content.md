# Shaft torque, power and diameter calculator

**Summary:** Torque from power and speed, shear stress and twist of solid or hollow shafts, required diameter for an allowable stress, combined bending, and the IACS UR M68 rule diameter.

## Introduction

Every rotating machine transmits its power as torque through a shaft, and the shaft must carry that torque without excessive shear stress or twist. This calculator converts power and speed into torque, computes the torsional shear stress and angle of twist of a solid or hollow circular shaft, finds the diameter needed for an allowable shear stress, combines a steady bending moment with the torsion by the classical equivalent-torque and equivalent-moment methods, and checks the shaft against the IACS Unified Requirement M68 minimum diameter used by all classification societies for propulsion shafting.

Marine engineers use it for intermediate and propeller shafts, couplings and thruster drives; mechanical engineers for pump, fan, gearbox and conveyor shafts; students for the torsion chapter and its power-transmission problems.

## Formulas

Torque from power:

    T = P / ω = P / (2π n / 60) = 9 549.3 × P[kW] / n[rpm]      [N·m]

Torsion of a circular shaft (outer diameter d_o, bore d_i, q = d_i/d_o):

    J = π (d_o⁴ − d_i⁴) / 32
    τ_max = T (d_o/2) / J = 16 T / (π d_o³ (1 − q⁴))
    θ = T L / (G J)                                             (radians)

Required outer diameter for an allowable shear stress τ_allow at the same bore ratio:

    d_o = [ 16 T / (π τ_allow (1 − q⁴)) ]^(1/3)

Combined steady bending M and torsion T:

    T_e = √(M² + T²)            equivalent torque (maximum shear stress theory): τ_max = 16 T_e / (π d³ (1 − q⁴))
    M_e = (M + T_e) / 2         equivalent moment (maximum principal stress theory): σ_max = 32 M_e / (π d³ (1 − q⁴))

IACS UR M68 minimum diameter (P in kW, n in rpm, σ_B in N/mm², d in mm):

    d = F k [ P / (n (1 − q⁴)) × 560 / (σ_B + 160) ]^(1/3)

- F = 95 for intermediate shafts in turbine, electric or slip-coupling installations; 100 for other diesel installations and all propeller shafts
- k = 1.00 plain intermediate shaft; 1.10 keyway or transverse hole; 1.20 longitudinal slot; 1.22 propeller shaft, keyless or flanged, oil-lubricated; 1.26 propeller shaft with keyed propeller or water-lubricated bearing
- σ_B is capped by the rule: 600 N/mm² for carbon and carbon-manganese steel and for propeller shafts, 800 N/mm² for alloy-steel intermediate shafts

## Assumptions and limitations

- No transmission losses between the power and the torque: use the power at the section considered (shaft power for shafting, brake power at the engine flange).
- Linear elastic torsion of a straight, uniform circular shaft. Stress concentrations at keyways, fillets, shrink fits and holes are not in the stress outputs; the rule k factors cover them statistically.
- The twist assumes one uniform length; sum stepped shafts section by section.
- Strength sizing only: fatigue under reversed bending, torsional vibration (the second part of UR M68), whirling, deflection and alignment often govern and are not computed.
- Combined loading treats the bending moment as steady; on a rotating shaft the bending stress alternates and a fatigue analysis is needed.
- The UR M68 diameter is a class minimum for conventional propulsion shafting, not a design value, and the σ_B cap must be respected when entering the material strength.

## Worked example

A 8 000 kW medium-speed propulsion plant drives the propeller at 90 rpm through a solid 450 mm steel intermediate shaft, 10 m between couplings; G = 80 GPa; allowable nominal shear stress 55 MPa; material σ_B 600 N/mm², plain shaft (k = 1.0, F = 100).

1. Torque: 9 549.3 × 8 000 / 90 = 848 800 N·m = 849 kN·m.
2. Polar moment: π × 0.45⁴ / 32 = 4.026 × 10⁻³ m⁴ (402 600 cm⁴).
3. Shear stress: 16 × 848 800 / (π × 0.45³) = 47.4 MPa — 86 % of the allowable.
4. Twist: 848 800 × 10 / (80 × 10⁹ × 4.026 × 10⁻³) = 0.0264 rad = 1.51°, i.e. 0.15°/m.
5. Diameter for 55 MPa: (16 × 848 800 / (π × 55 × 10⁶))^(1/3) = 0.428 m = 428 mm; the 450 mm shaft has 5 % in hand.
6. UR M68: 100 × [8 000 / 90 × 560 / 760]^(1/3) = 100 × 65.5^(1/3) = 403 mm; the 450 mm shaft is 12 % above the rule minimum. A keyed propeller shaft of the same material would need 1.26 × 403 = 508 mm.

Adding a steady bending moment of 200 kN·m: T_e = √(200² + 849²) = 872 kN·m, giving τ_max = 48.7 MPa; M_e = (200 + 872)/2 = 536 kN·m, giving σ_max = 59.9 MPa.

## FAQ

**Why does torque fall as speed rises for the same power?**
Power is torque times angular speed. A 8 MW engine at 90 rpm delivers 849 kN·m; the same power at 500 rpm needs only 153 kN·m, which is why geared and high-speed drives have slimmer shafts.

**How hollow can a shaft be?**
A bore of a third of the diameter costs only 1.2 % of the torsional strength; half the diameter costs 6 %. Weight saving is substantial, but beyond about 70 % the wall becomes thin and local buckling and the class rules for hollow shafts take over.

**What allowable shear stress should I use?**
For marine intermediate shafts the nominal shear from the rule formula comes out around 50–60 MPa for ordinary steel; machine design codes give allowables tied to the material and the duty. The rule diameter is the real criterion for class.

**Is the UR M68 diameter all I need for class approval?**
No. It is the minimum diameter; class also requires the torsional vibration calculation (UR M68 Part 2), material certificates, and specific details at couplings, keyways and the propeller taper.

**Why are there two combined-stress results?**
The equivalent torque uses the maximum shear stress (Tresca) criterion appropriate for ductile steels; the equivalent moment uses the maximum principal stress (Rankine) criterion traditional in older marine texts. Reporting both lets you compare with either reference.

**What twist is acceptable?**
Machine shafting is often limited to about 0.25° per metre to keep torsional stiffness; long propulsion lines accept more but their natural frequencies must be checked against engine excitation.

**Can I use this for a non-circular shaft?**
No. The formulas are for circular sections; rectangular or splined sections need the torsion constants from Roark.

## Related calculators

- [Propeller slip and speed through water](../propeller-slip/index.html) — the shaft speed behind the propeller.
- [Pump and fan affinity laws](../pump-affinity/index.html) — torque demand of driven machines at a new speed.
- [Bolt torque and preload](../bolt-torque/index.html) — coupling bolts for the torque found here.
- [Beam deflection and bending stress](../beam-deflection/index.html) — the bending moment on a shaft between bearings.
