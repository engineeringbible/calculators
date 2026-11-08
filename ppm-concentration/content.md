# PPM concentration converter (mg/L, % w/w, ppmv, mg/m³, mol/L)

**Summary:** Convert ppm and ppb by mass or volume, mg/L, g/L, % w/w, mol/L and mg/m³ for liquids and gases, using the density, molar mass, temperature and pressure.

## Introduction

What does ppm mean? Parts per million is a ratio: one part of a substance in a million parts of the mixture. In water and soil it is a mass ratio, so 1 ppm is 1 mg per kg. In air it is a volume ratio, so 1 ppm is 1 mL of gas per m³. In dilute water 1 ppm is very nearly 1 mg/L. In air the mass depends on the gas: 1 ppm of carbon monoxide is about 1.15 mg/m³ at 25 °C.

This calculator converts one concentration into all the others. For liquids it links ppm, ppb, % w/w, mg/L, g/L and molarity through the density of the solution and the molar mass. For gases it links ppmv, ppbv, % by volume, mg/m³ and µg/m³ through the temperature, pressure and molar mass. It is for water treatment, laboratory and environmental work and for checking exposure limits.

## Formulas

Liquid or solid, mass basis:

    c [g/L] = w × ρ [kg/m³]
    ppm = w × 10⁶,   ppb = w × 10⁹,   % w/w = w × 100
    molarity [mol/L] = c [g/L] / M

Gas, volume basis (ideal gas):

    c [mg/m³] = x × M × P / (R T) × 1 000
    at 25 °C and 1 atm:   mg/m³ = ppmv × M / 24.45
    ppm by mass in air = x M / (x M + (1 − x) M_air) × 10⁶

- w — mass fraction of the substance; c — mass concentration; ρ — density of the whole solution
- x — mole fraction, equal to the volume fraction for ideal gases
- M — molar mass of the substance, g/mol; M_air = 28.964 g/mol
- R = 8.314 J/(mol·K); T — absolute temperature; P — absolute pressure

## Assumptions and limitations

- ppm in a liquid means mg/kg. It equals mg/L only when the solution has a density of 1 000 kg/m³, which is close enough for drinking water but not for brines, acids or sludges.
- ppm in a gas means volume or mole fraction. Converting it to mg/m³ needs the temperature and pressure; occupational limits in the US use 25 °C and 1 atm.
- The gas conversion uses the ideal gas law. Above about 10 bar, or close to condensation, correct the molar volume for real-gas behaviour.
- Molarity uses the molar mass you enter. Use the formula unit for a salt, such as NaCl, not one of its ions.

## Worked example

A sodium chloride brine holds 35 g of salt per litre and has a density of 1 025 kg/m³. What is its concentration in ppm, % w/w and mol/L?

1. Mass fraction: 35 g/L / 1 025 g/L = 0.034146.
2. ppm by mass: 0.034146 × 10⁶ = 34 146 ppm.
3. Percent by weight: 0.034146 × 100 = 3.415 % w/w.
4. Molarity: 35 g/L / 58.44 g/mol = 0.599 mol/L.

The brine is 35 000 mg/L but only 34 146 ppm, because a litre of it weighs more than a kilogram.

## FAQ

**How do I convert ppm to mg/L?**
For water and dilute solutions, 1 ppm is 1 mg/L. For denser liquids, multiply ppm by the density in kg/L: 1 000 ppm in a liquid of 1.2 kg/L is 1 200 mg/L.

**How do I convert ppm to mg/m³ for a gas?**
At 25 °C and 1 atm, multiply ppm by the molar mass and divide by 24.45. For ammonia, 25 ppm × 17.03 / 24.45 = 17.4 mg/m³.

**What is the difference between ppm and ppmv?**
ppm usually means a mass ratio and is used for liquids and solids. ppmv is a volume ratio and is used for gases. For a gas mixture they differ by the ratio of molar masses.

**How many ppm is 1 %?**
10 000 ppm. One percent is one part per hundred, and a million is ten thousand hundreds.

**What is ppb?**
Parts per billion, one thousandth of a ppm. In water 1 ppb is 1 µg/L, a level used for lead, arsenic and pesticides.

**How do I convert mg/L to molarity?**
Divide the mg/L by the molar mass in g/mol to get mmol/L, then divide by 1 000 for mol/L. 100 mg/L of calcium carbonate is 0.999 mmol/L.

## Related calculators

- [Molarity](../molarity/index.html) — moles, mass and volume of a solution.
- [Dilution C1V1 = C2V2](../dilution/index.html) — diluting a stock to a target concentration.
- [Chemical dosing](../chemical-dosing/index.html) — feed rate for a target dose in mg/L.
- [Ideal gas law](../ideal-gas-law/index.html) — molar volume at other conditions.
