# Compression ratio calculator

**Summary:** Static compression ratio from bore, stroke, chamber volume, head gasket, deck clearance and piston dome or dish, with swept and clearance volumes.

## Introduction

The compression ratio of an engine is the volume above the piston at the bottom of its stroke divided by the volume at the top. To calculate it, add the swept volume of one cylinder to its clearance volume and divide by the clearance volume. A 350 small-block with a 4.030 in bore, 64 cc heads and a flat-top piston with valve reliefs comes out at about 9.75:1.

This calculator adds up the clearance volume from the head chamber, the head gasket, the deck clearance and the piston dish or dome. It then gives the static compression ratio, each volume in cc and the engine displacement. It is for engine builders choosing heads, gaskets and pistons, and for anyone checking a build sheet.

## Formulas

Volumes of one cylinder:

    V_s = π/4 × b² × s
    V_gasket = π/4 × b_g² × t
    V_deck = π/4 × b² × d
    V_c = V_chamber + V_gasket + V_deck + V_piston

Static compression ratio:

    CR = (V_s + V_c) / V_c

- b — cylinder bore; s — stroke
- b_g — head gasket bore; t — compressed gasket thickness
- d — deck clearance, positive when the piston stops below the deck
- V_chamber — head chamber volume in cc
- V_piston — dish and valve reliefs positive, dome negative
- 1 in³ = 16.387 cc

## Assumptions and limitations

- This is the static ratio. The intake valve closes well after bottom dead centre, so the dynamic ratio that sets cylinder pressure is lower. Cam timing matters as much as the static number.
- Use the compressed gasket thickness from the gasket maker, not the free thickness of the gasket.
- A piston above the deck gives a negative deck volume. The calculator stops if the piston would touch the head.
- The volume beside the top ring land is not included. Measuring the chamber and piston with a burette is more accurate than catalogue figures.

## Worked example

A 350 small-block is bored 0.030 in over to 4.030 in and keeps the 3.480 in stroke. The heads have 64 cc chambers. The gasket is 0.041 in thick with a 4.100 in bore. The pistons sit 0.025 in below the deck and have 5 cc of valve reliefs.

1. Swept volume: π/4 × 4.030² × 3.480 = 44.39 in³ = 727.4 mL (cc).
2. Gasket volume: π/4 × 4.100² × 0.041 = 0.541 in³ = 8.87 mL.
3. Deck volume: π/4 × 4.030² × 0.025 = 0.319 in³ = 5.23 mL.
4. Clearance volume: 64 + 8.87 + 5.23 + 5 = 83.1 mL.
5. Compression ratio: (727.4 + 83.1) / 83.1 = 9.75:1.

The eight cylinders displace 355.1 in³, or 5.82 L. A gasket 0.015 in thinner would raise the ratio to about 10.1:1.

## FAQ

**How do I calculate compression ratio?**
Divide the swept volume plus the clearance volume by the clearance volume. The clearance volume is the chamber, gasket, deck and piston volumes added together.

**What compression ratio can I run on pump gas?**
It depends on the cam timing, the chamber shape, the cooling and the fuel octane. Ask the piston or cam maker for the ratio that suits the combination.

**How does a thinner head gasket change compression?**
It reduces the clearance volume. In the example, each 0.010 in of gasket thickness on a 4.100 in gasket bore is about 2.2 cc.

**Is a dome positive or negative?**
Enter a dome as a negative volume, because it fills part of the chamber. Enter a dish and valve reliefs as positive volumes.

**What is the difference between static and dynamic compression ratio?**
The static ratio uses the full stroke. The dynamic ratio uses only the stroke after the intake valve closes, so it is always lower.

**What is deck clearance?**
The distance from the piston crown at top dead centre to the block deck. Adding it to the gasket thickness gives the piston-to-head distance.

## Related calculators

- [Engine displacement](../engine-displacement/index.html) — cubic inches and litres from bore and stroke.
- [Horsepower calculator](../horsepower/index.html) — power from torque and rpm or drag-strip results.
- [Fuel injector size](../fuel-injector-size/index.html) — injector flow for the power target.
- [Engine BMEP](../engine-bmep/index.html) — mean effective pressure from power and displacement.
