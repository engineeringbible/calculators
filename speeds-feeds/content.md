# Speeds and feeds calculator (milling, turning, drilling)

**Summary:** Spindle rpm, feed rate and metal removal rate for milling, turning and drilling, with starting cutting speeds for common materials in HSS and carbide.

## Introduction

Speeds and feeds set how fast a tool turns and how fast it moves through the work. The cutting speed is the surface speed at the cutting edge, in feet or metres per minute. The spindle speed follows from it: rpm = cutting speed ÷ (π × diameter). A 1/2 in carbide end mill cutting mild steel at 200 sfm turns at 1 528 rpm. With four teeth taking 0.003 in each, it feeds at 18.33 in/min.

This calculator gives the spindle speed, the feed per revolution, the feed rate in in/min and mm/min, and the metal removal rate for milling, turning and drilling. It also lists starting cutting speeds for common work materials with high-speed steel (HSS) and carbide tools. It is for machinists, CNC programmers and students setting up a first cut.

## Formulas

Spindle speed from the cutting speed:

    n = v_c / (π D)
    n [rpm] = 12 × v_c [sfm] / (π × D [in]) ≈ 3.82 × v_c / D
    n [rpm] = 1000 × v_c [m/min] / (π × D [mm])

Feed rate:

    milling:            v_f = f_z × z × n
    turning, drilling:  v_f = f × n

Metal removal rate:

    milling:   Q = a_p × a_e × v_f
    turning:   Q = v_c × f × a_p          (Q = 12 V f d in in³/min)
    drilling:  Q = (π D² / 4) × v_f

- v_c — cutting speed; D — diameter of the cutter, the drill or the workpiece being turned
- f_z — chip load per tooth; z — number of teeth or flutes; f — feed per revolution
- a_p — depth of cut; a_e — width of cut (radial engagement in milling)

## Assumptions and limitations

- The table speeds are starting values for sharp tools, rigid set-ups and coolant. Raise them if the tool lasts well. Lower them if it wears fast, chatters or the work hardens.
- HSS speeds are the traditional turning speeds of Machinery's Handbook. Carbide speeds are the middle of Harvey Tool's ranges for solid carbide end mills. Indexable inserts have their own ratings from the insert maker.
- The milling feed assumes the full chip thickness. When the width of cut is below half the cutter diameter, the chip thins and the feed per tooth can rise. The chip load calculator works out the correction.
- A machine speed limit caps the rpm. The tool then runs below the chosen cutting speed, and the feed rate drops with it.
- Chip load and feed per revolution come from the tool maker's data. This page does not check spindle power or tool deflection.

## Worked example

A 1/2 in four-flute carbide end mill cuts 1018 steel. The cut is 0.25 in deep and 0.25 in wide. The chip load is 0.003 in per tooth.

1. Starting speed from the table: carbide in 1018 is 100 to 300 sfm, so 200 sfm.
2. Spindle speed: 3.82 × 200 / 0.5 = 1 528 rpm.
3. Feed per revolution: 4 × 0.003 = 0.012 in.
4. Feed rate: 0.012 × 1 528 = 18.33 in/min, or 466 mm/min.
5. Removal rate: 0.25 × 0.25 × 18.33 = 1.146 in³/min.

With an HSS end mill the table gives 110 fpm, so the same cutter would run at 840 rpm.

## FAQ

**How do I calculate rpm from surface speed?**
Multiply the surface speed in sfm by 3.82 and divide by the diameter in inches. In metric, multiply m/min by 1 000 and divide by π × the diameter in mm.

**What is the difference between sfm and rpm?**
Sfm is the speed of the cutting edge through the material. Rpm is how fast the spindle turns. A small tool needs a high rpm to reach the same sfm as a large one.

**How do I calculate the feed rate for milling?**
Multiply the chip load per tooth by the number of teeth and by the rpm. Four teeth at 0.003 in and 1 528 rpm give 18.33 in/min.

**How much faster can carbide run than HSS?**
In this table the carbide speed is 1.5 to 3.3 times the HSS speed, and about twice in most steels. The tool maker's data for the exact grade and coating is the better guide.

**Why does the turning rpm change as the diameter gets smaller?**
The same rpm gives a lower surface speed on a smaller diameter. CNC lathes with constant surface speed raise the rpm as the tool moves in.

**What is metal removal rate used for?**
It compares strategies and estimates cycle time. With a unit power for the material, it also gives the spindle power the cut needs.

## Related calculators

- [Chip load calculator](../chip-load/index.html) — chip load from the feed rate, and the chip thinning correction.
- [Machining time calculator](../machining-time/index.html) — the cutting time of each pass.
- [Surface finish converter](../surface-finish/index.html) — the finish a turning feed and nose radius give.
- [Drill point length](../drill-point-length/index.html) — how deep to drill for a full-diameter hole.
