# Fuel consumption and voyage cost calculator

**Summary:** Fuel burned, time at sea, bunker cost and CO₂ for a passage from distance, speed and engine power or daily consumption.

## Introduction

This calculator turns a planned passage into tonnes of fuel, dollars and CO₂. You give it the distance, the speed you intend to keep, and either the main-engine power with its specific fuel oil consumption (SFOC) or a daily consumption figure from noon reports or the ship's speed–consumption table. It adds auxiliary and port consumption, applies an optional weather margin, and prices the total at the bunker price.

It is used by masters and chief engineers planning bunkers, by operators and charterers estimating voyage costs, and by cadets learning how power, SFOC and time relate. It is also the first step of a CII estimate, because the CO₂ output uses the same IMO carbon factors as the CII rules.

## Formulas

Time at sea:

    t_sea [days] = D / (V × 24)

- D — voyage distance over ground, nautical miles (nmi)
- V — average speed over ground, knots (1 knot = 1 nmi/h)

Main-engine daily consumption from power (basis "Engine power × SFOC"):

    m_ME [t/day] = P × SFOC × 24 / 10⁶

- P — main-engine brake power actually developed on passage, kW
- SFOC — specific fuel oil consumption at that load, g/kWh

With a margin:

    m_ME,used = m_ME × (1 + M / 100)

- M — weather / fouling margin, %

Fuel quantities:

    F_ME  = m_ME,used × t_sea
    F_AUX = m_AUX × t_sea
    F_PORT = m_PORT × t_port
    F_total = F_ME + F_AUX + F_PORT

- m_AUX — auxiliary consumption at sea (generators, boiler), t/day
- m_PORT — consumption in port, t/day; t_port — time in port, days

Cost and emissions:

    Cost = F_total × price            [currency, price in currency/t]
    CO₂  = F_total × C_F              [t CO₂]
    Fuel per mile = (F_ME + F_AUX) × 1000 / D     [kg/nmi]

- C_F — carbon factor of the fuel, t CO₂ per t fuel (IMO MEPC.364(79) Table 1): HFO 3.114, VLSFO/LFO 3.151, MGO/MDO 3.206, LNG 2.750, LPG propane 3.000, LPG butane 3.030, methanol 1.375, ethanol 1.913.

## Assumptions and limitations

- Speed and power are treated as constant over the passage. Real voyages have speed changes, canal transits and port approaches; split the voyage into legs if those matter.
- The SFOC you enter must correspond to the power you enter. Shop-test SFOC is measured on a reference fuel of 42 700 kJ/kg lower calorific value (ISO 3046-1 convention); for a fuel with a different LCV multiply SFOC by 42 700 / LCV. Service SFOC is typically 3–6 % higher than shop test because of ambient conditions, wear and fuel quality.
- The margin is applied to main-engine fuel only. It stands in for weather, hull and propeller fouling and manoeuvring. Design practice uses 10–15 %; if you entered a daily figure from recent noon reports, use 0.
- Auxiliary and port consumption are flat daily rates; reefer cargo, cargo pumps, tank heating or inert gas generation can raise them a lot.
- CO₂ is tank-to-wake (combustion only), using the IMO factors. Well-to-wake factors are different and larger.
- Cost ignores port dues, canal fees, lubricating oil and hire. Price is in any single currency; there is no exchange-rate conversion.

## Worked example

A 3 000 nmi passage at 14 knots. The main engine develops 8 000 kW at 175 g/kWh. Auxiliaries burn 2.5 t/day. No margin, no port time, HFO at 550 $/t.

1. Time at sea: 3 000 / (14 × 24) = 8.929 days (214.3 h).
2. Main-engine daily consumption: 8 000 × 175 × 24 / 10⁶ = 33.6 t/day.
3. Main-engine fuel: 33.6 × 8.929 = 300.0 t.
4. Auxiliary fuel: 2.5 × 8.929 = 22.3 t.
5. Total fuel: 322.3 t.
6. Cost: 322.3 × 550 = 177 277 $.
7. Fuel per mile: 322.3 × 1000 / 3 000 = 107.4 kg/nmi; cost per mile 59.1 $/nmi.
8. CO₂: 322.3 × 3.114 = 1 003.7 t.

Adding a 10 % margin lifts the main-engine fuel to 330 t and the total to 352.3 t.

## FAQ

**What is SFOC and where do I get it?**
Specific fuel oil consumption is the fuel mass burned per unit of energy delivered at the crankshaft, in g/kWh. The shop-test record gives it at 25/50/75/85/100 % load on reference fuel. Service values come from the engine performance report or fuel-flow meters.

**Should I use MCR or the actual power?**
Actual brake power on passage. A 12 000 kW MCR engine running at 65 % load develops 7 800 kW, and that is what burns fuel.

**Why does speed matter so much?**
Power rises roughly with the cube of speed, so fuel per day rises with the cube while time falls only linearly. Fuel per voyage therefore rises roughly with the square of speed. Slowing from 14 to 12 knots saves about 25 % of the main-engine fuel for the same distance.

**Which fuel type should I pick for CO₂?**
The one actually burned. If a passage uses HFO at sea and MGO in ECAs or port, run the calculator twice or use a weighted factor.

**Does this give me the CII?**
Not directly. CII divides the CO₂ by capacity × distance over a calendar year. Use the CII rating estimator with the CO₂ figure from here.

**How accurate is the result?**
As accurate as the inputs. With a measured daily consumption and a realistic speed the voyage total is typically within ±5 %. With shop-test SFOC and no margin it will be optimistic by 10–15 %.

**Can I use long tons or imperial gallons?**
Yes. Every quantity has a unit dropdown; the calculation runs in metric and converts for display.

## Related calculators

- [CII rating estimator](../cii-rating/index.html) — turns the CO₂ figure into a carbon-intensity rating.
- [Propeller slip and speed through water](../propeller-slip/index.html) — check the speed assumption against engine revolutions.
- [Admiralty coefficient and speed–power scaling](../admiralty-coefficient/index.html) — estimate power at a different speed or draft.
- [Engineering unit converter](../unit-converter/index.html) — tonnes, long tons, knots, nautical miles.
