# Alternative fuel tank volume calculator

**Summary:** Mass, volume and tank capacity of LNG, methanol, ammonia, hydrogen, LPG or biofuels carrying the same energy as a quantity of oil fuel.

## Introduction

How much bigger do the tanks have to be when a ship changes fuel? The answer depends on two properties: the energy per kilogram (the lower calorific value) and the density at the storage condition. Methanol and ammonia carry less than half the energy of gas oil per kilogram, and hydrogen is so light that even as a liquid it needs several times the volume. This calculator takes a quantity of oil fuel, finds the mass and volume of an alternative fuel that does the same work, adds the filling limit and unpumpable volume to give the tank capacity, and compares all the listed fuels side by side.

It is for naval architects and superintendents in early design or conversion studies, fleet planners comparing fuel options, and anyone checking an endurance claim for a new fuel.

## Formulas

    Energy to carry:     E = m_ref × LCV_ref
    Alternative mass:    m = E / (η_rel × LCV)
    Volume:              V = m / ρ
    Tank capacity:       V_tank = V / (filling limit − unpumpable)
    Energy density:      LCV × ρ

- η_rel — efficiency of the machinery on the alternative fuel relative to the reference fuel.

## Assumptions and limitations

- Calorific values: FuelEU Maritime Annex II defaults; ethanol, FAME and HVO from RED Annex III.
- Densities of the pure substances from NIST at the storage condition named; LNG is taken as methane, which understates the density of real LNG.
- The tank capacity includes the filling limit and the unpumpable volume or heel only.
- The tank system around the tank (insulation, cylindrical tanks in a prismatic hold, cofferdams, tank connection spaces), pilot fuel, boil-off and the mass of the tanks are not included.

## Worked example

A ship carries 1000 t of MGO at 860 kg/m³. How much methanol does the same work, with the same efficiency?

1. Energy: 1000 t × 42.7 MJ/kg = 42 700 GJ.
2. Methanol mass: 42 700 / 19.9 = 2145.7 t.
3. Methanol volume: 2145.7 t / 795.7 kg/m³ = 2696.7 m³, against 1162.8 m³ of MGO: 2.32 times the volume.
4. Tank capacity with a 98 % filling limit and 2 % unpumpable: 2696.7 / 0.96 = 2809.0 m³.

## FAQ

**Why compare by energy rather than by mass?**
The engine needs energy, not tonnes. Methanol has 19.9 MJ/kg against 42.7 MJ/kg for gas oil, so the same voyage needs 2.15 times the mass of methanol.

**What does the relative efficiency do?**
It adjusts for machinery that converts the fuel's energy more or less efficiently than on the reference fuel, for example a fuel cell or a different engine cycle. A value of 0.95 means 5 % more energy is needed for the same work.

**Why is liquid hydrogen worse than its 120 MJ/kg suggests?**
Its density is only 71 kg/m³, so its energy per cubic metre is about a quarter of gas oil's. Compressed hydrogen at 700 bar holds less than 60 % of that.

**Is ammonia better refrigerated or pressurised?**
Refrigerated ammonia at −33 °C is about 10 % denser than ammonia stored under pressure at 15 °C, so it takes less tank volume. The choice also depends on the tank type, boil-off handling and the ship's size.

**Why is the tank capacity not the space in the ship?**
Cryogenic and pressurised fuels need cylindrical or insulated tanks, which waste space in a prismatic hold, plus cofferdams and tank connection spaces. Those depend on the design and are not included here.

**Can I use my own fuel data?**
Yes. Choose the custom fuel and enter its calorific value and density, for example the density on an LNG bunker delivery note.

## Related calculators

- [Fuel net specific energy and CO₂ factor](../fuel-lcv-co2/index.html) — the calorific value of an oil fuel from its properties.
- [EU ETS and FuelEU Maritime](../eu-ets-fueleu/index.html) — the regulatory cost of each fuel.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — the mass of oil fuel in a tank.
- [Tank volume and partial fill](../tank-volume/index.html) — the volume of a tank from its shape.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — the fuel a passage needs.
