# Blending ratio calculator (two liquids to a target property)

**Summary:** Fractions and volumes of two liquids to blend to a target concentration, density, sulphur content or viscosity (Refutas), by mass or by volume.

## Introduction

How much of each liquid do you need to reach a target? For a property that blends linearly, the fraction of liquid A is (target − B) / (A − B). Sulphur and concentration in % w/w blend by mass. Density and % v/v blend by volume. Viscosity does not blend linearly at all. It is first turned into a blending number, such as the Refutas index, which does blend by mass. Blending ISO VG 100 and VG 32 oils to VG 68 takes 69 % of the VG 100 by mass, not the 53 % a straight line between 32 and 100 suggests.

This calculator gives the mass and volume fractions of two liquids that reach a target, and the volume and mass of each for a batch. It handles mass-linear properties, volume-linear properties and kinematic viscosity by the Refutas method. It is for process, fuel and lubricant engineers, and for anyone mixing two stocks to a specification.

## Formulas

Fraction of liquid A for a linear property, on its blending basis:

    f_A = (P_target − P_B) / (P_A − P_B)

Refutas viscosity blending number, blended by mass fraction:

    VBN = 14.534 × ln(ln(ν + 0.8)) + 10.975
    w_A = (VBN_target − VBN_B) / (VBN_A − VBN_B)
    ν = exp(exp((VBN − 10.975) / 14.534)) − 0.8

Mass and volume fractions, with additive volumes:

    φ_A = (w_A / ρ_A) / (w_A / ρ_A + w_B / ρ_B)
    ρ_blend = φ_A ρ_A + φ_B ρ_B

- P — property value; f_A — fraction of A by mass or by volume
- ν — kinematic viscosity in cSt, all at the same temperature
- w — mass fraction; φ — volume fraction; ρ — density

## Assumptions and limitations

- Choose the basis that matches the property. Sulphur, ash and concentration in % w/w blend by mass. Density and % v/v blend by volume.
- Both viscosities and the target must be at the same temperature. The Refutas method is accurate to a few per cent for miscible petroleum oils.
- Volumes are taken as additive. Alcohol and water shrink by up to about 4 % on mixing, so the batch comes out short.
- The calculator does not check compatibility. Some residual and distillate fuels form sludge when mixed, so test before blending different fuel types.

## Worked example

A workshop has ISO VG 100 and ISO VG 32 hydraulic oil, of densities 880 and 860 kg/m³, and wants 1 000 L of VG 68. All viscosities are at 40 °C.

1. Blending numbers: VBN(100 cSt) = 33.196, VBN(32 cSt) = 29.143, VBN(68 cSt) = 31.940.
2. Mass fraction of VG 100: (31.940 − 29.143) / (33.196 − 29.143) = 69.0 %.
3. Volume fraction of VG 100: (0.690 / 880) / (0.690 / 880 + 0.310 / 860) = 68.5 %.
4. Quantities: 685 L of VG 100 and 315 L of VG 32.

A straight-line mix by viscosity would have used only about 530 L of VG 100 and given an oil of about 57 cSt.

## FAQ

**How do I calculate a blending ratio?**
For a linear property, the fraction of A is (target − B) / (A − B). To blend 3.5 % and 0.1 % sulphur fuels to 0.5 %, use 0.4 / 3.4 = 11.8 % of the high-sulphur fuel by mass.

**Why can't I average viscosities?**
Viscosity changes roughly exponentially with composition, so a thin oil lowers the blend's viscosity far more than a straight line predicts. A 50/50 mass blend of 10 and 100 cSt oils is about 26.7 cSt.

**What is the Refutas method?**
A viscosity blending index developed at Shell: VBN = 14.534 ln(ln(ν + 0.8)) + 10.975. The VBN of a blend is the mass-weighted mean of the components' VBN.

**Should I blend by mass or by volume?**
Blend by the basis the property is defined on. Sulphur in % m/m blends by mass. Density blends by volume. The calculator converts between the two with the densities.

**Does density blend linearly?**
By volume, yes, if the volumes add. A 30.5 % by volume blend of 991 and 860 kg/m³ fuels has a density of 900 kg/m³.

**Can I blend more than two components?**
Not on this page. With three or more, the target fixes only one equation, so you must choose the other ratios first.

## Related calculators

- [Mass balance mixing](../mass-balance/index.html) — flow, concentration and temperature of mixed streams.
- [Fuel blending and heating viscosity](../fuel-blend-heating/index.html) — marine fuel blends and injection temperature.
- [Specific gravity](../specific-gravity/index.html) — density, SG and API gravity of the components.
- [cSt to SSU viscosity converter](../viscosity-sus/index.html) — viscosities quoted in Saybolt seconds.
