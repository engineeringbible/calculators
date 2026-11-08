# Fillet weld strength calculator

**Summary:** Throat area and design resistance of fillet welds under shear, tension and bending (Eurocode 3 directional and simplified methods).

## Introduction

Fillet welds carry load through their throat, the thinnest section of the triangular bead, and Eurocode 3 gives two ways to check them: a simplified method that treats every force as shear on the throat with one design strength, and a directional method that resolves the stresses on the throat plane and credits welds loaded across their axis with about 22 % more resistance. This calculator applies both to a group of parallel welds carrying a transverse force, a longitudinal shear and an in-plane moment, reports the stresses and utilisations, the throat needed for full utilisation, and checks the practical limits on throat size and effective length.

It is for structural and marine engineers sizing brackets, lugs, stiffeners and foundation connections, and for students of steel connections.

## Formulas

    a = z/√2   (throat from leg),   f_vw,d = f_u / (√3 β_w γ_M2),   F_w,Rd = f_vw,d a

Forces per weld (n parallel welds, moment couple over spacing h):

    F_⊥ = F_transverse/n + M/h,   F_∥ = F_longitudinal/n
    simplified:   F_w,Ed = √(F_⊥² + F_∥²)/L ≤ F_w,Rd
    directional:  σ⊥ = τ⊥ = F_⊥/(√2 a L),  τ∥ = F_∥/(a L)
                  √(σ⊥² + 3(τ⊥² + τ∥²)) ≤ f_u/(β_w γ_M2)   and   σ⊥ ≤ 0.9 f_u/γ_M2

Steel data (t ≤ 40 mm): S235 f_u 360 MPa β_w 0.80; S275 430/0.85; S355 490/0.90; S420 520/1.00; S460 540/1.00; γ_M2 = 1.25.

Limits: a ≥ 3 mm; a ≤ 0.7 t_min (practice); L_eff ≥ 30 mm and ≥ 6a; L_eff ≤ 150a without the long-weld reduction β_Lw.

## Assumptions and limitations

- Equal-leg fillet welds, static ultimate-limit-state design to EN 1993-1-8 with matching weld metal; fatigue is EN 1993-1-9.
- The moment is resisted by a force couple between two welds at spacing h: exact for two equal welds, conservative for more; eccentric and torsional weld groups need a polar analysis.
- End craters, partial penetration and inspection levels are not modelled; the simplified method is always the safe side.
- National Annexes may change γ_M2.

## Worked example

Two S355 fillet welds, throat 5 mm, 200 mm long each, connecting a 10 mm bracket plate carrying 300 kN across the weld axis and 100 kN along it.

1. f_vw,d = 490/(√3 × 0.90 × 1.25) = 251.5 MPa; F_w,Rd = 251.5 × 5 = 1 257 N/mm per weld.
2. Per weld: 150 kN transverse and 50 kN longitudinal → 750 and 250 N/mm; resultant 791 N/mm. Simplified utilisation 791/1 257 = 63 %.
3. Directional: σ⊥ = τ⊥ = 750/(√2 × 5) = 106 MPa, τ∥ = 250/5 = 50 MPa; comparison stress √(106² + 3(106² + 50²)) = 231 MPa against 490/(0.9 × 1.25) = 436 MPa → 53 %; σ⊥ = 106 ≤ 353 MPa.
4. Geometry: a = 5 mm ≥ 3 mm and ≤ 7 mm (0.7 × 10); L = 200 mm between 30 mm and 750 mm (150a). OK.
5. Adding a 20 kN·m moment with the welds 200 mm apart adds 100 kN per weld transversely: utilisations rise to 97 % (simplified) and 83 % (directional); at 900 kN transverse the joint fails and a 9 mm throat is required.

## FAQ

**Why does the directional method give more capacity?**
A weld loaded across its axis carries the force as a combination of normal and shear stress on the throat; the von Mises-type criterion with β_w credits that, while the simplified method treats everything as pure shear.

**Throat or leg?**
Drawings usually call out the leg z; the calculation uses the throat a = z/√2 for equal legs. A 7 mm leg is a 5 mm throat.

**What is β_w?**
A correlation factor that scales the weld strength to the parent metal grade; weaker grades get a lower β_w (more weld strength relative to f_u), high grades 1.0.

**Can I use the plate f_y instead of f_u?**
No; Eurocode weld design works with the ultimate strength of the weaker part joined and γ_M2.

**How do I handle a weld all round a bracket?**
Resolve the welds into parallel groups (side welds and end welds) and check each with its own direction; for eccentric loads use a polar (elastic vector) analysis of the group.

**Is 0.7 t a code rule?**
It is standard fabrication practice to avoid burn-through and excessive heat input; EN 1993-1-8 fixes only the 3 mm minimum and leaves the maximum to good practice.

**What about intermittent welds?**
Sum the effective lengths of the segments (each ≥ 6a and ≥ 30 mm) as L_eff with the number of welds set to 1 per side.

## Related calculators

- [Beam deflection and bending stress](../beam-deflection/index.html) — the members being connected.
- [Bolt torque and preload](../bolt-torque/index.html) — the alternative to welding.
- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — compression members and their end connections.
- [Thin-wall pressure vessel](../pressure-vessel/index.html) — shell welds.
