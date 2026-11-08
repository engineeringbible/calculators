# Transformer size calculator (kVA)

**Summary:** Transformer kVA size from the load, power factor and growth, the next IEC or ANSI standard rating, rated currents, voltage regulation and losses.

## Introduction

What size transformer does a load need? Divide the load in kW by its power factor to get kVA, add an allowance for growth, divide by the loading you are willing to run at, and choose the next standard rating. A 100 kW load at a power factor of 0.8 is 125 kVA; with 20 % growth and 80 % maximum loading it needs 187.5 kVA, so a 200 kVA unit in IEC sizes or 225 kVA in US sizes.

Choosing a distribution transformer is a few lines of arithmetic that are easy to get wrong in the details: the load must be converted to apparent power at its power factor, allowed to grow, and kept below the loading the owner accepts; the unit then has to hold its secondary voltage under load and not waste too much energy in iron and copper. This calculator sizes the transformer to the IEC 60076 preferred ratings or the ANSI/IEEE C57.12 standard ratings used in North America (or checks a given one), splits the impedance voltage into its resistive and reactive parts from the nameplate losses, computes the voltage regulation and the secondary voltage at the actual load and power factor, the losses and efficiency with the maximum-efficiency point, the annual energy loss and the secondary short-circuit current.

It is for electrical engineers specifying shore-connection, shipyard and industrial transformers, for operators checking an existing unit against a new load, and for students.

## Formulas

    S = P / cos φ,   S_req = S (1 + g) / k_load   → next standard rating S_r (IEC R10: 25 … 5 000 kVA; ANSI: 15 … 10 000 kVA)
    I_HV = S_r/(√3 U_HV),   I_LV = S_r/(√3 U_LV),   x = S/S_r
    u_r = P_k / S_r,   u_x = √(u_k² − u_r²)
    ε = x (u_r cos φ + u_x sin φ) + x² (u_x cos φ − u_r sin φ)² / 2    (per unit; sin φ > 0 lagging)
    U_LV,load = U_LV (1 − ε)
    P_loss = P_0 + x² P_k,   η = P/(P + P_loss),   x_η,max = √(P_0/P_k)
    I_sc ≈ I_LV / u_k

## Assumptions and limitations

- Three-phase two-winding transformer at nominal tap, ONAN; diversity already in the load; no cyclic overload credit (IEC 60076-7).
- Regulation by the standard second-order approximation; the no-load secondary voltage is the rated value.
- Nameplate losses as entered; Ecodesign Tier 2 units have much lower losses than older ones.
- Harmonics (K-factor), altitude and ambient derating, parallel operation and tap ranges are not covered; the short-circuit current is the transformer-only estimate (see the IEC 60909 calculator).

## Worked example

A 400 V switchboard with 800 kW of load at power factor 0.8 lagging, 20 % growth expected, transformers to be loaded at most 80 %; candidate unit 11/0.4 kV, u_k 6 %, P_0 1.1 kW, P_k 10.5 kW.

1. S = 800/0.8 = 1 000 kVA; S_req = 1 000 × 1.2/0.8 = 1 500 kVA → preferred 1 600 kVA (62.5 % loaded now, 75 % after growth).
2. Checking an existing 1 000 kVA unit at the present load (x = 1): u_r = 10.5/1 000 = 1.05 %, u_x = √(6² − 1.05²) = 5.91 %.
3. Regulation ε = 1.05 × 0.8 + 5.91 × 0.6 + (5.91 × 0.8 − 1.05 × 0.6)²/200 = 4.47 % → secondary 382 V at full load.
4. Losses 1.1 + 10.5 = 11.6 kW, efficiency 800/811.6 = 98.6 %; the unit is most efficient at √(1.1/10.5) = 32 % load; 69.6 MWh lost per year at 6 000 h.
5. Rated currents 52.5 A HV and 1 443 A LV; secondary short-circuit current about 1 443/0.06 = 24 kA; inrush 12–17 kA for the first cycles.

With the 20 % growth the 1 000 kVA unit would run at 120 %: the calculator flags it and names 1 250 kVA as the next rating.

## FAQ

**What size transformer do I need for 100 kW?**
At a power factor of 0.8, 100 kW is 125 kVA. With 20 % growth and a maximum loading of 80 %, the requirement is 187.5 kVA: a 200 kVA transformer in IEC sizes, or 225 kVA in ANSI sizes.

**What are the standard transformer sizes?**
IEC 60076 uses the R10 series: 25, 50, 63, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1 000, 1 250, 1 600, 2 000, 2 500 kVA and up. US three-phase units follow IEEE C57.12.00: 15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1 000, 1 500, 2 000, 2 500 kVA and up.

**Why size on kVA and not kW?**
The transformer's limit is current (heating), which depends on apparent power; a poor power factor needs a bigger unit for the same kW.

**What loading should I allow?**
80 % is common for growth and reliability; IEC 60076-7 permits planned overloads with loss of life, and redundant pairs are often sized so each carries the full load at 100 %.

**What does the impedance voltage tell me?**
Two things: the voltage drop under load (regulation) and the short-circuit current (I_r/u_k). Low u_k means stiff voltage but high fault current, and vice versa.

**Why is regulation worse at low power factor?**
The reactive part of the impedance voltage adds in phase with the current's reactive component; at unity power factor only u_r matters and the drop is small.

**When is efficiency highest?**
When copper losses equal iron losses, at the load fraction √(P_0/P_k); transformers that run lightly loaded most of the time should have low no-load losses (Ecodesign AAA0 cores).

**How do I get the real fault current?**
Use the short-circuit calculator, which adds the network and cable impedances, the voltage factor and the K_T correction of IEC 60909.

## Related calculators

- [Short-circuit current (IEC 60909)](../short-circuit-current/index.html) — fault levels with network, transformer and cables.
- [Three-phase power and motor current](../three-phase-power/index.html) — the loads that make up P and cos φ.
- [Generator load, kVA and fuel](../generator-load/index.html) — the generating side of the same plant.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the feeders downstream of the transformer.
