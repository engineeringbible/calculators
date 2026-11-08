# Pipe and tank insulation heat loss calculator

**Summary:** Heat loss through multi-layer cylindrical or flat insulation, surface temperature and the heating power to hold a fuel tank or line warm.

## Introduction

Heated fuel lines, steam pipes, thermal-oil systems and bunker tanks all lose heat to their surroundings, and the loss sets the heating coil or trace-heating power, the steam consumption and, on the outside, whether a crew member can touch the cladding. The calculation is the textbook thermal resistance network: inside film, pipe wall, insulation layers and outside film in series, with the cylindrical geometry making the outer layers less effective than their thickness suggests. This calculator builds that network for a pipe or a flat tank wall, reports every resistance and temperature, compares with the bare surface, flags the critical radius effect and converts the loss into annual heating energy.

It is for marine and plant engineers sizing tank heating and insulation, energy auditors, and students of heat transfer.

## Formulas

Pipe (per metre of length), radii r₁ (inside wall), r₂ (outside wall), r₃, r₄ (insulation layers):

    R_i = 1/(h_i 2π r₁),   R_wall = ln(r₂/r₁)/(2π k_wall),   R_1 = ln(r₃/r₂)/(2π k₁),   R_2 = ln(r₄/r₃)/(2π k₂),   R_o = 1/(h_o 2π r₄)
    q = (T_in − T_amb) / ΣR    [W/m],   T_surface = T_amb + q R_o,   T_interface = T_in − q (R_i + R_wall)
    r_cr = k₁ / h_o   (critical insulation radius)

Flat wall (per m²): R = 1/h_i + t_wall/k_wall + t₁/k₁ + t₂/k₂ + 1/h_o.

Totals: Q = q × length (or area); annual energy = Q × hours.

Typical values: mineral wool k 0.035–0.045 W/(m·K) at 50 °C (0.06–0.08 at 200 °C), calcium silicate 0.06, PUR 0.025; h_o 8–10 W/(m²·K) still air with radiation, 20–30 in wind; h_i 1 000+ for liquids and condensing steam, 20–50 for gases.

## Assumptions and limitations

- One-dimensional steady conduction; constant conductivities at their mean temperature; combined outside coefficient entered by the user.
- Thermal bridges (supports, flanges, valves) and uninsulated fittings add 10–20 % on real lines; heat-up from cold and wind chill are not included.
- The bare-surface comparison uses the same h_o; the hot bare pipe radiates more, so the saving is slightly understated.
- Cold service is handled with the same network (the loss becomes a heat gain) and the cladding temperature should be checked against the dew point.

## Worked example

A 4-inch heavy fuel oil line (114.3 mm OD, 6 mm wall, k 50 W/(m·K)) at 150 °C with 50 mm of mineral wool (k 0.04) in a 25 °C engine room with still air (h_o 10), 10 m long, 6 000 h/year.

1. Radii: 51.15 / 57.15 / 107.15 mm. Resistances per metre: inside 0.0031, wall 0.0004, insulation ln(107.15/57.15)/(2π × 0.04) = 2.501, outside 1/(10 × 2π × 0.10715) = 0.1485; total 2.653 K·m/W.
2. Loss 125/2.653 = 47.1 W/m, 471 W for the line; 2.8 MWh/year of heating.
3. Cladding temperature 25 + 47.1 × 0.1485 = 32 °C (safe to touch); the steel under the insulation is at 149.8 °C.
4. Bare, the same pipe would lose 443 W/m: the insulation removes 89 %. Adding a second 25 mm layer of k 0.03 brings the loss down to 33.4 W/m.
5. Critical radius k/h_o = 4 mm, far below the pipe radius, so every millimetre of insulation helps here; on a 10 mm cable with poor insulation it would not.

## FAQ

**Why does the second layer save less than the first?**
Two reasons: the loss is already small, and in cylindrical geometry each added millimetre sits on a larger circumference, so its resistance ln(r_out/r_in) grows more slowly than its thickness.

**What is the critical radius?**
Below r = k/h_o the increase in outside area outweighs the added conduction resistance and insulation increases the loss. It only matters for thin wires and tubes with poor insulation; for pipes with mineral wool it is a few millimetres.

**Which conductivity should I use?**
The value at the mean temperature of the layer (roughly the average of its two faces); manufacturers publish k against temperature, and mineral wool nearly doubles between 50 and 200 °C.

**How do I get the heating coil power for a tank?**
Use the flat-wall geometry per bulkhead and bottom with the correct outside coefficients (sea water on the shell gives a very high h_o), sum the areas, add 10–20 % for structure and use the result as the steady holding load; heat-up from cold needs the tank contents' heat capacity on top.

**Is 60 °C the right surface limit?**
It is the usual personnel-protection limit for metal cladding (CINI, ASTM C1055); some owners specify 50 °C for touchable surfaces.

**Does wind matter?**
Yes: h_o of 20–30 W/(m²·K) on an exposed deck raises the loss of a well-insulated pipe only slightly but lowers the cladding temperature; for a bare pipe it roughly doubles the loss.

**What about cold insulation?**
Enter the cold temperature inside; the loss becomes a heat gain, and the cladding must stay above the dew point of the ambient air to avoid condensation (vapour barrier needed).

## Related calculators

- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — the heater supplying the holding load.
- [Engine-room ventilation (ISO 8861)](../engine-room-ventilation/index.html) — the room heat load these losses feed.
- [Fuel blending and heating viscosity](../fuel-blend-heating/index.html) — the storage and transfer temperatures to hold.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — expansion of the hot line.
