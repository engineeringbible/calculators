# Initial stability GM and list calculator

**Summary:** GM from KM and KG with free-surface correction, list from a weight shift, loading or discharge, rolling period and the IMO minimum-GM check.

## Introduction

The metacentric height GM is the first number any officer checks before moving weight on a ship: it says whether the ship will return upright after a small heel and how fast she will roll. Slack tanks reduce it through the free-surface effect, loading high weights reduces it, and any weight off the centreline produces a list that GM alone determines at small angles. This calculator does that initial-stability arithmetic: solid GM from KM and KG, the free-surface correction from the tank tables or a single rectangular tank, the final GM and list after shifting, loading or discharging a weight, the rolling period from the IMO weather-criterion formula, and the IMO minimum-GM check.

It is for deck officers planning cargo and ballast operations, surveyors checking a loading condition, and cadets working the classic stability problems. It covers initial stability only; large-angle stability needs the GZ curve.

## Formulas

Metacentric height and free surface:

    GM_solid = KM − KG
    FSM      = Σ (l b³ / 12) × ρ_liquid / n²        free surface moment of a rectangular slack tank, t·m
    FSC      = FSM / Δ                               free surface correction (virtual rise of G), m
    GM_fluid = GM_solid − FSC

Weight operations (w tonnes, Kg its height above keel, d its transverse distance from the centreline, + starboard):

    Shift:      KG′ = KG + w × d_vertical / Δ,          heeling moment = w × d,       Δ′ = Δ
    Load:       KG′ = (Δ KG + w Kg) / (Δ + w),          heeling moment = w × d,       Δ′ = Δ + w
    Discharge:  KG′ = (Δ KG − w Kg) / (Δ − w),          heeling moment = −w × d,      Δ′ = Δ − w
    GM′_fluid = KM − KG′ − FSM / Δ′

List:

    tan θ = heeling moment / (Δ′ × GM′_fluid)

Rolling period (IMO 2008 IS Code weather criterion):

    C = 0.373 + 0.023 (B/d) − 0.043 (L_wl / 100)
    T = 2 C B / √GM_fluid

IMO minimum: GM_fluid ≥ 0.15 m (2008 IS Code Part A 2.2.4).

- KM — height of the transverse metacentre above keel at the present draft (hydrostatic tables)
- KG — height of the centre of gravity above keel (loading computer / stability booklet)
- l, b — length and breadth of the free liquid surface; n — number of equal longitudinal subdivisions

## Assumptions and limitations

- Small-angle (initial) stability: valid for list angles up to about 10°. The calculator warns beyond that; use the GZ curve from the cross curves for the real angle.
- KM is held constant through loading and discharge. For weights above about 2 % of displacement re-enter KM at the new draft.
- Free surface moments are for rectangular tank surfaces (or taken from the tank tables as a total); they are independent of the liquid depth as long as the tank is slack, and they vanish when the tank is pressed up or empty.
- No wind, grain or icing heeling moments; no dynamic effects.
- The rolling period is an IMO estimate for conventional hull forms; the actual period depends on the radius of gyration of the loaded ship.
- Only the 0.15 m GM criterion is checked; the IS Code also requires minimum areas under the GZ curve, a minimum GZ of 0.20 m at 30° and the weather criterion.

## Worked example

Bulk carrier: Δ = 47 232 t, KM = 12.50 m, KG = 11.00 m, total free surface moment 1 500 t·m. A 200 t weight is shifted 10 m to starboard on the same deck.

1. Solid GM: 12.50 − 11.00 = 1.50 m.
2. Free surface correction: 1 500 / 47 232 = 0.032 m → fluid GM 1.468 m.
3. Heeling moment: 200 × 10 = 2 000 t·m.
4. List: tan θ = 2 000 / (47 232 × 1.468) = 0.0288 → θ = 1.65° to starboard.
5. Rolling period: C = 0.373 + 0.023 × 3.2 − 0.043 × 1.8 = 0.369; T = 2 × 0.369 × 32 / √1.468 = 19.5 s — a moderate roll.
6. IMO: 1.468 m ≥ 0.15 m, acceptable.

If instead 500 t is loaded at Kg 15 m, 8 m to starboard: Δ′ = 47 732 t, KG′ = (47 232 × 11 + 500 × 15) / 47 732 = 11.042 m, GM′_fluid = 12.50 − 11.042 − 1 500 / 47 732 = 1.427 m, list = atan(4 000 / (47 732 × 1.427)) = 3.36° to starboard.

## FAQ

**Why does a slack tank reduce GM when the liquid weight has not moved?**
As the ship heels the liquid flows to the low side, moving its centre of gravity and reducing the righting moment exactly as if G had risen by FSM/Δ. The effect depends on the breadth cubed, which is why longitudinal subdivision of wide tanks matters so much.

**Does it matter how full the slack tank is?**
Not for the free-surface moment itself (as long as the surface is free), only for the liquid's own weight and KG. Pressing up or emptying removes the effect entirely.

**What GM should a ship have?**
At least 0.15 m by the IS Code, but practical values are 0.5–3 m depending on the ship; too much GM gives a stiff, violent roll that damages cargo and fatigues the crew, too little gives a tender ship with a long roll and small margins.

**My list came out negative. What does that mean?**
A list to port. Transverse distances are positive to starboard, so discharging a weight from the starboard side (negative heeling moment) lists the ship to port.

**Can I use this to correct a list?**
Yes: the heeling moment needed to bring the ship upright equals the existing one with the opposite sign; divide by the available transverse distance to get the weight to transfer, remembering that the free surface of the ballast being moved also changes GM.

**What is the difference between list and loll?**
A list is caused by an off-centre weight with positive GM. Loll is the angle a ship with negative GM takes up until the GZ becomes positive again; it is corrected by lowering G, not by transferring weight, and the calculator refuses to compute a list when GM is negative.

**Why does the rolling period need L, B and d?**
The IS Code formula estimates the radius of gyration from the hull proportions through the coefficient C. A simpler rule, T ≈ 0.8 B / √GM, gives similar numbers.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — displacement and KM-related hydrostatics at the draft.
- [Draft survey](../draft-survey/index.html) — the displacement of the actual condition.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — fuel masses that change KG and free surface.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — the other draft-related check before sailing.
