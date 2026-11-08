# Injection molding clamp tonnage calculator

**Summary:** Clamp force for an injection mould from projected area, cavities, cold runner and clamp factor or cavity pressure, with the machine size for a margin.

## Introduction

Molten plastic presses the two halves of a mould apart. The clamp of the moulding machine must hold them shut, or the part flashes at the parting line. The force needed is the projected area of the parts and runner times a clamp factor, the mean pressure in the cavity. Eight parts of 21.16 in² each at 3 tons per square inch need 507.8 US tons of clamp.

This calculator gives the total projected area, the clamp force and the smallest machine rating that keeps the clamp below a chosen share of its limit. It offers starting clamp factors from RJG and from polycarbonate processing guides, or takes your own cavity pressure. It is for mould designers, process engineers and buyers choosing a press.

## Formulas

Projected area and clamp force:

    A = n × A_cavity + A_runner
    F = A × p

Machine size:

    rating ≥ F / u

Units of the clamp factor:

    1 US ton/in² = 2 000 psi = 13.79 MPa = 1.38 kN/cm²

- n — number of cavities; A_cavity — projected area of one part; A_runner — projected area of a cold runner
- p — clamp factor, the mean cavity pressure over the projected area
- u — highest share of the machine rating to use, 80 % by default

## Assumptions and limitations

- The projected area is what you see looking along the direction the mould opens. Through-holes and cored-out areas are taken away. A hot runner adds no area.
- Clamp factors depend on the resin, the wall thickness and the flow length. RJG gives 2 to 10 tons/in² with 3 as a starting point. The Lexan guide gives 3 to 5 tons/in² for polycarbonate and about 1 ton/in² more for glass-filled grades.
- The best factor comes from the resin datasheet or from a cavity pressure measurement on the mould.
- The machine should run below its rating. Autodesk Moldflow advises keeping the peak clamp force under about 80 % of the machine limit.
- More clamp is not better. Excess force can damage the mould: RJG reports a cavity block that failed when clamped at four times the needed tonnage.

## Worked example

This is RJG's example. A part measures 4.6 × 4.6 in in the direction of opening, and the mould has 8 cavities. As in the example, no runner area is added. Use 3 tons/in² as the starting clamp factor.

1. Area of one part: 4.6 × 4.6 = 21.16 in².
2. Total projected area: 8 × 21.16 = 169.28 in².
3. Clamp force: 169.28 × 3 = 507.8 US tons, or 4 518 kN.
4. Smallest machine at 80 % use: 507.8 / 0.8 = 634.8 tons.

At the 2 to 3 tons/in² that RJG expects for this part, the clamp needs 339 to 508 tons.

## FAQ

**How do I calculate clamp tonnage?**
Multiply the total projected area in square inches by the clamp factor in tons per square inch. Include every cavity and a cold runner.

**What clamp factor should I use?**
The resin supplier's value for the grade. Without one, RJG suggests 3 tons/in² as a starting point. Polycarbonate guides give 3 to 5 tons/in².

**What is projected area?**
The shadow of the part on the parting plane, seen along the direction of mould opening. Side walls parallel to the opening add nothing.

**Why should the machine not run at its full rating?**
Autodesk Moldflow advises keeping the peak below about 80 % of the limit. The other 20 % is a reserve for pressure peaks, sliding cores and other loads from the tool.

**What happens if the clamp force is too low?**
The mould opens slightly under injection pressure and plastic flashes at the parting line.

**How do I convert tons per square inch to MPa?**
Multiply by 13.79. 3 tons/in² is 41.4 MPa, the same as 6 000 psi.

## Related calculators

- [Press tonnage calculator](../press-tonnage/index.html) — punching and press brake forces.
- [OEE and takt time calculator](../oee-takt/index.html) — effectiveness of the moulding cell.
- [Hydraulic cylinder force and speed](../hydraulic-cylinder/index.html) — force of a hydraulic clamp.
- [Tolerance stack-up](../tolerance-stack/index.html) — tolerances of moulded assemblies.
