# Three-phase power and motor current calculator

**Summary:** kW, kVA, kvar and line current for three-phase, single-phase and DC circuits; motor full-load and starting current from rated output; power-factor correction kvar.

## Introduction

Every electrical question on board starts with the power triangle: how many kilowatts does the load take, how many kVA does the generator see, how many amps flow in the cable, and what does the power factor do to each. This calculator works the triangle in three directions: from a measured current and power factor to the powers, from a known load to the current, and from a motor nameplate (shaft output, efficiency, power factor) to the full-load and starting current. It also sizes the capacitor bank to raise the power factor and shows the generator kVA the load draws.

It is for marine and plant electricians, engineers sizing feeders and generators, and students learning three-phase power.

## Formulas

Power triangle (V line-to-line for three-phase, I line current):

    Three-phase:  S = √3 V I,    Single-phase:  S = V I,    DC:  P = V I
    P = S cos φ,   Q = S sin φ = √(S² − P²),   φ = acos(pf)

Current from power:

    I = P / (√3 V cos φ)   (three-phase),   I = P / (V cos φ)   (single-phase),   I = P / V   (DC)

Motor from nameplate:

    P_in = P_shaft / η,   I_FL = P_in / (√3 V cos φ),   losses = P_in − P_shaft
    I_start = k × I_FL,   S_start = √3 V I_start

Power-factor correction:

    Q_c = P (tan φ₁ − tan φ₂),   I_after = P / (√3 V cos φ₂)

Generator apparent power drawn = S.

- η — motor efficiency at rated load; k — starting current multiple (DOL 6–8, star-delta ≈ 1/3 of that, soft starter 2–4, VFD 1–1.5)

## Assumptions and limitations

- Balanced sinusoidal three-phase loads with line quantities; star or delta makes no difference to the formulas. Unbalance and harmonics from drives change the currents and are not modelled.
- Displacement power factor at the fundamental; the sign of Q (lagging/leading) is not tracked.
- Nameplate efficiency and power factor hold at rated load only; at part load the power factor of an induction motor drops and the current falls less than the load.
- Starting current is the locked-rotor value as a multiple of full-load current at an assumed power factor of 0.3; the actual value is on the nameplate (I_A/I_N) or in IEC 60034-12.
- Capacitor sizing is for the fundamental and the entered active power; harmonic resonance and over-correction at light load need a separate study.
- Generator sizing for motor starting depends on the permitted voltage dip and the generator's sub-transient reactance, not just the starting kVA.

## Worked example

A 30 kW, 400 V, 4-pole IE3 motor with nameplate efficiency 92 % and power factor 0.85, started direct on line (7 × I_N).

1. Electrical input: 30 / 0.92 = 32.6 kW; losses 2.6 kW (heat in the motor).
2. Full-load current: 32 609 / (√3 × 400 × 0.85) = 55.4 A — the catalogue figure for motors of this class is 55–57 A.
3. Apparent power 38.4 kVA, reactive power 20.2 kvar, phase angle 31.8°.
4. Starting: 7 × 55.4 = 388 A, about 269 kVA at a starting power factor of 0.3. A 400 kVA generator with this load would see a voltage dip of the order of the starting kVA over its rating times its sub-transient reactance — on the limit of the usual 15–20 %, which is why larger motors on ships use star-delta, soft starters or sequential starting.
5. Correcting the running power factor to 0.95 needs 32.6 × (tan 31.8° − tan 18.2°) = 9.5 kvar and reduces the line current to 49.5 A.

From a measured current instead: 400 V, 50 A, cos φ 0.85 → 34.6 kVA, 29.4 kW, 18.2 kvar.

## FAQ

**Why √3?**
With line-to-line voltage and line current the per-phase power V_ph I_ph × 3 becomes √3 V_LL I_L, whether the load is star or delta connected.

**Is the nameplate kW the input or the output?**
The output at the shaft (IEC 60034-1). The electrical input is higher by the efficiency, which is why a 30 kW motor draws about 32.6 kW.

**Why does a low power factor matter if the kW are the same?**
The generator and the cables carry the current, which is set by kVA, not kW. At 0.7 power factor the current is 43 % higher than at unity for the same kW, with the losses, voltage drop and generator loading that go with it.

**How much capacitance should I install?**
Enough to reach 0.92–0.95 at normal load; correcting to unity or beyond risks a leading power factor at light load and resonance with harmonics. Correct at the motor for large motors, at the switchboard for the plant.

**What starting method do I need?**
If the supply can hold the voltage dip at 6–8 × I_N, direct on line is simplest. Star-delta cuts the starting current and torque to a third; soft starters and drives give control at the cost of harmonics (drives) and complexity.

**Can I use this for a transformer or a heater?**
Yes: a heater is a load at unity power factor in "power" mode; a transformer is rated in kVA, which is the apparent power here.

**What about 60 Hz or 440 V ship systems?**
Frequency does not enter these formulas; enter 440 V (or 690 V) as the line voltage. Motor currents on 440 V/60 Hz nameplates are correspondingly lower than at 400 V.

## Related calculators

- [Cable sizing and voltage drop](../cable-sizing/index.html) — the feeder for the current found here.
- [Generator load, kVA and fuel](../generator-load/index.html) — generators supplying this load.
- [Battery capacity and runtime](../battery-runtime/index.html) — DC loads and emergency supplies.
- [Pump and fan affinity laws](../pump-affinity/index.html) — the shaft power the motor must deliver.
