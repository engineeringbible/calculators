# Rolling bearing L10 life (ISO 281) calculator

**Summary:** Basic rating life in revolutions and hours from dynamic load rating, equivalent load and speed, with reliability and lubrication factors.

## Introduction

Rolling bearings fail by fatigue, so their life is a statistical quantity: the L10 life is the number of revolutions 90 % of a batch of identical bearings will exceed under a given load. ISO 281 fixes the arithmetic that every bearing catalogue uses, a power law of the ratio between the catalogue dynamic rating and the equivalent load, with exponent 3 for ball bearings and 10/3 for rollers, modified by a reliability factor and, in the 2007 edition, by a lubrication and contamination factor. This calculator computes the equivalent load from radial and axial components, the basic and modified rating life in revolutions, hours and years, the static safety factor, and the rating a bearing would need to reach a required life.

It is for engineers selecting or checking bearings on pumps, fans, gearboxes, shaft lines and deck machinery, and for students of machine design.

## Formulas

    P = X F_r + Y F_a   (F_a/F_r > e; otherwise P = F_r),  then × application factor
    L10 = (C/P)^p   million revolutions,  p = 3 (ball), 10/3 (roller)
    L10h = 10⁶ L10 / (60 n)
    Lnm = a₁ a_ISO L10,   years = Lnmh / (hours per year)
    required C for a life L (h): C = P (60 n L / (10⁶ a₁ a_ISO))^(1/p)
    static safety s0 = C0 / P

a₁ (ISO 281:2007 Table 1): 90 % 1.00, 95 % 0.64, 96 % 0.55, 97 % 0.47, 98 % 0.37, 99 % 0.25, 99.9 % 0.093, 99.95 % 0.077.

## Assumptions and limitations

- Constant load and speed, adequate lubrication, no contamination or misalignment beyond the catalogue limits; duty cycles must be combined with the cubic-mean load first.
- X, Y and e come from the catalogue for the bearing series and the ratio F_a/C0; the deep-groove defaults (0.56 / 1.55 / 0.28) are illustrative, and P is never taken below F_r.
- a_ISO is an input: manufacturers' diagrams give it from the viscosity ratio and the contamination factor; it ranges from about 0.1 (poor lubrication, dirt) to 50 (clean, well lubricated, lightly loaded).
- The static check uses the dynamic equivalent load as the static load unless the user enters P directly from a static load case.
- Limiting speed, temperature and lubricant life are separate checks.

## Worked example

A deep-groove ball bearing with C = 35 kN and C0 = 20 kN on a pump shaft at 1 500 rpm carries 4 kN radial and 1.5 kN axial load; required life 20 000 h at 90 % reliability, 6 000 h/year.

1. F_a/F_r = 0.375 > e (0.28) → P = 0.56 × 4 + 1.55 × 1.5 = 4.57 kN; C/P = 7.67.
2. L10 = 7.67³ = 450 million revolutions = 5 000 h, 0.8 years: short of 20 000 h.
3. The rating needed: C = 4.57 × (20 000 × 60 × 1 500/10⁶)^(1/3) = 4.57 × 12.16 = 55.5 kN, two sizes up.
4. If 99 % reliability were demanded, a₁ = 0.25 and the life would be 1 250 h; good lubrication (a_ISO = 3) would triple it.
5. Static safety 20/4.57 = 4.4: ample.

The classic catalogue illustration, C/P = 4 at 1 500 rpm, gives 64 million revolutions and 711 h for a ball bearing (1 129 h for a roller bearing).

## FAQ

**Why L10 and not an average life?**
Fatigue scatter is wide; the median life is about five times L10. Designers use the 10 % failure point so that most bearings outlast the machine's maintenance interval.

**Why do roller bearings use 10/3?**
Line contact fatigues differently from point contact; the exponent was fitted to test data and standardised at 10/3 for roller bearings.

**What does a_ISO cover?**
The lubricant film relative to the surface roughness (viscosity ratio κ), the cleanliness of the lubricant and the fatigue load limit of the bearing steel. It replaces the older a₂a₃ factors; catalogues give it as diagrams.

**How do I combine variable loads?**
Use the cubic-mean load P_m = (Σ P_i³ q_i)^(1/3) for ball bearings (exponent 10/3 for rollers), with q_i the time fraction at each load and the time-weighted speed.

**Is a 20 000 h requirement typical?**
For continuous industrial and marine auxiliaries 20 000–40 000 h is common; gearboxes and propulsion shaft lines go to 50 000–100 000 h.

**What if the axial load is below e × F_r?**
The axial load is carried within the clearance and P equals the radial load; above the limit the contact angle changes and Y applies.

**What is the static safety factor for?**
Heavy static or shock loads indent the raceways permanently even without rotation; ISO 76 recommends s0 of 1–2 for normal and 2–4 for quiet or shock-loaded applications.

## Related calculators

- [Shaft torque, power and diameter](../shaft-torque/index.html) — loads on the shaft the bearing supports.
- [Three-phase power and motor current](../three-phase-power/index.html) — the motor driving it.
- [Pump and fan affinity laws](../pump-affinity/index.html) — how speed changes alter load and life.
- [Hydraulic cylinder force and speed](../hydraulic-cylinder/index.html) — loads on actuator pivots.
