# Tap drill size calculator (metric and UNC/UNF)

**Summary:** Tap drill for metric coarse and fine and UNC/UNF threads at any percentage of thread, with the nearest standard drill and the basic pitch and minor diameters.

## Introduction

A tap cuts a thread into a drilled hole. The drill size sets how deep the thread is, measured as a percentage of a full thread. The tap makers' formula is: drill = major diameter − 0.01299 × percentage ÷ threads per inch. For 1/4-20 UNC at 75 % thread that gives 0.2013 in, and the nearest standard drill is a #7. In metric, the drill is about the major diameter minus the pitch: 8.5 mm for M10 × 1.5.

This calculator gives the theoretical drill for any percentage of thread, the nearest standard drill and the thread it really gives. It covers ISO metric coarse and fine threads from M2 to M24 and UNC and UNF threads from #4 to 1 in. It also lists the basic pitch and minor diameters of ISO 724 and ASME B1.1, and a table of drills for every size. It is for machinists, toolmakers and designers.

## Formulas

Tap drill for a percentage of thread:

    drill = D − 1.299 × P × %/100
    inch:   drill = D − 0.01299 × % / TPI
    metric: drill = D − % × P / 76.98

Thread percentage a drill gives:

    % = (D − drill) / (1.299 × P) × 100

Basic dimensions (ISO 724, ASME B1.1):

    pitch diameter   d2 = D − 0.649519 × P
    minor diameter   D1 = D − 1.082532 × P

- D — major (nominal) diameter; P — pitch, P = 1/TPI for inch threads
- 100 % thread is a double thread depth of 1.299 P, so the basic minor diameter D1 is 83.3 % thread

## Assumptions and limitations

- The percentage of thread follows the convention of tap makers and Machinery's Handbook. Other charts measure from D1 instead, so their percentages differ.
- About 75 % thread is the usual choice for cut taps in steel. A full thread is only slightly stronger but much harder to tap.
- The drilled hole should lie in the minor diameter tolerance of the thread class, such as 6H or 2B. This page gives the basic value D1, the bottom of that band.
- Drills cut slightly oversize, so the real thread is a little shallower than calculated.
- Form taps, also called roll taps, push the metal instead of cutting it. They need a larger hole from the tap maker's chart.
- Charts sometimes pick the next smaller standard drill, such as 10.2 mm for M12 instead of 10.3 mm.

## Worked example

What drill should be used for a 1/4-20 UNC thread at 75 % thread?

1. Major diameter D = 0.250 in, 20 threads per inch.
2. Theoretical drill: 0.25 − 0.01299 × 75 / 20 = 0.2013 in.
3. Nearest standard drill: #7, which is 0.2010 in.
4. Thread with the #7 drill: (0.25 − 0.201) / (1.299 / 20) = 75.4 % thread.
5. Basic pitch diameter: 0.25 − 0.649519 / 20 = 0.2175 in. Basic minor diameter: 0.25 − 1.082532 / 20 = 0.1959 in.

## FAQ

**How do I calculate tap drill size?**
For metric coarse threads, subtract the pitch from the diameter: M8 × 1.25 needs 6.8 mm. For inch threads, subtract 0.01299 × 75 ÷ TPI for 75 % thread.

**What percentage of thread should I use?**
Around 75 % for general work in steel. Use less in tough or hard materials and in long engagements, where tapping torque matters more.

**Why not drill for 100 % thread?**
The tap would have to cut the whole profile, so tapping torque and the risk of breaking the tap rise sharply. The drill would also be smaller than the basic minor diameter of the nut.

**What drill do I need for M6?**
5.0 mm, which gives 77 % thread. For the fine thread M6 × 0.75 use 5.3 mm.

**What is the difference between UNC and UNF?**
UNF has more threads per inch for the same diameter, which gives a larger tensile stress area. UNC is the general-purpose series and is the usual choice in soft materials.

**What is the minor diameter of a thread?**
The diameter at the root of an external thread, or at the crest of an internal one. The basic minor diameter of the nut is D − 1.0825 P.

## Related calculators

- [Drill point length](../drill-point-length/index.html) — how deep to drill a blind tapped hole.
- [Speeds and feeds calculator](../speeds-feeds/index.html) — rpm and feed for the drill.
- [Bolt torque and preload](../bolt-torque/index.html) — tightening the screw in the thread.
- [Bend allowance calculator](../bend-allowance/index.html) — sheet metal parts that receive the holes.
