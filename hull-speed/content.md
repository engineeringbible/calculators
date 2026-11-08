# Hull speed calculator

**Summary:** Displacement hull speed from waterline length (1.34 √LWL), speed–length ratio, Froude number, speed regime and Gerr's top speed for light hulls.

## Introduction

Hull speed is the speed at which a displacement boat's bow wave becomes as long as its waterline. In knots it is 1.34 times the square root of the waterline length in feet. A yacht with a 30 ft waterline has a hull speed of 1.34 × √30 = 7.34 kn. In metric units the factor is 2.43 with the length in metres. Pushing a heavy hull faster than this takes a steep rise in power, because the boat starts to climb its own bow wave.

This calculator gives the hull speed from the waterline length, the speed–length ratio and Froude number at any speed, the speed regime, and the length of the bow wave. With the displacement it adds Dave Gerr's estimate of the top speed a lighter hull can reach without planing. It is for sailors, motorboat owners and students who want to know how fast a hull can sensibly go.

## Formulas

Hull speed and speed–length ratio:

    V_hull = 1.34 √LWL[ft]  kn  =  2.43 √LWL[m]  kn
    S/L = V[kn] / √LWL[ft]

Froude number and wave length:

    Fn = V / √(g LWL) = 0.298 × S/L
    λ = 2π V² / g          (λ = LWL at S/L 1.34, Fn 0.40)

Gerr's maximum speed–length ratio for semi-displacement hulls:

    D/L = Δ[long tons] / (0.01 LWL[ft])³
    S/L_max = 8.26 / (D/L)^0.311

- LWL — waterline length; V — speed through the water; g = 9.81 m/s²
- Δ — displacement; one long ton is 2 240 lb (1 016 kg)
- Regimes after Gerr: displacement up to S/L 1.34, semi-displacement from 1.45 to 3.0, planing above 3.0

## Assumptions and limitations

- Hull speed is a practical limit, not a wall. Light hulls go faster without planing, and heavy ones need a lot of power to get close.
- Use the loaded waterline length. Long overhangs immerse as the boat heels or squats, so the sailing waterline is often a little longer.
- Gerr's formula is an empirical fit to real boats. It tells you how fast a hull of that weight and length can go given enough power, not how much power it needs.
- Planing hulls are outside this method. Use the planing speed calculator for them.

## Worked example

A cruising yacht has a waterline length of 30 ft and displaces 10 000 lb. What is its hull speed, and what do the ratios say at 6 kn?

1. Hull speed: 1.34 × √30 = 1.34 × 5.477 = 7.34 kn.
2. Speed–length ratio at 6 kn: 6 / 5.477 = 1.10, so the yacht is in the displacement regime.
3. Froude number: 6 kn is 3.087 m/s and the waterline 9.144 m, so Fn = 3.087 / √(9.81 × 9.144) = 0.326.
4. Displacement–length ratio: 10 000 lb is 4.46 long tons, and (0.01 × 30)³ = 0.027, so D/L = 165.
5. Gerr's maximum: S/L = 8.26 / 165^0.311 = 1.69, which is 1.69 × 5.477 = 9.24 kn.

So the yacht is a moderate-displacement hull. With enough power or wind it can exceed the classic 7.34 kn without planing.

## FAQ

**How do I calculate hull speed?**
Take the square root of the waterline length in feet and multiply by 1.34. The answer is in knots. With the length in metres, multiply its square root by 2.43.

**What is the hull speed of a 25 ft or 40 ft waterline?**
A 25 ft waterline gives 6.70 kn and a 40 ft waterline 8.47 kn. Doubling the waterline length raises hull speed by about 41 %.

**Why is the factor 1.34?**
A wave moving at V knots is 0.556 V² feet long. At V = 1.34 √LWL that wave is exactly as long as the waterline, so the boat sits in the trough between its own bow and stern waves.

**Can a boat go faster than hull speed?**
Yes. Light hulls reach S/L 1.45 to 3.0 in the semi-displacement range, and planing hulls go beyond that. Heavy displacement hulls need disproportionate power to pass S/L 1.34.

**What is the speed–length ratio?**
The speed in knots divided by the square root of the waterline length in feet. It lets boats of different sizes be compared: 1.34 is hull speed, 3.0 is roughly where planing starts.

**How does the Froude number relate to hull speed?**
The Froude number is the dimensionless form of the speed–length ratio, Fn = 0.298 × S/L. Hull speed is Fn 0.40.

**How does the displacement–length ratio change the top speed?**
A lower ratio means a lighter hull for its length. By Gerr's formula a hull with D/L 100 can reach S/L 1.97, while one with D/L 300 stays near hull speed at S/L 1.40.

## Related calculators

- [Planing boat speed calculator](../planing-speed/index.html) — speed of hulls that plane.
- [Froude number calculator](../froude-number/index.html) — wave-making regimes and shallow water.
- [Propeller pitch and boat speed](../prop-pitch-speed/index.html) — the pitch for the speed you expect.
- [Boat fuel consumption](../boat-fuel/index.html) — fuel use and range at that speed.
