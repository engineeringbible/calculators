# Engine-room ventilation (ISO 8861) calculator

**Summary:** Combustion air and heat-removal airflow for an engine room from installed power and heat emissions, fan capacity and air changes.

## Introduction

An engine room needs air for two reasons: the engines and boilers burn it, and everything in the space gives off heat that has to be carried away before the room becomes unworkable. ISO 8861 turns this into a short calculation: combustion air from the installed power and a specific air consumption, heat-removal air from the total heat emission and a permitted 12.5 K temperature rise, with a credit for the heat that leaves with the engines' own combustion air, and a floor of one and a half times the combustion air. This calculator follows the standard clause by clause and adds the practical outputs a designer or a superintendent wants: air changes per hour, duty per supply fan, and the flow the casing or exhaust fans must pass.

It is for ship designers sizing fans and casings, superintendents checking why an engine room runs hot, and students of marine engineering.

## Formulas

Combustion air (ISO 8861 §5.2), ρ = 1.13 kg/m³ at 35 °C:

    q_dp = P_dp m_ad / ρ        main engines      (m_ad 0.0023 kg/(kW·s) 2-stroke, 0.0020 4-stroke)
    q_dg = P_dg m_ad / ρ        generator engines running at sea (not stand-by)
    q_b  = Q_b m_fs m_af / ρ    boilers           (0.11 kg fuel per kWh, 15.7 kg air per kg fuel)
    q_c  = q_dp + q_dg + q_b

Heat evacuation (§5.3 and §6), c = 1.01 kJ/(kg·K), ΔT = 12.5 K:

    Σφ = P_dp h_d/100 + P_dg h_d/100 + P_el (1/η − 1) + Q_b h_b/100 + φ_ep + φ_p + φ_el + φ_t + φ_o
    q_h = Σφ / (ρ c ΔT) − 0.4 (q_dp + q_dg) − q_b

Total (§5.1):

    Q = max( q_c + q_h ,  1.5 q_c )
    air changes/h = 3600 Q / V_room,   per fan = Q / n,   exhaust = Q − q_c

## Assumptions and limitations

- Simultaneous maximum continuous rating of all machinery at sea, 35 °C ambient, 70 % RH; equipment inside the casing and funnel excluded; separate spaces calculated separately.
- Heat-loss percentages are inputs (large two-strokes about 1–1.5 % of MCR, medium-speed engines 2–4 %, boilers about 1 %); the standard requires the manufacturers' data and provides guidance curves only as a fallback.
- The 0.4 credit assumes the usual arrangement of engine room and ducts; special arrangements call for a different factor.
- The boiler fuel rate 0.11 kg per kWh is this calculator's reading of the standard's note; enter the boiler's air consumption directly if known (it is normally small).
- Air changes per hour are informative only; ISO 8861 sets no air-change requirement.

## Worked example

A 10 MW two-stroke main engine, 3 MW of four-stroke generator engines running at sea (alternators 95 % efficient), a 2 MW oil-fired boiler, exhaust pipes 100 kW, steam pipes 30 kW, electrical 50 kW, hot tanks 20 kW, other 30 kW; engine room 15 000 m³ with four supply fans.

1. Combustion air: main 10 000 × 0.0023/1.13 = 20.35 m³/s; generators 3 000 × 0.0020/1.13 = 5.31; boiler 2 000 × 0.11/3600 × 15.7/1.13 = 0.85; q_c = 26.5 m³/s.
2. Heat: main 150 kW (1.5 %), generator engines 90 kW (3 %) plus alternator losses 2 850 × (1/0.95 − 1) = 150 kW, boiler 20 kW, others 230 kW; Σφ = 640 kW. Gross airflow 640/(1.13 × 1.01 × 12.5) = 44.9 m³/s.
3. Credits: 0.4 × (20.35 + 5.31) + 0.85 = 11.1 → q_h = 33.7 m³/s.
4. Total: q_c + q_h = 60.3 m³/s = 217 000 m³/h, above the 1.5 q_c floor of 39.8; governing. Air changes 14.5 per hour; 54 000 m³/h per fan; 33.7 m³/s leaves through the casing.
5. If the room were hotter than expected, the same arithmetic in reverse shows the temperature rise the installed fans allow.

## FAQ

**Why does the combustion air get a 0.4 credit?**
Engines draw their air from the room and send it up the stack already warmed, so part of the room's heat leaves with it; ISO 8861 counts 40 % of that air as effective heat removal for the usual duct layout.

**Why is there a 1.5 × q_c minimum?**
Even a cool, well-insulated plant needs a margin so that turbocharger intakes never starve the room and a draught remains for the crew.

**What heat-loss percentage should I use?**
The maker's project guide value for radiation and convection to the room, at MCR. Large two-strokes lose little (1–1.5 %); medium-speed engines, especially older ones, 2–4 %.

**Do I include the stand-by generator?**
No. ISO 8861 counts the generators running in the normal sea condition; the stand-by set is excluded.

**How many air changes should an engine room have?**
There is no rule; typical results from the ISO method are 15–30 per hour. Fewer than 10 usually means a heat source has been forgotten.

**Is the exhaust side the same flow?**
The exhaust (casing openings or extraction fans) passes Q − q_c; the rest leaves through the engines and boiler. Keep the room at slight over-pressure.

**What about tropical service above 35 °C?**
ISO 8861 fixes 35 °C; hotter ambient reduces the usable ΔT and the room will run above the design temperature unless more air is supplied.

## Related calculators

- [Generator load, kVA and fuel](../generator-load/index.html) — which generators run at sea and at what load.
- [Three-phase power and motor current](../three-phase-power/index.html) — fan motor sizing.
- [Pipe and tank insulation heat loss](../pipe-insulation/index.html) — the pipe and tank heat terms.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — coolers that remove heat before it reaches the room.
