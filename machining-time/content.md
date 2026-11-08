# Machining time calculator (turning, facing, drilling, milling)

**Summary:** Cutting time per pass and per part for turning, facing, drilling and milling from length, feed and rpm, and total job time with set-up and handling.

## Introduction

Cutting time is the distance the tool feeds divided by the feed rate. On a lathe or a drill, the feed rate is the feed per revolution times the rpm. Turning 100 mm plus 3 mm of approach at 0.2 mm/rev and 1 000 rpm takes 103 ÷ 200 = 0.515 min. A milling cutter feeds at chip load × teeth × rpm.

This calculator gives the tool travel, the feed rate and the cutting time of one pass, the time per part for several passes, and the total job time for a batch with set-up and handling time. It covers turning, facing, drilling and milling. It is for machinists, CNC programmers and estimators quoting jobs and planning shifts.

## Formulas

Feed rate:

    turning, facing, drilling:  v_f = f × n
    milling:                    v_f = f_z × z × n

Tool travel per pass:

    turning, milling:  L_t = L + approach and overtravel
    facing:            L_t = (D − d) / 2 + approach
    drilling:          L_t = depth + D / (2 tan(θ/2)) + approach

Times:

    t_pass = L_t / v_f
    t_part = passes × t_pass
    t_job = set-up + parts × (t_part + handling)

- f — feed per revolution; f_z — feed per tooth; z — number of teeth; n — spindle speed
- L — length of cut; D — outside or drill diameter; d — bore diameter; θ — drill point angle

## Assumptions and limitations

- The tool feeds at a constant rate over the whole travel. Rapid moves, tool changes and acceleration belong in the handling time per part.
- Facing runs at a constant rpm. A lathe with constant surface speed raises the rpm towards the centre and finishes the face sooner.
- Drilling adds the length of the drill point, so the full diameter reaches the stated depth. For a through hole, the approach and overtravel should include the breakthrough.
- In milling, the travel is the path of the cutter centre. A face mill must travel its own diameter past the part to clear the surface completely.
- Spindle speeds and feeds come from the speeds and feeds calculator or the tool maker's data.

## Worked example

A shaft is turned over 100 mm with 3 mm of approach and overtravel. The feed is 0.2 mm/rev at 1 000 rpm, in two passes. A batch of 50 parts needs 30 min of set-up and 0.5 min of handling per part.

1. Feed rate: 0.2 × 1 000 = 200 mm/min.
2. Time per pass: 103 / 200 = 0.515 min.
3. Time per part: 2 × 0.515 = 1.03 min of cutting, 1.53 min with handling.
4. Job time: 30 + 50 × 1.53 = 106.5 min, about 1.8 hours.

After set-up, the lathe makes about 39 parts an hour.

## FAQ

**How do I calculate machining time?**
Divide the tool travel by the feed rate. The feed rate is feed per revolution times rpm, or chip load times teeth times rpm for milling.

**What is approach and overtravel?**
The extra distance the tool feeds before it enters and after it leaves the cut. A milling cutter that must clear the work needs more than a lathe tool.

**How do I estimate drilling time?**
Add the drill point length to the depth: about 0.3 × the diameter for a 118° drill. Then divide by feed per revolution times rpm.

**Why is my real cycle time longer than the calculated cutting time?**
Rapids, tool changes, spindle starts, measuring and loading all add time. Put them in the handling time per part.

**What is floor-to-floor time?**
The time from picking up a raw part to putting down a finished one. It is cutting time plus handling.

**How do I reduce machining time?**
Raise the feed or the cutting speed within the tool's limits, take fewer, deeper passes, and shorten the approach. Set-up time matters most for small batches.

## Related calculators

- [Speeds and feeds calculator](../speeds-feeds/index.html) — rpm and feed for the cut.
- [Chip load calculator](../chip-load/index.html) — milling feed with chip thinning.
- [Drill point length](../drill-point-length/index.html) — the point length added to drilling depth.
- [OEE and takt time calculator](../oee-takt/index.html) — machine effectiveness and the pace demand sets.
