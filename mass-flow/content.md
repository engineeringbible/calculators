# Mass flow rate calculator (kg/h, m³/h, velocity, Nm³/h, SCFM)

**Summary:** Mass flow, volume flow and pipe velocity from any one of them, with gas density from P, T and Z and conversion between actual and standard flow (Nm³/h, SCFM).

## Introduction

Mass flow rate is the mass of fluid passing a point per unit time. You calculate it as density × volume flow, or as density × velocity × pipe area. Water at 36 m³/h is a mass flow of about 36 t/h. For a gas the density depends on pressure and temperature, so the same mass flow fills very different volumes. Gas flows are therefore often stated as standard or normal volumes: 500 Nm³/h of air is 646 kg/h whatever the line pressure.

This calculator converts between mass flow, actual volume flow, standard volume flow and velocity in a round pipe. For a gas it works out the density from the molar mass, pressure, temperature and compressibility factor, and it converts actual flow to Nm³/h, Sm³/h or SCFM at a chosen reference. It is for process, utility and compressed-air engineers sizing lines, meters and compressors.

## Formulas

Continuity in a round pipe:

    ṁ = ρ × Q = ρ × v × A,     A = π D² / 4

Gas density and standard flow:

    ρ = P M / (Z R T)
    Q_std = ṁ / ρ_std = Q × (P / P_std) × (T_std / T) / Z

- ṁ — mass flow; Q — actual volume flow; v — mean velocity; D — inside diameter
- ρ — density at flowing conditions; ρ_std — density at the reference state (Z = 1 there)
- P, T — absolute pressure and temperature; M — molar mass; R = 8.314 J/(mol·K)
- Z — compressibility factor at flowing conditions, 1 for an ideal gas

Reference states: Nm³ at 0 °C and 101.325 kPa, Sm³ at 15 °C and 101.325 kPa, SCF at 60 °F and 14.696 psia, compressed air at 20 °C and 100 kPa.

## Assumptions and limitations

- The velocity is the average over the pipe section. The real profile peaks at the centre, about 20 % above the mean in turbulent flow.
- Pressure must be absolute. Add the atmospheric pressure, about 1.013 bar or 14.7 psi, to a gauge reading.
- Z = 1 is accurate within about 1 % for air and nitrogen up to 20 bar at room temperature. Natural gas, CO₂ and high pressures need the real Z.
- Standard flow is defined per reference. 1 Nm³ at 0 °C is 5.5 % more gas than 1 Sm³ at 15 °C, so always state the reference.
- A humid gas gives a wet standard flow. Remove the water vapour for a dry-basis figure.

## Worked example

A compressor delivers 500 Nm³/h of air to a header at 8 bar absolute and 20 °C, through a 50 mm bore pipe. What are the mass flow, the actual flow and the velocity?

1. Normal density of air: 101 325 × 0.028964 / (8.314 × 273.15) = 1.292 kg/m³.
2. Mass flow: 500 × 1.292 = 646.1 kg/h.
3. Density in the header: 800 000 × 0.028964 / (8.314 × 293.15) = 9.507 kg/m³.
4. Actual flow: 646.1 / 9.507 = 67.97 m³/h, which is 40.0 cfm.
5. Velocity: 67.97 / 3 600 / (π × 0.05² / 4) = 9.62 m/s.

The air is compressed about 7.4 times, so the pipe carries 68 m³/h, not 500.

## FAQ

**How do you calculate mass flow rate?**
Multiply the volume flow by the density. 10 m³/h of water at 998.2 kg/m³ is 9 982 kg/h, or 2.77 kg/s.

**What is the difference between Nm³/h and m³/h?**
m³/h is the actual volume at the flowing pressure and temperature. Nm³/h is the volume the same gas would fill at 0 °C and 1 atm, so it measures the amount of gas.

**How do I convert SCFM to ACFM?**
Multiply SCFM by (14.696 / P) × (T / 519.67) × Z, with P in psia and T in °R. At 100 psig and 60 °F, 780 SCFM is 100 ACFM.

**How do I convert Nm³/h to kg/h?**
Multiply by the normal density of the gas: 1.292 kg/m³ for air, 1.250 for nitrogen and 0.717 for methane.

**What velocity should a pipe be designed for?**
1 to 3 m/s for water and other liquids, and about 10 to 20 m/s for gases and compressed air. Higher speeds raise the pressure drop and the noise.

**Why does gas flow need a compressibility factor?**
Real gases deviate from the ideal gas law at high pressure. Natural gas at 70 bar has Z near 0.85, so it is about 18 % denser than PV = nRT predicts.

## Related calculators

- [Density calculator](../density/index.html) — density of the liquid.
- [Flow rate and velocity](../flow-rate-velocity/index.html) — pipe size for a flow and velocity.
- [Gas compressibility factor Z](../gas-compressibility/index.html) — Z for natural gas and pure gases.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the friction loss at that velocity.
