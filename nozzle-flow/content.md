# Nozzle flow calculator (orifice, fire nozzle and K-factor)

**Summary:** Water flow, pressure or orifice size of a nozzle, hydrant outlet or sprinkler from Q = Cd A √(2Δp/ρ), 29.84 c d² √p or Q = K√p, with nozzle reaction.

## Introduction

How much water comes out of a nozzle? The pressure at the nozzle turns into jet velocity, and the flow is that velocity times the opening area times a discharge coefficient. Fire crews use the same physics in the form Q = 29.84 c d² √p, in gpm, inches and psi. A 1-1/8 inch smooth-bore tip at 50 psi flows about 266 gpm.

This calculator gives the flow from the size and pressure, the pressure for a flow, or the orifice size for a flow and pressure. It works with an orifice diameter and discharge coefficient, or with a K-factor for sprinklers and spray nozzles. It also gives the jet velocity, the equivalent K-factor and the reaction force the crew or the pipe support must hold. It is for fire protection engineers, fire crews, hydrant testers and anyone sizing spray nozzles.

## Formulas

Orifice equation, any consistent units:

    Q = Cd × A × √(2 Δp / ρ),   A = π d² / 4

Fire-service form (NFPA 291), Q in gpm, d in inches, p in psi:

    Q = 29.84 × c × d² × √p

K-factor form (NFPA 13), US gpm/psi½ or metric L/min/bar½:

    Q = K × √p,   K_metric = 14.42 × K_US

Jet velocity and nozzle reaction:

    v = √(2 Δp / ρ)
    F = ρ × Q × v          (= 1.57 d² p in lbf for a smooth bore, IFSTA)
    F_fog = 0.0505 × Q × √p   (IFSTA fog nozzle, lbf, gpm, psi)

- Q — flow; Δp, p — gauge pressure at the nozzle or pitot pressure in the jet
- d — orifice or tip diameter; A — its area
- Cd, c — discharge coefficient; ρ — liquid density, 999 kg/m³ for fresh water
- K — K-factor, which holds the area and the discharge coefficient together

## Assumptions and limitations

- The jet discharges to the atmosphere. The velocity of the water approaching the nozzle is neglected, which is fine when the nozzle is much smaller than the hose or pipe.
- The discharge coefficient comes from the nozzle shape. A smooth-bore fire nozzle is 0.97 to 1.0. NFPA 291 gives 0.90 for a smooth rounded hydrant outlet, 0.80 for a square sharp one and 0.70 for one projecting into the barrel. A sharp-edged hole is about 0.6.
- The reaction uses the ideal jet velocity. It equals the IFSTA smooth-bore formula 1.57 d² p when Cd is 1. The IFSTA fog-nozzle formula is shown too and gives about 4 % less.
- Sprinkler K-factors come from the listing of the sprinkler. NFPA 13 requires at least 7 psi (0.5 bar) at any operating sprinkler, and the calculator warns below that.

## Worked example

A hydrant flow test uses a 2½ inch outlet with a smooth rounded lip, c = 0.90. The pitot gauge in the stream reads 23 psi. What is the flow?

1. Fire-service formula: 29.84 × 0.90 × 2.5² × √23 = 805 US gpm.
2. Area: π / 4 × 0.0635² = 0.003167 m². Pressure: 23 psi = 158.6 kPa.
3. Jet velocity: √(2 × 158 579 / 999) = 17.82 m/s, or 58.5 ft/s.
4. Orifice equation: 0.90 × 0.003167 × 17.82 = 0.0508 m³/s, the same 805 US gpm.
5. Equivalent K-factor: 805 / √23 = 167.8 gpm/psi½.
6. Reaction: 999 × 0.0508 × 17.82 = 904 N, or 203 lbf.

The City of Temecula's fire flow examples print 804 gpm for the same test; the difference is rounding.

## FAQ

**How do I calculate the flow from a nozzle?**
Multiply the discharge coefficient, the opening area and the jet velocity √(2Δp/ρ). In US fire-service units the shortcut is 29.84 × c × d² × √p.

**What is a K-factor?**
The flow at a pressure of 1 psi (or 1 bar), so that Q = K√p. A standard K 5.6 sprinkler flows 5.6 × √7 = 14.8 gpm at the 7 psi minimum.

**How do I convert a US K-factor to metric?**
Multiply by 14.42. K 5.6 becomes about K80, and K 8.0 becomes about K115.

**What discharge coefficient should I use for a hydrant?**
NFPA 291 uses 0.90 for a smooth, well-rounded outlet, 0.80 for a square sharp outlet and 0.70 for an outlet that projects into the barrel. Feel the inside lip of the outlet to decide.

**What is nozzle reaction?**
The push-back force of the jet, equal to its momentum flow. For a smooth bore it is 1.57 × d² × p in pounds; a 7/8 inch tip at 50 psi pushes back about 60 lb.

**Why does doubling the pressure not double the flow?**
Flow grows with the square root of pressure. Doubling the pressure raises the flow by only 41 %, while doubling the orifice diameter quadruples it.

## Related calculators

- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — metering orifices in a pipe.
- [Pump power](../pump-power/index.html) — the power to supply the nozzles.
- [Total dynamic head](../total-dynamic-head/index.html) — friction and static head up to the nozzle.
- [Minor losses](../minor-losses/index.html) — losses in the fittings and valves on the way.
