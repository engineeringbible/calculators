# BTU calculator: AC size for a room

**Summary:** Air conditioner size in BTU, kW and tons for a room from its floor area, with the ENERGY STAR adjustments for sun, people and kitchens.

## Introduction

How many BTUs does a room need? Air conditioners are rated in British thermal units per hour (Btu/h), and the right size depends mostly on the floor area. ENERGY STAR publishes a sizing chart for room air conditioners: 5 000 Btu/h for a small bedroom of 100 to 150 ft², 12 000 Btu/h for 450 to 550 ft², up to 34 000 Btu/h for 2 500 ft². The chart is then adjusted for sun, occupants and kitchens.

This calculator applies that chart and its adjustments to your room, and gives the result in Btu/h, kilowatts of cooling and tons of refrigeration. It is for anyone choosing a window, portable or through-the-wall unit, or a single mini-split head, for one room.

## Formulas

Capacity from the ENERGY STAR chart for the floor area A, then the adjustments:

    Q = chart(A) × f_sun + 600 × (people − 2) + 4 000 × kitchen    Btu/h

| Area (ft²) | Area (m²) | Capacity (Btu/h) |
|---|---|---|
| 100 to 150 | 9 to 14 | 5 000 |
| 150 to 250 | 14 to 23 | 6 000 |
| 250 to 300 | 23 to 28 | 7 000 |
| 300 to 350 | 28 to 33 | 8 000 |
| 350 to 400 | 33 to 37 | 9 000 |
| 400 to 450 | 37 to 42 | 10 000 |
| 450 to 550 | 42 to 51 | 12 000 |
| 550 to 700 | 51 to 65 | 14 000 |
| 700 to 1 000 | 65 to 93 | 18 000 |
| 1 000 to 1 200 | 93 to 111 | 21 000 |
| 1 200 to 1 400 | 111 to 130 | 23 000 |
| 1 400 to 1 500 | 130 to 139 | 24 000 |
| 1 500 to 2 000 | 139 to 186 | 30 000 |
| 2 000 to 2 500 | 186 to 232 | 34 000 |

Conversions:

    1 Btu/h = 0.29307 W,   1 ton of refrigeration = 12 000 Btu/h = 3.517 kW

- f_sun — 0.9 for a heavily shaded room, 1.1 for a very sunny one, 1 otherwise
- people — regular occupants; the chart already allows for two
- kitchen — add 4 000 Btu/h if the unit serves a kitchen

## Assumptions and limitations

- The chart assumes ceilings of about 8 ft (2.4 m), average insulation and windows, and a typical climate. Tall ceilings, large west-facing windows, poor insulation or a very hot climate need more capacity.
- It sizes a single room. A whole house with central air needs a room-by-room load calculation such as ACCA Manual J, which accounts for walls, windows, orientation and infiltration.
- Bigger is not better: an oversized unit cools the air quickly and switches off before it has removed the moisture, leaving the room cold and clammy.
- The 20 Btu/h per ft² rule of thumb is shown for comparison only.

## Worked example

A living room is 14 by 20 ft, gets strong afternoon sun, and three people use it most evenings. What size of air conditioner does it need?

1. Floor area: 14 × 20 = 280 ft², which falls in the 250 to 300 ft² row: 7 000 Btu/h.
2. Very sunny: 7 000 × 1.1 = 7 700 Btu/h.
3. One person beyond two: 7 700 + 600 = 8 300 Btu/h.
4. In other units: 8 300 × 0.29307 = 2.43 kW, or 8 300 / 12 000 = 0.69 ton.

So choose a unit of about 8 000 to 9 000 Btu/h, rather than the 7 000 Btu/h the area alone suggests.

## FAQ

**How many BTU do I need per square foot?**
About 20 Btu/h per ft² for an average room, falling to about 14 for large open areas. The chart above is more accurate than the single figure.

**What size AC for a 12 × 12 room?**
144 ft² falls in the 100 to 150 ft² row, so 5 000 Btu/h, or 5 500 with a lot of sun.

**How many square feet does a 12 000 BTU air conditioner cool?**
450 to 550 ft² (42 to 51 m²) in normal conditions.

**How many BTU is a ton of air conditioning?**
12 000 Btu/h, the heat that melts one short ton of ice in 24 hours. A 1.5 ton unit is 18 000 Btu/h.

**How do I convert BTU to kW?**
Multiply Btu/h by 0.293 to get watts. A 12 000 Btu/h unit delivers 3.5 kW of cooling.

**Is a bigger air conditioner better?**
No. An oversized unit short-cycles, removes less moisture, wears faster and costs more to buy. Size it to the room.

## Related calculators

- [Building heat loss calculator](../heat-loss/index.html) — the heating side, with U-values.
- [Air changes per hour and CFM](../air-changes/index.html) — ventilation of the room.
- [Dew point calculator](../dew-point/index.html) — humidity and comfort.
- [Electricity cost](../electricity-cost/index.html) — running cost of the unit.
