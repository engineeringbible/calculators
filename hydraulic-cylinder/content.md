# Hydraulic cylinder force and speed calculator

**Summary:** Push and pull force, extend and retract speed and time, regenerative mode, hydraulic power, oil volumes and piston-rod buckling margin from bore, rod, pressure and flow.

## Introduction

Hatch covers, steering gears, cranes, winches, ramps and workshop presses are all driven by hydraulic cylinders, and the questions are always the same: how much force, how fast, how much oil and power, and will the rod buckle at full stroke. The answers come from the piston areas, the working pressure and the pump flow. This calculator gives push and pull force with a seal-friction efficiency, extend and retract speeds and times, the return flow the valve must pass, regenerative (differential) operation, hydraulic power, the oil volume per stroke and the Euler buckling margin of the rod for the chosen mounting.

It is for marine and mechanical engineers specifying or troubleshooting cylinders, for technicians checking a replacement, and for students meeting the fluid-power basics.

## Formulas

Areas (bore D, rod d):

    A_cap = π D² / 4,   A_rod = π d² / 4,   A_ann = A_cap − A_rod,   φ = A_cap / A_ann

Forces (effective differential pressure p, mechanical efficiency η):

    F_push = p A_cap η,   F_pull = p A_ann η

Speeds and times (pump flow Q, stroke s):

    v_extend = Q / A_cap,   v_retract = Q / A_ann,   t = s / v
    Return flow while extending = Q × A_ann / A_cap

Regenerative extension (annulus connected to the cap side):

    v_regen = Q / A_rod,   F_regen = p A_rod η

Power and volumes:

    P_hyd = p Q,   V_extend = A_cap s,   V_retract = A_ann s

Rod buckling (Euler, rod alone at full extension, mounting factor K):

    I = π d⁴ / 64,   P_cr = π² E I / (K s)²,   safety factor = P_cr / F_push
    s_max = √(π² E I / (FS × F_push)) / K

K: both ends pivoted with guided rod 1.0; cylinder fixed, rod end guided 0.7; cylinder fixed, rod end pivoted and guided 1.0; cylinder fixed, rod end free 2.0.

## Assumptions and limitations

- The pressure is the effective differential across the piston. With back-pressure on the return side, or a counterbalance valve, the net force is lower than supply pressure × area.
- Seal friction and breakaway are lumped into η (0.85–0.95); starting friction can be higher.
- Full pump flow reaches the cylinder: valve pressure drops, pump slip and pressure-compensator behaviour are not modelled; times exclude acceleration and cushioning.
- Rod buckling uses the rod alone over the full extended length with the catalogue K factor — conservative. Manufacturers' charts also credit the cylinder tube and bearings and apply a factor of 3.5 (Parker) or 2.5–4 (standards).
- The cylinder tube as a pressure vessel, the end caps, tie rods and mountings are not checked.
- Oil compressibility and hose expansion are ignored.

## Worked example

Cylinder 100 mm bore, 56 mm rod, 500 mm stroke, 200 bar working pressure, pump flow 40 L/min, η = 0.9, both ends pivoted.

1. Areas: cap 78.5 cm², rod 24.6 cm², annulus 53.9 cm², ratio 1.46.
2. Forces: push 200 × 10⁵ × 78.5 × 10⁻⁴ × 0.9 = 141 kN; pull 97 kN. (157 kN and 108 kN at η = 1.)
3. Speeds: extend (40/60 000) / 78.5 × 10⁻⁴ = 0.085 m/s = 5.1 m/min → 5.9 s for the stroke; retract 0.124 m/s → 4.0 s. The return flow during extension is 27.5 L/min.
4. Regenerative extension: 0.27 m/s but only 44 kN (η = 0.9) — useful for a fast approach, not for pressing.
5. Hydraulic power: 200 bar × 40 L/min = 13.3 kW; oil per extend stroke 3.9 L.
6. Rod buckling: I = π × 56⁴ / 64 = 48.3 cm⁴; Euler load at 0.5 m pinned = π² × 210 × 10⁹ × 4.83 × 10⁻⁷ / 0.25 = 4.0 MN, 25 times the push force — no concern. The same rod at a 3 m stroke would carry only 111 kN, less than the push force, and would need a thicker rod or a stop tube.

## FAQ

**Why is the pull force smaller than the push force?**
The rod occupies part of the piston on the rod side, so the annulus area is smaller. The ratio φ also makes the cylinder retract faster than it extends for the same flow.

**What is regenerative operation for?**
Rapid approach: connecting the rod-end return to the cap side adds the return oil to the pump flow, raising the speed by (D/d)² but leaving only the rod area to produce force.

**Which pressure should I enter?**
The pressure actually available across the piston at the load: relief setting minus line and valve losses minus any back-pressure. Catalogue forces at "rated pressure" assume no back-pressure.

**How do I choose the rod diameter?**
From the buckling check at full stroke with the mounting factor and a safety factor of about 3.5, then round up to the ISO 3320 standard rod for the bore. A larger rod also reduces the pull force and increases retract speed.

**Does the mounting really matter that much?**
Yes: an unsupported rod end (K = 2) carries a quarter of the Euler load of a pivoted and guided one (K = 1). Side loads from misalignment reduce the capacity further.

**What is a stop tube?**
A spacer that prevents the piston from reaching the rod-end head, increasing the bearing span at full extension and reducing side-load and buckling problems on long cylinders.

**Can I use this for pneumatic cylinders?**
The force and speed formulas are the same at the air pressure (typically 6 bar), but air compressibility makes speeds and positioning much less predictable.

## Related calculators

- [Thin-wall pressure vessel](../pressure-vessel/index.html) — the cylinder tube at working pressure.
- [Column buckling (Euler and Johnson)](../column-buckling/index.html) — the rod as a column with other end conditions.
- [Pump and fan affinity laws](../pump-affinity/index.html) — the hydraulic power unit's pump.
- [Lifting sling and wire rope load](../lifting-sling/index.html) — loads on hydraulic cranes and winches.
