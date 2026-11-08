# Belt conveyor speed and capacity calculator

**Summary:** Belt speed from pulley diameter and rpm, and the capacity in t/h of a flat or troughed belt from width, angles and bulk density (CEMA method).

## Introduction

A belt conveyor carries a ribbon of bulk material. Its capacity is the cross-section of that ribbon times the belt speed times the bulk density. The belt speed is the drive pulley's circumference times its rpm. A 36 in belt on 35° idlers carries a load of about 0.99 ft². Driven by a 24 in pulley at 100 rpm, it runs at 628 ft/min and moves about 1 700 t/h of material weighing 100 lb/ft³.

This calculator gives the belt speed, the load cross-section by the CEMA method, and the capacity in m³/h, t/h and short tons per hour. It covers flat belts and troughed belts on three equal rolls. It also gives the power needed to lift the load. It is for plant engineers and designers checking a conveyor or sizing a new one.

## Formulas

Belt speed:

    v = π × D × n

Load cross-section (CEMA standard area):

    c = 0.055 b + 0.9 in            edge distance on each side
    b' = b − 2c                     loaded belt width
    s = (b' − l) / 2,  W = l + 2 s cos λ
    A_base = (l + W) / 2 × s sin λ
    A_surcharge = R² (β − sin β cos β),  R = W / (2 sin β)

Capacity and lift power:

    Q = (A_base + A_surcharge) × v × ρ
    P_lift = Q × g × H

- D — drive pulley diameter over lagging; n — pulley speed
- b — belt width; l — centre roll length (b/3 by default); λ — trough angle; β — surcharge angle
- ρ — bulk density; H — lift height; g = 9.81 m/s²
- A flat belt has λ = 0 and carries only the surcharge segment over the loaded width

## Assumptions and limitations

- The load fills the CEMA standard cross-section: the belt width less a standard edge distance on each side, with a curved top meeting the belt edges at the surcharge angle.
- Troughed belts sit on three equal rolls with the gaps ignored. With the default centre roll of a third of the belt width, the area is 2.5 to 3 % above a published idler table. The real roll length, such as 13 in for a 36 in belt, brings it within about 1 %.
- The surcharge angle is usually 5° to 15° less than the material's angle of repose. Use the value for your material.
- The belt is assumed to be loaded evenly and fully. Surges, incline limits and loading chutes may lower the real capacity.
- The power shown only lifts the load. Belt and idler friction, skirtboards, acceleration of the load and drive losses need the full CEMA or ISO 5048 calculation.

## Worked example

A 36 in belt runs on 35° idlers with three 13 in rolls. The material has a surcharge angle of 20° and weighs 100 lb/ft³. The drive pulley is 24 in over lagging and turns at 100 rpm. The belt lifts the material 30 ft.

1. Edge distance: 0.055 × 36 + 0.9 = 2.88 in, so the loaded width is 30.24 in.
2. Side rolls carry 8.62 in each, so the top width of the trough is 27.12 in.
3. Cross-section: 99.2 in² in the trough plus 43.5 in² of surcharge, 0.991 ft².
4. Belt speed: π × 2 ft × 100 = 628.3 ft/min.
5. Capacity: 0.991 × 628.3 × 60 × 100 lb/ft³ = 3.74 million lb/h, or 1 694 t/h (1 868 short tons per hour).
6. Power to lift the load: 470.7 kg/s × 9.81 × 9.14 m = 42.2 kW.

## FAQ

**How do I calculate belt conveyor capacity?**
Multiply the load cross-section by the belt speed and the bulk density. The cross-section depends on the belt width, the trough and surcharge angles and the edge distance.

**How do I calculate belt speed from the pulley?**
Multiply the pulley diameter by π and the rpm. A 24 in pulley at 100 rpm gives 628 ft/min. Measure the diameter over the lagging.

**What is the surcharge angle?**
The angle the top of the material makes with the belt edge while it moves. It is usually 5° to 15° below the angle of repose.

**Why do troughed belts carry more?**
The side rolls lift the belt edges, so the belt holds a trapezoid of material under the surcharge. A 36 in belt at 35° carries about 2.6 times the load of a flat belt at the same surcharge.

**What is the edge distance?**
A strip along each edge left unloaded to prevent spillage. CEMA sets it at 0.055 × belt width + 0.9 in.

**Does the lift power give the motor size?**
No. It is only the part needed to raise the material. Friction of the belt, idlers and skirts adds to it, so use the full CEMA method for the drive.

## Related calculators

- [Speeds and feeds calculator](../speeds-feeds/index.html) — rpm from surface speed, the same relation as belt speed.
- [Gear ratio, rpm and torque](../gear-ratio/index.html) — the reducer between motor and pulley.
- [Torque, power and speed](../torque-power-rpm/index.html) — pulley torque from power and speed.
- [Pump power calculator](../pump-power/index.html) — power to lift a liquid instead of a bulk solid.
