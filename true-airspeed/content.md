# True airspeed calculator (TAS and Mach)

**Summary:** True airspeed and Mach number from indicated or calibrated airspeed, pressure altitude and temperature, with equivalent airspeed and ground speed.

## Introduction

True airspeed is the speed of an aircraft through the air around it. The airspeed indicator measures the pressure of the oncoming air, and it is calibrated for sea-level standard air. Higher up the air is thinner, so the indicator reads low and the true airspeed is higher. At 8 000 ft and 0 °C, a calibrated airspeed of 150 kn is a true airspeed of 169 kn.

This calculator converts indicated or calibrated airspeed to true airspeed and Mach number with the compressible-flow relations of the standard atmosphere. It also gives the equivalent airspeed and the ground speed with a head or tail wind. The 2 % per 1 000 ft rule of thumb is shown for comparison. It is for pilots planning a flight, student pilots learning the E6B, and drone and model-aircraft builders.

## Formulas

Impact pressure from calibrated airspeed, and Mach number:

    q_c = p0 × [(1 + 0.2 (V_c / a0)²)^3.5 − 1]
    M = √(5 × [(q_c / p + 1)^(2/7) − 1])

True, equivalent and ground speed:

    a = √(γ R T)
    TAS = M × a
    EAS = a0 × M × √(p / p0)
    GS = TAS − head wind

Rule of thumb for comparison:

    TAS ≈ CAS × (1 + 0.02 × PA / 1 000 ft)

- V_c — calibrated airspeed, IAS plus the POH correction
- p — static pressure at the pressure altitude PA; T — outside air temperature in K
- p0 = 29.92 inHg; a0 = 661.48 kn, the sea-level speed of sound
- γ = 1.4; R = 287.05 J/(kg·K)

## Assumptions and limitations

- The relations hold for subsonic flight. The calculator stops at Mach 1.
- Indicated airspeed needs the position and instrument correction from the airspeed calibration table. Without it, IAS is taken as CAS.
- The temperature is the static outside air temperature. At jet speeds a probe reads warmer air, and that ram rise must be removed first.
- The ground speed uses only the wind component along the track. A crosswind also needs a wind correction angle.
- The 2 % rule ignores temperature. It reads high on cold days and low on hot ones.

## Worked example

A pilot flies at 150 kn calibrated airspeed at a pressure altitude of 8 000 ft. The outside air temperature is 0 °C, and the forecast head-wind component is 20 kn. What are the true airspeed and the ground speed?

1. Static pressure at 8 000 ft in the standard atmosphere: 752.6 hPa.
2. Impact pressure: 1 013.25 × [(1 + 0.2 × (150 / 661.48)²)^3.5 − 1] = 36.94 hPa.
3. Mach number: √(5 × [(36.94 / 752.6 + 1)^(2/7) − 1]) = 0.2625.
4. Speed of sound at 0 °C: √(1.4 × 287.05 × 273.15) = 331.3 m/s, or 644.0 kn.
5. True airspeed: 0.2625 × 644.0 = 169.1 kn.
6. Equivalent airspeed: 661.48 × 0.2625 × √(752.6 / 1 013.25) = 149.7 kn.
7. Ground speed: 169.1 − 20 = 149.1 kn.

The rule of thumb gives 150 × 1.16 = 174.0 kn, about 5 kn high because the day is colder than it assumes.

## FAQ

**What is true airspeed?**
The speed of the aircraft relative to the air mass. It is the speed used for navigation, before the wind is applied.

**How do I calculate true airspeed?**
Convert the calibrated airspeed to a Mach number with the static pressure at the pressure altitude. Multiply by the speed of sound at the outside temperature.

**What is the rule of thumb for TAS?**
Add 2 % of the calibrated airspeed for every 1 000 ft of altitude. It is close at low altitude on a standard day.

**What is the difference between IAS, CAS, EAS and TAS?**
IAS is what the instrument shows. CAS corrects it for installation errors, EAS corrects CAS for compressibility, and TAS corrects EAS for air density.

**Why is true airspeed higher than indicated at altitude?**
The air is thinner, so the same dynamic pressure needs a higher speed. Indicated airspeed tracks dynamic pressure.

**How do I get ground speed from true airspeed?**
Subtract the head-wind component, or add the tail-wind component. A large crosswind also reduces the ground speed slightly.

## Related calculators

- [Density altitude](../density-altitude/index.html) — pressure and density altitude from the airport conditions.
- [Speed of sound and Mach number](../mach-number/index.html) — Mach from speed and temperature.
- [Thrust-to-weight and wing loading](../thrust-weight/index.html) — stall speed from wing loading.
- [Drag and lift force](../drag-lift/index.html) — aerodynamic forces at the true airspeed.
