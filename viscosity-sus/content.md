# cSt to SSU viscosity converter (Saybolt seconds)

**Summary:** Convert kinematic viscosity between centistokes and Saybolt Universal Seconds (SUS, SSU) by ASTM D2161, with dynamic viscosity in centipoise.

## Introduction

Older oil data sheets, pump curves and hydraulic manuals give viscosity in Saybolt Universal Seconds (SUS or SSU), the time 60 mL of oil took to run through a standard orifice. Modern specifications use centistokes (cSt, the same as mm²/s). The two are not proportional at low viscosity, so a simple factor does not work: 20 cSt is 97.8 SUS, but 2 cSt is not a tenth of that.

This calculator converts in both directions with the official ASTM D2161 equation at 100 °F, corrects for other test temperatures, and gives the dynamic viscosity in centipoise for a given density. For heavy oils it also gives the Saybolt Furol seconds at 122 °F. It is for engineers working with lubricants, fuels, hydraulic fluids and pump selection.

## Formulas

Saybolt Universal seconds at 100 °F from kinematic viscosity ν in cSt (ASTM D2161):

    SUS = 4.6324 ν + (1.0 + 0.03264 ν) / ((3930.2 + 262.7 ν + 23.97 ν² + 1.646 ν³) × 10⁻⁵)

At another test temperature t in °F:

    SUS_t = SUS_100 × (1 + 0.000061 (t − 100))

Saybolt Furol seconds at 122 °F, and dynamic viscosity:

    SFS = 0.4717 ν + 13 924 / (ν² − 72.59 ν + 6 816)
    μ (cP) = ν (cSt) × ρ (g/cm³)

- ν — kinematic viscosity at the test temperature, mm²/s (cSt)
- Above 75 cSt the relation is linear: SUS = 4.632 × cSt at 100 °F

## Assumptions and limitations

- The equation is the one ASTM D2161 gives for computer conversion, fitted to the original experimental data. It applies from 32 SUS (about 1.8 cSt) upward.
- The kinematic viscosity must be at the same temperature as the Saybolt time. Viscosity itself changes strongly with temperature; this page converts units, it does not correct a viscosity to another temperature.
- Saybolt Furol seconds apply to heavy oils, roughly above 25 SFS. Below that the Universal scale is used.
- Dynamic viscosity needs the density at the same temperature.

## Worked example

A hydraulic oil has a kinematic viscosity of 20 cSt at 100 °F and a density of 870 kg/m³. What is it in Saybolt seconds and in centipoise?

1. Linear term: 4.6324 × 20 = 92.65.
2. Correction term: (1.0 + 0.03264 × 20) / ((3930.2 + 5254 + 9588 + 13168) × 10⁻⁵) = 1.6528 / 0.3194 = 5.17.
3. Saybolt Universal seconds: 92.65 + 5.17 = 97.82.
4. Dynamic viscosity: 20 × 0.870 = 17.40 cP.

ASTM D2161's table lists 97.8 SUS for 20.00 cSt at 100 °F.

## Common mistakes

- **Multiplying by 4.632 below 75 cSt.** The linear factor only holds for thicker oils. At 5 cSt the ASTM equation gives 42.4 SUS at 100 °F, close to twice the 23 SUS the factor gives.
- **Treating cSt and cP as the same number.** Centistokes are kinematic viscosity and centipoise dynamic viscosity; they differ by the density in g/cm³. 20 cSt of an oil at 870 kg/m³ is 17.4 cP, so check which one a pump or pipe-flow formula asks for.
- **Expecting the temperature correction to change the oil's viscosity.** The ASTM correction covers only the instrument: 20 cSt is 97.8 SUS at 100 °F and 98.5 SUS at 210 °F. The oil itself thins several times over between those temperatures, so a SUS value at 210 °F needs the cSt measured at 210 °F.
- **Comparing 40 °C grades with 100 °F grades.** ISO grades are defined at 40 °C and most old SUS grades at 100 °F (37.8 °C). An oil sold as 150 SUS at 100 °F is 31.9 cSt at 100 °F and a little thinner at 40 °C, so it is close to ISO VG 32 but not the same.
- **Reading heavy fuel oil in Universal seconds.** Above about 1 000 SUS the larger Furol orifice was used. 460 cSt at 122 °F is 2 134 SUS but 217 SFS, so check which scale an old specification meant.

## FAQ

**How do I convert cSt to SSU?**
Use the ASTM D2161 equation above. Above 75 cSt you can simply multiply by 4.632 at 100 °F.

**Is SSU the same as SUS?**
Yes. Both mean Saybolt Seconds Universal, the same measurement written two ways.

**Why is the conversion not a simple factor?**
At low viscosity the time through the orifice includes a fixed part from the oil's kinetic energy, so short times do not scale with viscosity.

**What is the difference between cSt and cP?**
Centistokes measure kinematic viscosity; centipoise measure dynamic viscosity. Multiply cSt by the density in g/cm³ to get cP.

**What is Saybolt Furol?**
A larger orifice used for heavy fuel and residual oils, giving times about a tenth of the Universal seconds.

**What viscosity is ISO VG 32 in SUS?**
ISO VG 32 is 32 cSt at 40 °C. At that temperature it is about 150 SUS by this equation.

## Related calculators

- [Unit converter](../unit-converter/index.html) — other viscosity and fluid units.
- [Reynolds number](../reynolds-number/index.html) — flow regime from the viscosity.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — friction losses of oil lines.
- [Pump power](../pump-power/index.html) — viscous oils lower pump efficiency.
