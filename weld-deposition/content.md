# Weld metal and filler consumption calculator

**Summary:** Weld metal mass of fillet, single-V and double-V welds, filler needed for SMAW, GMAW, FCAW or SAW, electrodes or wire length and arc time.

## Introduction

The weld metal in a joint is its cross-section times its length times the density of steel. The filler you buy is more, because part of it never ends up in the weld. Stick electrodes lose their stubs, slag and spatter, so only about 55 % of their mass is deposited. Solid MIG wire deposits about 95 %. A 1/4 in fillet weld holds 0.106 lb of steel per foot.

This calculator gives the cross-section, the deposited mass and the filler metal needed for fillet, single-V and double-V butt welds with root gap and reinforcement. It then works out the number of stick electrodes or the length of wire, and the arc time at the deposition rate of your procedure. It is for welding engineers, estimators and fabricators planning consumables and welding time.

## Formulas

Weld cross-section without reinforcement:

    fillet (equal legs):   A = z² / 2
    single V:              A = g t + (t − f)² tan(α/2)
    double V (symmetric):  A = g t + (t − f)² tan(α/2) / 2

Mass, filler and time:

    m = A × (1 + r) × L × ρ
    filler = m / E
    wire length = filler / (ρ π d² / 4)
    arc time = m / deposition rate

- z — fillet leg; t — plate thickness; g — root gap; f — root face; α — included groove angle
- r — reinforcement and convexity allowance; L — weld length; ρ — weld metal density, 7 850 kg/m³ for steel
- E — deposition efficiency: 55 % SMAW, 95 % GMAW, 90 % FCAW, 100 % SAW (Kobe Steel)
- d — wire diameter

## Assumptions and limitations

- Fillet welds have equal legs and a flat face. Convexity and the cap on butt welds are added as a percentage of the area.
- The double-V joint is symmetric: both sides have the same bevel and depth.
- The efficiencies are typical values from a filler maker. Long stub ends, spatter and the welder's habits move them. Measure your own if you buy in bulk.
- Wire length assumes a solid wire. Flux-cored wire has less metal per metre, so it needs a longer length for the same mass.
- Arc time counts only the time the arc burns. Slag removal, interpass cleaning and handling add to the real welding time.
- SAW flux is not included. The flux maker gives its consumption per kilogram of wire.

## Worked example

A 10 mm plate has a single-V butt weld 1 m long. The groove has a 60° included angle, a 2 mm root gap and a 2 mm root face. The allowance for the cap is 10 %. It is welded by GMAW with 1.2 mm wire at 3 kg/h.

1. Gap: 2 × 10 = 20 mm². Bevel: (10 − 2)² × tan 30° = 36.95 mm².
2. With the 10 % cap: 56.95 × 1.1 = 62.65 mm².
3. Weld metal: 62.65 mm² × 1 m × 7 850 kg/m³ = 0.4918 kg.
4. Filler at 95 %: 0.4918 / 0.95 = 0.5176 kg.
5. 1.2 mm wire weighs 8.88 g/m, so 0.5176 kg is 58.3 m of wire.
6. Arc time: 0.4918 kg at 3 kg/h is 9.8 min.

## FAQ

**How do I calculate the weight of weld metal?**
Multiply the weld's cross-section by its length and by the density of the metal. Add an allowance for the cap or convexity.

**What is deposition efficiency?**
The share of the filler that ends up in the weld. The rest is lost as stub ends, slag, spatter and fume.

**How many welding rods do I need?**
Divide the deposited mass by 0.55 for stick electrodes. Then divide by the mass of one rod, which is the box mass divided by the number of rods.

**Why does a double-V joint use less filler?**
Each side is bevelled only half the plate depth. The bevel area grows with the square of its depth, so two half-depth bevels hold half the metal of one full-depth bevel.

**What is the difference between deposition rate and travel speed?**
Deposition rate is the mass of weld metal laid per hour. Travel speed is how fast the torch moves. A larger joint at the same deposition rate needs a slower travel speed.

**Does the calculator work for stainless steel or aluminium?**
Yes, if you change the density: about 7 900 kg/m³ for austenitic stainless steel and 2 700 kg/m³ for aluminium.

## Related calculators

- [Fillet weld strength](../fillet-weld/index.html) — the size the fillet needs for its load.
- [Weld fatigue damage](../weld-fatigue/index.html) — fatigue life of welded details.
- [Bend allowance calculator](../bend-allowance/index.html) — blanks for the parts being welded.
- [Machining time calculator](../machining-time/index.html) — job time for machining after welding.
