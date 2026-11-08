# Solar PV array and storage sizing calculator

**Summary:** Array size from daily load, peak sun hours and system losses; battery storage for days of autonomy; charge controller current.

## Introduction

A stand-alone solar system has to collect each day, in the worst month, at least the energy its loads consume, and store enough to ride through the cloudy days in between. The sizing method used by the IEEE and Sandia guides is an energy balance: daily load divided by the peak sun hours of the design month and by the system losses gives the array power; daily load times days of autonomy divided by the depth of discharge gives the battery; the controller and inverter follow from the currents. This calculator applies it, picks the module count for the chosen string configuration, checks the string voltage in the cold, and tells you how fast the bank recovers after a dark spell.

It is for engineers and technicians specifying off-grid power for navigation aids, remote sensors, small vessels, cabins and telecom sites, and for students of renewable energy.

## Formulas

    P_array = E_day / (PSH × η_sys) × (1 + margin)
    modules = strings × N_series,   strings = ceil(P_array / (N_series P_module))
    E_yield = P_installed × PSH × η_sys
    V_oc,cold = N_series V_oc (1 + 0.003 (25 − T_min))  ≤ V_controller,max
    I_controller = P_installed / V_bat × 1.25   (MPPT)   or   strings × I_sc × 1.25   (PWM)
    C_bank = E_day × days / (DoD × η_inverter),   Ah = C_bank / V_bat,   usable = C_bank × DoD
    I_charge,avg = E_yield / PSH / V_bat,   recharge days = usable / (E_yield − E_day)
    P_inverter = P_peak × 1.25,   I_DC = P_peak / (η_inv V_bat)

Typical values: η_sys 0.70–0.80; DoD 50 % lead-acid, 80 % LiFePO4; autonomy 2–3 days (5+ for critical loads); PSH from the site's irradiation data for the array tilt.

## Assumptions and limitations

- One lumped system efficiency covers temperature, soiling, mismatch, wiring, controller, battery round-trip and inverter losses; the battery sizing divides by the inverter efficiency only, and the recharge estimate uses the surplus of yield over load without applying the losses again.
- The design month is the lowest-PSH month for the load; summer surplus is curtailed.
- Battery temperature derating, ageing and Peukert behaviour are not modelled beyond the user's margin; surge loads only through the peak load entered.
- Module data at STC; the V_oc temperature coefficient is a typical −0.3 %/K.

## Worked example

A cabin consuming 8.5 kWh/day with a 3 kW peak, design-month irradiation 4.8 kWh/m²/day, system efficiency 75 %, 400 W modules (V_oc 49 V, I_sc 10.5 A) in strings of two, 48 V LiFePO4 bank, 2 days of autonomy, inverter 92 %, controller limit 150 V, coldest module temperature −5 °C.

1. Array: 8 500/(4.8 × 0.75) = 2 361 W (the published example's 2.36 kW); strings of 800 W → 3 strings, 6 modules, 2.4 kW installed; yield 2.4 × 4.8 × 0.75 = 8.64 kWh/day, 102 % of the load.
2. String voltage at −5 °C: 2 × 49 × 1.09 = 107 V, within 150 V.
3. MPPT controller: 2 400/48 × 1.25 = 62.5 A (a PWM controller would need 3 × 10.5 × 1.25 = 39 A but waste the voltage headroom).
4. Battery: 8 500 × 2/(0.8 × 0.92) = 23.1 kWh = 481 Ah at 48 V, 18.5 kWh usable. Average charge current 37.5 A, 0.078 C.
5. Inverter 3.75 kW, 68 A DC at peak. At this 102 % balance only 140 Wh/day is left over after the load, so recharging the bank from 80 % DoD would take about 130 days; a 15 % margin (8 modules, 3.2 kW) brings it to 6 days and 50 % to 3 days, which is why an array margin or a backup generator is the practical choice.

## FAQ

**What are peak sun hours?**
The daily irradiation on the array plane expressed as hours at 1 000 W/m²: 4.8 kWh/m²/day equals 4.8 PSH. Use the design month's value at your tilt from PVGIS, NASA POWER or local data.

**Why 75 % efficiency?**
Hot modules (−10 to −15 %), soiling and mismatch (−5 %), wiring (−2 to −3 %), controller (−3 %), battery round trip (−5 to −15 %) and inverter (−8 %) multiply to roughly 0.70–0.80 for a battery system.

**How many days of autonomy?**
Two to three for non-critical loads in sunny climates, five or more for critical loads or cloudy winters; each day adds a full day's energy to the bank.

**Lead-acid or lithium?**
Lithium iron phosphate uses 80 % of its capacity with high efficiency and long cycle life at higher cost per kWh; lead-acid is cheaper per kWh but only half of it is usable and it must be recharged fully and often.

**MPPT or PWM controller?**
MPPT converts the array's higher voltage to the battery voltage and harvests 10–30 % more, especially in cold weather; PWM needs the array voltage matched to the battery and is sized by the array current.

**Why check the cold open-circuit voltage?**
Module voltage rises as temperature falls; the string must stay below the controller's maximum input voltage on the coldest clear morning, or the controller is destroyed.

**Why does recharge take so long?**
In the design month the array barely covers the load, so only the surplus recharges the bank; a margin on the array or a backup generator shortens the recovery after a dark spell.

## Related calculators

- [Battery capacity and runtime](../battery-runtime/index.html) — discharge-side Peukert check of the bank.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — DC cabling at these currents.
- [Lighting design (lumen method)](../lighting-lumen/index.html) — one of the loads.
- [Generator load, kVA and fuel](../generator-load/index.html) — the backup source.
