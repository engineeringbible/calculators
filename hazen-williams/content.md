# Hazen–Williams head loss calculator

**Summary:** Hazen–Williams friction loss of water in a pressure pipe, or the flow or pipe diameter for an allowed loss, with velocity, pressure drop and C-factors.

## Introduction

The Hazen–Williams equation estimates the friction loss of water flowing full in a pipe from the flow, the bore, the length and a roughness factor C. Smooth plastic pipe has C = 150 and old unlined iron about 100, and a lower C means more loss. Pumping 500 US gpm through 1 000 ft of 6 in plastic pipe loses 15.7 ft of head, a pressure drop of 6.8 psi.

This calculator solves the equation for the head loss, the flow or the inside diameter, and shows the velocity and the pressure drop. It includes the C-factors of NFPA 13 for common pipe materials. It is for engineers and contractors sizing water mains, irrigation lines, fire sprinkler piping and pump suction and discharge lines.

## Formulas

Head loss in SI units, with Q in m³/s and d and L in m:

    h_f = 10.67 L Q^1.852 / (C^1.852 d^4.8704)

US form used by NFPA 13, with Q in gpm and d in inches:

    p = 4.52 Q^1.85 / (C^1.85 d^4.87)      psi per foot of pipe

Both come from the original velocity form, with the hydraulic radius R = d/4 of a full pipe:

    V = 0.849 C R^0.63 S^0.54   (SI),     V = 1.318 C R^0.63 S^0.54   (US)

Velocity and pressure drop:

    V = Q / (π d² / 4),     Δp = ρ g h_f

- h_f — friction head loss; S = h_f / L — slope of the hydraulic grade line
- C — Hazen–Williams factor of the pipe material
- d — inside diameter, not the nominal size
- ρ = 999.1 kg/m³ for water at 15 °C; g = 9.81 m/s²

| Pipe material (NFPA 13 Table 28.3.4.8.1) | C |
|---|---|
| Plastic (PVC, CPVC, PE), listed | 150 |
| Copper tube, brass or stainless steel | 150 |
| Cement-lined cast or ductile iron | 140 |
| Asbestos cement, concrete | 140 |
| Black or galvanized steel, wet systems | 120 |
| Black or galvanized steel, dry systems | 100 |
| Unlined cast or ductile iron | 100 |

## Assumptions and limitations

- The equation is for water near 15 °C (60 °F). It has no viscosity term, so it fails for oils, glycol mixtures and hot water. Use Darcy–Weisbach for those.
- It was fitted to pipes of about 50 mm (2 in) bore and up, at roughly 0.3 to 3 m/s (1 to 10 ft/s). The page warns outside that range.
- The C-factors are design values. Old, scaled or tuberculated pipe can fall well below them, and fire codes may require a specific value.
- Only straight-pipe friction is included. Add fittings as equivalent length, or use the minor losses calculator, and add elevation changes separately.

## Worked example

A 6 in plastic main with an inside diameter of 6.00 in carries 500 US gpm over 1 000 ft. Take C = 150. What are the head loss and the pressure drop?

1. In SI units: Q = 500 × 0.00006309 = 0.03155 m³/s, d = 0.1524 m, L = 304.8 m.
2. Velocity: V = 0.03155 / (π × 0.1524² / 4) = 1.73 m/s, or 5.67 ft/s.
3. Head loss: h_f = 10.67 × 304.8 × 0.03155^1.852 / (150^1.852 × 0.1524^4.8704) = 4.80 m, or 15.7 ft.
4. Per 100 ft of pipe: 15.7 / 10 = 1.57 ft.
5. Pressure drop: 999.1 × 9.81 × 4.80 = 47.0 kPa, or 6.82 psi.

The NFPA 13 form gives 4.52 × 500^1.85 / (150^1.85 × 6^4.87) × 1 000 = 6.81 psi. An 8 in main would lose only 3.9 ft for the same flow.

## FAQ

**What is the Hazen–Williams C factor?**
A number that describes how smooth the pipe is for water. It runs from about 150 for plastic and copper down to 100 or less for old iron and steel.

**Hazen–Williams or Darcy–Weisbach?**
Darcy–Weisbach works for any liquid, temperature and pipe size. Hazen–Williams is simpler and is standard for water mains and sprinkler systems. For 20 L/s of water in 150 mm PVC pipe the two differ by only 1 %.

**How much does head loss rise with flow?**
With the flow to the power 1.852. Doubling the flow multiplies the friction loss by 3.6.

**How much does a bigger pipe help?**
The loss falls with the diameter to the power 4.87. Going from 6 in to 8 in cuts the loss by about three quarters.

**Do I use the nominal or the inside diameter?**
The inside diameter. A 6 in Schedule 40 steel pipe has a 6.07 in bore and a Schedule 80 pipe 5.76 in, which raises the loss by 28 %.

**How do I convert head loss to pressure?**
Multiply by the density and gravity. For water, 1 ft of head is 0.433 psi and 1 m of head is 9.8 kPa.

**Does C change as the pipe ages?**
Yes, especially in unlined iron and steel, which corrode and build up scale. Use a lower C for old pipe, or a value measured in a flow test.

## Related calculators

- [Total dynamic head (TDH) calculator](../total-dynamic-head/index.html) — the pump head with friction, fittings and lift.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — Darcy–Weisbach for any fluid.
- [Minor losses calculator](../minor-losses/index.html) — losses in fittings and valves.
- [Flow rate and pipe velocity](../flow-rate-velocity/index.html) — velocity for a flow and bore.
