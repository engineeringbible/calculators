# Sight reduction (intercept method) calculator

**Summary:** Observed altitude from the sextant reading, then the intercept, azimuth and intercept terminal point from the assumed position.

## Introduction

A sextant sight turns into a line of position in two stages. First the sextant altitude is corrected for the instrument's index error, the height of eye, atmospheric refraction, parallax and the body's semi-diameter, giving the observed altitude. Then the altitude and azimuth the body would have at an assumed position are computed from the almanac's GHA and declination. The difference is the intercept: the distance, in nautical miles, from the assumed position towards or away from the body to the position line. This calculator does both stages for the sun, the moon, stars and planets.

It is for navigators keeping their celestial skills current, cadets preparing for examinations, and anyone checking an electronic position against an independent fix.

## Formulas

    Index correction:   IC = −IE   (on the arc subtracted)
    Dip:                D = 1.76′ √h   (h in metres)
    Apparent altitude:  Ha = Hs + IC − D
    Refraction:         R = cot(Ha + 7.31/(Ha + 4.4))′ × (P/1010) × (283/(273 + T))
    Parallax:           PA = HP cos Ha   (sun 0.15′, moon from the almanac, stars nil)
    Observed altitude:  Ho = Ha − R + PA ± SD   (+ lower limb, − upper limb)
    Hour angle:         LHA = GHA + longitude   (east positive)
    Computed altitude:  sin Hc = sin Lat sin Dec + cos Lat cos Dec cos LHA
    Azimuth:            Zn = atan2(−cos Dec sin LHA, sin Dec cos Lat − cos Dec sin Lat cos LHA)
    Intercept:          a = Ho − Hc   (minutes = nautical miles; + towards, − away)

## Assumptions and limitations

- Nautical Almanac correction methods with Bennett's refraction formula.
- Planets need the almanac's small additional correction for Venus and Mars.
- The straight position line approximates the circle of equal altitude; keep intercepts under about 30 nmi and altitudes under about 85°.
- Low sights, below about 10°, carry larger refraction errors.

## Worked example

Sun's lower limb, Hs 57° 22.0′, index error 1.5′ on the arc, height of eye 16 m, standard weather, SD 16.0′. Assumed position 40° N, 30° W. The almanac gives GHA 60° and declination 20° N for the time of the sight.

1. Index correction −1.5′; dip 1.76 √16 = 7.0′; Ha = 57° 13.5′.
2. Refraction 0.6′, parallax 0.1′, semi-diameter +16.0′: Ho = 57° 28.9′.
3. LHA = 60° − 30° = 30°; Hc = 57° 29.1′; Zn = 240.9°.
4. Intercept = Ho − Hc = −0.2 nmi: 0.2 nmi away from the body, so plot it from the assumed position on 060.9° and draw the position line at right angles, 150.9°–330.9°.

## FAQ

**Why use an assumed position instead of the DR?**
With sight reduction tables, rounding the assumed position to whole degrees of latitude and LHA simplifies the tables. With a calculator any position works, so the DR position is the natural choice.

**What does "towards" mean?**
The observed altitude is greater than computed, so the ship is closer to the body's geographical position than the assumed position is. Measure the intercept towards the azimuth.

**Why does the moon need such a large correction?**
It is close to the earth, so its parallax is up to a degree. That is why the almanac gives its horizontal parallax for every hour.

**What temperature and pressure do I use?**
The ones at the time of the sight. The correction matters most for low altitudes and for extreme cold or very high or low pressure.

**How accurate is a single sight?**
With a good horizon and a well-adjusted sextant, about 1′, that is 1 nmi. Crossing three or more position lines shows the quality of the fix.

## Related calculators

- [Compass error by amplitude or azimuth](../compass-error/index.html) — the same navigational triangle for bearings.
- [Great-circle distance](../great-circle-distance/index.html) — ocean passages planned from the fix.
- [Mercator sailing](../mercator-sailing/index.html) — rhumb-line courses from the fix.
- [Light, radar and VHF range](../light-range/index.html) — coastal position fixing.
