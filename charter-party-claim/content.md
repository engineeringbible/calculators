# Charter party performance claim calculator

**Summary:** Time lost and over-consumption against the warranted speed and consumption by the good-weather method, with the "about" allowances and the claim value.

## Introduction

A time charter usually warrants that the ship can make about so many knots on about so many tonnes of fuel a day in good weather. When the ship falls short, the charterers claim the hire for the time lost and the cost of the extra fuel. English law measures the shortfall by the good-weather method: the ship's speed and consumption on the good-weather days of a passage are taken as its capability, and that capability is extrapolated to the whole passage and compared with the warranty. This calculator applies the method with the customary "about" allowances, credits any fuel saved or time gained against the losses, and values the claim at the hire rate and bunker price.

It is for charterers and owners checking a performance claim, superintendents preparing the owners' answer, and performance analysts who want the arithmetic behind a weather routing company's report.

## Formulas

    Good-weather speed:        V_gw = D_gw / T_gw − current
    Good-weather consumption:  C_gw = F_gw / (T_gw / 24)
    Allowed performance:       V_al = V_w − a_V,   C_al = C_w (1 + a_C)
    Passage times:             T_gw = D / V_gw,    T_al = D / V_al
    Time lost:                 T_gw − T_al
    Over-consumption:          C_gw T_gw / 24 − C_al T_al / 24
    Credits (gains):           time below D / (V_w + a_V),  fuel below C_w (1 − a_C) T_al / 24
    Claim:                     time lost / 24 × hire + over-consumption × bunker price   (not below zero)

- D — total distance of the passage; D_gw, T_gw, F_gw — distance, steaming time and fuel in good weather; a_V, a_C — "about" allowances on speed (knots) and consumption (fraction).

## Assumptions and limitations

- Good weather as the charter party defines it, typically up to Beaufort 4 and Douglas sea state 3; the good-weather performance is extrapolated to the whole passage (The Didymi, The Gas Enterprise, The Ocean Virgo).
- The basic formula includes the fuel burned during the time lost; other formulas have been advocated (London Arbitration 12/14).
- "About" means 0.5 knot and 5 %, both applied under a double "about" (The Al Bida, London Arbitration 15/07); set the allowances to zero for "without about" or an average-speed warranty.
- Gains are set off against losses (The Ioanna): fuel saved is measured from the lower end of the "about" range (The Gaz Energy (No 2)) and time gained from the upper end of the speed range.
- Currents are corrected only when entered; whether they should be when the charter party is silent is unsettled.
- Excluded periods, off-hire, interest and the evidence are for the charter party and the tribunal.

## Worked example

A ship is warranted at about 14 knots on about 30 t/day. In good weather it sailed 1200 nmi in 90 h and burned 120 t; the passage was 5000 nmi; hire is 15 000 per day and fuel costs 600 per tonne.

1. Good-weather performance: 1200 / 90 = 13.33 kn on 120 / 3.75 = 32.0 t/day.
2. Allowed performance: 14 − 0.5 = 13.5 kn on 30 × 1.05 = 31.5 t/day.
3. Passage at the good-weather performance: 5000 / 13.33 = 375 h and 32 × 375 / 24 = 500 t. At the allowed performance: 370.37 h and 31.5 × 370.37 / 24 = 486.11 t.
4. Time lost 4.63 h, worth 4.63 / 24 × 15 000 = 2894; over-consumption 13.89 t, worth 8333. The claim is 11 227.

## FAQ

**What counts as good weather?**
Whatever the charter party says. A common definition is wind up to Beaufort force 4 (5 for some tankers) and Douglas sea state up to 3. Periods shorter than a full day can be used if they are representative (The Ocean Virgo).

**Why extrapolate to the whole passage when most of it was in bad weather?**
A ship that underperforms by half a knot in good weather is taken to underperform by about as much in bad weather. The method compares two hypothetical good-weather passages, the warranted one and the actual one, and the courts have accepted it as the best practical measure of the loss.

**Does "about" apply to both speed and consumption?**
When both figures are qualified ("double about"), tribunals have for many years allowed the full margin on each. The margin is for the tribunal, so it is an input here.

**Can the owners set fuel saved against time lost?**
Yes, in a claim for damages (The Ioanna). The saving is measured from the lower end of the "about" range, so the owners earn credit only for burning less than 95 % of the warranted figure.

**Why is the over-consumption more than the excess daily rate times the days?**
A slower ship spends more days at sea and burns fuel on each of them. The basic formula compares the fuel for the whole passage at each performance, so that fuel is included.

**Should the speed be corrected for current?**
Check the charter party first. When it is silent, arbitrators have decided both ways (London Arbitrations 21/04 and 15/05); the better view is that currents should be taken into account.

## Related calculators

- [Speed–power curve fit](../speed-power-fit/index.html) — the ship's performance against its sea-trial curve.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — fuel and cost for a passage.
- [Optimal speed under charter](../optimal-speed-charter/index.html) — the speed that balances hire and fuel.
- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — checking the good-weather limits.
