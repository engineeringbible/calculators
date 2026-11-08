# Air draft and bridge clearance calculator

**Summary:** Clearance under a bridge or power cable from the charted clearance, tide, the ship's air draft at its actual draft and trim, and the allowances.

## Introduction

Bridge strikes and power-cable contacts happen when the charted clearance, the tide and the ship's actual air draft are not brought to the same reference. Charted clearances are measured from a high-water datum, tides from chart datum, and the ship's air draft changes with its draft and trim. This calculator puts them together: the real clearance over the water at the predicted tide, the air draft at the draft of the highest point, the margin after allowances for motion and electrical safety, and the highest tide at which the passage still keeps the required margin.

It is for masters, pilots and passage planners preparing river and port transits, and for anyone checking a vessel's suitability for a berth behind a bridge.

## Formulas

    Clearance above water   = charted clearance + (clearance datum − chart datum) − height of tide
    Draft at the mast       = T_aft + (T_fwd − T_aft) · x / L_BP
    Air draft               = height of the highest point above the keel − draft at the mast (− squat credit)
    Gross clearance         = clearance above water − air draft
    Net margin              = gross clearance − motion allowance − electrical safety distance
    Highest permissible tide = charted clearance + datum − air draft − allowances − required margin

- x — position of the highest point forward of the aft perpendicular; L_BP — length between perpendiculars.

## Assumptions and limitations

- The datum of the charted clearance must be checked on the chart in use: HAT, MHWS or MHW.
- Squat is credited only if chosen.
- One allowance covers pitch, heave, roll and tide uncertainty; storm surges are not predicted.
- Power cables need an extra electrical safety distance and sag more when hot.

## Worked example

A bridge has 45.0 m clearance above HAT, and HAT is 5.6 m above chart datum. The predicted tide is 2.5 m. The ship's radar mast reaches 56.0 m above the keel at 150 m forward of the aft perpendicular, the ship is 280 m between perpendiculars and floats at 11.5 m forward and 12.5 m aft.

1. Clearance above the water: 45.0 + 5.6 − 2.5 = 48.1 m.
2. Draft at the mast: 12.5 + (11.5 − 12.5) × 150/280 = 11.96 m; air draft 56.0 − 11.96 = 44.04 m.
3. Gross clearance 4.06 m; after a 0.5 m motion allowance the net margin is 3.56 m, above the 2 m required.
4. The passage keeps the 2 m margin until the tide rises above 4.06 m on chart datum.

## FAQ

**Why is the clearance not simply the charted figure?**
The chart gives it above a high-water datum. When the tide is lower than that datum the clearance is larger; when it is higher, as with HAT-based figures only at extreme tides, it is smaller.

**Why does trim matter?**
A ship trimmed by the stern sits deeper aft; a mast near the bow then stands higher than the mean draft suggests.

**Should I count squat?**
Usually not. Squat depends on speed, and a ship that slows down under the bridge loses it at the worst moment.

**What about power cables?**
Add the electrical safety distance specified by the cable owner or port; arcing can occur without contact. Cables also sag in hot weather.

**What margin is usual?**
Port rules and company procedures vary; 1–2 m, or a percentage of the air draft, is typical.

## Related calculators

- [Tidal height](../tidal-height/index.html) — the tide at the time of the passage.
- [Ship squat](../ship-squat/index.html) — the sinkage at speed.
- [Hydrostatics](../hydrostatics/index.html) — drafts and trim of the loading condition.
- [Light, radar and VHF range](../light-range/index.html) — heights and horizons on the bridge.
