# Relief valve sizing (API 520) calculator

**Summary:** API 520 required relief area for gas/vapour (critical and sub-critical) and liquid service, with the API 526 orifice letter and margin.

## Introduction

A pressure relief valve must pass the worst credible relieving load at a pressure not more than the allowable overpressure above its set point. API 520 Part I gives the sizing equations: an ideal nozzle formula for gases and vapours, choked when the back pressure is low and sub-critical when it is high, and an orifice formula for liquids. The result is the required effective discharge area, which API 526 standardises into lettered orifices from D to T. This calculator applies the SI equations, picks the orifice letter, shows how much of it the duty uses, and gives the capacity of the selected valve.

It is for process, marine and mechanical engineers sizing relief valves on vessels, compressors, pumps and heat exchangers, and for students of process safety. Final selection uses the manufacturer's certified area and coefficient.

## Formulas

    P₁ = set + overpressure (10 % single, 16 % multiple, 21 % fire) + atmospheric     (gas, absolute)
    critical if P₂/P₁ ≤ (2/(k+1))^(k/(k−1))
    critical:      A = W / (C K_d P₁ K_b K_c) × √(T Z / M),   C = 0.03948 √(k (2/(k+1))^((k+1)/(k−1)))
    sub-critical:  A = 17.9 W / (F₂ K_d K_c) × √(T Z / (M P₁ (P₁ − P₂))),
                   F₂ = √( (k/(k−1)) r^(2/k) (1 − r^((k−1)/k)) / (1 − r) ),  r = P₂/P₁
    liquid:        A = 11.78 Q / (K_d K_w K_c K_v) × √(G / (p₁ − p₂))
    A mm², W kg/h, P kPa, T K, Q L/min;  K_d 0.975 gas / 0.65 liquid;  K_c 0.9 with a rupture disk

API 526 effective areas (in²): D 0.110, E 0.196, F 0.307, G 0.503, H 0.785, J 1.287, K 1.838, L 2.853, M 3.60, N 4.34, P 6.38, Q 11.05, R 16.0, T 26.0 (× 645.16 = mm²).

## Assumptions and limitations

- Ideal-gas nozzle equations with the compressibility factor entered; no two-phase, flashing or steam (Napier) sizing.
- Preliminary K_d and API 526 effective areas; certified values govern.
- Inlet pressure loss, built-up back pressure and reaction forces are separate checks (API 520 Part II, API 521).

## Worked example

API 520 example 1: hydrocarbon vapour, 24 270 kg/h at 348 K, Z 0.90, M 51, k 1.11, set pressure 517 kPag with 10 % overpressure (P₁ 670 kPa abs), conventional valve, no rupture disk.

1. Critical ratio (2/2.11)^(1.11/0.11) = 0.583; the back pressure is atmospheric, so flow is critical.
2. C = 0.03948 √(1.11 × 0.9479^19.18) = 0.02489.
3. A = 24 270/(0.02489 × 0.975 × 670) × √(348 × 0.90/51) = 3 699 mm².
4. The next API 526 orifice is P (4 116 mm²), used at 90 %; the valve passes about 27 000 kg/h at these conditions.

With 532 kPa abs of back pressure (example 2) the flow is sub-critical (r = 0.794), F₂ = 0.855 and the required area grows to 4 248 mm², still a P orifice. Example 5, crude oil at 6 814 L/min (G 0.90) through a balanced-bellows valve with 1 551.6 kPa differential and K_w 0.97, needs 3 066 mm², also a P.

## FAQ

**Why does back pressure matter so little in critical flow?**
Once the flow is choked, the mass flow depends only on upstream conditions; back pressure enters only through K_b for valves whose lift it affects.

**What are K_d values for?**
They are the ratio of actual to ideal flow for the certified valve; 0.975 (gas) and 0.65 (liquid) go with the API 526 effective areas for preliminary sizing.

**Single, multiple or fire overpressure?**
10 % when one valve protects the system, 16 % when several do, 21 % for the fire case; the ASME code sets them.

**Why 11.78 in the liquid formula?**
It combines the unit conversions (L/min, kPa, mm²) with the water density; the US-unit form has 38 in its place.

**When do I need K_v?**
For viscous liquids (heavy oils): compute the valve Reynolds number and apply the API 520 correction; below about Re 100 000 it reduces capacity noticeably.

**Can I size for steam?**
Not on this page; the current API 520 edition changed the steam method, so use the manufacturer's steam sizing.

## Related calculators

- [Pressure vessel thickness](../pressure-vessel/index.html) — the vessel the valve protects.
- [Control valve Cv / Kv sizing](../control-valve-cv/index.html) — control rather than relief.
- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — flow through fixed restrictions.
- [Pipe wall thickness (ASME B31.3)](../pipe-wall-thickness/index.html) — inlet and outlet piping.
- [Water hammer](../water-hammer/index.html) — pressure surges that can lift a relief valve.
