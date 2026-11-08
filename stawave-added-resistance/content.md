# Added resistance in waves (STAwave-1) calculator

**Summary:** ISO 15016 STAwave-1 added resistance in head waves from beam, bow length and significant wave height, with the power increase at speed.

## Introduction

Speed trials are run in calm weather, but rarely in flat water. ISO 15016 corrects the measured power for the small waves that remain, and for the usual trial case (short head waves, little ship motion) it prescribes STAwave-1, a formula needing only the ship's breadth, the length of the bow section on the waterline and the significant wave height. The physics is wave reflection off the bow: the shorter and blunter the bow, the more of the incoming wave energy is thrown back and the more resistance it costs. This calculator evaluates the formula, applies the bow-sector rule, converts the resistance to power at the trial speed and tells you when the method stops applying.

It is for naval architects and trial engineers checking a speed-power correction, performance analysts comparing trial and service conditions, and students of seakeeping.

## Formulas

    R_AW = (1/16) ρ g H_1/3² B √(B / L_BWL)         ISO 15016:2025 Formula D.31
    valid for wave direction ≤ 45° off the bow, small heave and pitch; otherwise no correction
    ΔP = R_AW V_S / η_D,   share = ΔP / P_D

L_BWL is the distance from the bow to the point where the waterline reaches 95 % of the maximum breadth (Figure D.2); ρ from the ITTC sea-water table at the trial temperature.

## Assumptions and limitations

- Short waves relative to the ship, small motions (trial sea states); no dependence on speed, wave period or spectrum.
- Waves outside ±45° of the bow: zero correction, as the standard states; use SNNM for those.
- Propulsive efficiency unchanged by the added load.
- Ocean conditions, long swell and large motions need the spectral SNNM method or model tests.

## Worked example

A Panamax hull, B 32 m, bow section L_BWL 40 m, trial in 2.0 m significant waves on the bow at 12 kn, 15 °C sea water, delivered power 5 000 kW, η_D 0.70.

1. ρ = 1025.9 kg/m³; √(B/L_BWL) = √0.8 = 0.894.
2. R_AW = 1/16 × 1025.9 × 9.807 × 2² × 32 × 0.894 = 72.0 kN.
3. ΔP = 72.0 kN × 6.17 m/s / 0.70 = 635 kW, 12.7 % of the measured power: the calm-water power is 4 365 kW.

With waves 60° off the bow, ISO applies no STAwave-1 correction, and with 3 m waves the small-motion assumption is already doubtful.

## FAQ

**Why only head waves?**
In the bow sector the added resistance is dominated by reflection, which the formula captures; abeam and astern the balance changes and the method was not validated.

**What is L_BWL exactly?**
Read from the waterline at the trial draught: the distance from the forward end of the waterline to where the half-breadth reaches 95 % of the maximum. Full hulls 0.1 L_PP, fine hulls up to 0.25 L_PP.

**Why does the result not change with speed?**
The reflection model has no speed term; the power equivalent does scale with speed because power is resistance times speed.

**How does this compare with SNNM?**
SNNM (ISO 15016 D.4) is a spectral method that includes motions, wave period and heading; it is required for long waves and non-head seas and gives the same order of result for short head waves.

**Is the correction added or subtracted?**
The wave resistance increased the measured power, so ΔP is subtracted from the measured power to get the calm-water value.

**Does the density matter?**
Only at the 0.3 % level between cold and warm water; the formula is proportional to ρ.

## Related calculators

- [Wave properties and encounter period](../wave-properties/index.html) — wave length, period and encounter frequency.
- [Holtrop–Mennen resistance](../holtrop-mennen/index.html) — the calm-water baseline.
- [Shallow water correction](../shallow-water-speed/index.html) — the other ISO 15016 environmental correction.
- [Water temperature and density correction](../water-temperature-correction/index.html) — ISO 15016 Annex E.
- [Beaufort and sea state](../beaufort-sea-state/index.html) — wave height from wind.
