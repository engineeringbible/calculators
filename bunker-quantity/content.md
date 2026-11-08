# Bunker quantity and density correction calculator

**Summary:** Bunker mass in vacuo and in air from sounded volume, temperature and density at 15 °C (Table 54B VCF), with energy content, cost and BDN comparison.

## Introduction

Bunkers are bought by mass but measured by volume, and the volume of a fuel oil changes by about 0.07 % per degree Celsius. Converting a sounding to tonnes therefore needs the fuel temperature, the density at the 15 °C reference, the volume correction factor from the petroleum measurement tables, and the small correction from mass in vacuo to mass in air that commercial transactions use. This calculator performs that chain with the Table 54B generating equation, so it reproduces the printed tables without carrying them, and adds the energy content, the equivalent tonnes of reference fuel for consumption comparisons, the cost and the difference against the bunker delivery note.

It is for chief engineers checking a delivery, superintendents reviewing bunker disputes, charterers reconciling bunkers on delivery and redelivery, and cadets learning why "tonnes" on a BDN need three numbers to verify.

## Formulas

Volume correction factor (ASTM D1250-80 / ISO 91-1 Table 54B, reference 15 °C):

    ΔT  = T − 15
    α   = K₀ / ρ₁₅² + K₁ / ρ₁₅ (+ A)          thermal expansion coefficient at 15 °C, per °C
    VCF = exp[ −α ΔT (1 + 0.8 α ΔT) ]

| Product group | ρ₁₅ range, kg/m³ | K₀ | K₁ | A |
|---|---|---|---|---|
| Gasolines | 610.6–770.35 | 346.4228 | 0.4388 | 0 |
| Transition zone | 770.35–787.52 | 2680.3206 | 0 | −0.00336312 |
| Jet fuels | 787.52–838.31 | 594.5418 | 0 | 0 |
| Fuel oils (MGO, MDO, HFO) | 838.31–1163.5 | 186.9696 | 0.4862 | 0 |

Quantities:

    V₁₅          = V_obs × VCF
    ρ_T          = ρ₁₅ × VCF                       density at the observed temperature
    m_vacuo      = V₁₅ × ρ₁₅
    m_air        = V₁₅ × (ρ₁₅ − 1.1 kg/m³)         commercial mass (ISO 91 / Table 56)
    E            = m_air × LCV
    m_reference  = E / 42.7 MJ/kg                  tonnes of ISO reference fuel
    Cost         = price × m_air
    BDN diff     = m_air − m_BDN

- ρ₁₅ — density at 15 °C in vacuo (BDN); if the BDN states density in air, ρ_vacuo = ρ_air + 1.1 kg/m³
- V_obs — volume from the tank tables at the observed temperature, corrected for trim and heel
- LCV — lower calorific value, from the fuel analysis

## Assumptions and limitations

- The 1980 Table 54B relation is used. The 2004 edition (ASTM D1250-04 / API 11.1-2004) restructured the calculation and differs by up to about ±0.0002 in VCF for fuel oils; the printed 1980 tables round VCF to four decimals.
- Product group follows from the density; all marine fuels from MGO to RMK fall in the fuel-oil group. Densities outside the table range are rejected.
- The observed volume must already be the true volume in the tank: sounding or ullage converted with the ship's tank tables including trim and heel corrections, with free water and sediment deducted. This calculator does none of that.
- One bulk temperature per parcel. Stratified tanks need several readings; HFO near its pour point can give false soundings.
- Mass in air uses the fixed 1.1 kg/m³ buoyancy convention of ISO 91; exact buoyancy depends slightly on density and ambient air but the difference is negligible for bunkers.
- LCV is not a BDN requirement; use the analysis certificate. Energy and reference-fuel outputs are only as good as that value.
- No sulphur, water-content, flash-point or compatibility checks; those belong to the fuel analysis.

## Worked example

Delivery of residual fuel: tank tables give 500.0 m³ at 45 °C; the BDN states 985.0 kg/m³ at 15 °C in vacuo, LCV 40.5 MJ/kg, price 550 $/t, BDN quantity 490.0 t.

1. Group: fuel oils. α = 186.9696/985² + 0.4862/985 = 1.927 × 10⁻⁴ + 4.936 × 10⁻⁴ = 6.863 × 10⁻⁴ per °C.
2. ΔT = 30 °C: VCF = exp[−6.863 × 10⁻⁴ × 30 × (1 + 0.8 × 6.863 × 10⁻⁴ × 30)] = exp(−0.02093) = 0.9793.
3. Volume at 15 °C: 500.0 × 0.9793 = 489.7 m³. Density at 45 °C: 985 × 0.9793 = 964.6 kg/m³.
4. Mass in vacuo: 489.7 × 0.985 = 482.3 t. Mass in air: 489.7 × 0.9839 = 481.8 t.
5. Energy: 481.8 × 40.5 = 19 513 GJ, equivalent to 457.0 t of 42.7 MJ/kg reference fuel.
6. Cost: 481.8 × 550 = 265 000 $. Against the BDN: 481.8 − 490.0 = −8.2 t (−1.7 %), beyond the usual ±0.5 % tolerance, so the temperatures, densities and soundings should be documented and a letter of protest considered.

Had the fuel been at 55 °C instead, the VCF would be 0.9724 and the mass 478.4 t: a 10 °C temperature error is worth 3.4 t on this parcel.

## FAQ

**Why do I need both density and temperature?**
Density converts volume to mass, but it is only quoted at 15 °C. The fuel in the tank is hotter and less dense, so the measured volume must be reduced to 15 °C with the VCF before multiplying by the BDN density.

**Mass in air or in vacuo?**
Commercial quantities (BDN, bills of lading, charter-party bunkers) are in air. Density is determined in vacuo in the laboratory and the 1.1 kg/m³ correction bridges the two. The difference is about 0.11 %.

**The barge says 50 °C and my thermometer says 44 °C. Does it matter?**
Yes: 6 °C is about 0.4 % of mass, 2 t on a 500 t stem. Take your own temperatures at several levels and record them.

**Which table do surveyors use?**
Marine bunkering almost universally uses Table 54B (metric, 15 °C). Table 54A is for crude oil and Table 54D for lubricating oils; the 2004 edition is gaining ground but gives nearly identical results for fuel oils.

**What is the reference-fuel equivalent for?**
Engine SFOC and consumption curves are stated for a reference fuel of 42.7 MJ/kg. A low-calorific HFO burns more tonnes for the same energy; the equivalent tonnes let you compare consumption like for like.

**What tolerance is normal between BDN and ship figures?**
About ±0.5 % is accepted measurement uncertainty. Larger shortfalls are commonly protested; the cappuccino effect (aerated fuel), wrong temperatures and wrong densities are the usual causes.

**Can I use this for LNG or methanol?**
No. LNG is measured in a completely different way (custody transfer measurement system) and methanol is outside the Table 54B density range.

## Related calculators

- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — how far the parcel takes the ship.
- [Draft survey](../draft-survey/index.html) — bunkers as deductibles in the cargo survey.
- [CII rating estimator](../cii-rating/index.html) — annual fuel masses feed the carbon intensity.
- [Engineering unit converter](../unit-converter/index.html) — kg/m³, long tons, Btu/lb.
