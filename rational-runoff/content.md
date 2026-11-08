# Rational-method runoff calculator

**Summary:** Design peak runoff from catchment area, runoff coefficient and rainfall intensity, with time of concentration (Kirpich).

## Introduction

The rational method is the oldest and still the most used way to size a storm drain, a culvert or a yard drainage channel: the peak flow equals the fraction of rain that runs off, times the rainfall intensity, times the area, with the intensity taken for a storm just long enough for the whole catchment to contribute (the time of concentration). This calculator builds the composite runoff coefficient from up to three surfaces, estimates the time of concentration with Kirpich's formula, takes the intensity from your IDF curve or a fitted relation, applies the frequency factor for rare storms and returns the peak flow, the runoff depth and volume, and whether the catchment is small enough for the method.

It is for civil and port engineers draining quays, terminals and yards, for naval architects checking deck and dock drainage, and for students of hydrology; the Manning calculator sizes the channel that carries the result.

## Formulas

    C = Σ C_k A_k / Σ A_k                    composite runoff coefficient
    t_c = 0.0195 L^0.77 S^−0.385  [min]      Kirpich (L m, S m/m); design duration = max(t_c, minimum)
    i = a / (t_c + b)^n                       optional IDF fit (mm/h), else the IDF-curve value at t_c
    Q = C C_f i A / 360   [m³/s]              i mm/h, A ha, C C_f ≤ 1
    depth = C C_f i t_c,   volume = depth × A

Runoff coefficients (2–10 year storms): roofs 0.90, pavement 0.85, industrial 0.75, gravel 0.50, residential 0.40, lawns 0.10–0.30, woodland 0.15. Frequency factor C_f: 1.0 up to 10 years, 1.1 (25), 1.2 (50), 1.25 (100).

## Assumptions and limitations

- Small catchments (under about 80 ha) with uniform rainfall over the whole area for at least t_c; peaks only, no hydrograph, storage or routing.
- Kirpich was derived for small rural catchments with channels; on short paved paths it gives very short times, hence the 5–10 min minimum.
- Coefficients and frequency factors are typical; the local drainage manual, soil saturation and slope govern.
- Tidal backwater at outfalls, snowmelt and infiltration during the storm are outside the method.

## Worked example

A port yard of 6 ha: 2 ha of asphalt, 1 ha of roofs and 3 ha of grass; longest flow path 500 m at 2 %; 10-year IDF curve gives 100 mm/h for the resulting duration.

1. C = (2 × 0.85 + 1 × 0.90 + 3 × 0.10)/6 = 0.483; 50 % of the area is impervious.
2. Kirpich: t_c = 0.0195 × 500^0.77 × 0.02^−0.385 = 10.5 min (above the 5 min minimum).
3. Q = 0.483 × 100 × 6/360 = 0.81 m³/s, i.e. 134 L/s per hectare; depth 8.5 mm over the storm, volume 507 m³.
4. For a 100-year check with the same intensity curve at that return period, C_f = 1.25 raises the coefficient to 0.60.

The published Houston example (C 0.57, 4.2 in/h, 15 acres) gives 1.025 m³/s here, 36.2 cfs against the US-units answer of 35.9 cfs: the 0.8 % difference is the 1.008 factor that the acre-inch-per-hour form rounds away.

## FAQ

**Why intensity at the time of concentration?**
Shorter storms are more intense but do not let the whole catchment contribute; longer ones are weaker. The peak occurs when the duration just equals t_c.

**Where do I get the intensity?**
From the local intensity-duration-frequency curves (national meteorological service, drainage authority) at the design return period and a duration equal to t_c; or fit a/(t + b)^n to them and let the page evaluate it.

**What runoff coefficient for a mixed site?**
Weight each surface's coefficient by its area; the calculator does this for three surfaces and reports the impervious share.

**Why a minimum time of concentration?**
Kirpich can give one or two minutes on a short paved slope, implying unrealistically intense rain; manuals impose 5–10 minutes as a practical floor.

**Can I use this for a 200 ha catchment?**
No; above about 80 ha the assumptions of uniform rain and a single peak fail. Use a hydrograph method (NRCS/SCS, kinematic wave) and routing.

**How do I size the drain?**
Take Q to the Manning open-channel calculator (or a pipe-flow check for a pipe running full) at the available slope.

**Does the frequency factor apply to the intensity too?**
No: the intensity already comes from the chosen return period; C_f accounts for the catchment running off more efficiently in rare, saturating storms.

## Related calculators

- [Open-channel flow (Manning)](../manning-channel-flow/index.html) — the channel or culvert for the peak flow.
- [Earthwork cut and fill volumes](../earthwork-volume/index.html) — the drainage excavation.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — channel linings.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — outfall water levels.
