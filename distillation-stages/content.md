# Distillation stages calculator (Fenske–Underwood–Gilliland)

**Summary:** Minimum stages (Fenske), minimum reflux (Underwood), theoretical stages at a reflux ratio (Gilliland, Molokanov) and feed stage (Kirkbride) of a binary column.

## Introduction

How many stages does a distillation column need? The Fenske–Underwood–Gilliland shortcut answers in four steps: the minimum stages at total reflux, the minimum reflux ratio, the stages at the reflux you choose, and where to put the feed. Splitting a 50/50 mixture with a relative volatility of 2.5 into 95 % and 5 % products needs 14.4 theoretical stages at 1.3 times the minimum reflux.

This calculator applies the shortcut to a binary column. It uses the Fenske equation, the Underwood equations for any feed condition q, the Gilliland correlation in Molokanov's equation form and the Kirkbride feed-stage equation. It also gives the real tray count for an overall tray efficiency and the product rates. It is for chemical engineers and students making a first estimate before a rigorous simulation.

## Formulas

Minimum stages at total reflux (Fenske):

    N_min = ln[(x_D / (1 − x_D)) × ((1 − x_B) / x_B)] / ln α

Minimum reflux (Underwood), θ between 1 and α:

    α z / (α − θ) + (1 − z) / (1 − θ) = 1 − q
    R_min + 1 = α x_D / (α − θ) + (1 − x_D) / (1 − θ)

Stages at reflux R (Gilliland correlation, Molokanov form):

    X = (R − R_min) / (R + 1),   Y = (N − N_min) / (N + 1)
    Y = 1 − exp[(1 + 54.4 X) / (11 + 117.2 X) × (X − 1) / √X]
    N = (N_min + Y) / (1 − Y)

Feed stage (Kirkbride):

    N_R / N_S = [((1 − z) / z) × (x_B / (1 − x_D))² × B / D]^0.206

- α — relative volatility of the light component to the heavy one
- z, x_D, x_B — light-component mole fractions in the feed, distillate and bottoms
- q — liquid fraction of the feed: 1 saturated liquid, 0 saturated vapour
- R — reflux ratio L/D; N — theoretical stages including the reboiler
- N_R, N_S — stages above and below the feed; B/D = (x_D − z) / (z − x_B)

## Assumptions and limitations

- The relative volatility is constant. Use the geometric mean of the top and bottom values. Strongly non-ideal mixtures and azeotropes need a stage-by-stage method.
- Constant molar overflow is assumed: equal molar heats of vaporisation, so the liquid and vapour flows stay constant in each section.
- Stages are theoretical and include a partial reboiler. A total condenser is not a stage. Real trays are (N − 1) divided by the tray efficiency.
- The Gilliland correlation is a fit to many column designs. Wankat notes it is usually within 7 % but can be 30 % off, so check the design with a rigorous calculation.

## Worked example

A benzene–toluene column takes a saturated liquid feed with 50 % benzene. The distillate must hold 95 % benzene and the bottoms 5 %. The average relative volatility is 2.5, and the reflux is 1.3 times the minimum.

1. Fenske: ln[(0.95 / 0.05) × (0.95 / 0.05)] / ln 2.5 = ln 361 / 0.916 = 6.43 stages at total reflux.
2. Underwood with q = 1: 2.5 × 0.5 / (2.5 − θ) + 0.5 / (1 − θ) = 0 gives θ = 1.4286.
3. R_min + 1 = 2.5 × 0.95 / 1.0714 + 0.05 / (1 − 1.4286) = 2.217 − 0.117 = 2.10, so R_min = 1.10.
4. Reflux: R = 1.3 × 1.10 = 1.43.
5. Gilliland: X = (1.43 − 1.10) / 2.43 = 0.136, and the Molokanov equation gives Y = 0.518.
6. Stages: N = (6.43 + 0.518) / (1 − 0.518) = 14.4, including the reboiler.
7. Kirkbride: the split is symmetric, so N_R = N_S = 7.2. The feed goes onto stage 8 from the top.

With trays of 70 % efficiency, the column needs (14.4 − 1) / 0.7 = 19.2, so 20 real trays.

## FAQ

**What is the Fenske–Underwood–Gilliland method?**
A shortcut design for distillation. Fenske gives the minimum stages, Underwood the minimum reflux, and Gilliland's correlation links the two to the stages at the actual reflux.

**What is relative volatility?**
How much more readily the light component vaporises than the heavy one: α = (y/x) light ÷ (y/x) heavy. The larger it is, the fewer stages are needed.

**What reflux ratio should I use?**
Usually 1.1 to 1.5 times the minimum. Less reflux saves reboiler and condenser energy but needs more stages, and below about 1.05 the stage count rises steeply.

**What is the feed condition q?**
The fraction of the feed that joins the liquid flowing down the column. A saturated liquid has q = 1, a saturated vapour q = 0, and a subcooled liquid more than 1.

**Why are the stages counted with the reboiler?**
A partial reboiler makes vapour in equilibrium with the bottoms liquid, so it acts as one theoretical stage. The column itself needs one stage fewer.

**How accurate is the shortcut method?**
Good enough for screening and a first design. The Gilliland correlation is usually within 7 % of a rigorous calculation, but check the final design with a simulation.

## Related calculators

- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — sizing the condenser and reboiler.
- [Boiler efficiency](../boiler-efficiency/index.html) — the steam that heats the reboiler.
- [Pump power](../pump-power/index.html) — reflux and product pumps.
- [Steam table (IAPWS-IF97)](../steam-table/index.html) — reboiler steam properties.
