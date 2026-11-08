# Light, radar and VHF range calculator

**Summary:** Geographic and luminous range of a light, radar and VHF line-of-sight ranges, and the COLREG minimum intensity of a navigation light.

## Introduction

When will a lighthouse rise above the horizon, and will it be bright enough to see in tonight's visibility? How far away can the radar see a low coaster, and how far does VHF reach between two antennas? All of these are horizon and attenuation questions. This calculator answers them together: the geographic range of a light from its elevation and the height of eye, its luminous range from its intensity or nominal range and the meteorological visibility, the radar and VHF line-of-sight ranges, and the minimum intensity COLREG requires of a navigation light for a given range.

It is for navigating officers planning landfalls, cadets learning light ranges, and anyone specifying or checking navigation lights.

## Formulas

    Horizon (Bowditch Table 12):   d = √(2 R h / β),   R = 3440.1 nmi, β = 0.8279   →   1.17 √h(ft) = 2.12 √h(m)
    Rounded rule:                  d = 2.08 √h(m);    geometric: d = √(2 R h) = 1.93 √h(m)
    Geographic range:              D_geo = d(H) + d(h)
    Allard's law:                  E = I · T^d / (1852 d)²,   T = 0.05^(1/V),   E_threshold = 2·10⁻⁷ lx at night
    Nominal range:                 luminous range at V = 10 nmi (T = 0.741)
    Visible range:                 min(luminous range, geographic range)
    Radar and VHF horizon:         d = √(2 · 4/3 · R h) = 2.23 √h(m)
    COLREG Annex I minimum:        I = 3.43·10⁶ × 2·10⁻⁷ × D² × 0.8^(−D)  cd

- H — elevation of the light; h — height of eye or antenna; I — luminous intensity in candela; V — meteorological visibility; d, D — distances in nautical miles.

## Assumptions and limitations

- Standard refraction; abnormal refraction over cold or warm water changes all horizon ranges.
- Charted light elevations are above a high-water datum; the actual height depends on the tide.
- Allard's law is for a point source at night against a dark background; shore lights raise the threshold.
- Radar and VHF figures are line-of-sight only; detection and reception also depend on power, antenna gain and target size.
- The COLREG intensity uses the regulation's own transmissivity, K = 0.8.

## Worked example

A light with a nominal range of 20 nmi stands 40 m above the sea. The observer's eye is 15 m above the water and the visibility is 5 nmi.

1. Horizon from the light: 2.12 √40 = 13.4 nmi; from the eye: 2.12 √15 = 8.2 nmi; geographic range 21.6 nmi.
2. Intensity from the nominal range: I = 2·10⁻⁷ × (1852 × 20)² × 0.741^(−20) ≈ 110 000 cd.
3. In 5 nmi visibility the transmissivity per mile is 0.05^(1/5) = 0.549, and Allard's law gives a luminous range of 11.8 nmi.
4. The light will be seen at about 11.8 nmi, limited by visibility rather than by the horizon. In clear weather it would rise at 21.6 nmi.

## FAQ

**What is the difference between nominal and luminous range?**
Nominal range is the luminous range in a standard visibility of 10 nmi, and is what charts and lists of lights give. Luminous range is the distance at which the light is just visible in the actual visibility.

**Why can I sometimes see a light beyond its geographic range?**
Its loom, the glow of the beam scattered in the air above it, can show beyond the horizon. Unusual refraction can also lift the light into view.

**Why does the radar see further than the eye?**
Radio waves bend more around the earth in the standard atmosphere: the effective earth radius is 4/3 of the real one, against about 1.2 for light.

**Which horizon model should I use?**
Bowditch's table is the established reference. The 2.08 rule is a rounded version used in many textbooks and gives about 2 % less. The geometric value ignores refraction and is the most conservative.

**Is the VHF range really line of sight?**
Practically yes for marine VHF. Real ship-to-ship ranges of 20–30 nmi agree with the antenna heights; power and antenna gain decide whether the signal is still readable at that distance.

**What intensity does a masthead light need?**
COLREG requires 6 nmi for a masthead light on a vessel of 50 m or more. By the Annex I formula that is at least 94 cd.

## Related calculators

- [CPA and TCPA from radar plots](../cpa-tcpa/index.html) — what to do once the target is detected.
- [Air draft and bridge clearance](../air-draft/index.html) — the other height question on the bridge.
- [Tidal height](../tidal-height/index.html) — the state of tide that changes a light's elevation.
- [Great-circle distance](../great-circle-distance/index.html) — the distance to the landfall.
