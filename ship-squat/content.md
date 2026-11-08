# Ship squat and under-keel clearance calculator

**Summary:** Barrass squat in open water and confined channels, Froude depth number, net under-keel clearance against a required margin and the maximum safe speed.

## Introduction

A ship moving through shallow water sinks bodily and changes trim because the water accelerating under and around the hull drops in pressure. This squat can take a metre or more off the under-keel clearance at normal harbour-approach speeds, and it grows with the square of speed, so slowing down is the only immediate remedy. Groundings in channels and river approaches are regularly traced to underestimated squat.

This calculator applies the Barrass method, the one most widely taught to masters and pilots: the general formula with blockage factor and width of influence, and the simplified open-water and confined-channel rules for comparison. It then does the under-keel clearance bookkeeping: charted depth plus tide, minus static draft, minus squat, minus allowances for swell, heel and uncertainty, compared with the required margin, and it inverts the formula to give the maximum speed that keeps that margin.

## Formulas

Blockage factor and width of influence:

    Open water:      F_B = 7.7 + 20 (1 − C_B)²,   W_eff = F_B × B,   S = T / (F_B h)
    Confined:        W_eff = W (channel width at the bed),             S = B T / (W h)

Barrass general squat (metres, V in knots through the water):

    S_max = C_B × S^0.81 × V^2.08 / 20

Simplified rules (h/T 1.1–1.4):

    Open water:   S_max ≈ C_B V² / 100
    Confined:     S_max ≈ C_B S^(2/3) V^2.08 / 20

Where the squat occurs: by the bow for C_B > 0.70, by the stern for C_B < 0.70, bodily for C_B ≈ 0.70.

Froude depth number:

    F_nh = V / √(g h)        (V in m/s)

Under-keel clearance:

    UKC_static = h − T
    UKC_net    = h − T − S_max − allowances
    UKC_req    = (required % / 100) × T
    Margin     = UKC_net − UKC_req
    V_max      = [ 20 (h − T − allowances − UKC_req) / (C_B S^0.81) ]^(1/2.08)

- C_B — block coefficient at the actual draft; B — beam; T — static draft; h — water depth (charted depth + height of tide); W — channel width; g = 9.80665 m/s²

## Assumptions and limitations

- Empirical formula derived for 1.1 ≤ h/T ≤ 1.4; for deeper water it overestimates and for shallower water the ship is already nearly aground. Outside the range the calculator warns.
- Rectangular channel; bank slopes, a midship-section coefficient below 1 and dredged-channel shoulders are not modelled. For a trapezoidal channel use the width at about mid-draft.
- Speed through the water. A following current increases speed over ground without increasing squat; a head current the reverse.
- Even static trim is assumed. Squat is given as the maximum sinkage at the relevant end; a trimmed ship or one with a large static trim may behave differently.
- Not valid near the critical speed (F_nh → 1), where squat grows steeply and the ship may become uncontrollable; the calculator warns above F_nh = 0.7.
- Wave response (heave, pitch, roll in swell) is not calculated; include it in the allowances. PIANC recommends a separate wave allowance in exposed approaches.
- Ship-to-ship interaction when passing or overtaking, and bank suction, are separate phenomena not included.

## Worked example

Bulk carrier, C_B 0.80, beam 32 m, draft 10.0 m, in open water with 12.0 m depth (charted depth plus tide), 10 knots through the water. Allowances 0.5 m, required clearance 10 % of draft.

1. h/T = 1.20, inside the Barrass range.
2. Width of influence: F_B = 7.7 + 20 × 0.2² = 8.5 → W_eff = 272 m; S = 10 / (8.5 × 12) = 0.098.
3. Squat: 0.80 × 0.098^0.81 × 10^2.08 / 20 = 0.80 × 0.152 × 120.2 / 20 = 0.73 m. The rule of thumb gives 0.80 m.
4. Froude depth number: 5.14 / √(9.81 × 12) = 0.47 — comfortably subcritical.
5. Clearance: static 2.00 m; net 2.00 − 0.73 − 0.50 = 0.77 m; required 1.00 m → 0.23 m short.
6. Maximum speed: available squat 2.00 − 0.50 − 1.00 = 0.50 m → V = [20 × 0.5 / (0.8 × 0.152)]^(1/2.08) = 8.3 knots.

In a 150 m channel at the same depth: S = 320 / 1800 = 0.178, squat 1.19 m (the simplified confined rule says 1.52 m), and the ship would need to slow to about 6.5 knots to keep 1.0 m of clearance.

## FAQ

**Which speed do I enter?**
Speed through the water, from the log, not GPS speed over ground.

**Why do the general formula and the rule of thumb differ?**
The rule of thumb C_B V²/100 is a fit for typical h/T around 1.2 in open water. The general formula includes the actual depth through the blockage factor and gives less squat in deeper water and more in very shallow water. Use the general formula; keep the rule of thumb as a sanity check.

**How much clearance is enough?**
Common policy: 10 % of draft in open water and sheltered approaches, 15 % in channels, 20–30 % in exposed approaches with swell. Port authorities and company SMS set the requirement; PIANC gives a component-based method.

**Does squat always happen at the bow?**
No. Full-form ships (bulk carriers, tankers, C_B above about 0.7) squat by the bow; fine-form ships (container ships, ferries, C_B below 0.7) squat by the stern. A ship already trimmed by the stern will usually increase that trim.

**What is the Froude depth number for?**
It tells you how close you are to the critical speed √(g h), where the ship's own wave system travels at the ship's speed and squat and resistance rise very steeply. Stay below about 0.7.

**Does a passing ship change my squat?**
Yes, interaction in narrow channels can add significantly to sinkage and cause sheer. It is not in this calculator; reduce speed and increase separation when meeting in a channel.

**Can I use the result to decide a tidal window?**
Yes: enter the depth with the predicted tide, find the maximum speed or the required depth, and combine with the tidal height calculator to set the window.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — block coefficient and draft at the actual condition.
- [Draft survey](../draft-survey/index.html) — the actual drafts before departure.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — the height of tide to add to the charted depth.
- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — wave allowance in exposed approaches.
