# Rotor sail (Flettner rotor) thrust and saving calculator

**Summary:** Thrust, side force, spin power and net power saving of Flettner rotors from the true wind and ship speed, at the best spin, and averaged over a wind table.

## Introduction

A rotor sail is a tall spinning cylinder. In a cross wind the spin creates a large lift force by the Magnus effect, and part of that force pushes the ship forward. How much depends on the apparent wind, which the ship's own speed turns forward, and on how fast the rotor spins relative to the wind: the spin ratio. This calculator uses the lift, drag and power coefficients that Tillig and Ringsberg fitted to full-scale measurements. It evaluates the rotor in height strips through the wind profile, finds the spin that gives the most net power, and averages the result over a table of wind conditions for a route.

It is for naval architects and owners screening wind-assisted propulsion, performance analysts estimating savings from rotor sails in service, and anyone checking a supplier's claim.

## Formulas

    Wind profile:        TWS(z) = TWS₁₀ (z / 10)^α
    Apparent wind:       AWS, AWA from TWS(z), TWA and the ship speed V_s
    Spin ratio:          SR = ω R / AWS
    Lift and drag:       L = c_L(SR) ½ ρ A AWS²,   D = c_D(SR) ½ ρ A AWS²
    Thrust:              T = L sin AWA − D cos AWA
    Side force:          S = L cos AWA + D sin AWA
    Spin power:          P_rotor = c_P(SR) ½ ρ A AWS³
    Net power (eq. 10):  P_net = T V_s − P_rotor
    Engine saving:       ≈ T V_s / η_D

- c_L, c_D, c_P — fifth-order polynomials in SR (Tillig & Ringsberg 2020, eqs 7–9); A = D H, the projected area of each height strip; AWA from the bow.

## Assumptions and limitations

- Coefficients for a rotor of aspect ratio 6 with an end disc of twice its diameter, held at their SR = 4 values beyond 4.
- Wind profile with the 1/9 power law of ISO 15016:2025 by default; ten height strips share one rpm.
- The best spin maximises the net power up to the rpm limit, without exceeding SR 4 anywhere on the rotor.
- Leeway and rudder drag from the side force, heel, interaction between rotors and with the superstructure, and generator losses are not included, so the saving is an upper estimate.

## Worked example

A 5 m × 30 m rotor stands 20 m above the waterline. The ship makes 12 kn with a 20 kn true wind on the beam.

1. At mid-height (35 m) the true wind is 20 × 3.5^0.111 = 23.0 kn, and the apparent wind is 25.9 kn from 62.4° off the bow.
2. The best spin is 189 rpm (SR 3.70 at mid-height), limited by SR 4 at the foot of the rotor where the wind is weakest.
3. Thrust 134.3 kN and side force 130.7 kN; thrust power 134.3 kN × 6.17 m/s = 829 kW.
4. Spin power 126 kW, so the net power is 703 kW; with η_D = 0.7 the main engine saves about 1184 kW.
5. Over the example wind table the mean net power is 431 kW.

## FAQ

**Why is the best spin ratio so high?**
In this model the thrust keeps growing with the spin ratio faster than the spin power up to about SR 3–4. In service the side force, leeway and rudder drag push the best value lower; Tillig and Ringsberg note that SR 1.5–2.5 is often optimal in typical operation.

**Why does the wind direction matter so much?**
The lift acts across the apparent wind, so it pushes the ship forward most when the apparent wind is near the beam. In a head wind the rotor only adds drag. With a following wind the ship's speed reduces the apparent wind.

**Why evaluate in height strips?**
The wind is stronger higher up, so the apparent wind speed and angle change along the rotor. At one rpm the spin ratio is higher at the foot than at the top.

**What does the side force do?**
It pushes the ship sideways. The hull must sail at a small drift angle with some rudder to balance it, which adds resistance not counted here. On a slender ship with a large sail area it can also cause heel.

**How should I use the wind table?**
Enter the wind statistics of the route: true wind speed at 10 m, angle off the bow and share of time. The calculator finds the best spin for each line and gives the time-weighted mean saving.

**Can I compare suppliers' rotors?**
Only roughly. The coefficients are for one rotor geometry; a different aspect ratio or end plate changes the lift, so use the supplier's coefficients when you have them.

## Related calculators

- [True wind from apparent wind](../true-wind/index.html) — the true wind from the ship's anemometer.
- [Wind resistance (ISO 15016)](../wind-resistance/index.html) — the wind load on the hull and superstructure.
- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — wind statistics by Beaufort number.
- [Speed–power curve fit](../speed-power-fit/index.html) — converting the saving to speed or power at sea.
