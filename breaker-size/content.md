# Breaker size calculator

**Summary:** Breaker size for a load in amps or watts, by the NEC 125 % continuous-load rule or IEC Ib ≤ In ≤ Iz, with the standard rating and a wire check.

## Introduction

A circuit breaker must be big enough not to trip under normal load, and small enough to protect the wire behind it. Under the US National Electrical Code (NEC), a load that runs for three hours or more counts as continuous, and the breaker must be rated at 125 % of it. That is why a 30 A EV charger sits on a 40 A breaker. Under IEC rules, used in Europe and most of the world, the breaker must be at least the load current and no more than the current the cable can carry.

This calculator finds the design current from the load in amps or watts, applies the NEC or IEC rule, and picks the next standard breaker rating. If you enter the ampacity of the wire from your code table, it checks that the wire and the breaker match. It is for electricians, engineers and homeowners planning a new circuit.

## Formulas

Load current from power:

    DC:            I_b = P / V
    single-phase:  I_b = P / (V × cos φ)
    three-phase:   I_b = P / (√3 × V × cos φ)

NEC minimum rating, for continuous and non-continuous loads:

    I_min = 1.25 × I_continuous + I_noncontinuous

IEC coordination of the breaker and the cable:

    I_b ≤ I_n ≤ I_z

- I_b — design (load) current; I_n — rated current of the breaker; I_z — ampacity of the cable
- NEC standard ratings (240.6(A)): 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200 A and up
- IEC preferred ratings (IEC 60898-1): 6, 8, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125 A, then 160, 200, 250, 315, 400 A and up

## Assumptions and limitations

- The rules here are for general feeders and branch circuits. Motor circuits are sized differently: the NEC allows an inverse-time breaker up to 250 % of the motor current, and IEC practice uses motor-protection breakers.
- Under the NEC, heaters, EV chargers, lighting, water heaters and servers are usually continuous. Breakers listed for 100 % of their rating, used in some large panels, are not covered.
- The calculator does not size the wire. Wire ampacity depends on insulation, installation and temperature, and comes from NEC Table 310.16 or IEC 60364-5-52. For small copper wire, NEC 240.4(D) caps 14 AWG at 15 A, 12 AWG at 20 A and 10 AWG at 30 A.
- NEC 240.4(B) allows the next standard rating above the wire's ampacity, up to 800 A, except on circuits with several receptacles for cord-and-plug loads. IEC has no such allowance.

## Worked example

A 7.2 kW Level 2 EV charger runs on 240 V single-phase. What breaker does it need under the NEC?

1. Load current: I = 7 200 / 240 = 30.0 A.
2. EV charging is a continuous load (NEC 625.41), so the minimum rating is 1.25 × 30 = 37.5 A.
3. The next standard rating at or above 37.5 A is 40 A.
4. The charger loads the breaker to 30 / 40 = 75 %.

So the charger needs a 40 A breaker and a wire rated for at least 40 A, typically 8 AWG copper with 75 °C insulation.

## FAQ

**What size breaker do I need for 30 amps?**
For a continuous 30 A load under the NEC, a 40 A breaker, since 1.25 × 30 = 37.5 A. For an intermittent 30 A load, a 30 A breaker.

**What is the 80 % rule?**
It is the same rule seen from the other side: a standard breaker may carry only 80 % of its rating continuously. A 20 A breaker can carry 16 A for three hours or more.

**What breaker for a 5 kW heater at 240 V?**
It draws 20.8 A. As a continuous load it needs 26 A, so a 30 A breaker with 10 AWG copper wire.

**Can I put a bigger breaker on the same wire?**
No. The breaker protects the wire, so it must not exceed the wire's ampacity, apart from the limited NEC 240.4(B) next-size-up rule. A larger breaker lets the wire overheat before it trips.

**What is the difference between Ib, In and Iz?**
Ib is the current the load draws, In is the breaker's rating, and Iz is what the cable can carry where it is installed. IEC rules require Ib ≤ In ≤ Iz.

**Which breaker for a 3 kW kettle or immersion heater at 230 V?**
It draws 13 A, so a 16 A MCB on 2.5 mm² cable in most installations.

## Related calculators

- [Wire size calculator](../wire-size/index.html) — the wire size for the voltage drop.
- [Watts to amps](../watts-to-amps/index.html) — the current of a load.
- [kW to amps](../kw-to-amps/index.html) — current of large and three-phase loads.
- [AWG wire gauge chart](../awg-wire-gauge/index.html) — sizes and resistance of each gauge.
