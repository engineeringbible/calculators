# Specific heat calculator (Q = mcΔT)

**Summary:** Heat to warm or cool a material, Q = m c ΔT, or the temperature change, mass or specific heat, with the heating time at a given power.

## Introduction

The specific heat of a material is the energy needed to raise one kilogram of it by one degree. Water has one of the highest: 4 181 joules per kilogram per kelvin, about ten times that of copper. That is why a kettle takes minutes to boil and why water is used to store and carry heat.

This calculator applies Q = m c ΔT in any direction. It finds the heat to warm or cool a mass, the temperature reached with a given heat, the mass a heat can warm, or a material's specific heat from a measurement. It also gives the heating time for a heater of a given power and efficiency. It lists the specific heat of water, ice, air, steam, oil, metals, concrete and glass.

## Formulas

Sensible heat and heating time:

    Q = m × c × (T₂ − T₁)
    t = Q / (P × η)

Solved for the other quantities:

    T₂ = T₁ + Q / (m c),   m = Q / (c ΔT),   c = Q / (m ΔT)

- Q — heat, J; 1 kWh = 3.6 MJ; 1 Btu = 1 055 J
- m — mass, kg; c — specific heat, J/(kg·K)
- P — heater power, W; η — fraction of it that reaches the material

## Assumptions and limitations

- Only sensible heat is included. Melting ice takes another 334 kJ/kg and boiling water another 2 257 kJ/kg at 100 °C, much more than heating it.
- The specific heat is taken as constant. That is accurate for water between 0 and 100 °C and for metals over modest ranges, but gases over large ranges need an average value.
- The heating time ignores heat lost to the surroundings while heating, so real times are longer, especially for slow heating.
- Material values are typical at room temperature and vary with alloy and composition.

## Worked example

How much energy does it take to boil 1.5 litres of water starting at 20 °C, and how long does a 2 kW kettle take at 90 % efficiency?

1. Mass: 1.5 L of water is 1.5 kg.
2. Heat: 1.5 × 4 181 × (100 − 20) = 501 720 J = 501.7 kJ.
3. In kilowatt-hours: 501.7 / 3 600 = 0.139 kWh.
4. Time: 501 720 / (2 000 × 0.9) = 279 s = 4.65 min.

Actually boiling the water away would take another 1.5 × 2 257 = 3 386 kJ, almost seven times as much.

## FAQ

**What is the specific heat of water?**
4 181 J/(kg·K) at 25 °C, or 1 Btu/(lb·°F) and 1 cal/(g·°C). It is one of the highest of any common substance.

**How do I calculate the heat needed to warm water?**
Multiply the mass in kg by 4 181 and by the temperature rise. 100 L warmed by 40 K takes 16.7 MJ, or 4.6 kWh.

**How long does it take to heat water with a heater?**
Divide the heat by the heater power times its efficiency. A 3 kW immersion heater warms 150 L by 45 K in about 2.6 hours at 100 % efficiency.

**Why do metals heat up so quickly?**
Their specific heat is low: copper 385 and aluminium 897 J/(kg·K), against 4 181 for water. The same heat raises their temperature much more.

**What is the difference between specific heat and heat capacity?**
Specific heat is per kilogram. Heat capacity is for a whole object, its mass times its specific heat, in J/K.

**What about cp and cv for gases?**
cp is at constant pressure and cv at constant volume. For air at room temperature cp = 1 007 and cv = 720 J/(kg·K). Heating air in a room or duct uses cp.

## Related calculators

- [Heat transfer](../heat-transfer/index.html) — how fast heat flows by conduction, convection and radiation.
- [Electricity cost](../electricity-cost/index.html) — the cost of the kilowatt-hours.
- [Building heat loss](../heat-loss/index.html) — heating a whole building.
- [Carnot efficiency and COP](../carnot-cop/index.html) — heat pumps and engines.
