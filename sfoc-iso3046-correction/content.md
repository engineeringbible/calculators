# Engine power and SFOC to ISO 3046 conditions calculator

**Summary:** ISO 3046-1 power adjustment factor α and fuel consumption factor β between reference and site ambient conditions, with the fuel LCV correction.

## Introduction

Engine makers declare power and fuel consumption at the ISO reference conditions: 100 kPa, 25 °C air, 30 % humidity and 25 °C charge-air coolant. An engine room in the tropics offers 45 °C air and 36 °C cooling water, and the engine can neither make the declared power nor burn fuel at the declared rate. ISO 3046-1 gives the standard way to move between the two: a ratio of indicated power built from the pressure, temperature and coolant ratios with exponents that depend on the engine type, a power adjustment factor that allows for the friction power which does not scale, and the fuel consumption factor β = k/α. This calculator applies it for the eight formula references with recommended values and adds the calorific-value scaling that every shop-test comparison needs.

It is for marine and power-plant engineers comparing shop tests with site performance, performance analysts normalising SFOC data, and students of internal combustion engines.

## Formulas

    k = [(p_x − a φ_x p_sx)/(p_r − a φ_r p_sr)]^m (T_r/T_x)^n (T_cr/T_cx)^s     ISO 3046-1 (3), T in K
    α = k − 0.7 (1 − k)(1/η_m − 1),   P_x = α P_r                                 (2), (1)
    β = k/α,   b_x = β b_r                                                         clause 10.4
    b_fuel = b_x × 42 700 / LCV                                                     equal energy per kWh

Table 2 (a, m, n, s): A 1, 1, 0.75, 0 · B 0, 1, 1, 0 · C 0, 0.7, 2, 0 · D 0, 0.7, 1.2, 1 · F and J 0, 0.57, 0.55, 1.75 · G 0, 0.7, 1.2, 1 · I 1, 0.86, 0.55, 0. Reference conditions: 100 kPa, 298 K, 30 %, 298 K.

## Assumptions and limitations

- Guideline factors (Table 2 note 2); the manufacturer may declare its own, and low-speed two-stroke engines (E, H) have none.
- β = k/α is the ISO default; electronically controlled engines may behave differently.
- Humidity matters only where a = 1 (A, I); the Magnus vapour pressure is used.
- η_m at the declared power, 0.8 when none is declared; s = 0 when the charge air is jacket-water cooled.

## Worked example

A medium-speed four-stroke diesel (reference D) declared at 10 000 kW and 175 g/kWh, mechanical efficiency 0.8, operating at 100 kPa, 45 °C engine-room air and 36 °C charge-air coolant.

1. k = (298.15/318.15)^1.2 × (298.15/309.15)^1 = 0.9250 × 0.9644 = 0.8921.
2. α = 0.8921 − 0.7 × 0.1079 × 0.25 = 0.8733 → 8 733 kW available, 12.7 % less.
3. β = 0.8921/0.8733 = 1.0216 → 178.8 g/kWh, 2.2 % more fuel per kWh.
4. Burning a 40 500 kJ/kg residual fuel instead of the 42 700 kJ/kg reference: 178.8 × 42 700/40 500 = 188.5 g/kWh, i.e. 1 646 kg/h at the site power.

For a non-turbocharged engine (reference A) the humidity enters: at 60 % humidity and 45 °C the dry-air pressure is 94.2 kPa against 99.0 kPa at reference, which alone costs 5 % of power.

## FAQ

**Why does the power fall more than the indicated power?**
Friction does not shrink with the air density, so the brake power loses a larger share: that is what the 0.7(1 − k)(1/η_m − 1) term represents.

**Which formula reference is my engine?**
The manufacturer states it; D (turbocharged, charge-air cooled, medium speed) is the common marine four-stroke case; for two-stroke main engines use the maker's own derating curves.

**Why does the SFOC rise?**
The fuel per indicated kWh stays the same while the brake kWh fall, so fuel per brake kWh rises by k/α.

**What are the reference conditions?**
ISO 15550: 100 kPa total pressure, 298 K air, 30 % relative humidity, 298 K charge-air coolant. Manufacturers may declare substitute conditions; enter them in the reference fields.

**How does this relate to ISO 19030?**
Performance monitoring compares service SFOC with the shop test; both must be on the same fuel energy basis, which the 42 700 kJ/kg scaling provides.

**Why is humidity ignored for turbocharged engines?**
The standard sets a = 0 for them: the charge air cooler and turbocharger largely compensate; the effect exists but is small.

## Related calculators

- [Generator load, kVA and fuel](../generator-load/index.html) — the loads this power serves.
- [Engine BMEP, torque and power](../engine-bmep/index.html) — the mechanical side of the same engine.
- [Fuel net specific energy and CO₂ factor](../fuel-lcv-co2/index.html) — the LCV from the bunker delivery note.
- [Engine room ventilation (ISO 8861)](../engine-room-ventilation/index.html) — the air that sets T_x.
- [Fuel and voyage cost](../fuel-voyage-cost/index.html) — consumption at sea.
