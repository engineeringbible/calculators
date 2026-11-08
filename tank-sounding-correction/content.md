# Tank sounding trim and heel correction calculator

**Summary:** Corrected sounding or ullage of a rectangular tank for trim and heel at an off-centre sounding pipe, with volume, mass and the wedge check.

## Introduction

A sounding pipe sits where the structure allows, usually in an aft corner of the tank, and it measures the liquid depth there, not at the tank's centre. When the ship is trimmed by the stern the aft corner is deeper than the mean; when she heels, the low side is deeper. The ship's sounding tables carry correction columns for round values of trim and heel; this calculator computes the same corrections for any trim, heel and pipe position in a box-shaped tank, gives the corrected mean depth, volume and mass, and checks that the liquid surface stays within the tank, because once it touches the bottom or the top the simple formula no longer holds and the wedge tables take over.

It is for engineers and officers taking bunker and ballast soundings, surveyors doing bunker and draught surveys, and students of ship stability.

## Formulas

    depth at pipe = sounding   (or H − ullage)
    trim correction = (L/2 − x_p) × trim / L_BP          (+ when the pipe is aft of centre and the ship trims by the stern)
    heel correction = y_p × tan(heel)                     (+ when the pipe is on the low side)
    mean depth = depth at pipe − trim correction − heel correction
    surface range = mean ± (L/2)|trim/L_BP| ± (B/2)|tan heel|   → must stay within [0, H]
    volume = L B × mean depth,   mass = volume × density

## Assumptions and limitations

- Box-shaped tank with a horizontal liquid surface; exact for prismatic tanks, approximate elsewhere.
- Surface fully inside the tank; otherwise the calibration tables' wedge corrections apply.
- Pipe datum included in the height entered; density at tank temperature (VCF from the bunker-quantity calculator).

## Worked example

A fuel oil tank 20 m long, 15 m wide and 12 m high; sounding pipe 1 m forward of the aft bulkhead and 6 m to starboard of the centreline; ship trimmed 1.0 m by the stern on L_BP 180 m and heeled 1° to starboard; sounding 6.00 m; density 0.98 t/m³.

1. Trim correction (10 − 1) × 1.0/180 = 0.050 m: the aft pipe reads 5 cm more than the mean.
2. Heel correction 6 × tan 1° = 0.105 m: the starboard pipe reads another 10 cm more.
3. Mean depth 6.00 − 0.050 − 0.105 = 5.845 m; the surface ranges from 5.66 to 6.03 m, inside the tank.
4. Volume 300 × 5.845 = 1 754 m³ against 1 800 m³ uncorrected (−2.6 %); mass 1 718 t; 49 % full.

With the ship heeled 1° to port instead, the starboard pipe is on the high side and the mean depth is 6.055 m: the same reading, 63 m³ more oil.

## FAQ

**Which way is the correction applied?**
Subtract from the reading when the pipe is at the deeper end or side (aft of centre with stern trim, on the low side with heel); the page handles the signs from the positions and angles entered.

**Why does the pipe position matter so much?**
The correction is the pipe's distance from the centre times the slope; a pipe in the far corner of a long tank can read several centimetres off for a modest trim, and in bunker surveys each centimetre is tonnes.

**When do the wedge formulas apply?**
When the liquid surface reaches the bottom at one end (nearly empty tank with trim) or the top at one side (pressed-up tank with heel); the page flags it.

**Do the tables already include this?**
Yes, for the tabulated trims and heels; this calculator interpolates exactly and handles combinations the tables may not list.

**Does it work for ullages?**
Yes; the ullage is converted to a sounding with the tank height at the pipe, so the datum height must be included.

**What about the free surface effect?**
That is a stability matter (initial-stability calculator); here the inclined surface only changes where the pipe reads.

## Related calculators

- [Tank volume and partial fill](../tank-volume/index.html) — cylindrical and other tank shapes.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — temperature correction of the mass.
- [Draft survey](../draft-survey/index.html) — the same trim corrections applied to draughts.
- [Hydrostatics](../hydrostatics/index.html) — trim and displacement of the ship.
- [Fuel blend viscosity and heating](../fuel-blend-heating/index.html) — the fuel in the tank.
