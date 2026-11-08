# Cargo tank heating time and steam calculator

**Summary:** Heat-up energy, heat losses through deck, shell and bulkheads, heating power or time, steam consumption and heating coil area for a cargo or fuel tank.

## Introduction

Heavy fuel oil, crude, bitumen and many chemical cargoes must be kept warm enough to pump, and heating them is one of the largest energy users on a tanker after propulsion. The calculation is an energy balance: the sensible heat to raise the cargo, plus what leaks out through the deck to the air, the shell to the sea and the bulkheads to neighbouring tanks while heating goes on. This calculator does the balance for a given heating time or a given heating power, converts the power into steam at the coil pressure, and sizes the heating coil from the temperature difference between the steam and the cargo.

It is for chief engineers and cargo officers planning a heat-up before discharge, superintendents checking boiler capacity and fuel for heating, and students of marine engineering.

## Formulas

    E = m c_p (T_target − T_initial)
    Q_loss(T) = U_deck A_deck (T − T_air) + U_shell A_shell (T − T_sea) + U_bhd A_bhd (T − T_adjacent)
    P = E/t + Q_loss(T_mean)        (or t = E/(P − Q_loss(T_mean)))
    ṁ_steam = P / h_fg,   total steam = ṁ t,   maintaining: ṁ = Q_loss(T_target)/h_fg
    A_coil = P / (U_coil (T_sat − T_mean))

Saturated steam: 5 bar g 158.8 °C / 2 085 kJ/kg; 7 bar g 170.4 / 2 047; 10 bar g 184.1 / 1 999; 16 bar g 204.3 / 1 919. Typical U: shell to sea 6–8, deck to air 5–7, to adjacent empty tanks 2–4, insulated 0.5–1.5 W/(m²·K); coil 100–150 for crude, 60–90 for heavy oils.

## Assumptions and limitations

- Well-mixed cargo heated linearly; heavy oils stratify and heat more slowly.
- Overall U values entered by the user dominate the uncertainty (±30 %).
- Saturated steam fully condensed, no condensate flash or sub-cooling, no solar gain, constant ambients.
- Cargo temperature limits (specification, flash point, coating) are the user's check.

## Worked example

5 000 t of heavy fuel oil (c_p 1.9 kJ/kg·K) heated from 30 to 55 °C in 48 h; 400 m² of deck at U 6 to 15 °C air, 600 m² of shell at U 6 to 18 °C sea, 500 m² of bulkheads at U 3 to 30 °C adjacent tanks; 7 bar g steam, coil U 100 W/(m²·K).

1. Sensible heat 5 000 × 1.9 × 25 = 237.5 GJ → 1 374 kW over 48 h.
2. Losses at the 42.5 °C mean: 66 + 88 + 19 = 173 kW → heating power 1 547 kW; 12.5 K per day.
3. Steam at 2 047 kJ/kg: 2 721 kg/h (65 t/day), 131 t in total; losses are 11 % of the heat supplied.
4. Coil: 1 547 kW/(100 × (170.4 − 42.5)) = 121 m². Holding 55 °C afterwards needs 267 kW, 469 kg/h and 23 m² of coil.

With only 1 000 kW available the heat-up takes 80 h; with 16 bar g steam the coil shrinks but the steam mass flow rises 6.7 % because the latent heat is lower.

## FAQ

**Why evaluate the losses at the mean temperature?**
The cargo warms linearly, so the average loss over the heat-up is the loss at the average temperature; the final-temperature loss is what the boiler must supply to hold it.

**Where do the U values come from?**
From the heating-system design (class and oil-major guidance tabulate uninsulated steel to sea and air) or, better, from the ship's own heating records; wind and sea state change the deck and shell values.

**Why does higher steam pressure give a smaller coil but more steam?**
Hotter steam increases the temperature difference driving the coil, but its latent heat per kilogram is lower, so slightly more mass is condensed per kilowatt.

**What limits the heating rate?**
Thermal stress on structure and coatings, coil surface temperature (coking of heavy oils) and the boiler; 10–15 K per day is common practice for heavy cargoes.

**Can I use this for a fuel oil settling tank?**
Yes; enter the tank mass and surfaces. For small tanks the coil and bulkhead terms dominate.

**How do I include a deck heat exchanger with circulation?**
Enter the exchanger duty as the available power in the power mode; its own losses and pumping energy are extra.

## Related calculators

- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — the deck heater or steam-to-oil exchanger.
- [Pipe insulation heat loss](../pipe-insulation/index.html) — steam line losses on deck.
- [Fuel blend viscosity and heating](../fuel-blend-heating/index.html) — the pumping temperature the heating is for.
- [Tank volume and partial fill](../tank-volume/index.html) — cargo quantity.
- [Thermal expansion](../thermal-expansion/index.html) — cargo volume change with temperature.
