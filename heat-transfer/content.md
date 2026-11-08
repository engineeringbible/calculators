# Heat transfer calculator: conduction, convection, radiation

**Summary:** Heat flow by conduction through a wall (Fourier), convection from a surface (Newton) and radiation (Stefan–Boltzmann), with heat flux and thermal resistance.

## Introduction

Heat moves in three ways. It is conducted through solids, carried away by a moving fluid in convection, and radiated as infrared light from every warm surface. Each has a simple law: Fourier's law for conduction, Newton's law of cooling for convection, and the Stefan–Boltzmann law for radiation. Together they explain why a brick wall loses heat, a radiator warms a room and a hot pipe needs insulation.

This calculator applies each law to a flat surface. It gives the heat flow in watts, the heat flux per square metre, the thermal resistance and the equivalent heat transfer coefficient. For conduction it lists the thermal conductivity of metals, building materials, insulation, water and air. It is for students, engineers and anyone estimating heat flow through walls, from surfaces or between them.

## Formulas

Conduction through a plane wall (Fourier):

    Q = k A (T₁ − T₂) / L

Convection from a surface (Newton):

    Q = h A (T_s − T_∞)

Radiation from a surface to large surroundings (Stefan–Boltzmann):

    Q = ε σ A (T_s⁴ − T_sur⁴),   σ = 5.670 × 10⁻⁸ W/(m²·K⁴), T in kelvin

Thermal resistance and heat flux:

    R = ΔT / Q,   q″ = Q / A

- k — thermal conductivity, W/(m·K); L — wall thickness
- h — convection coefficient, W/(m²·K); ε — emissivity, 0 to 1

## Assumptions and limitations

- Heat flow is steady and one-dimensional, with constant properties. Conduction is through a flat wall; for pipes and cylinders use the pipe insulation calculator.
- The convection coefficient depends on the fluid and its speed: about 2 to 25 W/(m²·K) for still air, 25 to 250 for moving air, and hundreds to thousands for water.
- Radiation is between a small surface and large surroundings that see each other fully. Two surfaces close together, such as panes of glass, exchange less.
- Conductivities are typical values near room temperature. Insulation loses much of its value when wet.

## Worked example

A 200 mm solid brick wall of 10 m² has 20 °C on one face and 0 °C on the other. How much heat does it conduct?

1. Conductivity of common brick: 0.72 W/(m·K).
2. Heat flow: Q = 0.72 × 10 × (20 − 0) / 0.2 = 720 W.
3. Heat flux: 720 / 10 = 72.00 W/m².
4. Thermal resistance: 20 / 720 = 0.028 K/W.

The surface films of air on each side add resistance, so a real wall loses somewhat less. With 100 mm of extruded polystyrene instead, the flow would be 54 W.

## FAQ

**What are the three modes of heat transfer?**
Conduction through solids and still fluids, convection by a moving fluid, and radiation by electromagnetic waves, which needs no medium.

**What is thermal conductivity?**
The heat that flows through a 1 m thick slab of 1 m² for each kelvin of temperature difference. Copper conducts 401 W/(m·K), brick 0.72 and good insulation about 0.03.

**How do I calculate heat loss through a wall?**
Divide the thermal conductivity by the thickness, multiply by the area and the temperature difference. For walls of several layers, add the resistances L / k of each layer, or use the U-value in the building heat loss calculator.

**What is a typical convection coefficient?**
Around 5 to 10 W/(m²·K) for still air on a wall, 25 to 100 for air blown by a fan, and 500 to 10 000 for pumped water.

**How much heat does a hot surface radiate?**
A black surface at 100 °C emits 1 099 W/m²; facing 20 °C surroundings it loses 681 W/m² net. Shiny metal with ε = 0.05 loses only a twentieth of that.

**What is emissivity?**
How well a surface radiates compared with a perfect black body: about 0.9 for paint, brick and skin, 0.03 to 0.1 for polished metals.

## Related calculators

- [Specific heat (Q = mcΔT)](../specific-heat/index.html) — the heat stored in a material.
- [Building heat loss](../heat-loss/index.html) — whole buildings with U-values.
- [Pipe insulation](../pipe-insulation/index.html) — heat loss of insulated pipes.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — heat transfer between two fluids.
