# Sea state statistics calculator

**Summary:** Wave spectrum moments and periods, the 1/10 and 1/100 highest waves, the expected maximum wave in a storm and exceedance probabilities from Hs and Tp.

## Introduction

A forecast or a wave buoy gives a sea state as two numbers: the significant wave height and a period. Behind them is a spectrum and a statistical distribution of individual waves, and many decisions depend on the waves the two numbers do not show: the largest wave in the next three hours, how often a given height will be exceeded, the zero-crossing period that sets the number of wave encounters. This calculator builds the JONSWAP or Pierson–Moskowitz spectrum of DNV-RP-C205 from Hs and Tp (or Tz), integrates its moments, and applies the Rayleigh wave-height distribution.

It is for masters and superintendents reading weather routing and forecast data, marine operations planners checking lifting and towing limits, and students of ocean waves.

## Formulas

    Pierson–Moskowitz:  S_PM(ω) = (5/16) Hs² ωp⁴ ω⁻⁵ exp[−(5/4)(ω/ωp)⁻⁴]
    JONSWAP:            S_J(ω) = (1 − 0.287 ln γ) S_PM(ω) γ^exp[−(ω − ωp)²/(2σ²ωp²)],  σ = 0.07 / 0.09
    DNV γ rule:         γ = 5 (Tp/√Hs ≤ 3.6),  exp(5.75 − 1.15 Tp/√Hs) (3.6–5),  1 (≥ 5)
    Moments:            m_n = ∫ ωⁿ S(ω) dω
    Periods:            Tz = 2π √(m0/m2),  T1 = 2π m0/m1,  Te = 2π m₋₁/m0
    Rayleigh heights:   H_rms = Hs/√2,  P(H > h) = exp[−(h/H_rms)²]
    Highest 1/n:        H1/n = H_rms [√(ln n) + (n√π/2) erfc √(ln n)]
    Maximum of N waves: H_mp = H_rms √(ln N),  E[H_max] ≈ H_rms [√(ln N) + 0.5772/(2√(ln N))],  N = duration/Tz

## Assumptions and limitations

- One stationary, single-peaked sea state in deep water.
- The DNV γ rule is for wind seas; swell needs its own spectrum.
- Rayleigh statistics are for a narrow-band sea and slightly overestimate the largest waves of real storms.
- Shallow water, currents and crossing seas are not modelled.

## Worked example

Hs = 4 m and Tp = 9 s, a three-hour sea state, and a wave height of interest of 7 m.

1. Tp/√Hs = 4.5, so the DNV rule gives γ = exp(5.75 − 1.15 × 4.5) = 1.78.
2. Integrating the spectrum gives Tz = 6.66 s, T1 = 7.20 s and Te = 7.91 s.
3. H_rms = 2.83 m; the highest tenth average 5.09 m and the highest hundredth 6.67 m.
4. In 3 hours there are 1622 waves; the most probable maximum is 7.69 m and the expected maximum 7.99 m.
5. One wave in about 460 exceeds 7 m, and the chance that at least one does in the 3 hours is 97 %.

## FAQ

**Why is the maximum wave so much larger than Hs?**
Hs is roughly the mean of the highest third. Among a thousand or more waves the largest is typically 1.8–2 times Hs.

**Which period do I have, Tp or Tz?**
Buoys and hindcasts usually give Tp, or Tm02, which equals Tz; ship observations and older reports give a mean period close to Tz. Choose the matching input; the other periods are derived from the spectrum.

**What does γ do?**
It sharpens the spectral peak. A young, growing wind sea has γ around 3.3; a fully developed sea has γ = 1, the Pierson–Moskowitz spectrum.

**Are these numbers conservative?**
Mostly. Real storm seas are slightly broad-banded and their largest waves are about 5–10 % lower than the Rayleigh values.

**Can I use this for swell?**
Only roughly. Swell is narrow-banded with a long period; the DNV rule gives γ = 1 for it, which is too broad.

## Related calculators

- [Wave properties and encounter period](../wave-properties/index.html) — length, celerity and encounter period of a single wave.
- [Beaufort force and sea state](../beaufort-sea-state/index.html) — the sea that goes with a wind.
- [STAwave-1 added wave resistance](../stawave-added-resistance/index.html) — the speed loss in head seas.
- [Roll period](../roll-period/index.html) — synchronous and parametric roll in the waves of this sea state.
