# Propeller slip and speed through water calculator

**Summary:** Theoretical propeller speed, apparent and real slip, speed through water and speed of advance from pitch, RPM and observed speed.

## Introduction

A propeller is a screw. If it turned in a solid, each revolution would move the ship forward by one pitch, and pitch × revolutions would be the ship's speed. In water the ship moves less than that, and the shortfall, expressed as a percentage of the theoretical distance, is the slip. Watch officers and engineers log slip every noon because it is a cheap health check: a sudden change means a change in weather, current, fouling, propeller damage or a wrong speed input.

This calculator gives the theoretical speed from pitch and RPM, the apparent slip against observed speed over ground, the speed through water once a current is removed, and the real slip against the speed of advance when the wake fraction is known. In reverse it gives the ship speed you should expect from an assumed slip. Cadets use it for the slip question in every engine-log exercise; engineers use it to sanity-check noon reports.

## Formulas

Theoretical (engine) speed:

    Vₜ [kn] = P × N × 60 / 1852

- P — propeller pitch, m (mean face pitch)
- N — propeller revolutions per minute
- 1852 — metres per nautical mile, 60 — minutes per hour

Apparent slip (against observed speed over ground V):

    S_A [%] = (Vₜ − V) / Vₜ × 100

Speed through water (STW) with a current c along the track (positive following):

    STW = V − c

Slip through water:

    S_W [%] = (Vₜ − STW) / Vₜ × 100

Speed of advance and real slip, with Taylor wake fraction w:

    Vₐ = STW × (1 − w)
    S_R [%] = (Vₜ − Vₐ) / Vₜ × 100

Ship speed from an assumed apparent slip:

    V = Vₜ × (1 − S_A / 100)

Engine-log quantities:

    Engine distance per day   = Vₜ × 24      [nmi]
    Observed distance per day = V × 24       [nmi]
    Revolutions per mile      = N × 60 / V

## Assumptions and limitations

- Pitch is the mean face pitch of a fixed-pitch propeller. For a controllable-pitch propeller use the design pitch at the current setting; slip figures then only compare like with like.
- Apparent slip mixes propeller behaviour with current, wind, waves and the accuracy of the speed input. It is a trend indicator, not a measurement of propeller efficiency.
- Speed through water is taken as speed over ground minus a single along-track current. A cross current changes course made good but is ignored here. If you have a calibrated speed log, enter its reading as the observed speed and set the current to zero.
- The wake fraction is an input, not a prediction. Typical service values: single-screw 0.20–0.35, twin-screw 0.10–0.20. With w = 0 the real slip equals the slip through water.
- Negative apparent slip is physically normal with a following current or sea, when the hull is moving faster than the propeller advances through the water. The calculator reports it with a warning instead of refusing it.
- Revolutions per mile are referred to speed over ground, as kept in most engine logs.

## Worked example

Propeller pitch 6.0 m, 90 rpm, observed speed 14.0 knots over ground with a 2.0 knot following current. Wake fraction 0.25.

1. Theoretical speed: 6.0 × 90 × 60 / 1852 = 17.49 kn. Engine distance per day 419.9 nmi.
2. Apparent slip: (17.49 − 14.0) / 17.49 = 19.98 %.
3. Speed through water: 14.0 − 2.0 = 12.0 kn. Slip through water (17.49 − 12.0) / 17.49 = 31.4 %.
4. Speed of advance: 12.0 × (1 − 0.25) = 9.0 kn. Real slip (17.49 − 9.0) / 17.49 = 48.6 %.
5. Observed distance per day 336 nmi; revolutions per mile 90 × 60 / 14 = 385.7.

Reverse check: with 10 % apparent slip at the same pitch and RPM, the expected speed is 17.49 × 0.90 = 15.74 kn.

## FAQ

**Why is my slip higher in ballast than loaded?**
In ballast the propeller is nearer the surface and the wake field changes; the ship is also more affected by wind. A few percent difference between conditions is normal for the same ship.

**What is a normal apparent slip?**
In calm water with a clean hull, 5–15 % for most merchant ships. Values above 25–30 % sustained in good weather point to fouling, propeller damage or an optimistic speed figure.

**Can slip be negative?**
Yes. A strong following current or following sea pushes the hull faster than the propeller advances through the water. The slip then comes out negative; the calculator flags it.

**What is the difference between apparent and real slip?**
Apparent slip uses the ship's speed over ground. Real slip uses the speed of advance, the water speed actually seen by the propeller after the hull's wake slows it down. Real slip is always higher and is the one that relates to propeller loading.

**Where do I find the wake fraction?**
In the model-test report or propeller design documentation. If you have none, the Taylor estimate for single-screw ships is w ≈ 0.5 × C_B − 0.05, where C_B is the block coefficient.

**How do I get pitch for a controllable-pitch propeller?**
Use the pitch corresponding to the current lever setting from the CPP calibration curve, or the design pitch when in combinator mode at full setting.

**Does propeller slip tell me the propeller efficiency?**
Not directly. Efficiency depends on the advance ratio and the open-water characteristics. Slip is a proxy: at a fixed pitch ratio, higher real slip means a more heavily loaded propeller working at lower efficiency.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — turn the speed into passage time and fuel.
- [Admiralty coefficient and speed–power scaling](../admiralty-coefficient/index.html) — power needed at the observed speed.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torque behind the measured RPM.
- [Great-circle and rhumb-line distance](../great-circle-distance/index.html) — distance run between fixes for the observed speed.
