# Hardness conversion calculator (HRC, HRB, HV, HB)

**Summary:** Approximate conversion of steel hardness between Rockwell C, Rockwell B, Vickers and Brinell, with tensile strength, from ASTM E140 and ISO 18265.

## Introduction

Each hardness test presses a different indenter into the metal with a different load, so the scales have no exact relation. For steel, standard tables built from many paired tests give the equivalent values. A steel at 45 HRC reads about 446 HV and 421 HBW, and its tensile strength is roughly 1 440 MPa.

This calculator converts a reading in Rockwell C, Rockwell B, Vickers or Brinell to the other scales, and estimates the tensile strength. It can also work backwards from a tensile strength. It interpolates in the published tables and refuses values outside them. It is for inspectors, heat-treaters and designers comparing a hardness test with a drawing or a material certificate.

## Formulas

Hardness to hardness, by linear interpolation between two rows of ASTM E140:

    y = y₁ + (x − x₁) (y₂ − y₁) / (x₂ − x₁)

- x — the reading you have; x₁, x₂ — the table rows either side of it
- y₁, y₂ — the values of the other scale in those rows

Tables used:

| Range | Table | Columns |
|---|---|---|
| HRC 20 to 68 | ASTM E140 Table 1 | HRC, HV, HBW (carbide ball, 3 000 kgf) |
| HRB 55 to 100 | ASTM E140 Table 2 | HRB, HV, HB (equal to HV in this range) |
| HV 80 to 650 | ISO 18265 Table A.1 | HV, tensile strength Rm 255 to 2 180 MPa |

The Vickers number links the tables: every reading is first converted to HV, then to the other scales and to the tensile strength.

## Assumptions and limitations

- The tables hold for non-austenitic carbon and low-alloy steels. Austenitic stainless steel, cold-worked steel, cast iron, aluminium and copper alloys need their own tables.
- Rockwell C stops at 20 HRC and Rockwell B at 100 HRB. Below 20 HRC use Rockwell B; above 100 HRB use Rockwell C.
- Where Table 1 meets Table 2, around 98 to 100 HRB, the two tables differ by up to 10 HV. Conversions in that band are less certain.
- The tensile strength is only an estimate. ISO 18265 calls it the least reliable of the converted values.
- A converted value never replaces a test in the scale a specification asks for. ASTM E140 itself says to convert only when testing in that scale is not possible.

## Worked example

A heat-treated shaft of alloy steel tests at 45 HRC. What are its Vickers and Brinell hardness and its approximate tensile strength?

1. ASTM E140 Table 1, row 45 HRC: 446 HV and 421 HBW.
2. ISO 18265 Table A.1: 440 HV is 1 420 MPa and 450 HV is 1 455 MPa.
3. Interpolate at 446 HV: 1 420 + 0.6 × 35 = 1 441 MPa.

So the shaft is about 446 HV, 421 HBW and 1 441 MPa. The older SAE tensile column printed with E140-based charts gives 1 480 MPa for 45 HRC, within 3 % of this estimate.

A softer plate at 85 HRB converts the same way through Table 2: 165 HV, 165 HB and about 530 MPa.

## FAQ

**Can I convert HRC to HRB?**
Only near the top of the B scale. 20 HRC is about 99.7 HRB, and the B scale ends at 100 HRB, so harder steels have no HRB value.

**How do I convert Brinell to Rockwell C?**
Find the Brinell number in E140 Table 1 and read the HRC in the same row. For example, 400 HBW is 43 HRC.

**How accurate are hardness conversions?**
They are approximate. ASTM E140 warns that converted values may be inaccurate for a given material, and ISO 18265 treats the tensile estimate as the least reliable.

**Why is there no tensile strength above 650 HV?**
ISO 18265 Table A.1 stops at 650 HV and 2 180 MPa. Harder steels are brittle, and their tensile strength depends more on defects than on hardness.

**Does this work for stainless steel?**
Not for austenitic grades such as 304 and 316. ASTM E140 gives austenitic stainless steel a table of its own.

**What is the difference between HB and HBW?**
HBW means the test used a tungsten carbide ball. Older tests with a steel ball were marked HBS; modern standards allow only the carbide ball.

## Related calculators

- [Material properties](../material-properties/index.html) — strength and stiffness of common engineering materials.
- [Stress and strain](../stress-strain/index.html) — the stress a part sees under load.
- [Fatigue safety factor](../fatigue-goodman/index.html) — endurance limit from the tensile strength.
- [Bolt torque and preload](../bolt-torque/index.html) — bolt property classes and their hardness ranges.
