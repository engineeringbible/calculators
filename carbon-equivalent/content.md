# Carbon equivalent calculator (CE, Pcm, CET) and preheat

**Summary:** Weldability of steel from its composition: IIW carbon equivalent, AWS CE with silicon, Pcm and CET, with the EN 1011-2 minimum preheat temperature.

## Introduction

When steel is welded, the heat-affected zone cools fast and can harden. Hard zones with hydrogen from the weld can crack hours after welding. The carbon equivalent rolls carbon and the alloying elements into one number that measures this hardenability. The S355 plate of the worked example has a CE of 0.44, and at 30 mm thickness it needs about 110 °C of preheat by EN 1011-2.

This calculator gives four carbon equivalents from the mill certificate: the IIW CE, the AWS D1.1 version with silicon, Ito and Bessyo's Pcm, and the CET of EN 1011-2. With the plate thickness, the hydrogen level and the heat input, it also gives the minimum preheat temperature by EN 1011-2 method B. It is for welding engineers, inspectors and fabricators writing or checking a welding procedure.

## Formulas

Carbon equivalents, with element contents in mass %:

    CE(IIW) = C + Mn/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15
    CE(AWS) = C + (Mn + Si)/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15
    Pcm = C + Si/30 + (Mn + Cu + Cr)/20 + Ni/60 + Mo/15 + V/10 + 5 B
    CET = C + (Mn + Mo)/10 + (Cr + Cu)/20 + Ni/40

Minimum preheat, EN 1011-2 Annex C, method B:

    T_p = 697 CET + 160 tanh(d/35) + 62 HD^0.35 + (53 CET − 32) Q − 328    °C

- d — plate thickness, mm (10 to 90)
- HD — diffusible hydrogen of the weld metal, ml/100 g (1 to 20)
- Q — effective heat input, kJ/mm (0.5 to 4.0): arc energy times the thermal efficiency of the process
- The formula holds for CET 0.20 to 0.50 % and C 0.05 to 0.32 %, Mn 0.5 to 1.9 %, Si up to 0.8 %, Cr up to 1.5 %, Cu up to 0.7 %, Mo up to 0.75 %, Ni up to 2.5 %, V up to 0.18 %, Nb up to 0.06 %, Ti up to 0.12 % and B up to 0.005 %

## Assumptions and limitations

- The composition comes from the mill certificate. An element left at zero counts as absent, which understates the result if it is actually there.
- CE(IIW) suits carbon and carbon-manganese steels. Pcm was derived for low-carbon, low-alloy steels such as modern pipeline grades, where CE(IIW) is less reliable.
- The preheat is the minimum to avoid hydrogen cracking. Restraint, hardness limits and the governing code may require more, and the calculator refuses inputs outside the validity range of the formula.
- Heat input Q must already include the thermal efficiency of the process. EN 1011-1 gives the efficiency factors.

## Worked example

An S355 plate 30 mm thick has C 0.18, Mn 1.40, Si 0.30, Cr 0.05, Mo 0.02, V 0.01, Ni 0.05 and Cu 0.10 %. It is welded with consumables of HD 5 ml/100 g at an effective heat input of 1.0 kJ/mm.

1. CE(IIW) = 0.18 + 0.2333 + 0.016 + 0.010 = 0.439.
2. CE(AWS) adds 0.30/6 = 0.05: 0.489.
3. Pcm = 0.18 + 0.010 + 0.0775 + 0.0008 + 0.0013 + 0.001 = 0.271.
4. CET = 0.18 + 0.142 + 0.0075 + 0.0013 = 0.331.
5. Preheat: 697 × 0.331 + 160 tanh(30/35) + 62 × 5^0.35 + (53 × 0.331 − 32) × 1.0 − 328 = 108 °C.

So this joint needs a preheat of at least 110 °C. Thinner plate, lower-hydrogen consumables or a higher heat input would lower it.

## FAQ

**What is the carbon equivalent of steel?**
A single number that weighs carbon and the alloying elements by their effect on hardenability. The higher it is, the more the heat-affected zone hardens and the greater the risk of cold cracking.

**Which carbon equivalent formula should I use?**
The one your code names. EN 1011-2 uses CE or CET, AWS D1.1 uses CE with silicon or Pcm, and pipeline specifications often give a limit on Pcm.

**What CE value needs preheat?**
There is no single limit, because thickness, hydrogen and heat input matter as much. Use a method such as EN 1011-2, which combines all of them.

**What is diffusible hydrogen HD?**
The hydrogen that the weld metal releases after welding, in ml per 100 g of deposited metal. Consumables are classified by it: H5 means at most 5 ml/100 g, H10 at most 10.

**Why does a higher heat input lower the preheat?**
More heat slows the cooling of the joint. The heat-affected zone hardens less and hydrogen has more time to escape.

**Can I use these formulas for stainless steel?**
No. Austenitic stainless steels do not harden this way, and their weldability is judged by other means such as the ferrite content.

## Related calculators

- [Fillet weld strength](../fillet-weld/index.html) — throat and strength of the weld itself.
- [Hardness conversion](../hardness-conversion/index.html) — heat-affected-zone hardness in other scales.
- [Material properties](../material-properties/index.html) — strength of structural steels.
- [Weld fatigue damage](../weld-fatigue/index.html) — fatigue life of welded details.
