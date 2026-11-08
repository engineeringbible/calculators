# Drain pipe size calculator (Manning)

**Summary:** Gravity drain and sewer pipe sizing by Manning: full-flow capacity and velocity, smallest standard diameter for a flow, flow depth and self-cleansing check.

## Introduction

How do you size a gravity drain pipe? Use Manning's equation to find how much the pipe carries when it flows full at its slope, and choose the smallest standard size that carries the design flow. An 8 in concrete sewer laid at 0.40 % carries 343 US gallons per minute at 2.19 ft/s when full. That velocity meets the usual rule of at least 2 ft/s, which keeps solids moving.

This calculator gives the full-flow capacity and velocity of a pipe from its diameter, material and slope. It finds the smallest standard size for a design flow, and the depth and velocity of that flow in the chosen pipe. It also checks the self-cleansing velocity and gives the minimum slope that reaches it. It is for civil engineers, site designers and contractors laying storm drains, sewers and land drains.

## Formulas

Manning's equation for a pipe flowing full:

    V = (1/n) × R^(2/3) × S^(1/2)        (SI, metres)
    V = (1.486/n) × R^(2/3) × S^(1/2)    (US, feet)
    Q = A × V,  A = π D² / 4,  R = D / 4

Part-full pipe at depth y, and the minimum slope:

    θ = 2 acos(1 − 2y/D)
    A = D² (θ − sin θ) / 8,  P = D θ / 2,  R = A / P
    S_min = (n × V_min / R^(2/3))²

- D — inside diameter; S — slope as a fraction, 1 % = 0.01
- n — Manning roughness: 0.009 for smooth PVC, 0.013 for concrete and clay, and for any pipe where the agency requires it
- V_min — self-cleansing velocity, 2.0 ft/s (0.61 m/s) flowing full
- A, P, R — flow area, wetted perimeter and hydraulic radius

## Assumptions and limitations

- Flow is steady and uniform in a straight pipe of constant slope. Manhole losses, bends, backwater and surcharge are not included.
- Smooth PVC tests at n = 0.009, but many agencies require 0.013 for every material to allow for joints and slime. Use the value your reviewer accepts.
- The nominal size is used as the inside diameter. Plastic sewer pipe is often slightly smaller inside, so enter the true bore for a close check.
- The self-cleansing check follows the Ten States Standards, which want at least 2.0 ft/s with the pipe flowing full.
- Building drains are sized by the plumbing code with drainage fixture units. Those tables are not reproduced here.

## Worked example

An 8 in concrete sewer is laid at 0.40 % with n = 0.013. What does it carry flowing full, and how deep does a design flow of 150 US gpm run?

1. Area: π × (8/12)² / 4 = 0.349 ft²; hydraulic radius D/4 = 0.167 ft.
2. Velocity full: 1.486 / 0.013 × 0.167^(2/3) × 0.004^(1/2) = 2.19 ft/s.
3. Capacity: 0.349 × 2.19 = 0.764 ft³/s, which is 343 US gpm.
4. Self-cleansing: 2.19 ft/s is above 2.0 ft/s, so the slope is adequate.
5. Design flow: 150 / 343 = 44 % of the full capacity.
6. Depth by Manning's equation on the part-full section: y/D = 0.46, or 3.7 in.
7. Velocity at that depth: 2.12 ft/s.

A 6 in pipe at the same slope would carry 159 gpm full, just enough for 150 gpm. Public sewers are usually at least 8 in, which also leaves room for peak flows.

## FAQ

**What is the minimum velocity in a sewer?**
2.0 ft/s, or 0.61 m/s, with the pipe flowing full, by the Ten States Standards. Lower velocities let grit and solids settle.

**What slope does an 8 in sewer need?**
The Ten States Standards ask for at least 0.40 % with n = 0.013. Manning's equation gives 2 ft/s at 0.334 %, so the table keeps a margin.

**How much does a 4 in PVC drain carry?**
At ¼ in per foot, 2.08 %, a 4 in pipe with n = 0.009 carries about 178 US gpm flowing full at 4.55 ft/s.

**What Manning's n should I use for PVC pipe?**
0.009 for smooth-wall PVC by Uni-Bell tests, but many agencies require 0.013 for all materials. Corrugated pipes are much rougher.

**Why does a pipe carry most at about 94 % depth?**
Near the crown the wetted perimeter grows faster than the area, so friction rises. The free-surface flow peaks near 94 % depth at about 1.08 times the full-pipe flow.

**Why is the velocity at half depth the same as full?**
At half depth the hydraulic radius is D/4, the same as for the full pipe. The velocity is equal and the flow is exactly half.

## Related calculators

- [Open-channel flow (Manning)](../manning-channel-flow/index.html) — ditches, channels and part-full pipes in detail.
- [Culvert capacity and headwater calculator (HDS-5)](../culvert-capacity/index.html) — pipes under roads with inlet and outlet control.
- [Rational-method runoff](../rational-runoff/index.html) — the storm flow the drain must carry.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — pressurised pipes with Darcy–Weisbach friction.
