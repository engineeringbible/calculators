# Mooring line and winch brake (MEG4) calculator

**Summary:** OCIMF MEG4 values from the ship design MBL: line LDBF range, WLL, tail strength, fitting SWL, brake holding and rendering, and the drum-layer derating.

## Introduction

The fourth edition of the OCIMF Mooring Equipment Guidelines reorganised mooring strength around one number, the Ship Design Minimum Breaking Load: lines are bought at 100–105 % of it, worked to 50 % of it, tails are 125–130 % of it, fittings carry 1.25 times it, and the winch brake is designed to hold 80 % and set to render at 60 % of it, so that in an overload the line slips on the drum before anything breaks. This calculator derives all of those from the SDMBL, checks the line and tail certificates and the last brake test against them, and shows how much the rendering load drops when the ship is moored on the second or third layer of the drum.

It is for chief officers and superintendents maintaining the Mooring System Management Plan, vetting inspectors, and students of marine operations.

## Formulas

    LDBF = 1.00–1.05 × SDMBL,   WLL = 0.50 × SDMBL
    tail design break force ≥ 1.25 × SDMBL (synthetic / HMSF lines), 1.30 × SDMBL (steel wire lines)
    fitting SWL ≥ 1.25 × SDMBL
    brake design holding capacity = 0.80 × SDMBL,   brake rendering set point = 0.60 × SDMBL (first layer)
    r_k = D_drum/2 + (k − 0.5) d_rope,   rendering load on layer k = set point × r₁/r_k

## Assumptions and limitations

- MEG4 recommendations; the ship's MSMP, Line Management Plan and terminal requirements govern.
- Static comparison of certificate values and set points; dynamic loads, line sharing and fatigue belong to the mooring analysis.
- The layer derating assumes constant brake torque and neglects crushing of inner layers.

## Worked example

A tanker with SDMBL 1 000 kN, lines certified at 1 030 kN, synthetic tails at 1 300 kN, expected line load 350 kN from the mooring analysis, winch drum 600 mm with 44 mm rope, moored on the third layer, last brake test 600 kN.

1. Lines: 1 000–1 050 kN required; 1 030 kN (103 %) is within range. WLL 500 kN; the expected 350 kN is 70 % of it.
2. Tails: at least 1 250 kN; 1 300 kN passes. Fittings: SWL at least 1 250 kN.
3. Brake: designed to hold 800 kN, set to render at 600 kN on the first layer; the test at 600 kN is on the mark.
4. Third layer: r₁ = 322 mm, r₃ = 410 mm → the brake renders at 600 × 322/410 = 471 kN, only 47 % of the SDMBL. Either moor on the first layer or raise the setting for the layer in use, as MEG4 advises.

A line certified at 1 100 kN would be flagged as too strong: it would overload the fittings and winch before parting.

## FAQ

**Why cap the line strength at 105 %?**
The system is designed so the line is the weakest link after the brake renders; a much stronger line transfers the overload to bitts, fairleads and the winch.

**Why does the brake render at 60 % and not at the WLL?**
Rendering at 60 % leaves margin above the normal working load (50 %) while still protecting the line, whose break force is at least 100 %.

**What is the difference between design holding capacity and rendering?**
Design holding capacity (80 %) is what the brake can hold when fully applied; the rendering set point (60 %) is where it is adjusted to slip in service, verified by the annual test.

**Why are tails stronger than the lines?**
Tails see the chafe and the cyclic loading at the shore bollard and fatigue fastest; the extra strength keeps them from becoming the weak link as they age.

**How much does the second layer matter?**
With this drum and rope the second layer renders at about 88 % of the first-layer value and the third at 79 %; on small drums with thick ropes the loss is larger.

**Where does the SDMBL come from?**
From the mooring design for the standard environmental criteria (60 kn wind, 3 kn current for tankers), recorded in the MSMP; it is not the certificate value of the lines on board.

## Related calculators

- [Anchor chain catenary](../anchor-catenary/index.html) — the other restraint system.
- [Lifting sling loads](../lifting-sling/index.html) — wire and fibre rope strength conventions.
- [Bollard pull for a tow](../bollard-pull/index.html) — tug forces at the berth.
- [Berthing energy (PIANC)](../berthing-energy/index.html) — fender loads alongside.
- [Beaufort scale and sea state](../beaufort-sea-state/index.html) — wind for the environmental criteria.
