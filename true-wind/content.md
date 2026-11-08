# True wind from apparent wind calculator

**Summary:** True and relative wind conversion per ISO 15016 with the anemometer height correction to the 10 m reference height of wind data.

## Introduction

The anemometer on the mast measures the wind the ship feels: the true wind combined with the wind of the ship's own motion. Weather reports, the Beaufort scale and wind resistance coefficients all need the true wind, at a standard height of 10 m above the sea. This calculator converts between the two using the formulas of ISO 15016:2025 Annex C, and moves the wind between the anemometer height and the 10 m reference height with the standard's boundary-layer profile. It also gives the head and cross components of the relative wind, the inputs of a wind resistance calculation.

It is for officers filling in weather observations, performance analysts correcting speed trials and noon reports for wind, and anyone comparing an onboard wind reading with a forecast.

## Formulas

    True wind from relative wind (C.3, C.4):
        V_WT = √(V_WR² + V_G² − 2 V_WR V_G cos α_WR)
        α_WT = atan2(V_WR sin(α_WR + ψ) − V_G sin ψ,  V_WR cos(α_WR + ψ) − V_G cos ψ)
    Height correction (C.9):
        V_WT,ref = V_WT (Z_ref / Z_a)^p,   p = 1/9 (ISO 15016:2025) or 1/7 (earlier editions)
    Relative wind from true wind (C.10, C.11):
        V_WR = √(V_WT² + V_G² + 2 V_WT V_G cos(α_WT − ψ))
        α_WR = atan2(V_WT sin(α_WT − ψ),  V_G + V_WT cos(α_WT − ψ))

- V_WR, α_WR — relative wind speed and direction off the bow, 0° on the bow, positive from starboard
- V_WT, α_WT — true wind speed and the true direction it comes from
- ψ — heading; V_G — speed over ground; Z_a — anemometer height; Z_ref — reference height, 10 m

## Assumptions and limitations

- Speed over ground gives the meteorological true wind; speed through the water gives the wind over the water.
- Directions are where the wind comes from.
- The power-law profile is an average; atmospheric stability changes the exponent between about 0.10 and 0.20.
- The superstructure disturbs the anemometer, especially with following winds.
- Inputs are steady means; gusts are not modelled.

## Worked example

A ship heads 090° at 15 kn over the ground. The anemometer, 35 m above the sea, shows 25 kn from the starboard beam (relative direction +90°).

1. True wind speed: √(25² + 15² − 2·25·15·cos 90°) = √850 = 29.15 kn.
2. True direction: atan2(25 sin 180° − 15 sin 90°, 25 cos 180° − 15 cos 90°) = atan2(−15, −25) = 211.0°. The wind blows from the south-south-west, abaft the starboard beam.
3. At 10 m: 29.15 × (10/35)^(1/9) = 29.15 × 0.870 = 25.4 kn, Beaufort force 6.
4. Relative wind at 10 m: 21.8 kn from 85° off the starboard bow, which is the input of a wind resistance estimate.

## FAQ

**Why does ISO 15016 use speed over ground?**
The true wind is defined relative to the earth, the frame of weather observations. The ship's own wind depends on its motion through the air, which is its motion over the ground when the air mass is at rest relative to the earth.

**Why correct the height at all?**
Wind speed grows with height above the sea. Wind tunnel coefficients and the Beaufort scale refer to 10 m, while anemometers sit 30–50 m up on large ships, where the wind is 10–15 % stronger.

**1/7 or 1/9?**
ISO 15016:2025 prescribes 1/9; earlier editions and the 2017 ITTC procedure used 1/7. The difference is about 4 % for a 40 m anemometer.

**How are relative directions over 180° entered?**
Either way: 330 and −30 both mean 30° on the port bow.

**Can I trust a following wind reading?**
Less than others: the anemometer is then in the wake of the funnel and accommodation, and with a small relative wind a few degrees of error swing the true direction widely.

## Related calculators

- [Beaufort force and sea state](../beaufort-sea-state/index.html) — the force and sea that go with the true wind.
- [CPA and TCPA from radar plots](../cpa-tcpa/index.html) — the same vector triangle applied to ships.
- [Course to steer with set and drift](../course-to-steer/index.html) — the vector triangle for current.
- [STAwave-1 added wave resistance](../stawave-added-resistance/index.html) — the wave part of the weather correction.
