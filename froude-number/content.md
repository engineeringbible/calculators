# Froude number calculator for ships and boats

**Summary:** Length and depth Froude numbers of a ship or boat, the critical speed in shallow water, the hull-speed and hump speeds, and the wave-making regime.

## Introduction

The Froude number compares a ship's speed with the speed of a water wave as long as the ship. It is the speed divided by the square root of gravity times the waterline length, Fn = V / √(g L). A ship 180 m long at 14 kn has Fn = 0.171. Ships with the same Froude number make geometrically similar wave patterns, which is why it governs wave resistance and why model tests are run at the ship's Froude number.

This calculator gives the length Froude number and the wave-making regime, the speeds of the hull-speed point and the main resistance hump, and, with the water depth, the depth Froude number and the critical speed in shallow water. For fast craft it adds the volumetric Froude number that separates displacement, semi-planing and planing. It is for ship officers, pilots, naval architecture students and boat designers.

## Formulas

Length, depth and volumetric Froude numbers:

    Fn = V / √(g L)
    Fn_h = V / √(g h),       critical speed V_crit = √(g h)
    Fn_∇ = V / √(g ∇^(1/3))

Wave length of the ship's transverse waves in deep water:

    λ = 2π V² / g           λ = L at Fn = 1/√(2π) = 0.40

- V — speed through the water in m/s (1 kn = 0.5144 m/s); g = 9.81 m/s²
- L — waterline length; h — water depth; ∇ — displacement volume
- Depth regimes (SVA Potsdam): subcritical Fn_h < 0.9, critical 0.9 to 1.1, supercritical above 1.1
- Fast craft (Savitsky): displacement Fn_∇ < 1, semi-planing 1 to 3, planing above 3

## Assumptions and limitations

- The regimes are guides. The exact speeds of the humps and hollows of the resistance curve depend on the hull form, but the main hump lies near Fn 0.5 for most hulls.
- The depth Froude number uses the undisturbed depth. A narrow channel restricts the flow further and brings the critical effects on at lower speeds.
- Most empirical squat formulas are fitted only up to about Fn_h 0.7. Above that, squat and resistance rise steeply as the ship nears the critical speed.
- Speed is through the water. In a current, the speed over the ground differs.

## Worked example

A ship with a waterline length of 180 m steams at 14 kn in water 20 m deep. Where does it stand?

1. Speed: 14 × 0.5144 = 7.202 m/s.
2. Froude number: 7.202 / √(9.81 × 180) = 7.202 / 42.01 = 0.171. That is a normal speed for a merchant ship.
3. Hull speed (Fn 0.399): 0.399 × 42.01 = 16.76 m/s, which is 32.6 kn. The ship is far below it.
4. Depth Froude number: 7.202 / √(9.81 × 20) = 7.202 / 14.00 = 0.514, subcritical.
5. Critical speed: 14.00 m/s = 27.2 kn. The squat formulas stay valid up to Fn_h 0.7, which is 19.1 kn.

## FAQ

**What is the Froude number of a ship?**
The speed divided by √(g L), with the speed in m/s and the length in metres. A tanker 250 m long at 14 kn runs at Fn 0.15, a container ship 300 m long at 22 kn at Fn 0.21.

**What is the critical speed in shallow water?**
The speed of the longest shallow-water wave, √(g h). In 10 m of water it is 9.90 m/s, or 19.2 kn.

**Why should ships slow down in shallow water?**
As the depth Froude number approaches 1, resistance, wash and squat all rise steeply. The ship sinks deeper and can touch bottom.

**Why does resistance rise so sharply near Fn 0.4 to 0.5?**
Above Fn 0.40 the ship's bow wave is longer than the hull. The stern drops into the trough and the ship climbs its own wave; the main resistance hump is near Fn 0.5.

**What is the volumetric Froude number?**
A Froude number based on the cube root of the displacement volume instead of the length. It is used for fast craft because it tracks how much of the weight dynamic lift carries.

**How is the Froude number used in model tests?**
The model runs at the same Froude number as the ship, so its speed is the ship's speed divided by the square root of the scale. A 1:25 model of a 14 kn ship runs at 2.8 kn.

## Related calculators

- [Hull speed calculator](../hull-speed/index.html) — the boat-builder's version in knots and feet.
- [Shallow water correction](../shallow-water-speed/index.html) — power and speed loss in shallow water.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — how much the ship sinks at speed.
- [Wave properties](../wave-properties/index.html) — wave length and speed at any depth.
