# Weir and flume flow calculator

**Summary:** Flow over rectangular (Francis), 90° V-notch and Cipolletti weirs and through Parshall flumes from the measured head, with USBR limits.

## Introduction

How do you measure flow with a weir? Read the head, the height of the water surface above the crest, and put it in the weir's equation. Flow rises with the head to a power of 1.5 for a rectangular weir and about 2.5 for a V-notch. A rectangular weir with a 2 ft crest and end contractions passes 2.24 ft³/s at a head of 0.5 ft. A 90° V-notch at the same head passes 0.446 ft³/s, or 200 US gpm.

This calculator gives the flow over sharp-crested rectangular, 90° V-notch and Cipolletti weirs, and through Parshall flumes from 1 in to 8 ft. It uses the equations and limits of the US Bureau of Reclamation Water Measurement Manual and refuses heads outside their range. It is for irrigation managers, water and wastewater operators, and engineers checking a gauging station.

## Formulas

Sharp-crested weirs, head H and crest length L in feet, flow in ft³/s:

    rectangular (Francis):   Q = 3.33 (L − 0.1 n H) H^1.5
    90° V-notch (Cone):      Q = 2.49 H^2.48
    Cipolletti:              Q = 3.367 L H^1.5

Parshall flume, upstream head H_a in feet:

    Q = C × H_a^n                      (1 in to 1 ft, USBR Table 8-6)
    Q = 4 W × H_a^(1.522 W^0.026)      (2 to 8 ft)

- n — number of end contractions: 2 for a notch narrower than the channel, 0 for a suppressed weir across the full width
- W — throat width of the flume in feet
- C, n — 0.338 and 1.55 for 1 in; 0.676 and 1.55 for 2 in; 0.992 and 1.55 for 3 in; 2.06 and 1.58 for 6 in; 3.07 and 1.53 for 9 in; 3.95 and 1.55 for 1 ft
- metric inputs are converted to feet; 1 ft³/s = 28.32 L/s = 448.8 US gpm

## Assumptions and limitations

- The nappe springs clear of a thin, sharp crest and is aerated underneath. A clinging or submerged nappe passes more water than calculated.
- Measure the head in still water at least four heads upstream of the crest. Read a flume at its standard gauge point in the converging section.
- Weirs need a crest height and side clearances of at least twice the head. The equations neglect the approach velocity.
- Valid heads: at least 0.2 ft (61 mm) on weirs; at most a third of the crest length on contracted and Cipolletti weirs; at most 1.25 ft on the V-notch; and the range of the USBR free-flow table for each flume.
- A flume runs free while the downstream head stays below 50 % of the upstream head for 1 to 3 in throats, 60 % for 6 and 9 in, and 70 % for 1 to 8 ft. Above that, USBR submergence corrections are needed.

## Worked example

A rectangular weir with a 2 ft crest and two end contractions sits 1.5 ft above the channel bed. The head over the crest is 0.5 ft. What is the flow?

1. Check the limits: 0.5 ft is above 0.2 ft and below 2 / 3 = 0.67 ft. The crest height of 1.5 ft is more than twice the head.
2. Effective crest length: 2 − 0.1 × 2 × 0.5 = 1.9 ft.
3. Head term: 0.5^1.5 = 0.3536.
4. Flow: 3.33 × 1.9 × 0.3536 = 2.24 ft³/s.
5. In other units: 63.3 L/s, or 1 004 US gpm.

Without end contractions the same weir would pass 2.35 ft³/s. A Cipolletti weir of the same length passes 2.38 ft³/s.

## FAQ

**How much flow does a 90° V-notch pass?**
At 0.5 ft of head, 0.446 ft³/s or 200 US gpm. At 100 mm of head, 4.45 L/s.

**When should I use a V-notch instead of a rectangular weir?**
For small flows. USBR recommends the 90° V-notch for about 0.05 to 4.25 ft³/s, where its head is large enough to read accurately.

**What is the difference between contracted and suppressed weirs?**
A contracted weir is narrower than the channel, so the flow squeezes in at each end. A suppressed weir spans the full width and needs air under the nappe.

**Why does a Cipolletti weir have sloping sides?**
The 1 : 4 side slopes add about as much flow as the end contractions take away. The flow is then simply proportional to the crest length.

**How much does a 3 in Parshall flume carry?**
At 0.5 ft of head, 0.339 ft³/s or 152 US gpm, by the USBR equation Q = 0.992 H_a^1.55.

**How accurate are weirs and flumes?**
About ±5 % for well-built standard weirs and ±3 to 5 % for Parshall flumes, plus the error of the head reading.

## Related calculators

- [Open-channel flow (Manning)](../manning-channel-flow/index.html) — depth and velocity in the channel upstream of the weir.
- [Culvert capacity and headwater calculator (HDS-5)](../culvert-capacity/index.html) — headwater at a road culvert.
- [Orifice and venturi flow (ISO 5167)](../orifice-flow/index.html) — flow measurement in closed pipes.
- [Drain pipe size calculator (Manning)](../drain-pipe-size/index.html) — gravity pipes downstream of the measuring point.
