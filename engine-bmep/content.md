# Engine BMEP, torque and power calculator

**Summary:** Swept volume, brake mean effective pressure, torque, mean piston speed and specific power of a reciprocating engine from bore, stroke, cylinders and rpm.

## Introduction

Two numbers tell an engineer how hard a diesel engine is working regardless of its size: the brake mean effective pressure, which is the work per cycle divided by the swept volume, and the mean piston speed. A 300 mm medium-speed engine and a 900 mm two-stroke both run at about 20 bar BMEP and 9–10 m/s, which is why catalogues and shop-test reports quote them. This calculator derives them from bore, stroke, cylinder count, speed and power (or works back from BMEP to power), adds the brake torque, the specific power and the indicated-friction split, and says whether the loading is within the usual range for the engine class.

It is for marine and plant engineers reading shop-test and service data, performance analysts checking an engine load claim, and students of internal combustion engines.

## Formulas

    V_d = (π/4) D² S   per cylinder,   V_d,tot = n_cyl V_d
    P = p_me V_d,tot N / (60 n_R)          n_R = 2 (four-stroke), 1 (two-stroke)
    T = 60 P / (2π N),   c_m = 2 S N / 60
    IMEP = BMEP / η_m,   FMEP = IMEP − BMEP
    specific power = P / V_d,tot,   work per cycle per cylinder = p_me V_d

Typical ranges: large two-strokes 18–21 bar and 8–9 m/s; medium-speed four-strokes 22–28 bar and 9–11 m/s; high-speed engines up to 14 m/s.

## Assumptions and limitations

- Mean effective pressures are load measures, not cylinder pressures; peak firing pressure is 5–8 times BMEP.
- The mechanical efficiency entered sets the IMEP/FMEP split; no friction model.
- Brake values at the crankshaft; shaft, gearbox and propeller losses are separate.

## Worked example

A six-cylinder 320 × 400 mm four-stroke at 750 rpm delivering 3 000 kW, mechanical efficiency 0.90.

1. V_d = π/4 × 0.32² × 0.40 = 32.2 L per cylinder, 193 L in total.
2. BMEP = 3 000 kW × 60 × 2/(0.193 m³ × 750) = 24.9 bar: within the turbocharged four-stroke range.
3. Torque 38.2 kN·m; mean piston speed 10.0 m/s; specific power 15.5 kW/L; 80 kJ of work per cylinder per cycle.
4. IMEP 27.6 bar, FMEP 2.8 bar.

A single cylinder of a 500 × 2 214 mm two-stroke at 127 rpm and 1 780 kW works at 19.3 bar and 9.4 m/s, the catalogue order for that engine class.

## FAQ

**Why n_R = 2 for a four-stroke?**
Each cylinder fires once every two revolutions, so the swept volume does work only every other turn.

**Is BMEP a real pressure?**
No; it is the constant pressure that, acting on the piston over one stroke, would do the same work as the real cycle. It is the cleanest way to compare engine loading.

**How do I get the engine load percentage?**
BMEP at the operating point divided by BMEP at MCR, or power divided by MCR power at the same speed; on a propeller curve the BMEP falls with the square of the speed.

**What is a reasonable mechanical efficiency?**
0.88–0.92 at rated load for large marine diesels, dropping to 0.7–0.8 at low load as friction stays nearly constant while output falls.

**Why does piston speed matter?**
It governs inertia loads, ring and liner wear and gas exchange; manufacturers hold it within a narrow band for each engine class.

**Can I use this for a gas engine or a compressor?**
For a gas engine yes (same definitions); for a compressor the mean effective pressure is defined on the indicated work in the same way, but the torque formula still applies to the drive.

## Related calculators

- [Engine power and SFOC to ISO 3046 conditions](../sfoc-iso3046-correction/index.html) — ambient derating of the same engine.
- [Shaft torque and diameter](../shaft-torque/index.html) — torque into the shaft line.
- [Generator load, kVA and fuel](../generator-load/index.html) — engine-driven generators.
- [Fuel net specific energy and CO₂ factor](../fuel-lcv-co2/index.html) — fuel for the power.
- [Propeller slip](../propeller-slip/index.html) — rpm and speed on the propeller curve.
