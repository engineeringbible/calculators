# Carnot efficiency and COP calculator

**Summary:** Carnot efficiency of a heat engine and the ideal COP of a heat pump or refrigerator between two temperatures, with a realistic estimate and the heat or power.

## Introduction

No machine working between two temperatures can beat the Carnot limit. A heat engine turns at most 1 − T_cold/T_hot of its heat into work; a heat pump delivers at most T_hot/(T_hot − T_cold) units of heat per unit of electricity. The smaller the temperature lift, the better: a heat pump heating floors at 35 °C from 0 °C outdoor air could in theory deliver almost nine units of heat for one of electricity.

This calculator gives the Carnot efficiency of an engine, and the ideal coefficient of performance (COP) of a heat pump or refrigerator, from the two temperatures. Real machines reach a fraction of the ideal, so it also gives a realistic value and the heat or power that results. It is for engineers, students and homeowners comparing heat pumps, chillers and power cycles.

## Formulas

With temperatures in kelvin, T = °C + 273.15:

    heat engine:      η_C = 1 − T_c / T_h
    heat pump:        COP_h = T_h / (T_h − T_c)
    refrigerator:     COP_c = T_c / (T_h − T_c)

Real machines and energy balance:

    COP_real = f × COP_Carnot       (or η_real = f × η_C)
    heat pump:  Q_h = COP × W,   Q_source = Q_h − W
    engine:     W = η × Q_in,     Q_rejected = Q_in − W

- T_h, T_c — hot and cold reservoir temperatures
- f — second-law efficiency, the fraction of Carnot a real machine reaches
- W — electrical or mechanical work; Q — heat flow

## Assumptions and limitations

- The temperatures are those of the reservoirs. Inside a real heat pump the refrigerant evaporates a few degrees below the source and condenses a few degrees above the delivered temperature, so the true lift is larger.
- Good heat pumps and chillers reach about 40 to 55 % of the Carnot COP at their rating point. Engines reach 30 to 60 % of the Carnot efficiency.
- Seasonal values such as SCOP and SEER average over changing weather, part load and defrost, and are lower than the COP at a mild rating point.
- For a heat pump, lowering the flow temperature by 10 K raises the COP by roughly a quarter, which is why underfloor heating suits heat pumps.

## Worked example

An air-source heat pump supplies underfloor heating at 35 °C when it is 0 °C outside. It reaches 50 % of the Carnot COP. How much heat does it give for 2 kW of electricity?

1. Temperatures: T_h = 308.15 K, T_c = 273.15 K, a lift of 35 K.
2. Carnot COP: 308.15 / 35 = 8.804.
3. Realistic COP: 0.5 × 8.80 = 4.40.
4. Heat delivered: 4.40 × 2 = 8.80 kW, of which 6.80 kW comes from the outdoor air.

With radiators at 55 °C, the Carnot COP would fall to 6.0 and the real COP to about 3.0.

## FAQ

**What is the Carnot efficiency?**
The highest possible efficiency of a heat engine between two temperatures, 1 − T_cold/T_hot in kelvin. A plant with steam at 550 °C and cooling water at 30 °C cannot exceed 63 %.

**What is a good COP for a heat pump?**
Around 3 to 4.5 at typical conditions. The COP rises with a warmer source and a cooler delivery temperature.

**Why can a COP be greater than 1?**
A heat pump moves heat rather than making it. The electricity drives the move, and the heat comes mostly from the outside air or ground.

**How does outdoor temperature affect a heat pump?**
Colder outdoor air widens the lift and lowers the COP. At 35 °C flow, the Carnot COP falls from 8.8 at 0 °C to 6.8 at −10 °C.

**What is the COP of a refrigerator?**
Ideal values are high, about 9 for 5 °C inside and 35 °C outside, but real fridges reach 2 to 4 because of the large temperature differences across their coils.

**What is the difference between COP and EER?**
COP is heat over electricity in the same units. EER is cooling in Btu/h per watt, so EER = 3.412 × COP.

## Related calculators

- [Specific heat (Q = mcΔT)](../specific-heat/index.html) — heat to warm water or a material.
- [Heat transfer](../heat-transfer/index.html) — conduction, convection and radiation.
- [Building heat loss](../heat-loss/index.html) — the heat a house needs.
- [Electricity cost](../electricity-cost/index.html) — running cost of the heat pump.
