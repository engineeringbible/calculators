# Cathodic protection anodes calculator

**Summary:** Sacrificial anode mass, number and life for a hull or tank from surface area, coating breakdown and current density (DNV-RP-B401).

## Introduction

Steel in seawater corrodes unless its potential is pulled below about −0.80 V (Ag/AgCl). Sacrificial anodes of zinc or aluminium alloy do that by corroding instead, and designing them is a bookkeeping exercise: how much current the structure draws over its life (area × current density × coating breakdown), how much charge each kilogram of anode can supply (its electrochemical capacity, discounted by a utilisation factor), and whether the anodes can push that current through the water (their resistance). DNV-RP-B401 is the reference method for offshore structures; ship hulls use the same arithmetic with class-rule current densities per area. This calculator does both.

It is for naval architects and superintendents sizing hull anodes for a docking interval, offshore and port engineers protecting structures and tanks, and students of marine corrosion.

## Formulas

Current demand (A), with coating breakdown f_c:

    I_ci = A i_ci f_ci     I_cm = A i_cm f_cm     I_cf = A i_cf f_cf
    f_ci = a,   f_cm = a + b t_f / 2,   f_cf = a + b t_f   (≤ 1; bare steel f_c = 1)

Anode mass, count and life:

    Q = I_cm × t_f × 8760  [Ah]       M = Q / (u ε)       N = ceil(M / m_anode)
    life = N m_anode u ε / (I_cm × 8760)

Anode current output (initial, new anode):

    I_a = (E_c − E_a) / R_a,   E_c = −0.80 V
    long slender stand-off (L ≥ 4r):  R_a = ρ/(2πL) [ln(4L/r) − 1],  r = periphery / 2π
    short slender stand-off:          R_a = ρ/(2πL) [ln(2L/r (1 + √(1 + (r/2L)²))) + r/2L − √(1 + (r/2L)²)]
    long flush-mounted:               R_a = ρ / (2S),  S = (length + width)/2
    short flush, bracelet, hull:      R_a = 0.315 ρ / √A_exposed
    check: N I_a ≥ I_ci and I_cf

RP-B401 data (2021): bare-steel mean current density 0.070 (tropical) to 0.120 A/m² (arctic) at 0–30 m, with initial/final values per Table 8-1; coating constants a = 0.10/0.05/0.02/0.02 and b = 0.10/0.025/0.012/0.008 per year for categories I–IV at 0–30 m (b = 0.05/0.015/0.008/0.005 below 30 m); Al-Zn-In 2 000 Ah/kg at −1.05 V, zinc 780 Ah/kg at −1.03 V; utilisation 0.90 long stand-off, 0.85 short stand-off and long flush, 0.80 bracelet/flush.

Ship hulls: coated hull 10–20 mA/m² (+5 mA/m² for dockings beyond 30 months), bonded propeller about 500 mA/m², uncoated steel 100–150 mA/m²; design life = docking interval.

## Assumptions and limitations

- Inventory calculation, not a layout: anode distribution, current drain to chains, wells or reinforcement, stray currents and ICCP interaction are outside the scope.
- The final output check uses the new-anode resistance; RP-B401 requires the resistance of the anode consumed to its utilisation factor, which is higher. Treat the final check as indicative.
- Table values are for open-sea, average-flow, uncoated steel at the stated temperatures; capacities drop in sediments and at high temperature.
- Hull current densities are typical class-practice values entered by the user; the actual class table (DNV-CG-0288, ABS) governs.

## Worked example

A 6 000 m² coated hull with a bonded 40 m² propeller and 50 m² of uncoated appendages, docking every 2.5 years, protected with 20 kg zinc hull anodes in 0.25 Ω·m water.

1. Current demand: 6 000 × 0.015 + 40 × 0.5 + 50 × 0.12 = 90 + 20 + 6 = 116 A (the propeller alone draws a sixth of it).
2. Charge over 2.5 years: 116 × 2.5 × 8 760 = 2.54 MAh. Zinc at 780 Ah/kg and u = 0.80: M = 2.54 × 10⁶ / 624 = 4 070 kg → 204 anodes of 20 kg, 3.4 per 100 m².
3. Output: a 0.6 × 0.15 m hull anode has R_a = 0.315 × 0.25/√0.09 = 0.26 Ω and delivers (−0.80 + 1.03)/0.26 = 0.88 A; 204 anodes give 179 A, above the 116 A demand.
4. With a 3-year docking interval the hull density becomes 20 mA/m², the demand 146 A and the mass 6 150 kg.

Offshore check (RP-B401): 1 000 m² of category II coated steel in temperate water at 0–30 m for 25 years: f_cm = 0.05 + 0.025 × 12.5 = 0.36, I_cm = 1 000 × 0.100 × 0.36 = 36 A, mass 4 410 kg of aluminium at u 0.90; but the final demand is 1 000 × 0.130 × 0.675 = 88 A, so fifteen 300 kg stand-off anodes (3.1 A each) are too few by output and 29 are needed: output, not mass, governs.

## FAQ

**Zinc or aluminium?**
Aluminium alloy gives 2.5 times the charge per kilogram and is standard offshore and on most hulls; zinc is used in ballast tanks (no spark risk) and where aluminium alloys may passivate (low salinity, buried).

**Why does the coating matter so much?**
A sound coating cuts the current demand to a few per cent of bare steel; the design life then depends on how fast it breaks down. Category III/IV systems halve the anode mass compared with a thin primer.

**What is the utilisation factor?**
The fraction of the anode mass that can be consumed before the anode stops working (core exposed, output too low): 0.90 for long slender anodes down to 0.80 for bracelets and hull anodes.

**My mass is enough but the output check fails.**
Large anodes have low resistance per anode but there are few of them; the peak (initial or final) demand needs more or longer anodes. Count can be governed by current, not by mass, exactly as in the offshore example.

**How do I use this for a ballast tank?**
Offshore mode with the appropriate current density (tanks are often treated as temperate, 0–30 m) and coating category; design life equals the special survey interval; aluminium is restricted in tanks adjacent to cargo tanks by SOLAS.

**Does the propeller really need 500 mA/m²?**
A bonded bronze propeller is a large bare cathode; if it is earthed to the hull through a slip ring it draws roughly that. If it is not bonded it is unprotected and does not load the anodes.

**What about ICCP?**
Impressed-current systems replace hull anodes; the current demand calculation is the same, but the output comes from a rectifier and the design is a different document.

## Related calculators

- [Paint coverage and quantity](../paint-coverage/index.html) — the coating whose breakdown sets the demand.
- [Hydrostatics basics](../hydrostatics/index.html) — wetted surface area of the hull.
- [Tank volume and partial fill](../tank-volume/index.html) — tank surface and volume.
- [Thin-wall pressure vessel](../pressure-vessel/index.html) — the steel being protected.
