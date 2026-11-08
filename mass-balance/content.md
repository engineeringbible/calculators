# Mass balance calculator: mixing streams (flow, concentration, temperature)

**Summary:** Mix two or three streams to find the combined flow, concentration and temperature, or find the stream 2 flow that reaches a target concentration or temperature.

## Introduction

A mass balance says that what flows in must flow out when nothing builds up or reacts. When streams mix, the total flow is the sum of the flows. The flow of each component is the sum of its flows too. So the mixed concentration is the flow-weighted mean of the stream concentrations. Mixing 200 kg of 40 % methanol with 150 kg of 70 % methanol gives 350 kg at 52.9 %, not the 55 % a simple average suggests.

This calculator mixes two or three streams and gives the combined flow, concentration and temperature. It also runs the balance backwards: it finds the flow of a second stream that brings the first to a target concentration or temperature. It is for process engineers and operators blending, diluting or tempering streams, and for students learning material and energy balances.

## Formulas

Total and component balances at steady state:

    ṁ_mix = ṁ1 + ṁ2 + ṁ3
    x_mix = (ṁ1 x1 + ṁ2 x2 + ṁ3 x3) / ṁ_mix

Energy balance with no heat of mixing:

    T_mix = (ṁ1 c_p1 T1 + ṁ2 c_p2 T2 + ṁ3 c_p3 T3) / (ṁ1 c_p1 + ṁ2 c_p2 + ṁ3 c_p3)

Flow of stream 2 to reach a target:

    ṁ2 = ṁ1 (x1 − x_t) / (x_t − x2)
    ṁ2 = ṁ1 c_p1 (T1 − T_t) / (c_p2 (T_t − T2))

- ṁ — mass flow of each stream; x — mass fraction of the component, % w/w / 100
- T — temperature; c_p — specific heat; x_t, T_t — target concentration and temperature

## Assumptions and limitations

- The process is steady, with no reaction, no accumulation and no losses. A batch mix follows the same equations with masses in place of flows.
- Concentrations are mass fractions and flows are mass flows. With volume flows and mg/L the result is right only if the densities are equal.
- The temperature balance ignores heat of mixing, phase change and heat loss. Diluting sulphuric acid or caustic soda releases a lot of heat, so the real mix is hotter.
- For a target, stream 2 must lie on the other side of it from stream 1. You cannot dilute 10 % to 5 % with a 20 % stream.

## Worked example

A plant has 1 000 kg/h of saturated brine at 26 % salt and needs a 10 % brine. How much water must it add?

1. Salt in: 1 000 × 0.26 = 260 kg/h, and the water adds none.
2. Water flow: 1 000 × (0.26 − 0.10) / (0.10 − 0) = 1 600 kg/h.
3. Product: 1 000 + 1 600 = 2 600 kg/h.
4. Check: 260 / 2 600 = 10 %.

The water-to-brine ratio is 1.600, so each tonne of brine needs 1.6 t of water.

## FAQ

**What is a mass balance?**
An accounting of mass for a process: input = output + accumulation, with reaction terms added if anything reacts. At steady state without reaction, input equals output for the total and for each component.

**How do I calculate the concentration after mixing two streams?**
Multiply each flow by its concentration, add them, and divide by the total flow. 1 000 kg/h at 10 % plus 500 kg/h at 2 % gives 7.33 %.

**How much water do I need to dilute a solution?**
Water = flow × (C_start − C_target) / C_target. To bring 500 kg of 30 % solution down to 20 %, add 250 kg of water.

**How do I find the temperature when two streams mix?**
Weight each temperature by flow × specific heat. Equal flows of water at 60 °C and 20 °C mix at 40 °C.

**Can I use volume flows instead of mass flows?**
Yes, if all streams have about the same density, as for dilute water solutions. For brines, acids or oils, convert to mass flows first.

**Why is my mixed temperature higher than calculated?**
Some substances release heat when they mix, such as acids, caustic soda and alcohol in water. The simple balance leaves that heat out.

## Related calculators

- [Blending ratio](../blending-ratio/index.html) — two liquids to a target property, including viscosity.
- [Dilution C1V1 = C2V2](../dilution/index.html) — laboratory dilutions and serial dilutions.
- [Chemical dosing](../chemical-dosing/index.html) — feed rate for a dose in mg/L.
- [Specific heat](../specific-heat/index.html) — heat needed to change the temperature.
