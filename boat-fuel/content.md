# Boat fuel consumption calculator

**Summary:** Boat fuel burn in litres and gallons per hour from engine power and load, with range and endurance on a tank, fuel per mile and cost per hour.

## Introduction

A boat engine burns fuel in proportion to the power it delivers. Multiply the power by the specific fuel consumption, the grams of fuel per kilowatt-hour, and divide by the fuel's density to get litres per hour. A 200 hp diesel at 70 % of its rated power delivers 104 kW and burns about 28 L, or 7.4 US gallons, per hour.

This calculator gives the fuel flow from the engine power and load, or takes a measured flow, and turns it into endurance and range on the fuel in the tank after a reserve. It also gives fuel per nautical mile and the cost per hour and per mile. It is for leisure boaters planning a trip and for skippers of workboats, launches and small commercial craft.

## Formulas

Power and fuel flow:

    P = P_rated × load      or      P = P_rated × (n / n_rated)³
    ṁ = P × SFC,     Q = ṁ / ρ_fuel

Range and cost:

    endurance = V_tank × (1 − reserve) / Q
    range = endurance × speed,     fuel per mile = Q / speed

- P_rated — rated power of all engines together; n — engine rpm
- SFC — specific fuel consumption: 225 g/kWh for diesel, 300 g/kWh for four-stroke petrol by default
- ρ_fuel — fuel density: 0.84 kg/L for diesel, 0.745 kg/L for petrol
- 1 US gallon = 3.785 L

## Assumptions and limitations

- The default diesel SFC of 225 g/kWh sits within the 220 to 232 g/kWh of Volvo Penta's D4 engines at rated power. The petrol value of 300 g/kWh is a little above the 270 g/kWh Heywood gives as a typical best for spark-ignition engines.
- Engines burn more per kilowatt-hour at light load. Below about a third of rated power the result is probably low; the engine maker's fuel curve or a flow meter is better.
- The rpm option uses the propeller law, power proportional to rpm cubed. It suits displacement boats well. Planing boats depart from it, most of all around the speed where they climb onto the plane.
- Range assumes calm water, a clean hull and constant speed. Head seas, wind, current and fouling all shorten it, which is what the reserve is for.

## Worked example

A launch has a 200 hp diesel and cruises at 70 % power and 20 kn. It carries 400 L of fuel and keeps 20 % in reserve. Diesel costs 1.80 per litre.

1. Power: 200 hp × 0.70 = 140 hp = 104.4 kW.
2. Fuel mass: 104.4 kW × 225 g/kWh = 23.49 kg/h.
3. Fuel volume: 23.49 / 0.84 = 27.96 L/h, which is 7.39 US gal/h.
4. Usable fuel: 400 × (1 − 0.20) = 320 L, which lasts 320 / 27.96 = 11.4 h.
5. Range: 11.44 h × 20 kn = 229 nmi, at 1.40 L per mile.
6. Cost: 27.96 L/h × 1.80 = 50.33 per hour, or 2.52 per mile.

## FAQ

**How much fuel does a boat engine burn per hour?**
At the default values a diesel burns about 0.2 L per horsepower per hour of delivered power, and a four-stroke petrol engine about 0.3 L. Multiply by the power actually used, not the rating.

**How do I convert litres per hour to gallons per hour?**
Divide by 3.785 for US gallons or by 4.546 for imperial gallons. 28 L/h is 7.4 US gal/h.

**Why does slowing down save so much fuel?**
If the power rises with the cube of speed, the fuel per mile rises with its square. Going 10 % slower then saves about 19 % per mile. Planing boats behave differently near the speed where they come onto the plane, so check with a flow meter.

**What is specific fuel consumption?**
The mass of fuel an engine burns for each kilowatt-hour of work. Modern small marine diesels use about 220 to 232 g/kWh at rated power, and more at light load.

**How much fuel reserve should I keep?**
Many skippers use the rule of thirds: a third of the fuel to go out, a third to come back and a third in reserve. Keep more when the weather or the next fuel stop is uncertain.

**Should I enter the power of one engine or both?**
Enter the total of all engines running. With twin 150 hp engines, the rated power is 300 hp.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — the ship version, in tonnes per day.
- [Hull speed calculator](../hull-speed/index.html) — the efficient speed of a displacement hull.
- [Planing boat speed calculator](../planing-speed/index.html) — the speed the power buys.
- [ETA calculator with time zones](../eta-time-zones/index.html) — arrival time for the trip.
