# Course to steer with set and drift calculator

**Summary:** Course to steer, speed over ground and passage time to make good a track through a current of known set and drift, with leeway.

## Introduction

A ship steering the course drawn on the chart does not follow it if the water itself is moving. To make good a track through a current the navigator offsets the heading towards the current's source by an angle whose sine is the cross-track current divided by the ship's speed, and accepts whatever the along-track component does to the speed over ground. This calculator solves that triangle: heading offset, course to steer, speed and time over the leg, the extra correction for leeway, and, for comparison, where the ship would end up if the current were ignored.

It is for deck officers and voyage planners, performance analysts separating current from hull performance in noon-report speeds, and students of navigation.

## Formulas

    C − T = current direction relative to the track
    cross = D sin(C − T)   (+ sets the ship to starboard),   along = D cos(C − T)   (+ following)
    sin δ = cross / S,   course to steer = T − δ   (+ leeway angle)
    SOG = S cos δ + along,   time = distance / SOG
    ignoring the current: CMG, SMG from the vector sum of S on T and D on C; cross-track error = |cross| × distance/S

Set is the direction the current flows towards; all directions true.

## Assumptions and limitations

- Uniform, steady current over the leg; tidal streams averaged over the passage hours or the leg split.
- Plane triangle, exact for coastal legs; apply per segment on ocean passages.
- Leeway entered as an angle, positive with the wind on the starboard side.
- The track cannot be made good if the cross current exceeds the ship's speed.

## Worked example

Required track 090°, ship speed 12 kn, current 2 kn setting 180° (flowing south), leg 120 nmi.

1. Relative set 90°: the whole current is cross-track, 2 kn to starboard; nothing along the track.
2. sin δ = 2/12 → δ = 9.6°; course to steer 080.4°.
3. SOG = 12 cos 9.6° = 11.83 kn; 120 nmi takes 10.14 h, 8 minutes more than in still water.
4. Steering 090° without allowance would make good 099.5° at 12.17 kn and put the ship 20 nmi south of the destination.

With a head current (set 270°) the heading is unchanged and SOG drops to 10 kn; with a following current it rises to 14 kn. Add 3° of leeway for a beam wind on the starboard side and the course to steer becomes 083.4°.

## FAQ

**Set towards or from?**
Towards. A current "setting 180°" flows south. Wind is named by where it comes from; this is the classic mix-up.

**Why does a beam current also slow the ship?**
Part of the ship's speed is spent cancelling the cross current, so only S cos δ is left along the track.

**How do I handle a tidal stream that changes during the passage?**
Use the mean vector over the passage hours from the tidal atlas, or split the leg into hourly segments and apply the triangle to each.

**What is leeway and how big is it?**
The downwind drift angle caused by wind on the hull and superstructure: under 1° for a loaded tanker in moderate wind, 3–5° for a light container ship or car carrier in a strong beam wind.

**Can the page tell me the current from observations?**
Indirectly: compare the course and speed made good with the heading and log speed; the difference vector is the set and drift (the "uncorrected" outputs in reverse).

**Why does performance analysis care?**
Speed over ground from GPS includes the current; hull performance needs speed through water, and the along-track current is the difference.

## Related calculators

- [Great-circle distance](../great-circle-distance/index.html) — the ocean leg distance and initial course.
- [Mercator (rhumb-line) sailing](../mercator-sailing/index.html) — constant-course legs.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — the tidal cycle that drives the stream.
- [Propeller slip](../propeller-slip/index.html) — speed through water from shaft revolutions.
- [Optimal speed under charter](../optimal-speed-charter/index.html) — the speed to set for the leg.
