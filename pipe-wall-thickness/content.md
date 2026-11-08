# Pipe wall thickness (ASME B31.3) calculator

**Summary:** ASME B31.3 pressure design thickness, allowances and mill tolerance, nominal wall required, schedule check and MAWP of the available wall.

## Introduction

How thick must a pipe wall be? ASME B31.3, the process piping code, answers with a formula that is Barlow's hoop-stress equation adjusted for the outside diameter, the weld quality and a temperature-dependent coefficient, and then with allowances: corrosion that will eat the wall over its life, thread or groove depth, and the under-tolerance the mill is allowed on the wall it delivers. This calculator walks through those steps, compares the required nominal wall with the schedule you intend to use, and turns the question round to give the maximum allowable working pressure of that schedule, which usually shows that low-pressure pipe is governed by corrosion and handling, not pressure.

It is for mechanical and marine engineers specifying piping, for anyone checking a pipe class or a vendor's data sheet, and for students of pressure design.

## Formulas

    t = P D / (2 (S E W + P Y))          B31.3 eq. (3a), valid for t < D/6 and P/(S E) ≤ 0.385
    t_m = t + c                           c = corrosion/erosion + mechanical (thread, groove) allowance
    t_nom ≥ t_m / (1 − mill tolerance)   12.5 % for ASTM A106/A53/A312 (A530)
    t_eff = t_avail (1 − tol) − c,   MAWP = 2 S E W t_eff / (D − 2 Y t_eff),   σ_hoop = P D / (2 t_eff)

Y (Table 304.1.1): ferritic 0.4 to 482 °C, 0.5 to 510 °C, 0.7 above; austenitic 0.4 to 566 °C, 0.5 to 593 °C, 0.7 above; cast iron 0. E: seamless 1.0, ERW 0.85, EFW single 0.80 / double spot-radiographed 0.90, furnace butt 0.60.

## Assumptions and limitations

- Internal pressure in straight pipe; sustained, occasional, thermal and external loads are separate code checks.
- Allowable stresses in the table are low-temperature values; enter S at the design temperature above 200 °C.
- Class rules for shipboard piping use their own constants and minimum wall tables.

## Worked example

NPS 8 (219.1 mm) ASTM A106 Grade B seamless pipe, 16 bar at 100 °C, 1.5 mm corrosion allowance, 12.5 % mill tolerance; schedule 40 (8.18 mm) proposed.

1. S = 137.9 MPa, E = 1.0, W = 1.0, Y = 0.4: t = 1.6 × 219.1/(2 × (137.9 + 0.64)) = 1.27 mm.
2. t_m = 1.27 + 1.5 = 2.77 mm; nominal required 2.77/0.875 = 3.16 mm.
3. Schedule 40 passes with room to spare: effective wall 8.18 × 0.875 − 1.5 = 5.66 mm, MAWP 72.7 bar; the 16 bar design uses 22 % of it and the hoop stress is 31 MPa.
4. Even schedule 10 (3.76 mm) would satisfy the pressure requirement at 16 bar, failing only at about 25 bar; the schedule is chosen for corrosion life, stiffness and handling.

For ERW pipe (E 0.85) the pressure thickness rises to 1.49 mm; at 600 °C an austenitic steel takes Y = 0.7 and a much lower S.

## FAQ

**Why the outside diameter?**
B31.3 writes the formula on the outside diameter, which is fixed by the pipe size, and the Y term compensates; the inside-diameter form (eq. 3b) gives the same result.

**What does Y do?**
It shifts the formula from a thin-wall outside-diameter basis toward the mean-diameter (Lamé) result; at high temperature, where creep redistributes stress, Y rises toward 0.7.

**Why a 12.5 % tolerance?**
ASTM allows the delivered wall to be 12.5 % under nominal; the code requires the minimum delivered wall to meet t_m, so the ordered nominal must be larger.

**Where do E and W come from?**
E (Table A-1B) reflects the longitudinal weld examination; W (para. 302.3.5) reduces the strength of welds in creep range, 1.0 below about 510 °C.

**Does this apply to ship piping?**
The physics is the same; class rules (DNV, LR, ABS) give their own allowable stresses, allowances and minimum thickness tables, which govern on board.

**What about bends and fittings?**
Bends need an extra thickness on the intrados (para. 304.2.1); fittings are rated by their own standards (B16.9, B16.5).

## Related calculators

- [Pressure vessel thickness](../pressure-vessel/index.html) — shells and heads to the vessel code.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the pressure the wall must contain.
- [Water hammer](../water-hammer/index.html) — surge pressures above the steady value.
- [Thermal expansion](../thermal-expansion/index.html) — pipe growth between anchors.
- [Bolt torque and preload](../bolt-torque/index.html) — flanged joints.
