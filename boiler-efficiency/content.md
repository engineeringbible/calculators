# Boiler efficiency calculator (direct and indirect method)

**Summary:** Steam boiler efficiency by the direct method, steam heat over fuel input on HHV and LHV basis, or the indirect method with Siegert flue gas loss.

## Introduction

Boiler efficiency is the share of the fuel's heat that ends up in the steam. The direct method divides the heat gained by the water by the heat in the fuel burned. A gas-fired boiler making 5 000 kg/h of saturated steam at 10 bar g from 80 °C feedwater, on 290 kg/h of natural gas, is 80.7 % efficient on the gross (HHV) basis and 89.4 % on the net (LHV) basis.

This calculator works out the efficiency both ways. The direct method uses steam and fuel flows, with steam and feedwater enthalpies from the IAPWS-IF97 steam tables. The indirect method subtracts the flue gas, radiation and blowdown losses from 100 %. A fuel table gives the gross and net heating values. It is for boiler operators, energy auditors and plant engineers.

## Formulas

Direct method:

    η = ṁ_s × (h_s − h_fw) / (ṁ_f × CV)
    h_s = h_f + x (h_g − h_f) for wet steam, or h(p, T) for superheated steam

Indirect method, flue gas loss by the Siegert formula (1. BImSchV), LHV basis:

    q_A = (t_A − t_L) × (A2 / (21 − O2) + B)      in %
    η_LHV = (1 − q_A − q_rad) × (1 − r)
    r = b' (h_f − h_fw) / [(h_s − h_fw) + b' (h_f − h_fw)],   b' = b / (1 − b)
    η_HHV = η_LHV × LHV / HHV

- ṁ_s, ṁ_f — steam and fuel mass flows; CV — gross (HHV) or net (LHV) calorific value
- h_s, h_f, h_fw — enthalpy of the steam, of saturated water at boiler pressure, and of the feedwater
- t_A, t_L — flue gas and combustion air temperatures in °C; O2 — oxygen in the dry flue gas, %
- A2, B — fuel constants: natural gas 0.66 and 0.009, heating oil 0.68 and 0.007, LPG 0.63 and 0.008
- q_rad — radiation and convection loss; b — blowdown as a share of the feedwater

## Assumptions and limitations

- The heating values are the GREET values published by Oak Ridge National Laboratory. Coal and wood vary widely, so use the value from a fuel analysis when you have one.
- The direct method counts only the steam as output, so all losses are inside the result. Its accuracy depends on the flow meters, and a 2 % error in fuel flow gives a 2 % error in efficiency.
- The Siegert formula covers oil and gas firing with complete combustion. It ignores unburnt fuel (CO) and does not apply once the flue gas condenses, below about 60 °C.
- US practice and ASME PTC 4 use the gross (HHV) basis; much of Europe and EN 12952-15 use the net (LHV) basis. Always state which one.

## Worked example

The Bureau of Energy Efficiency (India) gives this direct-method example. A coal-fired boiler makes 8 t/h of dry saturated steam at 10 kg/cm² g from feedwater at 85 °C. It burns 1.6 t/h of coal with a gross calorific value of 4 000 kcal/kg.

1. Absolute pressure: 10 kg/cm² g is 9.81 bar g, or 10.82 bar abs. Saturation is 183.3 °C.
2. Steam enthalpy from IAPWS-IF97: h_s = 2 780 kJ/kg (664 kcal/kg).
3. Feedwater enthalpy at 85 °C: h_fw = 356.7 kJ/kg.
4. Heat to the steam: 8 000 / 3 600 × (2 780 − 356.7) = 5 385 kW.
5. Fuel input: 1 600 / 3 600 × 4 000 × 4.1868 = 7 443 kW.
6. Efficiency: 5 385 / 7 443 = 72.3 %.

BEE prints 72.5 %, using 665 kcal/kg for the steam. For the indirect method on a gas boiler, a flue gas at 180 °C with 3 % O2 and 20 °C air loses 7.31 % by Siegert. With 1 % radiation and 3 % blowdown at 10 bar g, the efficiency is 91.2 % net, or 82.3 % gross.

## FAQ

**How do I calculate boiler efficiency?**
Divide the heat added to the water, steam flow times the enthalpy rise from feedwater to steam, by the fuel flow times its calorific value. That is the direct method.

**What is the difference between the direct and indirect methods?**
The direct method needs accurate steam and fuel flows. The indirect method needs only a flue gas analysis and estimates of the other losses, and it shows where the heat goes.

**What is the difference between HHV and LHV efficiency?**
The gross (HHV) basis counts the latent heat of the water vapour in the flue gas as a loss; the net (LHV) basis does not. For natural gas LHV/HHV is 0.903, so 90 % net is 81.2 % gross.

**How does excess air affect efficiency?**
More oxygen means more flue gas carrying heat up the stack. At 180 °C flue gas, natural gas loses 7.31 % with 3 % O2 and 8.48 % with 6 % O2.

**How much does a lower flue gas temperature save?**
At 3 % O2 on natural gas, every 20 K lower flue gas temperature cuts the loss by about 0.9 points. An economiser that cools the gas from 180 to 160 °C raises the net efficiency from 91.2 to 92.1 %.

**Can boiler efficiency exceed 100 %?**
Only on the net (LHV) basis, in a condensing boiler that recovers the latent heat of the water vapour. On the gross basis it always stays below 100 %.

## Related calculators

- [Steam table (IAPWS-IF97)](../steam-table/index.html) — enthalpies of steam and water.
- [Specific heat](../specific-heat/index.html) — heat to warm water or other materials.
- [Building heat loss](../heat-loss/index.html) — the heat demand the boiler must cover.
- [Fuel net specific energy and CO₂ factor](../fuel-lcv-co2/index.html) — calorific values of marine fuels.
