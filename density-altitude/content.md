# Density altitude calculator

**Summary:** Pressure altitude from field elevation and altimeter setting, and density altitude from temperature and dew point, with the ISA formula and the rule of thumb.

## Introduction

Density altitude is the height in the standard atmosphere where the air has the same density as the air around you. It is pressure altitude corrected for a non-standard temperature. Aircraft wings, propellers and engines respond to density, so a hot day at a high airport makes an aircraft perform as if it were much higher. A 5 000 ft airport at 30 °C has a density altitude of about 7 600 ft.

This calculator finds the station pressure and the pressure altitude from the field elevation and the altimeter setting. It then gives the density altitude from the outside air temperature with the standard atmosphere formula, and optionally with humidity from the dew point. The 120 ft per °C rule of thumb is shown alongside. It is for pilots checking take-off and climb performance, and for drone, car and engine tuners who correct for air density.

## Formulas

Station pressure and pressure altitude, ISA troposphere:

    p = QNH × (1 − L h / T0)^5.2559
    PA = (T0 / L) × (1 − (p / p0)^0.190263)

Density and density altitude:

    ρ = p / (R T_v)
    T_v = T / (1 − (e / p)(1 − 0.622))
    DA = (T0 / L) × (1 − (ρ / ρ0)^0.234969)

Rule of thumb for comparison:

    DA ≈ PA + 120 ft × (OAT − T_ISA)
    T_ISA = 15 °C − 1.98 °C × PA / 1 000 ft

- QNH — altimeter setting; h — field elevation
- T0 = 288.15 K, p0 = 1 013.25 hPa (29.92 inHg), ρ0 = 1.225 kg/m³, L = 6.5 K/km
- R = 287.05 J/(kg·K); T — outside air temperature in K
- e — vapour pressure at the dew point; T_v — virtual temperature

## Assumptions and limitations

- The formulas cover the troposphere, below 36 089 ft. That includes every airport and most piston-aircraft flying.
- The altimeter setting is the station pressure reduced to sea level through the standard atmosphere. The calculator reverses that step to find the station pressure.
- Pilots usually leave humidity out. Moist air is lighter than dry air, so humidity raises the density altitude by a few hundred feet on a warm, humid day.
- The 120 ft per °C rule is an approximation. In the worked example it overestimates the exact result by about 180 ft.

## Worked example

An airport sits at 5 000 ft. The altimeter setting is 30.10 inHg and the temperature is 30 °C. What are the pressure and density altitudes?

1. Station pressure: 30.10 × (1 − 0.0065 × 1 524 / 288.15)^5.2559 = 25.04 inHg.
2. Pressure altitude: the standard atmosphere has 25.04 inHg at 4 841 ft.
3. Standard temperature there: 15 − 1.98 × 4.841 = 5.4 °C, so the air is 24.6 °C warmer than standard.
4. Density: 84 811 Pa / (287.05 × 303.15 K) = 0.9746 kg/m³.
5. Density altitude: the standard atmosphere has that density at 7 608 ft.
6. Rule of thumb: 4 841 + 120 × 24.59 = 7 792 ft.

With a dew point of 15 °C the density altitude rises to 7 855 ft. The aircraft will perform as if it were taking off from about 7 600 to 7 900 ft.

## FAQ

**What is density altitude?**
The pressure altitude corrected for a non-standard temperature. It is the standard-atmosphere height with the same air density.

**How do I calculate pressure altitude?**
Set the altimeter to 29.92 inHg and read it. Without that, a quick estimate is the field elevation plus (29.92 − altimeter setting) × 1 000 ft.

**How do I calculate density altitude?**
Find the air density from the station pressure and temperature, then find the standard-atmosphere height with that density. The rule of thumb adds 120 ft for each °C above the standard temperature.

**Does humidity affect density altitude?**
Yes. Water vapour is lighter than air, so humid air is less dense. The FAA advises adding 10 % to the computed take-off distance when humidity is high.

**Why does density altitude matter?**
High density altitude lengthens the take-off run, reduces the climb rate and raises the true airspeed on approach. A normally aspirated engine also loses power.

**What is the standard temperature at altitude?**
15 °C at sea level, falling about 1.98 °C per 1 000 ft. At 10 000 ft it is −4.8 °C.

## Related calculators

- [True airspeed](../true-airspeed/index.html) — TAS and Mach from calibrated airspeed.
- [Speed of sound and Mach number](../mach-number/index.html) — Mach from temperature or altitude.
- [Thrust-to-weight and wing loading](../thrust-weight/index.html) — stall speed at the density altitude.
- [Air density calculator](../air-density/index.html) — density of humid air for HVAC and fans.
