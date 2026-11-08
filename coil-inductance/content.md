# Air-core coil inductance calculator

**Summary:** Inductance of an air-core coil by Wheeler's single-layer and multilayer formulas or the long-solenoid formula, and the turns for a target inductance.

## Introduction

The inductance of an air-core coil depends on the number of turns squared and on the coil's shape. Wheeler's formula, published in 1928, gives it for a single-layer coil in microhenries from its diameter and length in inches: L = d² N² / (18 d + 40 l). Twenty turns on a former 1 in across, wound over 1 in, give 6.90 µH.

This calculator gives the inductance of a single-layer or multilayer air-core coil by Wheeler's formulas, or of a long solenoid by the physics formula μ0 N² A / l. It also works backwards to the turns for a target inductance. For single-layer coils it shows the exact current-sheet value with Nagaoka's coefficient for comparison. It is for radio amateurs, students and engineers winding coils for tuned circuits, filters and crossovers.

## Formulas

Wheeler's formulas, with dimensions in inches and L in µH:

    single layer:  L = d² N² / (18 d + 40 l)
    multilayer:    L = 0.8 a² N² / (6 a + 9 b + 10 c)

Long solenoid and current sheet, in SI units:

    L = μ0 N² A / l,   A = π d² / 4
    L_sheet = K × μ0 N² A / l

Turns for a target inductance, single layer:

    N = √(L × (18 d + 40 l)) / d

- N — number of turns; d — coil diameter to the wire centres
- l, b — winding length; a — mean radius of a multilayer coil
- c — radial depth of the winding (outer minus inner radius)
- μ0 = 4π × 10⁻⁷ H/m; K — Nagaoka's coefficient, from the ratio d / l

## Assumptions and limitations

- The coil has an air core, or a former of plastic, ceramic or wood. A ferrite or iron core raises the inductance many times.
- Wheeler's single-layer formula is within about 1 % when the coil is longer than 0.4 times its diameter. Shorter coils are better estimated by the current-sheet value.
- The multilayer formula is within about 1 % when 6a, 9b and 10c are roughly equal. The calculator warns when they differ widely.
- The long-solenoid formula ignores the weaker field at the ends. It overestimates any coil that is not much longer than it is wide.
- Close to the coil's self-resonant frequency, its self-capacitance makes the effective inductance rise.

## Worked example

A coil has 20 turns on a former 1 in in diameter, wound over a length of 1 in. What is its inductance?

1. Wheeler: L = 1² × 20² / (18 × 1 + 40 × 1) = 400 / 58 = 6.90 µH.
2. Long-solenoid formula: A = π × 0.0254² / 4 = 5.067 × 10⁻⁴ m², so L = 4π × 10⁻⁷ × 400 × 5.067 × 10⁻⁴ / 0.0254 = 10.03 µH.
3. Nagaoka's coefficient for d / l = 1 is 0.6884, so the current sheet gives 0.6884 × 10.03 = 6.90 µH.

Wheeler's simple formula agrees with the exact current-sheet value to 0.1 %. The long-solenoid formula is 45 % too high for a coil this short. To reach 10 µH on the same former takes √(10 × 58) = 24.1 turns.

## FAQ

**How do I calculate the inductance of an air-core coil?**
For a single layer, use Wheeler's formula L = d² N² / (18 d + 40 l) with inches and microhenries. It is within about 1 % for most practical coils.

**How many turns do I need for a given inductance?**
Inductance rises with the square of the turns. Doubling the turns on the same length gives four times the inductance.

**Why is the long-solenoid formula wrong for my coil?**
It assumes the field is uniform along the whole coil. In a short coil the field spreads out at the ends, so the true value is lower by Nagaoka's coefficient.

**What diameter should I measure?**
The diameter to the centre of the wire, which is the former diameter plus one wire diameter.

**Does the wire gauge change the inductance?**
Only slightly, through the winding length and the diameter to the wire centres. It mainly sets the resistance and the current rating.

**What is Nagaoka's coefficient?**
A factor between 0 and 1 that corrects the long-solenoid formula for a coil of finite length. It is 0.6884 for a coil as long as it is wide.

## Related calculators

- [LC resonant frequency](../lc-resonance/index.html) — the frequency the coil tunes to with a capacitor.
- [Filter cutoff frequency](../filter-cutoff/index.html) — RL, LC and RLC filters using the coil.
- [AWG wire gauge chart](../awg-wire-gauge/index.html) — wire diameter and resistance for the winding.
- [Wire size calculator](../wire-size/index.html) — the current the winding wire can carry.
