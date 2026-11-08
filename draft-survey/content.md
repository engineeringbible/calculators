# Draft survey calculator

**Summary:** Six observed drafts to corrected drafts, quarter-mean draft, trim and density corrections, net displacement and cargo or constant from the hydrostatic tables.

## Introduction

A draft survey weighs a ship by Archimedes: read the drafts, enter the hydrostatic tables, correct for trim and water density, subtract everything on board that is not cargo, and the difference between two surveys is the cargo loaded or discharged. It is the standard commercial method for bulk cargoes and the basis of bills of lading, so the arithmetic must be done the same way every time. This calculator follows the UN ECE code sequence used by surveyors worldwide: port and starboard drafts at three stations, correction of the marks to the perpendiculars, the quarter-mean draft, first and second trim corrections, density correction, deductibles and the final cargo or constant.

It is for chief officers and cargo surveyors checking a survey on the spot, for operators auditing a disputed figure, and for cadets learning the procedure. The hydrostatic values come from the ship's own tables; the calculator does the corrections and the bookkeeping.

## Formulas

Mean drafts at the marks:

    F = (F_port + F_stbd) / 2,   M = …,   A = …

Correction to the perpendiculars (apparent trim t_a = A − F; LBM = LBP − d_F − d_A):

    F_FP = F − d_F × t_a / LBM         d_F: forward marks aft of the FP
    A_AP = A + d_A × t_a / LBM         d_A: aft marks forward of the AP
    M_⊗  = M − d_M × t_a / LBM         d_M: midship marks aft of midships
    True trim t = A_AP − F_FP          (+ by the stern)
    Hog/sag = M_⊗ − (F_FP + A_AP) / 2  (+ sag)

Quarter-mean draft for the tables:

    D_qm = (F_FP + A_AP + 6 M_⊗) / 8

Trim corrections (tonnes), with Δ_table, TPC, LCF and MCTC read at D_qm:

    First (LCF layer):  FTC = t[cm] × LCF[m, + fwd] × TPC / LBP, sign such that FTC > 0 when the LCF is towards the deeper end
                        (in this calculator: FTC = −t × LCF_fwd × TPC / LBP)
    Second (Nemoto):    STC = 50 × t[m]² × (MCTC₊₅₀ − MCTC₋₅₀) / LBP     (always positive)
    Δ_trim = Δ_table + FTC + STC

Density correction:

    Δ_corr = Δ_trim × ρ_dock / ρ_table

Cargo:

    Deductibles = ballast + fresh water + fuel oil + diesel + lube oil + others
    Net = Δ_corr − deductibles − lightship       (= cargo + constant)
    Cargo = Net − constant                        (at the initial survey with no cargo, Net is the constant)

## Assumptions and limitations

- The hydrostatic data are not in the calculator: read displacement, TPC, LCF and MCTC (at ±50 cm) from the ship's tables at the quarter-mean draft and enter them. The tables are usually for 1.025 t/m³; change the table density if yours differ.
- Sign conventions: trim positive by the stern; LCF from midships, positive forward; mark distances positive inboard of the perpendiculars.
- The quarter mean approximates the draft at the LCF with hog or sag; large deflection (more than about 10 cm) and large trim (more than 1 % of LBP) reduce accuracy and are flagged.
- List is not corrected; the port/starboard mean is used and a list above 10 cm is flagged. Surveyors should trim the ship upright before reading if possible.
- Deductibles are taken as entered; tank soundings need their own trim and heel corrections and density conversions, and ballast density should be measured, not assumed.
- Reading accuracy dominates: 1 cm of mean draft is one TPC of displacement, 50 t on a Panamax. Expect ±0.5 % of cargo in good conditions and worse in swell.

## Worked example

Bulk carrier, LBP 180 m, forward marks 3.0 m aft of the FP, aft marks 6.0 m forward of the AP, midship marks at midships. Drafts: forward 9.50 m both sides, midships 10.03 m, aft 10.50 m. Dock water 1.020 t/m³. Tables at the quarter-mean draft: Δ 47 232 t, TPC 52.0, LCF 3.0 m aft of midships, MCTC 460 at +50 cm and 440 at −50 cm. Deductibles 2 860 t, lightship 11 200 t, constant 350 t.

1. Apparent trim 1.00 m over LBM = 171 m. F_FP = 9.50 − 3 × 1/171 = 9.482 m; A_AP = 10.50 + 6 × 1/171 = 10.535 m; true trim 1.053 m by the stern; midship draft 10.03 m, sag 2.1 cm.
2. Quarter mean: (9.482 + 10.535 + 6 × 10.03) / 8 = 10.025 m.
3. First trim correction: 105.3 cm × 3.0 m × 52 / 180 = +91.2 t (LCF aft, trim by stern: positive).
4. Second trim correction: 50 × 1.053² × 20 / 180 = +6.2 t.
5. Displacement corrected for trim: 47 329.4 t; for density: × 1.020/1.025 = 47 098.5 t.
6. Net: 47 098.5 − 2 860 − 11 200 = 33 038.5 t; cargo = 33 038.5 − 350 = 32 688.5 t.

A 1 cm reading error at each of the six marks, all in the same direction, would move this figure by 52 t, about 0.16 %.

## FAQ

**What is the constant and how do I get it?**
Everything on board that is neither lightship nor a measured deductible: stores, spares, mud in ballast tanks, unaccounted water. It is found at an initial (light) survey by entering constant = 0 with no cargo on board; the net displacement is then the constant. A typical bulk carrier constant is 200–500 t; a negative or wildly changed constant indicates a reading or tank error.

**Why read drafts on both sides?**
To average out list and to detect it. The displacement of a listed ship is not given exactly by the mean draft, and a list also changes the tank soundings.

**Why is the midship draft weighted six times?**
Because the hull bends: the mean of forward and aft drafts misses hog or sag, while the midship reading alone misses trim effects. The quarter mean is the standard compromise that approximates the draft at the LCF of the deflected hull.

**When is the second trim correction significant?**
It grows with the square of trim. At 1 m trim on a Panamax it is a few tonnes; at 3 m it can be 50 t or more, and the first correction is then also large.

**Do I correct for density of fuel and ballast separately?**
Yes, but outside this calculator: convert each tank's sounded volume with its own measured density before entering the masses as deductibles.

**Why does the survey disagree with the shore scale?**
Draft surveys are typically within ±0.5 % of cargo in good conditions, worse in swell or with list. Differences within that band are normal; larger ones usually come from the constant, ballast density or sounding errors.

**Can I use this for a tanker or a container ship?**
The arithmetic is the same, but tankers are measured by ullage and container ships by declared weights; draft surveys are mainly a bulk-cargo tool.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — where TPC, MCTC and the trim formulas come from.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — fuel deductibles from soundings.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — the departure draft in the channel.
- [Initial stability GM and list](../initial-stability/index.html) — stability at the surveyed condition.
