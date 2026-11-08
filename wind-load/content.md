# Wind load calculator (Eurocode and ASCE 7)

**Summary:** Wind pressure at any height by EN 1991-1-4 (peak velocity pressure) or ASCE 7-16 (velocity pressure q_z), and the wind force on an area.

## Introduction

Wind pressure rises with the square of the wind speed, and the wind gets stronger with height and over open ground. Building codes turn a mapped basic wind speed into a pressure at the height of interest, allowing for the terrain and gusts. In open country in Europe with a 27 m/s basic wind, the peak pressure 10 m above the ground is about 1.07 kPa; in a US suburb at 115 mph it is about 20 psf at 30 ft.

This calculator gives that pressure by the Eurocode EN 1991-1-4 (peak velocity pressure q_p) or the US standard ASCE 7-16 (velocity pressure q_z), with the exposure factors used. With a force or pressure coefficient and an area, it also gives the wind force. It is for engineers and builders checking signs, walls, roofs, canopies, fences and small structures.

## Formulas

Eurocode EN 1991-1-4, terrain roughness z₀ and the basic wind speed v_b:

    k_r = 0.19 (z₀ / 0.05)^0.07,   c_r = k_r ln(z / z₀)
    v_m = c_r v_b,   I_v = 1 / ln(z / z₀)
    q_p = (1 + 7 I_v) × ½ ρ v_m²,   ρ = 1.25 kg/m³

ASCE 7-16, exposure B, C or D:

    K_z = 2.01 (z / z_g)^(2/α)       (z at least 15 ft)
    q_z = 0.00256 K_z K_zt K_d K_e V²    psf, V in mph

Force on an area:

    F = q × C × A

- Terrain categories 0 to IV: z₀ = 0.003, 0.01, 0.05, 0.3, 1.0 m
- Exposure B, C, D: α = 7.0, 9.5, 11.5 and z_g = 1 200, 900, 700 ft
- K_zt — topography (1 on flat ground); K_d — directionality (0.85 for buildings)

## Assumptions and limitations

- The basic wind speed comes from the national annex map or the ASCE 7 wind map for the risk category. Eurocode speeds are 10-minute means; ASCE speeds are 3-second gusts, so the numbers are not comparable.
- Flat terrain is assumed. Hills, ridges and escarpments speed the wind up; enter K_zt for ASCE, or an orography factor through a higher v_b for the Eurocode.
- The force uses one coefficient for the whole area. Real design applies different external and internal pressure coefficients to each zone of the walls and roof; corners and edges see much higher suction.
- ASCE 7-22 revised some exposure constants and maps. Use the edition your building code adopts.

## Worked example

A building in open country with low vegetation (terrain category II) has a basic wind speed of 27 m/s. What is the peak velocity pressure 10 m above the ground?

1. Roughness factor: k_r = 0.19 × (0.05 / 0.05)^0.07 = 0.19, so c_r = 0.19 × ln(10 / 0.05) = 1.007.
2. Mean wind speed: v_m = 1.007 × 27 = 27.2 m/s.
3. Turbulence intensity: I_v = 1 / ln(200) = 0.189.
4. Peak pressure: q_p = (1 + 7 × 0.189) × ½ × 1.25 × 27.2² = 1.07 kPa.

The exposure factor, q_p divided by the basic pressure ½ ρ v_b², is 2.35, as read from Figure 4.2 of the Eurocode.

## FAQ

**How do I calculate wind pressure from wind speed?**
The basic dynamic pressure is ½ ρ v², about 0.613 v² Pa with v in m/s, or 0.00256 V² psf with V in mph. Codes then multiply it by factors for height, terrain and gusts.

**What is the wind pressure at 100 mph?**
0.00256 × 100² = 25.6 psf before factors. At 33 ft in open terrain (K_z = 1.0, K_d = 0.85) it is 21.8 psf.

**What is the difference between exposure B, C and D?**
B is urban and suburban terrain with many obstructions, C is open terrain with scattered obstructions, and D is flat ground facing open water. The wind is strongest near the ground in D.

**What are Eurocode terrain categories?**
From 0 (open sea) to IV (city centres). Rougher terrain slows the wind near the ground but makes it gustier.

**How do I get the wind force on a sign or wall?**
Multiply the pressure by a force coefficient and the area. Free-standing signs and walls have force coefficients of about 1.2 to 2.0, given in the code for their proportions.

**Why does wind pressure increase with height?**
Friction with the ground slows the wind near the surface. The wind speeds up with height until it reaches the free-stream speed above the boundary layer.

## Related calculators

- [Snow load calculator](../snow-load/index.html) — the other main roof load.
- [Air density calculator](../air-density/index.html) — density behind ½ ρ v².
- [Beam deflection](../beam-deflection/index.html) — members under the wind load.
- [Moment of inertia (section properties)](../moment-of-inertia/index.html) — section properties of the members.
