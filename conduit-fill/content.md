# Conduit fill calculator (NEC)

**Summary:** Percent fill and the smallest EMT or PVC conduit for THHN wires under NEC Chapter 9, with how many wires of one size fit in each trade size.

## Introduction

How many wires can go in a conduit? The National Electrical Code (NEC) limits the share of the conduit's inside area that the wires may take up, so that they can be pulled without damage and do not overheat. For three or more wires the limit is 40 %. A ¾ in EMT therefore holds sixteen 12 AWG THHN wires, and a 1 in EMT holds twenty-six.

This calculator adds up the area of up to three groups of THHN/THWN-2 wires, applies the NEC limit, and checks a chosen size of EMT or PVC Schedule 40 conduit. It also finds the smallest trade size that complies, and how many wires of one size fit on their own. It is for electricians, estimators and engineers laying out raceways.

## Formulas

Total conductor area and percent fill:

    A_wires = Σ n_i × A_i
    fill = A_wires / A_conduit

The fill must not exceed the NEC Chapter 9 Table 1 limit:

    1 conductor:           53 %
    2 conductors:          31 %
    3 or more conductors:  40 %
    nipple ≤ 24 in:        60 % (Note 4)

Most conductors of one size:

    N = 0.40 × A_conduit / A_wire, rounded down, or up when the decimal is 0.8 or more (Note 7)

- n_i, A_i — number and area of each wire size, from Chapter 9 Table 5
- A_conduit — total inside area of the conduit, from Chapter 9 Table 4

## Assumptions and limitations

- The wires are THHN, THWN or THWN-2. XHHW is larger in the small sizes and slightly smaller in the large ones, and RHW and USE are larger, so they need their own areas from Table 5.
- Ground wires count in the fill. Bare grounds use their bare area from Table 8; this calculator treats every wire as insulated, which errs on the safe side.
- Conduit areas are those of EMT (Article 358) and PVC Schedule 40 (Article 352). Rigid metal conduit, IMC and flexible conduit have different inside areas.
- The fill limit is a maximum, not a target. Long runs and many bends pull more easily at lower fill. Ampacity derating for more than three current-carrying conductors in one raceway applies separately.

## Worked example

A 1 in EMT will carry three 12 AWG, four 10 AWG and eight 8 AWG THWN conductors. Is it large enough?

1. Wire areas from Table 5: 3 × 0.0133 + 4 × 0.0211 + 8 × 0.0366 = 0.0399 + 0.0844 + 0.2928 = 0.4171 in².
2. There are 15 conductors, so the limit is 40 %.
3. 1 in EMT has 0.864 in² inside, so 40 % allows 0.3456 in².
4. 0.4171 in² exceeds 0.3456 in²: the fill would be 48.3 %, too full.
5. 1-1/4 in EMT has 1.496 in², and 40 % is 0.5984 in², which is enough.

So the run needs 1-1/4 in EMT. This is the worked example published by the Steel Tube Institute.

## FAQ

**How many 12 AWG wires fit in ½ in EMT?**
Nine THHN wires. In ¾ in EMT sixteen, and in 1 in EMT twenty-six.

**How many 10 AWG wires fit in ¾ in conduit?**
Ten THHN in ¾ in EMT, and nine in ¾ in PVC Schedule 40.

**Why is the limit 40 % and not more?**
Round wires in a round pipe leave gaps, and a fuller conduit makes pulling hard and can strip insulation. The 53 % and 31 % limits for one and two wires reflect the jamming risk of those layouts.

**Do ground wires count toward conduit fill?**
Yes. NEC Chapter 9 Note 3 counts equipment grounding and bonding conductors, insulated or bare.

**Is PVC conduit the same size inside as EMT?**
No. PVC Schedule 40 has thicker walls, so its inside area is slightly smaller: 0.832 in² against 0.864 in² for 1 in, which is why it sometimes holds one wire fewer.

**What about a short nipple between two boxes?**
A nipple of 24 in or less may be filled to 60 %, and its wires need no ampacity derating.

## Related calculators

- [Wire size calculator](../wire-size/index.html) — the gauge for the voltage drop.
- [Breaker size calculator](../breaker-size/index.html) — the breaker for each circuit.
- [AWG wire gauge chart](../awg-wire-gauge/index.html) — bare conductor sizes and resistance.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — IEC cables and metric sizes.
