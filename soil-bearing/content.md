# Soil bearing capacity calculator (Terzaghi and Eurocode 7)

**Summary:** Ultimate and allowable bearing capacity of strip, square, rectangular and circular footings by Terzaghi or Eurocode 7, drained or undrained.

## Introduction

A footing fails in bearing when the soil beneath it shears and pushes out to the sides. The pressure at which that happens is the ultimate bearing capacity. It depends on the soil's strength (its friction angle and cohesion), its weight, the footing's width, and how deep the footing sits, because the soil above the base holds the failure surface down.

This calculator gives the ultimate and allowable bearing capacity of strip, square, rectangular and circular footings. It offers two methods: Terzaghi's classic equation, taught in every soil mechanics course, and the method of Eurocode 7 Annex D, for drained and undrained conditions. It shows the bearing capacity factors and the load the footing can carry at your factor of safety.

## Formulas

General form, for a footing of width B at depth D_f:

    q_ult = c N_c s_c + q N_q s_q + ½ γ B N_γ s_γ,    q = γ D_f

Eurocode 7 Annex D factors (drained):

    N_q = e^{π tan φ} tan²(45° + φ/2)
    N_c = (N_q − 1) cot φ,    N_γ = 2 (N_q − 1) tan φ
    s_q = 1 + (B/L) sin φ,    s_γ = 1 − 0.3 B/L,    s_c = (s_q N_q − 1)/(N_q − 1)

Undrained (clay, short term):

    q_ult = (π + 2) c_u (1 + 0.2 B/L) + q

Terzaghi:

    N_q = e^{2(3π/4 − φ/2) tan φ} / (2 cos²(45° + φ/2)),    N_c = (N_q − 1) cot φ
    square: 1.3 c N_c + q N_q + 0.4 γ B N_γ;   circle: 1.3 c N_c + q N_q + 0.3 γ B N_γ

- φ — friction angle; c — cohesion; c_u — undrained shear strength; γ — unit weight of the soil
- Allowable pressure: q_all = q_ult / FS, with FS usually 2.5 to 3

## Assumptions and limitations

- The footing is shallow, level and loaded vertically at its centre. Inclined or off-centre loads, sloping ground and layered soils reduce the capacity and need the full Annex D factors or a geotechnical engineer.
- Below the water table, use the submerged unit weight, about γ − 9.81 kN/m³.
- The equations assume general shear failure in dense sand or stiff clay. Loose sand and soft clay fail at lower loads, and in practice settlement often limits the allowable pressure before bearing failure does.
- Terzaghi's N_γ was never given in closed form. This page uses Coduto's fit, which is 5 to 6 % above the usual tabulated values from 25° to 40° of friction angle.

## Worked example

A 2 m square footing sits 1 m deep in dense sand with φ = 30°, c = 0 and γ = 18 kN/m³. What is its bearing capacity by Eurocode 7?

1. Factors at 30°: N_q = 18.40, N_c = 30.14, N_γ = 20.09.
2. Shape factors for a square: s_q = 1 + sin 30° = 1.5, s_γ = 0.7.
3. Overburden: q = 18 × 1 = 18 kPa.
4. q_ult = 18 × 18.40 × 1.5 + 0.5 × 18 × 2 × 20.09 × 0.7 = 497 + 253 = 750 kPa.
5. With a factor of safety of 3: 250 kPa, so the footing can carry 250 × 4 = 1 000 kN.

Terzaghi's equation gives 694 kPa for the same footing: its N_q and N_c are larger, but its shape factors for a square are smaller.

## FAQ

**What is the bearing capacity of soil?**
The pressure a soil can take under a footing before it fails in shear. Typical allowable values range from about 75 kPa (1 500 psf) for soft clay to 300 kPa (6 000 psf) or more for dense gravel.

**What is the difference between ultimate and allowable bearing capacity?**
The ultimate value is the failure pressure. The allowable value divides it by a factor of safety, usually 3, and must also keep settlement acceptable.

**Why does a deeper footing carry more?**
The soil above the base acts as a surcharge that holds the failure wedge down. That is the q N_q term.

**Which is more conservative, Terzaghi or Eurocode 7?**
Neither is always lower. Terzaghi's N_q and N_c are larger, Eurocode 7's shape factors are larger, and the balance depends on the footing. Eurocode 7 designs also apply partial factors rather than one factor of safety.

**What friction angle should I use for sand?**
From the site investigation. As a rough guide, loose sand is 28 to 30°, medium dense 30 to 36° and dense sand 36 to 41°.

**When do I use undrained analysis?**
For saturated clays loaded quickly, where water cannot drain during construction. The short-term undrained case is usually critical for footings on clay.

## Related calculators

- [Footing size calculator](../footing-size/index.html) — size a footing for a column load.
- [Retaining wall earth pressure](../retaining-wall/index.html) — lateral pressure and stability.
- [Concrete footing calculator](../concrete-footing/index.html) — concrete quantities.
- [Outrigger pad pressure](../outrigger-pad-pressure/index.html) — crane pads on soil.
