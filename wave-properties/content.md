# Wave properties and encounter period calculator

**Summary:** Linear wave theory: wavelength, celerity, group velocity, deep/shallow regime, orbital velocities and the encounter period for a ship speed and heading.

## Introduction

Almost every question about waves at sea starts with the same relation: how long and how fast is a wave of a given period, and how does the bottom change that. Linear (Airy) theory answers it with the dispersion relation, and from the wavenumber everything else follows: the speed at which crests travel, the slower speed at which the wave energy travels, the water velocities that act on a hull, a pipeline or a diver, the power carried per metre of crest, the height at which the wave must break, and the period at which a moving ship meets successive crests. This calculator solves the dispersion relation exactly for any depth and reports all of these.

It is for naval architects and seakeeping analysts (encounter frequency, wave length to ship length), coastal and offshore engineers (shoaling, bottom velocities, breaking), masters checking the IMO heavy-weather guidance, and students.

## Formulas

Dispersion relation and kinematics (depth h, wavenumber k = 2π/λ, ω = 2π/T):

    ω² = g k tanh(kh)        λ₀ = g T²/2π (deep water)
    c = λ/T = ω/k            c_g = n c,  n = ½ (1 + 2kh / sinh 2kh)   (n → ½ deep, → 1 shallow)
    regime: deep h/λ > 0.5,  shallow h/λ < 0.05,  intermediate between

Velocities, energy, breaking (amplitude a = H/2):

    u(z) = a ω cosh(k(h − z)) / sinh(kh)      (z measured down from the surface; deep water a ω e^(−kz))
    P = ρ g H² c_g / 8  per metre of crest     (deep water: ρ g² H² T / 32π)
    H_max = 0.142 λ tanh(kh)                   (Miche)

Encounter period for a ship at speed V with α between heading and wave direction (0° head seas):

    ω_e = ω + k V cos α,   T_e = 2π / |ω_e|
    deep-water check (MSC.1/Circ.1228): T_e ≈ 3T² / (3T + V_kn cos α)

## Assumptions and limitations

- Linear theory: small steepness, flat bottom, no current. Second-order effects sharpen crests and raise crest velocities above the linear value at steepness beyond about 1/20; in very shallow water cnoidal or solitary theory applies.
- One regular wave stands for the sea. For a spectrum use H_s and the peak or energy period and read velocities as representative. For irregular seas the energy flux is about half the regular-wave value for the same height and period.
- The Miche limit is a kinematic criterion; actual breaking depends on bottom slope and wave groupiness.
- The encounter formula is kinematic; wave speed in a current and refraction are not included.

## Worked example

A 10 s swell, 3 m high, met by a ship doing 15 knots into it.

1. Deep water: λ₀ = 9.807 × 100 / 2π = 156.1 m; c = 15.6 m/s (30 knots); c_g = 7.8 m/s. Steepness 3/156 = 0.019, far from the 0.142 breaking limit (22 m).
2. Surface orbital velocity π H/T = 0.94 m/s; at 10 m depth 0.94 × e^(−0.0402 × 10) = 0.63 m/s.
3. Energy flux: 1 025 × 9.807 × 9 × 7.8/8 = 88 kW per metre of crest.
4. Encounter: ω_e = 0.628 + 0.0402 × 7.72 = 0.939 rad/s → T_e = 6.7 s. The IMO circular's formula gives 300/(30 + 15) = 6.67 s.
5. Same swell entering 30 m of water (h/λ ≈ 0.2, intermediate): λ shortens to about 140 m, c to 14 m/s, the group velocity rises to 10.2 m/s and the bottom velocity is 0.2 m/s; in 2 m of water the wave would already have broken (limit about 1.7 m).

## FAQ

**Why are the phase and group velocities different?**
Deep-water waves are dispersive: long waves travel faster than short ones, and the energy (and the visible group of waves) travels at half the crest speed. In shallow water all waves travel at √(gh) and the two speeds coincide.

**When is water "deep"?**
When the depth exceeds half the wavelength the bottom has no influence; below a twentieth of the wavelength the wave is "shallow". For a 10 s wave that means deeper than 78 m or shallower than 8 m.

**What do I enter for an irregular sea?**
The significant height H_s and the peak period (or the energy period for power). The orbital velocities then represent the significant waves; individual waves reach about 1.8 H_s.

**What is the encounter period used for?**
Ship motions respond to the frequency at which waves are met, not the wave frequency. Resonance with the roll or pitch period, slamming and parametric rolling are all judged on T_e; see the roll-period calculator.

**Why does the IMO formula differ slightly?**
MSC.1/Circ.1228 uses λ = 1.56 T² and speed in knots with rounded constants; the exact deep-water result differs by about 1.5 %.

**How fast does a swell cross an ocean?**
At the group velocity: a 15 s swell travels at 11.7 m/s, about 1 000 km per day, which is why long-period swell arrives before the storm.

**Does the calculator handle currents?**
No. A following current lengthens the waves for a fixed absolute period and an opposing one shortens and steepens them; that needs the Doppler-shifted dispersion relation.

## Related calculators

- [Roll period and synchronous rolling](../roll-period/index.html) — resonance checks using the encounter period.
- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — height and period from the sea state.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — shallow-water effects on the ship itself.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — the water depth to use.
