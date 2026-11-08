# Inverter size calculator

**Summary:** What size power inverter you need: running watts and VA of your loads, motor starting surge, design margin, the next common size and the DC battery current.

## Introduction

What size inverter do you need? Add up the running watts of everything that can be on at the same time, allow for the power factor of motors, and add a margin. Then check that the inverter's surge rating covers the largest motor starting. The battery side matters too: a 1 000 W load on a 12 V battery draws about 93 A through a 90 % efficient inverter.

This calculator sums your loads in watts and volt-amperes, adds the starting surge, and recommends the next common inverter size. It also gives the battery current at the nominal and at the low-cutoff voltage, which sets the cable and fuse sizes. It is for owners of off-grid cabins, vans, boats and backup systems, and for the installers who size them.

## Formulas

Loads:

    W_run = Σ W_i
    S_run = Σ W_i / PF_i
    surge = max(W_start,i − W_i)    (one motor at a time)
    W_peak = W_run + surge

Inverter and battery:

    rating ≥ S_run × (1 + m)   and   rating ≥ W_peak / k_surge
    I_dc = W / (V_bat × η)

- W_i, W_start,i — running and starting watts of each load
- PF_i — power factor of each load, 1 for heaters, lights and electronics with power factor correction
- m — design margin; k_surge — the inverter's surge rating as a multiple of its continuous rating
- V_bat — battery voltage; η — inverter efficiency

## Assumptions and limitations

- Take running and starting watts from the nameplate or manual. The default list is an illustrative example only.
- The VA of the loads are added directly. This ignores their different phase angles and errs on the safe side.
- By default only one motor starts at a time. Choose "all together" if several motors can start at once, for example when power returns.
- Surge ratings vary widely between inverters and last only a few seconds. Take the multiple from the data sheet.
- Inverter ratings are not a standard series. The page picks the next common catalogue size, so check what the maker offers.

## Worked example

A cabin runs a refrigerator (150 W, starting 750 W, power factor 0.8), a 1/2 hp well pump (800 W, starting 2 400 W, power factor 0.75), a microwave (1 000 W), lights (200 W), a TV and router (150 W) and a laptop (60 W). The battery is 24 V, the inverter is 90 % efficient and can surge to twice its rating. What size inverter is needed?

1. Running watts: 150 + 800 + 1 000 + 200 + 150 + 60 = 2 360 W.
2. Apparent power: 150 / 0.8 + 800 / 0.75 + 1 410 = 2 664 VA, an overall power factor of 0.89.
3. Largest surge: the pump, 2 400 − 800 = 1 600 W, so the peak is 3 960 W.
4. Continuous need with a 25 % margin: 2 664 × 1.25 = 3 330 VA.
5. Surge need: 3 960 / 2 = 1 980 W, below the continuous need.
6. The next common size is 3 500 W.
7. Battery current: 2 360 / (24 × 0.9) = 109 A running. At the peak and a 21 V cutoff it is 3 960 / (21 × 0.9) = 209.5 A.

## FAQ

**What size inverter do I need?**
At least the running watts of everything on at the same time, plus a margin of about 25 %. Its surge rating must also cover the largest motor starting.

**How do I calculate inverter size from watts?**
Add the watts of all loads that run together and divide motor loads by their power factor. Multiply by 1.25 and choose the next size up.

**What is inverter surge power?**
The power an inverter can deliver for a few seconds while a motor starts. Many inverters manage about twice their continuous rating, but check the data sheet.

**How many amps does an inverter draw from the battery?**
Watts divided by battery volts and by the efficiency. A 2 000 W load on 12 V at 90 % draws 185 A.

**Should I use a 12 V, 24 V or 48 V battery?**
A higher voltage halves the current each time it doubles. Above about 2 kW, 24 V or 48 V keeps the cables and fuses a practical size.

**Do I need a pure sine wave inverter?**
For motors, compressors, chargers and most modern electronics, yes. Modified sine wave output makes many motors run hotter and noisier.

## Related calculators

- [Solar battery bank calculator](../solar-battery-bank/index.html) — the battery bank behind the inverter.
- [Generator size calculator](../generator-size/index.html) — the same load list for a generator.
- [Battery capacity and runtime](../battery-runtime/index.html) — how long the battery carries the load.
- [Wire size calculator (AWG and mm²)](../wire-size/index.html) — the DC cable for the battery current.
