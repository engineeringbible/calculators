# Molarity calculator (moles, mass, volume, normality)

**Summary:** Molarity, mass of solute or volume of solution from the other two, with molar masses of common reagents, moles, normality, molality and % w/w.

## Introduction

Molarity is the number of moles of a solute per litre of solution, written mol/L or M. You calculate it by dividing the mass of solute by its molar mass, which gives the moles, and then by the volume of solution in litres. Dissolving 58.44 g of sodium chloride and making it up to 1 L gives a 1 M solution. Turned around, the same relation tells you how much to weigh out: 250 mL of 0.5 M NaCl needs 7.305 g.

This calculator solves for the mass of solute, the molarity or the volume of solution from the other two. It has the molar masses of 22 common reagents, or you can enter your own. It also gives the moles, the normality of acids and bases, and the molality and % w/w when you know the solution density. It is for laboratory technicians, chemistry students and process engineers preparing solutions.

## Formulas

Molarity, moles and mass:

    n = m / M
    c = n / V
    m = c × V × M

Normality, molality and mass fraction:

    N = c × z
    b = n / (ρ V − m)
    w = m / (ρ V)

- c — molarity, mol/L; n — moles of solute; V — volume of solution, L
- m — mass of solute, g; M — molar mass, g/mol
- z — equivalents per mole: 1 for HCl and NaOH, 2 for H₂SO₄, 3 for H₃PO₄
- b — molality, mol per kg of solvent; ρ — solution density; w — mass fraction

## Assumptions and limitations

- The volume is the final volume of the solution. Dissolve the solute in less solvent, then make it up to the mark.
- Hydrates include their water of crystallisation. CuSO₄·5H₂O weighs 249.68 g/mol, against 159.60 g/mol for the anhydrous salt.
- Normality depends on the reaction. The table covers acid–base use; for redox, enter the electrons per mole, such as 5 for permanganate in acid.
- Molality and % w/w need the measured density of the solution at its temperature.
- The reagent is taken as pure. For a 98 % assay, divide the mass by 0.98.

## Worked example

How much sodium chloride is needed for 250 mL of a 0.5 M solution?

1. Volume: 250 mL = 0.250 L.
2. Moles: 0.5 mol/L × 0.250 L = 0.125 mol.
3. Molar mass of NaCl: 22.990 + 35.45 = 58.44 g/mol.
4. Mass: 0.125 × 58.44 = 7.305 g.

Weigh 7.305 g of NaCl, dissolve it in about 200 mL of water, and make up to 250 mL in a volumetric flask.

## FAQ

**How do you calculate molarity?**
Divide the moles of solute by the litres of solution. 10 g of glucose (180.16 g/mol) in 500 mL is 0.0555 mol / 0.5 L = 0.111 M.

**What is the difference between molarity and molality?**
Molarity is moles per litre of solution; molality is moles per kilogram of solvent. Molality does not change with temperature, because it uses masses only.

**What is normality?**
Molarity times the equivalents per mole for the reaction. 0.5 M sulphuric acid gives two protons per molecule, so it is 1.0 N.

**How do I find the molarity of a concentrated acid?**
Multiply the density by the mass fraction to get g/L, then divide by the molar mass. 37 % HCl of density 1.18 g/mL holds 437 g/L, which is 12.0 M.

**How do I make a solution from a concentrated stock?**
Use C1V1 = C2V2. To make 1 L of 1 M HCl from 12 M stock, take 83 mL of stock and make it up to 1 L, always adding acid to water.

**Why does my solution not come out to the right concentration?**
Common causes are a wet or hydrated salt, an impure reagent, making up to the wrong volume, or a temperature far from the flask's calibration.

## Related calculators

- [Dilution C1V1 = C2V2](../dilution/index.html) — making working solutions from a stock.
- [PPM concentration converter](../ppm-concentration/index.html) — mol/L to mg/L, ppm and % w/w.
- [Density calculator](../density/index.html) — mass and volume of the solution.
- [Chemical dosing](../chemical-dosing/index.html) — feeding a solution into a flow.
