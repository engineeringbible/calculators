# EV charging time and cost calculator

**Summary:** Electric car charging time and cost from battery size, state of charge, charger power and the car's limit, with charging losses and the range added per hour.

## Introduction

How long does an electric car take to charge? Work out the energy the battery needs, add the charging losses, and divide by the charging power. Charging a 75 kWh battery from 20 to 80 % puts 45 kWh into it. At 90 % efficiency, a 7.2 kW home charger draws 50 kWh from the grid and takes just under 7 hours.

This calculator gives the charging time, the energy drawn and lost, the cost at your electricity price, and the range added in total and per hour of charging. It handles Level 1 and Level 2 AC charging, limited by the car's onboard charger, and DC fast charging, limited by the car's maximum DC power. It is for EV drivers, fleet managers and anyone planning home or workplace charging.

## Formulas

Energy, time and cost:

    E_bat = C × (SoC_end − SoC_start)
    E_grid = E_bat / η
    P = min(P_charger, P_car)
    t = E_grid / P
    cost = E_grid × price

Range:

    range = E_bat / c
    range per hour = P × η / c

- C — usable battery capacity; SoC — state of charge
- η — charging efficiency from the grid to the battery
- P_charger — charger power, volts × amps for AC
- P_car — onboard charger limit (AC) or maximum DC charging power
- c — consumption from the battery, in kWh per mile or per km

## Assumptions and limitations

- The power is constant during the charge. DC fast charging slows down sharply above about 80 %, so a charge to 100 % takes longer than shown.
- The efficiency covers the onboard charger, cables, battery and cooling. Idaho National Laboratory measured 88.8 % on Level 1 and 90.8 % on Level 2 for one car's onboard charger. Plan with 85 to 90 %, and less in cold weather.
- The consumption is what the trip computer shows, taken from the battery. EPA label figures in kWh/100 mi are measured at the wall and already include the charging losses.
- The price is per kWh from the grid or the charging station. Standing charges, session fees and time-of-use rates are not included.

## Worked example

A car with a 75 kWh usable battery charges from 20 to 80 % on a 7.2 kW Level 2 charger, 240 V at 30 A. Its onboard charger accepts 11 kW. The efficiency is 90 %, electricity costs 0.15 per kWh, and the car drives 3.4 mi/kWh. How long does it take, and what does it cost?

1. Energy into the battery: 75 × (0.80 − 0.20) = 45.0 kWh.
2. Energy from the grid: 45.0 / 0.90 = 50.0 kWh, so 5 kWh is lost.
3. Power: the charger's 7.2 kW is below the car's 11 kW, so 7.2 kW.
4. Time: 50.0 / 7.2 = 6.94 h, or 6 h 57 min.
5. Cost: 50.0 × 0.15 = 7.50.
6. Range added: 45.0 × 3.4 = 153 mi.
7. Range added per hour of charging: 7.2 × 0.90 × 3.4 = 22.0 mph, that is 22 miles for each hour on the charger.

## FAQ

**How long does it take to charge an electric car?**
Divide the energy needed, including losses, by the charging power. A 50 kWh charge takes about 7 hours at 7.2 kW and about 35 hours at 1.44 kW.

**What is the difference between Level 1 and Level 2 charging?**
Level 1 uses a 120 V household outlet at 12 to 16 A, 1.4 to 1.9 kW. Level 2 uses 208 to 240 V at up to 80 A, up to 19.2 kW, and most home units deliver up to 7.2 kW.

**How much does it cost to charge an EV?**
Multiply the energy drawn from the grid by the price per kWh. 50 kWh at 0.15 costs 7.50.

**Why does my car charge slower than the charger's rating?**
The car's onboard charger limits AC charging. An 11 kW wallbox charges a car with a 7.4 kW onboard charger at only 7.4 kW.

**Why does DC fast charging slow down above 80 %?**
The car reduces the current as the battery fills, to protect the cells. Each kWh near the top therefore takes much longer to add.

**How efficient is EV charging?**
Typically 85 to 90 % from the wall to the battery. The losses heat the charger, the cables and the battery.

**How many miles of range does an hour of charging add?**
Charging power × efficiency × miles per kWh. At 7.2 kW, 90 % and 3.4 mi/kWh it is 22 miles per hour.

## Related calculators

- [Electricity cost and energy use](../electricity-cost/index.html) — the running cost of any load.
- [Battery charge time](../battery-charge-time/index.html) — charge time for any battery in Ah.
- [kW to amps](../kw-to-amps/index.html) — the circuit current of a charger.
- [Solar panel payback calculator](../solar-payback/index.html) — charging from your own panels.
