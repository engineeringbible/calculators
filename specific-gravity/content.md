# Specific gravity calculator (SG, API gravity, Baumé)

**Summary:** Specific gravity of liquids from density, API gravity or Baumé degrees, and of gases from the molar mass, with density in kg/m³, lb/ft³ and lb/gal.

## Introduction

Specific gravity is the density of a substance divided by the density of a reference. For liquids the reference is water, so you calculate it as SG = ρ / ρ_water. A diesel of 850 kg/m³ has a specific gravity of 0.851 against water at 60 °F. For gases the reference is air, and the ratio of molar masses gives it: methane is 0.554. The oil industry also uses API gravity, and the chemical industry Baumé degrees, both of which are scales based on SG.

This calculator converts between density, specific gravity, API gravity and the heavy and light Baumé scales. It also gives a gas's specific gravity and its density at a chosen temperature and pressure. It is for process, petroleum and chemical engineers, and for anyone reading a hydrometer or a fuel certificate.

## Formulas

Liquids, against water at the chosen reference:

    SG = ρ / ρ_water          ρ_water = 999.016 kg/m³ at 60 °F, 999.972 kg/m³ at 4 °C

API gravity and Baumé degrees, on SG at 60/60 °F:

    °API = 141.5 / SG − 131.5
    °Bé (heavier than water) = 145 − 145 / SG
    °Bé (lighter than water) = 140 / SG − 130

Gases, against dry air at the same temperature and pressure:

    SG_gas = M / 28.964
    ρ_gas = P M / (R T)

- ρ — density; SG — specific gravity, no units
- M — molar mass, g/mol; R = 8.314 J/(mol·K)
- P — absolute pressure; T — absolute temperature

## Assumptions and limitations

- API gravity and Baumé degrees are defined at 60 °F. Enter the density at 60 °F (15.56 °C), or correct a measured density with the ASTM D1250 petroleum tables first.
- The two water references differ by about 0.1 %. Petroleum work uses 60 °F; laboratory work often uses 4 °C. State which one a number uses.
- The heavy Baumé scale is for acids, brines and syrups; the light scale is for oils, solvents and ammonia water. The US scales use the moduli 145 and 140.
- Gas specific gravity assumes ideal gases. At high pressure the density also needs the compressibility factor Z.

## Worked example

A crude oil assay reports 35 °API. What are its specific gravity, density and weight per gallon?

1. Specific gravity at 60/60 °F: 141.5 / (35 + 131.5) = 0.8498.
2. Density at 60 °F: 0.8498 × 999.016 = 849.0 kg/m³.
3. Weight per US gallon: 849.0 × 0.0083454 = 7.09 lb/gal.
4. On the light Baumé scale: 140 / 0.8498 − 130 = 34.7 °Bé.

This is a medium crude, lighter than water by 15 %.

## FAQ

**How do you calculate specific gravity?**
Divide the density of the substance by the density of water at the reference temperature. Sea water at 1 025 kg/m³ has an SG of 1.026 against water at 60 °F.

**How do I convert API gravity to specific gravity?**
SG = 141.5 / (API + 131.5). A 10 °API oil has an SG of 1.000, the same as water, and a 40 °API oil an SG of 0.825.

**What is a light or heavy crude oil?**
By the usual industry convention, light crude is above about 31 °API and heavy crude below about 22 °API. Heavier crudes need more processing and fetch a lower price.

**What is the Baumé scale?**
A hydrometer scale for liquids. For liquids heavier than water, °Bé = 145 − 145 / SG, so 66 °Bé sulphuric acid has an SG of 1.835. For lighter liquids, °Bé = 140 / SG − 130.

**What is the specific gravity of natural gas?**
About 0.55 to 0.7 against air. Pure methane is 0.554; heavier hydrocarbons, nitrogen and CO₂ raise it.

**Is specific gravity the same as density?**
No. Density has units such as kg/m³ or g/cm³. Specific gravity has none, but it equals the density in g/cm³ to within about 0.1 % when water is the reference.

## Related calculators

- [Density calculator](../density/index.html) — mass, volume and density with a material library.
- [Mass flow rate](../mass-flow/index.html) — mass and volume flow of the liquid or gas.
- [Gas compressibility factor Z](../gas-compressibility/index.html) — real-gas density at high pressure.
- [Blending ratio](../blending-ratio/index.html) — mixing two liquids to a target density or property.
