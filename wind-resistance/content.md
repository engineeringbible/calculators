# Wind resistance (ISO 15016) calculator

**Summary:** Added wind resistance and power from the relative wind by ISO 15016:2025 Annex C with the Fujiwara coefficients or wind-tunnel data.

## Introduction

Wind is the second-largest weather effect on a ship's speed after waves. Speed trials and performance monitoring remove it with the method of ISO 15016 Annex C: a wind resistance coefficient that depends on the relative wind direction and the ship's above-water shape, applied to the transverse projected area and the relative wind speed, minus the still-air resistance that the calm-water baseline already contains. This calculator uses the Fujiwara regression of the standard, ported from and pinned to the atlas-back production code, or coefficients from wind-tunnel tests.

It is for performance analysts correcting trials and noon reports, naval architects estimating weather margins, and anyone checking a wind correction.

## Formulas

    Resistance increase (C.1):  R_AA = ½ ρ_A C_AA(ψ) A_XV V_WR² − ½ ρ_A C_AA(0) A_XV V_G²
    Air density (C.2):          ρ_A = p_A / (2.8705 (t_A + 273.15)),  p_A in hPa
    Fujiwara (C.12):            C_AA(ψ) = C_LF cos ψ + C_XLI (sin ψ − ½ sin ψ cos²ψ) sin ψ cos ψ + C_ALF sin ψ cos³ψ
    Head-wind branch:           C_LF, C_XLI, C_ALF from A_LV/(L_OA B), C_MC/L_OA, A_LV/(L_OA H_BR), A_XV/(B H_BR), A_OD/A_LV, B/L_OA
    Following branch:           from B/L_OA, H_C/L_OA, A_OD/L_OA², A_XV/B², A_LV/(L_OA H_BR), A_XV/A_LV, A_XV/(B H_BR), A_OD/A_LV
    Beam wind (C.19):           C_AA(90°) = ½ [C_AA(80°) + C_AA(100°)]
    Added power:                P = R_AA V_G / η_D

- V_WR, ψ — relative wind speed and direction at 10 m; V_G — speed over ground; A_XV, A_LV — transverse and lateral projected areas above the waterline; A_OD — lateral area of superstructures; C_MC — centre of A_LV from amidships; H_BR — height of the top of the superstructure; H_C — height of the centre of A_LV.

## Assumptions and limitations

- Relative wind at the 10 m reference height; correct anemometer readings first.
- The Fujiwara regression represents conventional merchant ships; wind-tunnel data for the type are better when available.
- The value at exactly 90° follows formula C.19 and stands apart from its neighbours.
- Drift, rudder and gust effects are not included.

## Worked example

A 200 m ship with a 32 m beam, A_XV 600 m², A_LV 1200 m² and A_OD 800 m² makes 14 kn over the ground into a 30 kn relative wind from 20° on the starboard bow, at 15 °C and 1013.25 hPa.

1. Air density 1.225 kg/m³.
2. The Fujiwara coefficients give C_AA(20°) = 0.943 and C_AA(0°) = 0.769.
3. Wind force ½ × 1.225 × 0.943 × 600 × (15.43 m/s)² = 82.6 kN; still-air resistance ½ × 1.225 × 0.769 × 600 × (7.20 m/s)² = 14.7 kN.
4. R_AA = 67.9 kN; with η_D = 0.7 the added power is 699 kW.

## FAQ

**Why subtract the still-air term?**
The calm-water resistance from tank tests or trials already includes the air resistance at the ship's own speed with no wind. Only the difference is the weather effect.

**Why is C_AA larger at 20–30° than head-on?**
For many hull and superstructure forms the longitudinal force peaks with the wind slightly off the bow, where the flow over the superstructure gives a large drag component.

**Can the wind help?**
Yes. With a following wind stronger than the ship's own speed, C_AA is negative and R_AA becomes an assistance.

**Which areas do I need?**
Transverse and lateral projected areas above the waterline, including deck cargo and superstructures, from the general arrangement or the ship's wind area drawing at the actual draft.

**Why speed over ground?**
ISO 15016 defines the relative wind with the speed over ground, and ISO 19030 uses the same speed for the wind power correction.

## Related calculators

- [True wind from apparent wind](../true-wind/index.html) — the relative wind at 10 m from the anemometer.
- [STAwave-1 added wave resistance](../stawave-added-resistance/index.html) — the wave part of the weather correction.
- [Water temperature correction](../water-temperature-correction/index.html) — the temperature and density part of ISO 15016.
- [Shallow water speed](../shallow-water-speed/index.html) — the depth correction.
