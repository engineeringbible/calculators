# Cable sizing and voltage drop calculator

**Summary:** Voltage drop, power loss and the minimum IEC conductor size for DC, single-phase and three-phase circuits from current, length, material and allowed drop.

## Introduction

Two things size a cable: it must carry the current without overheating (ampacity), and the voltage at the far end must stay within limits (voltage drop). Ampacity depends on how the cable is installed and comes from tables; voltage drop is a calculation, and on long runs or low-voltage DC systems it is usually the deciding factor. This calculator computes the drop for a given IEC 60228 conductor size at its operating temperature, including cable reactance and power factor for AC, reports the power lost in the cable, and finds the smallest standard size that meets your allowed percentage.

It is for marine electrical engineers laying out 440 V and 230 V ship circuits and 24 V DC control supplies, for building services engineers, and for students learning the IEC 60364 voltage-drop method.

## Formulas

Conductor resistance per unit length:

    R'₂₀ = IEC 60228 Table 2 value for the size (Ω/km), or ρ₂₀ / A for a non-standard size
    R'_T = R'₂₀ [1 + α (T − 20)]

- ρ₂₀ — resistivity at 20 °C: copper 1.7241 × 10⁻⁸ Ω·m, aluminium 2.8264 × 10⁻⁸ Ω·m
- α — temperature coefficient: copper 0.00393/K, aluminium 0.00403/K
- T — conductor temperature, °C (70 for PVC, 90 for XLPE at full load)

Voltage drop (L one-way route length):

    R = R'_T L / 1000,   X = X' L / 1000            [Ω]
    DC:            ΔU = 2 I R
    Single-phase:  ΔU = 2 I (R cos φ + X sin φ)
    Three-phase:   ΔU = √3 I (R cos φ + X sin φ)     (line-to-line)
    ΔU% = 100 ΔU / U_nominal

Power loss:

    P_loss = n I² R,   n = 2 (DC, single-phase) or 3 (three-phase)

Minimum size: the smallest IEC 60228 standard cross-section whose ΔU% ≤ allowed drop.

## Assumptions and limitations

- Resistances are the IEC 60228 class 2 maxima scaled to temperature, so the drop is slightly conservative (real cables are up to 5–7 % better). The conductor is assumed at its rated temperature; at partial load it is cooler.
- The default reactance 0.08 Ω/km (IEC 60364-5-52 Annex G) suits multicore and touching single-core LV cables. Spaced single-core cables, armoured cables and MV cables need the catalogue value. DC has no reactance.
- Balanced sinusoidal load. Harmonic-rich loads (drives, LED drivers) increase losses and neutral current and need a separate assessment.
- Ampacity is not calculated. It depends on installation method, grouping, ambient temperature and insulation; take the derated rating from IEC 60092-352 (ships) or IEC 60364-5-52 (shore) or the manufacturer and enter it to see the utilisation. Short-circuit withstand and protective-device coordination are also outside the scope.
- The recommended size satisfies voltage drop only; it may still be too small for ampacity or for mechanical minimum sizes.
- Limits: IEC 60364-5-52 suggests 3 % for lighting and 5 % for other uses from the origin of the installation; IEC 60092-201 allows 6 % between switchboard and consumer on ships; battery-fed DC systems often need tighter limits because the source voltage already varies.

## Worked example

A 400 V three-phase motor circuit draws 50 A at power factor 0.85 over a 50 m route in 16 mm² copper PVC cable (70 °C). Allowed drop 5 %.

1. Resistance at 20 °C: 1.15 Ω/km (IEC 60228). At 70 °C: 1.15 × (1 + 0.00393 × 50) = 1.376 Ω/km → R = 0.0688 Ω for 50 m.
2. Reactance: 0.08 Ω/km → X = 0.004 Ω.
3. Drop: √3 × 50 × (0.0688 × 0.85 + 0.004 × 0.527) = 86.6 × 0.0606 = 5.25 V, i.e. 1.31 % — comfortably within 5 %. Voltage at the motor 394.8 V.
4. Loss: 3 × 50² × 0.0688 = 516 W, about 1.5 % of the 34 kW load.
5. The smallest standard size meeting 5 % would be 6 mm² (3.4 %; 4 mm² gives 5.1 %), but 16 mm² is what ampacity demands for 50 A in most installation methods, so ampacity governs here.

A 24 V DC control supply, 10 A over 10 m in 2.5 mm² copper at 20 °C: ΔU = 2 × 10 × 0.0741 = 1.48 V = 6.2 %, over a 5 % limit; 4 mm² gives 0.92 V (3.8 %). Low voltage makes voltage drop the governing criterion.

## FAQ

**Why does the calculator use the conductor's maximum temperature?**
Because the cable may run fully loaded, and resistance rises about 20 % between 20 and 70 °C. Designing at the cold value would understate the drop. For a lightly loaded cable the real drop is lower.

**Which voltage drop limit applies on a ship?**
IEC 60092-201 allows 6 % between the main or emergency switchboard and any point of the installation for consumers above 50 V, with special provisions for starting currents and navigation lights. Class rules follow IEC.

**Why is the three-phase factor √3 and not 2 or 3?**
The drop per conductor is I(R cos φ + X sin φ); in a balanced system the neutral carries no current and the line-to-line drop is √3 times the per-phase drop.

**Does power factor matter much?**
With the default reactance, moderately: at pf 0.85 the reactive term is about 4 % of the total for 16 mm². For large cables (≥ 95 mm²) the resistance is small and reactance can dominate, so the catalogue X matters.

**Can I size the cable from this result alone?**
No. Check ampacity from the appropriate table for the installation method, ambient and grouping; the larger of the ampacity size and the voltage-drop size is the answer. Then check short-circuit withstand and protection.

**What about motor starting?**
Starting current (6–8 × rated) causes a transient drop that can trip contactors or stall other motors. Run the calculator with the starting current and the starting power factor (0.2–0.4) and compare with the allowed transient drop (often 15 %).

**Aluminium or copper?**
Aluminium has 1.6 times the resistance for the same section, so it needs about 1.6 times the cross-section for the same drop, but weighs about half. Ships use copper almost exclusively (IEC 60092).

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — the current to size the cable for.
- [Battery capacity and runtime](../battery-runtime/index.html) — DC supplies where voltage drop matters most.
- [Generator load, kVA and fuel](../generator-load/index.html) — source-side considerations.
- [Engineering unit converter](../unit-converter/index.html) — mm² to AWG-area, Ω/km to Ω/kft.
