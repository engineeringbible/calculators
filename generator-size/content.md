# Generator size calculator

**Summary:** What size generator you need: running watts of your loads, the surge of the largest motor starting, and the minimum running, starting and kVA ratings.

## Introduction

To size a generator, add up the running watts of everything you want to power, then add the extra surge that the largest motor draws for a few seconds when it starts. The generator's running rating must cover the first number with some margin, and its starting rating must cover the second. A fridge, sump pump, furnace fan, lights, microwave and TV run on about 4 450 W, but need 6 000 W for the moment the furnace fan starts.

This calculator does that sum for any list of loads, for a home backup generator, an RV, a job site or a cabin. It gives the running and starting watts, the minimum ratings to look for on a generator, and the kVA rating of a permanently installed standby set.

## Formulas

Running load and starting surge:

    W_run = Σ W_running
    surge = max(W_starting − W_running)       motors starting one at a time
    surge = Σ (W_starting − W_running)        all starting together
    W_peak = W_run + surge

Minimum ratings:

    running rating ≥ W_run / k_max
    starting rating ≥ W_peak
    standby kVA = running rating / 0.8

- W_running, W_starting — running and starting watts of each load, from the nameplate or manual
- k_max — the highest share of its rating you want the generator to run at, 80 % by default
- 0.8 — the power factor at which standby generators are rated (ISO 8528-1)

## Assumptions and limitations

- The default list is an example. Real running and starting watts vary by model, so read them from nameplates or manuals. A motor that shows only amps draws about volts × amps watts while running.
- Motors usually start one at a time. After a power cut several may start together when the power returns; choose "all together" or use a transfer switch that staggers them.
- Running a generator at no more than about 80 % of its rating leaves room for loads switching on and spares the engine. Inverter generators handle surges less well than their running rating suggests, so check their surge rating too.
- Altitude and heat reduce an engine generator's output. A permanently connected standby generator must be installed with a transfer switch by a licensed electrician.

## Worked example

A house wants to back up a fridge (700 W running, 2 200 W starting), a 1/2 hp sump pump (1 050 W, 2 150 W), a 1/2 hp furnace fan (800 W, 2 350 W), 600 W of lights, a 1 000 W microwave and 300 W of TV and internet. What generator is needed?

1. Running watts: 700 + 1 050 + 800 + 600 + 1 000 + 300 = 4 450 W.
2. Surges: fridge 1 500 W, sump pump 1 100 W, furnace fan 1 550 W. The largest is 1 550 W.
3. Peak while the furnace fan starts: 4 450 + 1 550 = 6 000 W.
4. Running rating at 80 % loading: 4 450 / 0.8 = 5 563 W.

So look for a generator rated at least about 5 600 running watts and 6 000 starting watts; a common 7 500 W portable model covers both. If all three motors could start together, the peak would be 8 600 W.

## FAQ

**What size generator do I need to run a house?**
For essentials such as a fridge, sump pump, furnace fan, lights and a few outlets, typically 5 000 to 8 000 running watts. Whole-house backup with central air conditioning and electric cooking usually needs a 15 to 25 kW standby generator.

**What is the difference between running and starting watts?**
Running watts are what a load draws once it is going. Starting watts are the brief surge a motor needs to get moving, often two to three times its running watts.

**Can a 3 500 W generator run a refrigerator?**
Usually yes. A typical fridge runs on 600 to 800 W and starts at around 2 000 W, well within a 3 500 W generator's surge rating, leaving some capacity for lights and a few small loads.

**Why not size the generator exactly to the load?**
A generator running flat out for hours wears faster and has no capacity left to start another motor. Sizing for about 80 % leaves that margin.

**What is the difference between kW and kVA on a generator?**
Standby generators are rated in kVA at a power factor of 0.8, so a 25 kVA set delivers 20 kW. Portable generators are rated in watts.

**How do I find the watts of an appliance?**
Read the nameplate or manual. If it lists only amps, multiply by the voltage: a 5 A appliance on 120 V draws about 600 W.

## Related calculators

- [Generator load, kVA and fuel](../generator-load/index.html) — loading and fuel of generator sets running in parallel.
- [Watts to amps](../watts-to-amps/index.html) — the current of each load.
- [kW to kVA](../kw-to-kva/index.html) — the kVA rating for a load in kW.
- [Breaker size calculator](../breaker-size/index.html) — the breaker for the generator circuit.
