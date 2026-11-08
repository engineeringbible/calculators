# Steam table calculator (IAPWS-IF97)

**Summary:** Saturated and superheated steam and compressed water properties by IAPWS-IF97: temperature, pressure, enthalpy, entropy, specific volume and density.

## Introduction

Steam tables list the properties of water and steam: at what temperature water boils at a given pressure, how much energy it holds, and how much space it takes up. Engineers use them to size boilers, turbines, heat exchangers, steam pipes and condensate systems. At 10 bar, water boils at 179.9 °C and needs 2 014 kJ of heat per kilogram to turn into steam.

This calculator works out steam table values by IAPWS-IF97, the international industrial standard behind published steam tables. It covers saturated water and steam by pressure or temperature, wet steam at any dryness fraction, and superheated steam or compressed water at any pressure and temperature up to 800 °C. It gives the enthalpy, entropy, specific volume, density, internal energy and, for single-phase states, the heat capacity and speed of sound.

## Formulas

Saturation line (IF97 region 4): the saturation pressure p_s(T) and its inverse T_s(p) are closed-form equations.

Single-phase properties come from the dimensionless Gibbs free energy γ(π, τ):

    region 1 (water):   π = p / 16.53 MPa,   τ = 1 386 K / T
    region 2 (steam):   π = p / 1 MPa,       τ = 540 K / T
    v = R T π γ_π / p,   h = R T τ γ_τ,   s = R (τ γ_τ − γ),   u = h − p v

Wet steam with dryness fraction x:

    h = h_f + x h_fg,   s = s_f + x (s_g − s_f),   v = v_f + x (v_g − v_f)

- R = 0.461526 kJ/(kg·K), the gas constant of water in IF97
- h_f, h_g — saturated liquid and vapour enthalpy; h_fg = h_g − h_f is the latent heat
- Enthalpy and entropy are zero for liquid water at the triple point, as in published tables

## Assumptions and limitations

- The calculator implements IF97 regions 1, 2 and 4 and reproduces the official verification values to nine digits.
- The near-critical region, above 350 °C at high pressure, and temperatures above 800 °C are not covered. States there are refused rather than extrapolated.
- Pressures are absolute. Add atmospheric pressure, about 1.013 bar, to a gauge reading.
- Saturated properties are given from 0 °C to 350 °C (0.006 to 165 bar).

## Worked example

What are the properties of dry saturated steam at 10 bar absolute?

1. Saturation temperature: T_s = 179.89 °C.
2. Saturated liquid: h_f = 762.68 kJ/kg, v_f = 0.0011272 m³/kg.
3. Saturated vapour: h_g = 2777.1 kJ/kg, v_g = 0.19435 m³/kg, so 1 kg of steam fills 0.194 m³.
4. Latent heat: h_fg = 2777.1 − 762.7 = 2014.4 kJ/kg.

A process heater using this steam and returning condensate at 179.9 °C gets 2 014 kJ from each kilogram, or 560 kW from 1 t/h of steam.

## FAQ

**What is the boiling point of water at different pressures?**
100 °C at 1.013 bar, 120.2 °C at 2 bar, 179.9 °C at 10 bar and 250.4 °C at 40 bar. Select "saturated by pressure" for any value.

**What is the enthalpy of steam?**
For dry saturated steam it ranges from 2 676 kJ/kg at atmospheric pressure to about 2 800 kJ/kg at its maximum near 30 bar. Superheating adds roughly 2 kJ/kg per kelvin.

**What is latent heat?**
The heat to turn saturated water into saturated steam at the same temperature, h_fg. It is 2 256 kJ/kg at 100 °C and falls to zero at the critical point.

**What is the dryness fraction of steam?**
The mass fraction of vapour in a wet steam mixture. Steam at 90 % dryness carries 10 % of its mass as water droplets.

**What is superheated steam?**
Steam heated above its saturation temperature. It carries more energy, does not condense until it cools, and is used in turbines.

**Why use IAPWS-IF97?**
It is the international standard for industrial calculations, adopted by turbine and boiler makers, so results agree with commercial steam tables and software.

## Related calculators

- [Specific heat (Q = mcΔT)](../specific-heat/index.html) — heating water below boiling.
- [Carnot efficiency and COP](../carnot-cop/index.html) — the limit for a steam cycle.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — steam heaters and condensers.
- [Pipe insulation](../pipe-insulation/index.html) — heat loss from steam pipes.
