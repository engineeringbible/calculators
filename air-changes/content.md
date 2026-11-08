# Air changes per hour (ACH) and CFM calculator

**Summary:** Air changes per hour from a room’s airflow, or the CFM, m³/h and L/s for a target ACH, plus the ASHRAE 62.2 whole-house ventilation rate.

## Introduction

Air changes per hour (ACH) is how many times the air in a room is replaced in an hour. It turns an airflow, in cubic feet per minute (CFM), cubic metres per hour or litres per second, into something comparable between rooms of any size. A 12 × 15 ft bedroom with an 8 ft ceiling holds 1 440 ft³ of air; supplying 144 CFM replaces it six times an hour.

This calculator works both ways: the airflow needed for a target ACH, or the ACH a known airflow gives. It also gives the ASHRAE 62.2 ventilation rate for a whole house from its floor area and bedrooms. It is for HVAC designers, contractors sizing fans and air purifiers, and anyone checking a room's ventilation.

## Formulas

Air changes and airflow for a room of volume V:

    ACH = 60 × CFM / V_ft³ = Q_m³/h / V_m³
    CFM = ACH × V_ft³ / 60

Whole-dwelling ventilation (ASHRAE 62.2):

    Q = 0.03 × A_floor + 7.5 × (N_br + 1)    cfm, A in ft²
    Q = 0.15 × A_floor + 3.5 × (N_br + 1)    L/s, A in m²

- V — room volume, length × width × ceiling height
- A_floor — conditioned floor area; N_br — number of bedrooms
- 1 CFM = 1.699 m³/h = 0.4719 L/s

## Assumptions and limitations

- The volume is the empty room. ACH counts the air supplied and assumes it mixes through the room; poor mixing leaves stagnant corners.
- Ventilation codes rarely set a single ACH. ASHRAE 62.1 and 62.2 and the European EN 16798-1 give rates per person and per floor area, which you can convert to ACH here. Hospitals, labs and clean rooms have their own ACH tables.
- The ASHRAE 62.2 rate is the total mechanical ventilation of the house. Credit for natural infiltration and the kitchen and bathroom exhaust requirements are separate.
- For air purifiers, the clean air delivery rate (CADR) in CFM takes the place of the airflow.

## Worked example

A bedroom is 15 ft long, 12 ft wide and 8 ft high. What airflow gives six air changes an hour?

1. Volume: 15 × 12 × 8 = 1 440 ft³.
2. Airflow: 6 × 1 440 / 60 = 144 cfm.
3. In metric: 144 × 1.699 = 245 m³/h, or 144 × 0.4719 = 68.0 L/s.

Six air changes means the air is replaced every 10 minutes.

## FAQ

**How many air changes per hour do I need?**
It depends on the room and the code. Homes need about 0.35 ACH or more of fresh air overall, with exhaust fans of 50 cfm in bathrooms and 100 cfm in kitchens under ASHRAE 62.2. Hospital rooms, laboratories and clean rooms have their own, much higher, ACH requirements.

**How do I convert CFM to ACH?**
Multiply the CFM by 60 and divide by the room volume in cubic feet.

**What is ASHRAE 62.2?**
The US standard for ventilation in homes. It sets the continuous whole-house fresh air from the floor area and number of bedrooms: a 2 000 ft² three-bedroom house needs 90 cfm.

**What ACH does an air purifier give?**
Divide its CADR by the room volume and multiply by 60. The US Environmental Protection Agency suggests a CADR of at least two thirds of the room's floor area in square feet.

**Is a higher ACH always better?**
More fresh air dilutes pollutants and moisture, but it also costs energy to heat or cool. Balanced systems with heat recovery give high ventilation at low energy cost.

**How do I convert m³/h to CFM?**
Divide by 1.699. 300 m³/h is 177 cfm.

## Related calculators

- [Air density calculator](../air-density/index.html) — the mass of the air moved.
- [BTU calculator: AC size for a room](../btu-ac-size/index.html) — cooling capacity.
- [Building heat loss calculator](../heat-loss/index.html) — heat lost to ventilation.
- [Dew point calculator](../dew-point/index.html) — humidity of the room air.
