# Roll period and synchronous rolling calculator

**Summary:** Natural roll period from GM and beam (IS Code) or GM from an observed period, encounter period for speed and heading, synchronous and parametric roll checks.

## Introduction

A ship rolls at its own natural period, set by its beam and metacentric height; waves arrive at an encounter period set by their length, the ship's speed and the heading. When the two coincide the roll builds up (synchronous rolling); when the encounter period is half the roll period, or equal to it in waves about as long as the ship, the stability itself pulses with the passing crests (parametric rolling). In following seas a fast ship can also be caught by a wave and broach. IMO's MSC.1/Circ.1228 gives the master simple formulas and zones for all of these, and the 2008 Intact Stability Code gives the roll period approximation they rely on. This calculator puts them together: roll period or GM, wave length, encounter period, and the four checks with the speed that would bring the ship into resonance on the present heading.

It is for masters and officers planning course and speed in heavy weather, naval architects and surveyors estimating GM from a rolling test, and students of seakeeping.

## Formulas

Natural roll period (IS Code 2008 §2.3.4):

    T_R = 2 C B / √GM,    C = 0.373 + 0.023 (B/d) − 0.043 (L_WL / 100)
    inverse (rolling test):  GM = (2 C B / T_R)²

Waves and encounter (Circ.1228 §1.5–1.6, deep water):

    λ = 1.56 T_W²  [m],   T_W = 0.8 √λ  [s]
    T_E = 3 T_W² / (3 T_W + V cos α)   with V in knots, α = 0° head seas, 90° beam, 180° following

Checks (Circ.1228 §4.2):

    synchronous rolling:   T_E ≈ T_R   (flagged within ±10 %, caution within ±20 %)
    parametric rolling:    T_E ≈ T_R or T_E ≈ 0.5 T_R, with λ/L between 0.6 and 2.3
    surf-riding:           135° < α < 225° and V > 1.8 √L / cos(180° − α)  (marginal above 1.4 √L / cos(180° − α))
    high-wave attack:      λ > 0.8 L, H_s > 0.04 L and 1.8 ≤ T_E/T_W ≤ 3.0

## Assumptions and limitations

- The IS Code roll-period formula is an approximation offered for use without better data; it corresponds to a roll radius of gyration near 0.35–0.40 B. Real ships differ by 10–15 % depending on the mass distribution, and the roll period lengthens at large angles. Enter an observed period when you have one.
- GM must be the fluid GM (free surfaces corrected).
- Deep-water waves and a single period and height. Real seas are spectra: treat the bands as zones.
- The surf-riding and high-wave criteria use L between perpendiculars, as in the circular.
- The ±10 % and ±20 % bands around resonance are this calculator's reading of "nearly equal"; the circular gives no numbers.

## Worked example

A 200 m ship (L_WL 205 m, B 32 m, d 10 m) with a fluid GM of 1.5 m steams at 15 knots.

1. Roll period: C = 0.373 + 0.023 × 3.2 − 0.043 × 2.05 = 0.358; T_R = 2 × 0.358 × 32 / √1.5 = 18.7 s. (Conversely, if the ship were observed to roll at 18.7 s, GM = 1.5 m.)
2. Head seas of 10 s period: λ = 156 m; T_E = 300 / (30 + 15) = 6.7 s. T_E/T_R = 0.36: no roll resonance.
3. Alter to stern-quartering seas (α = 135°) in a 14 s swell: T_E = 588 / (42 − 10.6) = 18.7 s = T_R. Synchronous rolling: danger. The critical speed on this heading is exactly 15 knots; slowing to 10 knots gives T_E = 17.1 s (ratio 0.91, still caution), altering course to beam seas gives T_E = 14 s (ratio 0.75, clear).
4. Head seas of 13 s period: T_E = 9.4 s = T_R/2, λ = 263 m = 1.3 L: parametric rolling danger.
5. Following seas at 26 knots: above 1.8 √200 = 25.5 knots, surf-riding danger; at 22 knots marginal.

## FAQ

**Which heading and speed get me out of resonance?**
Change whichever is easier: in following or quartering seas a speed change moves T_E strongly; in head seas the encounter period is short and roll resonance is rare but parametric rolling at T_R/2 is possible, so alter course off the wave direction.

**Why does a tender ship roll more comfortably but more dangerously?**
A low GM gives a long roll period and gentle accelerations, but it is more easily matched by long swells and leaves less righting energy; a very stiff ship (short period) snaps and suffers cargo and crew.

**Can I measure the roll period on board?**
Yes: time ten full roll cycles in calm water (or beam swell) and divide; the IS Code uses this rolling test to estimate GM for small ships.

**What is parametric rolling and why container ships?**
The waterplane, and so GM, changes as crests and troughs pass a flared hull; when this happens twice per roll period the roll is pumped up. Large container ships with pronounced bow flare and flat sterns in head seas are the classic case.

**What is broaching?**
A sudden yaw to beam-on while surfing a following wave, with a large heel; the circular's speed limit 1.8 √L cos⁻¹ marks the zone to avoid.

**Does water depth matter?**
The wave relations assume deep water (depth > λ/2). In shallow water waves are shorter and slower for the same period and the celerity formula changes; use the wave-properties calculator.

**Why both T_E ≈ T_R and T_E ≈ 0.5 T_R for parametric rolling?**
The stability can vary once (encounter ratio 1:1, typical in following seas) or twice (1:0.5, typical in head seas) per roll period; both excite the roll parametrically.

## Related calculators

- [Initial stability GM and list](../initial-stability/index.html) — the fluid GM used here.
- [Wave properties and encounter period](../wave-properties/index.html) — finite-depth waves and orbital velocities.
- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — wave height and period from the sea state.
- [Hydrostatics basics](../hydrostatics/index.html) — KM and the particulars behind GM.
