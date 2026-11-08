# Admiralty coefficient and speed–power scaling calculator

**Summary:** Admiralty and fuel coefficients from a known point, then power or speed at a new displacement and speed with the cube (or chosen) law, and the fuel per day and per mile.

## Introduction

How much power does the ship need at 12 knots instead of 14, or in ballast instead of loaded? Before model tests and CFD, the Admiralty coefficient answered that with one number: A_c = Δ^(2/3) V³ / P stays roughly constant for the same ship over a moderate range of speed and displacement. It still does the job for quick estimates: speed reductions for fuel saving, power available after a derating, consumption in a different loading condition. This calculator computes the coefficient and the legacy fuel coefficient from a known point, scales power or speed to a new condition with the cube law or a chosen exponent, and shows the consequence in fuel per day and per nautical mile.

It is for superintendents and operators estimating the effect of slow steaming, charterers checking speed–consumption claims, and students meeting the first powering rule of thumb.

## Formulas

Admiralty coefficient and fuel coefficient at the known point:

    A_c = Δ₁^(2/3) V₁³ / P₁
    F_c = Δ₁^(2/3) V₁³ / (fuel per day)₁

Scaling to a new condition (n = speed exponent, default 3):

    P₂ = P₁ (Δ₂/Δ₁)^(2/3) (V₂/V₁)^n
    V₂ = V₁ [ (P₂/P₁) (Δ₁/Δ₂)^(2/3) ]^(1/n)

Fuel at constant SFOC:

    fuel per day [t/day] = P × SFOC × 24 / 10⁶
    fuel per mile [kg/nmi] = P × SFOC / (1000 V)

- Δ — displacement, t; V — speed, kn; P — shaft or brake power, kW; SFOC — specific fuel consumption, g/kWh

With n = 3 and constant displacement, fuel per day scales with V³ and fuel per mile with V².

## Assumptions and limitations

- Similarity rule for the same ship (or near sisters) at similar speed–length ratios: calm water, same hull and propeller condition, same propulsive efficiency.
- The 2/3 power on displacement reflects wetted surface only; trim, draft-dependent wave resistance and propeller immersion are ignored, so ballast-condition estimates are rough.
- The exponent n = 3 is a teaching idealisation. Resistance curves bend: n is often 3.2–3.5 for faster ships and rises steeply as the hull speed is approached. Keep speed changes within ±15–20 % of the known point, or use a measured exponent.
- SFOC is held constant; below about 50 % load it rises by 5–10 %, so low-power fuel figures are optimistic.
- Weather, fouling and shallow water are not included; the known point should be a clean-hull, calm-water reference.
- The fuel coefficient depends on SFOC and fuel calorific value and is only comparable between ships burning similar fuel.

## Worked example

Known point: Δ = 47 232 t, V = 14.0 kn, P = 8 000 kW, SFOC 175 g/kWh.

1. Admiralty coefficient: 47 232^(2/3) = 1 307; × 14³ = 2 744 → 3 585 000 / 8 000 = 448.
2. Fuel per day at the known point: 8 000 × 175 × 24 / 10⁶ = 33.6 t/day; fuel coefficient 3 585 000 / 33.6 ≈ 106 700.
3. Slow steaming to 12 kn at the same displacement (n = 3): P₂ = 8 000 × (12/14)³ = 5 038 kW; fuel 21.2 t/day; fuel per mile 73.5 kg/nmi against 100 kg/nmi, a 26.5 % saving per mile (the square of 12/14).
4. With n = 3.5 the same speed needs 4 665 kW: the exponent matters.
5. Ballast at 40 000 t and 14 kn: P₂ = 8 000 × (40 000 / 47 232)^(2/3) = 7 161 kW.
6. Power limited to 6 000 kW at 47 232 t: V₂ = 14 × (6 000 / 8 000)^(1/3) = 12.7 kn.

## FAQ

**What is a normal Admiralty coefficient?**
Roughly 350–600 for merchant ships at service speed; higher means a more efficient hull–propeller combination at that speed. A value far outside that range usually means a unit error (power in W, speed in m/s).

**Why does fuel per mile fall with the square of speed but fuel per day with the cube?**
Power (and fuel per day) scales with V³; a mile takes 1/V of the time, so fuel per mile scales with V². That is the basis of slow-steaming economics.

**Can I compare two different ships with the coefficient?**
Only loosely, and only at similar Froude numbers. It was designed for comparing similar warships; for different hull forms the coefficient varies with speed and size.

**Which power do I enter?**
Shaft or brake power consistently with the SFOC basis. Mixing brake power with a shaft-based SFOC introduces the gearbox and shaft losses as an error.

**How do I find the speed exponent for my ship?**
From two trusted noon reports or trial points at the same displacement and weather: n = ln(P₂/P₁) / ln(V₂/V₁). Typical values: 3.0 slow full-form ships, 3.3–3.5 container ships, 4 and more near hull speed.

**Does this account for the sea margin?**
No. Apply the margin to the result, or use a known point that already includes weather (then the result includes the same weather).

**How accurate is a slow-steaming estimate from this?**
Within about 5–10 % for ±15 % speed changes at the same displacement with a good reference point; worse across large displacement changes or in weather.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — turn the new power into voyage fuel and cost.
- [Propeller slip and speed through water](../propeller-slip/index.html) — check the speed used for the known point.
- [CII rating estimator](../cii-rating/index.html) — effect of slow steaming on the carbon-intensity rating.
- [Pump and fan affinity laws](../pump-affinity/index.html) — the same similarity reasoning for machinery.
