# Fixed CO₂ fire-extinguishing system calculator

**Summary:** Required CO₂ quantity, cylinders and minimum discharge rate for machinery, cargo, bulk and vehicle spaces under the FSS Code chapter 5.

## Introduction

A fixed carbon dioxide system puts out a fire by flooding a closed space with gas. The FSS Code sets how much gas the system must hold, as a percentage of the gross volume of the largest space it protects, and how fast it must discharge. Engine rooms have two criteria that depend on the size of the casing, and the air in the starting air receivers must be added because it would feed the fire. This calculator applies chapter 5, converts the free gas to kilograms at 0.56 m³/kg, counts the cylinders and gives the average discharge rate the piping must achieve.

It is for marine engineers and surveyors checking an installation, designers sizing a new system, and superintendents comparing a ship's CO₂ plan with the rules.

## Formulas

    Machinery spaces:      free gas = max(40 % × (V without the upper casing + receiver air),
                                          35 % × (V gross + receiver air))
    Small cargo ships:     35 % and 30 % (under 2000 GT, machinery spaces not entirely separate)
    Cargo spaces:          30 % × V;   vehicle and ro-ro spaces: 45 % × V
    Receiver air:          V_r (p + p_atm) / p_atm
    CO₂ mass:              free gas / 0.56 m³/kg
    Cylinder capacity:     ≥ charge / (2/3 kg/L)
    Discharge rate:        85 % in 2 min (machinery); 2/3 in 10 min (cargo, vehicle); 2/3 in 20 min (solid bulk)
    Free-efflux concentration: 1 − e^(−free gas / V)

## Assumptions and limitations

- FSS Code chapter 5 as replaced by MSC.206(81) and amended by MSC.339(91).
- The largest protected space sets the quantity when one system serves several spaces.
- The receiver air is not added when the receiver safety valves discharge to the open air.
- The discharge rate is the average the rules require; the system flow calculation decides the piping and nozzles.
- Special category spaces may not be protected by CO₂.

## Worked example

An engine room has a gross volume of 6000 m³ including the casing, and 5000 m³ without the part of the casing above the 40 % level. It has 2.5 m³ of starting air receivers at 30 bar.

1. Receiver air: 2.5 × 31.01 / 1.013 = 76.5 m³.
2. 40 % criterion: 0.40 × 5076.5 = 2030.6 m³. 35 % criterion: 0.35 × 6076.5 = 2126.8 m³, which governs.
3. CO₂ mass: 2126.8 / 0.56 = 3798 kg, so 85 cylinders of 45 kg (3825 kg installed).
4. 85 % within 2 min needs 0.85 × 3798 / 120 = 26.9 kg/s on average.

## FAQ

**Why are there two criteria for engine rooms?**
The tall casing above an engine room adds volume where a fire is unlikely. The 40 % criterion leaves out the casing above the level where it narrows to 40 % of the room's area; the 35 % criterion includes it. The larger result applies.

**Why add the starting air?**
If a fire heats the receivers, their safety valves release air into the engine room and dilute the CO₂. Leading the safety valve discharge to the open air removes the need.

**What concentration does the gas reach?**
With the displaced air escaping, 35 % of free gas gives about 30 % CO₂ and 40 % about 33 %. Either is lethal to people, which is why the space must be evacuated and closed before release.

**How fast must the gas be discharged?**
Machinery spaces: 85 % of the gas within 2 minutes. Container and general cargo spaces, and vehicle and ro-ro spaces: two thirds within 10 minutes. Solid bulk holds: two thirds within 20 minutes, with controls that release a third, two thirds or all of the gas to suit how full the hold is.

**How full can a cylinder be filled?**
No more than two thirds of a kilogram of CO₂ per litre of cylinder water capacity at 15 °C, so a 45 kg charge needs a cylinder of at least 67.5 L.

## Related calculators

- [Starting air receivers and compressors](../starting-air/index.html) — the receiver volume and pressure that add to the engine room volume.
- [Engine-room ventilation (ISO 8861)](../engine-room-ventilation/index.html) — the airflow the dampers must shut off before release.
- [Enclosed space purge time](../enclosed-space-purge/index.html) — ventilating the space after a release before anyone enters.
- [Tank volume and partial fill](../tank-volume/index.html) — volumes of tanks and spaces.
