# Wire rope and chain safe working load calculator

**Summary:** Wire rope breaking load (EN 12385-4) and safe working load with EN 13414 or ILO safety factors, and Grade 80 or 100 chain working load limits.

## Introduction

The safe working load of a wire rope is its minimum breaking load divided by a safety factor, called the coefficient of utilisation. For stranded rope, EN 12385-4 gives the breaking load as a factor K times the diameter squared times the rope grade. A 20 mm 6×36 rope with a steel core in grade 1770 breaks at no less than 0.356 × 20² × 1 770 / 1 000 = 252 kN. With the factor of 5 used for slings, and before any loss at the end fitting, it may lift about 5.1 t.

This calculator gives the minimum breaking load of 6×19 and 6×36 class ropes from EN 12385-4, or takes it from the rope certificate. It applies a termination efficiency and a safety factor: 5 for slings to EN 13414-1, or the ILO formula for ships' derricks and cranes. For alloy lifting chain it gives the working load limit of Grade 8, Grade 80 and Grade 100 chain. It is for ship's officers, riggers, crane operators and superintendents.

## Formulas

Minimum breaking force of stranded rope (EN 12385-4):

    MBL = K × d² × R_r / 1 000          kN, d in mm, R_r in N/mm²

Safe working load:

    SWL = MBL × η_t / Z

ILO coefficient of utilisation for wire rope (ILO C152):

    Z = 10⁴ / (8.85 × SWL + 1 910)       SWL in tonnes, up to 160 t
    Z = 3 above 160 t;  slings: Z = 5 up to 10 t

Lifting chain:

    breaking force ≥ 4 × WLL

- K — 0.330 for fibre core, 0.356 for steel core (IWRC), 6×19 and 6×36 classes
- R_r — rope grade: 1770, 1960 or 2160 N/mm²
- η_t — termination efficiency, about 0.9 for a ferrule-secured eye
- Z — coefficient of utilisation (safety factor)

## Assumptions and limitations

- The K factors were checked against PFEIFER's EN 12385-4 tables: 252 kN for 20 mm 6×36 IWRC 1770 and 234 kN with a fibre core. A rope certificate always takes precedence.
- Bending over a small sheave or pin weakens the rope. Sling ratings assume a large bend, often 25 rope diameters for a basket hitch. Reduce the efficiency for tighter bends, using the maker's D/d curve.
- Chain WLLs are for one leg in a straight pull, from the EN 818-4 table (metric Grade 8) and the NACM tables (US Grade 80 and 100).
- Sling angles, hitches, dynamic loads, wear, corrosion and broken wires are not included. Use the lifting sling calculator for multi-leg slings.

## Worked example

A 20 mm 6×36 IWRC wire rope of grade 1770 has ferrule-secured eyes and is used as a sling. What is its safe working load?

1. Minimum breaking load: 0.356 × 20² × 1 770 / 1 000 = 252.0 kN.
2. Loss at the ferrule-secured eye: 252.0 × 0.9 = 226.8 kN.
3. Safety factor 5 (EN 13414-1): 226.8 / 5 = 45.4 kN.
4. As a mass: 45.4 kN / 9.81 = 4.63 t.

As the runner of a ship's crane, the ILO coefficient applies instead. For this rope it works out at 5.13, so the SWL is 4.51 t.

## FAQ

**How do I calculate the safe working load of a wire rope?**
Find the minimum breaking load from the certificate or from K d² R_r / 1 000, multiply by the termination efficiency, and divide by the safety factor.

**What safety factor is used for wire rope?**
5 for general lifting slings under EN 13414-1 and ASME B30.9. For ships' lifting appliances the ILO formula gives about 5.2 for small loads, falling to 3 at 160 t.

**What is the difference between SWL, WLL and MBL?**
MBL is the minimum breaking load. WLL, the working load limit, is the maximum load the maker certifies for a straight lift. SWL is the safe working load assigned in a given use; in many cases it equals the WLL.

**Is a steel core rope stronger than a fibre core rope?**
Yes. In the 6×19 and 6×36 classes the steel core rope is about 8 % stronger at the same diameter and grade (K 0.356 against 0.330), and it crushes less on a drum.

**What is the WLL of a 10 mm Grade 8 chain?**
3.15 t in a straight single-leg pull, by EN 818-4. Its breaking force is at least four times that.

**Can I use this for mooring lines?**
Not directly. Mooring lines are sized by OCIMF MEG4 from the ship design MBL; use the mooring line calculator.

## Related calculators

- [Lifting sling and wire rope load](../lifting-sling/index.html) — leg tension at sling angles.
- [Mooring line and winch brake](../mooring-line-meg4/index.html) — MEG4 line strengths.
- [Padeye calculator](../padeye/index.html) — the lifting point the rope connects to.
- [Anchor holding power](../anchor-holding/index.html) — the load an anchor chain must take.
