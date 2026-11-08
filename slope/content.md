# Slope calculator: percent, degrees, ratio and pitch

**Summary:** Convert slope between percent grade, degrees, ratio 1 in n and roof pitch, or find it from rise and run, with the slope length and height change.

## Introduction

Slope is written in many ways. Road engineers use percent grade, roofers use pitch in inches per foot, ramp and drainage rules use ratios such as 1 : 12, and surveyors use degrees. All of them come from the same thing: the rise divided by the horizontal run. A 1 m rise over 12 m is 8.33 %, 4.76°, 1 : 12 and a 1 in 12 pitch.

This calculator converts between all five forms, or finds the slope from a measured rise and run. It also gives the length along the slope and the rise over any run, and compares the result with common limits such as the accessible-ramp maximum. It is for builders, landscapers, roofers, road and drainage designers, and anyone laying out a ramp or path.

## Formulas

From rise and run:

    grade = rise / run                 percent = 100 × rise / run
    θ = arctan(rise / run)
    ratio 1 : n,  n = run / rise
    pitch = 12 × rise / run            inches per foot
    length along the slope = √(run² + rise²)

- rise — vertical change; run — horizontal distance
- θ — angle above the horizontal

## Assumptions and limitations

- The run is horizontal, not measured along the slope. On steep slopes the difference matters: at 45° the surface is 41 % longer than the run.
- 100 % grade is 45°, not vertical. Grades above 100 % are steeper than 45°.
- Ratios are written here as 1 : n, rise first. Embankment batters are often written n H : 1 V, which means the same n.
- The typical limits are general guidance. Building codes, road standards and drainage rules set the values that apply to a project.

## Worked example

A wheelchair ramp must climb 1 m. If it runs 12 m horizontally, what is its slope?

1. Grade: 1 / 12 = 0.0833, or 8.33 %.
2. Angle: arctan(0.0833) = 4.76°.
3. Ratio: 1 : 12, exactly the maximum running slope of the 2010 ADA Standards.
4. Length along the ramp: √(12² + 1²) = 12.04 m.

A shorter run would make the ramp too steep for the ADA limit.

## FAQ

**How do I calculate slope percentage?**
Divide the rise by the run and multiply by 100. A 3 ft rise over 50 ft is 6 %.

**How do I convert percent slope to degrees?**
Take the arctangent of the percent divided by 100. 10 % is 5.71°, 50 % is 26.57°, 100 % is 45°.

**What is a 4/12 roof pitch in degrees?**
18.43°, a grade of 33.3 %. A 6/12 roof is 26.57° and a 12/12 roof is 45°.

**What is the maximum slope for a wheelchair ramp?**
1 : 12, or 8.33 %, under the ADA Standards, with a rise of no more than 30 in per run. Many countries use similar or gentler limits.

**What slope does a drain or patio need?**
Paving and flat roofs need about 1 to 2 % to shed water. Drainage pipes are usually laid at 1 : 40 to 1 : 100 depending on their size.

**What is 1 : 20 as a percentage?**
5 %. Below 1 : 20, a walking surface is not treated as a ramp under the ADA Standards.

## Related calculators

- [Earthwork volume](../earthwork-volume/index.html) — cut and fill on sloping ground.
- [Manning channel flow](../manning-channel-flow/index.html) — flow down a sloped channel.
- [Concrete slab calculator](../concrete-slab/index.html) — slabs laid to a fall.
- [Concrete footing calculator](../concrete-footing/index.html) — stepped footings on slopes.
