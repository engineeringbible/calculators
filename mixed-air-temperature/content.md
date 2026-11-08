# Mixed air temperature calculator (outdoor and return air)

**Summary:** Mixed air dry bulb, humidity ratio, enthalpy, RH and wet bulb of outdoor and return air streams by psychrometric mass balance, and the outdoor-air fraction.

## Introduction

Most air handlers mix some outdoor air with air returned from the building before it reaches the coil. The mixed air temperature is close to the flow-weighted average of the two streams. Mixing 2 000 cfm of outdoor air at 95 °F with 8 000 cfm of return air at 75 °F gives 78.9 °F.

This calculator does the full psychrometric mass balance of dry air, water vapour and energy. It gives the mixed dry bulb, humidity ratio, enthalpy, relative humidity, wet bulb and dew point, and the outdoor-air fraction by mass and by volume. A second mode finds the outdoor-air fraction from measured outdoor, return and mixed temperatures. It is for HVAC designers, test and balance technicians and students.

## Formulas

Dry air mass flow of each stream, then the mass balances:

    ṁ_i = Q_i / v_i
    W_mix = (ṁ_OA W_OA + ṁ_RA W_RA) / (ṁ_OA + ṁ_RA)
    h_mix = (ṁ_OA h_OA + ṁ_RA h_RA) / (ṁ_OA + ṁ_RA)

Mixed dry bulb from enthalpy and humidity ratio (SI, ASHRAE eq. 30):

    h = 1.006 t + W (2 501 + 1.86 t)   →   t_mix = (h_mix − 2 501 W_mix) / (1.006 + 1.86 W_mix)

Outdoor-air fraction from measured temperatures:

    x_OA = (t_RA − t_MA) / (t_RA − t_OA)

- Q — airflow at the stream's own condition; v — specific volume per kg of dry air
- W — humidity ratio, kg of water per kg of dry air; h — enthalpy, kJ/kg of dry air
- t_OA, t_RA, t_MA — outdoor, return and mixed air dry bulb temperatures

## Assumptions and limitations

- Mixing is adiabatic at constant pressure. On a psychrometric chart the mixed state lies on the straight line between the two stream states.
- Each airflow is the actual volume at its own temperature. The calculator converts it to dry air mass, so a cold dense outdoor stream counts for more than its volume suggests.
- Properties follow ASHRAE Fundamentals Chapter 1 at the standard pressure for the altitude entered.
- The temperature method for the outdoor-air fraction needs a clear difference between outdoor and return air. With 10 °F between them, a 1 °F sensor error shifts the fraction by 10 points.
- If the mixed state falls beyond saturation, the extra moisture forms fog and the calculator warns.

## Worked example

ASHRAE Fundamentals Chapter 1 mixes 2 m³/s of outdoor air at 4 °C dry bulb and 2 °C wet bulb with 6.25 m³/s of return air at 25 °C and 50 % relative humidity, at sea level.

1. Outdoor air: W = 3.55 g/kg, v = 0.790 m³/kg, h = 12.9 kJ/kg.
2. Return air: W = 9.88 g/kg, v = 0.858 m³/kg, h = 50.3 kJ/kg.
3. Dry air flows: 2 / 0.790 = 2.533 kg/s and 6.25 / 0.858 = 7.284 kg/s. Outdoor air is 25.8 % by mass.
4. Humidity ratio: 0.258 × 3.55 + 0.742 × 9.88 = 8.25 g/kg.
5. Enthalpy: 0.258 × 12.9 + 0.742 × 50.3 = 40.7 kJ/kg.
6. Dry bulb: (40.68 − 2 501 × 0.00825) / (1.006 + 1.86 × 0.00825) = 19.6 °C.
7. Wet bulb of the mixture: 14.6 °C.

ASHRAE reads 19.5 °C and 14.6 °C from the chart. A plain volume average would give 19.9 °C.

## FAQ

**How do I calculate mixed air temperature?**
For a quick answer, take the flow-weighted average: (Q_OA × t_OA + Q_RA × t_RA) / (Q_OA + Q_RA). For an exact answer, weight by dry air mass and work through enthalpy, as this calculator does.

**How do I find the outdoor-air percentage from temperatures?**
Divide (return − mixed) by (return − outdoor). With 75 °F return, 95 °F outdoor and 79 °F mixed, the outdoor air is 4 / 20 = 20 %.

**Why does the calculator use mass instead of volume?**
Cold air is denser than warm air, so a cubic foot of it carries more air. In the ASHRAE example the volume average is 0.3 K too high.

**Can mixing two airstreams make fog?**
Yes. Very cold outdoor air mixed with warm, humid return air can land beyond the saturation curve, and the excess water condenses. Preheating the outdoor air avoids it.

**What is the mixed air enthalpy used for?**
It sets the cooling coil load: the dry air mass flow times the drop in enthalpy across the coil. The latent and sensible heat calculator splits that load.

**Does altitude change the result?**
Lower pressure raises the humidity ratio for the same relative humidity and makes the air less dense. Enter the altitude so the moisture content and mass flows are right.

## Related calculators

- [Latent and sensible heat](../latent-sensible-heat/index.html) — the coil load from the mixed air state.
- [Dew point](../dew-point/index.html) — dew point and humidity of one air state.
- [Air density](../air-density/index.html) — density of moist air at any altitude.
- [Air changes per hour](../air-changes/index.html) — ventilation airflow for a room.
