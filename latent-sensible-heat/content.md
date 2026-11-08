# Latent and sensible heat calculator (air and water)

**Summary:** Sensible, latent and total heat of an airstream by psychrometrics and the 1.08 and 4840 rules, SHR and coil load; and the heat to melt or boil water.

## Introduction

Sensible heat changes the temperature of air or water. Latent heat changes its state, such as condensing moisture out of air or melting ice, without changing the temperature. A cooling coil does both: 1 000 cfm cooled from 80 °F dry bulb and 67 °F wet bulb to 55/54 °F removes 26 440 Btu/h of sensible heat and 12 040 Btu/h of latent heat.

This calculator splits the load of an airstream between two states into sensible and latent heat. It uses exact psychrometric enthalpies and also shows the 1.08, 4 840 and 4.5 rules. It gives the sensible heat ratio, the coil load in tons and the condensate. A second mode gives the heat to warm, melt, boil, condense or freeze water, with the latent heats of 334 and 2 257 kJ/kg. It is for HVAC engineers, technicians and students.

## Formulas

Exact, per kilogram of dry air (ASHRAE Fundamentals Ch. 1):

    ṁ = Q / v1
    Q_total = ṁ (h1 − h2),   h = 1.006 t + W (2 501 + 1.86 t)
    Q_latent = ṁ (W1 − W2)(2 501 + 1.86 t1)
    Q_sensible = ṁ (1.006 + 1.86 W2)(t1 − t2)
    SHR = Q_sensible / Q_total

Standard-air rules, IP units (Btu/h, cfm, °F, lb/lb, Btu/lb):

    Q_s = 1.08 × cfm × ΔT     (1.10 in ASHRAE Ch. 18)
    Q_l = 4 840 × cfm × ΔW
    Q_t = 4.5 × cfm × Δh

SI equivalents per L/s: 1.21 (or 1.23) W/K, 3 010 W per kg/kg, 1.20 W per kJ/kg.

Water at atmospheric pressure:

    Q = m [c_ice ΔT_ice + L_f + c_w ΔT_w + L_v + c_steam ΔT_steam]

- Q — airflow at the entering state; v1 — its specific volume per kg of dry air
- W — humidity ratio; h — enthalpy per kg of dry air; t — dry bulb temperature
- L_f = 334 kJ/kg, L_v = 2 257 kJ/kg; c — specific heats of ice, water and steam

## Assumptions and limitations

- The airflow is measured at the entering condition. The rules assume standard air at 0.075 lb/ft³, so they overstate the heat for warm air or at altitude.
- The exact split takes the latent heat as removing the moisture at the entering temperature. The sensible heat is the cooling of the drier air. The two add up exactly to the total.
- The coil load subtracts the small enthalpy of the condensate leaving the coil.
- Water changes state at 0 °C and 100 °C, which holds at sea-level pressure. The specific heats are constant, and all five values can be changed.

## Worked example

A cooling coil handles 1 000 cfm. Air enters at 80 °F dry bulb and 67 °F wet bulb and leaves at 55 °F dry bulb and 54 °F wet bulb, at sea level.

1. Entering air: W1 = 0.01117 lb/lb, h1 = 55.31 kJ/kg, v1 = 13.85 ft³/lb.
2. Leaving air: W2 = 0.00863 lb/lb, h2 = 34.65 kJ/kg.
3. Dry air flow: 1 000 / 13.85 = 72.2 lb/min, or 0.546 kg/s.
4. Latent: 0.546 × 0.00253 × (2 501 + 1.86 × 26.7) = 3.53 kW, or 12 040 Btu/h.
5. Sensible: 0.546 × (1.006 + 1.86 × 0.00863) × 13.9 = 7.75 kW, or 26 440 Btu/h.
6. Total: 11.28 kW, or 38 480 Btu/h. SHR = 26 440 / 38 480 = 0.69.
7. Coil load less the condensate enthalpy: 3.19 TR, removing 11.0 lb/h of water.

The 1.08 rule gives 1.08 × 1 000 × 25 = 27 000 Btu/h of sensible heat. It is 2 % high because air at 80 °F is lighter than standard air.

## FAQ

**What is the difference between sensible and latent heat?**
Sensible heat changes the temperature you can read on a thermometer. Latent heat changes the state, such as water vapour condensing on a coil or ice melting, at constant temperature.

**Where does the 1.08 in Q = 1.08 × cfm × ΔT come from?**
Standard air weighs 0.075 lb/ft³ and has a specific heat of 0.24 Btu/(lb·°F). Multiply by 60 minutes an hour: 0.075 × 60 × 0.24 = 1.08.

**Where does 4 840 come from?**
It is 0.075 lb/ft³ × 60 min/h × about 1 076 Btu/lb, the heat to condense water vapour from air. Multiply it by the cfm and the change in humidity ratio in lb/lb.

**What is the sensible heat ratio?**
The sensible share of the total cooling load. A dry climate or a server room has an SHR near 1; a coil that removes a lot of moisture, as in the example, is about 0.7.

**How much heat does it take to melt ice?**
334 kJ per kilogram, the same heat that warms liquid water by about 80 K. Taking 1 kg of ice at −10 °C to water at 20 °C needs 438.7 kJ.

**Why does boiling take so much energy?**
Vaporising water needs 2 257 kJ/kg, 5.4 times the 419 kJ/kg that warms it from 0 to 100 °C. That is why steam carries so much heat.

## Related calculators

- [Mixed air temperature](../mixed-air-temperature/index.html) — the state of the air entering the coil.
- [Dew point](../dew-point/index.html) — when moisture starts to condense.
- [BTU calculator: AC size for a room](../btu-ac-size/index.html) — the cooling capacity a room needs.
- [Specific heat](../specific-heat/index.html) — sensible heat of any material.
