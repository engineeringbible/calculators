# Cargo ventilation and dew point calculator

**Summary:** Dew point and humidity from dry and wet bulb, ventilate-or-not decision by the three-degree and dew-point rules, condensation risk.

## Introduction

Most moisture damage to cargo is self-inflicted: a hold ventilated with warm, humid air over a cargo loaded in a cold port, or left closed while the ship's steel cools in northern waters and sweats onto the stow. The decision whether to open the vents comes down to dew points, which is why every bridge keeps a whirling psychrometer and a ventilation log. This calculator converts the dry- and wet-bulb readings of the outside air and the hold into vapour pressure, relative humidity, dew point and humidity ratio, applies the two rules the P&I clubs teach (the dew-point rule for every cargo and the three-degree rule for hygroscopic ones), and flags the two kinds of sweat against the steel and cargo temperatures.

It is for deck officers making the watch-by-watch decision, cargo surveyors reconstructing a claim from the log, and students of cargo work.

## Formulas

Saturation vapour pressure (Magnus, Alduchov–Eskridge), hPa:

    e_s(T) = 6.1094 exp(17.625 T / (T + 243.04))

Psychrometer (Sprung):

    e = e_s(T_wet) − A p (T_dry − T_wet)       A = 6.62·10⁻⁴ K⁻¹ aspirated/whirling, 8.0·10⁻⁴ K⁻¹ non-ventilated
    RH = e / e_s(T_dry),   T_dew = 243.04 ln(e/6.1094) / (17.625 − ln(e/6.1094)),   W = 622 e / (p − e)  g/kg

Rules:

    dew-point rule:     ventilate if T_dew,outside < T_dew,hold
    three-degree rule:  ventilate hygroscopic cargo if T_dry,outside ≤ T_cargo at loading − 3 K
    ship sweat:         T_dew,hold > T_steel          cargo sweat (if ventilating): T_dew,outside > T_cargo

## Assumptions and limitations

- Magnus is accurate to about 0.4 % between −40 and +50 °C over water; no ice-bulb correction.
- The psychrometer coefficient assumes a properly wetted and ventilated wet bulb; a dry wick or a stagnant screen reads high.
- Steel temperature is approximated by the sea or deck temperature entered; hatch covers under sun or frost differ.
- The rules are decision aids from club guidance; the master decides, and the readings and decisions should be logged every watch.
- Cargoes needing special regimes (fumigated holds, coal, some ores) follow their own instructions.

## Worked example

A bulk carrier with bagged rice loaded at an average 18 °C, now in warmer waters: outside air 25 °C dry / 20 °C wet bulb, hold air 22 / 20 °C, sea water 16 °C, barometer 1013 hPa.

1. Outside: e = 23.3 − 0.000662 × 1013 × 5 = 20.0 hPa, RH 63 %, dew point 17.5 °C, 12.5 g/kg.
2. Hold: e = 23.3 − 0.000662 × 1013 × 2 = 22.0 hPa, RH 83 %, dew point 19.0 °C.
3. Dew-point rule: outside 17.5 °C is 1.5 K below the hold's 19.0 °C: ventilation would dry the hold. Three-degree rule: outside air at 25 °C is 7 K warmer than the cargo: fails.
4. Advice for a hygroscopic cargo: do not ventilate on the three-degree rule (warm air over cool rice would deposit moisture on the cargo); keep the vents closed and record the decision.
5. Sweat: hold dew point 19 °C above the 16 °C steel: ship sweat is forming on the frames and hatch covers; the remedy is drier air, which only a later cooler, drier airmass can provide.

The same ship with steel cargo (non-hygroscopic) would ventilate on the dew-point rule alone.

## FAQ

**Why two rules?**
The dew-point rule protects the ship's steel; the three-degree rule protects a cargo that is colder than the air. Hygroscopic cargo breathes its own moisture into the hold air, so the hold dew point is usually high and the dew-point rule alone would say "ventilate" even when the air admitted is warm enough to sweat onto the cargo.

**What is cargo sweat and what is ship sweat?**
Cargo sweat: condensation on the cargo when warm, moist air meets a cold cargo (voyages from cold to warm). Ship sweat: condensation on the ship's structure when warm, moist hold air meets cold steel (voyages from warm to cold).

**How accurate must the readings be?**
To about half a degree. Near saturation a 0.5 K error in the wet bulb moves the dew point by a similar amount; keep the wick clean and wet and whirl the instrument properly.

**Can I use a digital hygrometer in the hold?**
Yes, enter dry bulb and RH; check its calibration regularly, dust and salt drift the sensors.

**Should I ventilate at night?**
Often yes: the outside dry bulb drops at night while its dew point barely changes, so the three-degree rule may become satisfied; re-check each watch.

**Does barometric pressure matter?**
Slightly: the psychrometer term scales with pressure and the humidity ratio with 1/(p − e); a few hPa change the dew point by hundredths of a degree.

**What should the log contain?**
Outside and hold dry/wet bulb or RH, dew points, sea temperature, the cargo temperature at loading, the decision and the reason, every watch; it is the first thing a surveyor asks for.

## Related calculators

- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — weather for the ventilation plan.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — port timing when hatches must stay closed.
- [Fuel blending and heating viscosity](../fuel-blend-heating/index.html) — another on-board temperature decision.
- [Engineering unit converter](../unit-converter/index.html) — °F readings and grains per pound.
