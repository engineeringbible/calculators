# Air density calculator

**Summary:** Density of dry or humid air from temperature, humidity and altitude or pressure, with specific volume, the ratio to standard air and the density altitude.

## Introduction

Air density sets how much air a fan moves by mass, how much power an engine makes, how much lift a wing produces and how much heat a duct carries. Standard air at sea level and 15 °C weighs 1.225 kg per cubic metre. On a hot, humid day it is 6 % lighter, and in Denver 15 to 18 % lighter, so equipment rated at standard conditions delivers less.

This calculator gives the density of air from its temperature, relative humidity and either the altitude or the barometric pressure. It also gives the specific volume used on psychrometric charts, the ratio to standard air, and the density altitude used for engines, fans and aircraft. It is for HVAC engineers correcting fan and coil ratings, and for anyone needing the density of real air.

## Formulas

Moist air as a mixture of ideal gases (ASHRAE Fundamentals, Chapter 1):

    W = 0.621945 × p_w / (p − p_w),   p_w = RH × p_ws(t)
    v = 287.042 × (t + 273.15) × (1 + 1.607858 W) / p
    ρ = (1 + W) / v

Pressure at altitude Z in the standard atmosphere, and density altitude:

    p = 101 325 × (1 − 2.25577 × 10⁻⁵ Z)^5.2559
    h_ρ = (1 − (ρ / 1.225)^(1/4.2559)) / 2.25577 × 10⁻⁵

- p_ws — saturation pressure of water vapour at t (Hyland–Wexler)
- W — humidity ratio, kg of water per kg of dry air; v — m³ per kg of dry air
- ρ — density of the moist air, kg/m³

## Assumptions and limitations

- The ideal-gas mixture is accurate to better than 0.5 % at normal atmospheric pressures.
- The standard atmosphere converts altitude to pressure. Actual pressure varies with the weather by a few percent, so enter the station pressure when you have it, not the sea-level value from a weather report.
- Humid air is lighter than dry air because a water molecule weighs less than the nitrogen and oxygen it displaces.
- Density altitude uses the standard troposphere, below 11 km.

## Worked example

What is the density of air at 30 °C and 60 % relative humidity at sea level?

1. Saturation pressure at 30 °C: 4.246 kPa, so the vapour pressure is 0.60 × 4.246 = 2.548 kPa.
2. Humidity ratio: 0.621945 × 2.548 / (101.325 − 2.548) = 0.01604 kg/kg.
3. Specific volume: 287.042 × 303.15 × (1 + 1.607858 × 0.01604) / 101 325 = 0.8809 m³/kg.
4. Density: (1 + 0.01604) / 0.8809 = 1.153 kg/m³.

Dry air at the same temperature would be 1.164 kg/m³. The humid air is 94.2 % of standard density, so a fan moves 5.8 % less mass of air than at standard conditions.

## FAQ

**What is the density of air?**
1.225 kg/m³ (0.0765 lb/ft³) for dry air at 15 °C and sea-level pressure, the international standard. At 20 °C it is 1.204 kg/m³, the value often used for HVAC "standard air".

**Is humid air heavier or lighter than dry air?**
Lighter. Water vapour has a molar mass of 18 g/mol, against about 29 g/mol for dry air.

**How does altitude change air density?**
Density falls about 9 to 10 % for every 1 000 m. At 1 600 m it is 15 to 18 % below sea level, depending on the temperature.

**What is density altitude?**
The altitude in the standard atmosphere that has the same density as the actual air. Hot, high and humid conditions raise it, and engines, propellers and wings perform as if they were at that height.

**Why does air density matter for fans and ducts?**
Fans move a fixed volume, so the mass flow, the pressure they develop and the heat the air carries all scale with density. Ratings at standard air must be corrected for altitude and temperature.

**What is the specific volume on a psychrometric chart?**
The volume of moist air that contains one kilogram of dry air, in m³/kg. It is the inverse of density per unit of dry air.

## Related calculators

- [Dew point calculator](../dew-point/index.html) — humidity, dew point and wet bulb.
- [Duct size calculator](../duct-size/index.html) — airflow, velocity and friction in ducts.
- [Air changes per hour and CFM](../air-changes/index.html) — ventilation rates.
- [Ideal gas law](../ideal-gas-law/index.html) — the gas law behind the density.
