# Control valve Cv / Kv sizing calculator

**Summary:** Liquid control valve coefficient Kv and Cv to IEC 60534 with the choked-flow and cavitation check, valve opening and pipe velocity.

## Introduction

A control valve is specified by its flow coefficient: the cubic metres per hour of water it passes at one bar of pressure drop (Kv), or the US gallons per minute at one psi (Cv). For a liquid the required coefficient follows from the flow, the density and the pressure drop, with one complication: when the drop is large the pressure inside the valve falls to the vapour pressure, the flow chokes and cavitation begins, so the sizing drop is capped by the valve style's pressure recovery factor. This calculator applies the IEC 60534-2-1 liquid equations, flags near-cavitating and choked conditions, compares the required coefficient with the rated one for a sensible opening, and checks the pipe velocity.

It is for marine and process engineers sizing cooling-water, fuel and cargo control valves, for anyone checking why a valve cavitates, and for students of fluid control.

## Formulas

    Kv = Q √( (ρ/1000) / Δp_sizing )      Q m³/h, Δp bar;   Cv = 1.156 Kv
    F_F = 0.96 − 0.28 √(p_v / p_c)
    Δp_max = F_L² (p₁ − F_F p_v),   Δp_sizing = min(Δp, Δp_max)   (choked when Δp ≥ Δp_max)
    opening ≈ Kv_required / Kv_rated,   velocity = Q / (π D²/4)
    maximum flow of a rated valve at p₁: Q_max = Kv_rated √(Δp_max / (ρ/1000))

Typical F_L at full opening: single-seat globe 0.90, cage globe 0.85, eccentric plug 0.77, butterfly 60° 0.68, segmented ball 0.60, butterfly 90° 0.55.

## Assumptions and limitations

- Turbulent single-phase liquid, line-size valve (F_P = 1), no Reynolds correction; flashing (p₂ below p_v), gas and steam are outside this page.
- F_L values are typical; the manufacturer's value for the trim and opening governs.
- Incipient cavitation flagged at 70 % of the choked drop as a rule of thumb; manufacturers publish their own indices.

## Worked example

100 m³/h of cooling water (998 kg/m³, 20 °C) through a single-seat globe valve from 6 to 4 bar abs in a 100 mm line; candidate valve Kv 100.

1. Δp = 2 bar; F_F = 0.96 − 0.28 √(0.023/221.2) = 0.957; Δp_max = 0.9² × (6 − 0.957 × 0.023) = 4.84 bar: the drop is 41 % of the limit, no cavitation.
2. Kv = 100 √(0.998/2) = 70.6, Cv = 81.7.
3. Opening 71 % of the rated Kv 100: within the 60–80 % target; pipe velocity 3.5 m/s.

Throttling to 0.5 bar abs instead (Δp 5.5 bar) chokes the valve: it is sized on 4.84 bar (Kv 45.4, not 42.6), the Kv 100 valve cannot pass more than 220 m³/h at this inlet pressure, and anti-cavitation trim is needed. A 90° butterfly (F_L 0.55) would already be choked at the original 2 bar drop.

## FAQ

**Kv or Cv?**
Kv is the metric coefficient (m³/h, bar), Cv the US one (gpm, psi); Cv = 1.156 Kv. European datasheets quote Kv, most sizing software both.

**What is the pressure recovery factor?**
F_L describes how much of the pressure dip at the vena contracta is recovered downstream; low-recovery valves (globe) tolerate larger drops before choking than high-recovery ones (butterfly, ball).

**Why does the flow stop increasing when choked?**
The vena contracta pressure cannot fall below the vapour pressure, so the driving pressure inside the valve stops growing even if the outlet pressure falls further.

**Is cavitation the same as choking?**
Choking is the flow limit; cavitation damage and noise begin earlier, at 60–80 % of the choked drop depending on the trim, and continue through the choked regime.

**What opening should the valve work at?**
About 60–80 % at maximum flow and not below 10–20 % at minimum, so the controller has authority in both directions; the inherent characteristic sets the exact stem position.

**What about viscous fluids?**
Heavy fuel oil at low temperature can be laminar in small valves; IEC 60534-2-1 applies the Reynolds factor F_R, which this page does not include.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the pressure available at the valve.
- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — fixed restrictions.
- [Pump NPSH](../pump-npsh/index.html) — the same vapour-pressure physics on the suction side.
- [Water hammer](../water-hammer/index.html) — what fast valve closure does to the line.
- [Relief valve sizing (API 520)](../relief-valve-api520/index.html) — protecting the system the valve serves.
