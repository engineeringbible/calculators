# Power factor correction calculator

**Summary:** Capacitor kvar and capacitance to raise the power factor, released kVA and current, loss saving, resonance with the supply and detuning.

## Introduction

Induction motors, transformers and fluorescent ballasts draw reactive power that does no work but still flows through every cable, transformer and generator upstream. A capacitor bank at the load supplies that reactive power locally: the line current falls, losses fall with its square, transformers and generators gain capacity, and in many tariffs the reactive-energy charge disappears. This calculator sizes the bank from the active power and the existing and target power factors, gives the capacitance per phase, the capacity released and the losses saved, and checks the one thing that can go wrong: a parallel resonance between the bank and the supply at a harmonic frequency.

It is for electrical engineers in plants, ports and on board, facility managers reading a utility bill, and students of power systems.

## Formulas

    Q_c = P (tan φ₁ − tan φ₂)                        tan φ = √(1 − cos²φ)/cos φ
    C = Q_c / (3 ω V²)   (delta),   C = Q_c / (ω V²)   (star),   ω = 2π f
    S = P / cos φ,   I = S / (√3 V),   released = S₁ − S₂
    loss reduction = 1 − (cos φ₁ / cos φ₂)²
    h_r = √(S_sc / Q_c),   f_r = h_r f                parallel resonance with the supply
    detuned: h_t = 1/√p,   capacitor voltage V/(1 − p)

## Assumptions and limitations

- Balanced sinusoidal load at constant active power; displacement power factor only.
- Capacitance for an undetuned bank at nominal voltage; capacitor tolerance not included.
- Loss saving applies to losses upstream of the bank, entered by the user.
- Resonance estimate from the busbar short-circuit power; a harmonic study confirms it.

## Worked example

A 500 kW plant at cos φ 0.75 on a 400 V 50 Hz busbar with 10 MVA short-circuit power, to be corrected to 0.93 with a delta-connected bank; upstream losses 8 kW, 4 000 h/year.

1. tan φ₁ = 0.882, tan φ₂ = 0.395 → 0.487 kvar/kW → Q_c = 243 kvar.
2. Capacitance 243 345/(3 × 314.16 × 400²) = 1 614 µF per phase.
3. Apparent power 667 → 538 kVA (129 kVA released); current 962 → 776 A; capacitor current 351 A.
4. Losses fall by 35 %: 2.8 kW, 11 200 kWh a year.
5. Resonance √(10 000/243) = 6.4, i.e. 321 Hz, within 10 % of the 7th harmonic: with drives on the busbar the bank should be detuned. A 7 % reactor tunes the bank to 189 Hz (h 3.78) and raises the capacitor voltage by 7.5 %.

## FAQ

**Why not correct to 1.0?**
At light load a fixed bank would then over-compensate, giving a leading power factor and a voltage rise; 0.93–0.97 with an automatic stepped bank is the usual target.

**Delta or star?**
At low voltage, delta is usual (units at line voltage, three times smaller capacitance); star is used at medium voltage and for unbalance protection schemes.

**Where should the bank be?**
As close to the loads as practical to relieve the most cable; central banks at the main switchboard relieve the transformer and the tariff only.

**What is detuning?**
A series reactor makes the capacitor branch resonate below the 5th harmonic, so it looks inductive to the harmonics and cannot amplify them; 7 % (189 Hz at 50 Hz) is the common choice.

**Does correction save energy at the meter?**
Only the I²R losses upstream of the bank; the main saving is usually the avoided reactive-energy charge and the released capacity.

**Is this used on ships?**
Rarely on the main switchboard, because generators handle reactive power, but on shore power, offshore installations and large harmonic-free loads the same arithmetic applies.

## Related calculators

- [Three-phase power and current](../three-phase-power/index.html) — the load's current and power factor.
- [Transformer sizing](../transformer-sizing/index.html) — capacity released at the transformer.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cables that benefit.
- [Generator load, kVA and fuel](../generator-load/index.html) — reactive loading of generators.
- [Short-circuit current (IEC 60909)](../short-circuit-current/index.html) — the short-circuit power at the busbar.
