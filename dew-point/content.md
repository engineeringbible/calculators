# Dew point calculator

**Summary:** Dew point from temperature and relative humidity, or humidity from the dew point, with wet bulb, humidity ratio, absolute humidity and enthalpy.

## Introduction

The dew point is the temperature at which air becomes saturated and water starts to condense. Cool a glass of air at 20 °C and 50 % humidity, and dew forms on it at 9.3 °C. Unlike relative humidity, which changes whenever the temperature does, the dew point measures how much water the air actually holds, so it is the better guide to comfort, condensation on walls and windows, fog and paint curing.

This calculator gives the dew point from the air temperature and relative humidity, or the humidity from a measured dew point. It also gives the wet-bulb temperature, the moisture content in g/kg, the absolute humidity, the enthalpy and the density of the air, at any altitude. It uses the ASHRAE psychrometric equations, the same ones behind the psychrometric chart.

## Formulas

Vapour pressure from the relative humidity, and the dew point where saturation is reached:

    p_w = RH × p_ws(t)
    p_ws(t_d) = p_w    →   t_d

Moisture content and enthalpy:

    W = 0.621945 × p_w / (p − p_w)
    h = 1.006 t + W (2501 + 1.86 t)    kJ/kg

The quick Magnus approximation, good to about 0.1 °C between −40 and 50 °C:

    γ = ln(RH) + 17.625 t / (243.04 + t)
    t_d = 243.04 γ / (17.625 − γ)

- t — air temperature, °C; RH — relative humidity as a fraction
- p_ws — saturation pressure of water vapour (Hyland–Wexler equation in ASHRAE)
- p — barometric pressure, which falls with altitude

## Assumptions and limitations

- The equations are those of the ASHRAE Handbook of Fundamentals, Chapter 1. Below 0 °C the saturation is over ice, so the result is the frost point.
- Relative humidity is taken as reported by hygrometers and weather services: the vapour pressure over the saturation pressure at the air temperature.
- Pressure does not change the dew point, but it does change the moisture content, wet bulb and density. Use the altitude or the station pressure, not the sea-level pressure from a weather report.
- The comfort description follows the US National Weather Service bands and is a general guide.

## Worked example

The air in a room is at 20 °C with 50 % relative humidity, at sea level. What is the dew point?

1. Saturation pressure at 20 °C: 2.339 kPa.
2. Vapour pressure: 0.50 × 2.339 = 1.169 kPa.
3. The temperature at which 1.169 kPa is the saturation pressure: 9.27 °C. This is the dew point.
4. Moisture content: 0.621945 × 1.169 / (101.325 − 1.169) = 0.00726 kg/kg, or 7.26 g/kg.
5. Wet bulb, from the ASHRAE energy balance: 13.78 °C.

Any surface colder than 9.3 °C, such as a single-glazed window in winter, will collect condensation.

## FAQ

**What is a comfortable dew point?**
55 °F (13 °C) or lower feels dry and comfortable. Between 55 and 65 °F (13 to 18 °C) the air feels sticky, and above 65 °F (18 °C) it feels oppressive.

**What is the difference between dew point and humidity?**
Relative humidity is how close the air is to saturation at its present temperature. The dew point is the amount of water in it expressed as a temperature, and it does not change when the air warms or cools.

**Why do my windows get condensation?**
The glass is colder than the room's dew point. Lower the indoor humidity, ventilate, or improve the glazing so its surface stays warmer.

**Can the dew point be higher than the temperature?**
No. When the air cools to its dew point it is saturated, and any further cooling condenses water out as dew or fog.

**What is the wet-bulb temperature?**
The temperature a wet thermometer reaches as water evaporates from it. It lies between the dew point and the air temperature, and it limits how well evaporative coolers and sweating work.

**What dew point is needed for painting?**
Most coating standards require the steel surface to be at least 3 °C above the dew point, so that no moisture condenses under the paint.

## Related calculators

- [Air density calculator](../air-density/index.html) — density of humid air at any altitude.
- [Air changes per hour and CFM](../air-changes/index.html) — ventilation to remove moisture.
- [BTU calculator: AC size for a room](../btu-ac-size/index.html) — cooling capacity.
- [Cargo ventilation and dew point](../cargo-ventilation-dewpoint/index.html) — the three-degree rule for ship holds.
