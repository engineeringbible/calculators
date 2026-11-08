# EU ETS and FuelEU Maritime calculator

**Summary:** EU ETS allowances and cost with phase-in and voyage scope; FuelEU Maritime GHG intensity against the yearly limit, compliance balance and penalty.

## Introduction

Since 2024 a ship calling at European ports pays twice for its fuel's carbon: through the EU Emissions Trading System, which requires allowances for the CO₂ (and from 2026 also methane and nitrous oxide) emitted on voyages to, from and between EEA ports, and from 2025 through FuelEU Maritime, which caps the well-to-wake greenhouse-gas intensity of the energy used and charges a penalty per tonne of VLSFO-equivalent shortfall. Both use the same voyage scope and the same default emission factors, so one set of fuel figures answers both questions. This calculator takes up to three fossil fuels with their annual tonnage, the share burned inside and to/from the EEA, the reporting year and an allowance price, and returns the attained GHG intensity against the limit, the compliance balance and penalty, the ETS emissions, allowances and cost, and the combined cost per tonne of fuel.

It is for technical and commercial managers budgeting the regulations, charterers splitting costs, and students of maritime decarbonisation policy.

## Formulas

Scope (both regulations):

    scope factor = share_intra-EEA & at berth + 0.5 × share_extra-EEA

FuelEU GHG intensity (Annex I, GWP₁₀₀: CH₄ 25, N₂O 298):

    TtW_i = [(1 − C_slip,i)(Cf_CO2,i + 25 Cf_CH4,i + 298 Cf_N2O,i) + 25 C_slip,i] / LCV_i      [gCO₂e/MJ]
    GHGIE = f_wind × Σ E_i (WtT_i + TtW_i) / Σ E_i,     E_i = M_i × LCV_i
    limit(year) = 91.16 × (1 − r),  r = 2 % (2025), 6 % (2030), 14.5 % (2035), 31 % (2040), 62 % (2045), 80 % (2050)

Compliance balance and penalty (Annex IV):

    CB = (limit − GHGIE) × E_scope                       [gCO₂e]
    penalty = |CB| / (GHGIE × 41 000 MJ/t) × 2 400 EUR × (1 + (N − 1)/10)   when CB < 0

EU ETS:

    CO₂e_i per gram = (1 − C_slip)(Cf_CO2 + 28 Cf_CH4 + 265 Cf_N2O) + 28 C_slip   (CO₂ only before 2026)
    emissions in scope = Σ M_i × CO₂e_i × scope factor
    allowances = emissions × phase-in (40 % for 2024, 70 % for 2025, 100 % from 2026),   cost = allowances × EUA price

Annex II defaults (LCV MJ/g; WtT gCO₂e/MJ; Cf CO₂ g/g; CH₄; N₂O; slip): HFO 0.0405 / 13.5 / 3.114 / 0.00005 / 0.00018; LFO 0.0410 / 13.2 / 3.151; MGO 0.0427 / 14.4 / 3.206; LNG 0.0491 / 18.5 / 2.750 / 0 / 0.00011 with slip 3.1 % (Otto MS), 1.7 % (Otto SS), 0.2 % (Diesel SS), 2.6 % (LBSI); LPG 0.046 / 7.8 / 3.00–3.03; methanol 0.0199 / 31.3 / 1.375.

## Assumptions and limitations

- Fossil fuels only. Biofuels, RFNBO (reward factor 2 until 2033), onshore power, the 2034 RFNBO sub-target and the banking/borrowing arithmetic are not modelled; a surplus is reported as bankable, a deficit as payable.
- The voyage shares are entered per ship, not per voyage; the result is as good as that split.
- LPG and fossil methanol have no default CH₄ and N₂O factors in Annex II yet; they are taken as zero.
- The ETS treats methane slip with the same engine-class percentages as FuelEU, at GWP 28; the actual MRV monitoring plan may use certified values.
- Exemptions and special cases (transhipment ports, outermost regions, small islands, public-service routes, ice-class adjustments) are not applied, and the ETS non-surrender penalty (100 EUR/t plus the allowances) is not included.

## Worked example

A bulk carrier burns 5 000 t of VLSFO and 400 t of MGO in 2025; 30 % of the fuel is used on intra-EEA voyages and in EEA ports, 50 % on voyages to or from non-EEA ports, 20 % elsewhere. No wind assistance, first year of FuelEU, EUA at 70 EUR.

1. Scope factor 0.30 + 0.25 = 0.55. Energy in scope: (5 000 × 0.0410 + 400 × 0.0427) × 10⁶ × 0.55 = 122.1 TJ.
2. Intensities: VLSFO 13.2 + (3.151 + 0.00125 + 0.05364)/0.041 = 91.4; MGO 90.8. Energy-weighted attained intensity 91.3 gCO₂e/MJ against the 2025 limit of 89.34: a deficit of 2.2 %.
3. Compliance balance (89.34 − 91.34) × 122.1 TJ = −245 t CO₂e. Penalty 245 × 10⁶ / (91.34 × 41 000) × 2 400 = 157 100 EUR.
4. ETS: CO₂ = (5 000 × 3.151 + 400 × 3.206) × 0.55 = 9 371 t in scope; 70 % phase-in → 6 559 allowances, 459 200 EUR.
5. Total 616 300 EUR, about 208 EUR per tonne of in-scope fuel, on top of the fuel itself.

The same ship in 2030 (limit 85.69) would owe about 480 000 EUR of FuelEU penalty and surrender 100 % of its CO₂e; switching the main fuel to LNG in a slow-speed Diesel engine (76.1 gCO₂e/MJ) would turn the FuelEU balance into a surplus.

## FAQ

**Why is the intensity the same whatever the tonnage?**
GHG intensity is per megajoule; the tonnage sets the energy and therefore the size of the compliance balance and the penalty, not the intensity.

**How does a blend of fuels count?**
By energy: each fuel's well-to-wake intensity is weighted by its energy (mass × LCV) in scope.

**What exactly is a tonne of VLSFO-equivalent?**
41 000 MJ, the energy content the regulation assigns to a tonne of VLSFO. The penalty converts the deficit in gCO₂e into the energy of compliant fuel that would have fixed it, then charges 2 400 EUR per tonne of that energy.

**Why does the penalty rise in consecutive years?**
Annex IV adds 10 % for each additional consecutive year with a deficit, so the third year in a row costs 1.2 times the formula value.

**Can I pool with other ships?**
Yes: compliance balances of ships under the same or different companies can be pooled if the pool total is positive. This calculator shows the ship-level balance; pooling is an allocation on top.

**How do LNG engine types differ so much?**
Methane slip. An Otto-cycle medium-speed dual-fuel engine slips about 3.1 % of its fuel as methane (GWP 25), a Diesel-cycle slow-speed engine 0.2 %; the difference is 13 gCO₂e/MJ.

**Does the ETS cover the same voyages as FuelEU?**
Yes, the 100 %/50 % voyage scope is the same, and both apply to ships of 5 000 GT and above. The ETS phases in over 2024–2026 and adds CH₄ and N₂O from 2026; FuelEU applies from 2025 in full.

**Where does the allowance price come from?**
The market; enter the price you budget. Free allocation does not exist for shipping.

## Related calculators

- [CII rating estimator](../cii-rating/index.html) — the IMO operational carbon intensity of the same fuel.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — the fuel tonnage per voyage.
- [Generator load, kVA and fuel](../generator-load/index.html) — the auxiliary share of the fuel.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — the tonnes actually received.
