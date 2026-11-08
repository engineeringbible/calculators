# Cable short-circuit withstand calculator

**Summary:** Adiabatic short-circuit check of a cable and its protective conductor, with the earth-fault loop impedance, fault current and disconnection time.

## Introduction

When a fault occurs, the current through a cable heats its conductors far faster than the insulation can shed the heat. Unless the protective device clears the fault quickly enough, the insulation is damaged. The usual check treats the heating as adiabatic: the energy let through, I²t, must stay below k²S², where k depends on the conductor material and the temperatures the insulation can bear. This calculator also works out the earth-fault loop impedance and the minimum fault current, so that one page shows whether the protection disconnects in time and whether the line and protective conductors survive the fault.

It is for electrical engineers designing ship and industrial installations, electrical officers checking circuits after modifications, and students learning cable protection.

## Formulas

    k factor:              k = K √ln((θf + β)/(θi + β))   (K = 226, β = 234.5 °C copper; 148, 228 °C aluminium)
    Adiabatic limit:       I² t ≤ k² S²,   t_max = (k S / I)²,   S_min = I √t / k
    Hot resistance:        R(θ) = R20 (β + θ)/(β + 20)
    Loop impedance:        Zs = Ze + R1 + R2
    Fault current:         If = c U0 / Zs

- θi, θf — maximum operating and short-circuit temperatures; R1, R2 — line and protective conductor resistances over the cable length.

## Assumptions and limitations

- Adiabatic heating for faults up to 5 s; for very short times the device's let-through energy is used.
- The protective conductor is a core of the same cable.
- Reactance is neglected, which suits cross-sections up to about 35 mm².
- Resistance from ρ/S unless the data-sheet value is entered.
- The minimum fault current uses c = 0.95 for low voltage.

## Worked example

A 16 mm² copper XLPE cable with a 16 mm² protective core runs 50 m from a board where Ze = 0.35 Ω, at 230 V to earth. The breaker clears the fault in 0.1 s.

1. k for XLPE (90 → 250 °C): 226 √ln(484.5/324.5) = 143.1.
2. Hot resistance per conductor: 0.017241/16 × 324.5/254.5 = 1.374 mΩ/m, so R1 + R2 = 0.137 Ω and Zs = 0.487 Ω.
3. Fault current: 0.95 × 230 / 0.487 = 448 A.
4. Energy 448² × 0.1 = 2.0 × 10⁴ A²s against k²S² = 5.2 × 10⁶ A²s: the cable withstands the fault comfortably, and would for 26 s.

## FAQ

**Why is the minimum fault current used?**
The disconnection check needs the smallest current the fault can produce, at the end of the circuit with hot conductors and low voltage, because a smaller current trips the device more slowly.

**When is the let-through energy needed?**
Fuses and current-limiting breakers clear large faults within a few milliseconds and limit the peak. Their let-through I²t from the maker's data is then much smaller than I² t with the nominal current.

**Why do small cables near the main board fail?**
Close to the source the fault current is large and the cable is small, so even a short clearing time lets through more energy than the cable can absorb. That is where the check matters most.

**Where do the k values come from?**
From the conductor's heat capacity and resistivity and the temperature rise the insulation tolerates: PVC from 70 to 160 °C, XLPE and EPR from 90 to 250 °C. The formula gives the familiar 115 and 143 for copper.

**What disconnection time applies?**
For TN systems IEC 60364-4-41 sets 0.4 s for 230 V final circuits up to 32 A and 5 s for distribution circuits; ship installations follow the IEC 60092 series and the class rules.

## Related calculators

- [Short-circuit current (IEC 60909)](../short-circuit-current/index.html) — the maximum fault current at the board.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — the cable size for the load current.
- [Transformer sizing and voltage regulation](../transformer-sizing/index.html) — the source impedance.
- [Motor starting current and voltage dip](../motor-starting/index.html) — another check on the same cable.
