# Fuel net specific energy and CO₂ factor calculator

**Summary:** ISO 8217 net and gross specific energy from density, water, ash and sulphur; CO₂ factor by IMO grade or carbon content; g CO₂/MJ.

## Introduction

A bunker delivery note gives density, water, ash and sulphur, not the energy content, yet every fuel-consumption comparison and every emissions report needs the calorific value. ISO 8217 provides correlations that estimate the net and gross specific energy from those four numbers to about ±0.2 MJ/kg, good enough for performance analysis and for scaling shop-test consumption to the fuel actually burned. This calculator evaluates them for residual and distillate fuels, adds the energy per litre, attaches the CO₂ factor (IMO grade default or from a measured carbon content), and derives the tank-to-wake intensity in g CO₂/MJ that FuelEU Maritime uses.

It is for performance engineers normalising consumption to a reference fuel, for emissions reporting (MRV, ETS, CII), for bunker buyers comparing energy per dollar, and for students of marine fuels.

## Formulas

    Residual (H.1):   Q_net = (46.704 − 8.802 ρ²·10⁻⁶ + 3.167 ρ·10⁻³)[1 − 0.01(w_w + w_a + w_s)] + 0.0942 w_s − 0.02449 w_w
    Distillate (H.3): Q_net = (46.423 − 8.792 ρ²·10⁻⁶ + 3.170 ρ·10⁻³)[1 − 0.01(w_w + w_a + w_s)] + 0.0942 w_s − 0.02449 w_w
    Gross (H.2/H.4):  Q_gross = (52.190 − 8.802 ρ²·10⁻⁶)[…] + 0.0942 w_s   /   (51.916 − 8.792 ρ²·10⁻⁶)[…] + 0.0942 w_s
    MJ/L = Q_net ρ15/1000,   C_F = w_C × 44.0095/12.011 (or IMO grade value),   g CO₂/MJ = C_F × 1000/Q_net
    mass of this fuel per tonne of 42 700 kJ/kg reference fuel = 42 700/Q_net

ρ in kg/m³ at 15 °C, w in % m/m, Q in MJ/kg.

## Assumptions and limitations

- Petroleum fuels only; biofuels, methanol, LNG and LPG need their own values.
- ±0.2 MJ/kg correlation accuracy; a calorimeter test supersedes it.
- CO₂ factor assumes complete combustion; CH₄, N₂O and well-to-wake are outside this page.

## Worked example

A VLSFO delivered at 991 kg/m³, 0.2 % water, 0.05 % ash, 0.5 % sulphur.

1. Base term 46.704 − 8.644 + 3.138 = 41.198 MJ/kg; × (1 − 0.0075) = 40.889; + 0.047 − 0.005 → Q_net 40.93 MJ/kg, Q_gross 43.27 MJ/kg.
2. Energy 40.9 GJ/t and 40.6 MJ/L.
3. IMO grade factor 3.151 t CO₂/t (implies 86.0 % carbon) → 77.0 g CO₂/MJ.
4. One tonne of 42 700 kJ/kg reference fuel equals 1.043 t of this fuel: a shop-test 175 g/kWh becomes 182.6 g/kWh on this bunker.

An MGO at 850 kg/m³ with 0.05 % water, 0.01 % ash and 0.1 % sulphur gives 42.71 MJ/kg, 36.3 MJ/L and, with the 3.206 grade factor, 75.1 g CO₂/MJ: more energy per kilogram, less per litre, slightly less CO₂ per unit energy.

## FAQ

**Why is the net value the one to use?**
The water formed in combustion leaves the engine as vapour; its latent heat (the gross − net difference, about 2.3 MJ/kg) is never recovered, so engine efficiency and SFOC refer to the net value.

**Why does sulphur add energy in the formula?**
Sulphur burns to SO₂ and contributes heat, less than the hydrocarbon it replaces; the small positive term corrects the dilution term that treated it as inert.

**How accurate is this versus a lab test?**
Within about ±0.2 MJ/kg (0.5 %) for conventional petroleum fuels; blends with bio-components or unusual chemistry can deviate more.

**Grade factor or carbon content?**
The grade factor is what IMO DCS and CII use; the EU MRV/ETS accepts a fuel-specific factor from a laboratory carbon analysis, which can differ by 1–2 %.

**Why scale to 42 700 kJ/kg?**
Shop tests (ISO 3046) and performance baselines (ISO 19030) quote consumption for that reference fuel; multiplying by 42 700/Q_net gives the mass of the real fuel.

**Does temperature change the energy per litre?**
Yes, through density; use the bunker-quantity calculator's volume correction factor for the delivery temperature.

## Related calculators

- [Fuel blend viscosity and heating](../fuel-blend-heating/index.html) — the viscosity side of the same fuel.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — mass from sounding and temperature.
- [CII rating](../cii-rating/index.html) — where the CO₂ factor goes.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — well-to-wake intensity and allowances.
- [Engine power and SFOC to ISO 3046 conditions](../sfoc-iso3046-correction/index.html) — SFOC on the reference fuel.
