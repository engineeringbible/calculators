# Wind turbine power calculator

**Summary:** Wind turbine power from rotor diameter, wind speed, air density and power coefficient (Betz limit), and yearly energy from the mean wind speed by Rayleigh.

## Introduction

How much power does a wind turbine make? The wind carries ½ ρ A v³ through the rotor's swept area, and the turbine converts a fraction Cp of it. A 3 m rotor in a 6 m/s wind meets 935 W of wind power. At a power coefficient of 0.35 it delivers 327 W. Because power rises with the cube of the speed, a 10 % stronger wind gives 33 % more power.

This calculator gives the power at any wind speed, the Betz limit and the rated power. It estimates the yearly energy from the site's mean wind speed with a Rayleigh distribution and the turbine's cut-in, rated and cut-out speeds, or from a capacity factor. Air density follows from the altitude. It is for homeowners, farmers, students and engineers making a first estimate before a site survey.

## Formulas

Power and the Betz limit:

    P = ½ ρ A v³ Cp,    A = π D² / 4
    Cp ≤ 16/27 = 0.593

Rayleigh distribution of the wind speed, mean v̄:

    f(v) = (π v / (2 v̄²)) exp(−π v² / (4 v̄²))
    P_mean = ∫ P(v) f(v) dv,    E = 8 760 h × P_mean

Idealised power curve and density:

    P(v) = 0 below v_in and above v_out;  ½ ρ A v³ Cp up to v_r;  P_r = ½ ρ A v_r³ Cp from v_r to v_out
    ρ = p(h) / (R T),  ISO 2533 standard atmosphere

- ρ — air density, 1.225 kg/m³ at sea level and 15 °C
- D — rotor diameter; v — wind speed; Cp — power coefficient from wind to electricity
- v_in, v_r, v_out — cut-in, rated and cut-out speeds
- capacity factor = P_mean / P_r

## Assumptions and limitations

- Cp is constant between cut-in and rated speed. Real power curves are rounder, so use the manufacturer's curve where you have it.
- Small turbines reach a Cp of about 0.25 to 0.35 from wind to electricity, large ones about 0.45 at their best. No turbine can exceed 0.593.
- The mean wind speed must be at hub height. Wind speed rises with height, and trees and buildings slow it down.
- The Rayleigh distribution suits many inland sites. Sites with steadier or gustier winds have a different Weibull shape factor.
- Downtime, wake losses and cable losses are not deducted.

## Worked example

A small turbine has a 3 m rotor, a power coefficient of 0.35 and a rated speed of 11 m/s. It cuts in at 3 m/s and out at 25 m/s. The site is at sea level with a mean wind speed of 5 m/s at hub height. What does it produce?

1. Swept area: π × 3² / 4 = 7.07 m².
2. Power at 6 m/s: 0.5 × 1.225 × 7.07 × 6³ × 0.35 = 327 W.
3. Rated power at 11 m/s: 0.5 × 1.225 × 7.07 × 11³ × 0.35 = 2 017 W.
4. Averaged over the Rayleigh distribution for 5 m/s, the mean power is 338 W.
5. Energy per year: 338 × 8 760 = 2 962 kWh.
6. Capacity factor: 338 / 2 017 = 16.8 %.

The turbine turns between cut-in and cut-out for 75 % of the year.

## FAQ

**How do you calculate wind turbine power?**
Multiply half the air density by the swept area, the cube of the wind speed and the power coefficient. At 1.225 kg/m³ and 10 m/s the wind carries 612.5 W per square metre.

**What is the Betz limit?**
The highest share of the wind's power any rotor can extract, 16/27 or 59.3 %. Albert Betz derived it from the momentum of the air passing the rotor.

**Why does wind speed matter so much?**
Power rises with the cube of the speed. Doubling the wind speed gives eight times the power, so a good site matters more than a bigger turbine.

**Can I use the mean wind speed in the power formula?**
No. The faster winds carry most of the energy. For a Rayleigh distribution the mean power in the wind is 1.91 times the power at the mean speed.

**What is a capacity factor?**
The average output divided by the rated power. The 3 m turbine of the worked example reaches 16.8 % on a 5 m/s site.

**How does altitude affect wind power?**
Thinner air carries less power. At 1 000 m the standard density is 1.112 kg/m³, about 9 % less than at sea level.

## Related calculators

- [Air density calculator](../air-density/index.html) — density from pressure, temperature and humidity.
- [Solar panel payback calculator](../solar-payback/index.html) — the payback of the energy produced.
- [Micro-hydro power calculator](../micro-hydro/index.html) — power from a stream instead of the wind.
- [Solar battery bank calculator](../solar-battery-bank/index.html) — storage for an off-grid turbine.
