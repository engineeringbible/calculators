# mAh to Wh calculator

**Summary:** Battery capacity in mAh or Ah converted to energy in Wh at the nominal voltage, and back, with the airline carry-on limit it falls under.

## Introduction

Battery capacity is quoted in two different ways. Phones, power banks and small cells give milliampere-hours (mAh), which measure charge. Laptops, e-bikes, airline rules and solar storage use watt-hours (Wh), which measure energy. To compare batteries of different voltages, or to check whether a power bank may fly, you need the energy, and that takes the voltage as well as the mAh.

This calculator converts capacity in mAh or Ah to energy in Wh at the battery's nominal voltage, and energy back to capacity. It also tells you which airline category a lithium-ion battery falls into: carry-on without approval up to 100 Wh, with the airline's approval up to 160 Wh, and not in passenger baggage above that. It is for travellers, product designers, electricians and anyone comparing batteries.

## Formulas

Energy from capacity, and capacity from energy:

    E [Wh] = Q [Ah] × V
    E [Wh] = Q [mAh] × V / 1000
    Q [Ah] = E [Wh] / V

- Q — capacity, Ah (1 Ah = 1000 mAh)
- V — nominal voltage, V: lithium-ion 3.6 to 3.7 V per cell, LiFePO4 3.2 V, lead-acid 2.0 V per cell, NiMH 1.2 V
- E — energy, Wh (1 kWh = 1000 Wh)

Airline limits for lithium-ion batteries carried by passengers (IATA):

    up to 100 Wh          allowed in carry-on
    over 100, up to 160   airline approval needed
    over 160 Wh           not allowed in passenger baggage

## Assumptions and limitations

- The voltage is the nominal, average voltage over a discharge. The voltage falls as the battery empties, and at high current the usable energy is a few per cent less.
- Capacity in mAh only means something at the battery's own voltage. A 10 000 mAh power bank at 3.7 V delivers only about 6 000 to 6 500 mAh at its 5 V USB output, after conversion losses.
- The airline categories follow the IATA rules. Airlines and countries may be stricter, and spare batteries and power banks always go in the cabin, never in checked baggage.

## Worked example

A phone battery is rated 3000 mAh at 3.7 V. How much energy does it hold?

1. Capacity in Ah: 3000 / 1000 = 3 Ah.
2. Energy: E = 3 × 3.7 = 11.1 Wh.
3. That is far below 100 Wh, so the phone may be carried on any flight without approval.

A 20 000 mAh power bank at 3.7 V holds 74 Wh and is also allowed. A 30 000 mAh bank would be 111 Wh and need the airline's approval.

## FAQ

**How do I convert mAh to Wh?**
Multiply the mAh by the voltage and divide by 1000. 5000 mAh at 3.7 V is 18.5 Wh.

**Which voltage should I use?**
The nominal voltage printed on the battery: 3.6 or 3.7 V for most lithium-ion cells, 3.2 V for LiFePO4, 12 V for a 12 V battery. For a pack, use the pack voltage.

**Why does my power bank deliver fewer mAh than it says?**
Its mAh are counted at the 3.7 V of its cells, but it charges your phone through a 5 V output and a converter. The energy in Wh is the honest comparison.

**Can I take a 100 Wh power bank on a plane?**
Yes, up to and including 100 Wh, in hand luggage. Between 100 and 160 Wh you need the airline's approval, and above 160 Wh it is not allowed as passenger baggage.

**How many Wh is a 100 Ah 12 V battery?**
1200 Wh, or 1.2 kWh. Only part of that is usable: about 50 % for lead-acid and 80 to 90 % for lithium if the battery is to last.

**Is mAh the same as battery life?**
No. Life depends on how much current the device draws. Use the battery runtime calculator for that.

## Related calculators

- [Battery charge time](../battery-charge-time/index.html) — how long it takes to put the capacity back.
- [Battery capacity and runtime](../battery-runtime/index.html) — how long the energy lasts under a load.
- [Electricity cost and energy use](../electricity-cost/index.html) — what the energy costs from the grid.
- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — storage banks for solar systems.
