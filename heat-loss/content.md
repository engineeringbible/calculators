# Building heat loss calculator (U-values)

**Summary:** Heat loss of a room or house through walls, windows, roof and floor from U- or R-values, plus ventilation, in W, kW and Btu/h, with yearly heating energy.

## Introduction

How big must a boiler, heat pump or radiator be? It must replace the heat a building loses on a cold day. Heat leaks through every wall, window, roof and floor in proportion to its area, its U-value and the temperature difference, and more is lost with the air that leaks or is ventilated out. A small, reasonably insulated house loses about 2.7 kW when it is 21 °C inside and −3 °C outside.

This calculator adds up those losses from a list of building elements, with U-values in metric or US units or R-values, and the ventilation loss from the air changes. It gives the design heat loss in W, kW and Btu/h, shows which element loses the most, and estimates the heat needed in a year from heating degree-days. It is for heat pump and boiler sizing, radiator selection and comparing insulation upgrades.

## Formulas

Transmission (fabric) loss and ventilation loss at the design temperatures:

    Φ_T = Σ U_i × A_i × (θ_int − θ_ext)
    Φ_V = ρ c_p × n × V × (1 − η) × (θ_int − θ_ext) / 3600

Heat loss coefficient and yearly heat:

    H = Σ U_i A_i + ρ c_p n V (1 − η) / 3600      W/K
    E = H × HDD × 24 / 1000                          kWh

- U — thermal transmittance, W/(m²·K) or Btu/(h·ft²·°F); U = 1/R
- A — area of the element; n — air changes per hour; V — heated volume
- ρ c_p — 1 211 J/(m³·K) for air, i.e. 0.336 W per m³/h per K, or 1.08 Btu/h per cfm per °F
- η — efficiency of any heat recovery; HDD — heating degree-days for the location

## Assumptions and limitations

- U-values must include all layers and surface resistances. Thermal bridges at junctions, lintels and balconies can add 10 to 20 % in older buildings; add them as an extra element if known.
- Ground floors and walls to unheated garages lose heat to a temperature above the outdoor design value. Using the full temperature difference errs on the safe side; EN 12831 applies reduction factors for them.
- Air changes cover both ventilation and leakage: about 0.5 ACH for a typical modern home, 1 or more for an old draughty one, and 0.1 to 0.3 with tight construction and heat recovery.
- The degree-day estimate ignores sun through windows and heat from people and appliances, so actual heating bills are usually lower.

## Worked example

A small house has 100 m² of walls at U = 0.30, 20 m² of windows at 1.4, 60 m² of roof at 0.18, a 60 m² floor at 0.25 and a 2 m² door at 1.8 W/(m²·K). Its 150 m³ have 0.5 air changes an hour. The design temperatures are 21 °C inside and −3 °C outside.

1. Temperature difference: 21 − (−3) = 24 K.
2. Fabric: 100 × 0.30 + 20 × 1.4 + 60 × 0.18 + 60 × 0.25 + 2 × 1.8 = 87.4 W/K, so 87.4 × 24 = 2 098 W.
3. Ventilation: 1 211 × 0.5 × 150 / 3600 = 25.2 W/K, so 25.2 × 24 = 606 W.
4. Total: 2 098 + 606 = 2 703 W.

The house needs about 2.7 kW of heating at the design temperature. The walls are the largest single loss, 720 W, but the windows lose almost as much from a fifth of the area.

## FAQ

**How do I calculate the heat loss of a room?**
For each wall, window, ceiling and floor, multiply its area by its U-value and by the difference between inside and outside temperature, then add the ventilation loss. The sum is the heat the radiator or heater must supply.

**What is a U-value?**
The heat that passes through one square metre of a building element for each degree of temperature difference, in W/(m²·K). Lower is better: a modern wall is 0.15 to 0.30, a double-glazed window 1.2 to 2.8.

**What is the difference between R-value and U-value?**
R is the resistance to heat flow and U is its inverse, U = 1/R, once all layers are added up. US R-values are in ft²·°F·h/Btu; R13 is U = 0.077 Btu/(h·ft²·°F), or 0.44 W/(m²·K).

**What outdoor temperature should I design for?**
The local design temperature, which most countries publish: for example −3 °C in much of the UK, −10 to −15 °C in central Europe, and the ASHRAE 99 % heating design temperature in the US.

**How do I size a heat pump from the heat loss?**
Choose a heat pump whose output at the outdoor design temperature covers the design heat loss, plus any domestic hot water load. Oversizing a heat pump makes it cycle and lowers its efficiency.

**What are heating degree-days?**
The sum over a year of how far the daily mean temperature falls below a base temperature, usually 15.5 or 18 °C. Multiplied by the heat loss coefficient and 24 hours, they give the yearly heat demand.

## Related calculators

- [BTU calculator: AC size for a room](../btu-ac-size/index.html) — the cooling side.
- [Air changes per hour and CFM](../air-changes/index.html) — ventilation rates.
- [Pipe insulation](../pipe-insulation/index.html) — heat loss of pipes.
- [Electricity cost](../electricity-cost/index.html) — running cost of electric heating.
