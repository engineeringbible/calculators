# Short-circuit current (IEC 60909) calculator

**Summary:** Three-phase short-circuit current at a switchboard from source, transformer and cable impedances; peak current and breaker check.

## Introduction

Every switchboard must withstand and interrupt the worst fault that can occur on it, and every protective device must also see enough current at the far end of its cable to trip in time. IEC 60909 provides the standard way to calculate both: an equivalent voltage source c U_n/√3 at the fault driving current through the series impedances of the upstream network, the transformer and the cables, with a voltage factor that bounds the pre-fault voltage, a correction for the transformer and a peak factor for the DC offset. This calculator performs the radial-network calculation for a low-voltage switchboard: maximum initial current at the transformer terminals and at a cable end, peak and thermal equivalent currents, the minimum current for protection coordination and the check of a breaker's breaking and making capacities.

It is for marine and industrial electrical engineers specifying switchgear, checking protection settings and reviewing generator or shore-connection schemes, and for students of power systems.

## Formulas

    I_k″ = c U_n / (√3 Z_k),   Z_k = √(R_k² + X_k²)
    network:     Z_Qt = 1.10 U_n² / S_kQ″,  X_Q = 0.995 Z_Qt,  R_Q = 0.1 X_Q
    transformer: Z_T = u_kr U_n²/S_rT,  R_T = P_krT U_n²/S_rT²,  X_T = √(Z_T² − R_T²),  K_T = 0.95 c_max/(1 + 0.6 x_T)
    cable:       R_C = R′ L / n,  X_C = X′ L / n;  for the minimum current R_C,θ = R_C [1 + 0.004 (θ_e − 20)]
    κ = 1.02 + 0.98 e^(−3 R_k/X_k),   i_p = κ √2 I_k″
    m = (e^(4 f T_k ln(κ−1)) − 1)/(2 f T_k ln(κ−1)),   I_th = I_k″ √(m + 1)
    I_k,min″ = c_min U_n / (√3 Z_k,θ)

Voltage factors (Table 1): LV systems +6 % c_max 1.05 / c_min 0.95; LV +10 % 1.10 / 0.95; MV and HV 1.10 / 1.00.

## Assumptions and limitations

- Balanced three-phase fault far from generators (I_b = I_k = I_k″), no motor contribution, no arc impedance; motors above 1 % of I_k″ each must be added (IEC 60909-0 §6.6).
- Network R/X = 0.1 unless known; transformer tap position and no-load losses ignored; cables at 20 °C for the maximum current and at the end-of-fault temperature for the minimum.
- Single-phase and earth faults, selectivity, let-through energy and cable thermal withstand are separate checks.
- The 1.10 LV factor applies to +10 % systems (2016 edition); check which your utility or class rules require.

## Worked example

A 1 000 kVA, 11/0.4 kV transformer (u_kr 6 %, load losses 10.5 kW) fed from a 250 MVA network supplies a switchboard through 50 m of 240 mm² copper (0.1 + j0.08 Ω/km); 50 Hz, 1 s fault duration, breaker 36 kA / 75.6 kA.

1. Transformer: Z_T = 0.06 × 400²/10⁶ = 9.60 mΩ; R_T = 10 500 × 0.16/10¹² × 10⁶ = 1.68 mΩ; X_T = 9.45 mΩ; x_T = 0.059 → K_T = 0.95 × 1.05/(1 + 0.6 × 0.059) = 0.963; corrected 1.62 + j9.10 mΩ.
2. Network referred to 400 V: 1.10 × 0.16/250 = 0.704 mΩ → 0.07 + j0.70 mΩ. At the terminals Z = 1.69 + j9.80 = 9.95 mΩ → I_k″ = 1.05 × 400/(√3 × 9.95) = 24.4 kA (26.2 kA with an infinite source; the rule of thumb I_r/u_k gives 24.1 kA before the factors).
3. Cable: 5 + j4 mΩ → Z_k = 6.69 + j13.80 = 15.3 mΩ → I_k″ = 15.8 kA at the switchboard; R/X = 0.48, κ = 1.25, i_p = 28 kA; m ≈ 0, I_th ≈ I_k″.
4. Minimum current (c_min 0.95, copper at 160 °C: cable R × 1.56 = 7.8 mΩ): Z = 9.5 + j13.8 = 16.7 mΩ → 13.1 kA for the protection setting.
5. The 36 kA / 75.6 kA breaker is adequate at both locations.

## FAQ

**Why a voltage factor above 1?**
The pre-fault voltage at the fault location can exceed nominal (tap settings, light load) and the method must bound the worst case; c_min does the opposite for the minimum current.

**What does K_T correct?**
The transformer's actual operating conditions (voltage and load) differ from the rated-impedance test; the correction (always < 1 for normal x_T) slightly lowers the impedance and raises I_k″.

**Why is the peak current so much more than the initial current?**
The DC offset at fault inception adds to the AC wave; with a low R/X (close to the transformer) κ approaches 2 and the first peak reaches 2√2 × I_k″.

**What is the thermal equivalent current for?**
Busbar and cable heating during the fault; with a 1 s duration the DC term is negligible and I_th ≈ I_k″, but for 0.1 s it adds 10 %.

**Do I need the minimum current?**
Yes, for protection: the device at the cable origin must trip within the disconnection time at the far-end fault, where the current is lowest (long cable, hot conductor, low voltage).

**Generators instead of a transformer?**
Near-to-generator faults decay from the subtransient value; IEC 60909 handles them with x_d″ and the correction K_G, which this radial LV page does not cover.

**Can I check a shore-connection or a ship's main switchboard?**
Yes for the transformer-fed case; for diesel generators use the subtransient reactance method and add the motor contribution.

## Related calculators

- [Transformer sizing and voltage regulation](../transformer-sizing/index.html) — the same transformer data.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the feeder cable's R and X.
- [Generator load, kVA and fuel](../generator-load/index.html) — the generator plant behind the board.
- [Three-phase power and motor current](../three-phase-power/index.html) — the loads and motor contributions.
