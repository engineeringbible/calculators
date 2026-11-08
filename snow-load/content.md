# Snow load calculator (Eurocode and ASCE 7)

**Summary:** Roof snow load from the ground snow load for flat and pitched roofs by EN 1991-1-3 or ASCE 7-16, with exposure, thermal and slope factors.

## Introduction

Snow on a roof weighs less than the snow on the ground nearby: wind blows some away, heat from the building melts some, and steep roofs shed it. Building codes turn the mapped ground snow load into a roof load with a few factors for those effects. For a normal 35° roof in Europe, the roof carries two thirds of the ground load; a flat roof in the US usually carries 70 %.

This calculator gives the balanced roof snow load by the Eurocode (EN 1991-1-3) or the US standard ASCE 7-16, for flat and pitched roofs. It shows the factors used and, if you enter the roof plan area, the total weight of snow. It is for engineers, roof designers and builders checking rafters, trusses and solar panel mounts.

## Formulas

Eurocode EN 1991-1-3:

    s = μ1 × C_e × C_t × s_k
    μ1 = 0.8 for α ≤ 30°,   0.8 (60 − α)/30 for 30° < α < 60°,   0 for α ≥ 60°

ASCE 7-16:

    p_f = 0.7 × C_e × C_t × I_s × p_g      flat roof
    p_s = C_s × p_f                          sloped roof
    p_m = I_s p_g (p_g ≤ 20 psf) or 20 I_s   minimum for slopes under 15°

- s_k, p_g — ground snow load from the national map; α — roof slope
- C_e — exposure: 0.8 windswept to 1.2 sheltered (EN); 0.9 to 1.2 (ASCE)
- C_t — thermal: 1.0 heated, 1.1 cold ventilated roof, 1.2 unheated, 1.3 freezer (ASCE)
- I_s — importance: 0.8, 1.0, 1.1, 1.2 for risk categories I to IV
- C_s — slope factor: 1 up to 30° (warm, rough roof) then falling to 0 at 70°; slippery and cold roofs differ

## Assumptions and limitations

- The ground snow load comes from the national annex map or the ASCE 7 map and local amendments. This page does not look it up.
- Only the balanced, undrifted load is calculated. Drifts against parapets and higher roofs, valleys, sliding snow and unbalanced loads on pitched roofs can be much larger and must be added for design.
- The ASCE exposure factor is simplified to three cases for surface roughness B and C. Use Table 7.3-1 for open country and exact cases.
- ASCE 7-22 changed the ground snow load maps and removed the importance factor. Use the edition your building code adopts.

## Worked example

A house in Europe has a 35° pitched roof. The ground snow load is 1.0 kPa and the site has normal exposure. What is the roof snow load?

1. Shape coefficient: the slope is between 30° and 60°, so μ1 = 0.8 × (60 − 35)/30 = 0.667.
2. Exposure and thermal coefficients: C_e = 1.0, C_t = 1.0.
3. Roof snow load: s = 0.667 × 1.0 × 1.0 × 1.0 = 0.667 kPa.

On a flat roof at the same site, the load would be 0.8 kPa.

## FAQ

**How do I calculate the snow load on a roof?**
Start from the ground snow load for the site, then multiply by the code's factors for roof shape, exposure and heat loss. The Eurocode uses s = μ C_e C_t s_k; ASCE 7 uses 0.7 C_e C_t I_s p_g for flat roofs.

**How much does snow weigh?**
EN 1991-1-3 Annex E gives about 1.0 kN/m³ for fresh snow, 2.0 for settled snow, 2.5 to 3.5 for old snow and 4.0 for wet snow. A metre of settled snow weighs about 2 kPa (40 psf).

**Does a steeper roof carry less snow?**
Yes. Under the Eurocode the load falls from 30° and reaches zero at 60°. Under ASCE 7 a warm, rough roof starts shedding above 30° and slippery roofs much earlier.

**Why does ASCE 7 use 0.7?**
It converts the ground load to a flat roof load, allowing for the wind and heat that remove snow from roofs.

**What about snow drifts?**
Drifts form against walls, parapets and higher roofs and can be several times the balanced load. They are calculated separately with the drift rules of the code.

**Do solar panels change the snow load?**
They make the roof slippery, so snow can slide sooner, and they can create drifts and sliding loads on lower roofs.

## Related calculators

- [Wind load calculator](../wind-load/index.html) — the other main environmental load.
- [Beam deflection](../beam-deflection/index.html) — rafters and beams under the load.
- [Moment of inertia (section properties)](../moment-of-inertia/index.html) — section stiffness.
- [Footing size calculator](../footing-size/index.html) — carrying the loads to the ground.
