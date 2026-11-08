# Compass error by amplitude or azimuth calculator

**Summary:** True bearing of the sun or another body by amplitude or time azimuth, then the compass error and deviation from the observed bearing.

## Introduction

A ship's compasses are checked by comparing a bearing of a celestial body with its true bearing worked out from the ship's position and the almanac. At sunrise and sunset the amplitude method needs nothing more than latitude and declination; at any other time the time-azimuth method uses the body's hour angle as well. This calculator computes the true bearing both ways, then the compass error and, with the chart variation, the deviation to enter in the compass error book.

It is for watchkeeping officers making the daily compass check required by the ISM procedures and SOLAS, and for cadets learning the method.

## Formulas

    Azimuth at true altitude h:  cos Z = (sin Dec − sin Lat sin h) / (cos Lat cos h)
    Amplitude (h = 0):           sin A = sin Dec / cos Lat,   A = 90° − Z
    Bearing:                     rising Zn = Z,   setting Zn = 360° − Z
    Visible horizon:             h = −(dip + R),  dip = 1.76′ √(height of eye, m),  R from Bennett's formula
    Time azimuth:                Zn = atan2(−cos Dec sin LHA, sin Dec cos Lat − cos Dec sin Lat cos LHA)
    Hour angle:                  LHA = GHA + longitude (east positive)
    Compass error:               CE = true − compass (east positive)
    Deviation:                   dev = CE − variation

## Assumptions and limitations

- Amplitudes are taken with the body's centre on the celestial horizon, when the sun's lower limb is about half a diameter above the sea horizon; a visible-horizon option is provided.
- GHA and declination must be for the moment of the bearing.
- Bearings of bodies higher than about 30° are difficult to take accurately.
- Variation must be current; it changes by several minutes of arc a year.

## Worked example

Latitude 40° N, the sun's declination 20° N, sunrise. The sun's centre is on the celestial horizon when the compass bearing is 061.0°, and the chart shows 4° W variation.

1. sin A = sin 20° / cos 40° = 0.3420 / 0.7660 = 0.4465, so A = 26.5°.
2. The sun rises north of east: true bearing 090° − 26.5° = 063.5°, written E 26.5° N.
3. Compass error = 063.5° − 061.0° = 2.5° E. The compass reads low, so the error is east.
4. Deviation = 2.5° E − (4° W) = 6.5° E.

## FAQ

**When exactly do I take an amplitude?**
When the sun's centre is on the celestial horizon, about when its lower limb is half a diameter above the visible horizon. If you take it with the centre on the visible horizon, choose that option.

**Amplitude or azimuth?**
Amplitude needs no time or longitude and the bearing is easy to take at a low altitude, but it is available only twice a day. Time azimuth works whenever a body is visible and low enough to bear accurately.

**How do I remember the sign of the error?**
"Compass least, error east; compass best, error west." If the compass reads less than the true bearing, the error is easterly.

**Why does it fail near the poles?**
At high latitudes the sun rises at a shallow angle, so a small timing error is a large bearing error. For a body that is circumpolar or never rises there is no amplitude at all.

**Can I use a star or planet?**
Yes, with its own declination and GHA. Amplitudes of stars are rarely practical because faint bodies are hard to see on the horizon.

## Related calculators

- [Sight reduction](../sight-reduction/index.html) — the altitude and azimuth of a body for a position line.
- [Great-circle distance](../great-circle-distance/index.html) — courses that the compass must steer.
- [Course to steer with set and drift](../course-to-steer/index.html) — applying the corrected compass course.
- [Light, radar and VHF range](../light-range/index.html) — bearings of lights for position fixing.
