# Chip load calculator with chip thinning

**Summary:** Chip load per tooth from feed rate, rpm and flutes, or the feed rate for a target chip load, with the radial chip thinning factor for light cuts.

## Introduction

Chip load is the thickness of material each tooth of a milling cutter removes. It equals the feed rate divided by the number of teeth and the rpm. A four-flute end mill feeding at 40 in/min and turning at 5 000 rpm takes 0.002 in per tooth. Too small a chip rubs and wears the tool. Too large a chip breaks it.

This calculator gives the chip load from a feed rate, or the feed rate for a target chip load. It also corrects for radial chip thinning. When the cutter engages less than half its diameter, the real chip is thinner than the feed per tooth, so the feed can rise. The page is for CNC programmers and machinists using light-stepover, high-efficiency toolpaths.

## Formulas

Chip load and feed rate:

    f_z = v_f / (z × n)
    v_f = f_z × z × n

Radial chip thinning, for a_e below D/2:

    RCTF = 1 / √(1 − (1 − 2 a_e / D)²)
    h_ex = f_z / RCTF
    programmed f_z = target chip × RCTF

Engagement angle:

    φ = arccos(1 − 2 a_e / D)

- v_f — feed rate; z — number of flutes; n — spindle speed in rpm
- f_z — feed per tooth (chip load); h_ex — maximum chip thickness
- a_e — radial depth of cut (stepover); D — cutter diameter
- At a_e = D/2 or more, RCTF = 1 and the chip equals the feed per tooth

## Assumptions and limitations

- Every tooth cuts equally. Runout in the holder makes one tooth take a larger chip than the others.
- The correction is for the side of a square-end mill. Ball-nose and chamfer cutters also thin the chip along the axis, which this page does not include.
- Raising the feed restores the chip thickness. The machine, the holder and the tool must still take the higher feed rate, and the tool maker may set a limit.
- The target chip load comes from the tool maker's table for the material and the cutter diameter.

## Worked example

A 1/2 in four-flute end mill runs at 5 000 rpm with a 0.05 in stepover. The tool maker recommends a chip load of 0.002 in.

1. Radial engagement: 0.05 / 0.5 = 10 %.
2. Thinning factor: 1 / √(1 − (1 − 0.2)²) = 1 / √0.36 = 1.667.
3. Programmed feed per tooth: 0.002 × 1.667 = 0.00333 in.
4. Feed rate: 0.00333 × 4 × 5 000 = 66.67 in/min.

Without the correction the feed rate would be 40 in/min. The tool would rub with a chip only 0.0012 in thick.

## FAQ

**What is chip load?**
The feed per tooth: how far the cutter moves while one tooth passes through the cut. It sets the thickness of the chip at full engagement.

**How do I calculate chip load from feed rate?**
Divide the feed rate by the number of flutes and by the rpm. 40 in/min at 5 000 rpm with four flutes is 0.002 in.

**What is chip thinning?**
At a stepover below half the diameter, the tooth meets the work at a shallow angle. The chip it cuts is thinner than the feed per tooth.

**When does chip thinning apply?**
Only when the radial engagement is less than half the cutter diameter. At 50 % or more, the factor is 1.

**How much can I raise the feed for a light stepover?**
At 35 % engagement about 5 %, at 10 % engagement 67 %, and at 5 % engagement 129 %. Check that the machine can reach the feed rate.

**Does chip thinning change the surface finish?**
A higher feed per tooth leaves larger scallops on the side wall. For a finishing pass, the wall finish may limit the feed instead.

## Related calculators

- [Speeds and feeds calculator](../speeds-feeds/index.html) — rpm and starting cutting speeds.
- [Machining time calculator](../machining-time/index.html) — the time a pass takes at this feed.
- [Surface finish converter](../surface-finish/index.html) — Ra, Rz and N grades.
- [Drill point length](../drill-point-length/index.html) — drilling depth for a full-diameter hole.
