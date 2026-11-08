# Propeller curve and light running margin calculator

**Summary:** Engine SMCR from the propeller design point with sea, engine and light running margins, the propeller curves, and the heavy running of a measured point.

## Introduction

A fixed pitch propeller absorbs power roughly in proportion to the cube of its rpm. Fouling, wind, waves and a deeper draft make it "heavy": it needs more torque for the same rpm, and the engine can run into its torque limit. To leave room for that, the engine is laid out on a heavier propeller curve than the clean-hull curve used to design the propeller: the light running margin. This calculator follows the Everllence (MAN) layout method from the propeller design point, adds the sea and engine margins, places the specified MCR, and draws the light and heavy propeller curves. It also shows how much of the light running margin a measured service point has used up.

It is for project engineers matching an engine to a propeller, superintendents checking whether a ship is running heavy, and performance analysts relating rpm to fouling.

## Formulas

    Propeller law:               P = c n³
    SMCR power (eq. 2.01.01):    P_M = P_PD (100 + SM) / (100 − EM)
    SMCR speed (eq. 2.01.02):    n_M = n_PD (P_M / P_PD)^(1/3) (1 − LRM/100)
    Light curve (line 6):        n_light(P) = n_PD (P / P_PD)^(1/3)
    Layout curve (lines 1, 2):   n_layout(P) = n_M (P / P_M)^(1/3)
    Service point:               P_SP = P_M (1 − EM/100) on the layout curve
    Heavy running:               1 − n / n_light(P)
    Margin to the layout curve:  n / n_layout(P) − 1

- PD — propeller design point (design speed, clean hull, calm weather); SM, EM, LRM — sea, engine and light running margins in percent.

## Assumptions and limitations

- Fixed pitch propeller at a constant advance ratio, so power follows the cube of the rpm.
- The light curve is for the design draft; a ballast ship runs lighter.
- Everllence recommends a light running margin of 4–7 %, up to 10 % in special cases; the sea margin is traditionally about 15 % and the engine margin 10–15 %.
- The light curve rpm at full power should not exceed 110 % of the SMCR rpm on sea trial (line 9).
- The torque/speed limit, barred speed ranges and the L1 rating need the engine's own data.

## Worked example

The propeller design point is 7000 kW at 80 rpm. The margins are 15 % sea, 10 % engine and 5 % light running.

1. SMCR power: 7000 × 115 / 90 = 8944 kW.
2. SMCR speed: 80 × (8944 / 7000)^(1/3) × 0.95 = 82.47 rpm.
3. Service propulsion point: 90 % of SMCR, 8050 kW, at 82.47 × 0.9^(1/3) = 79.62 rpm on the layout curve.
4. On sea trial the clean ship reaches 80 × (8944 / 7000)^(1/3) = 86.81 rpm at full power, 105.3 % of the SMCR speed and within the 110 % limit.
5. A measured service point of 7500 kW at 80.0 rpm is 2.3 % below the light curve (81.86 rpm). It is still 2.9 % to the right of the layout curve (77.77 rpm), so less than half of the margin is used.

## FAQ

**Why lay out the engine on a heavier curve than the propeller?**
In service the hull and propeller foul and the weather adds resistance, so the propeller needs more torque at a given rpm. Without a light running margin the engine would reach its torque limit before its rated power, and the ship could not use the full power when it needs it.

**How much light running margin should I use?**
Normally 4–7 %. The higher end, up to 10 %, suits ships that often meet adverse weather, full-bodied ships with blunt bows, ships with shaft generators and ice-classed ships.

**What is the difference between the sea margin and the light running margin?**
The sea margin is extra power to keep the service speed in average weather. The light running margin is an rpm margin that keeps that power available when the propeller runs heavy.

**How do I read the heavy running of a measured point?**
It is the rpm deficit against the clean-hull curve at the same power. A rising value at the same draft and calm weather points to hull or propeller fouling. When it reaches the light running margin, the ship is running on the engine layout curve.

**Why does the ship reach more than 100 % rpm on sea trial?**
Because the clean propeller is light by design: at full power it turns 1 / (1 − LRM) times faster than the layout curve allows for. The standard load diagram accepts up to 110 % of the SMCR rpm on trial.

**Does this apply to controllable pitch propellers?**
Only along a fixed-pitch line or a combinator curve chosen with the same margins. Everllence recommends combinator curves that respect the fixed-pitch light running margin.

## Related calculators

- [Propeller slip and speed through water](../propeller-slip/index.html) — apparent slip from the pitch and the rpm.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torque from power and rpm.
- [Engine BMEP, torque and power](../engine-bmep/index.html) — mean effective pressure from power and rpm.
- [Speed–power curve fit](../speed-power-fit/index.html) — the ship's power against a reference curve.
- [Wageningen B-series propeller](../propeller-bseries/index.html) — open-water characteristics of the propeller.
