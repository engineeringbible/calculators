# Material properties table (steel, aluminium, plastics)

**Summary:** Density, Young's modulus, yield and tensile strength, thermal expansion, conductivity, specific heat and melting range of common materials, with mass.

## Introduction

Most engineering sums start with a handful of material properties. Density gives weight, Young's modulus gives stiffness, and the yield strength sets the stress a part can carry. Structural steel S355, for example, weighs 7 850 kg/m³, has a modulus of 210 GPa and yields at 355 MPa in plates up to 40 mm thick.

This page holds those properties for twenty common materials: structural and stainless steels, aluminium alloys, copper, brass, titanium, cast iron, concrete, timber, glass and three plastics. Each value comes from a named standard or data sheet. Enter a volume to get the mass, and compare materials by their stiffness and strength per unit weight. It is for designers, students and anyone choosing a material.

## Formulas

Values derived from the table:

    m = ρ V
    specific stiffness = E / ρ
    specific strength = f / ρ

- ρ — density; V — volume; E — Young's modulus
- f — yield or 0.2 % proof strength, or the tensile or characteristic strength where there is no yield

Main values held (the calculator shows the thermal properties and the basis of each value):

| Material | ρ (kg/m³) | E (GPa) | Yield (MPa) | Tensile (MPa) | α (µm/(m·K)) |
|---|---|---|---|---|---|
| S235, t ≤ 40 mm | 7 850 | 210 | 235 | 360 | 12.0 |
| S355, t ≤ 40 mm | 7 850 | 210 | 355 | 490 | 12.0 |
| ASTM A36 | 7 850 | 200 | 248 | 400 | 11.7 |
| ASTM A572 Grade 50 | 7 850 | 200 | 345 | 448 | 11.7 |
| Stainless 304 | 8 030 | 193 | 205 | 515 | 16.9 |
| Stainless 316 | 8 030 | 193 | 205 | 515 | 16.0 |
| Aluminium 6061-T6 | 2 700 | 69 | 276 | 310 | 23.6 |
| Aluminium 6082-T6 | 2 700 | 70 | 260 | 310 | 23.0 |
| Aluminium 5083-O | 2 700 | 70 | 125 | 275 | 23.0 |
| Copper C11000 | 8 910 | 117 | 69 | 221 | 16.9 |
| Brass C26000 | 8 530 | 110 | 103 | 324 | 20.0 |
| Titanium Grade 2 | 4 510 | 105 | 275 | 344 | 8.6 |
| Ti-6Al-4V | 4 430 | 114 | 828 | 895 | 8.6 |
| Grey iron EN-GJL-250 | 7 200 | 103 | — | 250 | — |
| Concrete C30/37 | 2 400 | 33 | — | 2.9 | 10.0 |
| Timber C24 | 420 | 11 | — | 14.5 | — |
| Float glass | 2 500 | 70 | — | 45 | 9.0 |
| PVC-U | 1 440 | 3.0 | 55 | — | 75 |
| HDPE | 950 | 1.1 | 23 | — | 180 |
| Nylon PA66 | 1 140 | 2.4 | 83 | 85 | 81 |

## Assumptions and limitations

- Steel, aluminium, concrete and timber values are code minimums or characteristic values. Copper, brass, 6061-T6 and the plastics are typical data-sheet values. The basis line in the results says which.
- Strengths depend on thickness, temper and product form. Thicker plate, welded joints and higher temperatures all give lower values.
- Concrete is shown with its mean tensile strength. Its compressive strength fck is 30 MPa. Timber shows its tension strength along the grain, and glass its bending strength.
- A dash means no value from a cited source is held for that property. The page does not fill gaps with guesses.
- Plastics creep under steady load and soften as they warm. Their short-term values overstate what they carry for years.

## Worked example

A designer compares a 2 litre block of aluminium 6061-T6 with the same volume of S355 steel.

1. Mass of the aluminium: 2 700 × 0.002 = 5.40 kg. The steel weighs 7 850 × 0.002 = 15.7 kg.
2. Specific stiffness of the aluminium: 68.9 GPa / 2 700 = 25.52 MJ/kg. Steel gives 210 / 7 850 = 26.75 MJ/kg, almost the same.
3. Specific strength of the aluminium: 276 MPa / 2 700 = 102.2 kJ/kg. Steel gives 355 / 7 850 = 45.2 kJ/kg.

Per kilogram, the aluminium is about as stiff as steel and more than twice as strong. Per litre, steel is three times stiffer.

## FAQ

**What is the density of steel?**
7 850 kg/m³ for structural carbon steel in Eurocode design, about 490 lb/ft³. Stainless steels 304 and 316 are slightly heavier at 8 030 kg/m³.

**What is Young's modulus of steel and aluminium?**
Eurocode 3 uses 210 GPa for structural steel and AISC uses 200 GPa (29 000 ksi). Aluminium alloys are about 70 GPa, a third of steel.

**What is the yield strength of A36 steel?**
36 ksi, or 248 MPa, as a minimum. Its tensile strength is 58 to 80 ksi, 400 to 550 MPa.

**What is the difference between 6061-T6 and 6082-T6?**
Both are heat-treated Al-Mg-Si alloys of similar strength. 6061 is the common alloy in North America, 6082 in Europe.

**Why does stainless steel expand more than carbon steel?**
Austenitic grades such as 304 expand about 17 µm per metre per kelvin, against 12 for carbon steel. Joints between them need room to move.

**Is titanium stronger than steel?**
Ti-6Al-4V yields at 828 MPa or more, far above S355, and weighs 44 % less. Commercially pure Grade 2 is about as strong as S275 steel.

## Related calculators

- [Stress and strain](../stress-strain/index.html) — stress and elongation with these moduli.
- [Elastic constants](../elastic-constants/index.html) — shear and bulk modulus from E and Poisson's ratio.
- [Steel and metal weight calculator](../metal-weight/index.html) — weight of plates, bars and sections.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — length change with temperature.
