# Battery capacity and runtime calculator

**Summary:** Runtime of a battery bank under a constant load with Peukert correction, or the capacity for a target runtime; C-rate, usable energy, recharge Ah and time.

## Introduction

A 200 Ah battery does not deliver 200 Ah at any current: the faster you discharge it, the less you get, and you should not take all of it anyway if you want the battery to last. Emergency lighting, radio and GMDSS batteries, lifeboat starting batteries, UPS banks and the house bank of a small vessel are all sized with the same three corrections: the rate effect (Peukert's law), the depth of discharge chosen for cycle life, and derating for temperature and age. This calculator applies them to find the runtime of a given bank under a constant load, or the rated capacity needed for a target runtime, and adds the C-rate, energy, and the ampere-hours and time to recharge.

It is for marine and plant electricians, system designers and students; for critical installations the manufacturer's discharge tables and the applicable rules (SOLAS emergency sources, IEEE 485) take precedence.

## Formulas

Load current (DC, or AC through an inverter of efficiency η_inv):

    I = P / (η_inv V)

Peukert's law (capacity C rated over H hours, exponent k):

    t_empty = H (C_derated / (I H))^k,     C_derated = C × derating
    effective capacity = I t_empty
    runtime = DoD × t_empty
    Ah removed = I × runtime

Required rated capacity for a target runtime t_target:

    C = I H (t_target / (DoD H))^(1/k) / derating

Energy and recharge:

    E_nominal = V C,    E_usable = V × Ah removed
    Ah to recharge = Ah removed / η_charge,    t_recharge (bulk) = Ah to recharge / I_charger
    C-rate = I / C

Typical presets: flooded lead-acid k 1.25, DoD 50 %, charge efficiency 85 %; AGM k 1.12; gel k 1.15; LiFePO4 k 1.03, DoD 80 %, 97 %; NiCd k 1.10, DoD 80 %, 80 %.

## Assumptions and limitations

- Constant current at nominal voltage. Real loads draw more current as the voltage sags, and intermittent loads recover part of the rate loss, so treat the result as a planning figure.
- Peukert's law is an empirical fit for lead-acid at moderate rates. It overstates capacity at very low currents, is unreliable above about 1 C, and barely applies to lithium chemistries (k near 1). The exponent should come from the manufacturer's discharge tables when available.
- The capacity rating basis matters: most lead-acid batteries are rated at 20 h, stationary batteries at 10 h (IEC 60896), lithium at 1 h or 0.5 h. Enter the matching rated time.
- Depth of discharge is a life choice: 50 % for lead-acid roughly doubles the cycle life compared with 80 %; lithium tolerates 80–90 %.
- Derating is a single factor for temperature and ageing (lead-acid about −1 % per °C below 25 °C; end of life at 80 % of rated capacity, i.e. the IEEE 485 ageing factor 1.25).
- Recharge time covers the bulk phase only; lead-acid absorption tapering can double the real time, and the charge efficiency itself varies with state of charge.

## Worked example

House bank: 24 V, 200 Ah (C20) AGM, supplying a 1 000 W AC load through a 90 % efficient inverter; 40 A charger.

1. Load current: 1 000 / (0.9 × 24) = 46.3 A — a C-rate of 0.23, well above the rated 10 A (C/20).
2. Peukert (k = 1.12): time to empty 20 × (200 / (46.3 × 20))^1.12 = 3.59 h, i.e. an effective 166 Ah instead of 200 (17 % lost to the rate).
3. Runtime to 50 % DoD: 1.80 h, removing 83 Ah (2.0 kWh of the 4.8 kWh nominal).
4. Recharge: 83 / 0.90 = 92 Ah to put back, 2.3 h of bulk charging at 40 A plus the absorption phase.
5. For a 10 h runtime at the same load the bank would need 926 Ah rated capacity (20 h to empty at 46.3 A: at the rated rate Peukert's correction vanishes and C = I H).

The same bank in LiFePO4 (k 1.03, 80 % DoD) would run 3.3 h.

## FAQ

**Why does the battery deliver less than its rating?**
Internal resistance and diffusion limits: at high currents the active material near the plate surface is used up before the bulk can react, so the voltage reaches the cut-off earlier. Peukert's exponent captures this empirically.

**Should I size on C20 or C10?**
Use whatever rate the manufacturer rated the battery at, and enter that time. A C10 rating is about 8–10 % lower than the C20 rating of the same lead-acid battery.

**What depth of discharge should I plan for?**
Lead-acid: 50 % for daily cycling, up to 80 % for occasional emergency use. Lithium iron phosphate: 80–90 %. Deeper discharges shorten life roughly in proportion to the square of the depth for lead-acid.

**How do I size an emergency battery for class?**
Rules specify the loads and durations (for example 18 h or 36 h of emergency lighting). Use the capacity mode with the total load, the required hours, a conservative depth of discharge and the ageing factor, then check the manufacturer's discharge table at the resulting current.

**Does temperature matter?**
Yes: lead-acid capacity falls about 1 % per °C below 25 °C and the Peukert effect worsens in the cold; at 0 °C expect 20–25 % less. Hot batteries give slightly more capacity but age much faster.

**Why is the recharge time longer in practice?**
Lead-acid accepts the full charger current only up to about 80 % state of charge; the absorption phase at constant voltage with falling current can take as long again.

**Can I use this for a 12 V starting battery?**
Starting batteries are rated in cold-cranking amps, not Ah at a 20 h rate; their Peukert behaviour at hundreds of amps is outside this calculator.

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — AC loads to be supplied through the inverter.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — DC cables at these currents, where voltage drop governs.
- [Generator load, kVA and fuel](../generator-load/index.html) — the charger's supply and the alternative to battery storage.
- [Engineering unit converter](../unit-converter/index.html) — Wh, kWh and energy units.
