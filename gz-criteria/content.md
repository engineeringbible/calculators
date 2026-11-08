# GZ curve and intact stability criteria calculator

**Summary:** IS Code 2008 general criteria and the severe wind and rolling (weather) criterion from a pasted GZ curve, with the grain heeling check.

## Introduction

Every loading condition of a ship must meet the intact stability criteria of the 2008 IS Code: minimum areas under the righting lever (GZ) curve, a minimum lever at 30°, a maximum lever at 25° or more, a minimum initial GM, and the weather criterion, in which the ship rolls to windward in a beam wind and must have enough reserve to absorb a gust. Grain carriers must also show that a shift of the grain surface does not heel the ship beyond 12° and leaves enough residual stability. This calculator checks all of these from a GZ curve pasted from the loading computer or the stability booklet.

It is for chief officers verifying a loading condition, superintendents reviewing stability calculations, and students of ship stability.

## Formulas

    Areas:          A(θ₁, θ₂) = ∫ GZ dθ   (θ in radians, monotone cubic through the points)
    General (2.2):  A(0,30°) ≥ 0.055, A(0,40° or θf) ≥ 0.090, A(30°,40° or θf) ≥ 0.030 m·rad
                    GZ ≥ 0.20 m at θ ≥ 30°,  θ(GZmax) ≥ 25°,  GM0 ≥ 0.15 m
    Weather (2.3):  lw1 = P A Z / (1000 g Δ),  lw2 = 1.5 lw1,  P = 504 Pa
                    θ0 (GZ = lw1) ≤ min(16°, 0.8 θ_deck edge)
                    θ1 = 109 k X1 X2 √(r s),  r = 0.73 + 0.6 (KG − d)/d
                    T = 2 C B / √GM,  C = 0.373 + 0.023 B/d − 0.043 Lwl/100
                    area b (lw2 intercept to θ2 = min(θf, 50°, θc)) ≥ area a (θ0 − θ1 to the lw2 intercept)
    Grain (A 7):    λ0 = M_v / (SF Δ),  λ40 = 0.8 λ0
                    heel ≤ 12° (or deck-edge immersion),  residual area ≥ 0.075 m·rad,  GM0 ≥ 0.30 m

## Assumptions and limitations

- The GZ curve already includes free-surface effects and the trim at heel.
- Tables X1, X2, k and s are interpolated linearly and held beyond their ends.
- Special ship types have additional criteria that are not checked.
- The calculator supports, but does not replace, the approved stability booklet and loading computer.

## Worked example

The default curve rises to a maximum of 0.69 m at 40° and stays positive to 70°. GM0 is 1.0 m, the displacement 20 000 t, the windage area 1 800 m² with a lever of 14 m, B = 26 m, d = 9 m, Lwl = 160 m, CB 0.75, bilge keels of 60 m².

1. General criteria: areas 0.152, 0.268 and 0.116 m·rad; GZ 0.69 m beyond 30°; maximum at 40°; all pass.
2. lw1 = 504 × 1800 × 14 / (1000 × 9.81 × 20 000) = 0.065 m, so the ship heels θ0 = 3.8° in the steady wind, well under 16°.
3. Roll period 19.3 s by the IS Code formula gives s = 0.036, and θ1 = 16.2° to windward.
4. Area a = 0.049 m·rad, area b = 0.301 m·rad: b ≥ a, so the weather criterion is met.

## FAQ

**Where do I get the GZ curve?**
From the loading computer or the stability booklet's cross curves (KN) corrected for the actual KG: GZ = KN − KG sin θ, with free surface included.

**What is the down-flooding angle?**
The heel at which openings that cannot be closed weathertight, such as ventilators and air pipes, go under water. Areas beyond it do not count.

**Why does the roll period matter?**
It selects the wave steepness factor s: ships with short roll periods meet steeper waves in resonance and roll further to windward.

**Why use a monotone cubic interpolation?**
It is smooth like a faired curve but never overshoots between points, so it does not invent stability that the data does not show.

**Is the grain check complete?**
It checks the three Grain Code criteria from the total volumetric heeling moment. The moments of the filled and partly filled holds come from the ship's grain loading manual.

## Related calculators

- [Initial stability](../initial-stability/index.html) — GM, free surface and list.
- [Roll period](../roll-period/index.html) — the natural roll period and resonance checks.
- [Hydrostatics](../hydrostatics/index.html) — displacement, drafts and trim.
- [Loading condition](../loading-condition/index.html) — KG and GM from the item list.
