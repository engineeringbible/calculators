# Anchor holding power calculator

**Summary:** Holding capacity of an anchor from its mass and type (efficiency by anchor class) and the anchor mass needed to hold a design force.

## Introduction

An anchor's holding power is its weight multiplied by its efficiency, the number of times its own weight it can hold before it drags. Efficiency depends on the anchor design and the seabed. The Vryhof Anchor Manual groups drag anchors into classes, from about 4 to 6 for stockless ship anchors up to 33 to 55 for modern high-penetration designs. A 6 t stockless anchor at an efficiency of 4 holds about 24 tonnes-force, or 235 kN.

This calculator gives the holding capacity of an anchor from its mass and class, and the allowable force after a safety factor. It also works backwards to the anchor mass needed for a design force. It is the companion of the [anchor catenary calculator](../anchor-catenary/index.html), which gives the force the cable brings to the anchor. It is for ship officers, mooring designers and boat owners choosing an anchor.

## Formulas

Holding capacity and allowable force:

    H = η × W × g
    F_allow = H / SF

Size effect from Vryhof's holding-capacity charts (UHC = A W^0.92):

    H = η × W_ref g × (W / W_ref)^0.92,     W_ref = 10 t

Anchor mass for a design force F:

    W = F × SF / (η g)

Efficiencies η by Vryhof class, for a 10 t anchor:

- Class A, 33 to 55 — Stevpris, Stevshark, FFTS
- Class B, 17 to 25 — Bruce SS, Bruce TS, Hook
- Class C, 14 to 26 — Stevin, Stevfix, Stevmud, Flipper Delta
- Class D, 8 to 15 — Danforth, LWT, Moorfast, Stato, Offdrill, Boss
- Class E, 8 to 11 — AC14, Stokes, Snugstow, Weldhold
- Class F, 4 to 6 — US Navy stockless, Beyers, Union, Spek

## Assumptions and limitations

- The efficiencies apply to an anchor that has dug in fully with the line horizontal at the seabed. Any uplift of the cable at the shank reduces the holding sharply.
- The seabed matters. Holding is highest in sand and stiff clay and lower in very soft mud, where the fluke angle should be about 50°. On rock or weed an anchor may hardly hold at all.
- The low end of each range is used by default. Use the middle or high end only with good reason, such as test results in similar soil.
- The class figures come from offshore anchors around 10 t. For small boat anchors they are only a guide.

## Worked example

A ship has a 6 t stockless anchor. What holding power can it be counted on for, with a safety factor of 1.5?

1. Class F, low end of the range: η = 4.
2. Holding capacity: 4 × 6 t = 24 tonnes-force, which is 24 000 × 9.81 = 235 kN.
3. Allowable force: 235 / 1.5 = 157 kN.

The other way round: holding 300 kN with the same factor needs 300 × 1.5 / (4 × 9.81) = 11.5 t of stockless anchor, or 5.7 t of a Class D anchor at η 8.

## FAQ

**How do I calculate anchor holding power?**
Multiply the anchor's weight by its efficiency for the seabed. A 6 t stockless anchor at η 4 holds about 24 t, or 235 kN.

**What is a high holding power anchor?**
Under the IACS rules on anchoring equipment, an HHP anchor must hold at least twice as much as an ordinary stockless anchor of the same mass. Classes A to D are all well above stockless anchors.

**How much will a small boat anchor hold?**
By the Class D range, a 15 kg Danforth-type anchor holds 120 to 225 kgf, 1.2 to 2.2 kN. Small anchors in good sand often do better, and much worse in weed or soft mud.

**What safety factor should I use?**
API RP 2SK uses 1.5 for drag anchors of permanent moorings in the intact condition with a dynamic analysis. A ship at anchor relies on paying out more cable and on its engines, but a margin above the expected force is still prudent.

**Why does my anchor drag when the numbers say it should hold?**
The cable may lift at the shank, the anchor may not have dug in, the seabed may be poor, or yawing and snatching may double the static load. Check the scope with the catenary calculator.

**Does a heavier anchor always hold more?**
Yes, but less than in proportion. Vryhof's charts follow weight to the power 0.92, so twice the mass gives about 1.89 times the holding.

## Related calculators

- [Anchor cable catenary and scope](../anchor-catenary/index.html) — the force the cable brings to the anchor.
- [Wire rope and chain SWL](../wire-rope-swl/index.html) — strength of the cable and fittings.
- [Bollard pull for a tow](../bollard-pull/index.html) — wind, current and wave forces on a ship.
- [Mooring line and winch brake](../mooring-line-meg4/index.html) — mooring line strengths.
