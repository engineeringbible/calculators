# Surface finish converter (Ra, RMS, Rz, N grades)

**Summary:** Convert surface roughness between Ra in µm and µin, RMS, Rz and ISO N grades, and the theoretical turning finish from feed and nose radius.

## Introduction

Surface roughness is the fine texture a machining process leaves. The most common measure is Ra, the average height of the profile from its centre line. Drawings in the US give it in microinches, metric drawings in micrometres. An Ra of 63 µin is 1.6 µm, which is grade N7 in the old ISO numbering. RMS is a slightly larger average, about 1.11 × Ra.

This calculator converts a roughness value between Ra in µm and µin, RMS (Rq), an estimate of Rz and the N grade numbers. It also gives the theoretical finish of a turned surface from the feed and the tool nose radius. It is for machinists, inspectors and designers reading drawings from both systems.

## Formulas

Conversions:

    Ra [µin] = Ra [µm] × 39.37
    Rq ≈ 1.11 × Ra          (sine profile: Rq/Ra = π / (2√2))
    Rz ≈ 4 × Ra             (triangular profile)

Grade numbers (ISO 1302, previous edition):

    N1 = 0.025 µm, N2 = 0.05, … N7 = 1.6, N8 = 3.2, N9 = 6.3 … N12 = 50 µm

Theoretical turning finish:

    R_t = f² / (8 r)
    Ra = f² / (18√3 r) ≈ 0.0321 f² / r

- Ra — arithmetic mean roughness; Rq — root mean square roughness (RMS)
- Rz — maximum height of the profile; R_t — peak-to-valley height of the ideal turned profile
- f — feed per revolution; r — tool nose radius

## Assumptions and limitations

- Ra, RMS and Rz measure different things. Their ratios depend on the shape of the profile, so converted RMS and Rz values are estimates.
- The RMS factor 1.11 is exact for a sine wave. The Rz factor 4 is exact for a regular triangular profile. An ideal turned profile has an Rz to Ra ratio of 3.9.
- Grade numbers are the previous ISO 1302 grades. The current standard writes the Ra value itself on the drawing, but many shops still use N grades.
- The turning formula is the geometric ideal for a round-nosed tool. Tool wear, built-up edge, chatter and soft, tearing materials make the real finish rougher.
- The nose must form the whole surface, so the feed must be smaller than twice the nose radius. Above the nose radius, a warning shows.

## Worked example

A part is turned at a feed of 0.2 mm/rev with a 0.8 mm nose radius insert. What finish can it reach?

1. Peak-to-valley height: 0.2² / (8 × 0.8) = 0.04 / 6.4 = 6.25 µm.
2. Ra: 0.04 / (31.18 × 0.8) = 1.60 µm.
3. In microinches: 1.60 × 39.37 = 63.1 µin.
4. RMS: 1.60 × 1.11 = 1.78 µm.
5. Nearest grade: N7.

Halving the feed to 0.1 mm/rev would cut the theoretical Ra to a quarter, 0.40 µm.

## FAQ

**How do I convert Ra from µm to µin?**
Multiply by 39.37. 0.8 µm is 31.5 µin, usually written as 32 µin on drawings.

**Is RMS the same as Ra?**
No. RMS weights high peaks more, so it is about 11 % higher than Ra for a regular profile.

**How do I convert Ra to Rz?**
Only approximately. A factor of about 4 suits regular machined profiles, but the true ratio depends on the surface. Measure Rz when the drawing asks for it.

**What does N7 mean on a drawing?**
It is the old ISO grade for Ra 1.6 µm, or 63 µin. Each step up roughly doubles the roughness.

**How do I get a better finish when turning?**
Use a larger nose radius or a smaller feed: Ra falls with the feed squared and rises with one over the radius. A sharp tool and enough cutting speed avoid built-up edge.

**Why is my measured finish rougher than the formula?**
The formula is the ideal geometry only. Tool wear, vibration, built-up edge and the material tearing add to it.

## Related calculators

- [Speeds and feeds calculator](../speeds-feeds/index.html) — the feed and speed of the cut.
- [Chip load calculator](../chip-load/index.html) — milling feed per tooth.
- [Machining time calculator](../machining-time/index.html) — the time a finishing pass takes.
- [Tolerance stack-up](../tolerance-stack/index.html) — tolerances of the parts being finished.
