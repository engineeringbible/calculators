# Compressed air calculator: leaks, receiver, pipe drop and power

**Summary:** Compressed air leak flow and yearly cost, receiver tank size, air main pressure drop and compressor power, isothermal and adiabatic.

## Introduction

Compressed air is one of the most expensive forms of energy in a plant, and leaks often waste 20 to 30 % of a compressor's output. A single 1/4 inch hole at 100 psig blows away 104 cfm of free air, which costs about $16 800 a year at 10 cents per kWh.

This calculator handles four everyday tasks. It gives the leak flow through a hole and its yearly energy and cost. It sizes a receiver tank for a demand event. It finds the pressure drop in an air main by the Darcy equation and by the Atlas Copco formula. It estimates compressor power, isothermal and adiabatic, with one to four stages. It is for maintenance and energy engineers and plant managers.

## Formulas

Leak through a hole, choked when the absolute pressure is above 1.89 times atmospheric (about 13 psig):

    ṁ = Cd × A × p0 × √(γ / (R T)) × (2 / (γ + 1))^((γ + 1) / (2(γ − 1))) = 0.6847 Cd A p0 / √(R T)
    Q_free = ṁ / ρ_atm,   P_wasted = Q_free × specific power

Receiver for a demand event (US DOE MEASUR, Compressed Air Challenge):

    V = t × (Q_demand − Q_supply) × p_atm / (p1 − p2)

Pipe pressure drop, isothermal Darcy and the Atlas Copco empirical form:

    p1² − p2² = (ṁ / A)² R T × [f L / D + 2 ln(p1 / p2)]
    Δp = 450 × qc^1.85 × L / (d⁵ × p)      (bar, L/s free air, m, mm, bar absolute)

Compressor power for n intercooled stages:

    W_iso = p_a V × ln r
    W_ad = n × γ / (γ − 1) × p_a V × (r^((γ − 1) / (n γ)) − 1),   P_shaft = W_ad / η

- A, d — hole area and diameter; Cd — coefficient of flow; p0 — absolute pressure upstream
- R = 287.05 J/(kg·K), γ = 1.4 for air; T — air temperature in kelvin
- Q, V — free air flow and volume at atmospheric pressure p_a; r — absolute pressure ratio
- p1, p2 — upper and lower pressures; t — event duration; f — Darcy friction factor

## Assumptions and limitations

- All flows are free air delivery: the volume at the atmospheric pressure and temperature entered. Compressor ratings use the same basis.
- A leak is modelled as a round hole. A coefficient of 1 reproduces the published leak tables, and the US DOE multiplies by 0.61 for sharp-edged holes. Real leaks in fittings and hoses vary, so treat the result as an estimate.
- The leak cost assumes the compressor power falls in proportion when the leaks are fixed. That holds only with good control, such as a variable-speed compressor or proper sequencing.
- The pipe drop needs fittings added as equivalent length. Atlas Copco recommends no more than 0.1 bar (1.5 psi) from the compressor to the farthest user.

## Worked example

A plant runs at 100 psig all year. Ultrasonic testing finds a leak equivalent to a 1/4 inch hole. The ambient is 14.696 psia and 68 °F. The compressors use 18.4 kW per 100 cfm, and power costs $0.10 per kWh.

1. Upstream pressure: 100 + 14.7 = 114.7 psia, or 790.8 kPa. That is 7.8 times atmospheric, so the flow is choked.
2. Hole area: π / 4 × 6.35² = 31.67 mm².
3. Mass flow: 0.6847 × 31.67 × 10⁻⁶ × 790 800 / √(287.05 × 293.15) = 0.0591 kg/s.
4. Free air: 0.0591 / 1.204 = 0.0491 m³/s, or 104.0 cfm.
5. Compressor power: 104.0 / 100 × 18.4 = 19.1 kW.
6. Energy: 19.1 × 8 760 h = 167 700 kWh a year, which costs $16 767.

The CAGI fact sheet prints $16 764 for the same leak. Fixing it pays back in days.

## FAQ

**How much does a compressed air leak cost?**
Multiply the leak flow by the compressor specific power, the running hours and the electricity price. A 1/8 inch hole at 100 psig wastes 26 cfm, about $4 190 a year running constantly at 18.4 kW per 100 cfm and 10 cents per kWh.

**How do I measure total leakage?**
With no production running, time how long the compressor loads (T) and unloads (t). Leakage in percent of capacity is 100 × T / (T + t); CAGI says a well-kept system stays below 10 %.

**What is the specific power of a compressor?**
The electrical power per unit of free air delivered. Typical plants run at about 18 kW per 100 cfm, or 6.4 kW per m³/min.

**How big should my air receiver be?**
Big enough to supply the peak demand above the compressor output while the pressure falls to the lowest acceptable value. 100 cfm for one minute with a 10 psi drop needs 147 ft³, about 1 100 US gallons.

**Does lowering the system pressure reduce leaks?**
Yes. A choked leak flows in proportion to the absolute pressure, so dropping from 100 to 90 psig cuts leakage by about 9 %.

**What is the difference between isothermal and adiabatic power?**
Isothermal power is the ideal minimum with the air kept at inlet temperature. Adiabatic power assumes no cooling during compression and is the usual reference for real compressors. Intercooled stages bring it closer to isothermal.

## Related calculators

- [Ideal gas law](../ideal-gas-law/index.html) — the volume of air at another pressure or temperature.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — friction in liquid lines.
- [Electricity cost](../electricity-cost/index.html) — the running cost of the compressor.
- [Nozzle flow](../nozzle-flow/index.html) — water flow through a nozzle or orifice.
