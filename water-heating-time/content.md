# Water heating time calculator (tank, element, gas or heat pump)

**Summary:** Time to heat a water tank with an electric element, gas burner or heat pump, with standing loss, energy, cost and recovery rate in L/h or gal/h.

## Introduction

How long does a water heater take to heat up? Divide the heat the water needs, mass times specific heat times temperature rise, by the heater's useful output. A 50 gallon tank heated from 50 to 120 °F needs 8.55 kWh, so a 4.5 kW element takes just under two hours.

This calculator gives the heating time for an electric element, a gas or oil burner, or a heat pump. It includes the heat the tank loses to the room while it heats, as an exponential approach to the highest temperature the heater can hold. It also gives the energy drawn, the cost of one heat-up and the recovery rate in gallons or litres per hour. It is for homeowners, plumbers, and engineers sizing domestic and process hot water.

## Formulas

Heat into the water and useful heater output:

    Q = m × c × (T1 − T0),   m = ρ V
    P_heat = η × P (element, burner)   or   COP × P (heat pump)

Heating time without and with standing loss:

    t = Q / P_heat                                   (UA = 0)
    t = τ × ln[(T_eq − T0) / (T_eq − T1)]
    τ = m c / UA,   T_eq = T_room + P_heat / UA

Energy drawn and recovery rate:

    E = P × t
    Recovery = P_heat / (ρ c ΔT_rise)

- V — tank volume; ρ = 999 kg/m³; c = 4 186 J/(kg·K), or 1 Btu/(lb·°F)
- T0, T1 — starting and target water temperatures; T_room — air around the tank
- η — element or burner efficiency; COP — heat pump coefficient of performance
- UA — standing loss coefficient of the tank in W/K; τ — its time constant

## Assumptions and limitations

- The water is treated as fully mixed. A real tank stratifies, so hot water reaches the top outlet well before the whole tank is at the set point.
- The efficiency and the COP are constant. A heat pump's COP falls as the water gets hotter, so its last few degrees take longer than calculated.
- The standing loss uses a constant UA. A tank that loses S watts when 45 K above the room has UA = S / 45.
- The recovery rate uses the full heater output, as makers quote it. The standing loss is not deducted.
- Water properties are taken at about 15 °C. They change by less than 2 % between 10 and 60 °C.

## Worked example

A 50 US gallon electric water heater has a 4.5 kW element. The water comes in at 50 °F and the thermostat is set to 120 °F. The tank loses 2 W/K to a 68 °F room. Electricity costs 0.15 per kWh.

1. Mass of water: 999 × 0.1893 m³ = 189.1 kg.
2. Temperature rise: 120 − 50 = 70 °F, or 38.9 K.
3. Heat needed: 189.1 × 4 186 × 38.9 = 30.78 MJ, or 8.55 kWh.
4. Time constant: 189.1 × 4 186 / 2 = 395 700 s, about 110 h. T_eq = 20 + 4 500 / 2 = 2 270 °C, far above the target.
5. Time: 395 700 × ln[(2 270 − 10) / (2 270 − 48.9)] = 6 869 s, or 114.5 min.
6. Energy drawn: 4.5 kW × 6 869 s = 8.59 kWh, which costs 1.29.
7. Recovery at a 90 °F rise: 4 500 / (999 × 4 186 × 50) × 3 600 = 0.0775 m³/h, or 20.5 US gal per hour (77 litres).

The standing loss adds only 0.5 minutes here. It matters far more over a whole day than during one heat-up.

## FAQ

**How long does a 50 gallon water heater take to heat?**
From 50 to 120 °F, about 114 minutes with a 4.5 kW element. A 40 000 Btu/h gas burner at 80 % efficiency does it in about 55 minutes.

**What is the recovery rate of a water heater?**
The volume it can heat through a stated rise in one hour, usually 90 °F in the US. A 4.5 kW element recovers about 20.5 gallons per hour at that rise.

**How much heat does a tank lose standing still?**
UA times the temperature difference. A tank with UA = 2 W/K at 120 °F in a 68 °F room loses 58 W, about 1.4 kWh a day.

**Why does a heat pump water heater heat slowly?**
Its heat output is the COP times a small electrical input. The time depends only on that heat output, while the energy drawn is only a third of an element's at a COP of 3.

**How do I convert kW to Btu/h?**
Multiply by 3 412. A 4.5 kW element gives 15 354 Btu/h, and a therm of gas is 29.31 kWh.

**Why does my tank deliver hot water before it has fully heated?**
Hot water rises and collects at the top, where the outlet is. The calculator assumes a fully mixed tank, so it gives the time for the whole volume.

## Related calculators

- [Specific heat](../specific-heat/index.html) — heat for any material and temperature change.
- [Newton's law of cooling](../newtons-cooling/index.html) — how fast the tank cools when the heater is off.
- [Electricity cost](../electricity-cost/index.html) — the running cost over a year.
- [Carnot efficiency and COP](../carnot-cop/index.html) — the ideal limit of a heat pump.
