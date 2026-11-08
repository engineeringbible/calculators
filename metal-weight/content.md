# Steel and metal weight calculator

**Summary:** Weight of steel, stainless, aluminium, copper and brass plate, bar, tube, pipe, angle, beam and channel, per metre or foot, per piece and in total.

## Introduction

The weight of a steel bar, plate or tube is its cross-section area times its length times the density of the metal. Steel weighs 7 850 kg per cubic metre, so a 20 mm round bar weighs 2.47 kg per metre, and a 10 mm plate 78.5 kg per square metre. The numbers matter for ordering, transport, lifting and the dead load in a structure.

This calculator gives the cross-section, weight per metre and per foot, weight per piece and total weight of the common shapes: plate, round, square, hex and flat bar, round and rectangular tube, angle, I-beam and channel. It covers carbon and stainless steel, aluminium, copper, brass, bronze, cast iron, titanium and lead, or any density you enter.

## Formulas

Weight of n pieces of length L:

    m = ρ × A × L × n

Cross-section areas:

    plate, flat bar:   A = w t
    round bar:         A = π d² / 4
    hex bar:           A = (√3 / 2) s²          s across flats
    round tube:        A = π t (D − t)
    rectangular tube:  A = b h − (b − 2t)(h − 2t)
    angle:             A = t (a + b − t)
    I-beam, channel:   A = 2 b t_f + (h − 2 t_f) t_w

- ρ — density: carbon steel 7 850, stainless 304 7 900, aluminium 2 700, copper 8 940 kg/m³
- D, t — outside diameter and wall of a tube; b, h — width and height

## Assumptions and limitations

- Weights are theoretical, for sharp-cornered shapes. Hot-rolled angles, beams and channels have root fillets, and tubes have rounded corners, so catalogue weights differ by a few percent. Use the catalogue weight for standard sections where it matters.
- Mill tolerances on thickness allow the real weight to vary by up to about 5 %.
- Enter the actual outside diameter of a pipe, not its nominal size: 2 in pipe is 60.3 mm (2.375 in) outside.
- Alloy densities vary by one or two percent. Enter a measured or catalogue density for exact work.

## Worked example

What does a 6 m length of 20 mm diameter steel round bar weigh?

1. Area: π × 20² / 4 = 314.2 mm² = 0.0003142 m².
2. Weight per metre: 7 850 × 0.0003142 = 2.466 kg/m, or 1.657 lb/ft.
3. Weight of the bar: 2.466 × 6 = 14.80 kg.

A bundle of 20 such bars weighs 296 kg.

## FAQ

**How do I calculate the weight of steel?**
Multiply the volume in cubic metres by 7 850 kg/m³. For a bar, the volume is the cross-section area times the length.

**How much does a steel plate weigh per square metre?**
7.85 kg per millimetre of thickness: 78.5 kg/m² for 10 mm, 157 kg/m² for 20 mm. In US units, 40.8 lb/ft² per inch of thickness.

**Is stainless steel heavier than carbon steel?**
Slightly: 304 is about 7 900 kg/m³ and 316 about 8 000 kg/m³, against 7 850 for carbon steel.

**How much lighter is aluminium?**
About a third of the weight of steel for the same shape: 2 700 against 7 850 kg/m³.

**What is the weight of steel pipe per metre?**
Use the outside diameter and wall: 60.3 × 3.9 mm (2 in Schedule 40) is 5.43 kg/m.

**Why does my supplier's weight differ?**
Catalogue weights include root fillets and corner radii, and suppliers sometimes quote the maximum weight within tolerance. Differences of 2 to 5 % are normal.

## Related calculators

- [Rebar weight and quantity](../rebar-weight/index.html) — reinforcing bars by size.
- [Moment of inertia (section properties)](../moment-of-inertia/index.html) — stiffness of the same shapes.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — concrete with its reinforcement.
- [Lifting sling](../lifting-sling/index.html) — rigging for the weight.
